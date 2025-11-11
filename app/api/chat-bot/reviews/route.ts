function encodeImagePath(path: string): string {
  if (!path) return path;
  const segments = path.split('/').filter((segment, index) => !(index === 0 && segment === ''));
  const encoded = segments.map((segment) => encodeURIComponent(segment));
  return `/${encoded.join('/')}`;
}

// app/api/chat-bot/reviews/route.ts
// 챗봇용 상품별 리뷰 조회 API

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
};

// 크루즈 라인 검색어 매핑 (다양한 형태로 검색 가능하도록)
const cruiseLineSearchMap: Record<string, string[]> = {
  '로얄캐리비안': ['로얄캐리비안', 'Royal Caribbean', 'Royal Caribbean International', '로얄', 'Royal', 'RoyalCaribbean'],
  'Royal Caribbean': ['로얄캐리비안', 'Royal Caribbean', 'Royal Caribbean International', '로얄', 'Royal', 'RoyalCaribbean'],
  'Royal': ['로얄캐리비안', 'Royal Caribbean', 'Royal Caribbean International', '로얄', 'Royal', 'RoyalCaribbean'],
  'MSC': ['MSC', 'MSC Cruises'],
  '코스타': ['코스타', 'Costa', 'Costa Cruises', 'COSTA', 'COSTA CRUISES', 'costa', 'costa cruises'],
  'Costa': ['코스타', 'Costa', 'Costa Cruises', 'COSTA', 'COSTA CRUISES', 'costa', 'costa cruises'],
  'COSTA': ['코스타', 'Costa', 'Costa Cruises', 'COSTA', 'COSTA CRUISES', 'costa', 'costa cruises'],
};

// 크루즈 라인 검색어로 실제 DB에 저장된 크루즈 라인 찾기
function findCruiseLineVariants(searchTerm: string): string[] {
  const normalized = searchTerm.trim();
  const variants: string[] = [normalized];
  
  // 매핑에서 찾기 (정확히 일치하는 키 찾기)
  if (cruiseLineSearchMap[normalized]) {
    variants.push(...cruiseLineSearchMap[normalized]);
  }
  
  // 매핑의 값에서 검색어 포함 여부 확인 (역방향 검색)
  for (const [key, values] of Object.entries(cruiseLineSearchMap)) {
    if (values.some(v => {
      const vLower = v.toLowerCase();
      const normalizedLower = normalized.toLowerCase();
      return vLower.includes(normalizedLower) || normalizedLower.includes(vLower);
    })) {
      variants.push(...values);
      variants.push(key);
    }
  }
  
  // 코스타 관련 검색어 추가 (더 유연한 검색)
  if (normalized.toLowerCase().includes('costa') || normalized.includes('코스타')) {
    variants.push('코스타', 'Costa', 'Costa Cruises', 'COSTA', 'COSTA CRUISES', 'costa', 'costa cruises');
  }
  
  // 중복 제거
  return [...new Set(variants)];
}

