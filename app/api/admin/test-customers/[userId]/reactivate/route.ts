import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'cg.sid.v2';

// 관리자 권한 확인
async function checkAdminAuth(sid: string | undefined): Promise<boolean> {
  if (!sid) {
    return false;
  }

  try {
    const session = await prisma.session.findUnique({
      where: { id: sid },
      include: {
        User: {
          select: { role: true },
        },
      },
    });

    if (!session || !session.User) {
      return false;
    }

    return session.User.role === 'admin';
  } catch (error) {
    console.error('[Admin Test Customer Reactivate] Auth check error:', error);
    return false;
  }
}

// POST: 테스트 고객 재활성 (72시간 연장)
export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // 관리자 권한 확인
    const sid = cookies().get(SESSION_COOKIE)?.value;
    
    if (!sid) {
      return NextResponse.json({ 
        ok: false, 
        error: '인증이 필요합니다. 다시 로그인해 주세요.',
      }, { status: 403 });
    }

    const isAdmin = await checkAdminAuth(sid);

    if (!isAdmin) {
      return NextResponse.json({ 
        ok: false, 
        error: '인증이 필요합니다. 다시 로그인해 주세요.',
      }, { status: 403 });
    }

    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        customerStatus: true,
        testModeStartedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 테스트 고객인지 확인
    if (user.customerStatus !== 'test' && user.customerStatus !== 'test-locked') {
      return NextResponse.json(
        { ok: false, error: '테스트 고객만 재활성할 수 있습니다.' },
        { status: 400 }
      );
    }

    // 재활성 처리: testModeStartedAt을 현재 시간으로 업데이트
    const now = new Date();
    await prisma.user.update({
      where: { id: userId },
      data: {
        testModeStartedAt: now,
        customerStatus: 'test',
        isLocked: false,
        lockedAt: null,
        lockedReason: null,
      },
    });

    return NextResponse.json({
      ok: true,
      message: `${user.name || '고객'}의 테스트 기간이 72시간 연장되었습니다.`,
      testModeStartedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('[Admin Test Customer Reactivate] Error:', error);
    return NextResponse.json(
      { ok: false, error: '재활성 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

