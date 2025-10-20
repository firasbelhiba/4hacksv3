import { PrismaService } from '@/database/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
export declare class NotificationsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string, filters?: {
        type?: string;
        category?: string;
        priority?: string;
        read?: string;
        limit?: number;
    }): Promise<{
        id: string;
        type: string;
        category: string;
        title: string;
        message: string;
        timestamp: string;
        read: boolean;
        priority: string;
        actionable: {
            label: string;
            href: string;
        };
        metadata: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    create(userId: string, dto: CreateNotificationDto): Promise<{
        id: string;
        type: string;
        category: string;
        title: string;
        message: string;
        timestamp: string;
        read: boolean;
        priority: string;
        actionable: {
            label: string;
            href: string;
        };
        metadata: import("@prisma/client/runtime/library").JsonValue;
    }>;
    markAsRead(notificationId: string, userId: string): Promise<{
        message: string;
    }>;
    markAllAsRead(userId: string): Promise<{
        message: string;
    }>;
    delete(notificationId: string, userId: string): Promise<{
        message: string;
    }>;
}
