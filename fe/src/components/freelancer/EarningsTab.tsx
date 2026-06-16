'use client';

import { useState, useMemo } from 'react';
import { useFreelancer } from '@/lib/hooks/useFreelancer';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { localizeTransaction } from '@/lib/i18n/demo-content';

/* ── helpers ──────────────────────────────────────────────────── */
type TabKey = 'overview' | 'history' | 'withdraw' | 'reputation';

const STAR = '★';

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
            className={`text-lg leading-none transition-colors ${
              s <= value ? 'text-amber-400' : 'text-slate-200 hover:text-amber-300'
            }`}
          >
            {STAR}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── main component ───────────────────────────────────────────── */
export default function EarningsTab() {
  const { wallet, contracts, bids, requestWithdrawal, reviewClient } = useFreelancer();
  const { t, language } = useTranslation();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  /* ── withdraw form ── */
  const [method, setMethod] = useState('bank');
  const [amount, setAmount]   = useState('');
  const [bankName, setBankName]       = useState('');
  const [accountNum, setAccountNum]   = useState('');
  const [accountName, setAccountName] = useState('');
  const [momoPhone, setMomoPhone]     = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [wdError, setWdError]   = useState('');
  const [wdSuccess, setWdSuccess] = useState(false);

  /* ── history search / filter ── */
  const [txSearch, setTxSearch]   = useState('');
  const [txType, setTxType]       = useState<'ALL' | 'EARNED' | 'WITHDRAW' | 'ESCROW'>('ALL');

  /* ── client review ── */
  const [reviewContractId, setReviewContractId] = useState<string | null>(null);
  const [commRating,    setCommRating]    = useState(5);
  const [payRating,     setPayRating]     = useState(5);
  const [clarityRating, setClarityRating] = useState(5);
  const [anonymous,     setAnonymous]     = useState(false);
  const [reviewNote,    setReviewNote]    = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  /* ── computed stats ── */
  const earned      = wallet.transactions.filter((t) => t.type === 'EARNED' && t.status === 'SUCCESS');
  const withdrawn   = wallet.transactions.filter((t) => t.type === 'WITHDRAW' && t.status === 'SUCCESS');
  const completed   = contracts.filter((c) => c.status === 'COMPLETED');
  const activeBidsCount = bids.filter((b) => b.status === 'PENDING').length;
  const wonBids     = bids.filter((b) => b.status === 'ACCEPTED').length;
  const totalBids   = bids.filter((b) => b.status !== 'WITHDRAWN').length;
  const successRate = totalBids > 0 ? Math.round((wonBids / totalBids) * 100) : 0;
  const avgRating   = 4.8; // mock — would come from reviews API
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
  const reputationMatrix = [
    { skill: 'React / Next.js',       score: 92, benchmark: 72 },
    { skill: 'TypeScript',            score: 88, benchmark: 65 },
    { skill: 'NestJS / API Backend',  score: 58, benchmark: 62 },
    { skill: 'Docker / PostgreSQL',   score: 67, benchmark: 60 },
    { skill: 'React Native / Mobile', score: 45, benchmark: 55 },
  ];

  /* ── withdraw handler ── */
  const handleWithdrawSubmit = (e: React.FormEvent) => {
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
      if (!bankName || !accountNum || !accountName) { setWdError(t('earnings.errBankInfo')); return; }
      details = `${bankName} - ${accountNum} (${accountName})`;
    } else if (method === 'momo') {
      if (!momoPhone) { setWdError(t('earnings.errMomo')); return; }
      details = `Momo: ${momoPhone}`;
    } else {
      if (!paypalEmail) { setWdError(t('earnings.errPaypal')); return; }
      details = `PayPal: ${paypalEmail}`;
    }

    const res = requestWithdrawal(amtNum, method.toUpperCase(), details);
    if (!res.success) { setWdError(res.error ?? t('earnings.errWithdrawFailed')); return; }

    setWdSuccess(true);
    setAmount(''); setBankName(''); setAccountNum(''); setAccountName('');
    setMomoPhone(''); setPaypalEmail('');
    setTimeout(() => setWdSuccess(false), 5000);
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
      setCommRating(5); setPayRating(5); setClarityRating(5);
      setReviewNote(''); setAnonymous(false);
    }, 1500);
  };

  /* ── pending review contracts ── */
  const pendingReviewContracts = completed.filter((c) => !c.clientReviewed);

  /* ── tab nav items ── */
  const TABS: { key: TabKey; label: { vi: string; en: string }; icon: string }[] = [
    { key: 'overview',    label: { vi: 'Tổng quan',         en: 'Overview'       }, icon: '📊' },
    { key: 'history',     label: { vi: 'Lịch sử giao dịch', en: 'Transactions'   }, icon: '📜' },
    { key: 'withdraw',    label: { vi: 'Rút tiền',           en: 'Withdraw'       }, icon: '💸' },
    { key: 'reputation',  label: { vi: 'Skill Reputation',   en: 'Skill Scores'   }, icon: '🏅' },
  ];

  const L = (vi: string, en: string) => language === 'vi' ? vi : en;

  return (
    <div className="space-y-6">

      {/* ── Wallet summary banner ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Available */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-emerald-500/15 rounded-full blur-2xl" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('earnings.availableBalance')}</p>
          <h3 className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent mt-1">
            ${wallet.balance.toLocaleString()}
          </h3>
          <span className="mt-3 inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            🟢 {t('earnings.readyWithdraw')}
          </span>
        </div>

        {/* Escrow */}
        <div className="bg-gradient-to-br from-indigo-950 to-slate-950 text-white border border-indigo-900/50 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-500/15 rounded-full blur-2xl" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('earnings.escrowLock')}</p>
          <h3 className="text-3xl font-black bg-gradient-to-r from-amber-400 to-orange-300 bg-clip-text text-transparent mt-1">
            ${wallet.escrow.toLocaleString()}
          </h3>
          <span className="mt-3 inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            🔒 {t('earnings.lockedEscrow')}
          </span>
        </div>

        {/* Total earned */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-500/15 rounded-full blur-2xl" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('earnings.totalEarnings')}</p>
          <h3 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent mt-1">
            ${wallet.totalEarned.toLocaleString()}
          </h3>
          <span className="mt-3 inline-flex items-center gap-1 text-[9px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
            📈 {t('earnings.lifetimeRevenue')}
          </span>
        </div>
      </div>

      {/* ── Pending client reviews banner ─────────────────────── */}
      {pendingReviewContracts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⭐</span>
            <div>
              <p className="text-xs font-extrabold text-amber-800">
                {L(
                  `Bạn có ${pendingReviewContracts.length} hợp đồng hoàn thành chờ đánh giá client!`,
                  `You have ${pendingReviewContracts.length} completed contract(s) awaiting your client review!`
                )}
              </p>
              <p className="text-[10px] text-amber-600 font-medium mt-0.5">
                {L('Đánh giá giúp nâng uy tín hồ sơ của bạn trên nền tảng BidWise.', 'Reviews help improve your BidWise reputation score.')}
              </p>
            </div>
          </div>
          <button
            onClick={() => { setActiveTab('overview'); setReviewContractId(pendingReviewContracts[0].id); }}
            className="shrink-0 h-9 px-4 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl transition-colors"
          >
            {L('Đánh giá ngay', 'Review Now')}
          </button>
        </div>
      )}

      {/* ── Tab navigation ────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3.5 text-xs font-extrabold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all border-b-2 ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                  : 'border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label[language as 'vi' | 'en']}</span>
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* ══════════════════════════════════════════════════ */}
          {/* TAB: OVERVIEW (FL-24)                             */}
          {/* ══════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: '🏆', label: L('Hợp đồng hoàn thành', 'Completed Contracts'), value: String(completed.length), color: 'text-green-600' },
                  { icon: '⭐', label: L('Avg. Rating', 'Avg. Rating'),                  value: `${avgRating}/5`,         color: 'text-amber-500' },
                  { icon: '🎯', label: L('Thầu đang chờ',    'Active Bids'),              value: String(activeBidsCount),  color: 'text-blue-600'  },
                  { icon: '📈', label: L('Tỷ lệ thành công',  'Success Rate'),             value: `${successRate}%`,        color: 'text-indigo-600'},
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1 hover:border-slate-200 transition-colors">
                    <div className="text-2xl">{kpi.icon}</div>
                    <p className={`text-xl font-black ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                  </div>
                ))}
              </div>

              {/* Earnings breakdown by contract */}
              <div>
                <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wide mb-3">
                  {L('Thu nhập theo hợp đồng', 'Earnings by Contract')}
                </h4>
                <div className="space-y-2.5">
                  {contracts.map((c) => {
                    const paid = c.milestones.filter((m) => m.status === 'ACCEPTED').reduce((s, m) => s + m.amount, 0);
                    const total = c.amount;
                    const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
                    const statusColor: Record<string, string> = {
                      COMPLETED: 'bg-green-50 text-green-700 border-green-100',
                      ACTIVE:    'bg-blue-50 text-blue-700 border-blue-100',
                      SIGNED:    'bg-amber-50 text-amber-700 border-amber-100',
                    };
                    return (
                      <div key={c.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2.5">
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-bold text-slate-800 text-xs truncate max-w-xs">{c.jobTitle}</p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${statusColor[c.status]}`}>{c.status}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                          <span>{L('Đã thanh toán', 'Paid')}: <strong className="text-green-600">${paid.toLocaleString()}</strong> / ${total.toLocaleString()}</span>
                          <span className="text-blue-600 font-bold">{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Client Review section (FL-26) */}
              {pendingReviewContracts.length > 0 && (
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wide mb-3">
                    {L('Đánh giá Client (FL-26)', 'Rate Your Clients (FL-26)')}
                  </h4>
                  <div className="space-y-3">
                    {pendingReviewContracts.map((c) => (
                      <div key={c.id} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl p-4">
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{c.jobTitle}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {L('Khách hàng', 'Client')}: <strong>{c.clientName}</strong>
                          </p>
                        </div>
                        <button
                          onClick={() => setReviewContractId(c.id)}
                          className="h-8 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg transition-colors"
                        >
                          ⭐ {L('Đánh giá', 'Review')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════ */}
          {/* TAB: TRANSACTION HISTORY (FL-25)                  */}
          {/* ══════════════════════════════════════════════════ */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* Summary row */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                {[
                  { label: L('Tổng đã nhận', 'Total Received'), value: `+$${wallet.totalEarned.toLocaleString()}`, cls: 'text-green-600' },
                  { label: L('Đã rút', 'Total Withdrawn'),       value: `-$${totalWithdrawn.toLocaleString()}`,    cls: 'text-red-500'  },
                  { label: L('Ký quỹ Escrow', 'Escrow Held'),    value: `$${wallet.escrow.toLocaleString()}`,      cls: 'text-amber-500'},
                ].map((s) => (
                  <div key={s.label} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                    <p className={`font-black text-base ${s.cls}`}>{s.value}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Search + filter + export */}
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder={t('earnings.searchTx')}
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  className="flex-1 min-w-[160px] h-9 px-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value as typeof txType)}
                  className="h-9 px-3 rounded-xl border border-slate-200 text-xs outline-none bg-white focus:border-blue-500"
                >
                  <option value="ALL">{L('Tất cả', 'All')}</option>
                  <option value="EARNED">{L('Thu nhập', 'Earned')}</option>
                  <option value="WITHDRAW">{L('Rút tiền', 'Withdrawn')}</option>
                  <option value="ESCROW">{L('Ký quỹ', 'Escrow')}</option>
                </select>
                <button
                  onClick={handleExportCsv}
                  className="h-9 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  📥 {t('earnings.exportCsv')}
                </button>
              </div>

              {/* Transaction list */}
              {filteredTxs.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">{t('earnings.noTx')}</div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[440px] overflow-y-auto pr-1 rounded-xl border border-slate-100">
                  {filteredTxs.map((tx) => {
                    const isEarn = tx.type === 'EARNED';
                    const isEscrow = tx.type === 'ESCROW';
                    const statusColor =
                      tx.status === 'SUCCESS' ? 'text-green-700 bg-green-50 border-green-100'
                      : tx.status === 'PENDING' ? 'text-amber-700 bg-amber-50 border-amber-100 animate-pulse'
                      : 'text-red-700 bg-red-50 border-red-100';
                    const txIcon = isEarn ? '💚' : isEscrow ? '🔒' : '🔴';

                    return (
                      <div key={tx.id} className="px-4 py-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-lg shrink-0">{txIcon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-800 truncate block max-w-[200px]">
                                {localizeTransaction(tx, language)}
                              </span>
                              <span className={`text-[8px] font-bold px-1 py-0.5 rounded border ${statusColor}`}>
                                {tx.status === 'SUCCESS' ? t('common.success') : tx.status === 'PENDING' ? t('common.pending') : t('common.failed')}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {tx.date} · <span className="font-mono">{tx.id}</span>
                            </p>
                          </div>
                        </div>
                        <span className={`font-black text-sm whitespace-nowrap shrink-0 ${isEarn ? 'text-green-600' : isEscrow ? 'text-amber-500' : 'text-red-500'}`}>
                          {isEarn ? '+' : '-'}${tx.amount.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════ */}
          {/* TAB: WITHDRAW (FL-28)                             */}
          {/* ══════════════════════════════════════════════════ */}
          {activeTab === 'withdraw' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: form */}
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-700 font-semibold flex items-start gap-2">
                  <span className="text-base shrink-0">ℹ️</span>
                  <p>{L(
                    `Số dư hiện tại: $${wallet.balance.toLocaleString()} USD. Thời gian xử lý T+1. Phí rút: 1.5%.`,
                    `Current balance: $${wallet.balance.toLocaleString()} USD. Processing time T+1. Withdrawal fee: 1.5%.`
                  )}</p>
                </div>

                <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                  {/* Payment method selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wide">{t('earnings.paymentMethod')}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'bank',   name: t('earnings.bank'),   icon: '🏦' },
                        { id: 'momo',   name: t('earnings.momo'),   icon: '📱' },
                        { id: 'paypal', name: t('earnings.paypal'), icon: '💳' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMethod(m.id)}
                          className={`h-11 rounded-xl border-2 flex items-center justify-center gap-1 font-bold text-xs transition-all ${
                            method === m.id
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <span>{m.icon}</span> <span>{m.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bank fields */}
                  {method === 'bank' && (
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { label: t('earnings.bankName'),    val: bankName,    set: setBankName,    ph: 'Vietcombank, BIDV...' },
                        { label: t('earnings.accountNum'),  val: accountNum,  set: setAccountNum,  ph: '1022883399' },
                        { label: t('earnings.accountName'), val: accountName, set: setAccountName, ph: 'NGUYEN VAN A' },
                      ].map((f) => (
                        <div key={f.label} className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">{f.label}</label>
                          <input
                            type="text"
                            placeholder={f.ph}
                            value={f.val}
                            onChange={(e) => f.set(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
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
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
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
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                      />
                    </div>
                  )}

                  {/* Amount */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">{t('earnings.withdrawAmount')}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                      <input
                        type="number"
                        min={10}
                        max={wallet.balance}
                        step={1}
                        placeholder="10"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">{t('earnings.minWithdraw')}</p>
                  </div>

                  {wdError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-xl">{wdError}</p>
                  )}
                  {wdSuccess && (
                    <p className="text-xs text-green-700 bg-green-50 border border-green-100 p-2.5 rounded-xl leading-relaxed">
                      {t('earnings.withdrawSuccess')}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-sm transition-all"
                  >
                    💸 {t('earnings.submitWithdraw')}
                  </button>
                </form>
              </div>

              {/* Right: withdrawal guide */}
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                  <h4 className="font-extrabold text-slate-800 text-sm">
                    {L('Quy trình rút tiền (T+1)', 'Withdrawal Process (T+1)')}
                  </h4>
                  {[
                    { step: '1', icon: '📝', title: L('Gửi yêu cầu', 'Submit Request'),     desc: L('Điền thông tin và nhấn gửi yêu cầu.', 'Fill in the form and submit.') },
                    { step: '2', icon: '⚙️',  title: L('Xử lý tự động', 'Auto Processing'),  desc: L('Hệ thống xử lý trong vòng 24 giờ (T+1).', 'System processes within 24 hours (T+1).') },
                    { step: '3', icon: '✅',  title: L('Tiền về tài khoản', 'Funds Received'), desc: L('Tiền về tài khoản đăng ký trong 1-2 ngày làm việc.', 'Funds arrive in 1-2 business days.') },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-black text-blue-700 shrink-0">{item.step}</div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{item.icon} {item.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Fee structure */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-2">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">{L('Phí rút tiền', 'Withdrawal Fees')}</h4>
                  {[
                    { method: L('Ngân hàng nội địa', 'Domestic Bank'), fee: '1.5%', min: '$10' },
                    { method: 'Momo',                                  fee: '1.0%', min: '$5'  },
                    { method: 'PayPal',                                fee: '2.5%', min: '$20' },
                  ].map((row) => (
                    <div key={row.method} className="flex justify-between text-[10px] py-1 border-b border-slate-50 last:border-0">
                      <span className="font-semibold text-slate-600">{row.method}</span>
                      <span className="text-slate-800 font-bold">{row.fee} &middot; Min {row.min}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════ */}
          {/* TAB: SKILL REPUTATION (FL-27)                     */}
          {/* ══════════════════════════════════════════════════ */}
          {activeTab === 'reputation' && (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{t('earnings.reputationTitle')}</h3>
                  <p className="text-slate-500 text-xs mt-1">{t('earnings.reputationDesc')}</p>
                </div>
                {/* Gamification badge */}
                <div className="shrink-0 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-3.5 text-center min-w-[90px]">
                  <div className="text-2xl">🥇</div>
                  <p className="text-[10px] font-black tracking-wider mt-1">TOP 15%</p>
                  <p className="text-[9px] font-bold text-blue-200">{L('Frontend', 'Frontend')}</p>
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
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            isAbove ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {isAbove ? `▲ ${item.score - item.benchmark}pts` : `▼ ${item.benchmark - item.score}pts`}
                          </span>
                          <span className="text-blue-600">{item.score}/100</span>
                        </div>
                      </div>

                      {/* Stacked bar: your score + market avg line */}
                      <div className="relative w-full h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        {/* Market avg indicator */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                          style={{ left: `${item.benchmark}%` }}
                          title={`Benchmark: ${item.benchmark}`}
                        />
                        {/* Your score bar */}
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${isAbove ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-r from-amber-400 to-orange-400'}`}
                          style={{ width: `${item.score}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[9px] text-slate-400">
                        <span>Benchmark: {item.benchmark}%</span>
                        <span className={`font-bold ${isAbove ? 'text-green-600' : 'text-amber-600'}`}>
                          {isAbove ? t('earnings.aboveBenchmark') : t('earnings.belowBenchmark')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Gamification tips */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 space-y-2">
                <h4 className="font-extrabold text-blue-800 text-xs uppercase tracking-wide">
                  💡 {L('Gợi ý cải thiện', 'Improvement Tips')}
                </h4>
                {reputationMatrix
                  .filter((r) => r.score < r.benchmark)
                  .map((r) => (
                    <p key={r.skill} className="text-xs text-blue-700 font-semibold flex items-start gap-1.5">
                      <span className="text-amber-500 shrink-0">▼</span>
                      {L(
                        `Kỹ năng ${r.skill}: Cần cải thiện thêm ${r.benchmark - r.score} điểm để đạt benchmark thị trường.`,
                        `${r.skill}: Needs ${r.benchmark - r.score} more points to reach market benchmark.`
                      )}
                    </p>
                  ))}
                {reputationMatrix.filter((r) => r.score < r.benchmark).length === 0 && (
                  <p className="text-xs text-green-700 font-bold">
                    🎉 {L('Bạn vượt chuẩn thị trường trên tất cả kỹ năng! Tiếp tục duy trì nhé.', 'You beat market benchmarks across all skills! Keep it up.')}
                  </p>
                )}
              </div>

              <p className="text-[10px] text-slate-400 italic text-center">{t('earnings.reputationNote')}</p>
            </div>
          )}

        </div>
      </div>

      {/* ── CLIENT REVIEW MODAL (FL-26) ───────────────────────── */}
      {reviewContractId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-lg text-slate-900">
                {t('contracts.rateClientTitle')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {L('Ẩn danh tùy chọn. Đánh giá chỉ hiển thị sau khi cả 2 phía đã gửi.', 'Anonymous option available. Reviews only visible after both parties submit.')}
              </p>
            </div>

            {reviewSuccess ? (
              <div className="py-10 text-center space-y-3">
                <div className="text-4xl animate-bounce">⭐</div>
                <p className="font-bold text-green-600">{t('contracts.reviewSuccess')}</p>
                <p className="text-xs text-slate-400">{t('contracts.reviewThanks')}</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="space-y-3">
                  <StarRow label={`🤝 ${t('contracts.cooperation')}`}  value={commRating}    onChange={setCommRating}    />
                  <StarRow label={`💰 ${t('contracts.payment')}`}       value={payRating}     onChange={setPayRating}     />
                  <StarRow label={`📋 ${t('contracts.clarity')}`}       value={clarityRating} onChange={setClarityRating} />
                </div>

                {/* Avg preview */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">{L('Điểm trung bình', 'Average score')}</span>
                  <span className="font-black text-amber-500 text-base">
                    {((commRating + payRating + clarityRating) / 3).toFixed(1)} / 5 ⭐
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">{t('contracts.reviewNote')}</label>
                  <textarea
                    rows={3}
                    placeholder={t('contracts.reviewPlaceholder')}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 resize-none font-sans"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={anonymous}
                    onChange={(e) => setAnonymous(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="text-xs text-slate-500 font-semibold">{t('contracts.anonymous')}</span>
                </label>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setReviewContractId(null)}
                    className="flex-1 h-10 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 font-semibold text-sm transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors"
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
