import { EventEmitter } from 'events';

export interface WebSocketClientConfig {
  url: string;
  userId?: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export interface WebSocketMessage {
  type: 'ANALYSIS_UPDATE' | 'SECURITY_ALERT' | 'PROGRESS_UPDATE' | 'ANALYSIS_COMPLETE' | 'ANALYSIS_FAILED' | 'SUBSCRIBE' | 'UNSUBSCRIBE' | 'HEARTBEAT';
  data: any;
  timestamp: string;
  projectId?: string;
  userId?: string;
  sessionId: string;
}

export interface AnalysisProgressData {
  projectId: string;
  analysisType: string;
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  progress: number;
  currentStage: string;
  estimatedTimeRemaining?: number;
  details?: any;
}

export class AnalysisWebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketClientConfig>;
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnecting: boolean = false;
  private isDestroyed: boolean = false;
  private subscribedProjects: Set<string> = new Set();
  private subscribedChannels: Set<string> = new Set();

  constructor(config: WebSocketClientConfig) {
    super();

    this.config = {
      url: config.url,
      userId: config.userId,
      autoReconnect: true,
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      ...config
    };
  }

  async connect(): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('Client has been destroyed');
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    if (this.isConnecting) {
      return; // Connection in progress
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        const url = this.config.userId
          ? `${this.config.url}?userId=${encodeURIComponent(this.config.userId)}`
          : this.config.url;

        this.ws = new WebSocket(url);

        const onOpen = () => {
          console.log('[WEBSOCKET CLIENT] Connected to server');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.resubscribeToChannels();
          this.emit('connected');
          resolve();
        };

        const onError = (error: Event) => {
          console.error('[WEBSOCKET CLIENT] Connection error:', error);
          this.isConnecting = false;
          this.emit('error', error);

          if (this.reconnectAttempts === 0) {
            reject(new Error('Failed to connect to WebSocket server'));
          }
        };

        const onClose = (event: CloseEvent) => {
          console.log(`[WEBSOCKET CLIENT] Connection closed: ${event.code} - ${event.reason}`);
          this.isConnecting = false;
          this.stopHeartbeat();
          this.emit('disconnected', { code: event.code, reason: event.reason });

          if (this.config.autoReconnect && !this.isDestroyed) {
            this.scheduleReconnect();
          }
        };

        const onMessage = (event: MessageEvent) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[WEBSOCKET CLIENT] Failed to parse message:', error);
          }
        };

        this.ws.addEventListener('open', onOpen);
        this.ws.addEventListener('error', onError);
        this.ws.addEventListener('close', onClose);
        this.ws.addEventListener('message', onMessage);

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'PROGRESS_UPDATE':
        this.emit('analysisProgress', message.data as AnalysisProgressData);
        this.emit('progress', message.data);
        break;

      case 'ANALYSIS_COMPLETE':
        this.emit('analysisComplete', {
          projectId: message.projectId,
          results: message.data
        });
        break;

      case 'ANALYSIS_FAILED':
        this.emit('analysisFailure', {
          projectId: message.projectId,
          error: message.data
        });
        break;

      case 'SECURITY_ALERT':
        this.emit('securityAlert', message.data);
        break;

      case 'HEARTBEAT':
        // Server heartbeat response
        break;

      case 'SUBSCRIBE':
      case 'UNSUBSCRIBE':
        // Subscription confirmations
        this.emit('subscriptionUpdate', message.data);
        break;

      default:
        console.warn('[WEBSOCKET CLIENT] Unknown message type:', message.type);
    }

    this.emit('message', message);
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('[WEBSOCKET CLIENT] Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);

    console.log(`[WEBSOCKET CLIENT] Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('[WEBSOCKET CLIENT] Reconnection failed:', error);
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'HEARTBEAT',
          data: { ping: true, clientTime: Date.now() },
          timestamp: new Date().toISOString(),
          sessionId: 'client'
        });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private resubscribeToChannels(): void {
    // Re-subscribe to all previously subscribed projects and channels
    for (const projectId of this.subscribedProjects) {
      this.subscribeToProject(projectId);
    }

    for (const channel of this.subscribedChannels) {
      this.subscribeToChannel(channel);
    }
  }

  public subscribeToProject(projectId: string): void {
    this.subscribedProjects.add(projectId);
    this.send({
      type: 'SUBSCRIBE',
      data: { projectId },
      timestamp: new Date().toISOString(),
      projectId,
      sessionId: 'client'
    });
  }

  public unsubscribeFromProject(projectId: string): void {
    this.subscribedProjects.delete(projectId);
    this.send({
      type: 'UNSUBSCRIBE',
      data: { projectId },
      timestamp: new Date().toISOString(),
      projectId,
      sessionId: 'client'
    });
  }

  public subscribeToChannel(channel: string): void {
    this.subscribedChannels.add(channel);
    this.send({
      type: 'SUBSCRIBE',
      data: { channel },
      timestamp: new Date().toISOString(),
      sessionId: 'client'
    });
  }

  public unsubscribeFromChannel(channel: string): void {
    this.subscribedChannels.delete(channel);
    this.send({
      type: 'UNSUBSCRIBE',
      data: { channel },
      timestamp: new Date().toISOString(),
      sessionId: 'client'
    });
  }

  private send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('[WEBSOCKET CLIENT] Failed to send message:', error);
      }
    } else {
      console.warn('[WEBSOCKET CLIENT] Cannot send message - not connected');
    }
  }

  public disconnect(): void {
    this.isDestroyed = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }

    this.subscribedProjects.clear();
    this.subscribedChannels.clear();
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  public getConnectionState(): string {
    if (!this.ws) return 'DISCONNECTED';

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'CONNECTED';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'DISCONNECTED';
      default: return 'UNKNOWN';
    }
  }

  public getSubscriptions(): {
    projects: string[];
    channels: string[];
  } {
    return {
      projects: Array.from(this.subscribedProjects),
      channels: Array.from(this.subscribedChannels)
    };
  }

  public getStats(): {
    connectionState: string;
    reconnectAttempts: number;
    subscribedProjects: number;
    subscribedChannels: number;
    isAutoReconnectEnabled: boolean;
  } {
    return {
      connectionState: this.getConnectionState(),
      reconnectAttempts: this.reconnectAttempts,
      subscribedProjects: this.subscribedProjects.size,
      subscribedChannels: this.subscribedChannels.size,
      isAutoReconnectEnabled: this.config.autoReconnect
    };
  }
}

// React Hook for WebSocket Integration
export interface UseWebSocketAnalysis {
  client: AnalysisWebSocketClient | null;
  isConnected: boolean;
  connectionState: string;
  lastMessage: WebSocketMessage | null;
  analysisProgress: AnalysisProgressData | null;
  subscribeToProject: (projectId: string) => void;
  unsubscribeFromProject: (projectId: string) => void;
  subscribeToAnalysisChannel: () => void;
  subscribeToSecurityChannel: () => void;
  stats: any;
}

// WebSocket Hook Factory
export const createWebSocketHook = (config: WebSocketClientConfig) => {
  let clientInstance: AnalysisWebSocketClient | null = null;

  return function useWebSocketAnalysis(): UseWebSocketAnalysis {
    // This would be implemented as a React hook in the actual component
    // For now, providing the interface and basic structure

    if (!clientInstance) {
      clientInstance = new AnalysisWebSocketClient(config);
    }

    return {
      client: clientInstance,
      isConnected: clientInstance.isConnected(),
      connectionState: clientInstance.getConnectionState(),
      lastMessage: null, // Would be managed by React state
      analysisProgress: null, // Would be managed by React state
      subscribeToProject: (projectId: string) => clientInstance?.subscribeToProject(projectId),
      unsubscribeFromProject: (projectId: string) => clientInstance?.unsubscribeFromProject(projectId),
      subscribeToAnalysisChannel: () => clientInstance?.subscribeToChannel('analysis'),
      subscribeToSecurityChannel: () => clientInstance?.subscribeToChannel('security'),
      stats: clientInstance.getStats()
    };
  };
};

// Global WebSocket client instance
export const createGlobalWebSocketClient = (url: string, userId?: string) => {
  return new AnalysisWebSocketClient({
    url,
    userId,
    autoReconnect: true,
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000
  });
};