import { Module } from '@nestjs/common';
import { ClientContractsController, FreelancerContractsController, CommonContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';

@Module({
  controllers: [ClientContractsController, FreelancerContractsController, CommonContractsController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}
