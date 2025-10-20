import { EventEmitter } from 'events';
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { parse } from 'url';

export interface WebSocketMessage {
  type: 'ANALYSIS_UPDATE' | 'SECURITY_ALERT' | 'PROGRESS_UPDATE' | 'ANALYSIS_COMPLETE' | 'ANALYSIS_FAILED' | 'SUBSCRIBE' | 'UNSUBSCRIBE' | 'HEARTBEAT';
  data: any;
  timestamp: string;
  projectId?: string;
  userId?: string;
  sessionId: string;
}

export interface ClientConnection {
  id: string;
  socket: WebSocket;
  userId?: string;
  subscribedProjects: Set<string>;
  subscribedChannels: Set<string>;
  lastHeartbeat: number;
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    connectedAt: number;
  };
}

export interface AnalysisProgressUpdate {
  projectId: string;
  analysisType: string;
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  progress: number; // 0-100
  currentStage: string;
  estimatedTimeRemaining?: number;
  details?: any;
}

export class AnalysisWebSocketServer extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientConnection> = new Map();
  private projectSubscriptions: Map<string, Set<string>> = new Map(); // projectId -> Set of clientIds
  private channelSubscriptions: Map<string, Set<string>> = new Map(); // channel -> Set of clientIds
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private port: number = 8080, private options: {
    heartbeatInterval?: number;
    connectionTimeout?: number;
    maxConnections?: number;
    enableAuth?: boolean;
  } = {}) {
    super();

    this.options = {
      heartbeatInterval: 30000, // 30 seconds
      connectionTimeout: 60000, // 1 minute
      maxConnections: 1000,
      enableAuth: true,
      ...options
    };
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocketServer({
          port: this.port,
          perMessageDeflate: true,
          maxPayload: 16 * 1024, // 16KB max message size
        });

        this.wss.on('connection', this.handleConnection.bind(this));
        this.wss.on('error', (error) => {
          console.error('[WEBSOCKET] Server error:', error);
          this.emit('error', error);
        });

        this.startHeartbeat();
        this.startCleanup();

        console.log(`[WEBSOCKET] Server started on port ${this.port}`);
        this.emit('serverStarted', { port: this.port });
        resolve();

      } catch (error) {
        console.error('[WEBSOCKET] Failed to start server:', error);
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }

      // Close all client connections
      for (const client of this.clients.values()) {
        client.socket.close(1000, 'Server shutting down');
      }

      if (this.wss) {
        this.wss.close(() => {
          console.log('[WEBSOCKET] Server stopped');
          this.emit('serverStopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  private handleConnection(socket: WebSocket, request: IncomingMessage): void {
    if (this.clients.size >= this.options.maxConnections!) {
      console.warn('[WEBSOCKET] Connection rejected - max connections reached');
      socket.close(1008, 'Server at capacity');
      return;
    }

    const clientId = this.generateClientId();
    const parsedUrl = parse(request.url || '', true);
    const userId = parsedUrl.query.userId as string;

    const client: ClientConnection = {
      id: clientId,
      socket,
      userId,
      subscribedProjects: new Set(),
      subscribedChannels: new Set(),
      lastHeartbeat: Date.now(),
      metadata: {
        userAgent: request.headers['user-agent'],
        ipAddress: this.getClientIP(request),
        connectedAt: Date.now()
      }
    };

    this.clients.set(clientId, client);

    console.log(`[WEBSOCKET] Client connected: ${clientId} (User: ${userId || 'Anonymous'})`);
    this.emit('clientConnected', client);

    // Set up event handlers
    socket.on('message', (data) => this.handleMessage(clientId, data));
    socket.on('close', (code, reason) => this.handleDisconnection(clientId, code, reason));
    socket.on('error', (error) => this.handleClientError(clientId, error));
    socket.on('pong', () => this.handlePong(clientId));

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'HEARTBEAT',
      data: { welcome: true, clientId, serverTime: Date.now() },
      timestamp: new Date().toISOString(),
      sessionId: clientId
    });
  }

  private handleMessage(clientId: string, data: Buffer): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      client.lastHeartbeat = Date.now();

      console.log(`[WEBSOCKET] Message from ${clientId}:`, message.type);

      switch (message.type) {
        case 'SUBSCRIBE':
          this.handleSubscription(clientId, message);
          break;

        case 'UNSUBSCRIBE':
          this.handleUnsubscription(clientId, message);
          break;

        case 'HEARTBEAT':
          this.sendToClient(clientId, {
            type: 'HEARTBEAT',
            data: { pong: true, serverTime: Date.now() },
            timestamp: new Date().toISOString(),
            sessionId: clientId
          });
          break;

        default:
          console.warn(`[WEBSOCKET] Unknown message type: ${message.type}`);
      }

      this.emit('messageReceived', { clientId, message });

    } catch (error) {
      console.error(`[WEBSOCKET] Invalid message from ${clientId}:`, error);
      this.sendToClient(clientId, {
        type: 'HEARTBEAT', // Using heartbeat as error response
        data: { error: 'Invalid message format' },
        timestamp: new Date().toISOString(),
        sessionId: clientId
      });
    }
  }

  private handleSubscription(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { projectId, channel } = message.data;

    if (projectId) {
      client.subscribedProjects.add(projectId);

      if (!this.projectSubscriptions.has(projectId)) {
        this.projectSubscriptions.set(projectId, new Set());
      }
      this.projectSubscriptions.get(projectId)!.add(clientId);

      console.log(`[WEBSOCKET] Client ${clientId} subscribed to project ${projectId}`);
    }

    if (channel) {
      client.subscribedChannels.add(channel);

      if (!this.channelSubscriptions.has(channel)) {
        this.channelSubscriptions.set(channel, new Set());
      }
      this.channelSubscriptions.get(channel)!.add(clientId);

      console.log(`[WEBSOCKET] Client ${clientId} subscribed to channel ${channel}`);
    }

    // Send confirmation
    this.sendToClient(clientId, {
      type: 'SUBSCRIBE',
      data: { success: true, projectId, channel },
      timestamp: new Date().toISOString(),
      sessionId: clientId
    });
  }

  private handleUnsubscription(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { projectId, channel } = message.data;

    if (projectId) {
      client.subscribedProjects.delete(projectId);
      this.projectSubscriptions.get(projectId)?.delete(clientId);
    }

    if (channel) {
      client.subscribedChannels.delete(channel);
      this.channelSubscriptions.get(channel)?.delete(clientId);
    }

    // Send confirmation
    this.sendToClient(clientId, {
      type: 'UNSUBSCRIBE',
      data: { success: true, projectId, channel },
      timestamp: new Date().toISOString(),
      sessionId: clientId
    });
  }

  private handleDisconnection(clientId: string, code: number, reason: Buffer): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    console.log(`[WEBSOCKET] Client disconnected: ${clientId} (Code: ${code}, Reason: ${reason.toString()})`);

    // Clean up subscriptions
    for (const projectId of client.subscribedProjects) {
      this.projectSubscriptions.get(projectId)?.delete(clientId);
    }

    for (const channel of client.subscribedChannels) {
      this.channelSubscriptions.get(channel)?.delete(clientId);
    }

    this.clients.delete(clientId);
    this.emit('clientDisconnected', { clientId, code, reason: reason.toString() });
  }

  private handleClientError(clientId: string, error: Error): void {
    console.error(`[WEBSOCKET] Client error ${clientId}:`, error);
    this.emit('clientError', { clientId, error });
  }

  private handlePong(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastHeartbeat = Date.now();
    }
  }

  // Public methods for sending updates
  public broadcastAnalysisUpdate(update: AnalysisProgressUpdate): void {
    const message: WebSocketMessage = {
      type: 'PROGRESS_UPDATE',
      data: update,
      timestamp: new Date().toISOString(),
      projectId: update.projectId,
      sessionId: 'server'
    };

    // Send to all clients subscribed to this project
    const subscribedClients = this.projectSubscriptions.get(update.projectId);
    if (subscribedClients) {
      for (const clientId of subscribedClients) {
        this.sendToClient(clientId, message);
      }
    }

    // Also send to 'analysis' channel subscribers
    this.broadcastToChannel('analysis', message);
  }

  public broadcastAnalysisComplete(projectId: string, results: any): void {
    const message: WebSocketMessage = {
      type: 'ANALYSIS_COMPLETE',
      data: results,
      timestamp: new Date().toISOString(),
      projectId,
      sessionId: 'server'
    };

    this.broadcastToProject(projectId, message);
    this.broadcastToChannel('analysis', message);
  }

  public broadcastAnalysisFailure(projectId: string, error: any): void {
    const message: WebSocketMessage = {
      type: 'ANALYSIS_FAILED',
      data: { error: error.message || 'Analysis failed', details: error },
      timestamp: new Date().toISOString(),
      projectId,
      sessionId: 'server'
    };

    this.broadcastToProject(projectId, message);
    this.broadcastToChannel('analysis', message);
  }

  public broadcastSecurityAlert(alert: any): void {
    const message: WebSocketMessage = {
      type: 'SECURITY_ALERT',
      data: alert,
      timestamp: new Date().toISOString(),
      sessionId: 'server'
    };

    this.broadcastToChannel('security', message);
    this.broadcastToAll(message); // Security alerts go to everyone
  }

  private broadcastToProject(projectId: string, message: WebSocketMessage): void {
    const subscribedClients = this.projectSubscriptions.get(projectId);
    if (subscribedClients) {
      for (const clientId of subscribedClients) {
        this.sendToClient(clientId, message);
      }
    }
  }

  private broadcastToChannel(channel: string, message: WebSocketMessage): void {
    const subscribedClients = this.channelSubscriptions.get(channel);
    if (subscribedClients) {
      for (const clientId of subscribedClients) {
        this.sendToClient(clientId, message);
      }
    }
  }

  private broadcastToAll(message: WebSocketMessage): void {
    for (const clientId of this.clients.keys()) {
      this.sendToClient(clientId, message);
    }
  }

  private sendToClient(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client || client.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      client.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error(`[WEBSOCKET] Failed to send message to ${clientId}:`, error);
      this.handleDisconnection(clientId, 1006, Buffer.from('Send failed'));
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = this.options.connectionTimeout!;

      for (const [clientId, client] of this.clients) {
        if (now - client.lastHeartbeat > timeout) {
          console.log(`[WEBSOCKET] Client ${clientId} timed out`);
          client.socket.close(1000, 'Heartbeat timeout');
          continue;
        }

        // Send ping
        if (client.socket.readyState === WebSocket.OPEN) {
          try {
            client.socket.ping();
          } catch (error) {
            console.error(`[WEBSOCKET] Failed to ping ${clientId}:`, error);
          }
        }
      }
    }, this.options.heartbeatInterval);
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      // Clean up empty subscription sets
      for (const [projectId, clients] of this.projectSubscriptions) {
        if (clients.size === 0) {
          this.projectSubscriptions.delete(projectId);
        }
      }

      for (const [channel, clients] of this.channelSubscriptions) {
        if (clients.size === 0) {
          this.channelSubscriptions.delete(channel);
        }
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getClientIP(request: IncomingMessage): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    }
    return request.socket.remoteAddress || 'unknown';
  }

  // Getters for monitoring
  public getConnectedClientsCount(): number {
    return this.clients.size;
  }

  public getSubscriptionStats(): {
    totalProjects: number;
    totalChannels: number;
    clientDetails: Array<{
      id: string;
      userId?: string;
      projectCount: number;
      channelCount: number;
      connectedAt: number;
    }>;
  } {
    return {
      totalProjects: this.projectSubscriptions.size,
      totalChannels: this.channelSubscriptions.size,
      clientDetails: Array.from(this.clients.values()).map(client => ({
        id: client.id,
        userId: client.userId,
        projectCount: client.subscribedProjects.size,
        channelCount: client.subscribedChannels.size,
        connectedAt: client.metadata.connectedAt
      }))
    };
  }
}

// Global WebSocket server instance
export const analysisWebSocketServer = new AnalysisWebSocketServer(8080, {
  heartbeatInterval: 30000,
  connectionTimeout: 60000,
  maxConnections: 1000,
  enableAuth: true
});