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

// 크루즈몰 관리자 확인 (role이 'admin'이고 phone이 user1~user10인 경우)
function isMallAdmin(user: { role: string; phone: string | null }): boolean {
  return user.role === 'admin' && user.phone !== null && /^user(1[0]|[1-9])$/.test(user.phone);
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

    // 크루즈몰 관리자 조회 (role이 'admin'이고 phone이 user1~user10인 경우)
    const where: any = {
      role: 'admin',
      phone: {
        in: ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10'],
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

    const mallAdmins = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true,
        lastActiveAt: true,
        loginCount: true,
        isLocked: true,
        isHibernated: true,
        adminMemo: true, // 기능 설정 저장용
        mallNickname: true, // 닉네임 저장용
        password: true, // 비밀번호 (평문)
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
      admins: mallAdmins.map(admin => {
        // 현재 비밀번호 가져오기
        // PasswordEvent.to 값만 사용 (평문 비밀번호)
        // password 필드는 해시된 값이므로 사용하지 않음
        const latestPasswordEvent = admin.PasswordEvent && admin.PasswordEvent.length > 0
          ? admin.PasswordEvent[0]
          : null;
        const currentPassword = latestPasswordEvent?.to || null; // PasswordEvent.to 값만 사용, 없으면 null

        return {
          ...admin,
          createdAt: admin.createdAt.toISOString(),
          lastActiveAt: admin.lastActiveAt?.toISOString() || null,
          currentPassword, // 현재 비밀번호
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
    console.error('[Admin Mall Admins API] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
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

    if (!phone || !password) {
      return NextResponse.json(
        { ok: false, error: '전화번호(user1~user10)와 비밀번호는 필수입니다.' },
        { status: 400 }
      );
    }

    // phone이 user1~user10 형식인지 확인
    if (!/^user(1[0]|[1-9])$/.test(phone)) {
      return NextResponse.json(
        { ok: false, error: '전화번호는 user1~user10 형식이어야 합니다.' },
        { status: 400 }
      );
    }

    // 중복 확인
    const existing = await prisma.user.findFirst({
      where: {
        phone,
        role: 'admin',
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
        name: name || phone,
        phone,
        email: email || null,
        password,
        role: 'admin',
        onboarded: true,
        loginCount: 0,
        customerSource: 'mall-admin', // 크루즈몰 관리자
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
    console.error('[Admin Mall Admins API] Create error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

