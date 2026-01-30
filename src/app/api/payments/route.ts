import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CreatePaymentSchema } from "@/lib/validations";

// Create a new payment (checkout)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = CreatePaymentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    // Check if database is available
    if (!db.payment || !db.course) {
      return NextResponse.json(
        { ok: false, error: "قاعدة البيانات غير متوفرة حالياً" },
        { status: 503 }
      );
    }

    const { courseId, paymentMethod, couponCode, customerName, customerEmail, customerPhone } = result.data;

    // Get the course
    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        { ok: false, error: "الدورة غير موجودة" },
        { status: 404 }
      );
    }

    if (course.status !== "PUBLISHED") {
      return NextResponse.json(
        { ok: false, error: "هذه الدورة غير متاحة للتسجيل حالياً" },
        { status: 400 }
      );
    }

    // Check if user exists by email, or create a guest user
    let user = await db.user.findUnique({
      where: { email: customerEmail },
    });

    if (!user) {
      // Create a new user account
      user = await db.user.create({
        data: {
          email: customerEmail,
          name: customerName,
          password: "", // User will need to set password
          role: "STUDENT",
          status: "PENDING",
        },
      });
    }

    // Check if already enrolled
    const existingEnrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { ok: false, error: "أنت مسجل في هذه الدورة بالفعل" },
        { status: 400 }
      );
    }

    // Check for existing pending payment
    const existingPayment = await db.payment.findFirst({
      where: {
        userId: user.id,
        courseId: course.id,
        status: "PENDING",
      },
    });

    if (existingPayment) {
      return NextResponse.json({
        ok: true,
        data: {
          paymentId: existingPayment.id,
          amount: existingPayment.amount,
          message: "لديك طلب دفع قائم بالفعل",
        },
      });
    }

    // Calculate amount (apply coupon if provided)
    let amount = course.price;
    let discountAmount = 0;

    // TODO: Implement coupon validation
    // if (couponCode) { ... }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        userId: user.id,
        courseId: course.id,
        amount,
        discountAmount,
        couponCode,
        paymentMethod: paymentMethod || "bank_transfer",
        customerName,
        customerEmail,
        customerPhone,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          paymentId: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          courseTitle: course.title,
          message: "تم إنشاء طلب الدفع. يرجى إتمام عملية الدفع.",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}

// Get all payments (for authenticated user)
export async function GET(request: NextRequest) {
  try {
    if (!db.payment) {
      return NextResponse.json({
        ok: true,
        data: { payments: [] },
      });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "البريد الإلكتروني مطلوب" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({
        ok: true,
        data: { payments: [] },
      });
    }

    const payments = await db.payment.findMany({
      where: { userId: user.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      data: { payments },
    });
  } catch (error) {
    console.error("Get payments error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
