import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

// Force Node.js runtime for Prisma
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Escape HTML special characters to prevent XSS in email templates
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const MemberRegisterSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  bio: z.string().max(500, "النبذة يجب أن لا تتجاوز 500 حرف").optional(),
});

export async function POST(request: Request) {
  return withRateLimit(request, RATE_LIMITS.auth, async () => {
    try {
      const body = await request.json();
    
      // Validate input
      const result = MemberRegisterSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          { ok: false, error: result.error.issues[0].message },
          { status: 400 }
        );
      }
    
      const { name, email, password, bio } = result.data;
      const normalizedEmail = email.trim().toLowerCase();
    
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          email: {
            equals: normalizedEmail,
            mode: "insensitive",
          },
        },
      });
    
      if (existingUser) {
        return NextResponse.json(
          { ok: false, error: "البريد الإلكتروني مسجل مسبقاً" },
          { status: 400 }
        );
      }
    
      // Hash password
      const hashedPassword = await hash(password, 12);
    
      // Create member user
      const user = await prisma.user.create({
        data: {
          name,
          email: normalizedEmail,
          password: hashedPassword,
          role: "MEMBER",
          status: "ACTIVE",
          emailVerified: false,
          bio: bio || null,
        },
      });

      if (process.env.NODE_ENV === "development") {
        console.log("[MemberRegister] Created user:", {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
        });

        const verifyUser = await prisma.user.findFirst({
          where: {
            email: {
              equals: normalizedEmail,
              mode: "insensitive",
            },
          },
          select: { id: true, email: true, role: true },
        });

        console.log("[MemberRegister] Verified insert:", verifyUser);
      }

      // Notify admins about new member signup
      try {
        // Get admin users from User table
        const admins = await prisma.user.findMany({
          where: { role: "ADMIN" },
          select: { email: true, name: true },
        });

        if (admins.length > 0) {
          const { sendEmail } = await import("@/lib/email/resend");
          const signupDate = new Date().toLocaleString("ar-SA", {
            dateStyle: "full",
            timeStyle: "short",
            timeZone: "Asia/Riyadh",
          });

          for (const admin of admins) {
            await sendEmail({
              to: admin.email,
              subject: `عضو جديد انضم إلى تبيان - ${name}`,
              html: `
                <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #0B1F3A 0%, #1a365d 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
                    <h1 style="color: #00FF2A; margin: 0; font-size: 28px;">عضو جديد في تبيان</h1>
                  </div>
                  <div style="background: #ffffff; padding: 30px; border-radius: 0 0 16px 16px; border: 1px solid #e5e7eb; border-top: none;">
                    <p style="color: #374151; font-size: 16px; line-height: 1.8;">مرحباً ${escapeHtml(admin.name)}،</p>
                    <p style="color: #374151; font-size: 16px; line-height: 1.8;">انضم عضو جديد إلى منصة تبيان:</p>
                    
                    <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; border-right: 4px solid #00FF2A;">
                      <p style="margin: 8px 0; color: #374151;"><strong>الاسم:</strong> ${escapeHtml(name)}</p>
                      <p style="margin: 8px 0; color: #374151;"><strong>البريد:</strong> ${escapeHtml(email)}</p>
                      <p style="margin: 8px 0; color: #374151;"><strong>تاريخ التسجيل:</strong> ${signupDate}</p>
                      ${bio ? `<p style="margin: 8px 0; color: #374151;"><strong>النبذة:</strong> ${escapeHtml(bio)}</p>` : ""}
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                      يمكنك إدارة الأعضاء من لوحة التحكم.
                    </p>
                  </div>
                </div>
              `,
            });
          }
        }
      } catch (emailError) {
        console.error("[MemberRegister] Admin notification error:", emailError);
      }
    
      // Send verification email to member
      try {
        const { createVerificationToken } = await import("@/lib/auth/tokens");
        const { sendEmail } = await import("@/lib/email/resend");
        const { getVerificationEmailTemplate } = await import("@/lib/email/templates");
      
        const tokenResult = await createVerificationToken(user.id, "EMAIL_VERIFICATION");
      
        if (tokenResult.ok && tokenResult.token) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.ti-by-an.com";
          const verificationUrl = `${baseUrl}/auth/verify?token=${tokenResult.token}`;
        
          const emailHtml = getVerificationEmailTemplate({
            name: user.name,
            verificationUrl,
          });
        
          await sendEmail({
            to: user.email,
            subject: "تأكيد بريدك الإلكتروني - تبيان",
            html: emailHtml,
          });
        }
      } catch (emailError) {
        console.error("[MemberRegister] Email verification error:", emailError);
      }
    
      return NextResponse.json({
        ok: true,
        data: {
          message: "تم إنشاء حسابك كعضو بنجاح! يمكنك تسجيل الدخول الآن.",
          userId: user.id,
        },
      });
    } catch (error) {
      console.error("[MemberRegister] Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json(
        { ok: false, error: `حدث خطأ في التسجيل: ${errorMessage}` },
        { status: 500 }
      );
    }
  });
}
