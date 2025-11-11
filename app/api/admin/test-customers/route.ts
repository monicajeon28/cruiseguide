import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'cg.sid.v2';

// 관리자 권한 확인
async function checkAdminAuth(sid: string | undefined): Promise<boolean> {
  if (!sid) {
    console.log('[Admin Test Customers] No session ID');
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

    if (!session) {
      console.log('[Admin Test Customers] Session not found:', sid);
      return false;
    }

    if (!session.User) {
      console.log('[Admin Test Customers] User not found in session');
      return false;
    }

    const isAdmin = session.User.role === 'admin';
    console.log('[Admin Test Customers] Auth check:', { userId: session.userId, role: session.User.role, isAdmin });
    return isAdmin;
  } catch (error) {
    console.error('[Admin Test Customers] Auth check error:', error);
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    // 관리자 권한 확인
    const sid = cookies().get(SESSION_COOKIE)?.value;
    
    if (!sid) {
      console.log('[Admin Test Customers] No session cookie found');
      return NextResponse.json({ 
        ok: false, 
        error: '인증이 필요합니다. 다시 로그인해 주세요.',
        details: 'No session cookie'
      }, { status: 403 });
    }

    const isAdmin = await checkAdminAuth(sid);

    if (!isAdmin) {
      console.log('[Admin Test Customers] Admin check failed for session:', sid);
      return NextResponse.json({ 
        ok: false, 
        error: '인증이 필요합니다. 다시 로그인해 주세요.',
        details: 'Admin check failed'
      }, { status: 403 });
    }

    // URL 파라미터
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all'; // all, test, locked
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // 검색 조건: 테스트 고객만 (customerStatus가 'test'이거나 password가 '1101'인 고객)
    const where: any = {
      role: { not: 'admin' },
      OR: [
        { customerStatus: 'test' },
        { password: '1101' },
      ],
    };

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

    // 상태 필터
    if (status === 'test') {
      // 테스트 중: customerStatus가 'test'이고 72시간이 아직 지나지 않은 경우
      const now = new Date();
      where.AND = [
        ...(where.AND || []),
        {
          customerStatus: 'test',
          testModeStartedAt: {
            not: null,
          },
        },
      ];
    } else if (status === 'locked') {
      // 만료/잠금: customerStatus가 'locked'이거나 72시간이 지난 경우
      const now = new Date();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { customerStatus: 'locked' },
            { isLocked: true },
          ],
        },
      ];
    }

    // 정렬
    const orderBy: any = {};
    if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'testModeStartedAt') {
      orderBy.testModeStartedAt = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // 총 개수 조회
    const total = await prisma.user.count({ where });

    // 고객 목록 조회
    const customers = await prisma.user.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true,
        lastActiveAt: true,
        tripCount: true,
        totalTripCount: true,
        customerStatus: true,
        testModeStartedAt: true,
        isLocked: true,
        password: true, // 비밀번호 (평문)
        PasswordEvent: {
          select: {
            id: true,
            to: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        Trip: {
          select: {
            id: true,
            cruiseName: true,
            companionType: true,
            destination: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    const now = new Date();

    return NextResponse.json({
      ok: true,
      customers: customers.map(customer => {
        // 상태 결정 및 남은 시간 계산
        let resolvedStatus: 'test' | 'locked' = 'test';
        let testModeRemainingHours: number | null = null;

        if (customer.customerStatus === 'test' && customer.testModeStartedAt) {
          const testModeEndAt = new Date(customer.testModeStartedAt);
          testModeEndAt.setHours(testModeEndAt.getHours() + 72);

          if (now > testModeEndAt) {
            resolvedStatus = 'locked';
          } else {
            resolvedStatus = 'test';
            const remainingMs = testModeEndAt.getTime() - now.getTime();
            testModeRemainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
          }
        } else if (customer.customerStatus === 'locked' || customer.isLocked) {
          resolvedStatus = 'locked';
        }

        // 현재 비밀번호 가져오기
        // PasswordEvent.to 값만 사용 (평문 비밀번호)
        // password 필드는 해시된 값이므로 사용하지 않음
        const latestPasswordEvent = customer.PasswordEvent && customer.PasswordEvent.length > 0
          ? customer.PasswordEvent[0]
          : null;
        const currentPassword = latestPasswordEvent?.to || null; // PasswordEvent.to 값만 사용, 없으면 null

        return {
          ...customer,
          createdAt: customer.createdAt.toISOString(),
          lastActiveAt: customer.lastActiveAt?.toISOString() || null,
          testModeStartedAt: customer.testModeStartedAt?.toISOString() || null,
          status: resolvedStatus,
          testModeRemainingHours,
          tripCount: customer.Trip?.length || 0,
          currentPassword, // 현재 비밀번호
          trips: (customer.Trip || []).map(trip => ({
            ...trip,
            startDate: trip.startDate?.toISOString() || null,
            endDate: trip.endDate?.toISOString() || null,
          })),
        };
      }),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Admin Test Customers] Error:', error);
    return NextResponse.json(
      { ok: false, error: '테스트 고객 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

