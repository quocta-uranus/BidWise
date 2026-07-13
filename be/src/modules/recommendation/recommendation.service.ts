import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SkillGraphService } from './skill-graph.service';

export interface RecommendedJob {
  jobId: string;
  title: string;
  description: string;
  skills: string[];
  budget: number | null;
  deadline: string;
  similarity: number;
  matchedSkills: string[];
  category: string | null;
  auctionType: string;
  bidCount: number;
}

export interface RecommendedFreelancer {
  freelancerId: string;
  fullName: string;
  avatarUrl: string | null;
  skills: string[];
  hourlyRate: number | null;
  assessmentLevel: string | null;
  assessmentScore: number | null;
  reputationTier: string;
  similarity: number;
  matchedSkills: string[];
  portfolioCount: number;
}

@Injectable()
export class RecommendationService {
  constructor(
    private prisma: PrismaService,
    private skillGraph: SkillGraphService,
  ) {}

  // MC-09: Recommend OPEN jobs for a freelancer (FL-09)
  async getRecommendedJobs(
    freelancerId: string,
    limit = 10,
  ): Promise<RecommendedJob[]> {
    // Get jobs the freelancer has already bid on → exclude them
    const existingBids = await this.prisma.bid.findMany({
      where: { freelancerId, status: { notIn: ['WITHDRAWN'] } },
      select: { jobId: true },
    });
    const excludeJobIds = new Set(existingBids.map((b) => b.jobId));

    const [freelancerDoc, jobs] = await Promise.all([
      this.skillGraph.getFreelancerDocument(freelancerId),
      this.prisma.job.findMany({
        where: {
          status: 'OPEN',
          deletedAt: null,
          id: { notIn: [...excludeJobIds] },
        },
        include: {
          category: { select: { name: true } },
          _count: { select: { bids: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 200, // candidate pool
      }),
    ]);

    if (!freelancerDoc.trim() || jobs.length === 0) return [];

    // Build TF-IDF: [freelancerDoc, job1Doc, job2Doc, ...]
    const jobDocs = jobs.map((j) =>
      this.skillGraph.buildJobDocument({
        title: j.title,
        description: j.description,
        skills: j.skills,
      }),
    );

    const { vectors } = this.skillGraph.buildTfIdfVectors([
      freelancerDoc,
      ...jobDocs,
    ]);

    const flVec = vectors[0];
    const freelancerTokens = new Set(this.skillGraph.tokenize(freelancerDoc));

    const scored = jobs.map((job, i) => {
      const similarity = this.skillGraph.cosineSimilarity(flVec, vectors[i + 1]);
      const matchedSkills = job.skills.filter((s) =>
        freelancerTokens.has(s.toLowerCase()),
      );
      return {
        jobId: job.id,
        title: job.title,
        description: job.description.slice(0, 200),
        skills: job.skills,
        budget: job.budget ?? job.fixedBudget ?? job.minBudget,
        deadline: job.deadline.toISOString(),
        similarity: Math.round(similarity * 10000) / 10000,
        matchedSkills,
        category: job.category?.name ?? null,
        auctionType: job.auctionType,
        bidCount: job._count.bids,
      };
    });

    return scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  // CL-17 browse variant: list available freelancers with optional name/skill search
  async browseFreelancers(search?: string, skill?: string, limit = 50) {
    const users = await this.prisma.user.findMany({
      where: {
        freelancerProfile: { available: true },
        ...(search
          ? {
              OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { bio: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      take: skill ? 300 : limit,
      include: {
        freelancerProfile: {
          select: {
            skills: true,
            experience: true,
            hourlyRate: true,
            assessmentLevel: true,
            assessmentScore: true,
            reputationTier: true,
            available: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let results = users.filter((u) => u.freelancerProfile != null);
    if (skill) {
      const needle = skill.toLowerCase();
      results = results.filter((u) =>
        u.freelancerProfile!.skills.some((s) => s.toLowerCase().includes(needle)),
      );
    }

    return results.slice(0, limit).map((u) => ({
      id: u.id,
      fullName: u.fullName,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
      skills: u.freelancerProfile!.skills,
      experience: u.freelancerProfile!.experience,
      hourlyRate: u.freelancerProfile!.hourlyRate,
      assessmentLevel: u.freelancerProfile!.assessmentLevel,
      assessmentScore: u.freelancerProfile!.assessmentScore,
      reputationTier: u.freelancerProfile!.reputationTier,
      available: true,
    }));
  }

  // MC-09: Recommend available freelancers for a job (CL-17)
  async getRecommendedFreelancers(
    jobId: string,
    limit = 10,
  ): Promise<RecommendedFreelancer[]> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId, deletedAt: null },
      select: {
        title: true,
        description: true,
        skills: true,
      },
    });
    if (!job) return [];

    const jobDoc = this.skillGraph.buildJobDocument({
      title: job.title,
      description: job.description,
      skills: job.skills,
    });

    // Get freelancers with available=true who have at least 1 skill
    const freelancers = await this.prisma.freelancerProfile.findMany({
      where: {
        available: true,
        skills: { isEmpty: false },
      },
      include: {
        portfolioItems: { select: { title: true, desc: true } },
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
      take: 300, // candidate pool
    });

    if (freelancers.length === 0) return [];

    // Build TF-IDF: [jobDoc, fl1Doc, fl2Doc, ...]
    const flDocs = freelancers.map((fp) =>
      this.skillGraph.buildFreelancerDocument({
        skills: fp.skills,
        bio: fp.user.bio,
        portfolioTitles: fp.portfolioItems.map((p) => p.title),
        portfolioDescs: fp.portfolioItems.map((p) => p.desc),
        assessmentLevel: fp.assessmentLevel,
      }),
    );

    const { vectors } = this.skillGraph.buildTfIdfVectors([jobDoc, ...flDocs]);
    const jobVec = vectors[0];
    const jobTokens = new Set(this.skillGraph.tokenize(jobDoc));

    const scored = freelancers.map((fp, i) => {
      const similarity = this.skillGraph.cosineSimilarity(jobVec, vectors[i + 1]);
      const matchedSkills = fp.skills.filter((s) =>
        jobTokens.has(s.toLowerCase()),
      );
      return {
        freelancerId: fp.user.id,
        fullName: fp.user.fullName,
        avatarUrl: fp.user.avatarUrl,
        skills: fp.skills,
        hourlyRate: fp.hourlyRate,
        assessmentLevel: fp.assessmentLevel,
        assessmentScore: fp.assessmentScore,
        reputationTier: fp.reputationTier,
        similarity: Math.round(similarity * 10000) / 10000,
        matchedSkills,
        portfolioCount: fp.portfolioItems.length,
      };
    });

    return scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }
}
