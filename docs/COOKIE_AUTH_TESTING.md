# Cookie Authentication Testing Guide

## Quick Test

Run dev server and test authentication flow:

```bash
npm run dev
```

Then follow these steps:

## Test Steps

### 1. Clear Cookies
- Open browser DevTools (F12)
- Go to **Application** tab → **Cookies** → `http://localhost:3000`
- Right-click → **Clear** (or delete `auth-token` and `user-data`)

### 2. Login
- Navigate to: http://localhost:3000/auth/login
- Enter credentials: `ahmad66wakaa@gmail.com` / your password
- Click **تسجيل الدخول**

### 3. Check Browser Console
Look for this log:
```
[Login Client] Cookies after login: auth-token=...; user-data=...
```

✅ **Expected**: You should see both cookies listed
❌ **Problem**: If empty or missing, cookies weren't set

### 4. Check Page Redirect
- You should see a **full page reload** (not smooth navigation)
- URL changes to `/member` (or role-based dashboard)
- Page content shows your dashboard (not login form)

✅ **Expected**: You stay on dashboard page
❌ **Problem**: If redirected back to `/auth/login`, cookies aren't persisting

### 5. Verify Cookie State (Debug Endpoint)
Open new tab: http://localhost:3000/api/auth/debug-cookies

**Expected response:**
```json
{
  "ok": true,
  "data": {
    "cookieCount": 2,
    "cookies": [
      { "name": "auth-token", "valueLength": 150+ },
      { "name": "user-data", "valueLength": 80+ }
    ],
    "hasAuthToken": true,
    "hasUserData": true,
    "rawHeader": "auth-token=...; user-data=..."
  }
}
```

### 6. Check Server Logs
Look for these logs in terminal:

**During Login:**
```
[Login] Success: { email: '...', role: 'MEMBER' }
[Login] Cookies set: { authTokenLength: 150+, secure: false, sameSite: 'lax' }
POST /api/auth/login 200
```

**After Redirect to /member:**
```
[Auth/Me] All cookies received: [ 'auth-token', 'user-data' ]
[Auth/Me] Raw cookie header: auth-token=...; user-data=...
GET /api/auth/me 200
```

✅ **Expected**: Cookies shown in logs, 200 status
❌ **Problem**: If "(none)" or 401 status, cookies not being sent

## Common Issues

### Issue 1: "Raw cookie header: (none)"

**Symptoms:**
```
[Auth/Me] All cookies received: []
[Auth/Me] Raw cookie header: (none)
[Auth/Me] No auth-token cookie in store
GET /api/auth/me 401
```

**Causes:**
- Fetch calls missing `credentials: "include"`
- Using `router.push()` instead of `window.location.href`
- Browser blocking cookies (privacy settings)

**Fix:**
1. Verify [src/app/auth/login/page.tsx](../src/app/auth/login/page.tsx) uses `window.location.href`
2. Check [src/app/member/page.tsx](../src/app/member/page.tsx) fetch includes `credentials: "include"`
3. Disable browser tracking protection for localhost

### Issue 2: Cookies Set But Not Stored

**Symptoms:**
- Login succeeds
- Server logs show cookies being set
- Browser DevTools shows no cookies

**Causes:**
- `secure: true` with HTTP (localhost without HTTPS)
- Incorrect `sameSite` value
- Browser privacy mode (Incognito)

**Fix:**
1. Ensure `NODE_ENV=development` (not production)
2. Check [src/app/api/auth/login/route.ts](../src/app/api/auth/login/route.ts) has `secure: false` in dev
3. Use normal browser window (not Incognito)

### Issue 3: Redirect Loop

**Symptoms:**
- Login → /member → /auth/login → /member (repeats)

**Cause:**
- Client-side navigation not waiting for cookies

**Fix:**
- Already fixed: Using `window.location.href` instead of `router.push()`

## Advanced Debugging

### 1. Network Tab Inspection

Open DevTools → **Network** tab:

1. **Login Request** (`POST /api/auth/login`):
   - Check **Response Headers** for `Set-Cookie`:
     ```
     Set-Cookie: auth-token=eyJhb...; Path=/; Max-Age=604800; HttpOnly; SameSite=Lax
     Set-Cookie: user-data={"id":"..."}; Path=/; Max-Age=604800; SameSite=Lax
     ```

2. **Next Request** (`GET /member`):
   - Check **Request Headers** for `Cookie`:
     ```
     Cookie: auth-token=eyJhb...; user-data={"id":"..."}
     ```

3. **API Request** (`GET /api/auth/me`):
   - Check **Request Headers** for `Cookie` (should be present)

### 2. Browser Console Test

After login, run in console:
```javascript
// Should show both cookies
console.log(document.cookie);

// Test API call
fetch('/api/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(d => console.log('Auth check:', d));
// Expected: { ok: true, data: { id, email, name, role } }
```

### 3. Server-Side Cookie Check

Add temporary logging to any API route:
```typescript
export async function GET(request: NextRequest) {
  const rawCookie = request.headers.get("cookie");
  console.log("RAW COOKIE:", rawCookie);
  
  const cookieStore = await cookies();
  console.log("COOKIE STORE:", cookieStore.getAll());
  // ...
}
```

## Success Criteria

✅ All checks pass:
- [ ] Login succeeds with 200 status
- [ ] Browser console shows cookies after login
- [ ] Full page reload occurs (not SPA navigation)
- [ ] `/api/auth/debug-cookies` shows 2 cookies
- [ ] Server logs show cookies in `[Auth/Me]`
- [ ] `/member` page loads without redirect
- [ ] Browser DevTools Application tab shows cookies
- [ ] Page refresh keeps user logged in

## Quick Reset

If stuck in broken state:
```bash
# 1. Clear browser cookies (DevTools → Application → Clear)
# 2. Restart dev server
Ctrl+C
npm run dev
# 3. Hard refresh browser (Ctrl+Shift+R)
# 4. Try login again
```

## Contact

If issues persist after following this guide, check:
- [COOKIE_AUTH_FIX.md](./COOKIE_AUTH_FIX.md) - Complete technical documentation
- Server logs for error messages
- Browser console for JavaScript errors
- Network tab for failed requests
