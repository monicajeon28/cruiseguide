import { NextRequest, NextResponse } from 'next/server';

// GET: 카카오 채널 정보 조회 (공개용)
export async function GET(req: NextRequest) {
  try {
    const channelId = process.env.NEXT_PUBLIC_KAKAO_CHANNEL_ID || '';
    const channelUrl = channelId ? `https://pf.kakao.com/_${channelId}` : '';
    
    return NextResponse.json({
      ok: true,
      channelId,
      channelUrl,
    });
  } catch (error) {
    console.error('[Kakao Channel Info] Error:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to get channel info' },
      { status: 500 }
    );
  }
}

