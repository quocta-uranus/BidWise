import { apiClient } from './client';

export interface MatchBreakdown {
  skills: {
    score: number;
    max: number;
    matched: string[];
    missing: string[];
    explanation: string;
  };
  budget: {
    score: number;
    max: number;
    withinBudget: boolean;
    explanation: string;
  };
  assessment: {
    score: number;
    max: number;
    completed: boolean;
    explanation: string;
  };
  profile: {
    score: number;
    max: number;
    explanation: string;
  };
  total: number;
}

export interface ApiBid {
  id: string;
  jobId: string;
  jobTitle: string;
  clientName: string;
  amount: number;
  days?: number;
  coverLetter?: string;
  fileName?: string;
  fileUrl?: string;
  status: 'PENDING' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED';
  matchingScore?: number;
  matchBreakdown?: MatchBreakdown;
  submittedAt: string;
  updatedAt: string;
  canEdit: boolean;
}

export interface BidStats {
  totalBids: number;
  acceptedCount: number;
  winRate: number;
  avgBidPrice: number;
  byStatus: Record<string, number>;
  byCategory: { category: string; bids: number; accepted: number; winRate: number }[];
}

export interface BidQuota {
  bidTokens: number;
  bidTokensUsed: number;
  bidPenalties: number;
  tier: string;
  dailyLimit: number;
  usedToday: number;
  remaining: number;
}

export interface SubmitBidData {
  jobId: string;
  amount: number;
  days: number;
  coverLetter: string;
  fileName?: string;
  fileUrl?: string;
}

export const bidsApi = {
  // FL-16: list my bids with optional status filter
  listMyBids: (status?: string): Promise<ApiBid[]> =>
    apiClient
      .get<{ data: ApiBid[] }>('/bids/me', { params: status ? { status } : undefined })
      .then((res) => res.data.data),

  getBid: (id: string): Promise<ApiBid> =>
    apiClient.get<{ data: ApiBid }>(`/bids/${id}`).then((res) => res.data.data),

  // FL-18: bid stats & win rate
  getStats: (): Promise<BidStats> =>
    apiClient.get<{ data: BidStats }>('/bids/me/stats').then((res) => res.data.data),

  // bid token quota
  getQuota: (): Promise<BidQuota> =>
    apiClient.get<{ data: BidQuota }>('/bids/me/quota').then((res) => res.data.data),

  // FL-12: submit bid (JSON, not multipart — BE accepts JSON)
  submitBid: (data: SubmitBidData): Promise<{ bid: ApiBid; quota: BidQuota }> =>
    apiClient
      .post<{ data: { bid: ApiBid; quota: BidQuota } }>('/bids', data)
      .then((res) => res.data.data),

  // FL-14: edit bid
  updateBid: (id: string, data: { amount?: number; days?: number; coverLetter?: string }): Promise<ApiBid> =>
    apiClient.patch<{ data: ApiBid }>(`/bids/${id}`, data).then((res) => res.data.data),

  // FL-15: withdraw bid
  withdrawBid: (id: string): Promise<ApiBid> =>
    apiClient.delete<{ data: ApiBid }>(`/bids/${id}`).then((res) => res.data.data),

  // FL-17: cover letter suggestion
  suggestCoverLetter: (jobId: string): Promise<{ bullets: string[]; template: string }> =>
    apiClient
      .post<{ data: { bullets: string[]; template: string } }>('/bids/cover-letter-suggest', { jobId })
      .then((res) => res.data.data),
};
