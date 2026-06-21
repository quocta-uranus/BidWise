import { Module } from '@nestjs/common';
import { FreelancerProfileController } from './freelancer-profile.controller';
import { FreelancerProfileService } from './freelancer-profile.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [FreelancerProfileController],
  providers: [FreelancerProfileService],
  exports: [FreelancerProfileService],
})
export class FreelancerProfileModule {}
