import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/api-auth";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/teacher/lessons/available-students - Get students available for lesson invitations
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول" },
      { status: 401 }
    );
  }

  if (user.role !== "INSTRUCTOR" && user.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "هذه الصفحة للمعلمين فقط" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const excludeIds = searchParams.get("exclude")?.split(",").filter(Boolean) || [];
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  try {
    // Get students (and optionally other roles who might need to join)
    const students = await db.user.findMany({
      where: {
        role: { in: ["STUDENT", "INSTRUCTOR", "ADMIN"] },
        status: "ACTIVE",
        id: { notIn: [...excludeIds, user.id] }, // Exclude self
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: [
        { role: "asc" }, // Students first
        { name: "asc" },
      ],
      take: limit,
    });

    return NextResponse.json({ ok: true, data: students });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ" },
      { status: 500 }
    );
  }
}
