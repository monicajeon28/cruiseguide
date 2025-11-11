import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'cg.sid.v2';

/**
 * 관리자가 최근 여행에 온보딩 추가
 * - Trip을 찾아서 온보딩 정보 설정
 * - 비밀번호를 3800으로 변경
 * - tripCount >= 2이면 RePurchaseTrigger 생성 및 converted: true 설정
 */
async function checkAdminAuth() {
  const sessionId = cookies().get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    return null;
  }

  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { User: true },
    });

    if (session && session.User.role === 'admin') {
      return session.User;
    }
  } catch (error) {
    console.error('[Admin Auth] Error:', error);
  }

  return null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string; tripId: string } }
) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(params.userId);
    const tripId = parseInt(params.tripId);

    if (isNaN(userId) || isNaN(tripId)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid user ID or trip ID' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { productId, productCode, cruiseName, startDate, endDate, companionType, destination, itineraryPattern } = body;

    // 필수 필드 검증
    if (!productId || !cruiseName || !startDate || !endDate) {
      return NextResponse.json(
        { ok: false, error: '상품 ID, 크루즈명, 여행 시작일, 종료일은 필수입니다.' },
        { status: 400 }
      );
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        password: true,
        tripCount: true,
        currentTripEndDate: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Trip 조회 (tripId가 0이거나 없으면 건너뛰기 - 여행배정에서 사용)
    let trip = null;
    if (tripId > 0) {
      trip = await prisma.trip.findUnique({
        where: { id: tripId },
        select: {
          id: true,
          userId: true,
          cruiseName: true,
          startDate: true,
          endDate: true,
          destination: true,
          companionType: true,
          nights: true,
          days: true,
        },
      });

      if (!trip) {
        return NextResponse.json(
          { ok: false, error: 'Trip not found' },
          { status: 404 }
        );
      }

      if (trip.userId !== userId) {
        return NextResponse.json(
          { ok: false, error: 'Trip does not belong to this user' },
          { status: 403 }
        );
      }
    }

    // 날짜 계산
    const start = new Date(startDate);
    const end = new Date(endDate);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const days = nights + 1;

    // 목적지 배열 처리
    const destinationArray = Array.isArray(destination) 
      ? destination 
      : destination 
      ? [destination] 
      : [];

    // 새로운 Trip 생성 (기존 Trip은 그대로 유지)
    const newTrip = await prisma.trip.create({
      data: {
        userId: userId,
        productId: productId,
        cruiseName: cruiseName,
        startDate: start,
        endDate: end,
        companionType: companionType || null,
        destination: destinationArray.length > 0 ? destinationArray : null,
        nights: nights,
        days: days,
        visitCount: destinationArray.length,
        status: 'Upcoming',
        updatedAt: new Date(),
      },
    });

    // Itinerary 자동 생성 (크루즈 가이드 지니 AI 연결)
    if (itineraryPattern && Array.isArray(itineraryPattern)) {
      const itineraries = [];
      for (let i = 0; i < itineraryPattern.length; i++) {
        const dayData = itineraryPattern[i];
        const dayDate = new Date(start);
        dayDate.setDate(dayDate.getDate() + i);

        itineraries.push({
          tripId: newTrip.id,
          day: i + 1,
          date: dayDate,
          type: dayData.type || 'Cruising',
          location: dayData.location || null,
          country: dayData.country || null,
          currency: dayData.currency || null,
          language: dayData.language || null,
          arrival: dayData.arrival || null,
          departure: dayData.departure || null,
          updatedAt: new Date(),
        });
      }

      if (itineraries.length > 0) {
        await prisma.itinerary.createMany({
          data: itineraries,
        });
      }
    }

    // VisitedCountry 자동 생성 (크루즈 가이드 지니 AI 연결)
    // PortVisit, Embarkation, Disembarkation 모두 포함 (한국 제외)
    if (itineraryPattern && Array.isArray(itineraryPattern)) {
      const countryMap = new Map<string, { name: string; location: string }>();
      const countryNameMap: Record<string, string> = {
        'JP': '일본', 'TH': '태국', 'VN': '베트남', 'MY': '말레이시아',
        'SG': '싱가포르', 'ES': '스페인', 'FR': '프랑스', 'IT': '이탈리아',
        'GR': '그리스', 'TR': '터키', 'US': '미국', 'CN': '중국',
        'TW': '대만', 'HK': '홍콩', 'PH': '필리핀', 'ID': '인도네시아'
      };

      itineraryPattern.forEach((day: any) => {
        if (day.country && day.country !== 'KR' && day.location && 
            (day.type === 'PortVisit' || day.type === 'Embarkation' || day.type === 'Disembarkation')) {
          const countryName = countryNameMap[day.country] || day.location;
          // 같은 국가가 여러 번 나와도 한 번만 기록 (가장 대표적인 위치 사용)
          if (!countryMap.has(day.country)) {
            countryMap.set(day.country, { name: countryName, location: day.location });
          }
        }
      });

      for (const [countryCode, countryInfo] of countryMap.entries()) {
        await prisma.visitedCountry.upsert({
          where: {
            userId_countryCode: {
              userId: user.id,
              countryCode,
            },
          },
          update: {
            visitCount: { increment: 1 },
            lastVisited: start,
            updatedAt: new Date(),
          },
          create: {
            userId: user.id,
            countryCode,
            countryName: countryInfo.name,
            visitCount: 1,
            lastVisited: start,
            updatedAt: new Date(),
          },
        });
      }
    }

    // 비밀번호 이벤트 기록 (8300에서 3800으로 변경)
    if (user.password !== '3800') {
      await prisma.passwordEvent.create({
        data: {
          userId: user.id,
          from: user.password,
          to: '3800',
          reason: '온보딩 추가 - 크루즈 가이드 지니 활성화',
        },
      });
    }

    // 비밀번호를 3800으로 변경, 온보딩 설정, tripCount 증가, 잠금 해제, 고객 상태를 active로 변경
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: '3800',
        currentTripEndDate: end,
        onboarded: true,
        loginCount: 0,
        tripCount: { increment: 1 },
        totalTripCount: { increment: 1 },
        isLocked: false, // 잠금 해제
        lockedAt: null,
        lockedReason: null,
        customerStatus: 'active', // 테스트 고객을 활성 고객으로 변경
        isHibernated: false, // 동면 해제
        hibernatedAt: null,
      },
    });

    // 연동된 크루즈몰 사용자 상태 자동 활성화
    try {
      // 크루즈가이드 사용자이고 연동된 크루즈몰 사용자가 있는 경우
      if (updatedUser.role === 'user') {
        const genieUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            role: true,
            mallUserId: true,
          },
        });

        if (genieUser && genieUser.mallUserId) {
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
            console.log(`[Admin Onboarding] 연동된 크루즈몰 사용자 (ID: ${linkedMallUserId}) 상태 활성화 완료`);
          }
        }
      }
    } catch (error) {
      console.error('[Admin Onboarding] 연동된 크루즈몰 사용자 상태 활성화 실패:', error);
      // 에러가 발생해도 온보딩 추가는 계속 진행
    }

    // 재구매 체크: tripCount >= 2이면 RePurchaseTrigger 생성 및 converted: true 설정
    if (updatedUser.tripCount >= 2) {
      // 이전 여행의 종료일 찾기 (방금 생성한 여행 제외)
      const previousTrip = await prisma.trip.findFirst({
        where: {
          userId: user.id,
          id: { not: newTrip.id },
        },
        orderBy: { endDate: 'desc' },
      });

      if (previousTrip) {
        // 기존 RePurchaseTrigger가 있는지 확인
        const existingTrigger = await prisma.rePurchaseTrigger.findFirst({
          where: {
            userId: user.id,
            lastTripEndDate: previousTrip.endDate,
          },
        });

        if (!existingTrigger) {
          // RePurchaseTrigger 생성 및 즉시 converted: true 설정
          await prisma.rePurchaseTrigger.create({
            data: {
              userId: user.id,
              lastTripEndDate: previousTrip.endDate,
              triggerType: 're_purchase',
              messageSent: false,
              converted: true,
              convertedAt: new Date(),
              updatedAt: new Date(),
            },
          });
        } else if (!existingTrigger.converted) {
          // 기존 트리거가 있으면 converted로 업데이트
          await prisma.rePurchaseTrigger.update({
            where: { id: existingTrigger.id },
            data: {
              converted: true,
              convertedAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: '온보딩이 완료되었습니다. 크루즈 가이드 지니가 활성화되었습니다.',
      trip: {
        id: newTrip.id,
        cruiseName: newTrip.cruiseName,
        startDate: newTrip.startDate,
        endDate: newTrip.endDate,
      },
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        tripCount: updatedUser.tripCount,
      },
      isRePurchase: updatedUser.tripCount >= 2,
    });
  } catch (error: any) {
    console.error('[Admin Onboarding Add] Error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || '온보딩 추가 실패' },
      { status: 500 }
    );
  }
}

