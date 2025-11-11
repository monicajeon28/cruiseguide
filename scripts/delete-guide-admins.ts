import prisma from '../lib/prisma';

async function main() {
  console.log('크루즈 가이드 관리자 계정 삭제 중... (phone이 user1~user10인 계정 제외)');

  try {
    // 먼저 삭제할 관리자 계정 조회
    // phone이 정확히 'user1'~'user10'인 계정은 제외
    const adminsToDelete = await prisma.user.findMany({
      where: {
        role: 'admin',
        phone: {
          notIn: ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10'],
        },
      },
      select: { id: true, name: true, phone: true },
    });

    console.log(`찾은 관리자 계정: ${adminsToDelete.length}개`);
    adminsToDelete.forEach(admin => {
      console.log(`  - ID: ${admin.id}, 이름: ${admin.name}, 전화번호: ${admin.phone}`);
    });

    if (adminsToDelete.length === 0) {
      console.log('삭제할 관리자 계정이 없습니다.');
      return;
    }

    // Foreign Key 제약 조건 비활성화
    await prisma.$executeRaw`PRAGMA foreign_keys = OFF`;
    console.log('Foreign keys disabled');

    // 각 관리자 계정의 관련 데이터 삭제 후 계정 삭제
    let deletedCount = 0;
    for (const admin of adminsToDelete) {
      try {
        const userId = admin.id;
        
        // 모든 관련 데이터 삭제
        const queries = [
          `DELETE FROM AdminActionLog WHERE adminId = ${userId} OR targetUserId = ${userId}`,
          `DELETE FROM AdminMessage WHERE adminId = ${userId}`,
          `UPDATE AdminMessage SET userId = NULL WHERE userId = ${userId}`,
          `DELETE FROM RePurchaseTrigger WHERE userId = ${userId}`,
          `DELETE FROM ChatHistory WHERE userId = ${userId}`,
          `DELETE FROM ChecklistItem WHERE userId = ${userId}`,
          `DELETE FROM Expense WHERE userId = ${userId}`,
          `DELETE FROM FeatureUsage WHERE userId = ${userId}`,
          `DELETE FROM UserActivity WHERE userId = ${userId}`,
          `DELETE FROM UserSchedule WHERE userId = ${userId}`,
          `DELETE FROM VisitedCountry WHERE userId = ${userId}`,
          `DELETE FROM MapTravelRecord WHERE userId = ${userId}`,
          `DELETE FROM MarketingInsight WHERE userId = ${userId}`,
          `DELETE FROM PushSubscription WHERE userId = ${userId}`,
          `DELETE FROM NotificationLog WHERE userId = ${userId}`,
          `DELETE FROM UserMessageRead WHERE userId = ${userId}`,
          `DELETE FROM LoginLog WHERE userId = ${userId}`,
          `DELETE FROM PasswordEvent WHERE userId = ${userId}`,
          `DELETE FROM Session WHERE userId = ${userId}`,
          `DELETE FROM TravelDiaryEntry WHERE userId = ${userId}`,
          `DELETE FROM Trip WHERE userId = ${userId}`,
          `UPDATE ProductInquiry SET userId = NULL WHERE userId = ${userId}`,
          `UPDATE ProductView SET userId = NULL WHERE userId = ${userId}`,
          `UPDATE CommunityPost SET userId = NULL WHERE userId = ${userId}`,
          `UPDATE CommunityComment SET userId = NULL WHERE userId = ${userId}`,
          `UPDATE CruiseReview SET userId = NULL WHERE userId = ${userId}`,
          `UPDATE ChatBotSession SET userId = NULL WHERE userId = ${userId}`,
        ];
        
        for (const query of queries) {
          try {
            await prisma.$executeRawUnsafe(query);
          } catch (e: any) {
            // 테이블이 없을 수 있으므로 무시
          }
        }
        
        // 사용자 삭제
        await prisma.$executeRawUnsafe(`DELETE FROM User WHERE id = ${userId}`);
        deletedCount++;
        console.log(`✅ ${admin.name || admin.phone} (ID: ${admin.id}) 삭제 완료`);
      } catch (error: any) {
        console.error(`❌ ${admin.name || admin.phone} (ID: ${admin.id}) 삭제 실패:`, error.message);
      }
    }

    // Foreign Key 재활성화
    await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
    console.log('Foreign keys re-enabled');

    console.log(`\n✅ 총 ${deletedCount}개의 크루즈 가이드 관리자 계정이 삭제되었습니다.`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('크루즈몰 관리자(phone: user1~user10)는 유지되었습니다.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    // Foreign Key 재활성화
    try {
      await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
    } catch (e) {
      console.error('Failed to re-enable foreign keys:', e);
    }
    console.error('❌ 오류 발생:', error);
    throw error;
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
