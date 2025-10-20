// AI Jury Progress Manager - In-memory progress tracking for real-time updates

interface ProgressEvent {
  id: string;
  sessionId: string;
  type: 'layer_start' | 'project_processing' | 'project_completed' | 'layer_completed' | 'session_completed' | 'error';
  layer: number;
  projectId?: string;
  projectName?: string;
  message: string;
  data?: any;
  timestamp: string;
}

interface SessionProgress {
  sessionId: string;
  events: ProgressEvent[];
  currentLayer: number;
  totalProjects: number;
  processedProjects: number;
  lastEventId: string;
}

class AIJuryProgressManager {
  private sessions = new Map<string, SessionProgress>();
  private listeners = new Map<string, Set<(event: ProgressEvent) => void>>();
  private maxEventsPerSession = 100; // Limit memory usage

  // Initialize a new session
  initializeSession(sessionId: string, totalProjects: number) {
    this.sessions.set(sessionId, {
      sessionId,
      events: [],
      currentLayer: 1,
      totalProjects,
      processedProjects: 0,
      lastEventId: '',
    });

    this.emitEvent(sessionId, {
      id: this.generateEventId(),
      sessionId,
      type: 'layer_start',
      layer: 1,
      message: `AI Jury session initialized with ${totalProjects} projects`,
      timestamp: new Date().toISOString(),
    });
  }

  // Start a new layer
  startLayer(sessionId: string, layer: number, projectCount: number) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.currentLayer = layer;
    session.processedProjects = 0;

    const layerNames = {
      1: 'Eligibility Check',
      2: 'Hedera Technology Filter',
      3: 'Code Quality Assessment',
      4: 'Final Analysis'
    };

    this.emitEvent(sessionId, {
      id: this.generateEventId(),
      sessionId,
      type: 'layer_start',
      layer,
      message: `Starting Layer ${layer}: ${layerNames[layer as keyof typeof layerNames]} (${projectCount} projects to process)`,
      data: { projectCount },
      timestamp: new Date().toISOString(),
    });
  }

  // Log project processing start
  startProcessingProject(sessionId: string, layer: number, projectId: string, projectName: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    this.emitEvent(sessionId, {
      id: this.generateEventId(),
      sessionId,
      type: 'project_processing',
      layer,
      projectId,
      projectName,
      message: `Layer ${layer} analyzing "${projectName}" (${session.processedProjects + 1}/${session.totalProjects})`,
      timestamp: new Date().toISOString(),
    });
  }

  // Log project completion
  completeProject(sessionId: string, layer: number, projectId: string, projectName: string, eliminated: boolean, score?: number) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.processedProjects++;

    const status = eliminated ? 'eliminated' : 'advanced';
    const scoreText = score !== undefined ? ` (score: ${Math.round(score)})` : '';

    this.emitEvent(sessionId, {
      id: this.generateEventId(),
      sessionId,
      type: 'project_completed',
      layer,
      projectId,
      projectName,
      message: `"${projectName}" ${status}${scoreText}`,
      data: { eliminated, score, status },
      timestamp: new Date().toISOString(),
    });
  }

  // Complete a layer
  completeLayer(sessionId: string, layer: number, eliminated: number, advanced: number) {
    this.emitEvent(sessionId, {
      id: this.generateEventId(),
      sessionId,
      type: 'layer_completed',
      layer,
      message: `Layer ${layer} completed - ${eliminated} eliminated, ${advanced} advanced`,
      data: { eliminated, advanced },
      timestamp: new Date().toISOString(),
    });
  }

  // Complete session
  completeSession(sessionId: string, finalResults: any) {
    this.emitEvent(sessionId, {
      id: this.generateEventId(),
      sessionId,
      type: 'session_completed',
      layer: 4,
      message: 'AI Jury evaluation completed successfully!',
      data: finalResults,
      timestamp: new Date().toISOString(),
    });
  }

  // Log error
  logError(sessionId: string, layer: number, error: string, projectId?: string) {
    this.emitEvent(sessionId, {
      id: this.generateEventId(),
      sessionId,
      type: 'error',
      layer,
      projectId,
      message: `Error: ${error}`,
      timestamp: new Date().toISOString(),
    });
  }

  // Get recent events for a session
  getRecentEvents(sessionId: string, limit = 50): ProgressEvent[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    return session.events.slice(-limit);
  }

  // Get session progress summary
  getProgressSummary(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return {
      sessionId: session.sessionId,
      currentLayer: session.currentLayer,
      totalProjects: session.totalProjects,
      processedProjects: session.processedProjects,
      lastEventId: session.lastEventId,
      eventCount: session.events.length,
    };
  }

  // Subscribe to events for a session
  subscribe(sessionId: string, callback: (event: ProgressEvent) => void) {
    if (!this.listeners.has(sessionId)) {
      this.listeners.set(sessionId, new Set());
    }
    this.listeners.get(sessionId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(sessionId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(sessionId);
        }
      }
    };
  }

  // Clean up session data
  cleanupSession(sessionId: string) {
    this.sessions.delete(sessionId);
    this.listeners.delete(sessionId);
  }

  // Private methods
  private emitEvent(sessionId: string, event: ProgressEvent) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Add event to session history
    session.events.push(event);
    session.lastEventId = event.id;

    // Limit memory usage by keeping only recent events
    if (session.events.length > this.maxEventsPerSession) {
      session.events = session.events.slice(-this.maxEventsPerSession);
    }

    // Notify listeners
    const listeners = this.listeners.get(sessionId);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in progress event listener:', error);
        }
      });
    }
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const aiJuryProgressManager = new AIJuryProgressManager();