// app/api/scheduler/trigger/route.ts
// Proactive Engine 수동 트리거 API (테스트용)

import { NextResponse } from 'next/server';
import { manualRunProactiveEngine } from '@/lib/scheduler/proactiveEngine';

export async function POST(req: Request) {
  // 개발 환경에서만 허용
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'Not available in production' }, { status: 403 });
  }

  try {
    console.log('[Scheduler Trigger] Manual trigger requested');
    
    await manualRunProactiveEngine();

    return NextResponse.json({
      ok: true,
      message: 'Proactive Engine triggered successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Scheduler Trigger] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to trigger scheduler' },
      { status: 500 }
    );
  }
}

