// app/api/admin/affiliate/adjustments/[adjustmentId]/approve/route.ts
// 수당 조정 승인/거부 API (본사 관리자만 가능)

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
 * POST: 수당 조정 승인/거부
 * - 본사 관리자만 가능
 * - 승인 시 CommissionLedger 업데이트 및 재정산
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { adjustmentId: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        role: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 });
    }

    // 관리자 권한 체크
    const guard = requireAdmin(user.role);
    if (guard) return guard;

    const adjustmentId = Number(params.adjustmentId);
    if (isNaN(adjustmentId)) {
      return NextResponse.json({ ok: false, message: 'Invalid adjustment ID' }, { status: 400 });
    }

    const body = await req.json();
    const { action, notes } = body; // action: 'APPROVE' | 'REJECT'

    if (!action || (action !== 'APPROVE' && action !== 'REJECT')) {
      return NextResponse.json({ ok: false, message: 'action은 APPROVE 또는 REJECT여야 합니다.' }, { status: 400 });
    }

    // Adjustment 조회
    const adjustment = await prisma.commissionAdjustment.findUnique({
      where: { id: adjustmentId },
      include: {
        ledger: {
          include: {
            sale: {
              select: {
                id: true,
                productCode: true,
                saleAmount: true,
              },
            },
            profile: {
              select: {
                id: true,
                affiliateCode: true,
                displayName: true,
                type: true,
              },
            },
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!adjustment) {
      return NextResponse.json({ ok: false, message: 'Adjustment not found' }, { status: 404 });
    }

    // 이미 처리된 경우
    if (adjustment.status !== 'REQUESTED') {
      return NextResponse.json({ ok: false, message: '이미 처리된 신청입니다.' }, { status: 400 });
    }

    // AdjustmentStatus enum 확인 필요 (REQUESTED, APPROVED, REJECTED)
    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    // 트랜잭션으로 처리
    const result = await prisma.$transaction(async (tx) => {
      // Adjustment 상태 업데이트
      const updatedAdjustment = await tx.commissionAdjustment.update({
        where: { id: adjustmentId },
        data: {
          status: newStatus,
          approvedById: user.id,
          decidedAt: new Date(),
          metadata: {
            ...((adjustment.metadata as any) || {}),
            approvedBy: user.name,
            approvedAt: new Date().toISOString(),
            notes: notes || null,
          },
        },
        include: {
          ledger: {
            include: {
              profile: {
                select: {
                  id: true,
                  affiliateCode: true,
                  displayName: true,
                },
              },
            },
          },
          requestedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          approvedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // 승인된 경우 CommissionLedger 업데이트
      if (action === 'APPROVE') {
        // 기존 수당에 조정 금액 추가
        await tx.commissionLedger.update({
          where: { id: adjustment.ledgerId },
          data: {
            amount: {
              increment: adjustment.amount, // 조정 금액 추가
            },
            notes: `수당 조정 승인: ${adjustment.amount.toLocaleString()}원 추가 (${adjustment.reason})`,
            metadata: {
              ...((adjustment.ledger.metadata as any) || {}),
              adjustedAt: new Date().toISOString(),
              adjustedBy: user.id,
              adjustmentId: adjustment.id,
              adjustmentAmount: adjustment.amount,
            },
          },
        });

        // 정산이 이미 완료된 경우, 다음 정산에 반영되도록 처리
        // (현재 정산의 경우 재계산 필요)
        if (adjustment.ledger.isSettled && adjustment.ledger.settlementId) {
          // TODO: 정산 재계산 로직 (필요시 구현)
          // 현재는 다음 정산에 반영되도록 메타데이터에 기록
        }
      }

      return updatedAdjustment;
    });

    // TODO: 신청자에게 알림 전송
    // if (adjustment.requestedBy) {
    //   await sendNotificationToUser(adjustment.requestedBy.id, {
    //     title: `수당 조정 ${action === 'APPROVE' ? '승인' : '거부'}`,
    //     body: `수당 조정 신청이 ${action === 'APPROVE' ? '승인' : '거부'}되었습니다.`,
    //   });
    // }

    return NextResponse.json({
      ok: true,
      adjustment: result,
      message: `수당 조정이 ${action === 'APPROVE' ? '승인' : '거부'}되었습니다.`,
    });
  } catch (error) {
    console.error('POST /api/admin/affiliate/adjustments/[adjustmentId]/approve error:', error);
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 });
  }
}
