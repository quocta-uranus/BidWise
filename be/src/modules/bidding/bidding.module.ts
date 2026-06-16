import { Global, Module } from '@nestjs/common';
import { MatchingService } from './services/matching.service';
import { FreelancerProfileService } from './services/freelancer-profile.service';

@Global()
@Module({
  providers: [MatchingService, FreelancerProfileService],
  exports: [MatchingService, FreelancerProfileService],
})
export class BiddingModule {}
