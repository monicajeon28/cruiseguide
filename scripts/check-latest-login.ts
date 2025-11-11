// scripts/check-latest-login.ts
// 최근 로그인한 사용자와 Trip 확인

import prisma from '../lib/prisma';

async function main() {
  console.log('🔍 최근 로그인한 사용자 확인...\n');

  // 최근 생성된 세션 확인
  const recentSessions = await prisma.session.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
    select: {
      id: true,
      userId: true,
      createdAt: true,
      User: {
        select: {
          id: true,
          name: true,
          phone: true,
          password: true,
          onboarded: true,
          customerStatus: true,
        },
      },
    },
  });

  console.log(`📊 최근 세션 수: ${recentSessions.length}\n`);

  for (const session of recentSessions) {
    const user = session.User;
    console.log(`👤 사용자: ${user?.name || 'N/A'} (ID: ${user?.id}, 전화: ${user?.phone})`);
    console.log(`   비밀번호: ${user?.password}, 온보딩: ${user?.onboarded}, 상태: ${user?.customerStatus}`);
    console.log(`   세션 생성일: ${session.createdAt.toISOString()}`);

    if (user) {
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
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      console.log(`   Trip 수: ${trips.length}`);
      if (trips.length > 0) {
        trips.forEach((trip, idx) => {
          console.log(`   Trip ${idx + 1}: ${trip.cruiseName} (${trip.startDate?.toISOString().split('T')[0]})`);
        });
      } else {
        console.log(`   ⚠️ Trip이 없습니다!`);
      }
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

