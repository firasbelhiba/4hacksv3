import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
export declare class NotificationsController {
    private notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(userId: string, type?: string, category?: string, priority?: string, read?: string, limit?: string): Promise<{
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
    markAsRead(userId: string, notificationId: string): Promise<{
        message: string;
    }>;
    markAllAsRead(userId: string): Promise<{
        message: string;
    }>;
    delete(notificationId: string, userId: string): Promise<{
        message: string;
    }>;
}
