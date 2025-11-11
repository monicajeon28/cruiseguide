import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

function requireAdmin(role?: string | null) {
  if (role !== 'admin') {
    return NextResponse.json({ ok: false, message: 'Admin access required' }, { status: 403 });
  }
  return null;
}

/**
 * POST: 판매 건 환불 처리
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { saleId: string } }
) {
  try {
    const saleId = Number(params.saleId);
    if (!saleId || Number.isNaN(saleId)) {
      return NextResponse.json({ ok: false, message: 'Invalid sale ID' }, { status: 400 });
    }

    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({ where: { id: sessionUser.id }, select: { role: true } });
    const guard = requireAdmin(admin?.role);
    if (guard) return guard;

    const body = await req.json().catch(() => ({}));
    const reason = (body?.reason || '').trim();

    if (!reason) {
      return NextResponse.json({ ok: false, message: '환불 사유는 필수입니다.' }, { status: 400 });
    }

    // 판매 건 조회
    const sale = await prisma.affiliateSale.findUnique({
      where: { id: saleId },
      include: {
        ledgerEntries: true,
      },
    });

    if (!sale) {
      return NextResponse.json({ ok: false, message: '판매 건을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 이미 환불된 경우
    if (sale.status === 'REFUNDED') {
      return NextResponse.json({ ok: false, message: '이미 환불 처리된 판매 건입니다.' }, { status: 400 });
    }

    // 환불 불가능한 상태
    if (sale.status === 'CANCELLED') {
      return NextResponse.json({ ok: false, message: '취소된 판매 건은 환불할 수 없습니다.' }, { status: 400 });
    }

    // 환불 처리
    const refundedSale = await prisma.affiliateSale.update({
      where: { id: saleId },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
        cancellationReason: reason,
      },
    });

    // 관련 원장 항목도 환불 처리 (필요시)
    if (sale.ledgerEntries && sale.ledgerEntries.length > 0) {
      // 원장 항목에 환불 항목 추가 또는 상태 업데이트
      // 실제 구현은 비즈니스 로직에 따라 다를 수 있습니다
    }

    // 관리자 액션 로그 기록
    await prisma.adminActionLog.create({
      data: {
        adminId: sessionUser.id,
        targetUserId: null,
        action: 'affiliate.sale.refunded',
        details: {
          saleId: sale.id,
          reason: reason,
          saleAmount: sale.saleAmount,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      sale: {
        ...refundedSale,
        refundedAt: refundedSale.refundedAt?.toISOString() || null,
        saleDate: refundedSale.saleDate?.toISOString() || null,
        createdAt: refundedSale.createdAt.toISOString(),
        updatedAt: refundedSale.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error(`POST /api/admin/affiliate/sales/${params.saleId}/refund error:`, error);
    return NextResponse.json(
      { ok: false, message: '환불 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

