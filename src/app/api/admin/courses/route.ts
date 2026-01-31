import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CreateCourseSchema, UpdateCourseSchema } from "@/lib/validations";
import { allCourses, teachers } from "@/content/courses.ar";
import { requireAdmin } from "@/lib/api-auth";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Mock data for when database is not connected - using real educational content
const mockCourses = [
  {
    id: "prep-1",
    title: allCourses[0].name,
    slug: allCourses[0].slug,
    description: allCourses[0].description,
    thumbnail: null,
    status: "PUBLISHED",
    price: allCourses[0].price,
    duration: allCourses[0].totalSessions * 60, // in minutes
    level: "BEGINNER",
    instructorId: "t1",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-25"),
    publishedAt: new Date("2024-01-25"),
    instructor: {
      id: teachers[0].id,
      name: teachers[0].name,
      email: "ahmad@tibyan.academy",
      avatar: null,
    },
    _count: {
      lessons: allCourses[0].totalSessions,
      enrollments: 45,
      reviews: 12,
    },
  },
  {
    id: "shariah-1",
    title: allCourses[1].name,
    slug: allCourses[1].slug,
    description: allCourses[1].description,
    thumbnail: null,
    status: "PUBLISHED",
    price: allCourses[1].price,
    duration: allCourses[1].totalSessions * 60,
    level: "INTERMEDIATE",
    instructorId: "t3",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-10"),
    publishedAt: new Date("2024-02-10"),
    instructor: {
      id: teachers[2].id,
      name: teachers[2].name,
      email: "omar@tibyan.academy",
      avatar: null,
    },
    _count: {
      lessons: allCourses[1].totalSessions,
      enrollments: 38,
      reviews: 9,
    },
  },
  {
    id: "arabic-reading-1",
    title: allCourses[4].name,
    slug: allCourses[4].slug,
    description: allCourses[4].description,
    thumbnail: null,
    status: "REVIEW",
    price: allCourses[4].price,
    duration: allCourses[4].totalSessions * 60,
    level: "BEGINNER",
    instructorId: "t5",
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-20"),
    publishedAt: null,
    instructor: {
      id: teachers[4].id,
      name: teachers[4].name,
      email: "khaled@tibyan.academy",
      avatar: null,
    },
    _count: {
      lessons: allCourses[4].totalSessions,
      enrollments: 0,
      reviews: 0,
    },
  },
  {
    id: "shariah-2",
    title: allCourses[2].name,
    slug: allCourses[2].slug,
    description: allCourses[2].description,
    thumbnail: null,
    status: "PUBLISHED",
    price: allCourses[2].price,
    duration: allCourses[2].totalSessions * 60,
    level: "ADVANCED",
    instructorId: "t7",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
    publishedAt: new Date("2024-01-20"),
    instructor: {
      id: teachers[6].id,
      name: teachers[6].name,
      email: "youssef@tibyan.academy",
      avatar: null,
    },
    _count: {
      lessons: allCourses[2].totalSessions,
      enrollments: 22,
      reviews: 7,
    },
  },
  {
    id: "shariah-3",
    title: allCourses[3].name,
    slug: allCourses[3].slug,
    description: allCourses[3].description,
    thumbnail: null,
    status: "PUBLISHED",
    price: allCourses[3].price,
    duration: allCourses[3].totalSessions * 60,
    level: "ADVANCED",
    instructorId: "t9",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-15"),
    publishedAt: new Date("2024-01-15"),
    instructor: {
      id: teachers[8].id,
      name: teachers[8].name,
      email: "abdulrahman@tibyan.academy",
      avatar: null,
    },
    _count: {
      lessons: allCourses[3].totalSessions,
      enrollments: 15,
      reviews: 5,
    },
  },
];

// GET /api/admin/courses - List all courses
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const level = searchParams.get("level");
    const search = searchParams.get("search");

    // Check if database is connected
    if (!db.course) {
      // Return mock data
      let filteredCourses = [...mockCourses];

      if (status) {
        filteredCourses = filteredCourses.filter(c => c.status === status);
      }
      if (level) {
        filteredCourses = filteredCourses.filter(c => c.level === level);
      }
      if (search) {
        const searchLower = search.toLowerCase();
        filteredCourses = filteredCourses.filter(c => 
          c.title.toLowerCase().includes(searchLower) ||
          c.description.toLowerCase().includes(searchLower)
        );
      }

      return NextResponse.json({ ok: true, data: filteredCourses });
    }

    const where: any = {};
    
    if (status) where.status = status;
    if (level) where.level = level;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const courses = await db.course.findMany({
      where,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            lessons: true,
            enrollments: true,
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, data: courses });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

// POST /api/admin/courses - Create new course
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const validation = CreateCourseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if slug is unique
    const existing = await db.course.findUnique({ where: { slug: data.slug } });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Course with this slug already exists" },
        { status: 400 }
      );
    }

    const course = await db.course.create({
      data,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, data: course }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to create course" },
      { status: 500 }
    );
  }
}
