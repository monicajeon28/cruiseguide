import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'cg.sid.v2';

// 관리자 권한 확인
async function checkAdminAuth(sid: string | undefined): Promise<boolean> {
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

    return session?.User?.role === 'admin' || false;
  } catch (error) {
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const sid = cookies().get(SESSION_COOKIE)?.value;
    
    if (!sid || !(await checkAdminAuth(sid))) {
      return NextResponse.json({ 
        ok: false, 
        error: '인증이 필요합니다.' 
      }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // 관리자 패널 관리자 조회 (role이 'admin'이고 customerSource가 'admin'인 경우만)
    // customerSource가 null인 경우도 포함 (기존 관리자)
    // ⚠️ 크루즈몰 관리자(customerSource: 'mall-admin', phone: user1~user10)는 제외
    const where: any = {
      role: 'admin',
      // customerSource가 'admin'이거나 null인 경우만 (크루즈몰 관리자 제외)
      OR: [
        { customerSource: 'admin' },
        { customerSource: null }, // 기존 관리자 (customerSource가 없는 경우)
      ],
      // phone이 user1~user10 형식이 아닌 경우만 (추가 안전장치)
      NOT: {
        phone: {
          in: ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10'],
        },
      },
    };

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search } },
            { phone: { contains: search } },
            { email: { contains: search } },
          ],
        },
      ];
    }

    const total = await prisma.user.count({ where });

    const admins = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true,
        lastActiveAt: true,
        loginCount: true,
        password: true, // 비밀번호 (평문)
        customerSource: true, // customerSource 필드 추가
        PasswordEvent: {
          select: {
            id: true,
            to: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return NextResponse.json({
      ok: true,
      admins: admins.map(admin => {
        // 현재 비밀번호 가져오기
        // PasswordEvent.to 값 우선 사용, 없으면 password 필드 사용
        const latestPasswordEvent = admin.PasswordEvent && admin.PasswordEvent.length > 0
          ? admin.PasswordEvent[0]
          : null;
        const currentPassword = latestPasswordEvent?.to || admin.password || null;

        return {
          ...admin,
          createdAt: admin.createdAt.toISOString(),
          lastActiveAt: admin.lastActiveAt?.toISOString() || null,
          currentPassword, // 현재 비밀번호 (텍스트로 표시)
        };
      }),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Admin Panel Admins API] Error:', error);
    console.error('[Admin Panel Admins API] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error))
          : undefined
      },
      { status: 500 }
    );
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

    const body = await req.json();
    const { name, phone, email, password } = body;

    if (!name || !phone || !password) {
      return NextResponse.json(
        { ok: false, error: '이름, 연락처, 비밀번호는 필수입니다.' },
        { status: 400 }
      );
    }

    // 중복 확인 (크루즈몰 관리자 제외)
    const existing = await prisma.user.findFirst({
      where: {
        phone,
        role: 'admin',
        customerSource: {
          not: 'mall-admin', // 크루즈몰 관리자 제외
        },
        NOT: {
          phone: {
            in: ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10'],
          },
        },
        OR: [
          { customerSource: 'admin' },
          { customerSource: null }, // 기존 관리자 (customerSource가 없는 경우)
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: '이미 존재하는 관리자입니다.' },
        { status: 400 }
      );
    }

    // 관리자 생성
    const admin = await prisma.user.create({
      data: {
        name,
        phone,
        email: email || null,
        password, // 평문 비밀번호 저장
        role: 'admin',
        customerSource: 'admin', // 관리자 패널 관리자
        onboarded: true,
        loginCount: 0,
      },
    });

    // PasswordEvent 생성 (비밀번호 변경 이력 기록)
    await prisma.passwordEvent.create({
      data: {
        userId: admin.id,
        from: '',
        to: password, // 평문 비밀번호 저장
        reason: '관리자 생성',
      },
    });

    return NextResponse.json({
      ok: true,
      admin: {
        ...admin,
        createdAt: admin.createdAt.toISOString(),
        lastActiveAt: admin.lastActiveAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('[Admin Panel Admins API] Create error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

