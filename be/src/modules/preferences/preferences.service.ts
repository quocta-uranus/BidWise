import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PreferencesService {
  constructor(private prisma: PrismaService) {}

  async getOrCreate(userId: string) {
    const profile = await this.prisma.freelancerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('FREELANCER_PROFILE_NOT_FOUND');

    // FreelancerPreference table doesn't exist in DB
    // Return profile preferences from FreelancerProfile
    return {
      freelancerId: userId,
      hourlyRate: profile.hourlyRate,
      available: profile.available,
      skills: profile.skills,
      experience: profile.experience,
    };
  }

  async update(userId: string, dto: any) {
    const profile = await this.prisma.freelancerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('FREELANCER_PROFILE_NOT_FOUND');

    // Update FreelancerProfile instead of non-existent FreelancerPreference
    return this.prisma.freelancerProfile.update({
      where: { userId },
      data: {
        ...(dto.hourlyRate !== undefined && { hourlyRate: dto.hourlyRate }),
        ...(dto.available !== undefined && { available: dto.available }),
        ...(dto.skills !== undefined && { skills: dto.skills }),
        ...(dto.experience !== undefined && { experience: dto.experience }),
      },
    });
  }
}
