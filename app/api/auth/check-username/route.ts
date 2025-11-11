// app/api/auth/check-username/route.ts
// 아이디 중복 확인 API

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username || username.trim().length < 4) {
      return NextResponse.json({
        ok: false,
        available: false,
        message: '아이디는 4자 이상이어야 합니다.'
      });
    }

    // 커뮤니티 전용 사용자만 확인 (role이 'community'인 경우)
    const existingUser = await prisma.user.findFirst({
      where: {
        phone: username.trim(),
        role: 'community' // 커뮤니티 전용 사용자만 확인
      }
    });

    return NextResponse.json({
      ok: true,
      available: !existingUser,
      message: existingUser ? '이미 사용 중인 아이디입니다.' : '사용 가능한 아이디입니다.'
    });
  } catch (error: any) {
    console.error('[CHECK USERNAME] Error:', error);
    return NextResponse.json(
      { ok: false, available: false, message: '확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}













