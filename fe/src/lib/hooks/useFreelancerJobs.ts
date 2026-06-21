'use client';

import { useCallback, useState } from 'react';
import { jobsApi, JobResponse } from '@/lib/api/jobs.api';
import type { Job } from './useFreelancer';

export function useFreelancerJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await jobsApi.list({ limit: 50, sortBy: 'createdAt', sortOrder: 'desc' });
      setJobs(result.jobs.map((j: JobResponse) => ({
        id: j.id,
        title: j.title,
        description: j.description,
        category: (j.category?.name ?? 'other') as Job['category'],
        skills: j.skills ?? [],
        budget: j.fixedBudget ?? j.minBudget ?? j.budget ?? 0,
        deadline: j.deadline,
        auctionType: j.auctionType === 'OPEN_BID' ? 'OPEN' : 'SEALED',
        postedAt: j.createdAt,
        bidsCount: j._count?.bids ?? 0,
        clientName: j.client?.fullName ?? '',
      })));
      setBookmarks([]);
    } catch (e) {
      setError('Không thể tải danh sách jobs.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleBookmark = useCallback(async (jobId: string) => {
    try {
      const result = await jobsApi.toggleBookmark(jobId);
      setBookmarks((prev) =>
        result.bookmarked ? [...new Set([...prev, jobId])] : prev.filter((id) => id !== jobId),
      );
    } catch (e) {
      console.error(e);
    }
  }, []);

  return { jobs, bookmarks, loading, error, loadJobs, toggleBookmark };
}
