import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, filters?: {
    type?: string;
    category?: string;
    priority?: string;
    read?: string;
    limit?: number;
  }) {
    const whereConditions: any = { userId };

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

  async create(userId: string, dto: CreateNotificationDto) {
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

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notifications.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notifications.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return { message: 'Notification marked as read' };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notifications.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return { message: 'All notifications marked as read' };
  }

  async delete(notificationId: string, userId: string) {
    const notification = await this.prisma.notifications.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notifications.delete({
      where: { id: notificationId },
    });

    return { message: 'Notification deleted successfully' };
  }
}
