# نظام البريد الإلكتروني - Tibyan Email System

## نظرة عامة

يستخدم Tibyan خدمة [Resend](https://resend.com) لإرسال رسائل البريد الإلكتروني التفاعلية.

## المتغيرات البيئية المطلوبة

أضف هذه المتغيرات إلى ملف `.env`:

```env
# Resend API Key
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# عنوان البريد المرسل (اختياري، الافتراضي: noreply@tibyan.com)
FROM_EMAIL=noreply@yourdomain.com

# رابط التطبيق (مطلوب لروابط التحقق)
NEXT_PUBLIC_APP_URL=https://tibyan.com
```

## أنواع الرسائل

### 1. تأكيد البريد الإلكتروني للطلاب
- **API**: `POST /api/auth/register`
- **القالب**: `getVerificationEmailTemplate`
- **صلاحية الرابط**: 24 ساعة
- **الغرض**: التحقق من صحة البريد الإلكتروني عند التسجيل

### 2. تأكيد طلب المعلمين
- **API**: `POST /api/instructors/apply`
- **القالب**: `getTeacherConfirmationEmailTemplate`
- **صلاحية الرابط**: 48 ساعة
- **الغرض**: تأكيد استلام طلب التوظيف

### 3. إعادة تعيين كلمة المرور
- **API**: `POST /api/auth/forgot-password`
- **القالب**: `getPasswordResetEmailTemplate`
- **صلاحية الرابط**: ساعة واحدة
- **الغرض**: السماح للمستخدم بإعادة تعيين كلمة المرور

### 4. رسالة الترحيب
- **يُرسل بعد**: التحقق من البريد الإلكتروني
- **القالب**: `getWelcomeEmailTemplate`
- **الغرض**: الترحيب بالمستخدم الجديد

## API Routes

### `/api/auth/register` - POST
إنشاء حساب جديد وإرسال رابط التحقق.

```typescript
// Request Body
{
  name: string;    // الاسم الكامل (min: 2)
  email: string;   // البريد الإلكتروني
  password: string; // كلمة المرور (min: 8)
}

// Response
{
  ok: boolean;
  data?: { message: string; userId: string; };
  error?: string;
}
```

### `/api/auth/login` - POST
تسجيل الدخول للمستخدم المُفعَّل.

```typescript
// Request Body
{
  email: string;
  password: string;
}

// Response
{
  ok: boolean;
  data?: { user: User; message: string; };
  error?: string;
}
```

### `/api/auth/verify-email` - POST
التحقق من البريد الإلكتروني باستخدام الرابط المُرسل.

```typescript
// Request Body
{
  token: string;
}

// Response
{
  ok: boolean;
  data?: { message: string; };
  error?: string;
}
```

### `/api/auth/forgot-password` - POST
طلب رابط إعادة تعيين كلمة المرور.

```typescript
// Request Body
{
  email: string;
}

// Response
{
  ok: boolean;
  data?: { message: string; };
  error?: string;
}
```

### `/api/auth/reset-password` - POST
تعيين كلمة مرور جديدة.

```typescript
// Request Body
{
  token: string;
  password: string;
}

// Response
{
  ok: boolean;
  data?: { message: string; };
  error?: string;
}
```

### `/api/auth/resend-verification` - POST
إعادة إرسال رابط التحقق.

```typescript
// Request Body
{
  email: string;
}

// Response
{
  ok: boolean;
  data?: { message: string; };
  error?: string;
}
```

## الصفحات

| الصفحة | الغرض |
|--------|-------|
| `/auth/register` | تسجيل حساب جديد |
| `/auth/login` | تسجيل الدخول |
| `/auth/verify` | التحقق من البريد الإلكتروني |
| `/auth/forgot-password` | طلب استعادة كلمة المرور |
| `/auth/reset-password` | تعيين كلمة مرور جديدة |

## نموذج قاعدة البيانات

### VerificationToken

```prisma
model VerificationToken {
  id        String       @id @default(cuid())
  token     String       @unique  // hashed token
  purpose   TokenPurpose
  userId    String
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime     @default(now())
  
  user      User         @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum TokenPurpose {
  EMAIL_VERIFICATION
  PASSWORD_RESET
  TEACHER_CONFIRMATION
}
```

## الأمان

1. **تجزئة الرموز**: يتم تخزين الرموز مُجزَّأة (SHA-256) في قاعدة البيانات
2. **الاستخدام الواحد**: يُحدَّث حقل `usedAt` عند استخدام الرمز
3. **انتهاء الصلاحية**: لكل نوع رمز فترة صلاحية محددة
4. **إلغاء الرموز القديمة**: عند إنشاء رمز جديد، تُلغى الرموز السابقة

## تشغيل الترحيل

بعد تحديث الـ schema، شغّل:

```bash
npx prisma migrate dev --name add_verification_tokens
npx prisma generate --no-engine
```

## التطوير المحلي

للاختبار بدون إرسال بريد فعلي:
1. لا تُعيّن `RESEND_API_KEY`
2. ستظهر رسائل في console بدلاً من الإرسال الفعلي

## إعداد Resend

1. أنشئ حساباً في [resend.com](https://resend.com)
2. أضف نطاقك وتحقق منه
3. أنشئ API key
4. أضف المفتاح إلى `.env`
