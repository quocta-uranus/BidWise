'use client';

import { useCallback, useState } from 'react';
import { ApiBid, BidStats, bidsApi } from '@/lib/api/bids.api';
import { getApiErrorMessage } from '@/lib/api/api-error';
import type { TranslationKey } from '@/lib/i18n/translations';
import { useFreelancer, type Bid } from './useFreelancer';

const BID_ERROR_MESSAGES: Record<string, string> = {
  BID_TOKEN_LIMIT_REACHED: 'Hết lượt thầu hôm nay.',
  BID_ALREADY_EXISTS: 'Bạn đã gửi đề xuất thầu cho dự án này.',
  FREELANCER_NOT_AVAILABLE: 'Tài khoản đang ở trạng thái Bận.',
  JOB_NOT_FOUND: 'Không tìm thấy dự án.',
  JOB_NOT_OPEN: 'Dự án không còn nhận thầu.',
};

const BID_ERROR_KEYS: Partial<Record<string, TranslationKey>> = {
  BID_TOKEN_LIMIT_REACHED: 'jobs.errNoTokens',
  BID_ALREADY_EXISTS: 'jobs.errAlreadyBid',
  FREELANCER_NOT_AVAILABLE: 'jobs.errNotAvailable',
};

function formatBidError(error: unknown, fallback: string): string {
  const code = getApiErrorMessage(error);
  if (code && BID_ERROR_MESSAGES[code]) return BID_ERROR_MESSAGES[code];
  return fallback;
}

export function resolveBidErrorMessage(
  error: unknown,
  t: (key: TranslationKey) => string,
  fallbackKey: TranslationKey = 'jobs.errAlreadyBid',
): string {
  const code = getApiErrorMessage(error);
  if (code && BID_ERROR_KEYS[code]) return t(BID_ERROR_KEYS[code]!);
  return t(fallbackKey);
}

export function mapApiBidToBid(api: ApiBid): Bid {
  return {
    id: api.id,
    jobId: api.jobId,
    jobTitle: api.jobTitle,
    clientName: api.clientName,
    amount: api.amount,
    days: api.days ?? 0,
    coverLetter: api.coverLetter ?? '',
    fileName: api.fileName ?? undefined,
    status: api.status as Bid['status'],
    matchingScore: api.matchingScore ?? 0,
    submittedAt: api.submittedAt,
    matchBreakdown: undefined,
    canEdit: api.canEdit,
  };
}

export function useFreelancerBids() {
  const bids = useFreelancer((s) => s.bids);
  const setBidsFromApi = useFreelancer((s) => s.setBidsFromApi);
  const setBidQuota = useFreelancer((s) => s.setBidQuota);

  const [stats, setStats] = useState<BidStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withdrawPenalties, setWithdrawPenalties] = useState(0);

  const loadBids = useCallback(
    async (status?: string) => {
      setLoading(true);
      setError(null);
      try {
        const [list, statsData, quota] = await Promise.all([
          bidsApi.listMyBids(status && status !== 'ALL' ? status : undefined),
          bidsApi.getStats(),
          bidsApi.getQuota(),
        ]);
        setBidsFromApi(list.map(mapApiBidToBid));
        setStats(statsData);
        setWithdrawPenalties(quota.bidPenalties ?? 0);
        setBidQuota(quota);
      } catch (e) {
        setError('Không thể tải danh sách bid.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [setBidsFromApi, setBidQuota],
  );

  const getBidDetail = useCallback(async (id: string) => {
    const api = await bidsApi.getBid(id);
    return mapApiBidToBid(api);
  }, []);

  const updateBid = useCallback(
    async (id: string, amount: number, days: number, coverLetter: string) => {
      setSaving(true);
      setError(null);
      try {
        const updated = await bidsApi.updateBid(id, { amount, days, coverLetter });
        setBidsFromApi(bids.map((b) => (b.id === id ? mapApiBidToBid(updated) : b)));
        const statsData = await bidsApi.getStats();
        setStats(statsData);
      } catch (e) {
        setError(formatBidError(e, 'Cập nhật bid thất bại.'));
        console.error(e);
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [bids, setBidsFromApi],
  );

  const withdrawBid = useCallback(
    async (id: string) => {
      setSaving(true);
      setError(null);
      try {
        await bidsApi.withdrawBid(id);
        await loadBids();
      } catch (e) {
        setError('Hủy bid thất bại.');
        console.error(e);
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [loadBids],
  );

  const submitBid = useCallback(
    async (data: {
      jobId: string;
      amount: number;
      days: number;
      coverLetter: string;
      fileName?: string;
    }) => {
      setSaving(true);
      setError(null);
      try {
        const result = await bidsApi.submitBid(data);
        setBidsFromApi([mapApiBidToBid(result.bid), ...bids.filter((b) => b.jobId !== data.jobId)]);
        setBidQuota(result.quota);
        const statsData = await bidsApi.getStats();
        setStats(statsData);
        return result;
      } catch (e) {
        setError(formatBidError(e, 'Gửi bid thất bại.'));
        console.error(e);
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [bids, setBidsFromApi, setBidQuota],
  );

  return {
    bids,
    stats,
    loading,
    saving,
    error,
    withdrawPenalties,
    loadBids,
    getBidDetail,
    updateBid,
    withdrawBid,
    submitBid,
  };
}
