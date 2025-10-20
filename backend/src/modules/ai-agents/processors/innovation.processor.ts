import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '@/database/prisma.service';
import { TogetherAIService } from '../services/together-ai.service';
import { GitHubService } from '../services/github.service';

export interface InnovationJobData {
  reportId: string;
  projectId: string;
  githubUrl: string;
}

@Processor('innovation')
export class InnovationProcessor {
  private readonly logger = new Logger(InnovationProcessor.name);

  constructor(
    private prisma: PrismaService,
    private togetherAI: TogetherAIService,
    private github: GitHubService,
  ) {}

  @Process()
  async processInnovationAnalysis(job: Job<InnovationJobData>) {
    const { reportId, projectId, githubUrl } = job.data;

    this.logger.log(`Processing innovation analysis for report ${reportId}`);

    try {
      // Update status to IN_PROGRESS
      await this.prisma.innovation_reports.update({
        where: { id: reportId },
        data: { status: 'IN_PROGRESS' },
      });

      // Step 1: Fetch GitHub repository data
      const files = await this.github.getRepositoryFiles(githubUrl, { maxFiles: 20 });
      const readme = await this.github.getReadme(githubUrl);

      // Step 2: Analyze with AI
      const analysisPrompt = this.createAnalysisPrompt(files, readme);
      const aiResponse = await this.togetherAI.chat(analysisPrompt, 'You are an expert innovation analyst.');

      // Step 3: Parse AI response
      const analysis = this.togetherAI.extractAndParseJSON(aiResponse);

      // Step 4: Update report with results
      await this.prisma.innovation_reports.update({
        where: { id: reportId },
        data: {
          status: 'COMPLETED',
          score: analysis.overallScore || 0,
          summary: analysis.summary || 'Analysis completed',
          noveltyScore: analysis.noveltyScore || 0,
          creativityScore: analysis.creativityScore || 0,
          technicalInnovation: analysis.technicalInnovation || 0,
          marketInnovation: analysis.marketInnovation || 0,
          implementationInnovation: analysis.implementationInnovation || 0,
          similarProjects: analysis.similarProjects || {},
          uniqueAspects: analysis.uniqueAspects || {},
          innovationEvidence: analysis.innovationEvidence || {},
          potentialImpact: analysis.potentialImpact || '',
          patentPotential: analysis.patentPotential || false,
          patentabilityScore: analysis.patentabilityScore,
          suggestions: analysis.suggestions || {},
          agentModel: 'together-ai',
          processingTime: Date.now() - job.timestamp,
        },
      });

      this.logger.log(`Innovation analysis completed for report ${reportId}`);
    } catch (error) {
      this.logger.error(`Innovation analysis failed for report ${reportId}:`, error);

      await this.prisma.innovation_reports.update({
        where: { id: reportId },
        data: {
          status: 'FAILED',
          summary: `Error: ${error.message}`,
        },
      });

      throw error;
    }
  }

  private createAnalysisPrompt(files: any[], readme: string | null): string {
    const fileList = files.map(f => `- ${f.path} (${f.size} bytes)`).join('\n');

    return `Analyze this project for innovation potential:

README:
${readme || 'No README available'}

Repository Files:
${fileList}

Provide a JSON response with:
{
  "overallScore": 0-100,
  "summary": "brief summary",
  "noveltyScore": 0-100,
  "creativityScore": 0-100,
  "technicalInnovation": 0-100,
  "marketInnovation": 0-100,
  "implementationInnovation": 0-100,
  "similarProjects": ["list of similar projects"],
  "uniqueAspects": ["unique features"],
  "innovationEvidence": ["evidence of innovation"],
  "potentialImpact": "description of potential impact",
  "patentPotential": true/false,
  "patentabilityScore": 0-100,
  "suggestions": ["improvement suggestions"]
}`;
  }
}
