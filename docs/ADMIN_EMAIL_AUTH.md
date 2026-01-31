# Admin Email-Based Authentication Implementation

## Overview
Implemented a passwordless, email-based authentication system for admin users using verification codes sent via the Resend API.

## Features Implemented

### 1. **Email Verification Code System**
- New `EmailVerificationCode` model in Prisma schema
- 6-digit numeric verification codes
- 10-minute code expiration (configurable)
- One-time use codes with tracking
- Rate limiting on code requests (1 per 60 seconds)

### 2. **Admin Email Whitelist**
- Centralized admin email configuration in `src/config/admin.ts`
- Authorized admin: `ahmadalwakai76@gmail.com`
- Easily extensible for adding more admin emails
- Security feature: non-authorized emails won't reveal admin status

### 3. **API Endpoints**

#### POST `/api/admin/auth/request-code`
Initiates the login flow by requesting a verification code.

**Request:**
```json
{
  "email": "ahmadalwakai76@gmail.com"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "message": "تم إرسال رمز التحقق إلى بريدك الإلكتروني",
    "expiresIn": 10
  }
}
```

#### POST `/api/admin/auth/verify-code`
Verifies the code and creates an authenticated session.

**Request:**
```json
{
  "email": "ahmadalwakai76@gmail.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "ahmadalwakai76@gmail.com",
      "name": "المسؤول",
      "role": "ADMIN"
    },
    "token": "jwt-token"
  }
}
```

Sets secure HTTP-only cookie: `auth-token`

#### POST `/api/auth/logout`
Clears authentication cookies.

### 4. **Admin Login UI**
- **Route:** `/admin/login`
- **Features:**
  - Two-step form: Email entry → Code verification
  - Real-time validation
  - Countdown timer showing code expiration
  - Error handling and user feedback
  - RTL support for Arabic
  - Responsive design with gradient background
  - Change email option

### 5. **Email Template**
- Professional Arabic/English bilingual template
- Displays 6-digit verification code prominently
- Security warning about not sharing the code
- Expiration information (10 minutes)
- Branded with Tibyan logo and colors

### 6. **Authentication Middleware**
- Updated `src/middleware.ts` to:
  - Allow unauthenticated access to `/admin/login`
  - Protect all other `/admin/*` routes
  - Redirect to login if token missing
  - Check JWT token validity

### 7. **Database Schema**

**New Table: `email_verification_codes`**
```sql
CREATE TABLE email_verification_codes (
  id CUID PRIMARY KEY,
  email VARCHAR NOT NULL,
  code VARCHAR UNIQUE NOT NULL,
  purpose VerificationCodePurpose DEFAULT 'ADMIN_LOGIN',
  expiresAt TIMESTAMP NOT NULL,
  usedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  
  INDEX(email),
  INDEX(code)
);
```

### 8. **Validation Schemas (Zod)**
Added to `src/lib/validations.ts`:
- `AdminLoginRequestSchema` - Validates email format
- `AdminVerifyCodeSchema` - Validates email and 6-digit code

### 9. **Configuration**
- **Verification Code Length:** 6 digits
- **Code Expiry:** 10 minutes
- **Max Attempts:** 5
- **Rate Limit:** 1 code request per 60 seconds
- **Admin Emails:** `ahmadalwakai76@gmail.com`

## Security Features

✅ **JWT Token-based:** Secure token generation and verification
✅ **HTTP-Only Cookies:** Tokens stored in secure, non-accessible cookies
✅ **Rate Limiting:** Prevents code request abuse
✅ **One-Time Use:** Codes marked as used after verification
✅ **Expiration:** All codes expire after 10 minutes
✅ **Email Whitelist:** Only authorized admins can access the system
✅ **No Password Exposure:** Passwordless authentication
✅ **Secure Headers:** Proper CORS and security headers
✅ **Input Validation:** Zod validation on all endpoints

## Database Migration
Run to apply schema changes:
```bash
npx prisma migrate dev --name add_email_verification_codes
```

Migration created: `20260131085641_add_email_verification_codes`

## Environment Variables Required
```env
RESEND_API_KEY=your_resend_api_key
JWT_SECRET=your_jwt_secret_min_32_chars
```

## Files Modified/Created

### Created:
- `src/app/admin/login/page.tsx` - Admin login UI
- `src/app/api/admin/auth/request-code/route.ts` - Request code endpoint
- `src/app/api/admin/auth/verify-code/route.ts` - Verify code endpoint
- `src/app/api/auth/logout/route.ts` - Logout endpoint
- `src/config/admin.ts` - Admin configuration & whitelist
- `src/lib/auth/admin-auth.ts` - Client-side auth hook
- `prisma/migrations/20260131085641_add_email_verification_codes/` - DB migration

### Modified:
- `prisma/schema.prisma` - Added EmailVerificationCode model
- `src/lib/email/templates.ts` - Added getAdminLoginCodeTemplate()
- `src/lib/validations.ts` - Added admin auth schemas
- `src/middleware.ts` - Updated to protect admin routes

## Testing the Flow

1. **Navigate to admin login:**
   ```
   http://localhost:3000/admin/login
   ```

2. **Enter admin email:**
   ```
   ahmadalwakai76@gmail.com
   ```

3. **Check Resend email inbox** for verification code

4. **Enter 6-digit code** to verify and access admin dashboard

5. **Logout endpoint:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/logout
   ```

## Error Handling

- ✅ Invalid email format
- ✅ Non-authorized email (doesn't reveal admin status)
- ✅ Expired code
- ✅ Invalid/incorrect code
- ✅ Code already used
- ✅ Rate limit exceeded (429 status)
- ✅ Email sending failures

## Future Enhancements

- [ ] Multi-factor authentication (SMS OTP backup)
- [ ] Code delivery via SMS alternative
- [ ] Email change verification
- [ ] Admin audit logs for login attempts
- [ ] IP-based security checks
- [ ] Geographic login alerts
- [ ] Session management and activity tracking
- [ ] Support for multiple admin levels/permissions

## Build Status
✅ Project builds successfully with no TypeScript errors
✅ All routes configured and middleware active
✅ Resend email service integrated
✅ Database migrations applied
