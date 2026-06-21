import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { BidsService } from './bids.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateBidDto, UpdateBidDto } from './dto/bid.dto';
import { RoleType } from '@prisma/client';

@Controller('bids')
@UseGuards(RolesGuard)
@Roles(RoleType.FREELANCER)
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  // FL-12
  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateBidDto) {
    return this.bidsService.createBid(user.sub, dto);
  }

  // FL-16
  @Get('my')
  list(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bidsService.listMyBids(user.sub, {
      status,
      page: Math.max(1, Number(page) || 1),
      limit: Math.min(50, Math.max(1, Number(limit) || 20)),
    });
  }

  // FL-18
  @Get('my/stats')
  stats(@CurrentUser() user: any) {
    return this.bidsService.getMyStats(user.sub);
  }

  // FL-13
  @Get(':id/match')
  match(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bidsService.getBidMatch(user.sub, id);
  }

  // FL-17
  @Get('cover-letter/suggest')
  suggest(@CurrentUser() user: any, @Query('jobId') jobId: string) {
    return this.bidsService.suggestCoverLetter(user.sub, jobId);
  }

  // FL-14
  @Put(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateBidDto) {
    return this.bidsService.updateBid(user.sub, id, dto);
  }

  // FL-15
  @Delete(':id')
  withdraw(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bidsService.withdrawBid(user.sub, id);
  }
}
