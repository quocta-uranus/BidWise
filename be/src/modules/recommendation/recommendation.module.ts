import { Module } from '@nestjs/common';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { SkillGraphService } from './skill-graph.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RecommendationController],
  providers: [RecommendationService, SkillGraphService],
  exports: [RecommendationService, SkillGraphService],
})
export class RecommendationModule {}
