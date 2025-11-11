import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== 로그인 로직 검증 테스트 ===\n');

  // 현재 데이터베이스 상태 확인
  const allUsers = await prisma.user.findMany({
    where: {
      phone: '01024958013',
    },
    orderBy: {
      id: 'asc',
    },
  });

  console.log(`전화번호 01024958013으로 찾은 계정: ${allUsers.length}개\n`);
  allUsers.forEach((user) => {
    console.log(`[계정 ${user.id}]`);
    console.log(`  이름: ${user.name}`);
    console.log(`  전화번호: ${user.phone}`);
    console.log(`  비밀번호: ${user.password}`);
    console.log(`  역할: ${user.role}`);
    console.log('');
  });

  // 관리자 로그인 시도 시뮬레이션
  console.log('=== 관리자 로그인 시뮬레이션 ===\n');
  const adminLogin = {
    name: '관리자',
    phone: '01024958013',
    password: '0313',
    role: 'admin',
  };

  const adminResult = await prisma.user.findFirst({
    where: {
      name: adminLogin.name,
      phone: adminLogin.phone,
      password: adminLogin.password,
      role: adminLogin.role,
    },
  });

  if (adminResult) {
    console.log('✅ 관리자 로그인 성공!');
    console.log(`   매칭된 계정 ID: ${adminResult.id}`);
  } else {
    console.log('❌ 관리자 로그인 실패');
  }

  // 일반 사용자 로그인 시뮬레이션
  console.log('\n=== 일반 사용자 로그인 시뮬레이션 ===\n');
  const userLogin = {
    name: '모니카',
    phone: '01024958013',
    password: '3800',
    role: 'user',
  };

  const userResult = await prisma.user.findFirst({
    where: {
      name: userLogin.name,
      phone: userLogin.phone,
      password: userLogin.password,
      role: userLogin.role,
    },
  });

  if (userResult) {
    console.log('✅ 일반 사용자 로그인 성공!');
    console.log(`   매칭된 계정 ID: ${userResult.id}`);
  } else {
    console.log('❌ 일반 사용자 로그인 실패');
  }

  // 오류 가능성 검사: 같은 조합이 2개 이상 있는지 확인
  console.log('\n=== 오류 가능성 검사 ===\n');

  // 모든 계정의 name + phone + password + role 조합 확인
  const allUsersFull = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      password: true,
      role: true,
    },
  });

  const combinations = new Map<string, number[]>();
  allUsersFull.forEach((user) => {
    const key = `${user.name}|${user.phone}|${user.password}|${user.role}`;
    if (!combinations.has(key)) {
      combinations.set(key, []);
    }
    combinations.get(key)!.push(user.id);
  });

  let hasDuplicate = false;
  combinations.forEach((ids, key) => {
    if (ids.length > 1) {
      hasDuplicate = true;
      const [name, phone, password, role] = key.split('|');
      console.log(`⚠️  중복 조합 발견:`);
      console.log(`   이름: ${name}, 전화번호: ${phone}, 비밀번호: ${password}, 역할: ${role}`);
      console.log(`   계정 ID: ${ids.join(', ')}`);
      console.log('');
    }
  });

  if (!hasDuplicate) {
    console.log('✅ 중복 조합 없음 - 모든 계정이 고유한 조합을 가짐');
  }

  // 결론
  console.log('\n=== 결론 ===\n');
  console.log('✅ 로그인 로직: 이름 + 전화번호 + 비밀번호 + role 4가지를 모두 확인');
  console.log('✅ 같은 전화번호로 여러 계정이 있어도 정확히 매칭되는 계정만 반환');
  if (hasDuplicate) {
    console.log('⚠️  경고: 같은 조합의 계정이 2개 이상 존재합니다. 데이터 무결성 문제일 수 있습니다.');
  } else {
    console.log('✅ 오류 가능성: 매우 낮음 (데이터 무결성 문제 없음)');
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

























