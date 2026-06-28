# BidWise — Hướng dẫn Testing Đầy Đủ

## Chuẩn bị





Truy cập: **http://localhost:3000**

---

### 2. Tài khoản test

| Role | Email | Mật khẩu |
|---|---|---|
| Client | `client@bidwise.dev` | `Password123!` |
| Client 2 | `client2@bidwise.dev` | `Password123!` |
| Freelancer 1 (Gold) | `freelancer1@bidwise.dev` | `Password123!` |
| Freelancer 2 (Silver) | `freelancer2@bidwise.dev` | `Password123!` |
| Freelancer 3 | `freelancer3@bidwise.dev` | `Password123!` |

### 3. Mở 2 tab browser

- **Tab A**: đăng nhập `client@bidwise.dev`
- **Tab B**: đăng nhập `freelancer1@bidwise.dev`

---

## PHASE 1 — Client đăng Job

> **Tab A — Client**

1. Login → Dashboard → sidebar **"Quản lý dự án"**
2. Click **"Đăng mới"** (góc trên phải)
3. Điền thông tin:

| Trường | Giá trị |
|---|---|
| Tiêu đề | `Build REST API với NestJS và PostgreSQL` |
| Category | `Web Development` |
| Budget | Fixed — `$1,000` |
| Deadline | 30 ngày từ hôm nay |
| Skills | `NestJS`, `PostgreSQL`, `TypeScript` |
| Auction type | `Sealed Bid` |
| AHP Weights | Để mặc định (tổng = 100%) |

4. Submit → job xuất hiện status **DRAFT**
5. Click vào job đó → nút **"Xuất bản"** → status chuyển sang **OPEN** ✅

---

## PHASE 2 — Freelancer tìm & gửi Bid

> **Tab B — Freelancer**

### 2.1 Tìm kiếm job

1. Login → sidebar **"Khám phá việc làm"**
2. Thấy danh sách jobs từ database (bao gồm job vừa tạo)
3. Thử các filter:
   - Gõ keyword vào ô tìm kiếm → jobs filter realtime
   - Chọn Category → lọc theo ngành
   - Chọn `Sealed Bid` / `Open Bid` → lọc loại đấu thầu
   - Tab **"⭐ Gợi ý"** → jobs phù hợp với skill profile
   - Tab **"🔖 Đã lưu"** → jobs đã bookmark
4. Click icon 🔖 trên card job → lưu bookmark ✅

### 2.2 Xem chi tiết job

1. Click vào tên job → **JobDrawer** mở ra bên phải
2. Kiểm tra hiển thị:
   - Budget, Deadline countdown ("Còn X ngày")
   - Số bids đã nhận
   - Skills yêu cầu
   - **Tiêu chí AHP** — bar chart hiển thị client ưu tiên tiêu chí gì

### 2.3 Gửi Bid (FL-12)

1. Trong JobDrawer → click **"Bid ngay"** → BidModal mở
2. Kiểm tra **Token** hiển thị đúng (VD: `15/15`)
3. Điền form:

| Trường | Giá trị |
|---|---|
| Giá bid | `$850` |
| Thời gian | `20 ngày` |
| Cover Letter | (xem bước 4) |

4. Click **"Gợi ý AI"** → cover letter tự động điền template (FL-17)
5. Chỉnh sửa thêm nếu muốn
6. Click **"Gửi đề xuất"** → thấy 🚀 success ✅
7. Token giảm 1 (VD: `14/15`)

### 2.4 Xem bid vừa gửi (FL-16)

1. Sidebar **"Đấu thầu của tôi"**
2. Bid mới xuất hiện status **Chờ xét**
3. Click mũi tên ▼ expand bid → thấy:
   - **Match Score** với thanh progress (FL-13)
   - **4 bar charts**: Kỹ năng / Ngân sách / Assessment / Profile
   - Explanation text từng tiêu chí
   - Kỹ năng còn thiếu (màu vàng) nếu có

### 2.5 Chỉnh sửa bid (FL-14)

