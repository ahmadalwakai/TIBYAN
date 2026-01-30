import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UpdatePaymentStatusSchema } from "@/lib/validations";

const DB_UNAVAILABLE = NextResponse.json(
  { ok: false, error: "قاعدة البيانات غير متوفرة" },
  { status: 503 }
);

// Get payment details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db.payment) return DB_UNAVAILABLE;

    const { id } = await params;

    const payment = await db.payment.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            price: true,
            instructor: {
              select: { name: true },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { ok: false, error: "الدفعة غير موجودة" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: payment });
  } catch (error) {
    console.error("Get payment error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}

// Update payment status (admin or webhook)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db.payment) return DB_UNAVAILABLE;

    const { id } = await params;
    const body = await request.json();

    const result = UpdatePaymentStatusSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const payment = await db.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      return NextResponse.json(
        { ok: false, error: "الدفعة غير موجودة" },
        { status: 404 }
      );
    }

    // Update payment
    const updatedPayment = await db.payment.update({
      where: { id },
      data: {
        status: result.data.status,
        transactionId: result.data.transactionId,
        notes: result.data.notes,
        paidAt: result.data.status === "COMPLETED" ? new Date() : payment.paidAt,
      },
    });

    // If payment completed, create enrollment
    if (result.data.status === "COMPLETED" && payment.status !== "COMPLETED") {
      // Check if enrollment already exists
      const existingEnrollment = await db.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: payment.userId,
            courseId: payment.courseId,
          },
        },
      });

      if (!existingEnrollment) {
        await db.enrollment.create({
          data: {
            userId: payment.userId,
            courseId: payment.courseId,
            status: "ACTIVE",
          },
        });
      }

      // Update user status to active if pending
      await db.user.update({
        where: { id: payment.userId },
        data: { status: "ACTIVE" },
      });
    }

    return NextResponse.json({ ok: true, data: updatedPayment });
  } catch (error) {
    console.error("Update payment error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
