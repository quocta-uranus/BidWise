import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoleType } from '@prisma/client';

@Controller('recommendations')
@UseGuards(RolesGuard)
@Roles(RoleType.FREELANCER)
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  // FL-09
  @Get('jobs')
  recommendJobs(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = Math.min(50, Math.max(1, Number(limit) || 20));
    return this.recommendationsService.recommendForFreelancer(user.sub, {
      limit: parsedLimit,
    });
  }
}
