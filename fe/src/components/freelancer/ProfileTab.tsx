'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Pencil,
  FolderOpen,
  Trash2,
  ExternalLink,
  FileText,
  Upload,
  Award,
  Plus,
  X,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { freelancerApi, type FreelancerProfileResponse } from '@/lib/api/freelancer-profile.api';
import { getQuizQuestions, localizeAssessmentLevel } from '@/lib/i18n/demo-content';
import { useTranslation } from '@/lib/i18n/useTranslation';

// Map BE response -> UI shape used by this component
function mapProfile(raw: FreelancerProfileResponse) {
  return {
    bio: raw.bio ?? '',
    hourlyRate: raw.hourlyRate ?? 0,
    phone: raw.phone ?? '',
    experience: raw.experience ?? '',
    skills: raw.skills ?? [],
    portfolio: raw.portfolios ?? [],
    cv: raw.cvFileUrl
      ? { fileName: raw.cvFileName ?? '', fileSize: raw.cvFileSize ?? '', uploadedAt: raw.cvUploadedAt ?? '' }
      : null,
    certificates: raw.certifications ?? [],
    available: raw.available,
    assessmentCompleted: raw.assessmentCompleted,
    assessmentScore: raw.assessmentScore,
    assessmentLevel: raw.assessmentLevel ?? undefined,
  };
}

