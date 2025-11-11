# 크루즈 지니 - 개발 실행 계획서 (Phase 1-4)

> **작성일**: 2025년 11월 2일  
> **목표**: 현실적이고 실행 가능한 단계별 개발  
> **기간**: 총 6주 (Phase 1: 1주, Phase 2: 2주, Phase 3: 2주, Phase 4: 1주)

---

## 📅 전체 타임라인

```
Week 1: Phase 1 - 긴급 개선 (출시 가능 수준 95%)
Week 2-3: Phase 2 - 시니어 친화 기능 (만족도 95%)
Week 4-5: Phase 3 - 데이터 마이그레이션 (안정성 100%)
Week 6: Phase 4 - UI/UX 최종 개선 (완벽)
```

---

## 🔴 Phase 1: 긴급 개선 (1주일)

### 목표
**출시 가능 수준 85% → 95%**

### Day 1 (월요일): 에러 메시지 개선

#### 오전 (2시간): 에러 메시지 한국어 전환

**파일**: 모든 API route 파일들

**작업 내용**:
```typescript
// Before
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// After
return NextResponse.json({ 
  error: '로그인이 필요합니다. 다시 로그인해주세요.' 
}, { status: 401 });
```

**변경할 파일 목록**:
1. `/app/api/*/route.ts` - 모든 API 엔드포인트
2. 공통 에러 메시지 매핑 객체 생성

```typescript
// lib/errors.ts (새 파일)
export const ERROR_MESSAGES = {
  UNAUTHORIZED: '로그인이 필요합니다. 다시 로그인해주세요.',
  NOT_FOUND: '요청하신 정보를 찾을 수 없습니다.',
  BAD_REQUEST: '잘못된 요청입니다. 다시 시도해주세요.',
  INTERNAL_ERROR: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  NETWORK_ERROR: '인터넷 연결을 확인해주세요.',
  INVALID_INPUT: '입력하신 정보를 다시 확인해주세요.',
};

// 사용 예시
import { ERROR_MESSAGES } from '@/lib/errors';

return NextResponse.json({ 
  error: ERROR_MESSAGES.UNAUTHORIZED 
}, { status: 401 });
```

**체크리스트**:
- [ ] `lib/errors.ts` 파일 생성
- [ ] 모든 API에서 ERROR_MESSAGES 사용
- [ ] 클라이언트에서 에러 표시 확인
- [ ] 테스트: 각 에러 상황 재현 및 메시지 확인

**소요 시간**: 2시간

---

#### 오후 (2시간): 환율 API 에러 처리

**파일**: 
- `/app/api/exchange-rate/route.ts` (또는 `/app/api/exchange/[currency]/route.ts`)
- `/app/wallet/page.tsx` (클라이언트)

**작업 1: API 에러 처리 강화**
```typescript
// app/api/exchange-rate/route.ts
export async function GET(req: Request) {
  try {
    const response = await fetch('외부 환율 API');
    
    if (!response.ok) {
      // 외부 API 실패 시 폴백 환율 사용
      return NextResponse.json({
        ok: true,
        rates: FALLBACK_RATES, // 하드코딩된 환율
        isFallback: true,
        message: '최신 환율을 불러올 수 없어 기준 환율을 사용합니다.'
      });
    }
    
    const data = await response.json();
    return NextResponse.json({ ok: true, rates: data, isFallback: false });
    
  } catch (error) {
    console.error('환율 API 에러:', error);
    return NextResponse.json({
      ok: true,
      rates: FALLBACK_RATES,
      isFallback: true,
      message: '환율 정보를 불러올 수 없어 기준 환율을 사용합니다.'
    });
  }
}

// 폴백 환율 데이터 (2025년 11월 기준)
const FALLBACK_RATES = {
  USD: { krw: 1300, symbol: '$' },
  JPY: { krw: 900, symbol: '¥' },
  EUR: { krw: 1450, symbol: '€' },
  CNY: { krw: 180, symbol: '¥' },
  TWD: { krw: 42, symbol: 'NT$' },
};
```

