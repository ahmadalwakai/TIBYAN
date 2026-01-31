import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { getAdminFromRequest } from "@/lib/api-auth";
import { z } from "zod";

const createNotificationSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  content: z.string().min(1, "المحتوى مطلوب"),
  channel: z.enum(["EMAIL", "IN_APP", "SMS", "PUSH"]).default("EMAIL"),
  targetType: z.enum(["ALL_USERS", "STUDENTS", "TEACHERS", "SPECIFIC_USERS"]).default("ALL_USERS"),
  scheduledAt: z.string().optional(),
});

const updateNotificationSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  channel: z.enum(["EMAIL", "IN_APP", "SMS", "PUSH"]).optional(),
  targetType: z.enum(["ALL_USERS", "STUDENTS", "TEACHERS", "SPECIFIC_USERS"]).optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "SENDING", "SENT", "FAILED"]).optional(),
  scheduledAt: z.string().optional(),
});

// GET - List notifications with filters
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const channel = searchParams.get("channel");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (channel) where.channel = channel;

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.notification.count({ where }),
    ]);

    // Get stats
    const stats = await db.notification.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const statsMap: Record<string, number> = {};
    stats.forEach((s: { status: string; _count: { id: number } }) => {
      statsMap[s.status] = s._count.id;
    });

    return NextResponse.json({
      ok: true,
      data: {
        notifications,
        stats: {
          draft: statsMap.DRAFT || 0,
          scheduled: statsMap.SCHEDULED || 0,
          sent: statsMap.SENT || 0,
          failed: statsMap.FAILED || 0,
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
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { ok: false, error: "فشل في تحميل الإشعارات" },
      { status: 500 }
    );
  }
}

// POST - Create notification
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createNotificationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { title, content, channel, targetType, scheduledAt } = validation.data;

    const notification = await db.notification.create({
      data: {
        title,
        content,
        channel,
        targetType,
        status: scheduledAt ? "SCHEDULED" : "DRAFT",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        createdBy: admin.id,
      },
    });

    await logAudit({
      actorUserId: admin.id,
      action: "NOTIFICATION_CREATE",
      entityType: "NOTIFICATION",
      entityId: notification.id,
      metadata: { title, channel, targetType },
    });

    return NextResponse.json({ ok: true, data: notification }, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { ok: false, error: "فشل في إنشاء الإشعار" },
      { status: 500 }
    );
  }
}

// PUT - Update notification
export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateNotificationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { id, ...updateData } = validation.data;

    // Check if notification exists
    const existing = await db.notification.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "الإشعار غير موجود" },
        { status: 404 }
      );
    }

    // Prevent editing sent notifications
    if (existing.status === "SENT") {
      return NextResponse.json(
        { ok: false, error: "لا يمكن تعديل إشعار مُرسل" },
        { status: 400 }
      );
    }

    const processedData: Record<string, unknown> = { ...updateData };
    if (updateData.scheduledAt) {
      processedData.scheduledAt = new Date(updateData.scheduledAt);
    }

    const notification = await db.notification.update({
      where: { id },
      data: processedData,
    });

    await logAudit({
      actorUserId: admin.id,
      action: "NOTIFICATION_UPDATE",
      entityType: "NOTIFICATION",
      entityId: id,
      metadata: updateData,
    });

    return NextResponse.json({ ok: true, data: notification });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { ok: false, error: "فشل في تحديث الإشعار" },
      { status: 500 }
    );
  }
}

// DELETE - Delete notification
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
        { ok: false, error: "معرف الإشعار مطلوب" },
        { status: 400 }
      );
    }

    const existing = await db.notification.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "الإشعار غير موجود" },
        { status: 404 }
      );
    }

    await db.notification.delete({ where: { id } });

    await logAudit({
      actorUserId: admin.id,
      action: "NOTIFICATION_DELETE",
      entityType: "NOTIFICATION",
      entityId: id,
      metadata: { title: existing.title },
    });

    return NextResponse.json({ ok: true, data: { deleted: true } });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { ok: false, error: "فشل في حذف الإشعار" },
      { status: 500 }
    );
  }
}
