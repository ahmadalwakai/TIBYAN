import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, getAdminFromRequest } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { ADMIN_EMAILS, setDynamicAdminEmails } from "@/config/admin";
import { z } from "zod";

// Schema for admin data
interface DynamicAdmin {
  email: string;
  name: string;
  status: "active" | "suspended";
  addedAt: string;
  addedBy?: string;
  suspendedAt?: string;
  suspendedBy?: string;
  suspendReason?: string;
}

const AddAdminSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  name: z.string().min(2, "الاسم مطلوب (حرفان على الأقل)"),
});

const EditAdminSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  name: z.string().min(2, "الاسم مطلوب").optional(),
  newEmail: z.string().email("البريد الإلكتروني الجديد غير صالح").optional(),
});

const SuspendAdminSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  reason: z.string().optional(),
});

// Helper to get dynamic admins from settings
async function getDynamicAdminsFromDB(): Promise<DynamicAdmin[]> {
  try {
    const setting = await db.systemSetting.findUnique({
      where: { key: "admin.authorizedAdmins" },
    });
    if (setting?.value && Array.isArray(setting.value)) {
      return setting.value as unknown as DynamicAdmin[];
    }
  } catch {
    // Ignore errors, return empty
  }
  return [];
}

// Helper to save dynamic admins
async function saveDynamicAdminsToDB(admins: DynamicAdmin[]): Promise<void> {
  await db.systemSetting.upsert({
    where: { key: "admin.authorizedAdmins" },
    create: {
      key: "admin.authorizedAdmins",
      value: admins as unknown as object,
      category: "admin",
    },
    update: {
      value: admins as unknown as object,
    },
  });
}

// Helper to refresh cache
async function refreshAdminCache(): Promise<void> {
  const dynamicAdmins = await getDynamicAdminsFromDB();
  // Only include active admins in the cache
  const activeEmails = dynamicAdmins
    .filter(a => a.status === "active")
    .map(a => a.email.toLowerCase());
  setDynamicAdminEmails(activeEmails);
}

// GET /api/admin/admins - List all admin emails
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    // Refresh cache
    await refreshAdminCache();

    // Get static admins (from config)
    const staticAdmins = ADMIN_EMAILS.map(email => ({
      email: email.toLowerCase(),
      name: "مشرف ثابت",
      isStatic: true,
      status: "active" as const,
      addedAt: null,
      addedBy: null,
    }));

    // Get dynamic admins (from database)
    const dynamicAdmins = await getDynamicAdminsFromDB();
    const formattedDynamic = dynamicAdmins.map(admin => ({
      ...admin,
      email: admin.email.toLowerCase(),
      isStatic: false,
    }));

    // Merge and dedupe (static admins take precedence)
    const staticEmails = new Set(staticAdmins.map(a => a.email));
    const allAdmins = [
      ...staticAdmins,
      ...formattedDynamic.filter(a => !staticEmails.has(a.email)),
    ];

    const activeCount = allAdmins.filter(a => a.status === "active").length;
    const suspendedCount = allAdmins.filter(a => a.status === "suspended").length;

    return NextResponse.json({
      ok: true,
      data: {
        admins: allAdmins,
        total: allAdmins.length,
        staticCount: staticAdmins.length,
        dynamicCount: dynamicAdmins.length,
        activeCount,
        suspendedCount,
      },
    });
  } catch (error) {
    console.error("Error fetching admins:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في جلب قائمة المشرفين" },
      { status: 500 }
    );
  }
}

