import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { getAdminFromRequest } from "@/lib/api-auth";
import { z } from "zod";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateReviewSchema = z.object({
  id: z.string(),
  status: z.enum(["approved", "rejected", "flagged"]).optional(),
  adminNotes: z.string().optional(),
});

// GET - List all reviews with filters
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const minRating = searchParams.get("minRating");
    const maxRating = searchParams.get("maxRating");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (courseId) where.courseId = courseId;
    if (minRating) where.rating = { gte: parseInt(minRating) };
    if (maxRating) where.rating = { ...((where.rating as object) || {}), lte: parseInt(maxRating) };

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
          course: { select: { id: true, title: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.review.count({ where }),
    ]);

    // Get stats
    const stats = await db.review.aggregate({
      _avg: { rating: true },
      _count: { id: true },
    });

    const ratingDistribution = await db.review.groupBy({
      by: ["rating"],
      _count: { id: true },
    });

    return NextResponse.json({
      ok: true,
      data: {
        reviews,
        stats: {
          total: stats._count.id,
          averageRating: stats._avg.rating?.toFixed(1) || "0",
          distribution: ratingDistribution.reduce<Record<number, number>>((acc, r) => {
            acc[r.rating] = r._count.id;
            return acc;
          }, {}),
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { ok: false, error: "فشل في تحميل التقييمات" },
      { status: 500 }
    );
  }
}

// PUT - Moderate a review (approve, reject, flag)
export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateReviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { id, status, adminNotes } = validation.data;

    const existing = await db.review.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "التقييم غير موجود" },
        { status: 404 }
      );
    }

    // Map status to the appropriate audit action
    const actionMap: Record<string, "REVIEW_APPROVE" | "REVIEW_REJECT" | "REVIEW_FLAG"> = {
      approved: "REVIEW_APPROVE",
      rejected: "REVIEW_REJECT",
      flagged: "REVIEW_FLAG",
    };

    await logAudit({
      actorUserId: admin.id,
      action: status ? actionMap[status] : "REVIEW_FLAG",
      entityType: "REVIEW",
      entityId: id,
      metadata: { status, adminNotes, rating: existing.rating },
    });

    return NextResponse.json({
      ok: true,
      data: { id, status, message: "تم تحديث حالة التقييم" },
    });
  } catch (error) {
    console.error("Error moderating review:", error);
    return NextResponse.json(
      { ok: false, error: "فشل في تحديث التقييم" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a review
export async function DELETE(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "معرف التقييم مطلوب" },
        { status: 400 }
      );
    }

    const existing = await db.review.findUnique({
      where: { id },
      include: { user: { select: { name: true } }, course: { select: { title: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "التقييم غير موجود" },
        { status: 404 }
      );
    }

    await db.review.delete({ where: { id } });

    await logAudit({
      actorUserId: admin.id,
      action: "REVIEW_DELETE",
      entityType: "REVIEW",
      entityId: id,
      metadata: {
        userName: existing.user.name,
        courseTitle: existing.course.title,
        rating: existing.rating,
      },
    });

    return NextResponse.json({ ok: true, data: { deleted: true } });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { ok: false, error: "فشل في حذف التقييم" },
      { status: 500 }
    );
  }
}
