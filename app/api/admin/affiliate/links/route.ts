// app/api/admin/affiliate/links/route.ts
// 어필리에이트 링크 관리 API

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'cg.sid.v2';

// 관리자 권한 확인
async function checkAdminAuth(sid: string | undefined): Promise<boolean> {
  if (!sid) {
    console.log('[Admin Affiliate Links] No session ID');
    return false;
  }

  try {
    const session = await prisma.session.findUnique({
      where: { id: sid },
      include: {
        User: {
          select: { role: true },
        },
      },
    });

    if (!session || !session.User) {
      console.log('[Admin Affiliate Links] Session or user not found');
      return false;
    }

    const isAdmin = session.User.role === 'admin';
    console.log('[Admin Affiliate Links] Auth check:', { userId: session.userId, role: session.User.role, isAdmin });
    return isAdmin;
  } catch (error) {
    console.error('[Admin Affiliate Links] Auth check error:', error);
    return false;
  }
}

// GET: 링크 목록 조회
export async function GET(req: NextRequest) {
  try {
    // 관리자 권한 확인
    const sid = cookies().get(SESSION_COOKIE)?.value;
    
    if (!sid) {
      return NextResponse.json({ 
        ok: false, 
        message: '인증이 필요합니다. 다시 로그인해 주세요.',
      }, { status: 403 });
    }

    const isAdmin = await checkAdminAuth(sid);

    if (!isAdmin) {
      return NextResponse.json({ 
        ok: false, 
        message: '인증이 필요합니다. 다시 로그인해 주세요.',
      }, { status: 403 });
    }

    // 쿼리 파라미터에서 필터 가져오기
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    // 필터 조건 구성
    const where: any = {};
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

    return NextResponse.json({
      ok: true,
      links,
    });
  } catch (error) {
    console.error('[Admin Affiliate Links] GET error:', error);
    return NextResponse.json(
      { ok: false, message: '링크 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새 링크 생성
export async function POST(req: NextRequest) {
  try {
    // 관리자 권한 확인
    const sid = cookies().get(SESSION_COOKIE)?.value;
    
    if (!sid) {
      return NextResponse.json({ 
        ok: false, 
        message: '인증이 필요합니다. 다시 로그인해 주세요.',
      }, { status: 403 });
    }

    const isAdmin = await checkAdminAuth(sid);

    if (!isAdmin) {
      return NextResponse.json({ 
        ok: false, 
        message: '인증이 필요합니다. 다시 로그인해 주세요.',
      }, { status: 403 });
    }

    // 세션에서 관리자 ID 가져오기
    const session = await prisma.session.findUnique({
      where: { id: sid },
      select: { userId: true },
    });

    if (!session) {
      return NextResponse.json({ 
        ok: false, 
        message: '세션을 찾을 수 없습니다.',
      }, { status: 403 });
    }

    const body = await req.json();
    const { title, productCode, managerId, agentId, expiresAt, campaignName, description } = body;

    if (!productCode) {
      return NextResponse.json({
        ok: false,
        message: '상품 코드는 필수입니다.',
      }, { status: 400 });
    }

    // 고유한 링크 코드 생성
    const generateLinkCode = async (): Promise<string> => {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 8);
      let code = `LINK-${timestamp}-${random}`.toUpperCase();
      
      // 중복 확인
      let exists = await prisma.affiliateLink.findUnique({
        where: { code },
      });
      
      let attempts = 0;
      while (exists && attempts < 10) {
        const random2 = Math.random().toString(36).substring(2, 8);
        code = `LINK-${timestamp}-${random2}`.toUpperCase();
        exists = await prisma.affiliateLink.findUnique({
          where: { code },
        });
        attempts++;
      }
      
      if (exists) {
        throw new Error('링크 코드 생성에 실패했습니다. 다시 시도해주세요.');
      }
      
      return code;
    };

    const code = await generateLinkCode();

    // 링크 생성
    const link = await prisma.affiliateLink.create({
      data: {
        code,
        title: title || null,
        productCode: productCode || null,
        managerId: managerId ? Number(managerId) : null,
        agentId: agentId ? Number(agentId) : null,
        issuedById: session.userId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        campaignName: campaignName || null,
        description: description || null,
        status: 'ACTIVE',
      },
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
    });

    return NextResponse.json({
      ok: true,
      link,
    });
  } catch (error: any) {
    console.error('[Admin Affiliate Links] POST error:', error);
    return NextResponse.json(
      { ok: false, message: error.message || '링크 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