**작업 2: 클라이언트 에러 처리**
```typescript
// app/wallet/page.tsx
const [exchangeError, setExchangeError] = useState<string | null>(null);
const [isFallbackRate, setIsFallbackRate] = useState(false);

const loadExchangeRate = async (currency: string) => {
  try {
    const response = await fetch(`/api/exchange-rate?currency=${currency}`);
    const data = await response.json();
    
    if (data.ok) {
      setExchangeRates(data.rates);
      setIsFallbackRate(data.isFallback);
      
      if (data.isFallback) {
        setExchangeError(data.message);
        // 3초 후 자동 사라짐
        setTimeout(() => setExchangeError(null), 3000);
      }
    }
  } catch (error) {
    setExchangeError('환율 정보를 불러올 수 없습니다. [재시도] 버튼을 눌러주세요.');
  }
};

// UI
{exchangeError && (
  <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded">
    <p>{exchangeError}</p>
    {isFallbackRate && (
      <button onClick={() => loadExchangeRate(currency)}>
        재시도
      </button>
    )}
  </div>
)}
```

**체크리스트**:
- [ ] FALLBACK_RATES 정의
- [ ] API 에러 처리 추가
- [ ] 클라이언트 에러 상태 추가
- [ ] 에러 토스트/배너 UI 추가
- [ ] [재시도] 버튼 구현
- [ ] 테스트: 외부 API 실패 시나리오

**소요 시간**: 2시간

---

### Day 2 (화요일): 채팅 히스토리 로드

#### 오전 (3시간): 히스토리 로드 로직 구현

**파일**: `/app/chat/components/ChatClientShell.tsx`

**현재 상태 확인**:
```bash
# 1. API 엔드포인트 존재 확인
ls /home/userhyeseon28/projects/cruise-guide/app/api/chat/history/

# 2. API 응답 형식 확인
curl http://localhost:3030/api/chat/history?tripId=1 \
  -H "Cookie: cg.sid.v2=세션ID"
```

**작업 내용**:
```typescript
// app/chat/components/ChatClientShell.tsx

// 1. 히스토리 로드 함수 추가
const loadChatHistory = async () => {
  try {
    setIsLoadingHistory(true);
    
    // tripId는 세션이나 URL에서 가져옴
    const tripId = session?.tripId || currentTripId;
    const response = await fetch(`/api/chat/history?tripId=${tripId}`);
    const data = await response.json();
    
    if (data.ok && Array.isArray(data)) {
      // API에서 받은 메시지를 현재 형식에 맞게 변환
      const historyMessages = data.map((msg: any) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        type: 'text' as const,
        text: msg.content,
      }));
      
      // 기존 메시지 배열에 추가 (히스토리를 앞에 배치)
      setMessages(prev => [...historyMessages, ...prev]);
    }
  } catch (error) {
    console.error('히스토리 로드 실패:', error);
    // 에러는 무시 (새 대화 시작)
  } finally {
    setIsLoadingHistory(false);
  }
};

// 2. 컴포넌트 마운트 시 로드
useEffect(() => {
  loadChatHistory();
}, []); // 빈 배열 = 최초 1회만 실행

// 3. 로딩 상태 추가
const [isLoadingHistory, setIsLoadingHistory] = useState(false);

// 4. UI에 로딩 표시
{isLoadingHistory && (
  <div className="flex justify-center py-4">
    <div className="text-gray-500">이전 대화를 불러오는 중...</div>
  </div>
)}
```

**체크리스트**:
- [ ] `loadChatHistory` 함수 추가
- [ ] `useEffect`로 자동 로드
- [ ] 로딩 상태 UI 추가
- [ ] 에러 처리 (실패 시 무시)
- [ ] 메시지 중복 방지 로직
- [ ] 테스트: 새로고침 후 메시지 복원 확인

**소요 시간**: 3시간

---

### Day 3 (수요일): 모드 전환 UI 개선

#### 오전 (3시간): ModeBar 개선

**파일**: `/app/chat/components/ModeBar.tsx`

**Before**:
```typescript
// 작은 아이콘만
<button onClick={() => setMode('directions')}>
  🧭
</button>
```

**After**:
```typescript
// 큰 버튼 + 명확한 텍스트
<button 
  onClick={() => setMode('directions')}
  className={`
    flex flex-col items-center gap-1 px-4 py-3 rounded-lg
    min-w-[80px] min-h-[80px]
    ${mode === 'directions' 
      ? 'bg-blue-500 text-white' 
      : 'bg-gray-100 text-gray-700'
    }
    hover:bg-blue-400 transition-colors
  `}
>
  <span className="text-3xl">🧭</span>
  <span className="text-sm font-medium">길찾기</span>
</button>
```

