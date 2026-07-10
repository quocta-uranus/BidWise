'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MilestoneNameKey, TransactionDescKey } from '@/lib/i18n/demo-content';
import { resolveMilestoneKey } from '@/lib/i18n/demo-content';
import { paymentsApi } from '@/lib/api/payments.api';
import { contractsApi } from '@/lib/api/contracts.api';
import { jobsApi } from '@/lib/api/jobs.api';
import { useAuthStore } from '@/lib/auth/auth.store';

export interface PortfolioItem {
  id: string;
  title: string;
  desc: string;
  link: string;
  fileName?: string;
  fileSize?: string;
}

export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  date: string;
  verifyLink: string;
  verified: boolean;
}

export interface FreelancerProfile {
  bio: string;
  hourlyRate: number;
  phone: string;
  experience: string;
  skills: string[];
  portfolio: PortfolioItem[];
  cv: { fileName: string; fileSize: string | number; uploadedAt: string; fileUrl?: string } | null;
  certificates: Certificate[];
  available: boolean;
  assessmentCompleted: boolean;
  assessmentScore: number | null;
  assessmentLevel?: string;
  reputationMatrix?: Array<{ skill: string; score: number; benchmark: number; reviewsCount: number }>;
  reviews?: Array<{
    id: string;
    reviewerName: string;
    rating: number;
    comment: string;
    date: string;
  }>;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  category: 'frontend' | 'backend' | 'fullstack' | 'mobile';
  skills: string[];
  budget: number;
  deadline: string;
  auctionType: 'SEALED' | 'OPEN';
  postedAt: string;
  bidsCount: number;
  clientName: string;
}

export interface Bid {
  id: string;
  jobId: string;
  jobTitle: string;
  clientName: string;
  amount: number;
  days: number;
  coverLetter: string;
  fileName?: string;
  status: 'PENDING' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  matchingScore: number;
  submittedAt: string;
  matchBreakdown?: {
    skillMatch: number;
    budgetMatch: number;
    experienceMatch: number;
  };
  canEdit?: boolean;
  freelancer?: any;
}

export interface Milestone {
  id: string;
  name: string;
  nameKey?: MilestoneNameKey;
  amount: number;
  progress: number; // 0 - 100
  status: 'PENDING' | 'SUBMITTED' | 'ACCEPTED';
  deliverable?: string;
  deliverableDesc?: string;
  submittedAt?: string;
}

export interface Contract {
  id: string;
  jobId: string;
  jobTitle: string;
  clientName: string;
  amount: number;
  status: 'SIGNED' | 'ACTIVE' | 'COMPLETED';
  milestones: Milestone[];
  createdAt: string;
  clientReviewed?: boolean;
  freelancerReviewed?: boolean;
}

export interface Transaction {
  id: string;
  type: 'EARNED' | 'WITHDRAW' | 'ESCROW' | 'DEPOSIT' | 'REFUND';
  amount: number;
  description: string;
  descKey?: TransactionDescKey;
  descParams?: Record<string, string>;
  date: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
}

export interface Wallet {
  balance: number;
  escrow: number;
  totalEarned: number;
  transactions: Transaction[];
}

interface FreelancerStore {
  profile: FreelancerProfile;
  jobs: Job[];
  bids: Bid[];
  contracts: Contract[];
  wallet: Wallet;
  bookmarks: string[]; // Job IDs
  jobAlerts: boolean;

  // Bid Token System
  bidTokens: number;         // max tokens per day
  bidTokensUsed: number;     // tokens used today
  lastBidDate: string;       // ISO date of last bid
  bidPenalties: number;      // cumulative cancel count
  withdrawPenalties: number; // cancel count affecting quota

  // API sync actions
  setBidsFromApi: (bids: Bid[]) => void;
  setBidQuota: (quota: { bidTokens: number; bidTokensUsed: number; bidPenalties: number }) => void;

  // Actions
  setProfileFromApi: (profile: Partial<FreelancerProfile>) => void;
  updateProfile: (fields: Partial<FreelancerProfile>) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  addPortfolio: (item: Omit<PortfolioItem, 'id'>) => void;
  removePortfolio: (id: string) => void;
  uploadCv: (cv: { fileName: string; fileSize: string; uploadedAt: string } | null) => void;
  addCertificate: (cert: Omit<Certificate, 'id' | 'verified'>) => void;
  setAvailability: (available: boolean) => void;
  completeAssessment: (score: number) => void;
  
