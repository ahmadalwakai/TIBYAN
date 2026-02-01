import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateBlogPostSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  slug: z.string().min(1, "الرابط مطلوب"),
  content: z.string().min(1, "المحتوى مطلوب"),
  excerpt: z.string().optional(),
  styling: z.object({
    fontFamily: z.string().optional(),
    fontSize: z.string().optional(),
    fontColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    textAlign: z.string().optional(),
  }).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  visibility: z.enum(["PUBLIC", "MEMBERS_ONLY", "PRIVATE"]).default("PUBLIC"),
  featured: z.boolean().default(false),
  allowComments: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
  media: z.array(z.object({
    type: z.enum(["IMAGE", "VIDEO", "AUDIO", "DOCUMENT", "PDF"]),
    url: z.string().url(),
    filename: z.string().optional(),
    mimeType: z.string().optional(),
    fileSize: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    duration: z.number().optional(),
    caption: z.string().optional(),
    altText: z.string().optional(),
    order: z.number().default(0),
    styling: z.object({
      borderRadius: z.string().optional(),
      objectFit: z.string().optional(),
      aspectRatio: z.string().optional(),
    }).optional(),
  })).optional(),
});

const UpdateBlogPostSchema = CreateBlogPostSchema.partial().extend({
  id: z.string(),
});

// GET /api/blog/posts - List blog posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || undefined;
    const visibility = searchParams.get("visibility") || undefined;
    const search = searchParams.get("search") || undefined;

    // Get user for visibility filtering
    const user = await getUserFromRequest(request);
    
    // Build where clause
    const where: Record<string, unknown> = {};
    
    // For public access, only show published public posts
    if (!user) {
      where.status = "PUBLISHED";
      where.visibility = "PUBLIC";
    } else if (user.role === "ADMIN") {
      // Admin sees all
      if (status) where.status = status;
      if (visibility) where.visibility = visibility;
    } else {
      // Members see published public + members-only
      // Non-members see published public only
      if (user.role === "MEMBER") {
        where.OR = [
          { status: "PUBLISHED", visibility: { in: ["PUBLIC", "MEMBERS_ONLY"] } },
        ];
      } else {
        where.status = "PUBLISHED";
        where.visibility = "PUBLIC";
      }
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      db.blogPost.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, email: true, role: true },
          },
          media: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.blogPost.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { ok: false, error: "فشل في جلب المدونات" },
      { status: 500 }
    );
  }
}

// POST /api/blog/posts - Create blog post
export async function POST(request: NextRequest) {
  try {
    // Require admin role
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "يجب أن تكون مسؤولاً لإنشاء المدونات" },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const validation = CreateBlogPostSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { media, ...postData } = validation.data;

    // Check if slug is unique
    const existingPost = await db.blogPost.findUnique({
      where: { slug: postData.slug },
    });

    if (existingPost) {
      return NextResponse.json(
        { ok: false, error: "هذا الرابط مستخدم بالفعل" },
        { status: 409 }
      );
    }

    // Create blog post
    const blogPost = await db.blogPost.create({
      data: {
        ...postData,
        tags: postData.tags || [],
        authorId: user.id,
        media: {
          create: (media || []).map((m, index) => ({
            ...m,
            order: index,
          })),
        },
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        media: true,
      },
    });

    // Log audit
    await logAudit({
      actorUserId: user.id,
      action: "CREATE_BLOG_POST",
      entityType: "BLOG_POST",
      entityId: blogPost.id,
      metadata: { title: blogPost.title, visibility: blogPost.visibility },
    });

    return NextResponse.json(
      { ok: true, data: blogPost },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating blog post:", error);
    return NextResponse.json(
      { ok: false, error: "فشل في إنشاء المدونة" },
      { status: 500 }
    );
  }
}

// PUT /api/blog/posts - Update blog post
export async function PUT(request: NextRequest) {
  try {
    // Require admin role
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "يجب أن تكون مسؤولاً لتحديث المدونات" },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const validation = UpdateBlogPostSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { id, media, ...updateData } = validation.data;

    // Verify post exists
    const existingPost = await db.blogPost.findUnique({
      where: { id },
      include: { media: true },
    });

    if (!existingPost) {
      return NextResponse.json(
        { ok: false, error: "المدونة غير موجودة" },
        { status: 404 }
      );
    }

    // Check if slug is unique (and different from current)
    if (updateData.slug && updateData.slug !== existingPost.slug) {
      const duplicateSlug = await db.blogPost.findUnique({
        where: { slug: updateData.slug },
      });
      if (duplicateSlug) {
        return NextResponse.json(
          { ok: false, error: "هذا الرابط مستخدم بالفعل" },
          { status: 409 }
        );
      }
    }

    // Update blog post
    const updatedPost = await db.blogPost.update({
      where: { id },
      data: {
        ...updateData,
        media: media ? {
          deleteMany: {},
          create: media.map((m, index) => ({
            ...m,
            order: index,
          })),
        } : undefined,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        media: true,
      },
    });

    // Log audit
    await logAudit({
      actorUserId: user.id,
      action: "UPDATE_BLOG_POST",
      entityType: "BLOG_POST",
      entityId: id,
      metadata: { title: updatedPost.title, visibility: updatedPost.visibility },
    });

    return NextResponse.json({
      ok: true,
      data: updatedPost,
    });
  } catch (error) {
    console.error("Error updating blog post:", error);
    return NextResponse.json(
      { ok: false, error: "فشل في تحديث المدونة" },
      { status: 500 }
    );
  }
}

// DELETE /api/blog/posts - Delete blog post
export async function DELETE(request: NextRequest) {
  try {
    // Require admin role
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "يجب أن تكون مسؤولاً لحذف المدونات" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "معرّف المدونة مطلوب" },
        { status: 400 }
      );
    }

    // Verify post exists
    const existingPost = await db.blogPost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json(
        { ok: false, error: "المدونة غير موجودة" },
        { status: 404 }
      );
    }

    // Delete blog post
    await db.blogPost.delete({
      where: { id },
    });

    // Log audit
    await logAudit({
      actorUserId: user.id,
      action: "DELETE_BLOG_POST",
      entityType: "BLOG_POST",
      entityId: id,
      metadata: { title: existingPost.title },
    });

    return NextResponse.json({
      ok: true,
      data: { id },
    });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return NextResponse.json(
      { ok: false, error: "فشل في حذف المدونة" },
      { status: 500 }
    );
  }
}
