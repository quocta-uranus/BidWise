# Demo Test Guide — Feature 5: Smart Matching & MCDM Engine

**Mục tiêu:** Test end-to-end cả 3 thuật toán (AHP-TOPSIS, Spam Detection, Content-Based Recommendation)
qua giao diện thực tế với 2 role: CLIENT và FREELANCER.

---

## Chuẩn bị

### 1. Khởi động server

Mở 2 terminal:

```bash
# Terminal 1 — Backend
cd be && pnpm start:dev

# Terminal 2 — Frontend
cd fe && pnpm dev
```

- Backend: http://localhost:3001/api/v1
- Frontend: http://localhost:3000

### 2. Tài khoản test

| Role | Email | Password | Ghi chú |
|------|-------|----------|---------|
| CLIENT | `client@bidwise.dev` | `Password123!` | Chủ job 4 (NestJS API đang active) |
| CLIENT 2 | `large-client-01@bidwise.dev` | `Password123!` | Client từ large seed |
| FREELANCER A | `freelancer1@bidwise.dev` | `Password123!` | Lê Văn Hùng — React/NestJS/PostgreSQL |
| FREELANCER B | `freelancer2@bidwise.dev` | `Password123!` | Phạm Thị Lan — Figma/UI-UX/React |
| FREELANCER C | `freelancer3@bidwise.dev` | `Password123!` | Nguyễn Quốc Tuấn — React Native |
| FREELANCER D | `large-fl-01@bidwise.dev` | `Password123!` | Nguyễn Anh Tuấn — React/Next.js |

---

## SCENARIO 1 — Thuật toán AHP-TOPSIS Preset (CLIENT)

> **Mục tiêu:** Verify 3 preset AHP cards hoạt động đúng, job được tạo với weights, bids được rank đúng.

### Bước 1: Login Client

- [ ] Vào http://localhost:3000
- [ ] Login: `client@bidwise.dev` / `Password123!`
- [ ] Verify: redirect về dashboard client

---

### Bước 2: Tạo job mới với AHP Preset

- [ ] Click "Post a Job" (hoặc "/jobs/create")
- [ ] Điền form:
  - **Title:** `Xây dựng E-Commerce Dashboard với React + NestJS`
  - **Description:** `Cần fullstack developer xây dashboard quản lý đơn hàng, inventory, báo cáo doanh thu. Tech: React, NestJS, PostgreSQL, Redis.`
  - **Category:** Web Development
  - **Budget:** `$1,200`
  - **Skills:** React, NestJS, PostgreSQL, TypeScript
  - **Deadline:** 30 ngày kể từ hôm nay

#### Test AHP Preset Cards:

- [ ] **T1** — Thấy 3 card preset phía trên slider AHP: `⚖️ Best Value`, `🏆 Quality First`, `⚡ Fast Delivery`
- [ ] **T2** — Click card **"⚖️ Best Value"**
  - Slider **Price** nhảy lên **40%**
  - Slider **Skill Match** nhảy lên **25%**
  - Card highlight màu xanh
- [ ] **T3** — Click card **"🏆 Quality First"**
  - Slider **Skill Match** nhảy lên **35%**
  - Slider **Rating** nhảy lên **20%**
  - Slider **Price** giảm xuống **10%**
- [ ] **T4** — Click card **"⚡ Fast Delivery"**
  - Slider **Speed** nhảy lên **25%**
- [ ] **T5** — Kéo bất kỳ slider nào → Card highlight biến mất (preset cleared)
- [ ] **T6** — Re-chọn **"⚖️ Best Value"** → Submit job

- [ ] Verify: Job được tạo, redirect về trang job detail

---

### Bước 3: Xem TopFreelancerSuggestions (job chưa có bid)

> **Mục tiêu:** Khi job mới chưa có bid nào, widget `TopFreelancerSuggestions` xuất hiện thay vì "No bids yet".

- [ ] **T7** — Vào tab "Bids" của job vừa tạo
- [ ] **T7a** — Thay vì "No bids" empty state, thấy **"Top Freelancers for This Job"** widget
- [ ] **T7b** — Có ít nhất 3-5 freelancer cards được rank bởi TF-IDF similarity
- [ ] **T7c** — Card #1 có **badge vàng 🥇**, card #2 **bạc 🥈**, card #3 **đồng 🥉**
- [ ] **T7d** — Mỗi card có similarity bar (`score × 2`, max 100%)
- [ ] **T7e** — Freelancer **Lê Văn Hùng** (React/NestJS skills) có rank cao hơn **Nguyễn Quốc Tuấn** (React Native)

---

