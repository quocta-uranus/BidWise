import { Module } from '@nestjs/common';
import { ClientBidsController, AhpController } from './client-bids.controller';
import { ClientBidsService } from './client-bids.service';
import { AhpTopsisService } from './ahp-topsis.service';
import { AhpPresetsService } from './ahp-presets.service';

@Module({
  controllers: [ClientBidsController, AhpController],
  providers: [ClientBidsService, AhpTopsisService, AhpPresetsService],
  exports: [ClientBidsService, AhpTopsisService, AhpPresetsService],
})
export class ClientBidsModule {}
