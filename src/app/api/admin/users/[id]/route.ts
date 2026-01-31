import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UpdateUserSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";
import { requireAdmin, getAdminFromRequest } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

// GET /api/admin/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        avatar: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
        lastActiveAt: true,
        _count: {
          select: {
            coursesCreated: true,
            enrollments: true,
            reviews: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: user });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    const validation = UpdateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data: any = { ...validation.data };

    // Hash password if provided
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const user = await db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        avatar: true,
        bio: true,
        updatedAt: true,
      },
    });

    // Log audit
    const admin = await getAdminFromRequest(request);
    const action = data.status ? "USER_STATUS_CHANGE" : data.role ? "USER_ROLE_CHANGE" : "USER_UPDATE";
    await logAudit({
      actorUserId: admin?.id,
      action,
      entityType: "USER",
      entityId: user.id,
      metadata: { changes: Object.keys(data) },
    });

    return NextResponse.json({ ok: true, data: user });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    
    // Get user info before deleting for audit log
    const userToDelete = await db.user.findUnique({
      where: { id },
      select: { email: true, name: true, role: true },
    });

    await db.user.delete({
      where: { id },
    });

    // Log audit
    const admin = await getAdminFromRequest(request);
    await logAudit({
      actorUserId: admin?.id,
      action: "USER_DELETE",
      entityType: "USER",
      entityId: id,
      metadata: { deletedUser: userToDelete },
    });

    return NextResponse.json({ ok: true, data: { message: "User deleted successfully" } });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}
