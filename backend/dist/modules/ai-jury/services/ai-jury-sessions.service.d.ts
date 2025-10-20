import { PrismaService } from '@/database/prisma.service';
export declare class AIJurySessionsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getSession(hackathonId: string, userId: string): Promise<{
        layerResults: Record<number, any[]>;
        ai_jury_layer_results: {
            id: string;
            projectId: string;
            score: number | null;
            evidence: import("@prisma/client/runtime/library").JsonValue;
            layer: number;
            sessionId: string;
            eliminated: boolean;
            reason: string | null;
            processedAt: Date;
        }[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        hackathonId: string;
        status: import(".prisma/client").$Enums.JurySessionStatus;
        eligibilityCriteria: import("@prisma/client/runtime/library").JsonValue;
        totalProjects: number;
        currentLayer: number;
        totalLayers: number;
        finalResults: import("@prisma/client/runtime/library").JsonValue;
        eliminatedProjects: number;
    }>;
    createSession(hackathonId: string, userId: string, eligibilityCriteria?: any): Promise<{
        hackathon: {
            name: string;
            _count: {
                tracks: number;
                projects: number;
            };
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        hackathonId: string;
        status: import(".prisma/client").$Enums.JurySessionStatus;
        eligibilityCriteria: import("@prisma/client/runtime/library").JsonValue;
        totalProjects: number;
        currentLayer: number;
        totalLayers: number;
        layerResults: import("@prisma/client/runtime/library").JsonValue;
        finalResults: import("@prisma/client/runtime/library").JsonValue;
        eliminatedProjects: number;
    }>;
    getProgress(sessionId: string, userId: string): Promise<{
        sessionId: string;
        status: import(".prisma/client").$Enums.JurySessionStatus;
        currentLayer: number;
        totalLayers: number;
        totalProjects: number;
        eliminatedProjects: number;
        layerProgress: Record<number, {
            total: number;
            processed: number;
            eliminated: number;
        }>;
    }>;
    getResults(sessionId: string, userId: string): Promise<{
        sessionId: string;
        status: "COMPLETED";
        finalResults: import("@prisma/client/runtime/library").JsonValue;
        layerResults: import("@prisma/client/runtime/library").JsonValue;
    }>;
    resetSession(sessionId: string, userId: string): Promise<{
        message: string;
    }>;
}
