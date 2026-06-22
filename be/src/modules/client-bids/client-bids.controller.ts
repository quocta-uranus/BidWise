import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { ClientBidsService } from './client-bids.service';
import { BidDecisionDto } from './dto/client-bids.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessTokenPayload } from '../../common/types/jwt-payload.type';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.CLIENT)
@Controller('client/jobs/:jobId/bids')
export class ClientBidsController {
  constructor(private service: ClientBidsService) {}

  // CL-09: Get ranked bids with AHP-TOPSIS scores
  @Get()
  getRankedBids(
    @Param('jobId') jobId: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.service.getRankedBids(jobId, user.sub);
  }

  // CL-11: Compare bids side-by-side
  @Post('compare')
  compareBids(
    @Param('jobId') jobId: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: { bidIds: string[] },
  ) {
    return this.service.compareBids(jobId, body.bidIds, user.sub);
  }

  // CL-12: Toggle shortlist a bid
  @Patch(':bidId/shortlist')
  shortlistBid(
    @Param('jobId') jobId: string,
    @Param('bidId') bidId: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.service.shortlistBid(jobId, bidId, user.sub);
  }

  // CL-13: Accept or reject a bid
  @Patch(':bidId/decide')
  decideBid(
    @Param('jobId') jobId: string,
    @Param('bidId') bidId: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: BidDecisionDto,
  ) {
    return this.service.decideBid(jobId, bidId, user.sub, dto.action, dto.reason);
  }

  // CL-14: View freelancer profile from bid
  @Get(':bidId/freelancer')
  getFreelancerProfile(
    @Param('jobId') jobId: string,
    @Param('bidId') bidId: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.service.getFreelancerProfileFromBid(jobId, bidId, user.sub);
  }
}
