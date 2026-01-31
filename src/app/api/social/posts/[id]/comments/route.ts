import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest, requireRole } from "@/lib/api-auth";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const CreateCommentSchema = z.object({
  content: z.string().min(1, "التعليق مطلوب").max(2000, "التعليق طويل جداً"),
  parentId: z.string().optional(),
});

const UpdateCommentSchema = z.object({
  commentId: z.string(),
  content: z.string().min(1, "التعليق مطلوب").max(2000, "التعليق طويل جداً"),
});

// GET /api/social/posts/[id]/comments - List comments
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const parentId = searchParams.get("parentId") || null;

    const user = await getUserFromRequest(request);
    const isAdmin = user?.role === "ADMIN";

    // Check if post exists
    const post = await db.post.findUnique({
      where: { id },
      select: { id: true, allowComments: true },
    });

    if (!post) {
      return NextResponse.json(
        { ok: false, error: "المنشور غير موجود" },
        { status: 404 }
      );
    }

    const where: Record<string, unknown> = { postId: id };
    
    // Only show approved comments unless admin
    if (!isAdmin) {
      where.status = "APPROVED";
    }
    
    if (parentId === null) {
      where.parentId = null; // Top-level comments only
    } else if (parentId) {
      where.parentId = parentId;
    }

    const [comments, total] = await Promise.all([
      db.postComment.findMany({
        where,
        include: {
          replies: {
            where: isAdmin ? {} : { status: "APPROVED" },
            orderBy: { createdAt: "asc" },
            include: {
              _count: { select: { likes: true } },
            },
          },
          _count: { select: { likes: true, replies: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.postComment.count({ where }),
    ]);

    // Get like status for authenticated user
    let userLikes: Set<string> = new Set();
    if (user) {
      const allCommentIds = [
        ...comments.map(c => c.id),
        ...comments.flatMap(c => c.replies.map(r => r.id)),
      ];
      
      const likes = await db.commentLike.findMany({
        where: {
          userId: user.id,
          commentId: { in: allCommentIds },
        },
        select: { commentId: true },
      });
      userLikes = new Set(likes.map(l => l.commentId));
    }

    const commentsWithLikes = comments.map(comment => ({
      ...comment,
      likesCount: comment._count.likes,
      repliesCount: comment._count.replies,
      isLiked: userLikes.has(comment.id),
      replies: comment.replies.map(reply => ({
        ...reply,
        likesCount: reply._count.likes,
        isLiked: userLikes.has(reply.id),
      })),
    }));

    return NextResponse.json({
      ok: true,
      data: {
        comments: commentsWithLikes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في جلب التعليقات" },
      { status: 500 }
    );
  }
}

// POST /api/social/posts/[id]/comments - Create comment
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول للتعليق" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validation = CreateCommentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { content, parentId } = validation.data;

    // Check if post exists and allows comments
    const post = await db.post.findUnique({
      where: { id },
      select: { id: true, allowComments: true },
    });

    if (!post) {
      return NextResponse.json(
        { ok: false, error: "المنشور غير موجود" },
        { status: 404 }
      );
    }

    if (!post.allowComments) {
      return NextResponse.json(
        { ok: false, error: "التعليقات معطلة لهذا المنشور" },
        { status: 403 }
      );
    }

    // If reply, check parent exists
    if (parentId) {
      const parent = await db.postComment.findUnique({
        where: { id: parentId },
        select: { id: true, postId: true },
      });
      
      if (!parent || parent.postId !== id) {
        return NextResponse.json(
          { ok: false, error: "التعليق الأصلي غير موجود" },
          { status: 404 }
        );
      }
    }

    // Get user info for denormalized fields
    const userData = await db.user.findUnique({
      where: { id: user.id },
      select: { name: true, avatar: true },
    });
    
    const authorName = userData?.name || user.name || "مستخدم";
    const authorAvatar = userData?.avatar || undefined;

    // Auto-approve for admins and instructors
    const status = user.role === "ADMIN" || user.role === "INSTRUCTOR" 
      ? "APPROVED" 
      : "PENDING";

    const comment = await db.postComment.create({
      data: {
        postId: id,
        authorId: user.id,
        authorName,
        authorAvatar,
        content,
        parentId,
        status,
      },
    });

    // Update comments count on post
    await db.post.update({
      where: { id },
      data: { commentsCount: { increment: 1 } },
    });

    return NextResponse.json({
      ok: true,
      data: {
        ...comment,
        likesCount: 0,
        isLiked: false,
        message: status === "PENDING" 
          ? "تم إرسال تعليقك وسيظهر بعد المراجعة" 
          : "تم نشر تعليقك",
      },
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في إضافة التعليق" },
      { status: 500 }
    );
  }
}

// PUT /api/social/posts/[id]/comments - Update comment
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "غير مصرح" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validation = UpdateCommentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { commentId, content } = validation.data;

    // Check ownership
    const comment = await db.postComment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true, postId: true },
    });

    if (!comment || comment.postId !== id) {
      return NextResponse.json(
        { ok: false, error: "التعليق غير موجود" },
        { status: 404 }
      );
    }

    if (comment.authorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "غير مصرح بتعديل هذا التعليق" },
        { status: 403 }
      );
    }

    const updated = await db.postComment.update({
      where: { id: commentId },
      data: { content },
    });

    return NextResponse.json({
      ok: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في تحديث التعليق" },
      { status: 500 }
    );
  }
}

// DELETE /api/social/posts/[id]/comments - Delete comment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "غير مصرح" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json(
        { ok: false, error: "معرف التعليق مطلوب" },
        { status: 400 }
      );
    }

    // Check ownership
    const comment = await db.postComment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true, postId: true },
    });

    if (!comment || comment.postId !== id) {
      return NextResponse.json(
        { ok: false, error: "التعليق غير موجود" },
        { status: 404 }
      );
    }

    if (comment.authorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "غير مصرح بحذف هذا التعليق" },
        { status: 403 }
      );
    }

    await db.postComment.delete({ where: { id: commentId } });

    // Update comments count on post
    await db.post.update({
      where: { id },
      data: { commentsCount: { decrement: 1 } },
    });

    return NextResponse.json({
      ok: true,
      data: { message: "تم حذف التعليق" },
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في حذف التعليق" },
      { status: 500 }
    );
  }
}
