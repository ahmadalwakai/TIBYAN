import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/api-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/social/posts/[id]/like - Like/unlike post
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول للإعجاب" },
      { status: 401 }
    );
  }

  try {
    // Check if post exists and allows likes
    const post = await db.post.findUnique({
      where: { id },
      select: { id: true, allowLikes: true, likesCount: true },
    });

    if (!post) {
      return NextResponse.json(
        { ok: false, error: "المنشور غير موجود" },
        { status: 404 }
      );
    }

    if (!post.allowLikes) {
      return NextResponse.json(
        { ok: false, error: "الإعجابات معطلة لهذا المنشور" },
        { status: 403 }
      );
    }

    // Check if already liked
    const existingLike = await db.postLike.findUnique({
      where: { postId_userId: { postId: id, userId: user.id } },
    });

    if (existingLike) {
      // Unlike
      await db.postLike.delete({
        where: { postId_userId: { postId: id, userId: user.id } },
      });
      
      await db.post.update({
        where: { id },
        data: { likesCount: { decrement: 1 } },
      });

      return NextResponse.json({
        ok: true,
        data: { liked: false, likesCount: post.likesCount - 1 },
      });
    } else {
      // Like
      await db.postLike.create({
        data: { postId: id, userId: user.id },
      });
      
      await db.post.update({
        where: { id },
        data: { likesCount: { increment: 1 } },
      });

      return NextResponse.json({
        ok: true,
        data: { liked: true, likesCount: post.likesCount + 1 },
      });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ" },
      { status: 500 }
    );
  }
}
