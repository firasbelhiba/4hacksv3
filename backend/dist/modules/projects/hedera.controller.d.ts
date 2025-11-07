import { HederaService } from './services/hedera.service';
import { PrismaService } from '@/database/prisma.service';
declare class AnalyzeBatchDto {
    projectIds: string[];
}
export declare class HederaController {
    private readonly hederaService;
    private readonly prisma;
    private readonly logger;
    constructor(hederaService: HederaService, prisma: PrismaService);
    analyzeBatch(hackathonId: string, userId: string, dto: AnalyzeBatchDto): Promise<{
        success: boolean;
        data: {
            queued: number;
            status: string;
        };
        message: string;
    }>;
    getHederaReport(projectId: string, userId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            summary: string | null;
            status: import(".prisma/client").$Enums.ReportStatus;
            projectId: string;
            agentModel: string | null;
            processingTime: number | null;
            progress: number;
            currentStage: string | null;
            analysisStartedAt: Date | null;
            analysisCompletedAt: Date | null;
            errorMessage: string | null;
            repositoryUrl: string;
            technologyCategory: import(".prisma/client").$Enums.TechnologyCategory;
            confidence: number;
            detectedTechnologies: string[];
            hederaUsageScore: number | null;
            hederaPresenceDetected: boolean;
            complexityLevel: import(".prisma/client").$Enums.HederaComplexityLevel | null;
            presenceEvidence: import("@prisma/client/runtime/library").JsonValue;
            evidenceFiles: import("@prisma/client/runtime/library").JsonValue;
            detectedPatterns: import("@prisma/client/runtime/library").JsonValue;
            libraryUsage: import("@prisma/client/runtime/library").JsonValue;
            recommendations: import("@prisma/client/runtime/library").JsonValue;
            strengths: string[];
            improvements: string[];
        };
    }>;
    getAllHederaReports(hackathonId: string, userId: string): Promise<{
        success: boolean;
        data: {
            project: {
                id: string;
                name: string;
                teamName: string;
                githubUrl: string;
            };
            report: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                summary: string | null;
                status: import(".prisma/client").$Enums.ReportStatus;
                projectId: string;
                agentModel: string | null;
                processingTime: number | null;
                progress: number;
                currentStage: string | null;
                analysisStartedAt: Date | null;
                analysisCompletedAt: Date | null;
                errorMessage: string | null;
                repositoryUrl: string;
                technologyCategory: import(".prisma/client").$Enums.TechnologyCategory;
                confidence: number;
                detectedTechnologies: string[];
                hederaUsageScore: number | null;
                hederaPresenceDetected: boolean;
                complexityLevel: import(".prisma/client").$Enums.HederaComplexityLevel | null;
                presenceEvidence: import("@prisma/client/runtime/library").JsonValue;
                evidenceFiles: import("@prisma/client/runtime/library").JsonValue;
                detectedPatterns: import("@prisma/client/runtime/library").JsonValue;
                libraryUsage: import("@prisma/client/runtime/library").JsonValue;
                recommendations: import("@prisma/client/runtime/library").JsonValue;
                strengths: string[];
                improvements: string[];
            };
        }[];
    }>;
}
export {};
