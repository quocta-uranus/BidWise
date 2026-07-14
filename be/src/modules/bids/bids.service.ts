import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';
import { MatchingService } from '../bidding/services/matching.service';
import { FreelancerProfileService } from '../bidding/services/freelancer-profile.service';
import { NlpSpamService } from '../bidding/services/nlp-spam.service';
import { AUCTION_TYPE, BID_STATUS, BidStatus, JOB_STATUS } from '../bidding/constants/bidding.constants';
import { CreateBidDto, UpdateBidDto } from './dto/bid.dto';
import type { BidStatus as PrismaBidStatus, JobStatus, AuctionType } from '@prisma/client';

const EDITABLE: BidStatus[] = [BID_STATUS.PENDING, BID_STATUS.SHORTLISTED];

type BidWithJob = {
  id: string;
  jobId: string;
  amount: Prisma.Decimal | number;
  days: number | null;
  coverLetter: string | null;
  fileName: string | null;
  fileUrl: string | null;
  matchingScore: number | null;
  matchBreakdown: Prisma.JsonValue | null;
  status: PrismaBidStatus;
  submittedAt: Date;
  updatedAt: Date;
  job: {
    id: string;
    title: string;
    description: string;
    status: JobStatus;
    auctionType: AuctionType;
    sealedOpenedAt: Date | null;
    editDeadlineHours: number;
    skills: string[];
    budget: number | null;
    minBudget: number | null;
    maxBudget: number | null;
    fixedBudget: number | null;
    client: { fullName: string };
    category: { name: string } | null;
  };
};

type JobForMatching = {
  id: string;
  status: JobStatus;
  auctionType: AuctionType;
  sealedOpenedAt: Date | null;
  editDeadlineHours: number;
  skills: string[];
  budget: number | null;
};

type BidFormatted = {
  id: string;
  jobId: string;
  jobTitle: string;
  clientName: string;
  amount: number;
  days?: number;
  coverLetter?: string;
  fileName?: string;
  fileUrl?: string;
  status: BidStatus;
  matchingScore?: number;
  matchBreakdown?: Record<string, unknown>;
  submittedAt: string;
  updatedAt: string;
  canEdit: boolean;
};

@Injectable()
export class BidsService {
  constructor(
    private prisma: PrismaService,
    private matchingService: MatchingService,
    private freelancerProfileService: FreelancerProfileService,
    private nlpSpam: NlpSpamService,
  ) {}

  private formatBid(bid: BidWithJob): BidFormatted {
    return {
      id: bid.id,
      jobId: bid.jobId,
      jobTitle: bid.job.title,
      clientName: bid.job.client.fullName,
      amount: Number(bid.amount),
      days: bid.days ?? undefined,
      coverLetter: bid.coverLetter ?? undefined,
      fileName: bid.fileName ?? undefined,
      fileUrl: bid.fileUrl ?? undefined,
      status: bid.status,
      matchingScore: bid.matchingScore ?? undefined,
      matchBreakdown: (bid.matchBreakdown as Record<string, unknown> | null) ?? undefined,
      submittedAt: bid.submittedAt.toISOString().split('T')[0],
      updatedAt: bid.updatedAt.toISOString(),
      canEdit: this.canEditBid(
        {
          status: bid.status,
          submittedAt: bid.submittedAt,
        },
        {
          status: bid.job.status,
          auctionType: bid.job.auctionType,
          sealedOpenedAt: bid.job.sealedOpenedAt ?? null,
          editDeadlineHours: bid.job.editDeadlineHours,
        },
      ),
    };
  }

  private canEditBid(
    bid: { status: PrismaBidStatus; submittedAt: Date },
    job: { status: JobStatus; auctionType: AuctionType; sealedOpenedAt: Date | null; editDeadlineHours: number },
  ): boolean {
    if (bid.status !== BID_STATUS.PENDING) return false;
    if (job.status !== JOB_STATUS.OPEN) return false;
    if (job.auctionType === AUCTION_TYPE.SEALED_BID) {
      if (job.sealedOpenedAt) return false;
      const deadline = new Date(bid.submittedAt);
      deadline.setHours(deadline.getHours() + job.editDeadlineHours);
      if (new Date() > deadline) return false;
    }
    return true;
  }

