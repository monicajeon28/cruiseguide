import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: {
    token: string;
  };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const token = params.token;
    if (!token || token.length < 10) {
      return NextResponse.json({ ok: false, error: '잘못된 토큰입니다.' }, { status: 400 });
    }

    const submission = await prisma.passportSubmission.findUnique({
      where: { token },
      select: {
        id: true,
        tokenExpiresAt: true,
        extraData: true,
      },
    });

    if (!submission) {
      return NextResponse.json({ ok: false, error: '토큰이 유효하지 않습니다.' }, { status: 404 });
    }

    if (submission.tokenExpiresAt.getTime() < Date.now()) {
      return NextResponse.json({ ok: false, error: '업로드 가능한 시간이 만료되었습니다.' }, { status: 410 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: '업로드할 파일이 필요합니다.' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ ok: false, error: '이미지 파일만 업로드할 수 있습니다.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const safeFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'passports', String(submission.id));
    const filePath = path.join(uploadDir, safeFileName);

    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/passports/${submission.id}/${safeFileName}`;
    const existingExtra = submission.extraData && typeof submission.extraData === 'object' ? submission.extraData : {};
    const passportFiles = Array.isArray(existingExtra.passportFiles) ? existingExtra.passportFiles : [];
    passportFiles.push({
      fileName: safeFileName,
      url: publicUrl,
      uploadedAt: new Date().toISOString(),
    });

    await prisma.passportSubmission.update({
      where: { id: submission.id },
      data: {
        driveFolderUrl: `/uploads/passports/${submission.id}`,
        extraData: {
          ...(existingExtra ?? {}),
          passportFiles,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      file: {
        fileName: safeFileName,
        url: publicUrl,
      },
      files: passportFiles,
    });
  } catch (error) {
    console.error('[Passport] POST /passport/:token/upload error:', error);
    return NextResponse.json({ ok: false, error: '파일 업로드 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
