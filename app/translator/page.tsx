'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiCamera, FiMic, FiMicOff } from 'react-icons/fi';
import { csrfFetch } from '@/lib/csrf-client';
import TranslatorTutorial from './components/TranslatorTutorial';
import { PHRASE_CATEGORIES_DATA } from './PHRASE_CATEGORIES_DATA';
import { trackFeature } from '@/lib/analytics';

// 국가별 → 현지어 매핑
const DESTINATION_LANGUAGE_MAP: Record<string, { code: string; name: string; flag: string }> = {
  일본: { code: 'ja-JP', name: '일본어', flag: '🇯🇵' },
  중국: { code: 'zh-CN', name: '중국어', flag: '🇨🇳' },
  홍콩: { code: 'zh-HK', name: '광둥어', flag: '🇭🇰' },
  대만: { code: 'zh-TW', name: '대만어', flag: '🇹🇼' },
  미국: { code: 'en-US', name: '영어', flag: '🇺🇸' },
          // 영어는 US만 사용 (50대 이상 사용자 혼란 방지)
          // 영국: { code: 'en-GB', name: '영어', flag: '🇬🇧' },
          // 싱가포르: { code: 'en-SG', name: '영어', flag: '🇸🇬' },
  태국: { code: 'th-TH', name: '태국어', flag: '🇹🇭' },
  베트남: { code: 'vi-VN', name: '베트남어', flag: '🇻🇳' },
          // 필리핀: { code: 'en-PH', name: '영어', flag: '🇵🇭' },
  인도네시아: { code: 'id-ID', name: '인도네시아어', flag: '🇮🇩' },
  말레이시아: { code: 'ms-MY', name: '말레이어', flag: '🇲🇾' },
  프랑스: { code: 'fr-FR', name: '프랑스어', flag: '🇫🇷' },
  이탈리아: { code: 'it-IT', name: '이탈리아어', flag: '🇮🇹' },
  스페인: { code: 'es-ES', name: '스페인어', flag: '🇪🇸' },
  독일: { code: 'de-DE', name: '독일어', flag: '🇩🇪' },
  러시아: { code: 'ru-RU', name: '러시아어', flag: '🇷🇺' },
};

type ConversationItem = {
  id: string;
  from: { flag: string; name: string; code?: string }; // 언어 코드 추가
  to: { flag: string; name: string; code?: string }; // 언어 코드 추가
  source: string;
  translated: string;
  pronunciation?: string; // 한국어 발음 표시 (한국어 입력 시 또는 외국어를 한국어 발음으로)
  when: string;
  kind: 'speech' | 'photo';
};

type UserData = {
  user?: { name?: string };
  trip?: { destination?: string };
};

const STORAGE_KEY = 'translator:conversation';

