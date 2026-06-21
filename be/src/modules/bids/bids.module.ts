import { Module } from '@nestjs/common';
import { BidsService } from './bids.service';
import { BidMatchingService } from './bid-matching.service';
import { BidsController } from './bids.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [BidsService, BidMatchingService],
  controllers: [BidsController],
  exports: [BidsService, BidMatchingService],
})
export class BidsModule {}
