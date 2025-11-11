// lib/test-mode.ts
// 테스트 모드 체크 유틸리티 (기존 코드 수정 없이 별도 파일)

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'cg.sid.v2';
const TEST_MODE_COOKIE = 'cg.test-mode';

export interface TestModeInfo {
  isTestMode: boolean;
  testModeStartedAt: Date | null;
  remainingHours: number | null;
  testModeEndAt: Date | null;
}

/**
 * 현재 사용자가 테스트 모드인지 확인
 * 기존 코드 수정 없이 별도로 구현
 */
export async function checkTestMode(): Promise<TestModeInfo> {
  const sessionId = cookies().get(SESSION_COOKIE)?.value;
  
  if (!sessionId) {
    return {
      isTestMode: false,
      testModeStartedAt: null,
      remainingHours: null,
      testModeEndAt: null,
    };
  }

  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        User: {
          select: {
            id: true,
            customerStatus: true,
            testModeStartedAt: true,
          },
        },
      },
    });

    if (!session || !session.User) {
      return {
        isTestMode: false,
        testModeStartedAt: null,
        remainingHours: null,
        testModeEndAt: null,
      };
    }

    const user = session.User;
    const isTestMode = user.customerStatus === 'test';

    if (!isTestMode || !user.testModeStartedAt) {
      return {
        isTestMode: false,
        testModeStartedAt: null,
        remainingHours: null,
        testModeEndAt: null,
      };
    }

    // 72시간 계산
    const now = new Date();
    const testModeStartedAt = user.testModeStartedAt;
    const testModeEndAt = new Date(testModeStartedAt);
    testModeEndAt.setHours(testModeEndAt.getHours() + 72);

    const remainingMs = testModeEndAt.getTime() - now.getTime();
    const remainingHours = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60)));

    return {
      isTestMode: true,
      testModeStartedAt,
      remainingHours,
      testModeEndAt,
    };
  } catch (error) {
    console.error('[TestMode] Error checking test mode:', error);
    return {
      isTestMode: false,
      testModeStartedAt: null,
      remainingHours: null,
      testModeEndAt: null,
    };
  }
}

/**
 * 클라이언트 사이드에서 테스트 모드 확인 (API 호출)
 */
export async function checkTestModeClient(): Promise<TestModeInfo> {
  try {
    const response = await fetch('/api/user/test-mode', {
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        isTestMode: false,
        testModeStartedAt: null,
        remainingHours: null,
        testModeEndAt: null,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[TestMode] Client check error:', error);
    return {
      isTestMode: false,
      testModeStartedAt: null,
      remainingHours: null,
      testModeEndAt: null,
    };
  }
}

