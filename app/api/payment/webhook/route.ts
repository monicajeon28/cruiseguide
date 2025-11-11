// app/api/payment/webhook/route.ts
// 결제 완료 웹훅 (외부 결제 시스템에서 호출)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateLedgerEntries } from '@/lib/affiliate/commission';
import { sendPurchaseConfirmation } from '@/lib/affiliate/purchase-confirmation';

/**
 * POST: 결제 완료 웹훅
 * 외부 결제 시스템(아임포트, 토스페이먼츠 등)에서 결제 완료 시 호출
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      imp_uid, // 아임포트 결제 고유 ID
      merchant_uid, // 주문번호
      status, // 결제 상태 ('paid', 'ready', 'failed', 'cancelled')
      amount, // 결제 금액
      productCode,
      customerName,
      customerPhone,
      cabinType,
      fareCategory,
      headcount,
      costAmount,
      metadata, // 추가 메타데이터 (leadId, partnerId 등)
    } = body;

    // 결제 성공 여부 확인
    if (status !== 'paid') {
      return NextResponse.json({ ok: false, message: '결제가 완료되지 않았습니다.' }, { status: 400 });
    }

    if (!imp_uid || !merchant_uid || !amount || !productCode) {
      return NextResponse.json({ ok: false, message: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    // 어필리에이트 코드 추적 (쿠키 또는 metadata에서 읽기)
    const cookies = req.cookies;
    const affiliateCode = cookies.get('affiliate_code')?.value || metadata?.affiliateCode || null;
    const affiliateMallUserId = cookies.get('affiliate_mall_user_id')?.value || metadata?.partnerId || null;
    const leadId = metadata?.leadId || null;

    // 어필리에이트 프로필 찾기
    let managerId: number | null = null;
    let agentId: number | null = null;

    if (affiliateCode || affiliateMallUserId) {
      let affiliateProfile = null;

      // 방법 1: affiliateCode로 찾기
      if (affiliateCode) {
        affiliateProfile = await prisma.affiliateProfile.findFirst({
          where: {
            affiliateCode: affiliateCode,
            status: 'ACTIVE',
          },
          select: {
            id: true,
            type: true,
            agentRelations: {
              where: { status: 'ACTIVE' },
              select: { managerId: true },
              take: 1,
            },
          },
        });
      }
      
      // 방법 2: affiliateMallUserId로 찾기 (User ID 또는 phone으로 찾기)
      if (!affiliateProfile && affiliateMallUserId) {
        // 먼저 User를 찾기 (ID 또는 phone으로)
        const userIdNum = parseInt(affiliateMallUserId);
        let user = null;
        
        if (!isNaN(userIdNum)) {
          // 숫자면 ID로 찾기
          user = await prisma.user.findUnique({
            where: { id: userIdNum },
            select: { id: true, phone: true },
          });
        } else {
          // 문자열이면 phone으로 찾기
          user = await prisma.user.findFirst({
            where: { phone: affiliateMallUserId },
            select: { id: true, phone: true },
          });
        }

        if (user) {
          // User와 연결된 AffiliateProfile 찾기
          affiliateProfile = await prisma.affiliateProfile.findFirst({
            where: {
              userId: user.id,
              status: 'ACTIVE',
            },
            select: {
              id: true,
              type: true,
              agentRelations: {
                where: { status: 'ACTIVE' },
                select: { managerId: true },
                take: 1,
              },
            },
          });
        }
      }

      if (affiliateProfile) {
        if (affiliateProfile.type === 'BRANCH_MANAGER') {
          managerId = affiliateProfile.id;
        } else if (affiliateProfile.type === 'SALES_AGENT') {
          agentId = affiliateProfile.id;
          if (affiliateProfile.agentRelations.length > 0) {
            managerId = affiliateProfile.agentRelations[0].managerId;
          }
        }
      }
    }

    // Lead에서 어필리에이트 정보 가져오기 (없는 경우)
    if (!managerId && !agentId && leadId) {
      const lead = await prisma.affiliateLead.findUnique({
        where: { id: Number(leadId) },
        select: {
          managerId: true,
          agentId: true,
        },
      });

      if (lead) {
        managerId = lead.managerId ?? null;
        agentId = lead.agentId ?? null;
      }
    }

    // AffiliateProduct 찾기
    let affiliateProductId: number | null = null;
    if (productCode) {
      const affiliateProduct = await prisma.affiliateProduct.findFirst({
        where: {
          productCode,
          isPublished: true,
          effectiveFrom: { lte: new Date() },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: new Date() } },
          ],
        },
        orderBy: { effectiveFrom: 'desc' },
        take: 1,
      });

      if (affiliateProduct) {
        affiliateProductId = affiliateProduct.id;
      }
    }

    // 수당 계산
    const netRevenue = amount - (costAmount || 0);
    const breakdown = generateLedgerEntries({
      saleId: 0, // 임시값, 나중에 업데이트
      saleAmount: amount,
      costAmount: costAmount || 0,
      managerProfileId: managerId ?? undefined,
      agentProfileId: agentId ?? undefined,
      currency: 'KRW',
      metadata: {
        ...metadata,
        imp_uid,
        merchant_uid,
        affiliateCode,
        affiliateMallUserId,
      },
    });

    // AffiliateSale 생성
    const sale = await prisma.affiliateSale.create({
      data: {
        externalOrderCode: merchant_uid,
        leadId: leadId ? Number(leadId) : null,
        affiliateProductId,
        managerId: managerId,
        agentId: agentId,
        productCode,
        cabinType: cabinType || null,
        fareCategory: fareCategory || null,
        headcount: headcount || null,
        saleAmount: amount,
        costAmount: costAmount || null,
        netRevenue,
        branchCommission: breakdown.breakdown.branchCommission,
        salesCommission: breakdown.breakdown.salesCommission,
        overrideCommission: breakdown.breakdown.overrideCommission,
        withholdingAmount: breakdown.breakdown.totalWithholding,
        status: 'CONFIRMED',
        saleDate: new Date(),
        confirmedAt: new Date(),
        metadata: {
          ...metadata,
          imp_uid,
          merchant_uid,
          affiliateCode,
          affiliateMallUserId,
        },
      },
    });

    // CommissionLedger 엔트리 생성
    const ledgerEntries = breakdown.ledgerEntries.map((entry) => ({
      ...entry,
      saleId: sale.id,
    }));

    if (ledgerEntries.length > 0) {
      await prisma.commissionLedger.createMany({
        data: ledgerEntries,
      });
    }

    // Lead 상태 업데이트
    if (leadId) {
      await prisma.affiliateLead.update({
        where: { id: Number(leadId) },
        data: { status: 'PURCHASED' },
      });
    }

    console.log('[Payment Webhook] AffiliateSale 생성 완료:', {
      saleId: sale.id,
      managerId,
      agentId,
      amount,
      breakdown: breakdown.breakdown,
    });

    // 구매확인서 자동 발송 (담당자가 있는 경우)
    if (managerId || agentId) {
      try {
        await sendPurchaseConfirmation(sale.id);
        console.log('[Payment Webhook] 구매확인서 발송 완료');
      } catch (confirmationError) {
        console.error('[Payment Webhook] 구매확인서 발송 실패:', confirmationError);
        // 구매확인서 발송 실패해도 결제 처리는 성공으로 처리
      }
    }

    return NextResponse.json({
      ok: true,
      saleId: sale.id,
      message: '결제 완료 및 어필리에이트 판매가 기록되었습니다.',
    });
  } catch (error) {
    console.error('[Payment Webhook] Error:', error);
    return NextResponse.json(
      { ok: false, message: '결제 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
