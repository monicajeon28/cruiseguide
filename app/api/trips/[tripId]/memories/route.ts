import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/trips/[id]/memories
 * 완료된 여행의 추억 데이터를 조회합니다.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const tripId = parseInt(params.tripId);

    // 여행 정보 조회 (본인 여행인지 확인)
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        userId: user.id,
      },
      include: {
        itineraries: {
          orderBy: { day: 'asc' },
        },
      },
    });

    if (!trip) {
      return NextResponse.json(
        { ok: false, message: 'Trip not found' },
        { status: 404 }
      );
    }

    // 가계부 데이터 집계
    const expenses = await prisma.expense.findMany({
      where: {
        userId: user.id,
        tripId: tripId,
      },
    });

    const totalExpense = expenses.reduce((sum, exp) => sum + exp.krwAmount, 0);
    
    // 카테고리별 지출
    const expensesByCategory = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.krwAmount;
      return acc;
    }, {} as Record<string, number>);

    // 통화별 지출
    const expensesByCurrency = expenses.reduce((acc, exp) => {
      acc[exp.currency] = (acc[exp.currency] || 0) + exp.foreignAmount;
      return acc;
    }, {} as Record<string, number>);

    // 다이어리 엔트리 조회
    const diaries = await prisma.travelDiaryEntry.findMany({
      where: {
        userId: user.id,
        tripId: tripId,
      },
      orderBy: { date: 'asc' },
      select: {
        id: true,
        date: true,
        location: true,
        content: true,
        photos: true,
      },
    });

    // 방문 국가 목록
    const visitedCountries = [...new Set(
      trip.itineraries
        .filter(it => it.country)
        .map(it => it.country)
    )];

    // 기항지 목록 (Cruising 제외)
    const ports = trip.itineraries
      .filter(it => it.type === 'PortVisit')
      .map(it => ({
        day: it.day,
        location: it.location,
        country: it.country,
        arrival: it.arrival,
        departure: it.departure,
      }));

    return NextResponse.json({
      ok: true,
      memories: {
        trip: {
          id: trip.id,
          cruiseName: trip.cruiseName,
          startDate: trip.startDate,
          endDate: trip.endDate,
          nights: trip.nights,
          days: trip.days,
        },
        statistics: {
          totalExpense,
          expenseCount: expenses.length,
          expensesByCategory,
          expensesByCurrency,
          visitedCountries: visitedCountries.length,
          portsVisited: ports.length,
          diaryCount: diaries.length,
        },
        details: {
          ports,
          diaries,
          visitedCountries,
        },
      },
    });
  } catch (error) {
    console.error('GET /api/trips/[id]/memories error:', error);
    return NextResponse.json(
      { ok: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
