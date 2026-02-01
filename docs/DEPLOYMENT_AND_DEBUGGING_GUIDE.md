# دليل النشر والتصحيح الشامل لمشاكل المصادقة

## الحالة الحالية (2 فبراير 2026)

تم إصلاح المشاكل التالية:

✅ **جميع استدعاءات API تتضمن `credentials: "include"`**
- 79+ طلب fetch عبر التطبيق
- شمل جميع صفحات admin, teacher, student

✅ **إعادة التوجيه بعد تسجيل الدخول تستخدم `window.location.href`**
- لضمان معالجة Set-Cookie قبل تحميل الصفحة الجديدة

✅ **إعدادات الكوكيز مختلفة حسب البيئة**
```
التطوير (localhost:3000 - HTTP):
├─ SameSite=Lax
└─ Secure=false

الإنتاج (ti-by-an.com - HTTPS):
├─ SameSite=None
└─ Secure=true
```

---

## المشاكل المتبقية المحتملة

### المشكلة 1: حظر طلبات POST على الخادم

**الأعراض:**
```
curl -X POST https://ti-by-an.com/api/auth/login
→ 403 Forbidden: "Only GET requests are allowed"
```

**السبب:**
- إعدادات Nginx أو Cloudflare تحظر POST
- بروكسي الخادم لم يتم تكوينه بشكل صحيح

**الحل:**

