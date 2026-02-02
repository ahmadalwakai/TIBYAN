# تقرير نظام التسجيل والدخول والخروج

**تاريخ التدقيق:** 2 فبراير 2026  
**النطاق:** نظام المصادقة وإدارة الجلسات والصلاحيات  
**المشروع:** منصة تبيان (Tibyan LMS)

---

## تأكيد سياق المشروع

- **إطار العمل:** Next.js App Router (v16.1.6)
- **نهج المصادقة:** JWT مخصص عبر الكوكيز (ليس NextAuth رغم وجود الحزمة في `package.json`)
- **قاعدة البيانات:** PostgreSQL مع Prisma ORM
- **التشفير:** `bcryptjs` (معامل التكلفة 12)
- **مكتبة JWT:** `jose` (HS256)
- **صلاحية التوكن:** 7 أيام بدون تجديد
- **حماية المسارات:** عبر layouts لا middleware مركزي
- **دليل:** لا يوجد أي استيراد لـ `next-auth` في مجلد `src/`

---

## 1. ملخص معماري

### المكونات الأساسية

| المكون | المسار | الوظيفة |
|--------|--------|---------|
| إدارة JWT | `src/lib/jwt.ts` | توقيع والتحقق من التوكنات |
| المصادقة الخادم | `src/lib/auth.ts` | `getCurrentUser()` من الكوكيز |
| حراس API | `src/lib/api-auth.ts` | `requireUser()`, `requireAdmin()`, `requireRole()` |
| المصادقة العميل | `src/lib/auth-client.ts` | `logout()`, `getCurrentUserClient()` |
| حراس الأدوار | `src/lib/auth/guards.ts` | `assertRoleAccess()` |
| التوكنات | `src/lib/auth/tokens.ts` | إنشاء والتحقق من توكنات البريد |
| ترميز الكوكيز | `src/lib/auth/cookie-encoding.ts` | ترميز JSON للعربية |
| تحديد المعدل | `src/lib/rate-limit.ts` | في الذاكرة (100 طلب/15 دقيقة) |
| CSRF (غير مستخدم) | `src/lib/csrf.ts` | دوال فارغة placeholder |

### مخطط التدفق

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         تدفق المصادقة الأساسي                             │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│    صفحة الدخول        POST /api/auth/login         مسار API              │
│   ┌─────────┐ ─────────────────────────────────► ┌─────────────┐         │
│   │  Login  │                                    │ login/route │         │
│   │  Page   │                                    │    .ts      │         │
│   └─────────┘                                    └──────┬──────┘         │
│                                                         │                │
│                                                         ▼                │
│                                              ┌──────────────────┐        │
│                                              │ Zod Validation   │        │
│                                              │ LoginSchema      │        │
│                                              └────────┬─────────┘        │
│                                                       │                  │
│                                                       ▼                  │
│                                              ┌──────────────────┐        │
│                                              │ Prisma Query     │        │
│                                              │ User.findFirst   │        │
│                                              └────────┬─────────┘        │
│                                                       │                  │
│                                                       ▼                  │
│                                              ┌──────────────────┐        │
│                                              │ bcryptjs.compare │        │
│                                              └────────┬─────────┘        │
│                                                       │                  │
│                                                       ▼                  │
│                                              ┌──────────────────┐        │
│                                              │ signToken()      │        │
│                                              │ JWT 7 أيام       │        │
│                                              └────────┬─────────┘        │
│                                                       │                  │
│                                                       ▼                  │
│                                              ┌──────────────────┐        │
│                                              │ Set-Cookie:      │        │
│                                              │ auth-token       │ httpOnly│
│                                              │ user-data        │ قابل للقراءة│
│                                              └────────┬─────────┘        │
│                                                       │                  │
│  ┌─────────────┐   cookies مع كل طلب      ◄──────────┘                  │
│  │ صفحة محمية  │                                                        │
│  └──────┬──────┘                                                        │
│         │                                                                │
│         ▼                                                                │
│  getCurrentUser() ──► verifyToken() ──► Prisma.findUnique              │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. خريطة الـ API الخاصة بالمصادقة

