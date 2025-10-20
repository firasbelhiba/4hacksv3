"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EventsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
let EventsGateway = EventsGateway_1 = class EventsGateway {
    constructor(jwtService) {
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(EventsGateway_1.name);
        this.clientSubscriptions = new Map();
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
            if (!token) {
                this.logger.warn(`Client ${client.id} connected without auth token`);
                client.disconnect();
                return;
            }
            const payload = await this.jwtService.verifyAsync(token);
            client.data.userId = payload.sub;
            client.data.user = payload;
            this.clientSubscriptions.set(client.id, new Set());
            this.logger.log(`Client connected: ${client.id} (User: ${payload.sub})`);
            client.emit('connected', {
                message: 'Successfully connected to real-time events',
                clientId: client.id,
            });
        }
        catch (error) {
            this.logger.error(`Authentication failed for client ${client.id}:`, error.message);
            client.emit('error', { message: 'Authentication failed' });
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        this.clientSubscriptions.delete(client.id);
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handleSubscribeProject(client, data) {
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
    handleUnsubscribeProject(client, data) {
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
    handleSubscribeAIJury(client, data) {
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
    handleUnsubscribeAIJury(client, data) {
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
    handlePing() {
        return { pong: true, timestamp: new Date().toISOString() };
    }
    emitAnalysisProgress(projectId, update) {
        this.server.to(`project:${projectId}`).emit('analysis:progress', update);
        this.logger.debug(`Emitted analysis progress for project ${projectId}`);
    }
    emitAnalysisCompleted(projectId, data) {
        this.server.to(`project:${projectId}`).emit('analysis:completed', {
            projectId,
            ...data,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Emitted analysis completed for project ${projectId}`);
    }
    emitAnalysisFailed(projectId, error) {
        this.server.to(`project:${projectId}`).emit('analysis:failed', {
            projectId,
            error,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Emitted analysis failed for project ${projectId}`);
    }
    emitAIJuryProgress(sessionId, update) {
        this.server.to(`ai-jury:${sessionId}`).emit('ai-jury:progress', update);
        this.logger.debug(`Emitted AI Jury progress for session ${sessionId}`);
    }
    emitAIJuryLayerCompleted(sessionId, data) {
        this.server.to(`ai-jury:${sessionId}`).emit('ai-jury:layer-completed', {
            sessionId,
            ...data,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Emitted AI Jury layer ${data.layer} completed for session ${sessionId}`);
    }
    emitAIJuryCompleted(sessionId, data) {
        this.server.to(`ai-jury:${sessionId}`).emit('ai-jury:completed', {
            sessionId,
            ...data,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Emitted AI Jury completed for session ${sessionId}`);
    }
    emitNotification(userId, notification) {
        this.server.to(`user:${userId}`).emit('notification', {
            ...notification,
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`Emitted notification to user ${userId}`);
    }
    getConnectedClientsCount() {
        return this.server.sockets.sockets.size;
    }
    getChannelSubscribersCount(channel) {
        return this.server.sockets.adapter.rooms.get(channel)?.size || 0;
    }
};
exports.EventsGateway = EventsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], EventsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe:project'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleSubscribeProject", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe:project'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleUnsubscribeProject", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe:ai-jury'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleSubscribeAIJury", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe:ai-jury'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleUnsubscribeAIJury", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ping'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handlePing", null);
exports.EventsGateway = EventsGateway = EventsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
        },
        namespace: '/events',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], EventsGateway);
//# sourceMappingURL=events.gateway.js.map