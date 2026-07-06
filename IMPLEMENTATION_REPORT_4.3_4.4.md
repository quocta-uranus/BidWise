# BidWise – Implementation Report: 4.3 Bidding + 4.4 Làm việc & Contract (Freelancer)

## Tổng quan

Đã triển khai đầy đủ **frontend (Next.js)** + fix **backend API client** cho hai module freelancer:
- **4.3 Bidding** (FL-12 → FL-16, CORE + FL-17 OPTIONAL)
- **4.4 Làm việc & Contract** (FL-19 → FL-23, CORE)

---

## 1. Thay đổi Backend

### 1.1 Fix bids.api.ts — đồng bộ endpoints
File: `fe/src/lib/api/bids.api.ts`

| Cũ (sai) | Mới (đúng theo BE) |
|---|---|
| `GET /bids` | `GET /bids/me` |
| `GET /bids/stats` | `GET /bids/me/stats` |
| `GET /bids/quota` | `GET /bids/me/quota` |
| `POST /bids` với FormData | `POST /bids` với JSON |

### 1.2 Type `ApiBid` mở rộng
- `matchBreakdown` đầy đủ: `skills`, `budget`, `assessment`, `profile` (thay vì 3 fields cũ)
- `status` thêm `EXPIRED`, `SHORTLISTED`
- `days`, `coverLetter`, `matchingScore` đều optional (match BE response thực tế)
- `BidStats` đúng với BE: `totalBids`, `winRate`, `avgBidPrice`, `byCategory[]`
- `BidQuota` thêm `tier`, `dailyLimit`, `remaining`

---

## 2. 4.3 Bidding — BidsTab Rewrite

File: `fe/src/components/freelancer/BidsTab.tsx`

### FL-12: Gửi bid
- Submit bid từ `JobsTab` (đã implement từ trước) gọi `POST /bids` JSON
- Quota check: hiện token còn lại, warning khi <= 2, block khi hết

### FL-13: Xem điểm matching của mình
**`MatchBreakdownPanel` component** — hiển thị breakdown đầy đủ:
- Tổng score với thanh progress màu (xanh ≥75%, vàng ≥50%, xám <50%)
- 4 bar chart: Kỹ năng (50), Ngân sách (30), Assessment (15), Profile (5)
- Explanation text từng tiêu chí
- Alert kỹ năng còn thiếu (màu amber) — freelancer biết cần học gì

### FL-14: Chỉnh sửa bid
**`EditBidModal` component**:
- Chỉ hiện nút Edit khi `bid.canEdit === true` (BE kiểm soát: sealed-bid chưa opened + còn trong editDeadlineHours)
- Form sửa: giá, ngày, cover letter
- Tích hợp gợi ý AI cover letter (FL-17)

### FL-15: Hủy bid (Withdraw)
- Nút Trash chỉ hiện với `PENDING` hoặc `SHORTLISTED`
- Confirm dialog trước khi rút
- Gọi `DELETE /bids/:id` → refresh quota (penalty tracking)

### FL-16: Theo dõi trạng thái bid
**Status filter tabs**: ALL / Chờ xét / Shortlist / Được chọn / Từ chối / Đã rút
- Mỗi tab có count badge
- Status icon: Clock (PENDING), BookmarkCheck (SHORTLISTED), CheckCircle (ACCEPTED), XCircle (REJECTED/WITHDRAWN), AlertCircle (EXPIRED)
- Color coding: emerald (ACCEPTED), amber (SHORTLISTED), rose (REJECTED)

### FL-17: Gợi ý cover letter (OPTIONAL)
- Button "Gợi ý AI" trong EditBidModal → `POST /bids/cover-letter-suggest`
- Auto-fill template từ bullet points dựa trên profile + job skills

### FL-18: Dashboard bid stats (OPTIONAL)
- Stats grid: Tổng bids, Win rate %, Avg giá, Token hôm nay
- Win rate by category — bar chart mini

---

## 3. 4.4 Làm việc & Contract — ContractsTab + ContractDetail

### FL-19: Nhận & xem contract
File: `fe/src/components/freelancer/ContractsTab.tsx` (đã rewrite session trước)
- Load từ `GET /freelancer/contracts`
- Stats: Tổng, Đang thực hiện, Cần hành động, Hoàn thành
- Grid cards `ContractCard` → click mở `ContractDetail`

### FL-20: Cập nhật tiến độ milestone
File: `fe/src/components/contracts/ContractDetail.tsx`
- Trong submit modal: textarea "Ghi chú tiến độ" → lưu vào `freelancerNotes`
- `PATCH /freelancer/contracts/:id/milestones/:milestoneId/progress` với `{ notes }`
- Milestone hiển thị `freelancerNotes` dưới dạng ghi chú xanh

### FL-21: Upload sản phẩm bàn giao
Submit modal được mở rộng với section **Deliverables**:
- Có thể thêm nhiều files (tối đa tùy ý)
- Mỗi file: `fileName`, `fileUrl` (Google Drive/GitHub/Figma link), `description`
- Validation: chỉ submit deliverables có đủ fileName + fileUrl
- Files lưu vào bảng `milestone_deliverables`, hiển thị dưới dạng link trong MilestoneTimeline

