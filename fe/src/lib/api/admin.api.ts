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
    role: {
      id: string;
      name: string;
      description: string | null;
    };
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

export interface PaginatedResponse<T> {
  users: T[];
  total: number;
  page: number;
  limit: number;
}

export const adminApi = {
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
};