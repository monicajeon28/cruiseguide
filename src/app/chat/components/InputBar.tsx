import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import HelpModal from '@/components/HelpModal';
import { type Terminal } from '@/lib/terminals';

type SItem = { id: string; label: string; subtitle?: string; country?: string };

type Props = {
  mode: 'go' | 'show' | 'general' | 'guide';
  trip?: {
    embarkCountry?: string;
    embarkPortName?: string;
    cruiseName?: string;
  };
  onSend: (payload: { text: string; origin?: string; dest?: string; fromPick?: SItem; toPick?: SItem; }) => void;
};

export default function InputBar({ mode, trip, onSend }: Props) {
  const [fromText, setFromText] = useState('')
  const [toText, setToText] = useState('')
  const [selectedFrom, setSelectedFrom] = useState<SItem | null>(null);
  const [selectedTo, setSelectedTo] = useState<SItem | null>(null);
  const [fromItems, setFromItems] = useState<SItem[]>([]);
  const [toItems, setToItems] = useState<SItem[]>([]);
  const [anchorCountry, setAnchorCountry] = useState<string>('');

  const [openHelp, setOpenHelp] = useState(false);
  const [fromFocused, setFromFocused] = useState(false);
  const [toFocused, setToFocused] = useState(false);

  // 초기 로드 시 fromItems 미리 불러오기 (미국 공항)
  useEffect(() => {
    fetch('/api/vnext/nav/suggest?slot=from&q=')
      .then(r => r.json())
      .then(d => setFromItems(d.items || []))
      .catch(() => setFromItems([]));
  }, []);

  const onPickFrom = useCallback((it: SItem) => {
    setFromText(it.label);
    setSelectedFrom(it);
    if (it.country) setAnchorCountry(it.country);
    const url = `/api/vnext/nav/suggest?slot=to${it.country ? `&anchorCountry=${it.country}` : ''}`;
    fetch(url).then(r => r.json()).then(d => setToItems(d.items || [])).catch(() => setToItems([]));
    document.getElementById('to-input')?.focus();
  }, []);

  const onFocusTo = useCallback(() => {
    setToFocused(true);
    const url = `/api/vnext/nav/suggest?slot=to${anchorCountry ? `&anchorCountry=${anchorCountry}` : ''}`;
    fetch(url).then(r => r.json()).then(d => setToItems(d.items || [])).catch(() => setToItems([]));
  }, [anchorCountry]);


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

  const canSend = (fromText.trim().length > 0 || /현\s*위치|현재\s*위치/.test(fromText)) && toText.trim().length > 0;

  const submit = () => {
    if (!canSend) return
    const combinedText = [fromText, toText].filter(Boolean).join(' → ') || toText || fromText || '';
    onSend({
      text: combinedText,
      origin: fromText.trim() || undefined,
      dest: toText.trim() || undefined,
      fromPick: selectedFrom ?? undefined,
      toPick: selectedTo ?? undefined,
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
              value={fromText}
              placeholder={examples.originPH}
              onChange={v => {
                setFromText(v);
                fetch(`/api/vnext/nav/suggest?slot=from&q=${encodeURIComponent(v)}`)
                  .then(r => r.json())
                  .then(d => setFromItems(d.items || []))
                  .catch(() => setFromItems([]));
              }}
              onKeyDown={onKey}
              onFocus={() => setFromFocused(true)}
              onBlur={() => setFromFocused(false)}
            />
            {(fromFocused || fromText) && fromItems.length > 0 && (
              <Chips
                items={fromItems}
                onClick={onPickFrom}
              />
            )}
            <span className="block text-center px-1 text-neutral-400">→</span>
            <Input
              id="to-input"
              value={toText}
              placeholder={examples.destPH}
              onChange={v => setToText(v)}
              onKeyDown={onKey}
              onFocus={onFocusTo}
              onBlur={() => setToFocused(false)}
            />
            {(toFocused || toText) && toItems.length > 0 && (
              <Chips
                items={toItems}
                onClick={(it) => {
                  setToText(it.label);
                  setSelectedTo(it);
                  setToItems([]);
                }}
              />
            )}
          </div>
        ) : (
          <Input
            value={toText}
            placeholder={examples.singlePH}
            onChange={v => setToText(v)}
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

function Input({id, value, onChange, placeholder, onKeyDown, onFocus, onBlur}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  return (
    <input id={id} className="w-full rounded-xl border px-3 py-2 outline-none"
           value={value} placeholder={placeholder}
           onChange={e => onChange(e.target.value)} onKeyDown={onKeyDown} onFocus={onFocus} onBlur={onBlur} />
  )
}

function Chips({items, onClick}: { items: SItem[], onClick: (it: SItem) => void }) {
  if (!items?.length) return null
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map(it => (
        <button key={it.id} className="rounded-full px-3 py-1 border hover:bg-neutral-50"
                onClick={() => onClick(it)}>
          {it.label}{it.subtitle ? <span className="ml-1 text-xs text-neutral-500">· {it.subtitle}</span> : null}
        </button>
      ))}
    </div>
  )
}
