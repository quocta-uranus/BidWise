import type { Language } from './language.store';
import type { Job, Milestone, Transaction } from '@/lib/hooks/useFreelancer';

export type MilestoneNameKey = 'design' | 'coding' | 'delivery';
export type TransactionDescKey = 'initBalance' | 'milestoneApproved' | 'withdraw' | 'escrow';

export interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
}

const jobContent = {
  vi: {
    'job-1': {
      title: 'Xây dựng Landing Page Next.js cho dự án SaaS',
      description:
        'Chúng tôi cần một lập trình viên frontend dựng giao diện Landing Page chuyên nghiệp, hiện đại bằng Next.js (App Router), Tailwind CSS. Thiết kế Figma đã có sẵn, đầy đủ responsive cho Mobile/Tablet/Desktop. Yêu cầu code sạch, chuẩn SEO và tối ưu hiệu năng Lighthouse đạt trên 95 điểm.',
    },
    'job-2': {
      title: 'Phát triển Auth Service bằng NestJS & Redis',
      description:
        'Cần thiết kế module Authentication/Authorization bảo mật cao. Các chức năng bao gồm: Đăng nhập/Đăng ký qua JWT Access/Refresh Token, cơ chế Token Rotation phát hiện reuse attack, gửi email OTP kích hoạt tài khoản bằng NodeMailer, lưu trữ blacklist AT bằng Redis khi đăng xuất. Database sử dụng PostgreSQL và Prisma ORM.',
    },
    'job-3': {
      title: 'Ứng dụng đặt đồ ăn trực tuyến bằng React Native',
      description:
        'Yêu cầu viết ứng dụng đặt đồ ăn cho iOS & Android bằng React Native. Các trang cần có: Trang chủ tìm kiếm món ăn, chi tiết cửa hàng/món ăn, giỏ hàng, trang thanh toán, và tích hợp map tracking shipper thời gian thực. API backend đã hoàn thành và sẵn có tài liệu Swagger.',
    },
    'job-4': {
      title: 'Hệ thống Quản lý Dự án (ERP) Fullstack',
      description:
        'Dự án ERP nội bộ cần freelancer phát triển các tính năng quản lý công việc, Kanban board, thống kê doanh thu biểu đồ và xuất báo cáo PDF/Excel. Công nghệ sử dụng: Next.js frontend và NestJS backend. Giao diện sử dụng Shadcn UI/Tailwind CSS.',
    },
  },
  en: {
    'job-1': {
      title: 'Build a Next.js Landing Page for a SaaS Product',
      description:
        'We need a frontend developer to build a professional, modern Landing Page using Next.js (App Router) and Tailwind CSS. Figma designs are ready with full Mobile/Tablet/Desktop responsiveness. Clean code, SEO best practices, and Lighthouse performance score above 95 required.',
    },
    'job-2': {
      title: 'Develop Auth Service with NestJS & Redis',
      description:
        'Design a high-security Authentication/Authorization module including: JWT Access/Refresh Token login/register, Token Rotation with reuse attack detection, OTP email activation via NodeMailer, Redis AT blacklist on logout. PostgreSQL database with Prisma ORM.',
    },
    'job-3': {
      title: 'Food Delivery App with React Native',
      description:
        'Build a food ordering app for iOS & Android using React Native. Required screens: home search, restaurant/dish details, cart, checkout, and real-time shipper map tracking. Backend API is complete with Swagger documentation.',
    },
    'job-4': {
      title: 'Fullstack Project Management System (ERP)',
      description:
        'Internal ERP project needs a freelancer to develop task management, Kanban board, revenue chart analytics, and PDF/Excel report export. Tech stack: Next.js frontend and NestJS backend. UI with Shadcn UI/Tailwind CSS.',
    },
  },
} as const;

const milestoneNames = {
  vi: {
    design: 'Thiết kế chi tiết & Setup Môi trường',
    coding: 'Coding Core Logic & Tích hợp UI',
    delivery: 'Testing, Nghiệm thu & Bàn giao sản phẩm',
  },
  en: {
    design: 'Detailed Design & Environment Setup',
    coding: 'Core Logic Coding & UI Integration',
    delivery: 'Testing, Review & Product Delivery',
  },
} as const;

const legacyMilestoneMap: Record<string, MilestoneNameKey> = {
  'Thiết kế chi tiết & Setup Môi trường': 'design',
  'Coding Core Logic & Tích hợp UI': 'coding',
  'Testing, Nghiệm thu & Bàn giao sản phẩm': 'delivery',
  'Detailed Design & Environment Setup': 'design',
  'Core Logic Coding & UI Integration': 'coding',
  'Testing, Review & Product Delivery': 'delivery',
};

