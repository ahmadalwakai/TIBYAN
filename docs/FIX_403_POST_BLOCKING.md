# حل المشكلة: 403/405 على طلبات POST

## 🎯 المشكلة بالضبط

```
curl -X POST https://ti-by-an.com/api/auth/login
← 403 Forbidden: "Only GET requests are allowed"
← OR: 405 Method Not Allowed
```

**النقطة الأساسية:** 
- الكود يعمل بشكل صحيح ✅
- المشكلة في إعدادات الخادم/البروكسي ❌

---

## 🔍 التشخيص السريع

### 1. اختبر محلياً
```bash
# بدء التطبيق
npm run dev

# في terminal آخر، اختبر POST
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}' -v
```

**إذا نجح محلياً:** المشكلة **مؤكد** في الخادم/البروكسي

### 2. اختبر الاتصال المباشر للخلف
```bash
# من خادم الإنتاج مباشرة
ssh user@your-server.com

# اختبر الاتصال لـ Next.js محلياً
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}' -v
```

**إذا نجح:** المشكلة في البروكسي (Nginx/Apache/Cloudflare)

---

## ✅ الحل حسب نوع الخادم

### 🔧 Nginx

**المشكلة الشائعة:**
```nginx
# ❌ خطأ - يحظر POST
location /api/ {
    limit_except GET {
        deny all;
    }
    proxy_pass http://localhost:3000;
}
```

**الحل:**
```nginx
# ✅ صحيح - يمرر جميع الطرق
location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**خطوات الإصلاح:**
```bash
# 1. عدّل الملف
sudo nano /etc/nginx/sites-available/ti-by-an.com

# 2. تحقق من الصحة
sudo nginx -t

# 3. أعد التحميل
sudo systemctl reload nginx

# 4. اختبر
curl -X POST https://ti-by-an.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}' -v
```

---

### 🔧 Cloudflare WAF

**المشكلة الشائعة:**
- قاعدة تحظر "POST requests to /api/*"
- Bot Manager يحظر الطلب
- Rate Limiting قاسي جداً

**الحل:**
```
1. اذهب إلى: https://dash.cloudflare.com
2. اختر Domain: ti-by-an.com
3. اذهب إلى: Security → WAF
4. ابحث عن:
   - POST /api
   - Method Restriction
   - Rate Limiting
   - Bot Fight Mode
5. عطّل أو احذف القاعدة المطابقة
6. احفظ التغييرات
7. امسح الكاش: Caching → Purge Cache
```

**للتحقق:**
```bash
# اختبر مع تجاوز الكاش
curl -X POST https://ti-by-an.com/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Pragma: no-cache" \
  -d '{"email":"test@test.com","password":"test"}' -v

# ابحث في Response Headers عن:
# cf-ray: ... → رقم Ray ID
# cf-cache-status: BYPASS → الكاش معطّل
```

---

### 🔧 Apache

**المشكلة الشائعة:**
```apache
# ❌ خطأ
<Location /api>
    Deny from all
</Location>
```

**الحل:**
```apache
# ✅ صحيح
<IfModule mod_proxy.c>
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
</IfModule>
```

**خطوات الإصلاح:**
```bash
# 1. عدّل الملف
sudo nano /etc/apache2/sites-available/ti-by-an.com.conf

# 2. تفعيل mod_proxy (إن لم يكن مفعّلاً)
sudo a2enmod proxy
sudo a2enmod proxy_http

# 3. تحقق من الصحة
sudo apache2ctl configtest

# 4. أعد تحميل Apache
sudo systemctl reload apache2

# 5. اختبر
curl -X POST https://ti-by-an.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}' -v
```

---

### 🔧 Vercel

**Vercel يدعم جميع الطرق افتراضياً** - لا تحتاج لتعديل

إذا واجهت المشكلة على Vercel:
```
1. تأكد من أن الملف في:
   src/app/api/auth/login/route.ts

2. تأكد من وجود export:
   export async function POST(request: Request)

3. أعد نشر:
   git push origin main
   (Vercel ينشر تلقائياً)

4. تحقق من السجلات:
   Dashboard → Deployments → Logs
