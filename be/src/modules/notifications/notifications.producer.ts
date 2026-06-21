import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

export enum NotificationType {
  JOB_MATCH = 'JOB_MATCH',
  BID_STATUS = 'BID_STATUS',
  BID_VIEWED = 'BID_VIEWED',
  JOB_SAVED = 'JOB_SAVED',
  SYSTEM = 'SYSTEM',
}

export interface EmailJobData {
  userId: string;
  notificationId?: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: any;
}

@Injectable()
export class NotificationsProducer {
  private readonly logger = new Logger(NotificationsProducer.name);

  constructor(@InjectQueue('email-notifications') private readonly emailQueue: Queue) {}

  async enqueueEmail(data: EmailJobData) {
    try {
      await this.emailQueue.add(
        'send-email',
        data,
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        },
      );
      this.logger.log(`Enqueued email job for user=${data.userId} type=${data.type}`);
    } catch (err) {
      this.logger.error(`Failed to enqueue email: ${(err as Error).message}`);
    }
  }
}
