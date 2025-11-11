import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, message: '로그인이 필요합니다.' }, { status: 401 });
    }

    if (sessionUser.role !== 'admin') {
      return NextResponse.json({ ok: false, message: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const settlements = await prisma.monthlySettlement.findMany({
      orderBy: [{ periodStart: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      include: {
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const formattedSettlements = settlements.map((settlement) => ({
      id: settlement.id,
      periodStart: settlement.periodStart.toISOString(),
      periodEnd: settlement.periodEnd.toISOString(),
      status: settlement.status,
      paymentDate: settlement.paymentDate?.toISOString() || null,
      approvedAt: settlement.approvedAt?.toISOString() || null,
      approvedBy: settlement.approvedBy
        ? {
            id: settlement.approvedBy.id,
            name: settlement.approvedBy.name,
            email: settlement.approvedBy.email,
          }
        : null,
    }));

    return NextResponse.json({
      ok: true,
      settlements: formattedSettlements,
    });
  } catch (error) {
    console.error('GET /api/admin/affiliate/settlements-list error:', error);
    return NextResponse.json(
      { ok: false, message: '정산 목록을 불러오지 못했습니다.' },
      { status: 500 }
    );
  }
}

