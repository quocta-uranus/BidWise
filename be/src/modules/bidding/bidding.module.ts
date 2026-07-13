import { Global, Module } from '@nestjs/common';
import { MatchingService } from './services/matching.service';
import { FreelancerProfileService } from './services/freelancer-profile.service';
import { NlpSpamService } from './services/nlp-spam.service';

@Global()
@Module({
  providers: [MatchingService, FreelancerProfileService, NlpSpamService],
  exports: [MatchingService, FreelancerProfileService, NlpSpamService],
})
export class BiddingModule {}
