import { renderEmphasis } from '@/lib/utils';
// import { Place, airportsByCountry, terminalsByRegion } from '@/lib/nav/data'; // 더 이상 사용되지 않으므로 주석 처리
// import { gmapsDir, gmapsNearby } from '@/lib/nav/urls'; // 더 이상 사용되지 않으므로 주석 처리

// type Airport = Place; // 더 이상 사용되지 않으므로 주석 처리
type TerminalKey = string;

type NavContext = {
  lastAnchor?: { name: string; lat: number; lng: number };
};

export const navCtx: NavContext = {};   // ✅ 단 한 번만 선언/export

// 예시: 간단한 의도 감지
export function detectTaiwanToTerminal(text: string): null | { country: 'taiwan' } {
  const t = text.toLowerCase();
  if ((/대만|taiwan/.test(t)) && /(터미널|카이탁|기륭|지룽|가오슝|keelung|kaohsiung)/.test(t)) {
    return { country: 'taiwan' };
  }
  return null;
}

export function detectTaiwanToKaiTak(text: string): null | { target: 'kaitak' } {
  const n = text.replace(/\s/g, '');
  if (/(대만|타이완).*카이탁/.test(n)) return { target: 'kaitak' };
  return null;
}
