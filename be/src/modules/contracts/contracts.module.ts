import { Module } from '@nestjs/common';
import { ClientContractsController, FreelancerContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';

@Module({
  controllers: [ClientContractsController, FreelancerContractsController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}
