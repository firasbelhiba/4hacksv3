import { PrismaService } from '@/database/prisma.service';
import { GitHubService } from '@/modules/ai-agents/services/github.service';
import { HederaComplexityLevel } from '@prisma/client';
interface HederaDetectionResult {
    detected: boolean;
    confidence: number;
    complexityLevel: HederaComplexityLevel | null;
    detectedTechnologies: string[];
    detectedPatterns: {
        dependencies: string[];
        imports: string[];
        accountIds: string[];
        networkEndpoints: string[];
    };
    evidenceFiles: {
        file: string;
        type: 'dependency' | 'code' | 'config';
        evidence: string[];
    }[];
    summary: string;
}
export declare class HederaService {
    private prisma;
    private githubService;
    private readonly logger;
    private readonly HEDERA_PATTERNS;
    constructor(prisma: PrismaService, githubService: GitHubService);
    detectHederaUsageLevel1(owner: string, repo: string): Promise<HederaDetectionResult>;
    private checkDependencyFiles;
    private checkPackageJson;
    private checkPomXml;
    private checkRequirementsTxt;
    private checkGoMod;
    private searchHederaPatterns;
    private calculateConfidenceAndComplexity;
    private generateSummary;
    analyzeBatch(hackathonId: string, projectIds: string[], userId: string): Promise<{
        processed: number;
        detected: number;
        failed: number;
    }>;
}
export {};