  // Job & Bidding Actions
  useBidToken: () => boolean;  // returns false if quota exhausted
  submitBid: (jobId: string, amount: number, days: number, coverLetter: string, fileName?: string) => Promise<void>;
  editBid: (bidId: string, amount: number, days: number, coverLetter: string) => Promise<void>;
  cancelBid: (bidId: string) => Promise<void>;
  applyBidPenalty: () => void; // reduces quota on repeated cancels
  toggleBookmark: (jobId: string) => void;
  toggleJobAlerts: (enabled: boolean) => void;
  createJob: (data: Omit<Job, 'id' | 'postedAt' | 'bidsCount'>) => void;
  deleteJob: (jobId: string) => void;

  // Fetch Actions
  fetchWallet: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  fetchContracts: () => Promise<void>;
  fetchJobs: () => Promise<void>;
  fetchMyBids: () => Promise<void>;
  fetchBidsForJob: (jobId: string) => Promise<void>;

  // Contract Actions
  signContract: (contractId: string) => Promise<void>;
  updateMilestoneProgress: (contractId: string, milestoneId: string, progress: number) => Promise<void>;
  submitMilestoneDeliverable: (contractId: string, milestoneId: string, file: File, desc: string) => Promise<void>;
  clientApproveMilestone: (contractId: string, milestoneId: string) => Promise<void>;
  reviewClient: (
    contractId: string,
    reviewData: {
      qualityRating: number;
      commRating: number;
      speedRating: number;
      comment?: string;
      anonymous?: boolean;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  reviewFreelancer: (
    contractId: string,
    reviewData: {
      qualityRating: number;
      commRating: number;
      speedRating: number;
      comment?: string;
      anonymous?: boolean;
    }
  ) => Promise<{ success: boolean; error?: string }>;

  // Wallet Actions
  requestWithdrawal: (amount: number, method: string, details: string) => Promise<{ success: boolean; error?: string }>;
  depositFunds: (amount: number, gateway: string) => Promise<{ success: boolean }>;
  requestRefund: (contractId: string) => Promise<{ success: boolean; error?: string }>;

  // Demo helper
  simulateClientAcceptBid: (bidId: string) => Promise<{ success: boolean; error?: string }>;
}

const initialJobs: Job[] = [
  {
    id: 'job-1',
    title: 'Xây dựng Landing Page Next.js cho dự án SaaS',
    description: 'Chúng tôi cần một lập trình viên frontend dựng giao diện Landing Page chuyên nghiệp, hiện đại bằng Next.js (App Router), Tailwind CSS. Thiết kế Figma đã có sẵn, đầy đủ responsive cho Mobile/Tablet/Desktop. Yêu cầu code sạch, chuẩn SEO và tối ưu hiệu năng Lighthouse đạt trên 95 điểm.',
    category: 'frontend',
    skills: ['React', 'Next.js', 'Tailwind CSS', 'TypeScript', 'SEO'],
    budget: 800,
    deadline: '2026-07-01',
    auctionType: 'OPEN',
    postedAt: '2026-06-12',
    bidsCount: 4,
    clientName: 'SaaSify Inc.'
  },
  {
    id: 'job-2',
    title: 'Phát triển Auth Service bằng NestJS & Redis',
    description: 'Cần thiết kế module Authentication/Authorization bảo mật cao. Các chức năng bao gồm: Đăng nhập/Đăng ký qua JWT Access/Refresh Token, cơ chế Token Rotation phát hiện reuse attack, gửi email OTP kích hoạt tài khoản bằng NodeMailer, lưu trữ blacklist AT bằng Redis khi đăng xuất. Database sử dụng PostgreSQL và Prisma ORM.',
    category: 'backend',
    skills: ['NestJS', 'Redis', 'PostgreSQL', 'Prisma', 'JWT', 'Docker'],
    budget: 1200,
    deadline: '2026-06-30',
    auctionType: 'SEALED',
    postedAt: '2026-06-11',
    bidsCount: 2,
    clientName: 'Fintech Solutions'
  },
  {
    id: 'job-3',
    title: 'Ứng dụng đặt đồ ăn trực tuyến bằng React Native',
    description: 'Yêu cầu viết ứng dụng đặt đồ ăn cho iOS & Android bằng React Native. Các trang cần có: Trang chủ tìm kiếm món ăn, chi tiết cửa hàng/món ăn, giỏ hàng, trang thanh toán, và tích hợp map tracking shipper thời gian thực. API backend đã hoàn thành và sẵn có tài liệu Swagger.',
    category: 'mobile',
    skills: ['React Native', 'React', 'Google Maps API', 'Tailwind CSS'],
    budget: 2500,
    deadline: '2026-07-20',
    auctionType: 'OPEN',
    postedAt: '2026-06-10',
    bidsCount: 7,
    clientName: 'GourmetGo'
  },
  {
    id: 'job-4',
    title: 'Hệ thống Quản lý Dự án (ERP) Fullstack',
    description: 'Dự án ERP nội bộ cần freelancer phát triển các tính năng quản lý công việc, Kanban board, thống kê doanh thu biểu đồ và xuất báo cáo PDF/Excel. Công nghệ sử dụng: Next.js frontend và NestJS backend. Giao diện sử dụng Shadcn UI/Tailwind CSS.',
    category: 'fullstack',
    skills: ['React', 'Next.js', 'NestJS', 'PostgreSQL', 'Tailwind CSS', 'Shadcn UI'],
    budget: 3500,
    deadline: '2026-08-01',
    auctionType: 'SEALED',
    postedAt: '2026-06-08',
    bidsCount: 3,
    clientName: 'Vintech ERP'
  }
];

export const useFreelancer = create<FreelancerStore>()(
  persist(
    (set, get) => ({
      profile: {
        bio: '',
        hourlyRate: 0,
        phone: '',
        experience: '',
        skills: ['React', 'Tailwind CSS', 'TypeScript'],
        portfolio: [],
        cv: null,
        certificates: [],
        available: true,
        assessmentCompleted: false,
        assessmentScore: null
      },
      jobs: initialJobs,
      bids: [
        {
          id: 'bid-1',
          jobId: 'job-1',
          jobTitle: 'Xây dựng Landing Page Next.js cho dự án SaaS',
          clientName: 'SaaSify Inc.',
          amount: 800,
          days: 10,
          coverLetter: 'Tôi có hơn 3 năm kinh nghiệm lập trình React/Next.js và Tailwind CSS. Tôi đã thực hiện nhiều dự án Landing page với UI bắt mắt, tối ưu SEO và tốc độ load tối đa.',
          status: 'ACCEPTED',
          matchingScore: 95,
          submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          id: 'bid-2',
          jobId: 'job-2',
          jobTitle: 'Phát triển Auth Service bằng NestJS & Redis',
          clientName: 'Fintech Solutions',
          amount: 1200,
          days: 15,
          coverLetter: 'Xin chào, tôi là chuyên gia backend với NestJS và PostgreSQL. Tôi tự tin thiết kế một hệ thống Auth Service chuẩn bảo mật với Access/Refresh tokens rotation và lưu trữ blacklist token trong Redis.',
          status: 'ACCEPTED',
          matchingScore: 88,
          submittedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          id: 'bid-3',
          jobId: 'job-3',
          jobTitle: 'Ứng dụng đặt đồ ăn trực tuyến bằng React Native',
          clientName: 'GourmetGo',
          amount: 2500,
          days: 30,
          coverLetter: 'Tôi đã xây dựng 3 ứng dụng React Native chạy tốt trên cả App Store và Google Play Store. Tôi rất rành về Google Maps API và Socket.io để tracking shipper.',
          status: 'PENDING',
          matchingScore: 78,
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      ],
      contracts: [
        {
          id: 'con-1',
          jobId: 'job-4',
          jobTitle: 'Hệ thống Quản lý Dự án (ERP) Fullstack',
          clientName: 'Vintech ERP',
          amount: 3500,
          status: 'SIGNED',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          milestones: [
            {
              id: 'ms-1a',
              name: 'design',
              nameKey: 'design' as MilestoneNameKey,
              amount: 1050,
              progress: 0,
              status: 'PENDING'
            },
            {
              id: 'ms-1b',
              name: 'coding',
              nameKey: 'coding' as MilestoneNameKey,
              amount: 1400,
              progress: 0,
              status: 'PENDING'
            },
            {
              id: 'ms-1c',
              name: 'delivery',
              nameKey: 'delivery' as MilestoneNameKey,
              amount: 1050,
              progress: 0,
              status: 'PENDING'
            }
          ]
        },
        {
          id: 'con-2',
          jobId: 'job-1',
          jobTitle: 'Xây dựng Landing Page Next.js cho dự án SaaS',
          clientName: 'SaaSify Inc.',
          amount: 800,
          status: 'ACTIVE',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          milestones: [
            {
              id: 'ms-2a',
              name: 'design',
              nameKey: 'design' as MilestoneNameKey,
              amount: 240,
              progress: 100,
              status: 'ACCEPTED'
            },
            {
              id: 'ms-2b',
              name: 'coding',
              nameKey: 'coding' as MilestoneNameKey,
              amount: 320,
              progress: 100,
              status: 'SUBMITTED',
              deliverable: 'frontend-source.zip',
              deliverableDesc: 'Gửi khách hàng source code phần giao diện và components đã hoàn thiện responsive.',
              submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            {
              id: 'ms-2c',
              name: 'delivery',
              nameKey: 'delivery' as MilestoneNameKey,
              amount: 240,
              progress: 10,
              status: 'PENDING'
            }
          ]
        },
        {
          id: 'con-3',
          jobId: 'job-2',
          jobTitle: 'Phát triển Auth Service bằng NestJS & Redis',
          clientName: 'Fintech Solutions',
          amount: 1200,
          status: 'COMPLETED',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          clientReviewed: false,
          milestones: [
            {
              id: 'ms-3a',
              name: 'design',
              nameKey: 'design' as MilestoneNameKey,
              amount: 360,
              progress: 100,
              status: 'ACCEPTED'
            },
            {
              id: 'ms-3b',
              name: 'coding',
              nameKey: 'coding' as MilestoneNameKey,
              amount: 480,
              progress: 100,
              status: 'ACCEPTED'
            },
            {
              id: 'ms-3c',
              name: 'delivery',
              nameKey: 'delivery' as MilestoneNameKey,
              amount: 360,
              progress: 100,
              status: 'ACCEPTED'
            }
          ]
        }
      ],
      wallet: {
        balance: 0,
        escrow: 0,
        totalEarned: 0,
        transactions: [] as Transaction[]
      },
      bookmarks: [],
      jobAlerts: true,

      // Bid Token System – starts at 10 per day
      bidTokens: 10,
      bidTokensUsed: 0,
      lastBidDate: '',
      bidPenalties: 0,
      withdrawPenalties: 0,

      setBidsFromApi: (bids) => set({ bids }),
      setBidQuota: (quota) => set({
        bidTokens: quota.bidTokens,
        bidTokensUsed: quota.bidTokensUsed,
        bidPenalties: quota.bidPenalties
      }),

      setProfileFromApi: (fields) =>
        set((state) => ({
          profile: { ...state.profile, ...fields }
        })),

      updateProfile: (fields) =>
        set((state) => ({
          profile: { ...state.profile, ...fields }
        })),

      addSkill: (skill) =>
        set((state) => ({
          profile: {
            ...state.profile,
            skills: state.profile.skills.includes(skill)
              ? state.profile.skills
              : [...state.profile.skills, skill]
          }
        })),

      removeSkill: (skill) =>
        set((state) => ({
          profile: {
            ...state.profile,
            skills: state.profile.skills.filter((s) => s !== skill)
          }
        })),

      addPortfolio: (item) =>
        set((state) => ({
          profile: {
            ...state.profile,
            portfolio: [
              ...state.profile.portfolio,
              { ...item, id: `port-${Date.now()}` }
            ]
          }
        })),

      removePortfolio: (id) =>
        set((state) => ({
          profile: {
            ...state.profile,
            portfolio: state.profile.portfolio.filter((item) => item.id !== id)
          }
        })),

      uploadCv: (cv) =>
        set((state) => ({
          profile: { ...state.profile, cv }
        })),

      addCertificate: (cert) =>
        set((state) => ({
          profile: {
            ...state.profile,
            certificates: [
              ...state.profile.certificates,
              { ...cert, id: `cert-${Date.now()}`, verified: true } // Auto verify for mockup
            ]
          }
        })),

      setAvailability: (available) =>
        set((state) => ({
          profile: { ...state.profile, available }
        })),

      completeAssessment: (score) => {
        let level = 'Beginner';
        if (score >= 4) level = 'Expert';
        else if (score >= 2) level = 'Intermediate';

        set((state) => ({
          profile: {
            ...state.profile,
            assessmentCompleted: true,
            assessmentScore: score,
            assessmentLevel: level,
            skills: Array.from(new Set([...state.profile.skills, 'JavaScript ES6+', 'React Hooks']))
          }
        }));
      },

      useBidToken: () => {
        const today = new Date().toISOString().split('T')[0];
        const state = get();
        // Reset used count if it's a new day
        const usedToday = state.lastBidDate === today ? state.bidTokensUsed : 0;
        const remaining = state.bidTokens - usedToday;
        if (remaining <= 0) return false;
        set({ bidTokensUsed: usedToday + 1, lastBidDate: today });
        return true;
      },

      applyBidPenalty: () => {
        const newPenalties = get().bidPenalties + 1;
        // Every 3 cancels, reduce daily token quota by 1 (floor = 3)
        const newTokens = newPenalties % 3 === 0
          ? Math.max(3, get().bidTokens - 1)
          : get().bidTokens;
        set({ bidPenalties: newPenalties, bidTokens: newTokens });
      },

      submitBid: async (jobId, amount, days, coverLetter, fileName) => {
        try {
          await jobsApi.submitBid(jobId, { amount, deliveryDays: days, proposal: coverLetter });
          await get().fetchMyBids();
          await get().fetchJobs();
        } catch (error) {
          console.error('submitBid failed:', error);
        }
      },

      editBid: async (bidId, amount, days, coverLetter) => {
        try {
          await jobsApi.updateBid(bidId, { amount, deliveryDays: days, proposal: coverLetter });
          await get().fetchMyBids();
        } catch (error) {
          console.error('editBid failed:', error);
        }
      },

      cancelBid: async (bidId) => {
        try {
          await jobsApi.cancelBid(bidId);
          await get().fetchMyBids();
          await get().fetchJobs();
          // Apply penalty
          get().applyBidPenalty();
        } catch (error) {
          console.error('cancelBid failed:', error);
        }
      },

      toggleBookmark: (jobId) =>
        set((state) => {
          const isBookmarked = state.bookmarks.includes(jobId);
          return {
            bookmarks: isBookmarked
              ? state.bookmarks.filter((id) => id !== jobId)
              : [...state.bookmarks, jobId]
          };
        }),

      toggleJobAlerts: (enabled) =>
        set({ jobAlerts: enabled }),

      createJob: (data) =>
        set((state) => ({
          jobs: [
            {
              ...data,
              id: `job-${Date.now()}`,
              postedAt: new Date().toISOString().split('T')[0],
              bidsCount: 0,
            },
            ...state.jobs,
          ],
        })),

      deleteJob: (jobId) =>
        set((state) => ({
          jobs: state.jobs.filter((j) => j.id !== jobId),
        })),


      fetchWallet: async () => {
        try {
          const w = await paymentsApi.getWallet();
          set((state) => ({
            wallet: {
              ...state.wallet,
              balance: w.balance,
              escrow: w.escrow,
              totalEarned: w.totalEarned,
            },
          }));
        } catch (error) {
          console.error('fetchWallet failed:', error);
        }
      },

      fetchTransactions: async () => {
        try {
          const txs = await paymentsApi.getTransactions();
          const mappedTxs = txs.map((tx: any) => ({
            id: tx.id,
            type: tx.type,
            amount: tx.amount,
            description: tx.description,
            descKey: tx.descKey,
            descParams: tx.descParams ? JSON.parse(JSON.stringify(tx.descParams)) : undefined,
            date: new Date(tx.date).toISOString().split('T')[0],
            status: tx.status,
          }));
          set((state) => ({
            wallet: {
              ...state.wallet,
              transactions: mappedTxs,
            },
          }));
        } catch (error) {
          console.error('fetchTransactions failed:', error);
        }
      },

      fetchContracts: async () => {
        try {
          const role = useAuthStore.getState().user?.roles?.[0];
          const rawContracts = role === 'CLIENT'
            ? await contractsApi.listClientContracts()
            : await contractsApi.listFreelancerContracts();
          const mappedContracts = rawContracts.map((c: any) => ({
            id: c.id,
            jobId: c.jobId,
            jobTitle: c.job?.title || 'Unknown Job',
            clientName: c.client?.fullName || 'Client',
            amount: c.totalAmount,
            status: c.status,
            createdAt: new Date(c.createdAt).toISOString().split('T')[0],
            clientReviewed: c.clientReviewed,
            freelancerReviewed: c.freelancerReviewed,
            milestones: (c.milestones || []).map((m: any) => ({
              id: m.id,
              name: m.title,
              amount: m.amount,
              progress: m.status === 'APPROVED' ? 100 : m.status === 'SUBMITTED' ? 100 : m.status === 'IN_PROGRESS' ? 50 : 0,
              status: m.status === 'APPROVED' ? 'ACCEPTED' : m.status === 'NOT_STARTED' ? 'PENDING' : m.status,
              submittedAt: m.submittedAt ? new Date(m.submittedAt).toISOString().split('T')[0] : undefined,
            })),
          }));
          set({ contracts: mappedContracts });
        } catch (error) {
          console.error('fetchContracts failed:', error);
        }
      },

      fetchJobs: async () => {
        try {
          const rawJobs = await jobsApi.findAll();
          const jobsArray = Array.isArray(rawJobs) ? rawJobs : (rawJobs && Array.isArray(rawJobs.jobs) ? rawJobs.jobs : []);
          const mappedJobs = jobsArray.map((j: any) => {
            let category: 'frontend' | 'backend' | 'fullstack' | 'mobile' = 'fullstack';
            const catName = (j.category?.name || '').toLowerCase();
            const titleLower = (j.title || '').toLowerCase();
            if (catName.includes('mobile')) {
              category = 'mobile';
            } else if (titleLower.includes('frontend') || titleLower.includes('landing') || titleLower.includes('ui')) {
              category = 'frontend';
            } else if (titleLower.includes('backend') || titleLower.includes('auth') || titleLower.includes('api') || titleLower.includes('service')) {
              category = 'backend';
            }
            
            return {
              id: j.id,
              title: j.title,
              description: j.description,
              category,
              skills: j.skills ? j.skills.map((s: any) => typeof s === 'string' ? s : (s.name || '')) : [],
              budget: j.budgetFormat === 'FIXED' ? (j.fixedBudget || 0) : (j.maxBudget || 0),
              deadline: new Date(j.deadline).toISOString().split('T')[0],
              auctionType: (j.auctionType === 'OPEN_BID' ? 'OPEN' : 'SEALED') as 'OPEN' | 'SEALED',
              postedAt: new Date(j.createdAt).toISOString().split('T')[0],
              bidsCount: j._count?.bids || 0,
              clientName: j.client?.fullName || 'Client',
            };
          });
          set({ jobs: mappedJobs });
        } catch (error) {
          console.error('fetchJobs failed:', error);
        }
      },

      fetchMyBids: async () => {
        try {
          const rawBids = await jobsApi.getMyBids();
          const mappedBids = rawBids.map((b: any) => ({
            id: b.id,
            jobId: b.jobId,
            jobTitle: b.job?.title || '',
            clientName: b.job?.client?.fullName || 'Client',
            amount: b.amount,
            days: b.deliveryDays,
            coverLetter: b.proposal,
            status: b.status,
            matchingScore: b.matchingScore || 85,
            submittedAt: new Date(b.createdAt).toISOString().split('T')[0],
          }));
          set({ bids: mappedBids });
        } catch (error) {
          console.error('fetchMyBids failed:', error);
        }
      },

      fetchBidsForJob: async (jobId: string) => {
        try {
          const rawBids = await jobsApi.getBidsForJob(jobId);
          const mappedBids = rawBids.map((b: any) => ({
            id: b.id,
            jobId: b.jobId,
            jobTitle: b.job?.title || '',
            clientName: b.freelancer?.fullName || 'Freelancer',
            amount: b.amount,
            days: b.deliveryDays,
            coverLetter: b.proposal,
            status: b.status,
            matchingScore: b.matchingScore || 85,
            submittedAt: new Date(b.createdAt).toISOString().split('T')[0],
            freelancer: b.freelancer,
          }));

          set((state) => {
            const otherBids = state.bids.filter((ob) => ob.jobId !== jobId);
            return { bids: [...mappedBids, ...otherBids] };
          });
        } catch (error) {
          console.error('fetchBidsForJob failed:', error);
        }
      },

      signContract: async (contractId) => {
        try {
          await contractsApi.updateMilestoneProgress(contractId, '', '');
          await get().fetchContracts();
        } catch (error) {
          console.error('signContract failed:', error);
        }
      },

      updateMilestoneProgress: async (contractId, milestoneId, _progress) => {
        try {
          await contractsApi.updateMilestoneProgress(contractId, milestoneId, '');
          await get().fetchContracts();
        } catch (error) {
          console.error('updateMilestoneProgress failed:', error);
        }
      },

      submitMilestoneDeliverable: async (contractId, milestoneId, file, desc) => {
        try {
          await contractsApi.submitMilestone(contractId, milestoneId, file, desc);
          await get().fetchContracts();
        } catch (error) {
          console.error('submitMilestoneDeliverable failed:', error);
        }
      },

      clientApproveMilestone: async (contractId, milestoneId) => {
        try {
          await contractsApi.reviewMilestone(contractId, milestoneId, 'APPROVED');
          await get().fetchContracts();
          await get().fetchWallet();
          await get().fetchTransactions();
        } catch (error) {
          console.error('clientApproveMilestone failed:', error);
        }
      },

      reviewClient: async (contractId, reviewData) => {
        try {
          const res = await contractsApi.reviewClient(contractId, reviewData);
          await get().fetchContracts();
          return { success: res.success };
        } catch (error: any) {
          console.error('reviewClient failed:', error);
          const errMsg = error.response?.data?.message || 'Có lỗi xảy ra khi đánh giá.';
          return { success: false, error: errMsg };
        }
      },

      reviewFreelancer: async (contractId, reviewData) => {
        try {
          const res = await contractsApi.reviewFreelancer(contractId, reviewData);
          await get().fetchContracts();
          return { success: res.success };
        } catch (error: any) {
          console.error('reviewFreelancer failed:', error);
          const errMsg = error.response?.data?.message || 'Có lỗi xảy ra khi đánh giá.';
          return { success: false, error: errMsg };
        }
      },

      requestWithdrawal: async (amount, method, details) => {
        try {
          const res = await paymentsApi.withdraw({ amount, method, details });
          await get().fetchWallet();
          await get().fetchTransactions();
          // We also trigger a periodic reload because the withdrawal succeeds in 15 seconds
          setTimeout(async () => {
            await get().fetchWallet();
            await get().fetchTransactions();
          }, 15500);
          return { success: res.success };
        } catch (error: any) {
          console.error('requestWithdrawal failed:', error);
          const errMsg = error.response?.data?.message || 'Có lỗi xảy ra khi rút tiền.';
          return { success: false, error: errMsg };
        }
      },

      depositFunds: async (amount, gateway) => {
        try {
          const res = await paymentsApi.deposit({ amount, gateway });
          await get().fetchWallet();
          await get().fetchTransactions();
          // Trigger a reload because the simulated webhook deposit finishes in 3 seconds
          setTimeout(async () => {
            await get().fetchWallet();
            await get().fetchTransactions();
          }, 3500);
          return { success: res.success };
        } catch (error) {
          console.error('depositFunds failed:', error);
          return { success: false };
        }
      },

      requestRefund: async (contractId) => {
        try {
          await contractsApi.cancelClientContract(contractId, 'Client requested refund');
          await get().fetchContracts();
          await get().fetchWallet();
          await get().fetchTransactions();
          return { success: true };
        } catch (error: any) {
          console.error('requestRefund failed:', error);
          const errMsg = error.response?.data?.message || 'Có lỗi xảy ra khi yêu cầu hoàn tiền.';
          return { success: false, error: errMsg };
        }
      },

      simulateClientAcceptBid: async (bidId) => {
        try {
          // acceptBid removed — client now uses client-bids API to decide bids
          console.warn('simulateClientAcceptBid: use client-bids API instead, bidId:', bidId);
          await get().fetchContracts();
          await get().fetchWallet();
          await get().fetchTransactions();
          set((state) => ({
            bids: state.bids.map((b) =>
              b.id === bidId ? { ...b, status: 'ACCEPTED' as const } : b
            ),
          }));
          return { success: true };
        } catch (error: any) {
          console.error('simulateClientAcceptBid failed:', error);
          const errMsg = error.response?.data?.message || 'Failed to accept bid';
          return { success: false, error: errMsg };
        }
      }
    }),
    {
      name: 'bidwise-freelancer-store',
      partialize: (state) => ({
        profile: state.profile,
        bidTokens: state.bidTokens,
        bidTokensUsed: state.bidTokensUsed,
        lastBidDate: state.lastBidDate,
        bidPenalties: state.bidPenalties,
        withdrawPenalties: state.withdrawPenalties,
        jobAlerts: state.jobAlerts,
        bookmarks: state.bookmarks,
      }),
    }
  )
);
