import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminPhone = '01024958013';

  // 전화번호로 모든 계정 찾기
  const users = await prisma.user.findMany({
    where: {
      phone: adminPhone,
    },
    orderBy: {
      id: 'asc',
    },
  });

  console.log(`\n=== 전화번호 ${adminPhone}로 찾은 계정: ${users.length}개 ===\n`);

  // 관리자 계정 찾기
  const adminUser = users.find(u => u.role === 'admin');
  const nonAdminUsers = users.filter(u => u.role !== 'admin');

  if (adminUser) {
    console.log('✅ 관리자 계정:');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   이름: ${adminUser.name}`);
    console.log(`   역할: ${adminUser.role}\n`);

    // 관리자가 아닌 계정들 처리
    if (nonAdminUsers.length > 0) {
      console.log(`⚠️  관리자가 아닌 중복 계정 ${nonAdminUsers.length}개 발견:\n`);
      nonAdminUsers.forEach((user) => {
        console.log(`   ID: ${user.id}, 이름: ${user.name}, 역할: ${user.role}`);
      });

      // 중복 계정 삭제
      console.log('\n중복 계정을 삭제합니다...');
      for (const user of nonAdminUsers) {
        await prisma.user.delete({
          where: { id: user.id },
        });
        console.log(`✅ ID ${user.id} 계정 삭제 완료`);
      }
    } else {
      console.log('✅ 중복 계정이 없습니다.');
    }
  } else {
    console.log('❌ 관리자 계정을 찾을 수 없습니다.');
  }

  // 최종 확인
  const finalUsers = await prisma.user.findMany({
    where: {
      phone: adminPhone,
    },
  });

  console.log(`\n=== 최종 확인: 전화번호 ${adminPhone}로 찾은 계정: ${finalUsers.length}개 ===\n`);
  finalUsers.forEach((user) => {
    console.log(`ID: ${user.id}, 이름: ${user.name}, 역할: ${user.role}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

























