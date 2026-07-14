import { Module } from '@nestjs/common';
import { ClientContractsController, FreelancerContractsController, CommonContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { ReputationModule } from '../reputation/reputation.module';

@Module({
  controllers: [ClientContractsController, FreelancerContractsController, CommonContractsController],
  imports: [ReputationModule],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}
