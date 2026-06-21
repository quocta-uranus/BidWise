import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsProducer, EmailJobData, NotificationType } from './notifications.producer';

@Processor('email-notifications')
export class EmailNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailNotificationProcessor.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {
    super();
  }

  async process(job: Job<EmailJobData>): Promise<any> {
    const { userId, type, title, body } = job.data;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      this.logger.warn(`User ${userId} not found, skipping email job ${job.id}`);
      return { skipped: true };
    }
    if (!user.email) return { skipped: true };

    const fullName = user.fullName ?? '';
    const subject = title;

    try {
      // Use the EmailService properly - it has send methods
      await this.emailService.sendEmail(
        user.email,
        subject,
        `<div style="font-family: Arial, sans-serif">
          <h2>${title}</h2>
          <p>Chào ${fullName},</p>
          <p>${body}</p>
          <hr/>
          <small>Loại thông báo: ${type}</small>
        </div>`,
      );
      this.logger.log(`Email sent to ${user.email} for job=${job.id}`);
      return { delivered: true };
    } catch (err) {
      this.logger.error(`Email delivery failed: ${(err as Error).message}`);
      throw err; // BullMQ will retry
    }
  }
}
