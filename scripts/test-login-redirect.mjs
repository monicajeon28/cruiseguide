import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const phone = '01038609161';
  const name = '배연성';
  const password = '3800'; // 일반적인 비밀번호

  console.log(`=== 로그인 시뮬레이션: ${name} (${phone}) ===\n`);

  // 로그인 API와 동일한 쿼리 실행
  const existing = await prisma.user.findFirst({
    where: { 
      phone,
      name,
      password,
      role: 'user',
    },
    select: { 
      id: true, 
      password: true, 
      onboarded: true, 
      loginCount: true, 
      role: true, 
      customerStatus: true 
    },
  });

  if (!existing) {
    console.log('❌ 로그인 실패: 사용자를 찾을 수 없습니다.');
    console.log('\n🔍 가능한 원인:');
    console.log('  - 비밀번호가 일치하지 않음');
    console.log('  - 이름이 일치하지 않음');
    console.log('  - role이 user가 아님');
    return;
  }

  console.log('✅ 사용자 찾음!');
  console.log('\n📋 사용자 정보:');
  console.log(`  ID: ${existing.id}`);
  console.log(`  onboarded: ${existing.onboarded}`);
  console.log(`  customerStatus: ${existing.customerStatus ?? '(null)'}`);
  console.log(`  loginCount: ${existing.loginCount}`);

  console.log('\n🔍 리다이렉트 조건 확인:');
  const isActive = existing.customerStatus === 'active' || existing.customerStatus === null;
  const willGoToChat = existing.onboarded && isActive;
  
  console.log(`  onboarded === true: ${existing.onboarded}`);
  console.log(`  customerStatus === 'active' 또는 null: ${isActive}`);
  console.log(`  → 리다이렉트: ${willGoToChat ? '/chat ✅' : '/onboarding ❌'}`);

  if (!willGoToChat) {
    console.log('\n⚠️ 문제 원인:');
    if (!existing.onboarded) {
      console.log('  - onboarded가 false입니다.');
    }
    if (!isActive) {
      console.log(`  - customerStatus가 'active'도 null도 아닙니다. (현재: ${existing.customerStatus})`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());











