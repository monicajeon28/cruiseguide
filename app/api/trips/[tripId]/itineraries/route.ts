import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

/**
 * GET: 특정 여행의 일정 조회
 * 쿼리 파라미터: date (선택사항 - 특정 날짜 일정 필터링)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const tripId = parseInt(params.tripId);
    if (isNaN(tripId)) {
      return NextResponse.json(
        { error: '유효하지 않은 여행 ID입니다' },
        { status: 400 }
      );
    }

    // 여행 소유권 확인
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        userId: session.user.id,
      },
    });

    if (!trip) {
      return NextResponse.json(
        { error: '여행을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 쿼리 파라미터에서 날짜 추출
    const dateParam = req.nextUrl.searchParams.get('date');
    let whereClause: any = { tripId };

    if (dateParam) {
      const targetDate = new Date(dateParam);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      whereClause.date = {
        gte: targetDate,
        lt: nextDay,
      };
    }

    // 일정 조회
    const itineraries = await prisma.itinerary.findMany({
      where: whereClause,
      orderBy: { day: 'asc' },
    });

    return NextResponse.json(
      { data: itineraries },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] 여행 일정 조회 오류:', error);
    return NextResponse.json(
      { error: '일정 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
