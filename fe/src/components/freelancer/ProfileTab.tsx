'use client';

import { useEffect, useState, useMemo } from 'react';
import { useFreelancerProfile } from '@/lib/hooks/useFreelancerProfile';
import { useFreelancer } from '@/lib/hooks/useFreelancer';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getQuizQuestions, localizeAssessmentLevel } from '@/lib/i18n/demo-content';
import { useQueryClient } from '@tanstack/react-query';
import ReputationDashboard from './ReputationDashboard';

export default function ProfileTab() {
  const {
    profile,
    loading,
    saving,
    error,
    loadProfile,
    updateProfile,
    addSkill,
    removeSkill,
    addPortfolio,
    removePortfolio,
    uploadCv,
    deleteCv,
    addCertificate,
    deleteCertificate,
  } = useFreelancerProfile();

  const queryClient = useQueryClient();
  const { t, language } = useTranslation();

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // State for forms
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState(0);
  const [phone, setPhone] = useState('');
  const [experience, setExperience] = useState('');

  // Sync form state with profile
  useEffect(() => {
    setBio(profile.bio || '');
    setHourlyRate(profile.hourlyRate || 0);
    setPhone(profile.phone || '');
    setExperience(profile.experience || '');
  }, [profile]);

  // Skill editor state
  const [newSkill, setNewSkill] = useState('');

  // Portfolio form state
  const [portTitle, setPortTitle] = useState('');
  const [portDesc, setPortDesc] = useState('');
  const [portLink, setPortLink] = useState('');
  const [portFile, setPortFile] = useState<File | null>(null);
  const [showPortModal, setShowPortModal] = useState(false);

  // Cert form state
  const [certName, setCertName] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certDate, setCertDate] = useState('');
  const [certLink, setCertLink] = useState('');
  const [showCertModal, setShowCertModal] = useState(false);

  // Quiz assessment state
  const [quizOpen, setQuizOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);

  const quizQuestions = useMemo(() => getQuizQuestions(language), [language]);

  // Tính điểm phần trăm hoàn thiện hồ sơ
  let completeness = 0;
  if (profile.bio) completeness += 15;
  if (profile.hourlyRate > 0) completeness += 10;
  if (profile.phone) completeness += 15;
  if (profile.portfolio.length > 0) completeness += 20;
  if (profile.cv) completeness += 15;
  if (profile.certificates.length > 0) completeness += 10;
  if (profile.assessmentCompleted) completeness += 15;

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({ bio, hourlyRate: Number(hourlyRate), phone, experience });
      await queryClient.invalidateQueries({ queryKey: ['freelancer-profile'] });
      setEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handleAddSkill = async () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    try {
      await addSkill(trimmed);
      await queryClient.invalidateQueries({ queryKey: ['freelancer-profile'] });
      setNewSkill('');
    } catch (err) {
      console.error('Failed to add skill:', err);
    }
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleAddPortfolioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portTitle) return;

    // File type validation
    if (portFile) {
      const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'application/zip', 'application/x-zip-compressed'];
      const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg', '.zip'];
      const ext = portFile.name.slice(portFile.name.lastIndexOf('.')).toLowerCase();
      if (!allowed.includes(portFile.type) && !allowedExts.includes(ext)) {
        alert(t('profile.fileTypeError'));
        return;
      }
      if (portFile.size > 50 * 1024 * 1024) {
        alert('File vượt quá giới hạn 50MB!');
        return;
      }
    }

    try {
      await addPortfolio({
        title: portTitle,
        desc: portDesc,
        link: portLink,
      }, portFile || undefined);
      await queryClient.invalidateQueries({ queryKey: ['freelancer-profile'] });

      setPortTitle('');
      setPortDesc('');
      setPortLink('');
      setPortFile(null);
      setShowPortModal(false);
    } catch (err) {
      console.error('Failed to add portfolio:', err);
    }
  };

  const handleRemovePortfolio = async (id: string) => {
    try {
      await removePortfolio(id);
      await queryClient.invalidateQueries({ queryKey: ['freelancer-profile'] });
    } catch (err) {
      console.error('Failed to remove portfolio:', err);
    }
  };

  const handleAddCertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certName || !certIssuer) return;

    try {
      await addCertificate({
        name: certName,
        issuer: certIssuer,
        date: certDate,
        verifyLink: certLink
      });
      await queryClient.invalidateQueries({ queryKey: ['freelancer-profile'] });

      setCertName('');
      setCertIssuer('');
      setCertDate('');
      setCertLink('');
      setShowCertModal(false);
    } catch (err) {
      console.error('Failed to add certificate:', err);
    }
  };

  const handleCvChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert('File vượt quá giới hạn 50MB!');
      return;
    }

    try {
      await uploadCv(file);
      await queryClient.invalidateQueries({ queryKey: ['freelancer-profile'] });
    } catch (err) {
      console.error('Failed to upload CV:', err);
    }
  };

  const handleDeleteCv = async () => {
    try {
      await deleteCv();
      await queryClient.invalidateQueries({ queryKey: ['freelancer-profile'] });
    } catch (err) {
      console.error('Failed to delete CV:', err);
    }
  };

  const completeAssessment = useFreelancer((s) => s.completeAssessment);

  const handleQuizAnswer = (optionIdx: number) => {
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

      completeAssessment(score);
      setQuizFinished(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setQuizFinished(false);
    setQuizOpen(false);
  };

  const handleRemoveSkill = async (skill: string) => {
    try {
      await removeSkill(skill);
      await queryClient.invalidateQueries({ queryKey: ['freelancer-profile'] });
    } catch (err) {
      console.error('Failed to remove skill:', err);
    }
  };

  const handleDeleteCertificate = async (id: string) => {
    try {
      await deleteCertificate(id);
      await queryClient.invalidateQueries({ queryKey: ['freelancer-profile'] });
    } catch (err) {
      console.error('Failed to delete certificate:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Completeness Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Dynamic SVG Progress circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="56"
              cy="56"
              r="48"
              stroke="#e2e8f0"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="56"
              cy="56"
              r="48"
              stroke="#2563eb"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={301.6}
              strokeDashoffset={301.6 - (301.6 * completeness) / 100}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <span className="absolute text-xl font-bold text-slate-800">{completeness}%</span>
        </div>
        <div className="flex-1 text-center md:text-left space-y-2">
          <h3 className="text-lg font-bold text-slate-900">{t('profile.completenessTitle')}</h3>
          <p className="text-slate-500 text-sm max-w-lg">
            Hồ sơ đầy đủ giúp bạn tăng điểm uy tín hiển thị, tiếp cận nhiều cơ hội việc làm tốt hơn và tăng điểm matching AHP-TOPSIS.
          </p>
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${profile.bio ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-400 border border-dashed border-slate-200'}`}>Bio (+15%)</span>
            <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${profile.hourlyRate > 0 ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-400 border border-dashed border-slate-200'}`}>Hourly Rate (+10%)</span>
            <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${profile.portfolio.length > 0 ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-400 border border-dashed border-slate-200'}`}>Portfolio (+20%)</span>
            <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${profile.cv ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-400 border border-dashed border-slate-200'}`}>CV PDF (+15%)</span>
            <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${profile.assessmentCompleted ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-400 border border-dashed border-slate-200'}`}>Skill Assessment (+15%)</span>
          </div>
        </div>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Bio, Skills, Information */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">{t('profile.freelancerInfo')}</h3>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                >
                  ✏️ Chỉnh sửa
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSaveInfo} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">{t('profile.hourlyRateLabel')}</label>
                    <input
                      type="number"
                      required
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500"
                      min={1}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">{t('profile.phoneLabel')}</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500"
                      placeholder="09xxxxxxxx"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">{t('profile.experienceLabel')}</label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500"
                    placeholder={t('profile.experiencePlaceholder')}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">{t('profile.bioLabel')}</label>
                  <textarea
                    required
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 resize-none"
                    placeholder={t('profile.bioPlaceholder')}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="h-10 px-4 border border-slate-200 bg-white rounded-xl text-slate-700 font-semibold text-sm hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-sm"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3.5">
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                  <div>
                    <span className="text-slate-400">Hourly Rate:</span>{' '}
                    <span className="font-bold text-slate-900">${profile.hourlyRate || '—'}/hr</span>
                  </div>
                  <div>
                    <span className="text-slate-400">{t('profile.phoneDisplay')}</span>{' '}
                    <span className="font-semibold text-slate-900">{profile.phone || '—'}</span>
                  </div>
                  {profile.experience && (
                    <div>
                      <span className="text-slate-400">{t('profile.experience')}</span>{' '}
                      <span className="font-semibold text-slate-900">{profile.experience}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('profile.about')}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                    {profile.bio || 'Chưa có thông tin tự giới thiệu. Hãy bấm chỉnh sửa để cập nhật.'}
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('profile.currentSkills')}</h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((skill) => (
                      <span
                        key={skill}
                        className="group relative flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        {skill}
                        <button
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-0.5 text-blue-400 hover:text-red-500 transition-colors leading-none"
                          title={t('profile.removeSkill')}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  {/* Add skill input */}
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={handleSkillKeyDown}
                      placeholder={t('profile.addSkillPlaceholder')}
                      className="flex-1 h-8 px-3 rounded-lg border border-slate-200 text-xs outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      {t('profile.addSkill')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Portfolio Projects */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">{t('profile.portfolioTitle')}</h3>
              <button
                onClick={() => setShowPortModal(true)}
                className="h-8 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm"
              >
                ➕ Thêm dự án
              </button>
            </div>

            {profile.portfolio.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                📁 Chưa có dự án portfolio nào được tải lên.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profile.portfolio.map((proj) => (
                  <div key={proj.id} className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 flex flex-col justify-between relative group">
                    <button
                      onClick={() => handleRemovePortfolio(proj.id)}
                      className="absolute top-3 right-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Xóa dự án"
                    >
                      🗑️
                    </button>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 text-sm">{proj.title}</h4>
                      <p className="text-slate-500 text-xs line-clamp-3">{proj.desc}</p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      {proj.link && (
                        <a
                          href={proj.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 font-semibold hover:underline"
                        >
                          🔗 Link dự án
                        </a>
                      )}
                      {proj.fileName && (
                        <span className="text-slate-400 font-mono">
                          📄 {proj.fileName} ({proj.fileSize})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar CV, Certifications, Skills Assessment */}
        <div className="space-y-6 col-span-1">
          {/* Skill Assessment Test */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md space-y-4">
            <div>
              <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold tracking-wider uppercase">Đánh giá kỹ năng</span>
              <h3 className="font-bold text-lg mt-1.5">Skill Assessment Test</h3>
              <p className="text-white/80 text-xs mt-1">
                Giải quyết bài toán "lạnh" ban đầu (cold-start). Nhận chứng chỉ lập trình từ hệ thống để tăng 30% thứ hạng khi đấu thầu.
              </p>
            </div>

            {profile.assessmentCompleted ? (
              <div className="bg-white/10 rounded-xl p-3 flex items-center gap-3">
                <div className="text-3xl">🏆</div>
                <div>
                  <p className="text-xs text-white/75 font-semibold">Kết quả thi trắc nghiệm</p>
                  <p className="font-bold text-sm">{t('profile.assessmentDone', { score: profile.assessmentScore ?? 0, level: localizeAssessmentLevel(profile.assessmentLevel, language) })}</p>
                  <p className="text-[10px] text-blue-200 mt-0.5">Đã được verify badge bởi hệ thống</p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setQuizOpen(true)}
                className="w-full h-10 bg-white hover:bg-slate-50 text-blue-600 font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                📝 Làm bài test kỹ năng
              </button>
            )}
          </div>

          {/* CV Upload */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">{t('profile.cvTitle')}</h3>
            
            {profile.cv ? (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-xl">📄</span>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-slate-800 truncate" title={profile.cv.fileName}>
                      {profile.cv.fileName}
                    </p>
                    <p className="text-[10px] text-slate-400">{profile.cv.fileSize} · Tải lên: {profile.cv.uploadedAt}</p>
                  </div>
                </div>
                <button
                  onClick={handleDeleteCv}
                  className="text-xs text-slate-400 hover:text-red-500 font-semibold"
                >
                  Xóa
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-500 transition-colors relative group">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleCvChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <span className="text-2xl mb-1 block">📤</span>
                <p className="text-xs font-bold text-slate-700 group-hover:text-blue-600">Tải lên CV dạng PDF</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Hỗ trợ file PDF dung lượng tối đa 50MB</p>
              </div>
            )}
          </div>

          {/* Certifications */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">{t('profile.myCerts')}</h3>
              <button
                onClick={() => setShowCertModal(true)}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                + Thêm
              </button>
            </div>

            {profile.certificates.length === 0 ? (
              <p className="text-center py-4 text-xs text-slate-400">🏅 Chưa có chứng chỉ nào.</p>
            ) : (
              <div className="space-y-3">
                {profile.certificates.map((cert) => (
                  <div key={cert.id} className="flex gap-2.5 items-start bg-slate-50/50 border border-slate-100 rounded-xl p-3 relative">
                    <span className="text-lg">🏅</span>
                    <div className="flex-1 space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-slate-900 text-xs truncate">{cert.name}</h4>
                        {cert.verified && (
                          <span className="bg-blue-50 text-blue-600 text-[9px] font-bold px-1 rounded-sm border border-blue-100">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500">{cert.issuer} · {cert.date}</p>
                      {cert.verifyLink && (
                        <a
                          href={cert.verifyLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-blue-600 font-semibold hover:underline block truncate mt-0.5"
                        >
                          Verify link 🔗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PORTFOLIO MODAL */}
      {showPortModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-2">Thêm dự án Portfolio</h3>
            
            <form onSubmit={handleAddPortfolioSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Tên dự án</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Landing Page Công ty Du lịch"
                  value={portTitle}
                  onChange={(e) => setPortTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Mô tả dự án</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả công việc bạn làm, tech stack và kết quả..."
                  value={portDesc}
                  onChange={(e) => setPortDesc(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Đường dẫn demo/code (Github/Behance/Web)</label>
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={portLink}
                  onChange={(e) => setPortLink(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">File đính kèm (Hình ảnh, tài liệu dự án)</label>
                <input
                  type="file"
                  onChange={(e) => setPortFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-[10px] text-slate-400">Hỗ trợ PDF, PNG, JPG, ZIP dung lượng &le; 50MB</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPortModal(false)}
                  className="h-10 px-4 border border-slate-200 bg-white rounded-lg text-slate-700 font-semibold text-sm hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-sm"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CERTIFICATION MODAL */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-2">Thêm chứng chỉ</h3>
            
            <form onSubmit={handleAddCertSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Tên chứng chỉ</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: AWS Certified Solutions Architect"
                  value={certName}
                  onChange={(e) => setCertName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Tổ chức cấp</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Amazon Web Services (AWS)"
                  value={certIssuer}
                  onChange={(e) => setCertIssuer(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Ngày cấp</label>
                  <input
                    type="month"
                    required
                    value={certDate}
                    onChange={(e) => setCertDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Verify Link (nếu có)</label>
                  <input
                    type="url"
                    placeholder="https://credly.com/..."
                    value={certLink}
                    onChange={(e) => setCertLink(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCertModal(false)}
                  className="h-10 px-4 border border-slate-200 bg-white rounded-lg text-slate-700 font-semibold text-sm hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-sm"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SKILL ASSESSMENT / QUIZ DIALOG */}
      {quizOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-300">
            {!quizFinished ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="font-extrabold text-xl text-white">{t('profile.quizTitle')}</h3>
                    <p className="text-slate-400 text-xs mt-0.5">{t('profile.quizSubtitle')}</p>
                  </div>
                  <span className="text-xs font-bold bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">
                    {t('profile.quizProgress', { current: currentQuestion + 1, total: quizQuestions.length })}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${((currentQuestion) / quizQuestions.length) * 100}%` }}
                  />
                </div>

                {/* Question */}
                <div className="space-y-4">
                  <p className="text-base font-semibold leading-relaxed text-white">
                    {quizQuestions[currentQuestion].q}
                  </p>
                  <div className="grid grid-cols-1 gap-2.5 pt-2">
                    {quizQuestions[currentQuestion].options.map((opt, optionIdx) => (
                      <button
                        key={optionIdx}
                        onClick={() => handleQuizAnswer(optionIdx)}
                        className="w-full min-h-12 p-3.5 rounded-xl border border-slate-800 bg-slate-800/40 text-left text-sm text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700 transition-all duration-200 flex items-center justify-between"
                      >
                        <span>{opt}</span>
                        <span className="text-xs text-slate-500 hover:text-slate-400">{t('profile.selectAnswer')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Footer warning */}
                <p className="text-[10px] text-slate-500 text-center">
                  {t('profile.quizFooter')}
                </p>
              </div>
            ) : (
              <div className="text-center py-6 space-y-6">
                <div className="w-20 h-20 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner">
                  🏆
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
                    {profile.assessmentScore} / 5
                  </p>
                  <span className="inline-block bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 border border-green-500/20">
                    {t('profile.quizBadge', { level: localizeAssessmentLevel(profile.assessmentLevel, language) })}
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={resetQuiz}
                    className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-600/20"
                  >
                    {t('profile.backToProfile')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reputation Dashboard */}
      <ReputationDashboard />
    </div>
  );
}
