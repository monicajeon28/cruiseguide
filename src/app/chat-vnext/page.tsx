'use client';

import { useEffect, useMemo, useRef, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';

import QuickTools from '@/components/QuickTools';
import HelpModal from 'components/HelpModal';
import { fmt } from '@/lib/date';
import SuggestChips from './components/handlers/SuggestChips';
import GoActionsCard from '@/components/GoActionsCard';
import Image from 'next/image';
import ImageViewerModal from '@/components/ImageViewerModal';

import { routeByText } from '@/lib/chat/router';
import GoAnywhere from './components/blocks/GoAnywhere';
import PhotoAlbum from './components/blocks/PhotoAlbum';
import HelpBlock from './components/blocks/HelpBlock';
import { detectIntent, extractSlots, Intent, Slots } from '@/lib/chat/intent';
import { Chip } from '@/components/Chip';
import { ChatProvider } from './components/ChatContext';
import TripInfoBanner from '@/components/TripInfoBanner';
import InputBar from '@/components/chat/InputBar';
import { ChatMessage, ChatMessageButton, ChatMessageLink, ChatInputMode, ChatInputPayload } from '@/lib/types';

type InputBarSItem = { id: string; label: string; subtitle?: string };

// type ChatMode = 'go' | 'show' | 'general';

type FromCoords = { lat: number; lng: number; label?: string }; // fromCoords 타입 추가

type Trip = {
  cruiseName: string;
  destination: string[];
  startDate: string; endDate: string;
  nights?: number; days?: number;
  country?: string; // 추가: 여행 국가 정보
};

// type ChatMessageButton = { label:string; onClick:()=>void };
// type ChatMessageLink = { label:string; href:string; color:string; emoji:string };

// interface ChatMessage {
//   id: string;
//   role: 'user' | 'assistant';
//   text?: string;
//   jsx?: ReactNode;
//   buttons?: ChatMessageButton[];
//   links?: ChatMessageLink[];
//   createdAt?: Date;
// }

const gDirTransitLLtoLL = (from:{lat:number;lng:number}, to:{lat:number;lng:number}) =>
  `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&travelmode=transit`;

const gDirDrivingLLtoLL = (from:{lat:number;lng:number}, to:{lat:number;lng:number}) =>
  `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&travelmode=driving`;

const gOpenPlaceLL = (lat:number, lng:number) =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

// === pick vs text 우선순위 가드 ===
const pickOr = (pick?: {label?:string}|null, text?: string) => {
  const pl = (pick?.label || '').trim()
  const tl = (text || '').trim()
  if (!pl) return tl
  if (!tl) return pl
  // 사용자가 직접 타이핑을 했다면 그걸 우선 (pick이 포함되거나 동일할 때만 pick 사용)
  const same = pl.toLowerCase() === tl.toLowerCase()
  const contained = tl.toLowerCase().includes(pl.toLowerCase())
  return (same || contained) ? pl : tl
}

export default function ChatPage() {
  const [trip, setTrip] = useState<Trip|null>(null);
  const [loadingTrip, setLoadingTrip] = useState(true);
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mode, setMode] = useState<ChatInputMode>('go');
  const [input, setInput] = useState(''); // 일반 탭 입력창 추가

  const [photoItems, setPhotoItems] = useState<any[] | null>(null);
  const [showAlbum, setShowAlbum] = useState(false);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIdx, setViewerIdx] = useState(0);

  const [helpOpen, setHelpOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const prevModeRef = useRef(mode);

  // 탭 전환: 일반 → 다른 탭이면 대화 리셋
  const switchMode = useCallback((next: ChatInputMode) => {
    if ( (mode === 'general' && next !== 'general') || (mode === 'go' && next !== 'go') ) {
      setMessages([]);     // 채팅 비우기
      setInput('');        // 입력창 비우기
      // 추가 초기화 (앨범/모달 상태) 클리어:
      setAlbumOpen(false);
      setViewerOpen(false);
      setViewerIdx(0);
      setPhotoItems(null);
      setShowAlbum(false);
    }
    setMode(next);
  }, [mode, setMessages, setInput, setAlbumOpen, setViewerOpen, setViewerIdx, setPhotoItems, setShowAlbum]);

  // 여행 불러오기
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/trips', { credentials:'include' });
        const j = await r.json().catch(()=>null);
        if (j?.trip) {
          setTrip({
            ...j.trip,
            country: Array.isArray(j.trip.destination) && j.trip.destination.length > 0 
                       ? j.trip.destination[0] : undefined
          });
        } else {
          setTrip(null);
        }
      } finally {
        setLoadingTrip(false);
      }
    })();
  }, []);

  // GPS 정보 가져오기 (전역에 저장)
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(p => {
        (window as any).__GPS__ = { lat: p.coords.latitude, lng: p.coords.longitude };
      });
    }
  }, []);

  // 스크롤 하단 고정
  useEffect(() => { scrollRef.current?.scrollTo({ top: 9e9, behavior:'smooth' }); }, [messages.length]);

  // 메시지 추가는 항상 이 함수 하나만 사용
  const addMessage = useCallback(
    (m: ChatMessage) => {
      setMessages(prev => {
        if (prev.some(x => x.id === m.id)) return prev; 
        return [...prev, m];
      });
    }, [setMessages]
  );

  // "지니야 가자" / "지니야 보여줘" 전용 전송 핸들러
  const handleGoShowSend = useCallback(async (payload: ChatInputPayload) => {
    const q = (payload.text ?? '').trim();
    const reqId = nanoid(); 

    if (q && payload.mode !== 'show') { // show 모드에서는 onSend가 직접 ChatInputPayload를 생성하므로 여기서 addMessage 호출 안 함
      addMessage({ id: reqId+'-u', role:'user', text:q, createdAt: new Date() });
    }

    // 파일 전송 처리 (mode에 관계 없이 우선 처리)
    if (payload.files && payload.files.length > 0) {
      addMessage({ id: reqId+'-uf', role:'user', text:`${payload.files.length}장의 사진을 보냈어요.`, createdAt: new Date() });
      addMessage({ id: reqId+'-af', role:'assistant', text:'사진을 확인했어요. 어떤 점을 알려드릴까요? (예: 표지판 번역, 안내문 요약)', createdAt: new Date() });
      return; // 파일 전송만 있을 경우 더 이상 진행하지 않음
    }

    // 텍스트가 없는 경우 (파일도 없는 경우)는 이미 위에서 필터링됨
    if (!q) return; 

    if (payload.mode === 'go') {
      const apiRes = await fetch('/api/nav/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          from: payload.origin,
          to: payload.dest,
          fromPick: payload.fromPick,
          toPick: payload.toPick,
          fromCoords: payload.fromCoords, // fromCoords 추가
          gps: (window as any).__GPS__ // GPS 정보 추가
        })
      });
      let resData: any;
      try {
        resData = await apiRes.json();
      } catch (e) {
        console.error('[nav/resolve] JSON parsing error:', e);
        resData = { ok: false, error: '응답 파싱에 실패했어요.' };
      }

      if (!resData.ok) {
        addMessage({ id: reqId + '-error', role: 'assistant', text: resData.error || '길찾기 정보를 가져오는 데 실패했어요.' });
        return;
      }

      addMessage({
        id: reqId + '-go',
        role: 'assistant',
        jsx: <GoAnywhere 
          title={resData.card.title}
          subtitle={resData.card.subtitle}
          from={resData.card.from.label}
          to={resData.card.to.label}
          links={resData.card.links.map((link:any) => ({ 
            label: link.label, 
            href: link.href ?? link.url, 
            emoji: link.emoji, 
            kind: link.kind, 
          }))}
        />
      });
      return;
    } 
  }, [addMessage, mode]);

  // 일반 탭 전용 메시지 전송 핸들러
  const handleGeneralSend = useCallback(async (text: string) => {
    if (!text) return; // 빈 메시지는 전송하지 않음

    const id = nanoid(); // nanoid 사용
    addMessage({ id: id, role: 'user', text: text.trim(), createdAt: new Date() });

    setInput(''); // 입력창 비우기

    try {
      const r = await fetch('/api/ask', { // 엔드포인트는 /api/ask
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }), // prompt 형식으로 변경
      });
      const data = await r.json(); // 반드시 JSON 반환(에러 메시지도 JSON)
      if (!data.ok) {
        addMessage({ id: id + '-err', role: 'assistant', text: data.error || '답변 중 오류가 발생했어요.', createdAt: new Date() });
        return;
      }
      addMessage({ id: id + '-bot', role: 'assistant', text: data.answer, createdAt: new Date() });
    } catch {
      addMessage({ id: id + '-err', role: 'assistant', text: '네트워크 오류가 있어요.', createdAt: new Date() });
    }
  }, [addMessage, setInput]);

  // 공통 전송 핸들러 (InputBar에서 호출됨)
  const onSend = useCallback(async (payload: ChatInputPayload) => {
    if (payload.mode === 'general') {
      // 일반 모드일 경우 handleGeneralSend 호출
      handleGeneralSend(payload.text ?? '');
    } else {
      // 'go' 또는 'show' 모드일 경우 handleGoShowSend 호출
      handleGoShowSend(payload);
    }
  }, [handleGeneralSend, handleGoShowSend]);

  if (loadingTrip) return <main className="mx-auto max-w-5xl px-4 py-8">불러오는 중…</main>;

  return (
    <ChatProvider trip={trip ? { ...trip, country: Array.isArray(trip.destination) && trip.destination.length > 0 ? trip.destination[0] : undefined } : null}> 
      <main className="min-h-screen flex flex-col text-[17px] md:text-[18px] leading-[1.85] text-gray-900">
 
        <TripInfoBanner />
 
        <QuickTools />
 
        <div className="flex-1 min-h-0">
          <div className="flex gap-2 mb-2">
            <Chip label="지니야 가자" onClick={()=>switchMode('go')} emoji="🧭" 
              className={mode === 'go' ? 'bg-red-600 text-gray-900 border-red-600' : 'bg-white text-gray-800 hover:bg-gray-50'}
            />
            <Chip
              label="지니야 보여줘"
              onClick={() => switchMode('show')}
              emoji="🖼️"
              className={mode === 'show' ? 'bg-red-600 text-gray-900 border-red-600' : 'bg-white text-gray-800 hover:bg-gray-50'}
            />
            <Chip label="일반" onClick={()=>switchMode('general')} emoji="💬" 
              className={mode === 'general' ? 'bg-red-600 text-gray-900 border-red-600' : 'bg-white text-gray-800 hover:bg-gray-50'}
            />
            <Chip label="지니사용설명서" onClick={()=>router.push('/guide')} emoji="ℹ️"
              className="bg-blue-600 text-gray-900 hover:bg-blue-700"
            />
          </div>
 
          <div className="flex-1 min-h-[520px] rounded-2xl border bg-white shadow-sm overflow-hidden flex flex-col">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2">
              {messages.map(m=>(
                <div key={m.id} className={m.role==='user' ? 'flex justify-end' : 'flex'}>
                  <div className={
                    'max-w-[86%] rounded-2xl px-4 py-2 ' +
                    (m.role==='user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm')
                  }>
                    {m.jsx || m.text}
                    {m.buttons && m.buttons.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {m.buttons.map((btn, i) => (
                          <button key={i} onClick={btn.onClick} className="px-3 py-1.5 rounded-full bg-white border hover:bg-gray-50 text-[14px]">
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {m.links && m.links.length > 0 && (
                      <div className="flex flex-col gap-2 mt-2">
                        {m.links.map((link, i) => (
                          <a key={i} href={link.href} target="_blank" rel="noopener noreferrer"
                            className={`px-3 py-2 rounded-lg border text-[15px] font-semibold ${link.color} text-gray-900 hover:opacity-90`}
                          >
                            {link.emoji} {link.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
 
            <div className="border-t p-3 bg-gray-50">
              <InputBar mode={mode} trip={{ 
                embarkCountry: trip?.country, 
                embarkPortName: Array.isArray(trip?.destination) ? trip.destination[0] : trip?.destination,
                cruiseName: trip?.cruiseName
              }} onSend={onSend} onAddMessage={addMessage} generalInput={input} setGeneralInput={setInput} />
            </div>
          </div>
        </div>
 
        <HelpModal open={helpOpen} onClose={()=>setHelpOpen(false)} />
      </main>
    </ChatProvider>
  );
}
