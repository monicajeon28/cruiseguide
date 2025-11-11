/**
 * 애플리케이션 초기화 함수
 * 서버 시작 시 한 번만 실행됨
 */

import { startProactiveEngine } from './scheduler/proactiveEngine';

let initialized = false;

export async function initializeApp() {
  if (initialized) {
    console.log('[Init] 이미 초기화되었습니다');
    return;
  }

  try {
    console.log('[Init] 애플리케이션 초기화 시작...');

    // Proactive Engine 시작
    startProactiveEngine();

    initialized = true;
    console.log('[Init] 애플리케이션 초기화 완료 ✓');
  } catch (error) {
    console.error('[Init] 초기화 중 오류:', error);
  }
}

/**
 * 초기화 상태 확인
 */
export function isInitialized(): boolean {
  return initialized;
}