## SCENARIO 2 — TOPSIS Ranking Bid (FREELANCER → CLIENT)

> **Mục tiêu:** Verify TOPSIS xếp hạng bid đúng — bid rẻ hơn + skill tốt hơn sẽ rank #1 với preset "Best Value".

### Bước 4: Login FREELANCER A và submit bid giá tốt

- [ ] Mở tab khác (Incognito) → Login: `freelancer1@bidwise.dev` / `Password123!`
- [ ] Tìm job vừa tạo ở Scenario 1 (search "E-Commerce Dashboard")
- [ ] Submit bid:
  - **Amount:** `$900` _(thấp hơn budget $1,200)_
  - **Delivery:** 20 ngày
  - **Cover Letter:**
    ```
    Chào bạn,

    Tôi là Lê Văn Hùng, senior fullstack developer với 5 năm kinh nghiệm
    chính xác stack này: React, NestJS, PostgreSQL, TypeScript.

    Đã hoàn thành 3 dự án dashboard tương tự cho SaaS B2B:
    - E-Commerce SaaS Platform (10,000+ users, real-time analytics)
    - Inventory management system (100K+ SKUs, barcode scanning)

    Timeline: 20 ngày, có thể bắt đầu ngay tuần này.
    Portfolio: github.com/lehungtailieu

    Trân trọng, Lê Văn Hùng
    ```
- [ ] Click Submit

- [ ] **T8** — Verify bid submitted thành công, không có "Template Bid" badge

---

### Bước 5: Login FREELANCER B submit bid kém phù hợp hơn

- [ ] Đổi sang tab `freelancer2@bidwise.dev` / `Password123!`
- [ ] Tìm cùng job trên
- [ ] Submit bid:
  - **Amount:** `$1,150` _(gần budget nhưng cao hơn FL-A)_
  - **Delivery:** 28 ngày
  - **Cover Letter:**
    ```
    Chào,

    Tôi có kinh nghiệm React và một số NestJS. Đã làm UI/UX nhiều
    năm, dashboard sẽ rất đẹp và professional.

    Giá $1,150 trong 28 ngày.

    Phạm Thị Lan
    ```
- [ ] Submit

---

### Bước 6: Xem TOPSIS ranking (CLIENT)

- [ ] Quay lại tab CLIENT → F5 refresh trang job
- [ ] Vào tab "Bids"
- [ ] **T9** — Thấy 2 bids đã sorted theo TOPSIS score
- [ ] **T10** — **Lê Văn Hùng** (giá $900, React+NestJS skills) → **Rank #1** 🏆
- [ ] **T11** — **Phạm Thị Lan** (giá $1,150, ít skill match hơn) → **Rank #2**
- [ ] **T12** — Cả 2 bids có **topsisScore** hiển thị (dạng thanh bar hoặc số %)
- [ ] **T13** — Verify: `topsisScore` FL-A > `topsisScore` FL-B (FL-A được rank cao hơn)

---

## SCENARIO 3 — NLP Spam Detection (FREELANCER)

> **Mục tiêu:** Verify hệ thống phát hiện cover letter template và hiển thị badge "Template Bid".

### Bước 7: FREELANCER D submit bid genuine (lần 1)

- [ ] Mở tab Incognito → Login: `large-fl-01@bidwise.dev` / `Password123!`
- [ ] Tìm job `large-job-01` (hoặc bất kỳ job nào đang OPEN)
- [ ] Submit bid với **cover letter unique** (>50 từ, mention tên job cụ thể):
  ```
  Chào bạn,

  Tôi đọc kỹ yêu cầu "Xây dựng Dashboard Admin SaaS với Next.js 14" và
  rất phù hợp. 4 năm kinh nghiệm Next.js App Router, từ v12 lên v14.

  Cụ thể: đã xây admin dashboard cho fintech startup với
  40+ charts Recharts, RBAC 5 levels, audit logs, dark mode.
  Performance: Lighthouse 95+, bundle size < 200KB gzipped.

  Đề xuất: $1,100 trong 22 ngày. Start ngay tuần này.
  ```
- [ ] **T14** — Bid submitted, **KHÔNG có** "Template Bid" badge

---

### Bước 8: FREELANCER D submit bid template/spam (lần 2 — cùng cấu trúc)

- [ ] Tìm job khác (ví dụ `large-job-02`) **khác category**
- [ ] Submit bid với **cùng cover letter gần như y hệt** (chỉ đổi tên job):
  ```
  Chào bạn,

  Tôi đọc kỹ yêu cầu "REST API NestJS cho E-Commerce Platform" và
  rất phù hợp. 4 năm kinh nghiệm Next.js App Router, từ v12 lên v14.

  Cụ thể: đã xây admin dashboard cho fintech startup với
  40+ charts Recharts, RBAC 5 levels, audit logs, dark mode.
  Performance: Lighthouse 95+, bundle size < 200KB gzipped.

  Đề xuất: $1,100 trong 22 ngày. Start ngay tuần này.
  ```
