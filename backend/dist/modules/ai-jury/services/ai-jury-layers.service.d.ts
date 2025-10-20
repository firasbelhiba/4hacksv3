import { PrismaService } from '@/database/prisma.service';
import { GitHubService } from '@/modules/ai-agents/services/github.service';
import { AIJuryProgressService } from './ai-jury-progress.service';
export interface LayerResult {
    projectId: string;
    eliminated: boolean;
    score?: number;
    reason?: string;
    evidence: any;
}
export declare class AIJuryLayersService {
    private prisma;
    private github;
    private progressService;
    private readonly logger;
    constructor(prisma: PrismaService, github: GitHubService, progressService: AIJuryProgressService);
    executeLayer(sessionId: string, layer: number, userId: string): Promise<{
        layer: 1 | 2 | 3 | 4;
        processed: number;
        eliminated: number;
        advanced: number;
        results: LayerResult[];
    }>;
    private executeLayer1Eligibility;
    private executeLayer2Hedera;
    private executeLayer3CodeQuality;
    private executeLayer4FinalAnalysis;
    private updateSessionStatus;
    private generateFinalResults;
}
