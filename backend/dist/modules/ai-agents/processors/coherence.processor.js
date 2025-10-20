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
var CoherenceProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoherenceProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../database/prisma.service");
const together_ai_service_1 = require("../services/together-ai.service");
const github_service_1 = require("../services/github.service");
let CoherenceProcessor = CoherenceProcessor_1 = class CoherenceProcessor {
    constructor(prisma, togetherAI, github) {
        this.prisma = prisma;
        this.togetherAI = togetherAI;
        this.github = github;
        this.logger = new common_1.Logger(CoherenceProcessor_1.name);
    }
    async processCoherenceAnalysis(job) {
        const { reportId, projectId, githubUrl, trackName, trackDescription } = job.data;
        this.logger.log(`Processing coherence analysis for report ${reportId}`);
        try {
            await this.prisma.coherence_reports.update({
                where: { id: reportId },
                data: { status: 'IN_PROGRESS' },
            });
            const readme = await this.github.getReadme(githubUrl);
            const files = await this.github.getRepositoryFiles(githubUrl, { maxFiles: 15 });
            const analysisPrompt = this.createAnalysisPrompt(readme, files, trackName, trackDescription);
            const aiResponse = await this.togetherAI.chat(analysisPrompt, 'You are an expert at analyzing project coherence and alignment.');
            const analysis = this.togetherAI.extractAndParseJSON(aiResponse);
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
        }
        catch (error) {
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
    createAnalysisPrompt(readme, files, trackName, trackDescription) {
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
};
exports.CoherenceProcessor = CoherenceProcessor;
__decorate([
    (0, bull_1.Process)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CoherenceProcessor.prototype, "processCoherenceAnalysis", null);
exports.CoherenceProcessor = CoherenceProcessor = CoherenceProcessor_1 = __decorate([
    (0, bull_1.Processor)('coherence'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        together_ai_service_1.TogetherAIService,
        github_service_1.GitHubService])
], CoherenceProcessor);
//# sourceMappingURL=coherence.processor.js.map