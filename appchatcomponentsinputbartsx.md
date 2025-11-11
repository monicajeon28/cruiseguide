import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import HelpModal from '@/components/HelpModal';
import { type Terminal } from '@/lib/terminals';

type SItem = { id: string; label: string; subtitle?: string; }

// 헬퍼 함수: Terminal 객체로부터 kind를 유추 -> 더 이상 필요 없음 (삭제)
// const inferKind = (t: Terminal): 'airport' | 'terminal' | 'poi' => {
//     if (t.type === 'airport') return 'airport';
//     if (t.type === 'cruise') return 'terminal';
//     if (/공항/i.test(t.name_ko) || /airport/i.test(t.name)) return 'airport';
//     if (/크루즈|터미널/i.test(t.name_ko) || /cruise|terminal/i.test(t.name)) return 'terminal';
//     return 'poi';
// };

type Props = {
  mode: 'go' | 'show' | 'general' | 'guide';
  trip?: {
    embarkCountry?: string;
    embarkPortName?: string;
    cruiseName?: string;
  };
  onSend: (payload: { text: string; origin?: string; dest?: string; files?: File[] }) => void;
};

export default function InputBar({ mode, trip, onSend }: Props) {
  const [originText, setOriginText] = useState('')
  const [destText, setDestText]     = useState('')
  const [originPick, setOriginPick] = useState<null|SItem>(null)
  const [destPick, setDestPick]     = useState<null|SItem>(null)
  const [oSug, setOSug] = useState<SItem[]>([])
  const [dSug, setDSug] = useState<SItem[]>([])
  const typingO = useRef<number>()
  const typingD = useRef<number>()
  const [openHelp, setOpenHelp] = useState(false);
  const [originFocused, setOriginFocused] = useState(false);
  const [destFocused, setDestFocused] = useState(false);

  useEffect(()=>{ setOriginPick(null) }, [originText])
  useEffect(()=>{ setDestPick(null) }, [destText])

  const fetchSuggestions = useCallback(async (role: 'origin' | 'dest', q: string, hint: string) => {
    const res = await fetch(`/api/nav/suggest?role=${role}&q=${encodeURIComponent(q)}&hint=${encodeURIComponent(hint)}`).then(r => r.json());
    return (res.items || []).map((item: { label: string; subtitle?: string }) => ({
      id: item.label, // API에서 id를 주지 않으면 label을 id로 사용
      label: item.label,
      subtitle: item.subtitle, // API에서 subtitle을 준다면 사용
    }));
  }, []);

  useEffect(()=>{
    window.clearTimeout(typingO.current)
    if (!originText.trim() && !originFocused && !oSug.length) return; // 포커스 없거나 텍스트 없으면 초기 제안 안 함
    typingO.current = window.setTimeout(async ()=>{
      const q = originText.trim()
      const hint = destText.trim();
      const fetchedChips = await fetchSuggestions('origin', q, hint);
      const chips: SItem[] = [
          { id: 'current_location', label: '현 위치' },
          ...fetchedChips,
      ];
      setOSug(chips.slice(0, 10));
    }, 200)
  }, [originText, destText, originFocused, fetchSuggestions])

  const GENERIC_DEST = /(크루즈|터미널|cruise)/i

  useEffect(()=>{
    window.clearTimeout(typingD.current)
    if (!destText.trim() && !destFocused && !dSug.length) return; // 포커스 없거나 텍스트 없으면 초기 제안 안 함
    typingD.current = window.setTimeout(async ()=>{
      const q = destText.trim()
      const hint = originText.trim();
      const fetchedChips = await fetchSuggestions('dest', q, hint);
      const chips: SItem[] = fetchedChips;
      setDSug(chips.slice(0, 12));
    }, 180)
  }, [destText, originText, destFocused, fetchSuggestions])

  const examples = useMemo(() => {
    const city = trip?.embarkCountry ?? '홍콩';
    const terminal = trip?.embarkPortName
      ? `${trip.embarkPortName} 크루즈 터미널`
      : '홍콩 크루즈 터미널';
    return {
      originPH: '어디에서 출발하시나요? (예: 홍콩 / 미국 / HKG / 현 위치)',
      destPH:
        '도착지만 입력해도 됩니다. (예: 홍콩 크루즈 터미널 / 스타벅스)',
      singlePH:
        '도착지만 입력해도 됩니다. (예: 홍콩 크루즈 터미널 / 스타벅스)',
    };
  }, [trip]);

  const canSend = (originText.trim().length > 0 || /현\s*위치|현재\s*위치/.test(originText)) && destText.trim().length > 0;

  const submit = () => {
    if (!canSend) return
    const combinedText = [originText, destText].filter(Boolean).join(' → ') || destText || originText || '';
    onSend({
      text: combinedText,
      origin: originText.trim() || undefined,
      dest: destText.trim() || undefined,
    })
  }

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const isGo = mode === 'go';

  return (
    <>
      <div className="flex items-center gap-2 p-3 border rounded-xl bg-white">
        <button
          aria-label="도움말"
          className="shrink-0 w-10 h-10 rounded-lg border text-gray-700 hover:bg-gray-50"
          onClick={() => setOpenHelp(true)}
          title="도움말"
        >
          ?
        </button>

        {isGo ? (
          <div className="flex-1">
            <Input
              id="from-input"
              value={originText}
              placeholder={examples.originPH}
              onChange={v=> setOriginText(v)}
              onKeyDown={onKey}
              onFocus={() => setOriginFocused(true)}
              onBlur={() => setOriginFocused(false)}
            />
            <Chips
              items={oSug}
              onClick={(it)=>{
                setOriginText(it.label);
                setOriginPick(it);
                setOSug([]);
                document.getElementById('to-input')?.focus();
              }}
            />
            <span className="block text-center px-1 text-neutral-400">→</span>
            <Input
              id="to-input"
              value={destText}
              placeholder={examples.destPH}
              onChange={v=> setDestText(v)}
              onKeyDown={onKey}
              onFocus={() => setDestFocused(true)}
              onBlur={() => setDestFocused(false)}
            />
            <Chips
              items={dSug}
              onClick={(it)=>{
                setDestText(it.label);
                setDestPick(it);
                setDSug([]);
              }}
            />
          </div>
        ) : (
          <Input
            value={destText}
            placeholder={examples.singlePH}
            onChange={v=> setDestText(v)}
            onKeyDown={onKey}
          />
        )}

        <button
          onClick={submit}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:opacity-90"
        >
          보내기
        </button>
      </div>

      <HelpModal open={openHelp} onClose={() => setOpenHelp(false)} />
    </>
  );
}

function Input({id, value, onChange, placeholder, onKeyDown, onFocus, onBlur}:{
  id: string;
  value:string,
  onChange:(v:string)=>void,
  placeholder:string,
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void,
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  return (
    <input id={id} className="w-full rounded-xl border px-3 py-2 outline-none"
           value={value} placeholder={placeholder}
           onChange={e=>onChange(e.target.value)} onKeyDown={onKeyDown} onFocus={onFocus} onBlur={onBlur} />
  )
}
function Chips({items, onClick}:{items:SItem[], onClick:(it:SItem)=>void}) {
  if (!items?.length) return null
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map(it=>(
        <button key={it.id} className="rounded-full px-3 py-1 border hover:bg-neutral-50"
                onClick={()=>onClick(it)}>
          {it.label}{it.subtitle ? <span className="ml-1 text-xs text-neutral-500">· {it.subtitle}</span> : null}
        </button>
      ))}
    </div>
  )
}
