import { apiClient } from './client';

export interface PortfolioItem {
  id: string;
  title: string;
  desc: string;
  link: string;
  fileName?: string;
  fileSize?: string;
  fileUrl?: string;
}

export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  date: string;
  verifyLink: string;
  verified: boolean;
}

export interface FreelancerCv {
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  fileUrl?: string;
}

export interface AssessmentQuestion {
  id: string;
  q: string;
  options: string[];
  correct: number;
}

export interface ProfileCompleteness {
  bio: number;
  hourlyRate: number;
  phone: number;
  portfolio: number;
  cv: number;
  certificates: number;
  assessment: number;
  total: number;
}

export interface ApiFreelancerProfile {
  bio: string;
  phone: string;
  hourlyRate: number;
  experience: string;
  skills: string[];
  portfolio: PortfolioItem[];
  cv: FreelancerCv | null;
  certificates: Certificate[];
  available: boolean;
  assessmentCompleted: boolean;
  assessmentScore: number | null;
  assessmentLevel?: string;
  completeness?: ProfileCompleteness;
}

export const freelancerApi = {
  // Get freelancer profile
  getProfile: () =>
    apiClient.get<{ data: ApiFreelancerProfile }>('/freelancer/profile'),

  // Update freelancer profile
  updateProfile: (data: {
    bio?: string;
    phone?: string;
    hourlyRate?: number;
    experience?: string;
    skills?: string[];
  }) =>
    apiClient.patch<{ data: ApiFreelancerProfile }>('/freelancer/profile', data),

  // Upload CV
  uploadCv: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<{ data: ApiFreelancerProfile }>('/freelancer/cv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Delete CV
  deleteCv: () =>
    apiClient.delete<{ data: ApiFreelancerProfile }>('/freelancer/cv'),

  // Add portfolio item
  addPortfolio: (
    data: { title: string; desc?: string; link?: string },
    file?: File
  ) => {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.desc) formData.append('desc', data.desc);
    if (data.link) formData.append('link', data.link);
    if (file) formData.append('file', file);
    return apiClient.post<{ data: ApiFreelancerProfile }>('/freelancer/portfolio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Delete portfolio item
  deletePortfolio: (id: string) =>
    apiClient.delete<{ data: ApiFreelancerProfile }>(`/freelancer/portfolio/${id}`),

  // Add certificate
  addCertificate: (
    data: { name: string; issuer: string; date: string; verifyLink?: string },
    image?: File
  ) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('issuer', data.issuer);
    formData.append('date', data.date);
    if (data.verifyLink) formData.append('verifyLink', data.verifyLink);
    if (image) formData.append('image', image);
    return apiClient.post<{ data: ApiFreelancerProfile }>('/freelancer/certificates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Delete certificate
  deleteCertificate: (id: string) =>
    apiClient.delete<{ data: ApiFreelancerProfile }>(`/freelancer/certificates/${id}`),

  // Set availability
  setAvailable: (available: boolean) =>
    apiClient.patch<{ data: ApiFreelancerProfile }>('/freelancer/availability', { available }),

  // Get assessment questions
  getAssessmentQuestions: () =>
    apiClient.get<{ data: { questions: AssessmentQuestion[] } }>('/freelancer/assessment/questions'),

  // Submit assessment
  submitAssessment: (answers: Array<{ questionId: string; selectedIndex: number }>) =>
    apiClient.post<{ data: { profile: ApiFreelancerProfile; score: number } }>('/freelancer/assessment/submit', { answers }),
};
