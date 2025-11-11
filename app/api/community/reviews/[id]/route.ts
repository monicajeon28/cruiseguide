// app/api/community/reviews/[id]/route.ts
// 리뷰 상세 조회 API

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 한글 닉네임 목록
const KOREAN_NICKNAMES = [
  '송이엄마', '찡찡', '크루즈닷만세', '바다사랑', '여행러버', '크루즈킹', '해외여행러', 
  '선상낭만', '오션뷰', '크루즈매니아', '여행의신', '바다의왕자', '선상요리사', 
  '크루즈여행자', '해외탐험가', '선상파티', '오션드림', '크루즈마스터', '여행스타', 
  '바다의별', '선상로맨스', '크루즈러버', '해외여행러버', '선상낭만주의자'
];

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reviewId = parseInt(params.id);

    if (isNaN(reviewId)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid review ID' },
        { status: 400 }
      );
    }

    // 관리자 여부 확인
    const { getSession } = await import('@/lib/session');
    const session = await getSession();
    let isAdmin = false;
    let isOwner = false;
    
    if (session?.userId) {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(session.userId) },
        select: { role: true }
      });
      isAdmin = user?.role === 'admin';
      
      // 본인 후기인지 확인
      const reviewCheck = await prisma.cruiseReview.findUnique({
        where: { id: reviewId },
        select: { userId: true }
      });
      isOwner = reviewCheck?.userId === parseInt(session.userId);
    }

    // 관리자 또는 본인은 승인 대기 후기도 조회 가능, 일반 사용자는 승인된 후기만 조회
    const review = await prisma.cruiseReview.findUnique({
      where: {
        id: reviewId,
        ...(isAdmin || isOwner ? {} : { isApproved: true }), // 관리자나 본인은 승인 대기여도 조회 가능
        ...(isAdmin ? {} : { isDeleted: false })  // 관리자는 삭제된 리뷰도 조회 가능
      },
      select: {
        id: true,
        authorName: true,
        title: true,
        content: true,
        images: true,
        rating: true,
        cruiseLine: true,
        shipName: true,
        travelDate: true,
        createdAt: true,
        isApproved: true, // 승인 상태도 반환
      }
    });

    if (!review) {
      return NextResponse.json(
        { ok: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    // 이전/다음 후기 ID 조회
    const whereCondition = {
      isApproved: true,
      ...(isAdmin ? {} : { isDeleted: false })
    };

    // 이전 후기 (ID가 현재보다 작고, 가장 큰 ID)
    const prevReview = await prisma.cruiseReview.findFirst({
      where: {
        ...whereCondition,
        id: { lt: reviewId }
      },
      orderBy: { id: 'desc' },
      select: { id: true }
    });

    // 다음 후기 (ID가 현재보다 크고, 가장 작은 ID)
    const nextReview = await prisma.cruiseReview.findFirst({
      where: {
        ...whereCondition,
        id: { gt: reviewId }
      },
      orderBy: { id: 'asc' },
      select: { id: true }
    });

    // 이미지 배열 처리 및 닉네임 한글로 변경
    let authorName = review.authorName;
    if (authorName && /^[a-zA-Z0-9_]+$/.test(authorName)) {
      // 영어 아이디인 경우 한글 닉네임으로 변경
      const index = reviewId % KOREAN_NICKNAMES.length;
      authorName = KOREAN_NICKNAMES[index];
    }
    
    const formattedReview = {
      ...review,
      authorName,
      travelDate: review.travelDate instanceof Date 
        ? review.travelDate.toISOString() 
        : (review.travelDate || null),
      images: Array.isArray(review.images) 
        ? review.images 
        : (typeof review.images === 'string' ? JSON.parse(review.images) : []),
      createdAt: review.createdAt instanceof Date 
        ? review.createdAt.toISOString() 
        : review.createdAt,
      isApproved: review.isApproved, // 승인 상태 포함
    };

    return NextResponse.json({
      ok: true,
      review: formattedReview,
      prevReviewId: prevReview?.id || null,
      nextReviewId: nextReview?.id || null
    });
  } catch (error: any) {
    console.error('[REVIEW DETAIL] Error:', error);
    return NextResponse.json(
      { ok: false, error: '리뷰를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { getSession } = await import('@/lib/session');
    const session = await getSession();
    
    if (!session || !session.userId) {
      return NextResponse.json(
        { ok: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const reviewId = parseInt(params.id);

    if (isNaN(reviewId)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid review ID' },
        { status: 400 }
      );
    }

    // 리뷰 소유자 확인
    const review = await prisma.cruiseReview.findUnique({
      where: { id: reviewId },
      select: { userId: true }
    });

    if (!review) {
      return NextResponse.json(
        { ok: false, error: '리뷰를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const userId = parseInt(session.userId);
    
    // 사용자 정보 조회 (관리자 권한 확인)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, phone: true }
    });

    // 관리자 user1~user10 확인 (phone이 "user1"~"user10"으로 시작하는 경우)
    const isAdminUser = user?.role === 'admin' && user.phone && /^user(1[0]|[1-9])$/.test(user.phone);

    // 본인 리뷰가 아니고 관리자 user1~user10이 아니면 삭제 불가
    if (review.userId !== userId && !isAdminUser) {
      return NextResponse.json(
        { ok: false, error: '본인의 리뷰만 삭제할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 리뷰 삭제 (soft delete)
    await prisma.cruiseReview.update({
      where: { id: reviewId },
      data: { isDeleted: true }
    });

    return NextResponse.json({
      ok: true,
      message: '리뷰가 삭제되었습니다.'
    });
  } catch (error: any) {
    console.error('[REVIEW DELETE] Error:', error);
    return NextResponse.json(
      { ok: false, error: '리뷰 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { getSession } = await import('@/lib/session');
    const session = await getSession();
    
    if (!session || !session.userId) {
      return NextResponse.json(
        { ok: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const reviewId = parseInt(params.id);

    if (isNaN(reviewId)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid review ID' },
        { status: 400 }
      );
    }

    // 리뷰 소유자 확인
    const review = await prisma.cruiseReview.findUnique({
      where: { id: reviewId },
      select: { userId: true }
    });

    if (!review) {
      return NextResponse.json(
        { ok: false, error: '리뷰를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const userId = parseInt(session.userId);
    
    // 사용자 정보 조회 (관리자 권한 확인)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    // 본인 리뷰가 아니고 관리자가 아니면 수정 불가
    if (review.userId !== userId && user?.role !== 'admin') {
      return NextResponse.json(
        { ok: false, error: '본인의 리뷰만 수정할 수 있습니다.' },
        { status: 403 }
      );
    }

    const { title, content, rating, cruiseLine, shipName, travelDate, images } = await req.json();

    // 관리자가 아니면 travelDate를 null로 설정 (일반 사용자는 작성일만 사용)
    const finalTravelDate = user?.role === 'admin' && travelDate ? new Date(travelDate) : null;

    if (!title || !content) {
      return NextResponse.json(
        { ok: false, error: '제목과 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { ok: false, error: '별점을 선택해주세요.' },
        { status: 400 }
      );
    }

    // 리뷰 업데이트
    const updatedReview = await prisma.cruiseReview.update({
      where: { id: reviewId },
      data: {
        title: title.trim(),
        content: content.trim(),
        rating: parseInt(rating),
        cruiseLine: cruiseLine?.trim() || null,
        shipName: shipName?.trim() || null,
        travelDate: finalTravelDate,
        images: images && Array.isArray(images) ? images : null
      }
    });

    return NextResponse.json({
      ok: true,
      review: {
        ...updatedReview,
        images: Array.isArray(updatedReview.images) 
          ? updatedReview.images 
          : (typeof updatedReview.images === 'string' ? JSON.parse(updatedReview.images) : []),
        createdAt: updatedReview.createdAt instanceof Date 
          ? updatedReview.createdAt.toISOString() 
          : updatedReview.createdAt,
        updatedAt: updatedReview.updatedAt instanceof Date 
          ? updatedReview.updatedAt.toISOString() 
          : updatedReview.updatedAt
      }
    });
  } catch (error: any) {
    console.error('[REVIEW UPDATE] Error:', error);
    return NextResponse.json(
      { ok: false, error: '리뷰 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

