// app/api/auth/check-nickname/route.ts
// 닉네임 중복 확인 API

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const nickname = searchParams.get('nickname');

    if (!nickname || nickname.trim().length < 2) {
      return NextResponse.json({
        ok: false,
        available: false,
        message: '닉네임은 2자 이상이어야 합니다.'
      });
    }

    // 커뮤니티 전용 사용자만 확인 (role이 'community'인 경우)
    const existingUser = await prisma.user.findFirst({
      where: {
        name: nickname.trim(),
        role: 'community' // 커뮤니티 전용 사용자만 확인
      }
    });

    return NextResponse.json({
      ok: true,
      available: !existingUser,
      message: existingUser ? '이미 사용 중인 닉네임입니다.' : '사용 가능한 닉네임입니다.'
    });
  } catch (error: any) {
    console.error('[CHECK NICKNAME] Error:', error);
    return NextResponse.json(
      { ok: false, available: false, message: '확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}













