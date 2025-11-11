import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

// GET: 사용자 접근 권한 체크 (여행 종료 후 1일 사용 제한)
export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 사용자 정보 직접 조회 (isLocked 포함)
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, isLocked: true },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
    }

    // 계정 잠금 체크
    if (user.isLocked) {
      return NextResponse.json({
        ok: false,
        allowed: false,
        reason: 'locked',
        message: '계정이 잠금되었습니다. 관리자에게 문의하세요.',
      });
    }

    // 최신 여행 조회
    const latestTrip = await prisma.trip.findFirst({
      where: { userId: user.id },
      orderBy: { endDate: 'desc' },
      select: { endDate: true },
    });

    // 여행이 없으면 허용
    if (!latestTrip || !latestTrip.endDate) {
      return NextResponse.json({
        ok: true,
        allowed: true,
        status: 'active',
      });
    }

    const endDate = new Date(latestTrip.endDate);
    const gracePeriodEnd = new Date(endDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 1); // +1일

    const now = new Date();

    // 유예 기간 내이면 허용
    if (now <= gracePeriodEnd) {
      const remainingHours = Math.ceil(
        (gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60)
      );
      return NextResponse.json({
        ok: true,
        allowed: true,
        status: 'grace_period',
        remainingHours,
        endDate: endDate.toISOString(),
        gracePeriodEnd: gracePeriodEnd.toISOString(),
      });
    }

    // 유예 기간 종료
    return NextResponse.json({
      ok: true,
      allowed: false,
      status: 'expired',
      reason: 'grace_period_end',
      message: '여행이 종료되었습니다. 새로운 여행을 등록해 주세요.',
      endDate: endDate.toISOString(),
      gracePeriodEnd: gracePeriodEnd.toISOString(),
    });
  } catch (error) {
    console.error('[User Access Check] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to check access' },
      { status: 500 }
    );
  }
}
