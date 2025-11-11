// scripts/fix-admin-3800.ts
// 관리자 계정 확인 및 비밀번호 3800으로 수정

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminPhone = '01024958013';
  const adminPassword = '0313';
  const adminName = '관리자';

  console.log('🔍 관리자 계정 확인 중...');
  console.log(`   전화번호: ${adminPhone}`);
  console.log(`   이름: ${adminName}`);
  console.log(`   비밀번호: ${adminPassword}`);
  console.log(`   역할: admin\n`);

  // 전화번호로 사용자 찾기
  const users = await prisma.user.findMany({
    where: { phone: adminPhone },
    select: {
      id: true,
      name: true,
      phone: true,
      password: true,
      role: true,
    },
  });

  console.log(`📋 전화번호 ${adminPhone}로 찾은 사용자: ${users.length}명`);
  users.forEach((user, index) => {
    console.log(`   ${index + 1}. ID: ${user.id}, 이름: ${user.name}, 역할: ${user.role}, 비밀번호: ${user.password}`);
  });

  // 관리자 역할을 가진 사용자 찾기
  const adminUsers = await prisma.user.findMany({
    where: { 
      phone: adminPhone,
      role: 'admin',
    },
    select: {
      id: true,
      name: true,
      phone: true,
      password: true,
      role: true,
    },
  });

  if (adminUsers.length > 0) {
    console.log(`\n✅ 관리자 계정 발견: ${adminUsers.length}개`);
    
    // 첫 번째 관리자 계정 업데이트
    const admin = adminUsers[0];
    console.log(`\n📝 관리자 계정 업데이트 중...`);
    console.log(`   ID: ${admin.id}`);
    console.log(`   현재 이름: ${admin.name}`);
    console.log(`   현재 비밀번호: ${admin.password}`);
    
    await prisma.user.update({
      where: { id: admin.id },
      data: {
        name: adminName,
        password: adminPassword,
        phone: adminPhone,
        role: 'admin',
      },
    });
    
    console.log('✅ 관리자 계정이 업데이트되었습니다.');
  } else {
    console.log('\n❌ 관리자 계정이 없습니다. 생성 중...');
    
    // 기존 사용자가 있으면 관리자로 변경
    if (users.length > 0) {
      const firstUser = users[0];
      console.log(`기존 계정(ID: ${firstUser.id})을 관리자로 변경합니다.`);
      await prisma.user.update({
        where: { id: firstUser.id },
        data: {
          name: adminName,
          password: adminPassword,
          phone: adminPhone,
          role: 'admin',
        },
      });
      console.log('✅ 관리자 계정으로 변경되었습니다.');
    } else {
      // 새 관리자 계정 생성
      const admin = await prisma.user.create({
        data: {
          phone: adminPhone,
          password: adminPassword,
          name: adminName,
          role: 'admin',
          onboarded: true,
          loginCount: 0,
        },
      });
      console.log('✅ 새 관리자 계정이 생성되었습니다.');
      console.log(`   ID: ${admin.id}`);
    }
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
    select: {
      id: true,
      name: true,
      phone: true,
      password: true,
      role: true,
      onboarded: true,
    },
  });

  if (finalAdmin) {
    console.log('\n✅ 최종 확인: 관리자 계정이 올바르게 설정되었습니다.');
    console.log(`   ID: ${finalAdmin.id}`);
    console.log(`   이름: ${finalAdmin.name}`);
    console.log(`   전화번호: ${finalAdmin.phone}`);
    console.log(`   비밀번호: ${finalAdmin.password}`);
    console.log(`   역할: ${finalAdmin.role}`);
    console.log(`   온보딩 완료: ${finalAdmin.onboarded}`);
    console.log('\n✅ 로그인 정보:');
    console.log(`   이름: ${adminName}`);
    console.log(`   전화번호: ${adminPhone}`);
    console.log(`   비밀번호: ${adminPassword}`);
  } else {
    console.log('\n❌ 관리자 계정 설정에 실패했습니다.');
    console.log('   다음 조건을 확인해주세요:');
    console.log(`   - 전화번호: ${adminPhone}`);
    console.log(`   - 이름: ${adminName}`);
    console.log(`   - 비밀번호: ${adminPassword}`);
    console.log(`   - 역할: admin`);
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

