// app/api/expenses/route.ts
// 가계부 API (CRUD)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

/**
 * GET: 모든 지출 항목 조회
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

    const tripIdParam = req.nextUrl.searchParams.get('tripId');
    const tripId = tripIdParam ? parseInt(tripIdParam) : undefined;

    const expenses = await prisma.expense.findMany({
      where: tripId ? { trip: { userId: parseInt(session.userId), id: tripId } } : { trip: { userId: parseInt(session.userId) } },
      include: { trip: { select: { id: true, cruiseName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: expenses }, { status: 200 });
  } catch (error) {
    console.error('[API] 지출 조회 오류:', error);
    return NextResponse.json(
      { error: '지출 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * POST: 새로운 지출 항목 생성
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const { tripId, amount, currency, category, description } = await req.json();

    if (!tripId || !amount || !currency || !category) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다' },
        { status: 400 }
      );
    }

    // 여행 소유권 확인
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId: parseInt(session.userId) },
    });

    if (!trip) {
      return NextResponse.json(
        { error: '여행을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 환율 정보 가져오기
    let krwAmount = 0;
    let usdAmount = 0;
    
    try {
      const exchangeResponse = await fetch(`/api/exchange/${currency}`);
      if (exchangeResponse.ok) {
        const exchangeData = await exchangeResponse.json();
        krwAmount = amount * exchangeData.krw.rate;
        usdAmount = amount * exchangeData.usd.rate;
      } else {
        // 폴백 환율 사용
        krwAmount = currency === 'KRW' ? amount : amount * 1300;
        usdAmount = currency === 'USD' ? amount : amount * 0.0077;
      }
    } catch (error) {
      // 폴백 환율 사용
      krwAmount = currency === 'KRW' ? amount : amount * 1300;
      usdAmount = currency === 'USD' ? amount : amount * 0.0077;
    }

    const expense = await prisma.expense.create({
      data: {
        userId: parseInt(session.userId),
        tripId,
        foreignAmount: parseFloat(amount.toString()),
        krwAmount: Math.round(krwAmount),
        usdAmount: Number(usdAmount.toFixed(2)),
        currency,
        category,
        description: description || '',
      },
    });

    return NextResponse.json({ data: expense }, { status: 201 });
  } catch (error) {
    console.error('[API] 지출 생성 오류:', error);
    return NextResponse.json(
      { error: '지출 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * PUT: 지출 항목 수정
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const { id, amount, currency, category, description } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 지출 항목 소유권 확인
    const expense = await prisma.expense.findFirst({
      where: { id, userId: parseInt(session.userId) },
    });

    if (!expense) {
      return NextResponse.json(
        { error: '지출 항목을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 업데이트할 데이터 준비
    const updateData: any = {};
    
    if (amount !== undefined) {
      updateData.foreignAmount = parseFloat(amount.toString());
      
      // 환율 정보 가져오기
      let krwAmount = 0;
      let usdAmount = 0;
      
      try {
        const exchangeResponse = await fetch(`/api/exchange/${currency || expense.currency}`);
        if (exchangeResponse.ok) {
          const exchangeData = await exchangeResponse.json();
          krwAmount = amount * exchangeData.krw.rate;
          usdAmount = amount * exchangeData.usd.rate;
        } else {
          // 폴백 환율 사용
          krwAmount = (currency || expense.currency) === 'KRW' ? amount : amount * 1300;
          usdAmount = (currency || expense.currency) === 'USD' ? amount : amount * 0.0077;
        }
      } catch (error) {
        // 폴백 환율 사용
        krwAmount = (currency || expense.currency) === 'KRW' ? amount : amount * 1300;
        usdAmount = (currency || expense.currency) === 'USD' ? amount : amount * 0.0077;
      }
      
      updateData.krwAmount = Math.round(krwAmount);
      updateData.usdAmount = Number(usdAmount.toFixed(2));
    }
    
    if (currency) updateData.currency = currency;
    if (category) updateData.category = category;
    if (description !== undefined) updateData.description = description;

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: updatedExpense }, { status: 200 });
  } catch (error) {
    console.error('[API] 지출 수정 오류:', error);
    return NextResponse.json(
      { error: '지출 수정 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: 지출 항목 삭제
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const id = req.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 지출 항목 소유권 확인
    const expense = await prisma.expense.findFirst({
      where: { id: parseInt(id), userId: parseInt(session.userId) },
    });

    if (!expense) {
      return NextResponse.json(
        { error: '지출 항목을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    await prisma.expense.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json(
      { message: '지출 항목이 삭제되었습니다' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] 지출 삭제 오류:', error);
    return NextResponse.json(
      { error: '지출 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
