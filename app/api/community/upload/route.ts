// app/api/community/upload/route.ts
// 커뮤니티 이미지 업로드 API

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
// Google Drive 업로드는 배치 작업으로 처리되므로 import 제거

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export async function POST(req: NextRequest) {
  try {
    // 로그인 확인
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { ok: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const uploadType = formData.get('type') as string | null; // 'review', 'post', 또는 'comment'

    if (!file) {
      return NextResponse.json(
        { ok: false, error: '파일을 제공해주세요.' },
        { status: 400 }
      );
    }

    // 파일 크기 확인
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { ok: false, error: '파일 크기는 10MB를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 파일 타입 검증
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: `지원하지 않는 파일 형식입니다. (${file.type})` },
        { status: 400 }
      );
    }

    // 업로드 디렉토리 확인/생성
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'reviews');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 파일명 생성 (타임스탬프 + 랜덤 + 원본 파일명)
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${random}_${originalName}`;
    const filepath = join(uploadDir, filename);

    // 파일 저장
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // 로컬 URL 생성
    const localUrl = `/uploads/reviews/${filename}`;

    // Google Drive 업로드는 배치 작업으로 처리 (1시간마다)
    // 실시간 업로드 제거 - /api/batch/sync-to-google에서 처리
    // 로컬 URL만 반환
    const driveUrl = localUrl;

    return NextResponse.json({
      ok: true,
      url: driveUrl, // Google Drive URL 우선 사용
      localUrl, // 로컬 URL도 함께 반환
      filename,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('[Community Upload API] Error:', error);
    return NextResponse.json(
      { ok: false, error: '파일 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

