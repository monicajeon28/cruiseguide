// scripts/fix-admin-back.ts
// 관리자 계정 이름을 다시 "관리자"로 변경

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminPhone = '01024958013';
  const adminPassword = '0313';
  const adminName = '관리자';

  console.log('🔍 관리자 계정 이름 복원 중...\n');
  console.log(`   전화번호: ${adminPhone}`);
  console.log(`   이름: ${adminName}`);
  console.log(`   비밀번호: ${adminPassword}\n`);

  // 관리자 계정 찾기
  const adminUser = await prisma.user.findFirst({
    where: {
      phone: adminPhone,
      role: 'admin',
    },
  });

  if (adminUser) {
    console.log(`✅ 관리자 계정 발견: ID ${adminUser.id}`);
    console.log(`   현재 이름: ${adminUser.name}`);
    
    // 이름과 비밀번호 업데이트
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        name: adminName,
        password: adminPassword,
      },
    });
    
    console.log(`✅ 관리자 계정이 업데이트되었습니다.`);
    console.log(`   이름: ${adminName}`);
    console.log(`   비밀번호: ${adminPassword}`);
  } else {
    console.log('❌ 관리자 계정을 찾을 수 없습니다.');
  }

  // 최종 확인
  console.log('\n🔍 최종 확인 중...');
  const finalAdmin = await prisma.user.findFirst({
    where: {
      phone: adminPhone,
      role: 'admin',
      name: adminName,
      password: adminPassword,
    },
  });

  if (finalAdmin) {
    console.log('\n✅ 최종 확인: 관리자 계정이 올바르게 설정되었습니다.');
    console.log(`   ID: ${finalAdmin.id}`);
    console.log(`   이름: ${finalAdmin.name}`);
    console.log(`   전화번호: ${finalAdmin.phone}`);
    console.log(`   비밀번호: ${finalAdmin.password}`);
    console.log(`   역할: ${finalAdmin.role}`);
    console.log('\n✅ 로그인 정보:');
    console.log(`   이름: ${adminName}`);
    console.log(`   전화번호: ${adminPhone}`);
    console.log(`   비밀번호: ${adminPassword}`);
  } else {
    console.log('\n❌ 관리자 계정 설정에 실패했습니다.');
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

