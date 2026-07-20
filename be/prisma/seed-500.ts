/**
 * seed-500.ts — BidWise Feature-5 Test Dataset
 *
 * Creates a clean 500-freelancer / 500-bid dataset for algorithm evaluation.
 * Runs full clear of old seed-large data first.
 *
 * Run: npx ts-node -r tsconfig-paths/register prisma/seed-500.ts
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Vietnamese name pools ────────────────────────────────────────────────────
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Phan', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Trịnh', 'Cao', 'Tô', 'Lưu', 'Mai', 'Hà', 'Kiều', 'Vương', 'Tạ', 'Chu'];
const DEM_NAM = ['Văn', 'Hữu', 'Minh', 'Anh', 'Đức', 'Tuấn', 'Hoàng', 'Công', 'Quốc', 'Đình', 'Duy', 'Tiến', 'Trung', 'Thanh', 'Xuân', 'Phú', 'Gia', 'Hải', 'Kim', 'Bảo'];
const TEN_NAM = ['Hùng', 'Dũng', 'Tuấn', 'Nam', 'Hải', 'Bình', 'Long', 'Phong', 'Sơn', 'Thành', 'Cường', 'Đức', 'Khoa', 'Toàn', 'Tài', 'Vinh', 'Hưng', 'Lâm', 'Trung', 'Huy', 'Duy', 'Minh', 'Quân', 'Phúc', 'Thịnh', 'Tùng', 'Hậu', 'Kiên', 'Khải', 'Thiện'];
const DEM_NU = ['Thị', 'Ngọc', 'Thu', 'Bích', 'Lan', 'Mai', 'Hoa', 'Hương', 'Linh', 'Yến', 'Kim', 'Bảo', 'Thanh', 'Ngân', 'Dung', 'Hà', 'Hồng', 'Trân'];
const TEN_NU = ['Hà', 'Linh', 'Mai', 'Lan', 'Thảo', 'Trang', 'Hương', 'Ngân', 'Hoa', 'Yến', 'Phương', 'Vân', 'Thủy', 'Quỳnh', 'Thùy', 'Dung', 'Lệ', 'Trâm', 'Châu', 'Nhi', 'My', 'Loan'];

function generateName(i: number): string {
  const isFemale = i % 3 === 0;
  const ho = HO[i % HO.length];
  if (isFemale) {
    const dem = DEM_NU[Math.floor(i / HO.length) % DEM_NU.length];
    const ten = TEN_NU[Math.floor(i / (HO.length * DEM_NU.length)) % TEN_NU.length];
    return `${ho} ${dem} ${ten}`;
  }
  const dem = DEM_NAM[Math.floor(i / HO.length) % DEM_NAM.length];
  const ten = TEN_NAM[Math.floor(i / (HO.length * DEM_NAM.length)) % TEN_NAM.length];
  return `${ho} ${dem} ${ten}`;
}

// ─── Skill pools per domain ───────────────────────────────────────────────────
const SKILLS: Record<string, string[]> = {
  frontend: ['React', 'Vue.js', 'Angular', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Redux', 'CSS', 'HTML', 'SASS', 'Svelte', 'Nuxt.js'],
  backend:  ['NestJS', 'Node.js', 'Python', 'Django', 'Express.js', 'PostgreSQL', 'MySQL', 'Redis', 'GraphQL', 'REST API', 'Java', 'Spring Boot'],
  mobile:   ['React Native', 'Flutter', 'iOS', 'Android', 'Swift', 'Dart', 'Firebase', 'Kotlin', 'Xamarin'],
  design:   ['Figma', 'Adobe XD', 'UI/UX', 'Photoshop', 'Illustrator', 'Sketch', 'Prototyping', 'Zeplin'],
  devops:   ['Docker', 'Kubernetes', 'AWS', 'GCP', 'CI/CD', 'Terraform', 'Linux', 'Nginx', 'Azure', 'Ansible'],
  data:     ['Machine Learning', 'TensorFlow', 'Python', 'Pandas', 'SQL', 'Tableau', 'Power BI', 'Scikit-learn', 'PyTorch', 'Apache Spark'],
};

type Domain = keyof typeof SKILLS;

function pickSkills(domain: Domain, n: number, extras: string[] = []): string[] {
  const pool = [...SKILLS[domain]];
  const picked = pool.sort(() => Math.random() - 0.5).slice(0, n);
  return [...new Set([...picked, ...extras])];
}

// ─── 100 job templates ────────────────────────────────────────────────────────
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
  // Web / Frontend (25)
  { title: 'Dashboard Admin SaaS với Next.js 14 + TypeScript', description: 'Xây dựng admin dashboard B2B: RBAC, analytics, billing. Stack: Next.js 14 App Router, NestJS API, PostgreSQL, Shadcn UI.', skills: ['React', 'Next.js', 'NestJS', 'PostgreSQL', 'TypeScript'], category: 'Web Development', budget: 1500, auctionType: 'SEALED_BID', domain: 'frontend' },
  { title: 'E-Commerce Platform Fullstack React + NestJS', description: 'Platform thương mại điện tử hoàn chỉnh: sản phẩm, giỏ hàng, thanh toán VNPAY, quản lý đơn hàng, seller dashboard.', skills: ['React', 'NestJS', 'PostgreSQL', 'Redis', 'TypeScript'], category: 'Web Development', budget: 2200, auctionType: 'SEALED_BID', domain: 'frontend' },
  { title: 'Landing Page High-Performance Next.js', description: 'Landing page tối ưu Core Web Vitals (Lighthouse 95+), SEO, CMS headless Contentful, responsive toàn thiết bị.', skills: ['Next.js', 'Tailwind CSS', 'TypeScript', 'CSS'], category: 'Web Development', budget: 600, auctionType: 'OPEN_BID', domain: 'frontend' },
  { title: 'Real-time Chat App với Socket.io + NestJS', description: 'Chat application: phòng chat, direct message, file upload, read receipts, online status, push notifications.', skills: ['Node.js', 'Redis', 'PostgreSQL', 'TypeScript', 'NestJS'], category: 'Web Development', budget: 900, auctionType: 'SEALED_BID', domain: 'backend' },
  { title: 'Blog CMS Headless Architecture (Next.js + NestJS)', description: 'Headless CMS với Next.js frontend, NestJS admin panel, Markdown editor, tag system, SEO tools, sitemap.', skills: ['Next.js', 'NestJS', 'PostgreSQL', 'TypeScript'], category: 'Web Development', budget: 800, auctionType: 'OPEN_BID', domain: 'frontend' },
  { title: 'Warehouse ERP System — Quản lý Kho', description: 'ERP module: quản lý tồn kho, purchase orders, sales orders, barcode scanning, báo cáo tự động.', skills: ['React', 'NestJS', 'PostgreSQL', 'TypeScript', 'Redis'], category: 'Web Development', budget: 2000, auctionType: 'SEALED_BID', domain: 'backend' },
  { title: 'Multi-tenant SaaS Backend với NestJS + GraphQL', description: 'Backend SaaS multi-tenant: tenant isolation, subscription plans, usage limits, webhooks, audit logs.', skills: ['NestJS', 'PostgreSQL', 'Redis', 'GraphQL', 'TypeScript'], category: 'Web Development', budget: 1800, auctionType: 'SEALED_BID', domain: 'backend' },
  { title: 'React Component Library với Storybook + TypeScript', description: 'UI Component library: 60+ components, TypeScript types, Storybook docs, npm publish, WCAG 2.1 compliance.', skills: ['React', 'TypeScript', 'CSS', 'SASS', 'Tailwind CSS'], category: 'Web Development', budget: 700, auctionType: 'OPEN_BID', domain: 'frontend' },
  { title: 'Fintech Web App: KYC + Wallet + Transfers', description: 'Ứng dụng fintech: onboarding KYC, ví điện tử, chuyển khoản, lịch sử giao dịch, PDF statements.', skills: ['React', 'NestJS', 'PostgreSQL', 'TypeScript', 'Redis'], category: 'Web Development', budget: 2500, auctionType: 'SEALED_BID', domain: 'frontend' },
  { title: 'GraphQL Social Network API với NestJS', description: 'GraphQL API: users, posts, comments, likes, follows, feed thuật toán, notifications real-time.', skills: ['NestJS', 'GraphQL', 'PostgreSQL', 'Redis', 'TypeScript'], category: 'Web Development', budget: 1400, auctionType: 'SEALED_BID', domain: 'backend' },
  { title: 'Vue.js 3 HR Management SPA', description: 'SPA Vue 3 Composition API: nhân viên, chấm công, nghỉ phép, payroll, org chart, export Excel.', skills: ['Vue.js', 'TypeScript', 'REST API', 'CSS'], category: 'Web Development', budget: 1100, auctionType: 'OPEN_BID', domain: 'frontend' },
  { title: 'Microservices với Docker + Kubernetes', description: 'Tách monolith → microservices, deploy Kubernetes, service mesh Istio, distributed tracing, observability.', skills: ['NestJS', 'Docker', 'Kubernetes', 'PostgreSQL', 'Redis'], category: 'Web Development', budget: 3000, auctionType: 'SEALED_BID', domain: 'devops' },
  { title: 'B2C E-Commerce Website với Next.js + NestJS', description: 'Website thương mại B2C đầy đủ: sản phẩm, giỏ hàng, checkout, payment gateway, order tracking.', skills: ['Next.js', 'NestJS', 'PostgreSQL', 'TypeScript', 'Redis'], category: 'Web Development', budget: 2200, auctionType: 'SEALED_BID', domain: 'frontend' },
  { title: 'Web Scraper & Data Pipeline với Puppeteer', description: 'Scraper Puppeteer/Playwright, data cleaning pipeline, lưu PostgreSQL, dashboard Grafana, scheduling.', skills: ['Node.js', 'PostgreSQL', 'Python', 'REST API'], category: 'Web Development', budget: 650, auctionType: 'OPEN_BID', domain: 'backend' },
  { title: 'Angular 17 Enterprise Application', description: 'Angular 17 enterprise app: complex forms, data grid, PDF export, RBAC UI, i18n đa ngôn ngữ.', skills: ['Angular', 'TypeScript', 'CSS', 'REST API'], category: 'Web Development', budget: 1300, auctionType: 'SEALED_BID', domain: 'frontend' },
  { title: 'React Native E-Commerce App iOS + Android', description: 'App thương mại điện tử cross-platform: product listing, giỏ hàng, VNPAY/MoMo/Stripe, push notifications, offline mode.', skills: ['React Native', 'TypeScript', 'Firebase', 'iOS', 'Android'], category: 'Mobile Development', budget: 2500, auctionType: 'SEALED_BID', domain: 'mobile' },
  { title: 'Flutter Finance Tracker iOS + Android', description: 'App quản lý tài chính: thu/chi, danh mục, ngân sách, biểu đồ, xuất PDF, biometric auth, dark mode.', skills: ['Flutter', 'Dart', 'Firebase'], category: 'Mobile Development', budget: 1200, auctionType: 'OPEN_BID', domain: 'mobile' },
  { title: 'iOS Swift App Delivery Tracking Real-time', description: 'App iOS native: theo dõi đơn hàng trên bản đồ real-time, push notifications, driver/customer views, WebSocket.', skills: ['iOS', 'Swift', 'Firebase'], category: 'Mobile Development', budget: 1800, auctionType: 'SEALED_BID', domain: 'mobile' },
  { title: 'App Học Tiếng Anh Gamification React Native', description: 'App học ngôn ngữ: flashcards, speaking practice, leaderboard, streak system, offline mode, social sharing.', skills: ['React Native', 'TypeScript', 'Firebase', 'Android'], category: 'Mobile Development', budget: 2000, auctionType: 'SEALED_BID', domain: 'mobile' },
  { title: 'Android Kotlin POS Restaurant App', description: 'POS app Android: menu management, order taking, kitchen display, thanh toán VNPay/tiền mặt, báo cáo ngày.', skills: ['Android', 'Kotlin', 'Firebase'], category: 'Mobile Development', budget: 1500, auctionType: 'OPEN_BID', domain: 'mobile' },
  { title: 'React Native Social App cho Freelancers', description: 'Networking app: profile, portfolio, job feed, in-app messaging, video calls, skill endorsements.', skills: ['React Native', 'TypeScript', 'Firebase', 'iOS', 'Android'], category: 'Mobile Development', budget: 2800, auctionType: 'SEALED_BID', domain: 'mobile' },
  { title: 'Flutter Health & Fitness Tracker', description: 'Fitness app: workout plans, progress tracking, nutrition log, HealthKit/Google Fit, social challenges.', skills: ['Flutter', 'Dart', 'Firebase'], category: 'Mobile Development', budget: 1600, auctionType: 'SEALED_BID', domain: 'mobile' },
  { title: 'Cross-platform Booking App React Native', description: 'Service booking platform: providers, time slots, booking flow, payment, review system, push notifications.', skills: ['React Native', 'TypeScript', 'Firebase'], category: 'Mobile Development', budget: 2200, auctionType: 'SEALED_BID', domain: 'mobile' },
  { title: 'iOS Telemedicine Video Consultation App', description: 'Healthcare app iOS: doctor profiles, appointment booking, video call WebRTC, prescription PDF, rating.', skills: ['iOS', 'Swift', 'Firebase'], category: 'Mobile Development', budget: 3000, auctionType: 'SEALED_BID', domain: 'mobile' },
  { title: 'Android IoT Monitoring Dashboard', description: 'IoT monitoring Android: kết nối sensor qua MQTT, dashboard real-time, alert notifications, lịch sử biểu đồ.', skills: ['Android', 'Kotlin', 'Firebase'], category: 'Mobile Development', budget: 1400, auctionType: 'OPEN_BID', domain: 'mobile' },
  // UI/UX Design (15)
  { title: 'Design System B2B SaaS với Figma', description: 'Design system đầy đủ: tokens, 100+ components, Figma library, auto-layout, documentation, dark mode support.', skills: ['Figma', 'UI/UX', 'Prototyping'], category: 'UI/UX Design', budget: 1000, auctionType: 'SEALED_BID', domain: 'design' },
  { title: 'UX Research & Redesign App Ngân hàng', description: 'User research (interviews, usability tests), IA redesign, wireframes, high-fidelity mockups, Figma interactive prototype.', skills: ['Figma', 'UI/UX', 'Prototyping', 'Adobe XD'], category: 'UI/UX Design', budget: 1500, auctionType: 'SEALED_BID', domain: 'design' },
  { title: 'Landing Page Design cho AI Startup', description: 'Modern landing page cho AI startup: hero, features, pricing, testimonials, CTA — Figma deliverable, responsive.', skills: ['Figma', 'UI/UX', 'Prototyping'], category: 'UI/UX Design', budget: 500, auctionType: 'OPEN_BID', domain: 'design' },
  { title: 'Mobile App UI Kit Fintech (Figma)', description: 'UI kit fintech mobile: 100+ screens iOS/Android, component library, icon set, dark/light mode.', skills: ['Figma', 'UI/UX', 'Prototyping', 'Illustrator'], category: 'UI/UX Design', budget: 800, auctionType: 'SEALED_BID', domain: 'design' },
  { title: 'Brand Identity & Logo cho Startup', description: 'Brand identity package: logo, typography, màu sắc, business card, brand guidelines PDF, social media kit.', skills: ['Illustrator', 'Photoshop', 'Figma', 'Sketch'], category: 'UI/UX Design', budget: 400, auctionType: 'OPEN_BID', domain: 'design' },
  { title: 'SaaS Analytics Dashboard UI Design', description: 'Analytics dashboard UI: charts, tables, filters, dark/light mode, responsive Figma design, developer handoff.', skills: ['Figma', 'UI/UX', 'Prototyping'], category: 'UI/UX Design', budget: 700, auctionType: 'OPEN_BID', domain: 'design' },
  { title: 'E-Commerce UX Audit & Optimization', description: 'UX audit e-commerce, heuristic evaluation, A/B test proposals, checkout funnel optimization, accessibility review.', skills: ['Figma', 'UI/UX', 'Adobe XD'], category: 'UI/UX Design', budget: 600, auctionType: 'OPEN_BID', domain: 'design' },
  { title: 'Onboarding Flow Design EdTech App', description: '8-step onboarding flow, interactive Figma prototype, micro-animation specs, developer handoff với design tokens.', skills: ['Figma', 'UI/UX', 'Prototyping', 'Illustrator'], category: 'UI/UX Design', budget: 450, auctionType: 'OPEN_BID', domain: 'design' },
  { title: 'Admin Panel UI Design (Dark Theme)', description: 'Admin panel UI dark theme: sidebar navigation, data tables, cards, forms, Figma + Zeplin, pixel-perfect.', skills: ['Figma', 'UI/UX', 'Zeplin'], category: 'UI/UX Design', budget: 650, auctionType: 'SEALED_BID', domain: 'design' },
  { title: 'Mobile Game UI/UX Design', description: 'Game UI design: main menu, game screen, HUD, achievements, shop, settings — Figma deliverables.', skills: ['Figma', 'Illustrator', 'Photoshop'], category: 'UI/UX Design', budget: 900, auctionType: 'SEALED_BID', domain: 'design' },
  { title: 'Marketing Website Design + Prototype', description: 'Marketing website 8 trang: home, about, services, pricing, blog, contact — fully responsive Figma prototype.', skills: ['Figma', 'UI/UX', 'Prototyping'], category: 'UI/UX Design', budget: 550, auctionType: 'OPEN_BID', domain: 'design' },
  { title: 'Social Media App UI Full Design', description: 'Full UI social app: feed, profile, messages, stories, notifications, search — 60+ Figma screens.', skills: ['Figma', 'UI/UX', 'Prototyping', 'Illustrator'], category: 'UI/UX Design', budget: 1200, auctionType: 'SEALED_BID', domain: 'design' },
  { title: 'Healthcare Portal UX Design', description: 'UX design cho patient portal: booking, health records, prescription, teleconsult — WCAG 2.1 compliant.', skills: ['Figma', 'UI/UX', 'Adobe XD', 'Prototyping'], category: 'UI/UX Design', budget: 1100, auctionType: 'SEALED_BID', domain: 'design' },
  { title: 'Dashboard Widget Library Design', description: '30+ reusable dashboard widgets: charts, KPI cards, tables, maps — Figma component library với variants.', skills: ['Figma', 'UI/UX', 'Prototyping'], category: 'UI/UX Design', budget: 750, auctionType: 'OPEN_BID', domain: 'design' },
  { title: 'Design Token System + Figma Variables', description: 'Design token system: color, typography, spacing, border, shadow — Figma Variables + Style Dictionary config.', skills: ['Figma', 'UI/UX', 'Zeplin'], category: 'UI/UX Design', budget: 850, auctionType: 'SEALED_BID', domain: 'design' },
  // Data & AI (15)
  { title: 'NLP Sentiment Analysis API với Python + Flask', description: 'API phân tích cảm xúc đánh giá sản phẩm, model BERT fine-tuned, Docker deployment, 92%+ accuracy.', skills: ['Python', 'Machine Learning', 'TensorFlow', 'Pandas', 'SQL'], category: 'Data & AI', budget: 1200, auctionType: 'SEALED_BID', domain: 'data' },
  { title: 'Power BI Dashboard Retail Chain Analytics', description: 'Dashboard BI: KPIs bán hàng, inventory, customer segmentation RFM, dữ liệu từ SQL Server, refresh hàng ngày.', skills: ['Power BI', 'SQL', 'Python', 'Pandas'], category: 'Data & AI', budget: 800, auctionType: 'OPEN_BID', domain: 'data' },
  { title: 'Recommendation Engine E-Commerce (Hybrid)', description: 'Hybrid recommender: collaborative filtering + content-based, A/B test framework, FastAPI, A/B results dashboard.', skills: ['Python', 'Machine Learning', 'Pandas', 'SQL', 'Scikit-learn'], category: 'Data & AI', budget: 1500, auctionType: 'SEALED_BID', domain: 'data' },
  { title: 'RAG Chatbot Customer Service (GPT + LangChain)', description: 'Chatbot RAG tích hợp tài liệu nội bộ, LangChain, ChromaDB, NestJS backend, widget embed, handoff agent.', skills: ['Python', 'NestJS', 'PostgreSQL', 'Machine Learning'], category: 'Data & AI', budget: 2000, auctionType: 'SEALED_BID', domain: 'data' },
  { title: 'ETL Pipeline AWS Redshift DWH', description: 'ETL từ nhiều nguồn (REST, DB, S3) → Redshift DWH, dbt transformations, Airflow scheduling, data quality checks.', skills: ['Python', 'SQL', 'AWS', 'Pandas', 'Apache Spark'], category: 'Data & AI', budget: 1800, auctionType: 'SEALED_BID', domain: 'data' },
  { title: 'Computer Vision Defect Detection CNN', description: 'CNN model phát hiện lỗi sản xuất từ camera conveyor, real-time inference API, >95% precision, Docker.', skills: ['Python', 'TensorFlow', 'Machine Learning', 'Pandas'], category: 'Data & AI', budget: 2200, auctionType: 'SEALED_BID', domain: 'data' },
  { title: 'Tableau Dashboard Marketing Analytics', description: 'Tableau workbook: conversion funnel, cohort analysis, CAC/LTV, Google Analytics & CRM integration.', skills: ['Tableau', 'SQL', 'Python', 'Power BI'], category: 'Data & AI', budget: 700, auctionType: 'OPEN_BID', domain: 'data' },
  { title: 'Time Series Forecasting Sales Platform', description: 'Dự báo doanh số với LSTM + Prophet, pipeline tự động, dashboard Streamlit, confidence intervals.', skills: ['Python', 'Machine Learning', 'TensorFlow', 'Pandas', 'SQL'], category: 'Data & AI', budget: 1600, auctionType: 'SEALED_BID', domain: 'data' },
  { title: 'Data Lake Architecture AWS S3 + Glue', description: 'Data lake trên AWS: S3 tiers, Glue ETL jobs, Athena queries, Lake Formation access control, cost optimization.', skills: ['Python', 'SQL', 'AWS', 'Apache Spark'], category: 'Data & AI', budget: 2400, auctionType: 'SEALED_BID', domain: 'data' },
  { title: 'MLOps Pipeline với Kubeflow + MLflow', description: 'MLOps: model training pipeline, experiment tracking MLflow, model registry, A/B deployment, monitoring.', skills: ['Python', 'Machine Learning', 'Scikit-learn', 'PyTorch'], category: 'Data & AI', budget: 2800, auctionType: 'SEALED_BID', domain: 'data' },
  { title: 'BI Dashboard Power BI Healthcare KPIs', description: 'Healthcare dashboard: patient flow, bed occupancy, revenue cycle, quality metrics — drill-down capability.', skills: ['Power BI', 'SQL', 'Python'], category: 'Data & AI', budget: 900, auctionType: 'OPEN_BID', domain: 'data' },
  { title: 'Fraud Detection ML Model Fintech', description: 'Mô hình phát hiện gian lận: feature engineering, XGBoost + SMOTE, real-time scoring API, explainability SHAP.', skills: ['Python', 'Machine Learning', 'Scikit-learn', 'SQL', 'Pandas'], category: 'Data & AI', budget: 2500, auctionType: 'SEALED_BID', domain: 'data' },
  { title: 'Customer Churn Prediction Dashboard', description: 'Dự báo churn khách hàng: EDA, feature selection, model comparison, Streamlit dashboard, deployment guide.', skills: ['Python', 'Scikit-learn', 'Pandas', 'SQL', 'Tableau'], category: 'Data & AI', budget: 1100, auctionType: 'OPEN_BID', domain: 'data' },
  { title: 'Real-time Analytics với Apache Kafka + Spark', description: 'Streaming analytics: Kafka producers, Spark Structured Streaming, Redis cache, Grafana dashboard, 100K events/s.', skills: ['Python', 'Apache Spark', 'SQL', 'Machine Learning'], category: 'Data & AI', budget: 3200, auctionType: 'SEALED_BID', domain: 'data' },
  { title: 'NLP Text Classification Pipeline', description: 'Pipeline phân loại văn bản: data labeling, BERT fine-tuning, evaluation, deployment FastAPI, Docker + K8s.', skills: ['Python', 'Machine Learning', 'TensorFlow', 'Pandas'], category: 'Data & AI', budget: 1400, auctionType: 'SEALED_BID', domain: 'data' },
  // DevOps & Cloud (15)
  { title: 'Kubernetes EKS Production Cluster AWS', description: 'EKS cluster production-grade: networking VPC, RBAC, Helm charts, monitoring Prometheus/Grafana, HPA, node pools.', skills: ['Kubernetes', 'AWS', 'Docker', 'Terraform', 'CI/CD'], category: 'DevOps & Cloud', budget: 2500, auctionType: 'SEALED_BID', domain: 'devops' },
  { title: 'CI/CD Pipeline GitHub Actions Monorepo', description: 'GitHub Actions CI/CD: lint, test, build, Docker push, deploy staging/prod, environment management, rollback.', skills: ['CI/CD', 'Docker', 'AWS', 'Linux'], category: 'DevOps & Cloud', budget: 800, auctionType: 'OPEN_BID', domain: 'devops' },
  { title: 'Infrastructure as Code Terraform + GCP', description: 'IaC trên GCP: GKE, Cloud SQL, VPC, IAM, Cloud CDN, secrets management, Terraform Cloud state backend.', skills: ['Terraform', 'GCP', 'Kubernetes', 'CI/CD'], category: 'DevOps & Cloud', budget: 1500, auctionType: 'SEALED_BID', domain: 'devops' },
  { title: 'Linux Server Security Hardening & Audit', description: 'Audit bảo mật Ubuntu 22.04: hardening CIS Benchmark, WAF Nginx, IDS Fail2ban, SSL/TLS A+, vulnerability scan.', skills: ['Linux', 'Nginx', 'Docker', 'AWS'], category: 'DevOps & Cloud', budget: 600, auctionType: 'OPEN_BID', domain: 'devops' },
  { title: 'Monitoring Stack: Prometheus + Grafana + ELK', description: 'Observability stack đầy đủ: Prometheus metrics, Grafana dashboards, ELK log aggregation, alert rules, PagerDuty.', skills: ['Docker', 'Linux', 'GCP', 'CI/CD'], category: 'DevOps & Cloud', budget: 1000, auctionType: 'SEALED_BID', domain: 'devops' },
  { title: 'AWS Cost Optimization & Architecture Review', description: 'AWS cost review: rightsizing, Reserved Instances, Savings Plans, unused resources cleanup, FinOps dashboard.', skills: ['AWS', 'Terraform', 'CI/CD', 'Linux'], category: 'DevOps & Cloud', budget: 1200, auctionType: 'SEALED_BID', domain: 'devops' },
  { title: 'Docker Containerization Existing App', description: 'Containerize ứng dụng monolith: Dockerfile multi-stage, docker-compose, secrets management, health checks.', skills: ['Docker', 'Linux', 'CI/CD', 'Nginx'], category: 'DevOps & Cloud', budget: 500, auctionType: 'OPEN_BID', domain: 'devops' },
  { title: 'GitOps với ArgoCD + Kubernetes', description: 'GitOps implementation: ArgoCD setup, Helm charts, app-of-apps pattern, sync policies, RBAC, notifications.', skills: ['Kubernetes', 'CI/CD', 'Docker', 'Terraform'], category: 'DevOps & Cloud', budget: 1800, auctionType: 'SEALED_BID', domain: 'devops' },
  { title: 'Multi-Cloud DR Strategy AWS + GCP', description: 'Disaster Recovery multi-cloud: RTO/RPO planning, cross-cloud replication, failover automation, DR runbook.', skills: ['AWS', 'GCP', 'Terraform', 'Kubernetes'], category: 'DevOps & Cloud', budget: 3000, auctionType: 'SEALED_BID', domain: 'devops' },
  { title: 'DevSecOps Pipeline với Trivy + SAST', description: 'DevSecOps: tích hợp SAST (SonarQube), DAST (OWASP ZAP), container scanning Trivy, dependency check vào CI/CD.', skills: ['CI/CD', 'Docker', 'Linux', 'AWS'], category: 'DevOps & Cloud', budget: 1400, auctionType: 'SEALED_BID', domain: 'devops' },
  { title: 'Service Mesh Istio + mTLS cho Microservices', description: 'Istio service mesh: mTLS, traffic management, circuit breaker, distributed tracing Jaeger, Kiali dashboard.', skills: ['Kubernetes', 'Docker', 'Linux', 'GCP'], category: 'DevOps & Cloud', budget: 2200, auctionType: 'SEALED_BID', domain: 'devops' },
  { title: 'Azure DevOps Pipeline + AKS Deployment', description: 'Azure DevOps CI/CD pipeline, AKS cluster setup, Azure Container Registry, Key Vault integration, monitoring.', skills: ['Azure', 'Kubernetes', 'Docker', 'CI/CD'], category: 'DevOps & Cloud', budget: 1700, auctionType: 'SEALED_BID', domain: 'devops' },
  { title: 'Backup & Disaster Recovery Script Automation', description: 'Automated backup: PostgreSQL daily dumps, S3 lifecycle, restoration test scripts, alerting on failure, cron.', skills: ['Linux', 'AWS', 'Docker', 'Ansible'], category: 'DevOps & Cloud', budget: 700, auctionType: 'OPEN_BID', domain: 'devops' },
  { title: 'Performance Testing k6 + Grafana Dashboard', description: 'Load testing setup với k6: test scenarios, thresholds, Grafana real-time dashboard, performance baseline report.', skills: ['Linux', 'Docker', 'CI/CD', 'GCP'], category: 'DevOps & Cloud', budget: 900, auctionType: 'OPEN_BID', domain: 'devops' },
  { title: 'Ansible Playbooks Server Configuration Management', description: 'Ansible configuration management: roles cho web, DB, cache servers, idempotent playbooks, Vault secrets.', skills: ['Linux', 'Ansible', 'Docker', 'CI/CD'], category: 'DevOps & Cloud', budget: 1100, auctionType: 'SEALED_BID', domain: 'devops' },
  // Additional Backend (15)
  { title: 'NestJS REST API Scalable Architecture', description: 'REST API production-grade: authentication JWT/OAuth, RBAC, pagination, caching Redis, OpenAPI docs, unit tests.', skills: ['NestJS', 'PostgreSQL', 'Redis', 'TypeScript'], category: 'Web Development', budget: 1000, auctionType: 'SEALED_BID', domain: 'backend' },
  { title: 'Payment Gateway Integration (VNPAY + MoMo)', description: 'Tích hợp cổng thanh toán VNPAY và MoMo: sandbox test, production setup, webhook handlers, refund flow.', skills: ['NestJS', 'Node.js', 'PostgreSQL', 'TypeScript'], category: 'Web Development', budget: 750, auctionType: 'OPEN_BID', domain: 'backend' },
  { title: 'Event-Driven Architecture với RabbitMQ', description: 'Kiến trúc event-driven: RabbitMQ, dead letter queue, retry logic, saga pattern, event sourcing basics.', skills: ['NestJS', 'Redis', 'PostgreSQL', 'TypeScript'], category: 'Web Development', budget: 1300, auctionType: 'SEALED_BID', domain: 'backend' },
  { title: 'OAuth2 + SSO Authentication Service', description: 'Auth service: OAuth2 Authorization Server, SSO với Google/GitHub/Facebook, PKCE, token introspection.', skills: ['NestJS', 'Redis', 'PostgreSQL', 'TypeScript'], category: 'Web Development', budget: 900, auctionType: 'SEALED_BID', domain: 'backend' },
  { title: 'Database Performance Optimization PostgreSQL', description: 'PostgreSQL optimization: index analysis, query plan analysis, partitioning, connection pooling PgBouncer, vacuum.', skills: ['PostgreSQL', 'Python', 'Node.js', 'REST API'], category: 'Web Development', budget: 800, auctionType: 'OPEN_BID', domain: 'backend' },
  { title: 'Node.js File Upload Service (S3 + CDN)', description: 'Upload service: presigned URLs S3, image resize Sharp, CDN CloudFront, virus scanning, metadata extraction.', skills: ['Node.js', 'AWS', 'PostgreSQL', 'REST API'], category: 'Web Development', budget: 600, auctionType: 'OPEN_BID', domain: 'backend' },
  { title: 'Notification Service: Email + Push + SMS', description: 'Multi-channel notification service: email (Resend), push (FCM/APNs), SMS (Twilio), template system, queue.', skills: ['NestJS', 'Redis', 'PostgreSQL', 'Node.js'], category: 'Web Development', budget: 700, auctionType: 'SEALED_BID', domain: 'backend' },
  { title: 'Search Engine với Elasticsearch + NestJS', description: 'Full-text search: Elasticsearch setup, index mapping, multi-field search, faceted filters, autocomplete, pagination.', skills: ['NestJS', 'PostgreSQL', 'TypeScript', 'Redis'], category: 'Web Development', budget: 1100, auctionType: 'SEALED_BID', domain: 'backend' },
  { title: 'Admin Panel Backend với NestJS + CASL', description: 'Admin backend: user management, role/permission CASL, audit logging, impersonation, bulk operations API.', skills: ['NestJS', 'PostgreSQL', 'Redis', 'GraphQL'], category: 'Web Development', budget: 850, auctionType: 'SEALED_BID', domain: 'backend' },
  { title: 'Webhook System với Retry Logic', description: 'Webhook delivery system: outbound webhooks, retry exponential backoff, signature verification, delivery logs.', skills: ['NestJS', 'PostgreSQL', 'Redis', 'TypeScript'], category: 'Web Development', budget: 650, auctionType: 'OPEN_BID', domain: 'backend' },
  { title: 'CQRS Pattern với NestJS + PostgreSQL', description: 'CQRS implementation: command bus, query bus, event store, projections, snapshots, read model optimization.', skills: ['NestJS', 'PostgreSQL', 'Redis', 'TypeScript'], category: 'Web Development', budget: 1500, auctionType: 'SEALED_BID', domain: 'backend' },
  { title: 'API Rate Limiting + DDoS Protection', description: 'Rate limiting service: sliding window Redis, IP blocking, API key management, abuse detection, Cloudflare integration.', skills: ['NestJS', 'Redis', 'Node.js', 'TypeScript'], category: 'Web Development', budget: 550, auctionType: 'OPEN_BID', domain: 'backend' },
  { title: 'Scheduled Jobs + Cron Service NestJS', description: 'Background job service: cron scheduling, job queues BullMQ, priority queues, dead letter, monitoring UI.', skills: ['NestJS', 'Redis', 'PostgreSQL', 'TypeScript'], category: 'Web Development', budget: 700, auctionType: 'SEALED_BID', domain: 'backend' },
  { title: 'Python Django REST API với DRF', description: 'Django REST Framework API: serializers, viewsets, filters, pagination, JWT auth, Swagger docs, celery tasks.', skills: ['Python', 'Django', 'PostgreSQL', 'REST API'], category: 'Web Development', budget: 1000, auctionType: 'SEALED_BID', domain: 'backend' },
  { title: 'Inventory Management System API', description: 'Inventory API: SKU management, stock levels, warehouse locations, FIFO/LIFO, reorder alerts, barcode scanning.', skills: ['NestJS', 'PostgreSQL', 'Redis', 'TypeScript'], category: 'Web Development', budget: 1200, auctionType: 'SEALED_BID', domain: 'backend' },
  // Additional Frontend (15) — extra mix
  { title: 'Svelte/SvelteKit Marketing Site', description: 'Marketing site với SvelteKit: SSG, performance 98+ Lighthouse, blog MDX, form submissions, analytics.', skills: ['Svelte', 'TypeScript', 'CSS', 'HTML'], category: 'Web Development', budget: 550, auctionType: 'OPEN_BID', domain: 'frontend' },
  { title: 'React Native Cross-Platform Desktop App (Electron)', description: 'Desktop app Electron + React: file system integration, auto-update, native menus, offline, Windows/Mac.', skills: ['React', 'TypeScript', 'CSS', 'HTML'], category: 'Web Development', budget: 1400, auctionType: 'SEALED_BID', domain: 'frontend' },
  { title: 'Nuxt.js SEO-Optimized Product Catalog', description: 'Product catalog với Nuxt.js 3: SSR + SSG hybrid, structured data, sitemap, i18n, 1000+ products.', skills: ['Nuxt.js', 'Vue.js', 'TypeScript', 'CSS'], category: 'Web Development', budget: 900, auctionType: 'SEALED_BID', domain: 'frontend' },
  { title: 'Data Visualization Dashboard D3.js', description: 'Interactive charts D3.js: heatmaps, network graphs, treemaps, animations, responsive, dark mode.', skills: ['React', 'TypeScript', 'CSS', 'HTML'], category: 'Web Development', budget: 1100, auctionType: 'SEALED_BID', domain: 'frontend' },
  { title: 'PWA Progressive Web App Next.js', description: 'PWA với Next.js: service worker, offline support, push notifications, install prompt, background sync.', skills: ['Next.js', 'TypeScript', 'CSS', 'Redux'], category: 'Web Development', budget: 800, auctionType: 'OPEN_BID', domain: 'frontend' },
  { title: 'React Three.js 3D Product Configurator', description: '3D product configurator với Three.js + React: model loading, material/color switching, AR preview, share link.', skills: ['React', 'TypeScript', 'CSS', 'HTML'], category: 'Web Development', budget: 1700, auctionType: 'SEALED_BID', domain: 'frontend' },
  { title: 'Next.js E-Learning Platform Frontend', description: 'E-learning frontend: course listing, video player (HLS), quiz, progress tracking, certificates, responsive.', skills: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'], category: 'Web Development', budget: 1300, auctionType: 'SEALED_BID', domain: 'frontend' },
  { title: 'Angular Material Admin Template Custom', description: 'Custom Angular admin template: Material 3, data tables với sort/filter, charts, responsive sidebar, theming.', skills: ['Angular', 'TypeScript', 'CSS', 'SASS'], category: 'Web Development', budget: 950, auctionType: 'SEALED_BID', domain: 'frontend' },
  { title: 'React Form Builder với JSON Schema', description: 'Dynamic form builder: JSON Schema → form, validation (Zod), conditional fields, multi-step, file upload.', skills: ['React', 'TypeScript', 'CSS', 'Redux'], category: 'Web Development', budget: 700, auctionType: 'OPEN_BID', domain: 'frontend' },
  { title: 'Real-time Collaborative Editor (Yjs + React)', description: 'Collaborative text editor như Notion: Yjs CRDT, cursor presence, rich text (TipTap), comments, history.', skills: ['React', 'TypeScript', 'CSS', 'NestJS'], category: 'Web Development', budget: 1800, auctionType: 'SEALED_BID', domain: 'frontend' },
  { title: 'Vue.js Dashboard với Pinia + Vite', description: 'Dashboard Vue 3 + Pinia: real-time data updates, chart.js, export Excel/PDF, i18n, dark/light mode.', skills: ['Vue.js', 'TypeScript', 'CSS', 'REST API'], category: 'Web Development', budget: 850, auctionType: 'SEALED_BID', domain: 'frontend' },
  { title: 'Customer Portal Frontend React + Tailwind', description: 'Customer portal: account management, invoice history, support tickets, live chat widget, notification center.', skills: ['React', 'TypeScript', 'Tailwind CSS', 'Redux'], category: 'Web Development', budget: 950, auctionType: 'SEALED_BID', domain: 'frontend' },
  { title: 'Landing Page A/B Testing Framework', description: 'Landing page với A/B testing built-in: variant routing, analytics tracking, conversion funnel, heatmap.', skills: ['Next.js', 'TypeScript', 'Tailwind CSS', 'CSS'], category: 'Web Development', budget: 600, auctionType: 'OPEN_BID', domain: 'frontend' },
  { title: 'Maps & Geolocation React App (Mapbox)', description: 'Geospatial app: Mapbox GL, custom markers, route optimization, geofencing, clustering, location search.', skills: ['React', 'TypeScript', 'CSS', 'REST API'], category: 'Web Development', budget: 1000, auctionType: 'SEALED_BID', domain: 'frontend' },
  { title: 'Micro-Frontend Architecture Module Federation', description: 'Micro-frontend setup: Webpack Module Federation, shared design system, independent deployment, shell app.', skills: ['React', 'TypeScript', 'CSS', 'SASS'], category: 'Web Development', budget: 2000, auctionType: 'SEALED_BID', domain: 'frontend' },
];

// ─── Domain distribution for 500 freelancers ─────────────────────────────────
// frontend: 150, backend: 125, mobile: 75, design: 75, devops: 50, data: 25
const DOMAIN_DISTRIBUTION: { domain: Domain; count: number; startIdx: number }[] = [
  { domain: 'frontend', count: 150, startIdx: 0 },
  { domain: 'backend',  count: 125, startIdx: 150 },
  { domain: 'mobile',   count: 75,  startIdx: 275 },
  { domain: 'design',   count: 75,  startIdx: 350 },
  { domain: 'devops',   count: 50,  startIdx: 425 },
  { domain: 'data',     count: 25,  startIdx: 475 },
];

// Domain relevance for bid assignment
const DOMAIN_RELEVANCE: Record<Domain, Record<Domain, number>> = {
  frontend: { frontend: 1.0, backend: 0.4, mobile: 0.3, design: 0.2, devops: 0.1, data: 0.0 },
  backend:  { frontend: 0.2, backend: 1.0, mobile: 0.1, design: 0.0, devops: 0.3, data: 0.2 },
  mobile:   { frontend: 0.3, backend: 0.1, mobile: 1.0, design: 0.1, devops: 0.0, data: 0.0 },
  design:   { frontend: 0.1, backend: 0.0, mobile: 0.1, design: 1.0, devops: 0.0, data: 0.0 },
  devops:   { frontend: 0.0, backend: 0.3, mobile: 0.0, design: 0.0, devops: 1.0, data: 0.1 },
  data:     { frontend: 0.0, backend: 0.2, mobile: 0.0, design: 0.0, devops: 0.1, data: 1.0 },
};

// ─── Cover letters ────────────────────────────────────────────────────────────
const TEMPLATE_LETTER = `Dear Client,

I am a professional developer with extensive experience in this field.
I have successfully completed many similar projects for clients worldwide.
My skills perfectly match your requirements and I can deliver excellent results.
I am available to start immediately and will complete the work on time and within budget.
Please check my portfolio for examples of my previous work.
Looking forward to working with you.

Best regards`;

function makeTemplateVariant(variation: number): string {
  const greetings = ['Dear Client', 'Dear Hiring Manager', 'Hello Client', 'Dear Team'];
  return TEMPLATE_LETTER.replace('Dear Client', greetings[variation % greetings.length]);
}

const GENUINE_OPENINGS = [
  'Chào bạn,\n\nTôi đã đọc kỹ yêu cầu và rất hứng thú với dự án này.',
  'Xin chào,\n\nSau khi xem xét chi tiết yêu cầu, tôi tin rằng mình có thể đóng góp đáng kể.',
  'Hi,\n\nI have carefully reviewed your project requirements and I am confident I can deliver excellent results.',
  'Chào Client,\n\nTôi đã làm nhiều dự án tương tự và hiểu rõ các thách thức kỹ thuật bạn đang đối mặt.',
];

function makeGenuineLetter(flIndex: number, skills: string[], jobTitle: string, budget: number): string {
  const opening = GENUINE_OPENINGS[flIndex % GENUINE_OPENINGS.length];
  const exp = Math.floor(Math.random() * 5) + 2;
  const days = Math.floor(Math.random() * 20) + 10;
  return `${opening}

Về kinh nghiệm: tôi có ${exp} năm kinh nghiệm chuyên sâu về ${skills.slice(0, 3).join(', ')}.

Portfolio tiêu biểu:
- Dự án A: Xây dựng ${skills[0]} cho startup, 3000+ active users, uptime 99.9%
- Dự án B: Tối ưu ${skills[1] ?? 'hệ thống'} — giảm latency 60%, tiết kiệm $${Math.floor(budget * 0.1)}/tháng chi phí server

Phương án tiếp cận "${jobTitle}":
1. Giai đoạn khởi động (3 ngày): phân tích requirements, thiết kế kiến trúc
2. Giai đoạn phát triển (${days - 4} ngày): implementation, code review, unit testing
3. Giai đoạn bàn giao (1 ngày): deployment, documentation, handoff

Cam kết hoàn thành trong ${days} ngày làm việc với quality cao nhất.`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ─── CLEAR FUNCTION ──────────────────────────────────────────────────────────
async function clearSeedData() {
  console.log('🗑️  Clearing old seed data...\n');

  // Find job IDs with our prefixes
  const [largeJobs, seed500Jobs] = await Promise.all([
    prisma.job.findMany({ where: { id: { startsWith: 'large-job-' } }, select: { id: true } }),
    prisma.job.findMany({ where: { id: { startsWith: 'seed500-job-' } }, select: { id: true } }),
  ]);
  const allOldJobIds = [...largeJobs, ...seed500Jobs].map((j) => j.id);

  if (allOldJobIds.length > 0) {
    // Delete contracts first (milestones cascade from contract)
    const deleted = await prisma.contract.deleteMany({ where: { jobId: { in: allOldJobIds } } });
    console.log(`  Deleted ${deleted.count} old contracts`);
    // Delete jobs (bids, ahpWeight cascade from job)
    const deletedJobs = await prisma.job.deleteMany({ where: { id: { in: allOldJobIds } } });
    console.log(`  Deleted ${deletedJobs.count} old jobs (bids cascade)`);
  }

  // Find user IDs with our email prefixes
  const oldUsers = await prisma.user.findMany({
    where: {
      email: {
        contains: '@bidwise.dev',
      },
    },
    select: { id: true, email: true },
  });
  const filteredOldUsers = oldUsers.filter(
    (u) =>
      u.email.startsWith('large-client-') ||
      u.email.startsWith('large-fl-') ||
      u.email.startsWith('seed500-client-') ||
      u.email.startsWith('seed500-fl-'),
  );
  const oldUserIds = filteredOldUsers.map((u) => u.id);

  if (oldUserIds.length > 0) {
    // Delete SkillClusterReputation (not cascaded from user)
    const deletedRep = await prisma.skillClusterReputation.deleteMany({
      where: { freelancerId: { in: oldUserIds } },
    });
    console.log(`  Deleted ${deletedRep.count} old skill cluster reputations`);
    // Delete users (cascade → profiles, portfolio, userRoles, etc.)
    const deletedUsers = await prisma.user.deleteMany({ where: { id: { in: oldUserIds } } });
    console.log(`  Deleted ${deletedUsers.count} old users (profiles/portfolios/roles cascade)\n`);
  }

  console.log('  ✅ Old seed data cleared\n');
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 BidWise seed-500: 500 freelancers × 500 bids dataset\n');
  console.log('═'.repeat(60));

  await clearSeedData();

  const password = await bcrypt.hash('Password123!', 10);

  // ── Roles & Categories ────────────────────────────────────────────────────
  console.log('⚙️  Setting up roles and categories...');
  const clientRole = await prisma.role.upsert({ where: { name: 'CLIENT' }, update: {}, create: { name: 'CLIENT' } });
  const flRole    = await prisma.role.upsert({ where: { name: 'FREELANCER' }, update: {}, create: { name: 'FREELANCER' } });

  const catNames = ['Web Development', 'Mobile Development', 'UI/UX Design', 'Digital Marketing', 'Writing & Translation', 'Video & Animation', 'Data & AI', 'DevOps & Cloud'];
  const catMap: Record<string, string> = {};
  for (const name of catNames) {
    const c = await prisma.category.upsert({ where: { name }, update: {}, create: { name, description: name } });
    catMap[name] = c.id;
  }

  // ── 50 Clients ────────────────────────────────────────────────────────────
  console.log('👔 Creating 50 client users...');
  const clientBios = [
    'Startup founder building a SaaS platform for Vietnamese SMEs.',
    'E-commerce entrepreneur scaling a fashion retail brand online.',
    'Digital agency owner handling development for 20+ client projects.',
    'Fintech product manager leading digital banking transformation.',
    'EdTech CEO building AI-powered adaptive learning management.',
    'Healthcare startup founder developing telemedicine solutions.',
    'Operations manager automating internal ERP and workflow.',
    'Restaurant chain owner building POS and loyalty systems.',
    'Real estate developer creating a property marketplace platform.',
    'Non-profit CTO building donation and volunteer management tools.',
    'Insurance company CTO modernizing legacy underwriting systems.',
    'Logistics startup founder tracking last-mile deliveries real-time.',
    'HR tech startup building AI-powered recruitment pipeline.',
    'Travel agency building booking, tours, and itinerary management.',
    'Legal tech founder automating contract drafting and review.',
    'Manufacturing CIO implementing Industry 4.0 ERP solution.',
    'Retail chain manager building omnichannel customer loyalty.',
    'Event management company digitalizing registration and ticketing.',
    'Publishing house building digital content distribution platform.',
    'Consulting firm manager building real-time client reporting.',
    'AgriTech startup building smart farming monitoring platform.',
    'Food delivery startup building multi-vendor marketplace app.',
    'PropTech startup building AI-powered property valuation tool.',
    'Sports tech founder building athlete performance analytics.',
    'MedTech startup building wearable health data collection platform.',
    'Crypto exchange founder building trading platform backend.',
    'Gaming company product manager building live-ops dashboard.',
    'Ride-sharing startup building driver and passenger mobile app.',
    'Beauty brand founder building AR try-on experience web app.',
    'Hospitality group building hotel management and booking system.',
    'EdTech startup building coding bootcamp management platform.',
    'Retail analytics company building real-time foot traffic dashboard.',
    'Telecom company building self-service customer portal.',
    'Energy company building IoT sensor monitoring dashboard.',
    'Construction company building project management mobile app.',
    'Music streaming startup building artist royalty management.',
    'Fitness chain building membership and class booking platform.',
    'Insurance broker building policy comparison and quote engine.',
    'Grocery chain building online ordering and delivery platform.',
    'Tech incubator building startup portfolio management system.',
    'Tax consulting firm building compliance tracking platform.',
    'Auto dealer network building inventory and CRM integration.',
    'Pharma company building clinical trial management platform.',
    'Architecture firm building BIM project collaboration tool.',
    'Video production agency building asset management platform.',
    'Law firm building case management and billing automation.',
    'University building alumni engagement and donation platform.',
    'Startup accelerator building mentor-startup matching platform.',
    'Wholesale distributor building B2B order management portal.',
    'Healthcare network building patient referral management system.',
  ];

  const clientIds: string[] = [];
  for (let i = 0; i < 50; i++) {
    const idx = String(i + 1).padStart(3, '0');
    const email = `seed500-client-${idx}@bidwise.dev`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: password,
        fullName: `Client ${idx}`,
        bio: clientBios[i] ?? 'Business owner looking for skilled freelancers.',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: clientRole.id } },
      update: {},
      create: { userId: user.id, roleId: clientRole.id },
    });
    clientIds.push(user.id);
  }
  console.log(`  ✅ 50 clients created`);

  // ── 500 Freelancers ───────────────────────────────────────────────────────
  console.log('\n👨‍💻 Creating 500 freelancer users + profiles...');
  const freelancers: { id: string; domain: Domain; skills: string[]; idx: number }[] = [];

  const portfolioExamples = [
    ['SaaS Dashboard B2B', 'Admin dashboard với React + NestJS, RBAC, analytics, 500+ business users.'],
    ['E-Commerce Fullstack', 'Platform thương mại điện tử: product, cart, payment (VNPAY), 10K+ orders/ngày.'],
    ['Mobile Banking App', 'React Native app biometric auth, real-time transactions, chạy iOS + Android.'],
    ['Analytics Platform', 'Data visualization: 60+ chart types, real-time WebSocket, export PDF/Excel.'],
    ['API Gateway Service', 'Microservices gateway xử lý 200K requests/ngày, latency p95 < 50ms.'],
    ['Design System Figma', '200+ components, dark/light mode, a11y AA compliant, dùng bởi 8 teams.'],
    ['ML Recommendation Engine', 'Collaborative filtering tăng CTR 35%, A/B tested trên 1M users.'],
    ['DevOps Platform Internal', 'Developer platform Kubernetes + GitOps, 30+ microservices, zero-downtime.'],
    ['Mobile POS Restaurant', 'Android Kotlin POS: order, kitchen display, payment, báo cáo real-time.'],
    ['AI Chatbot Customer Service', 'RAG chatbot giảm 40% support tickets, tích hợp với Zendesk.'],
    ['ETL Pipeline Data Warehouse', 'ETL pipeline: 50+ data sources → Redshift, 10GB/ngày, dbt transformations.'],
    ['Security Audit Tool', 'Automated security scanner: OWASP Top 10, SAST/DAST, compliance reports.'],
  ];

  for (const { domain, count, startIdx } of DOMAIN_DISTRIBUTION) {
    for (let i = 0; i < count; i++) {
      const globalIdx = startIdx + i;
      const idx = String(globalIdx + 1).padStart(3, '0');
      const email = `seed500-fl-${idx}@bidwise.dev`;
      const name = generateName(globalIdx);

      // Vary seniority: junior (30%), mid (40%), senior (30%)
      const seniorityRoll = globalIdx % 10;
      const isSenior = seniorityRoll >= 7;
      const isJunior = seniorityRoll < 3;
      const expYears = isJunior ? randInt(1, 2) : isSenior ? randInt(5, 10) : randInt(2, 5);
      const hourlyRate = isJunior ? randInt(15, 25) : isSenior ? randInt(45, 80) : randInt(25, 45);
      const assessScore = isJunior ? randInt(35, 60) : isSenior ? randInt(75, 95) : randInt(55, 80);

      // Reputation tier based on seniority
      const tier = isSenior && hourlyRate >= 55 ? 'VERIFIED'
        : (isSenior || hourlyRate >= 40) ? 'GOLD'
        : (hourlyRate >= 25) ? 'SILVER'
        : 'NEW';

      const skills = pickSkills(domain, randInt(4, 7));

      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          passwordHash: password,
          fullName: name,
          bio: `Freelancer chuyên ${domain}: ${skills.slice(0, 3).join(', ')}. ${expYears} năm kinh nghiệm. Hourly: $${hourlyRate}/h.`,
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        },
      });
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: flRole.id } },
        update: {},
        create: { userId: user.id, roleId: flRole.id },
      });

      const profile = await prisma.freelancerProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          hourlyRate,
          experience: `${expYears} years`,
          skills,
          available: true,
          bidTokens: tier === 'VERIFIED' ? 999 : tier === 'GOLD' ? 30 : tier === 'SILVER' ? 15 : 5,
          assessmentCompleted: true,
          assessmentScore: assessScore,
          assessmentLevel: assessScore >= 80 ? 'SENIOR' : assessScore >= 60 ? 'INTERMEDIATE' : 'JUNIOR',
          reputationTier: tier,
        },
      });

      // Portfolio items: 0-3 per freelancer (seniors have more)
      const portCount = isSenior ? randInt(2, 3) : isJunior ? randInt(0, 1) : randInt(1, 2);
      for (let p = 0; p < portCount; p++) {
        const pt = portfolioExamples[(globalIdx + p) % portfolioExamples.length];
        await prisma.portfolioItem.create({
          data: {
            freelancerProfileId: profile.id,
            title: pt[0],
            desc: pt[1],
            linkType: 'github',
          },
        });
      }

      freelancers.push({ id: user.id, domain, skills, idx: globalIdx });
    }
  }
  console.log(`  ✅ 500 freelancers created`);

  // ── 100 Jobs ─────────────────────────────────────────────────────────────
  console.log('\n📋 Creating 100 jobs...');
  interface JobRecord { id: string; domain: Domain; skills: string[]; budget: number; status: string }
  const jobs: JobRecord[] = [];

  for (let i = 0; i < JOB_TEMPLATES.length && i < 100; i++) {
    const tmpl = JOB_TEMPLATES[i];
    const idx = String(i + 1).padStart(3, '0');
    const jobId = `seed500-job-${idx}`;
    const clientId = clientIds[i % clientIds.length];

    // Status distribution: 65% OPEN, 25% IN_PROGRESS, 10% COMPLETED
    const statusRoll = i % 20;
    const status = statusRoll < 13 ? 'OPEN' : statusRoll < 18 ? 'IN_PROGRESS' : 'COMPLETED';
    const deadlineDays = randInt(14, 90);

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
        status: status as any,
        skills: tmpl.skills,
        ahpWeight: {
          create: {
            priceWeight:      randInt(20, 40),
            skillWeight:      randInt(20, 35),
            experienceWeight: randInt(5, 20),
            ratingWeight:     randInt(5, 15),
            speedWeight:      randInt(3, 12),
            deadlineWeight:   randInt(3, 10),
            portfolioWeight:  randInt(3, 10),
          },
        },
      },
    });

    jobs.push({ id: job.id, domain: tmpl.domain, skills: tmpl.skills, budget: tmpl.budget, status });
  }
  console.log(`  ✅ 100 jobs created`);

  // ── 500 Bids — one bid per freelancer ─────────────────────────────────────
  console.log('\n📨 Creating 500 bids (1 per freelancer, domain-matched assignment)...');

  // Group freelancers by domain for matching
  const flByDomain: Record<Domain, typeof freelancers> = {
    frontend: [], backend: [], mobile: [], design: [], devops: [], data: []
  };
  for (const fl of freelancers) flByDomain[fl.domain].push(fl);

  // Shuffle each domain group for variety
  for (const domain of Object.keys(flByDomain) as Domain[]) {
    flByDomain[domain] = flByDomain[domain].sort(() => Math.random() - 0.5);
  }

  // Track which freelancers have been assigned
  const assignedFl = new Set<string>();
  let totalBids = 0;
  let templateBidCount = 0;
  const contractCandidates: { jobId: string; freelancerId: string; amount: number }[] = [];

  // For each job, assign 5 freelancers (4 domain-matched + 1 cross-domain)
  for (let jobIdx = 0; jobIdx < jobs.length; jobIdx++) {
    const job = jobs[jobIdx];
    const bidsPerJob = 5;
    const selected: typeof freelancers = [];

    // Primary: pick from same domain (4 candidates)
    const domainPool = flByDomain[job.domain].filter((fl) => !assignedFl.has(fl.id));
    const primaryCount = Math.min(4, domainPool.length, bidsPerJob - 1);
    for (let p = 0; p < primaryCount && selected.length < bidsPerJob - 1; p++) {
      if (domainPool[p]) {
        selected.push(domainPool[p]);
        assignedFl.add(domainPool[p].id);
      }
    }

    // Cross-domain: pick 1 from any other domain
    const otherDomains = (Object.keys(flByDomain) as Domain[]).filter((d) => d !== job.domain);
    for (const od of otherDomains) {
      if (selected.length >= bidsPerJob) break;
      const crossPool = flByDomain[od].filter((fl) => !assignedFl.has(fl.id));
      if (crossPool.length > 0) {
        selected.push(crossPool[0]);
        assignedFl.add(crossPool[0].id);
        break;
      }
    }

    let bestScore = 0;
    let bestBidder: string | null = null;

    for (let bidIdx = 0; bidIdx < selected.length; bidIdx++) {
      const fl = selected[bidIdx];

      // Price: 60% - 130% of budget, with juniors slightly lower bids
      const priceFactor = 0.6 + Math.random() * 0.7;
      const amount = Math.round(job.budget * priceFactor);
      const deliveryDays = randInt(7, 60);

      // 10% of bids are template spam
      const isTemplate = templateBidCount < 50 && (totalBids % 10 === 0);
      const coverLetter = isTemplate
        ? makeTemplateVariant(templateBidCount)
        : makeGenuineLetter(fl.idx, fl.skills, job.domain, job.budget);

      // Calculate matching score
      const sharedSkills = fl.skills.filter((s) =>
        job.skills.some((js) => js.toLowerCase() === s.toLowerCase())
      );
      const skillScore = Math.min(50, (sharedSkills.length / Math.max(job.skills.length, 1)) * 50);
      const budgetScore = amount <= job.budget ? randInt(20, 30) : randInt(5, 15);
      const assessBonus = randInt(0, 20);
      const matchingScore = Math.round(skillScore + budgetScore + assessBonus);

      try {
        await prisma.bid.upsert({
          where: { jobId_freelancerId: { jobId: job.id, freelancerId: fl.id } },
          update: {},
          create: {
            jobId: job.id,
            freelancerId: fl.id,
            amount,
            deliveryDays,
            proposal: `Tôi có ${fl.skills.slice(0, 3).join(', ')} — phù hợp với yêu cầu dự án này.`,
            days: deliveryDays,
            coverLetter,
            status: 'PENDING',
            isTemplateBid: isTemplate,
            spamScore: isTemplate ? 0.88 + Math.random() * 0.1 : Math.random() * 0.3,
            matchingScore,
            matchBreakdown: {
              skills: { matched: sharedSkills, score: skillScore },
              budget: { score: budgetScore, withinBudget: amount <= job.budget },
              assessment: { score: assessBonus },
            },
          },
        });
        totalBids++;
        if (isTemplate) templateBidCount++;

        if (matchingScore > bestScore && job.status !== 'OPEN') {
          bestScore = matchingScore;
          bestBidder = fl.id;
        }
      } catch {
        // skip duplicate
      }
    }

    if (bestBidder && job.status !== 'OPEN') {
      contractCandidates.push({ jobId: job.id, freelancerId: bestBidder, amount: Math.round(job.budget * 0.85) });
    }
  }

  // Assign remaining unassigned freelancers to random open jobs
  const unassigned = freelancers.filter((fl) => !assignedFl.has(fl.id));
  const openJobs = jobs.filter((j) => j.status === 'OPEN');

  for (const fl of unassigned) {
    const job = openJobs[Math.floor(Math.random() * openJobs.length)];
    if (!job) continue;

    const amount = Math.round(job.budget * (0.6 + Math.random() * 0.7));
    const deliveryDays = randInt(7, 60);
    const isTemplate = templateBidCount < 50 && (totalBids % 10 === 0);
    const coverLetter = isTemplate
      ? makeTemplateVariant(templateBidCount)
      : makeGenuineLetter(fl.idx, fl.skills, job.domain, job.budget);

    const sharedSkills = fl.skills.filter((s) =>
      job.skills.some((js) => js.toLowerCase() === s.toLowerCase())
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
          proposal: `Tôi có ${fl.skills.slice(0, 3).join(', ')} phù hợp.`,
          days: deliveryDays,
          coverLetter,
          status: 'PENDING',
          isTemplateBid: isTemplate,
          spamScore: isTemplate ? 0.88 : Math.random() * 0.3,
          matchingScore,
          matchBreakdown: {
            skills: { matched: sharedSkills, score: skillScore },
            budget: { score: budgetScore, withinBudget: amount <= job.budget },
          },
        },
      });
      totalBids++;
      if (isTemplate) templateBidCount++;
    } catch {
      // skip
    }
  }

  console.log(`  ✅ ${totalBids} bids created (${templateBidCount} template/spam bids)`);

  // ── 35 Contracts ──────────────────────────────────────────────────────────
  console.log('\n📝 Creating 35 contracts + milestones...');
  let contractCount = 0;

  for (const candidate of contractCandidates.slice(0, 35)) {
    const job = jobs.find((j) => j.id === candidate.jobId);
    if (!job) continue;

    await prisma.bid.updateMany({
      where: { jobId: candidate.jobId, freelancerId: candidate.freelancerId },
      data: { status: 'ACCEPTED' },
    });

    const bid = await prisma.bid.findFirst({ where: { jobId: candidate.jobId, freelancerId: candidate.freelancerId } });
    if (!bid) continue;

    const existingContract = await prisma.contract.findFirst({ where: { bidId: bid.id } });
    if (existingContract) continue;

    const clientId = clientIds[jobs.indexOf(job) % clientIds.length];
    const isCompleted = contractCount < 20;
    const contractStatus = isCompleted ? 'COMPLETED' : 'ACTIVE';

    const contract = await prisma.contract.create({
      data: {
        jobId: candidate.jobId,
        bidId: bid.id,
        clientId,
        freelancerId: candidate.freelancerId,
        title: `Contract for ${job.domain} project`,
        description: `Development contract — ${job.domain} domain, budget $${candidate.amount}.`,
        totalAmount: candidate.amount,
        status: contractStatus,
        startDate: new Date(Date.now() - randInt(5, 60) * 86400000),
        autoApprovalDays: 5,
      },
    });

    await prisma.milestone.createMany({
      data: [
        {
          contractId: contract.id,
          order: 1,
          title: 'Phase 1 — Analysis & Core Development',
          description: 'Requirements analysis, architecture design, core feature implementation.',
          amount: Math.round(candidate.amount * 0.4),
          percentage: 40,
          deadline: new Date(Date.now() + 14 * 86400000),
          status: isCompleted ? ('APPROVED' as const) : ('SUBMITTED' as const),
          maxRevisions: 3,
          ...(isCompleted ? { approvedAt: new Date(Date.now() - 10 * 86400000) } : { submittedAt: new Date() }),
        },
        {
          contractId: contract.id,
          order: 2,
          title: 'Phase 2 — Testing & Delivery',
          description: 'Complete features, testing, bug fixes, deployment, documentation.',
          amount: Math.round(candidate.amount * 0.6),
          percentage: 60,
          deadline: new Date(Date.now() + 30 * 86400000),
          status: isCompleted ? ('APPROVED' as const) : ('NOT_STARTED' as const),
          maxRevisions: 3,
          ...(isCompleted ? { approvedAt: new Date(Date.now() - 3 * 86400000) } : {}),
        },
      ],
    });

    // SkillClusterReputation for completed contracts
    if (isCompleted) {
      const fl = freelancers.find((f) => f.id === candidate.freelancerId);
      if (fl) {
        const rating = randInt(3, 5) + (Math.random() > 0.5 ? 0.5 : 0);
        const clusterMap: Record<string, string[]> = {
          frontend: ['react', 'vue.js', 'angular', 'next.js', 'typescript', 'tailwind css', 'redux', 'css', 'html', 'sass', 'svelte', 'nuxt.js'],
          backend:  ['nestjs', 'node.js', 'python', 'django', 'express.js', 'postgresql', 'mysql', 'redis', 'graphql', 'rest api', 'java', 'spring boot'],
          mobile:   ['react native', 'flutter', 'ios', 'android', 'swift', 'dart', 'firebase', 'kotlin', 'xamarin'],
          design:   ['figma', 'adobe xd', 'ui/ux', 'photoshop', 'illustrator', 'sketch', 'prototyping', 'zeplin'],
          devops:   ['docker', 'kubernetes', 'aws', 'gcp', 'ci/cd', 'terraform', 'linux', 'nginx', 'azure', 'ansible'],
          data:     ['machine learning', 'tensorflow', 'python', 'pandas', 'sql', 'tableau', 'power bi', 'scikit-learn', 'pytorch', 'apache spark'],
        };

        const flSkillsLower = fl.skills.map((s) => s.toLowerCase());
        for (const [clusterName, clusterSkills] of Object.entries(clusterMap)) {
          if (flSkillsLower.some((s) => clusterSkills.includes(s))) {
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
            break;
          }
        }
      }
    }

    contractCount++;
  }
  console.log(`  ✅ ${contractCount} contracts created (20 COMPLETED, ${contractCount - 20} ACTIVE)`);

  // ── Final Summary ──────────────────────────────────────────────────────────
  const [userCount, profileCount, jobCount, bidCount, contractFinalCount, milestoneCount, repCount] = await Promise.all([
    prisma.user.count(),
    prisma.freelancerProfile.count(),
    prisma.job.count(),
    prisma.bid.count(),
    prisma.contract.count(),
    prisma.milestone.count(),
    prisma.skillClusterReputation.count(),
  ]);

  const templateBids = await prisma.bid.count({ where: { isTemplateBid: true } });

  console.log('\n' + '═'.repeat(60));
  console.log('🎉 seed-500 complete!\n');
  console.log('📊 Database totals:');
  console.log(`  • Users total:          ${userCount}`);
  console.log(`  • FreelancerProfiles:   ${profileCount}`);
  console.log(`  • Jobs:                 ${jobCount}`);
  console.log(`  • Bids (total):         ${bidCount}`);
  console.log(`  • Template/Spam bids:   ${templateBids}`);
  console.log(`  • Contracts:            ${contractFinalCount}`);
  console.log(`  • Milestones:           ${milestoneCount}`);
  console.log(`  • SkillClusterRep:      ${repCount}`);
  console.log('\n🔑 Login credentials:');
  console.log('  Freelancers: seed500-fl-001@bidwise.dev … seed500-fl-500@bidwise.dev');
  console.log('  Clients:     seed500-client-001@bidwise.dev … seed500-client-050@bidwise.dev');
  console.log('  Password:    Password123!');
  console.log('═'.repeat(60));
  console.log('\n▶  Next: npx ts-node -r tsconfig-paths/register prisma/evaluate-algorithms.ts');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