export default function ProfileTab() {
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const quizQuestions = useMemo(() => getQuizQuestions(language), [language]);

  // ── Fetch profile ──────────────────────────────────────────────────────────
  const { data: rawProfile, isLoading } = useQuery({
    queryKey: ['freelancer-profile'],
    queryFn: async () => {
      const res = await freelancerApi.getMyProfile();
      return res.data.data;
    },
  });

  const profile = useMemo(
    () => (rawProfile ? mapProfile(rawProfile) : null),
    [rawProfile],
  );

  // ── Mutations ─────────────────────────────────────────────────────────────
  const updateProfile = useMutation({
    mutationFn: (data: Parameters<typeof freelancerApi.updateProfile>[0]) =>
      freelancerApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelancer-profile'] });
      toast.success('Cập nhật hồ sơ thành công');
    },
    onError: () => toast.error('Cập nhật thất bại'),
  });

  const addSkillMutation = useMutation({
    mutationFn: (skill: string) => freelancerApi.addSkill(skill),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelancer-profile'] });
    },
    onError: () => toast.error('Thêm skill thất bại'),
  });

  const removeSkillMutation = useMutation({
    mutationFn: (skill: string) => freelancerApi.removeSkill(skill),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelancer-profile'] });
    },
    onError: () => toast.error('Xóa skill thất bại'),
  });

  const addPortfolioMutation = useMutation({
    mutationFn: (data: Parameters<typeof freelancerApi.createPortfolio>[0]) =>
      freelancerApi.createPortfolio(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelancer-profile'] });
      toast.success('Thêm portfolio thành công');
    },
    onError: () => toast.error('Thêm portfolio thất bại'),
  });

  const deletePortfolioMutation = useMutation({
    mutationFn: (id: string) => freelancerApi.deletePortfolio(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelancer-profile'] });
      toast.success('Đã xóa portfolio');
    },
    onError: () => toast.error('Xóa thất bại'),
  });

  const uploadCvMutation = useMutation({
    mutationFn: (data: Parameters<typeof freelancerApi.uploadCv>[0]) =>
      freelancerApi.uploadCv(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelancer-profile'] });
      toast.success('Upload CV thành công');
    },
    onError: () => toast.error('Upload CV thất bại'),
  });

  const addCertMutation = useMutation({
    mutationFn: (data: Parameters<typeof freelancerApi.addCertification>[0]) =>
      freelancerApi.addCertification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelancer-profile'] });
      toast.success('Thêm chứng chỉ thành công');
    },
    onError: () => toast.error('Thêm chứng chỉ thất bại'),
  });

  const deleteCertMutation = useMutation({
    mutationFn: (id: string) => freelancerApi.deleteCertification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelancer-profile'] });
      toast.success('Đã xóa chứng chỉ');
    },
    onError: () => toast.error('Xóa thất bại'),
  });

  const assessmentMutation = useMutation({
    mutationFn: (answers: number[]) => freelancerApi.submitAssessment(answers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelancer-profile'] });
    },
  });

  // ── UI State ─────────────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState(0);
  const [phone, setPhone] = useState('');
  const [experience, setExperience] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [portTitle, setPortTitle] = useState('');
  const [portDesc, setPortDesc] = useState('');
  const [portLink, setPortLink] = useState('');
  const [portFile, setPortFile] = useState<File | null>(null);
  const [showPortModal, setShowPortModal] = useState(false);
  const [certName, setCertName] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certDate, setCertDate] = useState('');
  const [certLink, setCertLink] = useState('');
  const [showCertModal, setShowCertModal] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Sync form state when profile loads
  const syncForm = useCallback(() => {
    if (!profile) return;
    setBio(profile.bio);
    setHourlyRate(profile.hourlyRate);
    setPhone(profile.phone);
    setExperience(profile.experience);
  }, [profile]);

  if (isLoading) {
    return <div className="text-slate-500 py-8 text-center">Đang tải hồ sơ...</div>;
  }

  if (!profile) {
    return <div className="text-slate-500 py-8 text-center">Không tìm thấy hồ sơ freelancer.</div>;
  }

  // ── Completeness ────────────────────────────────────────────────────────
  let completeness = 0;
  if (profile.bio) completeness += 15;
  if (profile.hourlyRate > 0) completeness += 10;
  if (profile.phone) completeness += 15;
  if (profile.portfolio.length > 0) completeness += 20;
  if (profile.cv) completeness += 15;
  if (profile.certificates.length > 0) completeness += 10;
  if (profile.assessmentCompleted) completeness += 15;

  // ── Handlers ────────────────────────────────────────────────────────────
  function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault();
    updateProfile.mutate({
      bio,
      hourlyRate: Number(hourlyRate),
      phone,
      experience,
    });
    setEditing(false);
  }

  function handleAddSkill() {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    addSkillMutation.mutate(trimmed);
    setNewSkill('');
  }

  function handleSkillKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); }
  }

  function handleAddPortfolioSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!portTitle) return;
    if (portFile) {
      const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'application/zip'];
      const ext = portFile.name.slice(portFile.name.lastIndexOf('.')).toLowerCase();
      if (!allowed.includes(portFile.type) && !['.pdf','.png','.jpg','.jpeg','.zip'].includes(ext)) {
        alert('Sai định dạng file!');
        return;
      }
      if (portFile.size > 50 * 1024 * 1024) { alert('File vượt 50MB!'); return; }
    }
    addPortfolioMutation.mutate({
      title: portTitle,
      desc: portDesc,
      link: portLink,
      fileName: portFile ? portFile.name : undefined,
      fileSize: portFile ? `${(portFile.size / 1024 / 1024).toFixed(2)} MB` : undefined,
    });
    setPortTitle(''); setPortDesc(''); setPortLink(''); setPortFile(null);
    setShowPortModal(false);
  }

  function handleAddCertSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!certName || !certIssuer) return;
    addCertMutation.mutate({ name: certName, issuer: certIssuer, date: certDate, verifyLink: certLink });
    setCertName(''); setCertIssuer(''); setCertDate(''); setCertLink('');
    setShowCertModal(false);
  }

  function handleCvChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { alert('File vượt 50MB!'); return; }
    uploadCvMutation.mutate({
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      uploadedAt: new Date().toISOString().split('T')[0],
    });
  }

  function handleQuizAnswer(optionIdx: number) {
    const newAnswers = [...answers, optionIdx];
    setAnswers(newAnswers);
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate score
      let score = 0;
      quizQuestions.forEach((q, idx) => {
        if (newAnswers[idx] === q.correct) score++;
      });
      setQuizScore(score);
      assessmentMutation.mutate(newAnswers);
      setQuizFinished(true);
    }
  }

  function resetQuiz() {
    setCurrentQuestion(0); setAnswers([]); setQuizFinished(false); setQuizScore(0); setQuizOpen(false);
  }

  return (
    <div className="space-y-6">
      {/* Completeness Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="56" cy="56" r="48" stroke="#e2e8f0" strokeWidth="8" fill="transparent" />
            <circle cx="56" cy="56" r="48" stroke="#2563eb" strokeWidth="8" fill="transparent"
              strokeDasharray={301.6} strokeDashoffset={301.6 - (301.6 * completeness) / 100}
              className="transition-all duration-1000 ease-out" />
          </svg>
          <span className="absolute text-xl font-bold text-slate-800">{completeness}%</span>
        </div>
        <div className="flex-1 text-center md:text-left space-y-2">
          <h3 className="text-lg font-bold text-slate-900">Độ hoàn thiện hồ sơ</h3>
          <p className="text-slate-500 text-sm max-w-lg">Hồ sơ đầy đủ giúp bạn tăng điểm matching AHP-TOPSIS và tiếp cận nhiều cơ hội việc làm.</p>
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {[
              [profile.bio, 'Bio (+15%)'],
              [profile.hourlyRate > 0, 'Hourly Rate (+10%)'],
              [profile.portfolio.length > 0, 'Portfolio (+20%)'],
              [!!profile.cv, 'CV PDF (+15%)'],
              [profile.assessmentCompleted, 'Skill Assessment (+15%)'],
            ].map(([done, label]) => (
              <span key={label as string}
                className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${done ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-400 border border-dashed border-slate-200'}`}>
                {label as string}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left col: Info + Skills */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio & Info */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">Thông tin Freelancer</h3>
              {!editing && (
                <button onClick={() => { syncForm(); setEditing(true); }}
                  className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"><Pencil className="w-3 h-3" /> Chỉnh sửa</button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSaveInfo} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Hourly Rate ($)</label>
                    <input type="number" required value={hourlyRate} onChange={e => setHourlyRate(Number(e.target.value))}
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500" min={1} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Số điện thoại</label>
                    <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500" placeholder="09xxxxxxxx" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Kinh nghiệm</label>
                  <input type="text" value={experience} onChange={e => setExperience(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500"
                    placeholder="Mô tả kinh nghiệm của bạn..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Bio / Tự giới thiệu</label>
                  <textarea required rows={4} value={bio} onChange={e => setBio(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 resize-none"
                    placeholder="Giới thiệu về bản thân, kỹ năng và kinh nghiệm..." />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setEditing(false)}
                    className="h-10 px-4 border border-slate-200 bg-white rounded-xl text-slate-700 font-semibold text-sm hover:bg-slate-50">Hủy</button>
                  <button type="submit"
                    className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-sm">Lưu</button>
                </div>
              </form>
            ) : (
              <div className="space-y-3.5">
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                  <div><span className="text-slate-400">Hourly Rate:</span> <span className="font-bold text-slate-900">${profile.hourlyRate || '—'}/hr</span></div>
                  <div><span className="text-slate-400">Điện thoại:</span> <span className="font-semibold text-slate-900">{profile.phone || '—'}</span></div>
                  {profile.experience && <div><span className="text-slate-400">Kinh nghiệm:</span> <span className="font-semibold text-slate-900">{profile.experience}</span></div>}
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Giới thiệu</h4>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                    {profile.bio || 'Chưa có thông tin tự giới thiệu.'}
                  </p>
                </div>

                {/* Skills */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kỹ năng hiện tại</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map(skill => (
                      <span key={skill}
                        className="group relative flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100">
                        {skill}
                        <button onClick={() => removeSkillMutation.mutate(skill)}
                          className="ml-0.5 text-blue-400 hover:text-red-500 transition-colors leading-none" title="Xóa skill">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)}
                      onKeyDown={handleSkillKeyDown}
                      placeholder="Thêm kỹ năng..."
                      className="flex-1 h-8 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-500" />
                    <button onClick={handleAddSkill}
                      className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg">+ Thêm</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Portfolio */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">Dự án Portfolio</h3>
              <button onClick={() => setShowPortModal(true)}
                className="h-8 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1">➕ Thêm dự án</button>
            </div>
            {profile.portfolio.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm flex flex-col items-center gap-2"><FolderOpen className="w-8 h-8" />Chưa có dự án portfolio nào.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profile.portfolio.map(proj => (
                  <div key={proj.id}
                    className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 flex flex-col justify-between relative group">
                      <button onClick={() => deletePortfolioMutation.mutate(proj.id)}
                        className="absolute top-3 right-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Xóa dự án"><Trash2 className="w-4 h-4" /></button>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 text-sm">{proj.title}</h4>
                      <p className="text-slate-500 text-xs line-clamp-3">{proj.desc || ''}</p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      {proj.link && <a href={proj.link} target="_blank" rel="noreferrer"
                        className="text-blue-600 font-semibold hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Link</a>}
                      {proj.fileName && <span className="text-slate-400 flex items-center gap-1"><FileText className="w-3 h-3" /> {proj.fileName}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right col: Assessment, CV, Certs */}
        <div className="space-y-6 col-span-1">
          {/* Assessment */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md space-y-4">
            <div>
              <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold tracking-wider uppercase">Đánh giá kỹ năng</span>
              <h3 className="font-bold text-lg mt-1.5">Skill Assessment Test</h3>
              <p className="text-white/80 text-xs mt-1">Giải quyết cold-start. Nhận badge từ hệ thống để tăng thứ hạng khi đấu thầu.</p>
            </div>
            {profile.assessmentCompleted ? (
              <div className="bg-white/10 rounded-xl p-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"><Award className="w-6 h-6 text-white" /></div>
                <div>
                  <p className="text-xs text-white/75 font-semibold">Kết quả thi trắc nghiệm</p>
                  <p className="font-bold text-sm">{profile.assessmentScore ?? 0} / 5</p>
                  <p className="text-[10px] text-blue-200 mt-0.5">Badge: {localizeAssessmentLevel(profile.assessmentLevel, language)}</p>
                </div>
              </div>
            ) : (
              <button onClick={() => { syncForm(); setQuizOpen(true); }}
                className="w-full h-10 bg-white hover:bg-slate-50 text-blue-600 font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-1.5"><HelpCircle className="w-4 h-4" /> Làm bài test kỹ năng</button>
            )}
          </div>

          {/* CV */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">CV</h3>
            {profile.cv ? (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center"><FileText className="w-5 h-5 text-blue-500" /></div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-slate-800 truncate">{profile.cv.fileName}</p>
                    <p className="text-[10px] text-slate-400">{profile.cv.fileSize} · {profile.cv.uploadedAt}</p>
                  </div>
                </div>
                <button onClick={() => freelancerApi.deleteCv().then(() => { queryClient.invalidateQueries({ queryKey: ['freelancer-profile'] }); toast.success('Đã xóa CV'); }).catch(() => toast.error('Xóa thất bại'))}
                  className="text-xs text-slate-400 hover:text-red-500 font-semibold">Xóa</button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-500 transition-colors relative">
                <input type="file" accept=".pdf" onChange={handleCvChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-2"><Upload className="w-5 h-5 text-slate-400" /></div>
                <p className="text-xs font-bold text-slate-700">Tải lên CV PDF</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Tối đa 50MB</p>
              </div>
            )}
          </div>

          {/* Certs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Chứng chỉ</h3>
              <button onClick={() => setShowCertModal(true)} className="text-xs text-blue-600 font-semibold hover:underline">+ Thêm</button>
            </div>
            {profile.certificates.length === 0 ? (
              <p className="text-center py-4 text-xs text-slate-400 flex items-center justify-center gap-2"><Award className="w-4 h-4" />Chưa có chứng chỉ nào.</p>
            ) : (
              <div className="space-y-3">
                {profile.certificates.map(cert => (
                  <div key={cert.id} className="flex gap-2.5 items-start bg-slate-50/50 border border-slate-100 rounded-xl p-3 relative">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0"><Award className="w-4 h-4 text-blue-500" /></div>
                    <div className="flex-1 space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-slate-900 text-xs truncate">{cert.name}</h4>
                        {cert.verified && <span className="bg-blue-50 text-blue-600 text-[9px] font-bold px-1 rounded-sm border border-blue-100">Verified</span>}
                      </div>
                      <p className="text-[10px] text-slate-500">{cert.issuer} · {cert.date}</p>
                      {cert.verifyLink && <a href={cert.verifyLink} target="_blank" rel="noreferrer"
                        className="text-[10px] text-blue-600 font-semibold hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" />Verify</a>}
                    </div>
                    <button onClick={() => deleteCertMutation.mutate(cert.id)}
                      className="text-slate-300 hover:text-red-500 text-xs"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Portfolio Modal */}
      {showPortModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-2">Thêm dự án Portfolio</h3>
            <form onSubmit={handleAddPortfolioSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Tên dự án</label>
                <input required placeholder="Ví dụ: Landing Page SaaS" value={portTitle}
                  onChange={e => setPortTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Mô tả</label>
                <textarea rows={3} placeholder="Mô tả công việc, tech stack, kết quả..."
                  value={portDesc} onChange={e => setPortDesc(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500 resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Link demo/code</label>
                <input type="url" placeholder="https://github.com/..." value={portLink}
                  onChange={e => setPortLink(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">File đính kèm</label>
                <input type="file" onChange={e => setPortFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowPortModal(false)}
                  className="h-10 px-4 border border-slate-200 bg-white rounded-lg text-slate-700 font-semibold text-sm">Hủy</button>
                <button type="submit"
                  className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm">Xác nhận</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cert Modal */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-2">Thêm chứng chỉ</h3>
            <form onSubmit={handleAddCertSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Tên chứng chỉ</label>
                <input required placeholder="AWS Certified Solutions Architect" value={certName}
                  onChange={e => setCertName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Tổ chức cấp</label>
                <input required placeholder="Amazon Web Services" value={certIssuer}
                  onChange={e => setCertIssuer(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Ngày cấp</label>
                  <input type="month" value={certDate} onChange={e => setCertDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Verify Link</label>
                  <input type="url" placeholder="https://..." value={certLink}
                    onChange={e => setCertLink(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCertModal(false)}
                  className="h-10 px-4 border border-slate-200 bg-white rounded-lg text-slate-700 font-semibold text-sm">Hủy</button>
                <button type="submit"
                  className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm">Xác nhận</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quiz Dialog */}
      {quizOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-300">
            {!quizFinished ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="font-extrabold text-xl text-white">Bài kiểm tra kỹ năng</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Đánh giá trình độ của bạn</p>
                  </div>
                  <span className="text-xs font-bold bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">
                    {currentQuestion + 1}/{quizQuestions.length}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${((currentQuestion) / quizQuestions.length) * 100}%` }} />
                </div>
                <div className="space-y-4">
                  <p className="text-base font-semibold leading-relaxed text-white">
                    {quizQuestions[currentQuestion].q}
                  </p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {quizQuestions[currentQuestion].options.map((opt, idx) => (
                      <button key={idx}
                        onClick={() => handleQuizAnswer(idx)}
                        className="w-full min-h-12 p-3.5 rounded-xl border border-slate-800 bg-slate-800/40 text-left text-sm text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700 transition-all">
                        <span>{opt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-6">
                <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-2xl text-white">{t('profile.quizCompleteTitle')}</h3>
                  <p className="text-slate-400 text-sm max-w-sm mx-auto">
                    {t('profile.quizCompleteDesc')}
                  </p>
                </div>

                <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-4 max-w-xs mx-auto">
                  <p className="text-xs text-slate-400">{t('profile.quizResultLabel')}</p>
                  <p className="text-2xl font-black text-white mt-1">
                    {quizScore} / {quizQuestions.length}
                  </p>
                  <span className="inline-block bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 border border-green-500/20">
                    {t('profile.quizBadge', { level: localizeAssessmentLevel(profile.assessmentLevel, language) })}
                  </span>
                </div>

                <div className="pt-2">
                  <button onClick={resetQuiz}
                    className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-600/20">
                    {t('profile.backToProfile')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
