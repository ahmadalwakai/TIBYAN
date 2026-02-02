# Tibyan Auth System Report

**Audit Date:** February 2, 2026  
**Auditor:** AI Code Auditor  
**Scope:** Authentication & User Lifecycle Analysis

---

## 1. Auth Architecture Summary

### Overview
Tibyan uses a **custom JWT cookie-based authentication system** implemented from scratch, NOT NextAuth.js (despite the dependency existing in `package.json`).

### Core Components

| Component | File Path | Purpose |
|-----------|-----------|---------|
| JWT Management | `src/lib/jwt.ts` | Sign/verify JWT tokens using `jose` library |
| Server Auth | `src/lib/auth.ts` | Server-side user retrieval from cookies |
| API Auth Guards | `src/lib/api-auth.ts` | API route authentication guards |
| Client Auth | `src/lib/auth-client.ts` | Client-side logout and user data |
| Role Guards | `src/lib/auth/guards.ts` | Role-based access control (RBAC) |
| Tokens | `src/lib/auth/tokens.ts` | Email verification & password reset tokens |
| Cookie Encoding | `src/lib/auth/cookie-encoding.ts` | Safe JSON encoding for cookies |
| Rate Limiting | `src/lib/rate-limit.ts` | In-memory rate limiting |
| CSRF (Unused) | `src/lib/csrf.ts` | CSRF utilities (NOT INTEGRATED) |

### Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AUTHENTICATION FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐   POST /api/auth/login   ┌──────────────────┐                 │
│  │  Login   │ ───────────────────────► │  Login Route     │                 │
│  │  Page    │                          │  route.ts        │                 │
│  └──────────┘                          └────────┬─────────┘                 │
│                                                 │                           │
│                                                 ▼                           │
│                                        ┌──────────────────┐                 │
│                                        │  Zod Validation  │                 │
│                                        │  LoginSchema     │                 │
│                                        └────────┬─────────┘                 │
│                                                 │                           │
│                                                 ▼                           │
│                                        ┌──────────────────┐                 │
│                                        │  Prisma Query    │                 │
│                                        │  User.findFirst  │                 │
│                                        └────────┬─────────┘                 │
│                                                 │                           │
│                                                 ▼                           │
│                                        ┌──────────────────┐                 │
│                                        │  bcryptjs.compare│                 │
│                                        │  Password Hash   │                 │
│                                        └────────┬─────────┘                 │
│                                                 │                           │
│                                                 ▼                           │
│                                        ┌──────────────────┐                 │
│                                        │  signToken()     │                 │
│                                        │  JWT (jose)      │                 │
│                                        │  7-day expiry    │                 │
│                                        └────────┬─────────┘                 │
│                                                 │                           │
│                                                 ▼                           │
│                                        ┌──────────────────┐                 │
│                                        │  Set-Cookie:     │                 │
│                                        │  auth-token      │ ◄─ httpOnly    │
│                                        │  user-data       │ ◄─ client-ok   │
│                                        └────────┬─────────┘                 │
│                                                 │                           │
│                                                 ▼                           │
│  ┌──────────┐   cookies sent           ┌──────────────────┐                 │
│  │ Protected│ ◄────────────────────────│  Client Browser  │                 │
│  │ Route    │                          └──────────────────┘                 │
│  └────┬─────┘                                                               │
│       │                                                                      │
│       ▼                                                                      │
│  ┌────────────────┐                                                         │
│  │ getCurrentUser()│───► verifyToken() ───► Prisma.findUnique              │
│  │ src/lib/auth.ts │                                                        │
│  └────────────────┘                                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. API Routes Map (Auth-Only)

### Standard User Auth Routes

| Route | Method | Purpose | Request Schema | Response | Cookies |
|-------|--------|---------|----------------|----------|---------|
| `/api/auth/login` | POST | User login | `LoginSchema` | `{ ok, data: { redirectTo } }` | Sets `auth-token` (httpOnly), `user-data` |
| `/api/auth/register` | POST | Student signup | `RegisterSchema` | `{ ok, data: { userId, email, emailSent } }` | None (requires email verification) |
| `/api/auth/register-member` | POST | Member signup | Custom Zod | `{ ok, data: { userId, redirectTo } }` | None |
| `/api/auth/logout` | POST | Logout | None | `{ ok }` | Clears `auth-token`, `user-data` |
| `/api/auth/me` | GET | Get current user | None | `{ ok, data: { id, email, name, role } }` | Reads cookies |
| `/api/auth/verify-email` | POST | Verify email token | `VerifyEmailSchema` | `{ ok, data: { message } }` | None |
| `/api/auth/resend-verification` | POST | Resend verification | `{ email }` | `{ ok }` | None |
| `/api/auth/forgot-password` | POST | Request reset link | `ForgotPasswordSchema` | `{ ok }` | None |
| `/api/auth/reset-password` | POST | Reset password | `ResetPasswordSchema` | `{ ok }` | None |

