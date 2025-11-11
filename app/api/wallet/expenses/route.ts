import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

// 지출 카테고리
export type ExpenseCategory = '식사' | '쇼핑' | '교통' | '관광' | '숙박' | '기타';

// 지출 기록 타입
export type Expense = {
  id: number;
  tripId: number;
  day: number; // Day 1, Day 2, ...
  date: string; // ISO 날짜
  category: ExpenseCategory;
  amount: number;
  currency: string; // KRW, USD, JPY, ...
  amountInKRW: number; // 원화 환산 금액
  description: string;
  createdAt: string;
};

// GET: 지출 기록 조회
// Query params:
//   - tripId: 여행 ID (선택, 없으면 최신 여행)
//   - day: 특정 날짜 (선택)
export async function GET(req: NextRequest) {
  try {
    // 인증 확인
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get('tripId');
    const dayStr = searchParams.get('day');

    let targetTripId: number | null = tripId ? parseInt(tripId) : null;

    // tripId가 없으면 최신 여행 조회
    if (!targetTripId) {
      const latestTrip = await prisma.trip.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });

      if (!latestTrip) {
        return NextResponse.json({
          success: true,
          expenses: [],
          message: 'No trips found',
        });
      }

      targetTripId = latestTrip.id;
    }

    // 여행 소유권 확인
    const trip = await prisma.trip.findFirst({
      where: { id: targetTripId, userId: user.id },
      select: { id: true },
    });

    if (!trip) {
      return NextResponse.json(
        { success: false, error: 'Trip not found or unauthorized' },
        { status: 404 }
      );
    }

    // 지출 기록 조회
    // 실제 스키마: userId, foreignAmount, krwAmount, usdAmount, currency, category, description
    const whereClause: any = { 
      tripId: targetTripId,
      userId: user.id, // 사용자별로 필터링
    };

    try {
      const expenses = await prisma.expense.findMany({
        where: whereClause,
        orderBy: [{ createdAt: 'desc' }],
      });

      // 클라이언트가 기대하는 형식으로 변환 (day, date, amount, amountInKRW)
      // day 필드는 스키마에 없으므로 createdAt 기반으로 추정하거나 기본값 사용
      const formattedExpenses = expenses.map((exp: any, index: number) => ({
        id: exp.id,
        tripId: exp.tripId,
        day: 1, // 기본값 (day 필드가 스키마에 없으므로)
        date: exp.createdAt ? new Date(exp.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        category: exp.category,
        amount: exp.foreignAmount || 0,
        currency: exp.currency || 'KRW',
        amountInKRW: exp.krwAmount || 0,
        description: exp.description || '',
        createdAt: exp.createdAt ? new Date(exp.createdAt).toISOString() : new Date().toISOString(),
      }));

      return NextResponse.json({
        success: true,
        expenses: formattedExpenses,
        tripId: targetTripId,
      });
    } catch (dbError: any) {
      console.error('[API /wallet/expenses GET] Database error:', dbError);
      // 상세 에러 정보 반환
      return NextResponse.json(
        { 
          success: false, 
          error: `데이터베이스 조회 오류: ${dbError.message || '알 수 없는 오류'}`,
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[API /wallet/expenses GET] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `지출 기록 조회 실패: ${error.message || '알 수 없는 오류'}`,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// POST: 지출 기록 추가
// Body: {
//   day: number,
//   date: string,
//   category: ExpenseCategory,
//   amount: number,
//   currency: string,
//   amountInKRW: number,
//   description: string,
//   tripId?: string (선택)
// }
export async function POST(req: NextRequest) {
  try {
    // 인증 확인
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { day, date, category, amount, currency, amountInKRW, description, tripId } = body;

    // 유효성 검사
    if (!day || !category || !amount || !currency || amountInKRW === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let targetTripId: number | null = tripId ? parseInt(tripId) : null;

    // tripId가 없으면 최신 여행 사용
    if (!targetTripId) {
      const latestTrip = await prisma.trip.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });

      if (!latestTrip) {
        return NextResponse.json(
          { success: false, error: 'No trip found' },
          { status: 404 }
        );
      }

      targetTripId = latestTrip.id;
    }

    // 여행 소유권 확인
    const trip = await prisma.trip.findFirst({
      where: { id: targetTripId, userId: user.id },
      select: { id: true },
    });

    if (!trip) {
      return NextResponse.json(
        { success: false, error: 'Trip not found or unauthorized' },
        { status: 404 }
      );
    }

    // 지출 기록 생성
    // 실제 스키마에 맞게 필드 매핑: userId, foreignAmount, krwAmount, usdAmount 사용
    try {
      const amountNum = parseFloat(amount.toString());
      if (isNaN(amountNum) || amountNum <= 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid amount' },
          { status: 400 }
        );
      }

      const amountInKRWNum = parseFloat(amountInKRW.toString());
      if (isNaN(amountInKRWNum) || amountInKRWNum < 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid amountInKRW' },
          { status: 400 }
        );
      }

      // USD 환산 계산 (간단한 환율 사용, 실제로는 환율 API 사용 권장)
      const usdAmount = currency === 'USD' 
        ? amountNum 
        : amountInKRWNum / 1300; // 임시 환율 (실제로는 환율 API 사용)

      const expense = await prisma.expense.create({
        data: {
          userId: user.id,
          tripId: targetTripId,
          category,
          foreignAmount: amountNum,
          krwAmount: amountInKRWNum,
          usdAmount: parseFloat(usdAmount.toFixed(2)),
          currency,
          description: description || '',
        },
      });

      // 클라이언트가 기대하는 형식으로 변환
      const formattedExpense = {
        id: expense.id,
        tripId: expense.tripId,
        day: day || 1, // 클라이언트에서 보낸 day 값 사용
        date: date || new Date().toISOString().split('T')[0],
        category: expense.category,
        amount: expense.foreignAmount,
        currency: expense.currency,
        amountInKRW: expense.krwAmount,
        description: expense.description,
        createdAt: expense.createdAt ? new Date(expense.createdAt).toISOString() : new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        expense: formattedExpense,
      });
    } catch (dbError: any) {
      console.error('[API /wallet/expenses POST] Database error:', dbError);
      // Prisma 스키마 오류가 있을 수 있으므로 상세 에러 반환
      return NextResponse.json(
        { 
          success: false, 
          error: `데이터베이스 오류: ${dbError.message || '알 수 없는 오류'}`,
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API /wallet/expenses POST] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}

// DELETE: 지출 기록 삭제
// Query params: id (expense ID) 또는 all=true (모든 지출 삭제)
export async function DELETE(req: NextRequest) {
  try {
    // 인증 확인
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const idStr = searchParams.get('id');
    const all = searchParams.get('all');

    // 모든 지출 삭제 (all=true)
    if (all === 'true') {
      // 사용자의 모든 지출 삭제
      const deleteResult = await prisma.expense.deleteMany({
        where: { userId: user.id },
      });

      return NextResponse.json({
        success: true,
        message: 'All expenses deleted',
        deletedCount: deleteResult.count,
      });
    }

    // 개별 지출 삭제 (id 제공)
    if (!idStr) {
      return NextResponse.json(
        { success: false, error: 'Missing expense ID or all parameter' },
        { status: 400 }
      );
    }

    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid expense ID' },
        { status: 400 }
      );
    }

    // 지출 소유권 확인
    const expense = await prisma.expense.findFirst({
      where: { id },
      include: { trip: { select: { userId: true } } },
    });

    if (!expense) {
      return NextResponse.json(
        { success: false, error: 'Expense not found' },
        { status: 404 }
      );
    }

    if (expense.trip?.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Expense deleted',
    });
  } catch (error) {
    console.error('[API /wallet/expenses DELETE] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}

// PUT: 지출 기록 수정
// Body: { id: number, ...업데이트할 필드들 }
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id || typeof id !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid expense ID' },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      expense,
    });
  } catch (error) {
    console.error('[API /wallet/expenses PUT] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update expense' },
      { status: 500 }
    );
  }
}