**모드별 텍스트**:
```typescript
const MODE_CONFIG = {
  general: { icon: '💬', label: '대화' },
  directions: { icon: '🧭', label: '길찾기' },
  nearby: { icon: '📍', label: '주변 검색' },
  photos: { icon: '📷', label: '사진' },
  translate: { icon: '🌐', label: '번역' },
};

// 사용
{Object.entries(MODE_CONFIG).map(([key, config]) => (
  <button key={key} onClick={() => setMode(key)} ...>
    <span>{config.icon}</span>
    <span>{config.label}</span>
  </button>
))}
```

**첫 사용 시 툴팁**:
```typescript
const [showModeTooltip, setShowModeTooltip] = useState(false);

useEffect(() => {
  const hasSeenTooltip = localStorage.getItem('hasSeenModeTooltip');
  if (!hasSeenTooltip) {
    setShowModeTooltip(true);
    localStorage.setItem('hasSeenModeTooltip', 'true');
  }
}, []);

{showModeTooltip && (
  <div className="absolute top-full mt-2 bg-blue-500 text-white px-4 py-2 rounded shadow-lg">
    원하는 기능을 선택하세요 👆
    <button onClick={() => setShowModeTooltip(false)}>✕</button>
  </div>
)}
```

**체크리스트**:
- [ ] MODE_CONFIG 객체 정의
- [ ] 버튼 크기 증가 (80x80px 이상)
- [ ] 아이콘 + 텍스트 함께 표시
- [ ] 현재 모드 강조 표시
- [ ] 첫 사용 시 툴팁
- [ ] 반응형 디자인 (모바일)
- [ ] 테스트: 각 모드 전환 확인

**소요 시간**: 3시간

---

### Day 4-5: 테스트 & 문서화

#### Day 4 (목요일): 통합 테스트

**테스트 시나리오**:

1. **에러 메시지 테스트**
   ```
   - [ ] 로그인 없이 API 호출 → "로그인이 필요합니다" 표시
   - [ ] 잘못된 입력 → "입력 정보를 확인해주세요" 표시
   - [ ] 네트워크 오류 → "인터넷 연결을 확인해주세요" 표시
   ```

2. **환율 API 테스트**
   ```
   - [ ] 정상 동작 시 최신 환율 표시
   - [ ] API 실패 시 기준 환율 표시
   - [ ] 폴백 메시지 표시 확인
   - [ ] [재시도] 버튼 동작 확인
   ```

3. **채팅 히스토리 테스트**
   ```
   - [ ] 새로고침 후 이전 대화 복원
   - [ ] 여러 세션 테스트
   - [ ] 히스토리 없을 때 정상 동작
   - [ ] 로딩 표시 확인
   ```

4. **모드 전환 테스트**
   ```
   - [ ] 각 모드 클릭 시 전환 확인
   - [ ] 현재 모드 강조 표시 확인
   - [ ] 첫 사용 시 툴팁 표시
   - [ ] 모바일에서 터치 동작
   ```

**소요 시간**: 전일

---

#### Day 5 (금요일): 문서화 & 배포 준비

**작업 내용**:

1. **CHANGELOG.md 업데이트**
   ```markdown
   # v1.1.0 (2025-11-XX)
   
   ## 개선 사항
   - ✅ 모든 에러 메시지 한국어화
   - ✅ 환율 API 에러 처리 및 폴백 시스템
   - ✅ 채팅 히스토리 자동 로드
   - ✅ 모드 전환 UI 개선 (큰 버튼 + 텍스트)
   
   ## 버그 수정
   - 🐛 새로고침 시 대화 사라지는 문제 해결
   - 🐛 환율 API 실패 시 앱 크래시 문제 해결
   ```

2. **README.md 업데이트**
   ```markdown
   ## 최근 업데이트
   - Phase 1 완료 (2025-11-XX)
   - 출시 가능 수준: 95%
   - 시니어 친화성 개선
   ```

3. **배포 전 체크리스트**
   ```
   - [ ] 모든 린터 오류 해결
   - [ ] TypeScript 컴파일 성공
   - [ ] 테스트 통과
   - [ ] 환경 변수 확인
   - [ ] 데이터베이스 마이그레이션 확인
   - [ ] 백업 완료
   ```

