import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface AnalysisProgressUpdate {
  projectId: string;
  analysisType: string;
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  progress: number; // 0-100
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

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private clientSubscriptions: Map<string, Set<string>> = new Map(); // socketId -> Set of channels

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without auth token`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token);

      // Store user info in socket data
      client.data.userId = payload.sub;
      client.data.user = payload;

      this.clientSubscriptions.set(client.id, new Set());

      this.logger.log(`Client connected: ${client.id} (User: ${payload.sub})`);

      client.emit('connected', {
        message: 'Successfully connected to real-time events',
        clientId: client.id,
      });
    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}:`, error.message);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.clientSubscriptions.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:project')
  handleSubscribeProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    const channel = `project:${data.projectId}`;
    client.join(channel);

    const subscriptions = this.clientSubscriptions.get(client.id) || new Set();
    subscriptions.add(channel);
    this.clientSubscriptions.set(client.id, subscriptions);

    this.logger.log(`Client ${client.id} subscribed to ${channel}`);

    return {
      success: true,
      message: `Subscribed to project ${data.projectId}`,
    };
  }

  @SubscribeMessage('unsubscribe:project')
  handleUnsubscribeProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    const channel = `project:${data.projectId}`;
    client.leave(channel);

    const subscriptions = this.clientSubscriptions.get(client.id);
    if (subscriptions) {
      subscriptions.delete(channel);
    }

    this.logger.log(`Client ${client.id} unsubscribed from ${channel}`);

    return {
      success: true,
      message: `Unsubscribed from project ${data.projectId}`,
    };
  }

  @SubscribeMessage('subscribe:ai-jury')
  handleSubscribeAIJury(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    const channel = `ai-jury:${data.sessionId}`;
    client.join(channel);

    const subscriptions = this.clientSubscriptions.get(client.id) || new Set();
    subscriptions.add(channel);
    this.clientSubscriptions.set(client.id, subscriptions);

    this.logger.log(`Client ${client.id} subscribed to ${channel}`);

    return {
      success: true,
      message: `Subscribed to AI Jury session ${data.sessionId}`,
    };
  }

  @SubscribeMessage('unsubscribe:ai-jury')
  handleUnsubscribeAIJury(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    const channel = `ai-jury:${data.sessionId}`;
    client.leave(channel);

    const subscriptions = this.clientSubscriptions.get(client.id);
    if (subscriptions) {
      subscriptions.delete(channel);
    }

    this.logger.log(`Client ${client.id} unsubscribed from ${channel}`);

    return {
      success: true,
      message: `Unsubscribed from AI Jury session ${data.sessionId}`,
    };
  }

  @SubscribeMessage('ping')
  handlePing() {
    return { pong: true, timestamp: new Date().toISOString() };
  }

  // Public methods for emitting events

  emitAnalysisProgress(projectId: string, update: AnalysisProgressUpdate) {
    this.server.to(`project:${projectId}`).emit('analysis:progress', update);
    this.logger.debug(`Emitted analysis progress for project ${projectId}`);
  }

  emitAnalysisCompleted(projectId: string, data: any) {
    this.server.to(`project:${projectId}`).emit('analysis:completed', {
      projectId,
      ...data,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Emitted analysis completed for project ${projectId}`);
  }

  emitAnalysisFailed(projectId: string, error: { message: string; details?: any }) {
    this.server.to(`project:${projectId}`).emit('analysis:failed', {
      projectId,
      error,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Emitted analysis failed for project ${projectId}`);
  }

  emitAIJuryProgress(sessionId: string, update: AIJuryProgressUpdate) {
    this.server.to(`ai-jury:${sessionId}`).emit('ai-jury:progress', update);
    this.logger.debug(`Emitted AI Jury progress for session ${sessionId}`);
  }

  emitAIJuryLayerCompleted(sessionId: string, data: {
    layer: number;
    eliminated: number;
    advanced: number;
    results: any[];
  }) {
    this.server.to(`ai-jury:${sessionId}`).emit('ai-jury:layer-completed', {
      sessionId,
      ...data,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Emitted AI Jury layer ${data.layer} completed for session ${sessionId}`);
  }

  emitAIJuryCompleted(sessionId: string, data: { finalResults: any }) {
    this.server.to(`ai-jury:${sessionId}`).emit('ai-jury:completed', {
      sessionId,
      ...data,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Emitted AI Jury completed for session ${sessionId}`);
  }

  emitNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    });
    this.logger.debug(`Emitted notification to user ${userId}`);
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.server.sockets.sockets.size;
  }

  // Get subscriptions for a channel
  getChannelSubscribersCount(channel: string): number {
    return this.server.sockets.adapter.rooms.get(channel)?.size || 0;
  }
}
