import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBidDto, UpdateBidDto } from './dto/bid.dto';
import { BidMatchingService } from './bid-matching.service';

@Injectable()
export class BidsService {
  constructor(
    private prisma: PrismaService,
    private matchingService: BidMatchingService,
  ) {}

  // FL-12: submit a bid
  async createBid(userId: string, dto: CreateBidDto) {
    const profile = await this.prisma.freelancerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('FREELANCER_PROFILE_NOT_FOUND');

    const job = await this.prisma.job.findFirst({
      where: { id: dto.jobId, deletedAt: null },
    });
    if (!job) throw new NotFoundException('JOB_NOT_FOUND');
    if (job.status !== 'OPEN') {
      throw new BadRequestException('JOB_NOT_OPEN');
    }
    if (job.deadline && new Date(job.deadline) < new Date()) {
      throw new BadRequestException('JOB_DEADLINE_PASSED');
    }

    // Bid token check (simple daily limit)
    const today = new Date().toISOString().slice(0, 10);
    const limit = 10; // Default token limit
    if (profile.lastBidDate !== today) {
      // reset for new day
      await this.prisma.freelancerProfile.update({
        where: { id: profile.id },
        data: { bidTokensUsed: 0, lastBidDate: today, bidTokens: limit },
      });
      profile.bidTokens = limit;
      profile.bidTokensUsed = 0;
    }
    if (profile.bidTokensUsed >= profile.bidTokens) {
      throw new ForbiddenException('BID_TOKEN_EXHAUSTED');
    }

    // Duplicate bid check
    const existing = await this.prisma.bid.findUnique({
      where: { jobId_freelancerId: { jobId: dto.jobId, freelancerId: userId } },
    });
    if (existing) throw new BadRequestException('BID_ALREADY_SUBMITTED');

    const match = await this.matchingService.computeMatch(userId, job, profile, dto.amount);

    const bid = await this.prisma.$transaction(async (tx) => {
      const newBid = await tx.bid.create({
        data: {
          jobId: dto.jobId,
          freelancerId: userId,
          amount: dto.amount,
          days: dto.deliveryDays,
          coverLetter: dto.proposal,
          matchingScore: match.score,
          matchBreakdown: match.breakdown as any,
        },
      });
      await tx.freelancerProfile.update({
        where: { id: profile.id },
        data: { bidTokensUsed: { increment: 1 } },
      });
      return newBid;
    });

    return { ...bid, matchBreakdown: match.breakdown, matchingScore: match.score };
  }

  // FL-13: get my match details for a bid
  async getBidMatch(userId: string, bidId: string) {
    const bid = await this.prisma.bid.findFirst({
      where: { id: bidId, freelancerId: userId },
      include: { job: true },
    });
    if (!bid) throw new NotFoundException('BID_NOT_FOUND');
    return {
      bidId: bid.id,
      matchingScore: bid.matchingScore,
      matchBreakdown: bid.matchBreakdown,
      job: { id: bid.job.id, title: bid.job.title, skills: bid.job.skills },
    };
  }

