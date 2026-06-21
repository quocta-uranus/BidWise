import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { NotificationsService, NotificationType } from './notifications.service';

@Injectable()
export class JobDigestService {
  private readonly logger = new Logger(JobDigestService.name);

  constructor(
    private prisma: PrismaService,
    private recommendations: RecommendationsService,
    private notifications: NotificationsService,
  ) {}

  // FL-11: dispatch daily digest of matching jobs (in-app + email via queue)
  @Cron(CronExpression.EVERY_DAY_AT_9AM, { timeZone: 'Asia/Ho_Chi_Minh' })
  async dispatchDailyDigest() {
    this.logger.log('Dispatching daily job digest...');

    const freelancers = await this.prisma.freelancerProfile.findMany({
      where: { available: true },
      take: 200,
    });

    for (const f of freelancers) {
      try {
        const recs = await this.recommendations.recommendForFreelancer(f.userId, {
          limit: 5,
          minScore: 0.1,
        });
        if (recs.length === 0) continue;

        const list = recs
          .map((r, i) => `${i + 1}. ${r.job.title} — điểm ${r.score}`)
          .join('\n');

        await this.notifications.notify(
          f.userId,
          NotificationType.JOB_MATCH,
          `${recs.length} job mới phù hợp với bạn`,
          `BidWise gợi ý hôm nay:\n${list}`,
          { jobIds: recs.map((r) => r.job.id) },
          true,
        );
      } catch (err) {
        this.logger.error(`Digest failed for user=${f.userId}: ${(err as Error).message}`);
      }
    }
    this.logger.log('Daily digest dispatch complete');
  }
}