**소요 시간**: 전일

---

## 🟡 Phase 2: 시니어 친화 기능 (2주)

### Week 2: 음성 입력 & 글씨 크기 조절

#### Day 1-3 (월~수): STT (음성 입력) 구현

**파일**: 
- `/lib/stt.ts` (새 파일)
- `/app/chat/components/InputBar.tsx`

**작업 1: STT 유틸리티 생성**
```typescript
// lib/stt.ts
export class STTManager {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  
  constructor() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new webkitSpeechRecognition();
      this.recognition.lang = 'ko-KR';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
    }
  }
  
  start(onResult: (text: string) => void, onError?: (error: string) => void) {
    if (!this.recognition) {
      onError?.('음성 인식을 지원하지 않는 브라우저입니다.');
      return;
    }
    
    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      this.isListening = false;
    };
    
    this.recognition.onerror = (event) => {
      console.error('STT 에러:', event.error);
      onError?.(this.getErrorMessage(event.error));
      this.isListening = false;
    };
    
    this.recognition.start();
    this.isListening = true;
  }
  
  stop() {
    this.recognition?.stop();
    this.isListening = false;
  }
  
  getIsListening() {
    return this.isListening;
  }
  
  private getErrorMessage(error: string): string {
    const messages: Record<string, string> = {
      'no-speech': '음성이 감지되지 않았습니다. 다시 시도해주세요.',
      'audio-capture': '마이크에 접근할 수 없습니다.',
      'not-allowed': '마이크 권한이 필요합니다.',
      'network': '인터넷 연결을 확인해주세요.',
    };
    return messages[error] || '음성 인식 오류가 발생했습니다.';
  }
}

export const stt = new STTManager();
```

**작업 2: InputBar에 통합**
```typescript
// app/chat/components/InputBar.tsx
import { stt } from '@/lib/stt';

const [isListening, setIsListening] = useState(false);
const [sttError, setSTTError] = useState<string | null>(null);

const handleVoiceInput = () => {
  if (isListening) {
    stt.stop();
    setIsListening(false);
    return;
  }
  
  stt.start(
    (text) => {
      // 음성 인식 결과를 입력창에 추가
      setInput(prev => prev + text);
      setIsListening(false);
    },
    (error) => {
      setSTTError(error);
      setIsListening(false);
      // 3초 후 에러 메시지 자동 사라짐
      setTimeout(() => setSTTError(null), 3000);
    }
  );
  
  setIsListening(true);
};

// UI
<button
  onClick={handleVoiceInput}
  className={`
    p-3 rounded-full
    ${isListening ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}
    text-white
  `}
>
  {isListening ? '🔴 녹음 중...' : '🎤 음성 입력'}
</button>

{sttError && (
  <div className="text-red-500 text-sm mt-1">
    {sttError}
  </div>
)}
```

**체크리스트**:
- [ ] `lib/stt.ts` 생성
- [ ] STTManager 클래스 구현
- [ ] InputBar에 [음성 입력] 버튼 추가
- [ ] 녹음 중 UI (빨간색 + 애니메이션)
- [ ] 에러 처리 (권한, 미지원 브라우저)
- [ ] 테스트: Chrome, Safari, Firefox
- [ ] 모바일 테스트

**소요 시간**: 3일

---

#### Day 4-5 (목~금): 글씨 크기 조절

**파일**:
- `/app/profile/components/FontSizeControl.tsx` (새 파일)
- `/app/globals.css`

