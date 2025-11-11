// app/api/products/[productCode]/reviews/route.ts
// 상품 리뷰 조회 및 생성 API

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 자연스러운 한글 닉네임 생성 (성+이름 조합)
const generateNaturalNickname = (): string => {
  const surnames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '전', '홍', '고', '문', '양', '손', '배', '조', '백', '허', '유', '남', '심', '노', '정', '하', '곽', '성', '차', '주', '우', '구', '신', '임', '나', '전', '민', '유', '진', '지', '엄', '채', '원', '천', '방', '공', '강', '현', '함', '변', '염', '양', '여', '추', '노', '도', '소', '신', '석', '선', '설', '마', '길', '주', '연', '방', '위', '표', '명', '기', '반', '왕', '금', '옥', '육', '인', '맹', '제', '모', '장', '남', '탁', '국', '여', '진', '어', '은', '편', '구', '용'];
  const givenNames = [
    '민수', '지은', '준호', '수진', '다은', '현우', '서연', '민준', '하늘', '소영', '지훈', '예린', '성민', '지혜', '태현', '채원',
    '민석', '나영', '지훈', '수아', '도현', '서윤', '민규', '예나', '준영', '지원', '성호', '지은', '민수', '지혜', '현우', '서연',
    '준호', '수진', '다은', '현우', '서연', '민준', '하늘', '소영', '지훈', '예린', '성민', '지혜', '태현', '채원', '민석', '나영',
    '영수', '미영', '정호', '영희', '철수', '영수', '미경', '정수', '영숙', '정희', '영자', '순자', '영미', '정숙', '영신', '정자',
    '수빈', '지안', '서준', '예준', '도윤', '시우', '하준', '지호', '준서', '건우', '현준', '우진', '선우', '연우', '정우', '승우',
    '지우', '민재', '준영', '시윤', '유준', '윤서', '동현', '지후', '준혁', '승현', '지원', '민성', '준호', '지훈', '현우', '도현',
  ];
  
  const surname = surnames[Math.floor(Math.random() * surnames.length)];
  const givenName = givenNames[Math.floor(Math.random() * givenNames.length)];
  return `${surname}${givenName}`;
};

// 이모티콘 배열 (드물게만 사용)
const EMOTICONS = ['ㅎㅎ', 'ㅋㅋ', '^^', '~'];

