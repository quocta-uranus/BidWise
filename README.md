# BidWise

Freelance Auction Platform — FPT University Capstone 2025.

**Stack:** Next.js 16 · NestJS 11 · PostgreSQL 16 · Redis 7 · Prisma 6 · Docker

---

## Yêu cầu

| Tool | Version | Ghi chú |
|---|---|---|
| Node.js | >= 20 | |
| npm | >= 9 | |
| Docker Desktop | mới nhất | Chạy PostgreSQL + Redis |

---

## Cấu trúc thư mục

```
BidWise/
├── fe/                        # Next.js 16 — Frontend
│   └── src/
│       ├── app/               # App Router pages
│       ├── components/        # UI components
│       └── lib/               # API client, Auth store, Hooks
├── be/                        # NestJS 11 — Backend
│   ├── src/
│   │   ├── modules/           # auth, users, admin, otp, token, email, session
│   │   ├── common/            # guards, decorators, filters, interceptors
│   │   └── config/            # app, jwt, redis, mail configs
│   ├── prisma/                # Schema + migrations
│   └── .env                   # Biến môi trường (không commit)
├── docker-compose.yml         # PostgreSQL + Redis
└── docs/
    └── auth-module.md         # Technical docs — Auth & Authorization
```

---

## Lần đầu setup (làm 1 lần duy nhất)

### Bước 1 — Cài Docker Desktop

Tải tại: https://www.docker.com/products/docker-desktop/

Cài xong → mở Docker Desktop lên (phải thấy icon cá voi ở thanh menu bar).

### Bước 2 — Khởi động Database

```bash
# Từ thư mục gốc BidWise/
docker compose up -d
```

Lệnh này tải và khởi động 2 container:
- `bidwise_postgres` — PostgreSQL 16 tại port `5432`
- `bidwise_redis` — Redis 7 tại port `6379`

Kiểm tra đang chạy:
```bash
docker compose ps
```

### Bước 3 — Cài dependencies Backend

```bash
cd be
npm install
```

### Bước 4 — Tạo bảng Database (Migration)

```bash
# Vẫn trong thư mục be/
npx prisma migrate dev --name init
```

Lệnh này tạo toàn bộ bảng theo schema trong `prisma/schema.prisma`.

### Bước 5 — Seed dữ liệu mặc định (Roles & Permissions)

```bash
docker exec bidwise_postgres psql -U bidwise -d bidwise -f /dev/stdin < prisma/seed.sql
```

Tạo 4 roles: `ADMIN`, `MODERATOR`, `CLIENT`, `FREELANCER` và 14 permissions.

### Bước 6 — Cài dependencies Frontend

```bash
cd ../fe
npm install
```

---

## Sau khi git pull (đồng bộ DB với team)

Mỗi khi pull code từ teammate về, **bắt buộc chạy các lệnh sau** để đồng bộ database:

```bash
cd be

# 1. Apply tất cả migration mới (thêm bảng/cột mà teammate đã tạo)
npx prisma migrate deploy

# 2. Regenerate Prisma Client cho khớp với schema mới
npx prisma generate
```

> **Tại sao cần làm vậy?** Git chỉ sync code — database của mỗi người chạy local riêng. Khi teammate sửa `schema.prisma` và tạo migration, bạn pull về chỉ có file migration, chưa có thay đổi trong DB của bạn. `migrate deploy` là lệnh apply các file đó vào DB local.

### Nếu gặp lỗi `The column X does not exist`

Đây là dấu hiệu chưa chạy migrate sau khi pull. Chạy 2 lệnh trên là fix.

---

## Quy trình khi sửa schema.prisma (cho người thay đổi)

Nếu bạn cần thêm bảng/cột mới vào `prisma/schema.prisma`, **phải làm đủ 3 bước** trước khi push:

```bash
cd be

# 1. Tạo file migration (đặt tên mô tả rõ thay đổi)
npx prisma migrate dev --name add_ten_bang_hoac_column

# 2. Kiểm tra file migration đã được tạo
git status   # phải thấy file mới trong prisma/migrations/

# 3. Commit CẢ HAI file cùng nhau
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add <mô tả thay đổi>"
```

> **Không được** chỉ commit `schema.prisma` mà không có file migration đi kèm — teammate pull về sẽ bị lỗi DB như trên.

---

## Mỗi ngày khi làm việc

### Bước 1 — Mở Docker Desktop

Bắt buộc mở trước — không có Docker thì database không chạy.

### Bước 2 — Bật database

```bash
# Từ thư mục gốc BidWise/
docker compose start
```

