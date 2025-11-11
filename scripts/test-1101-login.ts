// scripts/test-1101-login.ts
// 1101 로그인 API 테스트 스크립트

import prisma from '../lib/prisma';

async function main() {
  console.log('🧪 1101 로그인 API 테스트 시작...\n');

  // 테스트용 사용자 정보
  const testName = '테스트' + Date.now();
  const testPhone = '010' + Math.floor(Math.random() * 10000000).toString().padStart(8, '0');
  const testPassword = '1101';

  console.log('📝 테스트 사용자 정보:');
  console.log(`   이름: ${testName}`);
  console.log(`   전화: ${testPhone}`);
  console.log(`   비밀번호: ${testPassword}\n`);

  // 로그인 API 호출 시뮬레이션
  console.log('1️⃣ 사용자 조회 시작...');
  let testUser = await prisma.user.findFirst({
    where: {
      name: testName,
      password: '1101',
      role: 'user',
      phone: testPhone,
    },
    select: { 
      id: true, 
      password: true, 
      onboarded: true, 
      loginCount: true, 
      customerStatus: true,
      testModeStartedAt: true,
      Trip: { select: { id: true }, take: 1 },
    },
  });

  console.log('   사용자 조회 결과:', { found: !!testUser, userId: testUser?.id });

  if (!testUser) {
    console.log('2️⃣ 신규 사용자 생성 시작...');
    const now = new Date();
    testUser = await prisma.user.create({
      data: {
        name: testName,
        phone: testPhone,
        password: '1101',
        onboarded: false,
        loginCount: 1,
        role: 'user',
        customerStatus: 'test',
        testModeStartedAt: now,
      },
      select: { 
        id: true, 
        password: true, 
        onboarded: true, 
        loginCount: true, 
        customerStatus: true,
        testModeStartedAt: true,
        Trip: { select: { id: true }, take: 1 },
      },
    });
    console.log('   ✅ 사용자 생성 완료:', { userId: testUser.id });
  }

  console.log('3️⃣ Trip 존재 여부 확인...');
  const existingTrip = testUser.Trip && testUser.Trip.length > 0 ? testUser.Trip[0] : null;
  console.log('   Trip 존재 여부:', { hasTrip: !!existingTrip, tripId: existingTrip?.id });

  if (!existingTrip) {
    console.log('4️⃣ POP-SEA-001 상품 조회 시작...');
    const product = await prisma.cruiseProduct.findUnique({
      where: { productCode: 'POP-SEA-001' },
    });

    console.log('   상품 조회 결과:', { 
      found: !!product,
      productId: product?.id,
      productCode: product?.productCode,
      cruiseLine: product?.cruiseLine,
      shipName: product?.shipName,
      nights: product?.nights,
      days: product?.days,
    });

    if (product) {
      console.log('5️⃣ Trip 생성 시작...');
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 3);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + product.days - 1);
      endDate.setHours(23, 59, 59, 999);

      const itineraryPattern = product.itineraryPattern as any[];
      const destinations: string[] = [];
      itineraryPattern.forEach((item) => {
        if (item.type === 'PortVisit' && item.location && !destinations.includes(item.location)) {
          destinations.push(item.location);
        }
      });

      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const reservationCode = `CRD-${dateStr}-${randomStr}`;

      try {
        const trip = await prisma.trip.create({
          data: {
            userId: testUser.id,
            productId: product.id,
            reservationCode,
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

        console.log('   ✅ Trip 생성 성공:', {
          tripId: trip.id,
          cruiseName: `${product.cruiseLine} ${product.shipName}`,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        });

        // Itinerary 생성
        console.log('6️⃣ Itinerary 생성 시작...');
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
        console.log('   ✅ Itinerary 생성 완료:', { count: itineraries.length });

        // 온보딩 완료 상태 설정
        console.log('7️⃣ 온보딩 완료 상태 설정...');
        await prisma.user.update({
          where: { id: testUser.id },
          data: {
            onboarded: true,
            totalTripCount: { increment: 1 },
          },
        });
        console.log('   ✅ 온보딩 완료 상태 설정 완료');

        console.log('\n✅ 모든 작업 완료!');
      } catch (error) {
        console.error('   ❌ Trip 생성 실패:', error);
        console.error('   에러 상세:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    } else {
      console.error('   ❌ POP-SEA-001 상품을 찾을 수 없습니다!');
    }
  } else {
    console.log('   ℹ️ 기존 Trip이 있음, 생성 건너뜀');
  }
}

main()
  .catch((e) => {
    console.error('❌ 오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

