import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { getAdminFromRequest } from "@/lib/api-auth";
import { z } from "zod";

// Available permissions in the system
const AVAILABLE_PERMISSIONS = [
  // Users
  { key: "users.view", label: "عرض المستخدمين", category: "users" },
  { key: "users.create", label: "إنشاء مستخدم", category: "users" },
  { key: "users.edit", label: "تعديل مستخدم", category: "users" },
  { key: "users.delete", label: "حذف مستخدم", category: "users" },
  { key: "users.suspend", label: "تعليق مستخدم", category: "users" },
  
  // Courses
  { key: "courses.view", label: "عرض الدورات", category: "courses" },
  { key: "courses.create", label: "إنشاء دورة", category: "courses" },
  { key: "courses.edit", label: "تعديل دورة", category: "courses" },
  { key: "courses.delete", label: "حذف دورة", category: "courses" },
  { key: "courses.publish", label: "نشر دورة", category: "courses" },
  
  // Payments
  { key: "payments.view", label: "عرض المدفوعات", category: "payments" },
  { key: "payments.process", label: "معالجة المدفوعات", category: "payments" },
  { key: "payments.refund", label: "استرداد المدفوعات", category: "payments" },
  
  // Content
  { key: "content.review", label: "مراجعة المحتوى", category: "content" },
  { key: "content.approve", label: "اعتماد المحتوى", category: "content" },
  { key: "content.reject", label: "رفض المحتوى", category: "content" },
  
  // Reports
  { key: "reports.view", label: "عرض التقارير", category: "reports" },
  { key: "reports.export", label: "تصدير التقارير", category: "reports" },
  
  // Settings
  { key: "settings.view", label: "عرض الإعدادات", category: "settings" },
  { key: "settings.edit", label: "تعديل الإعدادات", category: "settings" },
  
  // Notifications
  { key: "notifications.view", label: "عرض الإشعارات", category: "notifications" },
  { key: "notifications.send", label: "إرسال إشعارات", category: "notifications" },
  
  // Audit
  { key: "audit.view", label: "عرض سجل التدقيق", category: "audit" },
  
  // Roles (meta permission)
  { key: "roles.manage", label: "إدارة الأدوار", category: "roles" },
];

// Default system roles
const DEFAULT_ROLES = [
  {
    name: "super_admin",
    nameAr: "👑 مدير عام",
    description: "صلاحيات كاملة على النظام",
    permissions: AVAILABLE_PERMISSIONS.map(p => p.key),
    isSystem: true,
  },
  {
    name: "content_reviewer",
    nameAr: "🔍 مراجع محتوى",
    description: "مراجعة واعتماد المحتوى",
    permissions: ["content.review", "content.approve", "content.reject", "courses.view"],
    isSystem: true,
  },
  {
    name: "community_moderator",
    nameAr: "👥 مشرف مجتمع",
    description: "مراقبة التعليقات والبلاغات",
    permissions: ["users.view", "users.suspend", "content.review"],
    isSystem: true,
  },
  {
    name: "accountant",
    nameAr: "💰 محاسب",
    description: "إدارة المدفوعات والتقارير المالية",
    permissions: ["payments.view", "payments.process", "reports.view", "reports.export"],
    isSystem: true,
  },
];

const createRoleSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب").regex(/^[a-z_]+$/, "الاسم يجب أن يكون باللاتينية"),
  nameAr: z.string().min(1, "الاسم العربي مطلوب"),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, "اختر صلاحية واحدة على الأقل"),
});

const updateRoleSchema = z.object({
  id: z.string(),
  nameAr: z.string().min(1).optional(),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

// GET - List roles and available permissions
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // Return available permissions
    if (action === "permissions") {
      return NextResponse.json({
        ok: true,
        data: AVAILABLE_PERMISSIONS,
      });
    }

    // Get roles from database
    let roles = await db.adminRole.findMany({
      orderBy: { createdAt: "asc" },
    });

    // Seed default roles if none exist
    if (roles.length === 0) {
      await Promise.all(
        DEFAULT_ROLES.map((role) =>
          db.adminRole.create({
            data: {
              name: role.name,
              nameAr: role.nameAr,
              description: role.description,
              permissions: role.permissions,
              isSystem: role.isSystem,
            },
          })
        )
      );
      roles = await db.adminRole.findMany({
        orderBy: { createdAt: "asc" },
      });
    }

    return NextResponse.json({
      ok: true,
      data: {
        roles,
        availablePermissions: AVAILABLE_PERMISSIONS,
      },
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { ok: false, error: "فشل في تحميل الأدوار" },
      { status: 500 }
    );
  }
}

// POST - Create new role
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createRoleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, nameAr, description, permissions } = validation.data;

    // Check if role exists
    const existing = await db.adminRole.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "اسم الدور موجود مسبقاً" },
        { status: 400 }
      );
    }

    const role = await db.adminRole.create({
      data: {
        name,
        nameAr,
        description,
        permissions,
        isSystem: false,
      },
    });

    await logAudit({
      actorUserId: admin.id,
      action: "ROLE_CREATE",
      entityType: "ROLE",
      entityId: role.id,
      metadata: { name, nameAr, permissions },
    });

    return NextResponse.json({ ok: true, data: role }, { status: 201 });
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { ok: false, error: "فشل في إنشاء الدور" },
      { status: 500 }
    );
  }
}

// PUT - Update role
export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateRoleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { id, ...updateData } = validation.data;

    const existing = await db.adminRole.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "الدور غير موجود" },
        { status: 404 }
      );
    }

    // Don't allow changing system role names
    if (existing.isSystem && updateData.status === "inactive") {
      return NextResponse.json(
        { ok: false, error: "لا يمكن تعطيل الأدوار الأساسية" },
        { status: 400 }
      );
    }

    const role = await db.adminRole.update({
      where: { id },
      data: updateData,
    });

    await logAudit({
      actorUserId: admin.id,
      action: "ROLE_UPDATE",
      entityType: "ROLE",
      entityId: id,
      metadata: updateData,
    });

    return NextResponse.json({ ok: true, data: role });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { ok: false, error: "فشل في تحديث الدور" },
      { status: 500 }
    );
  }
}

// DELETE - Delete role
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
        { ok: false, error: "معرف الدور مطلوب" },
        { status: 400 }
      );
    }

    const existing = await db.adminRole.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "الدور غير موجود" },
        { status: 404 }
      );
    }

    if (existing.isSystem) {
      return NextResponse.json(
        { ok: false, error: "لا يمكن حذف الأدوار الأساسية" },
        { status: 400 }
      );
    }

    await db.adminRole.delete({ where: { id } });

    await logAudit({
      actorUserId: admin.id,
      action: "ROLE_DELETE",
      entityType: "ROLE",
      entityId: id,
      metadata: { name: existing.name },
    });

    return NextResponse.json({ ok: true, data: { deleted: true } });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { ok: false, error: "فشل في حذف الدور" },
      { status: 500 }
    );
  }
}
