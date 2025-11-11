// app/api/community/posts/[id]/like/route.ts
// 게시글 좋아요 API

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const postId = parseInt(params.id);

    if (isNaN(postId)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    // 게시글 존재 확인
    const post = await prisma.communityPost.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return NextResponse.json(
        { ok: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // 좋아요 수 증가
    const updatedPost = await prisma.communityPost.update({
      where: { id: postId },
      data: { likes: { increment: 1 } },
      select: { likes: true }
    });

    return NextResponse.json({
      ok: true,
      likes: updatedPost.likes
    });
  } catch (error: any) {
    console.error('[POST LIKE] Error:', error);
    return NextResponse.json(
      { ok: false, error: '좋아요 처리에 실패했습니다.' },
      { status: 500 }
    );
  }
}

























