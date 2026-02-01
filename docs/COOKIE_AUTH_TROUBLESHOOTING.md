# تشخيص ومعالجة مشاكل المصادقة عبر الكوكيز

## المشكلة الموصوفة
عند محاولة تسجيل الدخول:
- الحقول تُمسح بعد الضغط على زر "تسجيل الدخول"
- لا ينتقل المستخدم إلى لوحة العضو
- لا تظهر رسالة خطأ واضحة
- قد تظهر رسالة في المتصفح: "حظر ملفات تعريف الارتباط للطرف الثالث"

## السبب الجذري
الكوكيز الخاصة بالمصادقة لا تُخزّن في المتصفح لأحد الأسباب التالية:

### 1. **فرق النطاق (Domain Mismatch)**
- إذا كانت الواجهة (`ti-by-an.com`) والـ API على نطاقات مختلفة
- المتصفح يعتبر الكوكيز "طرفاً ثالثاً" وتُحظر بشكل افتراضي
- مثال: الواجهة على `ti-by-an.com` والـ API على `api.example.com`

### 2. **إعدادات الكوكيز غير صحيحة**
- `SameSite=Lax` لا يسمح بإرسال الكوكيز في الطلبات عبر النطاقات
- `Secure` غير مفعّل في بيئة الإنتاج
- `HttpOnly` قد يسبب مشاكل في بعض الحالات

### 3. **عدم نشر التحديثات**
- إذا عدّلت الكود ولم تُعد نشر التطبيق
- سيستمر المتصفح في استخدام النسخة القديمة

## الحل المطبق

### التغييرات المجراة
تم تحديث جميع ملفات المصادقة لاستخدام:
```typescript
SameSite: "None"  // بدلاً من "Lax"
Secure: true      // دائماً مفعّل
```

**الملفات المعدّلة:**
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/auth/me/route.ts`
- `src/app/api/auth/establish/route.ts`
- `src/app/api/auth/dev-login/route.ts`
- `src/app/api/auth/test-cookie/route.ts`

### سبب الحل
- `SameSite=None; Secure` يسمح بإرسال الكوكيز عبر النطاقات المختلفة
- `Secure` مطلوب عند استخدام `SameSite=None` (معيار HTTPS)
- `HttpOnly` محفوظ لضمان الحماية من XSS

## خطوات التحقق المحلية (Localhost)

### 1. اختبار على بيئة محلية
```bash
npm run dev
```

ادخل إلى `http://localhost:3000/auth/login` واختبر التسجيل:
- **بيانات الاختبار:**
  - البريد: `ahmad66wakaa@gmail.com`
  - كلمة المرور: `11223344`

### 2. التحقق من الكوكيز في DevTools
```
المتصفح → DevTools (F12) → Application → Cookies
```

**ابحث عن:**
- `auth-token` ✅ يجب أن تكون موجودة
- `user-data` ✅ يجب أن تكون موجودة
- كلاهما يجب أن يكون `Secure` و`SameSite=None`

### 3. التحقق من Network Headers
```
DevTools → Network → اختر طلب /api/auth/login
Response Headers:
```
**ابحث عن:**
```
Set-Cookie: auth-token=...; SameSite=None; Secure; HttpOnly
Set-Cookie: user-data=...; SameSite=None; Secure
```

## خطوات النشر إلى البيئة الحية

### 1. التأكد من نشر التحديثات
```bash
# تحقق من آخر commit
git log --oneline -5

# يجب أن ترى:
# 75ae76f Fix cookie security settings...
# f8a2370 Fix remaining fetch calls in admin pages...
```

### 2. بناء الإصدار الإنتاجي
```bash
npm run build
```

### 3. نشر على Vercel (إن كنت تستخدمها)
```bash
vercel deploy --prod
```

أو إذا كنت تستخدم خادماً آخر:
```bash
npm run start
```

### 4. التحقق من البيئة الحية
```
1. افتح: https://ti-by-an.com/auth/login
2. سجّل الدخول باستخدام:
   - البريد: ahmad66wakaa@gmail.com
   - كلمة المرور: 11223344
3. يجب أن تنتقل إلى: https://ti-by-an.com/member
```

### 5. اختبار الكوكيز في البيئة الحية
```
DevTools (F12) → Network → اختر أي طلب API
Headers:
```

**تحقق من:**
```
Request Headers:
- Cookie: auth-token=...; user-data=...

Response Headers:
- Set-Cookie: auth-token=...; SameSite=None; Secure; HttpOnly
```

## تكوين خادم الإنتاج

### إذا كنت تستخدم Nginx
```nginx
# تأكد من أن API تخدم من نفس الدومين
location /api/ {
  proxy_pass http://localhost:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

### إذا كنت تستخدم Apache
```apache
<ProxyMatch "/api/.*">
  ProxyPassReverse / http://localhost:3000/
  Header set X-Forwarded-Proto "https"
</ProxyMatch>
```

### إذا كنت تستخدم Vercel
لا تحتاج لتكوين إضافي - Vercel يدعم `SameSite=None` افتراضياً.

## علامات النجاح ✅

بعد تطبيق الحل، يجب أن ترى:

1. **تسجيل الدخول يعمل بنجاح**
   - الحقول لا تُمسح وحسب، بل تنتقل إلى `/member`
   - تظهر رسالة "تم تسجيل الدخول بنجاح!"

2. **الكوكيز موجودة**
   - `auth-token` موجود في الكوكيز
   - `user-data` موجود في الكوكيز

3. **الطلبات تتضمن الكوكيز**
   - جميع طلبات `/api/` تتضمن `Cookie` header
   - تحتوي على `auth-token` و `user-data`

4. **لا رسائل تحذير**
   - لا تظهر رسالة "حظر ملفات تعريف الارتباط للطرف الثالث"

## استكشاف الأخطاء

### المشكلة: رسالة خطأ "حظر ملفات تعريف الارتباط للطرف الثالث"

**السبب:** الكوكيز تُعتبر "طرفاً ثالثاً"

**الحل:**
```
1. تحقق من النطاق: هل الواجهة والـ API على نفس الدومين؟
2. إذا كانت مختلفة، تأكد من SameSite=None; Secure
3. قد تحتاج لتغيير إعدادات المتصفح (اختبر على Chrome و Firefox)
```

### المشكلة: تسجيل الدخول يعمل محلياً لكن لا يعمل في الإنتاج

**السبب:** فرق بين بيئة التطوير والإنتاج

**الحل:**
```bash
# تأكد من نشر النسخة الجديدة
git log --oneline -1  # يجب أن تكون 75ae76f

# أعد بناء وإعادة نشر
npm run build
vercel deploy --prod  # أو الأمر المناسب لخادمك
```

### المشكلة: الكوكيز موجودة لكن الطلبات لا تتضمنها

**السبب:** عدم استخدام `credentials: "include"` في fetch

**التحقق:**
```
DevTools → Network → اختر /api/... 
Request Headers → ابحث عن Cookie
```

**الحل:**
```typescript
fetch("/api/...", {
  credentials: "include",  // ✅ مهم جداً
  // ... خيارات أخرى
});
```

جميع الملفات تم تحديثها بالفعل.

## المراجع

- [MDN: SameSite Cookie Attribute](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [OWASP: SameSite Cookie](https://owasp.org/www-community/attacks/csrf)
- [Next.js Cookies Documentation](https://nextjs.org/docs/app/api-reference/functions/cookies)

---

**آخر تحديث:** 2026-02-01
**الإصدار:** v75ae76f
