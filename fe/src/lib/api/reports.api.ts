import { apiClient } from './client';

export type ReportCategory = 'SCAM' | 'QUALITY_DISPUTE' | 'PAYMENT' | 'INAPPROPRIATE_CONTENT';

export const reportsApi = {
  createReport: (data: {
    targetType: 'USER' | 'JOB' | 'CONTRACT' | 'OTHER';
    targetId: string;
    category: ReportCategory;
    reason: string;
    evidenceUrls?: string[];
  }) => apiClient.post('/reports', data),

  openDispute: (data: { contractId: string; reason: string; evidenceUrls?: string[] }) =>
    apiClient.post('/reports/disputes', data),

  submitEvidence: (disputeId: string, data: { description: string; fileUrls: string[] }) =>
    apiClient.post(`/reports/disputes/${disputeId}/evidence`, data),

  getDispute: (disputeId: string) => apiClient.get(`/reports/disputes/${disputeId}`),
};
