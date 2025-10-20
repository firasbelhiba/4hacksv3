"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var HederaProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HederaProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../database/prisma.service");
const together_ai_service_1 = require("../services/together-ai.service");
const github_service_1 = require("../services/github.service");
let HederaProcessor = HederaProcessor_1 = class HederaProcessor {
    constructor(prisma, togetherAI, github) {
        this.prisma = prisma;
        this.togetherAI = togetherAI;
        this.github = github;
        this.logger = new common_1.Logger(HederaProcessor_1.name);
    }
    async processHederaAnalysis(job) {
        const { reportId, projectId, githubUrl } = job.data;
        this.logger.log(`Processing Hedera analysis for report ${reportId}`);
        try {
            await this.prisma.hedera_analysis_reports.update({
                where: { id: reportId },
                data: {
                    status: 'IN_PROGRESS',
                    analysisStartedAt: new Date(),
                    currentStage: 'Fetching repository data',
                    progress: 10,
                },
            });
            const files = await this.github.getRepositoryFiles(githubUrl, { maxFiles: 30 });
            const readme = await this.github.getReadme(githubUrl);
            const packageJsonFile = files.find(f => f.path === 'package.json' || f.path.endsWith('/package.json'));
            let packageJsonContent = '';
            if (packageJsonFile) {
                try {
                    const repoInfo = this.github.parseGitHubUrl(githubUrl);
                    const { Octokit } = await Promise.resolve().then(() => require('@octokit/rest'));
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
                }
                catch (error) {
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
            const analysisPrompt = this.createAnalysisPrompt(readme, packageJsonContent, files);
            const aiResponse = await this.togetherAI.chat(analysisPrompt, 'You are an expert at detecting and analyzing Hedera blockchain technology usage.');
            const analysis = this.togetherAI.extractAndParseJSON(aiResponse);
            await this.prisma.hedera_analysis_reports.update({
                where: { id: reportId },
                data: {
                    currentStage: 'Finalizing analysis',
                    progress: 90,
                },
            });
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
        }
        catch (error) {
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
    createAnalysisPrompt(readme, packageJson, files) {
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
};
exports.HederaProcessor = HederaProcessor;
__decorate([
    (0, bull_1.Process)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HederaProcessor.prototype, "processHederaAnalysis", null);
exports.HederaProcessor = HederaProcessor = HederaProcessor_1 = __decorate([
    (0, bull_1.Processor)('hedera'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        together_ai_service_1.TogetherAIService,
        github_service_1.GitHubService])
], HederaProcessor);
//# sourceMappingURL=hedera.processor.js.map