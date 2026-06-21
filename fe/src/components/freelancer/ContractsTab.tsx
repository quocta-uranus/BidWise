'use client';

import { useState } from 'react';
import { useFreelancer, Contract, Milestone } from '@/lib/hooks/useFreelancer';
import { useAuthStore } from '@/lib/auth/auth.store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getJobTitle, getMilestoneName } from '@/lib/i18n/demo-content';
import {
  FileText,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Clock,
  Star,
  Download,
  RotateCcw,
  DollarSign,
  Briefcase,
  ChevronRight,
  User,
  Calendar,
  FolderOpen,
  Check
} from 'lucide-react';

export default function ContractsTab() {
  const {
    contracts,
    signContract,
    updateMilestoneProgress,
    submitMilestoneDeliverable,
    clientApproveMilestone,
    reviewClient,
    requestRefund
  } = useFreelancer();
  
  const { user } = useAuthStore();
  const { t, language } = useTranslation();

  const currentRole = user?.roles[0] || 'FREELANCER'; // CLIENT | FREELANCER | ADMIN

  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // Deliverable form states
  const [submittingMilestone, setSubmittingMilestone] = useState<Milestone | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileNote, setFileNote] = useState('');

  // Review Form states
  const [reviewContractId, setReviewContractId] = useState<string | null>(null);
  const [commRating, setCommRating] = useState(5);
  const [payRating, setPayRating] = useState(5);
  const [clarityRating, setClarityRating] = useState(5);
  const [anonymous, setAnonymous] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Client rating local state simulation (client reviews freelancer)
  const [clientReviewingContractId, setClientReviewingContractId] = useState<string | null>(null);
  const [flSkillRating, setFlSkillRating] = useState(5);
  const [flSpeedRating, setFlSpeedRating] = useState(5);
  const [flCommRating, setFlCommRating] = useState(5);
  const [clientReviewNote, setClientReviewNote] = useState('');
  const [clientReviewSuccess, setClientReviewSuccess] = useState(false);

  // Action handlers
  const handleSignContract = async (cId: string) => {
    await signContract(cId);
    alert(t('contracts.signAlert'));

    // Sync local selected contract state
    const currentC = useFreelancer.getState().contracts.find((c) => c.id === cId);
    if (currentC) {
      setSelectedContract(currentC);
    }
  };

  const handleProgressSliderChange = async (cId: string, mId: string, value: number) => {
    await updateMilestoneProgress(cId, mId, value);

    // Sync local selected contract state
    if (selectedContract?.id === cId) {
      setSelectedContract({
        ...selectedContract,
        milestones: selectedContract.milestones.map((m) =>
          m.id === mId ? { ...m, progress: value } : m
        )
      });
    }
  };

  const handleOpenDeliverableModal = (ms: Milestone) => {
    setSubmittingMilestone(ms);
    setFileName('');
    setFileNote('');
  };

  const handleSubmitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract || !submittingMilestone || !fileName) return;

    await submitMilestoneDeliverable(selectedContract.id, submittingMilestone.id, fileName, fileNote);

    // Sync local selected contract state
    const currentC = useFreelancer.getState().contracts.find((c) => c.id === selectedContract.id);
    if (currentC) {
      setSelectedContract(currentC);
    }

    setSubmittingMilestone(null);
  };

  const handleClientApproveMilestone = async (cId: string, mId: string) => {
    await clientApproveMilestone(cId, mId);

    // Sync local selected contract state
    const currentC = useFreelancer.getState().contracts.find((c) => c.id === cId);
    if (currentC) {
      setSelectedContract(currentC);
    }

    if (currentRole === 'CLIENT') {
      alert(
        language === 'vi'
          ? 'Nghiệm thu cột mốc thành công! Khoản ký quỹ đã được giải ngân về ví của freelancer.'
          : 'Milestone approved successfully! Funds have been released to the freelancer\'s wallet.'
      );
    } else {
      alert(t('contracts.approveAlert'));
    }
  };

  const handleRequestRefund = async (cId: string) => {
    const res = await requestRefund(cId);
    if (res.success) {
      alert(t('contracts.refundSuccess'));
      setSelectedContract(null);
    } else {
      alert(res.error || (language === 'vi' ? 'Không thể thực hiện yêu cầu hoàn tiền.' : 'Could not request refund.'));
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewContractId) return;

    await reviewClient(reviewContractId);
    setReviewSuccess(true);
    setTimeout(() => {
      setReviewSuccess(false);
      setReviewContractId(null);
      setCommRating(5);
      setPayRating(5);
      setClarityRating(5);
      setReviewNote('');

      // Sync local state
      if (selectedContract?.id === reviewContractId) {
        setSelectedContract({ ...selectedContract, clientReviewed: true });
      }
    }, 1200);
  };

  const handleClientReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientReviewingContractId) return;

    setClientReviewSuccess(true);
    setTimeout(() => {
      setClientReviewSuccess(false);
      setClientReviewingContractId(null);
      setFlSkillRating(5);
      setFlSpeedRating(5);
      setFlCommRating(5);
      setClientReviewNote('');

      // Set reviews state simulated
      if (selectedContract?.id === clientReviewingContractId) {
        setSelectedContract({ ...selectedContract, clientReviewed: true });
      }
    }, 1200);
  };

  /* ── Invoice PDF Generator ── */
  const handleDownloadInvoice = (contract: Contract) => {
    const invoiceId = `INV-${contract.id.toUpperCase()}-${new Date(contract.createdAt).getTime().toString().slice(-6)}`;
    const dateStr = new Date().toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US');
    const releasedMilestones = contract.milestones.filter(m => m.status === 'ACCEPTED');
    const totalReleased = releasedMilestones.reduce((sum, m) => sum + m.amount, 0);
    const subtotal = totalReleased;
    const tax = Math.round(subtotal * 0.05); // 5% platform service charge / tax
    const grandTotal = subtotal + tax;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert(language === 'vi' ? 'Không thể mở cửa sổ in. Vui lòng cho phép popup.' : 'Cannot open print window. Please allow popups.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoiceId}</title>
        <meta charset="utf-8">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 40px;
            color: #1e293b;
            background-color: #ffffff;
            -webkit-print-color-adjust: exact;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 30px;
            margin-bottom: 40px;
          }
          .logo {
            font-size: 24px;
            font-weight: 800;
            color: #2563eb;
            letter-spacing: -0.5px;
          }
          .logo span {
            color: #0f172a;
          }
          .invoice-title {
            text-align: right;
          }
          .invoice-title h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 800;
            color: #0f172a;
          }
          .invoice-title p {
            margin: 5px 0 0 0;
            font-size: 14px;
            color: #64748b;
            font-weight: 500;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
          }
          .details-block h3 {
            margin: 0 0 10px 0;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
            font-weight: 700;
          }
          .details-block p {
            margin: 0 0 5px 0;
            font-size: 14px;
            line-height: 1.5;
          }
          .details-block strong {
            color: #0f172a;
            font-weight: 600;
          }
          .table-container {
            margin-bottom: 40px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
          }
          th {
            background-color: #f8fafc;
            color: #475569;
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 12px 16px;
            border-bottom: 1px solid #e2e8f0;
          }
          td {
            padding: 16px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 13px;
          }
          .item-desc {
            font-weight: 600;
            color: #0f172a;
          }
          .item-subdesc {
            font-size: 11px;
            color: #64748b;
            margin-top: 4px;
          }
          .summary-section {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
          }
          .summary-table {
            width: 300px;
          }
          .summary-table tr td {
            padding: 8px 16px;
            border-bottom: none;
          }
          .summary-table tr.total-row td {
            border-top: 2px solid #f1f5f9;
            border-bottom: 2px solid #0f172a;
            font-weight: 800;
            font-size: 16px;
            color: #0f172a;
            padding: 16px;
          }
          .footer {
            margin-top: 60px;
            border-top: 1px solid #f1f5f9;
            padding-top: 20px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
          .print-btn-bar {
            background-color: #f8fafc;
            padding: 15px 40px;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            border-bottom: 1px solid #e2e8f0;
          }
          .btn {
            font-family: 'Inter', sans-serif;
            font-size: 12px;
            font-weight: 700;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
          }
          .btn-primary {
            background-color: #2563eb;
            color: #ffffff;
          }
          .btn-primary:hover {
            background-color: #1d4ed8;
          }
          .btn-secondary {
            background-color: #ffffff;
            color: #475569;
            border: 1px solid #cbd5e1;
          }
          .btn-secondary:hover {
            background-color: #f1f5f9;
          }
        </style>
      </head>
      <body>
        <div class="no-print print-btn-bar">
          <button class="btn btn-secondary" onclick="window.close()">${language === 'vi' ? 'Đóng' : 'Close'}</button>
          <button class="btn btn-primary" onclick="window.print()">${language === 'vi' ? 'In Hóa Đơn' : 'Print Invoice'}</button>
        </div>
        <div class="container">
          <div class="header">
            <div class="logo">Bid<span>Wise</span></div>
            <div class="invoice-title">
              <h1>E-INVOICE</h1>
              <p>${invoiceId}</p>
            </div>
          </div>

          <div class="details-grid">
            <div class="details-block">
              <h3>Billed From</h3>
              <p><strong>BidWise Escrow System</strong></p>
              <p>On behalf of Freelancer Portal</p>
              <p>Vietnam IT Freelancer Network</p>
              <p>support@bidwise.com</p>
            </div>
            <div class="details-block">
              <h3>Billed To</h3>
              <p><strong>${contract.clientName}</strong></p>
              <p>Project Sponsor for ${contract.jobTitle}</p>
              <p>Contract ID: ${contract.id}</p>
              <p>Date: ${dateStr}</p>
            </div>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: right;">Status</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${contract.milestones.map((ms, i) => `
                  <tr>
                    <td>
                      <div class="item-desc">Milestone ${i + 1}: ${getMilestoneName(ms, language)}</div>
                      <div class="item-subdesc">Milestone Code: ${ms.id}</div>
                    </td>
                    <td style="text-align: right; font-weight: 600; color: ${ms.status === 'ACCEPTED' ? '#16a34a' : '#d97706'}">
                      ${ms.status === 'ACCEPTED' ? (language === 'vi' ? 'Đã thanh toán' : 'Released') : (language === 'vi' ? 'Chưa thanh toán' : 'Locked')}
                    </td>
                    <td style="text-align: right; font-weight: 700;">$${ms.amount.toLocaleString()} USD</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="summary-section">
            <table class="summary-table">
              <tr>
                <td style="color: #64748b;">Released Subtotal</td>
                <td style="text-align: right; font-weight: 600;">$${subtotal.toLocaleString()} USD</td>
              </tr>
              <tr>
                <td style="color: #64748b;">Platform Fee (5%)</td>
                <td style="text-align: right; font-weight: 600;">$${tax.toLocaleString()} USD</td>
              </tr>
              <tr class="total-row">
                <td>Total Invoiced</td>
                <td style="text-align: right;">$${grandTotal.toLocaleString()} USD</td>
              </tr>
            </table>
          </div>

          <div class="footer">
            <p>Thank you for using BidWise Platform. This is a system-generated electronic invoice.</p>
            <p>&copy; 2026 BidWise Inc. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const displayContracts = contracts;

  // Unreleased remaining milestone funds
  const unreleasedAmount = selectedContract
    ? selectedContract.milestones.filter((m) => m.status !== 'ACCEPTED').reduce((sum, m) => sum + m.amount, 0)
    : 0;

  const releasedMilestones = selectedContract
    ? selectedContract.milestones.filter((m) => m.status === 'ACCEPTED')
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
      {/* Contracts Sidebar List */}
      <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 h-fit">
        <h3 className="font-extrabold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
          <Briefcase className="w-4.5 h-4.5 text-slate-500" />
          <span>
            {currentRole === 'ADMIN'
              ? language === 'vi'
                ? 'Hợp đồng toàn hệ thống'
                : 'All System Contracts'
              : t('contracts.myContracts')}
          </span>
        </h3>

        {displayContracts.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs leading-relaxed font-medium">
            {t('contracts.noContracts')}
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayContracts.map((c) => {
              const statusColor: Record<string, string> = {
                SIGNED: 'bg-amber-50 text-amber-700 border-amber-100',
                ACTIVE: 'bg-blue-50 text-blue-700 border-blue-100',
                COMPLETED: 'bg-green-50 text-green-700 border-green-100'
              };

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedContract(c)}
                  className={`border rounded-2xl p-4 cursor-pointer hover:border-blue-400 transition-all ${
                    selectedContract?.id === c.id
                      ? 'border-blue-500 bg-blue-50/20 shadow-sm'
                      : 'border-slate-100 bg-slate-50/50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-extrabold text-slate-900 text-xs truncate max-w-[150px]">
                      {getJobTitle(c.jobId, language, c.jobTitle)}
                    </h4>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusColor[c.status]}`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 font-bold">
                    {t('common.client')}: <span className="text-slate-700 font-extrabold">{c.clientName}</span>
                  </p>

                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-200/50 text-[10px] font-semibold">
                    <div>
                      <span className="text-slate-400">{t('contracts.value')}</span>{' '}
                      <span className="font-extrabold text-slate-800">${c.amount}</span>
                    </div>
                    <span className="text-blue-600 font-extrabold hover:underline flex items-center gap-0.5">
                      {t('contracts.detailArrow')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Details Panel */}
      <div className="lg:col-span-2">
        {selectedContract ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            {/* Header section with actions depending on role */}
            <div className="flex justify-between items-start gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                  {t('contracts.contractLabel', { id: selectedContract.id })}
                </span>
                <h3 className="font-black text-xl text-slate-900 mt-1 leading-snug">
                  {getJobTitle(selectedContract.jobId, language, selectedContract.jobTitle)}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 font-bold flex items-center gap-1.5 flex-wrap">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {t('common.client')}: <span className="font-extrabold text-slate-700">{selectedContract.clientName}</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {t('contracts.startedOn', { date: selectedContract.createdAt })}
                  </span>
                </p>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                {/* Action: Sign Contract (Freelancer Only) */}
                {selectedContract.status === 'SIGNED' && currentRole === 'FREELANCER' && (
                  <button
                    onClick={() => handleSignContract(selectedContract.id)}
                    className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm animate-pulse flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {t('contracts.signContract')}
                  </button>
                )}

                {/* Action: Sign Contract status indicator (Client or Admin view) */}
                {selectedContract.status === 'SIGNED' && currentRole !== 'FREELANCER' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 rounded-xl">
                    <Clock className="w-3.5 h-3.5 text-amber-550 animate-pulse" />
                    {language === 'vi' ? 'Chờ Freelancer ký nhận' : 'Awaiting signature'}
                  </span>
                )}

                {/* Action: Rate Client (Freelancer view when completed) */}
                {selectedContract.status === 'COMPLETED' &&
                  !selectedContract.clientReviewed &&
                  currentRole === 'FREELANCER' && (
                    <button
                      onClick={() => setReviewContractId(selectedContract.id)}
                      className="h-9 px-4 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1"
                    >
                      <Star className="w-3.5 h-3.5 text-white" />
                      {t('contracts.rateClient')}
                    </button>
                  )}

                {/* Action: Rate Freelancer (Client view when completed) */}
                {selectedContract.status === 'COMPLETED' &&
                  !selectedContract.clientReviewed &&
                  currentRole === 'CLIENT' && (
                    <button
                      onClick={() => setClientReviewingContractId(selectedContract.id)}
                      className="h-9 px-4 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1"
                    >
                      <Star className="w-3.5 h-3.5 text-white" />
                      {language === 'vi' ? 'Đánh giá Freelancer' : 'Rate Freelancer'}
                    </button>
                  )}

                {/* Action: Client Request Escrow Refund */}
                {currentRole === 'CLIENT' && selectedContract.status !== 'COMPLETED' && unreleasedAmount > 0 && (
                  <button
                    onClick={() => handleRequestRefund(selectedContract.id)}
                    className="h-9 px-4 bg-red-50 hover:bg-red-100 text-red-650 border border-red-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {t('contracts.refundRequestBtn')}
                  </button>
                )}

                {/* Action: E-Invoice Download (Visible to Client/Freelancer) */}
                {releasedMilestones.length > 0 && (
                  <button
                    onClick={() => handleDownloadInvoice(selectedContract)}
                    className="h-8 px-3 border border-slate-200 hover:bg-slate-50 text-slate-705 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm bg-white"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    {t('contracts.downloadInvoice')}
                  </button>
                )}
              </div>
            </div>

            {/* Price Escrow Info Cards */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/50 border border-slate-100 rounded-xl p-3.5">
              <div>
                <span className="text-slate-400 font-bold">{t('contracts.totalValue')}</span>
                <p className="font-extrabold text-slate-800 text-sm mt-0.5">${selectedContract.amount} USD</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold">{t('contracts.escrowStatus')}</span>
                <p className="font-extrabold text-green-600 text-sm mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-550 shrink-0" />
                  {t('contracts.escrowFull')}
                </p>
              </div>
            </div>

            {/* Milestones timeline */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                {t('contracts.milestones')}
              </h4>

              {selectedContract.status === 'SIGNED' ? (
                <div className="text-center py-8 px-4 text-xs text-slate-400 bg-slate-50 border rounded-2xl font-semibold flex items-center justify-center gap-2">
                  <AlertCircle className="w-4.5 h-4.5 text-slate-450 shrink-0" />
                  <span>
                    {currentRole === 'FREELANCER'
                      ? t('contracts.needSign')
                      : language === 'vi'
                      ? 'Hợp đồng chưa được kích hoạt cho đến khi freelancer ký.'
                      : 'Contract is inactive until the freelancer signs.'}
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedContract.milestones.map((ms, idx) => {
                    const isFreelancer = currentRole === 'FREELANCER';
                    const isClient = currentRole === 'CLIENT';

                    return (
                      <div key={ms.id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/40 space-y-3.5 hover:border-slate-200 transition-colors">
                        {/* Milestone info */}
                        <div className="flex justify-between items-start gap-2 flex-wrap">
                          <div>
                            <h5 className="font-extrabold text-slate-800 text-xs">
                              {t('contracts.milestoneN', { n: idx + 1, name: getMilestoneName(ms, language) })}
                            </h5>
                            <p className="text-[10px] text-slate-400 mt-1 font-bold">{t('contracts.milestoneValue', { amount: ms.amount })}</p>
                          </div>

                          {/* Status Badge */}
                          <span
                            className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                              ms.status === 'ACCEPTED'
                                ? 'bg-green-50 text-green-700 border-green-100'
                                : ms.status === 'SUBMITTED'
                                ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
                                : 'bg-slate-100 text-slate-500 border-slate-250'
                            }`}
                          >
                            {ms.status === 'ACCEPTED'
                              ? t('milestoneStatus.paid')
                              : ms.status === 'SUBMITTED'
                              ? t('milestoneStatus.awaiting')
                              : t('milestoneStatus.notSubmitted')}
                          </span>
                        </div>

                        {/* Progress slider (Freelancer Only, while PENDING) */}
                        {ms.status === 'PENDING' && isFreelancer && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500">
                              <span>{t('contracts.progress')}</span>
                              <span className="text-blue-605">{ms.progress}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={ms.progress}
                              onChange={(e) =>
                                handleProgressSliderChange(selectedContract.id, ms.id, Number(e.target.value))
                              }
                              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                        )}

                        {/* Progress Display (Client/Admin, or Freelancer if NOT pending) */}
                        {(ms.status !== 'PENDING' || !isFreelancer) && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-bold text-slate-400">
                              <span>{t('contracts.progress')}</span>
                              <span>{ms.status === 'ACCEPTED' || ms.status === 'SUBMITTED' ? 100 : ms.progress}%</span>
                            </div>
                            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                                style={{
                                  width: `${ms.status === 'ACCEPTED' || ms.status === 'SUBMITTED' ? 100 : ms.progress}%`
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Deliverable submission action (Freelancer Only) */}
                        {ms.status === 'PENDING' && ms.progress === 100 && isFreelancer && (
                          <button
                            onClick={() => handleOpenDeliverableModal(ms)}
                            className="w-full h-8.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                          >
                            {t('contracts.submitDeliverable')}
                          </button>
                        )}

                        {/* Deliverable display and Approve action (Client Only) */}
                        {ms.status === 'SUBMITTED' && (
                          <div className="space-y-2.5 bg-white border border-slate-100 p-3 rounded-xl text-[10px] font-semibold leading-relaxed shadow-sm">
                            <p className="text-slate-450">
                              {t('contracts.fileLabel')} <span className="font-extrabold text-slate-750">{ms.deliverable}</span>
                            </p>
                            {ms.deliverableDesc && (
                              <p className="text-slate-450">
                                {t('contracts.noteLabel')} <span className="text-slate-650 italic">"{ms.deliverableDesc}"</span>
                              </p>
                            )}

                            {/* Client Approval Action */}
                            {isClient && (
                              <button
                                onClick={() => handleClientApproveMilestone(selectedContract.id, ms.id)}
                                className="w-full h-7.5 bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] rounded-lg shadow-sm mt-1.5 transition-colors flex items-center justify-center gap-1"
                              >
                                <DollarSign className="w-3.5 h-3.5 text-white" />
                                {language === 'vi' ? 'Phê duyệt & Giải ngân' : 'Approve & Release Payment'}
                              </button>
                            )}

                            {/* Freelancer Demo/Simulate approval button */}
                            {isFreelancer && (
                              <button
                                onClick={() => handleClientApproveMilestone(selectedContract.id, ms.id)}
                                className="w-full h-7.5 bg-green-605 hover:bg-green-700 text-white font-bold text-[10px] rounded-lg shadow-sm mt-1.5 flex items-center justify-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5 text-white" />
                                {t('contracts.demoApprove')}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Accepted display message */}
                        {ms.status === 'ACCEPTED' && (
                          <div className="text-[10px] text-green-700 font-extrabold flex items-center gap-1.5 bg-green-50/50 p-2.5 rounded-lg border border-green-100">
                            <CheckCircle2 className="w-4 h-4 text-green-550 shrink-0" />
                            {language === 'vi'
                              ? `Cột mốc hoàn thành. Đã thanh toán $${ms.amount} USD.`
                              : `Milestone completed. $${ms.amount} USD paid.`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm shadow-sm h-full flex flex-col justify-center items-center min-h-[320px] space-y-3 font-semibold">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <span>{t('contracts.selectContract')}</span>
          </div>
        )}
      </div>

      {/* FREELANCER: DELIVERABLE UPLOAD MODAL */}
      {submittingMilestone && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="font-bold text-lg text-slate-905">{t('contracts.deliverableTitle')}</h3>
              <p className="text-slate-500 text-xs mt-0.5 font-semibold">
                {t('contracts.deliverableMilestone', { name: getMilestoneName(submittingMilestone, language) })}
              </p>
            </div>

            <form onSubmit={handleSubmitDeliverable} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-650">{t('contracts.filePath')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('contracts.filePathPlaceholder')}
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-655">{t('contracts.clientNote')}</label>
                <textarea
                  rows={4}
                  placeholder={t('contracts.clientNotePlaceholder')}
                  value={fileNote}
                  onChange={(e) => setFileNote(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 resize-none font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSubmittingMilestone(null)}
                  className="h-10 px-4 border border-slate-200 bg-white rounded-xl text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all animate-pulse"
                >
                  {t('contracts.submitReview')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FREELANCER: CLIENT RATING REVIEW DIALOG */}
      {reviewContractId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-extrabold text-lg text-slate-905 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              {t('contracts.rateClientTitle')}
            </h3>

            {reviewSuccess ? (
              <div className="py-8 text-center space-y-3">
                <Star className="w-10 h-10 text-amber-400 fill-amber-400 mx-auto animate-bounce" />
                <p className="font-bold text-green-650">{t('contracts.reviewSuccess')}</p>
                <p className="text-xs text-slate-400">{t('contracts.reviewThanks')}</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs font-semibold">
                <div className="space-y-3">
                  {[
                    { label: t('contracts.cooperation'), val: commRating, set: setCommRating },
                    { label: t('contracts.payment'), val: payRating, set: setPayRating },
                    { label: t('contracts.clarity'), val: clarityRating, set: setClarityRating }
                  ].map((field) => (
                    <div key={field.label} className="flex justify-between items-center">
                      <span className="text-slate-600">{field.label}</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => field.set(star)}
                            className="transition-transform duration-100 hover:scale-110"
                          >
                            <Star className={`w-5 h-5 ${star <= field.val ? 'text-amber-400 fill-amber-400' : 'text-slate-205'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-655">{t('contracts.reviewNote')}</label>
                  <textarea
                    rows={3}
                    placeholder={t('contracts.reviewPlaceholder')}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 resize-none font-sans"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="anon"
                    checked={anonymous}
                    onChange={(e) => setAnonymous(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500/20 w-4 h-4 transition-all"
                  />
                  <label htmlFor="anon" className="text-slate-500 font-bold cursor-pointer">
                    {t('contracts.anonymous')}
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewContractId(null)}
                    className="h-9 px-4 border border-slate-200 bg-white rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-all"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition-all"
                  >
                    {t('contracts.sendReview')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CLIENT: FREELANCER RATING REVIEW DIALOG */}
      {clientReviewingContractId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-extrabold text-lg text-slate-905 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              {language === 'vi' ? 'Đánh giá Freelancer' : 'Rate Freelancer'}
            </h3>

            {clientReviewSuccess ? (
              <div className="py-8 text-center space-y-3">
                <Star className="w-10 h-10 text-amber-400 fill-amber-400 mx-auto animate-bounce" />
                <p className="font-bold text-green-650">{t('contracts.reviewSuccess')}</p>
                <p className="text-xs text-slate-400">{t('contracts.reviewThanks')}</p>
              </div>
            ) : (
              <form onSubmit={handleClientReviewSubmit} className="space-y-4 text-xs font-semibold">
                <div className="space-y-3">
                  {[
                    { label: language === 'vi' ? 'Kỹ năng chuyên môn:' : 'Professional Skills:', val: flSkillRating, set: setFlSkillRating },
                    { label: language === 'vi' ? 'Tiến độ & Hạn chót:' : 'Deadline & Speed:', val: flSpeedRating, set: setFlSpeedRating },
                    { label: language === 'vi' ? 'Giao tiếp & Trao đổi:' : 'Communication:', val: flCommRating, set: setFlCommRating }
                  ].map((field) => (
                    <div key={field.label} className="flex justify-between items-center">
                      <span className="text-slate-600">{field.label}</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => field.set(star)}
                            className="transition-transform duration-100 hover:scale-110"
                          >
                            <Star className={`w-5 h-5 ${star <= field.val ? 'text-amber-400 fill-amber-400' : 'text-slate-205'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-655">{language === 'vi' ? 'Ghi chú nhận xét:' : 'Review comments:'}</label>
                  <textarea
                    rows={3}
                    placeholder={
                      language === 'vi'
                        ? 'Mô tả trải nghiệm làm việc cùng freelancer...'
                        : 'Describe your experience working with the freelancer...'
                    }
                    value={clientReviewNote}
                    onChange={(e) => setClientReviewNote(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 resize-none font-sans"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setClientReviewingContractId(null)}
                    className="h-9 px-4 border border-slate-200 bg-white rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-all"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition-all"
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