const transactionTemplates = {
  vi: {
    initBalance: 'Số dư khởi tạo hệ thống (Demo)',
    milestoneApproved: 'Nghiệm thu cột mốc: {milestone} (Hợp đồng: {jobTitle})',
    withdraw: 'Yêu cầu rút tiền về {method} ({details})',
    escrow: 'Ký quỹ hợp đồng: {jobTitle}',
    deposit: 'Nạp tiền vào ví qua {gateway}',
    refund: 'Hoàn trả ký quỹ hợp đồng: {jobTitle}',
  },
  en: {
    initBalance: 'System initial balance (Demo)',
    milestoneApproved: 'Milestone approved: {milestone} (Contract: {jobTitle})',
    withdraw: 'Withdrawal request to {method} ({details})',
    escrow: 'Contract escrow: {jobTitle}',
    deposit: 'Deposited funds via {gateway}',
    refund: 'Refunded contract escrow: {jobTitle}',
  },
} as const;

const assessmentLevels = {
  vi: {
    Beginner: 'Người mới',
    Intermediate: 'Trung cấp',
    Expert: 'Chuyên gia',
    default: 'Lập trình viên tiêu chuẩn',
  },
  en: {
    Beginner: 'Beginner',
    Intermediate: 'Intermediate',
    Expert: 'Expert',
    default: 'Standard developer',
  },
} as const;

const quizContent: Record<Language, QuizQuestion[]> = {
  vi: [
    {
      q: 'React Hook nào dùng để tối ưu hóa hiệu năng bằng cách ghi nhớ (memoize) giá trị tính toán?',
      options: ['useEffect', 'useCallback', 'useMemo', 'useRef'],
      correct: 2,
    },
    {
      q: 'Trong JavaScript, sự khác biệt chính giữa "==" và "===" là gì?',
      options: [
        '"==" so sánh cả kiểu dữ liệu, "===" chỉ so sánh giá trị',
        '"===" so sánh cả kiểu dữ liệu và giá trị, "==" thực hiện ép kiểu trước khi so sánh',
        'Không có sự khác biệt nào',
        '"==" dùng cho chuỗi, "===" dùng cho số',
      ],
      correct: 1,
    },
    {
      q: 'Kết quả của biểu thức: `typeof null` là gì?',
      options: ['"null"', '"undefined"', '"object"', '"function"'],
      correct: 2,
    },
    {
      q: 'Làm thế nào để truyền dữ liệu từ component con lên component cha trong React?',
      options: [
        'Dùng Redux bắt buộc',
        'Truyền một callback function từ cha xuống con làm prop, sau đó con gọi hàm đó và truyền tham số',
        'Dùng localStorage',
        'React không hỗ trợ truyền ngược dữ liệu từ con lên cha',
      ],
      correct: 1,
    },
    {
      q: 'Từ khóa "async/await" trong JavaScript thực chất hoạt động dựa trên cơ chế nào?',
      options: ['Callstack', 'Promises', 'Generators & Promises', 'Multithreading'],
      correct: 2,
    },
  ],
  en: [
    {
      q: 'Which React Hook memoizes computed values to optimize performance?',
      options: ['useEffect', 'useCallback', 'useMemo', 'useRef'],
      correct: 2,
    },
    {
      q: 'In JavaScript, what is the main difference between "==" and "==="?',
      options: [
        '"==" compares types, "===" compares values only',
        '"===" compares both type and value, "==" coerces types before comparing',
        'There is no difference',
        '"==" is for strings, "===" is for numbers',
      ],
      correct: 1,
    },
    {
      q: 'What is the result of the expression `typeof null`?',
      options: ['"null"', '"undefined"', '"object"', '"function"'],
      correct: 2,
    },
    {
      q: 'How do you pass data from a child component to a parent in React?',
      options: [
        'Redux is required',
        'Pass a callback from parent to child as a prop, then child calls it with arguments',
        'Use localStorage',
        'React does not support child-to-parent data flow',
      ],
      correct: 1,
    },
    {
      q: 'What mechanism does async/await in JavaScript build upon?',
      options: ['Call stack', 'Promises', 'Generators & Promises', 'Multithreading'],
      correct: 2,
    },
  ],
};

