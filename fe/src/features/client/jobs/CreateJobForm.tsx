'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jobsApi } from '@/lib/api/jobs.api';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export function CreateJobForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  
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
    priceWeight: 40,
    skillWeight: 20,
    experienceWeight: 10,
    ratingWeight: 10,
    speedWeight: 10,
    deadlineWeight: 5,
    portfolioWeight: 5,
  });

  useEffect(() => {
    jobsApi.getCategories().then((data) => {
      setCategories(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, categoryId: data[0].id }));
      }
    }).catch(() => {
      toast.error("Failed to load categories");
    });
  }, []);

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWeights({
      ...weights,
      [e.target.name]: parseInt(e.target.value) || 0,
    });
  };

  const getLocalMinDate = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    if (totalWeight !== 100) {
      toast.error(`AHP weights must sum up to exactly 100%. Current sum: ${totalWeight}%`);
      setLoading(false);
      return;
    }

    try {
      await jobsApi.create({
        ...formData,
        minBudget: formData.minBudget ? parseFloat(formData.minBudget) : undefined,
        maxBudget: formData.maxBudget ? parseFloat(formData.maxBudget) : undefined,
        fixedBudget: formData.fixedBudget ? parseFloat(formData.fixedBudget) : undefined,
        deadline: new Date(formData.deadline).toISOString(),
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        ahpWeight: weights,
        budgetFormat: formData.budgetFormat as any,
        auctionType: formData.auctionType as any,
      });

      toast.success('Job draft saved successfully');
      router.push('/client/jobs');
    } catch (error: any) {
      const msg = error.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Failed to post job'));
      setLoading(false);
    }
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const isWeightValid = totalWeight === 100;

  return (
    <div className="min-h-screen bg-[#fafafa] py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/client/jobs" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Projects
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 mt-4 tracking-tight">Post a New Job</h1>
            <p className="text-sm text-slate-500 mt-1">Provide clear requirements to attract the best talent.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-8 space-y-10">
            
            {/* Section 1 & 2 in Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              
              {/* Left Column: Basic Details */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-4">1. Project Essentials</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Project Title</label>
                      <input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm placeholder-slate-400" placeholder="e.g. E-commerce website design" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                        <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm">
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Required Skills</label>
                        <input required type="text" name="skills" value={formData.skills} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm placeholder-slate-400" placeholder="React, Figma, Node..." />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Detailed Description</label>
                      <textarea required name="description" value={formData.description} onChange={handleChange} rows={6} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm placeholder-slate-400 resize-none" placeholder="Describe the deliverables, timeline, and goals..." />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Budget & Bidding */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-4">2. Budget & Timeline</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Budget Format</label>
                      <select name="budgetFormat" value={formData.budgetFormat} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm">
                        <option value="FIXED">Fixed Price</option>
                        <option value="RANGE">Price Range</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Deadline</label>
                      <input min={getLocalMinDate()} required type="datetime-local" name="deadline" value={formData.deadline} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm" />
                    </div>
                  </div>

                  <div className="mt-4">
                    {formData.budgetFormat === 'FIXED' ? (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Fixed Budget ($)</label>
                        <input type="number" name="fixedBudget" value={formData.fixedBudget} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm" placeholder="500" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Min ($)</label>
                          <input type="number" name="minBudget" value={formData.minBudget} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm" placeholder="300" />
                        </div>
                        <span className="mt-5 text-slate-400">-</span>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Max ($)</label>
                          <input type="number" name="maxBudget" value={formData.maxBudget} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm" placeholder="800" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-4">3. Bidding Privacy</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`cursor-pointer rounded-lg border p-3 text-sm transition-colors ${formData.auctionType === 'SEALED_BID' ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" name="auctionType" value="SEALED_BID" className="sr-only" onChange={handleChange} checked={formData.auctionType === 'SEALED_BID'} />
                      <p className="font-semibold text-slate-900">Sealed Bid</p>
                      <p className="text-slate-500 mt-0.5 text-xs">Hidden bids for fair pricing</p>
                    </label>
                    <label className={`cursor-pointer rounded-lg border p-3 text-sm transition-colors ${formData.auctionType === 'OPEN_BID' ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" name="auctionType" value="OPEN_BID" className="sr-only" onChange={handleChange} checked={formData.auctionType === 'OPEN_BID'} />
                      <p className="font-semibold text-slate-900">Open Bid</p>
                      <p className="text-slate-500 mt-0.5 text-xs">Public bids for competition</p>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: AHP Framework */}
            <div className="border-t border-slate-200 pt-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">4. Evaluation Weights (AHP)</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Define criteria importance for AI ranking. Must total 100%.</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${isWeightValid ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  Total: {totalWeight}%
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-5 border border-slate-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
                  {Object.entries(weights).map(([key, value]) => {
                    const label = key.replace('Weight', '').charAt(0).toUpperCase() + key.replace('Weight', '').slice(1);
                    return (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-xs font-semibold text-slate-700">{label}</label>
                          <span className="text-xs font-bold text-blue-600">{value}%</span>
                        </div>
                        <input 
                          type="range" 
                          name={key} 
                          min="0" max="100" 
                          value={value} 
                          onChange={handleWeightChange}
                          className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
          
          <div className="bg-slate-50 border-t border-slate-200 p-6 flex items-center justify-end gap-3">
            <Link href="/client/jobs" className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Cancel
            </Link>
            <button disabled={loading} type="submit" className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center shadow-sm">
              {loading ? 'Saving...' : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save as Draft
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
