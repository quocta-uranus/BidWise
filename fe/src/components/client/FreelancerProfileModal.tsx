'use client';

import { useEffect, useState } from 'react';
import { X, Star, Briefcase, Award, Globe } from 'lucide-react';
import { clientBidsApi, FreelancerFullProfile } from '@/lib/api/client-bids.api';

interface Props {
  jobId: string;
  bidId: string;
  onClose: () => void;
}

export default function FreelancerProfileModal({ jobId, bidId, onClose }: Props) {
  const [profile, setProfile] = useState<FreelancerFullProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientBidsApi.getFreelancerProfile(jobId, bidId)
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [jobId, bidId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Hồ sơ Freelancer</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Đang tải...</div>
        ) : !profile ? (
          <div className="p-8 text-center text-slate-400">Không tìm thấy hồ sơ.</div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Header */}
            <div className="flex items-center gap-4">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.fullName} className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                  {profile.fullName[0]}
                </div>
              )}
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{profile.fullName}</h3>
                {profile.freelancerProfile?.assessmentLevel && (
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                    {profile.freelancerProfile.assessmentLevel}
                  </span>
                )}
                <p className="text-xs text-slate-400 mt-0.5">
                  Tham gia: {new Date(profile.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>

            {profile.bio && (
              <p className="text-sm text-slate-600">{profile.bio}</p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <Star size={16} className="mx-auto text-amber-500 mb-1" />
                <p className="text-xs text-slate-500">Assessment</p>
                <p className="font-bold text-slate-900">
                  {profile.freelancerProfile?.assessmentScore ?? 'N/A'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <Briefcase size={16} className="mx-auto text-blue-500 mb-1" />
                <p className="text-xs text-slate-500">Portfolio</p>
                <p className="font-bold text-slate-900">
                  {profile.freelancerProfile?.portfolioItems?.length ?? 0}
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <Award size={16} className="mx-auto text-purple-500 mb-1" />
                <p className="text-xs text-slate-500">Chứng chỉ</p>
                <p className="font-bold text-slate-900">
                  {profile.freelancerProfile?.certificates?.length ?? 0}
                </p>
              </div>
            </div>

            {/* Skills */}
            {(profile.freelancerProfile?.skills?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Kỹ năng</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.freelancerProfile!.skills.map((s) => (
                    <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio */}
            {(profile.freelancerProfile?.portfolioItems?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Portfolio</p>
                <div className="space-y-2">
                  {profile.freelancerProfile!.portfolioItems.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <Globe size={13} className="text-slate-400 shrink-0" />
                      <span className="text-slate-700 truncate">{item.title}</span>
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noopener noreferrer"
                          className="text-blue-500 hover:underline text-xs shrink-0">
                          Link
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certificates */}
            {(profile.freelancerProfile?.certificates?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Chứng chỉ</p>
                <div className="space-y-1.5">
                  {profile.freelancerProfile!.certificates.map((cert: any) => (
                    <div key={cert.id} className="text-sm flex items-center gap-2">
                      <Award size={13} className="text-amber-500 shrink-0" />
                      <span className="text-slate-700">{cert.name}</span>
                      <span className="text-xs text-slate-400">{cert.issuer}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
