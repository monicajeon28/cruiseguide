// app/api/admin/mall/upload/route.ts
// 파일 업로드 API (이미지, 영상, 폰트)

export const runtime = 'nodejs'; // Edge Runtime 금지 (파일 시스템 접근 필요)

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'cg.sid.v2';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const ALLOWED_FONT_TYPES = ['font/ttf', 'font/woff', 'font/woff2', 'application/font-woff', 'application/font-ttf'];

// 관리자 권한 확인
async function checkAdminAuth() {
  const sid = cookies().get(SESSION_COOKIE)?.value;
  if (!sid) return null;

  try {
    const session = await prisma.session.findUnique({
      where: { id: sid },
      include: {
        User: {
          select: { id: true, role: true },
        },
      },
    });

    if (!session || !session.User || session.User.role !== 'admin') {
      return null;
    }

    return session.User;
  } catch (error) {
    console.error('[Mall Upload API] Auth check error:', error);
    return null;
  }
}

/**
 * POST: 파일 업로드
 */
export async function POST(req: NextRequest) {
  try {
    // 관리자 권한 확인
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null; // 'image', 'video', 'font'
    const category = formData.get('category') as string | null; // 카테고리 (폴더명)
    const filename = formData.get('filename') as string | null; // 파일명

    if (!file || !type) {
      return NextResponse.json(
        { ok: false, error: '파일과 타입을 모두 제공해주세요.' },
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
    let allowedTypes: string[] = [];
    let uploadDir = '';
    let subDir = '';

    switch (type) {
      case 'image':
        allowedTypes = ALLOWED_IMAGE_TYPES;
        // 이미지인 경우 카테고리가 있으면 [크루즈정보사진] 폴더에 저장
        if (category && filename) {
          subDir = '크루즈정보사진';
        } else {
          subDir = 'images';
        }
        break;
      case 'video':
        allowedTypes = ALLOWED_VIDEO_TYPES;
        subDir = 'videos';
        break;
      case 'font':
        allowedTypes = ALLOWED_FONT_TYPES;
        subDir = 'fonts';
        break;
      default:
        return NextResponse.json(
          { ok: false, error: '지원하지 않는 파일 타입입니다.' },
          { status: 400 }
        );
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: `지원하지 않는 파일 형식입니다. (${file.type})` },
        { status: 400 }
      );
    }

    // 업로드 디렉토리 확인/생성
    if (type === 'image' && category && filename) {
      // [크루즈정보사진] 폴더 구조: public/크루즈정보사진/[카테고리]/[하위폴더들]/[파일명].확장자
      const categoryDir = category.trim().replace(/[^a-zA-Z0-9가-힣\s]/g, '_');
      
      // 파일명에 슬래시가 있으면 하위 폴더로 인식
      const filenameParts = filename.trim().split('/');
      const actualFilename = filenameParts[filenameParts.length - 1]; // 마지막 부분이 실제 파일명
      const subFolders = filenameParts.slice(0, -1); // 나머지는 하위 폴더 경로
      
      // 각 폴더명을 안전하게 처리
      const cleanSubFolders = subFolders.map(folder => 
        folder.trim().replace(/[^a-zA-Z0-9가-힣\s]/g, '_')
      );
      
      // 전체 경로 구성: public/크루즈정보사진/[카테고리]/[하위폴더1]/[하위폴더2]/...
      const pathParts = [process.cwd(), 'public', '크루즈정보사진', categoryDir, ...cleanSubFolders];
      uploadDir = join(...pathParts);
      
      // 디렉토리 생성 (하위 폴더까지 모두 생성)
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }
      
      // 파일명 생성
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const cleanFilename = actualFilename.trim().replace(/[^a-zA-Z0-9가-힣\s]/g, '_');
      const finalFilename = `${cleanFilename}.${fileExtension}`;
      const filepath = join(uploadDir, finalFilename);
      
      // 파일 저장
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);
      
      // URL 생성 (하위 폴더 경로 포함)
      const urlPath = cleanSubFolders.length > 0
        ? `/크루즈정보사진/${categoryDir}/${cleanSubFolders.join('/')}/${finalFilename}`
        : `/크루즈정보사진/${categoryDir}/${finalFilename}`;
      const url = urlPath;
      
      return NextResponse.json({
        ok: true,
        url,
        filename: finalFilename,
        size: file.size,
        type: file.type,
        category: categoryDir,
        subPath: cleanSubFolders.length > 0 ? cleanSubFolders.join('/') : undefined,
      });
    } else {
      // 기존 방식 (uploads 폴더)
      uploadDir = join(process.cwd(), 'public', 'uploads', subDir);
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // 파일명 생성 (타임스탬프 + 원본 파일명)
      const timestamp = Date.now();
      const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const finalFilename = `${timestamp}_${originalName}`;
      const filepath = join(uploadDir, finalFilename);

      // 파일 저장
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      // URL 생성
      const url = `/uploads/${subDir}/${finalFilename}`;

      return NextResponse.json({
        ok: true,
        url,
        filename: finalFilename,
        size: file.size,
        type: file.type,
      });
    }
  } catch (error) {
    console.error('[Mall Upload API] Error:', error);
    console.error('[Mall Upload API] Error details:', error instanceof Error ? error.message : String(error));
    console.error('[Mall Upload API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : '파일 업로드 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}







