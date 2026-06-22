import { Module } from '@nestjs/common';
import { ClientBidsController } from './client-bids.controller';
import { ClientBidsService } from './client-bids.service';
import { AhpTopsisService } from './ahp-topsis.service';

@Module({
  controllers: [ClientBidsController],
  providers: [ClientBidsService, AhpTopsisService],
  exports: [ClientBidsService],
})
export class ClientBidsModule {}
