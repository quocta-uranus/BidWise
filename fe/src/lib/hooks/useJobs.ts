'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Job } from './useFreelancer';

export interface JobSearchFilters {
  keyword?: string;
  categoryId?: string;
  minBudget?: number;
  maxBudget?: number;
  skills?: string[];
  auctionType?: 'SEALED_BID' | 'OPEN_BID';
  deadlineBefore?: string;
  sortBy?: 'createdAt' | 'budget' | 'deadline';
  sortOrder?: 'asc' | 'desc';
}

export interface SuggestedJob extends Job {
  matchScore?: number;
  skillMatch?: number;
  matchedSkills?: string[];
}

interface JobsStore {
  // Job listings
  jobs: Job[];
  suggestedJobs: SuggestedJob[];
  bookmarkedJobs: Job[];
  
  // Search & filters
  filters: JobSearchFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  
  // Job alerts
  alertsEnabled: boolean;
  alertFrequency: 'daily' | 'instant';
  
  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions - Jobs
  setJobs: (jobs: Job[], pagination?: any) => void;
  setSuggestedJobs: (jobs: SuggestedJob[]) => void;
  setBookmarkedJobs: (jobs: Job[]) => void;
  
  // Actions - Search & Filters
  setFilters: (filters: Partial<JobSearchFilters>) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  
  // Actions - Bookmarks
  toggleBookmark: (jobId: string) => void;
  addBookmark: (job: Job) => void;
  removeBookmark: (jobId: string) => void;
  isBookmarked: (jobId: string) => boolean;
  
  // Actions - Alerts
  setAlertsEnabled: (enabled: boolean) => void;
  setAlertFrequency: (frequency: 'daily' | 'instant') => void;
  
  // Actions - UI
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useJobs = create<JobsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      jobs: [],
      suggestedJobs: [],
      bookmarkedJobs: [],
      
      filters: {
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 10,
      },
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
      
      alertsEnabled: true,
      alertFrequency: 'daily',
      
      isLoading: false,
      error: null,

      // Set jobs with pagination
      setJobs: (jobs, pagination) =>
        set((state) => ({
          jobs,
          pagination: pagination || state.pagination,
        })),

      setSuggestedJobs: (jobs) => set({ suggestedJobs: jobs }),

      setBookmarkedJobs: (jobs) => set({ bookmarkedJobs: jobs }),

      // Search & Filters
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
          pagination: { ...state.pagination, page: 1 }, // Reset to page 1 on filter change
        })),

      clearFilters: () =>
        set({
          filters: {
            sortBy: 'createdAt',
            sortOrder: 'desc',
          },
          pagination: { ...get().pagination, page: 1 },
        }),

      setPage: (page) =>
        set((state) => ({
          pagination: { ...state.pagination, page },
        })),

      // Bookmarks
      toggleBookmark: (jobId) => {
        const isCurrentlyBookmarked = get().bookmarkedJobs.some((j) => j.id === jobId);
        if (isCurrentlyBookmarked) {
          get().removeBookmark(jobId);
        } else {
          const job = get().jobs.find((j) => j.id === jobId) || 
                      get().suggestedJobs.find((j) => j.id === jobId);
          if (job) {
            get().addBookmark(job as Job);
          }
        }
      },

      addBookmark: (job) =>
        set((state) => ({
          bookmarkedJobs: state.bookmarkedJobs.some((j) => j.id === job.id)
            ? state.bookmarkedJobs
            : [job, ...state.bookmarkedJobs],
        })),

      removeBookmark: (jobId) =>
        set((state) => ({
          bookmarkedJobs: state.bookmarkedJobs.filter((j) => j.id !== jobId),
        })),

      isBookmarked: (jobId) => get().bookmarkedJobs.some((j) => j.id === jobId),

      // Alerts
      setAlertsEnabled: (enabled) => set({ alertsEnabled: enabled }),
      setAlertFrequency: (frequency) => set({ alertFrequency: frequency }),

      // UI State
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'bidwise-jobs-store',
      partialize: (state) => ({
        bookmarkedJobs: state.bookmarkedJobs,
        alertsEnabled: state.alertsEnabled,
        alertFrequency: state.alertFrequency,
      }),
    }
  )
);
