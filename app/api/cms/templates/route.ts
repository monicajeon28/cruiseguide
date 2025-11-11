// app/api/cms/templates/route.ts
// CMS 알림 템플릿 관리 API (기획자용)

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'cg.sid.v2';

// 관리자 권한 확인
async function checkAdminAuth(sid: string | undefined): Promise<{ authorized: boolean; userId?: number }> {
  if (!sid) return { authorized: false };

  const session = await prisma.session.findUnique({
    where: { id: sid },
    include: {
      user: {
        select: { id: true, role: true },
      },
    },
  });

  if (!session || session.user.role !== 'admin') {
    return { authorized: false };
  }

  return { authorized: true, userId: session.user.id };
}

// GET: 모든 템플릿 조회
export async function GET() {
  try {
    const templates = await prisma.cmsNotificationTemplate.findMany({
      orderBy: {
        triggerCode: 'asc',
      },
    });

    return NextResponse.json({
      ok: true,
      templates,
    });
  } catch (error) {
    console.error('[CMS Templates API] GET error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: 템플릿 생성
export async function POST(req: Request) {
  try {
    // 관리자 권한 확인
    const sid = cookies().get(SESSION_COOKIE)?.value;
    const auth = await checkAdminAuth(sid);

    if (!auth.authorized) {
      return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 });
    }

    // 요청 데이터
    const { triggerCode, title, message, isActive } = await req.json();

    if (!triggerCode || !title || !message) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 템플릿 생성
    const template = await prisma.cmsNotificationTemplate.create({
      data: {
        triggerCode,
        title,
        message,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({
      ok: true,
      template,
      message: 'Template created successfully',
    });
  } catch (error: any) {
    // 유니크 제약 위반
    if (error.code === 'P2002') {
      return NextResponse.json(
        { ok: false, error: 'Trigger code already exists' },
        { status: 409 }
      );
    }

    console.error('[CMS Templates API] POST error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: 템플릿 수정
export async function PUT(req: Request) {
  try {
    // 관리자 권한 확인
    const sid = cookies().get(SESSION_COOKIE)?.value;
    const auth = await checkAdminAuth(sid);

    if (!auth.authorized) {
      return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 });
    }

    // 요청 데이터
    const { id, triggerCode, title, message, isActive } = await req.json();

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Template ID required' },
        { status: 400 }
      );
    }

    // 템플릿 수정
    const template = await prisma.cmsNotificationTemplate.update({
      where: { id: parseInt(id) },
      data: {
        ...(triggerCode && { triggerCode }),
        ...(title && { title }),
        ...(message && { message }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({
      ok: true,
      template,
      message: 'Template updated successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { ok: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    console.error('[CMS Templates API] PUT error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: 템플릿 삭제
export async function DELETE(req: Request) {
  try {
    // 관리자 권한 확인
    const sid = cookies().get(SESSION_COOKIE)?.value;
    const auth = await checkAdminAuth(sid);

    if (!auth.authorized) {
      return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 });
    }

    // 요청 데이터
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Template ID required' },
        { status: 400 }
      );
    }

    // 템플릿 삭제
    await prisma.cmsNotificationTemplate.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      ok: true,
      message: 'Template deleted successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { ok: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    console.error('[CMS Templates API] DELETE error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

