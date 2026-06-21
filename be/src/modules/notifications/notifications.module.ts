import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsProducer } from './notifications.producer';
import { JobDigestService } from './job-digest.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';

@Module({
  imports: [
    PrismaModule,
    RecommendationsModule,
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host') ?? 'localhost',
          port: config.get<number>('redis.port') ?? 6379,
          password: config.get<string>('redis.password') || undefined,
          tls: process.env.REDIS_URL?.startsWith('rediss://') ? {} : undefined,
        },
      }),
    }),
    BullModule.registerQueue({ name: 'email-notifications' }),
  ],
  providers: [
    NotificationsService,
    NotificationsProducer,
    JobDigestService,
  ],
  controllers: [NotificationsController],
  exports: [NotificationsService, NotificationsProducer],
})
export class NotificationsModule {}
