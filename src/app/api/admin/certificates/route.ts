import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

// Schema for creating a certificate
const createCertificateSchema = z.object({
  studentName: z.string().min(2, "اسم الطالب مطلوب"),
  studentNameEn: z.string().optional(),
  courseName: z.string().min(2, "اسم الدورة مطلوب"),
  courseNameEn: z.string().optional(),
  completionDate: z.string(),
  grade: z.string().optional(),
  score: z.number().min(0).max(100).optional(),
  certificateNumber: z.string().optional(),
  instructorName: z.string().optional(),
  courseDuration: z.string().optional(),
  templateType: z.enum(["classic", "modern", "elegant", "professional"]).default("classic"),
});

// GET - List certificates or get certificate by ID
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      // Get single certificate
      const certificate = await db.certificate.findUnique({
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

    // List certificates with pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const where = search
      ? {
          OR: [
            { studentName: { contains: search, mode: "insensitive" as const } },
            { courseName: { contains: search, mode: "insensitive" as const } },
            { certificateNumber: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [certificates, total] = await Promise.all([
      db.certificate.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.certificate.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        certificates,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
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
      return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createCertificateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Generate certificate number if not provided
    const certificateNumber =
      data.certificateNumber ||
      `TBY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const certificate = await db.certificate.create({
      data: {
        studentName: data.studentName,
        studentNameEn: data.studentNameEn,
        courseName: data.courseName,
        courseNameEn: data.courseNameEn,
        completionDate: new Date(data.completionDate),
        grade: data.grade,
        score: data.score,
        certificateNumber,
        instructorName: data.instructorName,
        courseDuration: data.courseDuration,
        templateType: data.templateType,
        issuedBy: admin.id,
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

// DELETE - Delete certificate
export async function DELETE(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "معرف الشهادة مطلوب" },
        { status: 400 }
      );
    }

    const existing = await db.certificate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "الشهادة غير موجودة" },
        { status: 404 }
      );
    }

    await db.certificate.delete({ where: { id } });

    await logAudit({
      actorUserId: admin.id,
      action: "CERTIFICATE_DELETE",
      entityType: "CERTIFICATE",
      entityId: id,
      metadata: {
        studentName: existing.studentName,
        courseName: existing.courseName,
      },
    });

    return NextResponse.json({ ok: true, data: { deleted: true } });
  } catch (error) {
    console.error("Error deleting certificate:", error);
    return NextResponse.json(
      { ok: false, error: "فشل في حذف الشهادة" },
      { status: 500 }
    );
  }
}
