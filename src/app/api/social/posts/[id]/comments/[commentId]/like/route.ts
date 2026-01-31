import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/api-auth";

interface RouteParams {
  params: Promise<{ id: string; commentId: string }>;
}

// POST /api/social/posts/[id]/comments/[commentId]/like - Like/unlike comment
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id, commentId } = await params;
  
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول للإعجاب" },
      { status: 401 }
    );
  }

  try {
    // Check if comment exists
    const comment = await db.postComment.findUnique({
      where: { id: commentId },
      select: { id: true, postId: true, likesCount: true },
    });

    if (!comment || comment.postId !== id) {
      return NextResponse.json(
        { ok: false, error: "التعليق غير موجود" },
        { status: 404 }
      );
    }

    // Check if already liked
    const existingLike = await db.commentLike.findUnique({
      where: { commentId_userId: { commentId, userId: user.id } },
    });

    if (existingLike) {
      // Unlike
      await db.commentLike.delete({
        where: { commentId_userId: { commentId, userId: user.id } },
      });
      
      await db.postComment.update({
        where: { id: commentId },
        data: { likesCount: { decrement: 1 } },
      });

      return NextResponse.json({
        ok: true,
        data: { liked: false, likesCount: comment.likesCount - 1 },
      });
    } else {
      // Like
      await db.commentLike.create({
        data: { commentId, userId: user.id },
      });
      
      await db.postComment.update({
        where: { id: commentId },
        data: { likesCount: { increment: 1 } },
      });

      return NextResponse.json({
        ok: true,
        data: { liked: true, likesCount: comment.likesCount + 1 },
      });
    }
  } catch (error) {
    console.error("Error toggling comment like:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ" },
      { status: 500 }
    );
  }
}
