// scripts/fetch-youtube-videos.ts
// YouTube 채널의 모든 영상 목록을 가져와서 문서화하는 스크립트

import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// .env.local 파일 로드
config({ path: path.join(process.cwd(), '.env.local') });

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = 'UCKLDsk4iNXT1oYJ5ikUFggQ'; // 크루즈닷AI지니

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  url: string;
  publishedAt: string;
  keywords?: string[];
}

async function fetchAllVideos(): Promise<YouTubeVideo[]> {
  const allVideos: YouTubeVideo[] = [];
  let nextPageToken: string | undefined = undefined;
  let pageCount = 0;
  const maxPages = 20; // 최대 20페이지 (약 500개 영상)
  let uploadsPlaylistId: string | undefined = undefined;

  try {
    if (!YOUTUBE_API_KEY) {
      throw new Error('YOUTUBE_API_KEY is not set in environment variables. Please add it to .env.local');
    }

    do {
      pageCount++;
      console.log(`Fetching page ${pageCount}...`);

      // 채널의 업로드 플레이리스트 ID 가져오기 (첫 페이지에서만)
      if (pageCount === 1) {
        const channelResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${YOUTUBE_API_KEY}`
        );

        if (!channelResponse.ok) {
          const error = await channelResponse.json();
          throw new Error(`Failed to fetch channel info: ${JSON.stringify(error)}`);
        }

        const channelData = await channelResponse.json();
        if (!channelData.items || channelData.items.length === 0) {
          throw new Error('Channel not found');
        }

        uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
        console.log(`Uploads Playlist ID: ${uploadsPlaylistId}`);
      }

      if (!uploadsPlaylistId) {
        throw new Error('Failed to get uploads playlist ID');
      }

      // 플레이리스트에서 영상 가져오기
      const playlistUrl = nextPageToken
        ? `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&pageToken=${nextPageToken}&key=${YOUTUBE_API_KEY}`
        : `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${YOUTUBE_API_KEY}`;
      
      const playlistResponse = await fetch(playlistUrl);

      if (!playlistResponse.ok) {
        const error = await playlistResponse.json();
        throw new Error(`Failed to fetch playlist: ${JSON.stringify(error)}`);
      }

      const playlistData = await playlistResponse.json();

      if (!playlistData.items || playlistData.items.length === 0) {
        break; // 더 이상 영상이 없으면 종료
      }

      // 각 영상의 상세 정보 가져오기
      const videoIds = playlistData.items.map((item: any) => item.snippet.resourceId.videoId).join(',');
      
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
      );

      if (!videosResponse.ok) {
        const error = await videosResponse.json();
        throw new Error(`Failed to fetch video details: ${JSON.stringify(error)}`);
      }

      const videosData = await videosResponse.json();

      // 영상 정보 포맷팅
      for (const video of videosData.items) {
        const duration = video.contentDetails.duration;
        const isShort = duration && parseDuration(duration) < 60; // 60초 미만은 Shorts로 간주

        if (!isShort) { // Shorts 제외
          allVideos.push({
            id: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default.url,
            url: `https://www.youtube.com/watch?v=${video.id}`,
            publishedAt: video.snippet.publishedAt,
            keywords: extractKeywords(video.snippet.title, video.snippet.description),
          });
        }
      }

      nextPageToken = playlistData.nextPageToken;
    } while (nextPageToken && pageCount < maxPages);

    console.log(`Total videos fetched: ${allVideos.length}`);
    return allVideos;
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw error;
  }
}

// ISO 8601 duration을 초로 변환
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}

