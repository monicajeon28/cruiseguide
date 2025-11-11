import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminPhone = '01024958013';
  const adminPassword = '0313';
  const adminName = '관리자';

  // 전화번호로 모든 계정 찾기
  const users = await prisma.user.findMany({
    where: {
      phone: adminPhone,
    },
  });

  console.log(`\n=== 전화번호 ${adminPhone}로 찾은 계정: ${users.length}개 ===\n`);

  users.forEach((user, index) => {
    console.log(`[계정 ${index + 1}]`);
    console.log(`  ID: ${user.id}`);
    console.log(`  이름: ${user.name}`);
    console.log(`  전화번호: ${user.phone}`);
    console.log(`  비밀번호: ${user.password}`);
    console.log(`  역할: ${user.role}`);
    console.log('');
  });

  // 관리자 계정이 있는지 확인
  const adminUser = users.find(u => u.role === 'admin');

  if (adminUser) {
    console.log(`✅ 관리자 계정 발견: ID ${adminUser.id}`);
    
    // 비밀번호와 이름이 올바른지 확인
    if (adminUser.password !== adminPassword || adminUser.name !== adminName) {
      console.log('⚠️  비밀번호 또는 이름이 다릅니다. 업데이트 중...');
      await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          password: adminPassword,
          name: adminName,
          role: 'admin',
        },
      });
      console.log('✅ 관리자 계정이 업데이트되었습니다.');
    } else {
      console.log('✅ 관리자 계정 정보가 올바릅니다.');
    }

    // 다른 계정들은 삭제하거나 일반 사용자로 변경
    const otherUsers = users.filter(u => u.id !== adminUser.id);
    if (otherUsers.length > 0) {
      console.log(`\n⚠️  같은 전화번호를 가진 다른 계정 ${otherUsers.length}개 발견.`);
      console.log('일반 사용자로 변경하거나 삭제할까요? (현재는 그대로 둡니다)');
    }
  } else {
    console.log('❌ 관리자 계정이 없습니다. 생성 중...');
    
    // 기존 계정이 있으면 하나를 관리자로 변경
    if (users.length > 0) {
      const firstUser = users[0];
      console.log(`기존 계정(ID: ${firstUser.id})을 관리자로 변경합니다.`);
      await prisma.user.update({
        where: { id: firstUser.id },
        data: {
          name: adminName,
          password: adminPassword,
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

























