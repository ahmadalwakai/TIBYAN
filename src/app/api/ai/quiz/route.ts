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
 * AI Quiz Generator API
 * Generates quizzes from lesson or course content
 */

// Request validation
const QuizRequestSchema = z.object({
  lessonId: z.string().optional(),
  courseId: z.string().optional(),
  questionCount: z.number().min(3).max(20).default(5),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]).default("medium"),
  questionTypes: z.array(z.enum(["multiple_choice", "true_false", "short_answer"])).default(["multiple_choice"]),
  language: z.enum(["ar", "en"]).default("ar"),
}).refine(data => data.lessonId || data.courseId, {
  message: "يجب تحديد الدرس أو الدورة",
});

type QuizRequest = z.infer<typeof QuizRequestSchema>;

interface QuizQuestion {
  id: string;
  type: "multiple_choice" | "true_false" | "short_answer";
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
}

// Get user from cookie
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

// Build quiz generation prompt
function buildQuizPrompt(
  content: string,
  questionCount: number,
  difficulty: string,
  questionTypes: string[],
  language: "ar" | "en"
): string {
  const difficultyText = {
    easy: language === "ar" ? "سهل" : "easy",
    medium: language === "ar" ? "متوسط" : "medium",
    hard: language === "ar" ? "صعب" : "hard",
    mixed: language === "ar" ? "متنوع" : "mixed",
  };

  const typeText = {
    multiple_choice: language === "ar" ? "اختيار من متعدد" : "multiple choice",
    true_false: language === "ar" ? "صح أو خطأ" : "true/false",
    short_answer: language === "ar" ? "إجابة قصيرة" : "short answer",
  };

  const typesStr = questionTypes.map(t => typeText[t as keyof typeof typeText]).join(", ");

  if (language === "ar") {
    return `أنشئ اختباراً من ${questionCount} أسئلة بناءً على المحتوى التالي.
    
المتطلبات:
- مستوى الصعوبة: ${difficultyText[difficulty as keyof typeof difficultyText]}
- أنواع الأسئلة: ${typesStr}
- لكل سؤال اختيار من متعدد: 4 خيارات
- أضف شرحاً موجزاً للإجابة الصحيحة

أعد النتيجة بصيغة JSON فقط بدون أي نص إضافي:
{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "نص السؤال",
      "options": ["أ", "ب", "ج", "د"],
      "correctAnswer": 0,
      "explanation": "شرح الإجابة",
      "difficulty": "easy|medium|hard"
    }
  ]
}

المحتوى:
${content}`;
  }

  return `Generate a quiz with ${questionCount} questions based on the following content.

Requirements:
- Difficulty level: ${difficultyText[difficulty as keyof typeof difficultyText]}
- Question types: ${typesStr}
- For multiple choice: 4 options
- Add brief explanation for correct answer

Return ONLY JSON without any additional text:
{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "question text",
      "options": ["a", "b", "c", "d"],
      "correctAnswer": 0,
      "explanation": "answer explanation",
      "difficulty": "easy|medium|hard"
    }
  ]
}

Content:
${content}`;
}

