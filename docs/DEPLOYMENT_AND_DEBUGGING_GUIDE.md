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

### المشكلة 1: حظر طلبات POST على الخادم (🔴 حرج)

**تشخيص المشكلة:**
```bash
# اختبر محلياً
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}' -v

# اختبر في الإنتاج
curl -X POST https://ti-by-an.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}' -v
```

**الأعراض المؤكدة للمشكلة:**
```
← Response Status: 403 Forbidden
← Message: "Only GET requests are allowed"
← OR: 405 Method Not Allowed
← OR: 500 Internal Server Error مع رسالة تحظر POST
```

**السبب المؤكد:**
- إعدادات Nginx/Apache/IIS تحظر POST على `/api/*`
- جدار حماية WAF (Cloudflare/ModSecurity) يمنع الطلب
- إعدادات الخادم لا تمرر طرق HTTP بشكل صحيح

---

## ✅ الحل: تصحيح إعدادات الخادم

### إذا كنت تستخدم Nginx

**الملف:** `/etc/nginx/sites-available/ti-by-an.com`

```nginx
# تأكد من أن الملف موجود وفعّال
server {
    listen 443 ssl http2;
    server_name ti-by-an.com www.ti-by-an.com;

    # SSL configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # ✅ المسار الأساسي - تمرير مباشر لـ Next.js
    location / {
        proxy_pass http://localhost:3000;
        
        # رؤوس HTTP الأساسية
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # ❌ لا تضع قيود خاصة على /api/ - تمرر للمسار الأساسي أعلاه
    # إذا أضفت location خاص ب /api/ تأكد من أنه لا يحظر POST
}

# ✅ إعادة التوجيه من HTTP إلى HTTPS
server {
    listen 80;
    server_name ti-by-an.com www.ti-by-an.com;
    return 301 https://$server_name$request_uri;
}
```

**التحقق من الإعدادات:**
```bash
# تحقق من صحة الإعدادات
sudo nginx -t

# إعادة تحميل Nginx
sudo systemctl reload nginx

# اختبر POST بعد الإصلاح
curl -X POST https://ti-by-an.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}' \
  -w "\nStatus: %{http_code}\n"
```

---

### إذا كنت تستخدم Cloudflare

**خطوات الحل:**

#### 1️⃣ تعطيل قواعس WAF
```
Dashboard → Security → WAF Rules
↓
Managed Rules: تعطيل جميع القواعس المشبوهة
تحديداً: أي قاعدة تحتوي على:
- "POST" و "api" معاً
- "method" و "restriction"
- "rate limit"
```

#### 2️⃣ التحقق من Bot Management
```
Security → Bot Management
↓
تأكد من أن:
- Bot Fight Mode = Off (مؤقتاً للاختبار)
- Super Bot Fight Mode = Off
```

#### 3️⃣ تعديل Firewall Rules
```
Rules → Firewall Rules
↓
ابحث عن قواعس تحتوي على:
- (cf.request.method eq "POST")
- (http.request.uri.path contains "/api")
↓
احذفها أو عطّلها
```

#### 4️⃣ اختبر بعد التعديلات
```bash
# اختبر POST مباشرة
curl -X POST https://ti-by-an.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}' \
  -v

# يجب أن تحصل على:
# - 200 أو 401 (بناءً على بيانات الاعتماد)
# - NOT 403 أو 405
```

---

### إذا كنت تستخدم Apache

**الملف:** `/etc/apache2/sites-available/ti-by-an.com.conf`

```apache
<VirtualHost *:443>
    ServerName ti-by-an.com
    ServerAlias www.ti-by-an.com

    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key

    # ✅ تفعيل mod_proxy
    <IfModule mod_proxy.c>
        ProxyPreserveHost On
        ProxyPass / http://localhost:3000/
        ProxyPassReverse / http://localhost:3000/
        
        # ✅ تمرير جميع الرؤوس
        <IfModule mod_proxy_http.c>
            SetEnv proxy-sendcl 1
            SetEnv proxy-sendchunked 1
        </IfModule>
    </IfModule>

    # ❌ لا تستخدم <Location /api> بقيود
    # دع mod_proxy يتعامل مع كل شيء

    # تسجيل الأخطاء (للتصحيح)
    ErrorLog ${APACHE_LOG_DIR}/ti-by-an.com-error.log
    CustomLog ${APACHE_LOG_DIR}/ti-by-an.com-access.log combined
</VirtualHost>

<VirtualHost *:80>
    ServerName ti-by-an.com
    ServerAlias www.ti-by-an.com
    Redirect / https://ti-by-an.com/
</VirtualHost>
```

**التحقق:**
```bash
# تحقق من صحة الإعدادات
sudo apache2ctl configtest

# إعادة تحميل Apache
sudo systemctl reload apache2
```

---

### إذا كنت تستخدم Vercel

