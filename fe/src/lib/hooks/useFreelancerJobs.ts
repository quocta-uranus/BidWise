'use client';

import { useCallback, useState } from 'react';
import { jobsApi, JobResponse } from '@/lib/api/jobs.api';

export function useFreelancerJobs() {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await jobsApi.getJobs({ limit: 50, sortBy: 'createdAt' });
      setJobs(result.jobs);
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
