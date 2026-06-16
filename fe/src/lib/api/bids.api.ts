import { apiClient } from './client';

export interface ApiBid {
  id: string;
  jobId: string;
  jobTitle: string;
  clientName: string;
  amount: number;
  days: number;
  coverLetter: string;
  fileName?: string;
  status: 'PENDING' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  matchingScore: number;
  submittedAt: string;
  matchBreakdown?: {
    skillMatch: number;
    budgetMatch: number;
    experienceMatch: number;
  };
  canEdit: boolean;
}

export interface BidStats {
  total: number;
  pending: number;
  shortlisted: number;
  accepted: number;
  rejected: number;
  withdrawn: number;
  totalEarned: number;
  winRate: number;
}

export interface BidQuota {
  bidTokens: number;
  bidTokensUsed: number;
  bidPenalties: number;
  withdrawPenalties: number;
}

export const bidsApi = {
  listMyBids: (status?: string) =>
    apiClient.get<{ data: ApiBid[] }>('/bids', {
      params: status ? { status } : undefined,
    }).then(res => res.data.data),

  getBid: (id: string) =>
    apiClient.get<{ data: ApiBid }>(`/bids/${id}`).then(res => res.data.data),

  getStats: () =>
    apiClient.get<{ data: BidStats }>('/bids/stats').then(res => res.data.data),

  getQuota: () =>
    apiClient.get<{ data: BidQuota }>('/bids/quota').then(res => res.data.data),

  submitBid: (data: {
    jobId: string;
    amount: number;
    days: number;
    coverLetter: string;
    fileName?: string;
  }) => {
    const formData = new FormData();
    formData.append('jobId', data.jobId);
    formData.append('amount', String(data.amount));
    formData.append('days', String(data.days));
    formData.append('coverLetter', data.coverLetter);
    if (data.fileName) formData.append('file', data.fileName);
    return apiClient.post<{ data: { bid: ApiBid; quota: BidQuota } }>('/bids', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data.data);
  },

  updateBid: (id: string, data: { amount: number; days: number; coverLetter: string }) =>
    apiClient.patch<{ data: ApiBid }>(`/bids/${id}`, data).then(res => res.data.data),

  withdrawBid: (id: string) =>
    apiClient.delete(`/bids/${id}`),
};
