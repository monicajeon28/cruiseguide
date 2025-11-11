// app/api/admin/mall-customers/[userId]/reset-password/route.ts
// 크루즈몰 고객 비밀번호 초기화

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const SESSION_COOKIE = 'cg.sid.v2';

async function checkAdminAuth() {
  const sid = cookies().get(SESSION_COOKIE)?.value;
  if (!sid) return false;

  try {
    const session = await prisma.session.findUnique({
      where: { id: sid },
      include: {
        User: {
          select: { role: true },
        },
      },
    });

    return session?.User.role === 'admin';
  } catch (error) {
    console.error('[Admin Mall Customers] Auth check error:', error);
    return false;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return NextResponse.json({ ok: false, error: 'Invalid user ID' }, { status: 400 });
    }

    // 새 비밀번호 생성 (8자리 랜덤)
    const newPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 비밀번호 업데이트
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    // 비밀번호 변경 이력 기록
    await prisma.passwordEvent.create({
      data: {
        userId,
        from: null,
        to: newPassword,
        reason: '관리자에 의한 비밀번호 초기화'
      }
    });

    return NextResponse.json({
      ok: true,
      newPassword,
      message: '비밀번호가 초기화되었습니다.'
    });
  } catch (error: any) {
    console.error('[Admin Mall Customer Reset Password API] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}

