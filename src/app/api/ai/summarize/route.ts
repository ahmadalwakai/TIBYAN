import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import {
  decodeUserData,
  type CookieUserData,
} from "@/lib/auth/cookie-encoding";
import { db } from "@/lib/db";
import { policy, telemetry, audit } from "@/lib/ai-agent";
import { llmClient } from "@/lib/llm";

/**
 * AI Lesson Summarizer API
 * Generates AI-powered summaries of lesson content
 */

// Request validation
const SummarizeRequestSchema = z.object({
  lessonId: z.string().min(1, "معرّف الدرس مطلوب"),
  type: z.enum(["brief", "detailed", "key_points", "study_notes"]).default("brief"),
  language: z.enum(["ar", "en"]).default("ar"),
});

type SummarizeRequest = z.infer<typeof SummarizeRequestSchema>;
async function getUserFromCookie(): Promise<CookieUserData | null> {
  try {
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get("user-data");
    if (!userDataCookie?.value) return null;
    return decodeUserData(userDataCookie.value);
  } catch {
    return null;
  }
}

// Summary type prompts
const SUMMARY_PROMPTS = {
  brief: {
    ar: "اكتب ملخصاً موجزاً لهذا الدرس في 3-4 جمل. ركز على الفكرة الرئيسية.",
    en: "Write a brief summary of this lesson in 3-4 sentences. Focus on the main idea.",
  },
  detailed: {
    ar: "اكتب ملخصاً مفصلاً لهذا الدرس يشمل جميع النقاط المهمة مع الشرح.",
    en: "Write a detailed summary of this lesson covering all important points with explanations.",
  },
  key_points: {
    ar: "استخرج النقاط الرئيسية من هذا الدرس في قائمة مرقمة (5-10 نقاط).",
    en: "Extract the key points from this lesson in a numbered list (5-10 points).",
  },
  study_notes: {
    ar: "أنشئ ملاحظات دراسية منظمة لهذا الدرس تشمل: المفاهيم الأساسية، التعريفات، الأمثلة، ونقاط للمراجعة.",
    en: "Create organized study notes for this lesson including: core concepts, definitions, examples, and review points.",
  },
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `sum_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Get user
  const user = await getUserFromCookie();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول" },
      { status: 401 }
    );
  }

  try {
    // Parse request
    const body: unknown = await request.json();
    const parseResult = SummarizeRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { ok: false, error: "بيانات غير صالحة", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { lessonId, type, language }: SummarizeRequest = parseResult.data;

    // Rate limiting
    const rateCheck = policy.checkRateLimit(user.id, "agent_request");
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { ok: false, error: "تم تجاوز الحد المسموح. حاول لاحقاً." },
        { status: 429 }
      );
    }

    // Get lesson content
    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          select: { id: true, title: true },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { ok: false, error: "الدرس غير موجود" },
        { status: 404 }
      );
    }

    // Check enrollment
    const enrollment = await db.enrollment.findFirst({
      where: {
        userId: user.id,
        courseId: lesson.courseId,
        status: "ACTIVE",
      },
    });

    if (!enrollment && user.role !== "ADMIN" && user.role !== "INSTRUCTOR") {
      return NextResponse.json(
        { ok: false, error: "غير مسجل في هذه الدورة" },
        { status: 403 }
      );
    }

    // Build content for summarization
    const lessonContent = `
عنوان الدرس: ${lesson.title}
${lesson.description ? `الوصف: ${lesson.description}` : ""}
${lesson.content ? `المحتوى:\n${lesson.content}` : ""}
`.trim();

    if (lessonContent.length < 50) {
      return NextResponse.json(
        { ok: false, error: "محتوى الدرس غير كافٍ للتلخيص" },
        { status: 400 }
      );
    }

    // Build prompt
    const systemPrompt = language === "ar"
      ? "أنت مساعد تعليمي متخصص في تلخيص الدروس بشكل واضح ومفيد. اكتب بالعربية الفصحى."
      : "You are an educational assistant specialized in summarizing lessons clearly and helpfully.";

    const userPrompt = `${SUMMARY_PROMPTS[type][language]}\n\n${lessonContent}`;

    // Call LLM client
    const llmResult = await llmClient.chatCompletion([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ], {
      temperature: 0.3,
      maxTokens: type === "detailed" || type === "study_notes" ? 1500 : 500,
    });

    if (!llmResult.ok) {
      console.error("[Summarize] LLM error:", llmResult.error);
      return NextResponse.json(
        { ok: false, error: "خدمة الذكاء الاصطناعي غير متاحة حالياً" },
        { status: 503 }
      );
    }

    const summary = llmResult.content?.trim();

    if (!summary) {
      return NextResponse.json(
        { ok: false, error: "فشل في إنشاء الملخص" },
        { status: 500 }
      );
    }

    // Log telemetry
    telemetry.startRequest(requestId, `summarize_${lessonId}`, user.id);
    telemetry.endRequest(requestId, {
      tokenUsage: llmResult.usage || {
        promptTokens: Math.ceil(userPrompt.length / 4),
        completionTokens: Math.ceil(summary.length / 4),
        totalTokens: Math.ceil((userPrompt.length + summary.length) / 4),
      },
    });

    // Audit log
    await audit.logToolExecution(requestId, {
      name: "lesson_summarize",
      params: { lessonId, type, language },
      result: { summaryLength: summary.length, lessonTitle: lesson.title },
      durationMs: Date.now() - startTime,
      success: true,
      userId: user.id,
    });

    return NextResponse.json({
      ok: true,
      data: {
        summary,
        type,
        lessonId,
        lessonTitle: lesson.title,
        courseTitle: lesson.course.title,
        generatedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error("[Summarize] Error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