// 상품 정보 기반 리뷰 템플릿 생성 함수 (실제 사람이 쓴 것처럼 자연스럽게)
function generateReviewTemplates(product: {
  packageName: string;
  cruiseLine: string;
  shipName: string;
  nights: number;
  days: number;
  itineraryPattern: any;
}): string[] {
  const templates: string[] = [];
  
  // 국가 추출
  let countries: string[] = [];
  if (product.itineraryPattern) {
    const pattern = typeof product.itineraryPattern === 'string' 
      ? JSON.parse(product.itineraryPattern) 
      : product.itineraryPattern;
    
    if (Array.isArray(pattern)) {
      pattern.forEach((day: any) => {
        if (day.country && day.country !== 'KR') {
          const countryNames: Record<string, string> = {
            'JP': '일본', 'TH': '태국', 'VN': '베트남', 'MY': '말레이시아',
            'SG': '싱가포르', 'ES': '스페인', 'FR': '프랑스', 'IT': '이탈리아',
            'GR': '그리스', 'TR': '터키', 'US': '미국', 'CN': '중국', 'TW': '대만',
            'HK': '홍콩', 'PH': '필리핀', 'ID': '인도네시아', 'CA': '캐나다'
          };
          const countryName = countryNames[day.country] || day.country;
          if (!countries.includes(countryName)) {
            countries.push(countryName);
          }
        }
      });
    } else if (pattern.destination && Array.isArray(pattern.destination)) {
      countries = pattern.destination;
    }
  }
  
  const countryList = countries.length > 0 ? countries.slice(0, 2).join(', ') : '';
  
  // 실제 사람이 쓴 것처럼 다양한 리뷰 템플릿 (이모티콘 없이 시작)
  // 일정 관련
  templates.push(`${product.nights}박 ${product.days}일 일정이 딱 적당했어요`);
  templates.push(`여행 기간이 너무 길지도 짧지도 않아서 좋았습니다`);
  templates.push(`${product.days}일 동안 알차게 여행했는데 시간이 금방 지나갔어요`);
  templates.push(`일정이 잘 짜여져 있어서 여유롭게 다닐 수 있었습니다`);
  templates.push(`${product.nights}박 일정이 생각보다 짧게 느껴졌어요`);
  
  // 크루즈선 관련
  templates.push(`${product.shipName} 배가 생각보다 크고 깔끔했어요`);
  templates.push(`선박 시설이 깨끗하고 관리가 잘 되어 있더라구요`);
  templates.push(`${product.cruiseLine} ${product.shipName} 크루즈 처음 타봤는데 만족스러웠습니다`);
  templates.push(`배 안이 넓어서 걷기 좋았어요`);
  templates.push(`선실이 예상보다 넓고 깨끗해서 놀랐습니다`);
  templates.push(`선박이 안정적이어서 멀미 걱정 없이 다녔어요`);
  
  // 음식 관련
  templates.push(`뷔페 음식이 다양하고 맛있었어요`);
  templates.push(`식사 시간마다 다른 메뉴가 나와서 좋았습니다`);
  templates.push(`아침 식사부터 저녁 식사까지 모두 만족스러웠어요`);
  templates.push(`레스토랑 음식 퀄리티가 생각보다 높았습니다`);
  templates.push(`한식도 나와서 한국인 입맛에 맞았어요`);
  templates.push(`선상 식사가 예상보다 훨씬 좋았습니다`);
  
  // 관광/기항지 관련
  if (countryList) {
    templates.push(`${countryList} 관광이 재미있었어요`);
    templates.push(`기항지에서 자유시간이 충분해서 좋았습니다`);
    templates.push(`${countryList} 방문 일정이 알차게 구성되어 있었어요`);
    templates.push(`각 기항지마다 볼거리가 많아서 시간 가는 줄 몰랐습니다`);
    templates.push(`${countryList} 여행 코스가 만족스러웠어요`);
  }
  
  // 인솔자/가이드 관련
  templates.push(`인솔자님이 친절하게 잘 챙겨주셔서 감사했습니다`);
  templates.push(`가이드님 설명이 자세하고 재미있으셨어요`);
  templates.push(`일정 관리가 체계적이어서 편안하게 여행할 수 있었습니다`);
  templates.push(`인솔자님 덕분에 걱정 없이 다녔어요`);
  templates.push(`가이드 분이 현지 정보를 잘 알려주셔서 좋았습니다`);
  
  // 크루즈닷 서비스 관련
  templates.push(`크루즈닷 서비스 덕분에 편하게 여행했습니다`);
  templates.push(`예약부터 여행까지 모든 과정이 매끄럽게 진행되었어요`);
  templates.push(`다음에도 크루즈닷으로 예약하고 싶습니다`);
  
  // 엔터테인먼트/시설 관련
  templates.push(`선상에서 하는 쇼가 재미있었어요`);
  templates.push(`수영장과 스파 시설이 좋았습니다`);
  templates.push(`밤에 하는 공연을 보는 게 즐거웠어요`);
  templates.push(`선상에서의 일몰이 정말 예뻤습니다`);
  templates.push(`갑판에서 바다 구경하는 게 좋았어요`);
  templates.push(`선상 엔터테인먼트가 다양해서 지루할 틈이 없었습니다`);
  
  // 가족/친구 여행 관련
  templates.push(`가족들과 함께 가서 더 즐거웠습니다`);
  templates.push(`친구들과 함께 여행했는데 모두 만족했어요`);
  templates.push(`부모님 모시고 갔는데 좋아하셨습니다`);
  templates.push(`아이들도 재미있어했어요`);
  templates.push(`가족 여행으로 최고였습니다`);
  
  // 전반적인 만족도
  templates.push(`크루즈 여행 처음인데 생각보다 좋았어요`);
  templates.push(`가격 대비 만족도가 높았습니다`);
  templates.push(`다음에도 크루즈 여행 가고 싶어요`);
  templates.push(`여행 내내 편안하고 즐거웠습니다`);
  templates.push(`선상에서 보낸 시간이 아쉬울 정도로 좋았어요`);
  templates.push(`크루즈 여행의 매력을 제대로 느꼈습니다`);
  templates.push(`일상에서 벗어나 휴식을 취하기 좋았어요`);
  templates.push(`여행 내내 스트레스 없이 편안했습니다`);
  templates.push(`선실에서 쉬는 시간도 좋았고 관광도 재미있었어요`);
  templates.push(`크루즈 여행이 생각보다 편하고 좋았습니다`);
  templates.push(`다음 여행도 크루즈로 가고 싶어요`);
  templates.push(`여행 내내 만족스러웠습니다`);
  templates.push(`선상 시설이 현대적이고 깔끔했어요`);
  templates.push(`기항지 관광 프로그램이 알차게 구성되어 있었습니다`);
  templates.push(`여행 일정이 적당해서 여유롭게 즐길 수 있었어요`);
  templates.push(`크루즈 여행 처음 해봤는데 좋은 경험이었습니다`);
  templates.push(`선상에서의 하루하루가 즐거웠어요`);
  templates.push(`다양한 레스토랑에서 식사하는 게 좋았습니다`);
  templates.push(`선실 서비스가 훌륭했어요`);
  templates.push(`크루즈 여행이 생각보다 재미있었습니다`);
  templates.push(`가족 모두 만족한 여행이었어요`);
  templates.push(`선상에서의 휴식이 정말 좋았습니다`);
  templates.push(`다음 여행 계획도 세우고 싶어요`);
  templates.push(`크루즈 여행의 새로운 경험이었습니다`);
  templates.push(`선상 시설이 깔끔하고 직원분들도 친절하셨어요`);
  templates.push(`음식이 다양하고 맛있어서 좋았습니다`);
  templates.push(`방이 넓고 깨끗해서 편안하게 지냈어요`);
  templates.push(`엔터테인먼트 프로그램이 풍부해서 재미있었습니다`);
  templates.push(`가성비 좋은 크루즈 여행이었어요`);
  templates.push(`다음에도 또 가고 싶은 크루즈입니다`);
  templates.push(`친구들과 함께 즐거운 시간 보냈어요`);
  templates.push(`선상에서의 일몰이 정말 아름다웠습니다`);
  templates.push(`수영장과 스파 시설이 훌륭했어요`);
  templates.push(`레스토랑 음식 퀄리티가 높았습니다`);
  templates.push(`선실이 넓어서 편안했어요`);
  templates.push(`크루즈 여행 처음인데 정말 좋았습니다`);
  templates.push(`가격 대비 만족도가 높았어요`);
  templates.push(`선상 활동이 다양해서 지루할 틈이 없었습니다`);
  templates.push(`기항지에서의 자유시간이 충분해서 좋았어요`);
  templates.push(`크루즈 여행의 매력을 제대로 느꼈습니다`);
  templates.push(`선상에서의 하루하루가 즐거웠어요`);
  templates.push(`다양한 레스토랑에서 식사하는 게 좋았습니다`);
  templates.push(`선실 서비스가 훌륭했어요`);
  templates.push(`크루즈 여행이 생각보다 재미있었습니다`);
  templates.push(`가족 모두 만족한 여행이었어요`);
  templates.push(`선상에서의 휴식이 정말 좋았습니다`);
  templates.push(`다음 여행 계획도 세우고 싶어요`);
  templates.push(`크루즈 여행의 새로운 경험이었습니다`);
  templates.push(`선상 시설이 현대적이고 깔끔했어요`);
  templates.push(`기항지 관광 프로그램이 알차게 구성되어 있었습니다`);
  
  return templates;
}

