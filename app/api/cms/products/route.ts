// app/api/cms/products/route.ts
// CMS 크루즈 상품 관리 API (기획자용)

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

// GET: 모든 상품 조회
export async function GET() {
  try {
    const products = await prisma.cruiseProduct.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      ok: true,
      products,
    });
  } catch (error) {
    console.error('[CMS Products API] GET error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: 상품 생성
export async function POST(req: Request) {
  try {
    // 관리자 권한 확인
    const sid = cookies().get(SESSION_COOKIE)?.value;
    const auth = await checkAdminAuth(sid);

    if (!auth.authorized) {
      return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 });
    }

    // 요청 데이터
    const {
      productCode,
      cruiseLine,
      shipName,
      packageName,
      nights,
      days,
      itineraryPattern,
      basePrice,
      description,
    } = await req.json();

    if (!productCode || !cruiseLine || !shipName || !packageName || !nights || !days || !itineraryPattern) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 상품 생성
    const product = await prisma.cruiseProduct.create({
      data: {
        productCode,
        cruiseLine,
        shipName,
        packageName,
        nights: parseInt(nights),
        days: parseInt(days),
        itineraryPattern,
        basePrice: basePrice ? parseInt(basePrice) : null,
        description,
      },
    });

    return NextResponse.json({
      ok: true,
      product,
      message: 'Product created successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { ok: false, error: 'Product code already exists' },
        { status: 409 }
      );
    }

    console.error('[CMS Products API] POST error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: 상품 수정
export async function PUT(req: Request) {
  try {
    // 관리자 권한 확인
    const sid = cookies().get(SESSION_COOKIE)?.value;
    const auth = await checkAdminAuth(sid);

    if (!auth.authorized) {
      return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 });
    }

    // 요청 데이터
    const {
      id,
      productCode,
      cruiseLine,
      shipName,
      packageName,
      nights,
      days,
      itineraryPattern,
      basePrice,
      description,
    } = await req.json();

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Product ID required' },
        { status: 400 }
      );
    }

    // 상품 수정
    const product = await prisma.cruiseProduct.update({
      where: { id: parseInt(id) },
      data: {
        ...(productCode && { productCode }),
        ...(cruiseLine && { cruiseLine }),
        ...(shipName && { shipName }),
        ...(packageName && { packageName }),
        ...(nights !== undefined && { nights: parseInt(nights) }),
        ...(days !== undefined && { days: parseInt(days) }),
        ...(itineraryPattern && { itineraryPattern }),
        ...(basePrice !== undefined && { basePrice: basePrice ? parseInt(basePrice) : null }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json({
      ok: true,
      product,
      message: 'Product updated successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { ok: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    console.error('[CMS Products API] PUT error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: 상품 삭제
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
        { ok: false, error: 'Product ID required' },
        { status: 400 }
      );
    }

    // 사용 중인 상품인지 확인
    const usageCount = await prisma.trip.count({
      where: { productId: parseInt(id) },
    });

    if (usageCount > 0) {
      return NextResponse.json(
        { ok: false, error: `Cannot delete product: ${usageCount} trip(s) are using this product` },
        { status: 409 }
      );
    }

    // 상품 삭제
    await prisma.cruiseProduct.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      ok: true,
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { ok: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    console.error('[CMS Products API] DELETE error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

