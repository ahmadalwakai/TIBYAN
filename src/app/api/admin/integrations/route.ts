import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/api-auth";

interface Integration {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  category: string;
  status: "connected" | "disconnected" | "error";
  description: string;
  config: Record<string, unknown>;
  lastChecked?: string;
}

// Define available integrations
const INTEGRATIONS: Integration[] = [
  {
    id: "resend",
    name: "Resend",
    nameAr: "Resend للبريد",
    icon: "📧",
    category: "email",
    status: "disconnected",
    description: "إرسال البريد الإلكتروني عبر Resend API",
    config: { apiKey: "" },
  },
  {
    id: "stripe",
    name: "Stripe",
    nameAr: "Stripe للمدفوعات",
    icon: "💳",
    category: "payment",
    status: "disconnected",
    description: "معالجة المدفوعات الإلكترونية",
    config: { publicKey: "", secretKey: "" },
  },
  {
    id: "s3",
    name: "Amazon S3",
    nameAr: "تخزين S3",
    icon: "☁️",
    category: "storage",
    status: "disconnected",
    description: "تخزين الملفات والوسائط",
    config: { bucket: "", region: "", accessKey: "", secretKey: "" },
  },
  {
    id: "cloudflare",
    name: "Cloudflare R2",
    nameAr: "Cloudflare R2",
    icon: "🌐",
    category: "storage",
    status: "disconnected",
    description: "تخزين وتوزيع المحتوى",
    config: { accountId: "", accessKey: "", secretKey: "", bucket: "" },
  },
  {
    id: "sentry",
    name: "Sentry",
    nameAr: "Sentry للمراقبة",
    icon: "🔍",
    category: "monitoring",
    status: "disconnected",
    description: "مراقبة الأخطاء والأداء",
    config: { dsn: "" },
  },
  {
    id: "analytics",
    name: "Google Analytics",
    nameAr: "تحليلات جوجل",
    icon: "📊",
    category: "analytics",
    status: "disconnected",
    description: "تحليل سلوك المستخدمين",
    config: { measurementId: "" },
  },
  {
    id: "twilio",
    name: "Twilio SMS",
    nameAr: "رسائل Twilio",
    icon: "📱",
    category: "sms",
    status: "disconnected",
    description: "إرسال رسائل SMS",
    config: { accountSid: "", authToken: "", phoneNumber: "" },
  },
  {
    id: "zoom",
    name: "Zoom",
    nameAr: "اجتماعات Zoom",
    icon: "🎥",
    category: "video",
    status: "disconnected",
    description: "البث المباشر والاجتماعات",
    config: { apiKey: "", apiSecret: "" },
  },
  {
    id: "groq",
    name: "Groq AI",
    nameAr: "Groq للذكاء الاصطناعي",
    icon: "🤖",
    category: "ai",
    status: "disconnected",
    description: "معالجة اللغة الطبيعية (Zyphon Chat)",
    config: {},
  },
  {
    id: "replicate",
    name: "Replicate",
    nameAr: "Replicate لتوليد الصور",
    icon: "🎨",
    category: "ai",
    status: "disconnected",
    description: "توليد الصور بالذكاء الاصطناعي (Zyphon Image)",
    config: {},
  },
];

// Check integration status based on environment variables
function checkIntegrationStatus(): Integration[] {
  return INTEGRATIONS.map((integration) => {
    let status: "connected" | "disconnected" | "error" = "disconnected";
    
    switch (integration.id) {
      case "resend":
        if (process.env.RESEND_API_KEY) status = "connected";
        break;
      case "stripe":
        if (process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY) status = "connected";
        break;
      case "s3":
        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET) status = "connected";
        break;
      case "cloudflare":
        if (process.env.CLOUDFLARE_R2_ACCESS_KEY) status = "connected";
        break;
      case "sentry":
        if (process.env.SENTRY_DSN) status = "connected";
        break;
      case "analytics":
        if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) status = "connected";
        break;
      case "twilio":
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) status = "connected";
        break;
      case "zoom":
        if (process.env.ZOOM_API_KEY) status = "connected";
        break;
      case "groq":
        if (process.env.GROQ_API_KEY) status = "connected";
        break;
      case "replicate":
        if (process.env.REPLICATE_API_TOKEN) status = "connected";
        break;
    }
    
    return { ...integration, status, lastChecked: new Date().toISOString() };
  });
}

// GET - List all integrations with their status
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
    }

    const integrations = checkIntegrationStatus();
    
    // Group by category
    const byCategory = integrations.reduce<Record<string, Integration[]>>((acc, int) => {
      if (!acc[int.category]) acc[int.category] = [];
      acc[int.category].push(int);
      return acc;
    }, {});

    // Stats
    const stats = {
      total: integrations.length,
      connected: integrations.filter((i) => i.status === "connected").length,
      disconnected: integrations.filter((i) => i.status === "disconnected").length,
      error: integrations.filter((i) => i.status === "error").length,
    };

    return NextResponse.json({
      ok: true,
      data: {
        integrations,
        byCategory,
        stats,
        categories: {
          email: "📧 البريد الإلكتروني",
          payment: "💳 المدفوعات",
          storage: "☁️ التخزين",
          monitoring: "🔍 المراقبة",
          analytics: "📊 التحليلات",
          sms: "📱 الرسائل النصية",
          video: "🎥 الفيديو",
        },
      },
    });
  } catch (error) {
    console.error("Error fetching integrations:", error);
    return NextResponse.json(
      { ok: false, error: "فشل في تحميل التكاملات" },
      { status: 500 }
    );
  }
}

// POST - Test an integration connection
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const { integrationId } = body;

    if (!integrationId) {
      return NextResponse.json(
        { ok: false, error: "معرف التكامل مطلوب" },
        { status: 400 }
      );
    }

    // Simple test based on env var presence
    const integration = INTEGRATIONS.find((i) => i.id === integrationId);
    if (!integration) {
      return NextResponse.json(
        { ok: false, error: "التكامل غير موجود" },
        { status: 404 }
      );
    }

    // For now, just check env vars
    const integrations = checkIntegrationStatus();
    const status = integrations.find((i) => i.id === integrationId)?.status;

    return NextResponse.json({
      ok: true,
      data: {
        integrationId,
        status,
        message: status === "connected" ? "التكامل يعمل بشكل صحيح" : "التكامل غير مُعد",
        testedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error testing integration:", error);
    return NextResponse.json(
      { ok: false, error: "فشل في اختبار التكامل" },
      { status: 500 }
    );
  }
}
