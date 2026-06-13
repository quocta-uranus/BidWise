'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin.api';
import { toast } from 'sonner';

export function useAdminUsers(
  params?: { page?: number; limit?: number; search?: string },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: async () => {
      const res = await adminApi.listUsers(params);
      return res.data.data;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useAdminUserDetail(userId: string | null) {
  return useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: async () => {
      const res = await adminApi.getUserById(userId!);
      return res.data.data;
    },
    enabled: !!userId,
  });
}

export function useAssignRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleType }: { userId: string; roleType: string }) =>
      adminApi.assignRole(userId, roleType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Role assigned successfully');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to assign role';
      toast.error(msg);
    },
  });
}

export function useRevokeRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleType }: { userId: string; roleType: string }) =>
      adminApi.revokeRole(userId, roleType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Role revoked successfully');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to revoke role';
      toast.error(msg);
    },
  });
}

export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      adminApi.suspendUser(userId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Account suspended');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to suspend account';
      toast.error(msg);
    },
  });
}

export function useUnsuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminApi.unsuspendUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Account unsuspended');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to unsuspend account';
      toast.error(msg);
    },
  });
}

export function useCreateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; password: string; fullName: string; role: string }) =>
      adminApi.createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Account created successfully');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to create account';
      toast.error(msg);
    },
  });
}