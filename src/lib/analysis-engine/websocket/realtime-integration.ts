import { EventEmitter } from 'events';
import { analysisWebSocketServer, AnalysisWebSocketServer, AnalysisProgressUpdate } from './websocket-server';
import { AnalysisOrchestrator } from '../orchestrator';
import { securityIntegration } from '../security/security-integration';
import { AnalysisRequest, AnalysisResult, AnalysisType } from '../types';

export interface RealtimeIntegrationConfig {
  enableWebSocket: boolean;
  websocketPort: number;
  enableSecurityAlerts: boolean;
  progressUpdateInterval: number; // milliseconds
  enableDetailedLogging: boolean;
  maxConcurrentConnections: number;
}

export interface AnalysisSession {
  sessionId: string;
  projectId: string;
  analysisTypes: AnalysisType[];
  startTime: number;
  currentStage: string;
  progress: number;
  estimatedTimeRemaining?: number;
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  metadata: {
    userId?: string;
    priority: string;
    securityLevel: string;
  };
}

export class RealtimeAnalysisIntegration extends EventEmitter {
  private config: RealtimeIntegrationConfig;
  private wsServer: AnalysisWebSocketServer;
  private orchestrator: AnalysisOrchestrator | null = null;
  private activeSessions: Map<string, AnalysisSession> = new Map();
  private progressUpdateTimers: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized: boolean = false;

  constructor(config: Partial<RealtimeIntegrationConfig> = {}) {
    super();

    this.config = {
      enableWebSocket: true,
      websocketPort: 8080,
      enableSecurityAlerts: true,
      progressUpdateInterval: 2000, // 2 seconds
      enableDetailedLogging: true,
      maxConcurrentConnections: 1000,
      ...config
    };

    this.wsServer = analysisWebSocketServer;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // WebSocket server events
    this.wsServer.on('clientConnected', (client) => {
      if (this.config.enableDetailedLogging) {
        console.log(`[REALTIME] Client connected: ${client.id} (User: ${client.userId || 'Anonymous'})`);
      }
      this.emit('clientConnected', client);
    });

    this.wsServer.on('clientDisconnected', (event) => {
      if (this.config.enableDetailedLogging) {
        console.log(`[REALTIME] Client disconnected: ${event.clientId}`);
      }
      this.emit('clientDisconnected', event);
    });

    // Security integration
    if (this.config.enableSecurityAlerts) {
      securityIntegration.on('securityEvent', (event) => {
        this.broadcastSecurityAlert({
          type: event.eventType,
          severity: event.severity,
          details: event.threatDetails,
          timestamp: event.timestamp,
          projectId: event.projectId
        });
      });

      securityIntegration.on('emergencyShutdown', (event) => {
        this.broadcastSecurityAlert({
          type: 'EMERGENCY_SHUTDOWN',
          severity: 'CRITICAL',
          details: event,
          timestamp: new Date().toISOString()
        });
      });
    }
  }

  async initialize(orchestrator: AnalysisOrchestrator): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.orchestrator = orchestrator;

    // Setup orchestrator event listeners
    this.orchestrator.on('analysisStarted', this.handleAnalysisStarted.bind(this));
    this.orchestrator.on('analysisProgress', this.handleAnalysisProgress.bind(this));
    this.orchestrator.on('analysisCompleted', this.handleAnalysisCompleted.bind(this));
    this.orchestrator.on('analysisFailed', this.handleAnalysisFailed.bind(this));
    this.orchestrator.on('stageChanged', this.handleStageChanged.bind(this));

    // Start WebSocket server if enabled
    if (this.config.enableWebSocket) {
      try {
        await this.wsServer.start();
        console.log(`[REALTIME] WebSocket server started on port ${this.config.websocketPort}`);
      } catch (error) {
        console.error('[REALTIME] Failed to start WebSocket server:', error);
        throw error;
      }
    }

