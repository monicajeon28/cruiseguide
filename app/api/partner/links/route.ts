// app/api/partner/links/route.ts
// 파트너용 링크 관리 API

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePartnerContext } from '@/app/api/partner/_utils';

// GET: 파트너의 링크 목록 조회
export async function GET(req: NextRequest) {
  try {
    const { profile } = await requirePartnerContext();

    const mallUserId = profile.user?.mallUserId;
    if (!mallUserId) {
      return NextResponse.json(
        { ok: false, message: '파트너 ID를 찾을 수 없습니다.' },
        { status: 400 }
      );
    }

    // 파트너의 기본 판매 링크 생성
    const shareLinks = {
      mall: `/products/${mallUserId}`,
      tracked: `/products/${mallUserId}?partner=${encodeURIComponent(mallUserId)}`,
      landing:
        profile.affiliateCode && profile.landingSlug
          ? `/store/${profile.affiliateCode}/${profile.landingSlug}`
          : null,
    };

    // 쿼리 파라미터에서 필터 가져오기
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    // 필터 조건 구성 - 파트너가 manager 또는 agent로 연결된 링크만 조회
    const where: any = {
      OR: [
        { managerId: profile.id },
        { agentId: profile.id },
      ],
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    // 링크 목록 조회
    const links = await prisma.affiliateLink.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            displayName: true,
            affiliateCode: true,
          },
        },
        agent: {
          select: {
            id: true,
            displayName: true,
            affiliateCode: true,
          },
        },
        product: {
          select: {
            id: true,
            productCode: true,
            title: true,
          },
        },
        issuedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            leads: true,
            sales: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 링크 URL 생성 (클라이언트에서 동적으로 생성하도록 URL 템플릿만 제공)
    const linksWithUrl = links.map((link) => {
      // 클라이언트에서 window.location.origin을 사용하여 URL 생성
      const params = new URLSearchParams();
      if (link.manager?.affiliateCode) {
        params.append('affiliate', link.manager.affiliateCode);
      }
      if (link.agent?.affiliateCode) {
        params.append('agent', link.agent.affiliateCode);
      }
      if (link.code) {
        params.append('link', link.code);
      }
      const queryString = params.toString();
      const urlTemplate = link.productCode 
        ? `/products/${link.productCode}${queryString ? `?${queryString}` : ''}`
        : `/products${queryString ? `?${queryString}` : ''}`;
      return { ...link, url: urlTemplate };
    });

    return NextResponse.json({
      ok: true,
      shareLinks, // 파트너의 기본 판매 링크
      links: linksWithUrl, // AffiliateLink 테이블의 링크들
    });
  } catch (error: any) {
    console.error('[Partner Links] GET error:', error);
    if (error.name === 'PartnerApiError') {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: error.status || 403 }
      );
    }
    return NextResponse.json(
      { ok: false, message: '링크 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

