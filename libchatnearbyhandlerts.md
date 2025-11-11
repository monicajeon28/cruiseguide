'use client';
import React from 'react';
import { useMemo, ReactNode } from 'react';
import { taiwanAirports } from './airports';
import { navCtx } from '@/lib/chat/taiwanNav';
import { renderEmphasis } from '@/lib/utils';
import { terminalsByRegion } from '@/lib/nav/data';
import { gmapsDir, gmapsNearby } from '@/lib/nav/urls';

export type ChipDef = { label:string; onClick: ()=>void; emoji?: string };

// New type definition for the return of tryNearby
export type NearbyResult = {
  html: ReactNode;
  buttons?: ChipDef[];
  links?: { label: string; href: string; color: string; emoji: string }[];
};

export function useAirportChips(onPick:(href:string)=>void) {
  const kaiTak = terminalsByRegion.HONGKONG.find(t => t.code === 'KAI_TAK');
  if (!kaiTak) return []; // 에러 처리

  const destQuery = kaiTak.q;
  return useMemo<ChipDef[]>(() => taiwanAirports.map(a => ({
    label: a.name,
    onClick: () => onPick(gmapsDir(a.q, destQuery, 'driving')) // gmapsDir 사용
  })), [onPick, destQuery]);
}

export const NEARBY_KEYS = ['스타벅스','편의점','약국','카페','식당'];

export function tryNearby(text: string): null | NearbyResult {
  const key = NEARBY_KEYS.find(k => text.includes(k));
  if (!key) return null;

  if (!navCtx.lastAnchor) {
    const htmlContent = renderEmphasis(
      '어느 위치 **근처**를 보실까요?\n' +
      '최근 경로/목적지 중 하나를 선택해 주세요.'
    );

    const kaiTak = terminalsByRegion.HONGKONG.find(t => t.code === 'KAI_TAK');
    const keelung = terminalsByRegion.TAIWAN.find(t => t.code === 'KEELUNG');
    const kaohsiung = terminalsByRegion.TAIWAN.find(t => t.code === 'KAOHS');

    const anchorSelectionButtons: ChipDef[] = [
      kaiTak ? { label: kaiTak.name, onClick: () => {
        navCtx.lastAnchor = { name: kaiTak.name, lat: kaiTak.lat, lng: kaiTak.lng };
      }} : null,
      keelung ? { label: keelung.name, onClick: () => {
        navCtx.lastAnchor = { name: keelung.name, lat: keelung.lat, lng: keelung.lng };
      }} : null,
      kaohsiung ? { label: kaohsiung.name, onClick: () => {
        navCtx.lastAnchor = { name: kaohsiung.name, lat: kaohsiung.lat, lng: kaohsiung.lng };
      }} : null,
    ].filter(Boolean) as ChipDef[]; // null 값 필터링

    const nearbyCurrentLocationLink = [{ label: `☕ 내 주변 ${key} 열기`, href: gmapsNearby(key), color: 'bg-green-600', emoji: '☕' }]; // gmapsNearby 사용

    return {
      html: <span dangerouslySetInnerHTML={{ __html: htmlContent }} />,
      buttons: anchorSelectionButtons,
      links: nearbyCurrentLocationLink
    };
  }

  const url = gmapsNearby(key, navCtx.lastAnchor.name); // gmapsNearby 사용
  const htmlContent = renderEmphasis(
    `==${navCtx.lastAnchor.name}== 근처 **${key}** 검색 결과입니다.`
  );
  return {
    html: <span dangerouslySetInnerHTML={{ __html: htmlContent }} />,
    links: [{ label: '🔎 구글맵으로 보기', href: url, color: 'bg-purple-600', emoji: '🔎' }]
  };
}
