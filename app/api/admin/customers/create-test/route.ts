// app/api/admin/customers/create-test/route.ts
// 테스트 고객 추가 API (테스트 고객 관리용)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'cg.sid.v2';

async function checkAdminAuth(sid: string | undefined): Promise<boolean> {
  if (!sid) return false;
  try {
    const session = await prisma.session.findUnique({
      where: { id: sid },
      include: { User: { select: { role: true } } },
    });
    return session?.User?.role === 'admin' || false;
  } catch (error) {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const sid = cookies().get(SESSION_COOKIE)?.value;
    
    if (!sid || !(await checkAdminAuth(sid))) {
      return NextResponse.json({ 
        ok: false, 
        error: '인증이 필요합니다.' 
      }, { status: 403 });
    }

    const { name, phone } = await req.json();

    if (!name || !phone) {
      return NextResponse.json(
        { ok: false, error: '이름과 연락처는 필수입니다.' },
        { status: 400 }
      );
    }

    // 중복 확인 (같은 이름과 전화번호)
    const existing = await prisma.user.findFirst({
      where: {
        name,
        phone,
      },
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: '이미 존재하는 고객입니다.' },
        { status: 400 }
      );
    }

    // 테스트 고객 생성 (비밀번호 1101, customerStatus: 'test', testModeStartedAt: 현재 시간)
    const now = new Date();
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        password: '1101',
        role: 'user',
        customerStatus: 'test',
        testModeStartedAt: now,
        customerSource: 'test-guide', // 크루즈 가이드 3일 테스트
        onboarded: false,
        loginCount: 0,
        tripCount: 0,
        totalTripCount: 0,
      },
    });

    // PasswordEvent 생성 (비밀번호 변경 이력 기록)
    await prisma.passwordEvent.create({
      data: {
        userId: user.id,
        from: '',
        to: '1101', // 평문 비밀번호 저장
        reason: '테스트 고객 생성',
      },
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        customerStatus: user.customerStatus,
        testModeStartedAt: user.testModeStartedAt?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Admin Create Test Customer] Error:', error);
    return NextResponse.json(
      { ok: false, error: '테스트 고객 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