**لا تحتاج لتعديل** - Vercel يدعم جميع طرق HTTP افتراضياً.

إذا كنت تستخدم Vercel Functions:
```
1. تأكد من أن الـ endpoint موجود في `api/` directory
2. الملف يجب أن يُسمى `login.ts` (ليس `login/route.ts`)
3. تأكد من export الدوال: `export default function handler()`
```

---

### إذا كنت تستخدم IIS (Windows Server)

**الملف:** `web.config`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <!-- تمرير جميع الطلبات إلى Node.js -->
                <rule name="Proxy to Node" stopProcessing="true">
                    <match url="^(.*)$" />
                    <conditions logicalGrouping="MatchAll">
                        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                        <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="http://localhost:3000/{R:1}" />
                </rule>
            </rules>
        </rewrite>
        
        <!-- تفعيل جميع طرق HTTP -->
        <handlers>
            <add name="Node" path="*" verb="*" modules="HttpPlatformHandler" 
                 scriptProcessor="C:\Program Files\nodejs\node.exe" 
                 resourceType="Unspecified" requireAccess="Script" />
        </handlers>
    </system.webServer>
</configuration>
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

## 🔍 تشخيص مشكلة حظر POST بالتفصيل

### خطوات التشخيص (بالترتيب)

#### الخطوة 1: اختبر محلياً أولاً

```bash
cd ~/tibyan

# ابدأ التطبيق
npm run dev

# في terminal منفصل، اختبر POST
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmad66wakaa@gmail.com","password":"11223344"}' \
  -v

# المتوقع: 303 See Other مع Set-Cookie headers
# غير المتوقع: 403 Forbidden أو 405
```

**إذا أعطى 403/405 محلياً:**
- المشكلة في الكود (قلّ من المحتمل جداً)
- تحقق من `src/app/api/auth/login/route.ts` يحتوي على `export async function POST`

#### الخطوة 2: اختبر على الخادم الإنتاجي

```bash
# اختبر الخادم من terminal محلي أو من سيرفر آخر
curl -X POST https://ti-by-an.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmad66wakaa@gmail.com","password":"11223344"}' \
  -v -w "\nHTTP Status: %{http_code}\n"
```

**النتائج المحتملة:**
```
✅ 303 See Other → كل شيء يعمل
✅ 200 OK → كل شيء يعمل (redirect من الكود)
✅ 401 Unauthorized → بيانات خاطئة، النطام يعمل
❌ 403 Forbidden → الخادم يحظر POST
❌ 405 Method Not Allowed → الخادم يحظر POST
❌ 500 Internal Server Error → WAF أو جدار حماية
```

#### الخطوة 3: فحص سجلات الخادم

**على Nginx:**
```bash
# اقرأ سجل الأخطاء
sudo tail -f /var/log/nginx/error.log

# ابحث عن رسائل مثل:
# "Permission denied"
# "Method not allowed"
# "Upstream timeout"
```

**على Apache:**
```bash
sudo tail -f /var/log/apache2/error.log
```

**على Vercel:**
```
Dashboard → Project → Deployments → Logs
```

#### الخطوة 4: اختبر الاتصال الخلفي

```bash
# من نفس الخادم الذي يعمل عليه Nginx/Apache
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmad66wakaa@gmail.com","password":"11223344"}' \
  -v

# إذا نجح محلياً لكن فشل عبر النطاق → مشكلة في البروكسي
```

---

### جدول تشخيصي سريع

| النتيجة | السبب | الحل |
|--------|------|------|
| 200/303 محلياً ✅ | كل شيء يعمل | لا توجد مشكلة |
| 200/303 محلياً لكن 403 على النطاق | مشكلة في البروكسي | راجع إعدادات Nginx/Cloudflare |
| 403 محلياً | مشكلة في الكود | فعّل export POST في route.ts |
| 405 على النطاق | WAF يحظر POST | عطّل WAF في Cloudflare |
| 500 مع رسالة | خطأ في الخادم | اقرأ السجلات |
| Connection refused | Next.js لا يعمل | ابدأ التطبيق: npm run dev |
| Timeout | اتصال بطيء | زد proxy_read_timeout في Nginx |

---

### أمثلة على رسائل الخطأ الشائخة وحلولها

#### ❌ "Only GET requests are allowed"
**المصدر:** جدار حماية WAF
**الحل:** عطّل WAF أو القاعدة المحددة

#### ❌ "403 Forbidden"
**المصدر:** mod_security أو جدار حماية
**الحل:** راجع `/var/log/modsec*` أو إعدادات WAF

#### ❌ "405 Method Not Allowed"
**المصدر:** Nginx/Apache config
**الحل:** تأكد من عدم وجود قيود على طرق HTTP

#### ❌ "Upstream timed out"
**المصدر:** Next.js بطيء أو متوقف
**الحل:** تحقق من حالة العملية، أعد تشغيلها

---

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
