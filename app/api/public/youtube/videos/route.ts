// app/api/public/youtube/videos/route.ts
// YouTube 일반 영상 목록 조회 API (Shorts 제외)

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
      const error = await channelResponse.json();
      console.error('YouTube API Error (channels):', error);
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

    // 2단계: 최근 영상들 가져오기 (더 많이 가져온 후 필터링)
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${YOUTUBE_API_KEY}`
    );

    if (!playlistResponse.ok) {
      const error = await playlistResponse.json();
      console.error('YouTube API Error (playlistItems):', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch videos' },
        { status: playlistResponse.status }
      );
    }

    const playlistData = await playlistResponse.json();

    // 3단계: 각 영상의 상세 정보를 가져와서 Shorts 여부 확인
    const videoIds = playlistData.items.map((item: any) => item.snippet.resourceId.videoId).join(',');

    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );

    if (!videosResponse.ok) {
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch video details' },
        { status: videosResponse.status }
      );
    }

    const videosData = await videosResponse.json();

    // Shorts가 아닌 일반 영상만 필터링 (길이가 60초 이하이거나 #shorts 태그가 있는 것은 제외)
    const regularVideos = videosData.items
      .filter((video: any) => {
        const duration = video.contentDetails.duration;
        const title = video.snippet.title.toLowerCase();
        const description = video.snippet.description.toLowerCase();
        
        // duration이 60초(PT60S) 이하이면 Shorts로 간주
        // 또는 #shorts 태그가 있으면 Shorts로 간주
        const isShort = duration && (duration.includes('PT') && (
          duration.match(/PT(\d+)S/)?.[1] ? parseInt(duration.match(/PT(\d+)S/)?.[1] || '0') <= 60 : false
        ) || duration === 'PT60S') || title.includes('#shorts') || description.includes('#shorts');
        
        return !isShort;
      })
      .slice(0, maxResults) // 최대 개수만큼만
      .map((video: any) => ({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails.high.url,
        publishedAt: video.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${video.id}`,
      }));

    return NextResponse.json({
      ok: true,
      videos: regularVideos,
    });
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

