1. Trong "Đấu thầu của tôi" → click icon ✏️ (chỉ hiện khi `canEdit = true`)
2. Sửa giá hoặc cover letter
3. Click "Gợi ý AI" để thay cover letter mới
4. Lưu thay đổi ✅

> **Lưu ý**: Nút ✏️ chỉ hiện với Sealed Bid chưa bị client xem, trong vòng 24 giờ sau khi gửi.

### 2.6 Rút bid (FL-15)

1. Click icon 🗑️ → confirm dialog
2. Bid → status **Đã rút**
3. Token bị penalty (trừ thêm nếu rút nhiều)

---

## PHASE 3 — Client xem Bids & chọn Freelancer

> **Tab A — Client**

### 3.1 Xem danh sách bids (CL-09)

1. **"Quản lý dự án"** → click job đã post
2. Panel phải hiện **RankedBidsList** — bids xếp hạng tự động theo **AHP-TOPSIS**:
   - Badge **#1** (vàng), **#2** (bạc), **#3** (đồng)
   - Điểm TOPSIS % của từng bid
   - Thông tin freelancer, giá, thời gian

### 3.2 Xem score breakdown (CL-10)

1. Click ▼ expand bid → 2 cột:
   - **Trái**: Cover letter
   - **Phải**: Score breakdown — 7 bar charts (Price/Skill/Experience/Rating/Speed/Deadline/Portfolio)
   - D+ (khoảng cách đến ideal), D− (khoảng cách đến anti-ideal)

### 3.3 Xem profile freelancer (CL-14)

1. Click icon 👁 trên bid row
2. Modal **FreelancerProfileModal** mở:
   - Avatar, tên, assessment level (Gold/Silver)
   - Skills, kinh nghiệm, hourly rate
   - Portfolio items, certificates

### 3.4 So sánh bids (CL-11)

1. Click icon **GitCompare** trên 2–4 bids muốn so sánh (bids được highlight viền tím)
2. Click nút **"So sánh (X)"** xuất hiện ở header
3. Bảng so sánh song song:
   - Freelancer, Giá, Thời gian, TOPSIS Score, Skills, Assessment, Portfolio

### 3.5 Shortlist bid (CL-12)

1. Click icon 🔖 trên bid row → status đổi sang **Shortlist** (viền vàng)
2. Click lại → bỏ shortlist

> **Tab B — Freelancer**: F5 tab "Đấu thầu của tôi" → bid đổi sang badge vàng **"Shortlist"** + banner "Khả năng cao được chọn!" ✅

### 3.6 Chấp nhận bid (CL-13)

1. Click icon ✓ (xanh) trên bid muốn chọn
2. Confirm popup: "Hành động này sẽ từ chối tất cả bids còn lại"
3. Confirm → tất cả bids khác → **Từ chối**, job → **IN_PROGRESS**
4. **CreateContractModal** tự động popup ✅

---

## PHASE 4 — Tạo Contract & Milestones (CL-18, CL-19)

> **Tab A — Client** — Trong CreateContractModal

1. Điền Description (tùy chọn): `Phát triển REST API module nhân sự hoàn chỉnh`
2. Thêm milestones — **tổng % phải = 100%**:

| # | Tên | % | Deadline |
|---|---|---|---|
| 1 | Authentication & Setup | 30% | 10 ngày tới |
| 2 | Core API Development | 50% | 20 ngày tới |
| 3 | Testing & Deploy | 20% | 30 ngày tới |

3. Click **"Thêm"** để thêm milestone mới (tối đa 10)
4. Mỗi milestone: đặt tên, %, deadline, max revisions
5. Submit → "Hợp đồng đã được tạo thành công!" ✅
6. Vào **"Quản lý hợp đồng"** → thấy contract card status **Đang thực hiện**

---

## PHASE 5 — Freelancer làm việc & nộp Milestone

> **Tab B — Freelancer**

### 5.1 Xem contract (FL-19, FL-23)

1. Sidebar **"Quản lý hợp đồng"** → click contract card
2. **ContractDetail** modal mở:
   - Header: tên job, tên client, tổng tiền, status
   - Progress bar tổng thể: **0% (0/3)**
   - Milestone 1 status **Chưa bắt đầu**, deadline countdown hiển thị

