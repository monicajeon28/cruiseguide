'use client';
import { useEffect, useState } from 'react';

type Item = { id: string; label: string; subtitle?: string; country?: string };

export default function NavigatePicker({
  onPickFrom, onPickTo,
  fromPlaceholder='어디에서 출발하시나요? (예: 미국 / HKG / 현 위치)',
  toPlaceholder='도착지만 입력해도 됩니다. (예: 홍콩 크루즈 터미널 / 스타벅스)',
}:{
  onPickFrom:(it:Item)=>void;
  onPickTo:(it:Item)=>void;
  fromPlaceholder?:string;
  toPlaceholder?:string;
}) {
  const [fromQ, setFromQ] = useState('');
  const [toQ, setToQ] = useState('');
  const [fromItems, setFromItems] = useState<Item[]>([]);
  const [toItems, setToItems] = useState<Item[]>([]);
  const [anchorCountry, setAnchorCountry] = useState('');

  useEffect(() => {
    const q = fromQ.trim();
    fetch(`/api/vnext/nav/suggest?slot=from&q=${encodeURIComponent(q)}`)
      .then(r=>r.json()).then(d=>setFromItems(d.items||[])).catch(()=>setFromItems([]));
  }, [fromQ]);

  const loadTO = (cc?:string) => {
    const url = `/api/vnext/nav/suggest?slot=to${cc?`&anchorCountry=${cc}`:''}`;
    fetch(url).then(r=>r.json()).then(d=>setToItems(d.items||[])).catch(()=>setToItems([]));
  };

  return (
    <div className="space-y-2">
      <input className="w-full rounded-xl border px-3 py-2"
        placeholder={fromPlaceholder}
        value={fromQ} onChange={e=>setFromQ(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        {fromItems.map(it=>(
          <button key={it.id}
            className="px-3 py-1.5 rounded-full border bg-white hover:bg-gray-50"
            onClick={()=>{
              onPickFrom(it);
              if (it.country) { setAnchorCountry(it.country); loadTO(it.country); }
            }}>
            {it.label}{it.subtitle?` · ${it.subtitle}`:''}
          </button>
        ))}
      </div>

      <input className="w-full rounded-xl border px-3 py-2"
        placeholder={toPlaceholder}
        value={toQ} onChange={e=>setToQ(e.target.value)}
        onFocus={()=>loadTO(anchorCountry)} />
      <div className="flex flex-wrap gap-2">
        {toItems.map(it=>(
          <button key={it.id}
            className="px-3 py-1.5 rounded-full border bg-white hover:bg-gray-50"
            onClick={()=>onPickTo(it)}>
            {it.label}{it.subtitle?` · ${it.subtitle}`:''}
          </button>
        ))}
      </div>
    </div>
  );
}
