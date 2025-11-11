// app/api/admin/mall-customers/[userId]/route.ts
// 크루즈몰 고객 상세 조회 및 수정 API

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'cg.sid.v2';

async function checkAdminAuth() {
  const sid = cookies().get(SESSION_COOKIE)?.value;
  if (!sid) return false;

  try {
    const session = await prisma.session.findUnique({
      where: { id: sid },
      include: {
        User: {
          select: { role: true },
        },
      },
    });

    return session?.User.role === 'admin';
  } catch (error) {
    console.error('[Admin Mall Customers] Auth check error:', error);
    return false;
  }
}

// GET: 고객 상세 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return NextResponse.json({ ok: false, error: 'Invalid user ID' }, { status: 400 });
    }

    // 크루즈몰 활동이 있는 고객인지 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        CommunityPost: {
          select: { id: true }
        },
        CommunityComment: {
          select: { id: true }
        },
        CruiseReview: {
          select: { id: true }
        },
        ProductInquiries: {
          select: { id: true }
        },
        ProductViews: {
          select: { id: true }
        },
        PasswordEvent: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { to: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
    }

    // 크루즈몰 활동이 없으면 에러
    const hasMallActivity = 
      (user.CommunityPost?.length || 0) > 0 ||
      (user.CommunityComment?.length || 0) > 0 ||
      (user.CruiseReview?.length || 0) > 0 ||
      (user.ProductInquiries?.length || 0) > 0 ||
      (user.ProductViews?.length || 0) > 0;

    if (!hasMallActivity) {
      return NextResponse.json({ 
        ok: false, 
        error: 'This user has no mall activity. Use guide customer management instead.' 
      }, { status: 404 });
    }

    const latestPasswordEvent = user.PasswordEvent?.[0];
    const currentPassword = latestPasswordEvent?.to || null;

    // 연동된 크루즈가이드 지니 사용자 정보 조회
    let linkedGenieUser = null;
    try {
      const genieUser = await prisma.user.findFirst({
        where: {
          mallUserId: user.id.toString(),
          role: 'user',
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          genieStatus: true,
          genieLinkedAt: true,
        },
      });
      if (genieUser) {
        linkedGenieUser = {
          id: genieUser.id,
          name: genieUser.name,
          phone: genieUser.phone,
          email: genieUser.email,
          genieStatus: genieUser.genieStatus,
          genieLinkedAt: genieUser.genieLinkedAt?.toISOString() || null,
        };
      }
    } catch (error) {
      console.error('[Admin Mall Customer Detail] Failed to fetch linked genie user:', error);
    }

    return NextResponse.json({
      ok: true,
      customer: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        lastActiveAt: user.lastActiveAt?.toISOString() || null,
        isLocked: user.isLocked,
        isHibernated: user.isHibernated,
        lockedAt: user.lockedAt?.toISOString() || null,
        lockedReason: user.lockedReason,
        reviewCount: user.CruiseReview?.length || 0,
        postCount: user.CommunityPost?.length || 0,
        commentCount: user.CommunityComment?.length || 0,
        inquiryCount: user.ProductInquiries?.length || 0,
        viewCount: user.ProductViews?.length || 0,
        currentPassword: currentPassword,
        linkedGenieUser: linkedGenieUser,
      }
    });
  } catch (error: any) {
    console.error('[Admin Mall Customer Detail API] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

// PATCH: 고객 정보 수정
export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return NextResponse.json({ ok: false, error: 'Invalid user ID' }, { status: 400 });
    }

    const body = await req.json();
    const { name, phone, email } = body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
      }
    });

    return NextResponse.json({
      ok: true,
      customer: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
      },
      message: '고객 정보가 업데이트되었습니다.'
    });
  } catch (error: any) {
    console.error('[Admin Mall Customer Update API] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