**작업 1: FontSizeControl 컴포넌트**
```typescript
// app/profile/components/FontSizeControl.tsx
'use client';

import { useState, useEffect } from 'react';

const FONT_SIZES = {
  small: { value: '14px', label: '작게' },
  normal: { value: '16px', label: '보통' },
  large: { value: '18px', label: '크게' },
  xlarge: { value: '20px', label: '매우 크게' },
};

export default function FontSizeControl() {
  const [fontSize, setFontSize] = useState<keyof typeof FONT_SIZES>('normal');
  
  useEffect(() => {
    // 저장된 설정 불러오기
    const saved = localStorage.getItem('fontSize');
    if (saved && saved in FONT_SIZES) {
      setFontSize(saved as keyof typeof FONT_SIZES);
      applyFontSize(saved as keyof typeof FONT_SIZES);
    }
  }, []);
  
  const handleChange = (size: keyof typeof FONT_SIZES) => {
    setFontSize(size);
    applyFontSize(size);
    localStorage.setItem('fontSize', size);
  };
  
  const applyFontSize = (size: keyof typeof FONT_SIZES) => {
    document.documentElement.style.setProperty(
      '--app-font-size',
      FONT_SIZES[size].value
    );
  };
  
  return (
    <div className="space-y-2">
      <h3 className="font-medium">글씨 크기</h3>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(FONT_SIZES).map(([key, config]) => (
          <button
            key={key}
            onClick={() => handleChange(key as keyof typeof FONT_SIZES)}
            className={`
              px-4 py-3 rounded-lg border-2 font-medium
              ${fontSize === key
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700'
              }
            `}
          >
            {config.label}
          </button>
        ))}
      </div>
      
      {/* 미리보기 */}
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <p style={{ fontSize: FONT_SIZES[fontSize].value }}>
          이 크기로 표시됩니다
        </p>
      </div>
    </div>
  );
}
```

**작업 2: 전역 CSS 적용**
```css
/* app/globals.css */
:root {
  --app-font-size: 16px; /* 기본값 */
}

body {
  font-size: var(--app-font-size);
}

/* 적용할 요소들 */
.chat-message,
.button-text,
.description-text {
  font-size: var(--app-font-size);
}
```

**작업 3: 프로필 페이지에 추가**
```typescript
// app/profile/page.tsx
import FontSizeControl from './components/FontSizeControl';

<div className="space-y-6">
  {/* 기존 설정들 */}
  <FontSizeControl />
</div>
```

**체크리스트**:
- [ ] FontSizeControl 컴포넌트 생성
- [ ] CSS 변수 설정
- [ ] LocalStorage 저장/로드
- [ ] 전체 앱에 적용
- [ ] 미리보기 기능
- [ ] 테스트: 각 크기 전환 확인

**소요 시간**: 2일

---

### Week 3: 고대비 모드 & 첫 사용 가이드

#### Day 1-3 (월~수): 고대비 모드

**파일**:
- `/app/profile/components/ThemeControl.tsx` (새 파일)
- `/app/globals.css`
- `tailwind.config.ts`

**작업 1: Tailwind 다크 모드 설정**
```typescript
// tailwind.config.ts
export default {
  darkMode: 'class', // 클래스 기반 다크 모드
  // ... 나머지 설정
}
```

**작업 2: ThemeControl 컴포넌트**
```typescript
// app/profile/components/ThemeControl.tsx
'use client';

import { useState, useEffect } from 'react';

export default function ThemeControl() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);
  
  const handleChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  return (
    <div className="space-y-2">
      <h3 className="font-medium">테마</h3>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleChange('light')}
          className={`
            px-4 py-3 rounded-lg border-2
            ${theme === 'light'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-white'
            }
          `}
        >
          ☀️ 밝은 모드
        </button>
        <button
          onClick={() => handleChange('dark')}
          className={`
            px-4 py-3 rounded-lg border-2
            ${theme === 'dark'
              ? 'border-yellow-500 bg-gray-800 text-white'
              : 'border-gray-300 bg-white'
            }
          `}
        >
          🌙 고대비 모드
        </button>
      </div>
    </div>
  );
}
```

**작업 3: 다크 모드 스타일**
```css
/* app/globals.css */

/* 라이트 모드 (기본) */
:root {
  --bg-primary: #ffffff;
  --text-primary: #1a1a1a;
  --border-color: #e5e7eb;
}

/* 다크 모드 (고대비) */
.dark {
  --bg-primary: #1a1a1a;
  --text-primary: #ffffff;
  --border-color: #4b5563;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
```

**작업 4: 각 컴포넌트에 다크 모드 적용**
```typescript
// 예시: ChatMessage.tsx
<div className="
  bg-white dark:bg-gray-800
  text-gray-900 dark:text-gray-100
  border border-gray-200 dark:border-gray-700
">
  {message.text}
</div>
```

**체크리스트**:
- [ ] Tailwind 다크 모드 설정
- [ ] ThemeControl 컴포넌트 생성
- [ ] 모든 주요 컴포넌트에 다크 모드 적용
- [ ] LocalStorage 저장/로드
- [ ] 테스트: 전환 시 모든 페이지 확인