  async submitBid(freelancerId: string, dto: CreateBidDto) {
    const profile = await this.freelancerProfileService.getOrCreate(freelancerId);
    if (!profile.available) throw new BadRequestException('FREELANCER_NOT_AVAILABLE');

    const job = await this.prisma.job.findUnique({
      where: { id: dto.jobId },
      include: { client: { select: { fullName: true } } },
    });
    if (!job) throw new NotFoundException('JOB_NOT_FOUND');
    if (job.status !== JOB_STATUS.OPEN) throw new BadRequestException('JOB_NOT_OPEN');

    const existing = await this.prisma.bid.findUnique({
      where: { jobId_freelancerId: { jobId: dto.jobId, freelancerId } },
    });
    if (existing && existing.status !== BID_STATUS.WITHDRAWN) {
      throw new BadRequestException('BID_ALREADY_EXISTS');
    }

    await this.freelancerProfileService.consumeBidToken(freelancerId);
    const userData = await this.freelancerProfileService.getWithUser(freelancerId);
    const { score, breakdown } = this.matchingService.calculate(
      {
        skills: job.skills,
        budget: job.budget,
        minBudget: job.minBudget,
        maxBudget: job.maxBudget,
        fixedBudget: job.fixedBudget,
      },
      userData?.freelancerProfile ?? null,
      userData,
      dto.amount,
    );

    // MC-06: Anti-Spam NLP check — compare new cover letter against past ones
    const { spamScore, isTemplateBid } = await this.checkCoverLetterSpam(
      freelancerId,
      dto.coverLetter ?? '',
      existing?.id,
    );

    const now = new Date();
    const bid = await this.prisma.$transaction(async (tx) => {
      if (existing?.status === BID_STATUS.WITHDRAWN) {
        return tx.bid.update({
          where: { id: existing.id },
          data: {
            amount: dto.amount,
            days: dto.days,
            coverLetter: dto.coverLetter,
            fileName: dto.fileName,
            fileUrl: dto.fileUrl,
            status: BID_STATUS.PENDING,
            matchingScore: score,
            matchBreakdown: breakdown as unknown as Prisma.InputJsonValue,
            spamScore,
            isTemplateBid,
            submittedAt: now,
            updatedAt: now,
          },
          include: { job: { include: { category: true, client: { select: { fullName: true } } } } },
        });
      }
      return tx.bid.create({
        data: {
          id: randomUUID(),
          jobId: dto.jobId,
          freelancerId,
          amount: dto.amount,
          deliveryDays: dto.days,
          proposal: dto.coverLetter,
          days: dto.days,
          coverLetter: dto.coverLetter,
          fileName: dto.fileName,
          fileUrl: dto.fileUrl,
          matchingScore: score,
          matchBreakdown: breakdown as unknown as Prisma.InputJsonValue,
          spamScore,
          isTemplateBid,
          submittedAt: now,
          updatedAt: now,
        },
        include: { job: { include: { category: true, client: { select: { fullName: true } } } } },
      });
    });

    const quota = await this.freelancerProfileService.getQuota(freelancerId);
    return { bid: this.formatBid(bid), quota, isTemplateBid, spamScore };
  }

