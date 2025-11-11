// app/api/admin/mall/products/[productCode]/route.ts
// MallProductContent의 layout 필드 업데이트

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function PUT(
  req: NextRequest,
  { params }: { params: { productCode: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, phone: true },
    });

    // user1~user10 또는 01024958013만 수정 가능
    const isAdminUser = dbUser?.role === 'admin' && dbUser.phone && /^user(1[0]|[1-9])$/.test(dbUser.phone);
    const isSuperAdmin = dbUser?.role === 'admin' && dbUser.phone === '01024958013';

    if (!isAdminUser && !isSuperAdmin) {
      return NextResponse.json({ ok: false, message: 'Admin access required' }, { status: 403 });
    }

    const { productCode } = params;
    const { layout } = await req.json();

    if (!layout) {
      return NextResponse.json({ ok: false, message: 'Layout data required' }, { status: 400 });
    }

    // 기존 MallProductContent 조회
    const existingContent = await prisma.mallProductContent.findUnique({
      where: { productCode },
      select: { layout: true },
    });

    // 기존 layout과 병합 (기존 데이터 유지)
    let mergedLayout = layout;
    if (existingContent?.layout) {
      const existingLayout = typeof existingContent.layout === 'string'
        ? JSON.parse(existingContent.layout)
        : existingContent.layout;
      mergedLayout = {
        ...existingLayout,
        ...layout, // 새로운 layout 데이터로 덮어쓰기
      };
    }

    // MallProductContent 업데이트 또는 생성
    const productContent = await prisma.mallProductContent.upsert({
      where: { productCode },
      update: {
        layout: mergedLayout,
        updatedAt: new Date(),
      },
      create: {
        productCode,
        layout: mergedLayout,
        isActive: true,
      },
    });

    return NextResponse.json({ ok: true, productContent });
  } catch (error) {
    console.error('PUT /api/admin/mall/products/[productCode] error:', error);
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 });
  }
}






