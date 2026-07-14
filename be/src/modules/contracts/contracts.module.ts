import { Module } from '@nestjs/common';
import { ClientContractsController, FreelancerContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { ReputationModule } from '../reputation/reputation.module';

@Module({
  imports: [ReputationModule],
  controllers: [ClientContractsController, FreelancerContractsController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}