**إذا كنت تستخدم Nginx:**
```nginx
# /etc/nginx/sites-available/ti-by-an.com
server {
    listen 443 ssl http2;
    server_name ti-by-an.com;

    # تأكد من أن /api/* يُمرر للخلف
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # تمرير جميع طرق HTTP
        proxy_method $request_method;
        
        # رؤوس مهمة للمصادقة
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        # إعادة توجيه الكوكيز
        proxy_cookie_path / /;
        proxy_cookie_domain localhost $host;
        
        # إعدادات الاتصال
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # تمرير أي مسارات أخرى لـ Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**إذا كنت تستخدم Cloudflare:**
```
1. اذهب إلى Cloudflare Dashboard
2. Rules → WAF Rules
3. تأكد من عدم وجود قاعدة تحظر POST على /api/*
4. Security → Settings → تأكد من أن Security Level = Low
5. اختبر:
   curl -X POST https://ti-by-an.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test"}'
```

---

### المشكلة 2: الكوكيز لا تُحفظ حتى بعد الإصلاحات

**الأعراض:**
- DevTools → Application → Cookies فارغة بعد التسجيل
- كل انضغاط على أي زر يعيد إلى صفحة تسجيل الدخول

**الحلول للتحقق:**

**1. تحقق من Response Headers:**
```
DevTools → Network → اختر /api/auth/login
Response Headers:
```
يجب أن تكون هناك:
```
set-cookie: auth-token=...; Path=/; Max-Age=604800; SameSite=Lax; HttpOnly
set-cookie: user-data=...; Path=/; Max-Age=604800; SameSite=Lax
```

في الإنتاج:
```
set-cookie: auth-token=...; Path=/; Max-Age=604800; SameSite=None; Secure; HttpOnly
set-cookie: user-data=...; Path=/; Max-Age=604800; SameSite=None; Secure
```

**2. تحقق من Request Headers للطلب التالي:**
```
DevTools → Network → اختر أي طلب /api/
Request Headers → Cookie: ...
```

يجب أن تشمل:
```
Cookie: auth-token=...; user-data=...
```

**3. اختبر مع curl:**
```bash
# حفظ الكوكيز في ملف
curl -X POST https://ti-by-an.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmad66wakaa@gmail.com","password":"11223344"}' \
  -c cookies.txt -v

# استخدم الكوكيز في طلب لاحق
curl https://ti-by-an.com/api/auth/me \
  -b cookies.txt -v
```

---

### المشكلة 3: Cross-Domain Cookies في الإنتاج

**الأعراض:**
- عندما يكون الـ API على نطاق مختلف (مثل api.ti-by-an.com)
- رسالة: "Third-party cookies are blocked"

**الحل:**

**الخيار 1: استخدم نفس النطاق (الأفضل)**
```nginx
# اجعل API على نفس النطاق
location /api/ {
    proxy_pass http://localhost:3000;
    # ... باقي الإعدادات
}
```

**الخيار 2: إذا كان النطاق مختلفاً**
```
1. تأكد من أن response يحتوي على:
   set-cookie: auth-token=...; SameSite=None; Secure

2. في المتصفح، السماح بـ Third-party Cookies:
   Chrome: Settings → Privacy → Third-party cookies → Allow
   Firefox: about:config → network.cookie.sameSite.laxByDefault = false

3. للتطبيق Web API الخاص بك:
   fetch("/api/...", {
     credentials: "include"  // مهم جداً
   })
```

---

### المشكلة 4: CORS Errors

**الأعراض:**
```
Access to XMLHttpRequest at 'https://api.example.com/auth/login'
from origin 'https://ti-by-an.com' has been blocked by CORS policy
```

**الحل:**

في `next.config.ts` أو `route.ts` من API:
```typescript
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // CORS headers
  response.headers.set("Access-Control-Allow-Origin", request.headers.get("origin") || "*");
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
  response.headers.set("Access-Control-Allow-Credentials", "true");

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 200, headers: response.headers });
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
```

---

## خطوات الاختبار الشاملة

### 1. اختبر محلياً أولاً

```bash
# ابدأ التطبيق
npm run dev

# في متصفح آخر
curl http://localhost:3000/auth/login
```

**التحقق:**
```
DevTools (F12):
├─ Application → Cookies: auth-token, user-data موجودة
├─ Network → auth/login: Response يحتوي على Set-Cookie
├─ Network → أي طلب API: Request يحتوي على Cookie header
└─ Console: لا رسائل خطأ CORS
```

### 2. اختبر في الإنتاج

```bash
# من command line
curl -X POST https://ti-by-an.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmad66wakaa@gmail.com","password":"11223344"}' \
  -L -v

# في المتصفح
1. افتح https://ti-by-an.com/auth/login
2. أدخل البيانات
3. DevTools (F12) → Network → انظر لـ 303 response مع Set-Cookie
4. يجب أن تنتقل إلى https://ti-by-an.com/member
```

### 3. تحقق من Request/Response Headers

**الطلب الناجح:**
```
→ Request:
POST /api/auth/login HTTP/1.1
Host: ti-by-an.com
Content-Type: application/json
Cookie: (لا توجد في الطلب الأول - طبيعي)

← Response:
HTTP/1.1 303 See Other
Location: /member
Set-Cookie: auth-token=...; Path=/; Max-Age=604800; SameSite=None; Secure; HttpOnly
Set-Cookie: user-data=...; Path=/; Max-Age=604800; SameSite=None; Secure
```

---

## قائمة فحص النشر

قبل نشر إلى الإنتاج، تأكد من:

- [ ] الكود يبني بدون أخطاء: `npm run build`
- [ ] التطبيق يعمل محلياً: `npm run dev`
- [ ] اختبار تسجيل الدخول محلياً نجح
- [ ] الكوكيز موجودة في DevTools
- [ ] إعدادات الخادم (Nginx/Cloudflare) صحيحة
- [ ] جميع طلبات POST تعود 200/303 وليس 403
- [ ] HTTPS مفعّل على الخادم
- [ ] نطاق الخادم يطابق نطاق الواجهة

**أوامر الفحص:**
```bash
# تحقق من Git
git log --oneline -5

# تجميع الإنتاج
npm run build

# اختبر محلياً
npm run dev

# أضف وأرسل التغييرات
git add -A
git commit -m "..."
git push origin master
```

---

## استكشاف الأخطاء السريع

| الخطأ | السبب المحتمل | الحل |
|------|-------------|------|
| 403 Forbidden | خادم يحظر POST | عدّل Nginx/Cloudflare |
| Cookies لا تُحفظ | Secure=true على HTTP | استخدم HTTPS أو قلل Secure=false |
| CORS error | نطاق مختلف | أضف CORS headers أو استخدم نفس النطاق |
| "Invalid token" | JWT expired أو توقيع خاطئ | تحقق من JWT_SECRET |
| Cookies مشفرة | httpOnly=true | طبيعي - لا يمكن الوصول من JavaScript |
| User not found | بيانات خاطئة | تحقق من البريد/كلمة المرور في DB |

---

## المراجع والموارد

- [MDN: HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [OWASP: Cookie Security](https://owasp.org/www-community/controls/Cookie_Security)
- [Nginx Proxy Configuration](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [Cloudflare Rules](https://developers.cloudflare.com/rules/)
- [Next.js Cookies API](https://nextjs.org/docs/app/api-reference/functions/cookies)

---

**آخر تحديث:** 2 فبراير 2026  
**الإصدار:** 9765688
