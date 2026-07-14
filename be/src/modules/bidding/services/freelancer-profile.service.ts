import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// MC-07: Reputation tier → daily bid limit
export const TIER_LIMITS: Record<string, number> = {
  NEW:      5,
  SILVER:   15,
  GOLD:     30,
  VERIFIED: 999, // effectively unlimited
};

// MC-07: Average reputation score → tier
export function scoreToTier(avgScore: number): string {
  if (avgScore >= 4.5) return 'VERIFIED';
  if (avgScore >= 3.5) return 'GOLD';
  if (avgScore >= 2.0) return 'SILVER';
  return 'NEW';
}

// Cold-start bootstrap: map assessment score (0-100) → initial tier
function assessmentScoreToInitialTier(score: number | null): string {
  if (!score) return 'NEW';
  if (score >= 85) return 'SILVER'; // high assessment → start at SILVER
  return 'NEW';
}

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
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { freelancerProfile: true },
    });
  }

  // MC-07: Resolve effective tier — from reputation clusters or cold-start fallback
  async getEffectiveTier(userId: string): Promise<string> {
    const [profile, reputations] = await Promise.all([
      this.getOrCreate(userId),
      this.prisma.skillClusterReputation.findMany({
        where: { freelancerId: userId },
        select: { score: true, reviewCount: true },
      }),
    ]);

    // If the freelancer has received reviews → compute avg reputation score
    const totalReviews = reputations.reduce((s, r) => s + r.reviewCount, 0);
    if (totalReviews > 0) {
      const weightedSum = reputations.reduce(
        (s, r) => s + r.score * r.reviewCount,
        0,
      );
      const avgScore = weightedSum / totalReviews;
      return scoreToTier(avgScore);
    }

    // Cold-start: use stored reputationTier if explicitly set, else bootstrap from assessment
    if (profile.reputationTier && profile.reputationTier !== 'NEW') {
      return profile.reputationTier;
    }
    return assessmentScoreToInitialTier(profile.assessmentScore);
  }

  // MC-07: Sync reputationTier field in DB after reputation changes
  async syncTier(userId: string): Promise<string> {
    const tier = await this.getEffectiveTier(userId);
    await this.prisma.freelancerProfile.update({
      where: { userId },
      data: { reputationTier: tier },
    });
    return tier;
  }

  async getQuota(userId: string) {
    const [profile, tier] = await Promise.all([
      this.getOrCreate(userId),
      this.getEffectiveTier(userId),
    ]);

    const today = new Date().toISOString().split('T')[0];
    const usedToday = profile.lastBidDate === today ? profile.bidTokensUsed : 0;

    // Tier-based daily limit, then subtract penalty deductions
    const tierLimit = TIER_LIMITS[tier] ?? TIER_LIMITS.NEW;
    const penaltyDeduction = Math.floor(profile.bidPenalties / 3);
    const dailyLimit = Math.max(1, tierLimit - penaltyDeduction);

    return {
      tier,
      dailyLimit,
      usedToday,
      remaining: dailyLimit === 999 ? 999 : Math.max(0, dailyLimit - usedToday),
      withdrawPenalties: profile.bidPenalties,
      available: profile.available,
    };
  }

  async consumeBidToken(userId: string) {
    const [profile, tier] = await Promise.all([
      this.getOrCreate(userId),
      this.getEffectiveTier(userId),
    ]);

    const today = new Date().toISOString().split('T')[0];
    const usedToday = profile.lastBidDate === today ? profile.bidTokensUsed : 0;
    const tierLimit = TIER_LIMITS[tier] ?? TIER_LIMITS.NEW;
    const penaltyDeduction = Math.floor(profile.bidPenalties / 3);
    const dailyLimit = Math.max(1, tierLimit - penaltyDeduction);

    // VERIFIED tier is unlimited
    if (tierLimit !== 999 && usedToday >= dailyLimit) {
      throw new BadRequestException('BID_TOKEN_LIMIT_REACHED');
    }

    const updated = await this.prisma.freelancerProfile.update({
      where: { userId },
      data: { bidTokensUsed: usedToday + 1, lastBidDate: today },
    });

    return {
      tier,
      remaining: tierLimit === 999 ? 999 : Math.max(0, dailyLimit - updated.bidTokensUsed),
      dailyLimit,
    };
  }

  async recordWithdrawPenalty(userId: string) {
    await this.prisma.freelancerProfile.update({
      where: { userId },
      data: { bidPenalties: { increment: 1 } },
    });
  }
}
