import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TeacherApplicationSchema } from "@/lib/validations";
import { sendEmail } from "@/lib/email/resend";
import { getTeacherConfirmationEmailTemplate } from "@/lib/email/templates";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = TeacherApplicationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { agreeTerms, ...applicationData } = result.data;

    // Check if application with same email already exists and is pending
    const existingApplication = await prisma.teacherApplication.findFirst({
      where: {
        email: applicationData.email,
        status: { in: ["PENDING", "UNDER_REVIEW"] },
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { ok: false, error: "لديك طلب قيد المراجعة بالفعل" },
        { status: 400 }
      );
    }

    // Create application
    const application = await prisma.teacherApplication.create({
      data: applicationData,
    });

    // Build confirmation URL (using application ID for tracking)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const verificationUrl = `${baseUrl}/instructors/apply/status?id=${application.id}`;

    // Send confirmation email
    const emailHtml = getTeacherConfirmationEmailTemplate({
      name: applicationData.fullName,
      verificationUrl,
      applicationId: application.id,
    });

    const emailResult = await sendEmail({
      to: applicationData.email,
      subject: "تأكيد طلب الانضمام كمعلم - تبيان",
      html: emailHtml,
    });

    if (!emailResult.ok) {
      console.error("[TeacherApplication] Failed to send confirmation email:", emailResult.error);
    }

    return NextResponse.json(
      { 
        ok: true, 
        data: { 
          id: application.id,
          message: "تم إرسال طلبك بنجاح. تفقد بريدك الإلكتروني للتأكيد." 
        } 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Teacher application error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في الخادم. يرجى المحاولة مرة أخرى." },
      { status: 500 }
    );
  }
}