### مسارات المستخدم العادي

| المسار | الأسلوب | الوظيفة | مخطط التحقق | الكوكيز |
|--------|---------|---------|-------------|---------|
| `/api/auth/login` | POST | تسجيل الدخول | `LoginSchema` | يُنشئ `auth-token`, `user-data` |
| `/api/auth/register` | POST | تسجيل طالب | `RegisterSchema` | لا شيء |
| `/api/auth/register-member` | POST | تسجيل عضو | `MemberRegisterSchema` | لا شيء |
| `/api/auth/logout` | POST | تسجيل الخروج | لا شيء | يحذف `auth-token`, `user-data` |
| `/api/auth/me` | GET | بيانات المستخدم | لا شيء | يقرأ الكوكيز |
| `/api/auth/verify-email` | POST | تفعيل البريد | `VerifyEmailSchema` | لا شيء |
| `/api/auth/resend-verification` | POST | إعادة إرسال التفعيل | `{ email }` | لا شيء |
| `/api/auth/forgot-password` | POST | طلب إعادة تعيين | `ForgotPasswordSchema` | لا شيء |
| `/api/auth/reset-password` | POST | تغيير كلمة المرور | `ResetPasswordSchema` | لا شيء |

### مسارات المسؤول

| المسار | الأسلوب | الوظيفة | مخطط التحقق | الكوكيز |
|--------|---------|---------|-------------|---------|
| `/api/admin/auth/request-code` | POST | طلب رمز دخول | `AdminLoginRequestSchema` | لا شيء |
| `/api/admin/auth/verify-code` | POST | التحقق من الرمز | `AdminVerifyCodeSchema` | يُنشئ `auth-token` فقط ❌ |

### مسارات التطوير (يجب حمايتها)

| المسار | حالة الحماية | الدليل |
|--------|--------------|--------|
| `/api/auth/dev-login` | ✅ محمي | `if (NODE_ENV !== "development")` سطر 24 |
| `/api/auth/debug-cookies` | ✅ محمي | `if (!isDev)` سطر 10 |
| `/api/auth/verify-cookies` | ✅ محمي | `if (NODE_ENV === "production")` سطر 14 |

---

## 3. خريطة صفحات الواجهة الخاصة بالمصادقة

| الصفحة | المسار | API المستدعى | عند النجاح | عند الفشل |
|--------|--------|-------------|------------|-----------|
| تسجيل الدخول | `/auth/login` | `POST /api/auth/login` | توجيه لـ `/member` أو البوابة المناسبة | رسالة خطأ toast |
| تسجيل طالب | `/auth/register` | `POST /api/auth/register` | توجيه لـ `/auth/verify-pending` | رسالة خطأ |
| تسجيل عضو | `/auth/member-signup` | `POST /api/auth/register-member` | توجيه لـ `/auth/verify-pending` | رسالة خطأ |
| دخول المسؤول | `/auth/admin-login` | `POST /api/admin/auth/request-code` ثم `verify-code` | توجيه لـ `/admin` | رسالة خطأ |
| تفعيل البريد | `/auth/verify` | `POST /api/auth/verify-email` | رسالة نجاح + رابط تسجيل الدخول | رسالة خطأ |
| انتظار التفعيل | `/auth/verify-pending` | `POST /api/auth/resend-verification` | toast نجاح | toast خطأ |
| نسيت كلمة المرور | `/auth/forgot-password` | `POST /api/auth/forgot-password` | رسالة نجاح | رسالة خطأ |
| إعادة تعيين | `/auth/reset-password` | `POST /api/auth/reset-password` | توجيه للدخول | رسالة خطأ |

---

## 4. شرح التسجيل

### تسجيل الطالب (`/api/auth/register`)