**소요 시간**: 3일 (컴포넌트 많음)

---

#### Day 4-5 (목~금): 첫 사용 가이드

**파일**:
- `/components/OnboardingTutorial.tsx` (새 파일)

**작업: 인터랙티브 튜토리얼**
```typescript
// components/OnboardingTutorial.tsx
'use client';

import { useState } from 'react';

const STEPS = [
  {
    title: '예약번호만 입력하면 시작!',
    description: '복잡한 정보 입력 없이 30초만에 여행을 시작하세요.',
    image: '/tutorial/onboarding.png',
    highlight: '#onboarding-form',
  },
  {
    title: 'AI가 먼저 알려드려요',
    description: '출항 1시간 전, 승선 시간 등 중요한 알림을 자동으로 받으세요.',
    image: '/tutorial/push.png',
    highlight: null,
  },
  {
    title: '음성으로 편하게 대화하세요',
    description: 'AI 답변을 음성으로 듣고, 음성으로 질문하세요.',
    image: '/tutorial/tts-stt.png',
    highlight: '#voice-button',
  },
  {
    title: '지도에서 여행 기록 확인',
    description: '방문한 국가가 자동으로 색칠되어 추억을 한눈에 보세요.',
    image: '/tutorial/map.png',
    highlight: null,
  },
  {
    title: '준비물과 가계부 관리',
    description: '체크리스트와 가계부로 여행을 더 편하게 준비하세요.',
    image: '/tutorial/tools.png',
    highlight: null,
  },
];

export default function OnboardingTutorial({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
      localStorage.setItem('hasSeenTutorial', 'true');
    }
  };
  
  const handleSkip = () => {
    onComplete();
    localStorage.setItem('hasSeenTutorial', 'true');
  };
  
  const step = STEPS[currentStep];
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        {/* 진행 표시 */}
        <div className="flex gap-2 mb-4">
          {STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded ${
                index <= currentStep ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        
        {/* 이미지 */}
        {step.image && (
          <img src={step.image} alt={step.title} className="w-full h-48 object-contain mb-4" />
        )}
        
        {/* 내용 */}
        <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
        <p className="text-gray-600 mb-6">{step.description}</p>
        
        {/* 버튼 */}
        <div className="flex gap-2">
          <button
            onClick={handleSkip}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700"
          >
            건너뛰기
          </button>
          <button
            onClick={handleNext}
            className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg font-medium"
          >
            {currentStep < STEPS.length - 1 ? '다음' : '시작하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**사용**:
```typescript
// app/chat/page.tsx
'use client';

import OnboardingTutorial from '@/components/OnboardingTutorial';
import { useState, useEffect } from 'react';

export default function ChatPage() {
  const [showTutorial, setShowTutorial] = useState(false);
  
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);
  
  return (
    <>
      {showTutorial && (
        <OnboardingTutorial onComplete={() => setShowTutorial(false)} />
      )}
      
      {/* 기존 채팅 UI */}
    </>
  );
}
```

**체크리스트**:
- [ ] OnboardingTutorial 컴포넌트 생성
- [ ] 5단계 콘텐츠 작성
- [ ] 튜토리얼 이미지 준비 (또는 아이콘)
- [ ] 진행 표시 바
- [ ] 건너뛰기/다음/시작하기 버튼
- [ ] LocalStorage로 "다시 보지 않기"
- [ ] 테스트: 첫 로그인 시 표시 확인

**소요 시간**: 2일

---

## 🟢 Phase 3: 데이터 마이그레이션 (2주)

### Week 4: 가계부 마이그레이션

#### Day 1-5 (월~금): Wallet 페이지 수정

**현재 상태**:
```typescript
// LocalStorage 사용
const [expenses, setExpenses] = useState(() => {
  const saved = localStorage.getItem('expenses');
  return saved ? JSON.parse(saved) : [];
});
```

**변경 후**:
```typescript
// API 사용
const [expenses, setExpenses] = useState([]);
const [loading, setLoading] = useState(true);

// 1. 데이터 로드
useEffect(() => {
  loadExpenses();
  migrateLocalData(); // 최초 1회 마이그레이션
}, []);