function interpolate(template: string, params: Record<string, string | number>) {
  return Object.entries(params).reduce(
    (str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
    template
  );
}

export function getJobContent(lang: Language, jobId: string) {
  const jobs = jobContent[lang] as Record<string, { title: string; description: string }>;
  return jobs[jobId];
}

export function localizeJob(job: Job, lang: Language): Job {
  const content = getJobContent(lang, job.id);
  if (!content) return job;
  return { ...job, title: content.title, description: content.description };
}

export function getJobTitle(jobId: string, lang: Language, fallback = '') {
  return getJobContent(lang, jobId)?.title ?? fallback;
}

export function resolveMilestoneKey(milestone: Milestone): MilestoneNameKey | null {
  if (milestone.nameKey) return milestone.nameKey;
  return legacyMilestoneMap[milestone.name] ?? null;
}

export function getMilestoneName(milestone: Milestone, lang: Language): string {
  const key = resolveMilestoneKey(milestone);
  if (key) return milestoneNames[lang][key];
  return milestone.name;
}

export function getMilestoneNames(lang: Language): Record<MilestoneNameKey, string> {
  return milestoneNames[lang];
}

export function getQuizQuestions(lang: Language): QuizQuestion[] {
  return quizContent[lang];
}

export function localizeAssessmentLevel(level: string | undefined, lang: Language): string {
  if (!level) return assessmentLevels[lang].default;
  const levels = assessmentLevels[lang] as Record<string, string>;
  return levels[level] ?? level;
}

export function localizeTransaction(tx: Transaction, lang: Language): string {
  if (tx.descKey) {
    const templates = transactionTemplates[lang] as Record<string, string>;
    const template = templates[tx.descKey];
    if (!template) {
      return tx.description;
    }
    const params: Record<string, string> = { ...(tx.descParams ?? {}) };
    if (params.jobId && !params.jobTitle) {
      params.jobTitle = getJobTitle(params.jobId, lang, params.jobTitle ?? '');
    }
    if (params.milestoneKey) {
      params.milestone = milestoneNames[lang][params.milestoneKey as MilestoneNameKey];
    }
    return interpolate(template, params);
  }
  return tx.description;
}

export interface CoverLetterParams {
  clientName: string;
  projectTitle: string;
  bioText: string;
  skillList: string;
  hourlyRate: number;
  assessmentLevel?: string;
  bidDays: string;
  lang: Language;
}

export function buildCoverLetter(params: CoverLetterParams): string {
  const {
    clientName,
    projectTitle,
    bioText,
    skillList,
    hourlyRate,
    assessmentLevel,
    bidDays,
    lang,
  } = params;

  const level = localizeAssessmentLevel(assessmentLevel, lang);
  const days = bidDays || '10';

  if (lang === 'en') {
    const ratePart =
      hourlyRate > 0
        ? `a competitive rate ($${hourlyRate}/hour)`
        : 'my current experience';
    return `Dear ${clientName},

I am writing to express my strong interest in your project "${projectTitle}".

With ${ratePart}, I am confident I can fully meet the technical requirements thanks to my expertise in: ${skillList}.

Experience summary:
- ${bioText.slice(0, 150)}...
- Completed the BidWise skills assessment at ${level} level.

I commit to completing the work within ${days} days and delivering on time with thorough testing. I look forward to discussing project milestones in detail.

Best regards,
[Your name]`;
  }

  const ratePart =
    hourlyRate > 0
      ? `mức thù lao đề xuất cạnh tranh ($${hourlyRate}/giờ)`
      : 'kinh nghiệm hiện tại';

  return `Kính gửi đối tác ${clientName},

Tôi viết thư này để bày tỏ sự quan tâm đặc biệt tới dự án "${projectTitle}" của quý công ty.

Với ${ratePart}, tôi tự tin có thể đáp ứng đầy đủ yêu cầu kỹ thuật của dự án nhờ sở hữu thế mạnh về các công nghệ: ${skillList}.

Thông tin tóm tắt kinh nghiệm:
- ${bioText.slice(0, 150)}...
- Đã hoàn thành bài đánh giá năng lực của hệ thống BidWise đạt cấp độ ${level}.

Tôi cam kết sẽ hoàn thành công việc trong thời gian ${days} ngày và cung cấp sản phẩm bàn giao đúng thời hạn cùng chất lượng kiểm thử tốt nhất. Rất mong có cơ hội được thảo luận sâu hơn về các cột mốc triển khai dự án.

Trân trọng,
[Tên của bạn]`;
}

export const defaultBio = {
  vi: 'Tôi là lập trình viên chuyên nghiệp.',
  en: 'I am a professional developer.',
} as const;
