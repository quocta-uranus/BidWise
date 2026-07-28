# BidWise — Tài liệu Báo cáo & Thuyết trình

> **Capstone Project · FPT University 2025**
> Platform kết nối Freelancer và Client thông qua cơ chế đấu thầu thông minh

---

## Mục lục

1. [Giới thiệu sản phẩm](#1-giới-thiệu-sản-phẩm)
2. [Tech Stack](#2-tech-stack)
3. [Kiến trúc hệ thống](#3-kiến-trúc-hệ-thống)
4. [Các tính năng chính](#4-các-tính-năng-chính)
5. [Điểm nổi bật & sáng tạo](#5-điểm-nổi-bật--sáng-tạo)
6. [Luồng Demo](#6-luồng-demo)
7. [Workflow dự án](#7-workflow-dự-án)
8. [Q&A — Câu hỏi giáo viên thường hỏi](#8-qa--câu-hỏi-giáo-viên-thường-hỏi)

---

## 1. Giới thiệu sản phẩm

**BidWise** là nền tảng freelance marketplace kết hợp cơ chế đấu thầu (auction-based bidding) thay vì chỉ đơn thuần là marketplace tuyển dụng thông thường.

### Vấn đề giải quyết

| Vấn đề thực tế | BidWise giải quyết như thế nào |
|---|---|
| Client khó chọn freelancer phù hợp trong hàng chục hồ sơ | Xếp hạng tự động bằng AHP-TOPSIS đa tiêu chí |
| Freelancer gửi proposal rập khuôn, thiếu cạnh tranh | AI gợi ý cover letter cá nhân hóa |
| Tranh chấp hợp đồng không có quy trình rõ ràng | Dispute system có thu thập bằng chứng, Admin phân xử |
| Không có cách đánh giá năng lực freelancer khách quan | Skill Assessment + Reputation Tier system |

### Đối tượng người dùng

- **Client** — doanh nghiệp/cá nhân cần thuê freelancer
- **Freelancer** — chuyên gia kỹ thuật, sáng tạo, tư vấn
- **Admin/Moderator** — quản trị nền tảng, xử lý báo cáo, phân xử tranh chấp

---

## 2. Tech Stack

### Frontend

| Công nghệ | Version | Mục đích |
|---|---|---|
| **Next.js** | 16 (App Router + Turbopack) | Framework React SSR/SSG |
| **React** | 19 | UI library |
| **TypeScript** | 5 | Type-safe development |
| **Tailwind CSS** | 4 | Utility-first styling |
| **shadcn/ui + Base UI** | latest | Component system |
| **Zustand** | 5 | Client-side state (auth store) |
| **TanStack Query** | 5 | Server state, data fetching, caching |
| **React Hook Form + Zod** | 7 / 4 | Form validation |
| **Socket.io-client** | 4 | Real-time chat |
| **Sonner / react-hot-toast** | latest | Toast notifications |
| **Lucide React** | latest | Icon system |

### Backend

| Công nghệ | Version | Mục đích |
|---|---|---|
| **NestJS** | 11 | Framework Node.js (modular, DI) |
| **TypeScript** | 5 | Type-safe development |
| **Prisma** | 6 | ORM + Database migrations |
| **PostgreSQL** | 16 | Primary database |
| **Redis** | 7 | Token blacklist, session cache |
| **Socket.io** | 4 | Real-time WebSocket (chat) |
| **Passport.js + JWT** | latest | Authentication |
| **Nodemailer / Resend** | latest | Email (OTP, thông báo) |
| **bcryptjs** | latest | Password hashing |
| **Helmet + Throttler** | latest | Security hardening |
| **Groq SDK (Llama 3.3 70B)** | latest | AI Chat assistant |
| **Google Generative AI** | latest | AI features |

### Infrastructure

| Công nghệ | Mục đích |
|---|---|
| **Docker + Docker Compose** | Local dev: PostgreSQL + Redis container |
| **Prisma Studio** | Database GUI |

---

## 3. Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│              Next.js 16 (App Router + Turbopack)            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Auth    │  │  Client  │  │Freelancer│  │  Admin   │   │
│  │  Pages   │  │Dashboard │  │Dashboard │  │Dashboard │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│         Zustand (Auth) · TanStack Query · Socket.io         │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS REST + WebSocket
┌────────────────────────▼────────────────────────────────────┐
│                          BACKEND                            │
│                    NestJS 11 (Modular)                      │
│  auth │ users │ jobs │ bids │ client-bids │ contracts       │
│  payments │ reputation │ recommendation │ ai-chat           │
│  chat │ reports │ admin │ freelancer │ session              │
│             Prisma ORM · Guards · Interceptors              │
└──────────┬──────────────────────────────┬───────────────────┘
           │                              │
    ┌──────▼──────┐              ┌────────▼────────┐
    │  PostgreSQL │              │     Redis        │
    │      16     │              │  Token blacklist │
    │  (Primary   │              │  Session cache   │
    │  Database)  │              └─────────────────┘
    └─────────────┘
           │
    ┌──────▼──────────┐
    │  External APIs  │
    │  Groq (Llama    │
    │  3.3 70B)       │
    │  Google AI      │
    │  Gmail SMTP     │
    └─────────────────┘
```

---

## 4. Các tính năng chính

### 4.1 Hệ thống Xác thực & Phân quyền (Auth & Authorization)

- **Đăng ký** với xác thực OTP Email (hiệu lực 10 phút)
- **JWT dual-token**: Access Token (15 phút, lưu in-memory) + Refresh Token (7 ngày, httpOnly cookie)
- **Token Rotation**: mỗi lần refresh tạo RT mới, RT cũ bị revoke
- **Redis Blacklist**: đảm bảo logout an toàn tức thời
- **4 Role**: `ADMIN`, `MODERATOR`, `CLIENT`, `FREELANCER` với 14 permissions
- **Quản lý Session**: theo dõi device, IP, user agent
- **Forgot/Reset Password** qua email token
- **Brute-force protection**: khóa tài khoản sau nhiều lần đăng nhập sai

### 4.2 Job Management (Client)

- **Tạo Job** với đầy đủ thông tin: tiêu đề, mô tả, budget (fixed/range), deadline, skills, category
- **2 loại đấu thầu**:
  - `SEALED_BID` — freelancer không thấy bid của nhau (giống sealed envelope)
  - `OPEN_BID` — đấu thầu công khai
- **Job Lifecycle**: `DRAFT → OPEN → IN_PROGRESS → COMPLETED / DISPUTED`
- **Job Attachments**: đính kèm tài liệu, brief
- **Bookmark Jobs**: freelancer đánh dấu job yêu thích
- **Job Alerts**: nhận thông báo job mới theo frequency (daily/instant)

### 4.3 Bidding System (Freelancer)

- **Submit Bid**: amount, delivery days, proposal, cover letter, file đính kèm
- **Bid Quota**: mỗi ngày có giới hạn bid tokens (tránh spam)
- **AI Cover Letter Suggestion**: gợi ý cover letter tự động dựa trên job description
- **Bid Status**: `PENDING → SHORTLISTED / ACCEPTED / REJECTED / WITHDRAWN / EXPIRED`
- **Rút bid** trước khi bị quyết định

### 4.4 AHP-TOPSIS Ranking — Trung tâm của BidWise

Đây là tính năng **đặc trưng nhất** và phức tạp nhất của hệ thống.

**AHP (Analytic Hierarchy Process)** cho phép client đặt trọng số ưu tiên cho từng tiêu chí:

| Tiêu chí | Ý nghĩa |
|---|---|
| `priceWeight` | Mức giá bid |
| `skillWeight` | Mức độ khớp kỹ năng |
| `experienceWeight` | Kinh nghiệm freelancer |
| `ratingWeight` | Điểm đánh giá trước đó |
| `speedWeight` | Tốc độ hoàn thành |
| `deadlineWeight` | Tuân thủ deadline |
| `portfolioWeight` | Chất lượng portfolio |

**Quy trình:**
1. Client tạo ma trận so sánh cặp (pairwise matrix) cho các tiêu chí
2. Hệ thống tính **Consistency Ratio (CR)** — nếu CR > 0.1 thì ma trận không nhất quán, cần nhập lại
3. **TOPSIS** xếp hạng các bid dựa trên khoảng cách tới giải pháp lý tưởng và phi lý tưởng
4. Output: danh sách bid được xếp hạng với **matching score** và breakdown điểm từng tiêu chí

**AHP Presets**: client có thể chọn từ các template có sẵn (Price-Focused, Quality-Focused, Balanced...) thay vì tự điền.

### 4.5 Contract & Milestone Management

- **Tạo hợp đồng** từ bid được chấp nhận
- **Milestone-based payment**: chia hợp đồng thành nhiều giai đoạn
- **Milestone lifecycle**: `NOT_STARTED → IN_PROGRESS → SUBMITTED → APPROVED / REJECTED / REVISION_REQUESTED`
- **File deliverables**: freelancer upload kết quả cho từng milestone
- **Auto-approval**: nếu client không phản hồi trong N ngày, milestone tự động được approved
- **Revision control**: mỗi milestone có giới hạn số lần revision
- **Contract Status Log**: audit trail đầy đủ mọi thay đổi trạng thái

### 4.6 Payments & Wallet

- **Wallet system**: mỗi user có balance, escrow, totalEarned
- **Escrow mechanism**: tiền được hold khi milestone bắt đầu, release khi approved
- **Transaction types**: `DEPOSIT, ESCROW, EARNED, WITHDRAW, REFUND`
- **Transaction history**: lịch sử đầy đủ với description và trạng thái

### 4.7 Reputation & Skill Assessment

**Reputation Tier System:**
- Freelancer được phân hạng: `NEW → RISING → ESTABLISHED → EXPERT → ELITE`
- **Skill Cluster Reputation**: điểm reputation riêng cho từng nhóm kỹ năng (Frontend, Backend, Design...)
- **Skill Vector**: vector TF-IDF biểu diễn profile kỹ năng, dùng cho recommendation

**Skill Assessment:**
- Bài kiểm tra kỹ năng (MCQ) cho từng skill
- Kết quả: assessment score + assessment level (Beginner/Intermediate/Advanced/Expert)
- Hiển thị badge trên profile để tăng uy tín với client

### 4.8 AI Recommendation Engine

- **Cho Freelancer**: gợi ý job phù hợp dựa trên **Cosine Similarity** giữa skill vector của freelancer và job
- **Cho Client**: gợi ý freelancer phù hợp cho job cụ thể
- **TF-IDF Algorithm**: xây dựng document vector từ skills, title, description
- **Exclude already-bid jobs**: không gợi ý job freelancer đã bid

### 4.9 Real-time Chat (WebSocket)

- **Socket.io** cho real-time messaging giữa Client và Freelancer
- **Conversation scoped**: mỗi cặp (client, freelancer) theo job có 1 conversation riêng
- **Read receipts**: đánh dấu đã đọc
- **Chat history**: lưu toàn bộ message trong PostgreSQL

### 4.10 AI Chat Assistant (Groq + Llama 3.3 70B)

- **Context-aware**: nhận biết role người dùng (Client/Freelancer/Admin)
- **Tư vấn thông minh**:
  - Freelancer: gợi ý cách viết proposal, mức giá bid hợp lý, cách nổi bật hồ sơ
  - Client: hướng dẫn viết job description, tư vấn budget, cách chọn freelancer
- **Lịch sử hội thoại**: duy trì context qua nhiều lượt chat
- **Song ngữ**: trả lời tiếng Việt hoặc tiếng Anh tùy ngôn ngữ người dùng dùng

### 4.11 Report & Dispute System

- **Report**: user báo cáo job/user/contract với category (SCAM, QUALITY_DISPUTE, PAYMENT, INAPPROPRIATE_CONTENT)
- **Evidence upload**: đính kèm bằng chứng
- **Dispute lifecycle**: `EVIDENCE_COLLECTION → UNDER_REVIEW → RESOLVED`
- **Admin resolution**: phân xử với các action (BAN_USER, REFUND, RELEASE_FUNDS, HIDE_JOB, WARNING)

### 4.12 Admin Dashboard

- **Platform stats**: tổng users, jobs, contracts, revenue
- **User management**: xem/suspend/unsuspend/deactivate tài khoản
- **Role assignment**: phân quyền ADMIN/MODERATOR/CLIENT/FREELANCER
- **Category & Skill management**: tạo/sửa/ẩn categories và skills
- **Assessment questions**: quản lý ngân hàng câu hỏi kiểm tra kỹ năng
- **Report queue**: xử lý báo cáo vi phạm
- **Dispute resolution**: phân xử tranh chấp với quyết định refund/release funds
- **System config**: cấu hình platform qua key-value (không cần deploy lại)
- **Review moderation**: ẩn/hiện đánh giá vi phạm

### 4.13 Freelancer Profile

- **Portfolio**: showcase dự án đã làm (link, file, mô tả)
- **Certificates**: chứng chỉ có link xác minh
- **CV upload**: tải CV lên profile
- **Hourly rate, skills, bio, availability status**
- **Public profile**: client xem profile freelancer từ bid

---

## 5. Điểm nổi bật & Sáng tạo

### Thuật toán AHP-TOPSIS cho đấu thầu
Không chỉ sắp xếp bid theo giá rẻ nhất. BidWise sử dụng mô hình quyết định đa tiêu chí AHP (Analytic Hierarchy Process) kết hợp TOPSIS để xếp hạng freelancer một cách khoa học, khách quan — đây là điểm khác biệt lớn nhất so với các platform như Fiverr/Upwork thông thường.

### Sealed Bid Auction
Cơ chế đấu thầu kín (như đấu thầu dự án thực tế) giúp loại bỏ tình trạng freelancer "anchor bid" theo nhau, tạo ra sự cạnh tranh lành mạnh hơn.

### Skill Vector & TF-IDF Recommendation
Mỗi freelancer có một vector kỹ năng được xây dựng bằng TF-IDF. Hệ thống dùng Cosine Similarity để matching — gợi ý thực sự dựa trên relevance, không chỉ keyword matching.

### AI Tích hợp thực tế (Groq + Llama 3.3 70B)
AI assistant không chỉ là chatbot thông thường — nó nhận biết role và cung cấp tư vấn cụ thể theo ngữ cảnh (freelancer được tư vấn về bid, client được tư vấn về job description).

### Security-First Architecture
- JWT in-memory + httpOnly cookie (không thể bị XSS đánh cắp RT)
- Redis blacklist đảm bảo logout tức thời trên mọi thiết bị
- Token rotation mỗi lần refresh
- Brute-force protection

### Milestone + Escrow = Bảo vệ cả 2 phía
Tiền được hold trong escrow khi milestone bắt đầu → freelancer được đảm bảo payment, client được đảm bảo có thể request revision trước khi release.

---

## 6. Luồng Demo

> **Gợi ý**: Chuẩn bị sẵn 3 tài khoản: `admin@bidwise.com`, `client@demo.com`, `freelancer@demo.com`

---

### Act 1 — Onboarding (3 phút)

**Mục tiêu**: Giới thiệu platform và cơ chế đăng ký hai vai trò

#### Bước 1.1 — Trang Landing (Homepage)
- Mở `http://localhost:3000`
- Giới thiệu ngắn: "BidWise là nền tảng freelance với cơ chế đấu thầu thay vì apply thông thường"
- Điểm qua các call-to-action: "Đăng ký làm Client" vs "Đăng ký làm Freelancer"

#### Bước 1.2 — Đăng ký tài khoản Freelancer
- Click "Register" → chọn vai trò **Freelancer**
- Điền thông tin → Submit
- Hệ thống gửi OTP Email — mở hòm thư demo, paste OTP
- **Điểm nhấn**: "Email OTP có hiệu lực 10 phút và bị vô hiệu hóa sau khi dùng — đảm bảo bảo mật"
- Sau verify → tài khoản `ACTIVE`, redirect về dashboard

#### Bước 1.3 — Login với tài khoản có sẵn
- Logout → Login bằng tài khoản `freelancer@demo.com`
- **Điểm nhấn**: "Access Token chỉ sống 15 phút, lưu in-memory. Refresh Token 7 ngày lưu httpOnly cookie — không thể bị JavaScript đọc"

---

### Act 2 — Freelancer Setup Profile (3 phút)

**Mục tiêu**: Cho thấy profile system và assessment

#### Bước 2.1 — Hoàn thiện Profile
- Vào **Settings → Profile**
- Upload avatar, điền bio, hourly rate, skills
- Upload CV (PDF)
- Thêm Portfolio item: tên dự án + link GitHub

#### Bước 2.2 — Skill Assessment
- Vào tab **Assessment**
- Chọn skill (ví dụ: "React") → làm bài kiểm tra MCQ
- Hoàn thành → nhận **Assessment Level badge** (Intermediate / Advanced / Expert)
- **Điểm nhấn**: "Badge này hiển thị công khai trên profile, tăng uy tín với client"

#### Bước 2.3 — AI Chat Assistant (Freelancer view)
- Mở **AI Chat** panel
- Hỏi: "Mình nên đặt giá bid bao nhiêu cho dự án React 1 tháng?"
- Hỏi: "Giúp mình viết proposal cho job web development"
- **Điểm nhấn**: "AI nhận biết bạn là Freelancer và tư vấn đúng ngữ cảnh — dùng Llama 3.3 70B qua Groq"

---

### Act 3 — Client Đăng Job & Cấu hình AHP (5 phút)

**Mục tiêu**: Show job creation và điểm độc đáo nhất của BidWise — AHP weighting

#### Bước 3.1 — Login Client
- Switch sang tài khoản `client@demo.com`

#### Bước 3.2 — Tạo Job
- Vào **Client Dashboard → Jobs → Create Job**
- Điền thông tin:
  - Title: "Xây dựng E-commerce Website với React + Node.js"
  - Budget: Range $500 - $800
  - Deadline: 30 ngày
  - Category: Web Development
  - Skills: React, Node.js, PostgreSQL
  - Auction Type: **Sealed Bid** (chọn để giải thích cơ chế)
- **Giải thích Sealed Bid**: "Freelancer không thấy giá của nhau — giống đấu thầu dự án thực tế, tránh anchor bias"
- Đính kèm file brief (PDF)
- Publish → Job status: `OPEN`

#### Bước 3.3 — Cấu hình AHP Weights
- Trong job detail → **Bid Ranking Settings**
- **Giải thích AHP**: "Thay vì chọn người giá rẻ nhất, hệ thống cho phép client đặt trọng số ưu tiên"
- Chọn preset: "Balanced" — show các trọng số tự động điền
- Hoặc custom: tăng `skillWeight` lên cao vì project cần React chuyên sâu
- Submit → hệ thống tính Consistency Ratio
- **Điểm nhấn**: "Nếu CR > 0.1, hệ thống báo lỗi và yêu cầu nhập lại — đảm bảo quyết định nhất quán"

---

### Act 4 — Freelancer Bid & AI Suggest (4 phút)

**Mục tiêu**: Show bidding flow và AI cover letter

#### Bước 4.1 — Xem Recommended Jobs
- Switch sang Freelancer account
- Dashboard → **Recommended Jobs** section
- **Điểm nhấn**: "Hệ thống dùng TF-IDF và Cosine Similarity — gợi ý job dựa trên skill vector của bạn, không phải keyword đơn giản"
- Job vừa tạo xuất hiện trong list (nếu skills khớp)

#### Bước 4.2 — Xem Job Detail
- Click vào job → xem mô tả, budget, skills yêu cầu
- **Sealed Bid**: không thấy bid của người khác

#### Bước 4.3 — Submit Bid với AI Suggest
- Click **"Place Bid"**
- Điền amount: $650, delivery: 25 ngày
- Click **"AI Suggest Cover Letter"**
- AI tự động generate cover letter dựa trên job description và profile
- Freelancer chỉnh sửa cho phù hợp → Submit
- **Điểm nhấn**: "Bid token quota — mỗi ngày có giới hạn bid, tránh spam"

---

### Act 5 — Client Review Bids — Điểm cao trào (5 phút)

**Mục tiêu**: Show AHP-TOPSIS ranking — tính năng trung tâm

#### Bước 5.1 — Xem Ranked Bids
- Switch về Client account
- Job detail → Tab **"Bids"**
- Hệ thống hiển thị danh sách bid đã được xếp hạng theo AHP-TOPSIS score
- Mỗi bid có: matching score, price score, skill score, rating score...
- **Điểm nhấn**: "Không cần đọc từng proposal — AI đã xếp hạng dựa trên trọng số bạn đặt ra"

#### Bước 5.2 — Compare Bids
- Chọn 2-3 bid → Click **"Compare"**
- Modal so sánh side-by-side các tiêu chí
- **Điểm nhấn**: "Client có thể compare trực quan thay vì đọc proposal rời rạc"

#### Bước 5.3 — Xem Freelancer Profile từ Bid
- Click vào tên freelancer → xem full profile
- Xem Portfolio, Certificates, Assessment badge, Reputation tier
- **Điểm nhấn**: "Tất cả thông tin cần để quyết định đều ở một chỗ"

#### Bước 5.4 — Shortlist & Accept Bid
- Shortlist bid (đánh dấu ứng viên tiềm năng)
- Accept bid tốt nhất → tự động tạo **Contract**

---

### Act 6 — Contract & Milestone Execution (4 phút)

**Mục tiêu**: Show quản lý hợp đồng theo milestone

#### Bước 6.1 — Xem Contract
- Cả Client và Freelancer đều thấy Contract
- Status: `PENDING_FREELANCER` → Freelancer accept → `ACTIVE`

#### Bước 6.2 — Milestone Timeline
- Contract detail → **Milestones** tab
- Xem timeline các milestone: "Design mockup", "Frontend", "Backend", "Deploy"
- Mỗi milestone có: amount, deadline, max revisions

#### Bước 6.3 — Submit Milestone (Freelancer)
- Switch Freelancer → Contract → Milestone 1
- Upload deliverable files (mockup PDF)
- Submit milestone → status: `SUBMITTED`

#### Bước 6.4 — Review & Approve/Reject (Client)
- Switch Client → Contract → Milestone 1
- Xem deliverables → Click **"Approve"**
- **Điểm nhấn Escrow**: "Tiền được release từ escrow về ví Freelancer ngay khi approve"
- Hoặc demo: Request Revision với feedback → Freelancer nhận notification

---

### Act 7 — Chat Real-time (2 phút)

**Mục tiêu**: Show real-time communication

#### Bước 7.1 — Mở Chat
- Client → Messages → Chọn conversation với Freelancer
- Gửi message → Freelancer nhận ngay lập tức (WebSocket)
- **Điểm nhấn**: "Chat được scope theo job — mỗi job có conversation riêng, không lẫn lộn"

---

### Act 8 — Report & Dispute (2 phút)

**Mục tiêu**: Show trust & safety system

#### Bước 8.1 — Report
- Demo report một job (category: INAPPROPRIATE_CONTENT)
- Upload evidence

#### Bước 8.2 — Dispute (nếu có contract bị tranh chấp)
- Open dispute → Phase: EVIDENCE_COLLECTION
- Cả 2 bên submit evidence

---

### Act 9 — Admin Dashboard (3 phút)

**Mục tiêu**: Show platform management

#### Bước 9.1 — Login Admin
- `http://localhost:3000/login/admin`
- Login với admin account

#### Bước 9.2 — Platform Stats
- Dashboard: tổng users, jobs active, contracts, doanh thu
- Biểu đồ overview

#### Bước 9.3 — User Management
- List users với search
- Xem chi tiết user, lịch sử account
- Demo: Suspend tài khoản vi phạm với lý do

#### Bước 9.4 — Report Queue
- Xem list reports pending
- Resolve report: action = "WARNING" hoặc "HIDE_JOB"
- **Điểm nhấn**: "Admin có đầy đủ công cụ moderation — không chỉ xem mà còn thực thi"

#### Bước 9.5 — System Config
- Vào System Config → show key-value settings
- **Điểm nhấn**: "Cấu hình platform live mà không cần deploy lại"

---

### Tổng kết Demo (1 phút)

> **Slide cuối / Lời kết:**
>
> BidWise không chỉ là một freelance marketplace — đây là nền tảng đấu thầu thông minh với:
>
> - **AHP-TOPSIS** giúp quyết định chọn freelancer khoa học, khách quan
> - **Sealed Bid Auction** tạo sự cạnh tranh lành mạnh
> - **AI tích hợp** (Recommendation + Cover Letter + Assistant) tăng trải nghiệm cả 2 phía
> - **Milestone + Escrow** bảo vệ quyền lợi cả Client lẫn Freelancer
> - **Security-first**: JWT in-memory, Redis blacklist, token rotation

---

## 7. Workflow dự án

### 7.1 Luồng nghiệp vụ chính (End-to-End Business Flow)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     LUỒNG TỔNG QUAN BIDWISE                         │
└─────────────────────────────────────────────────────────────────────┘

CLIENT                          SYSTEM                        FREELANCER
  │                               │                               │
  ├─ Đăng ký / Login ────────────►│◄─────────────── Đăng ký / Login ─┤
  │                               │                               │
  ├─ Tạo Job ────────────────────►│  Job status: OPEN             │
  │  (budget, skills, deadline)   │                               │
  │                               │◄───────── Xem Recommended Jobs ─┤
  ├─ Cấu hình AHP Weights ───────►│           (TF-IDF + Cosine)    │
  │  (pairwise matrix / preset)   │                               │
  │                               │◄────────────────── Submit Bid ──┤
  │                               │  (amount, proposal,            │
  │                               │   AI cover letter)             │
  │                               │                               │
  │                               │  AHP-TOPSIS tự động           │
  │                               │  xếp hạng tất cả bids         │
  │                               │                               │
  ├─ Xem Ranked Bids ────────────►│                               │
  ├─ Compare / Shortlist ────────►│                               │
  ├─ Accept Bid ─────────────────►│  Contract auto-created        │
  │                               │  Job status: IN_PROGRESS      │
  │                               │                               │
  │                               │◄──────────── Confirm Contract ──┤
  │                               │                               │
  │  ─────────────── Milestone Loop ──────────────────────────── │
  │                               │◄──────── Submit Milestone ──────┤
  ├─ Review Deliverables ────────►│           (upload files)       │
  ├─ Approve / Request Revision ─►│                               │
  │  [Approve] Escrow → Release ─►│──────── Payment to Wallet ──────┤
  │  [Revision] Feedback ────────►│◄──────── Revise & Resubmit ─────┤
  │  ─────────────── End Loop ──────────────────────────────────  │
  │                               │                               │
  ├─ Contract COMPLETED ─────────►│                               │
  ├─ Leave Review ───────────────►│◄──────────────── Leave Review ──┤
  │                               │  Reputation tier updated      │
```

---

### 7.2 Luồng Authentication (JWT Dual-Token)

```
ĐĂNG KÝ
  User nhập email + password
    └─► Server gửi OTP Email (hiệu lực 10 phút, 1 lần dùng)
    └─► User nhập OTP → Account status: ACTIVE

ĐĂNG NHẬP
  User nhập credentials
    └─► Server trả về:
          • Access Token (AT) — JWT, 15 phút, lưu in-memory (không localStorage)
          • Refresh Token (RT) — JWT, 7 ngày, lưu httpOnly cookie (JS không đọc được)

GỌI API
  Frontend gửi AT trong Authorization header
    └─► AT còn hạn → OK
    └─► AT hết hạn (401) → Interceptor tự động gọi /auth/refresh
          └─► RT hợp lệ → Server cấp AT mới + RT mới (Token Rotation)
                            RT cũ bị revoke trong Redis
          └─► RT hết hạn / blacklisted → Redirect /login

ĐĂNG XUẤT
  Gọi /auth/logout → RT bị đưa vào Redis Blacklist
    └─► Mọi request sau đó với RT cũ đều bị từ chối ngay lập tức
    └─► AT in-memory bị xóa phía client
```

---

### 7.3 Luồng AHP-TOPSIS (Thuật toán trung tâm)

```
INPUT: Client nhập pairwise comparison matrix (n×n)
       hoặc chọn preset (BEST_VALUE / QUALITY_FIRST / FAST_DELIVERY)
         │
         ▼
   ┌─────────────────────────┐
   │    AHP — Tính Weights   │
   │  1. Geometric Mean/hàng │
   │  2. Normalize → w_i     │
   │  3. Tính λ_max          │
   │  4. CR = CI / RI        │
   └────────────┬────────────┘
                │
          CR ≤ 0.10?
         /           \
       YES             NO
        │               └─► Báo lỗi, yêu cầu nhập lại
        ▼
   Weights [w1..w7] lưu vào DB
        │
        ▼
   ┌──────────────────────────────────┐
   │    TOPSIS — Xếp hạng Bids        │
   │  1. Normalize decision matrix    │  ← Input: tất cả bids của job
   │  2. Weighted normalized matrix   │
   │  3. Ideal Best A+ / Worst A-     │  ← Price: min=tốt, Skill: max=tốt
   │  4. Euclidean distance d+, d-    │
   │  5. CC = d- / (d+ + d-)          │
   └──────────────────────────────────┘
        │
        ▼
   OUTPUT: Ranked bid list (CC cao = bid tốt hơn)
           + Score breakdown từng tiêu chí
           + Hiển thị realtime mỗi khi client xem
```

---

### 7.4 Luồng Escrow & Payment

```
Bid được Accept
  └─► Contract tạo tự động
  └─► Client deposit vào Wallet (nếu chưa đủ)

Mỗi Milestone bắt đầu
  └─► Tiền milestone bị HOLD trong Escrow
      (Client không thể rút, Freelancer chưa nhận)

Freelancer submit Milestone
  └─► Client review deliverables
      ├─ APPROVE → Escrow RELEASE → Freelancer Wallet +amount
      ├─ REQUEST REVISION (còn revision quota)
      │    └─► Freelancer chỉnh sửa → Submit lại
      └─ REJECT (hết revision quota) → Mở Dispute

Dispute
  └─► EVIDENCE_COLLECTION (cả 2 bên upload bằng chứng)
  └─► UNDER_REVIEW (Admin xem xét)
  └─► RESOLVED:
        • REFUND → Escrow về Client Wallet
        • RELEASE_FUNDS → Escrow về Freelancer Wallet
        • Có thể kèm BAN_USER / WARNING
```

---

### 7.5 Luồng AI Recommendation (TF-IDF + Cosine Similarity)

```
GỢI Ý JOB CHO FREELANCER
  Khi Freelancer vào dashboard:
    1. Build flDoc = skills (×3 boost) + bio + portfolio titles + assessmentLevel
    2. Build jobDoc = title + description + skills (×3 boost) cho mỗi job OPEN
    3. TF-IDF vectorize tất cả documents
    4. Cosine Similarity: sim(flDoc, jobDoc) cho từng job
    5. Return top-10 jobs có similarity cao nhất
    6. Loại trừ jobs freelancer đã bid

GỢI Ý FREELANCER CHO CLIENT
  Tương tự nhưng ngược lại:
    sim(jobDoc, flDoc) cho từng freelancer có sẵn
    Return top-10 freelancers phù hợp nhất

TẠI SAO SKILLS × 3?
  → Boost TF của skill terms lên 3 lần
  → Skills trở thành signal chính, không bị chìm trong description dài
  → Kết quả: domain-aware matching (React job → React freelancer, không phải Python)
```

---

### 7.6 Luồng Spam Detection (Anti-Template Bid)

```
Freelancer submit Bid mới:
    1. Lấy 50 cover letters gần nhất của freelancer đó từ DB
    2. TF-IDF vectorize (newLetter + existing letters)
       - Lowercase, remove punctuation
       - Remove EN + VI stopwords
       - Build TF-IDF matrix
    3. Cosine Similarity: max(sim(new, d_i)) cho mỗi d_i trong 50 letters
    4. Threshold check:
       - score ≥ 0.85 → isTemplateBid = true → Badge "Template Bid" (màu cam)
       - score < 0.85 → genuine bid
    5. spamScore lưu vào DB, client có thể sort/filter theo đó

Tại sao threshold 0.85?
  → Ưu tiên precision: tránh flag nhầm genuine bids có chung vocabulary
  → Một số từ kỹ thuật (React, Node.js, TypeScript) tự nhiên xuất hiện ở nhiều letters
```

---

### 7.7 Luồng Data tổng thể (API Request Lifecycle)

```
Browser / Client App
    │
    │  HTTPS REST (JSON) hoặc WebSocket
    ▼
NestJS API (port 3001)
    │
    ├─ Global Guards
    │    ├─ JwtAuthGuard    → xác thực AT, extract user payload
    │    └─ RolesGuard      → kiểm tra permission (14 permissions)
    │
    ├─ Global Pipes
    │    └─ ValidationPipe  → validate & transform DTO (Zod-like)
    │
    ├─ Route Handler (Controller → Service)
    │    ├─ Business logic
    │    ├─ Prisma ORM → PostgreSQL
    │    └─ Redis (blacklist check, cache)
    │
    ├─ Global Interceptors
    │    └─ TransformResponseInterceptor → chuẩn hóa response format
    │         { success, data, message, timestamp }
    │
    └─ Global Filters
         └─ GlobalExceptionFilter → bắt mọi exception, trả error chuẩn
```

---

## 8. Q&A — Câu hỏi giáo viên thường hỏi

### Về thuật toán AHP-TOPSIS

**Q: Tại sao chọn AHP-TOPSIS thay vì chỉ dùng một thuật toán?**
> AHP mạnh về tính consistency và hierarchy — giúp client đặt trọng số nhất quán (có CR check). TOPSIS mạnh về ranking đa tiêu chí với ideal solution. Hybrid tận dụng ưu điểm của cả hai: AHP quyết định "tiêu chí nào quan trọng hơn", TOPSIS quyết định "bid nào tốt nhất".

**Q: Consistency Ratio là gì? Tại sao CR > 0.1 thì reject?**
> CR = CI / RI, trong đó CI = (λ_max - n)/(n-1). Nếu CR > 0.1, người dùng đang có mâu thuẫn logic — ví dụ: "A quan trọng hơn B, B quan trọng hơn C, nhưng C lại quan trọng hơn A". Ngưỡng 0.1 là tiêu chuẩn Saaty (1980) được công nhận rộng rãi.

**Q: Tại sao dùng Geometric Mean thay vì Exact Eigenvector?**
> Geometric Mean Method (GMM) cho kết quả sai lệch < 1% so với exact eigenvector và được Saaty chấp nhận là xấp xỉ hợp lệ. Ưu điểm thực tế: không cần linear algebra library, hiệu năng tốt hơn trong production, dễ implement và debug.

**Q: Kendall's τ = 0.5754 có ý nghĩa gì?**
> Kendall's Tau đo mức độ tương quan thứ tự giữa TOPSIS ranking và heuristic matchingScore (được tính độc lập bằng phương pháp khác). τ = 0.5754 là tương quan mạnh (τ ≥ 0.5). Vì hai phương pháp hoàn toàn độc lập về cách tính, kết quả này chứng minh TOPSIS capture đúng business logic.

---

### Về kiến trúc hệ thống

**Q: Tại sao chọn NestJS thay vì Express thuần?**
> NestJS có Dependency Injection, module hóa, Guards/Interceptors/Pipes built-in — phù hợp cho ứng dụng enterprise với nhiều module (13+ modules trong BidWise). Code có cấu trúc rõ ràng, dễ test, dễ scale. Express thuần sẽ phải tự implement những thứ đó.

**Q: Redis dùng để làm gì trong hệ thống?**
> Hai mục đích: (1) Token Blacklist — khi logout, Refresh Token bị đưa vào Redis với TTL = thời gian sống còn lại của token. Mọi request sau đó với token đó đều bị từ chối ngay lập tức mà không cần query DB. (2) Session cache — tăng tốc lookup thông tin session.

**Q: Access Token lưu in-memory nghĩa là gì? Tại sao không dùng localStorage?**
> In-memory = lưu trong biến JavaScript của ứng dụng (không phải localStorage hay sessionStorage). localStorage có thể bị XSS attack đọc được. In-memory thì không thể bị đọc từ script bên ngoài. Nhược điểm: mất khi refresh trang → giải quyết bằng cách gọi /auth/refresh tự động khi load app.

**Q: Tại sao dùng httpOnly cookie cho Refresh Token?**
> httpOnly cookie không thể bị JavaScript đọc — XSS attack dù inject được script cũng không đọc được RT. Cookie tự động gửi theo mọi request đến cùng domain → không cần xử lý thủ công. Kết hợp với SameSite=Strict để chống CSRF.

---

### Về tính năng & sản phẩm

**Q: Sealed Bid khác Open Bid như thế nào? Tại sao cần?**
> Sealed Bid: freelancer không thấy bid của người khác khi submit — như đấu thầu dự án thực tế. Tránh "anchor bias" — freelancer đặt giá theo nhau thay vì theo giá trị thực. Open Bid: công khai như eBay, tạo áp lực cạnh tranh theo kiểu khác. BidWise hỗ trợ cả hai để client chọn phù hợp.

**Q: Escrow hoạt động như thế nào? Ai giữ tiền?**
> Khi milestone bắt đầu, hệ thống lock số tiền tương ứng từ ví Client vào trạng thái Escrow (ghi nhận trong DB). Tiền không thực sự chuyển ra ngoài — chỉ là state change trong hệ thống. Khi Client approve milestone, state chuyển từ Escrow sang Freelancer Wallet. Nếu dispute, Admin quyết định release hay refund.

**Q: TF-IDF trong recommendation khác gì keyword search?**
> Keyword search: "React" → tìm job có chứa từ "React". TF-IDF + Cosine: tính vector biểu diễn cả document (skills + bio + portfolio), so sánh "góc giữa hai vector". Freelancer React sẽ có similarity cao với job React/Next.js/TypeScript vì cùng domain — dù không match từng keyword. Robust hơn, ít bị miss khi dùng từ đồng nghĩa.

**Q: AI Cover Letter Suggestion dùng model gì? Dữ liệu có bị gửi ra ngoài không?**
> Dùng Groq API với model Llama 3.3 70B (open-source LLM). Dữ liệu job description và profile được gửi lên Groq server để inference. Không lưu lại phía Groq theo chính sách của họ. Trong môi trường production thực tế, cần đánh giá thêm về data privacy.

**Q: Reputation Tier system hoạt động như thế nào?**
> Mỗi freelancer có điểm reputation được tính dựa trên: rating từ client, số contract hoàn thành, tỷ lệ thành công. Tier: NEW → RISING → ESTABLISHED → EXPERT → ELITE. Tier cao hơn có bid quota cao hơn (số bid được submit mỗi ngày) — tạo động lực xây dựng reputation.

---

### Về quá trình phát triển

**Q: Team phát triển theo mô hình nào? Phân công như thế nào?**
> Áp dụng mô hình Agile nhỏ — chia theo feature (không phải frontend/backend). Mỗi feature có người chịu trách nhiệm end-to-end (từ DB schema → API → UI). Dùng GitHub với branch per feature, PR review trước khi merge.

**Q: Khó khăn lớn nhất trong quá trình làm là gì?**
> (1) AHP-TOPSIS implementation: đảm bảo kết quả code khớp 100% với tính tay theo lý thuyết — phải verify từng bước. (2) JWT security: cân bằng UX (không logout đột ngột) với security (token rotation, blacklist). (3) Real-time với WebSocket: xử lý reconnect, message ordering khi nhiều client cùng lúc.

**Q: Nếu có thêm thời gian, sẽ cải thiện gì?**
> (1) Spam detection: nâng từ TF-IDF lên BERT-based semantic similarity để bắt được template variants. (2) Recommendation: thêm collaborative filtering kết hợp content-based để giảm cold-start. (3) Payment: tích hợp payment gateway thực (VNPay/Stripe) thay vì wallet nội bộ. (4) Mobile app.

---

## Phụ lục — Data Setup cho Demo

### Tài khoản cần chuẩn bị

```
Admin:      admin@bidwise.com / Admin@123
Client:     client@demo.com   / Client@123
Freelancer: fl@demo.com       / Fl@123
```

### Seed data gợi ý

- 1 Category: "Web Development"
- Skills: React, Node.js, PostgreSQL, TypeScript, Next.js
- 1 Assessment question set cho React
- 1 Freelancer profile đã hoàn chỉnh (portfolio, certificate, assessment done)
- 1 Job đã có 3 bids (để show ranked list ngay)
- 1 Contract đang active với 2 milestones (1 approved, 1 pending)

### Thứ tự màn hình demo nhanh (nếu time ngắn)

1. Landing page → Register → OTP verify (1 phút)
2. Freelancer profile + AI chat suggest (1 phút)
3. Client tạo job + AHP setup (2 phút)
4. AHP-TOPSIS ranked bids → Compare → Accept (3 phút) ← **high point**
5. Contract milestone → Submit → Approve + Escrow (2 phút)
6. Admin dashboard stats + report resolve (1 phút)
