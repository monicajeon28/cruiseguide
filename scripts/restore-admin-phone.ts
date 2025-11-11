import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ID 1 계정의 전화번호를 원래대로 복구
  const user1 = await prisma.user.findUnique({
    where: { id: 1 },
  });

  if (user1) {
    await prisma.user.update({
      where: { id: 1 },
      data: {
        phone: '01024958013',
      },
    });
    console.log('✅ ID 1 계정의 전화번호를 01024958013으로 복구했습니다.');
    console.log(`   ID: ${user1.id}`);
    console.log(`   이름: ${user1.name}`);
    console.log(`   전화번호: 01024958013`);
    console.log(`   역할: ${user1.role}`);
  } else {
    console.log('❌ ID 1 계정을 찾을 수 없습니다.');
  }

  // 현재 상태 확인
  const allUsers = await prisma.user.findMany({
    where: {
      phone: '01024958013',
    },
    orderBy: {
      id: 'asc',
    },
  });

  console.log(`\n=== 전화번호 01024958013로 찾은 계정: ${allUsers.length}개 ===\n`);
  allUsers.forEach((user) => {
    console.log(`ID: ${user.id}, 이름: ${user.name}, 비밀번호: ${user.password}, 역할: ${user.role}`);
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

























