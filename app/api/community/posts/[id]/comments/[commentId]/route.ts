// app/api/community/posts/[id]/comments/[commentId]/route.ts
// 댓글 삭제 API

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { isMallAdmin, getMallAdminFeatureSettings } from '@/lib/mall-admin-permissions';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getSession();
    
    if (!session || !session.userId) {
      return NextResponse.json(
        { ok: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const postId = parseInt(params.id);
    const commentId = parseInt(params.commentId);

    if (isNaN(postId) || isNaN(commentId)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid post ID or comment ID' },
        { status: 400 }
      );
    }

    // 댓글 소유자 확인
    const comment = await prisma.communityComment.findUnique({
      where: { id: commentId },
      select: { userId: true, postId: true }
    });

    if (!comment) {
      return NextResponse.json(
        { ok: false, error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 게시글 ID 확인
    if (comment.postId !== postId) {
      return NextResponse.json(
        { ok: false, error: '댓글이 해당 게시글에 속하지 않습니다.' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.userId);
    
    // 관리자 user1~user10 확인 (phone이 "user1"~"user10"으로 시작하는 경우)
    const isAdminUser = await isMallAdmin(userId);

    // 본인 댓글이 아니고 관리자 user1~user10이 아니면 삭제 불가
    if (comment.userId !== userId && !isAdminUser) {
      return NextResponse.json(
        { ok: false, error: '본인의 댓글만 삭제할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 관리자인 경우 기능 설정 확인
    if (isAdminUser && comment.userId !== userId) {
      const featureSettings = await getMallAdminFeatureSettings(userId);
      if (!featureSettings.canDeleteComments) {
        return NextResponse.json(
          { ok: false, error: '커뮤니티 댓글 삭제 권한이 없습니다.' },
          { status: 403 }
        );
      }
    }

    // 댓글 삭제
    await prisma.communityComment.delete({
      where: { id: commentId }
    });

    // 게시글 댓글 수 업데이트 (실제 댓글 수로)
    const actualCommentCount = await prisma.communityComment.count({
      where: { postId: postId }
    });
    
    await prisma.communityPost.update({
      where: { id: postId },
      data: {
        comments: actualCommentCount
      }
    });

    return NextResponse.json({
      ok: true,
      message: '댓글이 삭제되었습니다.'
    });
  } catch (error: any) {
    console.error('[COMMENT DELETE] Error:', error);
    return NextResponse.json(
      { ok: false, error: '댓글 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

