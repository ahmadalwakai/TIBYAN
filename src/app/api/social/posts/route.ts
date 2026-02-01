import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest, requireRole } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreatePostSchema = z.object({
  title: z.string().optional(),
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
  visibility: z.enum(["PUBLIC", "TEACHERS_ONLY", "PRIVATE"]).default("PUBLIC"),
  isPinned: z.boolean().default(false),
  allowComments: z.boolean().default(true),
  allowLikes: z.boolean().default(true),
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

const UpdatePostSchema = CreatePostSchema.partial().extend({
  id: z.string(),
});

// GET /api/social/posts - List posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || undefined;
    const authorId = searchParams.get("authorId") || undefined;
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
    } else if (user.role === "INSTRUCTOR") {
      // Teachers see published public + teachers-only + their own
      where.OR = [
        { status: "PUBLISHED", visibility: { in: ["PUBLIC", "TEACHERS_ONLY"] } },
        { authorId: user.id },
      ];
    } else {
      // Students see published public only
      where.status = "PUBLISHED";
      where.visibility = "PUBLIC";
    }

    if (authorId) where.authorId = authorId;
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const [posts, total] = await Promise.all([
      db.post.findMany({
        where,
        include: {
          media: {
            orderBy: { order: "asc" },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
        orderBy: [
          { isPinned: "desc" },
          { publishedAt: "desc" },
          { createdAt: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.post.count({ where }),
    ]);

    // Get like status for authenticated user
    let userLikes: Set<string> = new Set();
    if (user) {
      const likes = await db.postLike.findMany({
        where: {
          userId: user.id,
          postId: { in: posts.map(p => p.id) },
        },
        select: { postId: true },
      });
      userLikes = new Set(likes.map(l => l.postId));
    }

    const postsWithLikeStatus = posts.map(post => ({
      ...post,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      isLiked: userLikes.has(post.id),
    }));

    return NextResponse.json({
      ok: true,
      data: {
        posts: postsWithLikeStatus,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في جلب المنشورات" },
      { status: 500 }
    );
  }
}

// POST /api/social/posts - Create post
export async function POST(request: NextRequest) {
  // Allow admins, instructors, and members to create posts
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول أولاً" },
      { status: 401 }
    );
  }

  // Check if user has permission to create posts
  if (!["ADMIN", "INSTRUCTOR", "MEMBER"].includes(user.role)) {
    return NextResponse.json(
      { ok: false, error: "ليس لديك صلاحية إنشاء منشورات. يرجى التسجيل كعضو." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const validation = CreatePostSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Determine author type based on role
    let authorType: "ADMIN" | "INSTRUCTOR" | "MEMBER" = "MEMBER";
    if (user.role === "ADMIN") authorType = "ADMIN";
    else if (user.role === "INSTRUCTOR") authorType = "INSTRUCTOR";

    // Create post with media
    const post = await db.post.create({
      data: {
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        styling: data.styling || {},
        authorId: user.id,
        authorType: authorType,
        status: data.status,
        visibility: data.visibility,
        isPinned: user.role === "ADMIN" ? data.isPinned : false, // Only admin can pin
        allowComments: data.allowComments,
        allowLikes: data.allowLikes,
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
        media: data.media && data.media.length > 0 ? {
          create: data.media.map((m, index) => ({
            type: m.type,
            url: m.url,
            filename: m.filename,
            mimeType: m.mimeType,
            fileSize: m.fileSize,
            width: m.width,
            height: m.height,
            duration: m.duration,
            caption: m.caption,
            altText: m.altText,
            order: m.order ?? index,
            styling: m.styling || {},
          })),
        } : undefined,
      },
      include: {
        media: true,
      },
    });

    // Log audit
    await logAudit({
      actorUserId: user.id,
      action: "NOTIFICATION_CREATE", // Using existing action type
      entityType: "NOTIFICATION",
      entityId: post.id,
      metadata: { type: "post_create", title: data.title, authorType },
    });

    return NextResponse.json({
      ok: true,
      data: post,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في إنشاء المنشور" },
      { status: 500 }
    );
  }
}

// PUT /api/social/posts - Update post
export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "غير مصرح" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validation = UpdatePostSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { id, media, ...data } = validation.data;

    // Check ownership
    const existingPost = await db.post.findUnique({
      where: { id },
      include: { media: true },
    });

    if (!existingPost) {
      return NextResponse.json(
        { ok: false, error: "المنشور غير موجود" },
        { status: 404 }
      );
    }

    // Only author or admin can edit
    if (existingPost.authorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "غير مصرح بتعديل هذا المنشور" },
        { status: 403 }
      );
    }

    // Update post
    const updateData: Record<string, unknown> = { ...data };
    
    // Handle publishing
    if (data.status === "PUBLISHED" && existingPost.status !== "PUBLISHED") {
      updateData.publishedAt = new Date();
    }
    
    // Only admin can pin
    if (user.role !== "ADMIN") {
      delete updateData.isPinned;
    }

    const post = await db.post.update({
      where: { id },
      data: updateData,
      include: { media: true },
    });

    // Update media if provided
    if (media !== undefined) {
      // Delete old media
      await db.postMedia.deleteMany({ where: { postId: id } });
      
      // Create new media
      if (media.length > 0) {
        await db.postMedia.createMany({
          data: media.map((m, index) => ({
            postId: id,
            type: m.type,
            url: m.url,
            filename: m.filename,
            mimeType: m.mimeType,
            fileSize: m.fileSize,
            width: m.width,
            height: m.height,
            duration: m.duration,
            caption: m.caption,
            altText: m.altText,
            order: m.order ?? index,
            styling: m.styling || {},
          })),
        });
      }
    }

    // Fetch updated post with media
    const updatedPost = await db.post.findUnique({
      where: { id },
      include: { media: true },
    });

    return NextResponse.json({
      ok: true,
      data: updatedPost,
    });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في تحديث المنشور" },
      { status: 500 }
    );
  }
}

// DELETE /api/social/posts - Delete post
export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "غير مصرح" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "معرف المنشور مطلوب" },
        { status: 400 }
      );
    }

    // Check ownership
    const post = await db.post.findUnique({ where: { id } });

    if (!post) {
      return NextResponse.json(
        { ok: false, error: "المنشور غير موجود" },
        { status: 404 }
      );
    }

    // Only author or admin can delete
    if (post.authorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "غير مصرح بحذف هذا المنشور" },
        { status: 403 }
      );
    }

    await db.post.delete({ where: { id } });

    // Log audit
    await logAudit({
      actorUserId: user.id,
      action: "NOTIFICATION_DELETE",
      entityType: "NOTIFICATION",
      entityId: id,
      metadata: { type: "post_delete" },
    });

    return NextResponse.json({
      ok: true,
      data: { message: "تم حذف المنشور بنجاح" },
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في حذف المنشور" },
      { status: 500 }
    );
  }
}
