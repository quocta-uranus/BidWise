# BidWise

Dự án gồm 2 phần: **Frontend** (`fe/`) và **Backend** (`be/`).

---

## Yêu cầu

- Node.js >= 20
- npm >= 9
- PostgreSQL đang chạy

---

## Frontend (`fe/`)

Sử dụng **Next.js 16** với TypeScript, TailwindCSS, App Router, Turbopack và shadcn.

### Cài đặt

```bash
cd fe
npm install
```

### Chạy development

```bash
npm run dev
```

Mở trình duyệt tại [http://localhost:3000](http://localhost:3000)

### Build production

```bash
npm run build
npm run start
```

---

## Backend (`be/`)

Sử dụng **NestJS** với Prisma ORM, PostgreSQL và JWT Authentication.

### Cài đặt

```bash
cd be
npm install
```

### Cấu hình môi trường

Tạo hoặc chỉnh sửa file `be/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/bidwise"
JWT_SECRET="your_jwt_secret_here"
```

> Thay `USER`, `PASSWORD` bằng thông tin PostgreSQL của bạn.

### Migrate database

```bash
cd be
npx prisma migrate dev --name init
```

### Generate Prisma client

```bash
npx prisma generate
```

### Chạy development

```bash
npm run start:dev
```

Server chạy tại [http://localhost:3000](http://localhost:3000)

> Nếu FE và BE cùng chạy, đổi port BE trong `be/src/main.ts` thành `3001`.

### Build production

```bash
npm run build
npm run start:prod
```

---

## Chạy đồng thời FE và BE

Mở 2 terminal riêng biệt:

**Terminal 1 — Frontend:**
```bash
cd fe
npm run dev
```

**Terminal 2 — Backend:**
```bash
cd be
npm run start:dev
```

---

## Cấu trúc thư mục

```
BidWise/
├── fe/                  # Next.js frontend
│   └── src/
│       ├── app/         # App Router pages
│       ├── components/  # shadcn UI components
│       └── lib/         # Utilities
└── be/                  # NestJS backend
    ├── src/             # Source code
    ├── prisma/          # Schema và migrations
    └── .env             # Biến môi trường
```
