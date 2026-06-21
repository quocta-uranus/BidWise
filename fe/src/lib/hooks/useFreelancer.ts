'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MilestoneNameKey, TransactionDescKey } from '@/lib/i18n/demo-content';
import { resolveMilestoneKey } from '@/lib/i18n/demo-content';

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
}

export interface Transaction {
  id: string;
  type: 'EARNED' | 'WITHDRAW' | 'ESCROW';
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
  submitBid: (jobId: string, amount: number, days: number, coverLetter: string, fileName?: string) => void;
  editBid: (bidId: string, amount: number, days: number, coverLetter: string) => void;
  cancelBid: (bidId: string) => void;
  applyBidPenalty: () => void; // reduces quota on repeated cancels
  toggleBookmark: (jobId: string) => void;
  toggleJobAlerts: (enabled: boolean) => void;
  createJob: (data: Omit<Job, 'id' | 'postedAt' | 'bidsCount'>) => void;
  deleteJob: (jobId: string) => void;

  // Contract Actions
  signContract: (contractId: string) => void;
  updateMilestoneProgress: (contractId: string, milestoneId: string, progress: number) => void;
  submitMilestoneDeliverable: (contractId: string, milestoneId: string, fileName: string, desc: string) => void;
  clientApproveMilestone: (contractId: string, milestoneId: string) => void; // Simulated client action
  reviewClient: (contractId: string) => void;

  // Wallet Actions
  requestWithdrawal: (amount: number, method: string, details: string) => { success: boolean; error?: string };

  // Demo helper
  simulateClientAcceptBid: (bidId: string) => void;
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
        balance: 2940, // 1500 (init) + 240 (con-2 design) + 1200 (con-3 total)
        escrow: 4060, // 3500 (con-1 total) + 320 (con-2 coding) + 240 (con-2 delivery)
        totalEarned: 2940,
        transactions: [
          {
            id: 'tx-con-3',
            type: 'EARNED',
            amount: 1200,
            description: 'Nghiệm thu toàn bộ: Phát triển Auth Service bằng NestJS & Redis',
            descKey: 'milestoneApproved',
            descParams: { jobId: 'job-2', milestoneKey: 'delivery' },
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'SUCCESS'
          },
          {
            id: 'tx-con-2-design',
            type: 'EARNED',
            amount: 240,
            description: 'Nghiệm thu cột mốc: Thiết kế giao diện',
            descKey: 'milestoneApproved',
            descParams: { jobId: 'job-1', milestoneKey: 'design' },
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'SUCCESS'
          },
          {
            id: 'tx-escrow-con-1',
            type: 'ESCROW',
            amount: 3500,
            description: 'Ký quỹ hợp đồng: Hệ thống Quản lý Dự án (ERP) Fullstack',
            descKey: 'escrow',
            descParams: { jobId: 'job-4', milestoneKey: '' },
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'SUCCESS'
          },
          {
            id: 'tx-escrow-con-2',
            type: 'ESCROW',
            amount: 800,
            description: 'Ký quỹ hợp đồng: Xây dựng Landing Page Next.js cho dự án SaaS',
            descKey: 'escrow',
            descParams: { jobId: 'job-1', milestoneKey: '' },
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'SUCCESS'
          },
          {
            id: 'tx-init',
            type: 'EARNED',
            amount: 1500,
            description: 'Số dư khởi tạo hệ thống (Demo)',
            descKey: 'initBalance',
            date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'SUCCESS'
          }
        ] as Transaction[]
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

      submitBid: (jobId, amount, days, coverLetter, fileName) => {
        const job = get().jobs.find((j) => j.id === jobId);
        if (!job) return;

        // Tính toán match score demo
        let score = 50;
        const profileSkills = get().profile.skills;
        const matchedSkills = job.skills.filter(s => profileSkills.includes(s));
        score += (matchedSkills.length / job.skills.length) * 30;
        if (amount <= job.budget) score += 15;
        if (get().profile.assessmentCompleted) score += 5;

        const newBid: Bid = {
          id: `bid-${Date.now()}`,
          jobId,
          jobTitle: job.title,
          clientName: job.clientName,
          amount,
          days,
          coverLetter,
          fileName,
          status: 'PENDING',
          matchingScore: Math.round(score),
          submittedAt: new Date().toISOString().split('T')[0]
        };

        // Update job bid count
        const updatedJobs = get().jobs.map((j) =>
          j.id === jobId ? { ...j, bidsCount: j.bidsCount + 1 } : j
        );

        set((state) => ({
          bids: [newBid, ...state.bids],
          jobs: updatedJobs
        }));
      },

