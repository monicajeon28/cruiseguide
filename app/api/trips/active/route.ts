import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

/**
 * GET: 현재 진행 중인 여행 조회
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 현재 진행 중인 여행 조회
    const activeTrip = await prisma.trip.findFirst({
      where: {
        userId: parseInt(session.userId),
        status: 'InProgress',
      },
      include: {
        Itinerary: {
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!activeTrip) {
      return NextResponse.json(
        { data: null },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { data: activeTrip },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] 활성 여행 조회 오류:', error);
    return NextResponse.json(
      { error: '여행 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
