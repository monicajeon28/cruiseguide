import prisma from '../lib/prisma';

async function main() {
  console.log('관리자 계정 생성/업데이트 중...');

  const admins = [
    {
      name: '관리자',
      phone: '01024958013',
      password: '0313',
    },
    {
      name: '관리자2',
      phone: '01038609161',
      password: '0313',
    },
  ];

  for (const adminData of admins) {
    try {
      // 기존 계정 확인
      const existing = await prisma.user.findFirst({
        where: {
          phone: adminData.phone,
        },
      });

      if (existing) {
        // 기존 계정 업데이트
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: adminData.name,
            phone: adminData.phone,
            password: adminData.password,
            role: 'admin',
            onboarded: true,
          },
        });
        console.log(`✅ ${adminData.name} (${adminData.phone}) - 업데이트 완료`);
      } else {
        // 새 계정 생성
        const admin = await prisma.user.create({
          data: {
            name: adminData.name,
            phone: adminData.phone,
            password: adminData.password,
            role: 'admin',
            onboarded: true,
            loginCount: 0,
          },
        });
        console.log(`✅ ${adminData.name} (${adminData.phone}) - 생성 완료 (ID: ${admin.id})`);
      }
    } catch (error: any) {
      console.error(`❌ ${adminData.name} 생성/업데이트 실패:`, error.message);
    }
  }

  console.log('\n✅ 관리자 계정 설정 완료!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('관리자 로그인 정보:');
  console.log('  1. 이름: 관리자, 전화번호: 01024958013, 비밀번호: 0313');
  console.log('  2. 이름: 관리자2, 전화번호: 01038609161, 비밀번호: 0313');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

