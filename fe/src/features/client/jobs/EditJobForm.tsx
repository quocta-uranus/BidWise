'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { jobsApi } from '@/lib/api/jobs.api';
import toast from 'react-hot-toast';
import { ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';

export function EditJobForm() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [hasBids, setHasBids] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    budgetFormat: 'FIXED',
    minBudget: '',
    maxBudget: '',
    fixedBudget: '',
    deadline: '',
    auctionType: 'SEALED_BID',
    skills: '', 
  });

  const [weights, setWeights] = useState({
    priceWeight: 0,
    skillWeight: 0,
    experienceWeight: 0,
    ratingWeight: 0,
    speedWeight: 0,
    deadlineWeight: 0,
    portfolioWeight: 0,
  });

  useEffect(() => {
    if (id) fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      const job = await jobsApi.findOne(id);
      
      const bidsCount = job._count?.bids || 0;
      setHasBids(bidsCount > 0);

      setFormData({
        title: job.title,
        description: job.description,
        categoryId: job.categoryId,
        budgetFormat: job.budgetFormat,
        minBudget: job.minBudget != null ? String(job.minBudget) : '',
        maxBudget: job.maxBudget != null ? String(job.maxBudget) : '',
        fixedBudget: job.fixedBudget != null ? String(job.fixedBudget) : '',
        deadline: job.deadline ? new Date(job.deadline).toISOString().slice(0, 16) : '',
        auctionType: job.auctionType,
        skills: job.skills?.map((s: any) => s.name).join(', ') || '',
      });

      if (job.ahpWeight) {
        const { id, jobId, createdAt, updatedAt, ...w } = job.ahpWeight;
        setWeights(w as any);
      }
    } catch (error) {
      toast.error('Failed to load job');
      router.push('/client/jobs');
    } finally {
      setFetching(false);
    }
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (hasBids) return;
    setWeights({
      ...weights,
      [e.target.name]: parseInt(e.target.value) || 0,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (hasBids && !['title', 'description'].includes(e.target.name)) return;
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasBids) {
      // Only allow basic update if has bids (title/desc)
      // Actually backend might reject entirely or just allow title/desc.
      // Let's send only allowed fields
    }

    setLoading(true);
    try {
      let payload: any = {
        title: formData.title,
        description: formData.description,
      };

      if (!hasBids) {
        const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
        if (totalWeight !== 100) {
          toast.error(`AHP weights must sum up exactly 100. Current sum: ${totalWeight}`);
          setLoading(false);
          return;
        }

        payload = {
          ...payload,
          minBudget: formData.minBudget ? parseFloat(formData.minBudget) : undefined,
          maxBudget: formData.maxBudget ? parseFloat(formData.maxBudget) : undefined,
          fixedBudget: formData.fixedBudget ? parseFloat(formData.fixedBudget) : undefined,
          skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
          ahpWeight: weights,
          budgetFormat: formData.budgetFormat,
          auctionType: formData.auctionType,
          deadline: formData.deadline,
        };
      }

      await jobsApi.update(id, payload);

      toast.success('Job updated successfully');
      router.push('/client/jobs');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update job');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="p-8 text-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/client/jobs" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Projects
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100 p-8 md:p-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Edit Job</h1>
          {hasBids && (
            <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg text-sm font-medium">
              <Lock className="w-4 h-4" />
              Job has bids. Some fields are locked.
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b">1. Basic Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
                <input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea required name="description" value={formData.description} onChange={handleChange} rows={5} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Required Skills (comma separated)</label>
                <input disabled={hasBids} required type="text" name="skills" value={formData.skills} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-60 disabled:bg-slate-100" />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b">2. Budget & Timeline</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Budget Format</label>
                <select disabled={hasBids} name="budgetFormat" value={formData.budgetFormat} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none disabled:opacity-60 disabled:bg-slate-100">
                  <option value="FIXED">Fixed Price</option>
                  <option value="RANGE">Price Range</option>
                </select>
              </div>

              {formData.budgetFormat === 'FIXED' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fixed Budget ($)</label>
                  <input disabled={hasBids} type="number" name="fixedBudget" value={formData.fixedBudget} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-60 disabled:bg-slate-100" />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Min ($)</label>
                    <input disabled={hasBids} type="number" name="minBudget" value={formData.minBudget} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-60 disabled:bg-slate-100" />
                  </div>
                  <span className="mt-6 text-slate-400">-</span>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Max ($)</label>
                    <input disabled={hasBids} type="number" name="maxBudget" value={formData.maxBudget} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-60 disabled:bg-slate-100" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deadline</label>
                <input min={new Date().toISOString().slice(0, 16)} disabled={hasBids} required type="datetime-local" name="deadline" value={formData.deadline} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-60 disabled:bg-slate-100" />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b">3. Auction & AHP Weights</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">Auction Type</label>
              <select disabled={hasBids} name="auctionType" value={formData.auctionType} onChange={handleChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-60 disabled:bg-slate-100">
                <option value="SEALED_BID">Sealed Bid</option>
                <option value="OPEN_BID">Open Bid</option>
              </select>
            </div>

            <div className={`bg-slate-50 p-4 rounded-xl border border-slate-200 ${hasBids ? 'opacity-70 grayscale-[50%]' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-slate-800">Evaluation Criteria Weights (%)</h3>
                <span className={`text-sm font-medium px-2 py-1 rounded-md ${
                  Object.values(weights).reduce((a,b)=>a+b,0) === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  Total: {Object.values(weights).reduce((a,b)=>a+b,0)}%
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(weights).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-slate-600 mb-1 uppercase tracking-wide">
                      {key.replace('Weight', '')}
                    </label>
                    <div className="flex items-center gap-3">
                      <input 
                        disabled={hasBids}
                        type="range" 
                        name={key} 
                        min="0" max="100" 
                        value={value} 
                        onChange={handleWeightChange}
                        className="flex-1 accent-blue-600 disabled:cursor-not-allowed"
                      />
                      <span className="w-12 text-sm font-medium text-slate-700 text-right">{value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="pt-6 mt-8 border-t flex justify-end gap-4">
            <Link href="/client/jobs" className="px-6 py-3 text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
              Cancel
            </Link>
            <button disabled={loading} type="submit" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 active:scale-95">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
