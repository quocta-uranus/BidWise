# BidWise – Implementation Report: 3.2 Bid & Matching + 3.3 Contract & Milestone

## Tổng quan

Đã triển khai đầy đủ **backend (NestJS)** và **frontend (Next.js)** cho hai module:
- **3.2 Quản lý Bid & Matching** (CL-09 → CL-14, CORE)
- **3.3 Quản lý Contract & Milestone** (CL-18 → CL-22 + FL-19 → FL-23, CORE)

---

## 1. Database Schema (Prisma)

### Enums thêm mới
| Enum | Values |
|---|---|
| `BidStatus` (mở rộng) | + `SHORTLISTED`, `EXPIRED` |
| `ContractStatus` | `DRAFT`, `ACTIVE`, `PAUSED`, `COMPLETED`, `DISPUTED`, `CANCELLED` |
| `MilestoneStatus` | `NOT_STARTED`, `IN_PROGRESS`, `SUBMITTED`, `APPROVED`, `REJECTED`, `REVISION_REQUESTED` |
| `ContractActionType` | `CREATED`, `ACTIVATED`, `PAUSED`, `RESUMED`, `COMPLETED`, `DISPUTED`, `CANCELLED`, `MILESTONE_APPROVED`, `MILESTONE_REJECTED` |

### Tables thêm mới
| Table | Mô tả |
|---|---|
| `contracts` | Hợp đồng: state machine, escrow amount, điều khoản, liên kết job/bid/client/freelancer |
| `milestones` | Milestone: deadline, %, amount, revisions, auto-approve timer |
| `milestone_deliverables` | File bàn giao của freelancer cho từng milestone |
| `contract_status_logs` | Audit log bất biến mọi chuyển trạng thái hợp đồng |

---

## 2. Backend (NestJS)

### 2.1 Module: `ClientBidsModule` — 3.2 Bid & Matching

**File:** `be/src/modules/client-bids/`

#### AHP-TOPSIS Engine (`ahp-topsis.service.ts`)
- Thuật toán TOPSIS chuẩn (vector normalization → weighted matrix → ideal A+ / A− → distance → score)
- 7 tiêu chí: `price` (cost), `skillMatch`, `experience`, `rating`, `speed` (cost), `deadlineFit`, `portfolioScore`
- Trọng số từ `AhpWeight` của job (client đã cài đặt lúc đăng job)
- Output: `topsisScore` (0–1), `rank`, `normalizedCriteria`, `weightedCriteria`, `distanceToIdeal`, `distanceToNegIdeal`

#### Endpoints (`/client/jobs/:jobId/bids`)
| Method | Endpoint | Feature | Mô tả |
|---|---|---|---|
| `GET` | `/client/jobs/:jobId/bids` | CL-09, CL-10 | Danh sách bid xếp hạng TOPSIS + score breakdown |
| `POST` | `/client/jobs/:jobId/bids/compare` | CL-11 | So sánh 2–4 bids side-by-side |
| `PATCH` | `/client/jobs/:jobId/bids/:bidId/shortlist` | CL-12 | Toggle shortlist bid |
| `PATCH` | `/client/jobs/:jobId/bids/:bidId/decide` | CL-13 | Accept/Reject bid (auto-reject các bid còn lại khi accept) |
| `GET` | `/client/jobs/:jobId/bids/:bidId/freelancer` | CL-14 | Xem full profile freelancer từ bid |

**Logic accept bid:**
- Bid được chọn → status = `ACCEPTED`
- Tất cả bid còn lại → `REJECTED`
- Job → status = `IN_PROGRESS`

---

### 2.2 Module: `ContractsModule` — 3.3 Contract & Milestone

**File:** `be/src/modules/contracts/`

#### Client Endpoints (`/client/contracts`)
| Method | Endpoint | Feature | Mô tả |
|---|---|---|---|
| `POST` | `/client/contracts` | CL-18 | Tạo contract từ accepted bid; validate % milestones = 100% |
| `GET` | `/client/contracts` | CL-20 | Danh sách contracts với filter status |
| `GET` | `/client/contracts/:id` | CL-20 | Chi tiết contract + milestones + deliverables + status logs |
| `PATCH` | `/client/contracts/:id/milestones/:milestoneId/review` | CL-21 | Duyệt/từ chối/yêu cầu sửa milestone |
| `PATCH` | `/client/contracts/:id/cancel` | CL-22 | Hủy contract (log lý do, reset job/bid) |

