import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'cg.sid.v2';

// 관리자 권한 확인
async function checkAdminAuth(sid: string | undefined): Promise<boolean> {
  if (!sid) return false;

  try {
    const session = await prisma.session.findUnique({
      where: { id: sid },
      include: {
        User: {
          select: { role: true },
        },
      },
    });

    return session?.User.role === 'admin';
  } catch (error) {
    console.error('[Admin Customer Search] Auth check error:', error);
    return false;
  }
}

/**
 * GET: 고객 검색 (이름/연락처로 검색, 크루즈 가이드 AI 사용 고객만)
 */
export async function GET(req: NextRequest) {
  try {
    // 관리자 권한 확인
    const sid = cookies().get(SESSION_COOKIE)?.value;
    const isAdmin = await checkAdminAuth(sid);

    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!query || query.trim().length < 1) {
      return NextResponse.json({
        ok: true,
        customers: [],
      });
    }

    // 크루즈 가이드 AI 사용 고객만 필터링 (Trip이 있는 고객)
    const usersWithTrip = await prisma.user.findMany({
      where: {
        Trip: { some: {} },
        role: 'user',
        OR: [
          { name: { contains: query } },
          { phone: { contains: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        customerStatus: true,
        Trip: {
          select: {
            id: true,
            cruiseName: true,
            status: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      ok: true,
      customers: usersWithTrip.map(user => ({
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        status: user.customerStatus || 'active',
        hasActiveTrip: user.Trip && user.Trip.length > 0 && user.Trip[0].status === 'InProgress',
        latestTrip: user.Trip && user.Trip.length > 0 ? {
          cruiseName: user.Trip[0].cruiseName,
          status: user.Trip[0].status,
        } : null,
      })),
    });
  } catch (error) {
    console.error('[Admin Customer Search] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}






