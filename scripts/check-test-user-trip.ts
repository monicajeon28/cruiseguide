// scripts/check-test-user-trip.ts
// 테스트 사용자의 Trip 확인 스크립트

import prisma from '../lib/prisma';

async function main() {
  console.log('🔍 테스트 사용자 Trip 확인 시작...\n');

  // 비밀번호가 1101인 사용자 찾기
  const testUsers = await prisma.user.findMany({
    where: {
      password: '1101',
      role: 'user',
    },
    select: {
      id: true,
      name: true,
      phone: true,
      onboarded: true,
      customerStatus: true,
      testModeStartedAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  console.log(`📊 비밀번호 1101 사용자 수: ${testUsers.length}\n`);

  for (const user of testUsers) {
    console.log(`👤 사용자: ${user.name} (ID: ${user.id}, 전화: ${user.phone})`);
    console.log(`   온보딩: ${user.onboarded}, 상태: ${user.customerStatus}`);

    // 해당 사용자의 Trip 조회
    const trips = await prisma.trip.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        cruiseName: true,
        startDate: true,
        endDate: true,
        nights: true,
        days: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`   Trip 수: ${trips.length}`);
    if (trips.length > 0) {
      trips.forEach((trip, idx) => {
        console.log(`   Trip ${idx + 1}:`);
        console.log(`     ID: ${trip.id}`);
        console.log(`     크루즈: ${trip.cruiseName}`);
        console.log(`     출발일: ${trip.startDate?.toISOString().split('T')[0]}`);
        console.log(`     종료일: ${trip.endDate?.toISOString().split('T')[0]}`);
        console.log(`     ${trip.nights}박 ${trip.days}일`);
        console.log(`     생성일: ${trip.createdAt.toISOString()}`);
      });
    } else {
      console.log(`   ⚠️ Trip이 없습니다!`);
    }
    console.log('');
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

