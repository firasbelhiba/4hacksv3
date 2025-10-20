export interface LayerProgress {
    layer: number;
    totalProjects: number;
    processedProjects: number;
    eliminatedProjects: number;
    advancedProjects: number;
    currentProject?: {
        id: string;
        name: string;
        status: 'processing' | 'completed';
    };
    startTime: number;
    endTime?: number;
    status: 'pending' | 'in_progress' | 'completed';
}
export interface SessionProgress {
    sessionId: string;
    totalProjects: number;
    layers: Map<number, LayerProgress>;
    currentLayer?: number;
    finalResults?: any;
    startTime: number;
    endTime?: number;
    status: 'pending' | 'in_progress' | 'completed';
}
export declare class AIJuryProgressService {
    private readonly logger;
    private sessions;
    initializeSession(sessionId: string, totalProjects: number): void;
    startLayer(sessionId: string, layer: number, totalProjects: number): void;
    startProcessingProject(sessionId: string, layer: number, projectId: string, projectName: string): void;
    completeProject(sessionId: string, layer: number, projectId: string, projectName: string, eliminated: boolean, score?: number): void;
    completeLayer(sessionId: string, layer: number, eliminated: number, advanced: number): void;
    completeSession(sessionId: string, finalResults: any): void;
    getSessionProgress(sessionId: string): SessionProgress | undefined;
    getLayerProgress(sessionId: string, layer: number): LayerProgress | undefined;
    clearSession(sessionId: string): void;
}
