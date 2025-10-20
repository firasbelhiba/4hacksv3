import { AIJurySessionsService } from './services/ai-jury-sessions.service';
import { AIJuryLayersService } from './services/ai-jury-layers.service';
import { AIJuryProgressService } from './services/ai-jury-progress.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { ExecuteLayerDto } from './dto/execute-layer.dto';
export declare class AIJuryController {
    private sessionsService;
    private layersService;
    private progressService;
    constructor(sessionsService: AIJurySessionsService, layersService: AIJuryLayersService, progressService: AIJuryProgressService);
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
    createSession(dto: CreateSessionDto, userId: string): Promise<{
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
    getLiveProgress(sessionId: string): Promise<{
        sessionId: string;
        status: string;
        message: string;
    } | {
        layers: Record<number, any>;
        sessionId: string;
        totalProjects: number;
        currentLayer?: number;
        finalResults?: any;
        startTime: number;
        endTime?: number;
        status: "pending" | "in_progress" | "completed";
        message?: undefined;
    }>;
    getResults(sessionId: string, userId: string): Promise<{
        sessionId: string;
        status: "COMPLETED";
        finalResults: import("@prisma/client/runtime/library").JsonValue;
        layerResults: import("@prisma/client/runtime/library").JsonValue;
    }>;
    executeLayer(sessionId: string, dto: ExecuteLayerDto, userId: string): Promise<{
        layer: 1 | 2 | 3 | 4;
        processed: number;
        eliminated: number;
        advanced: number;
        results: import("./services/ai-jury-layers.service").LayerResult[];
    }>;
    resetSession(sessionId: string, userId: string): Promise<{
        message: string;
    }>;
}
