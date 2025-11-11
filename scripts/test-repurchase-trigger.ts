// scripts/test-repurchase-trigger.ts
// 재구매 트리거 스케줄러 테스트 스크립트

import { manualCheckTripEnds, manualCheckGracePeriodEnds } from '../lib/scheduler/rePurchaseTrigger';

async function test() {
  console.log('🧪 [Test] Starting RePurchase Trigger tests...\n');

  try {
    console.log('1️⃣ Testing trip end check...');
    await manualCheckTripEnds();
    console.log('✅ Trip end check completed\n');

    console.log('2️⃣ Testing grace period check...');
    await manualCheckGracePeriodEnds();
    console.log('✅ Grace period check completed\n');

    console.log('🎉 All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

test();