**التدفق:**
```
الواجهة ─► POST /api/auth/register ─► Zod Validation ─► Prisma ─► Token ─► Email ─► Response
```

**الخطوات التفصيلية:**

1. **استلام الطلب** - الواجهة ترسل `{ name, email, password }`
2. **تحديد المعدل** - `withRateLimit()` يفحص IP (100 طلب/15 دقيقة)
   ```typescript
   // src/lib/rate-limit.ts:36
   auth: { maxRequests: 100, windowMs: 15 * 60 * 1000 }
   ```
3. **التحقق من المدخلات** - `RegisterSchema`:
   ```typescript
   // src/lib/validations.ts:102-105
   name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
   email: z.string().email("البريد الإلكتروني غير صحيح"),
   password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
   ```
4. **فحص التكرار** - `prisma.user.findFirst({ email })` (حساس للحالة: لا)
5. **تشفير كلمة المرور** - `bcryptjs.hash(password, 12)`
6. **إنشاء المستخدم**:
   ```typescript
   // src/app/api/auth/register/route.ts:47-55
   await prisma.user.create({
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
7. **إنشاء توكن التفعيل** - `createVerificationToken(userId, "EMAIL_VERIFICATION")`
   - صلاحية 24 ساعة
   - التوكن الخام يُرسل للبريد، hash يُخزن في DB
8. **إرسال بريد التفعيل** - عبر Resend
9. **الرد** - `{ ok: true, data: { userId, email, emailSent } }`
10. **التوجيه** - الواجهة توجه لـ `/auth/verify-pending?email=...`

### تسجيل العضو (`/api/auth/register-member`)

**الاختلافات عن تسجيل الطالب:**
- `role: "MEMBER"` بدلاً من `"STUDENT"`
- يدعم حقل `bio` اختياري
- يُرسل إشعار لجميع المسؤولين عند التسجيل

```typescript
// src/app/api/auth/register-member/route.ts:67-74
const user = await prisma.user.create({
  data: {
    name,
    email: normalizedEmail,
    password: hashedPassword,
    role: "MEMBER",
    status: "ACTIVE",
    emailVerified: false,
    bio: bio || null,
  },
});
```

---

## 5. شرح تسجيل الدخول

### الدخول العادي (`/api/auth/login`)

**التدفق:**
```
الواجهة ─► POST /api/auth/login ─► Rate Limit ─► Zod ─► Prisma ─► Password ─► JWT ─► Cookies ─► Redirect
```

**الخطوات التفصيلية:**

1. **استلام الطلب** - يدعم JSON و FormData
2. **تحديد المعدل** - `checkRateLimit()` يدوياً
3. **التحقق** - `LoginSchema`: email + password (min 8 chars)
4. **البحث عن المستخدم**:
   ```typescript
   // src/app/api/auth/login/route.ts:102-109
   const user = await prisma.user.findFirst({
     where: {
       email: { equals: normalizedEmail, mode: "insensitive" },
     },
   });
   ```
5. **فحص تفعيل البريد**:
   - دور `MEMBER`: يتجاوز الفحص (يدخل بدون تفعيل)
   - دور `STUDENT/INSTRUCTOR/ADMIN`: يجب تفعيل البريد
6. **فحص حالة الحساب**:
   - `SUSPENDED` ← خطأ 403
   - `PENDING` ← خطأ 403
7. **التحقق من كلمة المرور**:
   ```typescript
   // src/app/api/auth/login/route.ts:218
   let isPasswordValid = await compare(password, user.password);
   ```
   - **دعم كلمات المرور القديمة**: إذا كانت plain-text تُرقّى تلقائياً لـ bcrypt
8. **فحص البوابة الصحيحة** - مثلاً STUDENT لا يدخل `/member`
9. **تحديث آخر نشاط** - `prisma.user.update({ lastActiveAt })`
10. **توقيع JWT**:
    ```typescript
    // src/lib/jwt.ts:31-38
    return await new SignJWT({ userId: payload.userId, role: payload.role })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);
    ```
11. **تعيين الكوكيز**:
    ```typescript
    // src/app/api/auth/login/route.ts:305-308
    auth-token: JWT; Path=/; Max-Age=604800; HttpOnly; SameSite=Lax|None; Secure (prod)
    user-data: JSON; Path=/; Max-Age=604800; SameSite=Lax|None; Secure (prod)
    ```
12. **التوجيه** - حسب الدور: MEMBER→/member, STUDENT→/student, etc.

### دخول المسؤول (رمز البريد)

**الخطوة الأولى - طلب الرمز:**
```typescript
// src/app/api/admin/auth/request-code/route.ts
1. التحقق من البريد في القائمة البيضاء (src/config/admin.ts)
2. توليد رمز 6 أرقام
3. تخزين في EmailVerificationCode (صلاحية 10 دقائق)
4. إرسال عبر البريد
```

**الخطوة الثانية - التحقق من الرمز:**
```typescript
// src/app/api/admin/auth/verify-code/route.ts
1. إيجاد الرمز في DB
2. التحقق من التطابق والصلاحية
3. إنشاء/إيجاد مستخدم ADMIN
4. توقيع JWT
5. تعيين auth-token فقط (⚠️ ينقص user-data)
```

---

## 6. شرح تسجيل الخروج

### الخادم (`/api/auth/logout`)

```typescript
// src/app/api/auth/logout/route.ts:7-31
export async function POST() {
  const response = NextResponse.json({ ok: true, ... });
  
  response.cookies.set("auth-token", "", {
    httpOnly: true,
    secure: !isDev,
    sameSite: isDev ? "lax" : "none",
    maxAge: 0,
    path: "/",
  });
  
  response.cookies.set("user-data", "", {
    maxAge: 0,
    path: "/",
  });
  
  return response;
}
```

### العميل (`src/lib/auth-client.ts`)

```typescript
// src/lib/auth-client.ts:22-38
export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  } catch { }
  
  document.cookie = "auth-token=; path=/; max-age=0; samesite=lax";
  document.cookie = "user-data=; path=/; max-age=0; samesite=lax";
  
  window.location.href = "/auth/login";
}
```

**⚠️ مشكلة:** التوكن يبقى صالحاً 7 أيام بعد الخروج (لا يوجد blacklist).

---

## 7. صلاحيات الأدوار والحماية

### الأدوار المتاحة

| الدور | البوابة | تفعيل البريد مطلوب؟ |
|-------|---------|---------------------|
| `ADMIN` | `/admin` | نعم |
| `INSTRUCTOR` | `/teacher` | نعم |
| `STUDENT` | `/student` | نعم |
| `MEMBER` | `/member` | لا |

### حماية المسارات (Layouts)

**Admin Layout:**
```typescript
// src/app/admin/layout.tsx:10-38
const token = cookieStore.get("auth-token")?.value;
if (!token) redirect("/auth/admin-login");