const normalizeImages = (raw: unknown): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((img) => (typeof img === 'string' ? img.trim() : ''))
      .filter((img) => img.length > 0)
      .map(encodeImagePath);
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === '[]') {
      return [];
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((img) => (typeof img === 'string' ? img.trim() : ''))
          .filter((img) => img.length > 0)
          .map(encodeImagePath);
      }
      return [];
    } catch {
      // 이미지 문자열이 JSON 배열이 아닌 경우 (단일 경로 등)
      if (trimmed.startsWith('/')) {
        return [encodeImagePath(trimmed)];
      }
      return [];
    }
  }

  return [];
};

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const productCode = searchParams.get('productCode');
  const cruiseLine = searchParams.get('cruiseLine');
  const limit = parseInt(searchParams.get('limit') || '3');
  
  try {

    // 상품 코드 또는 크루즈 라인으로 리뷰 조회
    const whereClause: any = {
      isApproved: true,
      isDeleted: false,
    };

    if (productCode) {
      // 정확한 상품 코드 매칭 또는 크루즈 라인/선박명 매칭
      const product = await prisma.cruiseProduct.findUnique({
        where: { productCode: productCode.toUpperCase() },
        select: {
          cruiseLine: true,
          shipName: true,
        },
      });

      if (product && product.cruiseLine) {
        // 크루즈 라인의 다양한 형태 찾기
        const cruiseLineVariants = findCruiseLineVariants(product.cruiseLine);
        
        // 상품 코드가 정확히 일치하거나, 크루즈 라인과 선박명이 일치하는 리뷰
        const orConditions: any[] = [
          { productCode: productCode.toUpperCase() },
        ];
        
        // 크루즈 라인으로 검색 (다양한 형태 포함, 선박명 조건 완화)
        cruiseLineVariants.forEach(variant => {
          // 크루즈 라인만으로도 검색 (선박명 조건 제거하여 더 많은 후기 검색)
          orConditions.push({
            cruiseLine: { contains: variant, mode: 'insensitive' },
          });
          
          // 선박명이 있으면 추가 조건으로도 검색 (더 정확한 매칭)
          if (product.shipName) {
            orConditions.push({
              AND: [
                { cruiseLine: { contains: variant, mode: 'insensitive' } },
                { shipName: { contains: product.shipName, mode: 'insensitive' } },
              ],
            });
          }
        });
        
        whereClause.OR = orConditions;
      } else {
        whereClause.productCode = productCode.toUpperCase();
      }
    } else if (cruiseLine) {
      // 크루즈 라인 직접 검색 시에도 다양한 형태로 검색
      const cruiseLineVariants = findCruiseLineVariants(cruiseLine);
      whereClause.OR = cruiseLineVariants.map(variant => ({
        cruiseLine: { contains: variant, mode: 'insensitive' },
      }));
    }

    // 이미지가 있는 리뷰만 조회 (더 많은 후기를 가져오기 위해 limit 증가)
    let reviews = await prisma.cruiseReview.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit * 5, // 필터링 후에도 충분한 수를 가져오기 위해 증가
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
        productCode: true,
        createdAt: true,
      },
    });

    // 이미지가 실제로 있는 후기만 필터링 (우선순위)
    const reviewsWithImages = reviews.filter((review) => normalizeImages(review.images).length > 0);

    // 이미지가 있는 후기가 충분하면 그것만 사용, 부족하면 이미지 없는 후기도 포함
    if (reviewsWithImages.length >= limit) {
      reviews = reviewsWithImages.slice(0, limit);
    } else {
      // 이미지 없는 후기도 일부 포함 (최소한의 후기는 보여주기 위해)
      const reviewsWithoutImages = reviews.filter(
        (review) => normalizeImages(review.images).length === 0,
      );
      
      reviews = [...reviewsWithImages, ...reviewsWithoutImages].slice(0, limit);
    }

    // 리뷰가 부족하면 크루즈 라인으로 추가 조회 (이미지 필터링 완화)
    if (reviews.length < limit && productCode) {
      const product = await prisma.cruiseProduct.findUnique({
        where: { productCode: productCode.toUpperCase() },
        select: { cruiseLine: true, shipName: true },
      });

      if (product && product.cruiseLine) {
        // 크루즈 라인의 다양한 형태 찾기
        const cruiseLineVariants = findCruiseLineVariants(product.cruiseLine);
        
        // 각 변형으로 검색 (선박명 조건 완화)
        const additionalOrConditions = cruiseLineVariants.map(variant => ({
          cruiseLine: { contains: variant, mode: 'insensitive' },
        }));
        
        const additionalReviews = await prisma.cruiseReview.findMany({
          where: {
              isApproved: true,
              isDeleted: false,
              OR: additionalOrConditions,
              id: { notIn: reviews.map(r => r.id) },
          },
          orderBy: { createdAt: 'desc' },
          take: (limit - reviews.length) * 3, // 충분히 가져오기
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
            productCode: true,
            createdAt: true,
          },
        });

        // 이미지가 있는 후기 우선, 부족하면 이미지 없는 후기도 포함
        const additionalWithImages = additionalReviews.filter(
          (review) => normalizeImages(review.images).length > 0,
        );

        const additionalWithoutImages = additionalReviews.filter(
          (review) => normalizeImages(review.images).length === 0,
        );

        const needed = limit - reviews.length;
        reviews = [...reviews, ...additionalWithImages, ...additionalWithoutImages].slice(0, limit);
      }
    }
    
    // 여전히 리뷰가 부족하면 크루즈 라인만으로도 검색 (이미지 필터링 완화)
    if (reviews.length < limit && (productCode || cruiseLine)) {
      const searchCruiseLine = productCode 
        ? (await prisma.cruiseProduct.findUnique({
            where: { productCode: productCode.toUpperCase() },
            select: { cruiseLine: true },
          }))?.cruiseLine || cruiseLine
        : cruiseLine;

      if (searchCruiseLine) {
        const cruiseLineVariants = findCruiseLineVariants(searchCruiseLine);
        const additionalOrConditions = cruiseLineVariants.map(variant => ({
          cruiseLine: { contains: variant, mode: 'insensitive' },
        }));
        
        const fallbackReviews = await prisma.cruiseReview.findMany({
          where: {
            isApproved: true,
            isDeleted: false,
            OR: additionalOrConditions,
            id: { notIn: reviews.map(r => r.id) },
          },
          orderBy: { createdAt: 'desc' },
          take: (limit - reviews.length) * 2,
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
            productCode: true,
            createdAt: true,
          },
        });

        // 이미지가 없어도 포함 (최소한의 후기는 보여주기 위해)
        reviews = [...reviews, ...fallbackReviews].slice(0, limit);
      }
    }

    // 이미지 배열 처리 및 날짜 형식 변환, 닉네임 한글로 변경
    const formattedReviews = reviews.map((review, index) => {
      // authorName이 영어 아이디 형식이면 한글 닉네임으로 변경
      let authorName = review.authorName;
      if (authorName && /^[a-zA-Z0-9_]+$/.test(authorName)) {
        authorName = KOREAN_NICKNAMES[index % KOREAN_NICKNAMES.length];
      }

      // 크루즈 라인 한국어 변환
      let cruiseLine = review.cruiseLine;
      if (cruiseLine) {
        cruiseLine = cruiseLineMap[cruiseLine] || cruiseLine;
      }

      return {
        ...review,
        authorName,
        cruiseLine,
        images: normalizeImages(review.images),
        createdAt: review.createdAt instanceof Date 
          ? review.createdAt.toISOString() 
          : (typeof review.createdAt === 'string' ? review.createdAt : new Date(review.createdAt).toISOString()),
      };
    });

    return NextResponse.json({
      ok: true,
      reviews: formattedReviews,
    });
  } catch (error: any) {
    console.error('[ChatBot Reviews] Error:', error);
    console.error('[ChatBot Reviews] Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      productCode,
      cruiseLine,
    });
    return NextResponse.json(
      { ok: false, error: '리뷰를 불러오는 중 오류가 발생했습니다.', reviews: [] },
      { status: 500 }
    );
  }
}

