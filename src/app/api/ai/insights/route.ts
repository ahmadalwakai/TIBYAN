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
 * Admin AI Insights API
 * Provides AI-powered analytics and insights for administrators
 */

// Request validation
const InsightsRequestSchema = z.object({
  type: z.enum([
    "engagement_analysis",
    "revenue_forecast",
    "content_recommendations",
    "student_risk",
    "performance_summary",
    "growth_opportunities",
  ]),
  timeRange: z.enum(["week", "month", "quarter", "year"]).default("month"),
  courseId: z.string().optional(),
  language: z.enum(["ar", "en"]).default("ar"),
});

type InsightsRequest = z.infer<typeof InsightsRequestSchema>;

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

// Gather platform metrics
async function gatherPlatformMetrics(timeRange: string, courseId?: string) {
  const now = new Date();
  const startDate = new Date();

  switch (timeRange) {
    case "week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "quarter":
      startDate.setMonth(now.getMonth() - 3);
      break;
    case "year":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  const [
    totalUsers,
    newUsers,
    totalCourses,
    activeCourses,
    totalEnrollments,
    newEnrollments,
    completedEnrollments,
    totalRevenue,
    recentPayments,
    lessonsPublished,
    avgProgress,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: startDate } } }),
    db.course.count(),
    db.course.count({ where: { status: "PUBLISHED" } }),
    db.enrollment.count(courseId ? { where: { courseId } } : undefined),
    db.enrollment.count({
      where: {
        enrolledAt: { gte: startDate },
        ...(courseId && { courseId }),
      },
    }),
    db.enrollment.count({
      where: {
        completedAt: { not: null },
        ...(courseId && { courseId }),
      },
    }),
    db.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: "COMPLETED",
        ...(courseId && { courseId }),
      },
    }),
    db.payment.aggregate({
      _sum: { amount: true },
      _count: true,
      where: {
        status: "COMPLETED",
        createdAt: { gte: startDate },
        ...(courseId && { courseId }),
      },
    }),
    db.lesson.count({
      where: {
        ...(courseId && { courseId }),
      },
    }),
    db.enrollment.aggregate({
      _avg: { progress: true },
      where: courseId ? { courseId } : undefined,
    }),
  ]);

  // Get top performing courses
  const topCourses = await db.enrollment.groupBy({
    by: ["courseId"],
    _count: { courseId: true },
    orderBy: { _count: { courseId: "desc" } },
    take: 5,
  });

  const topCoursesWithNames = await Promise.all(
    topCourses.map(async (tc) => {
      const course = await db.course.findUnique({
        where: { id: tc.courseId },
        select: { title: true },
      });
      return { title: course?.title || "Unknown", enrollments: tc._count.courseId };
    })
  );

  // Get at-risk students (low progress in recent time)
  const atRiskCount = await db.enrollment.count({
    where: {
      status: "ACTIVE",
      enrolledAt: { lte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }, // Enrolled > 14 days
      completedAt: null,
      progress: { lt: 20 },
    },
  });

  return {
    users: {
      total: totalUsers,
      new: newUsers,
      growthRate: totalUsers > 0 ? Math.round((newUsers / totalUsers) * 100) : 0,
    },
    courses: {
      total: totalCourses,
      active: activeCourses,
      lessons: lessonsPublished,
    },
    enrollments: {
      total: totalEnrollments,
      new: newEnrollments,
      completed: completedEnrollments,
      completionRate: totalEnrollments > 0
        ? Math.round((completedEnrollments / totalEnrollments) * 100)
        : 0,
      avgProgress: Math.round(avgProgress._avg.progress || 0),
    },
    revenue: {
      total: Number(totalRevenue._sum.amount || 0),
      recent: Number(recentPayments._sum.amount || 0),
      recentCount: recentPayments._count,
    },
    topCourses: topCoursesWithNames,
    atRiskStudents: atRiskCount,
    timeRange,
    generatedAt: new Date().toISOString(),
  };
}

