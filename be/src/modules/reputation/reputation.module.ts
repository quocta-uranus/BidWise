import { Module } from '@nestjs/common';
import { ReputationController } from './reputation.controller';
import { ReputationService } from './reputation.service';
import { PrismaModule } from '../prisma/prisma.module';

// FreelancerProfileService is globally available via @Global BiddingModule — no explicit import needed
@Module({
  imports: [PrismaModule],
  controllers: [ReputationController],
  providers: [ReputationService],
  exports: [ReputationService],
})
export class ReputationModule {}
