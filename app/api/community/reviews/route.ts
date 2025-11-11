// app/api/community/reviews/route.ts
// 크루즈 리뷰 API

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
// Google Sheets 저장은 배치 작업으로 처리되므로 import 제거

// 한글 닉네임 목록
const KOREAN_NICKNAMES = [
  '송이엄마', '찡찡', '크루즈닷만세', '바다사랑', '여행러버', '크루즈킹', '해외여행러', 
  '선상낭만', '오션뷰', '크루즈매니아', '여행의신', '바다의왕자', '선상요리사', 
  '크루즈여행자', '해외탐험가', '선상파티', '오션드림', '크루즈마스터', '여행스타', 
  '바다의별', '선상로맨스', '크루즈러버', '해외여행러버', '선상낭만주의자'
];

// 크루즈 라인 한국어 변환 맵
const cruiseLineMap: Record<string, string> = {
  'MSC': 'MSC',
  'Costa': '코스타',
  'Costa Cruises': '코스타',
  'Royal Caribbean': '로얄캐리비안',
  'Royal Caribbean International': '로얄캐리비안',
  'Princess': '프린세스',
  'Princess Cruises': '프린세스',
  'Norwegian': '노르웨이',
  'Norwegian Cruise Line': '노르웨이',
  'Celebrity': '셀레브리티',
  'Celebrity Cruises': '셀레브리티',
  'Holland America': '할란드아메리카',
  'Holland America Line': '할란드아메리카',
  'Carnival': '카니발',
  'Carnival Cruise Line': '카니발',
};

// 선박명 한국어 변환 맵
const shipNameMap: Record<string, string> = {
  'Bellissima': '벨리시마',
  'Grandiosa': '그란디오사',
  'Seaview': '시뷰',
  'Seaside': '시사이드',
  'Serena': '세레나',
  'Costa Serena': '세레나',
  'Spectrum of the Seas': '스펙트럼',
  'Spectrum': '스펙트럼',
  'Quantum of the Seas': '퀀텀',
  'Quantum': '퀀텀',
  'Ovation of the Seas': '오베이션',
  'Ovation': '오베이션',
  'Allure of the Seas': '얼루어',
  'Allure': '얼루어',
  'Brilliance of the Seas': '브릴리언스',
  'Brilliance': '브릴리언스',
};

// 리뷰 목록 조회 (비회원도 가능)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '6');

    // DB에서 리뷰 조회 (이미지가 있는 후기만 - 후기전체보기용)
    let allReviews = await prisma.cruiseReview.findMany({
      where: {
        isApproved: true,
        isDeleted: false
      },
      orderBy: { createdAt: 'desc' },
      take: limit * 3, // 필터링 후에도 충분한 수를 가져오기 위해
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
        createdAt: true
      }
    });

    // 이미지가 실제로 있는 후기만 필터링
    let reviews = allReviews.filter(review => {
      if (!review.images) return false;
      try {
        const images = Array.isArray(review.images) 
          ? review.images 
          : (typeof review.images === 'string' ? JSON.parse(review.images) : []);
        return Array.isArray(images) && images.length > 0 && images.some((img: any) => img && img.trim());
      } catch {
        return false;
      }
    }).slice(0, limit); // 최종 limit만큼만

    // DB에 리뷰가 없거나 적으면 샘플 데이터 추가
    if (reviews.length < 3) {
      const SAMPLE_REVIEWS = [
        {
          id: 1,
          authorName: '송이엄마',
          title: 'MSC 벨리시마 지중해 크루즈 최고의 여행!',
          content: '지중해 크루즈 여행을 다녀왔는데 정말 최고였습니다. 배도 크고 시설도 좋고 음식도 맛있었어요. 특히 저녁 식사가 너무 좋았습니다.',
          images: ['/크루즈정보사진/고객 후기 자료/코스타 세레나 정찬 사진.jpg'],
          rating: 5,
          cruiseLine: 'MSC',
          shipName: '벨리시마',
          travelDate: '2024-12-15',
          createdAt: new Date('2025-01-20T10:30:00Z')
        },
        {
          id: 2,
          authorName: '찡찡',
          title: '코스타 세레나 첫 크루즈 여행 후기',
          content: '평생 처음 크루즈 여행을 했는데 너무 좋았어요. 다음에도 또 가고 싶습니다. 특히 데크에서 보는 일몰이 정말 아름다웠어요.',
          images: ['/크루즈정보사진/고객 후기 자료/코스타 세레나 공연 후기.jpg'],
          rating: 5,
          cruiseLine: '코스타',
          shipName: '세레나',
          travelDate: '2024-11-20',
          createdAt: new Date('2025-01-18T14:20:00Z')
        },
        {
          id: 3,
          authorName: '크루즈닷만세',
          title: '로얄캐리비안 스펙트럼 가족 여행 추천',
          content: '가족 여행으로 스펙트럼을 선택했는데 아이들이 너무 좋아했어요. 수영장과 놀이터도 크고 안전해서 맘 편히 놀 수 있었습니다.',
          images: ['/크루즈정보사진/고객 후기 자료/코스타 세레나 어린이 행사 후기.jpg'],
          rating: 5,
          cruiseLine: '로얄캐리비안',
          shipName: '스펙트럼',
          travelDate: '2024-10-05',
          createdAt: new Date('2025-01-15T09:15:00Z')
        }
      ];
      reviews = [...reviews, ...SAMPLE_REVIEWS.slice(0, Math.max(limit - reviews.length, 0))];
    }

    // 이미지 배열 처리 및 날짜 형식 변환, 닉네임 한글로 변경
    const formattedReviews = reviews.map((review, index) => {
      // authorName이 영어 아이디 형식이면 한글 닉네임으로 변경
      let authorName = review.authorName;
      if (authorName && /^[a-zA-Z0-9_]+$/.test(authorName)) {
        // 영어 아이디인 경우 한글 닉네임으로 변경
        authorName = KOREAN_NICKNAMES[index % KOREAN_NICKNAMES.length];
      }

      // 크루즈 라인 한국어 변환
      let cruiseLine = review.cruiseLine;
      if (cruiseLine) {
        cruiseLine = cruiseLineMap[cruiseLine] || cruiseLine;
      }

      // 선박명 한국어 변환
      let shipName = review.shipName;
      if (shipName) {
        shipName = shipNameMap[shipName] || shipName;
      }
      
      return {
        ...review,
        authorName,
        cruiseLine,
        shipName,
        images: Array.isArray(review.images) 
          ? review.images 
          : (typeof review.images === 'string' ? JSON.parse(review.images) : []),
        createdAt: review.createdAt instanceof Date 
          ? review.createdAt.toISOString() 
          : (typeof review.createdAt === 'string' ? review.createdAt : new Date(review.createdAt).toISOString())
      };
    });

    return NextResponse.json({
      ok: true,
      reviews: formattedReviews
    });
  } catch (error: any) {
    console.error('[CRUISE REVIEWS] Error:', error);
    // 에러 발생 시 샘플 데이터 반환
    const SAMPLE_REVIEWS = [
      {
        id: 1,
        authorName: '김해진',
        title: 'MSC 벨리시마 지중해 크루즈 최고의 여행!',
        content: '지중해 크루즈 여행을 다녀왔는데 정말 최고였습니다.',
        images: ['/크루즈정보사진/고객 후기 자료/코스타 세레나 정찬 사진.jpg'],
        rating: 5,
        cruiseLine: 'MSC',
        shipName: '벨리시마',
        travelDate: '2024-12-15',
        createdAt: new Date('2025-01-20T10:30:00Z').toISOString()
      }
    ];
    return NextResponse.json({
      ok: true,
      reviews: SAMPLE_REVIEWS
    });
  }
}

