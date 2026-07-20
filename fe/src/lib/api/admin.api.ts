import { apiClient } from './client';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  phone: string | null;
  status: string;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  failedLoginCount: number;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  userRoles: Array<{
    id: string;
    userId: string;
    roleId: string;
    assignedBy: string | null;
    assignedAt: string;
    role: { id: string; name: string; description: string | null };
  }>;
}

export interface AdminUserDetail extends AdminUser {
  loginSessions: Array<{
    id: string;
    status: string;
    ipAddress: string;
    userAgent: string | null;
    deviceType: string | null;
    deviceName: string | null;
    location: string | null;
    lastActiveAt: string;
    createdAt: string;
  }>;
  accountLogs: Array<{
    id: string;
    action: string;
    reason: string | null;
    performedBy: string | null;
    metadata: unknown;
    createdAt: string;
  }>;
}

export interface DashboardStats {
  users: { total: number; active: number; suspended: number };
  jobs: { total: number; open: number; hidden: number };
  bids: { total: number };
  contracts: {
    total: number;
    active: number;
    disputed: number;
    completed: number;
    completionRate: number;
    disputeRate: number;
  };
  revenue: { total: number };
  reports: { pending: number };
  transactions: { total: number; failed: number };
  assessment: { completedCount: number; averageScore: number };
}

export interface AdminJob {
  id: string;
  title: string;
  description: string;
  status: string;
  isHidden: boolean;
  hiddenReason: string | null;
  budget: number | null;
  createdAt: string;
  client: { id: string; fullName: string; email: string };
  category: { id: string; name: string };
  _count: { bids: number };
}

export interface AdminReport {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  evidence: string | null;
  status: string;
  resolution: string | null;
  action: string | null;
  createdAt: string;
  reporter: { id: string; fullName: string; email: string };
  target?: unknown;
}

export interface AdminCategory {
  id: string;
  name: string;
  description: string | null;
  isHidden: boolean;
  _count: { jobs: number; skills: number };
}

export interface AdminSkill {
  id: string;
  name: string;
  description: string | null;
  isHidden: boolean;
  categoryId: string | null;
  category: { id: string; name: string } | null;
}

export interface AdminTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  date: string;
  wallet: {
    user: { id: string; fullName: string; email: string };
  };
}

export interface SystemConfigItem {
  id: string;
  key: string;
  value: string;
  label: string | null;
  updatedAt: string;
}

export interface AssessmentQuestion {
  id: string;
  skillId: string | null;
  question: string;
  options: string[];
  correctIndex: number;
  type: string;
  order: number;
  isActive: boolean;
  skill: { id: string; name: string } | null;
}

export interface AssessmentStats {
  totalCompleted: number;
  levelDistribution: Record<string, number>;
  scoreDistribution: Record<number, number>;
  averageScore: number;
}

export interface PaginatedResponse<T> {
  users?: T[];
  jobs?: T[];
  reports?: T[];
  transactions?: T[];
  contracts?: T[];
  total: number;
  page: number;
  limit: number;
}