- [ ] **T15** — Bid submitted, thấy badge **🟠 "Template Bid"** màu cam xuất hiện trên bid card

> **Giải thích:** Hệ thống so sánh cover letter mới với tất cả cover letters cũ của freelancer này. Cosine similarity ≥ 0.85 → flag. Cấu trúc y hệt chỉ đổi tên job → similarity ≈ 0.90+.

- [ ] **T16** — Hover vào badge "Template Bid" → tooltip hiển thị: `Spam score: 90%+ - This appears to be a template bid...`

---

### Bước 9: Verify từ phía CLIENT

- [ ] Quay lại CLIENT tab
- [ ] Mở job `large-job-02`
- [ ] Vào tab Bids
- [ ] **T17** — Bid của `large-fl-01` có badge 🟠 **"Template Bid"** màu cam
- [ ] **T18** — Bid genuine (job-01) của cùng freelancer **không có** badge

---

## SCENARIO 4 — Content-Based Recommendation (FREELANCER)

> **Mục tiêu:** Verify freelancer thấy đúng jobs phù hợp với skills của mình.

### Bước 10: Xem Recommended Jobs (FREELANCER A)

- [ ] Tab `freelancer1@bidwise.dev` (React/NestJS/PostgreSQL skills)
- [ ] Vào section **"Recommended Jobs"** (trang chủ freelancer hoặc Explore Jobs)
- [ ] **T19** — Thấy danh sách jobs với **similarity ring** (circular progress SVG)
- [ ] **T20** — Jobs liên quan React/NestJS/Backend đứng **trên cùng**:
  - Ví dụ: "Xây dựng Dashboard Admin SaaS..." (React+NestJS) → similarity cao nhất
  - "REST API NestJS cho E-Commerce" → similarity cao
- [ ] **T21** — Jobs KHÔNG liên quan đứng cuối:
  - "Flutter Health & Fitness Tracker" → similarity thấp (skills: Flutter, Dart)
  - "Brand Identity & Logo Design" → similarity gần 0 (skills: Illustrator, Photoshop)
- [ ] **T22** — Mỗi job card hiển thị **matched skills** (màu xanh ✓) và **missing skills** (màu xám)

---

### Bước 11: So sánh với FREELANCER C (React Native)

- [ ] Tab `freelancer3@bidwise.dev` (React Native/iOS/Android skills)
- [ ] Vào **Recommended Jobs**
- [ ] **T23** — Mobile jobs đứng trên cùng:
  - "App E-Commerce iOS & Android React Native" → highest similarity
  - "Flutter App Quản lý Tài chính" → similarity trung bình
- [ ] **T24** — Web/Backend jobs đứng thấp hơn so với FL-A
- [ ] **T25** — Verify: thứ tự recommended jobs của FL-C **khác** FL-A (algorithm personalized đúng)

---

## SCENARIO 5 — Reputation Dashboard (FREELANCER)

> **Mục tiêu:** Verify radar chart và WMA reputation hiển thị đúng.

### Bước 12: Xem Reputation Dashboard

- [ ] Tab `freelancer1@bidwise.dev`
- [ ] Vào **Profile** → scroll xuống cuối
- [ ] **T26** — Thấy section **"Reputation"** với hexagonal SVG radar chart
- [ ] **T27** — Chart có 6 axes: Frontend, Backend, Mobile, Design, DevOps, Data
- [ ] **T28** — Freelancer1 có điểm **Backend** cao nhất (NestJS/PostgreSQL skills)
- [ ] **T29** — Dashed line là **Market Benchmark** (trung bình thị trường)
- [ ] **T30** — Phía dưới chart: **Market Comparison** bars cho mỗi cluster
  - Mỗi bar hiển thị: My Score / Market Avg / delta (+/- so với market)

#### Nếu freelancer chưa có review nào:

- [ ] **T31** — Empty state: "Bạn chưa có đánh giá nào từ client. Hoàn thành contract đầu tiên để xây dựng reputation!"

---

### Bước 13: Trigger Reputation Update (WMA)

> Dùng contract đã seed sẵn: `seed-contract-001` (FL1 + CLIENT)

