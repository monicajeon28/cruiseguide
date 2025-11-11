import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'cg.sid.v2';

// 관리자 권한 확인
async function checkAdminAuth() {
  try {
    const sid = cookies().get(SESSION_COOKIE)?.value;
    if (!sid) return null;

    const session = await prisma.session.findUnique({
      where: { id: sid },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!session || !session.User || session.User.role !== 'admin') {
      return null;
    }

    return {
      id: session.User.id,
      name: session.User.name,
      role: session.User.role,
    };
  } catch (error) {
    console.error('[Test Customers] Auth check error:', error);
    return null;
  }
}

// GET: 테스트 고객 목록 조회
export async function GET(req: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ ok: false, error: '인증이 필요합니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const kakaoChannelAdded = searchParams.get('kakaoChannelAdded') === 'true'; // 카카오 채널 추가한 고객만 필터링

    const where: any = {
      role: { not: 'admin' },
      // 테스트 고객: 이름과 연락처 입력된 고객이고 상태는 테스트, 테스트잠금 처리된 고객
      AND: [
        { name: { not: null } },
        {
          OR: [
            { phone: { not: null } },
            { email: { not: null } },
          ],
        },
        {
          OR: [
            { customerStatus: 'test' },
            { customerStatus: 'test-locked' },
            { password: '1101' },
          ],
        },
      ],
    };

    // 카카오 채널 추가 필터
    if (kakaoChannelAdded) {
      where.AND.push({ kakaoChannelAdded: true });
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search } },
            { phone: { contains: search } },
            { email: { contains: search } },
          ],
        },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        customerStatus: true,
        testModeStartedAt: true,
        kakaoChannelAdded: true,
        kakaoChannelAddedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const now = new Date();

    return NextResponse.json({
      ok: true,
      users: users.map(user => {
        // 테스트 고객: 이름과 연락처 입력된 고객이고 상태는 테스트, 테스트잠금 처리된 고객
        let testStatus = 'test';
        if (user.customerStatus === 'test' && user.testModeStartedAt) {
          const testModeEndAt = new Date(user.testModeStartedAt);
          testModeEndAt.setHours(testModeEndAt.getHours() + 72);
          if (now > testModeEndAt) {
            testStatus = 'test-locked';
          }
        } else if (user.customerStatus === 'locked' || user.customerStatus === 'test-locked') {
          testStatus = 'test-locked';
        }

        return {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          customerStatus: user.customerStatus,
          testStatus,
          customerType: 'test',
          customerTypeLabel: testStatus === 'test-locked' ? '테스트잠금' : '테스트',
          kakaoChannelAdded: user.kakaoChannelAdded || false,
          kakaoChannelAddedAt: user.kakaoChannelAddedAt?.toISOString() || null,
        };
      }),
    });
  } catch (error) {
    console.error('[Test Customers GET] Error:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to fetch test customers' },
      { status: 500 }
    );
  }
}

