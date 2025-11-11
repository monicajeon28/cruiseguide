// app/api/pages/html/route.ts
// 공개 페이지 HTML 조회 API

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// GET: 페이지 HTML 조회 (공개)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pagePath = searchParams.get('pagePath');

    if (!pagePath) {
      return NextResponse.json(
        { ok: false, error: 'Missing pagePath' },
        { status: 400 }
      );
    }

    // 저장된 HTML 파일 경로
    const htmlDir = join(process.cwd(), 'public', 'pages-html');
    const fileName = pagePath.replace(/\//g, '_').replace(/^_/, '') + '.html';
    const filePath = join(htmlDir, fileName);

    if (existsSync(filePath)) {
      const html = await readFile(filePath, 'utf-8');
      return NextResponse.json({ ok: true, html });
    }

    return NextResponse.json({ ok: false, html: null });
  } catch (error: any) {
    console.error('[API] Error fetching HTML:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to fetch HTML' },
      { status: 500 }
    );
  }
}