- [ ] CLIENT tab → vào **My Contracts** → Contract "Backend API REST với NestJS"
- [ ] Milestone 2 đang "SUBMITTED" → Click **"Approve"**
- [ ] **T32** — Dialog: Nhập rating `5 sao` + feedback "Excellent work!"
- [ ] **T33** — After approve: SkillClusterReputation của FL1 cập nhật
  - Formula WMA: `new_score = old_score × 0.8 + 5 × 0.2`
- [ ] Refresh Reputation Dashboard của FL1
- [ ] **T34** — Score Backend cluster **tăng** (hoặc ổn định nếu đã cao)

---

## SCENARIO 6 — Browse Freelancers Tab (CLIENT)

> **Mục tiêu:** Verify search/filter và tier badges hoạt động đúng.

- [ ] CLIENT tab → **Explore Freelancers** (hoặc tab "Find Talent")
- [ ] **T35** — Grid freelancer cards load (ít nhất 10 cards từ large seed)
- [ ] **T36** — Mỗi card có **tier badge**: VERIFIED/GOLD/SILVER/NEW với màu đúng:
  - 🟢 Emerald = VERIFIED
  - 🟡 Amber = GOLD
  - ⚫ Slate = SILVER
  - ⬜ Grey = NEW
- [ ] **T37** — Gõ "Nguyễn" vào search box → debounce 350ms → filter ngay
- [ ] **T38** — Chọn skill filter "React" → chỉ hiện freelancers có React
- [ ] **T39** — Clear filter → full list trở lại

---

## SCENARIO 7 — API Smoke Test (curl)

> Dùng terminal để test trực tiếp. Thay `<TOKEN>` bằng access token sau khi login.

### 7.1 Login và lấy token

```bash
# Login CLIENT
curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"client@bidwise.dev","password":"Password123!"}' \
  | python3 -m json.tool
```

- [ ] **T40** — Response có `accessToken` và `refreshToken`

```bash
# Lưu token (copy từ output trên)
CLIENT_TOKEN="<paste_access_token_here>"
```

### 7.2 Test AHP-TOPSIS Bid Ranking

```bash
# Lấy bids của job1 đã sorted theo TOPSIS
curl -s http://localhost:3001/api/v1/client-bids/seed-job-001 \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  | python3 -m json.tool | grep -E "rank|topsisScore|bidId" | head -20
```

- [ ] **T41** — Output có `rank`, `topsisScore` trong response
- [ ] **T42** — Bids sorted: rank 1 trước (topsisScore cao nhất)

### 7.3 Test Recommendation

```bash
# Login FREELANCER
FL_TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"freelancer1@bidwise.dev","password":"Password123!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

# Recommended jobs cho freelancer
curl -s "http://localhost:3001/api/v1/recommendations/jobs?limit=5" \
  -H "Authorization: Bearer $FL_TOKEN" \
  | python3 -m json.tool | grep -E "title|similarity|matchedSkills" | head -20
```

- [ ] **T43** — Response có `similarity`, `matchedSkills` per job
- [ ] **T44** — Job "Dashboard Admin SaaS" (React+NestJS) có similarity cao nhất

### 7.4 Test Spam Detection trong Bid

```bash
# Submit genuine bid
curl -s -X POST http://localhost:3001/api/v1/bids \
  -H "Authorization: Bearer $FL_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "jobId": "seed-job-002",
    "amount": 650,
    "deliveryDays": 12,
    "coverLetter": "Chào bạn, tôi có kinh nghiệm UI/UX 3 năm với Figma và thiết kế Fintech. Đã hoàn thành 5 landing page cho startup, conversion rate tăng trung bình 35%. Có thể gửi portfolio cụ thể theo yêu cầu.",
    "proposal": "UI/UX experience for Fintech"
  }' \
  | python3 -m json.tool | grep -E "isTemplateBid|spamScore"
```

- [ ] **T45** — `"isTemplateBid": false`, `spamScore` thấp (< 0.5)

```bash
# Submit template/spam bid (same structure as above, different job)
curl -s -X POST http://localhost:3001/api/v1/bids \
  -H "Authorization: Bearer $FL_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "jobId": "seed-job-003",
    "amount": 650,
    "deliveryDays": 12,
    "coverLetter": "Chào bạn, tôi có kinh nghiệm UI/UX 3 năm với Figma và thiết kế Fintech. Đã hoàn thành 5 landing page cho startup, conversion rate tăng trung bình 35%. Có thể gửi portfolio cụ thể theo yêu cầu.",
    "proposal": "React Native experience"
  }' \
  | python3 -m json.tool | grep -E "isTemplateBid|spamScore"
```

- [ ] **T46** — `"isTemplateBid": true`, `spamScore` ≥ 0.85

### 7.5 Test Reputation

