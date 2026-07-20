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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin'] }); toast.success('Đã ẩn job'); },
    onError: () => toast.error('Không thể ẩn job'),
  });
}

export function useUnhideJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => adminApi.unhideJob(jobId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin'] }); toast.success('Đã hiện job'); },
    onError: () => toast.error('Không thể hiện job'),
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => adminApi.deleteJob(jobId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin'] }); toast.success('Đã xóa job'); },
    onError: () => toast.error('Không thể xóa job'),
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin'] }); toast.success('Đã xử lý report'); },
    onError: () => toast.error('Không thể xử lý report'),
  });
}

export function useAdminDisputes(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['admin', 'disputes', params],
    queryFn: async () => (await adminApi.listDisputes(params)).data.data,
  });
}

export function useResolveDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ disputeId, ...data }: { disputeId: string; decision: 'REFUND' | 'RELEASE_FUNDS'; resolution: string }) =>
      adminApi.resolveDispute(disputeId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin'] }); toast.success('Đã giải quyết tranh chấp'); },
    onError: () => toast.error('Không thể giải quyết tranh chấp'),
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'categories'] }); toast.success('Đã tạo category'); },
    onError: () => toast.error('Không thể tạo category'),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; description?: string; isHidden?: boolean }) =>
      adminApi.updateCategory(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'categories'] }); toast.success('Đã cập nhật'); },
    onError: () => toast.error('Không thể cập nhật'),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'categories'] }); toast.success('Đã xóa'); },
    onError: () => toast.error('Không thể xóa category'),
  });
}

export function useCreateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; categoryId?: string; description?: string }) => adminApi.createSkill(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'skills'] }); toast.success('Đã tạo skill'); },
    onError: () => toast.error('Không thể tạo skill'),
  });
}

export function useUpdateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; categoryId?: string; description?: string; isHidden?: boolean }) =>
      adminApi.updateSkill(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'skills'] }); toast.success('Đã cập nhật'); },
    onError: () => toast.error('Không thể cập nhật'),
  });
}

export function useDeleteSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteSkill(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'skills'] }); toast.success('Đã xóa'); },
    onError: () => toast.error('Không thể xóa skill'),
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'transactions'] }); toast.success('Đã hoàn tiền'); },
    onError: () => toast.error('Không thể hoàn tiền'),
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'config'] }); toast.success('Đã lưu cấu hình'); },
    onError: () => toast.error('Không thể lưu cấu hình'),
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'assessment'] }); toast.success('Đã thêm câu hỏi'); },
    onError: () => toast.error('Không thể thêm câu hỏi'),
  });
}

export function useUpdateAssessmentQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      adminApi.updateAssessmentQuestion(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'assessment'] }); toast.success('Đã cập nhật'); },
    onError: () => toast.error('Không thể cập nhật'),
  });
}

export function useDeleteAssessmentQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteAssessmentQuestion(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'assessment'] }); toast.success('Đã xóa'); },
    onError: () => toast.error('Không thể xóa'),
  });
}
