import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '@/database/prisma.service';
import { TogetherAIService } from '../services/together-ai.service';
import { GitHubService } from '../services/github.service';

export interface CoherenceJobData {
  reportId: string;
  projectId: string;
  githubUrl: string;
  trackName: string;
  trackDescription: string;
}

@Processor('coherence')
export class CoherenceProcessor {
  private readonly logger = new Logger(CoherenceProcessor.name);

  constructor(
    private prisma: PrismaService,
    private togetherAI: TogetherAIService,
    private github: GitHubService,
  ) {}

  @Process()
  async processCoherenceAnalysis(job: Job<CoherenceJobData>) {
    const { reportId, projectId, githubUrl, trackName, trackDescription } = job.data;

    this.logger.log(`Processing coherence analysis for report ${reportId}`);

    try {
      // Update status to IN_PROGRESS
      await this.prisma.coherence_reports.update({
        where: { id: reportId },
        data: { status: 'IN_PROGRESS' },
      });

      // Step 1: Fetch GitHub repository data
      const readme = await this.github.getReadme(githubUrl);
      const files = await this.github.getRepositoryFiles(githubUrl, { maxFiles: 15 });

      // Step 2: Analyze with AI
      const analysisPrompt = this.createAnalysisPrompt(
        readme,
        files,
        trackName,
        trackDescription,
      );
      const aiResponse = await this.togetherAI.chat(
        analysisPrompt,
        'You are an expert at analyzing project coherence and alignment.',
      );

      // Step 3: Parse AI response
      const analysis = this.togetherAI.extractAndParseJSON(aiResponse);

      // Step 4: Update report with results
      await this.prisma.coherence_reports.update({
        where: { id: reportId },
        data: {
          status: 'COMPLETED',
          score: analysis.overallScore || 0,
          summary: analysis.summary || 'Analysis completed',
          trackAlignment: analysis.trackAlignment || 0,
          readmeExists: !!readme,
          readmeQuality: analysis.readmeQuality || 0,
          projectPurpose: analysis.projectPurpose || '',
          trackJustification: analysis.trackJustification || '',
          inconsistencies: analysis.inconsistencies || {},
          suggestions: analysis.suggestions || {},
          evidence: analysis.evidence || {},
          agentModel: 'together-ai',
          processingTime: Date.now() - job.timestamp,
        },
      });

      this.logger.log(`Coherence analysis completed for report ${reportId}`);
    } catch (error) {
      this.logger.error(`Coherence analysis failed for report ${reportId}:`, error);

      await this.prisma.coherence_reports.update({
        where: { id: reportId },
        data: {
          status: 'FAILED',
          summary: `Error: ${error.message}`,
        },
      });

      throw error;
    }
  }

  private createAnalysisPrompt(
    readme: string | null,
    files: any[],
    trackName: string,
    trackDescription: string,
  ): string {
    const fileList = files.map(f => `- ${f.path}`).join('\n');

    return `Analyze this project's coherence and alignment with the hackathon track:

HACKATHON TRACK:
Name: ${trackName}
Description: ${trackDescription}

PROJECT README:
${readme || 'No README available'}

PROJECT FILES:
${fileList}

Evaluate:
1. How well does this project align with the track theme and requirements?
2. Is the README clear and comprehensive?
3. Does the project purpose match what's described in the README?
4. Are there any inconsistencies between the README and the code structure?

Provide a JSON response with:
{
  "overallScore": 0-100,
  "summary": "brief coherence summary",
  "trackAlignment": 0-100,
  "readmeQuality": 0-100,
  "projectPurpose": "clear description of what the project does",
  "trackJustification": "explanation of how it fits the track",
  "inconsistencies": ["list of any inconsistencies found"],
  "suggestions": ["improvement suggestions"],
  "evidence": ["evidence supporting the alignment score"]
}`;
  }
}
