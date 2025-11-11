// app/api/trips/auto-create/route.ts
// 온보딩 자동화: 예약 번호와 출발 날짜만으로 여행 자동 생성

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { normalizeItineraryPattern, extractVisitedCountriesFromItineraryPattern, extractDestinationsFromItineraryPattern } from '@/lib/utils/itineraryPattern';

const SESSION_COOKIE = 'cg.sid.v2';

// 예약번호 자동 생성 함수
function generateReservationCode(productCode: string, userId: number): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, '0'); // 0000-9999
  return `CRD-${dateStr}-${randomStr}`;
}

// 국가 코드 -> 국가명 매핑 (deprecated - getKoreanCountryName 사용 권장)
const COUNTRY_NAMES: Record<string, string> = {
  KR: '한국',
  JP: '일본',
  TW: '대만',
  CN: '중국',
  HK: '홍콩',
  US: '미국',
  SG: '싱가포르',
  TH: '태국',
  VN: '베트남',
};

export async function POST(req: Request) {
  try {
    // 1) 세션 확인
    const sid = cookies().get(SESSION_COOKIE)?.value;
    if (!sid) {
      return NextResponse.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { id: sid },
      select: { userId: true },
    });

    if (!session?.userId) {
      return NextResponse.json({ ok: false, error: '세션이 유효하지 않습니다.' }, { status: 401 });
    }

    // 2) 요청 데이터 파싱
    const { productCode, departureDate } = await req.json();

    if (!productCode || !departureDate) {
      return NextResponse.json(
        { ok: false, error: '예약 번호와 출발 날짜를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 3) CruiseProduct 조회
    const product = await prisma.cruiseProduct.findUnique({
      where: { productCode: productCode.toUpperCase() },
    });

    if (!product) {
      return NextResponse.json(
        { ok: false, error: `예약 번호 '${productCode}'를 찾을 수 없습니다. 예약 확인서를 다시 확인해주세요.` },
        { status: 404 }
      );
    }

    // 4) 출발 날짜 파싱
    const startDate = new Date(departureDate);
    startDate.setHours(0, 0, 0, 0);

    // 5) 종료 날짜 계산 (출발일 + (days - 1)일)
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + product.days - 1);

    // 6) 목적지 배열 생성 (itineraryPattern에서 추출)
    const itineraryPattern = normalizeItineraryPattern(product.itineraryPattern);
    const destinations = extractDestinationsFromItineraryPattern(product.itineraryPattern);
    const visitedCountries = extractVisitedCountriesFromItineraryPattern(product.itineraryPattern);

    // 7) 예약번호 자동 생성
    const reservationCode = generateReservationCode(productCode, session.userId);

    // 8) Trip 생성
    const trip = await prisma.trip.create({
      data: {
        userId: session.userId,
        productId: product.id,
        reservationCode, // 자동 생성된 예약번호
        cruiseName: `${product.cruiseLine} ${product.shipName}`,
        companionType: '가족', // 기본값 (온보딩에서 수정 가능)
        destination: destinations,
        startDate,
        endDate,
        nights: product.nights,
        days: product.days,
        visitCount: destinations.length,
        status: 'Upcoming',
      },
    });

    // 9) Itinerary 레코드들 자동 생성
    const itineraries = [];
    for (const pattern of itineraryPattern) {
      const dayDate = new Date(startDate);
      dayDate.setDate(dayDate.getDate() + pattern.day - 1);

      itineraries.push({
        tripId: trip.id,
        day: pattern.day,
        date: dayDate,
        type: pattern.type,
        location: pattern.location || null,
        country: pattern.country || null,
        currency: pattern.currency || null,
        language: pattern.language || null,
        arrival: pattern.arrival || null,
        departure: pattern.departure || null,
        time: pattern.time || null,
      });
    }

    await prisma.itinerary.createMany({
      data: itineraries,
    });

    // 10) User.totalTripCount 증가
    await prisma.user.update({
      where: { id: parseInt(session.userId) },
      data: {
        totalTripCount: { increment: 1 },
        onboarded: true,
      },
    });

    // 연동된 크루즈몰 사용자 상태 자동 활성화
    try {
      const genieUser = await prisma.user.findUnique({
        where: { id: parseInt(session.userId) },
        select: {
          id: true,
          role: true,
          mallUserId: true,
        },
      });

      // 크루즈가이드 사용자이고 연동된 크루즈몰 사용자가 있는 경우
      if (genieUser && genieUser.role === 'user' && genieUser.mallUserId) {
        const mallUserIdNum = parseInt(genieUser.mallUserId);
        let linkedMallUserId = null;

        if (!isNaN(mallUserIdNum)) {
          linkedMallUserId = mallUserIdNum;
        } else {
          // phone으로 찾기
          const mallUser = await prisma.user.findFirst({
            where: {
              phone: genieUser.mallUserId,
              role: 'community',
            },
            select: { id: true },
          });
          if (mallUser) {
            linkedMallUserId = mallUser.id;
          }
        }

        if (linkedMallUserId) {
          // 연동된 크루즈몰 사용자 상태 활성화
          await prisma.user.update({
            where: { id: linkedMallUserId },
            data: {
              isLocked: false,
              lockedAt: null,
              lockedReason: null,
              isHibernated: false,
              hibernatedAt: null,
              customerStatus: 'active',
              lastActiveAt: new Date(),
            },
          });
          console.log(`[Auto-Create] 연동된 크루즈몰 사용자 (ID: ${linkedMallUserId}) 상태 활성화 완료`);
        }
      }
    } catch (error) {
      console.error('[Auto-Create] 연동된 크루즈몰 사용자 상태 활성화 실패:', error);
      // 에러가 발생해도 여행 생성은 계속 진행
    }

    // 11) VisitedCountry 업데이트
    for (const [countryCode, countryInfo] of visitedCountries) {
      await prisma.visitedCountry.upsert({
        where: {
          userId_countryCode: {
            userId: session.userId,
            countryCode,
          },
        },
        update: {
          visitCount: { increment: 1 },
          lastVisited: startDate,
        },
        create: {
          userId: session.userId,
          countryCode,
          countryName: countryInfo.name,
          visitCount: 1,
          lastVisited: startDate,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      message: '여행 정보가 성공적으로 생성되었습니다!',
      trip: {
        id: trip.id,
        reservationCode: trip.reservationCode,
        cruiseName: trip.cruiseName,
        nights: trip.nights,
        days: trip.days,
        destinations,
      },
    });
  } catch (error) {
    console.error('[AUTO-CREATE] Error:', error);
    return NextResponse.json(
      { ok: false, error: '여행 정보 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

