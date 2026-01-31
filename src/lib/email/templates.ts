interface EmailTemplateParams {
  name: string;
  verificationUrl: string;
}

/**
 * Email verification template for new student signups
 */
export function getVerificationEmailTemplate({ name, verificationUrl }: EmailTemplateParams): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تأكيد البريد الإلكتروني</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; direction: rtl;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7e22ce 0%, #6d28d9 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                تبيان | Tibyan
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">
                منصة تعليمية للقرآن والعلوم الإسلامية
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px;">
                أهلاً ${name}! 👋
              </h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 20px;">
                شكراً لتسجيلك في منصة تبيان. لإكمال عملية التسجيل، يرجى تأكيد بريدك الإلكتروني بالضغط على الزر أدناه.
              </p>
              
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${verificationUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #7e22ce 0%, #6d28d9 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(126, 34, 206, 0.4);">
                      تأكيد البريد الإلكتروني
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
                إذا لم تقم بإنشاء حساب في تبيان، يمكنك تجاهل هذا البريد.
              </p>
              
              <p style="color: #9ca3af; font-size: 12px; margin: 20px 0 0;">
                ⏰ هذا الرابط صالح لمدة 24 ساعة فقط.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                تبيان - منصة تعليمية إسلامية
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0;">
                © ${new Date().getFullYear()} جميع الحقوق محفوظة
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

interface PasswordResetParams {
  name: string;
  resetUrl: string;
}

/**
 * Password reset email template
 */
export function getPasswordResetEmailTemplate({ name, resetUrl }: PasswordResetParams): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إعادة تعيين كلمة المرور</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; direction: rtl;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7e22ce 0%, #6d28d9 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                تبيان | Tibyan
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">
                منصة تعليمية للقرآن والعلوم الإسلامية
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px;">
                طلب إعادة تعيين كلمة المرور 🔐
              </h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 20px;">
                مرحباً ${name}،<br><br>
                تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. اضغط على الزر أدناه لإنشاء كلمة مرور جديدة.
              </p>
              
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${resetUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);">
                      إعادة تعيين كلمة المرور
                    </a>
                  </td>
                </tr>
              </table>
              
              <div style="background-color: #fef3c7; border-right: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #92400e; font-size: 14px; margin: 0;">
                  ⚠️ <strong>تنبيه أمني:</strong> إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد. حسابك آمن.
                </p>
              </div>
              
              <p style="color: #9ca3af; font-size: 12px; margin: 20px 0 0;">
                ⏰ هذا الرابط صالح لمدة ساعة واحدة فقط.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                تبيان - منصة تعليمية إسلامية
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0;">
                © ${new Date().getFullYear()} جميع الحقوق محفوظة
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

interface TeacherConfirmationParams {
  name: string;
  verificationUrl: string;
  applicationId: string;
}

/**
 * Teacher application confirmation email template
 */
export function getTeacherConfirmationEmailTemplate({ name, verificationUrl, applicationId }: TeacherConfirmationParams): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تأكيد طلب التوظيف كمعلم</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; direction: rtl;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                تبيان | Tibyan
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">
                منصة تعليمية للقرآن والعلوم الإسلامية
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px;">
                شكراً لتقديم طلبك! 🎉
              </h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 20px;">
                مرحباً ${name}،<br><br>
                شكراً لاهتمامك بالانضمام إلى فريق المعلمين في منصة تبيان. لقد استلمنا طلبك بنجاح.
              </p>
              
              <div style="background-color: #f0fdf4; border-right: 4px solid #22c55e; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #166534; font-size: 14px; margin: 0;">
                  📋 <strong>رقم الطلب:</strong> ${applicationId}
                </p>
              </div>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 20px 0;">
                لتأكيد طلبك وبريدك الإلكتروني، يرجى الضغط على الزر أدناه:
              </p>
              
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${verificationUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4);">
                      تأكيد الطلب
                    </a>
                  </td>
                </tr>
              </table>
              
              <h3 style="color: #1f2937; margin: 30px 0 15px; font-size: 18px;">
                الخطوات التالية:
              </h3>
              <ol style="color: #4b5563; font-size: 14px; line-height: 2; padding-right: 20px; margin: 0;">
                <li>تأكيد بريدك الإلكتروني (هذه الخطوة)</li>
                <li>مراجعة طلبك من قبل فريق تبيان</li>
                <li>التواصل معك خلال 3-5 أيام عمل</li>
                <li>إجراء مقابلة عبر الإنترنت</li>
              </ol>
              
              <p style="color: #9ca3af; font-size: 12px; margin: 30px 0 0;">
                ⏰ هذا الرابط صالح لمدة 48 ساعة.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                تبيان - منصة تعليمية إسلامية
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0;">
                © ${new Date().getFullYear()} جميع الحقوق محفوظة
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Welcome email after successful verification
 */
export function getWelcomeEmailTemplate({ name }: { name: string }): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>مرحباً بك في تبيان!</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; direction: rtl;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7e22ce 0%, #6d28d9 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                🎉 مرحباً بك في تبيان!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px;">
                أهلاً ${name}!
              </h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 20px;">
                تم تفعيل حسابك بنجاح. أنت الآن جزء من مجتمع تبيان التعليمي!
              </p>
              
              <h3 style="color: #1f2937; margin: 30px 0 15px; font-size: 18px;">
                ابدأ رحلتك التعليمية:
              </h3>
              <ul style="color: #4b5563; font-size: 14px; line-height: 2; padding-right: 20px; margin: 0;">
                <li>📚 استكشف الدورات المتاحة</li>
                <li>👨‍🏫 تعرف على المعلمين</li>
                <li>🎯 سجل في البرامج التعليمية</li>
                <li>💬 انضم إلى المجتمع</li>
              </ul>
              
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://tibyan.com"}/courses" 
                       style="display: inline-block; background: linear-gradient(135deg, #7e22ce 0%, #6d28d9 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(126, 34, 206, 0.4);">
                      استكشف الدورات
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                تبيان - منصة تعليمية إسلامية
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0;">
                © ${new Date().getFullYear()} جميع الحقوق محفوظة
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}
interface AdminLoginCodeParams {
  code: string;
}