// POST /api/admin/admins - Add new admin email
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const validation = AddAdminSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, name } = validation.data;
    const normalizedEmail = email.toLowerCase();

    // Check if already in static list
    if (ADMIN_EMAILS.map(e => e.toLowerCase()).includes(normalizedEmail)) {
      return NextResponse.json(
        { ok: false, error: "هذا البريد مضاف مسبقاً في القائمة الثابتة" },
        { status: 400 }
      );
    }

    // Get current dynamic admins
    const currentDynamic = await getDynamicAdminsFromDB();
    
    // Check if already exists
    if (currentDynamic.some(a => a.email.toLowerCase() === normalizedEmail)) {
      return NextResponse.json(
        { ok: false, error: "هذا البريد مضاف مسبقاً" },
        { status: 400 }
      );
    }

    const admin = await getAdminFromRequest(request);

    // Add new admin
    const newAdmin: DynamicAdmin = {
      email: normalizedEmail,
      name,
      status: "active",
      addedAt: new Date().toISOString(),
      addedBy: admin?.email || "unknown",
    };

    await saveDynamicAdminsToDB([...currentDynamic, newAdmin]);

    // Refresh cache
    await refreshAdminCache();

    // Log audit
    await logAudit({
      actorUserId: admin?.id,
      action: "ADMIN_ADD",
      entityType: "USER",
      entityId: normalizedEmail,
      metadata: { addedEmail: normalizedEmail, name },
    });

    return NextResponse.json({
      ok: true,
      data: {
        message: "تم إضافة المشرف بنجاح",
        admin: newAdmin,
      },
    });
  } catch (error) {
    console.error("Error adding admin:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في إضافة المشرف" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/admins - Edit admin or suspend/activate
export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { action } = body as { action?: string };

    if (action === "suspend") {
      // Suspend admin
      const validation = SuspendAdminSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { ok: false, error: validation.error.issues[0].message },
          { status: 400 }
        );
      }

      const { email, reason } = validation.data;
      const normalizedEmail = email.toLowerCase();

      // Check if it's a static admin
      if (ADMIN_EMAILS.map(e => e.toLowerCase()).includes(normalizedEmail)) {
        return NextResponse.json(
          { ok: false, error: "لا يمكن تعليق مشرف ثابت" },
          { status: 400 }
        );
      }

      const currentDynamic = await getDynamicAdminsFromDB();
      const adminIndex = currentDynamic.findIndex(a => a.email.toLowerCase() === normalizedEmail);

      if (adminIndex === -1) {
        return NextResponse.json(
          { ok: false, error: "المشرف غير موجود" },
          { status: 404 }
        );
      }

      const currentAdmin = await getAdminFromRequest(request);

      currentDynamic[adminIndex] = {
        ...currentDynamic[adminIndex],
        status: "suspended",
        suspendedAt: new Date().toISOString(),
        suspendedBy: currentAdmin?.email || "unknown",
        suspendReason: reason,
      };

      await saveDynamicAdminsToDB(currentDynamic);
      await refreshAdminCache();

      await logAudit({
        actorUserId: currentAdmin?.id,
        action: "ADMIN_REMOVE",
        entityType: "USER",
        entityId: normalizedEmail,
        metadata: { action: "suspend", email: normalizedEmail, reason },
      });

      return NextResponse.json({
        ok: true,
        data: { message: "تم تعليق المشرف بنجاح", admin: currentDynamic[adminIndex] },
      });

    } else if (action === "activate") {
      // Activate suspended admin
      const { email } = body as { email: string };
      const normalizedEmail = email?.toLowerCase();

      if (!normalizedEmail) {
        return NextResponse.json(
          { ok: false, error: "البريد الإلكتروني مطلوب" },
          { status: 400 }
        );
      }

      const currentDynamic = await getDynamicAdminsFromDB();
      const adminIndex = currentDynamic.findIndex(a => a.email.toLowerCase() === normalizedEmail);

      if (adminIndex === -1) {
        return NextResponse.json(
          { ok: false, error: "المشرف غير موجود" },
          { status: 404 }
        );
      }

      const currentAdmin = await getAdminFromRequest(request);

      currentDynamic[adminIndex] = {
        ...currentDynamic[adminIndex],
        status: "active",
        suspendedAt: undefined,
        suspendedBy: undefined,
        suspendReason: undefined,
      };

      await saveDynamicAdminsToDB(currentDynamic);
      await refreshAdminCache();

      await logAudit({
        actorUserId: currentAdmin?.id,
        action: "ADMIN_ADD",
        entityType: "USER",
        entityId: normalizedEmail,
        metadata: { action: "activate", email: normalizedEmail },
      });

      return NextResponse.json({
        ok: true,
        data: { message: "تم تفعيل المشرف بنجاح", admin: currentDynamic[adminIndex] },
      });

    } else {
      // Edit admin details
      const validation = EditAdminSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { ok: false, error: validation.error.issues[0].message },
          { status: 400 }
        );
      }

      const { email, name, newEmail } = validation.data;
      const normalizedEmail = email.toLowerCase();

      // Check if it's a static admin
      if (ADMIN_EMAILS.map(e => e.toLowerCase()).includes(normalizedEmail)) {
        return NextResponse.json(
          { ok: false, error: "لا يمكن تعديل مشرف ثابت" },
          { status: 400 }
        );
      }

      const currentDynamic = await getDynamicAdminsFromDB();
      const adminIndex = currentDynamic.findIndex(a => a.email.toLowerCase() === normalizedEmail);

      if (adminIndex === -1) {
        return NextResponse.json(
          { ok: false, error: "المشرف غير موجود" },
          { status: 404 }
        );
      }

      // Check if new email already exists
      if (newEmail) {
        const newNormalizedEmail = newEmail.toLowerCase();
        if (newNormalizedEmail !== normalizedEmail) {
          if (ADMIN_EMAILS.map(e => e.toLowerCase()).includes(newNormalizedEmail)) {
            return NextResponse.json(
              { ok: false, error: "البريد الجديد موجود في القائمة الثابتة" },
              { status: 400 }
            );
          }
          if (currentDynamic.some((a, i) => i !== adminIndex && a.email.toLowerCase() === newNormalizedEmail)) {
            return NextResponse.json(
              { ok: false, error: "البريد الجديد مستخدم بالفعل" },
              { status: 400 }
            );
          }
        }
      }

      const currentAdmin = await getAdminFromRequest(request);

      currentDynamic[adminIndex] = {
        ...currentDynamic[adminIndex],
        email: newEmail?.toLowerCase() || currentDynamic[adminIndex].email,
        name: name || currentDynamic[adminIndex].name,
      };

      await saveDynamicAdminsToDB(currentDynamic);
      await refreshAdminCache();

      await logAudit({
        actorUserId: currentAdmin?.id,
        action: "ADMIN_ADD",
        entityType: "USER",
        entityId: newEmail?.toLowerCase() || normalizedEmail,
        metadata: { action: "edit", oldEmail: normalizedEmail, newEmail, name },
      });

      return NextResponse.json({
        ok: true,
        data: { message: "تم تحديث بيانات المشرف بنجاح", admin: currentDynamic[adminIndex] },
      });
    }
  } catch (error) {
    console.error("Error updating admin:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في تحديث المشرف" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/admins - Remove admin email permanently
export async function DELETE(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "البريد الإلكتروني مطلوب" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // Check if it's a static admin
    if (ADMIN_EMAILS.map(e => e.toLowerCase()).includes(normalizedEmail)) {
      return NextResponse.json(
        { ok: false, error: "لا يمكن حذف مشرف ثابت. يجب تعديل ملف الإعدادات." },
        { status: 400 }
      );
    }

    // Get current dynamic admins
    const currentDynamic = await getDynamicAdminsFromDB();
    
    // Filter out the email
    const newDynamicList = currentDynamic.filter(
      a => a.email.toLowerCase() !== normalizedEmail
    );

    if (newDynamicList.length === currentDynamic.length) {
      return NextResponse.json(
        { ok: false, error: "المشرف غير موجود في القائمة" },
        { status: 404 }
      );
    }

    await saveDynamicAdminsToDB(newDynamicList);

    // Refresh cache
    await refreshAdminCache();

    // Log audit
    const admin = await getAdminFromRequest(request);
    await logAudit({
      actorUserId: admin?.id,
      action: "ADMIN_REMOVE",
      entityType: "USER",
      entityId: normalizedEmail,
      metadata: { action: "delete", removedEmail: normalizedEmail },
    });

    return NextResponse.json({
      ok: true,
      data: {
        message: "تم حذف المشرف نهائياً",
        email: normalizedEmail,
      },
    });
  } catch (error) {
    console.error("Error removing admin:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في حذف المشرف" },
      { status: 500 }
    );
  }
}
