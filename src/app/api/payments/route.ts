import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CreatePaymentSchema } from "@/lib/validations";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { allCourses } from "@/content/courses.ar";
import { sendEmail } from "@/lib/email/resend";
import { getPaymentConfirmationTemplate } from "@/lib/email/templates";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Create a new payment (checkout)
export async function POST(request: NextRequest) {
  return withRateLimit(request, RATE_LIMITS.payment, async () => {
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
    if (!db.payment) {
      return NextResponse.json(
        { ok: false, error: "قاعدة البيانات غير متوفرة حالياً" },
        { status: 503 }
      );
    }

    const { courseId, paymentMethod, couponCode, customerName, customerEmail, customerPhone } = result.data;

    // First try to find course in database by ID or slug
    let dbCourse = await db.course.findFirst({
      where: {
        OR: [
          { id: courseId },
          { slug: courseId },
        ],
      },
    }).catch(() => null);

    // If not in database, check static course data and create it
    const staticCourse = allCourses.find(c => c.id === courseId || c.slug === courseId);
    
    if (!dbCourse && !staticCourse) {
      return NextResponse.json(
        { ok: false, error: "الدورة غير موجودة" },
        { status: 404 }
      );
    }

    // If course exists only in static data, create it in database
    if (!dbCourse && staticCourse) {
      // First, ensure we have a system instructor for auto-created courses
      let systemInstructor = await db.user.findFirst({
        where: { role: "INSTRUCTOR" },
      });
      
      if (!systemInstructor) {
        // Create a system instructor if none exists
        systemInstructor = await db.user.create({
          data: {
            email: "instructor@tibyan.com",
            name: "معهد تبيان",
            password: "",
            role: "INSTRUCTOR",
            status: "ACTIVE",
          },
        });
      }

      dbCourse = await db.course.create({
        data: {
          title: staticCourse.name,
          slug: staticCourse.slug,
          description: staticCourse.description,
          price: staticCourse.price,
          duration: staticCourse.totalSessions * 60, // Convert sessions to minutes
          level: "BEGINNER",
          status: "PUBLISHED",
          instructorId: systemInstructor.id,
        },
      });
    }

    // Use database course info
    const courseTitle = dbCourse!.title;
    const coursePrice = dbCourse!.price;
    const courseCurrency = "EUR"; // Default currency

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
          courseId: dbCourse!.id,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { ok: false, error: "أنت مسجل في هذه الدورة بالفعل" },
        { status: 400 }
      );
    }

    // Check for existing pending payment for this course
    const existingPayment = await db.payment.findFirst({
      where: {
        userId: user.id,
        courseId: dbCourse!.id,
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
    const amount = coursePrice;
    const discountAmount = 0;

    // TODO: Implement coupon validation
    // if (couponCode) { ... }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        userId: user.id,
        courseId: dbCourse!.id,
        amount,
        discountAmount,
        couponCode,
        paymentMethod: paymentMethod || "cash",
        customerName,
        customerEmail,
        customerPhone,
        status: "PENDING",
      },
    });

    // Send confirmation email
    try {
      const emailHtml = getPaymentConfirmationTemplate({
        name: customerName,
        courseTitle: courseTitle,
        amount: amount,
        currency: courseCurrency,
        paymentId: payment.id,
      });

      await sendEmail({
        to: customerEmail,
        subject: `تأكيد التسجيل - ${courseTitle}`,
        html: emailHtml,
      });
    } catch (emailError) {
      // Log but don't fail the request if email fails
      console.error("Failed to send confirmation email:", emailError);
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          paymentId: payment.id,
          amount: payment.amount,
          currency: courseCurrency,
          courseTitle: courseTitle,
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
  });
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
