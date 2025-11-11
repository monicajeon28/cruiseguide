// app/api/admin/affiliate/sales/pending-approval/route.ts
// 구매 완료 승인 대기 목록 조회 API

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
 * GET: 구매 완료 승인 대기 목록 조회
 * - PURCHASED 상태인 고객 중 AffiliateSale이 PENDING이거나 없는 경우
 * - 고객 기록/녹음 정보 포함
 */
export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({ where: { id: sessionUser.id }, select: { role: true } });
    const guard = requireAdmin(admin?.role);
    if (guard) return guard;

    // PURCHASED 상태인 고객 조회
    const purchasedLeads = await prisma.affiliateLead.findMany({
      where: {
        status: 'PURCHASED',
      },
      include: {
        manager: {
          select: {
            id: true,
            affiliateCode: true,
            displayName: true,
            nickname: true,
          },
        },
        agent: {
          select: {
            id: true,
            affiliateCode: true,
            displayName: true,
            nickname: true,
          },
        },
        interactions: {
          include: {
            media: {
              select: {
                id: true,
                fileName: true,
                fileSize: true,
                mimeType: true,
                storagePath: true,
                createdAt: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { occurredAt: 'desc' },
        },
        sales: {
          where: {
            status: 'PENDING',
          },
          select: {
            id: true,
            productCode: true,
            saleAmount: true,
            saleDate: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 승인 대기 항목만 필터링 (AffiliateSale이 PENDING이거나 없는 경우)
    const pendingApprovals = purchasedLeads
      .filter((lead) => {
        // AffiliateSale이 없거나 PENDING 상태인 경우
        return lead.sales.length === 0 || lead.sales.some((sale) => sale.id);
      })
      .map((lead) => {
        // 고객 기록/녹음 확인
        const hasInteractions = lead.interactions.length > 0;
        const hasRecordings = lead.interactions.some((interaction) =>
          interaction.media.some((media) => {
            const mimeType = media.mimeType?.toLowerCase() || '';
            return mimeType.includes('audio') || mimeType.includes('video');
          })
        );
        const hasNotes = lead.interactions.some((interaction) => interaction.note && interaction.note.trim().length > 0);

        return {
          leadId: lead.id,
          customerName: lead.customerName,
          customerPhone: lead.customerPhone,
          purchasedAt: lead.metadata && typeof lead.metadata === 'object' && 'purchasedAt' in lead.metadata
            ? (lead.metadata as any).purchasedAt
            : lead.createdAt.toISOString(),
          manager: lead.manager
            ? {
                id: lead.manager.id,
                name: lead.manager.displayName || lead.manager.nickname || lead.manager.affiliateCode,
                type: '대리점장',
              }
            : null,
          agent: lead.agent
            ? {
                id: lead.agent.id,
                name: lead.agent.displayName || lead.agent.nickname || lead.agent.affiliateCode,
                type: '판매원',
              }
            : null,
          sales: lead.sales.map((sale) => ({
            id: sale.id,
            productCode: sale.productCode,
            saleAmount: sale.saleAmount,
            saleDate: sale.saleDate?.toISOString() || null,
            createdAt: sale.createdAt.toISOString(),
          })),
          interactions: {
            count: lead.interactions.length,
            hasRecordings,
            hasNotes,
            latest: lead.interactions[0]
              ? {
                  type: lead.interactions[0].interactionType,
                  note: lead.interactions[0].note,
                  occurredAt: lead.interactions[0].occurredAt.toISOString(),
                  mediaCount: lead.interactions[0].media.length,
                }
              : null,
          },
          canApprove: hasInteractions && (hasRecordings || hasNotes), // 기록 또는 녹음이 있어야 승인 가능
        };
      });

    return NextResponse.json({
      ok: true,
      pendingApprovals,
      total: pendingApprovals.length,
    });
  } catch (error) {
    console.error('GET /api/admin/affiliate/sales/pending-approval error:', error);
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 });
  }
}