### Admin Auth Routes (Email Code-Based)

| Route | Method | Purpose | Request Schema | Response | Cookies |
|-------|--------|---------|----------------|----------|---------|
| `/api/admin/auth/request-code` | POST | Request login code | `AdminLoginRequestSchema` | `{ ok, data: { expiresIn } }` | None |
| `/api/admin/auth/verify-code` | POST | Verify code & login | `AdminVerifyCodeSchema` | `{ ok, data: { user, token } }` | Sets `auth-token` |

### Debug/Test Routes

| Route | Method | Purpose | Notes |
|-------|--------|---------|-------|
| `/api/auth/dev-login` | POST/GET | Dev-only admin login | **Disabled in production** |
| `/api/auth/debug-cookies` | GET | Debug cookie state | Should be disabled in prod |
| `/api/auth/verify-cookies` | GET | Verify cookie setup | Should be disabled in prod |
| `/api/auth/test-cookie` | * | Test cookie setting | Should be disabled in prod |
| `/api/auth/establish` | POST | Session establishment | Should be disabled in prod |

---

## 3. UI Pages/Components Map (Auth-Only)

### Auth Pages

| Page | Path | Purpose | API Calls |
|------|------|---------|-----------|
| Login | `/auth/login` | Standard login form | `POST /api/auth/login` |
| Register | `/auth/register` | Student registration | `POST /api/auth/register` |
| Member Signup | `/auth/member-signup` | Member registration | `POST /api/auth/register-member` |
| Admin Login | `/auth/admin-login` | Admin email-code login | `POST /api/admin/auth/request-code`, `POST /api/admin/auth/verify-code` |
| Verify Email | `/auth/verify` | Email verification page | `POST /api/auth/verify-email` |
| Verify Pending | `/auth/verify-pending` | Pending verification UI | `POST /api/auth/resend-verification` |
| Forgot Password | `/auth/forgot-password` | Request reset link | `POST /api/auth/forgot-password` |
| Reset Password | `/auth/reset-password` | Set new password | `POST /api/auth/reset-password` |

### Protected Layout Guards

| Layout | Path | Guard Logic | File |
|--------|------|-------------|------|
| Admin | `/admin/*` | Manual token check + DB verify | `src/app/admin/layout.tsx` |
| Teacher | `/teacher/*` | `getCurrentUser()` + role check | `src/app/teacher/layout.tsx` |
| Student | `/student/*` | `assertRoleAccess()` + emailVerified | `src/app/student/layout.tsx` |
| Member | `/member/*` | `assertRoleAccess()` | `src/app/member/layout.tsx` |

---

## 4. Registration Flow (Step-by-Step)

### Standard Student Registration (`/api/auth/register`)

1. **UI sends POST** → `src/app/auth/register/page.tsx` → `/api/auth/register`
2. **Rate limiting** → `withRateLimit()` checks IP (100 req/15min)
3. **Validation** → `RegisterSchema.safeParse(body)`:
   - `name`: min 2 chars
   - `email`: valid email format
   - `password`: min 8 chars
4. **Duplicate check** → `prisma.user.findFirst({ email })` (case-insensitive)
5. **Password hashing** → `bcryptjs.hash(password, 12)` (cost factor 12)
6. **User creation** → `prisma.user.create({...})`:
   - `role`: "STUDENT"
   - `status`: "ACTIVE"
   - `emailVerified`: false
7. **Token generation** → `createVerificationToken(userId, "EMAIL_VERIFICATION")`
8. **Email sending** → `sendEmail()` via Resend
9. **Response** → `{ ok: true, data: { emailSent, userId } }`
10. **Redirect** → Client navigates to `/auth/verify-pending?email=...`

### Member Registration (`/api/auth/register-member`)

Same flow, but:
- `role`: "MEMBER" (not "STUDENT")
- Includes optional `bio` field
- Notifies all admins via email about new member

