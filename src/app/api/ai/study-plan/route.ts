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
 * AI Study Plan Generator API
 * Creates personalized study plans based on student progress and goals
 */

// Request validation
const StudyPlanRequestSchema = z.object({
  courseId: z.string().optional(),
  goalType: z.enum(["complete_course", "prepare_exam", "review", "catch_up", "accelerate"]).default("complete_course"),
  availableHoursPerWeek: z.number().min(1).max(40).default(10),
  preferredDays: z.array(z.enum(["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"])).optional(),
  targetDate: z.string().optional(),
  focusAreas: z.array(z.string()).optional(),
  language: z.enum(["ar", "en"]).default("ar"),
});

type StudyPlanRequest = z.infer<typeof StudyPlanRequestSchema>;

interface StudySession {
  day: string;
  duration: number; // minutes
  topic: string;
  objectives: string[];
  resources: string[];
  activities: string[];
}

interface StudyPlan {
  id: string;
  title: string;
  description: string;
  weeklySchedule: StudySession[];
  milestones: { week: number; goal: string; assessmentType: string }[];
  tips: string[];
  estimatedCompletionWeeks: number;
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

// Build study plan prompt
function buildStudyPlanPrompt(
  studentContext: {
    courseName: string;
    totalLessons: number;
    completedLessons: number;
    lessonTitles: string[];
    completedTitles: string[];
    avgProgress: number;
  },
  request: StudyPlanRequest
): string {
  const { goalType, availableHoursPerWeek, preferredDays, targetDate, focusAreas, language } = request;

  const goalDescriptions = {
    complete_course: language === "ar" ? "إكمال الدورة بالكامل" : "Complete the entire course",
    prepare_exam: language === "ar" ? "التحضير للاختبار" : "Prepare for exam",
    review: language === "ar" ? "مراجعة المحتوى" : "Review content",
    catch_up: language === "ar" ? "اللحاق بالمنهج" : "Catch up with curriculum",
    accelerate: language === "ar" ? "تسريع التعلم" : "Accelerate learning",
  };

  const daysAr: Record<string, string> = {
    sunday: "الأحد",
    monday: "الاثنين",
    tuesday: "الثلاثاء",
    wednesday: "الأربعاء",
    thursday: "الخميس",
    friday: "الجمعة",
    saturday: "السبت",
  };

  if (language === "ar") {
    return `أنشئ خطة دراسية مخصصة بناءً على البيانات التالية:

معلومات الطالب:
- الدورة: ${studentContext.courseName}
- إجمالي الدروس: ${studentContext.totalLessons}
- الدروس المكتملة: ${studentContext.completedLessons}
- نسبة التقدم: ${studentContext.avgProgress}%

المتطلبات:
- الهدف: ${goalDescriptions[goalType]}
- الساعات المتاحة أسبوعياً: ${availableHoursPerWeek}
${preferredDays?.length ? `- الأيام المفضلة: ${preferredDays.map(d => daysAr[d]).join(", ")}` : ""}
${targetDate ? `- التاريخ المستهدف: ${targetDate}` : ""}
${focusAreas?.length ? `- مجالات التركيز: ${focusAreas.join(", ")}` : ""}

الدروس المتبقية:
${studentContext.lessonTitles.filter(t => !studentContext.completedTitles.includes(t)).join("\n")}

أعد النتيجة بصيغة JSON فقط:
{
  "title": "عنوان الخطة",
  "description": "وصف موجز",
  "weeklySchedule": [
    {
      "day": "الأحد",
      "duration": 60,
      "topic": "موضوع الجلسة",
      "objectives": ["هدف 1", "هدف 2"],
      "resources": ["مصدر 1"],
      "activities": ["نشاط 1", "نشاط 2"]
    }
  ],
  "milestones": [
    { "week": 1, "goal": "إكمال الوحدة الأولى", "assessmentType": "اختبار قصير" }
  ],
  "tips": ["نصيحة 1", "نصيحة 2"],
  "estimatedCompletionWeeks": 4
}`;
  }

  return `Create a personalized study plan based on the following data:

Student Information:
- Course: ${studentContext.courseName}
- Total Lessons: ${studentContext.totalLessons}
- Completed Lessons: ${studentContext.completedLessons}
- Progress: ${studentContext.avgProgress}%

Requirements:
- Goal: ${goalDescriptions[goalType]}
- Available Hours/Week: ${availableHoursPerWeek}
${preferredDays?.length ? `- Preferred Days: ${preferredDays.join(", ")}` : ""}
${targetDate ? `- Target Date: ${targetDate}` : ""}
${focusAreas?.length ? `- Focus Areas: ${focusAreas.join(", ")}` : ""}

Remaining Lessons:
${studentContext.lessonTitles.filter(t => !studentContext.completedTitles.includes(t)).join("\n")}

Return ONLY JSON:
{
  "title": "Plan Title",
  "description": "Brief description",
  "weeklySchedule": [
    {
      "day": "Sunday",
      "duration": 60,
      "topic": "Session topic",
      "objectives": ["objective 1", "objective 2"],
      "resources": ["resource 1"],
      "activities": ["activity 1", "activity 2"]
    }
  ],
  "milestones": [
    { "week": 1, "goal": "Complete Unit 1", "assessmentType": "Quiz" }
  ],
  "tips": ["tip 1", "tip 2"],
  "estimatedCompletionWeeks": 4
}`;
}

// Parse study plan from LLM response
function parseStudyPlanResponse(response: string): Omit<StudyPlan, "id"> {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as Omit<StudyPlan, "id">;
    if (!parsed.title || !parsed.weeklySchedule) {
      throw new Error("Invalid study plan format");
    }

    return parsed;
  } catch (error) {
    console.error("[StudyPlan] Parse error:", error);
    throw new Error("Failed to parse study plan response");
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

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
    const parseResult = StudyPlanRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { ok: false, error: "بيانات غير صالحة", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const requestData: StudyPlanRequest = parseResult.data;
    const { courseId, language } = requestData;

    // Rate limiting
    const rateCheck = policy.checkRateLimit(user.id, "agent_request");
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { ok: false, error: "تم تجاوز الحد المسموح. حاول لاحقاً." },
        { status: 429 }
      );
    }

