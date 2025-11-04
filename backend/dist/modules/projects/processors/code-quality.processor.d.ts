import { Job } from 'bull';
import { PrismaService } from '@/database/prisma.service';
import { TogetherAIService } from '@/modules/ai-agents/services/together-ai.service';
import { GitHubService } from '@/modules/ai-agents/services/github.service';
export interface CodeQualityJobData {
    reportId: string;
    projectId: string;
    githubUrl: string;
}
export declare class CodeQualityProcessor {
    private prisma;
    private togetherAI;
    private github;
    private readonly logger;
    constructor(prisma: PrismaService, togetherAI: TogetherAIService, github: GitHubService);
    processCodeQualityAnalysis(job: Job<CodeQualityJobData>): Promise<void>;
    private createAnalysisPrompt;
    private categorizeFiles;
    private analyzePackages;
}