export const adminApi = {
  // Dashboard
  getStats: () => apiClient.get<{ data: DashboardStats }>('/admin/stats'),

  // Users
  listUsers: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get<{ data: PaginatedResponse<AdminUser> }>('/admin/users', { params }),
  getUserById: (userId: string) =>
    apiClient.get<{ data: AdminUserDetail }>(`/admin/users/${userId}`),
  assignRole: (userId: string, roleType: string) =>
    apiClient.post(`/admin/users/${userId}/roles`, { roleType }),
  revokeRole: (userId: string, roleType: string) =>
    apiClient.delete(`/admin/users/${userId}/roles/${roleType}`),
  suspendUser: (userId: string, reason: string) =>
    apiClient.post(`/admin/users/${userId}/suspend`, { reason }),
  unsuspendUser: (userId: string) =>
    apiClient.post(`/admin/users/${userId}/unsuspend`),
  createUser: (data: { email: string; password: string; fullName: string; role: string }) =>
    apiClient.post<{ data: AdminUser }>('/admin/users', data),

  // Jobs
  listJobs: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    apiClient.get<{ data: PaginatedResponse<AdminJob> }>('/admin/jobs', { params }),
  hideJob: (jobId: string, reason: string) =>
    apiClient.post(`/admin/jobs/${jobId}/hide`, { reason }),
  unhideJob: (jobId: string) =>
    apiClient.post(`/admin/jobs/${jobId}/unhide`),
  deleteJob: (jobId: string) =>
    apiClient.delete(`/admin/jobs/${jobId}`),

  // Reports & Disputes
  listReports: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<{ data: PaginatedResponse<AdminReport> }>('/admin/reports', { params }),
  getReport: (reportId: string) =>
    apiClient.get<{ data: AdminReport }>(`/admin/reports/${reportId}`),
  resolveReport: (reportId: string, data: { status: string; resolution?: string; action?: string }) =>
    apiClient.post(`/admin/reports/${reportId}/resolve`, data),
  listDisputes: (params?: { page?: number; limit?: number }) =>
    apiClient.get<{ data: PaginatedResponse<unknown> }>('/admin/disputes', { params }),
  resolveDispute: (disputeId: string, data: { decision: 'REFUND' | 'RELEASE_FUNDS'; resolution: string }) =>
    apiClient.post(`/admin/disputes/${disputeId}/resolve`, data),

  // Categories & Skills
  listCategories: () => apiClient.get<{ data: AdminCategory[] }>('/admin/categories'),
  createCategory: (data: { name: string; description?: string }) =>
    apiClient.post('/admin/categories', data),
  updateCategory: (id: string, data: { name?: string; description?: string; isHidden?: boolean }) =>
    apiClient.patch(`/admin/categories/${id}`, data),
  deleteCategory: (id: string) => apiClient.delete(`/admin/categories/${id}`),
  listSkills: () => apiClient.get<{ data: AdminSkill[] }>('/admin/skills'),
  createSkill: (data: { name: string; categoryId?: string; description?: string }) =>
    apiClient.post('/admin/skills', data),
  updateSkill: (id: string, data: { name?: string; categoryId?: string; description?: string; isHidden?: boolean }) =>
    apiClient.patch(`/admin/skills/${id}`, data),
  deleteSkill: (id: string) => apiClient.delete(`/admin/skills/${id}`),
  mergeSkills: (sourceSkillId: string, targetSkillId: string) =>
    apiClient.post('/admin/skills/merge', { sourceSkillId, targetSkillId }),

  // Transactions
  listTransactions: (params?: { page?: number; limit?: number; status?: string; type?: string }) =>
    apiClient.get<{ data: PaginatedResponse<AdminTransaction> }>('/admin/transactions', { params }),
  refundTransaction: (transactionId: string, reason?: string) =>
    apiClient.post('/admin/transactions/refund', { transactionId, reason }),

  // System Config
  getConfig: () => apiClient.get<{ data: SystemConfigItem[] }>('/admin/config'),
  updateConfig: (key: string, value: string) =>
    apiClient.put(`/admin/config/${key}`, { value }),
  bulkUpdateConfig: (configs: { key: string; value: string }[]) =>
    apiClient.put('/admin/config', { configs }),

  // Assessment
  listAssessmentQuestions: () =>
    apiClient.get<{ data: AssessmentQuestion[] }>('/admin/assessment/questions'),
  createAssessmentQuestion: (data: {
    question: string;
    options: string[];
    correctIndex: number;
    type?: string;
    order?: number;
    skillId?: string;
  }) => apiClient.post('/admin/assessment/questions', data),
  updateAssessmentQuestion: (id: string, data: Partial<AssessmentQuestion>) =>
    apiClient.patch(`/admin/assessment/questions/${id}`, data),
  deleteAssessmentQuestion: (id: string) =>
    apiClient.delete(`/admin/assessment/questions/${id}`),
  getAssessmentStats: () =>
    apiClient.get<{ data: AssessmentStats }>('/admin/assessment/stats'),
};
