'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { jobsApi } from '@/lib/api/jobs.api';
import { Plus, Edit2, Trash2, Eye, Lock, Send } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export function ClientJobsList() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info' | 'success';
    confirmText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Confirm',
    onConfirm: () => {}
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await jobsApi.findMyJobs();
      setJobs(Array.isArray(res) ? res : (res as any).jobs ?? []);
    } catch (error) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async (id: string) => {
    try {
      await jobsApi.remove(id);
      toast.success('Job deleted successfully');
      fetchJobs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete job');
    }
  };

  const executeStatusChange = async (id: string, newStatus: string) => {
    try {
      await jobsApi.update(id, { status: newStatus as any });
      toast.success('Job status updated');
      fetchJobs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Job',
      message: 'Are you sure you want to delete this job? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: () => executeDelete(id),
    });
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    const isPublish = newStatus === 'OPEN';
    setConfirmModal({
      isOpen: true,
      title: isPublish ? 'Publish Job' : 'Close Job',
      message: isPublish ? 'Are you sure you want to publish this job? Freelancers will be able to start bidding immediately.' : 'Are you sure you want to close this job? Freelancers will no longer be able to submit bids.',
      type: isPublish ? 'success' : 'warning',
      confirmText: isPublish ? 'Publish' : 'Close Job',
      onConfirm: () => executeStatusChange(id, newStatus),
    });
  };

  const filteredJobs = activeTab === 'ALL' ? jobs : jobs.filter(j => j.status === activeTab);

  const tabs = ['ALL', 'DRAFT', 'OPEN', 'CLOSED', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED'];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 bg-gradient-to-r from-blue-900 to-blue-800 p-8 rounded-2xl text-white shadow-xl shadow-blue-900/10">
        <div>
          <h1 className="text-3xl font-bold">My Projects</h1>
          <p className="text-blue-200 mt-2 text-sm font-medium">Manage your freelance job postings</p>
        </div>
        <Link
          href="/client/jobs/create"
          className="mt-6 sm:mt-0 flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Post a Job
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-2 border-b border-slate-100 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 text-sm font-semibold text-slate-600">Job Title</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Status</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Bids</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Created At</th>
                <th className="p-4 text-sm font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Loading jobs...</td>
                </tr>
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No jobs found.</td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{job.title}</div>
                      <div className="text-sm text-slate-500 mt-1">{job.budgetFormat === 'FIXED' ? `$${job.fixedBudget}` : `$${job.minBudget} - $${job.maxBudget}`}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${job.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                          job.status === 'DRAFT' ? 'bg-slate-100 text-slate-800' :
                          job.status === 'CLOSED' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'}`}
                      >
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-600 font-medium">{job._count?.bids || 0}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-500 text-sm">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {job.status === 'OPEN' && (
                          <button
                            onClick={() => handleStatusChange(job.id, 'CLOSED')}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Close Job"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        )}
                        {job.status === 'DRAFT' && (
                          <button
                            onClick={() => handleStatusChange(job.id, 'OPEN')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Publish Job"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        <Link
                          href={`/client/jobs/${job.id}/edit`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Job"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
      />
    </div>
  );
}