```

---

### 🔧 حجب من جدار الحماية (WAF/ModSecurity)

**علامات:**
```
- Response: 403
- Headers تحتوي على: X-Blocked-By-ModSecurity أو cf-ray
- السجلات تظهر: "Rule triggered" أو "Action: block"
```

**الحل:**
```bash
# تحقق من قواعس ModSecurity
sudo cat /var/log/modsec_debug.log | tail -50

# ابحث عن رسالة مثل:
# "[id "930110"] msg "HTTP Request Smuggling Attack"

# لتعطيل ModSecurity (مؤقتاً للاختبار):
sudo systemctl stop modsecurity
# أو تعديل القاعدة المشكلة
```

---

## 🧪 اختبار شامل بعد الإصلاح

```bash
#!/bin/bash

echo "=== Test 1: Basic GET ==="
curl -X GET https://ti-by-an.com/auth/login -v -w "\nStatus: %{http_code}\n"

echo ""
echo "=== Test 2: POST to /api/auth/login ==="
curl -X POST https://ti-by-an.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmad66wakaa@gmail.com","password":"11223344"}' \
  -v -w "\nStatus: %{http_code}\n"

echo ""
echo "=== Test 3: POST to other API endpoint ==="
curl -X POST https://ti-by-an.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test","role":"MEMBER"}' \
  -v -w "\nStatus: %{http_code}\n"

echo ""
echo "=== Test 4: GET to /api endpoint ==="
curl -X GET https://ti-by-an.com/api/auth/me \
  -H "Cookie: auth-token=test" \
  -v -w "\nStatus: %{http_code}\n"
```

**النتائج المتوقعة:**
```
Test 1: 200 OK (صفحة تسجيل الدخول)
Test 2: 303 See Other أو 401 (محاولة تسجيل دخول)
Test 3: 200/201 أو 400 (تسجيل حساب)
Test 4: 200 أو 401 (فحص المصادقة)

❌ أي 403 أو 405 = المشكلة لم تُحل
```

---

## 📋 قائمة فحص الإصلاح

- [ ] اختبار POST محلياً: نجح (200/303/401)
- [ ] اختبار POST على الخادم: نجح (200/303/401)
- [ ] عدم رؤية 403 أو 405 بعد الآن
- [ ] Nginx/Apache/Cloudflare معدّل بشكل صحيح
- [ ] سجلات الخادم تظهر requests ناجحة
- [ ] Next.js يستقبل الطلبات بشكل صحيح

---

## 🆘 إذا لم يعمل الحل

### الخطوة 1: جمّع معلومات التصحيح

```bash
# معلومات الخادم
curl -X POST https://ti-by-an.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{}' \
  -v 2>&1 > /tmp/debug.log

# السجلات
tail -100 /var/log/nginx/error.log > /tmp/nginx-error.log
tail -100 /var/log/nginx/access.log > /tmp/nginx-access.log

# إذا كان Cloudflare
curl -I https://ti-by-an.com/api/auth/login > /tmp/headers.log

# معلومات Next.js
ps aux | grep node > /tmp/processes.log
```

### الخطوة 2: تحقق من الأساسيات

- [ ] Next.js يعمل: `curl http://localhost:3000/` → 200
- [ ] PORT=3000 محدد بشكل صحيح
- [ ] البروكسي يشير إلى الإقدام `localhost:3000` أو IP صحيح
- [ ] SSL/TLS موجود على الخادم
- [ ] بدون أخطاء في سجلات Next.js

### الخطوة 3: اختبر بـ curl من موقع مختلف

```bash
# من جهاز مختلف تماماً (VPN أو 4G)
curl -X POST https://ti-by-an.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}' \
  -v

# للتأكد من أن ISP لا يحظر
```

---

## 📞 معلومات إضافية للدعم

إذا كنت تحتاج مساعدة:

**قدم هذه المعلومات:**
```
1. نوع الخادم: Nginx / Apache / Cloudflare / Vercel
2. نتيجة: curl -X POST https://ti-by-an.com/api/auth/login
3. السجل: tail -50 /var/log/nginx/error.log
4. الكود: cat /etc/nginx/sites-available/ti-by-an.com
5. عملية Node.js: ps aux | grep node
```

---

**آخر تحديث:** 2 فبراير 2026
