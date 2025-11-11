// app/api/admin/affiliate/sales/[saleId]/confirm/route.ts
// 판매 확정 API (결제 완료 시 호출)

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
 * POST: 판매 확정 (결제 완료 처리)
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

    const sale = await prisma.affiliateSale.findUnique({
      where: { id: saleId },
      select: {
        id: true,
        status: true,
        confirmedAt: true,
      },
    });

    if (!sale) {
      return NextResponse.json({ ok: false, message: 'Sale not found' }, { status: 404 });
    }

    if (sale.status === 'CONFIRMED' || sale.status === 'PAID') {
      return NextResponse.json({ ok: false, message: '이미 확정된 판매입니다.' }, { status: 400 });
    }

    const updated = await prisma.affiliateSale.update({
      where: { id: saleId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
      include: {
        manager: {
          select: {
            id: true,
            affiliateCode: true,
            displayName: true,
          },
        },
        agent: {
          select: {
            id: true,
            affiliateCode: true,
            displayName: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, sale: updated });
  } catch (error) {
    console.error(`POST /api/admin/affiliate/sales/${params.saleId}/confirm error:`, error);
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 });
  }
}