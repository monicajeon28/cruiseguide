// scripts/check-cruise-data.ts
// 크루즈 데이터 확인 및 통계

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 크루즈 가이드 데이터 현황\n');
  console.log('=' .repeat(60));

  // CruiseProduct
  const productCount = await prisma.cruiseProduct.count();
  const products = await prisma.cruiseProduct.findMany({
    select: {
      productCode: true,
      cruiseLine: true,
      shipName: true,
      packageName: true,
      nights: true,
      days: true,
    },
  });

  console.log(`\n🚢 크루즈 상품: ${productCount}개`);
  console.log('-'.repeat(60));
  products.forEach((p) => {
    console.log(`  [${p.productCode}] ${p.cruiseLine} ${p.shipName}`);
    console.log(`    └─ ${p.packageName} (${p.nights}박 ${p.days}일)`);
  });

  // User
  const userCount = await prisma.user.count();
  const hibernatedCount = await prisma.user.count({ where: { isHibernated: true } });
  console.log(`\n👤 사용자: ${userCount}개 (동면: ${hibernatedCount}개)`);

  // Trip
  const tripCount = await prisma.trip.count();
  const tripsByStatus = await prisma.trip.groupBy({
    by: ['status'],
    _count: true,
  });
  console.log(`\n✈️ 여행: ${tripCount}개`);
  tripsByStatus.forEach((s) => {
    console.log(`  - ${s.status}: ${s._count}개`);
  });

  // Itinerary
  const itineraryCount = await prisma.itinerary.count();
  console.log(`\n📅 일정: ${itineraryCount}개`);

  // VisitedCountry
  const visitedCountryCount = await prisma.visitedCountry.count();
  console.log(`\n🗺️ 방문 국가 기록: ${visitedCountryCount}개`);

  // PushSubscription
  const pushSubCount = await prisma.pushSubscription.count();
  console.log(`\n🔔 푸시 구독: ${pushSubCount}개`);

  // NotificationLog
  const notifLogCount = await prisma.notificationLog.count();
  console.log(`\n📨 알림 발송 로그: ${notifLogCount}개`);

  // CmsNotificationTemplate
  const templateCount = await prisma.cmsNotificationTemplate.count();
  const templates = await prisma.cmsNotificationTemplate.findMany({
    select: {
      triggerCode: true,
      title: true,
      isActive: true,
    },
  });
  console.log(`\n📝 CMS 알림 템플릿: ${templateCount}개`);
  console.log('-'.repeat(60));
  templates.forEach((t) => {
    const status = t.isActive ? '✅' : '❌';
    console.log(`  ${status} [${t.triggerCode}] ${t.title}`);
  });

  // TripFeedback
  const feedbackCount = await prisma.tripFeedback.count();
  console.log(`\n💬 피드백: ${feedbackCount}개`);

  // Expense & ChecklistItem
  const expenseCount = await prisma.expense.count();
  const checklistCount = await prisma.checklistItem.count();
  console.log(`\n💰 가계부: ${expenseCount}개`);
  console.log(`\n✅ 체크리스트: ${checklistCount}개`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ 데이터 확인 완료!\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