### 5.2 Nộp nghiệm thu milestone 1 (FL-22, FL-20, FL-21)

1. Click **"Nộp nghiệm thu"** (nút cam) trên Milestone 1
2. Modal submit mở:

**Ghi chú tiến độ (FL-20)**:
```
Đã hoàn thành setup JWT auth với refresh token rotation.
RBAC hoàn chỉnh với 4 role: Admin, Client, Freelancer, Moderator.
Unit test coverage 85%.
```

**Sản phẩm bàn giao (FL-21)**:
- Click **"+ Thêm file"** nếu muốn thêm nhiều file
- File 1:
  - Tên file: `auth-module-v1.zip`
  - URL: `https://github.com/yourrepo/auth-module`
  - Mô tả: `Source code module auth`
- File 2 (tùy chọn):
  - Tên file: `api-docs.pdf`
  - URL: `https://drive.google.com/...`
  - Mô tả: `Swagger API documentation`

3. Click **"Nộp nghiệm thu"** → Milestone 1 → **Chờ nghiệm thu** (viền vàng) ✅
4. Thấy **auto-approve timer**: "Auto-approve: DD/MM/YYYY" (5 ngày từ hôm nay)

---

## PHASE 6 — Client duyệt Milestone (CL-21)

> **Tab A — Client**

1. **"Quản lý hợp đồng"** → click contract → ContractDetail mở
2. Milestone 1 đang **Chờ nghiệm thu** (viền amber):
   - Thấy ghi chú freelancer
   - Thấy link deliverables (`auth-module-v1.zip`, `api-docs.pdf`)
3. Các nút action:
   - **"Duyệt"** (xanh) → approve + giải ngân
   - **"Yêu cầu sửa"** (cam) → gửi feedback yêu cầu chỉnh
   - **"Từ chối"** (đỏ) → reject (tăng revisionCount)

4. Click **"Duyệt"** → nhập feedback (tùy chọn) → confirm
5. Milestone 1 → **✓ Đã duyệt** (viền xanh) + **"$300 (30%) ✓ Đã giải ngân"** ✅
6. Progress bar: **33% (1/3)**

### Test "Yêu cầu sửa" (thay vì Duyệt)

1. Click **"Yêu cầu sửa"** → nhập feedback:
   ```
   Thiếu unit test cho module refresh token. Vui lòng bổ sung và resubmit.
   ```
2. Milestone → **Yêu cầu sửa** (màu cam)
3. **Tab B — Freelancer**: milestone hiển thị feedback + nút "Nộp nghiệm thu" lại
4. Freelancer nộp lại → client duyệt

---

## PHASE 7 — Hoàn thành Contract

> **Lặp Phase 5–6 cho Milestone 2 và 3**

Khi tất cả 3 milestones được **Duyệt**:
- Contract tự động → **Hoàn thành** ✅
- Hiển thị trong filter **"Hoàn thành"**
- Progress bar: **100% (3/3)**

---

## PHASE 8 — Hủy Contract (CL-22)

> Chỉ test khi cần (không undo được)

1. Trong ContractDetail → cuối modal → **"Hủy hợp đồng"** (đỏ nhạt)
2. Nhập lý do: `Thay đổi yêu cầu dự án, cần tạo contract mới`
3. Confirm → contract → **Đã hủy**
4. Job → **CLOSED**, bid → **REJECTED**

---

## Checklist nhanh tất cả tính năng

### Freelancer

