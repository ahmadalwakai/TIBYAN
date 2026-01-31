import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CreateUserSchema, UpdateUserSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";
import { requireAdmin, getAdminFromRequest } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

// Mock data for when database is not connected
const mockUsers = [
  {
    id: "1",
    email: "admin@tibyan.academy",
    name: "مدير النظام",
    role: "ADMIN",
    status: "ACTIVE",
    avatar: null,
    bio: "مدير منصة تبيان التعليمية",
    createdAt: new Date("2024-01-01"),
    lastActiveAt: new Date(),
    _count: { coursesCreated: 0, enrollments: 0 },
  },
  {
    id: "2",
    email: "mohamed@tibyan.academy",
    name: "د. محمد العبد",
    role: "INSTRUCTOR",
    status: "ACTIVE",
    avatar: null,
    bio: "متخصص في التفكير النقدي",
    createdAt: new Date("2024-01-15"),
    lastActiveAt: new Date(Date.now() - 3600000 * 2),
    _count: { coursesCreated: 3, enrollments: 0 },
  },
  {
    id: "3",
    email: "salma@tibyan.academy",
    name: "أ. سلمى يوسف",
    role: "INSTRUCTOR",
    status: "ACTIVE",
    avatar: null,
    bio: "معلمة الفقه والشريعة",
    createdAt: new Date("2024-01-20"),
    lastActiveAt: new Date(Date.now() - 86400000),
    _count: { coursesCreated: 2, enrollments: 0 },
  },
  {
    id: "4",
    email: "student1@example.com",
    name: "سارة أحمد",
    role: "STUDENT",
    status: "ACTIVE",
    avatar: null,
    bio: null,
    createdAt: new Date("2024-02-01"),
    lastActiveAt: new Date(Date.now() - 3600000),
    _count: { coursesCreated: 0, enrollments: 2 },
  },
  {
    id: "5",
    email: "student2@example.com",
    name: "أحمد محمود",
    role: "STUDENT",
    status: "SUSPENDED",
    avatar: null,
    bio: null,
    createdAt: new Date("2024-02-10"),
    lastActiveAt: new Date(Date.now() - 86400000 * 3),
    _count: { coursesCreated: 0, enrollments: 1 },
  },
];

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Check if database is connected
    if (!db.user) {
      // Return mock data
      let filteredUsers = [...mockUsers];

      if (role) {
        filteredUsers = filteredUsers.filter(u => u.role === role);
      }
      if (status) {
        filteredUsers = filteredUsers.filter(u => u.status === status);
      }
      if (search) {
        const searchLower = search.toLowerCase();
        filteredUsers = filteredUsers.filter(u => 
          u.name.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower)
        );
      }

      return NextResponse.json({ ok: true, data: filteredUsers });
    }

    const where: any = {};
    
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        avatar: true,
        bio: true,
        createdAt: true,
        lastActiveAt: true,
        _count: {
          select: {
            coursesCreated: true,
            enrollments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, data: users });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const validation = CreateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, name, password, role, status, bio } = validation.data;

    // Check if user already exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        status,
        bio,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        avatar: true,
        bio: true,
        createdAt: true,
      },
    });

    // Log audit
    const admin = await getAdminFromRequest(request);
    await logAudit({
      actorUserId: admin?.id,
      action: "USER_CREATE",
      entityType: "USER",
      entityId: user.id,
      metadata: { email: user.email, role: user.role },
    });

    return NextResponse.json({ ok: true, data: user }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}