### Evidence
```typescript
// src/app/api/auth/register/route.ts:47-55
const user = await prisma.user.create({
  data: {
    name,
    email: normalizedEmail,
    password: hashedPassword,
    role: "STUDENT",
    status: "ACTIVE",
    emailVerified: false,
  },
});
```

---

## 5. Login Flow (Step-by-Step)

### Standard Login (`/api/auth/login`)

1. **UI sends POST** → `src/app/auth/login/page.tsx` → `/api/auth/login`
2. **Content-type detection** → Supports JSON and form data
3. **Rate limiting** → Manual `checkRateLimit()` (100 req/15min)
4. **Validation** → `LoginSchema.safeParse(body)`:
   - `email`: valid email
   - `password`: min 8 chars
5. **User lookup** → `prisma.user.findFirst({ email })` (case-insensitive)
6. **Email verification check**:
   - MEMBER role: Skip verification check (can login unverified)
   - STUDENT/INSTRUCTOR/ADMIN: Must be verified
7. **Status checks**:
   - SUSPENDED → 403 error
   - PENDING → 403 error
8. **Password verification** → `bcryptjs.compare(password, user.password)`
   - **Legacy fallback**: If plain-text match, auto-upgrade to bcrypt
9. **Portal validation** → Check if user role matches portal being accessed
10. **Update activity** → `prisma.user.update({ lastActiveAt })`
11. **Token signing** → `signToken({ userId, role })` → 7-day expiry
12. **Cookie setting**:
    ```
    auth-token: JWT; HttpOnly; SameSite=Lax/None; Secure (prod); Path=/; Max-Age=604800
    user-data: {id,email,name,role}; SameSite=Lax/None; Secure (prod); Path=/; Max-Age=604800
    ```
13. **Response** → `{ ok: true, data: { redirectTo } }`

### Admin Login (Email-Code Based)

1. **Step 1: Request Code** → `/api/admin/auth/request-code`
   - Check if email is in `ADMIN_EMAILS` whitelist (`src/config/admin.ts`)
   - Generate 6-digit code
   - Store in `EmailVerificationCode` table (10-min expiry)
   - Send code via email
   
2. **Step 2: Verify Code** → `/api/admin/auth/verify-code`
   - Find code in DB
   - Verify email match, not expired, not used
   - Get or create admin user
   - Sign JWT token
   - Set `auth-token` cookie

### Evidence
```typescript
// src/app/api/auth/login/route.ts:306-308
const authTokenCookie = `auth-token=${authToken}; Path=/; Max-Age=604800; SameSite=${sameSiteValue}${secureAttr}; HttpOnly`;
const userDataCookie = `user-data=${encodeUserData(cookieUserData)}; Path=/; Max-Age=604800; SameSite=${sameSiteValue}${secureAttr}`;
```

---

## 6. Logout Flow (Step-by-Step)

### Server-Side (`/api/auth/logout`)

1. **Receive POST request**
2. **Create response** with `{ ok: true }`
3. **Clear cookies**:
   ```typescript
   response.cookies.set("auth-token", "", { maxAge: 0, ... });
   response.cookies.set("user-data", "", { maxAge: 0, ... });
   ```

### Client-Side (`src/lib/auth-client.ts:logout()`)

1. **Call server** → `POST /api/auth/logout`
2. **Clear cookies locally**:
   ```javascript
   document.cookie = "auth-token=; path=/; max-age=0; samesite=lax";
   document.cookie = "user-data=; path=/; max-age=0; samesite=lax";
   ```
3. **Force redirect** → `window.location.href = "/auth/login"`

### Issues Identified
- **No token blacklist**: Tokens remain valid until expiry (7 days)
- **Client clears cookies differently** than server (SameSite value)

---

## 7. Guards & Authorization

### Server Component Guards

| Guard | File | Usage |
|-------|------|-------|
| `getCurrentUser()` | `src/lib/auth.ts` | Returns user or null |
| `isAdmin()` | `src/lib/auth.ts` | Boolean check |
| `requireAdmin()` | `src/lib/auth.ts` | Throws if not admin |

### API Route Guards

| Guard | File | Returns |
|-------|------|---------|
| `requireUser(req)` | `src/lib/api-auth.ts` | User object OR 401 Response |
| `requireRole(req, role)` | `src/lib/api-auth.ts` | User object OR 401/403 Response |
| `requireAdmin(req)` | `src/lib/api-auth.ts` | User object OR 401/403 Response |

