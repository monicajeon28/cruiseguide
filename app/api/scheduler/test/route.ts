import { NextRequest, NextResponse } from 'next/server';
import { runProactiveEngineNow } from '@/lib/scheduler/proactiveEngine';
import { getSession } from '@/lib/session';

/**
 * Proactive Engine 테스트 API
 * 개발용으로 스케줄러를 즉시 실행합니다.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    console.log('[API] Proactive Engine 즉시 실행 요청');
    await runProactiveEngineNow();

    return NextResponse.json(
      {
        message: 'Proactive Engine이 즉시 실행되었습니다.',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] 스케줄러 테스트 오류:', error);
    return NextResponse.json(
      { error: '스케줄러 실행 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * GET: 현재 상태 확인
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        message: 'Proactive Engine이 실행 중입니다.',
        info: 'POST /api/scheduler/test로 즉시 실행할 수 있습니다.',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] 상태 확인 오류:', error);
    return NextResponse.json(
      { error: '상태 확인 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