> Khác với `docker compose up -d` (tạo mới), lệnh `start` chỉ bật lại container đã tạo sẵn.

### Bước 3 — Chạy Backend (Terminal 1)

```bash
cd be
npm run start:dev
```

Chờ thấy dòng:
```
BidWise API running on http://localhost:3001/api/v1
```

### Bước 4 — Chạy Frontend (Terminal 2)

```bash
cd fe
npm run dev
```

Mở browser tại: http://localhost:3000

---

## Khi xong việc

```bash
# Dừng database (dữ liệu vẫn được giữ lại)
docker compose stop
```

---

## Biến môi trường Backend (`be/.env`)

File `.env` đã được cấu hình sẵn cho local development. Các giá trị cần chú ý:

```env
# Database — khớp với docker-compose.yml
DATABASE_URL="postgresql://bidwise:bidwise123@localhost:5432/bidwise?schema=public"

# JWT — đã sinh ngẫu nhiên, không thay đổi (sẽ logout toàn bộ user)
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Email — Gmail SMTP (App Password)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=taquoc196@gmail.com
MAIL_PASS=wmqepkdkbhtepefn
MAIL_FROM="BidWise <taquoc196@gmail.com>"
```

> **Quan trọng:** Không commit file `.env` lên Git. File này đã được thêm vào `.gitignore`.

---

## API

| Service | URL |
|---|---|
| Backend API | http://localhost:3001/api/v1 |
| Frontend | http://localhost:3000 |
| Prisma Studio (DB UI) | http://localhost:5555 |

### Xem database bằng giao diện

```bash
cd be
npx prisma studio
```

Mở browser tại http://localhost:5555 — xem/sửa/xóa data trực tiếp.

---

## Các lệnh hay dùng

### Docker

```bash
# Bật database (đã tạo rồi)
docker compose start

# Tắt database (giữ data)
docker compose stop

# Xem log database
docker compose logs -f postgres

# Reset toàn bộ database (XÓA HẾT DATA)
docker compose down -v
docker compose up -d
# Sau đó chạy lại migrate và seed
```

### Backend

```bash
cd be

# Chạy dev (hot reload)
npm run start:dev

# Build production
npm run build

# Chạy production build
npm run start:prod

# Tạo migration mới sau khi sửa schema.prisma
npx prisma migrate dev --name ten_migration

# Xem trạng thái migration
npx prisma migrate status

# Regenerate Prisma Client
npx prisma generate

# Xem database qua UI
npx prisma studio

# Chạy tests
npm run test
```

### Frontend

```bash
cd fe

# Chạy dev
npm run dev

# Build
npm run build

# Chạy production build
npm run start
```

---

## Troubleshooting

### Lỗi `The column X does not exist` hoặc `Invalid prisma.xxx.create() invocation`

Nguyên nhân: vừa pull code về nhưng chưa apply migration mới của teammate.

```bash
cd be
npx prisma migrate deploy
npx prisma generate
# Sau đó restart backend
```

### Lỗi `port 3001 already in use`

```bash
lsof -ti:3001 | xargs kill -9
```

Sau đó chạy lại `npm run start:dev`.

### Lỗi `service has no container to start`

Lần đầu phải dùng `up`, không phải `start`:
```bash
docker compose up -d
```

### Database không kết nối được

1. Kiểm tra Docker Desktop đang chạy
2. Kiểm tra container: `docker compose ps`
3. Nếu container stopped: `docker compose start`

### Xóa user để test lại

```bash
docker exec bidwise_postgres psql -U bidwise -d bidwise \
  -c "DELETE FROM users WHERE email = 'email@example.com';"
```

### Reset password user trong DB

```bash
# Sinh hash cho password mới
node -e "require('bcryptjs').hash('NewPass@123', 12).then(console.log)"

# Update vào DB
docker exec bidwise_postgres psql -U bidwise -d bidwise \
  -c "UPDATE users SET \"passwordHash\" = '<hash>' WHERE email = 'email@example.com';"
```

---

## Auth Flow tóm tắt

```
Đăng ký → OTP Email (10 phút) → Verify → ACTIVE
Login → Access Token (15 phút, in-memory) + Refresh Token (7 ngày, httpOnly cookie)
Refresh trang → AuthProvider tự gọi /auth/refresh → dùng cookie RT lấy AT mới
Logout → Blacklist AT trong Redis + Revoke RT trong DB + Xóa cookie
```

Xem đầy đủ tại: [`docs/auth-module.md`](docs/auth-module.md)