// Build insights prompt based on type
function buildInsightsPrompt(
  type: string,
  metrics: Awaited<ReturnType<typeof gatherPlatformMetrics>>,
  language: "ar" | "en"
): string {
  const metricsJson = JSON.stringify(metrics, null, 2);

  const prompts: Record<string, { ar: string; en: string }> = {
    engagement_analysis: {
      ar: `حلل بيانات تفاعل المستخدمين التالية وقدم رؤى عملية:

${metricsJson}

قدم تحليلاً شاملاً يتضمن:
1. تقييم مستوى التفاعل الحالي
2. نقاط القوة والضعف
3. توصيات لتحسين التفاعل
4. مقارنة مع الفترات السابقة (إن أمكن)

أعد الإجابة بصيغة JSON:
{
  "summary": "ملخص تنفيذي",
  "engagementScore": 75,
  "strengths": ["نقطة قوة 1"],
  "weaknesses": ["نقطة ضعف 1"],
  "recommendations": [{"title": "توصية", "priority": "high|medium|low", "impact": "وصف الأثر"}],
  "trends": [{"metric": "المقياس", "direction": "up|down|stable", "percentage": 10}]
}`,
      en: `Analyze the following user engagement data and provide actionable insights:

${metricsJson}

Provide comprehensive analysis including:
1. Current engagement level assessment
2. Strengths and weaknesses
3. Recommendations for improvement
4. Comparison with previous periods (if applicable)

Return JSON:
{
  "summary": "Executive summary",
  "engagementScore": 75,
  "strengths": ["strength 1"],
  "weaknesses": ["weakness 1"],
  "recommendations": [{"title": "recommendation", "priority": "high|medium|low", "impact": "impact description"}],
  "trends": [{"metric": "metric", "direction": "up|down|stable", "percentage": 10}]
}`,
    },
    revenue_forecast: {
      ar: `بناءً على بيانات الإيرادات التالية، قدم توقعات وتحليلات:

${metricsJson}

قدم:
1. تحليل الإيرادات الحالية
2. توقعات الشهر/الربع القادم
3. فرص زيادة الإيرادات
4. المخاطر المحتملة

أعد JSON:
{
  "currentRevenue": 0,
  "projectedRevenue": 0,
  "growthRate": 0,
  "opportunities": [{"title": "فرصة", "potentialValue": 0, "difficulty": "easy|medium|hard"}],
  "risks": [{"title": "مخاطر", "likelihood": "high|medium|low", "mitigation": "الحل"}],
  "recommendations": ["توصية 1"]
}`,
      en: `Based on the following revenue data, provide forecasts and analysis:

${metricsJson}

Provide:
1. Current revenue analysis
2. Next month/quarter projections
3. Revenue growth opportunities
4. Potential risks

Return JSON:
{
  "currentRevenue": 0,
  "projectedRevenue": 0,
  "growthRate": 0,
  "opportunities": [{"title": "opportunity", "potentialValue": 0, "difficulty": "easy|medium|hard"}],
  "risks": [{"title": "risk", "likelihood": "high|medium|low", "mitigation": "solution"}],
  "recommendations": ["recommendation 1"]
}`,
    },
    content_recommendations: {
      ar: `بناءً على بيانات المحتوى والتفاعل، اقترح تحسينات للمحتوى:

${metricsJson}

قدم:
1. تحليل جودة المحتوى الحالي
2. فجوات المحتوى
3. أفكار لدورات جديدة
4. تحسينات للمحتوى الحالي

أعد JSON:
{
  "contentScore": 80,
  "gaps": ["فجوة 1"],
  "newCourseIdeas": [{"title": "عنوان", "targetAudience": "الجمهور", "estimatedDemand": "high|medium|low"}],
  "improvements": [{"target": "الدورة/الدرس", "suggestion": "الاقتراح", "priority": "high|medium|low"}]
}`,
      en: `Based on content and engagement data, suggest content improvements:

${metricsJson}

Provide:
1. Current content quality analysis
2. Content gaps
3. New course ideas
4. Improvements for existing content

Return JSON:
{
  "contentScore": 80,
  "gaps": ["gap 1"],
  "newCourseIdeas": [{"title": "title", "targetAudience": "audience", "estimatedDemand": "high|medium|low"}],
  "improvements": [{"target": "course/lesson", "suggestion": "suggestion", "priority": "high|medium|low"}]
}`,
    },
    student_risk: {
      ar: `حلل بيانات الطلاب وحدد المعرضين لخطر التسرب:

${metricsJson}

قدم:
1. تحديد أنماط السلوك الخطر
2. عدد الطلاب المعرضين للخطر
3. أسباب محتملة
4. استراتيجيات التدخل

أعد JSON:
{
  "atRiskCount": 0,
  "riskPatterns": ["نمط 1"],
  "causes": ["سبب 1"],
  "interventions": [{"strategy": "استراتيجية", "targetGroup": "المجموعة", "expectedOutcome": "النتيجة المتوقعة"}],
  "urgentActions": ["إجراء عاجل 1"]
}`,
      en: `Analyze student data and identify at-risk students:

${metricsJson}

Provide:
1. Risk behavior patterns
2. At-risk student count
3. Potential causes
4. Intervention strategies

Return JSON:
{
  "atRiskCount": 0,
  "riskPatterns": ["pattern 1"],
  "causes": ["cause 1"],
  "interventions": [{"strategy": "strategy", "targetGroup": "group", "expectedOutcome": "expected outcome"}],
  "urgentActions": ["urgent action 1"]
}`,
    },
    performance_summary: {
      ar: `قدم ملخصاً شاملاً لأداء المنصة:

${metricsJson}

قدم ملخصاً تنفيذياً يشمل:
1. نظرة عامة على الأداء
2. المؤشرات الرئيسية
3. الإنجازات
4. التحديات
5. الخطوات القادمة

أعد JSON:
{
  "overallScore": 85,
  "summary": "ملخص تنفيذي",
  "kpis": [{"name": "المؤشر", "value": 0, "change": 10, "status": "good|warning|critical"}],
  "achievements": ["إنجاز 1"],
  "challenges": ["تحدي 1"],
  "nextSteps": ["خطوة 1"]
}`,
      en: `Provide comprehensive platform performance summary:

${metricsJson}

Provide executive summary including:
1. Performance overview
2. Key indicators
3. Achievements
4. Challenges
5. Next steps

Return JSON:
{
  "overallScore": 85,
  "summary": "Executive summary",
  "kpis": [{"name": "indicator", "value": 0, "change": 10, "status": "good|warning|critical"}],
  "achievements": ["achievement 1"],
  "challenges": ["challenge 1"],
  "nextSteps": ["step 1"]
}`,
    },
    growth_opportunities: {
      ar: `حدد فرص النمو بناءً على البيانات:

${metricsJson}

قدم:
1. تحليل السوق والمنافسة
2. فرص التوسع
3. شرائح جديدة
4. خطة عمل

أعد JSON:
{
  "marketAnalysis": "تحليل السوق",
  "opportunities": [{"title": "فرصة", "potential": "high|medium|low", "investment": "low|medium|high", "timeline": "short|medium|long"}],
  "newSegments": [{"segment": "الشريحة", "size": "الحجم", "approach": "النهج"}],
  "actionPlan": [{"action": "الإجراء", "deadline": "الموعد", "owner": "المسؤول"}]
}`,
      en: `Identify growth opportunities based on data:

${metricsJson}

Provide:
1. Market and competition analysis
2. Expansion opportunities
3. New segments
4. Action plan

Return JSON:
{
  "marketAnalysis": "market analysis",
  "opportunities": [{"title": "opportunity", "potential": "high|medium|low", "investment": "low|medium|high", "timeline": "short|medium|long"}],
  "newSegments": [{"segment": "segment", "size": "size", "approach": "approach"}],
  "actionPlan": [{"action": "action", "deadline": "deadline", "owner": "owner"}]
}`,
    },
  };

  return prompts[type]?.[language] || prompts.performance_summary[language];
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `insight_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Get user
  const user = await getUserFromCookie();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول" },
      { status: 401 }
    );
  }

  // Admin only
  if (user.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "غير مصرح بالوصول" },
      { status: 403 }
    );
  }

  try {
    // Parse request
    const body: unknown = await request.json();
    const parseResult = InsightsRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { ok: false, error: "بيانات غير صالحة", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { type, timeRange, courseId, language }: InsightsRequest = parseResult.data;

    // Rate limiting
    const rateCheck = policy.checkRateLimit(user.id, "agent_request");
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { ok: false, error: "تم تجاوز الحد المسموح. حاول لاحقاً." },
        { status: 429 }
      );
    }

    // Gather metrics
    const metrics = await gatherPlatformMetrics(timeRange, courseId || undefined);

    // Build prompt
    const prompt = buildInsightsPrompt(type, metrics, language);
    const systemPrompt = language === "ar"
      ? "أنت محلل بيانات متخصص في منصات التعليم الإلكتروني. قدم رؤى عملية ودقيقة. أعد الإجابة بصيغة JSON فقط."
      : "You are a data analyst specialized in e-learning platforms. Provide actionable and accurate insights. Return only JSON.";

    // Call LLM client
    const llmResult = await llmClient.chatCompletion([
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ], {
      temperature: 0.3,
      maxTokens: 2000,
    });

    if (!llmResult.ok) {
      console.error("[Insights] LLM error:", llmResult.error);
      return NextResponse.json(
        { ok: false, error: "خدمة الذكاء الاصطناعي غير متاحة حالياً" },
        { status: 503 }
      );
    }

    const responseText = llmResult.content?.trim();

    if (!responseText) {
      return NextResponse.json(
        { ok: false, error: "فشل في إنشاء التقرير" },
        { status: 500 }
      );
    }

    // Parse insights
    let insights: Record<string, unknown>;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      insights = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    } catch {
      // Return raw text if JSON parsing fails
      insights = { rawAnalysis: responseText };
    }

    // Log telemetry
    telemetry.startRequest(requestId, `insights_${type}`, user.id);
    telemetry.endRequest(requestId, {
      tokenUsage: llmResult.usage || {
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: Math.ceil(responseText.length / 4),
        totalTokens: Math.ceil((prompt.length + responseText.length) / 4),
      },
    });

    // Audit log
    await audit.logToolExecution(requestId, {
      name: "admin_insights",
      params: { type, timeRange, courseId },
      result: { insightType: type },
      durationMs: Date.now() - startTime,
      success: true,
      userId: user.id,
    });

    return NextResponse.json({
      ok: true,
      data: {
        type,
        timeRange,
        insights,
        metrics,
        generatedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error("[Insights] Error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