// Parse quiz from LLM response
function parseQuizResponse(response: string): QuizQuestion[] {
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as { questions?: QuizQuestion[] };
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid quiz format");
    }

    return parsed.questions.map((q, idx) => ({
      id: `q_${Date.now()}_${idx}`,
      type: q.type || "multiple_choice",
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty || "medium",
    }));
  } catch (error) {
    console.error("[Quiz] Parse error:", error);
    throw new Error("Failed to parse quiz response");
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

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
    const parseResult = QuizRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { ok: false, error: "بيانات غير صالحة", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { lessonId, courseId, questionCount, difficulty, questionTypes, language }: QuizRequest = parseResult.data;

    // Rate limiting
    const rateCheck = policy.checkRateLimit(user.id, "agent_request");
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { ok: false, error: "تم تجاوز الحد المسموح. حاول لاحقاً." },
        { status: 429 }
      );
    }

    // Get content
    let content = "";
    let title = "";
    let targetCourseId = courseId;

    if (lessonId) {
      const lesson = await db.lesson.findUnique({
        where: { id: lessonId },
        include: {
          course: { select: { id: true, title: true } },
        },
      });

      if (!lesson) {
        return NextResponse.json(
          { ok: false, error: "الدرس غير موجود" },
          { status: 404 }
        );
      }

      content = `${lesson.title}\n${lesson.description || ""}\n${lesson.content || ""}`;
      title = lesson.title;
      targetCourseId = lesson.courseId;
    } else if (courseId) {
      const course = await db.course.findUnique({
        where: { id: courseId },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            take: 10,
          },
        },
      });

      if (!course) {
        return NextResponse.json(
          { ok: false, error: "الدورة غير موجودة" },
          { status: 404 }
        );
      }

      content = `${course.title}\n${course.description || ""}\n\n`;
      content += course.lessons
        .map(l => `${l.title}: ${l.description || ""}\n${l.content || ""}`)
        .join("\n\n");
      title = course.title;
    }

    // Check enrollment
    if (targetCourseId) {
      const enrollment = await db.enrollment.findFirst({
        where: {
          userId: user.id,
          courseId: targetCourseId,
          status: "ACTIVE",
        },
      });

      if (!enrollment && user.role !== "ADMIN" && user.role !== "INSTRUCTOR") {
        return NextResponse.json(
          { ok: false, error: "غير مسجل في هذه الدورة" },
          { status: 403 }
        );
      }
    }

    if (content.length < 100) {
      return NextResponse.json(
        { ok: false, error: "المحتوى غير كافٍ لإنشاء اختبار" },
        { status: 400 }
      );
    }

    // Truncate content if too long
    if (content.length > 8000) {
      content = content.substring(0, 8000) + "...";
    }

    // Build prompt
    const prompt = buildQuizPrompt(content, questionCount, difficulty, questionTypes, language);
    const systemPrompt = language === "ar"
      ? "أنت مساعد تعليمي متخصص في إنشاء الاختبارات. أعد الإجابة بصيغة JSON فقط."
      : "You are an educational assistant specialized in creating quizzes. Return only JSON.";

    // Call LLM client
    const llmResult = await llmClient.chatCompletion([
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ], {
      temperature: 0.5,
      maxTokens: 3000,
    });

    if (!llmResult.ok) {
      console.error("[Quiz] LLM error:", llmResult.error);
      return NextResponse.json(
        { ok: false, error: "خدمة الذكاء الاصطناعي غير متاحة حالياً" },
        { status: 503 }
      );
    }

    const responseText = llmResult.content?.trim();

    if (!responseText) {
      return NextResponse.json(
        { ok: false, error: "فشل في إنشاء الاختبار" },
        { status: 500 }
      );
    }

    // Parse quiz
    let questions: QuizQuestion[];
    try {
      questions = parseQuizResponse(responseText);
    } catch {
      return NextResponse.json(
        { ok: false, error: "فشل في معالجة الاختبار" },
        { status: 500 }
      );
    }

    // Log telemetry
    telemetry.startRequest(requestId, `quiz_${lessonId || courseId}`, user.id);
    telemetry.endRequest(requestId, {
      tokenUsage: llmResult.usage || {
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: Math.ceil(responseText.length / 4),
        totalTokens: Math.ceil((prompt.length + responseText.length) / 4),
      },
    });

    // Audit log
    await audit.logToolExecution(requestId, {
      name: "quiz_generate",
      params: { lessonId, courseId, questionCount, difficulty },
      result: { questionCount: questions.length, title },
      durationMs: Date.now() - startTime,
      success: true,
      userId: user.id,
    });

    return NextResponse.json({
      ok: true,
      data: {
        quiz: {
          id: `quiz_${Date.now()}`,
          title: language === "ar" ? `اختبار: ${title}` : `Quiz: ${title}`,
          questions,
          difficulty,
          createdAt: new Date().toISOString(),
        },
        sourceType: lessonId ? "lesson" : "course",
        sourceId: lessonId || courseId,
        sourceTitle: title,
        durationMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error("[Quiz] Error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
