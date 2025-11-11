// app/api/products/track-view/route.ts
// 상품 조회 추적 API

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productCode, userId } = body;

    if (!productCode) {
      return NextResponse.json(
        { ok: false, error: 'Product code is required' },
        { status: 400 }
      );
    }

    // 상품 존재 확인
    const product = await prisma.cruiseProduct.findUnique({
      where: { productCode },
      select: { id: true }
    });

    if (!product) {
      return NextResponse.json(
        { ok: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // 조회 기록 저장 (비동기, 에러가 있어도 계속 진행)
    try {
      await prisma.productView.create({
        data: {
          productCode,
          userId: userId ? parseInt(userId) : null
        }
      });
    } catch (error) {
      // 조회 기록 저장 실패해도 에러 반환하지 않음 (로그만)
      console.error('[Product View Tracking] Failed to save view:', error);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[Product View Tracking API] Error:', error);
    // 조회 추적 실패해도 에러 반환하지 않음 (사용자 경험 우선)
    return NextResponse.json({ ok: true });
  }
}











