import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FreelancerProfileService {
  constructor(private prisma: PrismaService) {}

  async getOrCreate(userId: string) {
    let profile = await this.prisma.freelancerProfile.findUnique({ where: { userId } });
    if (!profile) {
      profile = await this.prisma.freelancerProfile.create({ data: { userId } });
    }
    return profile;
  }

  async getWithUser(userId: string) {
    await this.getOrCreate(userId);
    return this.prisma.freelancerProfile.findUnique({
      where: { userId },
      include: {
        portfolios: true,
        certifications: true,
      },
    });
  }

  async getQuota(userId: string) {
    const profile = await this.getOrCreate(userId);

    const today = new Date().toISOString().split('T')[0];
    const usedToday = profile.lastBidDate === today ? profile.bidTokensUsed : 0;
    const dailyLimit = Math.max(3, profile.bidTokens - Math.floor(profile.bidPenalties / 3));

    return {
      dailyLimit,
      usedToday,
      remaining: Math.max(0, dailyLimit - usedToday),
      withdrawPenalties: profile.bidPenalties,
      available: profile.available,
      bidTokens: profile.bidTokens,
    };
  }

  async consumeBidToken(userId: string) {
    const profile = await this.getOrCreate(userId);
    const today = new Date().toISOString().split('T')[0];
    const usedToday = profile.lastBidDate === today ? profile.bidTokensUsed : 0;
    const dailyLimit = Math.max(3, profile.bidTokens - Math.floor(profile.bidPenalties / 3));
    if (usedToday >= dailyLimit) throw new BadRequestException('BID_TOKEN_LIMIT_REACHED');

    const updated = await this.prisma.freelancerProfile.update({
      where: { userId },
      data: { bidTokensUsed: usedToday + 1, lastBidDate: today },
    });
    return { remaining: dailyLimit - updated.bidTokensUsed, dailyLimit };
  }

  async recordWithdrawPenalty(userId: string) {
    await this.prisma.freelancerProfile.update({
      where: { userId },
      data: { bidPenalties: { increment: 1 } },
    });
  }
}