#### Freelancer Endpoints (`/freelancer/contracts`)
| Method | Endpoint | Feature | Mô tả |
|---|---|---|---|
| `GET` | `/freelancer/contracts` | FL-19, FL-23 | Danh sách contracts + milestones |
| `GET` | `/freelancer/contracts/:id` | FL-19 | Chi tiết contract |
| `POST` | `/freelancer/contracts/:id/milestones/:milestoneId/submit` | FL-22 | Nộp milestone + upload deliverables |
| `PATCH` | `/freelancer/contracts/:id/milestones/:milestoneId/progress` | FL-20 | Cập nhật ghi chú tiến độ |
| `PATCH` | `/freelancer/contracts/:id/cancel` | — | Freelancer hủy contract |

**Logic review milestone:**
- `APPROVED`: milestone approved, check all milestones → nếu all approved → contract `COMPLETED` + log
- `REJECTED`/`REVISION_REQUESTED`: increment revisionCount, check maxRevisions
- Auto-approve: `autoApproveAt` được set khi submit (now + `autoApprovalDays` ngày)

---

## 3. Frontend (Next.js)

### 3.1 Bid Management UI — 3.2

**Components:**

#### `RankedBidsList.tsx`
- Load bids từ `/client/jobs/:jobId/bids`
- Hiển thị bid theo thứ hạng TOPSIS với badge #1/#2/#3 (gold/silver/bronze)
- Expand bid để xem `BidScoreChart` + cover letter
- Filter tabs: ALL / PENDING / SHORTLISTED / ACCEPTED / REJECTED
- Actions: Shortlist toggle (Bookmark icon), Accept (Check), Reject (X), View Profile (Eye), Compare toggle

#### `BidScoreChart.tsx`
- Bar chart visualization điểm weighted TOPSIS từng tiêu chí (7 bars với màu riêng)
- Hiển thị topsisScore tổng, D+ / D− distances

#### `BidCompareModal.tsx`
- Chọn 2–4 bids → Click "So sánh" → Modal bảng so sánh song song
- Rows: Freelancer, Giá, Thời gian, TOPSIS Score, Kỹ năng, Assessment, Portfolio, Trạng thái, Hành động

#### `FreelancerProfileModal.tsx`
- Xem full profile: avatar, bio, skills, assessment score, portfolio items, certificates
- Load từ `/client/jobs/:jobId/bids/:bidId/freelancer`

#### `CreateContractModal.tsx`
- Tự động hiện ra sau khi client accept bid
- Form tạo milestone: tên, %, deadline, maxRevisions
- Real-time validation: tổng % phải = 100%, hiển thị số tiền từng milestone

**Integration:**
- `ClientJobsTab.tsx`: Replace mock bid list bằng `RankedBidsList` component
- Dashboard: `activeTab === 'contracts' && role === 'CLIENT'` → `ClientContractsTab`

---

### 3.2 Contract & Milestone UI — 3.3

#### `MilestoneTimeline.tsx`
- Timeline milestones với icon + màu theo status
- Progress bar tổng thể (approved / total)
- Badges: trễ hạn (deadline passed), chờ duyệt, yêu cầu sửa
- Client actions (khi SUBMITTED): Duyệt, Yêu cầu sửa, Từ chối
- Freelancer actions (khi NOT_STARTED/IN_PROGRESS/REVISION_REQUESTED): Nộp nghiệm thu
- Hiển thị deliverables (file links), clientFeedback, freelancerNotes, revisionCount

#### `ContractCard.tsx`
- Card tóm tắt contract: title, counterpart name, status badge, total amount, milestone progress, pending review alert

#### `ContractDetail.tsx`
- Modal chi tiết contract
- Embed `MilestoneTimeline`
- Sub-modals: Submit milestone (với notes), Review milestone (với feedback), Cancel contract (với lý do)

#### `ClientContractsTab.tsx`
- Stats grid: Tổng, Đang thực hiện, Chờ nghiệm thu, Hoàn thành
- Filter tabs theo status
- Grid cards `ContractCard` → click mở `ContractDetail`

#### `ContractsTab.tsx` (Freelancer — rewritten)
- Cùng pattern với `ClientContractsTab`
- Load từ `/freelancer/contracts`
- Stats: Tổng, Đang thực hiện, Cần hành động, Hoàn thành

---

## 4. API Client files (FE)

| File | Mô tả |
|---|---|
| `client-bids.api.ts` | `getRankedBids`, `compareBids`, `shortlistBid`, `decideBid`, `getFreelancerProfile` |
| `contracts.api.ts` | `createContract`, `listClientContracts`, `reviewMilestone`, `cancelClientContract`, `listFreelancerContracts`, `submitMilestone`, `updateMilestoneProgress`, `cancelFreelancerContract` |

