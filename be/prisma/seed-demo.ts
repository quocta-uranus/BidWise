/**
 * Demo seed — tạo tài khoản + dữ liệu cho buổi demo AHP-TOPSIS với giáo viên
 * Chạy: npx ts-node -r tsconfig-paths/register prisma/seed-demo.ts
 */
import { PrismaClient, RoleType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🎬 Seeding DEMO data...\n');

  const password = await bcrypt.hash('Demo@1234', 10);

  // ── 1. Đảm bảo Roles tồn tại ───────────────────────────────────────────────
  for (const name of [RoleType.CLIENT, RoleType.FREELANCER, RoleType.ADMIN, RoleType.MODERATOR]) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }

  // ── 2. Categories ──────────────────────────────────────────────────────────
  const webCat = await prisma.category.upsert({
    where: { name: 'Web Development' },
    update: {},
    create: { name: 'Web Development', description: 'Websites, web apps, frontend/backend' },
  });
  const uiCat = await prisma.category.upsert({
    where: { name: 'UI/UX Design' },
    update: {},
    create: { name: 'UI/UX Design', description: 'User interface and user experience design' },
  });

  // ── 3. Tài khoản Demo ──────────────────────────────────────────────────────
  const clientRole = await prisma.role.findUniqueOrThrow({ where: { name: 'CLIENT' } });
  const flRole = await prisma.role.findUniqueOrThrow({ where: { name: 'FREELANCER' } });

  // CLIENT
  const client = await prisma.user.upsert({
    where: { email: 'demo.client@bidwise.dev' },
    update: { passwordHash: password, status: 'ACTIVE', emailVerifiedAt: new Date() },
    create: {
      email: 'demo.client@bidwise.dev',
      passwordHash: password,
      fullName: 'Nguyễn Minh Tuấn',
      bio: 'Founder & CTO của startup SaaS B2B. Đang tìm freelancer cho 2 dự án mới.',
      phone: '0901111222',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: client.id, roleId: clientRole.id } },
    update: {},
    create: { userId: client.id, roleId: clientRole.id },
  });

  // FREELANCER 1 — Full-Stack Dev
  const fl1 = await prisma.user.upsert({
    where: { email: 'demo.fl1@bidwise.dev' },
    update: { passwordHash: password, status: 'ACTIVE', emailVerifiedAt: new Date() },
    create: {
      email: 'demo.fl1@bidwise.dev',
      passwordHash: password,
      fullName: 'Trần Văn An',
      bio: 'Senior Full-Stack Developer 5 năm kinh nghiệm. Chuyên React, NestJS, PostgreSQL.',
      phone: '0902222333',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: fl1.id, roleId: flRole.id } },
    update: {},
    create: { userId: fl1.id, roleId: flRole.id },
  });

  const fp1 = await prisma.freelancerProfile.upsert({
    where: { userId: fl1.id },
    update: {},
    create: {
      userId: fl1.id,
      hourlyRate: 40,
      experience: '5 years',
      skills: ['React', 'NestJS', 'PostgreSQL', 'TypeScript', 'Docker', 'Redis'],
      available: true,
      bidTokens: 20,
      assessmentCompleted: true,
      assessmentScore: 92,
      assessmentLevel: 'Gold',
    },
  });
  await prisma.portfolioItem.createMany({
    skipDuplicates: true,
    data: [
      { freelancerProfileId: fp1.id, title: 'SaaS Admin Dashboard', desc: 'Next.js 14 + NestJS + Prisma, 15,000+ users', link: 'https://github.com', linkType: 'github' },
      { freelancerProfileId: fp1.id, title: 'Fintech Analytics Platform', desc: 'Real-time charts, WebSocket, Redis cache', link: 'https://github.com', linkType: 'github' },
    ],
  });

  // FREELANCER 2 — UI/UX + Frontend
  const fl2 = await prisma.user.upsert({
    where: { email: 'demo.fl2@bidwise.dev' },
    update: { passwordHash: password, status: 'ACTIVE', emailVerifiedAt: new Date() },
    create: {
      email: 'demo.fl2@bidwise.dev',
      passwordHash: password,
      fullName: 'Lê Thị Mai',
      bio: 'UI/UX Designer & Frontend Developer 3 năm kinh nghiệm. Chuyên Figma, React, Tailwind.',
      phone: '0903333444',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: fl2.id, roleId: flRole.id } },
    update: {},
    create: { userId: fl2.id, roleId: flRole.id },
  });

  const fp2 = await prisma.freelancerProfile.upsert({
    where: { userId: fl2.id },
    update: {},
    create: {
      userId: fl2.id,
      hourlyRate: 28,
      experience: '3 years',
      skills: ['Figma', 'UI/UX', 'React', 'Tailwind CSS', 'CSS Animation', 'Prototyping'],
      available: true,
      bidTokens: 20,
      assessmentCompleted: true,
      assessmentScore: 80,
      assessmentLevel: 'Silver',
    },
  });
  await prisma.portfolioItem.createMany({
    skipDuplicates: true,
    data: [
      { freelancerProfileId: fp2.id, title: 'Fintech App Redesign', desc: 'Tăng conversion 40%, Figma + React implement', link: 'https://behance.net', linkType: 'behance' },
      { freelancerProfileId: fp2.id, title: 'E-Commerce Mobile UI', desc: 'Design system 80+ components, Dark/Light mode', link: 'https://behance.net', linkType: 'behance' },
    ],
  });

  console.log('✅ Tài khoản demo created:\n  Client: demo.client@bidwise.dev\n  FL1: demo.fl1@bidwise.dev\n  FL2: demo.fl2@bidwise.dev\n  Password: Demo@1234');

  // ── 4. Jobs (2 jobs của Client, đã có bid) ─────────────────────────────────
  const job1 = await prisma.job.upsert({
    where: { id: 'demo-job-001' },
    update: {},
    create: {
      id: 'demo-job-001',
      clientId: client.id,
      title: 'Xây dựng hệ thống quản lý đơn hàng cho E-Commerce (Next.js + NestJS)',
      description: `Chúng tôi cần Full-Stack Developer xây dựng hệ thống quản lý đơn hàng cho nền tảng thương mại điện tử.

**Yêu cầu kỹ thuật:**
- Frontend: Next.js 14 App Router, Tailwind CSS, ShadCN UI
- Backend: NestJS, Prisma ORM, PostgreSQL
- Tính năng: CRUD đơn hàng, filter/search nâng cao, export Excel/PDF
- Real-time: Socket.io cho live order tracking
- Auth: JWT + Role-based (Admin, Staff, Viewer)
- Deploy: Docker + Railway

**Deliverables:**
1. Dashboard thống kê (doanh thu, đơn hàng, top sản phẩm)
2. Quản lý đơn hàng với workflow: Pending → Processing → Shipped → Delivered
3. Quản lý sản phẩm & kho hàng
4. Báo cáo xuất Excel/PDF
5. API documentation (Swagger)`,
      budgetFormat: 'FIXED',
      fixedBudget: 2000,
      budget: 2000,
      deadline: new Date(Date.now() + 30 * 86400000),
      categoryId: webCat.id,
      auctionType: 'SEALED_BID',
      status: 'OPEN',
      skills: ['React', 'NestJS', 'PostgreSQL', 'TypeScript', 'Docker'],
      ahpWeight: {
        create: {
          priceWeight: 25,
          skillWeight: 35,
          experienceWeight: 20,
          ratingWeight: 10,
          speedWeight: 5,
          deadlineWeight: 0,
          portfolioWeight: 5,
        },
      },
    },
    include: { ahpWeight: true },
  });

  const job2 = await prisma.job.upsert({
    where: { id: 'demo-job-002' },
    update: {},
    create: {
      id: 'demo-job-002',
      clientId: client.id,
      title: 'Thiết kế UI/UX Dashboard Analytics cho SaaS B2B (Figma + React)',
      description: `Tìm UI/UX Designer có kinh nghiệm SaaS để thiết kế dashboard analytics cho sản phẩm B2B của chúng tôi.

**Yêu cầu:**
- Thiết kế Figma hoàn chỉnh (Desktop 1440px + Tablet 768px)
- Dashboard trang chính: KPI cards, Line chart, Bar chart, Data table
- Dark mode + Light mode
- Design system: Color palette, Typography scale, Component library (50+ components)
- Prototype clickable trong Figma
- Handoff cho developer (auto-layout, variables)

**Style:** Clean, Data-focused, Professional (Notion + Linear-inspired)
**Không cần implement** — chỉ cần Figma file hoàn chỉnh.`,
      budgetFormat: 'RANGE',
      minBudget: 600,
      maxBudget: 1000,
      budget: 600,
      deadline: new Date(Date.now() + 21 * 86400000),
      categoryId: uiCat.id,
      auctionType: 'OPEN_BID',
      status: 'OPEN',
      skills: ['Figma', 'UI/UX', 'Tailwind CSS', 'Prototyping'],
      ahpWeight: {
        create: {
          priceWeight: 15,
          skillWeight: 25,
          experienceWeight: 10,
          ratingWeight: 15,
          speedWeight: 5,
          deadlineWeight: 5,
          portfolioWeight: 25,
        },
      },
    },
    include: { ahpWeight: true },
  });

  console.log('✅ 2 jobs created (demo-job-001, demo-job-002)');

  // ── 5. Bids ─────────────────────────────────────────────────────────────────
  // Job 1: FL1 bid (phù hợp hơn - Full Stack)
  await prisma.bid.upsert({
    where: { jobId_freelancerId: { jobId: job1.id, freelancerId: fl1.id } },
    update: {},
    create: {
      jobId: job1.id,
      freelancerId: fl1.id,
      amount: 1800,
      deliveryDays: 28,
      proposal: 'Full-Stack Developer 5 năm, đã build 3 hệ thống order management tương tự.',
      days: 28,
      coverLetter: `Chào anh/chị Nguyễn Minh Tuấn,

Tôi đã đọc kỹ yêu cầu và đây chính xác là dự án tôi hứng thú nhất trong tháng này.

**Kinh nghiệm liên quan:**
• Next.js 14 App Router + NestJS: Stack chính tôi dùng hàng ngày trong 3 năm qua
• Đã xây dựng 3 hệ thống Order Management cho e-commerce (1 cái hiện phục vụ 50,000 đơn/ngày)
• PostgreSQL optimization: query indexing, partitioning cho large datasets
• Real-time với Socket.io: đã dùng trong production với 1,000+ concurrent users

**Approach của tôi:**
1. Week 1: Setup, Auth, Database schema
2. Week 2: Core CRUD, Workflow engine
3. Week 3: Dashboard, Charts, Export
4. Week 4: Testing, Deploy, Documentation

**Tại sao chọn tôi?**
- Assessment Score: 92/100 (Gold level)
- 3 đánh giá 5 sao gần nhất
- Cam kết giao đúng hạn (track record 100%)

Giá đề xuất: $1,800 / 28 ngày làm việc.

Trân trọng,
Trần Văn An`,
      status: 'PENDING',
      matchingScore: 91,
      matchBreakdown: {
        skills: { score: 48, max: 50, matched: ['React', 'NestJS', 'PostgreSQL', 'TypeScript', 'Docker'], missing: [] },
        budget: { score: 27, max: 30, withinBudget: true },
        assessment: { score: 14, max: 15, completed: true },
        profile: { score: 5, max: 5 },
        total: 91,
      },
    },
  });

  // Job 1: FL2 bid (ít phù hợp hơn - thiếu backend skills)
  await prisma.bid.upsert({
    where: { jobId_freelancerId: { jobId: job1.id, freelancerId: fl2.id } },
    update: {},
    create: {
      jobId: job1.id,
      freelancerId: fl2.id,
      amount: 1500,
      deliveryDays: 35,
      proposal: 'Tôi có React mạnh và đang học NestJS. Giá cạnh tranh nhất.',
      days: 35,
      coverLetter: `Chào,

Tôi có 3 năm kinh nghiệm với React/Next.js và đang mở rộng sang backend với NestJS.

Về yêu cầu của bạn:
- Frontend (Next.js, Tailwind, UI): Đây là thế mạnh của tôi ✓
- NestJS backend: Tôi đã làm được CRUD cơ bản ✓
- PostgreSQL: Dùng cơ bản ✓
- Docker: Đang học ⚠️

Giá: $1,500 / 35 ngày — tiết kiệm $500 so với budget.

Lê Thị Mai`,
      status: 'PENDING',
      matchingScore: 58,
      matchBreakdown: {
        skills: { score: 25, max: 50, matched: ['React', 'TypeScript'], missing: ['NestJS', 'PostgreSQL', 'Docker'] },
        budget: { score: 25, max: 30, withinBudget: true },
        assessment: { score: 6, max: 15, completed: true },
        profile: { score: 4, max: 5 },
        total: 58,
      },
    },
  });

  // Job 2: FL2 bid (phù hợp hơn - UI/UX chuyên nghiệp)
  await prisma.bid.upsert({
    where: { jobId_freelancerId: { jobId: job2.id, freelancerId: fl2.id } },
    update: {},
    create: {
      jobId: job2.id,
      freelancerId: fl2.id,
      amount: 850,
      deliveryDays: 18,
      proposal: 'UI/UX cho SaaS Dashboard là chuyên môn chính. Đã design 5 analytics dashboard.',
      days: 18,
      coverLetter: `Chào anh/chị,

SaaS Dashboard Analytics chính là niche của tôi — đây là loại sản phẩm tôi design nhiều nhất.

**Portfolio liên quan trực tiếp:**
• Fintech Analytics Dashboard: Redesign toàn bộ → user engagement tăng 65%
• E-Commerce Admin Dashboard: Dark mode first, 80+ components

**Deliverables chi tiết:**
1. Discovery & wireframes (ngày 1-3)
2. Design system: colors, typography, spacing (ngày 3-5)
3. Dashboard screens: Main, Orders, Products, Reports (ngày 5-13)
4. Dark + Light mode variants (ngày 13-15)
5. Interactive prototype + Handoff notes (ngày 15-18)

**Tôi sẽ dùng:**
- Figma với Auto-Layout + Variables (dễ maintain)
- Component library theo Atomic Design
- Style guide PDF kèm theo

Timeline: 18 ngày, $850. Show draft sau 5 ngày để bạn approve direction trước khi đi tiếp.

Trân trọng,
Lê Thị Mai`,
      status: 'PENDING',
      matchingScore: 84,
      matchBreakdown: {
        skills: { score: 42, max: 50, matched: ['Figma', 'UI/UX', 'Tailwind CSS', 'Prototyping'], missing: [] },
        budget: { score: 22, max: 30, withinBudget: true },
        assessment: { score: 12, max: 15, completed: true },
        profile: { score: 5, max: 5 },
        total: 84,
      },
    },
  });

  // Job 2: FL1 bid (ít phù hợp - không phải UI/UX)
  await prisma.bid.upsert({
    where: { jobId_freelancerId: { jobId: job2.id, freelancerId: fl1.id } },
    update: {},
    create: {
      jobId: job2.id,
      freelancerId: fl1.id,
      amount: 700,
      deliveryDays: 14,
      proposal: 'Tôi có thể làm UI với React + Tailwind, thiếu kinh nghiệm Figma chuyên sâu.',
      days: 14,
      coverLetter: `Chào,

Tôi chủ yếu là developer nhưng có thể handle Figma ở mức basic và implement design bằng React.

Nếu chỉ cần Figma file thì tôi không phải lựa chọn tốt nhất — nhưng nếu cần implement React luôn thì tôi deliver nhanh hơn.

Giá $700 / 14 ngày.

Trân Văn An`,
      status: 'PENDING',
      matchingScore: 42,
      matchBreakdown: {
        skills: { score: 18, max: 50, matched: ['Tailwind CSS'], missing: ['Figma', 'UI/UX', 'Prototyping'] },
        budget: { score: 20, max: 30, withinBudget: true },
        assessment: { score: 0, max: 15, completed: false },
        profile: { score: 4, max: 5 },
        total: 42,
      },
    },
  });

  console.log('✅ Bids created (2 bids trên mỗi job)');
  console.log('\n🎬 DEMO SEED HOÀN TẤT!\n');
  console.log('┌─────────────────────────────────────────┐');
  console.log('│  CLIENT   demo.client@bidwise.dev       │');
  console.log('│  FL 1     demo.fl1@bidwise.dev          │');
  console.log('│  FL 2     demo.fl2@bidwise.dev          │');
  console.log('│  Password Demo@1234                     │');
  console.log('└─────────────────────────────────────────┘');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
