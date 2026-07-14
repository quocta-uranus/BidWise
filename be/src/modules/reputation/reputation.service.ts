import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FreelancerProfileService, scoreToTier } from '../bidding/services/freelancer-profile.service';

// Kokkodis (2021): multi-dimensional reputation via weighted moving average per skill cluster
// WMA formula: new_score = old_score * α + review * (1 - α), α = 0.8
const WMA_ALPHA = 0.8;

export const SKILL_CLUSTERS: Record<string, string[]> = {
  frontend: ['react', 'vue', 'angular', 'css', 'html', 'next.js', 'nextjs', 'typescript', 'tailwind', 'javascript', 'svelte', 'sass', 'webpack', 'vite', 'redux'],
  backend:  ['nestjs', 'node.js', 'nodejs', 'python', 'java', 'spring', 'prisma', 'postgresql', 'mongodb', 'redis', 'graphql', 'rest', 'php', 'laravel', 'go', 'golang', 'ruby', 'rails', 'express', 'fastapi', 'django'],
  mobile:   ['react native', 'flutter', 'ios', 'android', 'swift', 'kotlin', 'expo', 'xamarin', 'capacitor'],
  design:   ['figma', 'adobe xd', 'ui/ux', 'ux', 'photoshop', 'illustrator', 'sketch', 'zeplin', 'canva', 'webflow', 'invision'],
  devops:   ['docker', 'kubernetes', 'k8s', 'aws', 'gcp', 'azure', 'ci/cd', 'cicd', 'terraform', 'linux', 'nginx', 'jenkins', 'github actions', 'ansible', 'helm'],
  data:     ['machine learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'spark', 'tableau', 'data science', 'scikit-learn', 'keras', 'sql'],
};

function mapSkillToCluster(skill: string): string | null {
  const normalized = skill.toLowerCase().trim();
  for (const [cluster, keywords] of Object.entries(SKILL_CLUSTERS)) {
    if (keywords.some((k) => normalized.includes(k) || k.includes(normalized))) {
      return cluster;
    }
  }
  return null;
}

export function mapSkillsToCluster(skills: string[]): Set<string> {
  const clusters = new Set<string>();
  for (const skill of skills) {
    const cluster = mapSkillToCluster(skill);
    if (cluster) clusters.add(cluster);
  }
  return clusters;
}

@Injectable()
export class ReputationService {
  constructor(
    private prisma: PrismaService,
    private freelancerProfile: FreelancerProfileService,
  ) {}

  // MC-12: Trigger after milestone APPROVED or contract COMPLETED
  // reviewScore: 1–5 stars provided by client in ReviewMilestoneDto
  async updateAfterReview(
    freelancerId: string,
    jobSkills: string[],
    reviewScore: number,
  ): Promise<void> {
    const score = Math.max(1, Math.min(5, reviewScore));
    const clusters = mapSkillsToCluster(jobSkills);

    // No cluster matched → attribute to 'backend' as general fallback
    if (clusters.size === 0) clusters.add('backend');

    await Promise.all(
      Array.from(clusters).map(async (cluster) => {
        const existing = await this.prisma.skillClusterReputation.findUnique({
          where: { freelancerId_skillCluster: { freelancerId, skillCluster: cluster } },
        });

        if (existing) {
          const newScore = existing.score * WMA_ALPHA + score * (1 - WMA_ALPHA);
          await this.prisma.skillClusterReputation.update({
            where: { id: existing.id },
            data: { score: newScore, reviewCount: { increment: 1 } },
          });
        } else {
          await this.prisma.skillClusterReputation.create({
            data: { freelancerId, skillCluster: cluster, score, reviewCount: 1 },
          });
        }
      }),
    );

    await this.freelancerProfile.syncTier(freelancerId);
  }

  async getReputation(freelancerId: string) {
    const [user, profile, clusters] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: freelancerId },
        select: { fullName: true, avatarUrl: true },
      }),
      this.prisma.freelancerProfile.findUnique({
        where: { userId: freelancerId },
        select: { reputationTier: true, assessmentScore: true, assessmentLevel: true },
      }),
      this.prisma.skillClusterReputation.findMany({
        where: { freelancerId },
        orderBy: { skillCluster: 'asc' },
      }),
    ]);

    const totalReviews = clusters.reduce((s, c) => s + c.reviewCount, 0);
    const overallScore =
      totalReviews > 0
        ? clusters.reduce((s, c) => s + c.score * c.reviewCount, 0) / totalReviews
        : 0;

    const tier = profile?.reputationTier ?? 'NEW';

    return {
      freelancerId,
      fullName: user?.fullName ?? '',
      avatarUrl: user?.avatarUrl ?? null,
      tier,
      overallScore: Math.round(overallScore * 100) / 100,
      totalReviews,
      clusters: clusters.map((c) => ({
        cluster: c.skillCluster,
        score: Math.round(c.score * 100) / 100,
        reviewCount: c.reviewCount,
      })),
      assessmentScore: profile?.assessmentScore ?? null,
      assessmentLevel: profile?.assessmentLevel ?? null,
    };
  }

  async getMarketBenchmark() {
    const rows = await this.prisma.skillClusterReputation.groupBy({
      by: ['skillCluster'],
      _avg: { score: true },
      _sum: { reviewCount: true },
    });

    return rows.map((r) => ({
      cluster: r.skillCluster,
      avgScore: Math.round((r._avg.score ?? 0) * 100) / 100,
      totalReviews: r._sum.reviewCount ?? 0,
    }));
  }

  async getMyReputation(freelancerId: string) {
    const [reputation, benchmark] = await Promise.all([
      this.getReputation(freelancerId),
      this.getMarketBenchmark(),
    ]);

    const benchmarkMap = Object.fromEntries(benchmark.map((b) => [b.cluster, b.avgScore]));

    return {
      ...reputation,
      marketComparison: reputation.clusters.map((c) => ({
        cluster: c.cluster,
        myScore: c.score,
        marketAvg: benchmarkMap[c.cluster] ?? 0,
        delta: Math.round((c.score - (benchmarkMap[c.cluster] ?? 0)) * 100) / 100,
        aboveMarket: c.score > (benchmarkMap[c.cluster] ?? 0),
      })),
    };
  }
}
