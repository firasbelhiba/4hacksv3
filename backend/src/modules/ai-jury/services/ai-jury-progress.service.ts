import { Injectable, Logger } from '@nestjs/common';

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

@Injectable()
export class AIJuryProgressService {
  private readonly logger = new Logger(AIJuryProgressService.name);
  private sessions = new Map<string, SessionProgress>();

  initializeSession(sessionId: string, totalProjects: number) {
    this.sessions.set(sessionId, {
      sessionId,
      totalProjects,
      layers: new Map(),
      startTime: Date.now(),
      status: 'in_progress',
    });
    this.logger.log(`🎬 AI Jury session ${sessionId} initialized with ${totalProjects} projects`);
  }

  startLayer(sessionId: string, layer: number, totalProjects: number) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      this.logger.warn(`Session ${sessionId} not found`);
      return;
    }

    session.currentLayer = layer;
    session.layers.set(layer, {
      layer,
      totalProjects,
      processedProjects: 0,
      eliminatedProjects: 0,
      advancedProjects: 0,
      startTime: Date.now(),
      status: 'in_progress',
    });

    this.logger.log(`▶️  Layer ${layer} started for session ${sessionId} with ${totalProjects} projects`);
  }

  startProcessingProject(sessionId: string, layer: number, projectId: string, projectName: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const layerProgress = session.layers.get(layer);
    if (!layerProgress) return;

    layerProgress.currentProject = {
      id: projectId,
      name: projectName,
      status: 'processing',
    };

    this.logger.debug(`   🔄 Processing project "${projectName}" in Layer ${layer}`);
  }

  completeProject(
    sessionId: string,
    layer: number,
    projectId: string,
    projectName: string,
    eliminated: boolean,
    score?: number
  ) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const layerProgress = session.layers.get(layer);
    if (!layerProgress) return;

    layerProgress.processedProjects++;
    if (eliminated) {
      layerProgress.eliminatedProjects++;
    } else {
      layerProgress.advancedProjects++;
    }

    if (layerProgress.currentProject?.id === projectId) {
      layerProgress.currentProject.status = 'completed';
    }

    const emoji = eliminated ? '❌' : '✅';
    const scoreText = score !== undefined ? ` (score: ${Math.round(score)})` : '';
    this.logger.debug(`   ${emoji} "${projectName}"${scoreText} - ${eliminated ? 'eliminated' : 'advanced'}`);
  }

  completeLayer(sessionId: string, layer: number, eliminated: number, advanced: number) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const layerProgress = session.layers.get(layer);
    if (!layerProgress) return;

    layerProgress.endTime = Date.now();
    layerProgress.status = 'completed';
    layerProgress.eliminatedProjects = eliminated;
    layerProgress.advancedProjects = advanced;

    const duration = layerProgress.endTime - layerProgress.startTime;
    this.logger.log(
      `✅ Layer ${layer} completed in ${Math.round(duration / 1000)}s - ` +
      `${eliminated} eliminated, ${advanced} advanced`
    );
  }

  completeSession(sessionId: string, finalResults: any) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.endTime = Date.now();
    session.status = 'completed';
    session.finalResults = finalResults;

    const duration = session.endTime - session.startTime;
    this.logger.log(`🎉 AI Jury session ${sessionId} completed in ${Math.round(duration / 1000)}s`);
  }

  getSessionProgress(sessionId: string): SessionProgress | undefined {
    return this.sessions.get(sessionId);
  }

  getLayerProgress(sessionId: string, layer: number): LayerProgress | undefined {
    const session = this.sessions.get(sessionId);
    return session?.layers.get(layer);
  }

  clearSession(sessionId: string) {
    this.sessions.delete(sessionId);
    this.logger.log(`🗑️  Session ${sessionId} cleared from memory`);
  }
}
