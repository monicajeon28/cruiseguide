import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminPhone = '01024958013';
  const adminPassword = '0313';
  const adminName = '관리자';

  // 기존 관리자 계정 확인
  const existingAdmin = await prisma.user.findFirst({
    where: {
      phone: adminPhone,
      role: 'admin',
    },
  });

  if (existingAdmin) {
    console.log('✅ 관리자 계정이 이미 존재합니다.');
    console.log(`   ID: ${existingAdmin.id}`);
    console.log(`   전화번호: ${existingAdmin.phone}`);
    console.log(`   이름: ${existingAdmin.name}`);
    console.log(`   역할: ${existingAdmin.role}`);
    
    // 비밀번호가 다르면 업데이트
    if (existingAdmin.password !== adminPassword) {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { password: adminPassword },
      });
      console.log('✅ 비밀번호가 업데이트되었습니다.');
    }
  } else {
    // 관리자 계정 생성
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
    
    console.log('✅ 관리자 계정이 생성되었습니다.');
    console.log(`   ID: ${admin.id}`);
    console.log(`   전화번호: ${admin.phone}`);
    console.log(`   이름: ${admin.name}`);
    console.log(`   역할: ${admin.role}`);
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














