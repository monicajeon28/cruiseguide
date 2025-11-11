// app/api/public/inquiry/route.ts
// 구매 문의 API (로그인 불필요)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST: 구매 문의 제출
 * 로그인 없이 접근 가능
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productCode, name, phone, passportNumber, message } = body;

    // 필수 필드 검증 (passportNumber는 선택사항)
    if (!productCode || !name || !phone) {
      return NextResponse.json(
        { ok: false, error: '필수 정보를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 상품 존재 확인
    const product = await prisma.cruiseProduct.findUnique({
      where: { productCode },
      select: { id: true, packageName: true },
    });

    if (!product) {
      return NextResponse.json(
        { ok: false, error: '상품을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 로그인된 사용자 ID 확인 (선택적)
    let userId: number | null = null;
    try {
      const { getSession } = await import('@/lib/session');
      const session = await getSession();
      if (session?.userId) {
        userId = parseInt(session.userId);
      }
    } catch (e) {
      // 세션 확인 실패해도 계속 진행 (비회원 문의 가능)
    }

    // 어필리에이트 코드 추적 (쿠키에서 읽기)
    const cookies = req.cookies;
    const affiliateCode = cookies.get('affiliate_code')?.value || null;
    const affiliateMallUserId = cookies.get('affiliate_mall_user_id')?.value || null;

    // 어필리에이트 프로필 찾기
    let managerId: number | null = null;
    let agentId: number | null = null;
    
    if (affiliateCode || affiliateMallUserId) {
      const profileWhere: any = {};
      if (affiliateCode) {
        profileWhere.affiliateCode = affiliateCode;
      } else if (affiliateMallUserId) {
        profileWhere.user = { mallUserId: affiliateMallUserId };
      }

      const affiliateProfile = await prisma.affiliateProfile.findFirst({
        where: {
          ...profileWhere,
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

      if (affiliateProfile) {
        if (affiliateProfile.type === 'BRANCH_MANAGER') {
          managerId = affiliateProfile.id;
        } else if (affiliateProfile.type === 'SALES_AGENT') {
          agentId = affiliateProfile.id;
          // 판매원인 경우 대리점장 ID도 설정
          if (affiliateProfile.agentRelations.length > 0) {
            managerId = affiliateProfile.agentRelations[0].managerId;
          }
        }
      }
    }

    // ProductInquiry 테이블에 저장
    const inquiry = await prisma.productInquiry.create({
      data: {
        productCode,
        userId,
        name,
        phone,
        passportNumber: passportNumber || null,
        message: message || null,
        status: 'pending'
      }
    });

    // AffiliateLead 생성 (어필리에이트 코드가 있는 경우)
    if (managerId || agentId) {
      try {
        await prisma.affiliateLead.create({
          data: {
            managerId: managerId || null,
            agentId: agentId || null,
            customerName: name,
            customerPhone: phone,
            status: 'NEW',
            source: affiliateMallUserId ? `mall-${affiliateMallUserId}` : 'product-inquiry',
            metadata: {
              productCode,
              inquiryId: inquiry.id,
              affiliateCode,
              affiliateMallUserId,
              mallUserId: affiliateMallUserId, // 개인몰 ID 저장
            },
          },
        });
        console.log('[Public Inquiry API] AffiliateLead 생성 완료:', { managerId, agentId, customerName: name });
      } catch (leadError) {
        console.error('[Public Inquiry API] AffiliateLead 생성 실패:', leadError);
        // AffiliateLead 생성 실패해도 문의는 정상 처리
      }
    }

    // TODO: 관리자에게 알림 전송 (이메일, SMS, 푸시 알림 등)

    return NextResponse.json({
      ok: true,
      message: '문의가 접수되었습니다. 곧 연락드리겠습니다.',
      inquiryId: inquiry.id,
    });
  } catch (error) {
    console.error('[Public Inquiry API] POST error:', error);
    return NextResponse.json(
      { ok: false, error: '문의 접수 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}