| Feature | Nơi test | Kết quả mong đợi |
|---|---|---|
| FL-07 Xem danh sách job | Tìm việc → tab "Tất cả" | Jobs từ DB, có phân trang |
| FL-08 Tìm kiếm & filter | Ô search + dropdown | Jobs filter realtime |
| FL-09 Gợi ý job | Tab "⭐ Gợi ý" | Jobs phù hợp skills |
| FL-10 Bookmark | Icon 🔖 trên card | Lưu vào tab "Đã lưu" |
| FL-12 Gửi bid | "Bid ngay" → form | Success, token trừ 1 |
| FL-13 Điểm matching | BidsTab → expand bid | 4 bars + explanation |
| FL-14 Chỉnh sửa bid | BidsTab → icon ✏️ | Chỉ hiện khi canEdit=true |
| FL-15 Rút bid | BidsTab → icon 🗑️ | Status → Đã rút |
| FL-16 Theo dõi bid | BidsTab → filter tabs | 5 status tabs + count |
| FL-17 Gợi ý cover letter | Bid modal → "Gợi ý AI" | Template auto-fill |
| FL-19 Xem contract | Quản lý hợp đồng | Contract từ DB |
| FL-20 Ghi chú tiến độ | Submit modal → Ghi chú | Lưu vào freelancerNotes |
| FL-21 Upload deliverable | Submit modal → File | fileName + fileUrl |
| FL-22 Nộp nghiệm thu | Nút cam "Nộp nghiệm thu" | Milestone → Chờ nghiệm thu |
| FL-23 Theo dõi milestone | ContractDetail | Countdown + payment status |

### Client

| Feature | Nơi test | Kết quả mong đợi |
|---|---|---|
| CL-01 Đăng job | Quản lý dự án → Đăng mới | Job tạo thành công |
| CL-02 Chọn loại đấu thầu | Form tạo job | Sealed/Open Bid |
| CL-03 AHP weights | Form tạo job | Tổng = 100% |
| CL-04 Chỉnh sửa job | Click icon ✏️ | Sửa khi chưa có bid |
| CL-05 Đóng/mở job | "Xuất bản" / "Đóng thầu" | Status thay đổi |
| CL-09 Bids xếp hạng TOPSIS | Chọn job → panel phải | Rank #1, #2, #3 |
| CL-10 Score breakdown | Expand bid | 7 criteria bars |
| CL-11 So sánh bids | Chọn 2+ → "So sánh" | Bảng side-by-side |
| CL-12 Shortlist | Icon 🔖 trong bid row | Badge "Shortlist" |
| CL-13 Accept/Reject bid | Icon ✓ / ✗ | Contract modal popup |
| CL-14 Xem profile freelancer | Icon 👁 | Modal full profile |
| CL-18 Tạo contract | Sau accept bid | Milestones form |
| CL-19 Phân chia milestone | CreateContractModal | Tổng % = 100% |
| CL-20 Theo dõi tiến độ | Quản lý hợp đồng | Progress bar |
| CL-21 Duyệt/từ chối | ContractDetail → milestone SUBMITTED | Giải ngân / reject |
| CL-22 Hủy contract | Nút "Hủy hợp đồng" | Status → Đã hủy |

---

## Dữ liệu có sẵn từ Seed

Nếu không muốn tạo từ đầu, đã có sẵn:

| Loại | Mô tả |
|---|---|
| **3 jobs OPEN** | Dashboard Admin SaaS, UI/UX Fintech, Mobile App E-Commerce |
| **6 bids** | FL1 và FL2 đã bid vào các jobs trên |
| **1 contract ACTIVE** | "Backend API REST với NestJS" — có 3 milestones: #1 APPROVED, #2 SUBMITTED, #3 NOT_STARTED |

### Test nhanh contract có sẵn

**Client**: Vào "Quản lý hợp đồng" → click contract "Backend API REST" → Milestone 2 đang **Chờ nghiệm thu** → click **"Duyệt"** ngay.

**Freelancer**: Vào "Quản lý hợp đồng" → click contract → Milestone 3 **Chưa bắt đầu** → click **"Nộp nghiệm thu"**.

---

## Lưu ý khi testing

- **Token bid**: Mỗi freelancer có 15 token/ngày (tier Gold). Reset lúc 00:00.
- **Sealed Bid**: Freelancer chỉ thấy bid của mình. Client thấy tất cả bids.
- **Auto-approve**: Milestone SUBMITTED sẽ tự duyệt sau 5 ngày nếu client không phản hồi.
- **canEdit**: Chỉ có thể sửa bid trong 24 giờ đầu tiên sau khi gửi.
- **Contract**: Tạo contract phải từ một bid đã được ACCEPTED, mỗi bid chỉ tạo được 1 contract.
