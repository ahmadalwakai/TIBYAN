# Admin Email-Based Login - Quick Start Guide

## 🚀 Quick Access

**Admin Login Page:** http://localhost:3000/admin/login

**Authorized Admin Email:** `ahmadalwakai76@gmail.com`

## 📋 Step-by-Step Login Flow

### Step 1: Enter Email
1. Go to `/admin/login`
2. Enter: `ahmadalwakai76@gmail.com`
3. Click "إرسال الرمز" (Send Code)

### Step 2: Receive Code
- Check the email inbox (via Resend API)
- Code is valid for 10 minutes
- Example code: `123456`

### Step 3: Verify Code
1. Enter the 6-digit code in the form
2. Code field auto-formats (numbers only)
3. Click "تحقق من الرمز" (Verify Code)

### Step 4: Access Admin
- Automatically redirected to `/admin` dashboard
- JWT token stored in secure HTTP-only cookie
- Session expires in 7 days

## 🔧 API Endpoints

### Request Code
```bash
curl -X POST http://localhost:3000/api/admin/auth/request-code \
  -H "Content-Type: application/json" \
  -d '{"email": "ahmadalwakai76@gmail.com"}'
```

### Verify Code
```bash
curl -X POST http://localhost:3000/api/admin/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ahmadalwakai76@gmail.com",
    "code": "123456"
  }'
```

### Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout
```

## 🔐 Security Features

| Feature | Details |
|---------|---------|
| **Authentication** | Passwordless email-based |
| **Token Storage** | Secure HTTP-only cookies |
| **Token Type** | JWT (7-day expiry) |
| **Code Format** | 6-digit numeric |
| **Code Expiry** | 10 minutes |
| **Rate Limiting** | 1 request per 60 seconds |
| **Email Whitelist** | `src/config/admin.ts` |
| **Protection** | All `/admin/*` routes require token |

## 📧 Adding More Admin Emails

Edit `src/config/admin.ts`:

```typescript
export const ADMIN_EMAILS = [
  "ahmadalwakai76@gmail.com",
  "newemail@example.com",  // Add here
];
```

## 🗄️ Database

**Table:** `email_verification_codes` in `public` schema

**Columns:**
- `id` - Unique identifier
- `email` - Admin email address
- `code` - 6-digit verification code
- `purpose` - Type (ADMIN_LOGIN, EMAIL_VERIFICATION, PASSWORD_RESET)
- `expiresAt` - Expiration timestamp
- `usedAt` - When the code was used (if used)
- `createdAt` - Creation timestamp

**Indexes:**
- `email` - For quick email lookups
- `code` - For quick code lookups

## 🔄 Resend Email Configuration

**Required Environment Variable:**
```env
RESEND_API_KEY=your_resend_api_key
```

**Email Template:** Located in `src/lib/email/templates.ts`
- Function: `getAdminLoginCodeTemplate()`
- Language: Arabic/English
- Branding: Tibyan colors (purple gradient)

## 📱 UI Features

- **RTL Support:** Full Arabic right-to-left layout
- **Responsive:** Works on mobile, tablet, desktop
- **Countdown Timer:** Shows code expiration time
- **Change Email:** Option to go back and enter different email
- **Error Messages:** User-friendly Arabic error messages
- **Loading States:** Visual feedback during processing
- **Gradient Background:** Brand-themed purple gradient

## 🧪 Testing

### Test Request Code
```javascript
// Browser console
fetch('/api/admin/auth/request-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'ahmadalwakai76@gmail.com' })
}).then(r => r.json()).then(console.log)
```

### Test Verify Code
```javascript
// Browser console
fetch('/api/admin/auth/verify-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'ahmadalwakai76@gmail.com',
    code: '123456'  // Replace with actual code
  })
}).then(r => r.json()).then(console.log)
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Email not received | Check Resend API key in `.env` |
| Code expired | Request a new code (10-min timeout) |
| Rate limited (429) | Wait 60 seconds before requesting new code |
| Token invalid | Clear cookies and login again |
| Admin not authorized | Check email whitelist in `src/config/admin.ts` |

## 📝 Files Overview

**Core Files:**
- `src/app/admin/login/page.tsx` - Login UI (client-side)
- `src/app/api/admin/auth/request-code/route.ts` - Code request logic
- `src/app/api/admin/auth/verify-code/route.ts` - Code verification logic
- `src/config/admin.ts` - Admin configuration & whitelist
- `src/lib/email/templates.ts` - Email template

**Supporting Files:**
- `src/middleware.ts` - Route protection
- `src/lib/validations.ts` - Input validation schemas
- `prisma/schema.prisma` - Database schema
- `docs/ADMIN_EMAIL_AUTH.md` - Full documentation

## 🎯 Next Steps

1. ✅ Test the login flow at `/admin/login`
2. ✅ Verify code delivery via Resend
3. ✅ Access admin dashboard at `/admin`
4. ✅ Add more admin emails as needed
5. ✅ Review security audit logs

## 📞 Support

For issues or questions:
1. Check `docs/ADMIN_EMAIL_AUTH.md` for detailed docs
2. Review error messages in browser console
3. Check Resend API status and logs
4. Verify JWT_SECRET and RESEND_API_KEY in `.env`
