// app/api/community/posts/[id]/viewers/route.ts
// 동시 접속자 수 추적 API

import { NextResponse } from 'next/server';

// 간단한 메모리 기반 접속자 추적 (실제 운영 환경에서는 Redis 등 사용 권장)
const activeViewers = new Map<number, Set<string>>();

// 접속자 등록
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const postId = parseInt(params.id);

    if (isNaN(postId)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    // 클라이언트 세션 ID 생성 (간단하게 타임스탬프 + 랜덤)
    const sessionId = `${Date.now()}-${Math.random()}`;

    if (!activeViewers.has(postId)) {
      activeViewers.set(postId, new Set());
    }

    activeViewers.get(postId)!.add(sessionId);

    // 5분 후 자동 제거 (타임아웃)
    setTimeout(() => {
      activeViewers.get(postId)?.delete(sessionId);
    }, 5 * 60 * 1000);

    const count = activeViewers.get(postId)!.size;

    return NextResponse.json({
      ok: true,
      viewers: count,
      sessionId
    });
  } catch (error: any) {
    console.error('[VIEWERS POST] Error:', error);
    return NextResponse.json(
      { ok: false, error: '접속자 수 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 현재 접속자 수 조회
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const postId = parseInt(params.id);

    if (isNaN(postId)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    const count = activeViewers.get(postId)?.size || 0;

    return NextResponse.json({
      ok: true,
      viewers: count
    });
  } catch (error: any) {
    console.error('[VIEWERS GET] Error:', error);
    return NextResponse.json(
      { ok: false, error: '접속자 수를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 접속자 제거
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const postId = parseInt(params.id);
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (isNaN(postId) || !sessionId) {
      return NextResponse.json(
        { ok: false, error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    activeViewers.get(postId)?.delete(sessionId);

    const count = activeViewers.get(postId)?.size || 0;

    return NextResponse.json({
      ok: true,
      viewers: count
    });
  } catch (error: any) {
    console.error('[VIEWERS DELETE] Error:', error);
    return NextResponse.json(
      { ok: false, error: '접속자 수 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}













