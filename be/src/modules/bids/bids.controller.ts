import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { IsIn, IsOptional } from 'class-validator';
import { BidsService } from './bids.service';
import { CreateBidDto, CoverLetterSuggestDto, UpdateBidDto } from './dto/bid.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessTokenPayload } from '../../common/types/jwt-payload.type';
import { BID_STATUS } from '../bidding/constants/bidding.constants';
import type { BidStatus } from '../bidding/constants/bidding.constants';

class ListBidsQueryDto {
  @IsOptional()
  @IsIn(Object.values(BID_STATUS))
  status?: BidStatus;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bids')
export class BidsController {
  constructor(private bidsService: BidsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleType.FREELANCER)
  submitBid(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateBidDto) {
    return this.bidsService.submitBid(user.sub, dto);
  }

  @Get('me')
  @Roles(RoleType.FREELANCER)
  listMyBids(@CurrentUser() user: AccessTokenPayload, @Query() query: ListBidsQueryDto) {
    return this.bidsService.listMyBids(user.sub, query.status);
  }

  @Get('me/stats')
  @Roles(RoleType.FREELANCER)
  getStats(@CurrentUser() user: AccessTokenPayload) {
    return this.bidsService.getStats(user.sub);
  }

  @Get('me/quota')
  @Roles(RoleType.FREELANCER)
  getQuota(@CurrentUser() user: AccessTokenPayload) {
    return this.bidsService.getQuota(user.sub);
  }

  @Post('cover-letter-suggest')
  @Roles(RoleType.FREELANCER)
  suggestCoverLetter(@CurrentUser() user: AccessTokenPayload, @Body() dto: CoverLetterSuggestDto) {
    return this.bidsService.suggestCoverLetter(user.sub, dto.jobId);
  }

  @Get(':id')
  @Roles(RoleType.FREELANCER)
  getBid(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.bidsService.getBid(id, user.sub);
  }

  @Patch(':id')
  @Roles(RoleType.FREELANCER)
  updateBid(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() dto: UpdateBidDto,
  ) {
    return this.bidsService.updateBid(id, user.sub, dto);
  }

  @Delete(':id')
  @Roles(RoleType.FREELANCER)
  withdrawBid(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.bidsService.withdrawBid(id, user.sub);
  }
}
