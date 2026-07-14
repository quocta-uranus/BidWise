import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AhpTopsisService, BidCriteria } from './ahp-topsis.service';

@Injectable()
export class ClientBidsService {
  constructor(
    private prisma: PrismaService,
    private topsis: AhpTopsisService,
  ) {}

  async getRankedBids(jobId: string, clientId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId, deletedAt: null },
      include: {
        ahpWeight: true,
        bids: {
          where: { status: { notIn: ['WITHDRAWN'] } },
          include: {
            freelancer: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                bio: true,
                freelancerProfile: {
                  select: {
                    skills: true,
                    experience: true,
                    hourlyRate: true,
                    assessmentCompleted: true,
                    assessmentScore: true,
                    assessmentLevel: true,
                    portfolioItems: { select: { id: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!job) throw new NotFoundException('JOB_NOT_FOUND');
    if (job.clientId !== clientId) throw new ForbiddenException('NOT_JOB_OWNER');

    const weights = job.ahpWeight ?? {
      priceWeight: 30,
      skillWeight: 25,
      experienceWeight: 15,
      ratingWeight: 15,
      speedWeight: 5,
      deadlineWeight: 5,
      portfolioWeight: 5,
    };

    const jobBudget = Number(job.budget ?? job.fixedBudget ?? job.minBudget ?? 1000);
    const jobDeadlineDays = Math.max(
      1,
      Math.ceil((new Date(job.deadline).getTime() - Date.now()) / 86400000),
    );

    const criteria: BidCriteria[] = job.bids.map((bid) => {
      const fp = bid.freelancer.freelancerProfile;
      const jobSkills = (job.skills ?? []).map((s: string) => s.toLowerCase());
      const flSkills = (fp?.skills ?? []).map((s: string) => s.toLowerCase());
      const matched = jobSkills.filter((s: string) => flSkills.includes(s)).length;
      const skillMatch = jobSkills.length > 0 ? (matched / jobSkills.length) * 100 : 50;

      const expYears = fp?.experience
        ? parseInt(fp.experience.match(/\d+/)?.[0] ?? '0', 10)
        : 0;

      const rating = fp?.assessmentScore ?? 50;
      const deliveryDays = bid.days ?? 30;
      const deadlineFit = Math.max(0, jobDeadlineDays - deliveryDays);
      const portfolioScore = Math.min(100, (fp?.portfolioItems?.length ?? 0) * 20);

      return {
        bidId: bid.id,
        freelancerId: bid.freelancerId,
        price: Number(bid.amount),
        skillMatch,
        experience: expYears,
        rating,
        speed: deliveryDays,
        deadlineFit,
        portfolioScore,
      };
    });

    const ranked = this.topsis.rank(criteria, weights as any);

    const rankedMap = new Map(ranked.map((r) => [r.bidId, r]));

    const result = job.bids.map((bid) => {
      const topsisData = rankedMap.get(bid.id);
      const fp = bid.freelancer.freelancerProfile;

      return {
        id: bid.id,
        jobId: bid.jobId,
        freelancerId: bid.freelancerId,
        freelancer: {
          id: bid.freelancer.id,
          fullName: bid.freelancer.fullName,
          avatarUrl: bid.freelancer.avatarUrl,
          bio: bid.freelancer.bio,
          skills: fp?.skills ?? [],
          experience: fp?.experience,
          hourlyRate: fp?.hourlyRate,
          assessmentLevel: fp?.assessmentLevel,
          portfolioCount: fp?.portfolioItems?.length ?? 0,
        },
        amount: Number(bid.amount),
        days: bid.days,
        coverLetter: bid.coverLetter,
        status: bid.status,
        matchingScore: bid.matchingScore,
        matchBreakdown: bid.matchBreakdown,
        submittedAt: bid.submittedAt,
        isTemplateBid: bid.isTemplateBid,
        spamScore: bid.spamScore,
        topsisScore: topsisData?.topsisScore ?? 0,
        rank: topsisData?.rank ?? 999,
        scoreBreakdown: topsisData
          ? {
              normalizedCriteria: topsisData.normalizedCriteria,
              weightedCriteria: topsisData.weightedCriteria,
              distanceToIdeal: topsisData.distanceToIdeal,
              distanceToNegIdeal: topsisData.distanceToNegIdeal,
            }
          : null,
      };
    });

    result.sort((a, b) => a.rank - b.rank);

    return {
      jobId,
      auctionType: job.auctionType,
      weights,
      bids: result,
      totalBids: result.length,
    };
  }

  async shortlistBid(jobId: string, bidId: string, clientId: string) {
    await this.verifyJobOwner(jobId, clientId);
    const bid = await this.getBidForJob(bidId, jobId);

    if (bid.status !== 'PENDING' && bid.status !== 'SHORTLISTED') {
      throw new BadRequestException('BID_CANNOT_BE_SHORTLISTED');
    }

    const newStatus = bid.status === 'SHORTLISTED' ? 'PENDING' : 'SHORTLISTED';

    return this.prisma.bid.update({
      where: { id: bidId },
      data: { status: newStatus as any },
      select: { id: true, status: true },
    });
  }

  async decideBid(jobId: string, bidId: string, clientId: string, action: 'ACCEPTED' | 'REJECTED', reason?: string) {
    await this.verifyJobOwner(jobId, clientId);
    const bid = await this.getBidForJob(bidId, jobId);

    if (bid.status === 'ACCEPTED' || bid.status === 'REJECTED' || bid.status === 'WITHDRAWN') {
      throw new BadRequestException('BID_ALREADY_DECIDED');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.bid.update({
        where: { id: bidId },
        data: { status: action as any },
      });

      // If rejecting, just return
      if (action === 'REJECTED') return result;

      // If accepting, reject all other bids and update job status
      await tx.bid.updateMany({
        where: { jobId, id: { not: bidId }, status: { notIn: ['WITHDRAWN', 'REJECTED'] as any } },
        data: { status: 'REJECTED' as any },
      });

      await tx.job.update({
        where: { id: jobId },
        data: { status: 'IN_PROGRESS' as any },
      });

      return result;
    });

    return { bid: updated, action, reason };
  }

  async compareBids(jobId: string, bidIds: string[], clientId: string) {
    await this.verifyJobOwner(jobId, clientId);

    if (bidIds.length < 2 || bidIds.length > 4) {
      throw new BadRequestException('COMPARE_2_TO_4_BIDS');
    }

    const bids = await this.prisma.bid.findMany({
      where: { id: { in: bidIds }, jobId },
      include: {
        freelancer: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            freelancerProfile: {
              select: {
                skills: true,
                experience: true,
                hourlyRate: true,
                assessmentScore: true,
                assessmentLevel: true,
                portfolioItems: { select: { id: true } },
              },
            },
          },
        },
      },
    });

    return bids.map((bid) => {
      const fp = bid.freelancer.freelancerProfile;
      return {
        id: bid.id,
        freelancer: {
          id: bid.freelancer.id,
          fullName: bid.freelancer.fullName,
          avatarUrl: bid.freelancer.avatarUrl,
          skills: fp?.skills ?? [],
          experience: fp?.experience,
          hourlyRate: fp?.hourlyRate,
          assessmentScore: fp?.assessmentScore,
          assessmentLevel: fp?.assessmentLevel,
          portfolioCount: fp?.portfolioItems?.length ?? 0,
        },
        amount: Number(bid.amount),
        days: bid.days,
        coverLetter: bid.coverLetter,
        status: bid.status,
        matchingScore: bid.matchingScore,
        matchBreakdown: bid.matchBreakdown,
      };
    });
  }

  async getFreelancerProfileFromBid(jobId: string, bidId: string, clientId: string) {
    await this.verifyJobOwner(jobId, clientId);
    const bid = await this.prisma.bid.findFirst({
      where: { id: bidId, jobId },
      include: {
        freelancer: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            bio: true,
            createdAt: true,
            freelancerProfile: {
              include: {
                portfolioItems: true,
                certificates: true,
              },
            },
          },
        },
      },
    });

    if (!bid) throw new NotFoundException('BID_NOT_FOUND');
    return bid.freelancer;
  }

  private async verifyJobOwner(jobId: string, clientId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId, deletedAt: null },
      select: { clientId: true },
    });
    if (!job) throw new NotFoundException('JOB_NOT_FOUND');
    if (job.clientId !== clientId) throw new ForbiddenException('NOT_JOB_OWNER');
    return job;
  }

  private async getBidForJob(bidId: string, jobId: string) {
    const bid = await this.prisma.bid.findFirst({ where: { id: bidId, jobId } });
    if (!bid) throw new NotFoundException('BID_NOT_FOUND');
    return bid;
  }
}
