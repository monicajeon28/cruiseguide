import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const phone = '01038609161';
  const name = '배연성';

  console.log(`=== 고객 상태 확인: ${name} (${phone}) ===\n`);

  const user = await prisma.user.findFirst({
    where: {
      phone,
      name,
      role: 'user',
    },
    select: {
      id: true,
      name: true,
      phone: true,
      onboarded: true,
      customerStatus: true,
      isLocked: true,
      isHibernated: true,
      loginCount: true,
      createdAt: true,
    },
  });

  if (!user) {
    console.log('❌ 고객을 찾을 수 없습니다.');
    return;
  }

  console.log('📋 고객 정보:');
  console.log(`  ID: ${user.id}`);
  console.log(`  이름: ${user.name}`);
  console.log(`  전화번호: ${user.phone}`);
  console.log(`  온보딩 완료: ${user.onboarded}`);
  console.log(`  고객 상태: ${user.customerStatus ?? '(null)'}`);
  console.log(`  잠금 상태: ${user.isLocked}`);
  console.log(`  동면 상태: ${user.isHibernated}`);
  console.log(`  로그인 횟수: ${user.loginCount}`);
  console.log(`  가입일: ${user.createdAt}`);

  console.log('\n🔍 로그인 리다이렉트 조건 확인:');
  const condition1 = user.onboarded === true;
  const condition2 = user.customerStatus === 'active';
  const willGoToChat = condition1 && condition2;
  
  console.log(`  onboarded === true: ${condition1}`);
  console.log(`  customerStatus === 'active': ${condition2}`);
  console.log(`  → 리다이렉트: ${willGoToChat ? '/chat' : '/onboarding'}`);

  if (!willGoToChat) {
    console.log('\n⚠️ 문제 원인:');
    if (!condition1) {
      console.log('  - onboarded가 false입니다.');
    }
    if (!condition2) {
      console.log(`  - customerStatus가 'active'가 아닙니다. (현재: ${user.customerStatus ?? 'null'})`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());











