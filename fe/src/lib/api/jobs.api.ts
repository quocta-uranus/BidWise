import { apiClient } from './client';

export interface AhpWeight {
  priceWeight: number;
  skillWeight: number;
  experienceWeight: number;
  ratingWeight: number;
  speedWeight: number;
  deadlineWeight: number;
  portfolioWeight: number;
}

export interface CreateJobDto {
  title: string;
  description: string;
  budgetFormat: 'FIXED' | 'RANGE';
  minBudget?: number;
  maxBudget?: number;
  fixedBudget?: number;
  deadline: string;
  categoryId: string;
  auctionType: 'SEALED_BID' | 'OPEN_BID';
  skills: string[];
  ahpWeight: AhpWeight;
  attachments?: { fileName: string; fileUrl: string; fileSize?: number; mimeType?: string }[];
}

export interface UpdateJobDto extends Partial<CreateJobDto> {
  status?: 'DRAFT' | 'OPEN' | 'CLOSED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED';
}

export const jobsApi = {
  getCategories: async () => {
    const response = await apiClient.get('/jobs/categories');
    return response.data.data;
  },

  create: async (data: CreateJobDto) => {
    const response = await apiClient.post('/jobs', data);
    return response.data.data;
  },

  findAll: async (clientId?: string) => {
    const params = clientId ? { clientId } : {};
    const response = await apiClient.get('/jobs', { params });
    return response.data.data;
  },

  findMyJobs: async () => {
    const response = await apiClient.get('/jobs/my-jobs');
    return response.data.data;
  },

  findOne: async (id: string) => {
    const response = await apiClient.get(`/jobs/${id}`);
    return response.data.data;
  },

  update: async (id: string, data: UpdateJobDto) => {
    const response = await apiClient.patch(`/jobs/${id}`, data);
    return response.data.data;
  },

  remove: async (id: string) => {
    const response = await apiClient.delete(`/jobs/${id}`);
    return response.data.data;
  },
};
