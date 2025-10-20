export declare class CreateNotificationDto {
    type: 'success' | 'warning' | 'error' | 'info';
    category: 'system' | 'evaluation' | 'hackathon' | 'project' | 'performance';
    title: string;
    message: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    actionable?: {
        label: string;
        href: string;
    };
    metadata?: Record<string, any>;
}