    this.isInitialized = true;
    this.emit('initialized');
  }

  async shutdown(): Promise<void> {
    // Clear all progress timers
    for (const timer of this.progressUpdateTimers.values()) {
      clearInterval(timer);
    }
    this.progressUpdateTimers.clear();

    // Clear active sessions
    this.activeSessions.clear();

    // Stop WebSocket server
    if (this.config.enableWebSocket) {
      await this.wsServer.stop();
      console.log('[REALTIME] WebSocket server stopped');
    }

    this.isInitialized = false;
    this.emit('shutdown');
  }

  // Analysis lifecycle event handlers
  private handleAnalysisStarted(event: { sessionId: string; request: AnalysisRequest; metadata: any }): void {
    const session: AnalysisSession = {
      sessionId: event.sessionId,
      projectId: event.request.projectId,
      analysisTypes: event.request.analysisTypes,
      startTime: Date.now(),
      currentStage: 'Initializing',
      progress: 0,
      status: 'IN_PROGRESS',
      metadata: {
        userId: event.metadata.userId,
        priority: event.request.priority,
        securityLevel: event.metadata.securityLevel || 'STANDARD'
      }
    };

    this.activeSessions.set(event.sessionId, session);

    // Start progress updates for this session
    this.startProgressUpdates(event.sessionId);

    // Broadcast initial update
    this.broadcastAnalysisUpdate({
      projectId: event.request.projectId,
      analysisType: event.request.analysisTypes.join(', '),
      status: 'IN_PROGRESS',
      progress: 0,
      currentStage: 'Initializing analysis pipeline',
      estimatedTimeRemaining: this.estimateAnalysisTime(event.request.analysisTypes),
      details: {
        sessionId: event.sessionId,
        startTime: session.startTime,
        priority: event.request.priority
      }
    });

    if (this.config.enableDetailedLogging) {
      console.log(`[REALTIME] Analysis started for project ${event.request.projectId} (Session: ${event.sessionId})`);
    }
  }

  private handleAnalysisProgress(event: { sessionId: string; progress: number; stage: string; details?: any }): void {
    const session = this.activeSessions.get(event.sessionId);
    if (!session) return;

    session.progress = event.progress;
    session.currentStage = event.stage;

    // Update estimated time remaining
    const elapsed = Date.now() - session.startTime;
    if (event.progress > 5) { // Avoid division by very small numbers
      session.estimatedTimeRemaining = Math.round((elapsed / event.progress) * (100 - event.progress));
    }

    // Don't broadcast every progress update to avoid spam
    // Progress updates are sent via the timer-based system
  }

  private handleStageChanged(event: { sessionId: string; newStage: string; progress: number }): void {
    const session = this.activeSessions.get(event.sessionId);
    if (!session) return;

    session.currentStage = event.newStage;
    session.progress = event.progress;

    // Broadcast stage changes immediately
    this.broadcastAnalysisUpdate({
      projectId: session.projectId,
      analysisType: session.analysisTypes.join(', '),
      status: 'IN_PROGRESS',
      progress: event.progress,
      currentStage: event.newStage,
      estimatedTimeRemaining: session.estimatedTimeRemaining,
      details: {
        sessionId: event.sessionId,
        stageChanged: true
      }
    });

    if (this.config.enableDetailedLogging) {
      console.log(`[REALTIME] Stage changed for ${session.projectId}: ${event.newStage} (${event.progress}%)`);
    }
  }

  private handleAnalysisCompleted(event: { sessionId: string; results: AnalysisResult[] }): void {
    const session = this.activeSessions.get(event.sessionId);
    if (!session) return;

    session.status = 'COMPLETED';
    session.progress = 100;
    session.currentStage = 'Analysis Complete';

    // Stop progress updates
    this.stopProgressUpdates(event.sessionId);

    // Broadcast completion
    this.wsServer.broadcastAnalysisComplete(session.projectId, {
      sessionId: event.sessionId,
      results: event.results,
      completedAt: Date.now(),
      totalTime: Date.now() - session.startTime,
      analysisTypes: session.analysisTypes
    });

    // Clean up session
    this.activeSessions.delete(event.sessionId);

    if (this.config.enableDetailedLogging) {
      console.log(`[REALTIME] Analysis completed for project ${session.projectId} in ${Date.now() - session.startTime}ms`);
    }
  }

  private handleAnalysisFailed(event: { sessionId: string; error: Error; stage?: string }): void {
    const session = this.activeSessions.get(event.sessionId);
    if (!session) return;

    session.status = 'FAILED';
    session.currentStage = event.stage || 'Failed';

    // Stop progress updates
    this.stopProgressUpdates(event.sessionId);

    // Broadcast failure
    this.wsServer.broadcastAnalysisFailure(session.projectId, {
      sessionId: event.sessionId,
      error: {
        message: event.error.message,
        stage: event.stage || 'Unknown',
        timestamp: new Date().toISOString()
      },
      failedAt: Date.now(),
      totalTime: Date.now() - session.startTime
    });

    // Clean up session
    this.activeSessions.delete(event.sessionId);

    console.error(`[REALTIME] Analysis failed for project ${session.projectId}:`, event.error.message);
  }

  private startProgressUpdates(sessionId: string): void {
    const timer = setInterval(() => {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        this.stopProgressUpdates(sessionId);
        return;
      }

      this.broadcastAnalysisUpdate({
        projectId: session.projectId,
        analysisType: session.analysisTypes.join(', '),
        status: session.status,
        progress: session.progress,
        currentStage: session.currentStage,
        estimatedTimeRemaining: session.estimatedTimeRemaining,
        details: {
          sessionId: sessionId,
          elapsed: Date.now() - session.startTime
        }
      });
    }, this.config.progressUpdateInterval);

    this.progressUpdateTimers.set(sessionId, timer);
  }

  private stopProgressUpdates(sessionId: string): void {
    const timer = this.progressUpdateTimers.get(sessionId);
    if (timer) {
      clearInterval(timer);
      this.progressUpdateTimers.delete(sessionId);
    }
  }

  private broadcastAnalysisUpdate(update: AnalysisProgressUpdate): void {
    if (this.config.enableWebSocket) {
      this.wsServer.broadcastAnalysisUpdate(update);
    }
    this.emit('progressUpdate', update);
  }

  private broadcastSecurityAlert(alert: any): void {
    if (this.config.enableWebSocket && this.config.enableSecurityAlerts) {
      this.wsServer.broadcastSecurityAlert(alert);
    }
    this.emit('securityAlert', alert);
  }

  private estimateAnalysisTime(analysisTypes: AnalysisType[]): number {
    // Rough estimates based on analysis type complexity
    const timeEstimates = {
      'CODE_QUALITY': 30000,    // 30 seconds
      'INNOVATION': 45000,      // 45 seconds
      'COHERENCE': 20000,       // 20 seconds
      'HEDERA': 35000,          // 35 seconds
      'ELIGIBILITY': 15000      // 15 seconds
    };

    let totalTime = 0;
    for (const type of analysisTypes) {
      totalTime += timeEstimates[type as keyof typeof timeEstimates] || 30000;
    }

    // Add 20% buffer for orchestration overhead
    return Math.round(totalTime * 1.2);
  }

  // Public API methods
  public getActiveSessionsCount(): number {
    return this.activeSessions.size;
  }

  public getConnectedClientsCount(): number {
    return this.wsServer.getConnectedClientsCount();
  }

  public getSessionDetails(sessionId: string): AnalysisSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  public getAllActiveSessions(): AnalysisSession[] {
    return Array.from(this.activeSessions.values());
  }

  public async broadcastSystemAnnouncement(message: string, type: 'INFO' | 'WARNING' | 'MAINTENANCE' = 'INFO'): Promise<void> {
    if (this.config.enableWebSocket) {
      this.wsServer.broadcastToChannel('system', {
        type: 'SECURITY_ALERT', // Reusing existing message type
        data: {
          type: 'SYSTEM_ANNOUNCEMENT',
          severity: type,
          message,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        sessionId: 'system'
      });
    }
  }

  public getRealtimeStats(): {
    isInitialized: boolean;
    websocketEnabled: boolean;
    connectedClients: number;
    activeSessions: number;
    config: RealtimeIntegrationConfig;
    uptime: number;
  } {
    return {
      isInitialized: this.isInitialized,
      websocketEnabled: this.config.enableWebSocket,
      connectedClients: this.getConnectedClientsCount(),
      activeSessions: this.getActiveSessionsCount(),
      config: this.config,
      uptime: this.isInitialized ? Date.now() - (this.wsServer as any).startTime : 0
    };
  }

  public updateConfig(newConfig: Partial<RealtimeIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  // Force update for a specific project (useful for manual triggers)
  public forceProgressUpdate(projectId: string, update: Partial<AnalysisProgressUpdate>): void {
    const fullUpdate: AnalysisProgressUpdate = {
      projectId,
      analysisType: 'MANUAL',
      status: 'IN_PROGRESS',
      progress: 50,
      currentStage: 'Manual Update',
      ...update
    };

    this.broadcastAnalysisUpdate(fullUpdate);
  }
}

// Global realtime integration instance
export const realtimeIntegration = new RealtimeAnalysisIntegration({
  enableWebSocket: true,
  websocketPort: 8080,
  enableSecurityAlerts: true,
  progressUpdateInterval: 2000,
  enableDetailedLogging: true,
  maxConcurrentConnections: 1000
});