export default function TranslatorPage() {
  const router = useRouter();

  // 튜토리얼 상태
  const [showTutorial, setShowTutorial] = useState(false);
  
  // 카테고리 선택 상태
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // 상황별 번역도우미 접기/펼치기 상태
  const [isPhraseHelperExpanded, setIsPhraseHelperExpanded] = useState(true);
  // 발음 캐시 (phrase.target -> pronunciation)
  const [pronunciationCache, setPronunciationCache] = useState<Record<string, string>>({});
  
  // 마이크 권한 상태 (전역으로 관리하여 모든 에러 핸들러에서 접근 가능)
  const micPermissionRef = useRef<boolean>(false);

  // 기본 현지어는 영어(US)로 시작(API 로드 후 교체)
  const [localLang, setLocalLang] = useState({ code: 'en-US', name: '영어', flag: '🇺🇸' });
  const [destination, setDestination] = useState<string>('확인 중...');
  const [portInfo, setPortInfo] = useState<string>('');
  const [isCruising, setIsCruising] = useState(false);

  // 첫 방문 시 튜토리얼 표시
  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenTranslatorTutorial');
    if (!hasSeen) {
      setTimeout(() => setShowTutorial(true), 1000);
    }
  }, []);

  // 회의록
  const [items, setItems] = useState<ConversationItem[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setItems(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // 음성 인식 객체
  const recRef = useRef<SpeechRecognition | null>(null);
  const [listening, setListening] = useState<'none' | 'pressing' | 'recording'>('none');
  const [preview, setPreview] = useState('');
  const [finalText, setFinalText] = useState(''); // 최종 확정된 텍스트
  const [interimText, setInterimText] = useState(''); // 인식 중인 텍스트 (실시간 업데이트)

  // 카메라 입력
  const fileRef = useRef<HTMLInputElement>(null);

  // 기능 사용 추적
  useEffect(() => {
    trackFeature('translator');
  }, []);

  // 현재 날짜의 기항지 정보를 읽어 현지어 자동 설정
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/itinerary/current', { credentials: 'include' });
        const data = await res.json();
        
        if (!data.ok) {
          setDestination('여행 정보 없음');
          return;
        }

        if (!data.hasTrip) {
          setDestination('여행 미등록');
          return;
        }

        if (data.isCruising) {
          setDestination('항해 중 🚢');
          setPortInfo('현재 항해 중입니다');
          setIsCruising(true);
          // 항해 중에는 영어 유지
          return;
        }

        // 기항지 정보가 있는 경우
        if (data.currentPort) {
          const port = data.currentPort;
          setDestination(port.location || '알 수 없음');
          // 영어는 US로 통일 (en-GB, en-SG 등도 en-US로 변환)
          const portLang = port.language;
          if (portLang && portLang.code && portLang.code.startsWith('en-') && portLang.code !== 'en-US') {
            setLocalLang({ code: 'en-US', name: '영어', flag: '🇺🇸' });
          } else {
            setLocalLang(portLang || { code: 'en-US', name: '영어', flag: '🇺🇸' });
          }
          setIsCruising(false);
          
          // 기항지 상세 정보
          const arrival = port.arrival ? ` 입항 ${port.arrival}` : '';
          const departure = port.departure ? ` 출항 ${port.departure}` : '';
          setPortInfo(`${port.country || ''}${arrival}${departure}`.trim());
        } else {
          setDestination('일정 정보 없음');
        }
      } catch (error) {
        console.error('Error loading current itinerary:', error);
        setDestination('로드 실패');
      }
    })();
  }, []);

  // 음성인식 초기화(webkit + 표준 둘 다 커버)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SR: any =
      window.webkitSpeechRecognition || (window as any).SpeechRecognition;

    if (!SR) {
      console.warn('이 브라우저는 음성 인식을 지원하지 않습니다.');
      recRef.current = null; // 명시적으로 null 설정
      return;
    }

    const recog = new SR();
    recog.continuous = true; // 긴 문장 인식을 위해 continuous 모드 활성화
    recog.interimResults = true; // 중간 결과도 표시
    recog.maxAlternatives = 1; // 최대 대안 수
    recog.lang = 'ko-KR'; // 기본 언어 (나중에 변경됨)

    recog.onerror = (e: any) => {
      console.warn('[SpeechRecognition error]', e?.error);
      // 권한 문제 등 친절 메시지 (TODO: 사용자에게 알림)
    };
    recog.onend = () => {
      // 버튼 뗐거나, 자동 종료
      // 이 부분은 startPressToTalk/stopPressToTalk 로직과 연동되므로 listening 상태만 idle로
      setListening('none');
      setPreview('');
      setFinalText('');
      setInterimText('');
    };

    recRef.current = recog;
  }, []);

  // 외국어를 한국어 발음으로 변환하는 함수 (캐시 포함, 재시도 로직 추가)
  async function getPronunciation(foreignText: string, langCode: string, useCache = true, retryCount = 0): Promise<string> {
    try {
      // 한국어인 경우 불필요
      if (langCode === 'ko-KR' || langCode === 'ko') {
        return '';
      }
      
      // 캐시 확인
      const cacheKey = `${foreignText}_${langCode}`;
      if (useCache && pronunciationCache[cacheKey]) {
        return pronunciationCache[cacheKey];
      }
      
      console.log('[Pronunciation] Calling API:', { text: foreignText, langCode, cacheKey, retryCount });
      const res = await csrfFetch('/api/translation/pronunciation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: foreignText, langCode }),
      });
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        console.error('[Pronunciation] API error:', res.status, res.statusText, errorText);
        
        // 재시도 (최대 2번)
        if (retryCount < 2) {
          console.log(`[Pronunciation] Retrying... (${retryCount + 1}/2)`);
          await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1))); // 지수 백오프
          return getPronunciation(foreignText, langCode, useCache, retryCount + 1);
        }
        
        return '';
      }
      
      const data = await res.json();
      console.log('[Pronunciation] API response:', JSON.stringify(data, null, 2));
      
      if (!data.ok) {
        console.error('[Pronunciation] API returned error:', data.error);
        
        // 재시도 (최대 2번)
        if (retryCount < 2) {
          console.log(`[Pronunciation] Retrying after error... (${retryCount + 1}/2)`);
          await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)));
          return getPronunciation(foreignText, langCode, useCache, retryCount + 1);
        }
        
        return '';
      }
      
      let pronunciation = data?.pronunciation || '';
      
      if (!pronunciation) {
        console.error('[Pronunciation] Empty pronunciation in API response:', data);
        
        // 재시도 (최대 2번)
        if (retryCount < 2) {
          console.log(`[Pronunciation] Retrying after empty response... (${retryCount + 1}/2)`);
          await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)));
          return getPronunciation(foreignText, langCode, useCache, retryCount + 1);
        }
        
        return '';
      }
      
      // 이미 괄호가 포함되어 있으면 그대로 사용
      if (pronunciation && !pronunciation.trim().startsWith('(')) {
        pronunciation = `(${pronunciation.trim()})`;
      }
      
      console.log('[Pronunciation] Final pronunciation:', pronunciation);
      
      // 캐시에 저장
      if (useCache && pronunciation) {
        setPronunciationCache(prev => {
          const newCache = { ...prev, [cacheKey]: pronunciation };
          console.log('[Pronunciation] Updated cache:', newCache);
          return newCache;
        });
      }
      
      return pronunciation;
    } catch (error: any) {
      console.warn('[Pronunciation] Error:', error);
      
      // 재시도 (최대 2번)
      if (retryCount < 2) {
        console.log(`[Pronunciation] Retrying after exception... (${retryCount + 1}/2)`);
        await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)));
        return getPronunciation(foreignText, langCode, useCache, retryCount + 1);
      }
      
      return ''; // 실패 시 빈 문자열 반환 (번역은 계속 진행)
    }
  }

  // 선택된 카테고리의 문장들 - 발음은 이미 PHRASE_CATEGORIES에 포함되어 있으므로 API 호출 불필요

  // 번역(서버 측 /api/chat 사용) — "결과만" 받도록 프롬프트 + 부분 번역 지원
  async function translateText(text: string, fromLabel: string, toLabel: string) {
    try {
      // 언어 이름을 영어로 변환
      const fromEnglish = getEnglishLanguageName(fromLabel);
      const toEnglish = getEnglishLanguageName(toLabel);

      console.log(`[Translation] Translating from ${fromLabel}(${fromEnglish}) to ${toLabel}(${toEnglish}):`, text);

      // 텍스트가 비어있거나 너무 짧으면 그대로 반환
      if (!text || text.trim().length === 0) {
        return { translated: text, pronunciation: '' };
      }

      const res = await csrfFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Translate the following text from ${fromEnglish} to ${toEnglish}. Translate completely even if the text is long or partially unclear. Only provide the translation result in ${toEnglish}, no explanations:\n\n"${text}"\n\nTranslation in ${toEnglish}:`,
          mode: 'translate',
          from: fromEnglish, // 영어 언어 정보 전달
          to: toEnglish, // 영어 언어 정보 전달
        }),
      });
      
      if (!res.ok) {
        console.error('[Translation] API error:', res.status, res.statusText);
        // API 오류 시 원문 반환 (부분 번역 시도 안 함)
        return { translated: text, pronunciation: '' };
      }
      
      const data = await res.json();
      
      // 백엔드 응답 구조에 맞춰 추출
      let translated = '';
      if (data?.messages && Array.isArray(data.messages)) {
        const textMessage = data.messages.find((m: any) => m?.type === 'text' && m?.text);
        translated = textMessage?.text || '';
      } else if (data?.message) {
        translated = data.message;
      } else if (typeof data === 'string') {
        translated = data;
      }
      
      // ⚠️ 중요: 번역 실패 감지
      if (!data.ok) {
        console.error('[Translation] API returned error:', data.error);
        // 에러 시 원문 반환 (alert 제거 - 사용자 경험 개선)
        return { translated: text, pronunciation: '' };
      }
      
      // 에러 메시지 감지
      if (translated && (translated.includes('번역 중 오류가 발생했습니다') || translated.includes('번역에 실패했습니다'))) {
        console.error('[Translation] Error message in response');
        return { translated: text, pronunciation: '' }; // 원문 반환
      }
      
      // 번역 결과가 없거나 빈 문자열인 경우
      if (!translated || translated.trim() === '') {
        console.error('[Translation] Empty translation received');
        return { translated: text, pronunciation: '' }; // 원문 반환
      }
      
      // ⚠️ 중요: 번역 결과가 원문과 동일하면 실패 처리 (하지만 원문 반환)
      const trimmedTranslated = translated.trim();
      const trimmedOriginal = text.trim();
      
      if (trimmedTranslated === trimmedOriginal && trimmedOriginal.length > 3) {
        console.warn('[Translation] Translation same as original - returning original');
        return { translated: text, pronunciation: '' }; // 원문 반환 (alert 제거)
      }
      
      return { translated: trimmedTranslated, pronunciation: '' };
    } catch (error: any) {
      console.error('[Translation] Error:', error);
      return { translated: text, pronunciation: '' }; // 에러 시 원문 반환
    }
  }

  // 말하기(TTS)
  function speak(text: string, langCode: string) {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langCode;
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }

  // 공통 음성 인식 시작(길게 누르는 동안)
  async function startPressToTalk(from: { code: string; name: string; flag: string }, to: { code: string; name: string; flag: string }) {
    if (!recRef.current) {
      alert('❌ 이 브라우저는 음성 인식을 지원하지 않습니다.\n\n음성 인식을 지원하는 브라우저(Chrome, Edge, Safari 등)를 사용해주세요.');
      return;
    }
    
    try {
      recRef.current.abort?.(); // 혹시 켜져있으면 끊고 시작
    } catch (e) {
      console.error("Error aborting speech recognition:", e);
    }

    setListening('pressing');
    setPreview('마이크 준비 중...');
    setFinalText('');
    setInterimText('');

    // ⚡ 마이크 권한 확인 및 Speech Recognition 시작
    try {
      // 1단계: 실제 마이크 권한 확인 (getUserMedia로 확실하게 확인)
      micPermissionRef.current = false; // 초기화
      
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          // Permissions Policy 경고는 무시하고 getUserMedia 시도
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch((err) => {
            // Permissions Policy 경고는 무시 (실제 권한은 있을 수 있음)
            console.log('[getUserMedia] Caught error (may be Permissions Policy warning):', err);
            throw err;
          });
          stream.getTracks().forEach(track => track.stop());
          micPermissionRef.current = true; // ✅ 권한 확인됨 - 전역 상태 저장
          setPreview('✅ 마이크 준비됨! 말씀하세요...');
        } catch (mediaError: any) {
          // 권한이 실제로 거부된 경우만 false 유지
          if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
            micPermissionRef.current = false;
          } else {
            // 다른 오류는 권한은 있을 수 있으므로 true로 설정
            micPermissionRef.current = true;
          }
        }
      } else {
        // getUserMedia 지원 안 함 - 일단 시도 (권한 체크 불가능)
        micPermissionRef.current = true;
      }

      // 2단계: Speech Recognition 시작
    const r = recRef.current!;
      if (!r) {
        alert('❌ 음성 인식 초기화에 실패했습니다.');
        setListening('none');
        setPreview('');
        return;
      }
      
      // 음성 인식 언어 설정
    r.lang = from.code;

    let accumulatedFinalText = '';
      
    r.onresult = (e: SpeechRecognitionEvent) => {
      let newFinalText = accumulatedFinalText;
      let newInterimText = '';
      
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          newFinalText += chunk + ' ';
          accumulatedFinalText = newFinalText;
        } else {
          newInterimText = chunk;
        }
      }
      
      // 상태 업데이트 - 인식 과정을 실시간으로 표시
      setFinalText(newFinalText.trim());
      setInterimText(newInterimText);
      
      // 프리뷰 텍스트 업데이트 (최종 + 중간 합쳐서)
      const displayText = (newFinalText.trim() + ' ' + newInterimText).trim();
      setPreview(displayText || '🎤 듣는 중...');
    };
      
      r.onstart = () => {
        setListening('recording');
        setPreview('🎤 말씀하세요...');
        setFinalText('');
        setInterimText('');
      };
      
      r.onerror = (e: any) => {
        const errorType = e?.error || 'unknown';
        
        // ⚡ 권한이 허용된 경우 → 모든 에러 조용히 처리 (메시지 없음)
        if (micPermissionRef.current) {
          console.log('[Speech Recognition] Permission granted, error silently handled:', errorType);
      setListening('none');
      setPreview('');
          return; // 조용히 종료 (사용자에게 알림 안 함)
        }
        
        // 권한이 거부된 경우만 에러 처리
      setListening('none');
      setPreview('');
        
        if (errorType === 'not-allowed' || errorType === 'permission-denied') {
          alert('❌ 마이크 권한이 필요합니다.\n\n💡 해결 방법:\n1. 브라우저 주소창 왼쪽 🔒 아이콘 클릭\n2. "마이크" → "허용" 선택\n3. 페이지 새로고침 (F5)\n4. 버튼을 다시 눌러주세요');
        } else if (errorType === 'no-speech') {
          // 말이 없으면 조용히 처리 (알림 없음)
          console.log('음성이 감지되지 않았습니다.');
        } else if (errorType === 'network') {
          alert('⚠️ 네트워크 오류가 발생했습니다.\n인터넷 연결을 확인해주세요.');
        } else {
          // 다른 에러는 조용히 로그만
          console.error('[Speech Recognition Error]', errorType);
        }
      };
      
      // 음성 인식 시작
      try {
    r.start();
      } catch (startError: any) {
        // ⚡ 권한이 허용된 경우 → 에러 무시 (메시지 없음)
        if (micPermissionRef.current) {
          console.log('[Speech Recognition Start] Permission granted, error silently handled:', startError);
          setListening('none');
          setPreview('');
          return; // 조용히 종료
        }
        
        // 권한이 거부된 경우만 에러 처리
        console.error('[Speech Recognition Start Error]', startError);
        setListening('none');
        setPreview('');
        
        if (startError?.name === 'NotAllowedError' || startError?.message?.includes('permission')) {
          alert('❌ 마이크 권한이 필요합니다.\n\n💡 해결 방법:\n1. 브라우저 주소창 왼쪽 🔒 아이콘 클릭\n2. "마이크" → "허용" 선택\n3. 페이지 새로고침 (F5)\n4. 버튼을 다시 눌러주세요');
        } else {
          // 다른 오류는 조용히 처리
          console.error('[Speech Recognition Start]', startError);
        }
        return;
      }

    // 손을 떼면 stopListening 호출에서 번역/추가
    (r as any).__translatePair = { from, to };
    (r as any).__acc = () => {
      // 최종 텍스트와 중간 텍스트를 합쳐서 반환
      const combined = (accumulatedFinalText + ' ' + (interimText || '')).trim();
      return combined || accumulatedFinalText.trim();
    };
      
    } catch (error: any) {
      // ⚡ 권한이 허용된 경우 → 에러 무시 (메시지 없음)
      if (micPermissionRef.current) {
        console.log('[Speech Recognition] Permission granted, catch block error silently handled:', error);
        setListening('none');
        setPreview('');
        return; // 조용히 종료
      }
      
      // 권한이 거부된 경우만 에러 처리
      console.error('[Start Speech Recognition Error]', error);
      setListening('none');
      setPreview('');
      
      if (error?.name === 'NotAllowedError' || error?.message?.includes('permission')) {
        alert('❌ 마이크 권한이 필요합니다.\n\n💡 해결 방법:\n1. 브라우저 주소창 왼쪽 🔒 아이콘 클릭\n2. "마이크" → "허용" 선택\n3. 페이지 새로고침 (F5)\n4. 버튼을 다시 눌러주세요');
      } else {
        // 예상치 못한 에러는 조용히 로그만
        console.error('[Speech Recognition] Unexpected error:', error);
      }
    }
  }

  async function stopPressToTalk() {
    const r: any = recRef.current;
    if (!r) return;
    try {
      r.stop();
    } catch {}
    setListening('none');
    const pair = r.__translatePair as { from: any; to: any } | undefined;
    const acc = typeof r.__acc === 'function' ? r.__acc() : '';
    
    // 최종 텍스트가 있으면 사용, 없으면 상태에서 가져오기
    const finalAcc = acc || (finalText + ' ' + interimText).trim();
    
    // 상태 초기화
    setPreview('');
    setFinalText('');
    setInterimText('');
    
    if (!pair || !finalAcc) return;

    const { translated } = await translateText(finalAcc, pair.from.name, pair.to.name);
    
    // 발음 생성 제거 - 번역 속도 개선을 위해
    const newItem = {
      id: Date.now().toString(),
      from: { flag: pair.from.flag, name: pair.from.name, code: pair.from.code },
      to: { flag: pair.to.flag, name: pair.to.name, code: pair.to.code },
      source: finalAcc,
      translated,
      when: new Date().toLocaleTimeString('ko-KR'),
      kind: 'speech' as const,
    };
    
    setItems((prev) => [newItem, ...prev]);
    
    // 들려주는 쪽은 목적 언어
    speak(translated, pair.to.code);
  }

  // 사진 번역
  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await csrfFetch('/api/vision', { method: 'POST', body: fd });
      
      if (!res.ok) {
        throw new Error(`서버 오류: ${res.status}`);
      }
      
      const data = await res.json();
      
      // API 응답이 실패했을 때 처리
      if (!data?.success) {
        const errorMsg = data?.error || data?.translatedText || '이미지 분석에 실패했습니다. 다시 시도해주세요.';
        alert(`❌ ${errorMsg}`);
        return;
      }
      
      // 한국어 번역 결과만 사용 (원본 텍스트 제거, TTS 비활성화)
      const translated = data?.translatedText || data?.fullResponse || '번역 실패';
      
      setItems((prev) => [
        {
          id: Date.now().toString(),
          from: { flag: '🖼️', name: '이미지', code: undefined },
          to: { flag: '🇰🇷', name: '한국어', code: 'ko-KR' }, // 언어 코드 추가
          source: '', // 원본 텍스트 제거
          translated, // 한국어 번역만 표시
          when: new Date().toLocaleTimeString('ko-KR'),
          kind: 'photo',
        },
        ...prev,
      ]);
      // TTS 제거: speak(translated, 'ko-KR'); 삭제 - 문자로만 표시
    } catch (error: any) {
      console.error('[Photo Translation Error]', error);
      const errorMsg = error?.message || '이미지 분석 중 오류가 발생했습니다.';
      alert(`❌ ${errorMsg}\n\n💡 해결 방법:\n1. 이미지 파일이 올바른 형식인지 확인 (JPG, PNG)\n2. 이미지 크기가 너무 크지 않은지 확인\n3. 인터넷 연결 확인`);
    } finally {
      // 같은 파일 다시 선택 가능하도록 reset
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  // 언어 이름을 한국어에서 영어로 변환 (API 호출용) - API와 동일한 매핑 사용
  function getEnglishLanguageName(koreanName: string): string {
    const languageMap: Record<string, string> = {
      '한국어': 'Korean',
      'Korean': 'Korean',
      'ko-KR': 'Korean',
      'ko': 'Korean',
      '영어': 'English',
      'English': 'English',
      'en-US': 'English',
      'en-GB': 'English',
      'en': 'English',
      '일본어': 'Japanese',
      'Japanese': 'Japanese',
      'ja-JP': 'Japanese',
      'ja': 'Japanese',
      '중국어': 'Simplified Chinese',
      'Simplified Chinese': 'Simplified Chinese',
      'zh-CN': 'Simplified Chinese',
      '광둥어': 'Cantonese',
      'Cantonese': 'Cantonese',
      'zh-HK': 'Cantonese',
      '대만어': 'Traditional Chinese',
      'Traditional Chinese': 'Traditional Chinese',
      'zh-TW': 'Traditional Chinese',
      '태국어': 'Thai',
      'Thai': 'Thai',
      'th-TH': 'Thai',
      'th': 'Thai',
      '베트남어': 'Vietnamese',
      'Vietnamese': 'Vietnamese',
      'vi-VN': 'Vietnamese',
      'vi': 'Vietnamese',
      '인도네시아어': 'Indonesian',
      'Indonesian': 'Indonesian',
      'id-ID': 'Indonesian',
      'id': 'Indonesian',
      '말레이어': 'Malay',
      'Malay': 'Malay',
      'ms-MY': 'Malay',
      'ms': 'Malay',
      '프랑스어': 'French',
      'French': 'French',
      'fr-FR': 'French',
      'fr': 'French',
      '이탈리아어': 'Italian',
      'Italian': 'Italian',
      'it-IT': 'Italian',
      'it': 'Italian',
      '스페인어': 'Spanish',
      'Spanish': 'Spanish',
      'es-ES': 'Spanish',
      'es': 'Spanish',
      '독일어': 'German',
      'German': 'German',
      'de-DE': 'German',
      'de': 'German',
      '러시아어': 'Russian',
      'Russian': 'Russian',
      'ru-RU': 'Russian',
      'ru': 'Russian',
    };
    return languageMap[koreanName] || koreanName;
  }

  // 발음 표시 컴포넌트 (동적 로딩)
  function PronunciationDisplay({ phrase, langCode, pronunciationCache }: {
    phrase: { target: string; pronunciation?: string };
    langCode?: string;
    pronunciationCache: Record<string, string>;
  }) {
    const cacheKey = langCode ? `${phrase.target}_${langCode}` : '';
    const pronunciation = phrase.pronunciation || (cacheKey ? pronunciationCache[cacheKey] : '');

    if (!pronunciation || langCode === 'ko-KR') return null;

    return (
      <div className="text-xs text-gray-500 italic mt-1">
        💬 {pronunciation}
      </div>
    );
  }

  // 카테고리별 빠른 문장 데이터 (50대 이상 사용자 친화적)
  type PhraseCategory = {
    id: string;
    name: string;
    emoji: string;
    phrases: Array<{ ko: string; target: string; pronunciation?: string; emoji: string }>;
  };

  // 사용자가 제공한 샘플 데이터 사용 (발음 포함)
  const PHRASE_CATEGORIES: Record<string, PhraseCategory[]> = PHRASE_CATEGORIES_DATA as Record<string, PhraseCategory[]>;
  // 빠른 문장 데이터 (자주 쓰는 문장) - 하위 호환을 위해 유지
  const QUICK_PHRASES: Record<string, Array<{ ko: string; target: string; emoji: string }>> = {
    'ja-JP': [ // 일본어
      { ko: '화장실이 어디에요?', target: 'トイレはどこですか？', emoji: '🚻' },
      { ko: '얼마예요?', target: 'いくらですか？', emoji: '💰' },
      { ko: '이거 주세요', target: 'これをください', emoji: '🛒' },
      { ko: '맛있어요', target: 'おいしいです', emoji: '😋' },
      { ko: '감사합니다', target: 'ありがとうございます', emoji: '🙏' },
      { ko: '천천히 말해주세요', target: 'ゆっくり話してください', emoji: '🗣️' },
      { ko: '사진 찍어도 되나요?', target: '写真を撮ってもいいですか？', emoji: '📷' },
      { ko: '도와주세요', target: '助けてください', emoji: '🆘' },
    ],
    'zh-CN': [ // 중국어
      { ko: '화장실이 어디에요?', target: '厕所在哪里？', emoji: '🚻' },
      { ko: '얼마예요?', target: '多少钱？', emoji: '💰' },
      { ko: '이거 주세요', target: '我要这个', emoji: '🛒' },
      { ko: '맛있어요', target: '好吃', emoji: '😋' },
      { ko: '감사합니다', target: '谢谢', emoji: '🙏' },
      { ko: '천천히 말해주세요', target: '请慢点说', emoji: '🗣️' },
      { ko: '사진 찍어도 되나요?', target: '可以拍照吗？', emoji: '📷' },
      { ko: '도와주세요', target: '请帮帮我', emoji: '🆘' },
    ],
    'zh-TW': [ // 대만어
      { ko: '화장실이 어디에요?', target: '洗手間在哪裡？', emoji: '🚻' },
      { ko: '얼마예요?', target: '多少錢？', emoji: '💰' },
      { ko: '이거 주세요', target: '我要這個', emoji: '🛒' },
      { ko: '맛있어요', target: '好吃', emoji: '😋' },
      { ko: '감사합니다', target: '謝謝', emoji: '🙏' },
      { ko: '천천히 말해주세요', target: '請慢點說', emoji: '🗣️' },
      { ko: '사진 찍어도 되나요?', target: '可以拍照嗎？', emoji: '📷' },
      { ko: '도와주세요', target: '請幫幫我', emoji: '🆘' },
    ],
    'en-US': [ // 영어
      { ko: '화장실이 어디에요?', target: 'Where is the bathroom?', emoji: '🚻' },
      { ko: '얼마예요?', target: 'How much is it?', emoji: '💰' },
      { ko: '이거 주세요', target: 'I\'ll take this', emoji: '🛒' },
      { ko: '맛있어요', target: 'It\'s delicious', emoji: '😋' },
      { ko: '감사합니다', target: 'Thank you', emoji: '🙏' },
      { ko: '천천히 말해주세요', target: 'Please speak slowly', emoji: '🗣️' },
      { ko: '사진 찍어도 되나요?', target: 'Can I take a photo?', emoji: '📷' },
      { ko: '도와주세요', target: 'Please help me', emoji: '🆘' },
    ],
    'it-IT': [ // 이탈리아어
      { ko: '화장실이 어디에요?', target: 'Dov\'è il bagno?', emoji: '🚻' },
      { ko: '얼마예요?', target: 'Quanto costa?', emoji: '💰' },
      { ko: '이거 주세요', target: 'Prendo questo', emoji: '🛒' },
      { ko: '맛있어요', target: 'È delizioso', emoji: '😋' },
      { ko: '감사합니다', target: 'Grazie', emoji: '🙏' },
      { ko: '천천히 말해주세요', target: 'Per favore, parli lentamente', emoji: '🗣️' },
      { ko: '사진 찍어도 되나요?', target: 'Posso fare una foto?', emoji: '📷' },
      { ko: '도와주세요', target: 'Aiuto', emoji: '🆘' },
    ],
  };

  // 버튼 정의(선택한 언어에 맞게 동적으로 생성)
  const BTN_PAIRS = [
    // 항상 한국어 ↔ 영어(US) 버튼
    { label: '🇰🇷 한국어 → 🇺🇸 영어', from: { code: 'ko-KR', name: '한국어', flag: '🇰🇷' }, to: { code: 'en-US', name: '영어', flag: '🇺🇸' } },
    { label: '🇺🇸 영어 → 🇰🇷 한국어', from: { code: 'en-US', name: '영어', flag: '🇺🇸' }, to: { code: 'ko-KR', name: '한국어', flag: '🇰🇷' } },
    // 선택한 언어에 맞는 버튼 (영어가 아닌 경우만 표시)
    ...(localLang.code !== 'en-US' ? [
      { label: `🇰🇷 한국어 → ${localLang.flag} ${localLang.name}`, from: { code: 'ko-KR', name: '한국어', flag: '🇰🇷' }, to: localLang },
      { label: `${localLang.flag} ${localLang.name} → 🇰🇷 한국어`, from: localLang, to: { code: 'ko-KR', name: '한국어', flag: '🇰🇷' } },
    ] : []),
  ];

  return (
    <>
      {/* 튜토리얼 */}
      {showTutorial && (
        <TranslatorTutorial onComplete={() => setShowTutorial(false)} />
      )}
      
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 text-gray-900 flex flex-col">
      {/* 헤더 */}
      <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur px-4 py-4 md:py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <button onClick={() => router.push('/chat')} className="inline-flex items-center gap-2 text-gray-700 hover:text-black text-lg md:text-xl font-semibold">
            <FiArrowLeft size={24} className="md:w-6 md:h-6" />
            <span className="font-medium">뒤로가기</span>
          </button>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">AI 통번역기</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-3 rounded-xl bg-green-600 text-white px-6 md:px-8 py-4 md:py-5 text-lg md:text-xl font-bold shadow-lg hover:bg-green-700 active:scale-95 transition-all"
            >
              <FiCamera size={28} className="md:w-8 md:h-8" />
              <span>📷 사진으로 번역</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onPickImage} className="hidden" />
          </div>
        </div>
        <div className="max-w-3xl mx-auto mt-3 flex flex-col sm:flex-row sm:items-center gap-3 text-base md:text-lg">
          <div className={`inline-flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-lg ${
            isCruising ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
          }`}>
            <span className="text-xl md:text-2xl">{isCruising ? '⛵' : '🏝️'}</span>
            <span className="font-semibold">
              {isCruising ? '항해 중' : `현재 기항지: ${destination}`}
            </span>
          </div>
          {/* 언어 선택 드롭다운 */}
          <div className="relative">
            <select
              value={localLang.code}
              onChange={(e) => {
                const selectedCode = e.target.value;
                const selectedLang = Object.values(DESTINATION_LANGUAGE_MAP).find(lang => lang.code === selectedCode) 
                  || { code: 'en-US', name: '영어', flag: '🇺🇸' };
                setLocalLang(selectedLang);
                setSelectedCategory(null); // 언어 변경 시 카테고리 초기화
              }}
              className="
                inline-flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-lg 
                bg-purple-50 text-purple-700 font-semibold text-base md:text-lg
                border-2 border-purple-200
                hover:border-purple-400 focus:border-purple-500
                cursor-pointer appearance-none
                pr-10 min-w-[160px] md:min-w-[180px]
              "
            >
              {Object.values(DESTINATION_LANGUAGE_MAP).map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-purple-700 text-lg">
              ▼
            </span>
          </div>
          {portInfo && (
            <div className="text-sm md:text-base text-gray-500">
              {portInfo}
            </div>
          )}
        </div>
      </header>

      {/* 본문 */}
      <main className="max-w-3xl mx-auto w-full flex-1 px-4 py-6 md:py-8">
        {/* 프리뷰(인식 중) - 개선된 버전: 인식 과정을 실시간으로 표시 */}
        {listening !== 'none' && (
          <div className="rounded-xl border-2 border-blue-400 bg-gradient-to-r from-blue-50 to-purple-50 p-6 md:p-8 mb-6 shadow-lg">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full ${listening === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`}></div>
              <span className="text-base md:text-lg font-semibold text-gray-600">
                {listening === 'recording' ? '🎤 인식 중...' : '⏳ 준비 중...'}
              </span>
            </div>
            <div className="text-center min-h-[100px] md:min-h-[120px] flex flex-col justify-center">
              {finalText || interimText ? (
                <div className="space-y-4">
                  {/* 최종 확정된 텍스트 (검은색, 굵게) */}
                  {finalText && (
                    <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 break-words px-2 leading-relaxed">
                      {finalText}
                    </div>
                  )}
                  {/* 인식 중인 텍스트 (회색, 기울임, 깜빡이는 커서) */}
                  {interimText && (
                    <div className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-500 italic break-words px-2 leading-relaxed">
                      {interimText}
                      <span className="inline-block w-2 h-6 md:h-8 bg-gray-400 ml-1 animate-pulse">|</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-600 leading-relaxed">
                  {preview || '🎤 말씀하세요...'}
                </div>
              )}
            </div>
            {/* 진행 표시 (인식 중일 때만) */}
            {listening === 'recording' && (
              <div className="mt-4 flex items-center justify-center gap-1">
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            )}
          </div>
        )}

        {/* ⚡ 카테고리별 빠른 문장 (50대 이상 사용자 친화적) */}
        {destination !== '확인 중...' && destination !== '여행 미등록' && (
          <div className="mb-6 md:mb-8 bg-gradient-to-r from-blue-50 to-purple-50 p-6 md:p-8 rounded-2xl border-2 border-blue-200 shadow-md">
            <button
              onClick={() => setIsPhraseHelperExpanded(!isPhraseHelperExpanded)}
              className="w-full text-left"
            >
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold mb-5 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity leading-tight">
                <span className="text-2xl md:text-3xl">⚡</span>
                <span>상황별 번역 도우미</span>
                <span className="text-sm md:text-base font-normal text-gray-600">(카테고리 클릭 → 문장 선택)</span>
                <span className="ml-auto text-2xl md:text-3xl transition-transform duration-200" style={{ transform: isPhraseHelperExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                  ▼
                </span>
              </h3>
            </button>
            
            {/* 카테고리 버튼 (선택된 카테고리가 없을 때) - 접힘 상태일 때 숨김 */}
            {isPhraseHelperExpanded && !selectedCategory && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-5 mb-5">
                {(PHRASE_CATEGORIES[localLang.code] || PHRASE_CATEGORIES['en-US'] || []).map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className="
                      p-6 md:p-8 bg-white border-2 border-blue-300 rounded-xl 
                      hover:border-blue-500 hover:shadow-lg
                      active:scale-95 transition-all min-h-[120px] md:min-h-[140px]
                      flex flex-col items-center justify-center gap-3 shadow-md
                    "
                  >
                    <span className="text-5xl md:text-6xl">{category.emoji}</span>
                    <span className="font-bold text-base md:text-lg text-center leading-tight">{category.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* 선택된 카테고리의 문장들 - 접힘 상태일 때 숨김 */}
            {isPhraseHelperExpanded && selectedCategory && (
              <div>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="mb-5 px-5 md:px-6 py-3 md:py-3.5 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold text-base md:text-lg transition-all shadow-md"
                >
                  ← 카테고리 목록으로
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                  {((PHRASE_CATEGORIES[localLang.code] || PHRASE_CATEGORIES['en-US'] || []).find(c => c.id === selectedCategory)?.phrases || []).map((phrase, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        // 발음은 이미 PHRASE_CATEGORIES에 포함되어 있음
                        setItems(prev => [{
                          id: Date.now().toString(),
                          from: { flag: '🇰🇷', name: '한국어', code: 'ko-KR' }, // 언어 코드 추가
                          to: { flag: localLang.flag, name: localLang.name, code: localLang.code }, // 언어 코드 추가
                          source: phrase.ko,
                          translated: phrase.target,
                          pronunciation: phrase.pronunciation, // 발음 추가 (이미 데이터에 포함)
                          when: new Date().toLocaleTimeString('ko-KR'),
                          kind: 'speech',
                        }, ...prev]);
                        speak(phrase.target, localLang.code);
                      }}
                      className="
                        p-5 md:p-6 bg-white border-2 border-blue-300 rounded-xl 
                        text-left hover:border-blue-500 hover:shadow-lg
                        active:scale-95 transition-all min-h-[120px] md:min-h-[140px]
                        shadow-md
                      "
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl md:text-4xl">{phrase.emoji}</span>
                        <span className="font-bold text-lg md:text-xl flex-1 leading-tight">{phrase.ko}</span>
                        {/* 한국어 재생 버튼 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speak(phrase.ko, 'ko-KR');
                          }}
                          className="text-gray-500 hover:text-gray-700 active:scale-110 transition-all text-xl md:text-2xl"
                          title="한국어로 재생"
                        >
                          🔊
                        </button>
                      </div>
                      <div className="flex items-center gap-3 mb-2 overflow-hidden">
                        <div className="text-base md:text-lg text-gray-700 font-semibold flex-1 leading-relaxed break-words min-w-0">{phrase.target}</div>
                        {/* 외국어 재생 버튼 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speak(phrase.target, localLang.code);
                          }}
                          className="text-blue-500 hover:text-blue-700 active:scale-110 transition-all text-xl md:text-2xl flex-shrink-0"
                          title={`${localLang.name}로 재생`}
                        >
                          🔊
                        </button>
                      </div>
                      {/* 발음 표시 - PHRASE_CATEGORIES에 있거나 캐시에 있으면 표시 */}
                      <PronunciationDisplay 
                        phrase={phrase} 
                        langCode={localLang.code}
                        pronunciationCache={pronunciationCache}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 대화 기록 */}
        <div className="space-y-5 md:space-y-6">
          {items.length === 0 && (
            <div className="rounded-xl border-2 bg-gray-50 p-8 md:p-10 text-center text-gray-600 shadow-md">
              <div className="text-6xl md:text-7xl mb-4">🗣️</div>
              <div className="text-xl md:text-2xl font-semibold mb-2 leading-relaxed">아래 버튼을 꾹 누르고 말씀하세요</div>
              <div className="text-base md:text-lg mt-2 leading-relaxed">말씀을 마친 뒤 손을 떼면 번역 결과가 나타납니다</div>
              {isCruising && (
                <div className="mt-5 px-5 py-3 bg-blue-50 text-blue-700 rounded-lg text-base md:text-lg">
                  ⛵ 현재 항해 중입니다. 기본 영어 번역 모드로 설정되어 있습니다.
                </div>
              )}
              {!isCruising && destination !== '확인 중...' && destination !== '여행 미등록' && (
                <div className="mt-5 px-5 py-3 bg-green-50 text-green-700 rounded-lg text-base md:text-lg">
                  🏝️ 오늘의 기항지 <b>{destination}</b>에 맞춰 {localLang.flag} {localLang.name} 번역이 준비되었습니다!
                </div>
              )}
            </div>
          )}

          {items.map((it) => (
            <div key={it.id} className="rounded-xl border-2 bg-white p-5 md:p-6 shadow-md">
              <div className="text-sm md:text-base text-gray-500 mb-3 font-semibold">{it.when} · {it.kind === 'photo' ? '📸 사진' : '🎤 음성'}</div>
              {/* 사진 번역: 한국어만 표시 (원본 텍스트 없음) */}
              {it.kind === 'photo' ? (
                <div className="rounded-lg bg-blue-50 p-5 md:p-6">
                  <div className="text-sm md:text-base text-blue-600 mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl md:text-2xl">{it.to.flag}</span>
                      <span className="font-semibold">{it.to.name}</span>
                    </div>
                    {/* 사진 번역 결과 재생 버튼 */}
                    {it.translated && (
                      <button
                        onClick={() => speak(it.translated, it.to.code || 'ko-KR')}
                        className="text-blue-500 hover:text-blue-700 active:scale-110 transition-all text-xl md:text-2xl"
                        title={`${it.to.name}로 재생`}
                      >
                        🔊
                      </button>
                    )}
                  </div>
                  <div className="text-xl md:text-2xl font-semibold text-gray-900 leading-relaxed">{it.translated}</div>
                  {/* 사진 번역 결과는 항상 한국어이므로 발음 불필요 */}
                </div>
              ) : (
                /* 음성 번역: 원본 + 번역 함께 표시 */
              <div className="grid gap-4 md:gap-5 sm:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-4 md:p-5">
                  <div className="text-sm md:text-base text-gray-500 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="text-xl md:text-2xl">{it.from.flag}</span>
                      <span className="font-semibold">{it.from.name}</span>
                    </span>
                    {/* 원문 재생 버튼 */}
                    {it.source && (
                      <button
                        onClick={() => speak(it.source, it.from.code || 'ko-KR')}
                        className="text-gray-500 hover:text-gray-700 active:scale-110 transition-all text-xl md:text-2xl"
                        title={`${it.from.name}로 재생`}
                      >
                        🔊
                      </button>
                    )}
                  </div>
                  <div className="text-lg md:text-xl leading-relaxed">{it.source}</div>
                </div>
                <div className="rounded-lg bg-blue-50 p-4 md:p-5">
              <div className="text-sm md:text-base text-blue-600 mb-2 flex items-center justify-between overflow-hidden">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="text-xl md:text-2xl">{it.to.flag}</span>
                  <span className="font-semibold">{it.to.name}</span>
                </span>
                {/* 번역 결과 재생 버튼 */}
                {it.translated && (
                  <button
                    onClick={() => speak(it.translated, it.to.code || 'en-US')}
                    className="text-blue-500 hover:text-blue-700 active:scale-110 transition-all text-xl md:text-2xl flex-shrink-0"
                    title={`${it.to.name}로 재생`}
                  >
                    🔊
                  </button>
                )}
              </div>
                  <div className="text-lg md:text-xl font-semibold leading-relaxed break-words">{it.translated}</div>
              </div>
              </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* 하단 고정 버튼들(모바일에 최적) - 크기 조정 */}
      <footer className="sticky bottom-0 z-20 border-t-2 bg-white/95 backdrop-blur px-4 pb-[env(safe-area-inset-bottom)] shadow-lg">
        <div className="max-w-3xl mx-auto py-3 md:py-4 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {BTN_PAIRS.map((p) => (
            <button
              key={p.label}
              onMouseDown={() => startPressToTalk(p.from, p.to)}
              onMouseUp={stopPressToTalk}
              onTouchStart={() => startPressToTalk(p.from, p.to)}
              onTouchEnd={stopPressToTalk}
              className={`
                w-full px-4 md:px-5 py-4 md:py-5 rounded-xl text-lg md:text-xl font-bold shadow-lg
                min-h-[80px] md:min-h-[96px]
                ${listening === 'recording' 
                  ? 'bg-gradient-to-r from-red-600 to-red-500 text-white animate-pulse' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600'
                }
                active:scale-95 transition-all
              `}
            >
              <div className="flex flex-col items-center gap-2 md:gap-3">
                <span className="text-3xl md:text-4xl">
                  {listening === 'recording' ? '🔴' : '🎤'}
              </span>
                <span className="text-lg md:text-xl">{p.label}</span>
                <span className="text-xs md:text-sm font-normal opacity-90">
                  (버튼을 꾹 누르고 말하세요)
              </span>
              </div>
            </button>
          ))}
        </div>
      </footer>
    </div>
    </>
  );
} 