# Authentication & Authorization Module

**BidWise Freelance Platform — Technical Documentation**
**Version:** 1.0 | **Stack:** NestJS 11 · Prisma 6 · PostgreSQL · Redis · Next.js 16

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Database Design](#3-database-design)
4. [RBAC Design](#4-rbac-design)
5. [API Reference](#5-api-reference)
6. [Backend Flows](#6-backend-flows)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Security Model](#8-security-model)
9. [Environment Variables](#9-environment-variables)
10. [Setup & Migration](#10-setup--migration)
11. [Error Code Reference](#11-error-code-reference)

---

## 1. Overview

Module Auth & Authorization của BidWise xử lý toàn bộ vòng đời danh tính người dùng trên nền tảng Freelance Marketplace, bao gồm:

| Feature | Mô tả | Priority |
|---|---|:---:|
| Đăng ký tài khoản | Email + password, chọn role Client / Freelancer | CORE |
| Xác thực email OTP | 6 chữ số, hết hạn 10 phút, tối đa 5 lần resend | CORE |
| Đăng nhập | JWT Access Token + Refresh Token | CORE |
| Refresh Token | Token rotation, reuse detection | CORE |
| Đăng xuất | Blacklist AT bằng Redis, revoke RT trong DB | CORE |
| Quên mật khẩu | Email link, hết hạn 30 phút, single-use | CORE |
| Đặt lại mật khẩu | Verify token → hash mật khẩu mới → revoke sessions | CORE |
| Đổi mật khẩu | Xác nhận mật khẩu cũ → revoke sessions khác | CORE |
| Cập nhật profile | Thông tin cá nhân, avatar | CORE |
| Quản lý Role | Admin assign/revoke: ADMIN, MODERATOR, CLIENT, FREELANCER | CORE |
| Khóa / Mở khóa TK | Soft-ban, email thông báo lý do | CORE |
| Login History | Xem sessions đang hoạt động, revoke từng session | OPTIONAL |

---

## 2. Architecture

### 2.1 Module Structure

```
be/src/
├── main.ts                          # Bootstrap: Helmet, CORS, ValidationPipe, Guards
├── app.module.ts                    # Root: ConfigModule, ThrottlerModule, RedisModule
│
├── config/
│   ├── app.config.ts
│   ├── jwt.config.ts
│   ├── redis.config.ts
│   └── mail.config.ts
│
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts   # @CurrentUser()
│   │   ├── roles.decorator.ts          # @Roles(RoleType.ADMIN)
│   │   └── public.decorator.ts         # @Public() — bỏ qua JWT guard
│   ├── guards/
│   │   ├── jwt-auth.guard.ts           # Verify AT + check @Public
│   │   └── roles.guard.ts              # Kiểm tra role từ JWT payload
│   ├── filters/
│   │   └── global-exception.filter.ts  # Chuẩn hóa error response
│   ├── interceptors/
│   │   └── transform-response.interceptor.ts  # Wrap { success, data, timestamp }
│   └── types/
│       ├── jwt-payload.type.ts         # AccessTokenPayload class
│       └── request.type.ts             # AuthenticatedRequest interface
│
└── modules/
    ├── prisma/          # PrismaService (Global)
    ├── token/           # TokenService: sinh AT/RT, Redis blacklist, rotation
    ├── email/           # EmailService + HTML templates
    ├── otp/             # OtpService: sinh/verify OTP, rate limit resend
    ├── session/         # SessionService: tạo/revoke session, device tracking
    ├── auth/            # AuthController + AuthService (12 endpoints)
    ├── users/           # UsersController + UsersService (profile, sessions)
    └── admin/           # AdminController + AdminService (RBAC, suspend)

fe/src/
├── middleware.ts                    # Next.js Edge: bảo vệ routes
├── lib/
│   ├── api/
│   │   ├── client.ts               # Axios + in-memory AT + auto-refresh interceptor
│   │   └── auth.api.ts             # Tất cả API calls
│   └── auth/
│       └── auth.store.ts           # Zustand store
└── app/
    └── (auth)/
        ├── layout.tsx
        ├── login/page.tsx
        ├── register/page.tsx
        ├── verify-email/page.tsx
        ├── forgot-password/page.tsx
        └── reset-password/page.tsx
```

### 2.2 Request Lifecycle

```
HTTP Request
     │
     ▼
[Helmet] — Security headers (CSP, HSTS, X-Frame-Options...)
     │
     ▼
[ThrottlerGuard] — Rate limiting theo IP (global: 60 req/60s)
     │
     ▼
[JwtAuthGuard] — Kiểm tra @Public(); nếu không → verify JWT signature
     │
     ├── Invalid/Expired → 401
     │
     ▼
[JwtStrategy.validate()] — Kiểm tra Redis blacklist (jti)
     │
     ├── Blacklisted → 401 TOKEN_REVOKED
     │
     ▼
[RolesGuard] — So sánh roles trong JWT payload vs @Roles(...)
     │
     ├── Thiếu role → 403 Insufficient permissions
     │
     ▼
[ValidationPipe] — Validate & transform DTO (whitelist, forbidNonWhitelisted)
     │
     ▼
Controller Handler → Service → Prisma → PostgreSQL
     │
     ▼
[TransformResponseInterceptor] — { success: true, data: ..., timestamp: ... }
     │
     ▼
[GlobalExceptionFilter] — Chuẩn hóa error, không leak stack trace
```

---

## 3. Database Design

### 3.1 Entity Relationship

```
users ──────────────────────────── user_roles (M:M) ──────── roles
  │                                                              │
  ├── otp_verifications                                          └── role_permissions (M:M) ── permissions
  ├── refresh_tokens ──── login_sessions
  ├── password_reset_tokens
  └── account_status_logs
```

### 3.2 Bảng `users`

| Column | Type | Constraint | Mô tả |
|---|---|---|---|
| `id` | `String` | PK, CUID | ID người dùng |
| `email` | `String` | UNIQUE | Email đăng nhập |
| `passwordHash` | `String` | NOT NULL | bcrypt, cost=12 |
| `fullName` | `String` | NOT NULL | Họ tên |
| `avatarUrl` | `String?` | | URL ảnh đại diện |
| `bio` | `String?` | | Giới thiệu bản thân |
| `phone` | `String?` | | Số điện thoại |
| `status` | `UserStatus` | DEFAULT PENDING | Trạng thái tài khoản |
| `emailVerifiedAt` | `DateTime?` | | Thời điểm xác thực email |
| `lastLoginAt` | `DateTime?` | | Lần đăng nhập cuối |
| `failedLoginCount` | `Int` | DEFAULT 0 | Đếm lần đăng nhập sai |
| `lockedUntil` | `DateTime?` | | Khóa brute-force đến lúc này |
| `deletedAt` | `DateTime?` | | Soft delete |

**Indexes:** `email`, `status`

### 3.3 Bảng `otp_verifications`

| Column | Type | Mô tả |
|---|---|---|
| `userId` | FK → users | |
| `type` | `OtpType` | EMAIL_VERIFICATION / PASSWORD_RESET / TWO_FACTOR |
| `codeHash` | `String` | bcrypt(otp_code, cost=10) |
| `status` | `OtpStatus` | PENDING / VERIFIED / EXPIRED / REVOKED |
| `attemptCount` | `Int` | Số lần nhập sai (tối đa 5) |
| `sendCount` | `Int` | Số lần gửi (tối đa 5/ngày) |
| `expiresAt` | `DateTime` | now() + 10 phút |

**Index:** `(userId, type, status)`

### 3.4 Bảng `refresh_tokens`

| Column | Type | Mô tả |
|---|---|---|
| `tokenHash` | `String` | UNIQUE — SHA-256(raw_refresh_token) |
| `sessionId` | FK → login_sessions | |
| `isRevoked` | `Boolean` | DEFAULT false |
| `expiresAt` | `DateTime` | now() + 7 ngày |
| `replacedBy` | `String?` | ID token mới trong rotation chain |

**Index:** `(userId, isRevoked)`, `tokenHash`

### 3.5 Bảng `password_reset_tokens`

| Column | Type | Mô tả |
|---|---|---|
| `tokenHash` | `String` | UNIQUE — SHA-256(raw_token, 32 bytes) |
| `isUsed` | `Boolean` | Single-use enforcement |
| `expiresAt` | `DateTime` | now() + 30 phút |
| `ipAddress` | `String?` | IP của request quên mật khẩu |

### 3.6 Bảng `login_sessions`

| Column | Type | Mô tả |
|---|---|---|
| `status` | `SessionStatus` | ACTIVE / LOGGED_OUT / EXPIRED / REVOKED |
| `ipAddress` | `String` | IP đăng nhập |
| `userAgent` | `String?` | Raw user-agent header |
| `deviceType` | `String?` | desktop / mobile / tablet |
| `deviceName` | `String?` | "Chrome on macOS" |
| `lastActiveAt` | `DateTime` | Cập nhật mỗi lần refresh token |

### 3.7 Account Status State Machine

```
                    ┌──────────────────────┐
                    │  PENDING_VERIFICATION │ ◄── [Register]
                    └──────────────────────┘
                              │
                    [OTP Verified thành công]
                              │
                              ▼
              ┌──────────────────────────────┐
              │           ACTIVE             │
              └──────────────────────────────┘
               │                         ▲
    [Admin Suspend]              [Admin Unsuspend]
               │                         │
               ▼                         │
          ┌──────────┐             ┌──────────┐
          │ SUSPENDED │────────────►          │
          └──────────┘             └──────────┘
               │
    [Self Deactivate]
               ▼
          ┌─────────────┐
          │ DEACTIVATED │
          └─────────────┘
```

**Quy tắc:**
- `SUSPENDED`: login trả về `403 ACCOUNT_SUSPENDED`, tất cả sessions bị revoke
- `PENDING_VERIFICATION`: login trả về `403 EMAIL_NOT_VERIFIED`
- `DEACTIVATED`: login trả về `403 ACCOUNT_DEACTIVATED`

---

## 4. RBAC Design

### 4.1 Roles

| Role | Mô tả |
|---|---|
| `ADMIN` | Toàn quyền hệ thống |
| `MODERATOR` | Quản lý nội dung và người dùng, không thay đổi role |
| `CLIENT` | Đăng job, quản lý bid và contract |
| `FREELANCER` | Tìm job, submit bid, làm việc theo contract |

> Một user có thể có nhiều role đồng thời (ví dụ: vừa CLIENT vừa FREELANCER).

### 4.2 Permission Matrix

| Resource · Action | ADMIN | MODERATOR | CLIENT | FREELANCER |
|---|:---:|:---:|:---:|:---:|
| `users · read:all` | ✅ | ✅ | ❌ | ❌ |
| `users · read:own` | ✅ | ✅ | ✅ | ✅ |
| `users · update:own` | ✅ | ✅ | ✅ | ✅ |
| `users · suspend` | ✅ | ✅ | ❌ | ❌ |
| `users · assign-role` | ✅ | ❌ | ❌ | ❌ |
| `jobs · create` | ✅ | ❌ | ✅ | ❌ |
| `jobs · read:all` | ✅ | ✅ | ✅ | ✅ |
| `jobs · update:own` | ✅ | ❌ | ✅ | ❌ |
| `jobs · delete:any` | ✅ | ✅ | ❌ | ❌ |
| `bids · create` | ✅ | ❌ | ❌ | ✅ |
| `bids · read:own` | ✅ | ✅ | ✅ | ✅ |
| `contracts · create` | ✅ | ❌ | ✅ | ❌ |
| `reports · resolve` | ✅ | ✅ | ❌ | ❌ |
| `system · configure` | ✅ | ❌ | ❌ | ❌ |

### 4.3 Guard Chain

```typescript
// Sử dụng trong Controller
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.ADMIN)
@Post('users/:userId/roles')
assignRole(...) {}

// Bỏ qua authentication
@Public()
@Post('login')
login(...) {}
```

**APP_GUARD:** Cả `JwtAuthGuard` và `RolesGuard` được đăng ký globally trong `AppModule` — mọi route đều được bảo vệ theo mặc định, trừ khi dùng `@Public()`.

---

## 5. API Reference

**Base URL:** `http://localhost:3001/api/v1`
**Auth Header:** `Authorization: Bearer <access_token>`
**Response format:**
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-06-08T10:00:00.000Z"
}
```

---

### 5.1 POST `/auth/register`

Tạo tài khoản mới. Gửi OTP xác thực email ngay sau khi đăng ký.

**Rate limit:** 3 requests / giờ / IP

**Request:**
```json
{
  "email": "user@example.com",
  "password": "StrongP@ss123",
  "fullName": "Nguyen Van A",
  "role": "CLIENT"
}
```

| Field | Validation |
|---|---|
| `email` | Valid email format, unique |
| `password` | Min 8 ký tự, ≥1 hoa, ≥1 số, ≥1 ký tự đặc biệt |
| `fullName` | 2–100 ký tự |
| `role` | `CLIENT` hoặc `FREELANCER` |

**Response 201:**
```json
{
  "success": true,
  "data": {
    "userId": "cm1abc123",
    "message": "Registration successful. Please verify your email."
  }
}
```

**Errors:**
| Code | HTTP | Mô tả |
|---|:---:|---|
| `EMAIL_ALREADY_EXISTS` | 409 | Email đã được đăng ký |
| `VALIDATION_ERROR` | 400 | Dữ liệu không hợp lệ |

---

### 5.2 POST `/auth/verify-email`

Xác thực email bằng mã OTP 6 chữ số.

**Request:**
```json
{
  "userId": "cm1abc123",
  "otp": "847291"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "user": {
      "id": "cm1abc123",
      "email": "user@example.com",
      "fullName": "Nguyen Van A",
      "roles": ["CLIENT"],
      "status": "ACTIVE"
    }
  }
}
```

**Errors:**
| Code | HTTP | Mô tả |
|---|:---:|---|
| `OTP_INVALID` | 400 | Mã OTP sai |
| `OTP_EXPIRED` | 400 | OTP đã hết hạn (>10 phút) |
| `OTP_MAX_ATTEMPTS_EXCEEDED` | 400 | Nhập sai >5 lần, OTP bị revoke |

---

### 5.3 POST `/auth/resend-otp`

Gửi lại OTP xác thực email.

**Rate limit:** 5 requests / 24 giờ / userId; cooldown 60 giây giữa các lần

**Request:**
```json
{ "userId": "cm1abc123" }
```

**Response 200:**
```json
{
  "success": true,
  "data": { "expiresAt": "2026-06-08T10:10:00.000Z" }
}
```

**Errors:**
| Code | HTTP | Mô tả |
|---|:---:|---|
| `OTP_SEND_LIMIT_EXCEEDED` | 429 | Đã gửi 5 lần trong 24h |
| `OTP_RESEND_COOLDOWN` | 429 | Chưa đủ 60 giây kể từ lần gửi trước |
| `EMAIL_ALREADY_VERIFIED` | 400 | Email đã xác thực rồi |

---

### 5.4 POST `/auth/login`

Đăng nhập, nhận Access Token và Refresh Token.

**Rate limit:** 5 requests / phút / IP

**Request:**
```json
{
  "email": "user@example.com",
  "password": "StrongP@ss123"
}
```

**Response 200:** Giống `verify-email` — trả về access/refresh token + user info.

**Errors:**
| Code | HTTP | Mô tả |
|---|:---:|---|
| `INVALID_CREDENTIALS` | 401 | Email hoặc mật khẩu sai |
| `ACCOUNT_SUSPENDED` | 403 | Tài khoản bị khóa |
| `EMAIL_NOT_VERIFIED` | 403 | Chưa xác thực email |
| `ACCOUNT_LOCKED` | 403 | Brute-force lock (≥10 lần sai), kèm `lockedUntil` |
| `TOO_MANY_REQUESTS` | 429 | Vượt rate limit |

---

### 5.5 POST `/auth/refresh`

Đổi Refresh Token lấy cặp token mới (Token Rotation).

**Request:**
```json
{ "refreshToken": "eyJhbGciOiJIUzI1NiJ9..." }
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

**Lưu ý quan trọng:** Nếu phát hiện Refresh Token đã bị revoke được dùng lại (**Token Reuse Attack**), toàn bộ sessions của user sẽ bị force logout.

**Errors:**
| Code | HTTP | Mô tả |
|---|:---:|---|
| `REFRESH_TOKEN_INVALID` | 401 | Token không hợp lệ hoặc sai hash |
| `REFRESH_TOKEN_EXPIRED` | 401 | Token hết hạn (>7 ngày) |
| `TOKEN_REUSE_DETECTED` | 401 | Token đã revoke được dùng lại — force logout all |

---

### 5.6 POST `/auth/logout`

Đăng xuất. Blacklist Access Token hiện tại trong Redis, revoke Refresh Token.

**Auth:** Required

**Request (optional):**
```json
{ "logoutAll": false }
```

| Field | Mô tả |
|---|---|
| `logoutAll: false` | Chỉ logout session hiện tại |
| `logoutAll: true` | Logout tất cả devices |

**Response 200:**
```json
{ "success": true, "data": null }
```

---

### 5.7 POST `/auth/forgot-password`

Gửi email link đặt lại mật khẩu. Response luôn trả về 200 để tránh email enumeration.

**Rate limit:** 3 requests / giờ / IP

**Request:**
```json
{ "email": "user@example.com" }
```

**Response 200:** *(Luôn thành công dù email có tồn tại hay không)*
```json
{
  "success": true,
  "data": { "message": "If your email exists, a reset link has been sent." }
}
```

Email chứa link dạng: `https://app.bidwise.vn/reset-password?token=<64-char-hex>`

---

### 5.8 POST `/auth/reset-password`

Đặt lại mật khẩu bằng token từ email. Token hết hạn sau 30 phút và chỉ dùng được một lần.

**Request:**
```json
{
  "token": "a3f8c1d2...",
  "newPassword": "NewStrongP@ss456"
}
```

**Response 200:**
```json
{ "success": true, "data": { "message": "Password reset successfully." } }
```

**Side effect:** Tất cả sessions và refresh tokens của user bị revoke → bắt buộc đăng nhập lại.

**Errors:**
| Code | HTTP | Mô tả |
|---|:---:|---|
| `TOKEN_INVALID` | 400 | Token không tồn tại |
| `TOKEN_EXPIRED` | 400 | Quá 30 phút |
| `TOKEN_ALREADY_USED` | 400 | Token đã được dùng rồi |

---

### 5.9 POST `/auth/change-password`

Đổi mật khẩu khi đã đăng nhập. Yêu cầu mật khẩu cũ.

**Auth:** Required

**Request:**
```json
{
  "currentPassword": "OldP@ss123",
  "newPassword": "NewStrongP@ss456"
}
```

**Response 200:**
```json
{ "success": true, "data": { "message": "Password changed." } }
```

**Side effect:** Blacklist AT hiện tại, revoke tất cả sessions → các thiết bị khác bị logout.

**Errors:**
| Code | HTTP | Mô tả |
|---|:---:|---|
| `CURRENT_PASSWORD_INCORRECT` | 400 | Mật khẩu cũ sai |
| `SAME_AS_CURRENT_PASSWORD` | 400 | Mật khẩu mới trùng mật khẩu cũ |

---

### 5.10 GET `/users/me`

Lấy thông tin profile người dùng hiện tại.

**Auth:** Required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "cm1abc123",
    "email": "user@example.com",
    "fullName": "Nguyen Van A",
    "avatarUrl": null,
    "bio": null,
    "phone": null,
    "status": "ACTIVE",
    "roles": ["CLIENT"],
    "emailVerifiedAt": "2026-06-08T09:00:00.000Z",
    "lastLoginAt": "2026-06-08T10:00:00.000Z",
    "createdAt": "2026-06-08T08:00:00.000Z"
  }
}
```

---

### 5.11 PATCH `/users/me`

Cập nhật thông tin profile.

**Auth:** Required

**Request:**
```json
{
  "fullName": "Nguyen Van B",
  "bio": "Senior Full-stack Developer",
  "phone": "+84901234567",
  "avatarUrl": "https://cdn.bidwise.vn/avatars/abc.jpg"
}
```

Tất cả fields đều optional.

---

### 5.12 GET `/users/me/sessions`

Xem danh sách sessions đang hoạt động.

**Auth:** Required

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "sess_abc123",
      "deviceName": "Chrome on macOS",
      "deviceType": "desktop",
      "ipAddress": "192.168.1.100",
      "lastActiveAt": "2026-06-08T10:00:00.000Z",
      "status": "ACTIVE",
      "isCurrent": true
    },
    {
      "id": "sess_def456",
      "deviceName": "Safari on iPhone",
      "deviceType": "mobile",
      "ipAddress": "10.0.0.5",
      "lastActiveAt": "2026-06-07T20:00:00.000Z",
      "status": "ACTIVE",
      "isCurrent": false
    }
  ]
}
```

---

### 5.13 DELETE `/users/me/sessions/:sessionId`

Revoke một session cụ thể (đăng xuất khỏi thiết bị đó).

**Auth:** Required

---

### 5.14 GET `/admin/users`

Lấy danh sách người dùng với tìm kiếm và phân trang.

**Auth:** Required | **Roles:** ADMIN, MODERATOR

**Query params:**
| Param | Default | Mô tả |
|---|---|---|
| `page` | 1 | Trang |
| `limit` | 20 | Số bản ghi mỗi trang |
| `search` | | Tìm theo email hoặc fullName |

---

### 5.15 POST `/admin/users/:userId/roles`

Assign role cho user.

**Auth:** Required | **Roles:** ADMIN only

**Request:**
```json
{ "roleType": "MODERATOR" }
```

---

### 5.16 DELETE `/admin/users/:userId/roles/:roleType`

Revoke role của user.

**Auth:** Required | **Roles:** ADMIN only

---

### 5.17 POST `/admin/users/:userId/suspend`

Khóa tài khoản. Revoke toàn bộ sessions, gửi email thông báo.

**Auth:** Required | **Roles:** ADMIN, MODERATOR

**Request:**
```json
{ "reason": "Violation of terms: spam bidding" }
```

---

### 5.18 POST `/admin/users/:userId/unsuspend`

Mở khóa tài khoản.

**Auth:** Required | **Roles:** ADMIN, MODERATOR

---

## 6. Backend Flows

### 6.1 Registration + OTP Flow

```
[POST /auth/register]
       │
       ├── Validate DTO (email unique, password strength, role enum)
       ├── bcrypt.hash(password, cost=12)
       ├── Transaction:
       │     ├── user.create (status=PENDING_VERIFICATION)
       │     ├── userRole.create (link role)
       │     └── accountStatusLog.create (action=REGISTERED)
       └── OtpService.generateAndSend(userId, EMAIL_VERIFICATION)
             ├── Kiểm tra sendCount < 5
             ├── Kiểm tra cooldown 60s
             ├── Revoke OTP cũ (status=REVOKED)
             ├── Random 6-digit code
             ├── bcrypt.hash(code, cost=10) → lưu codeHash
             └── EmailService.sendOtpVerification()

[POST /auth/verify-email]
       │
       ├── OtpService.verify(userId, EMAIL_VERIFICATION, otp)
       │     ├── Tìm OTP status=PENDING
       │     ├── Kiểm tra expiresAt
       │     ├── attemptCount++
       │     ├── bcrypt.compare(otp, codeHash)
       │     ├── Nếu sai & attemptCount >= 5 → status=REVOKED
       │     └── Nếu đúng → status=VERIFIED
       │
       ├── user.update (status=ACTIVE, emailVerifiedAt=now())
       ├── accountStatusLog.create (action=EMAIL_VERIFIED)
       └── createAuthResponse() → AccessToken + RefreshToken + Session
```

### 6.2 Login + Brute-Force Protection Flow

```
[POST /auth/login]
       │
       ├── [ThrottlerGuard] — 5 req/phút/IP → 429 nếu vượt
       │
       ├── user.findUnique({ email })
       │     └── Không tìm thấy → 401 INVALID_CREDENTIALS
       │         (không tiết lộ email có tồn tại không)
       │
       ├── Kiểm tra lockedUntil > now() → 403 ACCOUNT_LOCKED
       │
       ├── Kiểm tra status:
       │     SUSPENDED → 403
       │     PENDING_VERIFICATION → 403
       │     DEACTIVATED → 403
       │
       ├── bcrypt.compare(password, passwordHash)
       │     └── Sai:
       │           failedLoginCount++
       │           failedLoginCount >= 10 → lockedUntil = now() + 15 phút
       │           → 401 INVALID_CREDENTIALS
       │
       ├── Đúng:
       │     failedLoginCount = 0
       │     lockedUntil = null
       │     lastLoginAt = now()
       │
       └── createAuthResponse():
             ├── SessionService.create() — device tracking
             └── TokenService.createTokenPair()
                   ├── AccessToken: sign({ sub, email, roles, sessionId, jti }, 15m)
                   └── RefreshToken: sign({ sub, sessionId, tokenId }, 7d)
                         tokenHash = SHA-256(rawRefreshToken) → DB
```

### 6.3 Token Refresh + Rotation Flow

```
[POST /auth/refresh]
       │
       ├── Decode JWT payload (không verify, chỉ lấy tokenId/sessionId)
       │
       ├── tokenHash = SHA-256(rawRefreshToken)
       ├── RefreshToken.findUnique({ tokenHash })
       │     └── Không tìm thấy → 401 REFRESH_TOKEN_INVALID
       │
       ├── id !== payload.tokenId → 401 REFRESH_TOKEN_INVALID
       │
       ├── isRevoked = true → ⚠️ TOKEN REUSE DETECTED
       │     └── revokeAllUserSessions() → 401 TOKEN_REUSE_DETECTED
       │
       ├── expiresAt < now() → 401 REFRESH_TOKEN_EXPIRED
       │
       └── TokenService.rotateRefreshToken():
             ├── createTokenPair() → new AT + new RT
             ├── old RT: isRevoked=true, replacedBy=newTokenId
             └── SessionService.touch(sessionId) — lastActiveAt=now()
```

### 6.4 Forgot Password Flow

```
[POST /auth/forgot-password]
       │
       ├── user.findUnique({ email })
       │     └── Không tồn tại hoặc status != ACTIVE → return (200, không tiết lộ)
       │
       ├── Revoke existing reset tokens (isUsed=true)
       │
       ├── rawToken = crypto.randomBytes(32).toString('hex')  ← 64 hex chars
       ├── tokenHash = SHA-256(rawToken)
       ├── PasswordResetToken.create (expiresAt = now() + 30 phút)
       │
       └── EmailService.sendPasswordReset(resetUrl)
             resetUrl = `${FRONTEND_URL}/reset-password?token=${rawToken}`

[POST /auth/reset-password]
       │
       ├── tokenHash = SHA-256(rawToken)
       ├── PasswordResetToken.findUnique({ tokenHash })
       │     ├── Không có → 400 TOKEN_INVALID
       │     ├── isUsed → 400 TOKEN_ALREADY_USED
       │     └── expiresAt < now() → 400 TOKEN_EXPIRED
       │
       ├── Transaction:
       │     ├── user.update { passwordHash: bcrypt(newPassword, 12) }
       │     ├── PasswordResetToken.update { isUsed: true, usedAt: now() }
       │     └── accountStatusLog.create { action: PASSWORD_CHANGED }
       │
       └── TokenService.revokeAllUserSessions() — force re-login
```

### 6.5 Logout Flow

```
[POST /auth/logout]
       │
       ├── Lấy AT từ Authorization header
       ├── TokenService.verifyAccessToken(rawAT) → lấy { jti, exp }
       ├── ttl = exp - now() (giây còn lại)
       ├── Redis.set(`blacklist:at:${jti}`, '1', EX, ttl)
       │
       ├── logoutAll = false:
       │     └── SessionService.revoke(sessionId)
       │           RefreshToken.updateMany({ sessionId, isRevoked: false } → revoked)
       │
       └── logoutAll = true:
             └── TokenService.revokeAllUserSessions(userId)
                   LoginSession.updateMany({ status: REVOKED })
                   RefreshToken.updateMany({ isRevoked: true })
```

---

## 7. Frontend Architecture

### 7.1 Token Storage Strategy

| Token | Storage | Lý do |
|---|---|---|
| Access Token | **In-memory** (Zustand) | Tránh XSS — không persist localStorage |
| Refresh Token | **httpOnly Cookie** (set bởi server) | Tránh JS access, tự động gửi với `withCredentials: true` |

### 7.2 Auth Store (Zustand)

```typescript
// lib/auth/auth.store.ts
interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth(user, accessToken): void;   // set AT in-memory
  clearAuth(): void;
  loadSession(): Promise<void>;       // gọi /auth/refresh khi app khởi động
  logout(logoutAll?): Promise<void>;
}
```

**Khởi tạo session:** Khi app load, `loadSession()` gọi `POST /auth/refresh`. Nếu httpOnly cookie chứa RT hợp lệ → nhận AT mới và set vào store. Nếu không → user = unauthenticated.

### 7.3 Axios Interceptor — Auto-Refresh

```
Request ──► Attach Authorization: Bearer <AT from memory>
Response ◄── 200: trả về data bình thường
Response ◄── 401 (AT expired):
    │
    ├── isRefreshing = true
    ├── Queue các request thất bại
    ├── POST /auth/refresh (RT từ cookie tự động đính kèm)
    │     ├── Thành công → setAccessToken(newAT), retry queued requests
    │     └── Thất bại → clearAuth(), redirect /login
    └── isRefreshing = false
```

### 7.4 Next.js Middleware — Route Protection

```typescript
// middleware.ts (Edge Runtime)
// Kiểm tra presence của refresh_token cookie:
// - /dashboard, /settings, /admin: redirect /login nếu không có cookie
// - /login, /register, ...: redirect /dashboard nếu đã có cookie
```

> **Lưu ý:** Middleware chỉ kiểm tra sự tồn tại của cookie, không verify JWT. Việc verify thực sự xảy ra tại API (backend). Đây là đủ cho UX flow — nếu cookie hết hạn, Axios interceptor sẽ xử lý redirect /login.

### 7.5 Page Flow

```
/register
    │ Submit form (email, password, fullName, role)
    │ POST /auth/register → { userId }
    ▼
/verify-email?userId=...&email=...
    │ Nhập OTP 6 chữ số
    │ POST /auth/verify-email → { accessToken, refreshToken, user }
    │ setAuth(user, AT) + RT set vào cookie bởi server
    ▼
/dashboard (authenticated)

/login
    │ POST /auth/login → tokens + user
    │ setAuth() → redirect /dashboard hoặc ?redirect=
    ▼
/dashboard

/forgot-password
    │ POST /auth/forgot-password (luôn 200)
    │ Hiển thị thông báo "kiểm tra email"
    ▼
Email → click link → /reset-password?token=...
    │ POST /auth/reset-password → 200
    ▼
/login (forced re-login)
```

---

## 8. Security Model

### 8.1 Tóm tắt các biện pháp bảo mật

| Threat | Biện pháp |
|---|---|
| **Password brute-force** | Throttler 5 req/min/IP + DB account lock (10 fails → 15 phút) |
| **Credential stuffing** | bcrypt cost=12, không tiết lộ email enumeration |
| **XSS token theft** | AT in-memory, RT httpOnly cookie |
| **CSRF** | SameSite=Strict cookie + CORS whitelist |
| **Token replay sau logout** | Redis blacklist AT (TTL = remaining expiry) |
| **Refresh token theft & reuse** | Token rotation + Reuse detection (revoke all sessions) |
| **Password reset abuse** | Token single-use, 30 phút TTL, SHA-256 stored |
| **OTP brute-force** | Max 5 attempts → auto revoke; max 5 resends/day; 60s cooldown |
| **SQL injection** | Prisma parameterized queries (không raw SQL) |
| **XSS phản xạ** | Helmet CSP + class-validator whitelist |
| **Sensitive data exposure** | passwordHash loại trừ khỏi mọi response (`omit`) |
| **Clickjacking** | Helmet X-Frame-Options: DENY |
| **Man-in-the-middle** | HTTPS enforced, HSTS 1 năm |

### 8.2 JWT Payload Structure

**Access Token** (15 phút):
```json
{
  "sub": "cm1abc123",
  "email": "user@example.com",
  "roles": ["CLIENT"],
  "sessionId": "sess_xyz789",
  "jti": "a1b2c3d4e5f6...",
  "iat": 1717837200,
  "exp": 1717838100
}
```

**Refresh Token** (7 ngày):
```json
{
  "sub": "cm1abc123",
  "sessionId": "sess_xyz789",
  "tokenId": "tok_def456",
  "iat": 1717837200,
  "exp": 1718442000
}
```

### 8.3 Redis Blacklist

```
Key:   blacklist:at:<jti>
Value: "1"
TTL:   <remaining_seconds_until_AT_expiry>
```

Khi AT hết hạn tự nhiên, Redis entry cũng tự xóa (TTL) → không cần cleanup job.

### 8.4 Password Reset Token Security

```
rawToken  = crypto.randomBytes(32)  →  64-char hex string  →  gửi qua email
tokenHash = SHA-256(rawToken)       →  lưu trong DB

Khi verify: SHA-256(submittedToken) so sánh với tokenHash trong DB
→ Nếu DB bị leak, attacker không thể dùng hash để reset mật khẩu
```

---

## 9. Environment Variables

```bash
# be/.env

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/bidwise?schema=public"

# App
PORT=3001
NODE_ENV=development          # production | development | test
FRONTEND_URL=http://localhost:3000

# JWT — ít nhất 32 ký tự ngẫu nhiên
JWT_ACCESS_SECRET=<min-32-random-chars>
JWT_REFRESH_SECRET=<min-32-random-chars-different>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=               # để trống nếu không có auth

# Email (SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=noreply@bidwise.vn
MAIL_PASS=your-app-password
MAIL_FROM="BidWise <noreply@bidwise.vn>"

# App URL (dùng cho link trong email)
APP_URL=http://localhost:3001
```

**Sinh JWT secret ngẫu nhiên:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 10. Setup & Migration

### 10.1 Yêu cầu

- Node.js ≥ 20
- PostgreSQL ≥ 15
- Redis ≥ 7

### 10.2 Chạy lần đầu

```bash
# 1. Cài dependencies
cd be && npm install

# 2. Copy & điền .env
cp .env.example .env
# Điền DATABASE_URL, JWT secrets, Redis, Mail

# 3. Tạo database schema
npx prisma migrate dev --name init

# 4. Seed roles & permissions
npx prisma db seed

# 5. Chạy backend (dev)
npm run start:dev

# 6. Chạy frontend
cd ../fe && npm install && npm run dev
```

### 10.3 Prisma Commands

```bash
# Tạo migration mới sau khi sửa schema
npx prisma migrate dev --name <tên_migration>

# Áp dụng migration lên production (không tạo migration mới)
npx prisma migrate deploy

# Xem trạng thái migration
npx prisma migrate status

# Mở Prisma Studio (UI quản lý DB)
npx prisma studio

# Regenerate Prisma Client sau khi sửa schema
npx prisma generate
```

### 10.4 Build cho Production

```bash
cd be

# Build
npm run build

# Chạy production
npm run start:prod
```

---

## 11. Error Code Reference

| Code | HTTP | Module | Mô tả |
|---|:---:|---|---|
| `EMAIL_ALREADY_EXISTS` | 409 | Auth | Email đã được đăng ký |
| `OTP_INVALID` | 400 | OTP | Mã OTP sai |
| `OTP_EXPIRED` | 400 | OTP | OTP hết hạn (>10 phút) |
| `OTP_MAX_ATTEMPTS_EXCEEDED` | 400 | OTP | Nhập sai quá 5 lần |
| `OTP_SEND_LIMIT_EXCEEDED` | 429 | OTP | Đã gửi 5 lần trong 24h |
| `OTP_RESEND_COOLDOWN` | 429 | OTP | Phải đợi 60 giây |
| `EMAIL_ALREADY_VERIFIED` | 400 | Auth | Email đã xác thực rồi |
| `INVALID_CREDENTIALS` | 401 | Auth | Email hoặc mật khẩu sai |
| `ACCOUNT_SUSPENDED` | 403 | Auth | Tài khoản bị khóa |
| `EMAIL_NOT_VERIFIED` | 403 | Auth | Chưa xác thực email |
| `ACCOUNT_DEACTIVATED` | 403 | Auth | Tài khoản bị vô hiệu hóa |
| `ACCOUNT_LOCKED` | 403 | Auth | Brute-force lock tạm thời |
| `TOKEN_REVOKED` | 401 | Token | Access Token đã bị blacklist |
| `REFRESH_TOKEN_INVALID` | 401 | Token | Refresh Token không hợp lệ |
| `REFRESH_TOKEN_EXPIRED` | 401 | Token | Refresh Token hết hạn |
| `TOKEN_REUSE_DETECTED` | 401 | Token | Phát hiện tái sử dụng RT → revoke all |
| `TOKEN_INVALID` | 400 | Password | Reset token không hợp lệ |
| `TOKEN_EXPIRED` | 400 | Password | Reset token hết hạn (>30 phút) |
| `TOKEN_ALREADY_USED` | 400 | Password | Reset token đã dùng rồi |
| `CURRENT_PASSWORD_INCORRECT` | 400 | Password | Mật khẩu hiện tại sai |
| `SAME_AS_CURRENT_PASSWORD` | 400 | Password | Mật khẩu mới giống mật khẩu cũ |
| `USER_NOT_FOUND` | 404 | Users | Không tìm thấy user |
| `SESSION_NOT_FOUND` | 404 | Session | Không tìm thấy session |
| `ROLE_ALREADY_ASSIGNED` | 400 | Admin | Role đã được gán rồi |
| `ROLE_NOT_ASSIGNED` | 404 | Admin | Role chưa được gán |
| `ALREADY_SUSPENDED` | 400 | Admin | Tài khoản đã bị khóa rồi |
| `NOT_SUSPENDED` | 400 | Admin | Tài khoản không đang bị khóa |
| `TOO_MANY_REQUESTS` | 429 | Global | Vượt rate limit |
| `INTERNAL_SERVER_ERROR` | 500 | Global | Lỗi hệ thống |

---

*Tài liệu này được tạo tự động từ source code. Cập nhật lần cuối: 2026-06-08.*
