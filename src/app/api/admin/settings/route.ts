import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, getAdminFromRequest } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Default settings structure
const defaultSettings: Record<string, Record<string, unknown>> = {
  platform: {
    siteName: "معهد تبيان",
    siteDescription: "منصة تعليمية إسلامية",
    logo: "/logo.png",
    favicon: "/favicon.ico",
    defaultLanguage: "ar",
    defaultDirection: "rtl",
    maintenanceMode: false,
    registrationEnabled: true,
  },
  email: {
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpSecure: true,
    fromEmail: "noreply@tibyan.com",
    fromName: "معهد تبيان",
    templatesEnabled: true,
  },
  payments: {
    currency: "EUR",
    taxRate: 0,
    stripeEnabled: false,
    paypalEnabled: false,
    bankTransferEnabled: false,
    cashEnabled: true,
    refundPolicy: "14 يوم",
  },
  content: {
    autoPublish: false,
    requireReview: true,
    maxUploadSizeMB: 100,
    allowedFileTypes: ["pdf", "mp4", "mp3", "jpg", "png"],
    enableComments: true,
    enableRatings: true,
  },
  security: {
    sessionTimeoutMinutes: 1440, // 24 hours
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 30,
    require2FA: false,
    passwordMinLength: 8,
    passwordRequireSpecial: false,
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: false,
    enrollmentEmails: true,
    paymentEmails: true,
    marketingEmails: false,
  },
};

// GET /api/admin/settings - Get all settings
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;

    const where = category ? { category } : {};
    const settings = await db.systemSetting.findMany({ where });

    // Convert to object format and merge with defaults
    const settingsMap: Record<string, Record<string, unknown>> = { ...defaultSettings };
    
    for (const setting of settings) {
      const [cat, key] = setting.key.includes(".") 
        ? setting.key.split(".", 2)
        : [setting.category, setting.key];
      
      if (!settingsMap[cat]) settingsMap[cat] = {};
      settingsMap[cat][key] = setting.value;
    }

    return NextResponse.json({
      ok: true,
      data: category ? settingsMap[category] : settingsMap,
    });
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في جلب الإعدادات" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Update settings
export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { category, settings } = body as { 
      category: string; 
      settings: Record<string, unknown>; 
    };

    if (!category || !settings) {
      return NextResponse.json(
        { ok: false, error: "الفئة والإعدادات مطلوبة" },
        { status: 400 }
      );
    }

    const admin = await getAdminFromRequest(request);
    const updates: Array<{ key: string; value: unknown }> = [];

    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      const settingKey = `${category}.${key}`;
      
      await db.systemSetting.upsert({
        where: { key: settingKey },
        create: {
          key: settingKey,
          value: value as object,
          category,
          updatedBy: admin?.id,
        },
        update: {
          value: value as object,
          updatedBy: admin?.id,
        },
      });

      updates.push({ key, value });
    }

    // Log audit
    await logAudit({
      actorUserId: admin?.id,
      action: "SETTINGS_UPDATE",
      entityType: "SETTINGS",
      entityId: category,
      metadata: { category, updatedKeys: Object.keys(settings) },
    });

    return NextResponse.json({
      ok: true,
      data: { message: "تم تحديث الإعدادات بنجاح", updates },
    });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في تحديث الإعدادات" },
      { status: 500 }
    );
  }
}

// POST /api/admin/settings/reset - Reset settings to defaults
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { category } = body as { category?: string };

    if (category) {
      // Reset specific category
      await db.systemSetting.deleteMany({
        where: { category },
      });
    } else {
      // Reset all settings
      await db.systemSetting.deleteMany({});
    }

    const admin = await getAdminFromRequest(request);
    await logAudit({
      actorUserId: admin?.id,
      action: "SETTINGS_UPDATE",
      entityType: "SETTINGS",
      entityId: category || "all",
      metadata: { action: "reset", category: category || "all" },
    });

    return NextResponse.json({
      ok: true,
      data: { message: "تم إعادة الإعدادات إلى القيم الافتراضية" },
    });
  } catch (error) {
    console.error("Settings reset error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في إعادة الإعدادات" },
      { status: 500 }
    );
  }
}
