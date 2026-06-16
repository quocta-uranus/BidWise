'use client';

import { useCallback, useState } from 'react';
import { jobsApi, mapApiJobToJob } from '@/lib/api/jobs.api';
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
      const result = await jobsApi.list({ limit: 50, sortBy: 'newest' });
      setJobs(result.items.map(mapApiJobToJob));
      setBookmarks(result.items.filter((j) => j.isBookmarked).map((j) => j.id));
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