  async listMyBids(freelancerId: string, status?: BidStatus) {
    const bids = await this.prisma.bid.findMany({
      where: { freelancerId, ...(status ? { status: status as any } : {}) },
      include: { job: { include: { category: true, client: { select: { fullName: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return bids.map((b: BidWithJob) => this.formatBid(b));
  }

  async getBid(bidId: string, freelancerId: string) {
    const bid = await this.prisma.bid.findFirst({
      where: { id: bidId, freelancerId },
      include: { job: { include: { category: true, client: { select: { fullName: true } } } } },
    });
    if (!bid) throw new NotFoundException('BID_NOT_FOUND');
    return this.formatBid(bid);
  }

  async updateBid(bidId: string, freelancerId: string, dto: UpdateBidDto) {
    const bid = await this.prisma.bid.findFirst({
      where: { id: bidId, freelancerId },
      include: { job: true },
    });
    if (!bid) throw new NotFoundException('BID_NOT_FOUND');
    if (!this.canEditBid(bid, bid.job)) throw new ForbiddenException('BID_NOT_EDITABLE');

    const amount = dto.amount ?? Number(bid.amount);
    const userData = await this.freelancerProfileService.getWithUser(freelancerId);
    const { score, breakdown } = this.matchingService.calculate(
      {
        skills: bid.job.skills,
        budget: bid.job.budget,
        minBudget: bid.job.minBudget,
        maxBudget: bid.job.maxBudget,
        fixedBudget: bid.job.fixedBudget,
      },
      userData?.freelancerProfile ?? null,
      userData,
      amount,
    );

    const updated = await this.prisma.bid.update({
      where: { id: bidId },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.days !== undefined && { days: dto.days }),
        ...(dto.coverLetter !== undefined && { coverLetter: dto.coverLetter }),
        ...(dto.fileName !== undefined && { fileName: dto.fileName }),
        ...(dto.fileUrl !== undefined && { fileUrl: dto.fileUrl }),
        matchingScore: score,
        matchBreakdown: breakdown as unknown as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
      include: { job: { include: { category: true, client: { select: { fullName: true } } } } },
    });
    return this.formatBid(updated);
  }

  async withdrawBid(bidId: string, freelancerId: string) {
    const bid = await this.prisma.bid.findFirst({
      where: { id: bidId, freelancerId },
      include: { job: { include: { category: true, client: { select: { fullName: true } } } } },
    });
    if (!bid) throw new NotFoundException('BID_NOT_FOUND');
    if (!EDITABLE.includes(bid.status as BidStatus)) {
      throw new BadRequestException('BID_CANNOT_BE_WITHDRAWN');
    }

    const updated = await this.prisma.bid.update({
      where: { id: bidId },
      data: { status: BID_STATUS.WITHDRAWN, updatedAt: new Date() },
      include: { job: { include: { category: true, client: { select: { fullName: true } } } } },
    });
    await this.freelancerProfileService.recordWithdrawPenalty(freelancerId);
    return this.formatBid(updated);
  }

  private async checkCoverLetterSpam(
    freelancerId: string,
    newCoverLetter: string,
    excludeBidId?: string,
  ) {
    if (!newCoverLetter?.trim()) {
      return { spamScore: 0, isTemplateBid: false };
    }
    const pastBids = await this.prisma.bid.findMany({
      where: {
        freelancerId,
        coverLetter: { not: null },
        ...(excludeBidId ? { id: { not: excludeBidId } } : {}),
      },
      select: { coverLetter: true },
      orderBy: { submittedAt: 'desc' },
      take: 50, // check against last 50 bids for performance
    });
    const existingLetters = pastBids
      .map((b) => b.coverLetter ?? '')
      .filter(Boolean);
    return this.nlpSpam.checkSpam(newCoverLetter, existingLetters);
  }

  async getStats(freelancerId: string) {
    const bids = await this.prisma.bid.findMany({
      where: { freelancerId, status: { not: BID_STATUS.WITHDRAWN } },
      include: { job: { select: { category: { select: { name: true } } } } },
    });

    const totalBids = bids.length;
    const acceptedBids = bids.filter((b) => b.status === BID_STATUS.ACCEPTED);
    const winRate = totalBids > 0 ? Math.round((acceptedBids.length / totalBids) * 100) : 0;
    const avgBidPrice =
      totalBids > 0 ? Math.round(bids.reduce((s: number, b: any) => s + Number(b.amount), 0) / totalBids) : 0;

    const byCategory: Record<string, { count: number; accepted: number }> = {};
    for (const bid of bids) {
      const catName = bid.job.category?.name ?? 'Uncategorized';
      if (!byCategory[catName]) byCategory[catName] = { count: 0, accepted: 0 };
      byCategory[catName].count += 1;
      if (bid.status === BID_STATUS.ACCEPTED) byCategory[catName].accepted += 1;
    }

    const byStatus = Object.values(BID_STATUS).reduce(
      (acc, status) => {
        acc[status] = bids.filter((b) => b.status === status).length;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalBids,
      acceptedCount: acceptedBids.length,
      winRate,
      avgBidPrice,
      byStatus,
      byCategory: Object.entries(byCategory).map(([category, data]) => ({
        category,
        bids: data.count,
        accepted: data.accepted,
        winRate: data.count > 0 ? Math.round((data.accepted / data.count) * 100) : 0,
      })),
    };
  }

  async suggestCoverLetter(freelancerId: string, jobId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('JOB_NOT_FOUND');

    const userData = await this.freelancerProfileService.getWithUser(freelancerId);
    const profile = userData?.freelancerProfile;
    const skills = profile?.skills ?? [];
    const matched = job.skills.filter((s: string) => skills.map((x: string) => x.toLowerCase()).includes(s.toLowerCase()));
    const missing = job.skills.filter((s: string) => !matched.includes(s));

    const bullets = [
      `I am interested in "${job.title}" and can deliver within your timeline.`,
      matched.length > 0
        ? `My core strengths: ${matched.join(', ')}.`
        : `Experience with: ${skills.slice(0, 4).join(', ') || 'relevant technologies'}.`,
      profile?.assessmentCompleted
        ? `BidWise assessment completed (${profile.assessmentLevel ?? 'verified'}).`
        : 'Clear communication and milestone-based delivery.',
      missing.length > 0 ? `Can ramp up on: ${missing.join(', ')}.` : 'Skills align with the job description.',
      'Approach: discovery → implementation → testing → handover.',
    ];

    const template = `Dear Client,\n\n${bullets.map((b) => `• ${b}`).join('\n')}\n\nBest regards,\n${userData?.fullName ?? 'Freelancer'}`;
    return { bullets, template };
  }

  async getQuota(freelancerId: string) {
    return this.freelancerProfileService.getQuota(freelancerId);
  }
}
