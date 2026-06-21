'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Award, Download } from 'lucide-react';

interface FreelancerMock {
  id: string;
  name: string;
  avatar: string;
  title: string;
  hourlyRate: number;
  experience: string;
  skills: string[];
  bio: string;
  assessmentScore: number;
  assessmentLevel: 'Expert' | 'Intermediate' | 'Beginner';
  available: boolean;
}

export default function ExploreFreelancersTab() {
  const { t, language } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('ALL');

  const freelancers: FreelancerMock[] = [
    {
      id: 'fl-1',
      name: 'Nguyễn Văn Nam',
      avatar: '👨‍💻',
      title: 'Senior Frontend Engineer',
      hourlyRate: 45,
      experience: '5 năm kinh nghiệm làm React, Next.js, tối ưu Lighthouse 99+',
      skills: ['React', 'Next.js', 'Tailwind CSS', 'TypeScript', 'SEO'],
      bio: 'Tôi có thế mạnh lớn về tối ưu hóa hiệu suất trang web Next.js, xây dựng Design System và tích hợp các công nghệ SEO tối tân nhất. Từng làm việc tại VNG và Tiki.',
      assessmentScore: 5,
      assessmentLevel: 'Expert',
      available: true,
    },
    {
      id: 'fl-2',
      name: 'Trần Minh Hoàng',
      avatar: '⚡',
      title: 'Backend Tech Lead',
      hourlyRate: 55,
      experience: '7 năm kinh nghiệm thiết kế hệ thống Microservices, NestJS, Redis',
      skills: ['NestJS', 'Redis', 'PostgreSQL', 'Prisma', 'JWT', 'Docker'],
      bio: 'Chuyên gia thiết kế cơ sở dữ liệu lớn và tối ưu hóa truy vấn PostgreSQL. Đã xây dựng các cổng thanh toán và dịch vụ xác thực OTP bảo mật cao.',
      assessmentScore: 5,
      assessmentLevel: 'Expert',
      available: true,
    },
    {
      id: 'fl-3',
      name: 'Lê Thị Hồng',
      avatar: '📱',
      title: 'React Native Developer',
      hourlyRate: 40,
      experience: '3 năm kinh nghiệm phát triển ứng dụng di động iOS/Android',
      skills: ['React Native', 'React', 'Google Maps API', 'Tailwind CSS'],
      bio: 'Đam mê phát triển ứng dụng di động với UI mượt mà, hỗ trợ tốt offline mode và tích hợp API real-time tracking bằng WebSockets.',
      assessmentScore: 4,
      assessmentLevel: 'Expert',
      available: true,
    },
    {
      id: 'fl-4',
      name: 'Phạm Văn Đức',
      avatar: '🎨',
      title: 'UI/UX & Frontend Designer',
      hourlyRate: 35,
      experience: '4 năm kinh nghiệm dựng giao diện Figma to Next.js',
      skills: ['React', 'Tailwind CSS', 'Figma', 'TypeScript', 'Shadcn UI'],
      bio: 'Kết hợp hài hòa giữa kỹ năng thiết kế UI/UX và lập trình frontend chuyên nghiệp. Code sạch chuẩn UI và chuyển động animation mượt mà.',
      assessmentScore: 3,
      assessmentLevel: 'Intermediate',
      available: false,
    },
  ];

  // Filter freelancers
  const filtered = freelancers.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) || 
                          f.title.toLowerCase().includes(search.toLowerCase()) || 
                          f.bio.toLowerCase().includes(search.toLowerCase());
    const matchesSkill = selectedSkill === 'ALL' || f.skills.includes(selectedSkill);
    return matchesSearch && matchesSkill;
  });

  const allSkills = Array.from(new Set(freelancers.flatMap((f) => f.skills)));

  const handleDownloadCv = (name: string) => {
    alert(
      language === 'vi'
        ? `Đang chuẩn bị tải xuống hồ sơ CV dạng PDF của freelancer: ${name}... (Demo)`
        : `Preparing download of PDF Resume for freelancer: ${name}... (Demo)`
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and filter bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder={language === 'vi' ? 'Tìm freelancer theo tên, vị trí, tiểu sử...' : 'Search freelancers by name, title, bio...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-blue-500 w-full md:w-44 font-semibold text-slate-600"
          >
            <option value="ALL">{language === 'vi' ? 'Tất cả kỹ năng' : 'All Skills'}</option>
            {allSkills.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm">
            {language === 'vi' ? 'Không tìm thấy hồ sơ freelancer nào phù hợp.' : 'No freelancer profiles match your criteria.'}
          </div>
        ) : (
          filtered.map((fl) => (
            <div
              key={fl.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-50 to-indigo-50 border border-slate-100 flex items-center justify-center text-2xl shrink-0">
                      {fl.avatar}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{fl.name}</h4>
                      <p className="text-[10px] font-bold text-blue-600 leading-snug">{fl.title}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${fl.available ? 'bg-emerald-500' : 'bg-slate-450'}`} />
                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                          {fl.available ? (language === 'vi' ? 'Sẵn sàng' : 'Available') : (language === 'vi' ? 'Đang bận' : 'Busy')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block">{language === 'vi' ? 'Giá giờ' : 'Hourly rate'}</span>
                    <span className="font-black text-slate-800 text-sm">${fl.hourlyRate}/hr</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 py-2 border-y border-slate-50 flex-wrap">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">{language === 'vi' ? 'Bài test kỹ năng:' : 'Assessment test:'}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 shadow-inner">
                    <Award className="w-3 h-3" /> {fl.assessmentScore}/5 ({fl.assessmentLevel})
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('profile.experience')}</p>
                  <p className="text-xs text-slate-700 font-medium">{fl.experience}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('profile.about')}</p>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">{fl.bio}</p>
                </div>

                <div className="flex flex-wrap gap-1 pt-1.5">
                  {fl.skills.map((skill) => (
                    <span key={skill} className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-slate-600 text-[10px] font-bold">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => handleDownloadCv(fl.name)}
                  className="flex-1 h-9 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> {language === 'vi' ? 'Tải CV PDF' : 'Download CV'}
                </button>
                <button
                  onClick={() => alert(language === 'vi' ? `Đang gửi lời mời nhận thầu đến ${fl.name}...` : `Sending project invitation to ${fl.name}...`)}
                  className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  📨 {language === 'vi' ? 'Mời dự án' : 'Invite to Job'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
