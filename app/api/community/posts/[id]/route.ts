// app/api/community/posts/[id]/route.ts
// 커뮤니티 게시글 상세 조회 및 삭제 API

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { isMallAdmin, getMallAdminFeatureSettings } from '@/lib/mall-admin-permissions';

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

    // 게시글 조회 (삭제되지 않은 게시글만)
    const post = await prisma.communityPost.findUnique({
      where: {
        id: postId,
        isDeleted: false
      },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        authorName: true,
        images: true,
        views: true,
        likes: true,
        comments: true,
        userId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!post) {
      return NextResponse.json(
        { ok: false, error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이미지 배열 처리
    let images: any[] = [];
    try {
      if (post.images) {
        if (typeof post.images === 'string') {
          images = JSON.parse(post.images);
        } else if (Array.isArray(post.images)) {
          images = post.images;
        } else if (typeof post.images === 'object') {
          images = [post.images];
        }
      }
    } catch (e) {
      console.error('[POST DETAIL] Error parsing images:', e);
      images = [];
    }

    // 날짜 형식 변환
    const formattedPost = {
      ...post,
      images: images,
      createdAt: post.createdAt instanceof Date 
        ? post.createdAt.toISOString() 
        : (typeof post.createdAt === 'string' ? post.createdAt : new Date(post.createdAt).toISOString()),
      updatedAt: post.updatedAt instanceof Date 
        ? post.updatedAt.toISOString() 
        : (typeof post.updatedAt === 'string' ? post.updatedAt : new Date(post.updatedAt).toISOString())
    };

    return NextResponse.json({
      ok: true,
      post: formattedPost
    });
  } catch (error: any) {
    console.error('[POST DETAIL] Error:', error);
    return NextResponse.json(
      { ok: false, error: '게시글을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 게시글 삭제
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
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

    if (isNaN(postId)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    // 게시글 소유자 확인
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      select: { userId: true }
    });

    if (!post) {
      return NextResponse.json(
        { ok: false, error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const userId = parseInt(session.userId);
    
    // 관리자 user1~user10 확인 (phone이 "user1"~"user10"으로 시작하는 경우)
    const isAdminUser = await isMallAdmin(userId);

    // 본인 게시글이 아니고 관리자 user1~user10이 아니면 삭제 불가
    if (post.userId !== userId && !isAdminUser) {
      return NextResponse.json(
        { ok: false, error: '본인의 게시글만 삭제할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 관리자인 경우 기능 설정 확인
    if (isAdminUser && post.userId !== userId) {
      const featureSettings = await getMallAdminFeatureSettings(userId);
      if (!featureSettings.canDeletePosts) {
        return NextResponse.json(
          { ok: false, error: '커뮤니티 글 삭제 권한이 없습니다.' },
          { status: 403 }
        );
      }
    }

    // 게시글 삭제 (soft delete)
    await prisma.communityPost.update({
      where: { id: postId },
      data: { isDeleted: true, deletedAt: new Date() }
    });

    return NextResponse.json({
      ok: true,
      message: '게시글이 삭제되었습니다.'
    });
  } catch (error: any) {
    console.error('[POST DELETE] Error:', error);
    return NextResponse.json(
      { ok: false, error: '게시글 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
