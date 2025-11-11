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
    console.log(`   전화번호: ${adminUser.phone}`);
    console.log(`   역할: ${adminUser.role}\n`);

    // 관리자가 아닌 계정들 처리
    if (nonAdminUsers.length > 0) {
      console.log(`⚠️  관리자가 아닌 중복 계정 ${nonAdminUsers.length}개 발견:\n`);
      nonAdminUsers.forEach((user) => {
        console.log(`   ID: ${user.id}, 이름: ${user.name}, 역할: ${user.role}`);
      });

      // 중복 계정의 전화번호 변경 (삭제 불가능하므로)
      console.log('\n중복 계정의 전화번호를 변경합니다...');
      for (const user of nonAdminUsers) {
        const newPhone = `0100000${user.id}`; // 고유한 전화번호로 변경
        await prisma.user.update({
          where: { id: user.id },
          data: {
            phone: newPhone,
          },
        });
        console.log(`✅ ID ${user.id} 계정의 전화번호를 ${newPhone}로 변경 완료`);
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
  if (finalUsers.length === 1 && finalUsers[0].role === 'admin') {
    console.log('✅ 완료! 관리자 계정만 남았습니다.');
    console.log(`   ID: ${finalUsers[0].id}`);
    console.log(`   이름: ${finalUsers[0].name}`);
    console.log(`   전화번호: ${finalUsers[0].phone}`);
    console.log(`   비밀번호: ${finalUsers[0].password}`);
    console.log(`   역할: ${finalUsers[0].role}`);
  } else {
    finalUsers.forEach((user) => {
      console.log(`ID: ${user.id}, 이름: ${user.name}, 역할: ${user.role}`);
    });
  }
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

























