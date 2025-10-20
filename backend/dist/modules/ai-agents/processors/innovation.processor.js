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
var InnovationProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InnovationProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../database/prisma.service");
const together_ai_service_1 = require("../services/together-ai.service");
const github_service_1 = require("../services/github.service");
let InnovationProcessor = InnovationProcessor_1 = class InnovationProcessor {
    constructor(prisma, togetherAI, github) {
        this.prisma = prisma;
        this.togetherAI = togetherAI;
        this.github = github;
        this.logger = new common_1.Logger(InnovationProcessor_1.name);
    }
    async processInnovationAnalysis(job) {
        const { reportId, projectId, githubUrl } = job.data;
        this.logger.log(`Processing innovation analysis for report ${reportId}`);
        try {
            await this.prisma.innovation_reports.update({
                where: { id: reportId },
                data: { status: 'IN_PROGRESS' },
            });
            const files = await this.github.getRepositoryFiles(githubUrl, { maxFiles: 20 });
            const readme = await this.github.getReadme(githubUrl);
            const analysisPrompt = this.createAnalysisPrompt(files, readme);
            const aiResponse = await this.togetherAI.chat(analysisPrompt, 'You are an expert innovation analyst.');
            const analysis = this.togetherAI.extractAndParseJSON(aiResponse);
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
        }
        catch (error) {
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
    createAnalysisPrompt(files, readme) {
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
};
exports.InnovationProcessor = InnovationProcessor;
__decorate([
    (0, bull_1.Process)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InnovationProcessor.prototype, "processInnovationAnalysis", null);
exports.InnovationProcessor = InnovationProcessor = InnovationProcessor_1 = __decorate([
    (0, bull_1.Processor)('innovation'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        together_ai_service_1.TogetherAIService,
        github_service_1.GitHubService])
], InnovationProcessor);
//# sourceMappingURL=innovation.processor.js.map