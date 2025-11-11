import prisma from '../lib/prisma';

async function main() {
  console.log('관리자 계정 생성 중... (user1~user10, 비밀번호: 0000)');

  for (let i = 1; i <= 10; i++) {
    const name = `user${i}`;
    const phone = `0100000${String(i).padStart(4, '0')}`;
    const password = '0000';

    try {
      const existing = await prisma.user.findFirst({
        where: {
          name,
          phone,
          role: 'admin',
        },
      });

      if (existing) {
        console.log(`✅ ${name} (${phone}) - 이미 존재함`);
        // 비밀번호 업데이트
        await prisma.user.update({
          where: { id: existing.id },
          data: { password },
        });
      } else {
        const admin = await prisma.user.create({
          data: {
            name,
            phone,
            password,
            role: 'admin',
            onboarded: true,
            loginCount: 0,
          },
        });
        console.log(`✅ ${name} (${phone}) - 생성 완료 (ID: ${admin.id})`);
      }
    } catch (error: any) {
      console.error(`❌ ${name} 생성 실패:`, error.message);
    }
  }

  console.log('\n✅ 관리자 계정 생성 완료!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('로그인 정보:');
  console.log('  이름: user1 ~ user10');
  console.log('  전화번호: 01000000001 ~ 01000000010');
  console.log('  비밀번호: 0000');
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

