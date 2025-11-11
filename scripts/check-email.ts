// scripts/check-email.ts
// 이메일 중복 확인 스크립트

import prisma from '../lib/prisma';

async function checkEmail(email: string) {
  try {
    console.log(`\n🔍 이메일 확인: ${email}\n`);

    // User 테이블에서 확인
    const user = await prisma.user.findFirst({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        customerStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (user) {
      console.log('❌ User 테이블에 존재합니다:');
      console.log(JSON.stringify(user, null, 2));
    } else {
      console.log('✅ User 테이블에 존재하지 않습니다.');
    }

    // EmailAddressBook에서 확인
    const emailAddressBook = await prisma.emailAddressBook.findFirst({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        adminId: true,
        createdAt: true,
      },
    });

    if (emailAddressBook) {
      console.log('\n⚠️ EmailAddressBook에 존재합니다:');
      console.log(JSON.stringify(emailAddressBook, null, 2));
    } else {
      console.log('\n✅ EmailAddressBook에 존재하지 않습니다.');
    }

    // Prospect에서 확인
    const prospect = await prisma.prospect.findFirst({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        source: true,
        createdAt: true,
      },
    });

    if (prospect) {
      console.log('\n⚠️ Prospect에 존재합니다:');
      console.log(JSON.stringify(prospect, null, 2));
    } else {
      console.log('\n✅ Prospect에 존재하지 않습니다.');
    }

    console.log('\n' + '='.repeat(50) + '\n');

    if (user) {
      console.log('💡 해결 방법:');
      console.log(`   관리자 패널에서 사용자 ID ${user.id}를 삭제하거나,`);
      console.log(`   이메일을 null로 업데이트하세요.`);
    }
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 명령줄 인자에서 이메일 가져오기
const email = process.argv[2];

if (!email) {
  console.error('사용법: npx tsx scripts/check-email.ts <email>');
  console.error('예시: npx tsx scripts/check-email.ts hyeseon28@naver.com');
  process.exit(1);
}

checkEmail(email);

