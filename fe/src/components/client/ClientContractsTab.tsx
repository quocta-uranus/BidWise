'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, Plus } from 'lucide-react';
import { contractsApi, Contract } from '@/lib/api/contracts.api';
import ContractCard from '@/components/contracts/ContractCard';
import ContractDetail from '@/components/contracts/ContractDetail';
import { toast } from 'sonner';

const STATUS_FILTERS = ['ALL', 'ACTIVE', 'COMPLETED', 'DISPUTED', 'CANCELLED'];
const STATUS_LABELS: Record<string, string> = {
  ALL: 'Tất cả',
  ACTIVE: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  DISPUTED: 'Tranh chấp',
  CANCELLED: 'Đã hủy',
};

export default function ClientContractsTab() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  const loadContracts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await contractsApi.listClientContracts();
      setContracts(data);
    } catch {
      toast.error('Không thể tải danh sách hợp đồng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadContracts(); }, [loadContracts]);

  const refreshSelected = async () => {
    if (selectedContract) {
      try {
        const updated = await contractsApi.getClientContract(selectedContract.id);
        setSelectedContract(updated);
      } catch {}
    }
    loadContracts();
  };

  const filtered = filterStatus === 'ALL'
    ? contracts
    : contracts.filter((c) => c.status === filterStatus);

  const pendingReview = contracts.filter((c) =>
    c.milestones.some((m) => m.status === 'SUBMITTED')
  ).length;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Tổng hợp đồng', value: contracts.length, color: 'text-slate-700' },
          { label: 'Đang thực hiện', value: contracts.filter((c) => c.status === 'ACTIVE').length, color: 'text-blue-600' },
          { label: 'Chờ nghiệm thu', value: pendingReview, color: 'text-amber-600' },
          { label: 'Hoàn thành', value: contracts.filter((c) => c.status === 'COMPLETED').length, color: 'text-emerald-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              filterStatus === s
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {STATUS_LABELS[s] ?? s}
            <span className="ml-1 opacity-70">
              ({s === 'ALL' ? contracts.length : contracts.filter((c) => c.status === s).length})
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <FileText size={40} className="mx-auto text-slate-200" />
          <p className="font-semibold text-slate-600">
            {filterStatus === 'ALL' ? 'Chưa có hợp đồng nào.' : `Không có hợp đồng ${STATUS_LABELS[filterStatus]?.toLowerCase()}.`}
          </p>
          <p className="text-xs text-slate-400">
            Hợp đồng được tạo sau khi bạn chấp nhận bid từ freelancer.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <ContractCard
              key={c.id}
              contract={c}
              userRole="client"
              onClick={() => setSelectedContract(c)}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedContract && (
        <ContractDetail
          contract={selectedContract}
          userRole="client"
          onClose={() => setSelectedContract(null)}
          onRefresh={refreshSelected}
        />
      )}
    </div>
  );
}
