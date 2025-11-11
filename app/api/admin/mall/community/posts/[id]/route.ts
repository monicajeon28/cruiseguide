// app/api/admin/mall/community/posts/[id]/route.ts
// 관리자용 커뮤니티 게시글 삭제 API

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, phone: true },
    });

    // 관리자 권한 확인
    const isAdminUser = dbUser?.role === 'admin' && dbUser.phone && /^user(1[0]|[1-9])$/.test(dbUser.phone);
    const isSuperAdmin = dbUser?.role === 'admin' && dbUser.phone === '01024958013';

    if (!isAdminUser && !isSuperAdmin) {
      return NextResponse.json(
        { ok: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const postId = parseInt(params.id);

    if (isNaN(postId)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    // 게시글 존재 확인
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { ok: false, error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 게시글 삭제 (soft delete)
    await prisma.communityPost.update({
      where: { id: postId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      message: '게시글이 삭제되었습니다.',
    });
  } catch (error: any) {
    console.error('[ADMIN POST DELETE] Error:', error);
    return NextResponse.json(
      { ok: false, error: '게시글 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}




