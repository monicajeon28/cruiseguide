import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

const SESSION_COOKIE = 'cg.sid.v2';

// 사용자 인증 확인
async function getCurrentUser() {
  try {
    const sid = cookies().get(SESSION_COOKIE)?.value;
    
    if (!sid) {
      return null;
    }

    const session = await prisma.session.findUnique({
      where: { id: sid },
      include: {
        User: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    if (!session || !session.User) {
      return null;
    }

    return {
      id: session.User.id,
      name: session.User.name,
      role: session.User.role,
    };
  } catch (error) {
    console.error('[Kakao Channel] Auth check error:', error);
    return null;
  }
}

// POST: 카카오톡 채널 추가 처리
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 카카오 채널 추가 처리
    // 실제로는 카카오 SDK를 통해 채널 추가를 확인하지만,
    // 여기서는 사용자가 버튼을 클릭했다는 것을 기록합니다.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        kakaoChannelAdded: true,
        kakaoChannelAddedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      message: '카카오톡 채널이 추가되었습니다.',
    });
  } catch (error) {
    console.error('[Kakao Channel] Error:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : '카카오톡 채널 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET: 카카오톡 채널 추가 여부 확인
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { kakaoChannelAdded: true, kakaoChannelAddedAt: true },
    });

    return NextResponse.json({
      ok: true,
      kakaoChannelAdded: userData?.kakaoChannelAdded || false,
      kakaoChannelAddedAt: userData?.kakaoChannelAddedAt || null,
    });
  } catch (error) {
    console.error('[Kakao Channel] Error:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : '카카오톡 채널 상태 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

