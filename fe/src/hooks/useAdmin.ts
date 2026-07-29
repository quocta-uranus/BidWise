'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin.api';
import { toast } from 'sonner';

export function useAdminStats(enabled = true) {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => (await adminApi.getStats()).data.data,
    enabled,
    refetchInterval: 30000,
  });
}

export function useAdminJobs(params?: { page?: number; limit?: number; search?: string; status?: string }) {
  return useQuery({
    queryKey: ['admin', 'jobs', params],
    queryFn: async () => (await adminApi.listJobs(params)).data.data,
  });
}

export function useHideJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, reason }: { jobId: string; reason: string }) => adminApi.hideJob(jobId, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin'] }); toast.success('Job hidden successfully'); },
    onError: () => toast.error('Unable to hide job'),
  });
}

export function useUnhideJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => adminApi.unhideJob(jobId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin'] }); toast.success('Job unhidden successfully'); },
    onError: () => toast.error('Unable to unhide job'),
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => adminApi.deleteJob(jobId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin'] }); toast.success('Job deleted successfully'); },
    onError: () => toast.error('Unable to delete job'),
  });
}

export function useAdminReports(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['admin', 'reports', params],
    queryFn: async () => (await adminApi.listReports(params)).data.data,
  });
}

export function useResolveReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, ...data }: { reportId: string; status: string; resolution?: string; action?: string }) =>
      adminApi.resolveReport(reportId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin'] }); toast.success('Report resolved successfully'); },
    onError: () => toast.error('Unable to resolve report'),
  });
}

export function useAdminDisputes(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['admin', 'disputes', params],
    queryFn: async () => (await adminApi.listDisputes(params)).data.data,
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => (await adminApi.listCategories()).data.data,
  });
}

export function useAdminSkills() {
  return useQuery({
    queryKey: ['admin', 'skills'],
    queryFn: async () => (await adminApi.listSkills()).data.data,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) => adminApi.createCategory(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'categories'] }); toast.success('Category created successfully'); },
    onError: () => toast.error('Unable to create category'),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; description?: string; isHidden?: boolean }) =>
      adminApi.updateCategory(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'categories'] }); toast.success('Category updated successfully'); },
    onError: () => toast.error('Unable to update category'),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'categories'] }); toast.success('Category deleted successfully'); },
    onError: () => toast.error('Unable to delete category'),
  });
}

export function useCreateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; categoryId?: string; description?: string }) => adminApi.createSkill(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'skills'] }); toast.success('Skill created successfully'); },
    onError: () => toast.error('Unable to create skill'),
  });
}

export function useUpdateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; categoryId?: string; description?: string; isHidden?: boolean }) =>
      adminApi.updateSkill(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'skills'] }); toast.success('Skill updated successfully'); },
    onError: () => toast.error('Unable to update skill'),
  });
}

export function useDeleteSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteSkill(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'skills'] }); toast.success('Skill deleted successfully'); },
    onError: () => toast.error('Unable to delete skill'),
  });
}

export function useAdminTransactions(params?: { page?: number; limit?: number; status?: string; type?: string }) {
  return useQuery({
    queryKey: ['admin', 'transactions', params],
    queryFn: async () => (await adminApi.listTransactions(params)).data.data,
  });
}

export function useRefundTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ transactionId, reason }: { transactionId: string; reason?: string }) =>
      adminApi.refundTransaction(transactionId, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'transactions'] }); toast.success('Refund processed successfully'); },
    onError: () => toast.error('Unable to process refund'),
  });
}

export function useSystemConfig() {
  return useQuery({
    queryKey: ['admin', 'config'],
    queryFn: async () => (await adminApi.getConfig()).data.data,
  });
}

export function useUpdateSystemConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (configs: { key: string; value: string }[]) => adminApi.bulkUpdateConfig(configs),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'config'] }); toast.success('Configuration saved successfully'); },
    onError: () => toast.error('Unable to save configuration'),
  });
}

export function useAssessmentQuestions() {
  return useQuery({
    queryKey: ['admin', 'assessment', 'questions'],
    queryFn: async () => (await adminApi.listAssessmentQuestions()).data.data,
  });
}

export function useAssessmentStats() {
  return useQuery({
    queryKey: ['admin', 'assessment', 'stats'],
    queryFn: async () => (await adminApi.getAssessmentStats()).data.data,
  });
}

export function useCreateAssessmentQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createAssessmentQuestion,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'assessment'] }); toast.success('Question added successfully'); },
    onError: () => toast.error('Unable to add question'),
  });
}

export function useUpdateAssessmentQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      adminApi.updateAssessmentQuestion(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'assessment'] }); toast.success('Question updated successfully'); },
    onError: () => toast.error('Unable to update question'),
  });
}

export function useDeleteAssessmentQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteAssessmentQuestion(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'assessment'] }); toast.success('Question deleted successfully'); },
    onError: () => toast.error('Unable to delete question'),
  });
}