      editBid: (bidId, amount, days, coverLetter) =>
        set((state) => ({
          bids: state.bids.map((b) =>
            b.id === bidId
              ? { ...b, amount, days, coverLetter, submittedAt: new Date().toISOString().split('T')[0] }
              : b
          )
        })),

      cancelBid: (bidId) => {
        const bid = get().bids.find((b) => b.id === bidId);
        if (!bid) return;

        // Giảm bid count của job tương ứng
        const updatedJobs = get().jobs.map((j) =>
          j.id === bid.jobId ? { ...j, bidsCount: Math.max(0, j.bidsCount - 1) } : j
        );

        set((state) => ({
          bids: state.bids.map((b) =>
            b.id === bidId ? { ...b, status: 'WITHDRAWN' as const } : b
          ),
          jobs: updatedJobs
        }));

        // Apply penalty after marking as withdrawn
        get().applyBidPenalty();
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


      signContract: (contractId) =>
        set((state) => ({
          contracts: state.contracts.map((c) =>
            c.id === contractId ? { ...c, status: 'ACTIVE' as const } : c
          )
        })),

      updateMilestoneProgress: (contractId, milestoneId, progress) =>
        set((state) => ({
          contracts: state.contracts.map((c) => {
            if (c.id !== contractId) return c;
            const updatedMilestones = c.milestones.map((m) =>
              m.id === milestoneId ? { ...m, progress } : m
            );
            return { ...c, milestones: updatedMilestones };
          })
        })),

      submitMilestoneDeliverable: (contractId, milestoneId, fileName, desc) =>
        set((state) => ({
          contracts: state.contracts.map((c) => {
            if (c.id !== contractId) return c;
            const updatedMilestones = c.milestones.map((m) =>
              m.id === milestoneId
                ? {
                    ...m,
                    progress: 100,
                    status: 'SUBMITTED' as const,
                    deliverable: fileName,
                    deliverableDesc: desc,
                    submittedAt: new Date().toISOString().split('T')[0]
                  }
                : m
            );
            return { ...c, milestones: updatedMilestones };
          })
        })),

      clientApproveMilestone: (contractId, milestoneId) => {
        const contract = get().contracts.find((c) => c.id === contractId);
        if (!contract) return;
        const milestone = contract.milestones.find((m) => m.id === milestoneId);
        if (!milestone) return;

        // Cập nhật trạng thái milestone sang ACCEPTED
        const updatedContracts = get().contracts.map((c) => {
          if (c.id !== contractId) return c;
          const updatedMilestones = c.milestones.map((m) =>
            m.id === milestoneId ? { ...m, status: 'ACCEPTED' as const } : m
          );
          
          // Kiểm tra xem tất cả milestones đã hoàn thành chưa
          const allCompleted = updatedMilestones.every(m => m.status === 'ACCEPTED');
          return {
            ...c,
            milestones: updatedMilestones,
            status: allCompleted ? ('COMPLETED' as const) : c.status
          };
        });

        // Chuyển tiền từ Escrow sang Balance
        const wallet = get().wallet;
        const newBalance = wallet.balance + milestone.amount;
        const newEscrow = Math.max(0, wallet.escrow - milestone.amount);
        const newTotalEarned = wallet.totalEarned + milestone.amount;
        
        const newTransaction: Transaction = {
          id: `tx-${Date.now()}`,
          type: 'EARNED',
          amount: milestone.amount,
          description: `Nghiệm thu cột mốc: ${milestone.name}`,
          descKey: 'milestoneApproved',
          descParams: {
            jobId: contract.jobId,
            milestoneKey: resolveMilestoneKey(milestone) ?? 'design',
          },
          date: new Date().toISOString().split('T')[0],
          status: 'SUCCESS'
        };

        set({
          contracts: updatedContracts,
          wallet: {
            balance: newBalance,
            escrow: newEscrow,
            totalEarned: newTotalEarned,
            transactions: [newTransaction, ...wallet.transactions]
          }
        });
      },

      reviewClient: (contractId) =>
        set((state) => ({
          contracts: state.contracts.map((c) =>
            c.id === contractId ? { ...c, clientReviewed: true } : c
          )
        })),

      requestWithdrawal: (amount, method, details) => {
        const wallet = get().wallet;
        if (amount > wallet.balance) {
          return { success: false, error: 'Số dư không đủ để thực hiện rút tiền.' };
        }
        if (amount < 10) {
          return { success: false, error: 'Số tiền rút tối thiểu là 10 USD.' };
        }

        const newBalance = wallet.balance - amount;
        
        const newTransaction: Transaction = {
          id: `tx-${Date.now()}`,
          type: 'WITHDRAW',
          amount,
          description: `Yêu cầu rút tiền về ${method}`,
          descKey: 'withdraw',
          descParams: { method, details },
          date: new Date().toISOString().split('T')[0],
          status: 'PENDING'
        };

        set({
          wallet: {
            ...wallet,
            balance: newBalance,
            transactions: [newTransaction, ...wallet.transactions]
          }
        });

        // Simulate success after 10 seconds for demo UI
        setTimeout(() => {
          set((state) => {
            const txs = state.wallet.transactions.map((t) =>
              t.id === newTransaction.id ? { ...t, status: 'SUCCESS' as const } : t
            );
            return {
              wallet: { ...state.wallet, transactions: txs }
            };
          });
        }, 15000);

        return { success: true };
      },

      simulateClientAcceptBid: (bidId) => {
        const bid = get().bids.find((b) => b.id === bidId);
        if (!bid || bid.status !== 'PENDING') return;

        // Cập nhật trạng thái bid sang ACCEPTED
        const updatedBids = get().bids.map((b) =>
          b.id === bidId ? { ...b, status: 'ACCEPTED' as const } : b
        );

        // Tạo contract mới
        const contractAmount = bid.amount;
        const newContract: Contract = {
          id: `con-${Date.now()}`,
          jobId: bid.jobId,
          jobTitle: bid.jobTitle,
          clientName: bid.clientName,
          amount: contractAmount,
          status: 'SIGNED', // Cần freelancer ký nhận
          createdAt: new Date().toISOString().split('T')[0],
          milestones: [
            {
              id: `ms-1-${Date.now()}`,
              name: 'design',
              nameKey: 'design' as MilestoneNameKey,
              amount: Math.round(contractAmount * 0.3),
              progress: 0,
              status: 'PENDING'
            },
            {
              id: `ms-2-${Date.now()}`,
              name: 'coding',
              nameKey: 'coding' as MilestoneNameKey,
              amount: Math.round(contractAmount * 0.4),
              progress: 0,
              status: 'PENDING'
            },
            {
              id: `ms-3-${Date.now()}`,
              name: 'delivery',
              nameKey: 'delivery' as MilestoneNameKey,
              amount: Math.round(contractAmount * 0.3),
              progress: 0,
              status: 'PENDING'
            }
          ]
        };

        // Cộng tiền vào Escrow
        const wallet = get().wallet;
        const newEscrow = wallet.escrow + contractAmount;

        const newTransaction: Transaction = {
          id: `tx-escrow-${Date.now()}`,
          type: 'ESCROW',
          amount: contractAmount,
          description: `Ký quỹ hợp đồng: ${bid.jobTitle}`,
          descKey: 'escrow',
          descParams: { jobId: bid.jobId },
          date: new Date().toISOString().split('T')[0],
          status: 'SUCCESS'
        };

        set({
          bids: updatedBids,
          contracts: [newContract, ...get().contracts],
          wallet: {
            ...wallet,
            escrow: newEscrow,
            transactions: [newTransaction, ...wallet.transactions]
          }
        });
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
