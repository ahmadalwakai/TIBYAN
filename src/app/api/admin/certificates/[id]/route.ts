import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { UpdateCertificateSchema } from "@/lib/validations";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/certificates/[id]
 * Update an existing certificate
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: "غير مصرح" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validate ID is a valid CUID
    if (!id.match(/^[a-z0-9]{25}$/)) {
      return NextResponse.json(
        { ok: false, error: "معرف غير صالح" },
        { status: 400 }
      );
    }

    // Check if certificate exists
    const existing = await prisma.certificate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "الشهادة غير موجودة" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = UpdateCertificateSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { ok: false, error: firstError.message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Build update data - only include provided fields
    const updateData: Record<string, unknown> = {};
    if (data.studentName !== undefined) updateData.studentName = data.studentName;
    if (data.studentNameEn !== undefined) updateData.studentNameEn = data.studentNameEn;
    if (data.courseName !== undefined) updateData.courseName = data.courseName;
    if (data.courseNameEn !== undefined) updateData.courseNameEn = data.courseNameEn;
    if (data.completionDate !== undefined)
      updateData.completionDate = new Date(data.completionDate);
    if (data.grade !== undefined) updateData.grade = data.grade;
    if (data.score !== undefined) updateData.score = data.score;
    if (data.instructorName !== undefined) updateData.instructorName = data.instructorName;
    if (data.courseDuration !== undefined) updateData.courseDuration = data.courseDuration;
    if (data.templateType !== undefined) updateData.templateType = data.templateType;

    const certificate = await prisma.certificate.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } },
      },
    });

    await logAudit({
      actorUserId: admin.id,
      action: "CERTIFICATE_CREATE", // Using CREATE since no UPDATE action exists
      entityType: "CERTIFICATE",
      entityId: certificate.id,
      metadata: {
        studentName: certificate.studentName,
        courseName: certificate.courseName,
        updated: true,
      },
    });

    return NextResponse.json({ ok: true, data: certificate });
  } catch (error) {
    console.error("Error updating certificate:", error);
    return NextResponse.json(
      { ok: false, error: "فشل في تحديث الشهادة" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/certificates/[id]
 * Delete a certificate
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: "غير مصرح" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validate ID is a valid CUID
    if (!id.match(/^[a-z0-9]{25}$/)) {
      return NextResponse.json(
        { ok: false, error: "معرف غير صالح" },
        { status: 400 }
      );
    }

    const existing = await prisma.certificate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "الشهادة غير موجودة" },
        { status: 404 }
      );
    }

    await prisma.certificate.delete({ where: { id } });

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
