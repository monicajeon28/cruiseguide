import terminals from '../data/terminals.json';          // Terminal[]
import aliases from '../data/terminal_aliases.json';     // Record<string, id>
import { defaultTerminalByCity } from '../config/defaultTerminalByCity';
import { buildDirectionsUrl, buildSearchUrl, Waypoint } from '../lib/maps';
import { hasAny } from '../utils/text';
import { normalizePlace } from '@/lib/normalize';

type Terminal = {
  id: string;
  name: string;
  name_ko?: string;
  lat: number;
  lng: number; // lon 대신 lng로 다시 변경
  city: string;
  country: string;
  placeId?: string;
  keywords_ko?: string[];
};

const T = (terminals as Terminal[]);
const ALIASES: Record<string, string> = aliases; // Explicitly cast aliases

// 1) 별칭 → 터미널
export function resolveByAlias(text: string): Terminal | null {
  const n = normalizePlace(text);
  // 완전일치 먼저
  if (ALIASES[n]) {
    const hit = T.find(t => t.id === ALIASES[n]);
    if (hit) return hit;
  }
  // 포함매칭: 별칭 키들 중 하나가 포함되면 채택
  for (const key of Object.keys(ALIASES)) {
    if (n.includes(normalizePlace(key))) {
      const hit = T.find(t => t.id === ALIASES[key]);
      if (hit) return hit;
    }
  }
  return null;
}

// 2) 도시 기본 항구
export function resolveByCity(text: string): Terminal | null {
  const n = normalizePlace(text);
  // 도시 키 후보 만들기
  const keys = Object.keys(defaultTerminalByCity);
  for (const k of keys) {
    if (n.includes(normalizePlace(k))) {
      const id = defaultTerminalByCity[k];
      const hit = T.find(t => t.id === id);
      if (hit) return hit;
    }
  }
  // 텍스트에 등장하는 도시명과 동일한 city 가진 항구 우선 채택
  const cityHit = T.find(t => n.includes(normalizePlace(t.city)));
  return cityHit || null;
}

const GENERIC_TERMINAL_WORDS = ['크루즈 터미널', '크루즈터미널', '크루즈항', '항구', '포트', '항만'];
const AIRPORT_WORDS = ['공항', 'airport'];

// 3) 목적지(터미널) 해석
function resolveDestination(rawDest: string, fullText: string): Terminal | null {
  // 명시적 별칭 매칭
  const aliasHit = resolveByAlias(rawDest);
  if (aliasHit) return aliasHit;

  const isGeneric = hasAny(rawDest, GENERIC_TERMINAL_WORDS);

  // 문장 전체에서 도시를 추출해 기본항으로 보정
  if (isGeneric) {
    // 도쿄/홍콩/상하이 등 도시명은 보통 전체문장에 등장
    const byCityFull = resolveByCity(fullText) || resolveByCity(rawDest);
    if (byCityFull) return byCityFull;
  }

  // 원문 안에서 city를 포함하는 터미널 찾기 (느슨)
  const n = normalizePlace(rawDest);
  const loose = T.find(t => n.includes(normalizePlace(t.city)) || n.includes(normalizePlace(t.name_ko ?? t.name)));
  if (loose) return loose;

  return null;
}

// 4) 출발지(공항) 해석: 공항은 좌표 데이터가 없을 수 있으니 라벨 우선
function resolveOrigin(rawOrigin: string): Waypoint {
  const label = rawOrigin.trim();
  const n = normalizePlace(label);
  // 만약 사용자가 항구명을 원문에 넣었으면(예외) → 항구 좌표로도 처리 가능
  const terminalHit = resolveByAlias(label) || resolveByCity(label);
  if (terminalHit) return { lat: terminalHit.lat, lng: terminalHit.lng, name: terminalHit.name_ko || terminalHit.name, placeId: terminalHit.placeId, label: terminalHit.name_ko || terminalHit.name };

  // 일반적인 공항/지명: 라벨로 검색시키면 구글이 알아서 잡음
  if (hasAny(n, AIRPORT_WORDS)) return { name: label, label };
  // 라벨만이라도 전달
  return { name: label, label };
}

// 5) 문장 파싱
function parseDirectionQuery(text: string) {
  const s = text.replace(/\s+/g, ' ').trim();

  // 대표 패턴: "A에서 B까지", "A→B", "A -> B"
  const m =
    s.match(/(.+?)(?:에서|->|→)\s*(.+?)(?:까지|어떻게|가|요|는|니\?|가\?)?$/) ||
    s.match(/(.+?)\s+(?:에서)\s+(.+)$/);

  if (m) {
    return { origin: m[1].trim(), dest: m[2].trim() };
  }

  // “X 공항에서 크루즈 터미널까지” 같은 케이스 못잡으면, 보수적으로 시도
  const m2 = s.match(/(.+공항).*(크루즈\s*터미널|크루즈항|항구)/);
  if (m2) return { origin: m2[1].trim(), dest: m2[2].trim() };

  return null;
}

// 6) 메인 엔트리
export function resolveDirections(text: string) {
  const q = parseDirectionQuery(text);
  if (!q) return { ok: false, reason: 'parse-failed' as const };

  const dest = resolveDestination(q.dest, text);
  const origin = resolveOrigin(q.origin);

  if (dest) {
    // 모드 추론: 대중교통/자동차 키워드 있으면 바꿔줌
    const n = normalizePlace(text);
    const mode: 'driving' | 'transit' | 'walking' =
      n.includes('대중교통') || n.includes('transit') ? 'transit'
      : n.includes('도보') || n.includes('걷') || n.includes('walking') ? 'walking'
      : 'driving';

    const url = buildDirectionsUrl(
      origin.name,
      dest.name_ko || dest.name,
      mode
    );
    return { 
      ok: true,
      type: 'directions',
      url,
      originLabel: origin.label,
      destLabel: dest.name_ko || dest.name,
      destId: dest.id,
    };
  }

  // 목적지 확정 실패 → 지도검색 버튼으로 폴백
  const searchUrl = buildSearchUrl({ label: q.dest });
  return {
    ok: false,
    reason: 'dest-not-found' as const,
    searchUrl,
  };
} 