// 평균 별점에 맞게 별점 분포 생성 (3~5점 다양하게)
function generateRatings(targetAverage: number, count: number): number[] {
  const ratings: number[] = [];
  
  // 목표 평균에 따라 분포 조정
  let fiveStar = 0;
  let fourStar = 0;
  let threeStar = 0;
  
  if (targetAverage >= 4.5) {
    // 평균 4.5 이상: 5점 60%, 4점 35%, 3점 5%
    fiveStar = Math.floor(count * 0.6);
    fourStar = Math.floor(count * 0.35);
    threeStar = count - fiveStar - fourStar;
  } else if (targetAverage >= 4.0) {
    // 평균 4.0~4.5: 5점 40%, 4점 50%, 3점 10%
    fiveStar = Math.floor(count * 0.4);
    fourStar = Math.floor(count * 0.5);
    threeStar = count - fiveStar - fourStar;
  } else if (targetAverage >= 3.5) {
    // 평균 3.5~4.0: 5점 25%, 4점 50%, 3점 25%
    fiveStar = Math.floor(count * 0.25);
    fourStar = Math.floor(count * 0.5);
    threeStar = count - fiveStar - fourStar;
  } else {
    // 평균 3.5 미만: 5점 15%, 4점 40%, 3점 45%
    fiveStar = Math.floor(count * 0.15);
    fourStar = Math.floor(count * 0.4);
    threeStar = count - fiveStar - fourStar;
  }
  
  // 별점 배열 생성
  for (let i = 0; i < fiveStar; i++) ratings.push(5);
  for (let i = 0; i < fourStar; i++) ratings.push(4);
  for (let i = 0; i < threeStar; i++) ratings.push(3);
  
  // 셔플
  for (let i = ratings.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ratings[i], ratings[j]] = [ratings[j], ratings[i]];
  }
  
  // 평균 조정
  const currentAverage = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  const diff = targetAverage - currentAverage;
  
  if (Math.abs(diff) > 0.05) {
    // 평균이 목표와 차이가 나면 조정
    const adjustCount = Math.floor(Math.abs(diff) * count);
    for (let i = 0; i < adjustCount && i < ratings.length; i++) {
      if (diff > 0 && ratings[i] < 5) {
        ratings[i] = Math.min(5, ratings[i] + 1);
      } else if (diff < 0 && ratings[i] > 3) {
        ratings[i] = Math.max(3, ratings[i] - 1);
      }
    }
  }
  
  return ratings;
}

