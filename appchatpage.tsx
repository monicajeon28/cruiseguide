'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation'; // useRouter 임포트 추가
import HeaderBar from '@/components/HeaderBar';
import QuickTools from '@/components/QuickTools'; // QuickTiles 대신 QuickTools 임포트
import HelpModal from 'components/HelpModal';
import ModeBar from './components/ModeBar';
import { dd as dday, fmt } from '@/lib/date';
import SuggestChips from './components/SuggestChips';
import InputBar from '@/components/chat/InputBar'; // InputBar 임포트
import type { ChatMessage } from '@/lib/chat-types'; // ChatMessage 타입 임포트
import GoActionsCard from '@/components/GoActionsCard'; // GoActionsCard 임포트 추가
import Image from 'next/image'; // Image 컴포넌트 임포트
import PhotoAlbumModal from '@/components/PhotoAlbumModal'; // PhotoAlbumModal 임포트

type Trip = {
  cruiseName: string;
  destination: string[];
  startDate: string; endDate: string;
  nights?: number; days?: number;
};

type Mode = 'go'|'show'|'plain';
type Msg = { id:number; role:'user'|'assistant'; node:React.ReactNode };

export default function ChatPage() {
  const [trip, setTrip] = useState<Trip|null>(null);
  const [loadingTrip, setLoadingTrip] = useState(true);
  const router = useRouter(); // useRouter 훅 호출 및 할당

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [nextId, setNextId] = useState(1);
  const [text, setText] = useState('');
  const [mode, setMode] = useState<Mode>('go');

  const [helpOpen, setHelpOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  // 여행 불러오기
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/trips', { credentials:'include' });
        const j = await r.json().catch(()=>null);
        setTrip(j?.trip ?? null);
      } finally {
        setLoadingTrip(false);
      }
    })();
  }, []);

  // 스크롤 하단 고정
  useEffect(() => { scrollRef.current?.scrollTo({ top: 9e9, behavior:'smooth' }); }, [msgs.length]);

  // 첫 인사 말풍선 (제거)
  useEffect(() => {
    // setMsgs([{ id:0, role:'assistant', node:(
    //   <div>
    //     <div className="font-semibold">안녕하세요! 무엇을 도와드릴까요?</div>
    //     <div className="text-[14px] text-gray-700">
    //       지니야 가자 / 지니야 보여줘 / 일반 모드로 질문해 보세요.
    //     </div>
    //   </div>
    // )}]);
  }, []);

  const header = useMemo(() => {
    if (!trip) return null;
    const d = trip.startDate ? dday(new Date(trip.startDate)) : null;
    const dTxt = d===null ? '—' : (d>0?`D-${d}`:'D-DAY');
    const range = `${fmt(trip.startDate)} ~ ${fmt(trip.endDate)}`;
    const nd = `${trip.nights ?? '—'}박 ${trip.days ?? '—'}일`;
    const dest = (trip.destination||[]).join(', ');

    return (
      <section className="rounded-2xl border bg-white shadow-sm p-3 md:p-4 mb-3">
        <div className="text-[13px] md:text-[14px] flex items-center gap-2 text-rose-600 font-bold">
          <span>{dTxt}</span>
          <span className="text-gray-500">·</span>
          <span className="text-gray-700">{range}</span>
          <span className="text-gray-500">·</span>
          <span className="text-blue-700">{nd}</span>
        </div>
        <div className="mt-1 text-[15px] md:text-[16px] font-semibold">
          <span className="mr-1">🚢</span>
          <span className="underline underline-offset-4 text-blue-700">{trip.cruiseName}</span>
          <span className="mx-1">·</span>
          <span className="underline underline-offset-4 text-blue-700">{dest}</span>
        </div>
      </section>
    );
  }, [trip]);

  const add = (role:'user'|'assistant', node:React.ReactNode) => {
    setMsgs(m => [...m, { id: nextId, role, node }]);
    setNextId(n => n+1);
  };

  // 미국 키워드 → 항공/터미널 버튼들 (서버에서 처리하므로 제거)
  // const respondUS = () => {
  //   add('assistant', (
  //     <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
  //       <div className="font-bold mb-2">미국 관련 빠른 길찾기</div>
  //       <div className="flex flex-wrap gap-2">
  //         {[ 
  //           '미국 주요 공항 찾아줘',
  //           '마이애미 공항 → 포트미애미',
  //           '올랜도( MCO ) → 포트캐너버럴',
  //           '포트에버글레이즈(포트로더데일) 안내',
  //         ].map((t,i)=>( 
  //           <button key={i}
  //             onClick={()=>onSend(t)}
  //             className="px-3 py-1.5 rounded-full bg-white border hover:bg-gray-50 text-[14px]">
  //             {t}
  //           </button>
  //         ))}
  //       </div>
  //     </div>
  //   ));
  // };

  // 간단 라우팅형 답변 (서버에서 처리하므로 제거)
  const reply = async (q:string) => {
    // if (mode==='go' && /미국/.test(q)) { respondUS(); return; }
    // if (/공항|터미널|가는[ ]?법|가는길|가는 길/.test(q)) {
    //   add('assistant',
    //     <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
    //       <div className="font-bold mb-1">지도 네비게이션</div>
    //       <p className="text-[15px] leading-7">
    //         출발지(공항)와 도착지(크루즈 터미널)를 알려주세요. 예) <b>인천공항에서 부산 크루즈 터미널</b>
    //       </p>
    //     </div>
    //   );
    //   return;
    // }
    // add('assistant', <p>요청하신 <b>{q}</b>에 대해 준비 중이에요. 더 자세히 알려주시면 바로 안내할게요. 😊</p>);
    
    // 새로운 API 호출
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: q, mode }),
      credentials: 'include',
    });

    const data = await res.json();

    if (data.ok && Array.isArray(data.messages)) {
      data.messages.forEach((msg: ChatMessage) => {
        let node: React.ReactNode;
        switch (msg.type) {
          case 'text':
            node = <p dangerouslySetInnerHTML={{ __html: msg.text }} />;
            break;
          case 'map-links':
            node = (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <div className="font-bold mb-2">🧭 {msg.title}</div>
                <div className="flex flex-col gap-2">
                  {msg.links.map((link, i) => (
                    <a key={i} href={link.href} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-2 rounded-lg bg-white border hover:bg-gray-50 text-[15px] font-semibold"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            );
            break;
          case 'photo-gallery':
            node = (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="font-bold mb-2">📸 {msg.title || '사진 갤러리'}</div>
                <div className="grid grid-cols-2 gap-2">
                  {msg.images.slice(0, 4).map((src, i) => (
                    <Image key={i} src={src} alt="크루즈 이미지" width={150} height={100} 
                      className="rounded-md object-cover cursor-pointer" 
                      onClick={() => { setGalleryImages(msg.images); setGalleryOpen(true); }} 
                    />
                  ))}
                </div>
                {msg.images.length > 4 && (
                  <button onClick={() => { setGalleryImages(msg.images); setGalleryOpen(true); }}
                    className="mt-2 px-3 py-1.5 rounded-full bg-white border hover:bg-gray-50 text-[14px]"
                  >
                    모든 사진 보기
                  </button>
                )}
              </div>
            );
            break;
          case 'go-actions': // GoActionsCard를 위한 케이스
            node = (
              <GoActionsCard 
                originText={msg.originText} 
                destText={msg.destText} 
                urls={msg.urls} 
                onSend={onSend} 
              />
            );
            break;
          default:
            node = <p>알 수 없는 메시지 유형: {(msg as ChatMessage).type}</p>;
            break;
        }
        add('assistant', node);
      });
    } else {
      add('assistant', <p>요청 처리 중 오류가 발생했어요. 다시 시도해주세요.</p>);
    }
  };

  const onSend = (v?:string) => {
    const q = (v ?? text).trim();
    if (!q) return;
    add('user', <div className="whitespace-pre-wrap">{q}</div>);
    setText('');
    reply(q);
  };

  // 카메라(사진 불러오기)
  const onPickFiles = (files: FileList | null) => {
    if (!files || !files.length) return;
    add('user', <div>{files.length}장의 사진을 보냈어요.</div>);
    // 실제 처리(업로드/비전분석) 훅은 여기서 이어붙이면 됨.
    add('assistant', <div>사진을 확인했어요. 어떤 점을 알려드릴까요? (예: 표지판 번역, 안내문 요약)</div>);
  };

  if (loadingTrip) return <main className="mx-auto max-w-5xl px-4 py-8">불러오는 중…</main>;

  return (
    // ⬇⬇⬇ 화면 전체를 세로 플렉스로
    <main className="min-h-screen flex flex-col mx-auto max-w-5xl px-4 text-[17px] md:text-[18px] leading-[1.85] text-gray-900"> {/* pb-24 제거 */}
      <HeaderBar />

      {trip && header}

      <QuickTools /> {/* onPick prop 제거 */}

      {/* ⬇⬇⬇ 남은 공간을 전부 차지 */}
      <div className="flex-1 min-h-0">
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden flex flex-col h-full">
          <div ref={scrollRef} className="flex-1 h-full overflow-y-auto p-3 md:p-4 space-y-2"> {/* min-h-0 제거, h-full 추가 */}
            {msgs.map(m=>( 
              <div key={m.id} className={m.role==='user' ? 'flex justify-end' : 'flex'}>
                <div className={
                  'max-w-[86%] rounded-2xl px-4 py-2 ' +
                  (m.role==='user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm')
                }>
                  {m.node}
                </div>
              </div>
            ))}
          </div>

          {/* 하단 컨트롤 */}
          <div className="border-t p-2 md:p-3">
            {/* 기존의 모드바와 입력 바를 InputBar 컴포넌트로 대체 */} 
            <InputBar 
              text={text}
              setText={setText}
              onSend={onSend}
              mode={mode}
              setMode={setMode}
              onGuide={()=>router.push('/guide')}
              onPickFiles={onPickFiles}
              fileRef={fileRef}
              setHelpOpen={setHelpOpen}
            />
          </div>
        </div>
      </div>

      <HelpModal open={helpOpen} onClose={()=>setHelpOpen(false)} />
      <PhotoAlbumModal 
        open={galleryOpen} 
        onClose={() => setGalleryOpen(false)} 
        images={galleryImages}
      />
    </main>
  );
}