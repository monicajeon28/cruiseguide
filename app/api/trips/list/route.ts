import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/trips/list
 * 사용자의 모든 여행 목록 조회
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const trips = await prisma.trip.findMany({
      where: {
        userId: user.id,
      },
      include: {
        product: {
          select: {
            cruiseLine: true,
            shipName: true,
            source: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },  // Upcoming first
        { startDate: 'desc' },
      ],
    });

    return NextResponse.json({ ok: true, trips });
  } catch (error) {
    console.error('GET /api/trips/list error:', error);
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 });
  }
}
