import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
interface AnalysisProgressUpdate {
    projectId: string;
    analysisType: string;
    status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    progress: number;
    currentStage: string;
    estimatedTimeRemaining?: number;
    details?: any;
}
interface AIJuryProgressUpdate {
    sessionId: string;
    layer: number;
    projectId?: string;
    projectName?: string;
    status: 'started' | 'processing' | 'completed' | 'failed';
    progress: number;
    eliminated?: number;
    advanced?: number;
}
export declare class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    server: Server;
    private readonly logger;
    private clientSubscriptions;
    constructor(jwtService: JwtService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleSubscribeProject(client: Socket, data: {
        projectId: string;
    }): {
        success: boolean;
        message: string;
    };
    handleUnsubscribeProject(client: Socket, data: {
        projectId: string;
    }): {
        success: boolean;
        message: string;
    };
    handleSubscribeAIJury(client: Socket, data: {
        sessionId: string;
    }): {
        success: boolean;
        message: string;
    };
    handleUnsubscribeAIJury(client: Socket, data: {
        sessionId: string;
    }): {
        success: boolean;
        message: string;
    };
    handlePing(): {
        pong: boolean;
        timestamp: string;
    };
    emitAnalysisProgress(projectId: string, update: AnalysisProgressUpdate): void;
    emitAnalysisCompleted(projectId: string, data: any): void;
    emitAnalysisFailed(projectId: string, error: {
        message: string;
        details?: any;
    }): void;
    emitAIJuryProgress(sessionId: string, update: AIJuryProgressUpdate): void;
    emitAIJuryLayerCompleted(sessionId: string, data: {
        layer: number;
        eliminated: number;
        advanced: number;
        results: any[];
    }): void;
    emitAIJuryCompleted(sessionId: string, data: {
        finalResults: any;
    }): void;
    emitNotification(userId: string, notification: any): void;
    getConnectedClientsCount(): number;
    getChannelSubscribersCount(channel: string): number;
}
export {};