### Role-Based Access

| Route | Required Role | Guard File |
|-------|---------------|------------|
| `/admin/*` | ADMIN | `src/app/admin/layout.tsx` |
| `/teacher/*` | INSTRUCTOR or ADMIN | `src/app/teacher/layout.tsx` |
| `/student/*` | STUDENT + emailVerified | `src/app/student/layout.tsx` |
| `/member/*` | MEMBER | `src/app/member/layout.tsx` |

### Evidence
```typescript
// src/lib/auth/guards.ts:28-45
export async function assertRoleAccess({
  requiredRole,
  user,
  requireEmailVerified = false,
}: {...}): Promise<RoleAccessResult> {
  if (!user) {
    return { ok: false, status: 401, code: "UNAUTHENTICATED", ... };
  }
  if (user.role !== requiredRole) {
    return { ok: false, status: 403, code: "WRONG_PORTAL", ... };
  }
  // ...
}
```

---

## 8. Bugs / Misconfigurations

### Bug #1: Cookie SameSite Inconsistency
**Severity:** Medium  
**File:** Multiple files set cookies with different SameSite values

| Location | SameSite Value |
|----------|----------------|
| `login/route.ts` | `Lax` (dev) / `None` (prod) |
| `logout/route.ts` | `lax` (dev) / `none` (prod) |
| `admin/verify-code/route.ts` | `lax` (always) |
| `auth-client.ts` (client) | `lax` (always) |

**Impact:** Cookies may not work correctly in cross-site contexts.

### Bug #2: Admin Auth Sets No user-data Cookie
**Severity:** Low  
**File:** `src/app/api/admin/auth/verify-code/route.ts`  
**Evidence:** Only sets `auth-token`, not `user-data`

```typescript
// Line 160-166
response.cookies.set("auth-token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60,
  path: "/",
});
// Missing: response.cookies.set("user-data", ...)
```

**Impact:** Client-side code relying on `user-data` cookie won't work for admins.

### Bug #3: next-auth Dependency Unused
**Severity:** Low (DX/Security Hygiene)  
**File:** `package.json:44`

```json
"next-auth": "^4.24.13"
```

**Evidence:** Zero imports of `next-auth` in `/src` folder.

**Impact:** Bloated bundle, confusing documentation (README mentions NextAuth.js).

### Bug #4: NEXTAUTH_* Env Vars Documented But Unused
**Severity:** Low  
**Files:** `README.md`, `.env.example`

```
NEXTAUTH_SECRET="your-nextauth-secret-key-here"
NEXTAUTH_URL="https://your-domain.vercel.app"
```

**Impact:** Developer confusion, potential security misconfiguration.

### Bug #5: Missing Middleware.ts
**Severity:** Medium  
**Evidence:** No `middleware.ts` file found in project root or `src/`.

**Impact:** No centralized route protection. All auth is done in layout components (can be bypassed by direct API calls if guards forgotten).

### Bug #6: Dev Routes Exposed in Production (Potential)
**Severity:** High  
**Files:**
- `src/app/api/auth/dev-login/route.ts` - Protected by `NODE_ENV` check
- `src/app/api/auth/debug-cookies/route.ts` - NO production check
- `src/app/api/auth/verify-cookies/route.ts` - NO production check
- `src/app/api/auth/test-cookie/route.ts` - UNKNOWN (not fully audited)

**Evidence:**
```typescript
// dev-login/route.ts:24 - CORRECTLY BLOCKED
if (process.env.NODE_ENV !== "development") {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
```

But `debug-cookies/route.ts` has NO such check.

---

## 9. Security Findings

### CRITICAL

| ID | Issue | Evidence | File | Recommendation |
|----|-------|----------|------|----------------|
| S01 | **CSRF Not Implemented** | `src/lib/csrf.ts` exists but is never used in auth routes | All auth API routes | Implement CSRF tokens for state-changing operations |
| S02 | **Debug Routes in Production** | `debug-cookies` and `verify-cookies` have no prod guards | `src/app/api/auth/debug-cookies/route.ts` | Add `NODE_ENV !== "production"` check |

### HIGH

