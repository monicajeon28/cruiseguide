// scripts/cleanup-sessions.ts
// 만료된 세션을 데이터베이스에서 삭제하는 스크립트

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupExpiredSessions() {
  try {
    console.log('[Session Cleanup] Starting cleanup process...');
    
    const now = new Date();
    
    // 만료된 세션 삭제
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: now, // expiresAt이 현재 시간보다 이전인 세션들
        },
      },
    });

    console.log(`[Session Cleanup] ✅ Deleted ${result.count} expired session(s)`);

    // 추가: expiresAt이 null인 오래된 세션도 정리 (30일 이상 된 세션)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const legacyResult = await prisma.session.deleteMany({
      where: {
        expiresAt: null,
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    console.log(`[Session Cleanup] ✅ Deleted ${legacyResult.count} legacy session(s) without expiration`);

    // 전체 세션 통계
    const totalSessions = await prisma.session.count();
    console.log(`[Session Cleanup] 📊 Total active sessions: ${totalSessions}`);

  } catch (error) {
    console.error('[Session Cleanup] ❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
cleanupExpiredSessions()
  .then(() => {
    console.log('[Session Cleanup] 🎉 Cleanup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Session Cleanup] Fatal error:', error);
    process.exit(1);
  });

