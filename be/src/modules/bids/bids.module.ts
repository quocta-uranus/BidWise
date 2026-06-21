import { Module } from '@nestjs/common';
import { BidsController } from './bids.controller';
import { BidsService } from './bids.service';
import { BiddingModule } from '../bidding/bidding.module';

@Module({
  imports: [BiddingModule],
  controllers: [BidsController],
  providers: [BidsService],
})
export class BidsModule {}
