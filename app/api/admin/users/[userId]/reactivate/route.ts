// app/api/admin/users/[id]/reactivate/route.ts
// 관리자용: 사용자 재활성화 및 새 여행 등록 API

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { normalizeItineraryPattern, extractVisitedCountriesFromItineraryPattern, extractDestinationsFromItineraryPattern } from '@/lib/utils/itineraryPattern';

const SESSION_COOKIE = 'cg.sid.v2';

// 관리자 권한 확인
async function checkAdminAuth(sid: string | undefined): Promise<boolean> {
  if (!sid) return false;

  const session = await prisma.session.findUnique({
    where: { id: sid },
      include: {
        User: {  // ✅ 대문자 U로 변경
          select: { role: true },
        },
      },
    });

  return session?.User.role === 'admin';  // ✅ 대문자 U로 변경
}

export async function POST(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // 관리자 권한 확인
    const sid = cookies().get(SESSION_COOKIE)?.value;
    const isAdmin = await checkAdminAuth(sid);

    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 });
    }

    const userId = parseInt(params.userId);
    const { productCode, departureDate } = await req.json();

    if (!productCode || !departureDate) {
      return NextResponse.json(
        { ok: false, error: 'Product code and departure date required' },
        { status: 400 }
      );
    }

    // 1. 사용자 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
    }

    // 2. CruiseProduct 조회
    const product = await prisma.cruiseProduct.findUnique({
      where: { productCode: productCode.toUpperCase() },
    });

    if (!product) {
      return NextResponse.json(
        { ok: false, error: `Product code '${productCode}' not found` },
        { status: 404 }
      );
    }

    // 3. 날짜 계산
    const startDate = new Date(departureDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + product.days - 1);

    // 4. 목적지 및 방문 국가 추출
    const itineraryPattern = normalizeItineraryPattern(product.itineraryPattern);
    const destinations = extractDestinationsFromItineraryPattern(product.itineraryPattern);
    const visitedCountries = extractVisitedCountriesFromItineraryPattern(product.itineraryPattern);

    // 5. Trip 생성
    const trip = await prisma.trip.create({
      data: {
        userId,
        productId: product.id,
        reservationCode: productCode.toUpperCase(),
        cruiseName: `${product.cruiseLine} ${product.shipName}`,
        companionType: '가족',
        destination: destinations,
        startDate,
        endDate,
        nights: product.nights,
        days: product.days,
        visitCount: destinations.length,
        status: 'Upcoming',
      },
    });

    // 6. Itinerary 생성
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

    // 7. 사용자 재활성화 및 업데이트
    await prisma.user.update({
      where: { id: userId },
      data: {
        isHibernated: false,
        hibernatedAt: null,
        lastActiveAt: new Date(),
        totalTripCount: { increment: 1 },
        onboarded: true,
      },
    });

    // 연동된 크루즈몰 사용자 상태 자동 활성화
    try {
      // 크루즈가이드 사용자이고 연동된 크루즈몰 사용자가 있는 경우
      if (user.role === 'user') {
        const genieUser = await prisma.user.findUnique({
          where: { id: userId },
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
            console.log(`[Reactivate] 연동된 크루즈몰 사용자 (ID: ${linkedMallUserId}) 상태 활성화 완료`);
          }
        }
      }
    } catch (error) {
      console.error('[Reactivate] 연동된 크루즈몰 사용자 상태 활성화 실패:', error);
      // 에러가 발생해도 재활성화는 계속 진행
    }

    // 8. VisitedCountry 업데이트
    for (const [countryCode, countryInfo] of visitedCountries) {
      await prisma.visitedCountry.upsert({
        where: {
          userId_countryCode: {
            userId,
            countryCode,
          },
        },
        update: {
          visitCount: { increment: 1 },
          lastVisited: startDate,
        },
        create: {
          userId,
          countryCode,
          countryName: countryInfo.name,
          visitCount: 1,
          lastVisited: startDate,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      message: 'User reactivated and trip created successfully',
      trip: {
        id: trip.id,
        cruiseName: trip.cruiseName,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error('[Admin Reactivate API] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

