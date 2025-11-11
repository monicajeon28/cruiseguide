import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

/**
 * GET: 마지막 완료된 여행 정보
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

    // 가장 최근 완료된 여행 조회
    const lastTrip = await prisma.trip.findFirst({
      where: {
        userId: session.user.id,
        status: 'Completed',
      },
      include: {
        itineraries: {
          select: {
            country: true,
          },
        },
      },
      orderBy: { endDate: 'desc' },
    });

    if (!lastTrip) {
      return NextResponse.json(
        { error: '완료된 여행이 없습니다' },
        { status: 404 }
      );
    }

    // 고유한 국가 수 계산
    const uniqueCountries = new Set(
      lastTrip.itineraries
        .map((it) => it.country)
        .filter((c): c is string => c !== null)
    ).size;

    // 지출 합계 계산
    const expenses = await prisma.expense.aggregate({
      where: { tripId: lastTrip.id },
      _sum: { amount: true },
    });

    const formatDate = (date: Date | null) => {
      if (!date) return '최근 여행';
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    return NextResponse.json(
      {
        cruiseName: lastTrip.cruiseName || '크루즈 여행',
        endDate: formatDate(lastTrip.endDate),
        visitedCountries: uniqueCountries,
        totalExpense: expenses._sum.amount || 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] 마지막 여행 조회 오류:', error);
    return NextResponse.json(
      { error: '여행 정보 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