/**
 * GET: 상품 리뷰 조회
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { productCode: string } }
) {
  try {
    const { productCode } = params;

    // 상품 정보 조회
    const product = await prisma.cruiseProduct.findUnique({
      where: { productCode },
      select: {
        packageName: true,
        cruiseLine: true,
        shipName: true,
        nights: true,
        days: true,
        itineraryPattern: true,
        MallProductContent: {
          select: {
            layout: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { ok: false, error: '상품을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // layout에서 별점과 리뷰 개수 가져오기
    const layout = product.MallProductContent?.layout
      ? (typeof product.MallProductContent.layout === 'string'
          ? JSON.parse(product.MallProductContent.layout)
          : product.MallProductContent.layout)
      : null;

    const rating = layout?.rating || 4.4;
    const reviewCount = layout?.reviewCount || 0;

    if (reviewCount === 0) {
      return NextResponse.json({
        ok: true,
        reviews: [],
      });
    }

    // 기존 리뷰 조회
    let existingReviews = await prisma.cruiseReview.findMany({
      where: {
        productCode,
        isApproved: true,
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 리뷰 개수가 변경되었거나 기존 리뷰가 없으면 기존 리뷰 삭제 후 재생성
    if (existingReviews.length !== reviewCount || existingReviews.length === 0) {
      // 기존 리뷰 삭제 (soft delete)
      if (existingReviews.length > 0) {
        await prisma.cruiseReview.updateMany({
          where: {
            productCode,
            isDeleted: false,
          },
          data: {
            isDeleted: true,
          },
        });
      }

      // 새로운 리뷰 생성
      const ratings = generateRatings(rating, reviewCount);
      const reviewTemplates = generateReviewTemplates(product);
      const usedNicknames = new Set<string>();
      const usedReviews = new Set<string>(); // 사용된 리뷰 텍스트 추적
      
      for (let i = 0; i < reviewCount; i++) {
        // 자연스러운 닉네임 생성 (중복 방지)
        let nickname = generateNaturalNickname();
        let attempts = 0;
        while (usedNicknames.has(nickname) && attempts < 100) {
          nickname = generateNaturalNickname();
          attempts++;
        }
        usedNicknames.add(nickname);

        // 상품 정보 기반 리뷰 템플릿에서 랜덤 선택 (중복 방지)
        let reviewText = '';
        let reviewAttempts = 0;
        do {
          reviewText = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
          reviewAttempts++;
          // 이모티콘을 20% 확률로만 추가
          if (Math.random() < 0.2 && !reviewText.includes('ㅎ') && !reviewText.includes('ㅋ') && !reviewText.includes('^')) {
            const emoticon = EMOTICONS[Math.floor(Math.random() * EMOTICONS.length)];
            reviewText = reviewText + ' ' + emoticon;
          }
        } while (usedReviews.has(reviewText) && reviewAttempts < 50);
        
        usedReviews.add(reviewText);

        // 리뷰 생성
        await prisma.cruiseReview.create({
          data: {
            productCode,
            authorName: nickname,
            rating: ratings[i],
            content: reviewText,
            isApproved: true,
            isDeleted: false,
            createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // 최근 90일 내 랜덤 날짜
          },
        });
      }

      // 새로 생성된 리뷰 조회
      existingReviews = await prisma.cruiseReview.findMany({
        where: {
          productCode,
          isApproved: true,
          isDeleted: false,
        },
        orderBy: { createdAt: 'desc' },
        take: reviewCount,
      });
    } else if (existingReviews.length < reviewCount) {
      const needCount = reviewCount - existingReviews.length;
      const ratings = generateRatings(rating, needCount);
      
      // 상품 정보 기반 리뷰 템플릿 생성
      const reviewTemplates = generateReviewTemplates(product);
      
      const newReviews = [];
      const usedNicknames = new Set(existingReviews.map(r => r.authorName));
      const usedReviews = new Set(existingReviews.map(r => r.content)); // 기존 리뷰 텍스트 추적
      
      for (let i = 0; i < needCount; i++) {
        // 자연스러운 닉네임 생성 (중복 방지)
        let nickname = generateNaturalNickname();
        let attempts = 0;
        while (usedNicknames.has(nickname) && attempts < 100) {
          nickname = generateNaturalNickname();
          attempts++;
        }
        usedNicknames.add(nickname);

        // 상품 정보 기반 리뷰 템플릿에서 랜덤 선택 (중복 방지)
        let reviewText = '';
        let reviewAttempts = 0;
        do {
          reviewText = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
          reviewAttempts++;
          // 이모티콘을 20% 확률로만 추가
          if (Math.random() < 0.2 && !reviewText.includes('ㅎ') && !reviewText.includes('ㅋ') && !reviewText.includes('^')) {
            const emoticon = EMOTICONS[Math.floor(Math.random() * EMOTICONS.length)];
            reviewText = reviewText + ' ' + emoticon;
          }
        } while (usedReviews.has(reviewText) && reviewAttempts < 50);
        
        usedReviews.add(reviewText);

        // 리뷰 생성
        const review = await prisma.cruiseReview.create({
          data: {
            productCode,
            authorName: nickname,
            rating: ratings[i],
            content: reviewText,
            isApproved: true,
            isDeleted: false,
            createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // 최근 90일 내 랜덤 날짜
          },
        });

        newReviews.push(review);
      }

      // 새로 생성된 리뷰 조회
      existingReviews = await prisma.cruiseReview.findMany({
        where: {
          productCode,
          isApproved: true,
          isDeleted: false,
        },
        orderBy: { createdAt: 'desc' },
        take: reviewCount,
      });
    }

    // 응답 형식 변환
    const reviews = existingReviews.map((review) => ({
      id: review.id,
      authorName: review.authorName,
      rating: review.rating,
      content: review.content,
      createdAt: review.createdAt.toISOString(),
    }));

    return NextResponse.json({
      ok: true,
      reviews,
    });
  } catch (error: any) {
    console.error('[Product Reviews API] Error:', error);
    return NextResponse.json(
      { ok: false, error: '리뷰를 불러올 수 없습니다.' },
      { status: 500 }
    );
  }
}

