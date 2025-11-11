'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { normalize } from '@/utils/normalize';

import countries from '@/data/countries.json';
import cruiseData from '@/data/cruise_ships.json';

const CountrySelect = dynamic(() => import('@/components/CountrySelect'), { ssr: false });

type Option = { value: string; label: string };

const radioBase =
  'inline-flex items-center justify-center h-10 px-4 rounded-full border text-[16px] font-medium';
const radioOn  = `${radioBase} bg-red-600 text-white border-red-600`;
const radioOff = `${radioBase} bg-white text-gray-800 border-gray-300 hover:bg-gray-50`;

function calcNightsDays(startISO?: string, endISO?: string) {
  if (!startISO || !endISO) return { nights: 0, days: 0 };
  const s = new Date(startISO); s.setHours(0,0,0,0);
  const e = new Date(endISO);  e.setHours(0,0,0,0);
  const days = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
  return { nights: Math.max(days - 1, 0), days: Math.max(days, 0) };
}

export default function CruiseTripRegistration({ onSubmit }:{ onSubmit?: (payload:any)=>Promise<void>|void }) {
  const router = useRouter();

  const [selectedShip, setSelectedShip] = useState<Option | null>(null);
  const [companion, setCompanion] = useState<'친구'|'커플'|'가족'|'혼자'>('가족');
  const [visitCount, setVisitCount] = useState<number>(3);
  const [destinations, setDestinations] = useState<Option[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate]     = useState<string>('');
  const [shipInput, setShipInput] = useState('');
  const [destInput, setDestInput] = useState('');

  const { nights, days } = calcNightsDays(startDate, endDate);

  /** 크루즈 이름 옵션 (중복 제거) */
  const shipOptions = useMemo<Option[]>(() => {
    const arr = Array.isArray(cruiseData) ? cruiseData : [];
    const all = arr.flatMap((line:any) =>
      (Array.isArray(line?.ships) ? line.ships : []).map((name:string)=>({ value:name, label:name }))
    );
    const map = new Map<string, Option>();
    all.forEach(o => map.set(o.value, o));
    return Array.from(map.values());
  }, []);

  /** 목적지 옵션 (국가 + 지역) */
  const destinationOptions = useMemo<Option[]>(() => {
    const out: Option[] = [];
    (countries as any[]).forEach(cont => {
      (cont?.countries || []).forEach((c:any) => {
        if (c?.name) out.push({ value:c.name, label:c.name });
        if (Array.isArray(c?.regions)) {
          c.regions.forEach((r:string)=>{
            const v = `${c.name} - ${r}`;
            out.push({ value:v, label:v });
          });
        }
      });
    });
    const map = new Map<string, Option>();
    out.forEach(o => map.set(o.value, o));
    return Array.from(map.values());
  }, []);

  /** 공통 필터 (한/영, 공백, 대소문자 무시) */
  const filterOption = (opt:any, raw:string) =>
    normalize(opt?.label ?? '')?.includes(normalize(raw));

  /** 연관검색 칩: 입력값 기준 상위 5개 추천 */
  const shipChips = useMemo(()=> {
    if (!shipInput) return [];
    const n = normalize(shipInput);
    return shipOptions
      .filter(o => normalize(o.label).includes(n))
      .slice(0,5);
  }, [shipInput, shipOptions]);

  const destChips = useMemo(()=> {
    if (!destInput) return [];
    const n = normalize(destInput);
    return destinationOptions
      .filter(o => normalize(o.label).includes(n))
      .slice(0,5);
  }, [destInput, destinationOptions]);

  const save = async () => {
    console.log('[CruiseTripRegistration] save function initiated.'); // 함수 시작 로깅

    if (!selectedShip || destinations.length === 0 || !startDate || !endDate) {
      alert('크루즈 이름, 목적지, 날짜를 입력해 주세요.');
      return;
    }
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0); // Normalize to start of day
    end.setHours(0, 0, 0, 0);   // Normalize to start of day

    if (start.getTime() > end.getTime()) {
      alert('출발일은 도착일보다 빠를 수 없습니다.');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start.getTime() < today.getTime()) { // Check if startDate is in the past
      alert('출발일은 오늘 또는 미래여야 합니다.');
      return;
    }

    // 3) 저장 직전 검사(이미 API에서도 막지만 UX용)
    if (destinations.length !== visitCount) {
      alert(`방문 국가 ${visitCount}개를 선택해주세요. (현재 ${destinations.length}개)`);
      return;
    }

    const payload = {
      cruiseName: selectedShip.value,
      companionType: companion,
      destination: destinations.map(d=>d.value),
      startDate, endDate, nights, days, visitCount,
    };

    // 기존 onSubmit 로직은 유지하되, 401 방어 로직 추가
    if (onSubmit) {
      await onSubmit(payload);
    } else {
      console.log('[CruiseTripRegistration] API call to /api/trips initiated with payload:', payload); // 추가 로깅
      const r = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (r.status === 401) {
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
        location.href = '/login?next=/onboarding'; // 401 시 로그인 페이지로 리다이렉트
        return;
      }

      let j: any;
      try {
        j = await r.json();
      } catch (error) {
        console.error('[CruiseTripRegistration] Failed to parse JSON response from /api/trips:', error, r);
        alert('저장 실패: 서버 응답을 읽을 수 없습니다.');
        return;
      }
      
      if (!r.ok || !j?.ok) { // `j?.success` 대신 `j?.ok` 사용
        console.error('[CruiseTripRegistration] /api/trips returned non-ok response:', j?.message || '알 수 없는 오류', j);
        alert(j?.message || '저장 실패');
        return;
      }
      alert('여행 정보가 저장되었습니다. (기존 정보가 있을 경우 자동으로 갱신됩니다)');
      // 성공 → 채팅으로
      // document.cookie = "hasTrip=1; path=/; max-age=604800; samesite=lax"; // 서버에서 처리하므로 제거
      router.replace('/chat');
    }
  };

  return (
    <div className="max-w-md w-[520px] mx-auto bg-white rounded-2xl shadow p-6">
      {/* 로고 */}
      <div className="flex flex-col items-center gap-2 mb-4">
        <img
          src="/images/ai-cruise-logo.png" alt="크루즈닷 로고"
          className="w-24 h-auto md:w-28 mx-auto mb-1" // ← 기존 width prop 대신 Tailwind
        />
        <h1 className="text-3xl font-extrabold text-center">여행 정보 등록</h1>
        <p className="text-gray-600 text-center">크루즈 여행 정보를 입력해주세요</p>
      </div>

      {/* 크루즈 이름 */}
      <label className="block text-sm font-semibold mb-2">크루즈 이름</label>
      <CountrySelect
        instanceId="ship-select"
        options={shipOptions}
        value={selectedShip}
        onChange={(v:any)=> setSelectedShip(v as Option|null)}
        onInputChange={(v)=> setShipInput(v)}
        filterOption={filterOption}
        placeholder="크루즈 이름(선박명)을 검색/선택하세요"
        isClearable
      />
      {/* 연관 칩 */}
      {shipChips.length>0 && (
        <div className="flex gap-2 flex-wrap text-sm mt-2">
          {shipChips.map(c=>(<button key={c.value} className="px-3 py-1 rounded-full border bg-white hover:bg-gray-50" onClick={()=> setSelectedShip(c)}>{c.label}</button>))}
        </div>
      )}

      {/* 동반자 */}
      <label className="block text-sm font-semibold mb-2 mt-4">동반자</label>
      <div className="flex gap-2 mb-4">
        {(['친구','커플','가족','혼자'] as const).map(k=>(<button key={k} type="button" onClick={()=>setCompanion(k)} className={companion===k?radioOn:radioOff} aria-pressed={companion===k}>{k}</button>))}
      </div>

      {/* 방문 국가 개수 */}
      <label className="block text-sm font-semibold mb-2">방문 국가 개수</label>
      <select value={visitCount} onChange={(e)=>setVisitCount(parseInt(e.target.value,10))} className="w-full h-12 rounded-lg border px-3 mb-4 text-[16px]">
        {[1,2,3,4,5].map(n=> <option key={n} value={n}>{n}개국</option>)}
      </select>

      {/* 목적지 선택 */}
      <label className="block text-sm font-semibold mb-2">
        목적지 선택 <span className="text-blue-600 font-bold">({destinations.length}/{visitCount}개 선택)</span>
        {destinations.length > 0 && (
          <button type="button" onClick={() => setDestinations([])} className="ml-2 text-red-500 text-xs font-medium hover:underline">
            초기화
          </button>
        )}
      </label>
      <CountrySelect
        instanceId="dest-select"
        isMulti
        options={destinationOptions}
        value={destinations}
        onChange={(vals: any) => {
          const arr = (vals as Option[]) ?? [];
          const limited = arr.slice(0, visitCount);
          setDestinations(limited);
        }}
        onInputChange={(v)=> setDestInput(v)}
        filterOption={filterOption}
        placeholder="목적지를 선택하세요 (여러 개 선택 가능)"
      />
      {/* n/m 선택 카운터 */}
      <div className="mt-1 text-xs text-gray-500">
        {visitCount}개 중 <span className="font-semibold text-blue-600">{destinations.length}</span> 선택됨
      </div>
      {/* 연관 칩 */}
      {destChips.length>0 && (
        <div className="flex gap-2 flex-wrap text-sm mt-2">
          {destChips.map(c=>(<button key={c.value} className="px-3 py-1 rounded-full border bg-white hover:bg-gray-50" onClick={()=>{
            setDestinations(prev => {
              if (prev.some(p=>p.value===c.value)) return prev;
              if (prev.length >= visitCount) return prev;
              return [...prev, c];
            });
          }}>{c.label}</button>))}
        </div>
      )}
      {/* 목적지 선택 요약 카운터 */}
      {/* Removed the previous counter display from here */}
      {/* 출/도착일 */}
      <div className="grid grid-cols-2 gap-3 mb-3 mt-4">
        <div>
          <label className="block text-sm font-semibold mb-2">출발일</label>
          <div className="relative">
            <input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} className="w-full h-12 rounded-lg border px-3 text-[16px]" />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">📅</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">도착일</label>
          <div className="relative">
            <input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} className="w-full h-12 rounded-lg border px-3 text-[16px]" />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">📅</span>
          </div>
        </div>
      </div>

      {/* 여행 기간 */}
      <div className="mb-5 rounded-xl border bg-gray-50 p-4 text-center">
        <div className="text-gray-500 text-sm mb-1">여행 기간</div>
        <div className="text-red-600 text-2xl font-extrabold">{nights}박 {days}일</div>
        {startDate && endDate && (<div className="text-gray-600 text-sm mt-1">{startDate} ~ {endDate}</div>)}
      </div>

      <button type="button" onClick={save} className="w-full h-12 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-[16px]">
        여행 정보 등록하기
      </button>
    </div>
  );
} 