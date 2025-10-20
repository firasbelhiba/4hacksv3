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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let NotificationsService = class NotificationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId, filters) {
        const whereConditions = { userId };
        if (filters?.type && filters.type !== 'all') {
            whereConditions.type = filters.type;
        }
        if (filters?.category && filters.category !== 'all') {
            whereConditions.category = filters.category;
        }
        if (filters?.priority && filters.priority !== 'all') {
            whereConditions.priority = filters.priority;
        }
        if (filters?.read !== 'all' && filters?.read !== null && filters?.read !== undefined) {
            whereConditions.read = filters.read === 'true';
        }
        const limit = filters?.limit || 50;
        const notifications = await this.prisma.notifications.findMany({
            where: whereConditions,
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        return notifications.map(notification => ({
            id: notification.id,
            type: notification.type,
            category: notification.category,
            title: notification.title,
            message: notification.message,
            timestamp: notification.createdAt.toISOString(),
            read: notification.read,
            priority: notification.priority,
            actionable: notification.actionUrl
                ? {
                    label: notification.actionLabel || 'View',
                    href: notification.actionUrl,
                }
                : undefined,
            metadata: notification.metadata,
        }));
    }
    async create(userId, dto) {
        const notification = await this.prisma.notifications.create({
            data: {
                userId,
                type: dto.type,
                category: dto.category,
                title: dto.title,
                message: dto.message,
                priority: dto.priority || 'medium',
                actionUrl: dto.actionable?.href,
                actionLabel: dto.actionable?.label,
                metadata: dto.metadata || {},
                read: false,
            },
        });
        return {
            id: notification.id,
            type: notification.type,
            category: notification.category,
            title: notification.title,
            message: notification.message,
            timestamp: notification.createdAt.toISOString(),
            read: notification.read,
            priority: notification.priority,
            actionable: notification.actionUrl
                ? {
                    label: notification.actionLabel || 'View',
                    href: notification.actionUrl,
                }
                : undefined,
            metadata: notification.metadata,
        };
    }
    async markAsRead(notificationId, userId) {
        const notification = await this.prisma.notifications.findFirst({
            where: { id: notificationId, userId },
        });
        if (!notification) {
            throw new common_1.NotFoundException('Notification not found');
        }
        await this.prisma.notifications.update({
            where: { id: notificationId },
            data: { read: true },
        });
        return { message: 'Notification marked as read' };
    }
    async markAllAsRead(userId) {
        await this.prisma.notifications.updateMany({
            where: { userId, read: false },
            data: { read: true },
        });
        return { message: 'All notifications marked as read' };
    }
    async delete(notificationId, userId) {
        const notification = await this.prisma.notifications.findFirst({
            where: { id: notificationId, userId },
        });
        if (!notification) {
            throw new common_1.NotFoundException('Notification not found');
        }
        await this.prisma.notifications.delete({
            where: { id: notificationId },
        });
        return { message: 'Notification deleted successfully' };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map