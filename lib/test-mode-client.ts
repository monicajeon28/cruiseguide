// lib/test-mode-client.ts
// 클라이언트 사이드에서 사용할 테스트 모드 유틸리티

export interface TestModeInfo {
  isTestMode: boolean;
  testModeStartedAt: Date | null;
  remainingHours: number | null;
  testModeEndAt: Date | null;
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

