import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminPhone = '01024958013';
  const adminPassword = '0313';
  
  // 관리자 계정 찾기
  const admin = await prisma.user.findFirst({
    where: {
      phone: adminPhone,
    },
  });

  if (!admin) {
    console.log('❌ 관리자 계정을 찾을 수 없습니다.');
    return;
  }

  console.log('=== 기존 계정 정보 ===');
  console.log('ID:', admin.id);
  console.log('전화번호:', admin.phone);
  console.log('비밀번호:', admin.password);
  console.log('이름:', admin.name);
  console.log('역할:', admin.role);

  // 관리자 계정으로 업데이트
  const updated = await prisma.user.update({
    where: { id: admin.id },
    data: {
      password: adminPassword,
      role: 'admin',
    },
  });

  console.log('\n=== 업데이트 완료 ===');
  console.log('ID:', updated.id);
  console.log('전화번호:', updated.phone);
  console.log('비밀번호:', updated.password);
  console.log('이름:', updated.name);
  console.log('역할:', updated.role);
  console.log('\n✅ 관리자 계정이 업데이트되었습니다!');
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });














