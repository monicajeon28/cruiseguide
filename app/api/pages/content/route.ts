// app/api/pages/content/route.ts
// 공개 페이지 콘텐츠 조회 API (인증 불필요)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: 페이지 콘텐츠 조회 (공개)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pagePath = searchParams.get('pagePath');
    const section = searchParams.get('section');

    if (!pagePath) {
      return NextResponse.json(
        { ok: false, error: 'Missing pagePath' },
        { status: 400 }
      );
    }

    const where: any = { 
      pagePath,
      isActive: true 
    };
    if (section) where.section = section;

    const contents = await prisma.pageContent.findMany({
      where,
      orderBy: [{ section: 'asc' }, { order: 'asc' }],
    });

    return NextResponse.json({ ok: true, contents });
  } catch (error: any) {
    console.error('[API] Error fetching page content:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

