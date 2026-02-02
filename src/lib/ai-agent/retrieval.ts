/**
 * AI Agent - Knowledge Retrieval
 * Database + optional vector-ready interface for semantic search
 */

import { db } from "@/lib/db";
import { retrievalCache } from "./cache";

// ============================================
// Retrieval Types
// ============================================

interface RetrievalResult {
  id: string;
  type: "course" | "lesson" | "faq" | "kb";
  title: string;
  content: string;
  excerpt: string;
  score: number;
  metadata?: Record<string, unknown>;
}

interface RetrievalOptions {
  limit?: number;
  types?: Array<"course" | "lesson" | "faq" | "kb">;
  courseId?: string;
  minScore?: number;
}

// ============================================
// Knowledge Base (Static FAQ)
// ============================================

interface KBEntry {
  keywords: string[];
  context: string;
  priority: number;
}

const KNOWLEDGE_BASE: KBEntry[] = [
  {
    keywords: ["تسجيل", "اشتراك", "حساب", "register", "signup", "account"],
    context: `معهد تبيان يوفر التسجيل المجاني. يمكن للطالب إنشاء حساب جديد من صفحة التسجيل.
الخطوات: 1) اضغط على "تسجيل جديد" 2) أدخل البريد الإلكتروني وكلمة المرور 3) أكد بريدك الإلكتروني.`,
    priority: 10,
  },
  {
    keywords: ["دورة", "دورات", "كورس", "course", "courses", "برنامج"],
    context: `معهد تبيان يقدم دورات في: القرآن الكريم، اللغة العربية، العلوم الإسلامية.
الدورات متاحة للأطفال السوريين والعرب في ألمانيا وأوروبا.
كل دورة تشمل: فيديوهات، اختبارات، شهادات إتمام.`,
    priority: 10,
  },
  {
    keywords: ["سعر", "أسعار", "تكلفة", "price", "pricing", "cost", "مجاني", "free"],
    context: `معهد تبيان يوفر محتوى مجاني وباقات مدفوعة.
الباقات المدفوعة تشمل: دورات متقدمة، متابعة شخصية، شهادات معتمدة.
للاطلاع على الأسعار: زيارة صفحة /pricing`,
    priority: 9,
  },
  {
    keywords: ["معلم", "مدرس", "أستاذ", "teacher", "instructor", "معلمين"],
    context: `معلمو معهد تبيان متخصصون في التعليم الإسلامي والعربي.
جميع المعلمين عرب ناطقون بالعربية الفصحى.
للتقديم كمعلم: زيارة صفحة /teacher`,
    priority: 8,
  },
  {
    keywords: ["شهادة", "certificate", "إتمام", "completion"],
    context: `يحصل الطالب على شهادة إتمام بعد إكمال الدورة واجتياز الاختبارات.
الشهادات قابلة للتحميل بصيغة PDF.
الشهادات تشمل: اسم الطالب، اسم الدورة، تاريخ الإتمام.`,
    priority: 8,
  },
  {
    keywords: ["تواصل", "دعم", "مساعدة", "contact", "support", "help", "واتساب", "whatsapp"],
    context: `للتواصل مع فريق الدعم:
- واتساب: متاح عبر الزر العائم في الموقع
- البريد الإلكتروني: متاح في صفحة التواصل
- الدردشة المباشرة: متاحة في الموقع`,
    priority: 7,
  },
  {
    keywords: ["تبيان", "tibyan", "معهد", "academy", "أكاديمية"],
    context: `معهد تبيان هو منصة تعليمية إسلامية وعربية للأطفال العرب في ألمانيا وأوروبا.
الهدف: تعليم القرآن الكريم واللغة العربية والعلوم الإسلامية.
الموقع يدعم: العربية، الإنجليزية، الألمانية، الفرنسية، الإسبانية، السويدية، التركية.`,
    priority: 10,
  },
  {
    keywords: ["لغة", "language", "عربي", "arabic", "ألماني", "german"],
    context: `الموقع يدعم 7 لغات: العربية (الأساسية)، الإنجليزية، الألمانية، الفرنسية، الإسبانية، السويدية، التركية.
المحتوى التعليمي باللغة العربية الفصحى.
يمكن تغيير لغة الواجهة من أعلى الصفحة.`,
    priority: 6,
  },
  {
    keywords: ["قرآن", "quran", "تجويد", "tajweed", "حفظ", "memorization"],
    context: `دورات القرآن الكريم في معهد تبيان تشمل:
- تعليم القراءة الصحيحة
- أحكام التجويد
- حفظ القرآن الكريم
- التفسير الميسر للأطفال
المعلمون متخصصون في تعليم القرآن للأطفال.`,
    priority: 10,
  },
  {
    keywords: ["طفل", "أطفال", "children", "kids", "صغار", "عمر", "age"],
    context: `برامج معهد تبيان مصممة للأطفال من عمر 5 إلى 16 سنة.
المحتوى مناسب لكل فئة عمرية.
الدروس تفاعلية ومشوقة للأطفال.`,
    priority: 8,
  },
];

