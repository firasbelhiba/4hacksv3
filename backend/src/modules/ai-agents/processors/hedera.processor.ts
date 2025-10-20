import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '@/database/prisma.service';
import { TogetherAIService } from '../services/together-ai.service';
import { GitHubService } from '../services/github.service';

export interface HederaJobData {
  reportId: string;
  projectId: string;
  githubUrl: string;
}

@Processor('hedera')
export class HederaProcessor {
  private readonly logger = new Logger(HederaProcessor.name);

  constructor(
    private prisma: PrismaService,
    private togetherAI: TogetherAIService,
    private github: GitHubService,
  ) {}

  @Process()
  async processHederaAnalysis(job: Job<HederaJobData>) {
    const { reportId, projectId, githubUrl } = job.data;

    this.logger.log(`Processing Hedera analysis for report ${reportId}`);

    try {
      // Update status to IN_PROGRESS
      await this.prisma.hedera_analysis_reports.update({
        where: { id: reportId },
        data: {
          status: 'IN_PROGRESS',
          analysisStartedAt: new Date(),
          currentStage: 'Fetching repository data',
          progress: 10,
        },
      });

      // Step 1: Fetch GitHub repository data
      const files = await this.github.getRepositoryFiles(githubUrl, { maxFiles: 30 });
      const readme = await this.github.getReadme(githubUrl);

      // Look for package.json or similar dependency files
      const packageJsonFile = files.find(f => f.path === 'package.json' || f.path.endsWith('/package.json'));
      let packageJsonContent = '';

      if (packageJsonFile) {
        try {
          const repoInfo = this.github.parseGitHubUrl(githubUrl);
          const { Octokit } = await import('@octokit/rest');
          const octokit = new Octokit();
          const { data } = await octokit.repos.getContent({
            owner: repoInfo.owner,
            repo: repoInfo.repo,
            path: packageJsonFile.path,
            ref: repoInfo.branch,
          });

          if ('content' in data) {
            packageJsonContent = Buffer.from(data.content, 'base64').toString('utf-8');
          }
        } catch (error) {
          this.logger.warn(`Could not fetch package.json: ${error.message}`);
        }
      }

      await this.prisma.hedera_analysis_reports.update({
        where: { id: reportId },
        data: {
          currentStage: 'Analyzing Hedera usage',
          progress: 40,
        },
      });

      // Step 2: Analyze with AI
      const analysisPrompt = this.createAnalysisPrompt(readme, packageJsonContent, files);
      const aiResponse = await this.togetherAI.chat(
        analysisPrompt,
        'You are an expert at detecting and analyzing Hedera blockchain technology usage.',
      );

      // Step 3: Parse AI response
      const analysis = this.togetherAI.extractAndParseJSON(aiResponse);

      await this.prisma.hedera_analysis_reports.update({
        where: { id: reportId },
        data: {
          currentStage: 'Finalizing analysis',
          progress: 90,
        },
      });

      // Step 4: Update report with results
      await this.prisma.hedera_analysis_reports.update({
        where: { id: reportId },
        data: {
          status: 'COMPLETED',
          technologyCategory: analysis.technologyCategory || 'NO_BLOCKCHAIN',
          confidence: analysis.confidence || 0,
          detectedTechnologies: analysis.detectedTechnologies || [],
          hederaUsageScore: analysis.hederaUsageScore,
          hederaPresenceDetected: analysis.hederaPresenceDetected || false,
          complexityLevel: analysis.complexityLevel,
          presenceEvidence: analysis.presenceEvidence || [],
          evidenceFiles: analysis.evidenceFiles || [],
          detectedPatterns: analysis.detectedPatterns || {},
          libraryUsage: analysis.libraryUsage || {},
          recommendations: analysis.recommendations || [],
          summary: analysis.summary || 'Analysis completed',
          strengths: analysis.strengths || [],
          improvements: analysis.improvements || [],
          processingTime: Date.now() - job.timestamp,
          agentModel: 'together-ai',
          analysisCompletedAt: new Date(),
          progress: 100,
          currentStage: 'Completed',
        },
      });

      this.logger.log(`Hedera analysis completed for report ${reportId}`);
    } catch (error) {
      this.logger.error(`Hedera analysis failed for report ${reportId}:`, error);

      await this.prisma.hedera_analysis_reports.update({
        where: { id: reportId },
        data: {
          status: 'FAILED',
          summary: `Error: ${error.message}`,
          errorMessage: error.message,
          progress: 0,
          currentStage: 'Failed',
        },
      });

      throw error;
    }
  }

  private createAnalysisPrompt(
    readme: string | null,
    packageJson: string,
    files: any[],
  ): string {
    const fileList = files.map(f => `- ${f.path}`).join('\n');

    return `Analyze this project for Hedera blockchain technology usage.

README:
${readme || 'No README available'}

PACKAGE.JSON (if available):
${packageJson || 'No package.json found'}

PROJECT FILES:
${fileList}

HEDERA TECHNOLOGY PATTERNS TO DETECT:

1. HEDERA SDK USAGE:
   - @hashgraph/sdk (JavaScript/TypeScript)
   - SDK transaction builders and query patterns

2. HASHCONNECT & WALLET INTEGRATION:
   - hashconnect npm package
   - HashConnect wallet connection patterns
   - BladeWallet, HashPack integrations

3. HEDERA SERVICES:
   - Account Services: AccountCreateTransaction, AccountBalanceQuery
   - Token Services (HTS): TokenCreateTransaction, NFT operations
   - Smart Contract Services: ContractCreateTransaction, ContractExecuteTransaction
   - Consensus Services (HCS): TopicCreateTransaction, TopicMessageSubmitTransaction
   - File Services: FileCreateTransaction

4. HEDERA SOLIDITY PATTERNS:
   - IHederaTokenService interface
   - Hedera precompiled contracts (0x167, 0x168, 0x169)

5. MIRROR NODE INTEGRATION:
   - REST API calls to Hedera Mirror Node

Provide a JSON response with:
{
  "technologyCategory": "HEDERA" | "OTHER_BLOCKCHAIN" | "NO_BLOCKCHAIN",
  "confidence": 0-100,
  "detectedTechnologies": ["list of technologies found"],
  "hederaUsageScore": 0-100 (if Hedera detected),
  "hederaPresenceDetected": true/false,
  "complexityLevel": "SIMPLE" | "MODERATE" | "ADVANCED" (if Hedera detected),
  "presenceEvidence": [
    {
      "type": "evidence type",
      "file": "file path",
      "patterns": ["pattern1", "pattern2"],
      "confidence": 0-100,
      "description": "evidence description"
    }
  ],
  "evidenceFiles": [
    {
      "file": "file path",
      "patterns": ["pattern1"],
      "confidence": 0-100
    }
  ],
  "detectedPatterns": {
    "sdkUsage": ["patterns"],
    "smartContracts": ["patterns"],
    "accountServices": ["patterns"],
    "tokenServices": ["patterns"],
    "consensusServices": ["patterns"],
    "fileServices": ["patterns"],
    "mirrorNodeUsage": ["patterns"],
    "hashConnectIntegration": ["patterns"]
  },
  "libraryUsage": {
    "hederaSDK": "version if found",
    "hashConnect": "version if found",
    "otherBlockchainLibs": ["other blockchain libraries"]
  },
  "recommendations": ["improvement suggestions"],
  "summary": "brief analysis summary",
  "strengths": ["project strengths"],
  "improvements": ["areas for improvement"]
}`;
  }
}