// 리뷰 작성 (회원만 가능)
export async function POST(req: Request) {
  try {
    const session = await getSession();
    
    if (!session || !session.userId) {
      return NextResponse.json(
        { ok: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { title, content, rating, cruiseLine, shipName, travelDate, images, mainImageIndex, authorName } = await req.json();

    // 사용자 정보 가져오기 (관리자 여부 확인)
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.userId) },
      select: { name: true, role: true, id: true }
    });

    if (!user) {
      console.error('[CRUISE REVIEW CREATE] User not found:', session.userId);
      return NextResponse.json(
        { ok: false, error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 모든 후기는 자동 승인 (승인 대기 기능 제거)
    const isApprovedValue = true;
    
    console.log('[CRUISE REVIEW CREATE] User ID:', user.id);
    console.log('[CRUISE REVIEW CREATE] User role:', user.role);
    console.log('[CRUISE REVIEW CREATE] Review will be auto-approved');

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

    // 관리자는 authorName을 직접 지정할 수 있음, 일반 사용자는 본인 닉네임 사용
    let finalAuthorName = user?.name || '익명';
    if (user?.role === 'admin' && authorName && authorName.trim()) {
      finalAuthorName = authorName.trim();
    }

    // 이미지 배열과 메인 이미지 인덱스 처리
    let imagesArray: string[] = [];
    if (images && Array.isArray(images) && images.length > 0) {
      imagesArray = images;
      // mainImageIndex가 유효하면 해당 이미지를 첫 번째로 이동
      if (typeof mainImageIndex === 'number' && mainImageIndex >= 0 && mainImageIndex < images.length) {
        const mainImage = images[mainImageIndex];
        imagesArray = [mainImage, ...images.filter((_, i) => i !== mainImageIndex)];
      }
    }

    // 후기 생성 (명시적으로 isApproved 값 설정)
    const review = await prisma.cruiseReview.create({
      data: {
        userId: parseInt(session.userId),
        title: title.trim(),
        content: content.trim(),
        rating: parseInt(rating),
        cruiseLine: cruiseLine?.trim() || null,
        shipName: shipName?.trim() || null,
        travelDate: finalTravelDate,
        images: imagesArray.length > 0 ? imagesArray : null,
        authorName: finalAuthorName,
        isApproved: true, // 모든 후기 자동 승인
        isDeleted: false // 명시적으로 설정
      }
    });

    console.log('[CRUISE REVIEW CREATE] Review created:', { 
      id: review.id, 
      isApproved: review.isApproved,
      userId: review.userId,
      authorName: review.authorName
    });

    // Google Sheets 저장은 배치 작업으로 처리 (1시간마다)
    // 실시간 저장 제거 - /api/batch/sync-to-google에서 처리

    return NextResponse.json({
      ok: true,
      review: {
        id: review.id,
        title: review.title,
        content: review.content,
        rating: review.rating,
        authorName: review.authorName,
        isApproved: review.isApproved,
        message: '후기가 등록되었습니다.'
      }
    });
  } catch (error: any) {
    console.error('[CRUISE REVIEW CREATE] Error:', error);
    return NextResponse.json(
      { ok: false, error: '후기 작성에 실패했습니다.' },
      { status: 500 }
    );
  }
}












