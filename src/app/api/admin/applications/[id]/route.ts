import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UpdateApplicationStatusSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/api-auth";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DB_UNAVAILABLE_RESPONSE = NextResponse.json(
  { ok: false, error: "قاعدة البيانات غير متوفرة" },
  { status: 503 }
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    if (!db.teacherApplication) return DB_UNAVAILABLE_RESPONSE;
    
    const { id } = await params;
    
    const application = await db.teacherApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json(
        { ok: false, error: "الطلب غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: application });
  } catch (error) {
    console.error("Get application error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    if (!db.teacherApplication) return DB_UNAVAILABLE_RESPONSE;
    
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const result = UpdateApplicationStatusSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const application = await db.teacherApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json(
        { ok: false, error: "الطلب غير موجود" },
        { status: 404 }
      );
    }

    const updated = await db.teacherApplication.update({
      where: { id },
      data: {
        status: result.data.status,
        reviewNotes: result.data.reviewNotes,
        reviewedAt: new Date(),
        // TODO: Add reviewedBy from authenticated admin user
      },
    });

    // If approved, create instructor user account
    if (result.data.status === "APPROVED") {
      const existingUser = await db.user.findUnique({
        where: { email: application.email },
      });

      if (!existingUser) {
        // Create a new instructor account with a temporary password
        await db.user.create({
          data: {
            email: application.email,
            name: application.fullName,
            password: "", // User will need to set password via forgot password flow
            role: "INSTRUCTOR",
            status: "PENDING", // Pending until they set their password
          },
        });
      } else {
        // Update existing user role to instructor
        await db.user.update({
          where: { email: application.email },
          data: { role: "INSTRUCTOR" },
        });
      }
    }

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    console.error("Update application error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db.teacherApplication) return DB_UNAVAILABLE_RESPONSE;
    
    const { id } = await params;

    const application = await db.teacherApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json(
        { ok: false, error: "الطلب غير موجود" },
        { status: 404 }
      );
    }

    await db.teacherApplication.delete({ where: { id } });

    return NextResponse.json({ ok: true, data: { message: "تم حذف الطلب" } });
  } catch (error) {
    console.error("Delete application error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
