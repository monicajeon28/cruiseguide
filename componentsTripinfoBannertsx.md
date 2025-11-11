'use client';

import React from 'react';
import Link from 'next/link';
// import { Trip, User } from '@/app/page'; // Trip, User 타입 제거
import { calculateDday, formatDate } from '../utils/dateHelpers'; // 새 유틸리티 파일에서 임포트 경로 수정

interface TripInfoBannerProps {
  userDisplayName: string | null;
  latestTrip: any | null; // Trip 또는 null
}

// 크루즈 이름에서 괄호 안의 영어 제거
function removeEnglishInParentheses(text: string): string {
  return text.replace(/\s*\([^)]+\)/g, '').trim();
}

// 목적지에서 괄호 안의 영어 및 불필요한 하이픈 제거
function removeEnglishFromDestination(destination: string): string {
  return destination.replace(/\s*\([^)]+\)/g, '').replace(/\s*-\s*/g, ' - ').trim();
}

// 국가 코드 매핑
const countryCodeMap: { [key: string]: string } = {
  '대한민국': 'KR',
  '일본': 'JP',
  '중국': 'CN',
  '대만': 'TW',
  '필리핀': 'PH',
  '미국': 'US',
  '캐나다': 'CA',
  '멕시코': 'MX',
  '영국': 'GB',
  '프랑스': 'FR',
  '독일': 'DE',
  '이탈리아': 'IT',
  '스페인': 'ES',
  '그리스': 'GR',
  '호주': 'AU',
  '뉴질랜드': 'NZ',
  '남아프리카공화국': 'ZA',
  '브라질': 'BR',
  '아르헨티나': 'AR',
  '이집트': 'EG',
  '터키': 'TR',
  '러시아': 'RU',
  // 필요한 다른 국가들을 여기에 추가하세요
};

// 국가 이름으로 국기 이모티콘 가져오기
function getFlagEmoji(countryName: string): string {
  const countryCode = countryCodeMap[countryName];
  if (!countryCode) return '';

  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 0x1F1E6 + (char.charCodeAt(0) - 'A'.charCodeAt(0)));
  return String.fromCodePoint(...codePoints);
}

// 목적지 문자열에서 한국어 국가 이름 추출 (예: "일본 (Japan) - 도쿄 (Tokyo Metropolis)" -> "일본")
function extractKoreanCountryName(destination: string): string {
  const match = destination.match(/^([^ (]+)/);
  return match ? match[1] : '';
}


export default function TripInfoBanner({ userDisplayName, latestTrip }: TripInfoBannerProps) {
  if (!latestTrip) {
    return null;
  }

  const dday = calculateDday(latestTrip.startDate);
  const ddayText = dday !== null
    ? dday > 0
      ? `D-${dday}일 남았습니다!`
      : `여행 ${-dday + 1}일차`
    : '여행일을 계산중입니다...';

  const koreanCountryName = extractKoreanCountryName(latestTrip.destination);
  const flagEmoji = getFlagEmoji(koreanCountryName);

  return (
    <div className="sticky top-[60px] z-10 bg-blue-600 text-white rounded-b-2xl p-4 shadow-lg flex items-center justify-between mx-auto max-w-3xl sm:px-6 mb-4">
      <div className="flex flex-col">
        <p className="text-xl font-bold mb-1">
          🚢 {ddayText}
        </p>
        <p className="text-base">
          {userDisplayName || '통통'}님의 {removeEnglishInParentheses(latestTrip.cruiseName)} {flagEmoji} {removeEnglishFromDestination(latestTrip.destination)}
        </p>
        <p className="text-sm opacity-80 mt-1">
          {formatDate(latestTrip.startDate)} ~ {formatDate(latestTrip.endDate)}
        </p>
        <Link href="/guide" className="text-blue-200 hover:text-blue-100 text-sm font-medium mt-2 inline-block underline">
          ⓘ 사용설명서 알아보기
        </Link>
      </div>
    </div>
  );
} 