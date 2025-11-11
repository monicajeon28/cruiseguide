import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/itinerary/current
 * 현재 날짜의 기항지 정보를 반환합니다.
 * - 오늘 날짜에 해당하는 Itinerary를 조회
 * - 언어, 통화, 국가 정보 반환
 * - 항해 중이거나 기항지가 없으면 기본값 반환
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    // 사용자의 활성 여행 조회
    const activeTrip = await prisma.trip.findFirst({
      where: {
        userId: user.id,
        status: { in: ['Upcoming', 'InProgress'] },
      },
      orderBy: { startDate: 'desc' },
      select: { id: true, startDate: true, endDate: true },
    });

    if (!activeTrip) {
      return NextResponse.json({
        ok: true,
        hasTrip: false,
        message: 'No active trip found',
        defaultLanguage: {
          code: 'en-US',
          name: '영어',
          flag: '🇬🇧',
          country: '미국',
          currency: 'USD',
        },
      });
    }

    // 오늘 날짜
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 오늘 날짜의 Itinerary 조회
    const currentItinerary = await prisma.itinerary.findFirst({
      where: {
        tripId: activeTrip.id,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // 오늘 하루
        },
      },
      orderBy: { date: 'asc' },
      select: {
        location: true,
        country: true,
        language: true,
        currency: true,
        type: true,
        arrival: true,
        departure: true,
      },
    });

    // 기항지가 없으면 (항해 중) 기본값 반환
    if (!currentItinerary || currentItinerary.type === 'Cruising') {
      return NextResponse.json({
        ok: true,
        hasTrip: true,
        isCruising: true,
        message: 'Cruising (항해 중)',
        defaultLanguage: {
          code: 'en-US',
          name: '영어',
          flag: '🇬🇧',
          country: '항해 중',
          currency: 'USD',
        },
      });
    }

    // 언어 코드를 Web Speech API 형식으로 변환
    const languageMap: Record<string, { code: string; name: string; flag: string }> = {
      ko: { code: 'ko-KR', name: '한국어', flag: '🇰🇷' },
      ja: { code: 'ja-JP', name: '일본어', flag: '🇯🇵' },
      'zh-CN': { code: 'zh-CN', name: '중국어', flag: '🇨🇳' },
      'zh-TW': { code: 'zh-TW', name: '대만어', flag: '🇹🇼' },
      en: { code: 'en-US', name: '영어', flag: '🇬🇧' },
      th: { code: 'th-TH', name: '태국어', flag: '🇹🇭' },
      vi: { code: 'vi-VN', name: '베트남어', flag: '🇻🇳' },
      id: { code: 'id-ID', name: '인도네시아어', flag: '🇮🇩' },
      ms: { code: 'ms-MY', name: '말레이어', flag: '🇲🇾' },
      fr: { code: 'fr-FR', name: '프랑스어', flag: '🇫🇷' },
      it: { code: 'it-IT', name: '이탈리아어', flag: '🇮🇹' },
      es: { code: 'es-ES', name: '스페인어', flag: '🇪🇸' },
      de: { code: 'de-DE', name: '독일어', flag: '🇩🇪' },
      ru: { code: 'ru-RU', name: '러시아어', flag: '🇷🇺' },
    };

    const lang = currentItinerary.language || 'en';
    const languageInfo = languageMap[lang] || languageMap['en'];

    return NextResponse.json({
      ok: true,
      hasTrip: true,
      isCruising: false,
      currentPort: {
        location: currentItinerary.location,
        country: currentItinerary.country,
        language: languageInfo,
        currency: currentItinerary.currency || 'USD',
        type: currentItinerary.type,
        arrival: currentItinerary.arrival,
        departure: currentItinerary.departure,
      },
    });
  } catch (error) {
    console.error('GET /api/itinerary/current error:', error);
    return NextResponse.json(
      { ok: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

