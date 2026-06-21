import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const RoleType = { ADMIN: 'ADMIN', MODERATOR: 'MODERATOR', CLIENT: 'CLIENT', FREELANCER: 'FREELANCER' } as const;
type RoleType = (typeof RoleType)[keyof typeof RoleType];

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding BidWise database...\n');

  // ── 1. Roles ──────────────────────────────────────────────────────────────
  const roles = [RoleType.ADMIN, RoleType.MODERATOR, RoleType.CLIENT, RoleType.FREELANCER];
  for (const name of roles) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log('✅ Roles seeded');

  // ── 2. Permissions ────────────────────────────────────────────────────────
  const permissions = [
    { resource: 'users', action: 'read:all' },
    { resource: 'users', action: 'read:own' },
    { resource: 'users', action: 'update:own' },
    { resource: 'users', action: 'suspend' },
    { resource: 'users', action: 'assign-role' },
    { resource: 'jobs', action: 'create' },
    { resource: 'jobs', action: 'read:all' },
    { resource: 'jobs', action: 'update:own' },
    { resource: 'jobs', action: 'delete:any' },
    { resource: 'bids', action: 'create' },
    { resource: 'bids', action: 'read:own' },
    { resource: 'contracts', action: 'create' },
    { resource: 'reports', action: 'resolve' },
    { resource: 'system', action: 'configure' },
  ];
  for (const p of permissions) {
    await prisma.permission.upsert({ where: { resource_action: p }, update: {}, create: p });
  }
  console.log('✅ Permissions seeded');

  // ── 3. Categories ─────────────────────────────────────────────────────────
  const categories = [
    { name: 'Web Development', description: 'Websites, web apps, frontend/backend' },
    { name: 'Mobile Development', description: 'iOS and Android app development' },
    { name: 'UI/UX Design', description: 'User interface and user experience design' },
    { name: 'Digital Marketing', description: 'SEO, social media, and digital marketing' },
    { name: 'Writing & Translation', description: 'Content writing and translation' },
    { name: 'Video & Animation', description: 'Video editing, animation, motion graphics' },
    { name: 'Data & AI', description: 'Data analysis, machine learning, AI solutions' },
    { name: 'DevOps & Cloud', description: 'Cloud infrastructure, CI/CD, Kubernetes' },
  ];
  const catMap: Record<string, string> = {};
  for (const cat of categories) {
    const c = await prisma.category.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: cat,
    });
    catMap[cat.name] = c.id;
  }
  console.log('✅ Categories seeded');

  // ── 4. Users ──────────────────────────────────────────────────────────────
  const password = await bcrypt.hash('Password123!', 10);

  const clientUser = await prisma.user.upsert({
    where: { email: 'client@bidwise.dev' },
    update: {},
    create: {
      email: 'client@bidwise.dev',
      passwordHash: password,
      fullName: 'Nguyễn Minh Client',
      bio: 'Startup founder, looking for top freelancers to build products fast.',
      phone: '0901234567',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });

  const clientRole = await prisma.role.findUnique({ where: { name: 'CLIENT' } });
  if (clientRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: clientUser.id, roleId: clientRole.id } },
      update: {},
      create: { userId: clientUser.id, roleId: clientRole.id },
    });
  }

  const client2User = await prisma.user.upsert({
    where: { email: 'client2@bidwise.dev' },
    update: {},
    create: {
      email: 'client2@bidwise.dev',
      passwordHash: password,
      fullName: 'Trần Thị Hương',
      bio: 'E-commerce business owner, building digital products.',
      phone: '0912345678',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });
  if (clientRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: client2User.id, roleId: clientRole.id } },
      update: {},
      create: { userId: client2User.id, roleId: clientRole.id },
    });
  }

  // Freelancers
  const fl1 = await prisma.user.upsert({
    where: { email: 'freelancer1@bidwise.dev' },
    update: {},
    create: {
      email: 'freelancer1@bidwise.dev',
      passwordHash: password,
      fullName: 'Lê Văn Hùng',
      bio: 'Senior Full-Stack Developer với 5 năm kinh nghiệm React, NestJS, PostgreSQL. Đã hoàn thành 30+ dự án.',
      phone: '0923456789',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });

  const fl2 = await prisma.user.upsert({
    where: { email: 'freelancer2@bidwise.dev' },
    update: {},
    create: {
      email: 'freelancer2@bidwise.dev',
      passwordHash: password,
      fullName: 'Phạm Thị Lan',
      bio: 'UI/UX Designer & Frontend Developer. Chuyên Figma, React, Tailwind CSS.',
      phone: '0934567890',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });

  const fl3 = await prisma.user.upsert({
    where: { email: 'freelancer3@bidwise.dev' },
    update: {},
    create: {
      email: 'freelancer3@bidwise.dev',
      passwordHash: password,
      fullName: 'Nguyễn Quốc Tuấn',
      bio: 'Mobile Developer iOS/Android, React Native. 3 năm kinh nghiệm, đã publish 5 app lên Store.',
      phone: '0945678901',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });

  const flRole = await prisma.role.findUnique({ where: { name: 'FREELANCER' } });
  for (const fl of [fl1, fl2, fl3]) {
    if (flRole) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: fl.id, roleId: flRole.id } },
        update: {},
        create: { userId: fl.id, roleId: flRole.id },
      });
    }
  }
  console.log('✅ Users seeded (1 client, 3 freelancers)');

  // ── 5. Freelancer Profiles ─────────────────────────────────────────────────
  const fp1 = await prisma.freelancerProfile.upsert({
    where: { userId: fl1.id },
    update: {},
    create: {
      userId: fl1.id,
      hourlyRate: 35,
      experience: '5 years',
      skills: ['React', 'NestJS', 'PostgreSQL', 'TypeScript', 'Redis', 'Docker'],
      available: true,
      bidTokens: 15,
      assessmentCompleted: true,
      assessmentScore: 88,
      assessmentLevel: 'Gold',
    },
  });

  await prisma.portfolioItem.createMany({
    skipDuplicates: true,
    data: [
      { freelancerProfileId: fp1.id, title: 'E-Commerce SaaS Platform', desc: 'Full-stack Next.js + NestJS app', link: 'https://github.com', linkType: 'github' },
      { freelancerProfileId: fp1.id, title: 'Real-time Chat App', desc: 'Socket.io + Redis pub/sub', link: 'https://github.com', linkType: 'github' },
    ],
  });

  const fp2 = await prisma.freelancerProfile.upsert({
    where: { userId: fl2.id },
    update: {},
    create: {
      userId: fl2.id,
      hourlyRate: 25,
      experience: '3 years',
      skills: ['Figma', 'React', 'Tailwind CSS', 'UI/UX', 'CSS Animation'],
      available: true,
      bidTokens: 15,
      assessmentCompleted: true,
      assessmentScore: 76,
      assessmentLevel: 'Silver',
    },
  });

  await prisma.portfolioItem.createMany({
    skipDuplicates: true,
    data: [
      { freelancerProfileId: fp2.id, title: 'Landing Page Redesign', desc: 'Increased conversion +40%', link: 'https://behance.net', linkType: 'behance' },
    ],
  });

  const fp3 = await prisma.freelancerProfile.upsert({
    where: { userId: fl3.id },
    update: {},
    create: {
      userId: fl3.id,
      hourlyRate: 30,
      experience: '3 years',
      skills: ['React Native', 'iOS', 'Android', 'TypeScript', 'Firebase'],
      available: true,
      bidTokens: 15,
      assessmentCompleted: false,
      assessmentScore: null,
    },
  });
  console.log('✅ Freelancer profiles seeded');

  // ── 6. Jobs ───────────────────────────────────────────────────────────────
  const webCatId = catMap['Web Development'];
  const mobileCatId = catMap['Mobile Development'];
  const uiCatId = catMap['UI/UX Design'];

  const job1 = await prisma.job.upsert({
    where: { id: 'seed-job-001' },
    update: {},
    create: {
      id: 'seed-job-001',
      clientId: clientUser.id,
      title: 'Xây dựng Dashboard Admin cho SaaS B2B với Next.js & NestJS',
      description: `Chúng tôi cần một Full-Stack Developer có kinh nghiệm xây dựng dashboard admin cho nền tảng SaaS B2B.

Yêu cầu:
- Frontend: Next.js 14 App Router, Tailwind CSS, ShadCN UI
- Backend: NestJS, Prisma ORM, PostgreSQL
- Auth: JWT + Refresh Token
- Charts: Recharts hoặc Chart.js
- Deploy: Docker + Railway

Deliverables:
- Authentication & RBAC
- User/Team management
- Analytics dashboard với charts
- Billing & subscription management
- API documentation (Swagger)`,
      budgetFormat: 'FIXED',
      fixedBudget: 1500,
      budget: 1500,
      deadline: new Date(Date.now() + 30 * 86400000),
      categoryId: webCatId,
      auctionType: 'SEALED_BID',
      status: 'OPEN',
      skills: ['React', 'NestJS', 'PostgreSQL', 'TypeScript', 'Docker'],
      ahpWeight: {
        create: {
          priceWeight: 30,
          skillWeight: 30,
          experienceWeight: 15,
          ratingWeight: 10,
          speedWeight: 5,
          deadlineWeight: 5,
          portfolioWeight: 5,
        },
      },
    },
    include: { ahpWeight: true },
  });

  const job2 = await prisma.job.upsert({
    where: { id: 'seed-job-002' },
    update: {},
    create: {
      id: 'seed-job-002',
      clientId: clientUser.id,
      title: 'Thiết kế UI/UX Landing Page & Onboarding Flow cho Fintech App',
      description: `Tìm designer có kinh nghiệm Fintech để thiết kế landing page và onboarding flow.

Yêu cầu:
- Thiết kế Figma (Desktop + Mobile)
- Landing page: Hero, Features, Pricing, Testimonials, CTA
- Onboarding flow: 5 màn hình
- Design system: Colors, Typography, Components
- Prototype clickable trong Figma

Style: Clean, Professional, Trust-inspiring (Fintech)`,
      budgetFormat: 'RANGE',
      minBudget: 500,
      maxBudget: 900,
      budget: 500,
      deadline: new Date(Date.now() + 20 * 86400000),
      categoryId: uiCatId,
      auctionType: 'OPEN_BID',
      status: 'OPEN',
      skills: ['Figma', 'UI/UX', 'Tailwind CSS'],
      ahpWeight: {
        create: {
          priceWeight: 20,
          skillWeight: 25,
          experienceWeight: 15,
          ratingWeight: 15,
          speedWeight: 5,
          deadlineWeight: 5,
          portfolioWeight: 15,
        },
      },
    },
    include: { ahpWeight: true },
  });

  const job3 = await prisma.job.upsert({
    where: { id: 'seed-job-003' },
    update: {},
    create: {
      id: 'seed-job-003',
      clientId: client2User.id,
      title: 'Phát triển Mobile App React Native cho E-Commerce (iOS + Android)',
      description: `Cần React Native developer xây dựng app thương mại điện tử.

Features:
- Product listing & search với filters
- Cart & Checkout flow
- Payment: VNPAY, MoMo integration
- User authentication (OTP phone)
- Order tracking
- Push notifications (FCM)

Tech: React Native, TypeScript, Redux Toolkit, Firebase`,
      budgetFormat: 'FIXED',
      fixedBudget: 2500,
      budget: 2500,
      deadline: new Date(Date.now() + 45 * 86400000),
      categoryId: mobileCatId,
      auctionType: 'SEALED_BID',
      status: 'OPEN',
      skills: ['React Native', 'TypeScript', 'Firebase', 'iOS', 'Android'],
      ahpWeight: {
        create: {
          priceWeight: 25,
          skillWeight: 30,
          experienceWeight: 20,
          ratingWeight: 10,
          speedWeight: 5,
          deadlineWeight: 5,
          portfolioWeight: 5,
        },
      },
    },
    include: { ahpWeight: true },
  });
  console.log('✅ Jobs seeded (3 jobs)');

  // ── 7. Bids ───────────────────────────────────────────────────────────────
  // Bid FL1 on Job1 (best match)
  await prisma.bid.upsert({
    where: { jobId_freelancerId: { jobId: job1.id, freelancerId: fl1.id } },
    update: {},
    create: {
      jobId: job1.id,
      freelancerId: fl1.id,
      amount: 1300,
      deliveryDays: 25,
      proposal: 'Tôi có 5 năm kinh nghiệm với chính xác stack này. Đã build 3 SaaS admin dashboard tương tự.',
      days: 25,
      coverLetter: `Chào bạn,

Tôi đã xem qua yêu cầu và rất hứng thú với dự án này. Đây chính xác là stack tôi đang làm hàng ngày.

• React/Next.js 14 App Router: 3 năm, đã build 5+ production apps
• NestJS + Prisma: Đây là combo tôi dùng cho mọi backend gần đây
• PostgreSQL: Quen thuộc với optimization, indexing, migration strategies
• Auth system: Đã implement JWT + refresh token rotation nhiều lần

Portfolio liên quan:
- E-Commerce SaaS Platform: Full-stack Next.js + NestJS, 10,000+ users
- Analytics Dashboard cho Fintech startup (NDA, có thể demo)

Tôi đề xuất $1,300 cho 25 ngày làm việc. Có thể bắt đầu ngay tuần này.

Trân trọng,
Lê Văn Hùng`,
      status: 'PENDING',
      matchingScore: 87,
      matchBreakdown: {
        skills: { score: 45, max: 50, matched: ['React', 'NestJS', 'PostgreSQL', 'TypeScript'], missing: ['Docker'] },
        budget: { score: 28, max: 30, withinBudget: true },
        assessment: { score: 15, max: 15, completed: true },
        profile: { score: 4, max: 5 },
        total: 87,
      },
    },
  });

  // Bid FL2 on Job1
  await prisma.bid.upsert({
    where: { jobId_freelancerId: { jobId: job1.id, freelancerId: fl2.id } },
    update: {},
    create: {
      jobId: job1.id,
      freelancerId: fl2.id,
      amount: 1100,
      deliveryDays: 30,
      proposal: 'Tôi có kinh nghiệm React và một số NestJS. Giá tốt nhất trong thị trường.',
      days: 30,
      coverLetter: `Chào,

Tôi có kinh nghiệm 3 năm với React và Next.js. Đã làm một số project với NestJS.

Tôi có thể hoàn thành trong 30 ngày với mức giá $1,100 - competitive nhất.

Về UI/UX, tôi đảm bảo dashboard sẽ clean và professional.

Lê Thị Lan`,
      status: 'PENDING',
      matchingScore: 62,
      matchBreakdown: {
        skills: { score: 30, max: 50, matched: ['React', 'TypeScript'], missing: ['NestJS', 'PostgreSQL', 'Docker'] },
        budget: { score: 27, max: 30, withinBudget: true },
        assessment: { score: 12, max: 15, completed: true },
        profile: { score: 3, max: 5 },
        total: 62,
      },
    },
  });

  // Bid FL1 on Job2
  await prisma.bid.upsert({
    where: { jobId_freelancerId: { jobId: job2.id, freelancerId: fl1.id } },
    update: {},
    create: {
      jobId: job2.id,
      freelancerId: fl1.id,
      amount: 700,
      deliveryDays: 15,
      proposal: 'Tôi có thể làm UI/UX cho Fintech app với kinh nghiệm React.',
      days: 15,
      coverLetter: `Chào,

Mặc dù tôi chủ yếu là developer nhưng tôi có thể implement Figma design và làm prototype cơ bản.

Giá $700 trong 15 ngày.

Hùng`,
      status: 'PENDING',
      matchingScore: 45,
      matchBreakdown: {
        skills: { score: 20, max: 50, matched: ['React', 'Tailwind CSS'], missing: ['Figma', 'UI/UX'] },
        budget: { score: 20, max: 30, withinBudget: true },
        assessment: { score: 0, max: 15, completed: false },
        profile: { score: 5, max: 5 },
        total: 45,
      },
    },
  });

  // Bid FL2 on Job2 (best match for this job)
  await prisma.bid.upsert({
    where: { jobId_freelancerId: { jobId: job2.id, freelancerId: fl2.id } },
    update: {},
    create: {
      jobId: job2.id,
      freelancerId: fl2.id,
      amount: 750,
      deliveryDays: 18,
      proposal: 'UI/UX là chuyên môn chính của tôi. Đã design nhiều Fintech app, rất hứng thú.',
      days: 18,
      coverLetter: `Chào bạn,

UI/UX Design cho Fintech chính xác là expertise của tôi. Đây là những gì tôi sẽ deliver:

• Landing page Figma design (Desktop 1440px + Mobile 375px)
• Onboarding flow 5 screens với micro-animations spec
• Component library: 50+ components theo design system
• Interactive prototype với user flow

Portfolio Fintech liên quan:
- Redesigned landing page cho Finstep (Fintech startup) → conversion tăng 40%
- Onboarding flow cho digital banking app

Style tôi đề xuất: Clean whites + deep navy blue + gold accent → Trust + Premium feel.

Timeline: 18 ngày, $750. Có thể show draft sau 5 ngày đầu để bạn confirm direction.

Trân trọng,
Phạm Thị Lan`,
      status: 'PENDING',
      matchingScore: 79,
      matchBreakdown: {
        skills: { score: 38, max: 50, matched: ['Figma', 'UI/UX', 'Tailwind CSS'], missing: [] },
        budget: { score: 22, max: 30, withinBudget: true },
        assessment: { score: 12, max: 15, completed: true },
        profile: { score: 4, max: 5 },
        total: 79,
      },
    },
  });

  // Bid FL3 on Job3 (best match)
  await prisma.bid.upsert({
    where: { jobId_freelancerId: { jobId: job3.id, freelancerId: fl3.id } },
    update: {},
    create: {
      jobId: job3.id,
      freelancerId: fl3.id,
      amount: 2200,
      deliveryDays: 40,
      proposal: 'React Native là chuyên môn chính. Đã publish 5 app, có kinh nghiệm VNPAY/MoMo.',
      days: 40,
      coverLetter: `Chào,

React Native E-Commerce app là đúng chuyên môn của tôi.

✅ React Native 3 năm, TypeScript thuần thục
✅ VNPAY & MoMo: đã integrate thực tế trong 2 project thương mại
✅ Firebase FCM push notifications: đã config cho iOS + Android
✅ Đã publish 5 app lên App Store + Google Play

Tôi propose $2,200 trong 40 ngày. Timeline:
- Week 1-2: Authentication, Product listing, Search
- Week 3-4: Cart, Checkout, Payment integration
- Week 5-6: Order tracking, Push notifications, Testing & Deploy

Nguyễn Quốc Tuấn`,
      status: 'PENDING',
      matchingScore: 82,
      matchBreakdown: {
        skills: { score: 42, max: 50, matched: ['React Native', 'TypeScript', 'Firebase', 'iOS', 'Android'], missing: [] },
        budget: { score: 26, max: 30, withinBudget: true },
        assessment: { score: 0, max: 15, completed: false },
        profile: { score: 4, max: 5 },
        total: 72,
      },
    },
  });

  // Bid FL1 on Job3
  await prisma.bid.upsert({
    where: { jobId_freelancerId: { jobId: job3.id, freelancerId: fl1.id } },
    update: {},
    create: {
      jobId: job3.id,
      freelancerId: fl1.id,
      amount: 2400,
      deliveryDays: 35,
      proposal: 'Tôi có thể học React Native nhanh. Kinh nghiệm web app mạnh, có thể apply sang mobile.',
      days: 35,
      coverLetter: `Chào,

Mặc dù tôi chủ yếu làm web, nhưng tôi đã có project React Native side nhỏ. TypeScript là strong suit của tôi.

$2,400 trong 35 ngày.

Hùng`,
      status: 'PENDING',
      matchingScore: 55,
      matchBreakdown: {
        skills: { score: 20, max: 50, matched: ['TypeScript'], missing: ['React Native', 'Firebase', 'iOS', 'Android'] },
        budget: { score: 22, max: 30, withinBudget: true },
        assessment: { score: 10, max: 15, completed: true },
        profile: { score: 3, max: 5 },
        total: 55,
      },
    },
  });

  console.log('✅ Bids seeded (6 bids across 3 jobs)');

  // ── 8. Sample Contract (job4 accepted state for demo) ──────────────────────
  // Create an extra job + accepted bid + contract to show contract flow
  const job4 = await prisma.job.upsert({
    where: { id: 'seed-job-004' },
    update: {},
    create: {
      id: 'seed-job-004',
      clientId: clientUser.id,
      title: 'Backend API REST với NestJS cho App Quản lý Nhân sự',
      description: 'REST API đầy đủ cho HR management system: nhân viên, chấm công, lương, báo cáo.',
      budgetFormat: 'FIXED',
      fixedBudget: 1200,
      budget: 1200,
      deadline: new Date(Date.now() + 60 * 86400000),
      categoryId: webCatId,
      auctionType: 'SEALED_BID',
      status: 'IN_PROGRESS',
      skills: ['NestJS', 'PostgreSQL', 'TypeScript', 'Redis'],
      ahpWeight: {
        create: {
          priceWeight: 30,
          skillWeight: 30,
          experienceWeight: 15,
          ratingWeight: 10,
          speedWeight: 5,
          deadlineWeight: 5,
          portfolioWeight: 5,
        },
      },
    },
    include: { ahpWeight: true },
  });

  const acceptedBid = await prisma.bid.upsert({
    where: { jobId_freelancerId: { jobId: job4.id, freelancerId: fl1.id } },
    update: { status: 'ACCEPTED' },
    create: {
      jobId: job4.id,
      freelancerId: fl1.id,
      amount: 1100,
      deliveryDays: 30,
      proposal: 'NestJS là strong suit của tôi. Sẵn sàng bắt đầu ngay.',
      days: 30,
      coverLetter: 'Tôi có kinh nghiệm NestJS 3 năm, đã build nhiều REST API production-grade.',
      status: 'ACCEPTED',
      matchingScore: 92,
      matchBreakdown: {},
    },
  });

  // Create contract with milestones
  const existingContract = await prisma.contract.findUnique({ where: { bidId: acceptedBid.id } });
  if (!existingContract) {
    const contract = await prisma.contract.create({
      data: {
        id: 'seed-contract-001',
        jobId: job4.id,
        bidId: acceptedBid.id,
        clientId: clientUser.id,
        freelancerId: fl1.id,
        title: 'Backend API REST với NestJS cho App Quản lý Nhân sự',
        description: 'Phát triển REST API đầy đủ với authentication, employee management, timekeeping, payroll.',
        totalAmount: 1100,
        status: 'ACTIVE',
        startDate: new Date(),
        autoApprovalDays: 5,
      },
    });

    const milestonesData = [
      {
        contractId: contract.id,
        order: 1,
        title: 'Authentication & User Management',
        description: 'JWT auth, RBAC, user CRUD, department management',
        amount: 330,
        percentage: 30,
        deadline: new Date(Date.now() + 10 * 86400000),
        status: 'APPROVED' as const,
        maxRevisions: 3,
        approvedAt: new Date(Date.now() - 2 * 86400000),
      },
      {
        contractId: contract.id,
        order: 2,
        title: 'Employee & Timekeeping Module',
        description: 'Employee CRUD, attendance tracking, leave management',
        amount: 385,
        percentage: 35,
        deadline: new Date(Date.now() + 20 * 86400000),
        status: 'SUBMITTED' as const,
        maxRevisions: 3,
        submittedAt: new Date(Date.now() - 1 * 86400000),
        autoApproveAt: new Date(Date.now() + 4 * 86400000),
        freelancerNotes: 'Đã hoàn thành employee CRUD và timekeeping. Đang test edge cases.',
      },
      {
        contractId: contract.id,
        order: 3,
        title: 'Payroll & Reports',
        description: 'Salary calculation, payroll processing, report generation (PDF/Excel)',
        amount: 385,
        percentage: 35,
        deadline: new Date(Date.now() + 30 * 86400000),
        status: 'NOT_STARTED' as const,
        maxRevisions: 3,
      },
    ];
    // Upsert each milestone by contractId + order to avoid duplicates on re-seed
    for (const ms of milestonesData) {
      const existing = await prisma.milestone.findFirst({
        where: { contractId: contract.id, order: ms.order },
      });
      if (!existing) {
        await prisma.milestone.create({ data: ms });
      }
    }

    await prisma.contractStatusLog.create({
      data: {
        contractId: contract.id,
        action: 'CREATED',
        toStatus: 'ACTIVE',
        performedBy: clientUser.id,
      },
    });

    await prisma.contractStatusLog.create({
      data: {
        contractId: contract.id,
        action: 'MILESTONE_APPROVED',
        toStatus: 'ACTIVE',
        performedBy: clientUser.id,
        metadata: { milestone: 'Authentication & User Management' },
      },
    });

    console.log('✅ Sample contract seeded (ACTIVE, milestone 1 approved, milestone 2 submitted)');
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n🎉 Seed complete!\n');
  console.log('─'.repeat(50));
  console.log('📧 Login accounts:');
  console.log('  CLIENT:     client@bidwise.dev     / Password123!');
  console.log('  CLIENT2:    client2@bidwise.dev    / Password123!');
  console.log('  FREELANCER: freelancer1@bidwise.dev / Password123!');
  console.log('  FREELANCER: freelancer2@bidwise.dev / Password123!');
  console.log('  FREELANCER: freelancer3@bidwise.dev / Password123!');
  console.log('─'.repeat(50));
  console.log('📋 Data created:');
  console.log('  • 8 categories');
  console.log('  • 5 users (1 client, 1 client2, 3 freelancers)');
  console.log('  • 3 freelancer profiles with portfolio items');
  console.log('  • 4 jobs (3 OPEN for bidding, 1 IN_PROGRESS)');
  console.log('  • 6 bids across 3 open jobs');
  console.log('  • 1 active contract with 3 milestones');
  console.log('─'.repeat(50));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