// 제목과 설명에서 키워드 추출
function extractKeywords(title: string, description: string): string[] {
  const keywords: string[] = [];
  const text = `${title} ${description}`.toLowerCase();
  
  // 크루즈 선사
  if (text.includes('코스타') || text.includes('costa')) keywords.push('코스타', 'COSTA');
  if (text.includes('msc')) keywords.push('MSC');
  if (text.includes('로얄') || text.includes('royal')) keywords.push('로얄', 'ROYAL', '로얄캐리비안');
  if (text.includes('princess')) keywords.push('프린세스', 'PRINCESS');
  if (text.includes('노르웨이안') || text.includes('norwegian')) keywords.push('노르웨이안', 'NORWEGIAN');
  
  // 선박명
  if (text.includes('세레나') || text.includes('serena')) keywords.push('세레나', 'SERENA');
  if (text.includes('벨리시마') || text.includes('bellissima')) keywords.push('벨리시마', 'BELLISSIMA');
  if (text.includes('스펙트럼') || text.includes('spectrum')) keywords.push('스펙트럼', 'SPECTRUM');
  if (text.includes('오디세이') || text.includes('odyssey')) keywords.push('오디세이', 'ODYSSEY');
  
  // 목적지/기항지
  if (text.includes('홍콩')) keywords.push('홍콩');
  if (text.includes('대만') || text.includes('타이완')) keywords.push('대만', '타이완');
  if (text.includes('제주')) keywords.push('제주');
  if (text.includes('일본') || text.includes('japan')) keywords.push('일본');
  if (text.includes('후쿠오카')) keywords.push('후쿠오카');
  if (text.includes('사세보')) keywords.push('사세보');
  if (text.includes('도쿄') || text.includes('tokyo')) keywords.push('도쿄');
  if (text.includes('싱가포르') || text.includes('singapore')) keywords.push('싱가포르');
  if (text.includes('베트남') || text.includes('vietnam')) keywords.push('베트남');
  
  // 카테고리
  if (text.includes('객실') || text.includes('룸')) keywords.push('객실', '룸');
  if (text.includes('식사') || text.includes('음식') || text.includes('레스토랑')) keywords.push('식사', '음식', '레스토랑');
  if (text.includes('공연') || text.includes('쇼') || text.includes('뮤지컬')) keywords.push('공연', '쇼', '뮤지컬');
  if (text.includes('시설') || text.includes('풀') || text.includes('수영장')) keywords.push('시설', '풀', '수영장');
  if (text.includes('후기') || text.includes('리뷰')) keywords.push('후기', '리뷰');
  if (text.includes('가이드') || text.includes('안내')) keywords.push('가이드', '안내');
  if (text.includes('준비물') || text.includes('팁')) keywords.push('준비물', '팁');
  if (text.includes('가격') || text.includes('요금')) keywords.push('가격', '요금');
  
  // 중복 제거
  return [...new Set(keywords)];
}

async function main() {
  try {
    console.log('Fetching all videos from YouTube channel...');
    const videos = await fetchAllVideos();
    
    // JSON 파일로 저장
    const outputPath = path.join(process.cwd(), 'data', 'youtube-videos.json');
    fs.writeFileSync(outputPath, JSON.stringify(videos, null, 2), 'utf-8');
    console.log(`\n✅ Saved ${videos.length} videos to ${outputPath}`);
    
    // 마크다운 문서로도 저장
    const mdPath = path.join(process.cwd(), 'data', 'youtube-videos.md');
    let mdContent = `# 크루즈닷 AI 지니 YouTube 영상 목록\n\n`;
    mdContent += `총 ${videos.length}개의 영상\n\n`;
    mdContent += `채널: https://www.youtube.com/@cruisedotgini\n\n`;
    mdContent += `---\n\n`;
    
    // 키워드별로 그룹화
    const videosByKeyword: Record<string, YouTubeVideo[]> = {};
    
    videos.forEach(video => {
      if (video.keywords && video.keywords.length > 0) {
        video.keywords.forEach(keyword => {
          if (!videosByKeyword[keyword]) {
            videosByKeyword[keyword] = [];
          }
          if (!videosByKeyword[keyword].find(v => v.id === video.id)) {
            videosByKeyword[keyword].push(video);
          }
        });
      }
    });
    
    // 키워드별 섹션
    mdContent += `## 키워드별 영상 분류\n\n`;
    Object.keys(videosByKeyword).sort().forEach(keyword => {
      mdContent += `### ${keyword} (${videosByKeyword[keyword].length}개)\n\n`;
      videosByKeyword[keyword].forEach(video => {
        mdContent += `- **[${video.title}](${video.url})**\n`;
      });
      mdContent += `\n`;
    });
    
    // 전체 목록
    mdContent += `---\n\n`;
    mdContent += `## 전체 영상 목록\n\n`;
    videos.forEach((video, index) => {
      mdContent += `${index + 1}. **[${video.title}](${video.url})**\n`;
      if (video.keywords && video.keywords.length > 0) {
        mdContent += `   - 키워드: ${video.keywords.join(', ')}\n`;
      }
      mdContent += `   - 업로드일: ${new Date(video.publishedAt).toLocaleDateString('ko-KR')}\n\n`;
    });
    
    fs.writeFileSync(mdPath, mdContent, 'utf-8');
    console.log(`✅ Saved markdown documentation to ${mdPath}`);
    
    // 통계 출력
    console.log(`\n📊 Statistics:`);
    console.log(`- Total videos: ${videos.length}`);
    console.log(`- Unique keywords: ${Object.keys(videosByKeyword).length}`);
    console.log(`\nTop keywords:`);
    Object.entries(videosByKeyword)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10)
      .forEach(([keyword, videoList]) => {
        console.log(`  - ${keyword}: ${videoList.length} videos`);
      });
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();

