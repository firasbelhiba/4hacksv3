import { Job } from 'bull';
import { PrismaService } from '@/database/prisma.service';
import { TogetherAIService } from '../services/together-ai.service';
import { GitHubService } from '../services/github.service';
export interface HederaJobData {
    reportId: string;
    projectId: string;
    githubUrl: string;
}
export declare class HederaProcessor {
    private prisma;
    private togetherAI;
    private github;
    private readonly logger;
    constructor(prisma: PrismaService, togetherAI: TogetherAIService, github: GitHubService);
    processHederaAnalysis(job: Job<HederaJobData>): Promise<void>;
    private createAnalysisPrompt;
}
