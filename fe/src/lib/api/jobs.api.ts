import { api } from './client';

export interface JobResponse {
  id: string;
  title: string;
  description: string;
  budget: number | null;
  minBudget: number | null;
  maxBudget: number | null;
  fixedBudget: number | null;
  budgetFormat: 'FIXED' | 'RANGE';
  deadline: string;
  categoryId: string;
  auctionType: 'SEALED_BID' | 'OPEN_BID';
  status: string;
  skills: string[];
  createdAt: string;
  category?: {
    id: string;
    name: string;
  };
  client?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
  _count?: {
    bids: number;
  };
  matchScore?: number;
  skillMatch?: number;
  matchedSkills?: string[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface JobListResponse {
  jobs: JobResponse[];
  pagination: PaginationMeta;
}

export interface JobSearchParams {
  keyword?: string;
  categoryId?: string;
  minBudget?: number;
  maxBudget?: number;
  skills?: string[];
  deadlineBefore?: string;
  auctionType?: 'SEALED_BID' | 'OPEN_BID';
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'budget' | 'deadline';
  sortOrder?: 'asc' | 'desc';
}

export interface JobSuggestionParams {
  limit?: number;
}

export interface BookmarkResponse {
  bookmarked: boolean;
  jobId: string;
  message?: string;
}

export interface JobAlertResponse {
  id: string;
  userId: string;
  enabled: boolean;
  frequency: string;
  lastSentAt: string | null;
}

export interface JobAlertUpdateParams {
  enabled: boolean;
  frequency?: 'daily' | 'instant';
}

// Backend wraps ALL responses in { success, data, timestamp } via TransformResponseInterceptor
// Extract data from response.data.data

// FL-07: Get paginated job list with sorting
export async function getJobs(params: JobSearchParams): Promise<JobListResponse> {
  const response = await api.get<{ success: boolean; data: JobListResponse; timestamp: string }>('/jobs', { params });
  return response.data.data;
}

// FL-07: Get job categories
export async function getCategories() {
  const response = await api.get<{ success: boolean; data: any[]; timestamp: string }>('/jobs/categories');
  return response.data.data;
}

// FL-09: Get job suggestions based on freelancer profile
export async function getJobSuggestions(params?: JobSuggestionParams) {
  const response = await api.get<{ success: boolean; data: JobResponse[]; timestamp: string }>('/jobs/suggestions', { params });
  return response.data.data;
}

// FL-10: Get bookmarks
export async function getBookmarks() {
  const response = await api.get<{ success: boolean; data: JobResponse[]; timestamp: string }>('/jobs/bookmarks');
  return response.data.data;
}

// FL-10: Add bookmark
export async function addBookmark(jobId: string): Promise<BookmarkResponse> {
  const response = await api.post<{ success: boolean; data: BookmarkResponse; timestamp: string }>(`/jobs/bookmarks/${jobId}`);
  return response.data.data;
}

// FL-10: Remove bookmark
export async function removeBookmark(jobId: string): Promise<BookmarkResponse> {
  const response = await api.delete<{ success: boolean; data: BookmarkResponse; timestamp: string }>(`/jobs/bookmarks/${jobId}`);
  return response.data.data;
}

// FL-10: Check if job is bookmarked
export async function checkBookmark(jobId: string) {
  const response = await api.get<{ success: boolean; data: { isBookmarked: boolean }; timestamp: string }>(`/jobs/bookmarks/${jobId}/status`);
  return response.data.data;
}

// FL-11: Get job alert settings
export async function getJobAlert(): Promise<JobAlertResponse> {
  const response = await api.get<{ success: boolean; data: JobAlertResponse; timestamp: string }>('/jobs/alerts');
  return response.data.data;
}

// FL-11: Update job alert settings
export async function updateJobAlert(params: JobAlertUpdateParams): Promise<JobAlertResponse> {
  const response = await api.patch<{ success: boolean; data: JobAlertResponse; timestamp: string }>('/jobs/alerts', params);
  return response.data.data;
}

// FL-11: Toggle job alert
export async function toggleJobAlert(): Promise<JobAlertResponse> {
  const response = await api.post<{ success: boolean; data: JobAlertResponse; timestamp: string }>('/jobs/alerts/toggle');
  return response.data.data;
}

// Get single job details
export async function getJob(id: string) {
  const response = await api.get<{ success: boolean; data: JobResponse; timestamp: string }>(`/jobs/${id}`);
  return response.data.data;
}

// Get client's own posted jobs
// Backend returns array directly (wrapped in { success, data, timestamp })
export async function findMyJobs(): Promise<JobResponse[]> {
  const response = await api.get<{ success: boolean; data: JobResponse[]; timestamp: string }>('/jobs/my-jobs');
  return response.data.data;
}

// Create a new job
export async function createJob(data: {
  title: string;
  description: string;
  categoryId: string;
  budgetFormat: 'FIXED' | 'RANGE';
  fixedBudget?: number;
  minBudget?: number;
  maxBudget?: number;
  deadline: string;
  auctionType: 'SEALED_BID' | 'OPEN_BID';
  skills: string[];
  ahpWeight?: Record<string, number>;
}) {
  const response = await api.post<{ success: boolean; data: JobResponse; timestamp: string }>('/jobs', data);
  return response.data.data;
}

// Update a job
export async function updateJob(id: string, data: Partial<{
  title: string;
  description: string;
  categoryId: string;
  budgetFormat: 'FIXED' | 'RANGE';
  fixedBudget?: number;
  minBudget?: number;
  maxBudget?: number;
  deadline: string;
  auctionType: 'SEALED_BID' | 'OPEN_BID';
  skills: string[];
  status: string;
  ahpWeight?: Record<string, number>;
}>) {
  const response = await api.patch<{ success: boolean; data: JobResponse; timestamp: string }>(`/jobs/${id}`, data);
  return response.data.data;
}

// Remove a job
export async function removeJob(id: string) {
  const response = await api.delete<{ success: boolean; data: { deleted: boolean }; timestamp: string }>(`/jobs/${id}`);
  return response.data.data;
}

// Default export object for convenience
export const jobsApi = {
  getJobs,
  getCategories,
  getJobSuggestions,
  getBookmarks,
  addBookmark,
  removeBookmark,
  checkBookmark,
  getJobAlert,
  updateJobAlert,
  toggleJobAlert,
  getJob,
  findMyJobs,
  create: createJob,
  update: updateJob,
  remove: removeJob,
};

export default jobsApi;
