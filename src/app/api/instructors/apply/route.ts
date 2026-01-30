import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TeacherApplicationSchema } from "@/lib/validations";

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

    // Check if database is available
    if (!db.teacherApplication) {
      return NextResponse.json(
        { ok: false, error: "قاعدة البيانات غير متوفرة حالياً. يرجى المحاولة لاحقاً." },
        { status: 503 }
      );
    }

    // Check if application with same email already exists and is pending
    const existingApplication = await db.teacherApplication.findFirst({
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
    const application = await db.teacherApplication.create({
      data: applicationData,
    });

    return NextResponse.json(
      { 
        ok: true, 
        data: { 
          id: application.id,
          message: "تم إرسال طلبك بنجاح. سنتواصل معك قريباً." 
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
