// app/api/community/my-info/route.ts
// 내 정보 조회 API (커뮤니티 전용)

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session || !session.userId) {
      return NextResponse.json(
        { ok: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.userId);

    // 사용자 정보 조회 (커뮤니티 전용)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        genieStatus: true,
        mallNickname: true,
        mallUserId: true,
      }
    });

    // 커뮤니티 사용자 또는 관리자만 접근 가능
    if (!user || (user.role !== 'community' && user.role !== 'admin')) {
      return NextResponse.json(
        { ok: false, error: '커뮤니티 사용자 또는 관리자만 접근 가능합니다.' },
        { status: 403 }
      );
    }

    // 내가 올린 커뮤니티 게시글
    const myPosts = await prisma.communityPost.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        views: true,
        likes: true,
        comments: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            Comments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 내가 올린 리뷰 (삭제되지 않은 것만)
    const myReviews = await prisma.cruiseReview.findMany({
      where: { 
        userId: user.id,
        isDeleted: false  // 삭제되지 않은 리뷰만 조회
      },
      select: {
        id: true,
        title: true,
        content: true,
        rating: true,
        cruiseLine: true,
        shipName: true,
        travelDate: true,
        images: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // 내가 쓴 댓글
    const myComments = await prisma.communityComment.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        Post: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 여행 문의 정보 (Trip 모델에서 조회) - 관리자가 배정한 여행 정보 포함
    const myTrips = await prisma.trip.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        cruiseName: true,
        startDate: true,
        endDate: true,
        status: true,
        companionType: true, // 동행유형 추가
        destination: true, // 목적지 추가
        nights: true,
        days: true,
        createdAt: true,
        CruiseProduct: {
          select: {
            productCode: true,
            packageName: true,
            cruiseLine: true,
            shipName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 크루즈 가이드 지니 연동 정보 확인 (mallUserId가 현재 사용자 ID와 일치하는 지니 사용자 찾기)
    const linkedGenieUser = await prisma.user.findFirst({
      where: {
        mallUserId: user.id.toString(),
        genieStatus: { not: null },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        genieStatus: true,
        genieLinkedAt: true,
        isLocked: true,
      },
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        genieStatus: user.genieStatus,
        genieName: user.mallNickname,
        geniePhone: user.mallUserId,
        linkedGenieUser: linkedGenieUser ? {
          id: linkedGenieUser.id,
          name: linkedGenieUser.name,
          phone: linkedGenieUser.phone,
          genieStatus: linkedGenieUser.genieStatus,
          genieLinkedAt: linkedGenieUser.genieLinkedAt?.toISOString() || null,
          isLocked: linkedGenieUser.isLocked,
        } : null,
      },
      posts: myPosts.map(post => ({
        ...post,
        commentCount: post._count.Comments,
        createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt,
        updatedAt: post.updatedAt instanceof Date ? post.updatedAt.toISOString() : post.updatedAt
      })),
      reviews: myReviews.map(review => ({
        ...review,
        travelDate: review.travelDate instanceof Date ? review.travelDate.toISOString() : (review.travelDate || null),
        images: Array.isArray(review.images) ? review.images : (typeof review.images === 'string' ? JSON.parse(review.images) : []),
        createdAt: review.createdAt instanceof Date ? review.createdAt.toISOString() : review.createdAt,
        updatedAt: review.updatedAt instanceof Date ? review.updatedAt.toISOString() : review.updatedAt
      })),
      comments: myComments.map(comment => ({
        ...comment,
        createdAt: comment.createdAt instanceof Date ? comment.createdAt.toISOString() : comment.createdAt,
        updatedAt: comment.updatedAt instanceof Date ? comment.updatedAt.toISOString() : comment.updatedAt
      })),
      trips: myTrips.map(trip => ({
        ...trip,
        startDate: trip.startDate instanceof Date ? trip.startDate.toISOString() : trip.startDate,
        endDate: trip.endDate instanceof Date ? trip.endDate.toISOString() : trip.endDate,
        createdAt: trip.createdAt instanceof Date ? trip.createdAt.toISOString() : trip.createdAt,
        companionType: trip.companionType,
        destination: trip.destination ? (Array.isArray(trip.destination) ? trip.destination : [trip.destination]) : null,
        nights: trip.nights,
        days: trip.days,
      }))
    });
  } catch (error: any) {
    console.error('[MY INFO] Error:', error);
    return NextResponse.json(
      { ok: false, error: '정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

