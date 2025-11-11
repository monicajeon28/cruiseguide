// scripts/check-admin-login.ts
// 관리자 로그인 계정 확인

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const phone = '01024958013';
  const name = '모니카';
  const password = '0313';

  console.log('🔍 관리자 로그인 계정 확인 중...\n');
  console.log(`입력 정보:`);
  console.log(`  이름: ${name}`);
  console.log(`  전화번호: ${phone}`);
  console.log(`  비밀번호: ${password}\n`);

  // 전화번호로 모든 계정 찾기
  const users = await prisma.user.findMany({
    where: { phone },
    select: {
      id: true,
      name: true,
      phone: true,
      password: true,
      role: true,
    },
  });

  console.log(`📋 전화번호 ${phone}로 찾은 계정: ${users.length}개\n`);
  users.forEach((user, index) => {
    console.log(`[계정 ${index + 1}]`);
    console.log(`  ID: ${user.id}`);
    console.log(`  이름: ${user.name}`);
    console.log(`  전화번호: ${user.phone}`);
    console.log(`  비밀번호: ${user.password}`);
    console.log(`  역할: ${user.role}`);
    console.log('');
  });

  // 관리자 계정 찾기
  const adminUsers = users.filter(u => u.role === 'admin');
  console.log(`\n👑 관리자 계정: ${adminUsers.length}개\n`);
  adminUsers.forEach((user, index) => {
    console.log(`[관리자 ${index + 1}]`);
    console.log(`  ID: ${user.id}`);
    console.log(`  이름: ${user.name}`);
    console.log(`  비밀번호: ${user.password}`);
    console.log('');
  });

  // 로그인 조건 확인
  console.log('\n🔐 로그인 조건 확인:\n');
  const matchingAdmin = users.find(u => 
    u.role === 'admin' && 
    u.name === name && 
    (u.password === password || u.password.startsWith('$2'))
  );

  if (matchingAdmin) {
    console.log('✅ 조건을 만족하는 관리자 계정 발견!');
    console.log(`   ID: ${matchingAdmin.id}`);
    console.log(`   이름: ${matchingAdmin.name}`);
    console.log(`   비밀번호: ${matchingAdmin.password}`);
    
    // bcrypt 확인
    if (matchingAdmin.password.startsWith('$2')) {
      const bcrypt = await import('bcryptjs');
      const isValid = await bcrypt.default.compare(password, matchingAdmin.password);
      console.log(`   bcrypt 검증: ${isValid ? '✅ 통과' : '❌ 실패'}`);
    } else {
      console.log(`   평문 비밀번호: ${matchingAdmin.password === password ? '✅ 일치' : '❌ 불일치'}`);
    }
  } else {
    console.log('❌ 조건을 만족하는 관리자 계정이 없습니다.');
    console.log('\n📝 필요한 조건:');
    console.log(`   - 역할: admin`);
    console.log(`   - 이름: ${name}`);
    console.log(`   - 전화번호: ${phone}`);
    console.log(`   - 비밀번호: ${password}`);
    
    if (adminUsers.length > 0) {
      console.log('\n💡 현재 관리자 계정 정보:');
      adminUsers.forEach(u => {
        console.log(`   - 이름: ${u.name}, 비밀번호: ${u.password}`);
      });
      console.log('\n💡 해결 방법:');
      console.log(`   관리자 계정의 이름을 "${name}"으로 변경하거나,`);
      console.log(`   비밀번호를 "${password}"로 변경하세요.`);
    }
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

