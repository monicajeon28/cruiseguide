'use client';
import { useMemo, useState, useEffect } from 'react'; // useEffect 추가
import type { Place } from '@/lib/nav/data';
import { airportsByCountry, terminalsByRegion } from '@/lib/nav/data';
import { gmapsDir, gmapsNearby } from '@/lib/nav/urls';
import Toast from '@/app/chat/components/Toast'; // Toast 컴포넌트 임포트

type Props = {
  // 예: country='TW', region='HONGKONG' → 대만 공항 중 하나 → 홍콩(카이탁/오션) 터미널 선택
  country: keyof typeof airportsByCountry;
  region:  keyof typeof terminalsByRegion;

  // 50+ 가독성 옵션
  title?: string; // 카드 상단 제목
  highlightNote?: string; // 보조 안내(형광펜)
};

export default function NavigatePicker({ country, region, title, highlightNote }: Props) {
  const [airport, setAirport]   = useState<Place | null>(null);
  const [terminal, setTerminal] = useState<Place | null>(null);
  const [showToast, setShowToast] = useState(false); // 토스트 메시지 상태

  const airports = useMemo(()=>airportsByCountry[country] ?? [], [country]);
  const terminals = useMemo(()=>terminalsByRegion[region] ?? [], [region]);

  // ✅ 최근 선택 기억 로직
  useEffect(() => {
    if (typeof window !== 'undefined') { // 클라이언트 사이드에서만 실행
      const lastAirportCode = localStorage.getItem(`lastAirportCode_${country}`);
      const lastTerminalCode = localStorage.getItem(`lastTerminalCode_${region}`);

      if (lastAirportCode) {
        const lastAirport = airports.find(a => a.code === lastAirportCode);
        if (lastAirport) setAirport(lastAirport);
      }
      if (lastTerminalCode) {
        const lastTerminal = terminals.find(t => t.code === lastTerminalCode);
        if (lastTerminal) setTerminal(lastTerminal);
      }
    }
  }, [country, region, airports, terminals]); // 의존성 배열에 airports와 terminals 추가

  // ✅ 선택 변경 시 localStorage 업데이트
  useEffect(() => {
    if (typeof window !== 'undefined' && airport) {
      localStorage.setItem(`lastAirportCode_${country}`, airport.code);
    }
  }, [airport, country]);

  useEffect(() => {
    if (typeof window !== 'undefined' && terminal) {
      localStorage.setItem(`lastTerminalCode_${region}`, terminal.code);
    }
  }, [terminal, region]);

  const handleTerminalClick = (t: Place) => {
    if (!airport) {
      setShowToast(true); // 공항 미선택 시 토스트 표시
      return;
    }
    setTerminal(t);
  };

  const linkDriving = airport && terminal ? gmapsDir(airport.q, terminal.q, 'driving') : '';
  const linkTransit = airport && terminal ? gmapsDir(airport.q, terminal.q, 'transit') : '';

  return (
    <section className="rounded-2xl border bg-white p-4 md:p-5 shadow-sm">
      <div className="text-[18px] md:text-[20px] font-extrabold mb-2">
        {title ?? '🧭 길찾기 도우미'}
      </div>
      {highlightNote && (
        <p className="mb-3">
          <mark className="bg-yellow-200/80 px-1 rounded-sm">{highlightNote}</mark>
        </p>
      )}

      {/* 1단계: 공항 선택 */}
      <div className="mb-3">
        <div className="font-bold text-[16px] md:text-[18px] mb-1">1) 어느 공항으로 도착하나요? <span className="text-red-600">🛫</span></div>
        <div className="flex gap-2 flex-wrap">
          {airports.map(a => (
            <button key={a.code}
              onClick={() => setAirport(a)}
              className={`px-3 py-2 rounded-xl border text-[16px] md:text-[17px] hover:bg-blue-50
                          ${airport?.code===a.code ? 'bg-blue-100 border-blue-400' : 'bg-white'}`}>
              <span className="mr-1">{a.emoji ?? '🛫'}</span>{a.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2단계: 크루즈 터미널 선택 */}
      <div className="mb-3">
        <div className="font-bold text-[16px] md:text-[18px] mb-1">2) 어느 크루즈 터미널로 가시나요? <span className="text-blue-700">🛳️</span></div>
        <div className="flex gap-2 flex-wrap">
          {terminals.map(t => (
            <button key={t.code}
              onClick={() => handleTerminalClick(t)} // handleTerminalClick 사용
              className={`px-3 py-2 rounded-xl border text-[16px] md:text-[17px] hover:bg-emerald-50
                          ${terminal?.code===t.code ? 'bg-emerald-100 border-emerald-400' : 'bg-white'}`}>
              <span className="mr-1">{t.emoji ?? '🛳️'}</span>{t.name}
            </button>
          ))}
        </div>
      </div>

      {/* 결과 링크 */}
      {airport && terminal ? (
        <div className="mt-3 space-y-2">
          <div className="text-[16px] md:text-[18px]">
            <span className="font-bold text-blue-700 underline underline-offset-4">{airport.name}</span>
            <span className="mx-1">→</span>
            <span className="font-bold text-blue-700 underline underline-offset-4">{terminal.name}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={linkDriving} target="_blank"
               className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold text-[16px] md:text-[17px]">🚗 구글 길찾기(차량)</a>
            <a href={linkTransit} target="_blank"
               className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-[16px] md:text-[17px]">🚇 구글 길찾기(대중교통)</a>
            <a href={gmapsNearby('Starbucks', terminal.q)} target="_blank"
               className="px-3 py-2 rounded-lg bg-green-600 text-white font-semibold text-[15px] md:text-[16px]">☕ 근처 스타벅스</a>
            <a href={gmapsNearby('Convenience store', terminal.q)} target="_blank"
               className="px-3 py-2 rounded-lg bg-amber-600 text-white font-semibold text-[15px] md:text-[16px]">🛒 편의점</a>
            <a href={gmapsNearby('Pharmacy', terminal.q)} target="_blank"
               className="px-3 py-2 rounded-lg bg-purple-600 text-white font-semibold text-[15px] md:text-[16px]">💊 약국</a>
            <a href={gmapsNearby('Currency exchange', terminal.q)} target="_blank"
               className="px-3 py-2 rounded-lg bg-pink-600 text-white font-semibold text-[15px] md:text-[16px]">💱 환전소</a>
          </div>
        </div>
      ) : (
        <p className="text-gray-600 text-[15px] md:text-[16px]">공항과 터미널을 모두 선택하면 길찾기 버튼이 생성됩니다.</p>
      )}
      {showToast && (
        <Toast message="먼저 공항을 선택해 주세요 ✳️" onClose={() => setShowToast(false)} />
      )}
    </section>
  );
}
