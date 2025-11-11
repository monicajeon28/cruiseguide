import { NextResponse } from 'next/server';
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
        User: {  // ✅ 대문자 U로 변경
          select: { role: true },
        },
      },
    });

    return session?.User.role === 'admin';  // ✅ 대문자 U로 변경
  } catch (error) {
    console.error('[Admin Recent Trips] Auth check error:', error);
    return false;
  }
}

export async function GET() {
  try {
    // 관리자 권한 확인
    const sid = cookies().get(SESSION_COOKIE)?.value;
    const isAdmin = await checkAdminAuth(sid);

    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 });
    }

    // 최근 여행 등록 (최근 10개)
    const recentTrips = await prisma.trip.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        User: {  // ✅ 대문자 U로 변경
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      trips: recentTrips.map(trip => ({
        id: trip.id,
        cruiseName: trip.cruiseName,
        destination: trip.destination,
        startDate: trip.startDate.toISOString(),
        userName: trip.User?.name || '이름 없음',  // ✅ 대문자 U로 변경
        userPhone: trip.User?.phone || '',  // ✅ 대문자 U로 변경
      })),
    });
  } catch (error) {
    console.error('[Admin Recent Trips API] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