// ============================================
// Retrieval Class
// ============================================

class AgentRetrieval {
  // ==========================================
  // Main Search Function
  // ==========================================

  /**
   * Search across all knowledge sources
   */
  async search(
    query: string,
    options: RetrievalOptions = {}
  ): Promise<RetrievalResult[]> {
    const { limit = 5, types, minScore = 0.3 } = options;

    // Check cache
    const cacheKey = `${query}:${JSON.stringify(options)}`;
    const cached = retrievalCache.get(cacheKey);
    if (cached) {
      return cached as unknown as RetrievalResult[];
    }

    const results: RetrievalResult[] = [];

    // Search knowledge base
    if (!types || types.includes("kb")) {
      const kbResults = this.searchKnowledgeBase(query);
      results.push(...kbResults);
    }

    // Search courses
    if (!types || types.includes("course")) {
      const courseResults = await this.searchCourses(query, options.courseId);
      results.push(...courseResults);
    }

    // Search lessons
    if (!types || types.includes("lesson")) {
      const lessonResults = await this.searchLessons(query, options.courseId);
      results.push(...lessonResults);
    }

    // Filter by minimum score and sort by score
    const filtered = results
      .filter((r) => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Cache results
    retrievalCache.set(query, filtered.map(r => r.content));

    return filtered;
  }

  // ==========================================
  // Knowledge Base Search
  // ==========================================

  /**
   * Search static knowledge base
   */
  searchKnowledgeBase(query: string): RetrievalResult[] {
    const lowerQuery = query.toLowerCase();
    const results: RetrievalResult[] = [];

    for (const entry of KNOWLEDGE_BASE) {
      const matchingKeywords = entry.keywords.filter((kw) =>
        lowerQuery.includes(kw.toLowerCase())
      );

      if (matchingKeywords.length > 0) {
        // Calculate score based on keyword matches and priority
        const keywordScore = matchingKeywords.length / entry.keywords.length;
        const priorityScore = entry.priority / 10;
        const score = (keywordScore * 0.6 + priorityScore * 0.4);

        results.push({
          id: `kb-${matchingKeywords[0]}`,
          type: "kb",
          title: matchingKeywords[0],
          content: entry.context,
          excerpt: entry.context.slice(0, 150) + "...",
          score,
          metadata: { keywords: matchingKeywords },
        });
      }
    }

    return results;
  }

  /**
   * Get knowledge base context for system prompt
   */
  getKnowledgeContext(query: string): string[] {
    const results = this.searchKnowledgeBase(query);
    return results.slice(0, 3).map((r) => r.content);
  }

  // ==========================================
  // Course Search
  // ==========================================

  /**
   * Search courses by query
   */
  async searchCourses(
    query: string,
    limitToCourseId?: string
  ): Promise<RetrievalResult[]> {
    const courses = await db.course.findMany({
      where: {
        status: "PUBLISHED",
        ...(limitToCourseId ? { id: limitToCourseId } : {}),
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        level: true,
        duration: true,
      },
      take: 5,
    });

    return courses.map((course: { id: string; title: string; description: string; level: string | null; duration: number | null }) => ({
      id: course.id,
      type: "course" as const,
      title: course.title,
      content: course.description,
      excerpt: course.description.slice(0, 150) + "...",
      score: this.calculateTextScore(query, `${course.title} ${course.description}`),
      metadata: {
        level: course.level,
        duration: course.duration,
      },
    }));
  }

  // ==========================================
  // Lesson Search
  // ==========================================

  /**
   * Search lessons by query
   */
  async searchLessons(
    query: string,
    limitToCourseId?: string
  ): Promise<RetrievalResult[]> {
    const lessons = await db.lesson.findMany({
      where: {
        ...(limitToCourseId ? { courseId: limitToCourseId } : {}),
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
        course: { status: "PUBLISHED" },
      },
      select: {
        id: true,
        title: true,
        content: true,
        description: true,
        courseId: true,
        order: true,
        course: {
          select: { title: true },
        },
      },
      take: 5,
    });

    return lessons.map((lesson: { id: string; title: string; content: string; description: string | null; courseId: string; order: number; course: { title: string } }) => ({
      id: lesson.id,
      type: "lesson" as const,
      title: lesson.title,
      content: lesson.content,
      excerpt: (lesson.description ?? lesson.content).slice(0, 150) + "...",
      score: this.calculateTextScore(
        query,
        `${lesson.title} ${lesson.content} ${lesson.description ?? ""}`
      ),
      metadata: {
        courseId: lesson.courseId,
        courseName: lesson.course.title,
        order: lesson.order,
      },
    }));
  }

  // ==========================================
  // Lesson Content Retrieval
  // ==========================================

  /**
   * Get full lesson content for summarization
   */
  async getLessonContent(lessonId: string): Promise<{
    title: string;
    content: string;
    courseName: string;
  } | null> {
    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      select: {
        title: true,
        content: true,
        description: true,
        course: {
          select: { title: true },
        },
      },
    });

