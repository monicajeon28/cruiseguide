import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const runtime = 'nodejs';

function normalizeFileName(name: string, fallback: string) {
  const trimmed = name?.trim();
  if (!trimmed) return fallback;
  const replaced = trimmed
    .replace(/[^\w.\-가-힣ㄱ-ㅎㅏ-ㅣ ]+/g, '')
    .replace(/\s+/g, '_');
  return replaced || fallback;
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') ?? 'signature';

    // 현재는 signature만 지원
    if (type !== 'signature') {
      return NextResponse.json({ ok: false, message: '현재는 서명(signature)만 업로드할 수 있습니다.' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, message: '업로드할 파일이 필요합니다.' }, { status: 400 });
    }

    const originalName = formData.get('fileName')?.toString() || file.name || `signature-${Date.now()}.png`;
    const mimeType = file.type || 'application/octet-stream';
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const timestamp = Date.now();
    const safeFileName = normalizeFileName(originalName, `signature-${timestamp}.png`);
    const uniqueFileName = `${timestamp}-${safeFileName}`;

    // public/signatures 폴더에 저장
    const uploadDir = join(process.cwd(), 'public', 'signatures');

    // 폴더가 없으면 생성
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = join(uploadDir, uniqueFileName);
    await writeFile(filePath, buffer);

    // 브라우저에서 접근 가능한 공개 URL
    const publicUrl = `/signatures/${uniqueFileName}`;

    return NextResponse.json({
      ok: true,
      url: publicUrl,
      fileId: uniqueFileName,
      originalName,
      storedName: uniqueFileName,
      mimeType,
      size: buffer.length,
      type,
    });
  } catch (error: any) {
    console.error('[AffiliateContractUpload] error:', error);
    return NextResponse.json({ ok: false, message: error?.message || '파일 업로드 중 오류가 발생했습니다.' }, { status: 500 });
  }
}


