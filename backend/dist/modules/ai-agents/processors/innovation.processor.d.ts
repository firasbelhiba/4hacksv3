import { Job } from 'bull';
import { PrismaService } from '@/database/prisma.service';
import { TogetherAIService } from '../services/together-ai.service';
import { GitHubService } from '../services/github.service';
export interface InnovationJobData {
    reportId: string;
    projectId: string;
    githubUrl: string;
}
export declare class InnovationProcessor {
    private prisma;
    private togetherAI;
    private github;
    private readonly logger;
    constructor(prisma: PrismaService, togetherAI: TogetherAIService, github: GitHubService);
    processInnovationAnalysis(job: Job<InnovationJobData>): Promise<void>;
    private createAnalysisPrompt;
}
