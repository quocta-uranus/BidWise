import { apiClient } from './client';

export interface Milestone {
  id: string;
  contractId: string;
  name: string;
  nameKey?: string;
  amount: number;
  progress: number;
  status: 'PENDING' | 'SUBMITTED' | 'ACCEPTED';
  deliverable?: string;
  deliverableDesc?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  jobId: string;
  freelancerId: string;
  amount: number;
  status: 'SIGNED' | 'ACTIVE' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
  clientReviewed: boolean;
  freelancerReviewed: boolean;
  milestones?: Milestone[];
  job?: {
    id: string;
    title: string;
    clientId: string;
  };
}

export interface SubmitDeliverableDto {
  fileName: string;
  description?: string;
}

export const contractsApi = {
  getContracts: async (): Promise<Contract[]> => {
    const response = await apiClient.get('/contracts');
    return response.data.data;
  },

  acceptBid: async (bidId: string): Promise<Contract> => {
    const response = await apiClient.post('/contracts/accept-bid', { bidId });
    return response.data.data;
  },

  signContract: async (contractId: string): Promise<Contract> => {
    const response = await apiClient.post(`/contracts/${contractId}/sign`);
    return response.data.data;
  },

  updateMilestoneProgress: async (
    contractId: string,
    milestoneId: string,
    progress: number,
  ): Promise<Milestone> => {
    const response = await apiClient.patch(
      `/contracts/${contractId}/milestones/${milestoneId}/progress`,
      { progress },
    );
    return response.data.data;
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

    const response = await apiClient.post(
      `/contracts/${contractId}/milestones/${milestoneId}/submit`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return response.data.data;
  },

  approveMilestone: async (
    contractId: string,
    milestoneId: string,
  ): Promise<Milestone> => {
    const response = await apiClient.post(
      `/contracts/${contractId}/milestones/${milestoneId}/approve`,
    );
    return response.data.data;
  },

  requestRefund: async (contractId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/contracts/${contractId}/refund`);
    return response.data.data;
  },

  reviewClient: async (
    contractId: string,
    clientReviewed: boolean,
  ): Promise<Contract> => {
    const response = await apiClient.post(`/contracts/${contractId}/review-client`, {
      clientReviewed,
    });
    return response.data.data;
  },

  reviewFreelancer: async (
    contractId: string,
    reviewData: {
      qualityRating: number;
      commRating: number;
      speedRating: number;
      comment?: string;
      anonymous?: boolean;
    },
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/contracts/${contractId}/review-freelancer`, reviewData);
    return response.data.data;
  },
};