const loadExpenses = async () => {
  try {
    setLoading(true);
    const response = await fetch('/api/expenses');
    const data = await response.json();
    if (data.ok) {
      setExpenses(data.expenses);
    }
  } catch (error) {
    console.error('가계부 로드 실패:', error);
  } finally {
    setLoading(false);
  }
};

// 2. 기존 LocalStorage 데이터 마이그레이션
const migrateLocalData = async () => {
  const localExpenses = localStorage.getItem('expenses');
  const migrated = localStorage.getItem('expenses-migrated');
  
  if (localExpenses && !migrated) {
    try {
      const expenses = JSON.parse(localExpenses);
      
      for (const expense of expenses) {
        await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(expense),
        });
      }
      
      localStorage.setItem('expenses-migrated', 'true');
      localStorage.removeItem('expenses');
      console.log('✅ 가계부 데이터 마이그레이션 완료');
    } catch (error) {
      console.error('마이그레이션 실패:', error);
    }
  }
};

// 3. 추가
const addExpense = async (expense) => {
  try {
    const response = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    });
    
    if (response.ok) {
      await loadExpenses(); // 다시 로드
    }
  } catch (error) {
    console.error('추가 실패:', error);
  }
};

// 4. 삭제
const deleteExpense = async (id) => {
  try {
    const response = await fetch('/api/expenses', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    
    if (response.ok) {
      await loadExpenses();
    }
  } catch (error) {
    console.error('삭제 실패:', error);
  }
};
```

**체크리스트**:
- [ ] loadExpenses 함수 구현
- [ ] migrateLocalData 함수 구현
- [ ] addExpense → API 호출로 변경
- [ ] deleteExpense → API 호출로 변경
- [ ] 로딩 상태 UI 추가
- [ ] 에러 처리
- [ ] 테스트: 기존 데이터 마이그레이션
- [ ] 테스트: 추가/삭제 동작

**소요 시간**: 1주

---

### Week 5: 체크리스트 마이그레이션

#### Day 1-5: Checklist 페이지 수정

**동일한 패턴 적용**:
```typescript
// app/checklist/page.tsx (존재하는 경우)

// 1. 로드
const loadChecklist = async () => {
  const response = await fetch('/api/checklist');
  const data = await response.json();
  if (data.ok) setItems(data.items);
};

// 2. 마이그레이션
const migrateLocalData = async () => {
  // wallet과 동일
};

// 3. CRUD
const addItem = async (item) => {
  await fetch('/api/checklist', {
    method: 'POST',
    body: JSON.stringify(item),
  });
  await loadChecklist();
};

const updateItem = async (id, updates) => {
  await fetch('/api/checklist', {
    method: 'PUT',
    body: JSON.stringify({ id, ...updates }),
  });
  await loadChecklist();
};

const deleteItem = async (id) => {
  await fetch('/api/checklist', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
  await loadChecklist();
};
```

**체크리스트**:
- [ ] loadChecklist 함수
- [ ] migrateLocalData 함수
- [ ] addItem → API
- [ ] updateItem → API
- [ ] deleteItem → API
- [ ] 완료 토글 → API
- [ ] 테스트

**소요 시간**: 1주

---

## 🟢 Phase 4: UI/UX 최종 개선 (1주)

### Week 6: 로딩 스켈레톤 & 토스트

#### Day 1-2 (월~화): 로딩 스켈레톤

**파일**: `/components/skeletons/`

**ChatMessageSkeleton**:
```typescript
// components/skeletons/ChatMessageSkeleton.tsx
export default function ChatMessageSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="w-10 h-10 bg-gray-300 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-300 rounded w-3/4" />
        <div className="h-4 bg-gray-300 rounded w-1/2" />
      </div>
    </div>
  );
}
```

**사용**:
```typescript
// app/chat/page.tsx
{loading ? (
  <ChatMessageSkeleton />
) : (
  <ChatMessages messages={messages} />
)}
```

**체크리스트**:
- [ ] ChatMessageSkeleton
- [ ] PhotoGallerySkeleton
- [ ] ProfileSkeleton
- [ ] 각 페이지에 적용
- [ ] 테스트

**소요 시간**: 2일

---

#### Day 3-4 (수~목): 통합 Toast 시스템

**파일**: `/components/Toast.tsx`, `/hooks/useToast.ts`

**Toast 컴포넌트**:
```typescript
// components/Toast.tsx
export default function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  };
  
  return (
    <div className={`fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg`}>
      {message}
      <button onClick={onClose}>✕</button>
    </div>
  );
}
```

**useToast 훅**:
```typescript
// hooks/useToast.ts
export function useToast() {
  const [toasts, setToasts] = useState([]);
  
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };
  
  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };
  
  return { toasts, showToast, removeToast };
}
```

**사용**:
```typescript
const { showToast } = useToast();

