/**
 * Large dataset seeder for Feature-5 algorithm evaluation.
 * Creates ~650 records: 20 clients, 50 freelancers, 50 jobs, ~300 bids, 25 contracts.
 * Run: npx ts-node -r tsconfig-paths/register prisma/seed-large.ts
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Skill pools per domain ───────────────────────────────────────────────────
const SKILLS = {
  frontend: ['React', 'Vue.js', 'Angular', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Redux', 'CSS', 'HTML', 'SASS'],
  backend: ['NestJS', 'Node.js', 'Python', 'Django', 'Express.js', 'PostgreSQL', 'MySQL', 'Redis', 'GraphQL', 'REST API'],
  mobile: ['React Native', 'Flutter', 'iOS', 'Android', 'Swift', 'Dart', 'Firebase', 'Kotlin'],
  design: ['Figma', 'Adobe XD', 'UI/UX', 'Photoshop', 'Illustrator', 'Sketch', 'Prototyping'],
  devops: ['Docker', 'Kubernetes', 'AWS', 'GCP', 'CI/CD', 'Terraform', 'Linux', 'Nginx'],
  data: ['Machine Learning', 'TensorFlow', 'Python', 'Pandas', 'SQL', 'Tableau', 'Power BI', 'Scikit-learn'],
};

type Domain = keyof typeof SKILLS;

function pickSkills(domain: Domain, n: number, extras: string[] = []): string[] {
  const pool = [...SKILLS[domain]];
  const picked = pool.sort(() => Math.random() - 0.5).slice(0, n);
  return [...new Set([...picked, ...extras])];
}

// ─── Cover letter templates (for spam detection ground truth) ─────────────────
const TEMPLATE_LETTER = `Dear Client,

I am a professional developer with extensive experience in this field.
I have successfully completed many similar projects for clients worldwide.
My skills perfectly match your requirements and I can deliver excellent results.
I am available to start immediately and will complete the work on time and within budget.
Please check my portfolio for examples of my previous work.
Looking forward to working with you.

Best regards`;

function makeTemplateVariant(name: string): string {
  return TEMPLATE_LETTER.replace('Dear Client', `Dear ${name}`);
}

function makeGenuineLetter(name: string, skills: string[], jobTitle: string): string {
  return `Chào bạn,

Tôi đã đọc kỹ yêu cầu "${jobTitle}" và rất hứng thú.

Về kinh nghiệm: tôi có ${Math.floor(Math.random() * 4) + 2} năm kinh nghiệm với ${skills.slice(0, 3).join(', ')}.
Portfolio nổi bật của tôi:
- Dự án A: ${skills[0]} cho startup FinTech, 2000+ users
- Dự án B: Hệ thống ${skills[1] ?? 'backend'} cho doanh nghiệp vừa, xử lý 10K req/s

Tôi đề xuất hoàn thành trong ${Math.floor(Math.random() * 20) + 10} ngày làm việc.

Trân trọng,
${name}`;
}

// ─── Job templates ────────────────────────────────────────────────────────────
interface JobTemplate {
  title: string;
  description: string;
  skills: string[];
  category: string;
  budget: number;
  auctionType: 'SEALED_BID' | 'OPEN_BID';
  domain: Domain;
}

const JOB_TEMPLATES: JobTemplate[] = [
  // Web Development (15)
  { title: 'Xây dựng Dashboard Admin SaaS với Next.js 14', description: 'Dashboard admin cho SaaS platform B2B với authentication, RBAC, analytics, billing management.', skills: ['React', 'Next.js', 'NestJS', 'PostgreSQL', 'TypeScript'], category: 'Web Development', budget: 1500, auctionType: 'SEALED_BID', domain: 'frontend' },
  { title: 'REST API NestJS cho E-Commerce Platform', description: 'Backend API với product management, cart, orders, payment integration (VNPAY, MoMo), shipping.', skills: ['NestJS', 'PostgreSQL', 'Redis', 'TypeScript', 'REST API'], category: 'Web Development', budget: 1200, auctionType: 'SEALED_BID', domain: 'backend' },
  { title: 'Landing Page tốc độ cao với Next.js + Tailwind', description: 'Landing page cho startup, tối ưu Core Web Vitals, Lighthouse 95+, SEO, CMS headless.', skills: ['Next.js', 'Tailwind CSS', 'TypeScript', 'CSS'], category: 'Web Development', budget: 600, auctionType: 'OPEN_BID', domain: 'frontend' },
  { title: 'Real-time Chat Platform với Socket.io', description: 'Chat app: rooms, direct messages, file upload, read receipts, online status, notifications.', skills: ['Node.js', 'Redis', 'PostgreSQL', 'TypeScript', 'NestJS'], category: 'Web Development', budget: 900, auctionType: 'SEALED_BID', domain: 'backend' },
  { title: 'Blog CMS với Headless Architecture', description: 'Headless CMS với Next.js frontend, NestJS admin panel, Markdown editor, SEO tools.', skills: ['Next.js', 'NestJS', 'PostgreSQL', 'TypeScript'], category: 'Web Development', budget: 800, auctionType: 'OPEN_BID', domain: 'frontend' },
  { title: 'Hệ thống Quản lý Kho Warehouse ERP', description: 'ERP module: inventory, purchase orders, sales orders, barcode scanning, reports.', skills: ['React', 'NestJS', 'PostgreSQL', 'TypeScript', 'Redis'], category: 'Web Development', budget: 2000, auctionType: 'SEALED_BID', domain: 'backend' },
  { title: 'Multi-tenant SaaS Platform Backend', description: 'Backend cho SaaS multi-tenant: tenant isolation, subscription plans, usage limits, webhooks.', skills: ['NestJS', 'PostgreSQL', 'Redis', 'GraphQL', 'TypeScript'], category: 'Web Development', budget: 1800, auctionType: 'SEALED_BID', domain: 'backend' },
  { title: 'React Component Library với Storybook', description: 'Component library: 50+ components, TypeScript, Storybook docs, npm publish, WCAG 2.1.', skills: ['React', 'TypeScript', 'CSS', 'SASS', 'Tailwind CSS'], category: 'Web Development', budget: 700, auctionType: 'OPEN_BID', domain: 'frontend' },
  { title: 'Fintech Web App với Payment Gateway', description: 'Web app: user onboarding KYC, wallet, transfer, transaction history, PDF statements.', skills: ['React', 'NestJS', 'PostgreSQL', 'TypeScript', 'Redis'], category: 'Web Development', budget: 2500, auctionType: 'SEALED_BID', domain: 'frontend' },
  { title: 'API GraphQL cho Social Network Platform', description: 'GraphQL API: users, posts, comments, likes, follows, feed algorithm, notifications.', skills: ['NestJS', 'GraphQL', 'PostgreSQL', 'Redis', 'TypeScript'], category: 'Web Development', budget: 1400, auctionType: 'SEALED_BID', domain: 'backend' },
  { title: 'Vue.js Single Page Application cho HR System', description: 'SPA với Vue 3 Composition API: employees, attendance, leave, payroll, org chart.', skills: ['Vue.js', 'TypeScript', 'REST API', 'CSS'], category: 'Web Development', budget: 1100, auctionType: 'OPEN_BID', domain: 'frontend' },
  { title: 'Microservices Architecture với Docker + K8s', description: 'Tách monolith thành microservices, deploy lên Kubernetes, service mesh, observability.', skills: ['NestJS', 'Docker', 'Kubernetes', 'PostgreSQL', 'Redis'], category: 'Web Development', budget: 3000, auctionType: 'SEALED_BID', domain: 'devops' },
  { title: 'Trang thương mại điện tử B2C toàn diện', description: 'E-commerce đầy đủ: product, cart, checkout, payment, order management, seller dashboard.', skills: ['Next.js', 'NestJS', 'PostgreSQL', 'TypeScript', 'Redis'], category: 'Web Development', budget: 2200, auctionType: 'SEALED_BID', domain: 'frontend' },
  { title: 'Web Scraper & Data Pipeline', description: 'Scraper Puppeteer/Playwright, data cleaning pipeline, lưu PostgreSQL, dashboard Grafana.', skills: ['Node.js', 'PostgreSQL', 'Python', 'REST API'], category: 'Web Development', budget: 650, auctionType: 'OPEN_BID', domain: 'backend' },
  { title: 'Angular Enterprise Application', description: 'Ứng dụng Angular 17: complex forms, grid data, PDF export, role-based UI, i18n.', skills: ['Angular', 'TypeScript', 'CSS', 'REST API'], category: 'Web Development', budget: 1300, auctionType: 'SEALED_BID', domain: 'frontend' },
  // Mobile (10)
  { title: 'App E-Commerce iOS & Android React Native', description: 'App thương mại điện tử: product listing, cart, VNPAY/MoMo, push notifications, offline mode.', skills: ['React Native', 'TypeScript', 'Firebase', 'iOS', 'Android'], category: 'Mobile Development', budget: 2500, auctionType: 'SEALED_BID', domain: 'mobile' },
  { title: 'Flutter App Quản lý Tài chính Cá nhân', description: 'Finance tracker: income/expense, categories, budgets, charts, export PDF, biometric auth.', skills: ['Flutter', 'Dart', 'Firebase'], category: 'Mobile Development', budget: 1200, auctionType: 'OPEN_BID', domain: 'mobile' },
  { title: 'iOS Native App Delivery Tracking', description: 'Swift app: order tracking map real-time, push notifications, driver/customer views.', skills: ['iOS', 'Swift', 'Firebase'], category: 'Mobile Development', budget: 1800, auctionType: 'SEALED_BID', domain: 'mobile' },
  { title: 'Ứng dụng Học tiếng Anh Gamification', description: 'App học ngôn ngữ: flashcards, speaking practice, leaderboard, streak system, offline mode.', skills: ['React Native', 'TypeScript', 'Firebase', 'Android'], category: 'Mobile Development', budget: 2000, auctionType: 'SEALED_BID', domain: 'mobile' },
  { title: 'Android Kotlin App Quản lý Nhà hàng POS', description: 'POS app: menu management, order taking, kitchen display, payment (VNPay), daily reports.', skills: ['Android', 'Kotlin', 'Firebase'], category: 'Mobile Development', budget: 1500, auctionType: 'OPEN_BID', domain: 'mobile' },
  { title: 'React Native Social App cho Freelancers', description: 'Networking app: profile, portfolio, job feed, in-app messaging, video calls.', skills: ['React Native', 'TypeScript', 'Firebase', 'iOS', 'Android'], category: 'Mobile Development', budget: 2800, auctionType: 'SEALED_BID', domain: 'mobile' },
  { title: 'Flutter Health & Fitness Tracker', description: 'Fitness app: workout plans, progress tracking, nutrition log, HealthKit/Google Fit integration.', skills: ['Flutter', 'Dart', 'Firebase'], category: 'Mobile Development', budget: 1600, auctionType: 'SEALED_BID', domain: 'mobile' },
  { title: 'Cross-platform App Booking Dịch vụ', description: 'Service booking: providers, slots, booking flow, payment, review system, push notifications.', skills: ['React Native', 'TypeScript', 'Firebase'], category: 'Mobile Development', budget: 2200, auctionType: 'SEALED_BID', domain: 'mobile' },
  { title: 'iOS App Telemedicine Video Consultation', description: 'Healthcare app: doctor profiles, appointment booking, video call (WebRTC), prescription PDF.', skills: ['iOS', 'Swift', 'Firebase'], category: 'Mobile Development', budget: 3000, auctionType: 'SEALED_BID', domain: 'mobile' },
  { title: 'Android App Giám sát IoT Dashboard', description: 'IoT monitoring: connect sensors via MQTT, real-time dashboard, alerts, historical charts.', skills: ['Android', 'Kotlin', 'Firebase'], category: 'Mobile Development', budget: 1400, auctionType: 'OPEN_BID', domain: 'mobile' },
  // UI/UX Design (8)
  { title: 'Design System cho SaaS Product B2B', description: 'Design system đầy đủ: tokens, 80+ components, Figma library, documentation, dark mode.', skills: ['Figma', 'UI/UX', 'Prototyping'], category: 'UI/UX Design', budget: 1000, auctionType: 'SEALED_BID', domain: 'design' },
  { title: 'UX Research & Redesign App Ngân hàng', description: 'User research (interviews, usability tests), IA, wireframes, high-fidelity mockups, Figma prototype.', skills: ['Figma', 'UI/UX', 'Prototyping', 'Adobe XD'], category: 'UI/UX Design', budget: 1500, auctionType: 'SEALED_BID', domain: 'design' },
  { title: 'Landing Page Design cho Startup AI', description: 'Landing page hiện đại cho AI startup: hero, features, pricing, testimonials, CTA — Figma deliverable.', skills: ['Figma', 'UI/UX', 'Prototyping'], category: 'UI/UX Design', budget: 500, auctionType: 'OPEN_BID', domain: 'design' },
  { title: 'Mobile App UI Kit Fintech (Figma)', description: 'UI kit cho fintech mobile app: 80+ screens iOS/Android, component library, icon set.', skills: ['Figma', 'UI/UX', 'Prototyping', 'Illustrator'], category: 'UI/UX Design', budget: 800, auctionType: 'SEALED_BID', domain: 'design' },
  { title: 'Brand Identity & Logo Design', description: 'Brand identity cho startup: logo, typography, color palette, business card, brand guidelines PDF.', skills: ['Illustrator', 'Photoshop', 'Figma', 'Sketch'], category: 'UI/UX Design', budget: 400, auctionType: 'OPEN_BID', domain: 'design' },
  { title: 'Dashboard UI Design SaaS Analytics', description: 'Analytics dashboard UI: charts, tables, filters, dark/light mode — responsive Figma design.', skills: ['Figma', 'UI/UX', 'Prototyping'], category: 'UI/UX Design', budget: 700, auctionType: 'OPEN_BID', domain: 'design' },
  { title: 'E-commerce UX Audit & Optimization', description: 'UX audit cho e-commerce site, heuristic evaluation, A/B test proposal, checkout flow optimization.', skills: ['Figma', 'UI/UX', 'Adobe XD'], category: 'UI/UX Design', budget: 600, auctionType: 'OPEN_BID', domain: 'design' },
  { title: 'Onboarding Flow Design cho EdTech App', description: '5-screen onboarding flow, interactive Figma prototype, micro-animations spec cho developers.', skills: ['Figma', 'UI/UX', 'Prototyping', 'Illustrator'], category: 'UI/UX Design', budget: 450, auctionType: 'OPEN_BID', domain: 'design' },
  // Data & AI (7)
  { title: 'ML Model Phân loại Đánh giá Sản phẩm NLP', description: 'Mô hình NLP phân loại sentiment đánh giá sản phẩm, API Flask, deploy Docker, 90%+ accuracy.', skills: ['Python', 'Machine Learning', 'TensorFlow', 'Pandas', 'SQL'], category: 'Data & AI', budget: 1200, auctionType: 'SEALED_BID', domain: 'data' },
  { title: 'Dashboard Power BI cho Chuỗi Bán lẻ', description: 'Dashboard BI: KPIs bán hàng, inventory, customer segmentation, dữ liệu từ SQL Server.', skills: ['Power BI', 'SQL', 'Python', 'Pandas'], category: 'Data & AI', budget: 800, auctionType: 'OPEN_BID', domain: 'data' },
  { title: 'Recommendation System cho E-Commerce', description: 'Collaborative filtering + content-based hybrid recommender, A/B test framework, API FastAPI.', skills: ['Python', 'Machine Learning', 'Pandas', 'SQL', 'Scikit-learn'], category: 'Data & AI', budget: 1500, auctionType: 'SEALED_BID', domain: 'data' },
  { title: 'Chatbot GPT tích hợp cho Customer Service', description: 'Chatbot với RAG, tích hợp tài liệu nội bộ, NestJS backend, widget embed, handoff đến agent.', skills: ['Python', 'NestJS', 'PostgreSQL', 'Machine Learning'], category: 'Data & AI', budget: 2000, auctionType: 'SEALED_BID', domain: 'data' },
  { title: 'ETL Pipeline Data Warehouse AWS', description: 'Pipeline ETL từ nhiều nguồn (REST, DB, S3) → Redshift DWH, dbt transformations, Airflow scheduling.', skills: ['Python', 'SQL', 'AWS', 'Pandas'], category: 'Data & AI', budget: 1800, auctionType: 'SEALED_BID', domain: 'data' },
  { title: 'Computer Vision Nhận diện Lỗi Sản phẩm', description: 'CNN model phát hiện lỗi sản xuất từ camera conveyor belt, real-time API, >95% precision.', skills: ['Python', 'TensorFlow', 'Machine Learning', 'Pandas'], category: 'Data & AI', budget: 2200, auctionType: 'SEALED_BID', domain: 'data' },
  { title: 'Tableau Dashboard Marketing Analytics', description: 'Tableau workbook: funnel, cohort analysis, CAC/LTV, Google Analytics & CRM integration.', skills: ['Tableau', 'SQL', 'Python', 'Power BI'], category: 'Data & AI', budget: 700, auctionType: 'OPEN_BID', domain: 'data' },
  // DevOps (5)
  { title: 'Kubernetes Cluster Setup AWS EKS Production', description: 'EKS cluster production-grade: networking, RBAC, Helm charts, monitoring Prometheus/Grafana, HPA.', skills: ['Kubernetes', 'AWS', 'Docker', 'Terraform', 'CI/CD'], category: 'DevOps & Cloud', budget: 2500, auctionType: 'SEALED_BID', domain: 'devops' },
  { title: 'CI/CD Pipeline cho Monorepo Next.js + NestJS', description: 'GitHub Actions CI/CD: lint, test, build, Docker push, deploy staging/prod, environment management.', skills: ['CI/CD', 'Docker', 'AWS', 'Linux'], category: 'DevOps & Cloud', budget: 800, auctionType: 'OPEN_BID', domain: 'devops' },
  { title: 'Infrastructure as Code với Terraform GCP', description: 'IaC cho GCP: GKE, Cloud SQL, VPC, IAM, Cloud CDN, secrets management, state backend.', skills: ['Terraform', 'GCP', 'Kubernetes', 'CI/CD'], category: 'DevOps & Cloud', budget: 1500, auctionType: 'SEALED_BID', domain: 'devops' },
  { title: 'Security Audit & Hardening Linux Server', description: 'Audit bảo mật server Ubuntu, hardening, WAF Nginx, intrusion detection, SSL/TLS config.', skills: ['Linux', 'Nginx', 'Docker', 'AWS'], category: 'DevOps & Cloud', budget: 600, auctionType: 'OPEN_BID', domain: 'devops' },
  { title: 'Monitoring Stack Prometheus + Grafana + Alerting', description: 'Observability stack: Prometheus metrics, Grafana dashboards, log aggregation ELK, alert rules PagerDuty.', skills: ['Docker', 'Linux', 'GCP', 'CI/CD'], category: 'DevOps & Cloud', budget: 1000, auctionType: 'SEALED_BID', domain: 'devops' },
];

// ─── Freelancer templates per domain ─────────────────────────────────────────
interface FreelancerTemplate {
  name: string;
  domain: Domain;
  extraSkills?: string[];
  experience: string;
  hourlyRate: number;
  bio: string;
}

const FL_TEMPLATES: FreelancerTemplate[] = [
  // Frontend (10)
  { name: 'Nguyễn Anh Tuấn', domain: 'frontend', extraSkills: ['NestJS'], experience: '4 years', hourlyRate: 35, bio: 'Senior React/Next.js developer. Built 10+ production SaaS apps.' },
  { name: 'Trần Minh Khôi', domain: 'frontend', extraSkills: ['TypeScript'], experience: '3 years', hourlyRate: 28, bio: 'Frontend developer chuyên React và Tailwind CSS. UX-minded coder.' },
  { name: 'Lê Thị Thu Hà', domain: 'frontend', extraSkills: [], experience: '5 years', hourlyRate: 40, bio: 'Senior Frontend engineer, chuyên Next.js App Router và performance optimization.' },
  { name: 'Phạm Đức Thịnh', domain: 'frontend', extraSkills: ['NestJS'], experience: '2 years', hourlyRate: 22, bio: 'Junior fullstack dev, React + Node.js. Đam mê UI đẹp và code clean.' },
  { name: 'Đỗ Hải Yến', domain: 'frontend', extraSkills: [], experience: '6 years', hourlyRate: 50, bio: 'React Native & React web developer. Đã publish 3 app lên Store.' },
  { name: 'Hoàng Văn Bình', domain: 'frontend', extraSkills: ['TypeScript'], experience: '3 years', hourlyRate: 30, bio: 'Frontend dev Vue.js và React. Chuyên làm dashboard và data visualization.' },
  { name: 'Vũ Thanh Hương', domain: 'frontend', extraSkills: [], experience: '4 years', hourlyRate: 33, bio: 'Angular developer, enterprise apps. TypeScript và RxJS proficient.' },
  { name: 'Bùi Quang Dũng', domain: 'frontend', extraSkills: ['NestJS'], experience: '5 years', hourlyRate: 42, bio: 'Fullstack JS developer. Next.js + NestJS là combo chính.' },
  { name: 'Ngô Thị Phương', domain: 'frontend', extraSkills: [], experience: '2 years', hourlyRate: 20, bio: 'Junior React dev. Học nhanh, code cẩn thận, chú trọng accessibility.' },
  { name: 'Đinh Trung Nam', domain: 'frontend', extraSkills: [], experience: '7 years', hourlyRate: 55, bio: 'Lead frontend engineer. React performance expert, micro-frontends architect.' },
  // Backend (10)
  { name: 'Trịnh Quốc Hùng', domain: 'backend', extraSkills: ['Docker'], experience: '5 years', hourlyRate: 40, bio: 'NestJS expert, đã xây 20+ REST/GraphQL APIs production. PostgreSQL optimization.' },
  { name: 'Lý Văn Long', domain: 'backend', extraSkills: [], experience: '4 years', hourlyRate: 35, bio: 'Node.js/Express backend dev. Database design và query optimization.' },
  { name: 'Mai Thị Hồng', domain: 'backend', extraSkills: ['Python'], experience: '3 years', hourlyRate: 30, bio: 'Backend dev NestJS và Python. API design, microservices, event-driven.' },
  { name: 'Phan Anh Vũ', domain: 'backend', extraSkills: [], experience: '6 years', hourlyRate: 48, bio: 'Senior backend engineer. Scalable systems architect, Redis caching expert.' },
  { name: 'Cao Văn Đức', domain: 'backend', extraSkills: ['Docker'], experience: '4 years', hourlyRate: 36, bio: 'Java Spring Boot + PostgreSQL. Enterprise backend, banking domain experience.' },
  { name: 'Dương Thị Nga', domain: 'backend', extraSkills: ['GraphQL'], experience: '3 years', hourlyRate: 28, bio: 'Python Django + PostgreSQL. REST API và data processing pipelines.' },
  { name: 'Nguyễn Thế Vinh', domain: 'backend', extraSkills: [], experience: '5 years', hourlyRate: 42, bio: 'NestJS microservices, event sourcing, CQRS pattern. Kubernetes deployment.' },
  { name: 'Trần Đức Anh', domain: 'backend', extraSkills: [], experience: '2 years', hourlyRate: 22, bio: 'Junior backend dev Node.js. Eager learner, strong in algorithms.' },
  { name: 'Vương Minh Tú', domain: 'backend', extraSkills: ['Redis'], experience: '4 years', hourlyRate: 37, bio: 'GraphQL API specialist. Schema-first design, DataLoader, federation.' },
  { name: 'Đặng Văn Khoa', domain: 'backend', extraSkills: [], experience: '7 years', hourlyRate: 58, bio: 'Staff engineer. Distributed systems, high-availability, performance at scale.' },
  // Mobile (8)
  { name: 'Phan Quốc Khánh', domain: 'mobile', extraSkills: [], experience: '4 years', hourlyRate: 38, bio: 'React Native dev iOS+Android. Payment integration (VNPAY, MoMo, Stripe).' },
  { name: 'Lưu Thị Bích', domain: 'mobile', extraSkills: [], experience: '3 years', hourlyRate: 30, bio: 'Flutter developer. Beautiful animations, complex UI, Firebase integration.' },
  { name: 'Tô Minh Tuấn', domain: 'mobile', extraSkills: ['Swift'], experience: '5 years', hourlyRate: 45, bio: 'Native iOS developer. SwiftUI + UIKit. Published 8 apps on App Store.' },
  { name: 'Hà Thị Linh', domain: 'mobile', extraSkills: [], experience: '3 years', hourlyRate: 32, bio: 'Android Kotlin dev. Material Design, Jetpack Compose, Play Store deployment.' },
  { name: 'Chu Văn Tài', domain: 'mobile', extraSkills: ['TypeScript'], experience: '4 years', hourlyRate: 35, bio: 'React Native developer. TypeScript, Redux, react-navigation expert.' },
  { name: 'Kiều Thị Kim', domain: 'mobile', extraSkills: [], experience: '2 years', hourlyRate: 25, bio: 'Flutter junior dev. Dart, Firebase, BLoC pattern. Fast learner.' },
  { name: 'Lương Đức Thắng', domain: 'mobile', extraSkills: ['Firebase'], experience: '5 years', hourlyRate: 43, bio: 'Cross-platform mobile lead. React Native + Flutter experience both.' },
  { name: 'Ngô Văn Toàn', domain: 'mobile', extraSkills: [], experience: '6 years', hourlyRate: 52, bio: 'Senior iOS/Android dev. Complex animations, ARKit, push notifications, in-app purchase.' },
  // Design (7)
  { name: 'Bùi Thị Bảo Châu', domain: 'design', extraSkills: [], experience: '4 years', hourlyRate: 30, bio: 'UI/UX Designer chuyên SaaS products. Figma expert, design system architect.' },
  { name: 'Trương Minh Khải', domain: 'design', extraSkills: ['Illustrator'], experience: '5 years', hourlyRate: 35, bio: 'Product designer. UX research, wireframing, high-fidelity prototyping Figma.' },
  { name: 'Nguyễn Thị Mỹ Linh', domain: 'design', extraSkills: [], experience: '3 years', hourlyRate: 25, bio: 'UI designer, landing pages and mobile apps. Aesthetic-focused, fast delivery.' },
  { name: 'Phùng Văn Thành', domain: 'design', extraSkills: ['Photoshop'], experience: '6 years', hourlyRate: 42, bio: 'Senior product designer. Brand identity, design systems, fintech UX specialist.' },
  { name: 'Đinh Thị Thu Trang', domain: 'design', extraSkills: ['Sketch'], experience: '4 years', hourlyRate: 32, bio: 'UX/UI designer. User research, usability testing, interaction design.' },
  { name: 'Lê Minh Phú', domain: 'design', extraSkills: [], experience: '2 years', hourlyRate: 20, bio: 'Junior UI designer. Figma, prototyping. Clean minimalist style.' },
  { name: 'Trần Thị Quỳnh Anh', domain: 'design', extraSkills: ['Illustrator', 'Photoshop'], experience: '7 years', hourlyRate: 50, bio: 'Creative director. Brand identity, visual storytelling, full design system.' },
  // DevOps (5)
  { name: 'Nguyễn Công Hoàng', domain: 'devops', extraSkills: [], experience: '5 years', hourlyRate: 50, bio: 'DevOps engineer. AWS certified, Kubernetes admin, CI/CD pipelines expert.' },
  { name: 'Lê Duy Khánh', domain: 'devops', extraSkills: [], experience: '4 years', hourlyRate: 45, bio: 'SRE/DevOps. Terraform IaC, GCP architect, observability stack (Prometheus/Grafana).' },
  { name: 'Phạm Tiến Đạt', domain: 'devops', extraSkills: ['Docker'], experience: '3 years', hourlyRate: 38, bio: 'DevOps junior-mid. Docker, CI/CD GitHub Actions, Linux server management.' },
  { name: 'Vũ Hoàng Giang', domain: 'devops', extraSkills: [], experience: '6 years', hourlyRate: 60, bio: 'Senior cloud architect. Multi-cloud (AWS+GCP), cost optimization, FinOps.' },
  { name: 'Tạ Thị Hoa', domain: 'devops', extraSkills: [], experience: '4 years', hourlyRate: 42, bio: 'Security-focused DevOps. Zero-trust networking, compliance, secrets management.' },
  // Data (5)
  { name: 'Đỗ Xuân Phúc', domain: 'data', extraSkills: [], experience: '4 years', hourlyRate: 42, bio: 'Data scientist. NLP, computer vision, TensorFlow/PyTorch, production ML pipelines.' },
  { name: 'Trịnh Thị Lan Anh', domain: 'data', extraSkills: [], experience: '5 years', hourlyRate: 48, bio: 'ML engineer. MLOps, model serving, A/B testing frameworks, Airflow pipelines.' },
  { name: 'Hứa Văn Thanh', domain: 'data', extraSkills: ['SQL'], experience: '3 years', hourlyRate: 33, bio: 'Data analyst. Power BI, Tableau, SQL, ETL pipelines, business intelligence.' },
  { name: 'Phan Thị Xuân', domain: 'data', extraSkills: ['Pandas'], experience: '4 years', hourlyRate: 40, bio: 'Data engineer. Apache Spark, dbt, Airflow, Redshift DWH, AWS data stack.' },
  { name: 'Lương Chí Trung', domain: 'data', extraSkills: [], experience: '6 years', hourlyRate: 55, bio: 'Head of Data. Strategic data initiatives, team lead, ML platform architect.' },
];

// ─── Domain relevance: which freelancer domains match which job domain ────────
const DOMAIN_RELEVANCE: Record<Domain, Record<Domain, number>> = {
  frontend:  { frontend: 1.0, backend: 0.3, mobile: 0.2, design: 0.2, devops: 0.1, data: 0.0 },
  backend:   { frontend: 0.2, backend: 1.0, mobile: 0.1, design: 0.0, devops: 0.3, data: 0.2 },
  mobile:    { frontend: 0.3, backend: 0.1, mobile: 1.0, design: 0.1, devops: 0.0, data: 0.0 },
  design:    { frontend: 0.1, backend: 0.0, mobile: 0.1, design: 1.0, devops: 0.0, data: 0.0 },
  devops:    { frontend: 0.0, backend: 0.3, mobile: 0.0, design: 0.0, devops: 1.0, data: 0.1 },
  data:      { frontend: 0.0, backend: 0.2, mobile: 0.0, design: 0.0, devops: 0.1, data: 1.0 },
};

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function main() {
  console.log('🌱 Seeding large dataset for algorithm evaluation...\n');

  const password = await bcrypt.hash('Password123!', 10);

  // ── Ensure roles & categories exist ────────────────────────────────────────
  const clientRoleRecord = await prisma.role.upsert({ where: { name: 'CLIENT' }, update: {}, create: { name: 'CLIENT' } });
  const flRoleRecord = await prisma.role.upsert({ where: { name: 'FREELANCER' }, update: {}, create: { name: 'FREELANCER' } });

  const catNames = ['Web Development', 'Mobile Development', 'UI/UX Design', 'Digital Marketing', 'Writing & Translation', 'Video & Animation', 'Data & AI', 'DevOps & Cloud'];
  const catMap: Record<string, string> = {};
  for (const name of catNames) {
    const c = await prisma.category.upsert({ where: { name }, update: {}, create: { name, description: name } });
    catMap[name] = c.id;
  }

  // ── 20 Clients ─────────────────────────────────────────────────────────────
  console.log('Creating 20 client users...');
  const clientIds: string[] = [];
  const clientBios = [
    'Startup founder building a SaaS platform for SMEs.',
    'E-commerce entrepreneur scaling a fashion brand online.',
    'Digital marketing agency owner, need dev help for client projects.',
    'Product manager at a fintech company, leading digital transformation.',
    'CEO of an EdTech startup, building learning management systems.',
    'Founder of a healthcare startup focused on telemedicine solutions.',
    'Operations manager automating internal business processes.',
    'Restaurant chain owner digitalizing ordering and POS systems.',
    'Real estate developer creating a property listing platform.',
    'Non-profit director building donation and volunteer management tools.',
    'Insurance company CTO modernizing legacy systems.',
    'Logistics startup founder tracking deliveries in real-time.',
    'HR tech startup building AI-powered recruitment platform.',
    'Travel agency owner creating booking and tour management software.',
    'Legal tech founder building document automation tools.',
    'Manufacturing company CIO implementing ERP system.',
    'Retail chain manager building customer loyalty programs.',
    'Event management company digitalizing registration and ticketing.',
    'Publishing house building digital content management platform.',
    'Consulting firm manager building client reporting dashboards.',
  ];
  for (let i = 0; i < 20; i++) {
    const idx = String(i + 1).padStart(2, '0');
    const email = `large-client-${idx}@bidwise.dev`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: password,
        fullName: `Client Lớn ${idx}`,
        bio: clientBios[i] ?? 'Business owner looking for skilled freelancers.',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: clientRoleRecord.id } },
      update: {},
      create: { userId: user.id, roleId: clientRoleRecord.id },
    });
    clientIds.push(user.id);
  }

  // ── 50 Freelancers ─────────────────────────────────────────────────────────
  console.log('Creating 50 freelancer users + profiles...');
  const freelancers: { id: string; domain: Domain; skills: string[] }[] = [];

  for (let i = 0; i < FL_TEMPLATES.length; i++) {
    const tmpl = FL_TEMPLATES[i];
    const idx = String(i + 1).padStart(2, '0');
    const email = `large-fl-${idx}@bidwise.dev`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: password,
        fullName: tmpl.name,
        bio: tmpl.bio,
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: flRoleRecord.id } },
      update: {},
      create: { userId: user.id, roleId: flRoleRecord.id },
    });

    const skills = pickSkills(tmpl.domain, randInt(4, 6), tmpl.extraSkills ?? []);
    const assessScore = tmpl.hourlyRate >= 40 ? randInt(75, 95) : (tmpl.hourlyRate >= 28 ? randInt(55, 80) : randInt(35, 60));
    const tier = tmpl.hourlyRate >= 45 ? 'GOLD' : tmpl.hourlyRate >= 30 ? 'SILVER' : 'NEW';

    const profile = await prisma.freelancerProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        hourlyRate: tmpl.hourlyRate,
        experience: tmpl.experience,
        skills,
        available: true,
        bidTokens: tier === 'GOLD' ? 30 : tier === 'SILVER' ? 15 : 5,
        assessmentCompleted: assessScore > 0,
        assessmentScore: assessScore,
        assessmentLevel: assessScore >= 80 ? 'SENIOR' : assessScore >= 60 ? 'INTERMEDIATE' : 'JUNIOR',
        reputationTier: tier,
      },
    });

    // Portfolio items (0-2 per freelancer)
    const portfolioCount = randInt(1, 3);
    const portfolioTitles = [
      ['SaaS Dashboard App', 'Built with React, NestJS, and PostgreSQL for B2B clients.'],
      ['E-Commerce Platform', 'Full-stack online store with payment integration and admin panel.'],
      ['Mobile Banking App', 'React Native app with biometric auth and real-time transactions.'],
      ['Analytics Dashboard', 'Data visualization platform with 50+ chart types and real-time data.'],
      ['API Gateway Service', 'Microservices gateway handling 100K+ requests per day.'],
      ['Figma Design System', '200+ component library used across 5 product teams.'],
      ['ML Recommendation Engine', 'Collaborative filtering system increasing CTR by 30%.'],
      ['DevOps Platform', 'Internal developer platform on Kubernetes with GitOps workflow.'],
    ];
    for (let p = 0; p < portfolioCount; p++) {
      const pt = portfolioTitles[randInt(0, portfolioTitles.length - 1)];
      await prisma.portfolioItem.create({
        data: {
          freelancerProfileId: profile.id,
          title: pt[0],
          desc: pt[1],
          linkType: 'github',
        },
      });
    }

    freelancers.push({ id: user.id, domain: tmpl.domain, skills });
  }

  // ── 50 Jobs ───────────────────────────────────────────────────────────────
  console.log('Creating 50 jobs...');
  const jobs: { id: string; domain: Domain; skills: string[]; budget: number }[] = [];

  for (let i = 0; i < JOB_TEMPLATES.length; i++) {
    const tmpl = JOB_TEMPLATES[i];
    const idx = String(i + 1).padStart(2, '0');
    const jobId = `large-job-${idx}`;
    const clientId = clientIds[i % clientIds.length];

    const status = i < 40 ? 'OPEN' : 'IN_PROGRESS';
    const deadlineDays = randInt(14, 60);

    const job = await prisma.job.upsert({
      where: { id: jobId },
      update: {},
      create: {
        id: jobId,
        clientId,
        title: tmpl.title,
        description: tmpl.description,
        budgetFormat: 'FIXED',
        fixedBudget: tmpl.budget,
        budget: tmpl.budget,
        deadline: new Date(Date.now() + deadlineDays * 86400000),
        categoryId: catMap[tmpl.category] ?? catMap['Web Development'],
        auctionType: tmpl.auctionType,
        status,
        skills: tmpl.skills,
        ahpWeight: {
          create: {
            priceWeight: randInt(20, 40),
            skillWeight: randInt(20, 35),
            experienceWeight: randInt(10, 20),
            ratingWeight: randInt(5, 15),
            speedWeight: randInt(3, 10),
            deadlineWeight: randInt(3, 10),
            portfolioWeight: randInt(3, 10),
          },
        },
      },
    });

    jobs.push({ id: job.id, domain: tmpl.domain, skills: tmpl.skills, budget: tmpl.budget });
  }

  // ── ~300 Bids ─────────────────────────────────────────────────────────────
  console.log('Creating ~300 bids (including 20 template/spam bids)...');
  let totalBids = 0;
  let templateBids = 0;
  const contractCandidates: { jobId: string; freelancerId: string; amount: number; skills: string[] }[] = [];

  for (const job of jobs) {
    // Find 5-8 freelancers who are candidates for this job
    const candidates = freelancers.filter((fl) => {
      const relevance = DOMAIN_RELEVANCE[fl.domain][job.domain];
      return Math.random() < relevance + 0.15; // slight chance of cross-domain bids
    });

    // Take 5-8 candidates
    const selected = candidates.sort(() => Math.random() - 0.5).slice(0, randInt(5, 8));
    let bestScore = 0;
    let bestBidder: { id: string; amount: number; skills: string[] } | null = null;

    for (const fl of selected) {
      // Avoid duplicate bids on same job (upsert)
      const amount = Math.round(job.budget * (0.6 + Math.random() * 0.6));
      const deliveryDays = randInt(7, 45);

      // ~7% of bids are template spam
      const isTemplate = templateBids < 20 && Math.random() < 0.07;
      const coverLetter = isTemplate
        ? makeTemplateVariant('Client')
        : makeGenuineLetter(fl.id.slice(0, 8), fl.skills, job.id);

      const sharedSkills = fl.skills.filter((s) =>
        job.skills.some((js) => js.toLowerCase() === s.toLowerCase()),
      );
      const skillScore = Math.min(50, (sharedSkills.length / Math.max(job.skills.length, 1)) * 50);
      const budgetScore = amount <= job.budget ? randInt(20, 30) : randInt(5, 15);
      const matchingScore = Math.round(skillScore + budgetScore + randInt(0, 20));

      try {
        await prisma.bid.upsert({
          where: { jobId_freelancerId: { jobId: job.id, freelancerId: fl.id } },
          update: {},
          create: {
            jobId: job.id,
            freelancerId: fl.id,
            amount,
            deliveryDays,
            proposal: `Tôi có kinh nghiệm phù hợp với dự án này: ${fl.skills.slice(0, 3).join(', ')}.`,
            days: deliveryDays,
            coverLetter,
            status: 'PENDING',
            matchingScore,
            matchBreakdown: {
              skills: { matched: sharedSkills, score: skillScore },
              budget: { score: budgetScore, withinBudget: amount <= job.budget },
            },
          },
        });
        totalBids++;
        if (isTemplate) templateBids++;

        if (matchingScore > bestScore && job.id.startsWith('large-job-0') && parseInt(job.id.slice(-2)) <= 25) {
          bestScore = matchingScore;
          bestBidder = { id: fl.id, amount, skills: fl.skills };
        }
      } catch {
        // skip duplicate
      }
    }

    if (bestBidder) {
      contractCandidates.push({ jobId: job.id, freelancerId: bestBidder.id, amount: bestBidder.amount, skills: bestBidder.skills });
    }
  }

  // ── 25 Contracts ──────────────────────────────────────────────────────────
  console.log('Creating 25 contracts + milestones...');
  let contractCount = 0;

  for (const candidate of contractCandidates.slice(0, 25)) {
    const job = jobs.find((j) => j.id === candidate.jobId);
    if (!job) continue;

    // Update bid status
    await prisma.bid.updateMany({
      where: { jobId: candidate.jobId, freelancerId: candidate.freelancerId },
      data: { status: 'ACCEPTED' },
    });
    await prisma.job.update({ where: { id: candidate.jobId }, data: { status: 'IN_PROGRESS' } });

    const clientId = clientIds[jobs.indexOf(job) % clientIds.length];
    const bid = await prisma.bid.findFirst({ where: { jobId: candidate.jobId, freelancerId: candidate.freelancerId } });
    if (!bid) continue;

    const existingContract = await prisma.contract.findFirst({ where: { bidId: bid.id } });
    if (existingContract) continue;

    const contract = await prisma.contract.create({
      data: {
        jobId: candidate.jobId,
        bidId: bid.id,
        clientId,
        freelancerId: candidate.freelancerId,
        title: `Contract for ${candidate.jobId}`,
        description: `Development contract for ${job.domain} project.`,
        totalAmount: candidate.amount,
        status: contractCount < 10 ? 'COMPLETED' : 'ACTIVE',
        startDate: new Date(Date.now() - randInt(5, 30) * 86400000),
        autoApprovalDays: 5,
      },
    });

    const isCompleted = contractCount < 10;

    await prisma.milestone.createMany({
      data: [
        {
          contractId: contract.id,
          order: 1,
          title: 'Phase 1 — Setup & Core',
          description: 'Project setup, architecture, core feature development.',
          amount: Math.round(candidate.amount * 0.4),
          percentage: 40,
          deadline: new Date(Date.now() + 14 * 86400000),
          status: isCompleted ? ('APPROVED' as const) : ('SUBMITTED' as const),
          maxRevisions: 3,
          ...(isCompleted ? { approvedAt: new Date(Date.now() - 5 * 86400000) } : { submittedAt: new Date() }),
        },
        {
          contractId: contract.id,
          order: 2,
          title: 'Phase 2 — Features & Delivery',
          description: 'Complete remaining features, testing, deployment.',
          amount: Math.round(candidate.amount * 0.6),
          percentage: 60,
          deadline: new Date(Date.now() + 30 * 86400000),
          status: isCompleted ? ('APPROVED' as const) : ('NOT_STARTED' as const),
          maxRevisions: 3,
          ...(isCompleted ? { approvedAt: new Date(Date.now() - 2 * 86400000) } : {}),
        },
      ],
    });

    // For completed contracts: add SkillClusterReputation update
    if (contractCount < 10) {
      const rating = randInt(3, 5);
      const clusters = candidate.skills.map((s) => s.toLowerCase());
      const clusterMap: Record<string, string[]> = {
        frontend: ['react', 'vue.js', 'angular', 'next.js', 'typescript', 'tailwind css', 'redux', 'css', 'html', 'sass'],
        backend: ['nestjs', 'node.js', 'python', 'django', 'express.js', 'postgresql', 'mysql', 'redis', 'graphql', 'rest api'],
        mobile: ['react native', 'flutter', 'ios', 'android', 'swift', 'dart', 'firebase', 'kotlin'],
        design: ['figma', 'adobe xd', 'ui/ux', 'photoshop', 'illustrator', 'sketch', 'prototyping'],
        devops: ['docker', 'kubernetes', 'aws', 'gcp', 'ci/cd', 'terraform', 'linux', 'nginx'],
        data: ['machine learning', 'tensorflow', 'python', 'pandas', 'sql', 'tableau', 'power bi', 'scikit-learn'],
      };

      for (const [clusterName, clusterSkills] of Object.entries(clusterMap)) {
        if (clusters.some((c) => clusterSkills.includes(c))) {
          const existing = await prisma.skillClusterReputation.findFirst({
            where: { freelancerId: candidate.freelancerId, skillCluster: clusterName },
          });
          if (existing) {
            await prisma.skillClusterReputation.update({
              where: { id: existing.id },
              data: {
                score: Math.round((existing.score * 0.8 + rating * 0.2) * 100) / 100,
                reviewCount: existing.reviewCount + 1,
                              },
            });
          } else {
            await prisma.skillClusterReputation.create({
              data: {
                freelancerId: candidate.freelancerId,
                skillCluster: clusterName,
                score: rating,
                reviewCount: 1,
                              },
            });
          }
          break; // one cluster per contract for simplicity
        }
      }
    }

    contractCount++;
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const counts = {
    users: await prisma.user.count(),
    profiles: await prisma.freelancerProfile.count(),
    jobs: await prisma.job.count(),
    bids: await prisma.bid.count(),
    contracts: await prisma.contract.count(),
    milestones: await prisma.milestone.count(),
    reputations: await prisma.skillClusterReputation.count(),
  };

  console.log('\n🎉 Large seed complete!\n');
  console.log('─'.repeat(50));
  console.log('📊 Database totals:');
  Object.entries(counts).forEach(([k, v]) => console.log(`  • ${k}: ${v}`));
  console.log(`  • Template bids created: ${templateBids}`);
  console.log('─'.repeat(50));
  console.log('\nAll freelancer login: large-fl-01@bidwise.dev … large-fl-50@bidwise.dev');
  console.log('All client login:     large-client-01@bidwise.dev … large-client-20@bidwise.dev');
  console.log('Password: Password123!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