/**
 * Admin login verification code email template
 */
export function getAdminLoginCodeTemplate({ code }: AdminLoginCodeParams): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>رمز الدخول للمسؤول</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #ffffff; direction: rtl;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7e22ce 0%, #6d28d9 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                تبيان | Tibyan
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">
                لوحة تحكم المسؤول
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px; background-color: #ffffff;">
              <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px; text-align: center;">
                رمز الدخول
              </h2>
              
              <!-- Code Box - Clean white background, black text, easy to copy -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <div style="background-color: #ffffff; padding: 30px; border-radius: 12px; border: 2px solid #e5e7eb;">
                      <p style="color: #000000; font-size: 56px; margin: 0; font-weight: 700; letter-spacing: 12px; font-family: 'Courier New', monospace; user-select: all;">
                        ${code}
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 20px 0 0; text-align: center;">
                ⏰ صالح لمدة 10 دقائق
              </p>
              
              <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 20px 0 0; text-align: center;">
                إذا لم تطلب هذا الرمز، تجاهل هذا البريد.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} تبيان
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

interface PaymentConfirmationParams {
  name: string;
  courseTitle: string;
  amount: number;
  currency: string;
  paymentId: string;
}

/**
 * Payment confirmation email template (cash payment registration)
 */
export function getPaymentConfirmationTemplate({ name, courseTitle, amount, currency, paymentId }: PaymentConfirmationParams): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تأكيد التسجيل</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; direction: rtl;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                تبيان | Tibyan
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">
                تأكيد التسجيل ✓
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px;">
                مرحباً ${name}! 🎉
              </h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 20px;">
                تم تسجيل طلبك بنجاح. شكراً لاختيارك معهد تبيان للتعليم الإسلامي.
              </p>
              
              <!-- Order Details -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <h3 style="color: #1f2937; margin: 0 0 16px; font-size: 18px;">تفاصيل الطلب</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">البرنامج:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: left;">${courseTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">المبلغ:</td>
                    <td style="padding: 8px 0; color: #059669; font-size: 14px; font-weight: 700; text-align: left;">${amount} ${currency}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">رقم الطلب:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-family: monospace; text-align: left;">${paymentId.substring(0, 12)}...</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">طريقة الدفع:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: left;">💵 نقدًا</td>
                  </tr>
                </table>
              </div>
              
              <!-- Next Steps -->
              <div style="background-color: #fef3c7; border-right: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #92400e; margin: 0 0 8px; font-size: 16px;">📋 الخطوات التالية:</h4>
                <ol style="color: #92400e; font-size: 14px; margin: 0; padding-right: 20px; line-height: 1.8;">
                  <li>سيتواصل معك أحد مندوبينا خلال 24-48 ساعة</li>
                  <li>يتم تحديد موعد لاستلام المبلغ نقدًا</li>
                  <li>بعد التأكيد، يتم تفعيل حسابك تلقائيًا</li>
                </ol>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
                للاستفسارات، يمكنك التواصل معنا عبر البريد الإلكتروني أو الهاتف.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                تبيان - منصة تعليمية إسلامية
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0;">
                © ${new Date().getFullYear()} جميع الحقوق محفوظة
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}