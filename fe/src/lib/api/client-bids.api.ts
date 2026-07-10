import { api } from './client';

export interface RankedBid {
  id: string;
  jobId: string;
  freelancerId: string;
  freelancer: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    bio: string | null;
    skills: string[];
    experience: string | null;
    hourlyRate: number | null;
    assessmentLevel: string | null;
    portfolioCount: number;
  };
  amount: number;
  days: number | null;
  coverLetter: string | null;
  status: string;
  matchingScore: number | null;
  matchBreakdown: any;
  submittedAt: string;
  topsisScore: number;
  rank: number;
  scoreBreakdown: {
    normalizedCriteria: Record<string, number>;
    weightedCriteria: Record<string, number>;
    distanceToIdeal: number;
    distanceToNegIdeal: number;
  } | null;
}

export interface RankedBidsResponse {
  jobId: string;
  auctionType: string;
  weights: Record<string, number>;
  bids: RankedBid[];
  totalBids: number;
}

export interface FreelancerFullProfile {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  freelancerProfile: {
    skills: string[];
    experience: string | null;
    hourlyRate: number | null;
    assessmentLevel: string | null;
    assessmentScore: number | null;
    portfolioItems: any[];
    certificates: any[];
  } | null;
  reviews?: Array<{
    id: string;
    reviewerName: string;
    rating: number;
    comment: string;
    date: string;
  }>;
}

export const clientBidsApi = {
  getRankedBids: async (jobId: string): Promise<RankedBidsResponse> => {
    const res = await api.get(`/client/jobs/${jobId}/bids`);
    return res.data.data;
  },

  compareBids: async (jobId: string, bidIds: string[]): Promise<RankedBid[]> => {
    const res = await api.post(`/client/jobs/${jobId}/bids/compare`, { bidIds });
    return res.data.data;
  },

  shortlistBid: async (jobId: string, bidId: string) => {
    const res = await api.patch(`/client/jobs/${jobId}/bids/${bidId}/shortlist`);
    return res.data.data;
  },

  decideBid: async (jobId: string, bidId: string, action: 'ACCEPTED' | 'REJECTED', reason?: string) => {
    const res = await api.patch(`/client/jobs/${jobId}/bids/${bidId}/decide`, { action, reason });
    return res.data.data;
  },

  getFreelancerProfile: async (jobId: string, bidId: string): Promise<FreelancerFullProfile> => {
    const res = await api.get(`/client/jobs/${jobId}/bids/${bidId}/freelancer`);
    return res.data.data;
  },
};
