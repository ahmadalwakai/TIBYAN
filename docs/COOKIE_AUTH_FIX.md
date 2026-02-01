# Cookie Authentication Fix - January 2025

## Problem

After successful login, authentication cookies (`auth-token` and `user-data`) were not being sent with subsequent API requests, causing users to be redirected back to the login page immediately after logging in.

## Root Cause

The Fetch API in modern browsers **does not send cookies by default** with requests, even for same-origin requests. The `credentials` option must be explicitly set to `"include"` for cookies to be included in requests.

### Symptoms

1. Login API returns 200 OK and sets cookies
2. User is redirected to `/member` (or other protected page)
3. Client-side `fetch("/api/auth/me")` returns 401 Unauthorized
4. Server logs show: `[Auth/Me] Raw cookie header: (none)`
5. User is redirected back to login

## Solution

### 1. Added `credentials: "include"` to All Fetch Calls

All fetch requests that require authentication now explicitly include credentials:

```typescript
// Before (BROKEN)
const res = await fetch("/api/auth/me");

// After (FIXED)
const res = await fetch("/api/auth/me", {
  credentials: "include",
});
```

### 2. Changed Client-Side Navigation to Hard Redirect

The login flow now uses `window.location.href` instead of `router.push()` to ensure cookies are properly available after login:

```typescript
// Before (BROKEN - cookies not immediately available)
router.push(finalRedirect);
router.refresh();

// After (FIXED - forces full page reload with cookies)
window.location.href = finalRedirect;
```

**Why this matters**: Next.js App Router's client-side navigation (`router.push()`) doesn't wait for cookies to be fully stored before rendering the next page. Using `window.location.href` forces a full page reload, ensuring the browser has processed and stored all Set-Cookie headers before making subsequent requests.

### 3. Created API Client Utility

Created `/src/lib/api-client.ts` with helper functions that automatically include credentials:

```typescript
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from "@/lib/api-client";

// Automatically includes credentials
const response = await apiGet<UserData>("/api/auth/me");
const response = await apiPost("/api/social/posts", postData);
```

### 4. Added Debug Logging

Added logging to both server and client to diagnose cookie issues:

```typescript
// Server: /api/auth/login
console.log("[Login] Cookies set:", { authTokenLength, secure, sameSite });

// Client: login page
console.log("[Login Client] Cookies after login:", document.cookie);
```

Debug endpoint created: `GET /api/auth/debug-cookies` (dev only)

### 3. Files Modified

#### Authentication Pages
- `/src/app/auth/login/page.tsx` - **Changed `router.push()` → `window.location.href`**
- `/src/app/auth/admin-login/page.tsx` - **Changed `router.push()` → `window.location.href`**
- `/src/app/auth/register/page.tsx` - Added `credentials: "include"`
- `/src/app/auth/member-signup/page.tsx` - Added `credentials: "include"`
- `/src/app/auth/forgot-password/page.tsx` - Added `credentials: "include"`
- `/src/app/auth/reset-password/page.tsx` - Added `credentials: "include"`
- `/src/app/auth/verify/page.tsx` - Added `credentials: "include"`

#### Protected Pages  
- `/src/app/member/page.tsx` - Member dashboard
- `/src/app/social/create/page.tsx` - Create post (simple)
- `/src/app/social/create/edit/page.tsx` - **NEW: Advanced Post Editor**
- `/src/app/teacher-room/page.tsx` - Teacher room
- `/src/app/teacher-room/meeting/[id]/page.tsx` - Meeting room
- `/src/app/teacher/lessons/page.tsx` - Teacher lessons
- `/src/app/teacher/lessons/[id]/page.tsx` - Lesson detail
- `/src/app/student/lessons/page.tsx` - Student lessons
- `/src/app/student/lessons/[id]/page.tsx` - Student lesson detail

## Best Practices Going Forward

### 1. Always Use API Client Helpers

```typescript
// Preferred
import { apiGet } from "@/lib/api-client";
const response = await apiGet("/api/auth/me");

// Avoid raw fetch for authenticated requests
```

### 2. For Raw Fetch, Always Include Credentials

```typescript
fetch("/api/endpoint", {
  method: "POST",
  credentials: "include", // ← REQUIRED
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
```

### 3. Cookie Configuration (Server-Side)

The server-side cookie configuration is already correct:

```typescript
response.cookies.set("auth-token", token, {
  httpOnly: true,              // Prevent XSS
  secure: isProduction,        // HTTPS only in production
  sameSite: "lax",            // CSRF protection
  maxAge: 60 * 60 * 24 * 7,   // 7 days
  path: "/",                   // Available site-wide
});
```

## Testing

### Manual Testing Steps

1. **Clear browser cookies**: Open DevTools → Application → Cookies → Delete all
2. **Login**: Navigate to `http://localhost:3000/auth/login`
3. **Check browser console**: Look for `[Login Client] Cookies after login:` - should show auth-token
4. **Verify cookies stored**: Open `http://localhost:3000/api/auth/debug-cookies` - should show `hasAuthToken: true`
5. **Navigate to protected page**: Go to `/member` - should NOT redirect to login
6. **Check server logs**: Should see cookies in `[Auth/Me]` logs, not "(none)"

### Expected Behavior After Fix

1. ✅ User can log in successfully
2. ✅ Hard page redirect occurs (full reload with URL change)
3. ✅ Cookies persist across page navigation
4. ✅ Protected API routes receive auth cookies
5. ✅ Users remain logged in after browser refresh
6. ✅ No redirect loop (login → /member → login)
7. ✅ TypeScript build completes without errors

### Debug Endpoints (Development Only)

- `GET /api/auth/debug-cookies` - Inspect cookie state
- `GET /api/auth/me` - Validate authentication (check logs)

## Related Files

- `/src/lib/api-client.ts` - New API client utility
- `/src/lib/auth-client.ts` - Client-side auth helpers
- `/src/app/api/auth/me/route.ts` - User validation endpoint
- `/src/app/api/auth/login/route.ts` - Login endpoint

## Technical Details

### Why `credentials: "include"`?

The Fetch API has three credential modes:

1. **`omit`** - Never send cookies (even same-origin)
2. **`same-origin`** (default) - Send cookies for same-origin, but **only if cookies were set by the same page**
3. **`include`** - Always send cookies (recommended for cookie-based auth)

Since our login happens on `/auth/login` but authentication checks happen on `/api/auth/me` and other pages, we need `"include"` to ensure cookies set by the login response are sent with all subsequent requests.

### Browser Security

Modern browsers enforce these security policies:

- **SameSite=lax**: Cookies sent on top-level navigation and same-origin requests
- **httpOnly**: JavaScript cannot access cookie (protects against XSS)
- **secure**: Cookie only sent over HTTPS in production

Our implementation respects all these security best practices while ensuring cookies work correctly.

## Migration Note

If you encounter `fetch()` calls without `credentials: "include"` in the future, they should be updated using this pattern or replaced with the API client helpers from `/src/lib/api-client.ts`.
