import { api } from './client';

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

export interface BrowseFreelancer {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  skills: string[];
  experience: string | null;
  hourlyRate: number | null;
  assessmentLevel: string | null;
  assessmentScore: number | null;
  reputationTier: string;
  available: boolean;
}

export const recommendationApi = {
  // MC-09 / FL-09: recommended jobs for logged-in freelancer
  getRecommendedJobs: (limit = 10): Promise<RecommendedJob[]> =>
    api
      .get<{ data: RecommendedJob[] }>('/recommendations/jobs', { params: { limit } })
      .then((r) => r.data.data),

  // MC-09 / CL-17: recommended freelancers for a specific job
  getRecommendedFreelancers: (jobId: string, limit = 10): Promise<RecommendedFreelancer[]> =>
    api
      .get<{ data: RecommendedFreelancer[] }>(`/recommendations/freelancers/${jobId}`, {
        params: { limit },
      })
      .then((r) => r.data.data),

  // Browse all available freelancers with optional search/skill filter
  browseFreelancers: (params?: {
    search?: string;
    skill?: string;
    limit?: number;
  }): Promise<BrowseFreelancer[]> =>
    api
      .get<{ data: BrowseFreelancer[] }>('/recommendations/freelancers', { params })
      .then((r) => r.data.data),

  // MC-08: Trigger skill vector rebuild for logged-in freelancer
  rebuildVector: (): Promise<{ success: boolean }> =>
    api
      .post<{ data: { success: boolean } }>('/recommendations/rebuild-vector')
      .then((r) => r.data.data),
};
