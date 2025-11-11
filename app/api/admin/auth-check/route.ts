import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'cg.sid.v2';

// GET: 관리자 인증 상태 확인
export async function GET() {
  try {
    const sid = cookies().get(SESSION_COOKIE)?.value;
    
    if (!sid) {
      return NextResponse.json({ ok: false, authenticated: false });
    }

    const session = await prisma.session.findUnique({
      where: { id: sid },
      include: {
        User: {  // ✅ 대문자 U로 변경
          select: { id: true, role: true, name: true },
        },
      },
    });

    if (!session || !session.User) {  // ✅ 대문자 U로 변경
      return NextResponse.json({ ok: false, authenticated: false });
    }

    // 관리자 패널 접근 권한: 01024958013 또는 01038619161만 허용, user1~user10은 차단
    const user = await prisma.user.findUnique({
      where: { id: session.User.id },
      select: { role: true, phone: true }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ ok: false, authenticated: false });
    }

    // user1~user10은 관리자 패널 접근 불가
    if (user.phone && /^user(1[0]|[1-9])$/.test(user.phone)) {
      return NextResponse.json({ 
        ok: false, 
        authenticated: false,
        error: 'user1~user10은 관리자 패널에 접근할 수 없습니다.'
      });
    }

    // 01024958013 또는 01038609161만 접근 허용
    const isAuthorized = user.phone === '01024958013' || user.phone === '01038609161';

    return NextResponse.json({
      ok: true,
      authenticated: isAuthorized,
      user: isAuthorized ? {
        id: session.User.id,
        name: session.User.name,
        role: session.User.role,
        phone: user.phone
      } : null,
    });
  } catch (error) {
    console.error('[Admin Auth Check] Error:', error);
    return NextResponse.json(
      { ok: false, authenticated: false },
      { status: 500 }
    );
  }
}








