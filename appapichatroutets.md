import { NextRequest, NextResponse } from 'next/server';
import {
  detectIntent, parseOriginDestination, gmapDir, gmapSearch,
  extractNearbyKeyword, isTwoPlaceForm, parseTwoPlace, isDirectionsLike, isNearbyLike
} from './detect';
import { handleAskTerminal } from './handlers/terminals';
import type { ChatMessage, PhotosMessage, PhotoGalleryMessage } from '@/lib/chat-types';
import { getSessionUserId } from '@/lib/session';
import prisma from '@/lib/prisma';
import { handleShowPhotos } from './handlers/photos';

export async function POST(req: NextRequest) {
  const userId = getSessionUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { text, mode }: { text: string; mode: 'go' | 'show' | 'plain' } = await req.json();

  const intent = detectIntent(text, mode === 'plain' ? 'general' : mode);
  const responseMessages: ChatMessage[] = [];

  switch (intent) {
    case 'directions': {
      let originText = '';
      let destText = '';

      if (isTwoPlaceForm(text)) {
        const parsed = parseTwoPlace(text);
        if (parsed) {
          originText = parsed.origin;
          destText = parsed.destination;
        }
      } else {
        const parsed = parseOriginDestination(text);
        originText = parsed.originText;
        destText = parsed.destText;
      }

      // '크루즈 터미널' 관련 질문인 경우 terminals.ts 핸들러를 먼저 시도
      if (destText.includes('터미널') || destText.includes('크루즈')) {
        const terminalResponse = handleAskTerminal(text, originText);
        responseMessages.push(...terminalResponse);
      } else if (originText && destText) {
        // 일반적인 길찾기
        responseMessages.push({
          type: 'text',
          text: `🧭 ${originText}에서 ${destText}까지 길찾기 정보를 찾았어요!`,
        });
        responseMessages.push({
          type: 'map-links',
          title: '다양한 이동 수단',
          links: [
            { label: '🚌 대중교통', href: gmapDir(originText, destText, 'transit') },
            { label: '🚗 자동차', href: gmapDir(originText, destText, 'driving') },
          ],
        });
        responseMessages.push({
          type: 'text',
          text: '실시간 소요시간·영업시간은 링크에서 자동 갱신됩니다.',
        });
      } else if (destText) {
        // 목적지만 있는 경우 (예: "미국 크루즈 터미널 어떻게 가?")
        responseMessages.push({
          type: 'text',
          text: `어디에서 ${destText}로 가실 예정이신가요? 출발지를 알려주시면 더 정확한 길찾기를 도와드릴 수 있어요.`,
        });
        responseMessages.push({
          type: 'map-links',
          title: '바로 검색',
          links: [
            { label: `🗺️ ${destText} 검색`, href: gmapSearch(destText) },
          ],
        });
        responseMessages.push({
          type: 'text',
          text: '실시간 소요시간·영업시간은 링크에서 자동 갱신됩니다.',
        });
      } else {
        responseMessages.push({
          type: 'text',
          text: '출발지와 목적지를 정확히 알려주시면 길찾기를 도와드릴게요. (예: 인천공항에서 포트미애미 터미널까지)',
        });
      }
      break;
    }
    case 'nearby': {
      const keyword = extractNearbyKeyword(text);
      if (keyword) {
        responseMessages.push({
          type: 'text',
          text: `현재 위치 주변 ${keyword}을 찾고 있어요!`,
        });
        responseMessages.push({
          type: 'map-links',
          title: '바로 검색',
          links: [
            { label: `🔍 ${keyword} 근처`, href: gmapSearch(keyword) },
          ],
        });
        responseMessages.push({
          type: 'text',
          text: '실시간 소요시간·영업시간은 링크에서 자동 갱신됩니다.',
        });
      } else {
        responseMessages.push({
          type: 'text',
          text: '어떤 장소를 찾으시는지 알려주세요. (예: 근처 스타벅스, 주변 편의점)',
        });
      }
      break;
    }
    case 'photos': {
      const photoResponse = await handleShowPhotos(text);
      if (photoResponse.length > 0) {
        const photosMessage = photoResponse[0] as PhotosMessage;
        const photoGalleryMessage: PhotoGalleryMessage = {
          type: 'photo-gallery',
          title: photosMessage.title,
          images: photosMessage.photos.map(p => p.url),
        };
        responseMessages.push(photoGalleryMessage);
        responseMessages.push({
          type: 'text',
          text: '네, 터미널에 대한 사진을 찾았어요! 🎉 모든 사진을 보여드릴게요!',
        });
      } else {
        responseMessages.push({
          type: 'text',
          text: '관련 사진을 찾을 수 없어요. 다른 키워드로 검색해 보시겠어요?',
        });
      }
      break;
    }
    case 'free':
    default: {
      responseMessages.push({
        type: 'text',
        text: `요청하신 "${text}"에 대해 준비 중이에요. 더 자세히 알려주시면 바로 안내할게요. 😊`,
      });
      break;
    }
  }

  return NextResponse.json({ ok: true, messages: responseMessages });
}