  // FL-14: edit bid
  async updateBid(userId: string, bidId: string, dto: UpdateBidDto) {
    const bid = await this.prisma.bid.findFirst({ where: { id: bidId, freelancerId: userId } });
    if (!bid) throw new NotFoundException('BID_NOT_FOUND');
    if (bid.status !== 'PENDING') {
      throw new ForbiddenException('BID_LOCKED');
    }

    const updated = await this.prisma.bid.update({
      where: { id: bidId },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.deliveryDays !== undefined && { days: dto.deliveryDays }),
        ...(dto.proposal !== undefined && { coverLetter: dto.proposal }),
      },
    });
    return updated;
  }

  // FL-15: withdraw bid (with light penalty)
  async withdrawBid(userId: string, bidId: string) {
    const bid = await this.prisma.bid.findFirst({
      where: { id: bidId, freelancerId: userId },
      include: { job: true },
    });
    if (!bid) throw new NotFoundException('BID_NOT_FOUND');
    if (bid.status === 'ACCEPTED') {
      throw new ForbiddenException('CANNOT_WITHDRAW_ACCEPTED');
    }
    if (bid.status === 'WITHDRAWN') {
      return bid;
    }

    const profile = await this.prisma.freelancerProfile.findUnique({ where: { userId } });
    const result = await this.prisma.$transaction(async (tx) => {
      const u = await tx.bid.update({
        where: { id: bidId },
        data: { status: 'WITHDRAWN' },
      });
      if (profile) {
        await tx.freelancerProfile.update({
          where: { id: profile.id },
          data: { bidPenalties: { increment: 1 } },
        });
      }
      return u;
    });
    return result;
  }

  // FL-16: list bids by status
  async listMyBids(
    userId: string,
    options: { status?: string; page?: number; limit?: number } = {},
  ) {
    const { status, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    const where: any = { freelancerId: userId };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.bid.findMany({
        where,
        include: {
          job: { select: { id: true, title: true, status: true, deadline: true, budget: true } },
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.bid.count({ where }),
    ]);
    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  // FL-18: dashboard stats
  async getMyStats(userId: string) {
    const [byStatus, winRate, total, avgBidAgg] = await Promise.all([
      this.prisma.bid.groupBy({
        by: ['status'],
        where: { freelancerId: userId },
        _count: { _all: true },
      }),
      this.prisma.bid.count({ where: { freelancerId: userId, status: 'ACCEPTED' } }),
      this.prisma.bid.count({ where: { freelancerId: userId } }),
      this.prisma.bid.aggregate({
        where: { freelancerId: userId },
        _avg: { amount: true },
      }),
    ]);

    return {
      totalBids: total,
      wonBids: winRate,
      winRate: total ? Number((winRate / total).toFixed(4)) : 0,
      avgBidPrice: avgBidAgg._avg.amount ?? 0,
      byStatus: byStatus.reduce<Record<string, number>>((acc, r) => {
        acc[r.status] = r._count._all;
        return acc;
      }, {}),
    };
  }

  // FL-17: cover letter suggestions (template-based stub)
  async suggestCoverLetter(userId: string, jobId: string) {
    const [profile, job] = await Promise.all([
      this.prisma.freelancerProfile.findUnique({
        where: { userId },
        include: { portfolios: { take: 3, orderBy: { createdAt: 'desc' } } },
      }),
      this.prisma.job.findFirst({
        where: { id: jobId, deletedAt: null },
      }),
    ]);
    if (!profile) throw new NotFoundException('FREELANCER_PROFILE_NOT_FOUND');
    if (!job) throw new NotFoundException('JOB_NOT_FOUND');

    // job.skills is String[] in DB
    const matchedSkills = (job.skills ?? [])
      .filter((s: string) => (profile.skills ?? []).map((x) => x.toLowerCase()).includes(s.toLowerCase()));
    const portfolioSamples = (profile.portfolios ?? []).slice(0, 3);

    return {
      greeting: `Chào bạn, tôi là freelancer trên BidWise.`,
      hook:
        matchedSkills.length > 0
          ? `Tôi có kinh nghiệm trực tiếp với ${matchedSkills.slice(0, 3).join(', ')} — rất phù hợp với job "${job.title}".`
          : `Tôi quan tâm đến job "${job.title}" thuộc danh mục ${job.category}.`,
      relevantWork:
        portfolioSamples.length > 0
          ? `Một số dự án liên quan tôi đã làm:\n${portfolioSamples
              .map((p, idx) => `  ${idx + 1}. ${p.title}${p.desc ? ` — ${p.desc.slice(0, 80)}` : ''}`)
              .join('\n')}`
          : `Tôi sẵn sàng chia sẻ portfolio chi tiết khi nhận phản hồi.`,
      delivery: `Tôi có thể bàn giao trong thời gian thỏa thuận với chất lượng cao.`,
      closing: `Trân trọng,\nFreelancer BidWise`,
      matchedSkills,
    };
  }
}
