import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { RoleType } from '@prisma/client';
import { RecommendationService } from './recommendation.service';
import { SkillGraphService } from './skill-graph.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessTokenPayload } from '../../common/types/jwt-payload.type';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recommendations')
export class RecommendationController {
  constructor(
    private service: RecommendationService,
    private skillGraph: SkillGraphService,
  ) {}

  // MC-09 / FL-09: Get recommended jobs for the logged-in freelancer
  @Roles(RoleType.FREELANCER)
  @Get('jobs')
  getRecommendedJobs(
    @CurrentUser() user: AccessTokenPayload,
    @Query('limit') limit?: string,
  ) {
    return this.service.getRecommendedJobs(user.sub, limit ? +limit : 10);
  }

  // MC-09 / CL-17: Get recommended freelancers for a specific job
  @Roles(RoleType.CLIENT)
  @Get('freelancers/:jobId')
  getRecommendedFreelancers(
    @Param('jobId') jobId: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getRecommendedFreelancers(jobId, limit ? +limit : 10);
  }

  // CL-17 browse: list available freelancers (public, for client ExploreFreelancersTab)
  @Public()
  @Get('freelancers')
  browseFreelancers(
    @Query('search') search?: string,
    @Query('skill') skill?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.browseFreelancers(search, skill, limit ? +limit : 50);
  }

  // MC-08: Rebuild skill vector cache for the logged-in freelancer
  @Roles(RoleType.FREELANCER)
  @Post('rebuild-vector')
  rebuildVector(@CurrentUser() user: AccessTokenPayload) {
    return this.skillGraph
      .buildAndCacheVector(user.sub)
      .then(() => ({ success: true, message: 'Skill vector rebuilt' }));
  }
}
