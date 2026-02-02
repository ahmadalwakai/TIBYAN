import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import {
  CreateCertificateSchema,
  CertificateFilterSchema,
} from "@/lib/validations";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - List certificates or get certificate by ID
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: "غير مصرح" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      // Validate ID is a valid CUID
      if (!id.match(/^[a-z0-9]{25}$/)) {
        return NextResponse.json(
          { ok: false, error: "معرف غير صالح" },
          { status: 400 }
        );
      }

      // Get single certificate
      const certificate = await prisma.certificate.findUnique({
        where: { id },
        include: {
          user: { select: { name: true, email: true } },
          course: { select: { title: true } },
        },
      });

      if (!certificate) {
        return NextResponse.json(
          { ok: false, error: "الشهادة غير موجودة" },
          { status: 404 }
        );
      }

      return NextResponse.json({ ok: true, data: certificate });
    }

    // List certificates - validate query params with Zod
    const filterParams = {
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search"),
      sortBy: searchParams.get("sortBy"),
      sortOrder: searchParams.get("sortOrder"),
    };

    const filterValidation = CertificateFilterSchema.safeParse(filterParams);
    if (!filterValidation.success) {
      const firstError = filterValidation.error.issues[0];
      return NextResponse.json(
        { ok: false, error: `Invalid parameter: ${String(firstError.path[0])}` },
        { status: 400 }
      );
    }

    const filters = filterValidation.data;

    // Validate page and limit ranges
    if (filters.page < 1) {
      return NextResponse.json(
        { ok: false, error: "Page must be >= 1" },
        { status: 400 }
      );
    }
    if (filters.limit < 1 || filters.limit > 100) {
      return NextResponse.json(
        { ok: false, error: "Limit must be between 1 and 100" },
        { status: 400 }
      );
    }

    const where = filters.search
      ? {
          OR: [
            {
              studentName: { contains: filters.search, mode: "insensitive" as const },
            },
            {
              courseName: { contains: filters.search, mode: "insensitive" as const },
            },
            {
              certificateNumber: { contains: filters.search, mode: "insensitive" as const },
            },
          ],
        }
      : {};

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        orderBy: { [filters.sortBy || "createdAt"]: filters.sortOrder },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        include: {
          user: { select: { name: true, email: true } },
          course: { select: { title: true } },
        },
      }),
      prisma.certificate.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        certificates,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages: Math.ceil(total / filters.limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    return NextResponse.json(
      { ok: false, error: "فشل في جلب الشهادات" },
      { status: 500 }
    );
  }
}

// POST - Create new certificate
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: "غير مصرح" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = CreateCertificateSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { ok: false, error: firstError.message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Generate certificate number if not provided
    const certificateNumber =
      data.certificateNumber ||
      `TBY-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`;

    // Ensure certificate number is unique
    const existing = await prisma.certificate.findUnique({
      where: { certificateNumber },
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "رقم الشهادة مستخدم بالفعل" },
        { status: 400 }
      );
    }

    const certificate = await prisma.certificate.create({
      data: {
        studentName: data.studentName,
        studentNameEn: data.studentNameEn || null,
        courseName: data.courseName,
        courseNameEn: data.courseNameEn || null,
        completionDate: new Date(data.completionDate),
        grade: data.grade || null,
        score: data.score || null,
        certificateNumber,
        instructorName: data.instructorName || null,
        courseDuration: data.courseDuration || null,
        templateType: data.templateType,
        userId: data.userId || null,
        courseId: data.courseId || null,
        issuedBy: admin.id,
      },
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } },
      },
    });

    await logAudit({
      actorUserId: admin.id,
      action: "CERTIFICATE_CREATE",
      entityType: "CERTIFICATE",
      entityId: certificate.id,
      metadata: {
        studentName: data.studentName,
        courseName: data.courseName,
        certificateNumber,
      },
    });

    return NextResponse.json({ ok: true, data: certificate }, { status: 201 });
  } catch (error) {
    console.error("Error creating certificate:", error);
    return NextResponse.json(
      { ok: false, error: "فشل في إنشاء الشهادة" },
      { status: 500 }
    );
  }
}

