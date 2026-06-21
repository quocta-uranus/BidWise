import { Module } from '@nestjs/common';
import { FreelancerController } from './freelancer.controller';
import { FreelancerService } from './freelancer.service';
import { ProfileCompletenessService } from './services/profile-completeness.service';
import { FileStorageService } from './services/file-storage.service';

@Module({
  controllers: [FreelancerController],
  providers: [FreelancerService, ProfileCompletenessService, FileStorageService],
  exports: [FreelancerService, ProfileCompletenessService],
})
export class FreelancerModule {}
