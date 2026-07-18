import { api } from './client';

export interface MilestoneDeliverable {
  id: string;
  milestoneId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  description: string | null;
  uploadedAt: string;
}

export interface Milestone {
  id: string;
  contractId: string;
  order: number;
  title: string;
  description: string | null;
  amount: number;
  percentage: number;
  deadline: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
  maxRevisions: number;
  revisionCount: number;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  autoApproveAt: string | null;
  clientFeedback: string | null;
  freelancerNotes: string | null;
  deliverables?: MilestoneDeliverable[];
}

export interface Contract {
  id: string;
  jobId: string;
  bidId: string;
  clientId: string;
  freelancerId: string;
  title: string;
  description: string | null;
  totalAmount: number;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED';
  customTerms: string | null;
  startDate: string | null;
  endDate: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  autoApprovalDays: number;
  createdAt: string;
  updatedAt: string;
  clientReviewed: boolean;
  freelancerReviewed: boolean;
  milestones: Milestone[];
  client: { id: string; fullName: string; avatarUrl: string | null };
  freelancer: { id: string; fullName: string; avatarUrl: string | null };
  job: { id: string; title: string; status: string };
  statusLogs?: any[];
}

export interface CreateContractDto {
  bidId: string;
  description?: string;
  customTerms?: string;
  milestones: {
    order: number;
    title: string;
    description?: string;
    amount: number;
    percentage: number;
    deadline: string;
    maxRevisions?: number;
  }[];
}

export const contractsApi = {
  // Client
  createContract: async (dto: CreateContractDto): Promise<Contract> => {
    const res = await api.post('/client/contracts', dto);
    return res.data.data;
  },

  listClientContracts: async (status?: string): Promise<Contract[]> => {
    const res = await api.get('/client/contracts', { params: status ? { status } : undefined });
    return res.data.data;
  },

  getClientContract: async (id: string): Promise<Contract> => {
    const res = await api.get(`/client/contracts/${id}`);
    return res.data.data;
  },

  reviewMilestone: async (
    contractId: string,
    milestoneId: string,
    action: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED',
    feedback?: string,
  ) => {
    const res = await api.patch(`/client/contracts/${contractId}/milestones/${milestoneId}/review`, {
      action,
      feedback,
    });
    return res.data.data;
  },

  cancelClientContract: async (contractId: string, reason: string) => {
    const res = await api.patch(`/client/contracts/${contractId}/cancel`, { reason });
    return res.data.data;
  },

  // Freelancer
  listFreelancerContracts: async (status?: string): Promise<Contract[]> => {
    const res = await api.get('/freelancer/contracts', { params: status ? { status } : undefined });
    return res.data.data;
  },

  getFreelancerContract: async (id: string): Promise<Contract> => {
    const res = await api.get(`/freelancer/contracts/${id}`);
    return res.data.data;
  },

  submitMilestone: async (
    contractId: string,
    milestoneId: string,
    file: File,
    description: string,
  ): Promise<Milestone> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);

    const res = await api.post(
      `/freelancer/contracts/${contractId}/milestones/${milestoneId}/submit`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return res.data.data;
  },

  updateMilestoneProgress: async (contractId: string, milestoneId: string, notes: string) => {
    const res = await api.patch(
      `/freelancer/contracts/${contractId}/milestones/${milestoneId}/progress`,
      { notes },
    );
    return res.data.data;
  },

  cancelFreelancerContract: async (contractId: string, reason: string) => {
    const res = await api.patch(`/freelancer/contracts/${contractId}/cancel`, { reason });
    return res.data.data;
  },

  reviewFreelancer: async (
    contractId: string,
    reviewData: {
      qualityRating: number;
      commRating: number;
      speedRating: number;
      fourthRating: number;
      comment?: string;
      anonymous?: boolean;
    },
  ): Promise<{ success: boolean }> => {
    const res = await api.post(`/client/contracts/${contractId}/review-freelancer`, reviewData);
    return res.data.data;
  },

  reviewClient: async (
    contractId: string,
    reviewData: {
      qualityRating: number;
      commRating: number;
      speedRating: number;
      comment?: string;
      anonymous?: boolean;
    },
  ): Promise<{ success: boolean }> => {
    const res = await api.post(`/freelancer/contracts/${contractId}/review-client`, reviewData);
    return res.data.data;
  },
};
