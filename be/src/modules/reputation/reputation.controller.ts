import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ReputationService } from './reputation.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessTokenPayload } from '../../common/types/jwt-payload.type';

@Controller('reputation')
export class ReputationController {
  constructor(private reputationService: ReputationService) {}

  // GET /api/v1/reputation/me — personal reputation + market benchmark
  @Roles('FREELANCER')
  @UseGuards(RolesGuard)
  @Get('me')
  getMyReputation(@CurrentUser() user: AccessTokenPayload) {
    return this.reputationService.getMyReputation(user.sub);
  }

  // GET /api/v1/reputation/:freelancerId — public view (for clients browsing profiles)
  @Public()
  @Get(':freelancerId')
  getReputation(@Param('freelancerId') freelancerId: string) {
    return this.reputationService.getReputation(freelancerId);
  }
}