```bash
# Reputation của freelancer1
curl -s "http://localhost:3001/api/v1/reputation/me" \
  -H "Authorization: Bearer $FL_TOKEN" \
  | python3 -m json.tool | grep -E "cluster|score|tier" | head -15
```

- [ ] **T47** — Response có `clusters`, `overallScore`, `tier`

```bash
# Market benchmark (public)
curl -s "http://localhost:3001/api/v1/reputation/benchmark" \
  | python3 -m json.tool
```

- [ ] **T48** — Có 6 clusters với `avgScore` và `totalReviews`

---

## Checklist Tổng Kết

### AHP-TOPSIS

| # | Test | Pass? |
|---|------|-------|
| T1 | 3 preset cards visible trên Create Job form | ☐ |
| T2 | Best Value preset → Price 40%, Skill 25% | ☐ |
| T3 | Quality First preset → Skill 35%, Rating 20% | ☐ |
| T4 | Fast Delivery preset → Speed 25% | ☐ |
| T5 | Slider change clears active preset | ☐ |
| T6 | Job tạo thành công với AHP weights | ☐ |
| T9 | Bids sorted: rẻ hơn + skill tốt hơn = Rank #1 | ☐ |
| T10 | FL-A (React+NestJS, $900) → Rank #1 | ☐ |
| T11 | FL-B (ít skill, $1,150) → Rank #2 | ☐ |
| T41 | API `/client-bids/:id` có `rank` + `topsisScore` | ☐ |
| T42 | Bids sorted descending by topsisScore | ☐ |

### Content-Based Recommendation

| # | Test | Pass? |
|---|------|-------|
| T7 | TopFreelancerSuggestions xuất hiện khi 0 bids | ☐ |
| T7e | React/NestJS freelancer rank cao hơn React Native | ☐ |
| T19 | Recommended Jobs section visible | ☐ |
| T20 | React/NestJS jobs đứng đầu cho FL-A | ☐ |
| T21 | Flutter/Figma jobs đứng cuối cho FL-A | ☐ |
| T22 | Matched skills (xanh) vs missing (xám) | ☐ |
| T23 | Mobile jobs đứng đầu cho FL-C | ☐ |
| T25 | FL-A và FL-C có thứ tự job recommendations khác nhau | ☐ |
| T35 | Browse Freelancers grid load | ☐ |
| T37 | Search debounce hoạt động | ☐ |
| T38 | Skill filter hoạt động | ☐ |
| T43 | API recommendation có `similarity` + `matchedSkills` | ☐ |

### Spam Detection

| # | Test | Pass? |
|---|------|-------|
| T14 | Genuine bid → NO "Template Bid" badge | ☐ |
| T15 | Template bid → 🟠 "Template Bid" badge | ☐ |
| T16 | Hover badge → tooltip spam score | ☐ |
| T17 | CLIENT thấy badge trên bid list | ☐ |
| T18 | Genuine bid (job-01) của same FL không có badge | ☐ |
| T45 | API: genuine bid → `isTemplateBid: false` | ☐ |
| T46 | API: template bid → `isTemplateBid: true` | ☐ |

### Reputation Dashboard

| # | Test | Pass? |
|---|------|-------|
| T26 | Radar chart SVG visible | ☐ |
| T27 | 6 axes đúng nhãn | ☐ |
| T28 | Backend cluster cao nhất cho FL-A | ☐ |
| T29 | Dashed line = market benchmark | ☐ |
| T31 | Empty state khi chưa có review | ☐ |
| T34 | Score tăng sau khi client approve milestone | ☐ |
| T47 | API `/reputation/me` có clusters | ☐ |
| T48 | API `/reputation/benchmark` có 6 clusters | ☐ |

---

## Troubleshooting

### Recommendation không hiện

```bash
# Rebuild TF-IDF vectors thủ công
curl -s -X POST http://localhost:3001/api/v1/recommendations/rebuild-vector \
  -H "Authorization: Bearer $FL_TOKEN"
```

### Spam threshold không đúng

Threshold cứng = **0.85** trong `be/src/modules/bidding/services/nlp-spam.service.ts` line 21.
Cover letter cần tương đồng ≥ 85% về TF-IDF cosine mới bị flag.

### Template bid test không trigger

Cần đảm bảo freelancer đã submit **ít nhất 1 bid trước** với cùng cover letter structure.
Spam check so sánh bid mới vs **tất cả bids cũ của cùng freelancer đó**.

### TOPSIS score = 0 cho tất cả

Xảy ra khi chỉ có 1 bid (A+ = A-). Cần ít nhất 2 bids để TOPSIS có ý nghĩa.
