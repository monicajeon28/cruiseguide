// instrumentation.ts
// Next.js 서버 시작 시 실행되는 초기화 코드

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 [Instrumentation] Initializing server...');

    // 동적 import로 스케줄러 로드 (서버 사이드 전용)
    const { startProactiveEngine, runProactiveEngineNow } = await import('./lib/scheduler/proactiveEngine');
    const { startTripStatusScheduler } = await import('./lib/scheduler/tripStatusUpdater');
    const { startLifecycleManager } = await import('./lib/scheduler/lifecycleManager');
    const { startRePurchaseTriggerScheduler } = await import('./lib/scheduler/rePurchaseTrigger');

    // 스케줄러 시작
    try {
      console.log('⏰ [Instrumentation] Starting schedulers...');
      
      // 1. Proactive Engine 시작 (매 10분)
      startProactiveEngine();
      
      // 2. Trip Status Updater 시작 (매일 자정)
      startTripStatusScheduler();
      
      // 3. Lifecycle Manager 시작 (동면/재활성화)
      startLifecycleManager();
      
      // 4. RePurchase Trigger Scheduler 시작 (재구매 트리거 생성)
      startRePurchaseTriggerScheduler();
      
      console.log('✅ [Instrumentation] All schedulers started successfully');
      
      // 4. Proactive Engine 즉시 1회 실행
      console.log('🚀 [Instrumentation] Running Proactive Engine immediately...');
      await runProactiveEngineNow();
      console.log('✅ [Instrumentation] Initial Proactive Engine run completed');
    } catch (error) {
      console.error('❌ [Instrumentation] Failed to start schedulers:', error);
    }
  }
}

