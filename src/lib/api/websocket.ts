/**
 * WebSocket Client for Real-time Updates
 */

import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

class WebSocketClient {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.token = token;

    this.socket = io(`${WS_URL}/events`, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
    });

    this.socket.on('connected', (data) => {
      console.log('[WebSocket] Server confirmed connection:', data);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Project subscriptions
  subscribeToProject(projectId: string) {
    if (!this.socket) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('subscribe:project', { projectId });
  }

  unsubscribeFromProject(projectId: string) {
    if (!this.socket) {
      return;
    }

    this.socket.emit('unsubscribe:project', { projectId });
  }

  // AI Jury subscriptions
  subscribeToAIJury(sessionId: string) {
    if (!this.socket) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('subscribe:ai-jury', { sessionId });
  }

  unsubscribeFromAIJury(sessionId: string) {
    if (!this.socket) {
      return;
    }

    this.socket.emit('unsubscribe:ai-jury', { sessionId });
  }

  // Event listeners
  onAnalysisProgress(callback: (data: any) => void) {
    this.socket?.on('analysis:progress', callback);
  }

  onAnalysisCompleted(callback: (data: any) => void) {
    this.socket?.on('analysis:completed', callback);
  }

  onAnalysisFailed(callback: (data: any) => void) {
    this.socket?.on('analysis:failed', callback);
  }

  onAIJuryProgress(callback: (data: any) => void) {
    this.socket?.on('ai-jury:progress', callback);
  }

  onAIJuryLayerCompleted(callback: (data: any) => void) {
    this.socket?.on('ai-jury:layer-completed', callback);
  }

  onAIJuryCompleted(callback: (data: any) => void) {
    this.socket?.on('ai-jury:completed', callback);
  }

  onNotification(callback: (data: any) => void) {
    this.socket?.on('notification', callback);
  }

  // Remove event listeners
  offAnalysisProgress(callback?: (data: any) => void) {
    this.socket?.off('analysis:progress', callback);
  }

  offAnalysisCompleted(callback?: (data: any) => void) {
    this.socket?.off('analysis:completed', callback);
  }

  offAnalysisFailed(callback?: (data: any) => void) {
    this.socket?.off('analysis:failed', callback);
  }

  offAIJuryProgress(callback?: (data: any) => void) {
    this.socket?.off('ai-jury:progress', callback);
  }

  offAIJuryLayerCompleted(callback?: (data: any) => void) {
    this.socket?.off('ai-jury:layer-completed', callback);
  }

  offAIJuryCompleted(callback?: (data: any) => void) {
    this.socket?.off('ai-jury:completed', callback);
  }

  offNotification(callback?: (data: any) => void) {
    this.socket?.off('notification', callback);
  }

  // Ping/health check
  ping(callback: (data: any) => void) {
    this.socket?.emit('ping', {}, callback);
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient();

// Export class for custom instances
export { WebSocketClient };
