# 📚 دليل المصادقة والكوكيز - فهرس كامل

## 🎯 الملفات الموجودة

### 🔴 إذا كنت تواجه مشكلة 403/405 على POST

**اقرأ أولاً:** [FIX_403_POST_BLOCKING.md](FIX_403_POST_BLOCKING.md)

```
المشكلة: curl -X POST https://ti-by-an.com/api/auth/login → 403/405
الحل: تعديل إعدادات Nginx / Apache / Cloudflare / WAF
الوقت: 10-30 دقيقة
```

---

### 🟡 إذا كنت تواجه مشكلة في الكوكيز

**اقرأ:** [COOKIE_AUTH_TROUBLESHOOTING.md](COOKIE_AUTH_TROUBLESHOOTING.md)

```
المشكلة: الكوكيز لا تُحفظ حتى بعد تسجيل الدخول
السبب: SameSite أو Secure settings غير صحيحة
الحل: منطق بيئة التطوير vs الإنتاج
```

**التحديثات:**
- ✅ SameSite=Lax (localhost)
- ✅ SameSite=None; Secure (production)
- ✅ `credentials: "include"` في جميع fetch calls
- ✅ `window.location.href` بعد تسجيل الدخول

---

### 🟢 دليل شامل للنشر والتصحيح

**اقرأ:** [DEPLOYMENT_AND_DEBUGGING_GUIDE.md](DEPLOYMENT_AND_DEBUGGING_GUIDE.md)

```
يحتوي على:
├─ تشخيص شامل للمشاكل
├─ حلول لـ Nginx / Apache / Cloudflare / Vercel
├─ أمثلة على ملفات التكوين الكاملة
├─ خطوات الاختبار محلياً والإنتاج
├─ جدول تشخيصي سريع
└─ قائمة فحص النشر
```

---

## 📋 ملخص الحالة الكاملة

### ✅ ما تم إصلاحه في الكود

| العنصر | الحالة | التفاصيل |
|-------|--------|---------|
| credentials: "include" | ✅ | 79+ طلب API |
| window.location.href | ✅ | post-login redirect |
| SameSite=Lax (dev) | ✅ | http://localhost |
| SameSite=None (prod) | ✅ | https://ti-by-an.com |
| Secure flag | ✅ | environment-specific |

### ⚠️ ما يحتاج إلى تصحيح على الخادم

| المشكلة | الحالة | الحل |
|--------|--------|------|
| 403/405 على POST | ❌ | تعديل Nginx/Cloudflare |
| WAF يحظر requests | ❌ | تعطيل WAF rules |
| Proxy لا يمرر POST | ❌ | تحديث proxy_pass |

---

## 🚀 خطوات البدء السريعة

### 1️⃣ اختبر محلياً

```bash
npm run dev
# في terminal آخر
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmad66wakaa@gmail.com","password":"11223344"}' -v

# المتوقع: 303 See Other مع Set-Cookie headers
```

### 2️⃣ إذا واجهت 403/405

اتبع: [FIX_403_POST_BLOCKING.md](FIX_403_POST_BLOCKING.md)
- [ ] تشخيص المشكلة
- [ ] تحديد نوع الخادم
- [ ] تطبيق الحل المناسب
- [ ] اختبار بعد الإصلاح

### 3️⃣ إذا كانت الكوكيز لا تُحفظ

اتبع: [COOKIE_AUTH_TROUBLESHOOTING.md](COOKIE_AUTH_TROUBLESHOOTING.md)
- [ ] التحقق من Response Headers
- [ ] التحقق من DevTools
- [ ] التحقق من SameSite settings

### 4️⃣ نشر وتشغيل في الإنتاج

اتبع: [DEPLOYMENT_AND_DEBUGGING_GUIDE.md](DEPLOYMENT_AND_DEBUGGING_GUIDE.md)

---

## 🔍 تشخيص سريع (1 دقيقة)

```bash
# اختبر POST محلياً
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{}' -v

# النتيجة تخبرك بالحالة:
# ✅ 2xx/3xx → الكود يعمل
# ❌ 403/405 → مشكلة الخادم
```

---

## 📞 معلومات الملفات

### FIX_403_POST_BLOCKING.md
```
├─ تشخيص سريع
├─ حل Nginx
├─ حل Cloudflare
├─ حل Apache
├─ حل Vercel
├─ حل WAF/ModSecurity
├─ اختبار شامل
└─ قائمة فحص الإصلاح
```

### COOKIE_AUTH_TROUBLESHOOTING.md
```
├─ شرح جذري للمشكلة
├─ localhost testing
├─ production testing
├─ إعدادات خادم
├─ استكشاف أخطاء
└─ مراجع OWASP/MDN
```

### DEPLOYMENT_AND_DEBUGGING_GUIDE.md
```
├─ تشخيص مفصل لـ 403/405
├─ أمثلة Nginx كاملة
├─ أمثلة Apache كاملة
├─ أمثلة IIS كاملة
├─ CORS configuration
├─ جدول تشخيصي
└─ قائمة فحص النشر
```

---

## 💾 Git Commits

```
e4b0526 - docs: Add 403/405 POST blocking guide
21c2f6f - docs: Add deployment guide
9765688 - Fix cookie settings for dev vs production
75ae76f - Fix cookie security settings
f8a2370 - Fix remaining fetch calls in admin pages
207c82c - Fix cookie-auth issues
```

---

## ✨ الحالة النهائية

**الكود:** ✅ جاهز 100%
- جميع استدعاءات API مع credentials
- كوكيز مضبوطة صحيح
- توثيق شامل

**الخادم:** ⚠️ يحتاج فحص
- اختبر POST: `curl -X POST ...`
- إصلح Nginx/Cloudflare إذا لزم
- تأكد من عدم الحظر

---

## 🎓 معلومات تعليمية

### لماذا SameSite=Lax محلياً و None في الإنتاج؟

```
localhost (HTTP):
├─ Secure=false (HTTP غير آمن)
└─ SameSite=Lax (أفضل أمان مع HTTP)

production (HTTPS):
├─ Secure=true (HTTPS آمن)
└─ SameSite=None (يتطلب Secure)
```

### لماذا `credentials: "include"`؟

```
بدون credentials: "include":
→ المتصفح لا يرسل الكوكيز

مع credentials: "include":
→ المتصفح يرسل الكوكيز تلقائياً
```

### لماذا `window.location.href` وليس `router.push()`?

```
router.push():
→ تحديث SPA (لا ينتظر Set-Cookie)
→ الكوكيز قد لا تُحفظ

window.location.href:
→ full page reload (ينتظر Set-Cookie)
→ الكوكيز تُحفظ بنجاح
```

---

## 📌 نصائح مهمة

1. **ابدأ دائماً بـ localhost** - لاستبعاد مشاكل الخادم
2. **استخدم curl للاختبار** - أكثر دقة من المتصفح
3. **اقرأ السجلات** - تخبرك بكل شيء
4. **لا تخمّن** - اتبع خطوات التشخيص
5. **قدّم context** - عند طلب مساعدة

---

**آخر تحديث:** 2 فبراير 2026  
**الإصدار:** e4b0526
