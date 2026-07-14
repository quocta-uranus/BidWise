import { api } from './client';

export interface ClusterReputation {
  cluster: string;
  score: number;
  reviewCount: number;
}

export interface MarketComparison {
  cluster: string;
  myScore: number;
  marketAvg: number;
  delta: number;
  aboveMarket: boolean;
}

export interface ReputationData {
  freelancerId: string;
  fullName: string;
  avatarUrl: string | null;
  tier: 'NEW' | 'SILVER' | 'GOLD' | 'VERIFIED';
  overallScore: number;
  totalReviews: number;
  clusters: ClusterReputation[];
  assessmentScore: number | null;
  assessmentLevel: string | null;
}

export interface MyReputationData extends ReputationData {
  marketComparison: MarketComparison[];
}

export const reputationApi = {
  // Public: get any freelancer's reputation by ID
  getReputation: (freelancerId: string): Promise<ReputationData> =>
    api
      .get<{ data: ReputationData }>(`/reputation/${freelancerId}`)
      .then((r) => r.data.data),

  // FREELANCER only: get own reputation with market comparison
  getMyReputation: (): Promise<MyReputationData> =>
    api
      .get<{ data: MyReputationData }>('/reputation/me')
      .then((r) => r.data.data),
};
