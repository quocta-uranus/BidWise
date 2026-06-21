import { apiClient } from './client';

export interface PortfolioItem {
  id: string;
  title: string;
  desc: string | null;
  link: string | null;
  fileName: string | null;
  fileSize: string | null;
  fileUrl: string | null;
}

export interface Certificate {
  id: string;
  name: string;
  issuer: string | null;
  date: string | null;
  verifyLink: string | null;
  verified: boolean;
}

export interface FreelancerProfileResponse {
  id: string;
  userId: string;
  hourlyRate: number | null;
  experience: string | null;
  available: boolean;
  assessmentCompleted: boolean;
  assessmentScore: number | null;
  assessmentLevel: string | null;
  cvFileUrl: string | null;
  cvFileName: string | null;
  cvFileSize: string | null;
  cvUploadedAt: string | null;
  skills: string[];
  portfolios: PortfolioItem[];
  certifications: Certificate[];
  // merged from User table
  bio: string | null;
  phone: string | null;
}

export const freelancerApi = {
  getMyProfile: () =>
    apiClient.get<{ data: FreelancerProfileResponse }>('/freelancer-profile/me'),

  updateProfile: (data: {
    bio?: string;
    hourlyRate?: number;
    phone?: string;
    experience?: string;
  }) =>
    apiClient.put<{ data: FreelancerProfileResponse }>('/freelancer-profile/me', data),

  getPortfolios: () =>
    apiClient.get<{ data: FreelancerProfileResponse['portfolios'] }>('/freelancer-profile/portfolio'),

  createPortfolio: (data: {
    title: string;
    desc?: string;
    link?: string;
    fileName?: string;
    fileSize?: string;
  }) =>
    apiClient.post<{ data: any }>('/freelancer-profile/portfolio', data),

  deletePortfolio: (portfolioId: string) =>
    apiClient.delete(`/freelancer-profile/portfolio/${portfolioId}`),

  getCv: () =>
    apiClient.get<{ data: { fileName: string; fileSize: string; uploadedAt: string } | null }>('/freelancer-profile/cv'),

  uploadCv: (data: { fileName: string; fileSize: string; uploadedAt: string }) =>
    apiClient.post<{ data: FreelancerProfileResponse }>('/freelancer-profile/cv', data),

  deleteCv: () =>
    apiClient.delete('/freelancer-profile/cv'),

  getCertifications: () =>
    apiClient.get<{ data: FreelancerProfileResponse['certifications'] }>('/freelancer-profile/certifications'),

  addCertification: (data: {
    name: string;
    issuer?: string;
    date?: string;
    verifyLink?: string;
  }) =>
    apiClient.post<{ data: any }>('/freelancer-profile/certifications', data),

  deleteCertification: (certificationId: string) =>
    apiClient.delete(`/freelancer-profile/certifications/${certificationId}`),

  addSkill: (skill: string) =>
    apiClient.post<{ data: FreelancerProfileResponse }>('/freelancer-profile/skills', { skill }),

  removeSkill: (skill: string) =>
    apiClient.delete(`/freelancer-profile/skills/${encodeURIComponent(skill)}`),

  submitAssessment: (answers: number[]) =>
    apiClient.post<{ data: { score: number; level: string } }>('/freelancer-profile/assessment', { answers }),
};
