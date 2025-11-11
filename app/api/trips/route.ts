import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';                 // ✅ default import
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'cg.sid.v2';

// GET: 사용자의 여행 기록 조회
export async function GET(req: Request) {
  try {
    const sid = cookies().get(SESSION_COOKIE)?.value;
    if (!sid) {
      return NextResponse.json({ ok: false, message: 'UNAUTHORIZED' }, { status: 401 });
    }

    const sess = await prisma.session.findUnique({
      where: { id: sid },
      select: { userId: true },
    });

    if (!sess?.userId) {
      return NextResponse.json({ ok: false, message: 'UNAUTHORIZED' }, { status: 401 });
    }

    // 사용자의 모든 여행 기록 조회
    const trips = await prisma.trip.findMany({
      where: { userId: sess.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        cruiseName: true,
        companionType: true,
        destination: true,
        startDate: true,
        endDate: true,
        nights: true,
        days: true,
        visitCount: true,
        createdAt: true,
      },
    });

    // Trip 형식으로 변환
    const formattedTrips = trips.map((trip) => ({
      id: trip.id,
      cruiseName: trip.cruiseName || '',
      companion: trip.companionType || '가족',
      destination: Array.isArray(trip.destination) 
        ? trip.destination.join(', ') 
        : (typeof trip.destination === 'string' ? trip.destination : ''),
      startDate: trip.startDate ? trip.startDate.toISOString().split('T')[0] : '',
      endDate: trip.endDate ? trip.endDate.toISOString().split('T')[0] : '',
      createdAt: trip.createdAt ? trip.createdAt.toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({ ok: true, trips: formattedTrips });
  } catch (error) {
    console.error('Trips GET error:', error);
    return NextResponse.json(
      { ok: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 국가명 -> 국가 코드 매핑 (한국어 국가명과 영어 국가명 모두 지원)
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  // 한국어 국가명
  '대한민국': 'KR', '한국': 'KR',
  '일본': 'JP',
  '중국': 'CN',
  '대만': 'TW', '타이완': 'TW',
  '홍콩': 'HK',
  '필리핀': 'PH',
  '미국': 'US',
  '캐나다': 'CA',
  '멕시코': 'MX',
  '영국': 'GB',
  '프랑스': 'FR',
  '독일': 'DE',
  '이탈리아': 'IT',
  '스페인': 'ES',
  '그리스': 'GR',
  '호주': 'AU', '오스트레일리아': 'AU',
  '뉴질랜드': 'NZ',
  '태국': 'TH',
  '베트남': 'VN',
  '싱가포르': 'SG',
  '인도네시아': 'ID',
  '말레이시아': 'MY',
  // 영어 국가명
  'South Korea': 'KR', 'Korea': 'KR',
  'Japan': 'JP',
  'China': 'CN',
  'Taiwan': 'TW',
  'Hong Kong': 'HK',
  'Philippines': 'PH',
  'United States': 'US', 'USA': 'US',
  'Canada': 'CA',
  'Mexico': 'MX',
  'United Kingdom': 'GB', 'UK': 'GB',
  'France': 'FR',
  'Germany': 'DE',
  'Italy': 'IT',
  'Spain': 'ES',
  'Greece': 'GR',
  'Australia': 'AU',
  'New Zealand': 'NZ',
  'Thailand': 'TH',
  'Vietnam': 'VN',
  'Singapore': 'SG',
  'Indonesia': 'ID',
  'Malaysia': 'MY',
};

// 국가 코드 -> 국가명 매핑
const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  'KR': '대한민국',
  'JP': '일본',
  'CN': '중국',
  'TW': '대만',
  'HK': '홍콩',
  'PH': '필리핀',
  'US': '미국',
  'CA': '캐나다',
  'MX': '멕시코',
  'GB': '영국',
  'FR': '프랑스',
  'DE': '독일',
  'IT': '이탈리아',
  'ES': '스페인',
  'GR': '그리스',
  'AU': '호주',
  'NZ': '뉴질랜드',
  'TH': '태국',
  'VN': '베트남',
  'SG': '싱가포르',
  'ID': '인도네시아',
  'MY': '말레이시아',
};

// 목적지 배열에서 국가 코드 추출
function extractCountryCodes(destinations: string[]): Map<string, { code: string; name: string }> {
  const visitedCountries = new Map<string, { code: string; name: string }>();
  
  destinations.forEach((dest) => {
    if (!dest) return;
    
    // 목적지 문자열에서 국가명 추출 (예: "중국 - 상하이" -> "중국")
    const destParts = dest.split(' - ')[0].split(',')[0].trim();
    
    // 국가명으로 국가 코드 찾기
    let countryCode = COUNTRY_NAME_TO_CODE[destParts];
    let countryName = destParts;
    
    // 매핑에서 찾지 못한 경우, 전체 문자열로도 시도
    if (!countryCode) {
      countryCode = COUNTRY_NAME_TO_CODE[dest];
      countryName = dest;
    }
    
    // 여전히 찾지 못한 경우, 부분 매칭 시도
    if (!countryCode) {
      for (const [name, code] of Object.entries(COUNTRY_NAME_TO_CODE)) {
        if (destParts.includes(name) || name.includes(destParts)) {
          countryCode = code;
          countryName = COUNTRY_CODE_TO_NAME[code] || name;
          break;
        }
      }
    }
    
    // 국가 코드를 찾았으면 추가
    if (countryCode && countryCode !== 'KR') { // 한국은 제외
      visitedCountries.set(countryCode, {
        code: countryCode,
        name: countryName,
      });
    }
  });
  
  return visitedCountries;
}

export async function POST(req: Request) {
  try {
    const sid = cookies().get(SESSION_COOKIE)?.value;
    if (!sid) return NextResponse.json({ ok: false, message: 'UNAUTHORIZED' }, { status: 401 });

    const sess = await prisma.session.findUnique({
      where: { id: sid },
      select: { userId: true },
    });
    if (!sess?.userId) return NextResponse.json({ ok: false, message: 'UNAUTHORIZED' }, { status: 401 });

    const body = await req.json();
    const {
      cruiseName = '',
      companionType = '가족',
      destination = [],
      startDate,
      endDate,
      nights = 0,
      days = 0,
      visitCount = 0,
    } = body || {};

    // 날짜 문자열을 DateTime으로 변환
    const startDateTime = startDate ? new Date(startDate) : null;
    const endDateTime = endDate ? new Date(endDate) : null;

    // 기존 최신 Trip 조회 (수정 모드 확인)
    const existingTrip = await prisma.trip.findFirst({
      where: { userId: sess.userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    let trip;
    const isUpdate = !!existingTrip;
    
    if (existingTrip) {
      // 기존 여행이 있으면 업데이트
      trip = await prisma.trip.update({
        where: { id: existingTrip.id },
        data: {
          cruiseName,
          companionType,
          destination,          // Prisma에서 Json/Json[] 타입이면 그대로 저장
          startDate: startDateTime,
          endDate: endDateTime,
          nights,
          days,
          visitCount,
        },
        select: { id: true },
      });
    } else {
      // 기존 여행이 없으면 새로 생성
      trip = await prisma.trip.create({
        data: {
          userId: sess.userId,
          cruiseName,
          companionType,
          destination,          // Prisma에서 Json/Json[] 타입이면 그대로 저장
          startDate: startDateTime,
          endDate: endDateTime,
          nights,
          days,
          visitCount,
        },
        select: { id: true },
      });
    }

    // 프로필 온보딩 완료 처리
    // currentTripEndDate도 설정 (자동 비밀번호 변경용)
    // 수정 모드면 온보딩 수정 추적 플래그 설정
    await prisma.user.update({
      where: { id: sess.userId },
      data: {
        onboarded: true,
        currentTripEndDate: endDateTime,
        // 온보딩 정보 수정 시 관리자 확인용 플래그 설정
        ...(isUpdate && {
          onboardingUpdatedAt: new Date(),
          onboardingUpdatedByUser: true,
        }),
      },
    });

    // 연동된 크루즈몰 사용자 상태 자동 활성화
    try {
      const genieUser = await prisma.user.findUnique({
        where: { id: sess.userId },
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
          console.log(`[Trips POST] 연동된 크루즈몰 사용자 (ID: ${linkedMallUserId}) 상태 활성화 완료`);
        }
      }
    } catch (error) {
      console.error('[Trips POST] 연동된 크루즈몰 사용자 상태 활성화 실패:', error);
      // 에러가 발생해도 여행 생성은 계속 진행
    }

    // 방문 국가 자동 기록 (VisitedCountry 업데이트)
    if (Array.isArray(destination) && destination.length > 0) {
      const visitedCountries = extractCountryCodes(destination);
      
      for (const [countryCode, countryInfo] of visitedCountries) {
        await prisma.visitedCountry.upsert({
          where: {
            userId_countryCode: {
              userId: sess.userId,
              countryCode,
            },
          },
          update: {
            visitCount: { increment: 1 },
            lastVisited: startDateTime || new Date(),
          },
          create: {
            userId: sess.userId,
            countryCode,
            countryName: countryInfo.name,
            visitCount: 1,
            lastVisited: startDateTime || new Date(),
          },
        });
      }
    }

    // 수정 모드면 /profile로, 새로 등록하면 /chat으로 이동
    const nextUrl = isUpdate ? '/profile' : '/chat';
    return NextResponse.json({ ok: true, next: nextUrl, tripId: trip.id }, { status: 200 });
  } catch (e) {
    console.error('TRIPS_POST_ERROR', e);
    return NextResponse.json({ ok: false, message: 'SERVER_ERROR' }, { status: 500 });
  }
}