---

## 5. Luồng hoạt động tổng thể

### Luồng 3.2 — Client chọn freelancer:
```
Job OPEN → Freelancers submit bids
→ Client vào Jobs tab → chọn job → RankedBidsList load
→ AHP-TOPSIS ranking tự động (7 tiêu chí + AHP weights của job)
→ Client xem score breakdown, expand bid, xem profile freelancer
→ Shortlist 2–4 bids → so sánh side-by-side
→ Accept bid → confirm → tất cả bids còn lại rejected → Job → IN_PROGRESS
→ CreateContractModal auto-popup
```

### Luồng 3.3 — Thực hiện hợp đồng:
```
CreateContractModal → nhập description + milestones (%, deadline, revisions)
→ Contract ACTIVE tạo trong DB
→ Freelancer vào Contracts tab → thấy milestones NOT_STARTED
→ Freelancer làm việc → "Nộp nghiệm thu" → milestone SUBMITTED + autoApproveAt set
→ Client nhận notification → vào Contracts tab → "Duyệt" hoặc "Yêu cầu sửa"
  - Duyệt → APPROVED → nếu tất cả done → Contract COMPLETED
  - Yêu cầu sửa → REVISION_REQUESTED → freelancer sửa → nộp lại
  - Từ chối (tối đa maxRevisions lần)
→ Contract COMPLETED → (Phase 2: đánh giá, giải ngân)
```

---

## 6. Features theo spec

| Feature ID | Tên | Status |
|---|---|---|
| CL-09 | Xem danh sách bid xếp hạng AHP-TOPSIS | ✅ DONE |
| CL-10 | Bảng giải thích điểm (score breakdown) | ✅ DONE |
| CL-11 | So sánh bid side-by-side (2–4 bids) | ✅ DONE |
| CL-12 | Shortlist freelancer | ✅ DONE |
| CL-13 | Accept / Reject bid | ✅ DONE |
| CL-14 | Xem profile đầy đủ freelancer từ bid | ✅ DONE |
| CL-18 | Tạo hợp đồng điện tử sau accept bid | ✅ DONE |
| CL-19 | Chia & quản lý milestone (tối đa 10) | ✅ DONE |
| CL-20 | Theo dõi tiến độ milestones | ✅ DONE |
| CL-21 | Duyệt / từ chối nghiệm thu | ✅ DONE |
| CL-22 | Hủy contract | ✅ DONE |
| FL-19 | Freelancer nhận & xem contract | ✅ DONE |
| FL-20 | Cập nhật tiến độ milestone | ✅ DONE |
| FL-21 | Upload sản phẩm bàn giao | ✅ DONE (metadata) |
| FL-22 | Gửi yêu cầu nghiệm thu | ✅ DONE |
| FL-23 | Theo dõi milestone | ✅ DONE |

**OPTIONAL (not in scope):** CL-15, CL-16, CL-17, CL-23

---

## 7. Files thay đổi

### Backend mới (be/src/modules/)
- `client-bids/ahp-topsis.service.ts`
- `client-bids/client-bids.service.ts`
- `client-bids/client-bids.controller.ts`
- `client-bids/client-bids.module.ts`
- `client-bids/dto/client-bids.dto.ts`
- `contracts/contracts.service.ts`
- `contracts/contracts.controller.ts`
- `contracts/contracts.module.ts`
- `contracts/dto/contracts.dto.ts`

### Backend sửa
- `be/prisma/schema.prisma` — thêm 4 models, 3 enums mới
- `be/src/app.module.ts` — đăng ký BidsModule, ClientBidsModule, ContractsModule
- `be/prisma/migrations/20260621200000_add_contract_milestone/`

### Frontend mới (fe/src/)
- `lib/api/client-bids.api.ts`
- `lib/api/contracts.api.ts`
- `components/client/BidScoreChart.tsx`
- `components/client/BidCompareModal.tsx`
- `components/client/FreelancerProfileModal.tsx`
- `components/client/RankedBidsList.tsx`
- `components/client/CreateContractModal.tsx`
- `components/client/ClientContractsTab.tsx`
- `components/contracts/MilestoneTimeline.tsx`
- `components/contracts/ContractCard.tsx`
- `components/contracts/ContractDetail.tsx`

### Frontend sửa
- `components/client/ClientJobsTab.tsx` — thay mock bid list bằng RankedBidsList
- `components/freelancer/ContractsTab.tsx` — rewrite dùng real API
- `app/(dashboard)/dashboard/page.tsx` — import ClientContractsTab, route contracts theo role