const payload = await verifyToken(token);
if (!payload) redirect("/auth/admin-login");

const user = await prisma.user.findUnique({ where: { id: payload.userId } });
if (!user || user.status !== "ACTIVE" || user.role !== "ADMIN") {
  redirect("/auth/admin-login");
}
```

**Student Layout:**
```typescript
// src/app/student/layout.tsx:8-15
const user = await getCurrentUser();
const access = await assertRoleAccess({
  requiredRole: "STUDENT",
  user,
  requireEmailVerified: true, // ⬅️ يتطلب تفعيل البريد
});
if (!access.ok) redirect(access.redirectTo);
```

**Member Layout:**
```typescript
// src/app/member/layout.tsx:8-14
const user = await getCurrentUser();
const access = await assertRoleAccess({ requiredRole: "MEMBER", user });
// ⬅️ لا يتطلب تفعيل البريد
if (!access.ok) redirect(access.redirectTo);
```

**Teacher Layout:**
```typescript
// src/app/teacher/layout.tsx:8-16
const user = await getCurrentUser();
if (!user) redirect("/auth/login?redirect=/teacher");
if (user.role !== "INSTRUCTOR" && user.role !== "ADMIN") {
  redirect("/?error=unauthorized");
}
```

### دالة assertRoleAccess

```typescript
// src/lib/auth/guards.ts:23-91
export async function assertRoleAccess({
  requiredRole,
  user,
  requireEmailVerified = false,
}): Promise<RoleAccessResult> {
  if (!user) → UNAUTHENTICATED (401)
  if (user.role !== requiredRole) → WRONG_PORTAL (403)
  if (requireEmailVerified && !dbUser.emailVerified) → EMAIL_NOT_VERIFIED (403)
  return { ok: true }
}
```

---

## 8. الأخطاء والمشاكل (مع الأدلة)

### خطأ #1: عدم تناسق SameSite في الكوكيز

| الملف | القيمة |
|-------|--------|
| `login/route.ts:306` | `SameSite=Lax` (dev) / `SameSite=None` (prod) |
| `logout/route.ts:15` | `sameSite: "lax"` (dev) / `"none"` (prod) |
| `admin/verify-code/route.ts:161` | `sameSite: "lax"` ← دائماً! |
| `auth-client.ts:35` | `samesite=lax` ← دائماً! |

**التأثير:** قد تفشل الكوكيز في السياقات cross-site في Production.

### خطأ #2: دخول المسؤول لا يُنشئ user-data

```typescript
// src/app/api/admin/auth/verify-code/route.ts:160-167
response.cookies.set("auth-token", token, { ... });
// ❌ مفقود: response.cookies.set("user-data", ...)
```

**التأثير:** الكود العميل الذي يعتمد على `user-data` (مثل `getCurrentUserClient()`) لن يعمل للمسؤولين.

### خطأ #3: حزمة next-auth موجودة لكن غير مستخدمة

```json
// package.json:44
"next-auth": "^4.24.13"
```

**الدليل:** البحث عن `next-auth` في `src/**` لم يُرجع نتائج.

**التأثير:** تضخم الحزم، تشويش التوثيق (README يذكر NextAuth).

### خطأ #4: متغيرات NEXTAUTH_* موثقة لكن غير مستخدمة

```bash
# .env.example:15-16
NEXTAUTH_SECRET="your-nextauth-secret-key-here"
NEXTAUTH_URL="https://your-domain.vercel.app"
```

**التأثير:** تشويش المطورين الجدد.

### خطأ #5: لا يوجد middleware.ts

**الدليل:** البحث لم يجد `middleware.ts` في المشروع.

**التأثير:** لا توجد حماية مركزية. كل الحماية في layouts (يمكن تجاوزها إذا نُسي guard في API route).

### خطأ #6: دعم كلمات المرور النصية القديمة

```typescript
// src/app/api/auth/login/route.ts:223-231
if (!isPasswordValid && !isBcryptHash && password === user.password) {
  const upgradedHash = await hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: upgradedHash },
  });
  isPasswordValid = true;
}
```

**التأثير:** خطر أمني إذا كان هناك مستخدمين بكلمات مرور plain-text.

---

## 9. نقاط أمنية

### حرج (Critical)

| الرمز | المشكلة | الدليل | التوصية |
|-------|---------|--------|---------|
| S01 | **CSRF غير مُطبق** | `src/lib/csrf.ts` يحتوي دوال فارغة placeholder، لا استخدام في auth routes | تطبيق CSRF tokens أو استخدام SameSite=Strict |

```typescript
// src/lib/csrf.ts:50-58
export async function storeCsrfToken(sessionId: string, token: string): Promise<void> {
  void sessionId;
  void token;
  // For now, this is a placeholder ⬅️
}
```

### عالي (High)

| الرمز | المشكلة | الدليل | التوصية |
|-------|---------|--------|---------|
| S02 | **لا يوجد إبطال للتوكن عند الخروج** | التوكن يبقى صالحاً 7 أيام | تطبيق blacklist بـ Redis أو توكنات قصيرة + refresh |
| S03 | **Rate limiting في الذاكرة** | `rateLimitStore = new Map()` سطر 18 | استخدام Redis (Upstash) للتوزيع |
| S04 | **توكن طويل الصلاحية (7 أيام)** | `setExpirationTime("7d")` سطر 37 | توكن access قصير (15 دقيقة) + refresh token |

### متوسط (Medium)

| الرمز | المشكلة | الدليل | التوصية |
|-------|---------|--------|---------|
| S05 | **كشف البريد عند التسجيل** | رسالة "البريد الإلكتروني مسجل مسبقاً" | رسالة عامة + إرسال بريد للمسجلين |
| S06 | **لا توجد متطلبات تعقيد كلمة المرور** | `password: z.string().min(8)` | إضافة أحرف كبيرة/صغيرة + أرقام + رموز |
| S07 | **قائمة المسؤولين مكتوبة في الكود** | `src/config/admin.ts:8-11` | نقلها لمتغيرات البيئة |

```typescript
// src/config/admin.ts:7-10
export const ADMIN_EMAILS = [
  "ahmadalwakai76@gmail.com",
  "kalmoh@gmail.com",
];
```

### منخفض (Low)

| الرمز | المشكلة | الدليل | التوصية |
|-------|---------|--------|---------|
| S08 | **JWT_SECRET احتياطي في التطوير** | `"dev-fallback-secret..."` سطر 19 | مقبول للتطوير، لكن يجب تحذير واضح |
| S09 | **لا يوجد قفل الحساب** | لا حد أقصى لمحاولات الفشل | تطبيق قفل بعد N محاولات |
| S10 | **user-data قابل للقراءة من JavaScript** | `httpOnly: false` | البيانات ليست سرية، لكن يمكن استغلالها |

---

## 10. ملفات غير مكتملة + خطة إصلاح قصيرة

| الملف | المشكلة | التأثير | الإصلاح |
|-------|---------|---------|---------|
| `src/lib/csrf.ts` | `storeCsrfToken()` و `retrieveCsrfToken()` فارغتان (placeholder) | حماية CSRF معطلة تماماً | 1. تخزين بـ Redis 2. أو استخدام cookie-based double-submit |
| `src/app/api/admin/auth/verify-code/route.ts` | لا يُنشئ `user-data` cookie | `getCurrentUserClient()` لا يعمل للمسؤولين | إضافة `response.cookies.set("user-data", ...)` |

### TODOs في الكود المصدري

| الملف | السطر | المحتوى | الأولوية |
|-------|-------|---------|----------|
| `src/app/api/teacher/lessons/route.ts` | 204 | `// TODO: Send email invitations in background` | منخفضة |
| `src/app/api/payments/route.ts` | 156 | `// TODO: Implement coupon validation` | متوسطة |
| `src/app/api/admin/stats/route.ts` | 66 | `trend: "+6%", // TODO: Calculate actual trend` | منخفضة |

---

## ملحق أ: مخطط Prisma للمستخدم

```prisma
// prisma/schema.prisma:20-50
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
  lastActiveAt  DateTime @default(now())
  ...
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

## ملحق ب: مواصفات الكوكيز

| الكوكي | الغرض | httpOnly | Secure | SameSite | Max-Age | Path |
|--------|-------|----------|--------|----------|---------|------|
| `auth-token` | JWT token | نعم | Production فقط | Lax/None | 604800 (7 أيام) | / |
| `user-data` | معلومات للعميل | لا | Production فقط | Lax/None | 604800 (7 أيام) | / |

## ملحق ج: محتوى JWT Token

```typescript
interface JWTPayload {
  userId: string;
  role: string;
  iat: number;  // وقت الإصدار
  exp: number;  // وقت الانتهاء (+7 أيام)
}
```

---

**نهاية التقرير**