    if (!lesson) return null;

    return {
      title: lesson.title,
      content: `${lesson.description ?? ""}\n\n${lesson.content}`,
      courseName: lesson.course.title,
    };
  }

  /**
   * Get course overview with lessons
   */
  async getCourseOverview(courseId: string): Promise<{
    title: string;
    description: string;
    lessons: Array<{ id: string; title: string; order: number }>;
    totalDuration: number;
  } | null> {
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: {
        title: true,
        description: true,
        duration: true,
        lessons: {
          select: {
            id: true,
            title: true,
            order: true,
            duration: true,
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!course) return null;

    interface LessonInfo {
      id: string;
      title: string;
      order: number;
      duration: number | null;
    }

    return {
      title: course.title,
      description: course.description,
      lessons: (course.lessons as LessonInfo[]).map((l: LessonInfo) => ({
        id: l.id,
        title: l.title,
        order: l.order,
      })),
      totalDuration:
        course.duration ??
        (course.lessons as LessonInfo[]).reduce((sum: number, l: LessonInfo) => sum + (l.duration ?? 0), 0),
    };
  }

  // ==========================================
  // User Progress Retrieval
  // ==========================================

  /**
   * Get user's enrolled courses with progress
   */
  async getUserEnrollments(userId: string): Promise<
    Array<{
      courseId: string;
      courseName: string;
      progress: number;
      status: string;
    }>
  > {
    const enrollments = await db.enrollment.findMany({
      where: { userId },
      select: {
        courseId: true,
        progress: true,
        status: true,
        course: {
          select: { title: true },
        },
      },
    });

    return enrollments.map((e: { courseId: string; progress: number; status: string; course: { title: string } }) => ({
      courseId: e.courseId,
      courseName: e.course.title,
      progress: e.progress,
      status: e.status,
    }));
  }

  // ==========================================
  // Vector Search Interface (Future)
  // ==========================================

  /**
   * Placeholder for vector similarity search
   * Can be implemented with pgvector, Pinecone, etc.
   */
  async vectorSearch(
    _embedding: number[],
    _options?: RetrievalOptions
  ): Promise<RetrievalResult[]> {
    // TODO: Implement vector search when infrastructure is ready
    // For now, return empty array
    console.log("[Retrieval] Vector search not yet implemented");
    return [];
  }

  /**
   * Placeholder for generating embeddings
   * Can be implemented with local model or API
   */
  async generateEmbedding(_text: string): Promise<number[]> {
    // TODO: Implement embedding generation
    console.log("[Retrieval] Embedding generation not yet implemented");
    return [];
  }

  // ==========================================
  // Helper Functions
  // ==========================================

  /**
   * Calculate simple text similarity score
   */
  private calculateTextScore(query: string, text: string): number {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const textLower = text.toLowerCase();

    let matches = 0;
    for (const term of queryTerms) {
      if (textLower.includes(term)) {
        matches++;
      }
    }

    return queryTerms.length > 0 ? matches / queryTerms.length : 0;
  }

  /**
   * Build system prompt context from retrieval results
   */
  buildContext(results: RetrievalResult[]): string {
    if (results.length === 0) return "";

    const contextParts = results.map((r) => {
      const header =
        r.type === "course"
          ? `[دورة: ${r.title}]`
          : r.type === "lesson"
            ? `[درس: ${r.title}]`
            : `[معلومة]`;

      return `${header}\n${r.excerpt}`;
    });

    return `\n\nمعلومات ذات صلة:\n${contextParts.join("\n\n")}`;
  }
}

// ============================================
// Global Retrieval Instance
// ============================================

export const retrieval = new AgentRetrieval();

// ============================================
// Exports
// ============================================

export { AgentRetrieval, KNOWLEDGE_BASE };
export type { RetrievalResult, RetrievalOptions, KBEntry };
