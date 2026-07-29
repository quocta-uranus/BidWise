# BidWise — Kịch Bản Demo AHP-TOPSIS

> Chạy seed trước khi demo: `cd be && npx ts-node -r tsconfig-paths/register prisma/seed-demo.ts`

---

## TÀI KHOẢN DEMO

| Vai trò | Email | Mật khẩu |
|---|---|---|
| **Client** | `demo.client@bidwise.dev` | `Demo@1234` |
| **Freelancer 1** | `demo.fl1@bidwise.dev` | `Demo@1234` |
| **Freelancer 2** | `demo.fl2@bidwise.dev` | `Demo@1234` |

---

## DỮ LIỆU ĐÃ CÓ SẴN (seed tự tạo)

### Job 1 — Web Development (SEALED BID)
- **Tiêu đề:** Xây dựng hệ thống quản lý đơn hàng cho E-Commerce (Next.js + NestJS)
- **Ngân sách:** $2,000 (Fixed)
- **Deadline:** 30 ngày
- **Trọng số AHP:** Skill 35% · Price 25% · Experience 20% · Rating 10% · Portfolio 5% · Speed 5%
- **Bids nhận được:** FL1 ($1,800 / 28 ngày) · FL2 ($1,500 / 35 ngày)
- **Kết quả TOPSIS:** FL1 xếp hạng 1 (phù hợp kỹ năng hơn)

### Job 2 — UI/UX Design (OPEN BID)
- **Tiêu đề:** Thiết kế UI/UX Dashboard Analytics cho SaaS B2B (Figma + React)
- **Ngân sách:** $600 – $1,000 (Range)
- **Deadline:** 21 ngày
- **Trọng số AHP:** Portfolio 25% · Skill 25% · Rating 15% · Price 15% · Experience 10%
- **Bids nhận được:** FL2 ($850 / 18 ngày) · FL1 ($700 / 14 ngày)
- **Kết quả TOPSIS:** FL2 xếp hạng 1 (chuyên môn UI/UX phù hợp)

---

## KỊCH BẢN 1 — FREELANCER NỘP BID (demo live)

> Login: `demo.fl1@bidwise.dev` / `Demo@1234`

### Tìm job và nộp bid cho Job 3 (tạo mới khi demo)

**Cover Letter (copy vào form):**

```
Chào anh/chị,

Tôi là Full-Stack Developer với 5 năm kinh nghiệm chuyên sâu về React, NestJS và PostgreSQL.

Lý do tôi phù hợp với dự án này:
• Đã triển khai 3 hệ thống tương tự trong thực tế (scale 50,000+ records/ngày)
• Assessment Score 92/100 — Gold Level trên BidWise
• Cam kết giao đúng hạn: 100% track record

Approach làm việc:
- Tuần 1: Phân tích yêu cầu, thiết kế DB schema, setup project
- Tuần 2-3: Phát triển core features
- Tuần 4: Testing, bug fix, deploy

Tôi sẵn sàng bắt đầu ngay tuần này.

Trân trọng,
Trần Văn An
```

**Thông tin bid:**
- **Số tiền:** `1800`
- **Số ngày giao:** `28`

---

> Login: `demo.fl2@bidwise.dev` / `Demo@1234`

**Cover Letter (copy vào form):**

```
Chào anh/chị,

UI/UX Design là chuyên môn chính của tôi với 3 năm tập trung vào SaaS products.

Portfolio nổi bật:
• Fintech App Redesign → tăng conversion 40%
• E-Commerce Mobile UI → Design system 80+ components

Quy trình làm việc:
1. Ngày 1-3: Wireframe & user flow
2. Ngày 3-8: Visual design (Desktop + Mobile)
3. Ngày 8-12: Dark/Light mode, component library
4. Ngày 12-15: Interactive prototype & handoff

Tôi sẽ gửi draft đầu sau 5 ngày để bạn confirm direction trước khi tiếp tục.

Trân trọng,
Lê Thị Mai
```

**Thông tin bid:**
- **Số tiền:** `850`
- **Số ngày giao:** `18`

---

## KỊCH BẢN 2 — CLIENT XEM KẾT QUẢ AHP-TOPSIS

> Login: `demo.client@bidwise.dev` / `Demo@1234`

### Vào Job 1 → Xem Ranked Bids

**Giải thích cho giáo viên:**

> "Hệ thống dùng AHP để client thiết lập trọng số cho 7 tiêu chí, sau đó TOPSIS xếp hạng các bid dựa trên khoảng cách đến giải pháp lý tưởng."

**Trọng số đã cấu hình cho Job 1:**

| Tiêu chí | Trọng số | Lý do |
|---|---|---|
| Kỹ năng (Skill Match) | 35% | Quan trọng nhất — đúng stack |
| Giá (Price) | 25% | Ngân sách có giới hạn |
| Kinh nghiệm | 20% | Cần người có thực chiến |
| Đánh giá (Rating) | 10% | Độ tin cậy |
| Portfolio | 5% | Xem sản phẩm đã làm |
| Tốc độ (Speed) | 5% | Deadline chấp nhận được |

**Kết quả TOPSIS (giải thích từng bước):**

1. Chuẩn hóa ma trận quyết định (vector normalization)
2. Nhân với trọng số AHP → ma trận có trọng số
3. Xác định A⁺ (lý tưởng) và A⁻ (tệ nhất)
4. Tính khoảng cách Euclidean đến A⁺ và A⁻
5. Score = D⁻ / (D⁺ + D⁻) → càng gần 1 càng tốt

---

## KỊCH BẢN 3 — TẠO JOB MỚI (demo live)

> Login: `demo.client@bidwise.dev` / `Demo@1234`