// 성공
showToast('저장되었습니다', 'success');

// 에러
showToast('오류가 발생했습니다', 'error');
```

**체크리스트**:
- [ ] Toast 컴포넌트
- [ ] useToast 훅
- [ ] 자동 사라짐 (3초)
- [ ] 여러 토스트 동시 표시
- [ ] 전체 앱에 적용
- [ ] 테스트

**소요 시간**: 2일

---

#### Day 5 (금): 터치 제스처 개선 & 최종 테스트

**작업**:
1. 모든 버튼 최소 크기 48x48px
2. 터치 영역 확대 (padding)
3. 햅틱 피드백 (가능한 경우)
4. 최종 통합 테스트

**소요 시간**: 1일

---

## 📊 진행 상황 추적

### 체크리스트

#### Phase 1 (Week 1)
- [ ] Day 1: 에러 메시지 한국어화
- [ ] Day 1: 환율 API 에러 처리
- [ ] Day 2: 채팅 히스토리 로드
- [ ] Day 3: 모드 전환 UI 개선
- [ ] Day 4: 통합 테스트
- [ ] Day 5: 문서화 & 배포 준비

#### Phase 2 (Week 2-3)
- [ ] Week 2 Day 1-3: STT 구현
- [ ] Week 2 Day 4-5: 글씨 크기 조절
- [ ] Week 3 Day 1-3: 고대비 모드
- [ ] Week 3 Day 4-5: 첫 사용 가이드

#### Phase 3 (Week 4-5)
- [ ] Week 4: 가계부 마이그레이션
- [ ] Week 5: 체크리스트 마이그레이션

#### Phase 4 (Week 6)
- [ ] Day 1-2: 로딩 스켈레톤
- [ ] Day 3-4: Toast 시스템
- [ ] Day 5: 터치 제스처 & 최종 테스트

---

## 🎯 성공 지표

### Week 1 완료 시 (Phase 1)
- ✅ 출시 가능 수준: **95%**
- ✅ 모든 에러 한국어
- ✅ 채팅 히스토리 유지
- ✅ 모드 전환 쉬움

### Week 3 완료 시 (Phase 2)
- ✅ 시니어 만족도: **95%**
- ✅ 음성 입력/출력
- ✅ 글씨 크기 조절
- ✅ 고대비 모드
- ✅ 첫 사용 가이드

### Week 5 완료 시 (Phase 3)
- ✅ 데이터 안정성: **100%**
- ✅ LocalStorage 의존 제거
- ✅ 디바이스 간 동기화

### Week 6 완료 시 (Phase 4)
- ✅ 사용성: **완벽**
- ✅ 로딩 스켈레톤
- ✅ 통합 Toast
- ✅ 터치 제스처 최적화

---

## 📝 매일 할 일

### 아침 (30분)
1. 오늘의 작업 확인
2. 개발 환경 점검
3. 데이터베이스 백업

### 작업 중 (계속)
1. 커밋 자주 하기 (기능별)
2. 테스트 계속 하기
3. 문제 발생 시 즉시 기록

### 저녁 (30분)
1. 오늘 완료한 작업 체크
2. CHANGELOG 업데이트
3. 내일 작업 준비

---

## 🚀 최종 목표

**6주 후**:
- ✅ 출시 준비 **100% 완료**
- ✅ 시니어 만족도 **95%+**
- ✅ 모든 기능 완벽 작동
- ✅ 문서화 완료

**그 다음**:
- 베타 테스트 (1개월)
- 소프트 런칭 (2개월)
- 정식 출시 (6개월 후)

---

**작성자**: 크루즈 지니 팀  
**작성일**: 2025년 11월 2일  
**다음 리뷰**: Week 1 종료 시 (Phase 1 완료)

🚀 **"한 걸음씩, 확실하게"** 🚀

















