'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFreelancer, Transaction } from '@/lib/hooks/useFreelancer';
import { useFreelancerProfile } from '@/lib/hooks/useFreelancerProfile';
import { useAuthStore } from '@/lib/auth/auth.store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { localizeTransaction } from '@/lib/i18n/demo-content';
import {
  Wallet as WalletIcon,
  Lock as LockIcon,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  Award,
  CheckCircle2,
  Star,
  FileText,
  Percent,
  History,
  Loader2,
  Building,
  Smartphone,
  CreditCard,
  Plus,
  RotateCcw,
  LayoutDashboard,
  AlertCircle,
  HelpCircle,
  Check,
  Download
} from 'lucide-react';

/* ── helpers ──────────────────────────────────────────────────── */
type TabKey = 'overview' | 'history' | 'withdraw' | 'deposit' | 'reputation';

function StarRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className="transition-all duration-150 transform hover:scale-110"
          >
            <Star
              className={`w-5 h-5 ${
                s <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-200 hover:text-amber-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── main component ───────────────────────────────────────────── */
export default function EarningsTab() {
  const { wallet, contracts, bids, jobs, requestWithdrawal, depositFunds, reviewClient } = useFreelancer();
  const { profile, loadProfile } = useFreelancerProfile();
  const { user } = useAuthStore();
  const { t, language } = useTranslation();

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const currentRole = user?.roles[0] || 'FREELANCER';
  const isClient = currentRole === 'CLIENT';

  /* ── Tab navigation definitions ── */
  const clientTabs = useMemo(() => [
    { key: 'overview' as TabKey, label: { vi: 'Tổng quan', en: 'Overview' }, icon: LayoutDashboard },
    { key: 'history' as TabKey, label: { vi: 'Lịch sử giao dịch', en: 'Transactions' }, icon: History },
    { key: 'deposit' as TabKey, label: { vi: 'Nạp tiền', en: 'Deposit Funds' }, icon: PlusCircle },
  ], []);

  const freelancerTabs = useMemo(() => [
    { key: 'overview' as TabKey, label: { vi: 'Tổng quan', en: 'Overview' }, icon: LayoutDashboard },
    { key: 'history' as TabKey, label: { vi: 'Lịch sử giao dịch', en: 'Transactions' }, icon: History },
    { key: 'withdraw' as TabKey, label: { vi: 'Rút tiền', en: 'Withdraw' }, icon: ArrowUpRight },
    { key: 'reputation' as TabKey, label: { vi: 'Skill Reputation', en: 'Skill Scores' }, icon: Award },
  ], []);

  const TABS = isClient ? clientTabs : freelancerTabs;

  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const displayTab = useMemo(() => {
    const keys = TABS.map((tab) => tab.key);
    if (keys.includes(activeTab)) return activeTab;
    return 'overview';
  }, [activeTab, TABS]);

  /* ── withdraw form ── */
  const [method, setMethod] = useState('bank');
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNum, setAccountNum] = useState('');
  const [accountName, setAccountName] = useState('');
  const [momoPhone, setMomoPhone] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [wdError, setWdError] = useState('');
  const [wdSuccess, setWdSuccess] = useState(false);

  /* ── deposit form (Client) ── */
  const [depositAmount, setDepositAmount] = useState('');
  const [depositGateway, setDepositGateway] = useState('vnpay');
  const [dpError, setDpError] = useState('');
  const [dpSuccess, setDpSuccess] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);

  /* ── history search / filter ── */
  const [txSearch, setTxSearch] = useState('');
  const [txType, setTxType] = useState<'ALL' | 'EARNED' | 'WITHDRAW' | 'ESCROW' | 'DEPOSIT' | 'REFUND'>('ALL');

  /* ── client review ── */
  const [reviewContractId, setReviewContractId] = useState<string | null>(null);
  const [commRating, setCommRating] = useState(5);
  const [payRating, setPayRating] = useState(5);
  const [clarityRating, setClarityRating] = useState(5);
  const [anonymous, setAnonymous] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  /* ── computed stats ── */
  const earned = wallet.transactions.filter((t) => t.type === 'EARNED' && t.status === 'SUCCESS');
  const withdrawn = wallet.transactions.filter((t) => t.type === 'WITHDRAW' && t.status === 'SUCCESS');
  const completed = contracts.filter((c) => c.status === 'COMPLETED');
  const activeBidsCount = bids.filter((b) => b.status === 'PENDING').length;
  const wonBids = bids.filter((b) => b.status === 'ACCEPTED').length;
  const totalBids = bids.filter((b) => b.status !== 'WITHDRAWN').length;
  const successRate = totalBids > 0 ? Math.round((wonBids / totalBids) * 100) : 0;
  const avgRating = 4.8;
  const totalWithdrawn = withdrawn.reduce((s, t) => s + t.amount, 0);

  /* ── filtered transactions ── */
  const filteredTxs = useMemo(() => {
    return wallet.transactions.filter((tx) => {
      const matchType = txType === 'ALL' || tx.type === txType;
      const matchText = localizeTransaction(tx, language)
        .toLowerCase()
        .includes(txSearch.toLowerCase());
      return matchType && matchText;
    });
  }, [wallet.transactions, txSearch, txType, language]);

  /* ── reputation matrix ── */
  const reputationMatrix = profile?.reputationMatrix || [
    { skill: 'React / Next.js', score: 0, benchmark: 72 },
    { skill: 'TypeScript', score: 0, benchmark: 65 },
    { skill: 'NestJS / API Backend', score: 0, benchmark: 62 },
  ];

  /* ── withdraw handler ── */
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWdError('');
    setWdSuccess(false);

    const amtNum = Number(amount);
    if (isNaN(amtNum) || amtNum < 10) {
      setWdError(t('earnings.errInvalidAmount'));
      return;
    }

    let details = '';
    if (method === 'bank') {
      if (!bankName || !accountNum || !accountName) {
        setWdError(t('earnings.errBankInfo'));
        return;
      }
      details = `${bankName} - ${accountNum} (${accountName})`;
    } else if (method === 'momo') {
      if (!momoPhone) {
        setWdError(t('earnings.errMomo'));
        return;
      }
      details = `Momo: ${momoPhone}`;
    } else {
      if (!paypalEmail) {
        setWdError(t('earnings.errPaypal'));
        return;
      }
      details = `PayPal: ${paypalEmail}`;
    }

    const res = await requestWithdrawal(amtNum, method.toUpperCase(), details);
    if (!res.success) {
      setWdError(res.error ?? t('earnings.errWithdrawFailed'));
      return;
    }

    setWdSuccess(true);
    setAmount('');
    setBankName('');
    setAccountNum('');
    setAccountName('');
    setMomoPhone('');
    setPaypalEmail('');
    setTimeout(() => setWdSuccess(false), 5000);
  };

  /* ── deposit handler (Client) ── */
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDpError('');
    setDpSuccess(false);

    const amtNum = Number(depositAmount);
    if (isNaN(amtNum) || amtNum < 10) {
      setDpError(t('earnings.errInvalidDepositAmount'));
      return;
    }

    setIsDepositing(true);
    const res = await depositFunds(amtNum, depositGateway.toUpperCase());
    setIsDepositing(false);
    if (res.success) {
      setDpSuccess(true);
      setDepositAmount('');
      setTimeout(() => setDpSuccess(false), 5000);
    } else {
      setDpError(language === 'vi' ? 'Nạp tiền thất bại.' : 'Deposit failed.');
    }
  };

  /* ── CSV export ── */
  const handleExportCsv = () => {
    const headers = ['ID', 'Type', 'Amount (USD)', 'Description', 'Date', 'Status'];
    const rows = wallet.transactions.map((tx) => [
      tx.id,
      tx.type,
      tx.amount,
      localizeTransaction(tx, language).replace(/,/g, ';'),
      tx.date,
      tx.status,
    ]);
    const csv =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers, ...rows].map((r) => r.join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: encodeURI(csv),
      download: `BidWise_Transactions_${new Date().toISOString().split('T')[0]}.csv`,
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  /* ── review submit ── */
  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewContractId) return;
    reviewClient(reviewContractId);
    setReviewSuccess(true);
    setTimeout(() => {
      setReviewSuccess(false);
      setReviewContractId(null);
      setCommRating(5);
      setPayRating(5);
      setClarityRating(5);
      setReviewNote('');
      setAnonymous(false);
    }, 1500);
  };

  /* ── pending review contracts ── */
  const pendingReviewContracts = completed.filter((c) => !c.clientReviewed);

  const L = (vi: string, en: string) => (language === 'vi' ? vi : en);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Wallet summary banner ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Available Balance */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-emerald-500/15 rounded-full blur-2xl animate-pulse" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <WalletIcon className="w-3.5 h-3.5 text-slate-400" />
            {t('earnings.availableBalance')}
          </p>
          <h3 className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent mt-1.5">
            ${wallet.balance.toLocaleString()}
          </h3>
          <span className="mt-3 inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            {isClient ? L('Khả dụng thanh toán', 'Available to spend') : t('earnings.readyWithdraw')}
          </span>
        </div>

        {/* Escrow Balance */}
        <div className="bg-gradient-to-br from-indigo-950 to-slate-950 text-white border border-indigo-900/50 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-500/15 rounded-full blur-2xl animate-pulse" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <LockIcon className="w-3.5 h-3.5 text-slate-400" />
            {t('earnings.escrowLock')}
          </p>
          <h3 className="text-3xl font-black bg-gradient-to-r from-amber-400 to-orange-300 bg-clip-text text-transparent mt-1.5">
            ${wallet.escrow.toLocaleString()}
          </h3>
          <span className="mt-3 inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
            <LockIcon className="w-3 h-3 text-amber-400 shrink-0" />
            {t('earnings.lockedEscrow')}
          </span>
        </div>

        {/* Total Earned / Deposited */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-500/15 rounded-full blur-2xl animate-pulse" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
            {isClient ? L('Tổng tiền đã nạp', 'Total Deposited') : t('earnings.totalEarnings')}
          </p>
          <h3 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent mt-1.5">
            ${wallet.totalEarned.toLocaleString()}
          </h3>
          <span className="mt-3 inline-flex items-center gap-1 text-[9px] font-bold text-blue-400 bg-blue-50/10 px-2.5 py-0.5 rounded-full border border-blue-550/20">
            <CheckCircle2 className="w-3 h-3 text-blue-400 shrink-0" />
            {isClient ? L('Tổng nạp hệ thống', 'Total lifetime deposits') : t('earnings.lifetimeRevenue')}
          </span>
        </div>
      </div>

      {/* ── Pending client reviews banner ─────────────────────── */}
      {pendingReviewContracts.length > 0 && !isClient && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 shadow-sm animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500 shrink-0" />
            <div>
              <p className="text-xs font-extrabold text-amber-800">
                {L(
                  `Bạn có ${pendingReviewContracts.length} hợp đồng hoàn thành chờ đánh giá client!`,
                  `You have ${pendingReviewContracts.length} completed contract(s) awaiting your client review!`
                )}
              </p>
              <p className="text-[10px] text-amber-600 font-medium mt-0.5">
                {L(
                  'Đánh giá giúp nâng uy tín hồ sơ của bạn trên nền tảng BidWise.',
                  'Reviews help improve your BidWise reputation score.'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab('overview');
              setReviewContractId(pendingReviewContracts[0].id);
            }}
            className="shrink-0 h-9 px-4 bg-amber-500 hover:bg-amber-650 text-white font-extrabold text-xs rounded-xl transition-colors shadow-sm"
          >
            {L('Đánh giá ngay', 'Review Now')}
          </button>
        </div>
      )}

      {/* ── Tab navigation ────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          {TABS.map((tab) => {
            const IconComponent = tab.icon;
            const isTabActive = displayTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3.5 text-xs font-extrabold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all border-b-2 ${
                  isTabActive
                    ? 'border-blue-600 text-blue-600 bg-white shadow-sm shadow-blue-50/10'
                    : 'border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <IconComponent className={`w-4 h-4 ${isTabActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">{tab.label[language as 'vi' | 'en']}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* ══════════════════════════════════════════════════ */}
          {/* TAB: OVERVIEW                                      */}
          {/* ══════════════════════════════════════════════════ */}
          {displayTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {isClient
                  ? [
                      {
                        icon: CheckCircle2,
                        label: L('Hợp đồng hoàn thành', 'Completed Contracts'),
                        value: String(completed.length),
                        color: 'text-green-600',
                        bgColor: 'bg-green-50/50',
                      },
                      {
                        icon: FileText,
                        label: L('Hợp đồng hoạt động', 'Active Contracts'),
                        value: String(contracts.filter((c) => c.status === 'ACTIVE').length),
                        color: 'text-blue-600',
                        bgColor: 'bg-blue-50/50',
                      },
                      {
                        icon: PlusCircle,
                        label: L('Dự án đã đăng', 'Posted Jobs'),
                        value: String(jobs?.length || 0),
                        color: 'text-indigo-600',
                        bgColor: 'bg-indigo-50/50',
                      },
                      {
                        icon: HelpCircle,
                        label: L('Đề xuất đã nhận', 'Bids Received'),
                        value: String(bids?.length || 0),
                        color: 'text-amber-600',
                        bgColor: 'bg-amber-50/50',
                      },
                    ].map((kpi) => (
                      <div
                        key={kpi.label}
                        className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2.5 hover:border-slate-200 transition-colors"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.bgColor}`}>
                          <kpi.icon className={`w-4.5 h-4.5 ${kpi.color}`} />
                        </div>
                        <div>
                          <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                            {kpi.label}
                          </p>
                        </div>
                      </div>
                    ))
                  : [
                      {
                        icon: CheckCircle2,
                        label: L('Hợp đồng hoàn thành', 'Completed Contracts'),
                        value: String(completed.length),
                        color: 'text-green-600',
                        bgColor: 'bg-green-50/50',
                      },
                      {
                        icon: Star,
                        label: L('Đánh giá trung bình', 'Avg. Rating'),
                        value: `${avgRating}/5`,
                        color: 'text-amber-500',
                        bgColor: 'bg-amber-50/50',
                      },
                      {
                        icon: FileText,
                        label: L('Thầu đang chờ', 'Active Bids'),
                        value: String(activeBidsCount),
                        color: 'text-blue-600',
                        bgColor: 'bg-blue-50/50',
                      },
                      {
                        icon: Percent,
                        label: L('Tỷ lệ thành công', 'Success Rate'),
                        value: `${successRate}%`,
                        color: 'text-indigo-600',
                        bgColor: 'bg-indigo-50/50',
                      },
                    ].map((kpi) => (
                      <div
                        key={kpi.label}
                        className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2.5 hover:border-slate-200 transition-colors"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.bgColor}`}>
                          <kpi.icon className={`w-4.5 h-4.5 ${kpi.color}`} />
                        </div>
                        <div>
                          <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                            {kpi.label}
                          </p>
                        </div>
                      </div>
                    ))}
              </div>

              {/* Contracts Progress / Spend */}
              <div>
                <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-400" />
                  {isClient ? L('Theo dõi chi tiêu dự án', 'Project Spend Tracker') : L('Thu nhập theo hợp đồng', 'Earnings by Contract')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contracts.map((c) => {
                    const paid = c.milestones
                      .filter((m) => m.status === 'ACCEPTED')
                      .reduce((s, m) => s + m.amount, 0);
                    const total = c.amount;
                    const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
                    const statusColor: Record<string, string> = {
                      COMPLETED: 'bg-green-50 text-green-700 border-green-150',
                      ACTIVE: 'bg-blue-50 text-blue-700 border-blue-150',
                      SIGNED: 'bg-amber-50 text-amber-700 border-amber-150',
                    };
                    return (
                      <div
                        key={c.id}
                        className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3.5 hover:border-slate-200 hover:shadow-sm transition-all"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-bold text-slate-800 text-xs truncate flex-1">{c.jobTitle}</p>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                              statusColor[c.status]
                            }`}
                          >
                            {c.status}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                            <span>
                              {isClient ? L('Đã giải ngân', 'Released') : L('Đã thanh toán', 'Paid')}:{' '}
                              <strong className="text-green-600">${paid.toLocaleString()}</strong> / $
                              {total.toLocaleString()}
                            </span>
                            <span className="text-blue-600 font-bold">{pct}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════ */}
          {/* TAB: TRANSACTION HISTORY                           */}
          {/* ══════════════════════════════════════════════════ */}
          {displayTab === 'history' && (
            <div className="space-y-4">
              {/* Summary stats line */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                {[
                  {
                    label: isClient ? L('Tổng tiền nạp', 'Total Deposited') : L('Tổng đã nhận', 'Total Received'),
                    value: `+$${wallet.totalEarned.toLocaleString()}`,
                    cls: 'text-green-600',
                  },
                  {
                    label: isClient ? L('Tổng chi trả', 'Total Spent') : L('Đã rút', 'Total Withdrawn'),
                    value: isClient
                      ? `-$${contracts
                          .map((c) =>
                            c.milestones
                              .filter((m) => m.status === 'ACCEPTED')
                              .reduce((s, m) => s + m.amount, 0)
                          )
                          .reduce((sum, val) => sum + val, 0)
                          .toLocaleString()}`
                      : `-$${totalWithdrawn.toLocaleString()}`,
                    cls: 'text-red-500',
                  },
                  {
                    label: t('earnings.escrowLock'),
                    value: `$${wallet.escrow.toLocaleString()}`,
                    cls: 'text-amber-500',
                  },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                    <p className={`font-black text-base ${s.cls}`}>{s.value}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Search + filter + export */}
              <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[160px]">
                  <input
                    type="text"
                    placeholder={t('earnings.searchTx')}
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value as typeof txType)}
                  className="h-9 px-3 rounded-xl border border-slate-200 text-xs outline-none bg-white focus:border-blue-500 transition-all font-semibold"
                >
                  <option value="ALL">{L('Tất cả', 'All')}</option>
                  <option value="EARNED">{isClient ? L('Chi trả milestone', 'Milestone Releases') : L('Thu nhập', 'Earned')}</option>
                  <option value="WITHDRAW">{L('Rút tiền', 'Withdrawn')}</option>
                  <option value="ESCROW">{L('Ký quỹ', 'Escrow')}</option>
                  <option value="DEPOSIT">{L('Nạp tiền', 'Deposits')}</option>
                  <option value="REFUND">{L('Hoàn tiền', 'Refunds')}</option>
                </select>
                <button
                  onClick={handleExportCsv}
                  className="h-9 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  {t('earnings.exportCsv')}
                </button>
              </div>

              {/* Transaction list */}
              {filteredTxs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                  {t('earnings.noTx')}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[440px] overflow-y-auto pr-1 rounded-2xl border border-slate-100 shadow-inner bg-white">
                  {filteredTxs.map((tx) => {
                    const isEarn = tx.type === 'EARNED';
                    const isEscrow = tx.type === 'ESCROW';
                    const isDeposit = tx.type === 'DEPOSIT';
                    const isRefund = tx.type === 'REFUND';
                    const isWithdraw = tx.type === 'WITHDRAW';

                    const statusColor =
                      tx.status === 'SUCCESS'
                        ? 'text-green-700 bg-green-50 border-green-100'
                        : tx.status === 'PENDING'
                        ? 'text-amber-700 bg-amber-50 border-amber-100'
                        : 'text-red-700 bg-red-50 border-red-100';

                    let TxIconComp = ArrowDownLeft;
                    let iconColor = 'text-green-600 bg-green-50 border-green-150';
                    let sign = '+';

                    if (isWithdraw) {
                      TxIconComp = ArrowUpRight;
                      iconColor = 'text-red-500 bg-red-50 border-red-150';
                      sign = '-';
                    } else if (isEscrow) {
                      TxIconComp = LockIcon;
                      iconColor = 'text-amber-500 bg-amber-50 border-amber-150';
                      sign = isClient ? '-' : '+';
                    } else if (isDeposit) {
                      TxIconComp = Plus;
                      iconColor = 'text-emerald-500 bg-emerald-50 border-emerald-150';
                      sign = '+';
                    } else if (isRefund) {
                      TxIconComp = RotateCcw;
                      iconColor = 'text-teal-600 bg-teal-50 border-teal-150';
                      sign = '+';
                    } else if (isEarn) {
                      TxIconComp = ArrowDownLeft;
                      iconColor = isClient ? 'text-red-500 bg-red-50 border-red-150' : 'text-green-600 bg-green-50 border-green-150';
                      sign = isClient ? '-' : '+';
                    }

                    return (
                      <div
                        key={tx.id}
                        className="px-4 py-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${iconColor}`}>
                            <TxIconComp className="w-4 h-4 shrink-0" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-800 truncate block max-w-[280px]">
                                {localizeTransaction(tx, language)}
                              </span>
                              <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded border inline-flex items-center gap-1 shrink-0 ${statusColor}`}>
                                {tx.status === 'PENDING' && (
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                )}
                                {tx.status === 'SUCCESS'
                                  ? t('common.success')
                                  : tx.status === 'PENDING'
                                  ? t('common.pending')
                                  : t('common.failed')}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                              {tx.date} · <span className="font-mono">{tx.id}</span>
                            </p>
                          </div>
                        </div>
                        <span
                          className={`font-black text-sm whitespace-nowrap shrink-0 ${
                            sign === '+' ? 'text-green-600' : 'text-red-500'
                          }`}
                        >
                          {sign}${tx.amount.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════ */}
          {/* TAB: WITHDRAW                                      */}
          {/* ══════════════════════════════════════════════════ */}
          {displayTab === 'withdraw' && !isClient && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: form */}
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-700 font-semibold flex items-start gap-2.5 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
                  <p className="leading-relaxed">
                    {L(
                      `Số dư hiện tại: $${wallet.balance.toLocaleString()} USD. Thời gian xử lý T+1. Phí rút: 1.5%.`,
                      `Current balance: $${wallet.balance.toLocaleString()} USD. Processing time T+1. Withdrawal fee: 1.5%.`
                    )}
                  </p>
                </div>

                <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                  {/* Payment method selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wide">
                      {t('earnings.paymentMethod')}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'bank', name: t('earnings.bank'), logo: Building },
                        { id: 'momo', name: 'MoMo', logo: Smartphone },
                        { id: 'paypal', name: 'PayPal', logo: CreditCard },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMethod(m.id)}
                          className={`h-11 rounded-xl border-2 flex items-center justify-center gap-1.5 font-bold text-xs transition-all ${
                            method === m.id
                              ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm shadow-blue-100/50'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <m.logo className="w-4 h-4 text-slate-500 shrink-0" />
                          <span>{m.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bank fields */}
                  {method === 'bank' && (
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { label: t('earnings.bankName'), val: bankName, set: setBankName, ph: 'Vietcombank, BIDV...' },
                        { label: t('earnings.accountNum'), val: accountNum, set: setAccountNum, ph: '1022883399' },
                        { label: t('earnings.accountName'), val: accountName, set: setAccountName, ph: 'NGUYEN VAN A' },
                      ].map((f) => (
                        <div key={f.label} className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">{f.label}</label>
                          <input
                            type="text"
                            placeholder={f.ph}
                            value={f.val}
                            onChange={(e) => f.set(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 font-semibold transition-all"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {method === 'momo' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">{t('earnings.momoPhone')}</label>
                      <input
                        type="tel"
                        placeholder="0912 345 678"
                        value={momoPhone}
                        onChange={(e) => setMomoPhone(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 font-semibold transition-all"
                      />
                    </div>
                  )}

                  {method === 'paypal' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">{t('earnings.paypalEmail')}</label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={paypalEmail}
                        onChange={(e) => setPaypalEmail(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 font-semibold transition-all"
                      />
                    </div>
                  )}

                  {/* Amount */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">{t('earnings.withdrawAmount')}</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-sm">$</span>
                      <input
                        type="number"
                        min={10}
                        max={wallet.balance}
                        step={1}
                        placeholder="10"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full h-10 pl-7.5 pr-3 rounded-xl border border-slate-200 text-sm font-extrabold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">{t('earnings.minWithdraw')}</p>
                  </div>

                  {wdError && (
                    <p className="text-xs text-red-650 bg-red-50 border border-red-100 p-3 rounded-xl font-medium flex items-center gap-1.5 animate-shake">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      {wdError}
                    </p>
                  )}
                  {wdSuccess && (
                    <div className="text-xs text-green-700 bg-green-50 border border-green-100 p-3 rounded-xl leading-relaxed font-semibold flex items-start gap-2 shadow-sm animate-in zoom-in-95 duration-200">
                      <Check className="w-4 h-4 text-green-600 bg-green-100 p-0.5 rounded-full shrink-0 border border-green-200 mt-0.5" />
                      <div>{t('earnings.withdrawSuccess')}</div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all"
                  >
                    {t('earnings.submitWithdraw')}
                  </button>
                </form>
              </div>

              {/* Right: withdrawal guide */}
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                    {L('Quy trình rút tiền (T+1)', 'Withdrawal Process (T+1)')}
                  </h4>
                  {[
                    {
                      step: '1',
                      icon: FileText,
                      title: L('Gửi yêu cầu', 'Submit Request'),
                      desc: L('Điền thông tin và nhấn gửi yêu cầu.', 'Fill in the form and submit.'),
                    },
                    {
                      step: '2',
                      icon: Loader2,
                      title: L('Xử lý tự động', 'Auto Processing'),
                      desc: L('Hệ thống xử lý trong vòng 24 giờ (T+1).', 'System processes within 24 hours (T+1).'),
                    },
                    {
                      step: '3',
                      icon: CheckCircle2,
                      title: L('Tiền về tài khoản', 'Funds Received'),
                      desc: L(
                        'Tiền về tài khoản đăng ký trong 1-2 ngày làm việc.',
                        'Funds arrive in 1-2 business days.'
                      ),
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-black text-blue-700 shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <item.icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Fee structure */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-2.5">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    {L('Phí rút tiền', 'Withdrawal Fees')}
                  </h4>
                  {[
                    { method: L('Ngân hàng nội địa', 'Domestic Bank'), fee: '1.5%', min: '$10' },
                    { method: 'Momo', fee: '1.0%', min: '$5' },
                    { method: 'PayPal', fee: '2.5%', min: '$20' },
                  ].map((row) => (
                    <div
                      key={row.method}
                      className="flex justify-between text-[10px] py-1 border-b border-slate-50 last:border-0"
                    >
                      <span className="font-bold text-slate-500">{row.method}</span>
                      <span className="text-slate-800 font-extrabold">
                        {row.fee} &middot; Min {row.min}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════ */}
          {/* TAB: DEPOSIT (Client Only)                         */}
          {/* ══════════════════════════════════════════════════ */}
          {displayTab === 'deposit' && isClient && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
              {/* Left Form */}
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-700 font-semibold flex items-start gap-2.5 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
                  <p className="leading-relaxed">
                    {L(
                      `Nạp tiền an toàn để thực hiện ký quỹ thầu. Tiền ký quỹ được giữ bảo vệ trong Escrow và chỉ giải ngân khi bạn phê duyệt cột mốc.`,
                      `Securely deposit funds into your BidWise wallet to accept thầu. Funds are safely escrowed and released only upon your approval.`
                    )}
                  </p>
                </div>

                <form onSubmit={handleDepositSubmit} className="space-y-4">
                  {/* Gateway Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wide">
                      {t('earnings.selectGateway')}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { id: 'vnpay', name: t('earnings.vietnameseBank') || 'VN Banks (VNPAY)', logo: Building },
                        { id: 'momo', name: 'MoMo Wallet', logo: Smartphone },
                        { id: 'zalopay', name: 'ZaloPay Wallet', logo: Smartphone },
                        { id: 'stripe', name: t('earnings.stripe') || 'Stripe Credit Card', logo: CreditCard },
                      ].map((gateway) => (
                        <button
                          key={gateway.id}
                          type="button"
                          onClick={() => setDepositGateway(gateway.id)}
                          className={`h-12 rounded-xl border-2 flex items-center justify-start px-4 gap-3 font-bold text-xs transition-all ${
                            depositGateway === gateway.id
                              ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm shadow-blue-100/50'
                              : 'border-slate-200 text-slate-600 hover:border-slate-350 bg-white'
                          }`}
                        >
                          <gateway.logo className="w-5 h-5 shrink-0 text-slate-500" />
                          <span className="text-left leading-tight">{gateway.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">{t('earnings.depositAmount')}</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-sm">$</span>
                      <input
                        type="number"
                        min={10}
                        step={1}
                        placeholder={t('earnings.depositAmountPlaceholder') || '10'}
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        disabled={isDepositing}
                        className="w-full h-10 pl-7.5 pr-3 rounded-xl border border-slate-200 text-sm font-extrabold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all disabled:bg-slate-55"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">{t('earnings.minDeposit')}</p>
                  </div>

                  {dpError && (
                    <p className="text-xs text-red-650 bg-red-50 border border-red-100 p-3 rounded-xl font-semibold flex items-center gap-1.5 animate-shake">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      {dpError}
                    </p>
                  )}

                  {isDepositing && (
                    <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl text-xs text-blue-700 font-semibold flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-550 shrink-0" />
                      <span>{t('earnings.processing')}</span>
                    </div>
                  )}

                  {dpSuccess && (
                    <div className="text-xs text-green-700 bg-green-50 border border-green-100 p-3 rounded-xl leading-relaxed font-semibold flex items-start gap-2 shadow-sm animate-in zoom-in-95 duration-200">
                      <Check className="w-4 h-4 text-green-600 bg-green-100 p-0.5 rounded-full shrink-0 border border-green-200 mt-0.5" />
                      <div>{t('earnings.depositSuccess')}</div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isDepositing}
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {t('earnings.submitDeposit')}
                  </button>
                </form>
              </div>

              {/* Right: Payment Instructions */}
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                    {L('Hướng dẫn nạp ví', 'Deposit Process Guide')}
                  </h4>
                  {[
                    {
                      step: '1',
                      icon: Smartphone,
                      title: L('Chọn cổng & Số tiền', 'Choose Gateway & Amount'),
                      desc: L('Nhập số tiền tối thiểu $10 và chọn cổng thanh toán an toàn.', 'Enter minimum $10 and select your gateway.'),
                    },
                    {
                      step: '2',
                      icon: CreditCard,
                      title: L('Xác nhận thanh toán', 'Secure Checkout'),
                      desc: L('Bạn sẽ được chuyển hướng sang cổng thanh toán đối tác để xác thực bảo mật.', 'You will be redirected to complete secure checkout.'),
                    },
                    {
                      step: '3',
                      icon: CheckCircle2,
                      title: L('Webhooks tự động cập nhật', 'Automated Callback'),
                      desc: L('Số dư ví sẽ tự động phản ánh tức thì sau khi giao dịch hoàn tất (Simulated: 3s).', 'Balance reflects instantly in your wallet via webhook.'),
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-black text-blue-700 shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <item.icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════ */}
          {/* TAB: SKILL REPUTATION                              */}
          {/* ══════════════════════════════════════════════════ */}
          {displayTab === 'reputation' && !isClient && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{t('earnings.reputationTitle')}</h3>
                  <p className="text-slate-500 text-xs mt-1">{t('earnings.reputationDesc')}</p>
                </div>
                {/* Gamification badge */}
                <div className="shrink-0 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-3.5 text-center min-w-[90px] shadow-md">
                  <Award className="w-7 h-7 text-amber-300 mx-auto animate-bounce" />
                  <p className="text-[10px] font-black tracking-wider mt-1.5">TOP 15%</p>
                  <p className="text-[9px] font-bold text-blue-200">{L('Lập trình', 'Engineering')}</p>
                </div>
              </div>

              {/* Skill bars */}
              <div className="space-y-5">
                {reputationMatrix.map((item) => {
                  const isAbove = item.score >= item.benchmark;
                  return (
                    <div key={item.skill} className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-700">{item.skill}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                              isAbove
                                ? 'bg-green-50 text-green-700 border-green-100'
                                : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}
                          >
                            {isAbove ? `▲ ${item.score - item.benchmark}pts` : `▼ ${item.benchmark - item.score}pts`}
                          </span>
                          <span className="text-blue-650 font-extrabold">{item.score}/100</span>
                        </div>
                      </div>

                      {/* Stacked bar: your score + market avg line */}
                      <div className="relative w-full h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
                        {/* Market avg indicator */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                          style={{ left: `${item.benchmark}%` }}
                          title={`Benchmark: ${item.benchmark}`}
                        />
                        {/* Your score bar */}
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isAbove
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                              : 'bg-gradient-to-r from-amber-400 to-orange-400'
                          }`}
                          style={{ width: `${item.score}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                        <span>Benchmark: {item.benchmark}%</span>
                        <span className={`font-black uppercase tracking-wider ${isAbove ? 'text-green-600' : 'text-amber-600'}`}>
                          {isAbove ? t('earnings.aboveBenchmark') : t('earnings.belowBenchmark')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Gamification tips */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 space-y-2 shadow-inner">
                <h4 className="font-extrabold text-blue-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  {L('Gợi ý cải thiện danh tiếng', 'Reputation Improvement Tips')}
                </h4>
                {reputationMatrix
                  .filter((r) => r.score < r.benchmark)
                  .map((r) => (
                    <p key={r.skill} className="text-xs text-blue-705 font-bold flex items-start gap-1.5 leading-relaxed">
                      <span className="text-amber-500 shrink-0">▼</span>
                      {L(
                        `Kỹ năng ${r.skill}: Cần cải thiện thêm ${r.benchmark - r.score} điểm để đạt benchmark thị trường.`,
                        `${r.skill}: Needs ${r.benchmark - r.score} more points to reach market benchmark.`
                      )}
                    </p>
                  ))}
                {reputationMatrix.filter((r) => r.score < r.benchmark).length === 0 && (
                  <p className="text-xs text-green-700 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-650 shrink-0" />
                    {L(
                      'Bạn vượt chuẩn thị trường trên tất cả kỹ năng! Tiếp tục duy trì nhé.',
                      'You beat market benchmarks across all skills! Keep it up.'
                    )}
                  </p>
                )}
              </div>

              <p className="text-[10px] text-slate-400 italic text-center font-medium">{t('earnings.reputationNote')}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── CLIENT REVIEW MODAL ───────────────────────── */}
      {reviewContractId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-lg text-slate-905 flex items-center gap-1.5">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0 animate-pulse" />
                {t('contracts.rateClientTitle')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {L(
                  'Ẩn danh tùy chọn. Đánh giá chỉ hiển thị sau khi cả 2 phía đã gửi.',
                  'Anonymous option available. Reviews only visible after both parties submit.'
                )}
              </p>
            </div>

            {reviewSuccess ? (
              <div className="py-10 text-center space-y-3">
                <Star className="w-10 h-10 text-amber-400 fill-amber-400 mx-auto animate-bounce" />
                <p className="font-bold text-green-600">{t('contracts.reviewSuccess')}</p>
                <p className="text-xs text-slate-400">{t('contracts.reviewThanks')}</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="space-y-3.5">
                  <StarRow label={`${t('contracts.cooperation')}`} value={commRating} onChange={setCommRating} />
                  <StarRow label={`${t('contracts.payment')}`} value={payRating} onChange={setPayRating} />
                  <StarRow label={`${t('contracts.clarity')}`} value={clarityRating} onChange={setClarityRating} />
                </div>

                {/* Avg preview */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">{L('Điểm trung bình', 'Average score')}</span>
                  <span className="font-black text-amber-500 text-sm flex items-center gap-1">
                    {((commRating + payRating + clarityRating) / 3).toFixed(1)} / 5
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">{t('contracts.reviewNote')}</label>
                  <textarea
                    rows={3}
                    placeholder={t('contracts.reviewPlaceholder')}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 resize-none font-sans transition-all"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={anonymous}
                    onChange={(e) => setAnonymous(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500/20 w-4 h-4 transition-all"
                  />
                  <span className="text-xs text-slate-500 font-bold">{t('contracts.anonymous')}</span>
                </label>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setReviewContractId(null)}
                    className="flex-1 h-10 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 font-bold text-sm transition-all"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm"
                  >
                    {t('contracts.sendReview')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
