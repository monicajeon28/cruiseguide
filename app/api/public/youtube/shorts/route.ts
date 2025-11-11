// app/api/public/youtube/shorts/route.ts
// YouTube Shorts 영상 목록 조회 API

import { NextRequest, NextResponse } from 'next/server';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = 'UCKLDsk4iNXT1oYJ5ikUFggQ'; // 크루즈닷AI지니

export async function GET(request: NextRequest) {
  try {
    if (!YOUTUBE_API_KEY) {
      return NextResponse.json(
        { ok: false, error: 'YouTube API key not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const maxResults = parseInt(searchParams.get('maxResults') || '10');

    // 1단계: 채널 정보 가져오기
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${YOUTUBE_API_KEY}`
    );

    if (!channelResponse.ok) {
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch channel info' },
        { status: channelResponse.status }
      );
    }

    const channelData = await channelResponse.json();
    if (!channelData.items || channelData.items.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Channel not found' },
        { status: 404 }
      );
    }

    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

    // 2단계: 최근 영상들 가져오기
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${YOUTUBE_API_KEY}`
    );

    if (!playlistResponse.ok) {
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch videos' },
        { status: playlistResponse.status }
      );
    }

    const playlistData = await playlistResponse.json();

    // 3단계: 각 영상의 상세 정보 가져오기 (duration 확인용)
    const videoIds = playlistData.items
      .map((item: any) => item.snippet.resourceId.videoId)
      .join(',');

    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );

    if (!videosResponse.ok) {
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch video details' },
        { status: videosResponse.status }
      );
    }

    const videosData = await videosResponse.json();

    // 4단계: Shorts 영상만 필터링 (60초 이하)
    const shorts = videosData.items
      .filter((video: any) => {
        const duration = video.contentDetails.duration;
        // PT1M = 1분, PT59S = 59초
        // ISO 8601 duration을 초로 변환
        const match = duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
        if (match) {
          const minutes = parseInt(match[1] || '0');
          const seconds = parseInt(match[2] || '0');
          const totalSeconds = minutes * 60 + seconds;
          return totalSeconds <= 60; // 60초 이하만
        }
        return false;
      })
      .slice(0, maxResults)
      .map((video: any) => ({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails.high.url,
        publishedAt: video.snippet.publishedAt,
        url: `https://www.youtube.com/shorts/${video.id}`,
      }));

    return NextResponse.json({
      ok: true,
      shorts,
    });
  } catch (error) {
    console.error('Error fetching YouTube Shorts:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
