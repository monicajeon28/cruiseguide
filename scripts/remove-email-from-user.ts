// scripts/remove-email-from-user.ts
// 특정 사용자의 이메일을 제거하는 스크립트

import prisma from '../lib/prisma';

async function removeEmailFromUser(userId: number) {
  try {
    console.log(`\n🔍 사용자 ID ${userId} 확인 중...\n`);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        customerStatus: true,
      },
    });

    if (!user) {
      console.log(`❌ 사용자 ID ${userId}를 찾을 수 없습니다.`);
      return;
    }

    console.log('현재 사용자 정보:');
    console.log(JSON.stringify(user, null, 2));

    if (!user.email) {
      console.log('\n✅ 이미 이메일이 없습니다.');
      return;
    }

    console.log(`\n⚠️ 이메일 "${user.email}"을 제거하시겠습니까?`);
    console.log('   (이 작업은 되돌릴 수 없습니다.)\n');

    // 이메일을 null로 업데이트
    await prisma.user.update({
      where: { id: userId },
      data: { email: null },
    });

    console.log(`✅ 사용자 ID ${userId}의 이메일이 제거되었습니다.`);
    console.log(`   이제 "${user.email}"로 회원가입이 가능합니다.\n`);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 명령줄 인자에서 사용자 ID 가져오기
const userId = parseInt(process.argv[2]);

if (!userId || isNaN(userId)) {
  console.error('사용법: npx tsx scripts/remove-email-from-user.ts <userId>');
  console.error('예시: npx tsx scripts/remove-email-from-user.ts 5');
  process.exit(1);
}

removeEmailFromUser(userId);

