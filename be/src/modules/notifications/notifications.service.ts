import { Injectable, Logger } from '@nestjs/common';

export enum NotificationType {
  JOB_MATCH = 'JOB_MATCH',
  BID_STATUS = 'BID_STATUS',
  BID_VIEWED = 'BID_VIEWED',
  JOB_SAVED = 'JOB_SAVED',
  SYSTEM = 'SYSTEM',
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  // Stub: Notification table doesn't exist in DB
  // In production, implement via email queue or external notification service
  async list(userId: string, options: { unreadOnly?: boolean; page?: number; limit?: number } = {}) {
    this.logger.warn(`NotificationsService.list called but Notification model doesn't exist. userId=${userId}`);
    return {
      data: [],
      unreadCount: 0,
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
    };
  }

  async markRead(userId: string, id: string) {
    this.logger.warn(`NotificationsService.markRead called but Notification model doesn't exist. id=${id}`);
    return { id, isRead: true };
  }

  async markAllRead(userId: string) {
    this.logger.warn(`NotificationsService.markAllRead called but Notification model doesn't exist. userId=${userId}`);
    return { updated: 0 };
  }

  async notify(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    metadata?: any,
    sendEmail = true,
  ) {
    this.logger.log(`[NOTIFICATION] user=${userId} type=${type} title=${title} body=${body}`);
    return { id: 'stub-notification', type, title, body, metadata };
  }
}
