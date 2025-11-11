// app/api/chat-bot/youtube/search/route.ts
// 챗봇용 YouTube 영상 검색 API (키워드 기반)

import { NextRequest, NextResponse } from 'next/server';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = 'UCKLDsk4iNXT1oYJ5ikUFggQ'; // 크루즈닷AI지니

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  url: string;
  publishedAt: string;
}

export async function GET(req: NextRequest) {
  try {
    if (!YOUTUBE_API_KEY) {
      return NextResponse.json(
        { ok: false, error: 'YouTube API key not configured', videos: [] },
        { status: 500 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const keyword = searchParams.get('keyword') || '';
    const cruiseLine = searchParams.get('cruiseLine') || '';
    const limit = parseInt(searchParams.get('limit') || '5');

    // 키워드가 없으면 크루즈 라인으로 검색
    const searchQuery = keyword || cruiseLine || '크루즈';

    // YouTube Search API로 채널 내 영상 검색
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=${limit * 2}&order=relevance&key=${YOUTUBE_API_KEY}`;
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      console.error('[YouTube Search] API Error:', await response.text());
      return NextResponse.json(
        { ok: false, error: 'Failed to search videos', videos: [] },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return NextResponse.json({
        ok: true,
        videos: [],
      });
    }

    // 영상 정보 포맷팅
    const videos: YouTubeVideo[] = data.items.slice(0, limit).map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      publishedAt: item.snippet.publishedAt,
    }));

    return NextResponse.json({
      ok: true,
      videos,
    });
  } catch (error: any) {
    console.error('[YouTube Search] Error:', error);
    return NextResponse.json(
      { ok: false, error: '영상을 검색하는 중 오류가 발생했습니다.', videos: [] },
      { status: 500 }
    );
  }
}

