import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/api-auth";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/social/posts/[id] - Get single post
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  try {
    const user = await getUserFromRequest(request);

    const post = await db.post.findUnique({
      where: { id },
      include: {
        media: {
          orderBy: { order: "asc" },
        },
        comments: {
          where: { status: "APPROVED", parentId: null },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            replies: {
              where: { status: "APPROVED" },
              orderBy: { createdAt: "asc" },
            },
            _count: {
              select: { likes: true },
            },
          },
        },
        _count: {
          select: {
            comments: { where: { status: "APPROVED" } },
            likes: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { ok: false, error: "المنشور غير موجود" },
        { status: 404 }
      );
    }

    // Check visibility permissions
    if (post.status !== "PUBLISHED") {
      if (!user || (user.id !== post.authorId && user.role !== "ADMIN")) {
        return NextResponse.json(
          { ok: false, error: "المنشور غير متاح" },
          { status: 403 }
        );
      }
    }

    if (post.visibility === "TEACHERS_ONLY") {
      if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
        return NextResponse.json(
          { ok: false, error: "هذا المنشور للمعلمين فقط" },
          { status: 403 }
        );
      }
    }

    if (post.visibility === "PRIVATE" && (!user || user.id !== post.authorId && user.role !== "ADMIN")) {
      return NextResponse.json(
        { ok: false, error: "منشور خاص" },
        { status: 403 }
      );
    }

    // Increment view count
    await db.post.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    });

    // Check if user liked the post
    let isLiked = false;
    if (user) {
      const like = await db.postLike.findUnique({
        where: { postId_userId: { postId: id, userId: user.id } },
      });
      isLiked = !!like;
    }

    return NextResponse.json({
      ok: true,
      data: {
        ...post,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        isLiked,
      },
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في جلب المنشور" },
      { status: 500 }
    );
  }
}
