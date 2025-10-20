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
export declare class CoherenceProcessor {
    private prisma;
    private togetherAI;
    private github;
    private readonly logger;
    constructor(prisma: PrismaService, togetherAI: TogetherAIService, github: GitHubService);
    processCoherenceAnalysis(job: Job<CoherenceJobData>): Promise<void>;
    private createAnalysisPrompt;
}
