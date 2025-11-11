// src/app/api/vnext/nav/suggest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { portsByCountry, findCountryCodeByKorean } from '@/vnext/lib/nav/data';

// 공항 데이터는 프로젝트 내 어느 쪽이든 OK: 두 형태 모두 대응
// 1) airportsByCountry.US = [{ code,name,emoji? }, ...]
// 2) AIRPORTS = [{ code,name,countryCode?,'country'?:'United States' }, ...]
import * as AP from '@/vnext/lib/chat/airports';

type SItem = { id: string; label: string; subtitle?: string; country?: string };

function getAirportsByCountry(countryCode: string): SItem[] {
  const out: SItem[] = [];

  // 형태 1: airportsByCountry
  const byC = (AP as any).airportsByCountry?.[countryCode];
  if (Array.isArray(byC)) {
    for (const a of byC) {
      out.push({
        id: a.code ?? a.q ?? a.name,
        label: a.name ?? a.label ?? `${a.code}`,
        subtitle: a.code ? `${a.code}` : undefined,
        country: countryCode,
      });
    }
  }

  // 형태 2: AIRPORTS 평면 배열
  if (out.length === 0 && Array.isArray((AP as any).AIRPORTS)) {
    const list = (AP as any).AIRPORTS as any[];
    const cc = countryCode.toUpperCase();
    for (const a of list) {
      const code = (a.countryCode || a.country || '').toUpperCase();
      if (code === cc || a.country === 'United States' && cc === 'US') {
        out.push({
          id: a.code ?? a.iata ?? a.name,
          label: a.name ?? `${a.city || ''} ${a.code || ''}`.trim(),
          subtitle: a.code ?? a.iata,
          country: cc,
        });
      }
    }
  }

  // 최소 폴백 (데이터가 하나도 없을 때)
  if (out.length === 0 && countryCode === 'US') {
    const fallback = [
      ['LAX','Los Angeles International Airport'],
      ['JFK','John F. Kennedy International Airport'],
      ['MIA','Miami International Airport'],
      ['SFO','San Francisco International Airport'],
      ['SEA','Seattle–Tacoma International Airport'],
      ['MCO','Orlando International Airport'],
      ['FLL','Fort Lauderdale–Hollywood International Airport'],
      ['EWR','Newark Liberty International Airport'],
      ['DFW','Dallas/Fort Worth International Airport'],
      ['IAH','George Bush Intercontinental Airport'],
    ];
    fallback.forEach(([code,name])=> out.push({ id: code, label: name, subtitle: code, country:'US' }));
  }

  return out;
}

function toItems(arr: { label: string; value: string }[], country?: string): SItem[] {
  return arr.map(p => ({ id: p.value, label: p.label, subtitle: p.value, country }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slot = (searchParams.get('slot') || 'from') as 'from'|'to';
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const anchorCountry = (searchParams.get('anchorCountry') || '').toUpperCase();

  // 1) FROM: '미국'처럼 국가를 치면 → 해당 국가 공항 + 현 위치
  if (slot === 'from') {
    // 한글 국가명 → 코드
    const cc = findCountryCodeByKorean(q === '' ? '미국' : q) // 정확히 '미국'만 들어와도 OK
            || (q === 'us' || q === 'usa' || q === 'united states' ? 'US' : null);

    if (cc) {
      const airports = getAirportsByCountry(cc);
      const head: SItem[] = [{ id: 'current_location', label: '현 위치' }];
      return NextResponse.json({ items: [...head, ...airports] });
    }
    // 검색어가 국가명이 아니라면: 기본 추천 (필요 시 기존 로직 유지)
    // → 현 위치 + (일반 인기 공항/도시) 등… 지금은 현 위치만 우선 노출
    return NextResponse.json({ items: [{ id: 'current_location', label: '현 위치' }] });
  }

  // 2) TO: anchorCountry가 있으면 → 그 나라의 크루즈 터미널
  if (slot === 'to') {
    const cc = anchorCountry || (q ? findCountryCodeByKorean(q) : null) || '';
    if (cc && portsByCountry[cc]) {
      return NextResponse.json({ items: toItems(portsByCountry[cc], cc) });
    }
    // 앵커가 없을 땐 기본 포트(미국 다수) 우선
    const defaults = portsByCountry['US'] ?? [];
    return NextResponse.json({ items: toItems(defaults, 'US') });
  }

  return NextResponse.json({ items: [] });
}
