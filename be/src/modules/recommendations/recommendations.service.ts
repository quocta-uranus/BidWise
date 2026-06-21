import { Injectable, NotFoundException } from '@nestjs/common';
import { TfIdf } from 'natural';
import { PrismaService } from '../prisma/prisma.service';

export interface JobRecommendation {
  job: any;
  score: number;
  reasons: string[];
}

@Injectable()
export class RecommendationsService {
  constructor(private prisma: PrismaService) {}

  // FL-09: Content-based recommendation using TF-IDF + cosine similarity.
  // Cold-start safe: uses the freelancer's skills[] from profile.
  async recommendForFreelancer(
    userId: string,
    options: { limit?: number; minScore?: number } = {},
  ): Promise<JobRecommendation[]> {
    const { limit = 20, minScore = 0.05 } = options;

    const profile = await this.prisma.freelancerProfile.findUnique({
      where: { userId },
      include: {
        portfolios: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!profile) throw new NotFoundException('FREELANCER_PROFILE_NOT_FOUND');

    // Build freelancer text corpus from: skills + experience + portfolio titles/descs
    const profileCorpus = this.buildProfileCorpus(profile);

    if (profileCorpus.length === 0) {
      return this.fallbackBySkills(profile.skills ?? [], limit);
    }

    const openJobs = await this.prisma.job.findMany({
      where: { status: 'OPEN', deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    if (openJobs.length === 0) return [];

    // Build TF-IDF index: each "doc" is a job, plus profile as query doc
    const tfidf = new TfIdf();
    openJobs.forEach((job) => tfidf.addDocument(this.buildJobCorpus(job)));
    tfidf.addDocument(profileCorpus);

    const profileDocIdx = openJobs.length;
    const results: JobRecommendation[] = [];

    for (let i = 0; i < openJobs.length; i++) {
      const score = this.cosineSimilarity(
        this.docToVector(tfidf, profileDocIdx),
        this.docToVector(tfidf, i),
      );
      if (score >= minScore) {
        results.push({
          job: openJobs[i],
          score: Number(score.toFixed(4)),
          reasons: this.explainMatch(openJobs[i], profile),
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a.length || !b.length || a.length !== b.length) return 0;
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    if (!na || !nb) return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
  }

  private buildProfileCorpus(profile: any): string {
    const parts: string[] = [];
    if (Array.isArray(profile.skills)) parts.push(...profile.skills);
    if (profile.experience) parts.push(profile.experience);
    if (Array.isArray(profile.portfolios)) {
      for (const p of profile.portfolios) {
        if (p.title) parts.push(p.title);
        if (p.desc) parts.push(p.desc);
      }
    }
    return parts.join(' ').toLowerCase();
  }

  private buildJobCorpus(job: any): string {
    const parts: string[] = [];
    if (job.title) parts.push(job.title);
    if (job.description) parts.push(job.description);
    if (job.category) parts.push(job.category);
    // job.skills is String[]
    if (Array.isArray(job.skills)) parts.push(...job.skills);
    return parts.join(' ').toLowerCase();
  }

  private docToVector(tfidf: TfIdf, docIdx: number): number[] {
    const terms = new Set<string>();
    tfidf.listTerms(docIdx).forEach((t) => terms.add(t.term));
    return Array.from(terms).map((t) => tfidf.tfidf(t, docIdx));
  }

  private explainMatch(job: any, profile: any): string[] {
    const reasons: string[] = [];
    // job.skills is String[]
    const jobSkills = (job.skills ?? []).map((s: string) => s.toLowerCase());
    const profileSkills = (profile.skills ?? []).map((s: string) => s.toLowerCase());

    const matched = jobSkills.filter((s: string) => profileSkills.includes(s));
    if (matched.length) {
      reasons.push(`Khớp ${matched.length} kỹ năng: ${matched.slice(0, 3).join(', ')}`);
    }
    if (job.category) {
      reasons.push(`Thuộc danh mục ${job.category}`);
    }
    if (job.deadline && new Date(job.deadline) > new Date()) {
      const days = Math.ceil(
        (new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      reasons.push(`Deadline còn ${days} ngày`);
    }
    return reasons;
  }

  private async fallbackBySkills(
    skills: string[],
    limit: number,
  ): Promise<JobRecommendation[]> {
    if (!skills.length) {
      const jobs = await this.prisma.job.findMany({
        where: { status: 'OPEN', deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      return jobs.map((job) => ({ job, score: 0.1, reasons: ['Fallback: mới đăng'] }));
    }

    const jobs = await this.prisma.job.findMany({
      where: {
        status: 'OPEN',
        deletedAt: null,
        skills: { hasSome: skills },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return jobs.map((job) => ({
      job,
      score: 0.5,
      reasons: ['Cold-start: match theo kỹ năng đã khai báo'],
    }));
  }
}
