'use client';

import { useState, useMemo } from 'react';
import { useFreelancer, Job } from '@/lib/hooks/useFreelancer';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { localizeJob, buildCoverLetter, defaultBio } from '@/lib/i18n/demo-content';

export default function JobsTab() {
  const { jobs, bids, profile, bookmarks, toggleBookmark, submitBid, jobAlerts, toggleJobAlerts, useBidToken, bidTokens, bidTokensUsed, lastBidDate } = useFreelancer();
  const { t, language } = useTranslation();

  // Compute real tokens remaining (daily reset)
  const today = new Date().toISOString().split('T')[0];
  const usedToday = lastBidDate === today ? bidTokensUsed : 0;
  const tokensRemaining = bidTokens - usedToday;

  // Filter/Search states
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [auctionType, setAuctionType] = useState<string>('all');
  const [minBudget, setMinBudget] = useState<number>(0);
  const [maxBudget, setMaxBudget] = useState<number>(5000);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [deadlineBefore, setDeadlineBefore] = useState<string>('');  
  const [sortBy, setSortBy] = useState<string>('newest');
  
  // Active Tab: All Jobs vs Bookmarks
  const [subTab, setSubTab] = useState<'all' | 'bookmarks' | 'recommend'>('all');

  // Selected Job for Drawer/Detail Modal
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Bidding form states
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [bidDays, setBidDays] = useState<string>('');
  const [coverLetter, setCoverLetter] = useState('');
  const [bidFile, setBidFile] = useState<File | null>(null);
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState(false);

  // AI Cover Letter Generator
  const handleGenerateAICover = () => {
    if (!selectedJob) return;

    const localized = localizeJob(selectedJob, language);
    const bioText = profile.bio || defaultBio[language];

    setCoverLetter(
      buildCoverLetter({
        clientName: selectedJob.clientName,
        projectTitle: localized.title,
        bioText,
        skillList: profile.skills.join(', '),
        hourlyRate: profile.hourlyRate,
        assessmentLevel: profile.assessmentLevel,
        bidDays,
        lang: language,
      })
    );
  };

  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBidError('');
    
    if (!selectedJob) return;
    
    const amountNum = Number(bidAmount);
    const daysNum = Number(bidDays);

    if (isNaN(amountNum) || amountNum <= 0) {
      setBidError(t('jobs.errInvalidAmount'));
      return;
    }
    if (isNaN(daysNum) || daysNum <= 0) {
      setBidError(t('jobs.errInvalidDays'));
      return;
    }

    // Limit based on reputation / availability
    if (!profile.available) {
      setBidError(t('jobs.errNotAvailable'));
      return;
    }

    // Check bid token quota
    const tokenGranted = useBidToken();
    if (!tokenGranted) {
      setBidError(t('jobs.errNoTokens'));
      return;
    }

    // Submit bid
    submitBid(selectedJob.id, amountNum, daysNum, coverLetter, bidFile?.name);
    
    setBidSuccess(true);
    setTimeout(() => {
      setBidSuccess(false);
      setShowBidModal(false);
      setSelectedJob(null);
      setBidAmount('');
      setBidDays('');
      setCoverLetter('');
      setBidFile(null);
    }, 1500);
  };

  // Tính điểm matching score và match percentage cho từng Job
  const calculateMatch = (job: Job) => {
    const profileSkills = profile.skills;
    const matched = job.skills.filter((s) => profileSkills.includes(s));
    const percentage = Math.round((matched.length / job.skills.length) * 100);
    
    // Weighted match score
    let score = percentage * 0.7; // 70% từ skills
    if (profile.assessmentCompleted) score += 15; // 15% bonus nếu hoàn thành test
    if (profile.hourlyRate > 0 && (profile.hourlyRate * 8 * 5) <= job.budget) score += 15; // 15% bonus nếu giá giờ phù hợp ngân sách
    
    return {
      percentage,
      score: Math.min(100, Math.round(score)),
      matchedSkills: matched,
      missingSkills: job.skills.filter((s) => !profileSkills.includes(s))
    };
  };

  // Collect all unique skills across all jobs for the skill filter
  const allJobSkills = useMemo(() => {
    const skillSet = new Set<string>();
    jobs.forEach((j) => j.skills.forEach((s) => skillSet.add(s)));
    return Array.from(skillSet).sort();
  }, [jobs]);

  const toggleSkillFilter = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const localizedJobs = useMemo(
    () => jobs.map((job) => localizeJob(job, language)),
    [jobs, language]
  );

  const displaySelectedJob = selectedJob ? localizeJob(selectedJob, language) : null;

  // Filter & Sort logic
  const filteredJobs = localizedJobs.filter((job) => {
    const original = jobs.find((j) => j.id === job.id)!;
    // 1. Search filter
    const matchesSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.description.toLowerCase().includes(search.toLowerCase());
      
    // 2. Category filter
    const matchesCategory = category === 'all' || job.category === category;
    
    // 3. Auction type filter
    const matchesAuction = auctionType === 'all' || job.auctionType === auctionType;

    // 4. Budget range filter
    const matchesBudget = job.budget >= minBudget && job.budget <= maxBudget;

    // 5. Skill filter
    const matchesSkills =
      selectedSkills.length === 0 ||
      selectedSkills.every((s) => original.skills.includes(s));

    // 6. Deadline filter
    const matchesDeadline =
      !deadlineBefore || new Date(job.deadline) <= new Date(deadlineBefore);

    // 7. Sub tab filter
    const matchesSubTab =
      subTab === 'all' ||
      (subTab === 'bookmarks' && bookmarks.includes(job.id)) ||
      (subTab === 'recommend' && calculateMatch(original).percentage >= 50);

    return matchesSearch && matchesCategory && matchesAuction && matchesBudget && matchesSkills && matchesDeadline && matchesSubTab;
  });

  // Sorting
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    }
    if (sortBy === 'budget_desc') {
      return b.budget - a.budget;
    }
    if (sortBy === 'budget_asc') {
      return a.budget - b.budget;
    }
    if (sortBy === 'deadline') {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    return 0;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar Filter */}
      <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5 h-fit">
        <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2.5">{t('jobs.filterTitle')}</h3>
        
        {/* Bid Token Counter */}
        <div className={`flex items-center justify-between text-xs font-bold px-3 py-2 rounded-xl border ${
          tokensRemaining <= 2 ? 'bg-red-50 border-red-100 text-red-700' : 'bg-blue-50 border-blue-100 text-blue-700'
        }`}>
          <span>🎫 {t('jobs.tokenWarning', { remaining: String(tokensRemaining), total: String(bidTokens) })}</span>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase">{t('jobs.keyword')}</label>
          <input
            type="text"
            placeholder={t('jobs.keywordPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500"
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase">{t('jobs.field')}</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-10 px-2 rounded-xl border border-slate-200 text-sm outline-none bg-white focus:border-blue-500"
          >
            <option value="all">{t('jobs.allFields')}</option>
            <option value="frontend">Frontend Development</option>
            <option value="backend">Backend Development</option>
            <option value="mobile">Mobile App Development</option>
            <option value="fullstack">Fullstack Development</option>
          </select>
        </div>

        {/* Auction Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase">{t('jobs.auctionForm')}</label>
          <select
            value={auctionType}
            onChange={(e) => setAuctionType(e.target.value)}
            className="w-full h-10 px-2 rounded-xl border border-slate-200 text-sm outline-none bg-white focus:border-blue-500"
          >
            <option value="all">{t('jobs.allForms')}</option>
            <option value="OPEN">{t('jobs.openBid')}</option>
            <option value="SEALED">{t('jobs.sealedBid')}</option>
          </select>
        </div>

        {/* Skill Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase">{t('jobs.skillFilter')}</label>
          <div className="flex flex-wrap gap-1.5">
            {allJobSkills.map((skill) => (
              <button
                key={skill}
                onClick={() => toggleSkillFilter(skill)}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                  selectedSkills.includes(skill)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
          {selectedSkills.length > 0 && (
            <button
              onClick={() => setSelectedSkills([])}
              className="text-[10px] text-slate-400 hover:text-red-500 font-semibold"
            >
              × {t('jobs.allSkills')}
            </button>
          )}
        </div>

        {/* Budget range */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase">
            <span>{t('jobs.budgetRange')}</span>
            <span className="font-bold text-blue-600">${minBudget} – ${maxBudget}</span>
          </div>
          <div className="space-y-2">
            <div className="space-y-0.5">
              <p className="text-[10px] text-slate-400">{t('jobs.minBudget')}</p>
              <input
                type="range"
                min={0}
                max={5000}
                step={100}
                value={minBudget}
                onChange={(e) => setMinBudget(Math.min(Number(e.target.value), maxBudget))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] text-slate-400">{t('jobs.maxBudget')}</p>
              <input
                type="range"
                min={0}
                max={5000}
                step={100}
                value={maxBudget}
                onChange={(e) => setMaxBudget(Math.max(Number(e.target.value), minBudget))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Deadline filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase">{t('jobs.deadlineFilter')}</label>
          <input
            type="date"
            value={deadlineBefore}
            onChange={(e) => setDeadlineBefore(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 bg-white"
          />
          {deadlineBefore && (
            <button
              onClick={() => setDeadlineBefore('')}
              className="text-[10px] text-slate-400 hover:text-red-500 font-semibold"
            >
              × Xóa
            </button>
          )}
        </div>

        {/* Alerts setting */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-semibold">{t('jobs.emailAlerts')}</span>
          <button
            onClick={() => toggleJobAlerts(!jobAlerts)}
            className={`w-10 h-6 rounded-full p-0.5 transition-colors ${
              jobAlerts ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                jobAlerts ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main content Area */}
      <div className="lg:col-span-3 space-y-4">
        {/* Sub Navigation Tabs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setSubTab('all')}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                subTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t('jobs.allJobsTab')}
            </button>
            <button
              onClick={() => setSubTab('recommend')}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                subTab === 'recommend' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t('jobs.recommendTab')}
            </button>
            <button
              onClick={() => setSubTab('bookmarks')}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                subTab === 'bookmarks' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t('jobs.savedTab', { count: bookmarks.length })}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-[11px] font-bold text-slate-400 uppercase">{t('jobs.sortLabel')}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-8 px-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
            >
              <option value="newest">{t('jobs.newest')}</option>
              <option value="budget_desc">{t('jobs.budgetDesc')}</option>
              <option value="budget_asc">{t('jobs.budgetAsc')}</option>
              <option value="deadline">{t('jobs.deadlineSort')}</option>
            </select>
          </div>
        </div>

        {/* Cold-start Alert Banner */}
        {!profile.assessmentCompleted && subTab === 'recommend' && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3.5 items-start">
            <span className="text-xl mt-0.5">ℹ️</span>
            <div className="space-y-1">
              <h4 className="font-bold text-blue-900 text-sm">{t('jobs.improveRecommend')}</h4>
              <p className="text-blue-700 text-xs leading-relaxed">
                {t('jobs.improveRecommendDesc')}
              </p>
            </div>
          </div>
        )}

        {/* Job Cards */}
        {sortedJobs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400 text-sm shadow-sm">
            🔍 {t('jobs.noJobsFound')}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedJobs.map((job) => {
              const original = jobs.find((j) => j.id === job.id)!;
              const { percentage, score, matchedSkills } = calculateMatch(original);
              const alreadyBided = bids.some((b) => b.jobId === job.id && b.status !== 'WITHDRAWN');
              
              return (
                <div
                  key={job.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between gap-4 relative"
                >
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-black text-slate-900 text-base hover:text-blue-600 cursor-pointer" onClick={() => setSelectedJob(original)}>
                            {job.title}
                          </h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            job.auctionType === 'OPEN'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {job.auctionType === 'OPEN' ? t('jobs.open') : t('jobs.sealed')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{t('jobs.postedBy', { client: job.clientName, deadline: job.deadline })}</p>
                      </div>

                      {/* Bookmark Icon */}
                      <button
                        onClick={() => toggleBookmark(job.id)}
                        className="text-lg hover:scale-110 transition-transform text-slate-300 hover:text-amber-500"
                      >
                        {bookmarks.includes(job.id) ? '⭐' : '☆'}
                      </button>
                    </div>

                    {/* Desc */}
                    <p className="text-slate-600 text-xs line-clamp-3 leading-relaxed">
                      {job.description}
                    </p>
                  </div>

                  {/* Skills required */}
                  <div className="flex flex-wrap gap-1">
                    {job.skills.map((s) => {
                      const isMatched = matchedSkills.includes(s);
                      return (
                        <span
                          key={s}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            isMatched
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : 'bg-slate-50 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {s}
                        </span>
                      );
                    })}
                  </div>

                  {/* Footer Stats & Actions */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-5 text-xs">
                      <div>
                        <span className="text-slate-400">{t('jobs.budget')}:</span>{' '}
                        <span className="font-bold text-slate-900">${job.budget}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">{t('jobs.bidCount')}</span>{' '}
                        <span className="font-semibold text-slate-800">{job.bidsCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">{t('jobs.matchFit')}</span>{' '}
                        <span className={`font-bold ${
                          percentage >= 70 ? 'text-green-600' : percentage >= 40 ? 'text-amber-600' : 'text-slate-500'
                        }`}>{percentage}% Match</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="h-9 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-all"
                      >
                        {t('common.detail')}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedJob(job);
                          if (!alreadyBided) setShowBidModal(true);
                        }}
                        disabled={alreadyBided}
                        className={`h-9 px-4 text-xs font-bold rounded-xl transition-all shadow-sm ${
                          alreadyBided
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {alreadyBided ? t('jobs.alreadyBid') : t('jobs.sendBid')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* JOB DETAIL DRAWER / MODAL */}
      {displaySelectedJob && !showBidModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-end p-0">
          <div className="bg-white w-full max-w-lg h-full p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 overflow-y-auto">
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                      {displaySelectedJob.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      displaySelectedJob.auctionType === 'OPEN' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {displaySelectedJob.auctionType === 'OPEN' ? t('jobs.open') : t('jobs.sealed')}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-xl text-slate-900 mt-2">{displaySelectedJob.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{t('jobs.clientLabel', { client: displaySelectedJob.clientName, date: displaySelectedJob.postedAt })}</p>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Explanatory Match Score Card */}
              {(() => {
                const { score, percentage, matchedSkills, missingSkills } = calculateMatch(selectedJob!);
                return (
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">{t('jobs.matchScoreAhp')}</span>
                      <span className="text-sm font-black text-blue-600">{score}/100</span>
                    </div>
                    {/* Visual bar */}
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600" style={{ width: `${score}%` }} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs pt-1.5 border-t border-slate-200/50">
                      <div className="space-y-1">
                        <span className="text-green-600 font-bold block">{t('jobs.matchedSkills', { count: matchedSkills.length })}</span>
                        <div className="flex flex-wrap gap-1">
                          {matchedSkills.map(s => (
                            <span key={s} className="bg-green-50 text-green-700 text-[10px] px-1.5 rounded">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 font-bold block">{t('jobs.missingSkills', { count: missingSkills.length })}</span>
                        <div className="flex flex-wrap gap-1">
                          {missingSkills.length === 0 ? (
                            <span className="text-[10px] text-slate-400">{t('jobs.noMissing')}</span>
                          ) : (
                            missingSkills.map(s => (
                              <span key={s} className="bg-slate-100 text-slate-500 text-[10px] px-1.5 rounded">{s}</span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Description */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">{t('jobs.projectDesc')}</h4>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                  {displaySelectedJob.description}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50/50 border border-slate-100 rounded-xl p-3 text-center text-xs">
                <div>
                  <p className="text-slate-400">{t('jobs.budget')}</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">${displaySelectedJob.budget}</p>
                </div>
                <div>
                  <p className="text-slate-400">{t('jobs.deadline')}</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{displaySelectedJob.deadline}</p>
                </div>
                <div>
                  <p className="text-slate-400">{t('jobs.submitted')}</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{displaySelectedJob.bidsCount}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setSelectedJob(null)}
                className="flex-1 h-11 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold text-slate-700 text-sm transition-all"
              >
                {t('common.close')}
              </button>
              {(() => {
                const bided = bids.some((b) => b.jobId === displaySelectedJob.id && b.status !== 'WITHDRAWN');
                return (
                  <button
                    onClick={() => {
                      if (!bided) setShowBidModal(true);
                    }}
                    disabled={bided}
                    className={`flex-1 h-11 font-bold text-sm rounded-xl transition-all shadow-sm ${
                      bided
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {bided ? t('jobs.alreadyBid') : t('jobs.sendBid')}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* BID SUBMISSION MODAL */}
      {showBidModal && displaySelectedJob && selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="font-bold text-lg text-slate-900">{t('jobs.submitBidTitle')}</h3>
              <p className="text-slate-500 text-xs mt-0.5">{t('jobs.projectLabel', { title: displaySelectedJob.title })}</p>
              {/* Token indicator in modal */}
              <div className={`mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                tokensRemaining <= 2 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}>
                🎫 {t('jobs.tokenWarning', { remaining: String(tokensRemaining), total: String(bidTokens) })}
              </div>
            </div>

            {bidSuccess ? (
              <div className="py-8 text-center space-y-3">
                <span className="text-3xl block">🚀</span>
                <p className="font-bold text-green-600">{t('jobs.bidSubmitted')}</p>
                <p className="text-xs text-slate-400">{t('jobs.redirecting')}</p>
              </div>
            ) : (
              <form onSubmit={handleBidSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">{t('jobs.bidAmount')}</label>
                    <input
                      type="number"
                      required
                      placeholder={`Budget: $${displaySelectedJob.budget}`}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
                    />
                    {Number(bidAmount) > displaySelectedJob.budget && (
                      <p className="text-[10px] text-amber-600">{t('jobs.overBudget')}</p>
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">{t('jobs.bidDays')}</label>
                    <input
                      type="number"
                      required
                      placeholder="Ví dụ: 10"
                      value={bidDays}
                      onChange={(e) => setBidDays(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-600">{t('jobs.coverLetter')}</label>
                    <button
                      type="button"
                      onClick={handleGenerateAICover}
                      className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                    >
                      {t('profile.generateAiTemplate')}
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    required
                    placeholder="Mô tả năng lực, kế hoạch triển khai của bạn..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500 resize-none font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">{t('jobs.attachProposal')}</label>
                  <input
                    type="file"
                    onChange={(e) => setBidFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                {bidError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-lg">{bidError}</p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBidModal(false)}
                    className="h-10 px-4 border border-slate-200 bg-white rounded-lg text-slate-700 font-semibold text-sm hover:bg-slate-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-sm"
                  >
                    {t('jobs.sendBid')}
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
