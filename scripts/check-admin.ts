import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminPhone = '01024958013';
  
  const admin = await prisma.user.findFirst({
    where: {
      phone: adminPhone,
    },
  });

  if (admin) {
    console.log('=== 관리자 계정 정보 ===');
    console.log('ID:', admin.id);
    console.log('전화번호:', admin.phone);
    console.log('비밀번호:', admin.password);
    console.log('이름:', admin.name);
    console.log('역할:', admin.role);
    console.log('온보딩:', admin.onboarded);
    console.log('로그인 횟수:', admin.loginCount);
    
    // 비밀번호 테스트
    const testPassword = '0313';
    console.log('\n=== 비밀번호 검증 테스트 ===');
    console.log('입력 비밀번호:', testPassword);
    console.log('DB 비밀번호:', admin.password);
    console.log('일치 여부:', admin.password === testPassword);
    
    // role 검증
    console.log('\n=== Role 검증 ===');
    console.log('Role이 "admin"인가?', admin.role === 'admin');
  } else {
    console.log('❌ 관리자 계정을 찾을 수 없습니다.');
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