### FL-22: Gửi yêu cầu nghiệm thu
- Nút "Nộp nghiệm thu" (màu amber) trong MilestoneTimeline
- Chỉ hiện với status: `NOT_STARTED`, `IN_PROGRESS`, `REJECTED`, `REVISION_REQUESTED`
- `POST /freelancer/contracts/:id/milestones/:milestoneId/submit`
- Milestone → `SUBMITTED`, `autoApproveAt` set (now + autoApprovalDays ngày)

### FL-23: Theo dõi milestone
**`MilestoneTimeline` được cải tiến**:
- **Deadline countdown**: "Còn X ngày" (amber ≤3 ngày, đỏ quá hạn)
- **Payment status**: "$XXX (X%) ✓ Đã giải ngân" khi APPROVED (màu emerald)
- **Auto-approve timer**: Hiển thị ngày auto-approve khi đang SUBMITTED
- **Revision count**: "Revision: 1/3" khi có revision requests
- **Deliverables links**: file links clickable dưới mỗi milestone

---

## 4. Luồng hoạt động

### 4.3 Bidding Flow:
```
Freelancer vào "Tìm việc" → chọn job → submit bid (FL-12)
→ Token bị trừ 1
→ Bid xuất hiện trong "Đấu thầu của tôi" với status PENDING
→ Expand bid → xem điểm matching breakdown (FL-13)
→ Bid.canEdit = true → có thể sửa giá/cover letter (FL-14)
→ Client shortlist → status SHORTLISTED → banner "Khả năng cao được chọn"
→ Client accept → status ACCEPTED → banner "Vào Hợp đồng để làm việc"
→ Client reject → status REJECTED → hint cải thiện
```

### 4.4 Contract Work Flow:
```
Freelancer vào "Quản lý hợp đồng" → thấy contract ACTIVE
→ Click card → ContractDetail mở
→ Milestone 1 NOT_STARTED → nút "Nộp nghiệm thu"
→ Submit modal: nhập progress notes + upload deliverables (fileName + fileUrl)
→ Milestone → SUBMITTED, auto-approve timer hiển thị
→ Client review: APPROVED (tiền giải ngân) hoặc REVISION_REQUESTED (sửa lại)
→ Tất cả milestones APPROVED → Contract → COMPLETED
```

---

## 5. Features theo spec

| Feature ID | Tên | Status |
|---|---|---|
| FL-12 | Gửi bid | ✅ DONE (từ JobsTab, đã có) |
| FL-13 | Xem điểm matching + breakdown | ✅ DONE (MatchBreakdownPanel mới) |
| FL-14 | Chỉnh sửa bid | ✅ DONE (EditBidModal với canEdit check) |
| FL-15 | Hủy bid | ✅ DONE (withdraw + penalty tracking) |
| FL-16 | Theo dõi trạng thái bid | ✅ DONE (5 status tabs + icons) |
| FL-17 | Gợi ý cover letter AI | ✅ DONE (template suggestion) |
| FL-18 | Dashboard bid stats & win rate | ✅ DONE (stats grid + category chart) |
| FL-19 | Nhận & xem contract | ✅ DONE |
| FL-20 | Cập nhật tiến độ milestone | ✅ DONE (notes trong submit modal) |
| FL-21 | Upload sản phẩm bàn giao | ✅ DONE (multi-file form với URL) |
| FL-22 | Gửi yêu cầu nghiệm thu | ✅ DONE |
| FL-23 | Theo dõi milestone | ✅ DONE (countdown + payment status + auto-approve) |

---

## 6. Files thay đổi

### Frontend sửa
| File | Thay đổi |
|---|---|
| `fe/src/lib/api/bids.api.ts` | Rewrite hoàn toàn — fix endpoints, types đầy đủ |
| `fe/src/lib/hooks/useFreelancerBids.ts` | Fix mapApiBidToBid với types mới |
| `fe/src/components/freelancer/BidsTab.tsx` | Rewrite hoàn toàn — real API, FL-13/14/15/16/17/18 |
| `fe/src/components/contracts/ContractDetail.tsx` | Thêm deliverables form (FL-21), fix submit modal |
| `fe/src/components/contracts/MilestoneTimeline.tsx` | Thêm deadline countdown, payment status, auto-approve timer (FL-23) |

---

## 7. Hướng dẫn test

### Test 4.3 Bidding:
1. Login `freelancer1@bidwise.dev / Password123!`
2. Tab **"Đấu thầu của tôi"** → thấy bids từ seed data
3. Expand bid → xem **MatchBreakdownPanel** (FL-13)
4. Click **Edit** (pencil icon) → sửa giá/cover letter → **"Gợi ý AI"** (FL-17)
5. Click **Trash** → rút bid (FL-15)
6. Filter tabs: PENDING / SHORTLISTED / ACCEPTED (FL-16)

### Test 4.4 Contract:
1. Tab **"Quản lý hợp đồng"** → thấy contract từ seed
2. Click card → ContractDetail
3. Milestone 3 "Payroll & Reports" (NOT_STARTED) → click **"Nộp nghiệm thu"**
4. Submit modal: nhập notes + thêm deliverable file (fileName + URL)
5. Submit → milestone → SUBMITTED
6. Login `client@bidwise.dev` → Quản lý hợp đồng → Duyệt milestone
