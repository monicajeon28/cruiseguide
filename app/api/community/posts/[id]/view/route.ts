// app/api/community/posts/[id]/view/route.ts
// 게시글 조회수 증가 API (실시간 업데이트용)

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

    // 조회수 증가
    const updatedPost = await prisma.communityPost.update({
      where: { id: postId },
      data: { views: { increment: 1 } },
      select: { views: true }
    });

    return NextResponse.json({
      ok: true,
      views: updatedPost.views
    });
  } catch (error: any) {
    console.error('[POST VIEW] Error:', error);
    return NextResponse.json(
      { ok: false, error: '조회수 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 현재 조회수 조회
export async function GET(
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

    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      select: { views: true }
    });

    if (!post) {
      return NextResponse.json(
        { ok: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      views: post.views
    });
  } catch (error: any) {
    console.error('[POST VIEW GET] Error:', error);
    return NextResponse.json(
      { ok: false, error: '조회수를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}