| ID | Issue | Evidence | File | Recommendation |
|----|-------|----------|------|----------------|
| S03 | **No Token Invalidation on Logout** | Token remains valid for 7 days after logout | `logout/route.ts` | Implement token blacklist (Redis) or short-lived tokens + refresh |
| S04 | **Rate Limiting is In-Memory** | Won't work in serverless/multi-instance | `src/lib/rate-limit.ts:19` | Use Redis (Upstash) for distributed rate limiting |
| S05 | **Legacy Plain-Text Password Support** | Auto-upgrades plain passwords | `login/route.ts:223-231` | Remove after migration; log security event |
| S06 | **Long-Lived JWT (7 days)** | No refresh token mechanism | `src/lib/jwt.ts:32` | Implement short-lived access + refresh tokens |

### MEDIUM

| ID | Issue | Evidence | File | Recommendation |
|----|-------|----------|------|----------------|
| S07 | **User Enumeration on Register** | Different message for "email exists" | `register/route.ts:40-43` | Use generic "Check your email" message |
| S08 | **No Password Complexity Requirements** | Only min 8 chars | `src/lib/validations.ts:104` | Add uppercase, number, special char requirements |
| S09 | **Missing Secure Flag in Dev** | Cookies set without Secure in development | `login/route.ts:305` | Acceptable for local dev, ensure prod uses Secure |
| S10 | **Admin Whitelist Hardcoded** | Admin emails in source code | `src/config/admin.ts:8-11` | Move to environment variables |

### LOW

| ID | Issue | Evidence | File | Recommendation |
|----|-------|----------|------|----------------|
| S11 | **JWT_SECRET Fallback in Dev** | Uses hardcoded fallback if env missing | `src/lib/jwt.ts:17` | Acceptable for dev, but warn loudly |
| S12 | **No Account Lockout** | No max failed attempts | `login/route.ts` | Implement lockout after N failures |

---

## 10. Incomplete Files List + Fix Plan

| File | Issue | Impact | Fix |
|------|-------|--------|-----|
| `src/lib/csrf.ts` | Functions `storeCsrfToken()` and `retrieveCsrfToken()` are placeholders | CSRF protection not working | Implement using Redis or cookie-based double-submit |
| `src/app/api/auth/debug-cookies/route.ts` | No production guard | Exposes debug info in prod | Add `if (NODE_ENV !== "development") return 404` |
| `src/app/api/auth/verify-cookies/route.ts` | No production guard | Exposes cookie validation logic | Add `if (NODE_ENV !== "development") return 404` |
| `src/app/api/auth/test-cookie/route.ts` | Test route, unknown state | Unknown | Audit and add prod guard |
| `src/app/api/admin/auth/verify-code/route.ts` | Missing `user-data` cookie | Admin client state broken | Add `response.cookies.set("user-data", ...)` |

### TODOs Found in Source

| File | Line | Content | Priority |
|------|------|---------|----------|
| `src/app/api/teacher/lessons/route.ts` | 204 | `// TODO: Send email invitations in background` | Low |
| `src/app/api/payments/route.ts` | 156 | `// TODO: Implement coupon validation` | Medium |
| `src/app/api/admin/stats/route.ts` | 66 | `trend: "+6%", // TODO: Calculate actual trend` | Low |
| `src/app/api/admin/applications/[id]/route.ts` | 87 | `// TODO: Add reviewedBy from authenticated admin user` | Medium |

---

## Appendix A: User Model (Prisma Schema)

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String
  password      String
  role          Role     @default(STUDENT)
  status        UserStatus @default(ACTIVE)
  emailVerified Boolean  @default(false)
  avatar        String?
  bio           String?
  notificationPrefs Json?
  membershipStatus MembershipStatus @default(ACTIVE)
  membershipPlan   String?
  membershipExpiresAt DateTime?
  membershipPerks  Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastActiveAt  DateTime @default(now())
  // ... relations
}

enum Role {
  STUDENT
  INSTRUCTOR
  ADMIN
  MEMBER
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  PENDING
}
```

## Appendix B: Cookie Specification

| Cookie | Purpose | httpOnly | Secure | SameSite | Max-Age | Path |
|--------|---------|----------|--------|----------|---------|------|
| `auth-token` | JWT token | Yes | Prod only | Lax/None | 604800 (7d) | / |
| `user-data` | User info for client | No | Prod only | Lax/None | 604800 (7d) | / |

## Appendix C: JWT Token Payload

```typescript
interface JWTPayload {
  userId: string;
  role: string;
  iat: number;  // Issued at (auto-set by jose)
  exp: number;  // Expiration (auto-set, +7 days)
}
```

---

**End of Report**