    // Get student's enrollments and progress
    const enrollments = await db.enrollment.findMany({
      where: {
        userId: user.id,
        status: "ACTIVE",
        ...(courseId && { courseId }),
      },
      include: {
        course: {
          include: {
            lessons: {
              orderBy: { order: "asc" },
              select: { id: true, title: true },
            },
          },
        },
      },
    });

    if (enrollments.length === 0) {
      return NextResponse.json(
        { ok: false, error: "لا توجد دورات مسجلة" },
        { status: 404 }
      );
    }

    // Get progress for each enrollment - use enrollment.progress field
    const progressData = enrollments.map((enrollment) => {
      const totalLessons = enrollment.course.lessons.length;
      // Estimate completed lessons from progress percentage
      const estimatedCompletedLessons = Math.round((enrollment.progress / 100) * totalLessons);
      
      return {
        courseId: enrollment.courseId,
        courseName: enrollment.course.title,
        totalLessons,
        completedLessons: estimatedCompletedLessons,
        lessonTitles: enrollment.course.lessons.map(l => l.title),
        completedTitles: enrollment.course.lessons
          .slice(0, estimatedCompletedLessons)
          .map(l => l.title),
        avgProgress: Math.round(enrollment.progress),
      };
    });

    // Use first course or specific course
    const studentContext = courseId
      ? progressData.find(p => p.courseId === courseId)
      : progressData[0];

    if (!studentContext) {
      return NextResponse.json(
        { ok: false, error: "الدورة غير موجودة" },
        { status: 404 }
      );
    }

    // Build prompt
    const prompt = buildStudyPlanPrompt(studentContext, requestData);
    const systemPrompt = language === "ar"
      ? "أنت مخطط تعليمي متخصص في إنشاء خطط دراسية مخصصة. أعد الإجابة بصيغة JSON فقط."
      : "You are an educational planner specialized in creating personalized study plans. Return only JSON.";

    // Call LLM client
    const llmResult = await llmClient.chatCompletion([
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ], {
      temperature: 0.4,
      maxTokens: 2500,
    });

    if (!llmResult.ok) {
      console.error("[StudyPlan] LLM error:", llmResult.error);
      return NextResponse.json(
        { ok: false, error: "خدمة الذكاء الاصطناعي غير متاحة حالياً" },
        { status: 503 }
      );
    }

    const responseText = llmResult.content?.trim();

    if (!responseText) {
      return NextResponse.json(
        { ok: false, error: "فشل في إنشاء الخطة الدراسية" },
        { status: 500 }
      );
    }

    // Parse study plan
    let studyPlan: Omit<StudyPlan, "id">;
    try {
      studyPlan = parseStudyPlanResponse(responseText);
    } catch {
      return NextResponse.json(
        { ok: false, error: "فشل في معالجة الخطة الدراسية" },
        { status: 500 }
      );
    }

    const fullPlan: StudyPlan = {
      id: `plan_${Date.now()}`,
      ...studyPlan,
    };

    // Log telemetry
    telemetry.startRequest(requestId, `study_plan_${studentContext.courseId}`, user.id);
    telemetry.endRequest(requestId, {
      tokenUsage: llmResult.usage || {
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: Math.ceil(responseText.length / 4),
        totalTokens: Math.ceil((prompt.length + responseText.length) / 4),
      },
    });

    // Audit log
    await audit.logToolExecution(requestId, {
      name: "study_plan",
      params: { courseId: studentContext.courseId, goalType: requestData.goalType },
      result: { weeklySessionCount: fullPlan.weeklySchedule.length, courseName: studentContext.courseName },
      durationMs: Date.now() - startTime,
      success: true,
      userId: user.id,
    });

    return NextResponse.json({
      ok: true,
      data: {
        plan: fullPlan,
        studentProgress: {
          courseId: studentContext.courseId,
          courseName: studentContext.courseName,
          totalLessons: studentContext.totalLessons,
          completedLessons: studentContext.completedLessons,
          progressPercentage: studentContext.avgProgress,
        },
        generatedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error("[StudyPlan] Error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}

// GET - Retrieve saved study plans
export async function GET(request: NextRequest) {
  const user = await getUserFromCookie();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");

  try {
    // For now, return empty - in production, save plans to database
    return NextResponse.json({
      ok: true,
      data: {
        plans: [],
        message: courseId
          ? "لا توجد خطط محفوظة لهذه الدورة"
          : "لا توجد خطط محفوظة",
      },
    });
  } catch (error) {
    console.error("[StudyPlan GET] Error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ" },
      { status: 500 }
    );
  }
}