### Thông tin Job

- **Tiêu đề:**
```
Xây dựng REST API cho ứng dụng đặt lịch khám bệnh trực tuyến
```

- **Mô tả:**
```
Cần Backend Developer xây dựng hệ thống API cho ứng dụng đặt lịch khám bệnh.

Yêu cầu:
- NestJS + Prisma + PostgreSQL
- Chức năng: quản lý bác sĩ, bệnh nhân, lịch hẹn
- Gửi email nhắc nhở tự động (Nodemailer)
- Xác thực OTP qua SMS
- API docs với Swagger
- Unit tests coverage > 80%

Deliverables: Source code + Docker compose + API documentation
```

- **Loại ngân sách:** Fixed — `1200`
- **Deadline:** Chọn ngày 30 ngày sau
- **Danh mục:** Web Development
- **Kỹ năng:** `NestJS`, `PostgreSQL`, `TypeScript`, `Docker`
- **Loại đấu thầu:** SEALED BID

### Trọng số AHP (thiết lập khi tạo job)

| Tiêu chí | Trọng số | Gõ vào |
|---|---|---|
| Price | 20 | `20` |
| Skill | 40 | `40` |
| Experience | 20 | `20` |
| Rating | 10 | `10` |
| Speed | 5 | `5` |
| Deadline | 0 | `0` |
| Portfolio | 5 | `5` |

> **Tổng = 100** — hệ thống sẽ validate

---

## KỊCH BẢN 4 — TẠO HỢP ĐỒNG & MILESTONE

> Login: `demo.client@bidwise.dev` / `Demo@1234`
> Vào Job 1 → Chọn bid của FL1 → Tạo hợp đồng

### Thông tin Hợp Đồng

- **Mô tả:**
```
Hợp đồng phát triển hệ thống quản lý đơn hàng E-Commerce cho BidWise Demo. Freelancer cam kết giao đầy đủ deliverables theo 3 milestone dưới đây.
```

- **Điều khoản bổ sung:**
```
Mã nguồn thuộc sở hữu của Client sau khi thanh toán đầy đủ. Freelancer cần báo cáo tiến độ mỗi tuần qua chat.
```

### Milestone 1 — Setup & Database

| Trường | Giá trị |
|---|---|
| **Thứ tự** | `1` |
| **Tên** | `Thiết kế Database & Setup Project` |
| **Mô tả** | `DB schema, project structure, auth module, Swagger setup` |
| **Số tiền** | `400` |
| **Tỷ lệ** | `22` |
| **Deadline** | *(chọn 10 ngày sau)* |

### Milestone 2 — Core Features

| Trường | Giá trị |
|---|---|
| **Thứ tự** | `2` |
| **Tên** | `Phát triển Core Features` |
| **Mô tả** | `Order management CRUD, workflow engine, real-time Socket.io, báo cáo & export` |
| **Số tiền** | `1000` |
| **Tỷ lệ** | `56` |
| **Deadline** | *(chọn 24 ngày sau)* |

### Milestone 3 — Testing & Deploy

| Trường | Giá trị |
|---|---|
| **Thứ tự** | `3` |
| **Tên** | `Testing, Deploy & Documentation` |
| **Mô tả** | `Unit tests, Docker deploy lên Railway, API docs hoàn chỉnh, bàn giao source code` |
| **Số tiền** | `400` |
| **Tỷ lệ** | `22` |
| **Deadline** | *(chọn 30 ngày sau)* |

> **Tổng: $1,800 — 3 milestones — 100%**

---
https://github.com/quocta-uranus/BidWise/pull/19

## LUỒNG DEMO ĐỀ XUẤT (15 phút)

```
[3 phút] Giới thiệu hệ thống
  → Login client → show dashboard → 2 jobs có bid sẵn

[4 phút] Demo AHP-TOPSIS
  → Vào Job 1 → xem trọng số AHP → xem Ranked Bids
  → Giải thích: "Hệ thống xếp hạng FL1 vì skill match cao hơn (đúng stack)"
  → So sánh TOPSIS score: FL1 vs FL2

[3 phút] Demo tạo job mới (kịch bản 3)
  → Client tạo Job 3 → nhập AHP weights → submit
  → FL1 login → nộp bid → FL2 login → nộp bid

[5 phút] Demo hợp đồng & milestone (kịch bản 4)
  → Client chấp nhận bid FL1 ở Job 1
  → Tạo hợp đồng với 3 milestones
  → Show contract page → explain payment flow
```

---

## GHI CHÚ KỸ THUẬT (cho Q&A với giáo viên)

**File thuật toán:** `be/src/modules/client-bids/ahp-topsis.service.ts`

| Phương thức | Dòng | Chức năng |
|---|---|---|
| `computeAhpWeights()` | 136 | Tính trọng số AHP từ ma trận so sánh cặp |
| `rank()` | 53 | Xếp hạng bids bằng TOPSIS |

**Chỉ số nhất quán AHP:**
- CR (Consistency Ratio) ≤ 0.1 → ma trận nhất quán ✓
- Bảng RI dùng: Saaty (1980), n = 1..10

**7 tiêu chí TOPSIS:**

| Tiêu chí | Loại | Nguồn dữ liệu |
|---|---|---|
| price | Cost (thấp tốt hơn) | Bid amount |
| skillMatch | Benefit | So khớp skills freelancer vs job |
| experience | Benefit | FreelancerProfile.experience |
| rating | Benefit | Trung bình reviews |
| speed | Cost (nhanh tốt hơn) | Bid delivery days |
| deadlineFit | Benefit | deliveryDays ≤ job.deadline |
| portfolioScore | Benefit | Số lượng + quality portfolio items |
