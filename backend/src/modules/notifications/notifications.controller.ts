import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('read') read?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.findAll(userId, {
      type,
      category,
      priority,
      read,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notificationsService.create(userId, dto);
  }

  @Post('mark-read')
  async markAsRead(
    @CurrentUser('id') userId: string,
    @Body('notificationId') notificationId: string,
  ) {
    return this.notificationsService.markAsRead(notificationId, userId);
  }

  @Post('mark-all-read')
  async markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  async delete(
    @Param('id') notificationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.delete(notificationId, userId);
  }
}
