import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '@/database/prisma.service';
import { TogetherAIService } from '@/modules/ai-agents/services/together-ai.service';
import { GitHubService } from '@/modules/ai-agents/services/github.service';

export interface CodeQualityJobData {
  reportId: string;
  projectId: string;
  githubUrl: string;
}

@Processor('code-quality')
export class CodeQualityProcessor {
  private readonly logger = new Logger(CodeQualityProcessor.name);

  constructor(
    private prisma: PrismaService,
    private togetherAI: TogetherAIService,
    private github: GitHubService,
  ) {}

  @Process()
  async processCodeQualityAnalysis(job: Job<CodeQualityJobData>) {
    const { reportId, projectId, githubUrl } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing code quality analysis for report ${reportId}`);

    try {
      // Validate GitHub URL before starting
      if (!githubUrl || githubUrl === 'https://github.com' || !githubUrl.includes('github.com/')) {
        throw new Error('This project does not have a valid GitHub repository URL. Please add a valid GitHub URL to the project (e.g., https://github.com/owner/repo) before running code quality analysis.');
      }

      // Update status to IN_PROGRESS
      await this.prisma.code_quality_reports.update({
        where: { id: reportId },
        data: {
          status: 'IN_PROGRESS',
          analysisStartedAt: new Date(),
          currentStage: 'Fetching repository',
          progress: 10,
        },
      });

      // Step 1: Fetch GitHub repository data
      this.logger.log(`Fetching files from ${githubUrl}`);
      const files = await this.github.getRepositoryFiles(githubUrl, { maxFiles: 50 });
      const readme = await this.github.getReadme(githubUrl);

      await this.prisma.code_quality_reports.update({
        where: { id: reportId },
        data: {
          currentStage: 'Analyzing code structure',
          progress: 30,
          totalFiles: files.length,
          processedFiles: 0,
        },
      });

      // Step 2: Analyze repository structure
      const packageFiles = files.filter(f =>
        f.name === 'package.json' ||
        f.name === 'requirements.txt' ||
        f.name === 'Cargo.toml' ||
        f.name === 'pom.xml'
      );

      const configFiles = files.filter(f =>
        f.name.includes('config') ||
        f.name === '.eslintrc' ||
        f.name === 'tsconfig.json' ||
        f.name.startsWith('.')
      );

      // Step 3: Create analysis prompt
      const analysisPrompt = this.createAnalysisPrompt(files, readme, packageFiles);

      await this.prisma.code_quality_reports.update({
        where: { id: reportId },
        data: {
          currentStage: 'Running AI analysis',
          progress: 50,
        },
      });

      // Step 4: Get AI analysis
      const systemPrompt = `You are an expert code quality analyst. Analyze the provided repository and return a detailed quality assessment in JSON format.

Required JSON structure:
{
  "overallScore": number (0-100),
  "technicalScore": number (0-100),
  "securityScore": number (0-100),
  "documentationScore": number (0-100),
  "performanceScore": number (0-100),
  "richnessScore": number (0-100),
  "codeSmellsCount": number,
  "bugsCount": number,
  "vulnerabilitiesCount": number,
  "duplicatedLinesCount": number,
  "totalLinesAnalyzed": number,
  "strengths": string[],
  "improvements": string[],
  "recommendations": string[],
  "architecturalPatterns": string[],
  "frameworkUtilization": object,
  "scoreJustifications": object
}

Be thorough, specific, and provide actionable insights.`;

      const aiResponse = await this.togetherAI.chat(analysisPrompt, systemPrompt);

      await this.prisma.code_quality_reports.update({
        where: { id: reportId },
        data: {
          currentStage: 'Processing results',
          progress: 80,
        },
      });

      // Step 5: Parse AI response
      const analysis = this.togetherAI.extractAndParseJSON(aiResponse);

      // Step 5.5: Validate and clean recommendations
      const validRecommendations = (analysis.recommendations || [])
        .filter(rec => rec && (rec.description || rec.category))
        .map(rec => ({
          priority: rec.priority || 'medium',
          category: rec.category || 'General',
          description: rec.description || 'No description provided',
          impact: rec.impact || 'Improves code quality',
        }));

      // Step 6: Calculate final metrics
      const totalLines = files.reduce((sum, f) => sum + (f.content?.split('\n').length || 0), 0);

      // Step 7: Update report with results
      const endTime = Date.now();
      await this.prisma.code_quality_reports.update({
        where: { id: reportId },
        data: {
          status: 'COMPLETED',
          overallScore: analysis.overallScore || 0,
          technicalScore: analysis.technicalScore || 0,
          securityScore: analysis.securityScore || 0,
          documentationScore: analysis.documentationScore || 0,
          performanceScore: analysis.performanceScore || 0,
          richnessScore: analysis.richnessScore || 0,
          codeSmellsCount: analysis.codeSmellsCount || 0,
          bugsCount: analysis.bugsCount || 0,
          vulnerabilitiesCount: analysis.vulnerabilitiesCount || 0,
          duplicatedLinesCount: analysis.duplicatedLinesCount || 0,
          totalLinesAnalyzed: totalLines,
          strengths: analysis.strengths || [],
          improvements: analysis.improvements || [],
          recommendations: validRecommendations,
          fileAnalysis: analysis.fileAnalysis || { files: [], summary: { totalFiles: files.length, totalLines: totalLines, codeSmellsCount: 0, bugsCount: 0, vulnerabilitiesCount: 0 } },
          scoreEvidence: analysis.scoreEvidence || {},
          architecturalPatterns: analysis.architecturalPatterns || [],
          frameworkUtilization: analysis.frameworkUtilization || {},
          scoreJustifications: analysis.scoreJustifications || {},
          structuralComplexity: analysis.structuralComplexity || {},
          repositoryStructure: {
            totalFiles: files.length,
            fileTypes: this.categorizeFiles(files),
            packageFiles: packageFiles.map(f => f.name),
            configFiles: configFiles.map(f => f.name),
          },
          packageAnalysis: this.analyzePackages(packageFiles),
          configurationAnalysis: configFiles.length > 0 ? { hasConfig: true, files: configFiles.map(f => f.name) } : {},
          analysisCompletedAt: new Date(),
          analysisTimeMs: endTime - startTime,
          aiModel: 'together-ai',
          currentStage: 'Completed',
          progress: 100,
          processedFiles: files.length,
        },
      });

      this.logger.log(`Code quality analysis completed for report ${reportId} in ${endTime - startTime}ms`);
    } catch (error) {
      this.logger.error(`Code quality analysis failed for report ${reportId}:`, error);

      await this.prisma.code_quality_reports.update({
        where: { id: reportId },
        data: {
          status: 'FAILED',
          errorMessage: error.message || 'Unknown error occurred',
          analysisCompletedAt: new Date(),
          analysisTimeMs: Date.now() - startTime,
          currentStage: 'Failed',
        },
      });

      throw error;
    }
  }

  private createAnalysisPrompt(files: any[], readme: string | null, packageFiles: any[]): string {
    const fileList = files.slice(0, 20).map(f => `- ${f.path} (${f.size} bytes)`).join('\n');
    const codeSnippets = files
      .filter(f => f.content && f.size < 5000)
      .slice(0, 10)
      .map(f => `\n### ${f.path}\n\`\`\`\n${f.content.substring(0, 1000)}\n\`\`\``)
      .join('\n');

    return `You are an expert code reviewer. Analyze this repository's ACTUAL code and provide specific, detailed insights based on what you observe.

## Repository Overview
${readme ? `README:\n${readme.substring(0, 1000)}` : 'No README available'}

## File Structure (${files.length} files total)
${fileList}

## Package/Dependency Files
${packageFiles.map(f => `${f.name}:\n${f.content?.substring(0, 500)}`).join('\n\n')}

## Actual Code to Review
${codeSnippets}

CRITICAL: Analyze the REAL code above. Reference SPECIFIC files, functions, and patterns you actually see.

For fileAnalysis.files array:
- Analyze at least 5-10 major files from the ${files.length} files shown
- For EACH file provide: filename, path, language, estimated linesOfCode, complexity (1-10), qualityScore (0-100)
- List SPECIFIC issues you find in each file (actual function names, line concerns, etc.)
- Provide evidence arrays with CONCRETE examples from the code

Return a JSON object (no markdown, no code blocks, just JSON). Structure:

{
  "overallScore": <your-calculated-score-0-100>,
  "technicalScore": <your-score>,
  "securityScore": <your-score>,
  "documentationScore": <your-score>,
  "performanceScore": <your-score>,
  "richnessScore": <your-score>,
  "codeSmellsCount": <count-specific-issues>,
  "bugsCount": <count-potential-bugs>,
  "vulnerabilitiesCount": <count-security-issues>,
  "duplicatedLinesCount": <estimate>,
  "strengths": [
    "<specific-strength-from-actual-code>",
    "<another-real-strength>"
  ],
  "improvements": [
    "<specific-improvement-for-this-codebase>",
    "<another-actionable-improvement>"
  ],
  "recommendations": [
    {
      "priority": "<high|medium|low>",
      "category": "<relevant-category>",
      "description": "<specific-actionable-recommendation-based-on-actual-code>",
      "impact": "<measurable-impact-description>"
    }
  ],
  "fileAnalysis": {
    "files": [
      {
        "filename": "<actual-filename-from-repo>",
        "path": "<actual-path>",
        "language": "<detected-language>",
        "linesOfCode": <actual-count>,
        "complexity": <1-10-rating>,
        "qualityScore": <0-100>,
        "richnessScore": <0-100>,
        "issues": {
          "codeSmells": ["<specific-smell-with-function-name>"],
          "bugs": ["<specific-potential-bug>"],
          "vulnerabilities": ["<specific-security-concern>"],
          "suggestions": ["<actionable-suggestion>"]
        },
        "evidence": {
          "complexityEvidence": ["<concrete-example-from-code>"],
          "qualityEvidence": ["<specific-quality-indicator>"],
          "richnessEvidence": ["<feature-or-pattern-observed>"],
          "positiveAspects": ["<good-practice-found>"],
          "negativeAspects": ["<area-needing-work>"]
        },
        "scoreJustification": {
          "complexityReason": "<why-this-complexity-score>",
          "qualityReason": "<why-this-quality-score>",
          "richnessReason": "<why-this-richness-score>",
          "overallReason": "<overall-assessment>"
        }
      }
    ],
    "summary": {
      "totalFiles": ${files.length},
      "totalLines": <estimated-total-lines>,
      "codeSmellsCount": <total-smells-found>,
      "bugsCount": <total-bugs-found>,
      "vulnerabilitiesCount": <total-vulnerabilities>
    }
  },
  "scoreEvidence": {
    "technicalEvidence": ["<concrete-technical-observation>"],
    "securityEvidence": ["<specific-security-practice>"],
    "documentationEvidence": ["<documentation-example>"],
    "performanceEvidence": ["<performance-pattern>"],
    "richnessEvidence": ["<feature-or-capability>"],
    "overallEvidence": ["<general-code-quality-indicator>"]
  },
  "scoreJustifications": {
    "technicalJustification": "<explain-technical-score-based-on-actual-code>",
    "securityJustification": "<explain-security-score>",
    "documentationJustification": "<explain-documentation-score>",
    "performanceJustification": "<explain-performance-score>",
    "richnessJustification": "<explain-richness-score>",
    "overallJustification": "<overall-assessment-summary>"
  },
  "architecturalPatterns": [
    "<actual-pattern-observed-in-code>"
  ],
  "frameworkUtilization": {
    "<actual-framework-name>": "<specific-usage-description>"
  },
  "structuralComplexity": {
    "richnessScore": <CALCULATE based on file count ONLY: <5 files=20, 5-15=40, 15-30=60, 30-50=80, 50+=100>,
    "richnessJustification": "Project contains ${files.length} files. Scoring: <5 files=20/100 (very simple), 5-15=40/100 (basic), 15-30=60/100 (moderate), 30-50=80/100 (good), 50+=100/100 (complex).",
    "totalFiles": ${files.length}
  }
}

REMEMBER: Replace ALL placeholder text with REAL analysis of the actual code shown above. Be specific and reference actual files, functions, and patterns you observe.`;
  }

  private categorizeFiles(files: any[]): Record<string, number> {
    const categories: Record<string, number> = {};

    files.forEach(file => {
      const ext = file.name.split('.').pop() || 'unknown';
      categories[ext] = (categories[ext] || 0) + 1;
    });

    return categories;
  }

  private analyzePackages(packageFiles: any[]): any {
    const packages: any = {};

    packageFiles.forEach(file => {
      if (file.name === 'package.json') {
        try {
          const pkg = JSON.parse(file.content);
          packages.npm = {
            dependencies: Object.keys(pkg.dependencies || {}).length,
            devDependencies: Object.keys(pkg.devDependencies || {}).length,
          };
        } catch (e) {
          this.logger.warn('Failed to parse package.json');
        }
      }
    });

    return packages;
  }
}
