# 크루즈 가이드 AI - 개발 로드맵 및 히스토리

> 최종 업데이트: 2025년 10월 18일

---

## 📚 목차

1. [과거 개발 히스토리](#-과거-개발-히스토리)
2. [현재 시스템 구조](#-현재-시스템-구조)
3. [긴급 해결 필요 사항](#-긴급-해결-필요-사항-immediate)
4. [단기 개발 계획](#-단기-개발-계획-1-2주)
5. [중기 개발 계획](#-중기-개발-계획-1-2개월)
6. [장기 개발 계획](#-장기-개발-계획-3-6개월)
7. [기술 부채 및 리팩토링](#-기술-부채-및-리팩토링)
8. [성능 최적화 계획](#-성능-최적화-계획)

---

## 📖 과거 개발 히스토리

### Phase 1: 프로젝트 초기 설정 (Week 1-2)

#### 1.1 기술 스택 선정 및 초기 설정
- **2025년 9월 초**
  - Next.js 14 (App Router) 프로젝트 생성
  - TypeScript 설정 완료
  - Tailwind CSS 스타일링 시스템 도입
  - ESLint, Prettier 설정

#### 1.2 데이터베이스 설계
- **도구**: Prisma ORM + SQLite
- **초기 스키마 설계**:
  ```
  User → Trip (1:N)
  User → Session (1:N)
  User → LoginLog (1:N)
  ```
- **문제 발생**: Enum 타입 이슈로 role을 String으로 변경
- **해결**: String + 애플리케이션 레벨 검증으로 대체

#### 1.3 환경 변수 설정
- `GEMINI_API_KEY`: Google Gemini AI API 키
- `DATABASE_URL`: SQLite 데이터베이스 경로
- `NEXT_PUBLIC_BASE_URL`: 배포 URL

---

### Phase 2: 사용자 인증 시스템 구축 (Week 3-4)

#### 2.1 로그인/회원가입 시스템
- **구현 사항**:
  - `/app/login/page.tsx` 로그인 페이지
  - `/app/api/auth/login/route.ts` 인증 API
  - bcrypt를 이용한 비밀번호 암호화
  - Iron Session 기반 세션 관리
  
- **발생한 문제와 해결**:
  - 문제: NextAuth vs Iron Session 선택
  - 해결: 더 간단한 Iron Session 선택 (커스터마이징 용이)
  
- **보안 고려사항**:
  - HTTPS only 쿠키
  - httpOnly 플래그 설정
  - CSRF 토큰 (추후 추가 예정)

#### 2.2 세션 미들웨어
- `middleware.ts` 설정
- 비보호 경로: `/login`, `/api/auth/*`, `/public/*`
- 보호 경로: 나머지 모든 페이지
- 미인증 시 `/login`으로 리다이렉트

---

### Phase 3: 온보딩 프로세스 개발 (Week 5-6)

#### 3.1 온보딩 UI 설계
- **컴포넌트**: `CruiseTripRegistration.tsx`
- **입력 필드**:
  1. 크루즈 선택 (react-select 드롭다운)
  2. 동행인 타입 (가족, 친구, 연인, 혼자)
  3. 목적지 다중 선택
  4. 날짜 범위 (react-day-picker)

#### 3.2 데이터 수집 및 저장
- **API**: `/api/trips/route.ts`
- **저장 로직**:
  - Trip 생성
  - User.onboarded = true 업데이트
  - 세션에 여행 정보 저장
  
#### 3.3 온보딩 완료 플로우
- 온보딩 완료 → `/chat`으로 리다이렉트
- `OnboardingSummary` 컴포넌트로 여행 정보 배너 표시

**개선 필요**:
- [ ] 온보딩 스킵 기능
- [ ] 온보딩 진행률 표시
- [ ] 나중에 다시 수정 가능하도록

---

### Phase 4: AI 채팅 시스템 구축 (Week 7-9)

#### 4.1 Google Gemini API 연동
- **파일**: `lib/gemini.ts`
- **모델**: `gemini-2.5-flash` (환경 변수로 변경 가능)
- **기능**:
  - 메시지 히스토리 관리
  - Temperature 조절 (0.7 기본값)
  - Safety Settings 설정

#### 4.2 채팅 UI 구조 설계
```
ChatPage (서버)
  └─ ChatInteractiveUI (클라이언트)
      ├─ QuickTools (빠른 기능 버튼)
      ├─ ChatTabs (모드 전환)
      └─ ChatClientShell
          ├─ ChatMessages (메시지 리스트)
          └─ ChatInputBar (입력창)
```

#### 4.3 채팅 모드 시스템
- **모드 종류**:
  - `general`: 일반 대화
  - `directions`: 길찾기
  - `nearby`: 주변 검색
  - `photos`: 사진 요청
  - `translate`: 번역

- **Intent Detection 로직**:
  ```typescript
  // detect.ts에서 패턴 매칭
  - "~에서 ~까지" → directions
  - "근처", "주변" → nearby
  - "사진", "보여줘" → photos
  ```

#### 4.4 메시지 타입 시스템
```typescript
type ChatMessage = 
  | { type: 'text', text: string }
  | { type: 'map-links', title: string, links: Link[] }
  | { type: 'photo-gallery', images: string[] }
  | { type: 'photos', photos: Photo[] }
```

**현재 문제점**:
- [ ] 메시지 히스토리가 세션에 저장되지 않음 (새로고침 시 사라짐)
- [ ] 스트리밍 응답 미구현 (응답 대기 시간 길어짐)
- [ ] 컨텍스트 윈도우 관리 부재

---

### Phase 5: Google Maps 네비게이션 시스템 (Week 10-12)

#### 5.1 터미널 데이터베이스 구축
- **파일**: `data/terminals.json`
- **데이터 구조**:
  ```json
  {
    "name": "Port Miami Cruise Terminal",
    "name_ko": "포트 마이애미 크루즈 터미널",
    "country": "United States",
    "city": "Miami",
    "latitude": 25.7767,
    "longitude": -80.1659,
    "keywords": ["miami", "port", "cruise"],
    "keywords_ko": ["마이애미", "항구", "크루즈"]
  }
  ```

- **데이터 수집 과정**:
  1. 전 세계 주요 크루즈 터미널 리서치
  2. 좌표 수동 수집 (Google Maps)
  3. 한국어 번역 및 키워드 태깅
  4. 별칭 데이터 추가 (`terminal_aliases.json`)

#### 5.2 스마트 셀렉터 로직
- **파일**: `lib/nav/selector.ts`

**핵심 알고리즘**:
```typescript
// 1. 국가 추론 (resolveCountryFromText)
"인천공항" → normalizeCountry → "South Korea"
"요코하마" → POI 매칭 → "Japan"

// 2. 출발지 찾기 (findOrigins)
- 공항 우선 검색
- 토큰 양방향 매칭 (q ⊂ tok 또는 tok ⊂ q)

// 3. 목적지 찾기 (findDestinations)
- hint(출발지)에서 국가 추론
- 해당 국가의 크루즈 터미널만 필터링
- "크루즈", "터미널" 등 제네릭 키워드 처리
```

**개선 사항**:
- 초기: 단순 문자열 매칭
- 중기: 국가 정규화 추가
- 현재: 양방향 포함 매칭 + 힌트 기반 국가 추론

#### 5.3 Google Maps URL 생성
- **파일**: `lib/nav/urls.ts`
- **기능**:
  ```typescript
  gmapDir(origin, destination, mode)
  // → "https://www.google.com/maps/dir/?api=1&..."
  
  gmapSearch(query)
  // → "https://www.google.com/maps/search/?api=1&..."
  ```

#### 5.4 터미널 질문 핸들러
- **파일**: `app/api/chat/handlers/terminals.ts`
- **특별 처리**:
  - "크루즈 터미널"이 destination에 포함되면
  - 여러 터미널 후보 제시 (최대 3개)
  - 각각 Google Maps 링크 생성

**발견된 이슈와 해결**:
- 문제: "미국 크루즈 터미널" → 너무 많은 결과
- 해결: origin에서 국가 추론 → 동일 국가 터미널만 필터링
- 문제: "요코하마 터미널" → 공항도 나옴
- 해결: `isCruise()` 함수로 크루즈 터미널만 필터링

---

### Phase 6: 사진 갤러리 시스템 (Week 13-14)

#### 6.1 이미지 인프라 구축
- **디렉토리 구조**:
  ```
  /public/photos/
    ├─ usa/
    │   ├─ miami-terminal/
    │   └─ galveston-terminal/
    ├─ japan/
    │   ├─ yokohama-terminal/
    │   └─ tokyo/
    └─ taiwan/
  ```

#### 6.2 자동 매니페스트 생성
- **스크립트**: `scripts/gen-image-manifest.mjs`
- **실행 시점**: `npm run build` 전에 자동 실행
- **생성 파일**: `data/image_manifest.json`

```json
{
  "usa": {
    "miami-terminal": [
      "/photos/usa/miami-terminal/image1.jpg",
      "/photos/usa/miami-terminal/image2.jpg"
    ]
  }
}
```

#### 6.3 사진 검색 API
- **엔드포인트**: `/api/photos/route.ts`
- **검색 로직**:
  1. 쿼리에서 키워드 추출
  2. 터미널 이름 매칭
  3. 미디어 별칭 조회 (`media-aliases.json`)
  4. 매칭된 경로의 모든 사진 반환

#### 6.4 사진 뷰어 컴포넌트
- **PhotoAlbumModal**: 그리드 뷰 (3열)
- **ImageViewerModal**: 전체 화면 뷰어
  - 스와이프 제스처 지원
  - 확대/축소
  - 이미지 다운로드

**최적화 작업**:
- Next.js Image 컴포넌트 사용
- lazy loading
- 적절한 사이즈 지정 (width/height)
- placeholder 이미지

---

### Phase 7: 퀵 도구 개발 (Week 15-17)

#### 7.1 여행 준비물 체크리스트
- **상태 관리**: Zustand (`store/checklistStore.ts`)
- **LocalStorage 연동**: 자동 저장/복원

**기능 목록**:
- [x] 항목 추가/삭제
- [x] 완료 토글
- [x] 진행률 표시
- [x] 빠른 추가 칩 (여권, E-티켓 등)
- [x] 글자 크기 조절 (접근성)
- [x] 완료/미완료 자동 정렬

**고려사항**:
- 모바일 UX 최적화 (큰 터치 영역)
- 키보드 Enter 키 지원
- iOS safe-area 대응

#### 7.2 여행 가계부 (환율 계산기)
- **상태 관리**: Zustand (`store/walletStore.ts`)
- **API**: `/api/exchange/[currency]/route.ts`

**환율 API 연동**:
```typescript
// 실시간 환율 가져오기
fetch(`/api/exchange/USD`)
  .then(res => res.json())
  .then(data => {
    // data.krw.rate: USD → KRW 환율
    // data.lastUpdated: 업데이트 시각
  })
```

**3방향 자동 환산 로직**:
```typescript
// 예: JPY 100 입력 시
100 JPY → KRW (100 * jpy_to_krw_rate)
100 JPY → USD (100 * jpy_to_usd_rate)

// KRW 1000 입력 시
1000 KRW → JPY (1000 / jpy_to_krw_rate)
1000 KRW → USD (1000 / usd_to_krw_rate)
```

**카테고리 시스템**:
- 🍽️ 식비 (food)
- 🛍️ 쇼핑 (shopping)
- 🚌 교통비 (transport)
- 🎉 활동비 (activity)
- 💊 의료비 (medical)
- 🏨 숙박비 (accommodation)
- 💰 기타 (other)

**문제 발생 및 해결**:
- 문제: 여러 통화 동시 지원 시 환율 관리 복잡
- 해결: `exchangeRates` 객체를 `{ [currency]: { krw, usd } }` 구조로 변경
- 문제: 소수점 처리 (JPY는 정수, USD는 소수점 2자리)
- 해결: `CURRENCY_DECIMAL_PLACES` 매핑 테이블

#### 7.3 AI 통번역기
- **음성 인식**: Web Speech API
- **TTS**: SpeechSynthesis API
- **번역**: Gemini API (채팅 API 재활용)

**PTT (Push-To-Talk) 구현**:
```typescript
// 버튼 누르는 동안만 녹음
onMouseDown → startPressToTalk()
onMouseUp → stopPressToTalk()
onTouchStart → startPressToTalk() // 모바일
onTouchEnd → stopPressToTalk()
```

**사진 번역 기능**:
- `/api/vision/route.ts`
- OCR + 번역 파이프라인
- 실패 시 폴백 처리

**대화 이력 관리**:
```typescript
type ConversationItem = {
  id: string;
  from: { flag: string; name: string };
  to: { flag: string; name: string };
  source: string;
  translated: string;
  when: string; // 시각
  kind: 'speech' | 'photo';
}
```

**여행지 기반 자동 언어 설정**:
- 온보딩 destination 읽기
- `DESTINATION_LANGUAGE_MAP`에서 언어 코드 조회
- 버튼 동적 생성 (🇰🇷 ↔ 🇯🇵 등)

**발견된 브라우저 호환성 이슈**:
- Safari: `webkitSpeechRecognition` 사용
- Firefox: 음성 인식 미지원 → 경고 메시지
- Chrome/Edge: 완벽 지원

---

### Phase 8: 세계 지도 시각화 (Week 18-19)

#### 8.1 라이브러리 선정
- **react-simple-maps**: SVG 기반 지도
- **d3-geo**: 지리 좌표 계산
- **topojson-client**: TopoJSON 파싱

#### 8.2 국가 데이터 준비
- **파일**: `/public/data/countries-110m.json`
- **대륙별 국가 매핑**:
  ```typescript
  const CONTINENTS_DATA = {
    Asia: [
      { koreanName: "대한민국", englishName: "South Korea" },
      { koreanName: "일본", englishName: "Japan" },
      // ...
    ],
    Europe: [...],
    // ...
  }
  ```

#### 8.3 방문 횟수 기반 색상 매핑
```typescript
// 사용자의 모든 여행에서 국가별 방문 횟수 집계
const visitCounts = trips.reduce((acc, trip) => {
  const country = extractCountry(trip.destination);
  acc[country] = (acc[country] || 0) + 1;
  return acc;
}, {});

// d3-scale로 색상 맵핑
const colorScale = scaleQuantile()
  .domain([0, 1, 2, 3, 4, 5])
  .range(['#E3F2FD', '#90CAF9', '#42A5F5', '#1E88E5', '#1565C0']);
```

#### 8.4 대륙 필터링
- 탭 UI로 대륙 선택
- 선택된 대륙만 하이라이트
- 나머지는 회색으로 표시

**성능 이슈 및 해결**:
- 문제: 지도 렌더링 느림 (모든 국가 polygon)
- 해결: `useMemo`로 필터링된 국가만 렌더링
- 문제: 줌/팬 시 버벅임
- 해결: `ZoomableGroup`의 `maxZoom` 제한

---

### Phase 9: D-Day 알림 시스템 (Week 20)

#### 9.1 D-Day 메시지 데이터 설계
- **파일**: `data/dday_messages.json`
```json
{
  "messages": {
    "7": {
      "title": "출발 일주일 전! 준비물을 확인하세요 🧳",
      "message": "<p>여권 유효기간을 체크하셨나요?</p>"
    },
    "3": { ... },
    "1": { ... },
    "0": { ... }
  }
}
```

#### 9.2 D-Day 계산 로직
```typescript
const parseDate = (dateStr: string): Date => {
  // "2025년 10월 19일" 형식 파싱
  const parts = dateStr.match(/(\d{4})년 (\d{1,2})월 (\d{1,2})일/);
  return new Date(year, month - 1, day);
};

const today = new Date();
const startDate = parseDate(trip.startDate);
const diffDays = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));

// diffDays가 7, 3, 1, 0일 때 모달 표시
```

#### 9.3 모달 표시 제어
- 세션당 1회만 표시 (`hasShownDdayModal` state)
- 새로고침 시 다시 표시되지 않도록
- LocalStorage 저장 고려 (추후)

**개선 필요**:
- [ ] LocalStorage로 영구 저장
- [ ] 사용자가 "다시 보지 않기" 옵션
- [ ] 푸시 알림 연동

---

### Phase 10: 관리자 페이지 (Week 21-22)

#### 10.1 관리자 인증
- 별도 로그인 페이지: `/app/admin/login`
- role 체크: `user.role === 'admin'`
- 미들웨어에서 권한 검증

#### 10.2 회원 관리
- **회원 목록**: `/app/admin/users`
- **회원 상세**: `/app/admin/users/[id]`
  - 프로필 정보
  - 여행 목록
  - 비밀번호 상태
  - 로그인 로그

**API 엔드포인트**:
- `GET /api/admin/users` - 전체 회원 목록
- `GET /api/admin/users/[id]` - 회원 상세
- `POST /api/admin/users/[id]/reset-password` - 비밀번호 리셋
- `GET /api/admin/password-events` - 비밀번호 변경 이력

**현재 미완성 부분**:
- [ ] 비밀번호 리셋 기능
- [ ] 회원 탈퇴 처리
- [ ] 여행 수정/삭제 권한

#### 10.3 대시보드 (초안)
- 전체 회원 수
- 활성 여행 수
- 오늘의 신규 가입자
- 인기 목적지 TOP 5

---

## 🏗️ 현재 시스템 구조

### 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Login   │  │Onboarding│  │   Chat   │  │  Profile │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │Checklist │  │  Wallet  │  │Translator│  │   Map    │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
├─────────────────────────────────────────────────────────────┤
│                      State Management                        │
│  ┌────────────────┐  ┌────────────────┐                     │
│  │ Zustand Stores │  │ React Context  │                     │
│  └────────────────┘  └────────────────┘                     │
├─────────────────────────────────────────────────────────────┤
│                        API Routes                            │
│  /api/auth/*  /api/chat  /api/trips  /api/photos           │
│  /api/exchange/*  /api/vision  /api/nav  /api/admin/*      │
├─────────────────────────────────────────────────────────────┤
│                      Business Logic                          │
│  lib/gemini.ts  lib/nav/*  lib/chat/*  lib/auth.ts         │
├─────────────────────────────────────────────────────────────┤
│                         Database                             │
│              Prisma ORM + SQLite (dev.db)                    │
│  User | Trip | Session | LoginLog | PasswordEvent          │
├─────────────────────────────────────────────────────────────┤
│                     External Services                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Gemini AI│  │Google Maps│ │ Web APIs │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### 주요 디렉토리 구조

```
/home/userhyeseon28/projects/cruise-guide/
├── app/                          # Next.js App Router
│   ├── admin/                    # 관리자 페이지
│   ├── api/                      # API 엔드포인트
│   │   ├── auth/                 # 인증 관련
│   │   ├── chat/                 # 채팅 관련
│   │   ├── exchange/             # 환율 API
│   │   ├── nav/                  # 네비게이션
│   │   ├── photos/               # 사진 검색
│   │   ├── trips/                # 여행 관리
│   │   └── vision/               # OCR/번역
│   ├── chat/                     # 채팅 페이지
│   ├── checklist/                # 체크리스트
│   ├── login/                    # 로그인
│   ├── map/                      # 세계 지도
│   ├── onboarding/               # 온보딩
│   ├── profile/                  # 프로필
│   ├── translator/               # 통번역기
│   └── wallet/                   # 가계부
├── components/                   # 재사용 컴포넌트
│   ├── chat/                     # 채팅 관련
│   ├── features/                 # 기능별 컴포넌트
│   └── ui/                       # UI 컴포넌트
├── lib/                          # 비즈니스 로직
│   ├── chat/                     # 채팅 로직
│   ├── nav/                      # 네비게이션 로직
│   ├── geo/                      # 지리 정보
│   ├── auth.ts                   # 인증
│   ├── gemini.ts                 # AI
│   └── prisma.ts                 # DB 클라이언트
├── store/                        # Zustand 스토어
│   ├── checklistStore.ts
│   └── walletStore.ts
├── data/                         # 정적 데이터
│   ├── terminals.json            # 터미널 DB
│   ├── cruise_ships.json
│   ├── dday_messages.json
│   └── image_manifest.json
├── public/                       # 정적 파일
│   ├── photos/                   # 사진 갤러리
│   └── data/                     # 지도 데이터
├── prisma/
│   └── schema.prisma             # DB 스키마
└── scripts/                      # 빌드 스크립트
    └── gen-image-manifest.mjs
```

---

## 🚨 긴급 해결 필요 사항 (IMMEDIATE)

### 1. 채팅 메시지 히스토리 유실 문제 ⚠️⚠️⚠️
**현상**: 새로고침 시 대화 내역 사라짐  
**원인**: 메시지가 컴포넌트 state에만 저장됨  
**영향**: 사용자 경험 저하, 컨텍스트 손실

**해결 방안 (우선순위 높음)**:
```typescript
// 옵션 1: LocalStorage 저장 (빠른 해결)
useEffect(() => {
  localStorage.setItem('chat:messages', JSON.stringify(messages));
}, [messages]);

// 옵션 2: 서버 DB 저장 (권장)
// 새 테이블: ChatHistory
model ChatHistory {
  id        Int      @id @default(autoincrement())
  userId    Int
  sessionId String
  messages  Json     // 메시지 배열
  createdAt DateTime @default(now())
}
```

**실행 계획**:
1. [ ] `ChatHistory` 모델 추가 (Prisma)
2. [ ] `/api/chat/history` 엔드포인트 생성
   - `GET`: 히스토리 로드
   - `POST`: 메시지 저장
3. [ ] `ChatClientShell`에서 히스토리 로드/저장
4. [ ] 테스트: 새로고침 후 메시지 복원 확인

**예상 소요 시간**: 2-3시간

---

### 2. 환율 API 에러 처리 부재 ⚠️⚠️
**현상**: 환율 API 실패 시 앱 크래시  
**원인**: try-catch 있지만 UI에 에러 표시 없음  
**영향**: 사용자가 원인 모른 채 막막함

**해결 방안**:
```typescript
// walletStore.ts에 에러 상태 추가
const useWalletStore = create((set) => ({
  // ...
  error: null as string | null,
  setError: (error: string | null) => set({ error }),
}));

// API 호출 시
try {
  const response = await fetch(`/api/exchange/${currency}`);
  if (!response.ok) throw new Error('환율 정보를 가져올 수 없습니다');
  // ...
} catch (error) {
  setError(error.message);
  // 폴백 환율 사용 또는 재시도 버튼 표시
}
```

**실행 계획**:
1. [ ] 에러 상태 추가
2. [ ] UI에 에러 토스트/배너 표시
3. [ ] 재시도 버튼 구현
4. [ ] 폴백 환율 데이터 준비 (하드코딩)

**예상 소요 시간**: 1-2시간

---

### 3. 이미지 최적화 미흡 ⚠️
**현상**: 사진 갤러리 로딩 느림  
**원인**: 원본 이미지 그대로 로드  
**영향**: 모바일에서 데이터 소모, 느린 로딩

**해결 방안**:
```typescript
// 1. Next.js Image 컴포넌트 제대로 활용
<Image
  src={url}
  alt="..."
  width={600}
  height={400}
  sizes="(max-width: 768px) 100vw, 33vw"
  quality={75}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/..." // 블러 이미지
/>

// 2. 이미지 리사이징 스크립트
// scripts/resize-images.js
// → 썸네일 (300x200), 중간 (800x600), 원본 유지
```

**실행 계획**:
1. [ ] 이미지 리사이징 스크립트 작성
2. [ ] 빌드 시 자동 실행 추가
3. [ ] `image_manifest.json`에 썸네일 경로 포함
4. [ ] 컴포넌트에서 sizes 속성 제대로 설정

**예상 소요 시간**: 3-4시간

---

### 4. 보안 취약점: CSRF 토큰 부재 ⚠️⚠️
**현상**: POST 요청에 CSRF 보호 없음  
**원인**: 빠른 개발 우선으로 보안 후순위  
**영향**: CSRF 공격 가능성

**해결 방안**:
```typescript
// 1. CSRF 토큰 생성 미들웨어
// lib/csrf.ts
import { randomBytes } from 'crypto';

export function generateCsrfToken() {
  return randomBytes(32).toString('hex');
}

export function verifyCsrfToken(token: string, sessionToken: string) {
  return token === sessionToken;
}

// 2. 세션에 토큰 저장
// 3. Form/API 요청 시 헤더에 포함
// 4. 서버에서 검증
```

**실행 계획**:
1. [ ] CSRF 토큰 유틸 함수 작성
2. [ ] 세션에 토큰 추가
3. [ ] 클라이언트에서 토큰 전송 (헤더/쿠키)
4. [ ] 미들웨어에서 검증
5. [ ] 전체 POST/PUT/DELETE 엔드포인트에 적용

**예상 소요 시간**: 4-5시간

---

### 5. 데이터베이스 백업 자동화 부재 ⚠️
**현상**: 수동 백업만 존재 (`dev.db.bak-*`)  
**원인**: 자동화 스크립트 없음  
**영향**: 데이터 손실 위험

**해결 방안**:
```bash
#!/bin/bash
# scripts/backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# SQLite 백업
sqlite3 ./prisma/dev.db ".backup '$BACKUP_DIR/dev_$DATE.db'"

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "dev_*.db" -mtime +7 -delete

echo "Backup completed: dev_$DATE.db"
```

**실행 계획**:
1. [ ] 백업 스크립트 작성
2. [ ] cron 등록 (매일 새벽 2시)
3. [ ] 클라우드 스토리지 업로드 (옵션)
4. [ ] 복원 스크립트 작성

**예상 소요 시간**: 1-2시간

---

### 6. 환경 변수 검증 로직 부재 ⚠️
**현상**: 필수 환경 변수 누락 시 런타임 에러  
**원인**: 앱 시작 시 검증 안 함  
**영향**: 배포 후 문제 발견

**해결 방안**:
```typescript
// lib/env.ts
const requiredEnvVars = [
  'GEMINI_API_KEY',
  'DATABASE_URL',
  'SESSION_SECRET',
  'NEXT_PUBLIC_BASE_URL',
];

export function validateEnv() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing env vars: ${missing.join(', ')}`);
  }
}

// app/layout.tsx (서버 컴포넌트)
import { validateEnv } from '@/lib/env';
validateEnv(); // 앱 시작 시 검증
```

**실행 계획**:
1. [ ] 환경 변수 검증 함수 작성
2. [ ] 루트 레이아웃에서 호출
3. [ ] `.env.example` 파일 업데이트
4. [ ] README에 환경 변수 설명 추가

**예상 소요 시간**: 30분

---

## 📅 단기 개발 계획 (1-2주)

### Week 1: 핵심 버그 수정 및 안정화

#### Day 1-2: 채팅 시스템 개선
- [ ] 메시지 히스토리 DB 저장 구현
- [ ] 세션별 대화 분리
- [ ] 대화 삭제 기능
- [ ] 테스트: 여러 세션에서 메시지 복원

#### Day 3-4: 에러 핸들링 강화
- [ ] 전역 에러 바운더리 추가
- [ ] API 에러 토스트 시스템
- [ ] 환율 API 폴백 데이터
- [ ] 이미지 로드 실패 처리

#### Day 5-7: 보안 강화
- [ ] CSRF 토큰 구현
- [ ] Rate limiting (API 호출 제한)
- [ ] SQL Injection 방어 확인
- [ ] XSS 방어 확인

---

### Week 2: 사용자 경험 개선

#### Day 1-2: 로딩 상태 개선
```typescript
// 스켈레톤 UI 추가
- ChatMessage 로딩 스켈레톤
- 사진 갤러리 로딩 스켈레톤
- 프로필 페이지 로딩 상태

// Suspense 활용
<Suspense fallback={<LoadingSkeleton />}>
  <AsyncComponent />
</Suspense>
```

#### Day 3-4: 응답 속도 개선
- [ ] Gemini API 스트리밍 응답 구현
  ```typescript
  // 현재: 전체 응답 대기 → 한 번에 표시
  // 개선: 토큰 단위로 실시간 표시 (타이핑 효과)
  ```
- [ ] 이미지 lazy loading
- [ ] API 응답 캐싱 (SWR 또는 React Query)

#### Day 5-7: 모바일 UX 개선
- [ ] 터치 제스처 개선
  - 스와이프로 사진 삭제
  - Pull-to-refresh
- [ ] 키보드 가림 문제 해결
  - iOS Virtual Keyboard API
  - Android: viewport 조정
- [ ] 햅틱 피드백 추가 (Vibration API)

---

## 🎯 중기 개발 계획 (1-2개월)

### Month 1: 기능 확장

#### Week 1-2: AI 채팅 고도화

**1. 컨텍스트 관리 시스템**
```typescript
// lib/chat/context.ts
export class ChatContext {
  private history: Message[] = [];
  private maxTokens = 4000;

  addMessage(msg: Message) {
    this.history.push(msg);
    this.trimToTokenLimit();
  }

  private trimToTokenLimit() {
    // 토큰 수 계산 (대략 4자 = 1토큰)
    // 오래된 메시지부터 제거
  }

  getContextMessages() {
    return this.history;
  }
}
```

**2. 의도 분류 개선**
```typescript
// 현재: 단순 키워드 매칭
// 개선: Gemini로 의도 분류
const intent = await classifyIntent(userMessage);
// → { type: 'directions', confidence: 0.95, entities: {...} }
```

**3. 멀티턴 대화 지원**
```typescript
// 예시:
User: "일본 크루즈 터미널 알려줘"
AI: "일본에는 요코하마, 고베, 나가사키 터미널이 있어요"
User: "요코하마로 가는 법 알려줘"  // ← 이전 컨텍스트 이용
AI: "인천공항에서 요코하마까지..." // ← 사용자 온보딩 정보 활용
```

**4. FAQ 자동 응답**
```typescript
// data/knowledge_base.json 활용
// 임베딩 기반 유사 질문 매칭 (옵션: OpenAI Embeddings)
// 또는 단순 키워드 매칭
```

**실행 계획**:
1. [ ] ChatContext 클래스 구현
2. [ ] 컨텍스트를 포함한 Gemini 호출
3. [ ] FAQ 데이터 정리 및 매칭 로직
4. [ ] 엔티티 추출 (날짜, 장소, 크루즈명 등)
5. [ ] 테스트: 복잡한 대화 시나리오

---

#### Week 3-4: 푸시 알림 시스템

**1. Service Worker 설정**
```typescript
// public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.message,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: { url: data.url },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  clients.openWindow(event.notification.data.url);
});
```

**2. 알림 구독 관리**
```typescript
// components/PushSubscriptionButton.tsx
const subscribeToPush = async () => {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  // 서버에 구독 정보 저장
  await fetch('/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
  });
};
```

**3. 서버 푸시 전송**
```typescript
// lib/push.ts
import webpush from 'web-push';

export async function sendPushNotification(subscription, payload) {
  await webpush.sendNotification(subscription, JSON.stringify(payload));
}

// 사용 예시: D-Day 알림
const subscriptions = await getUserSubscriptions(userId);
for (const sub of subscriptions) {
  await sendPushNotification(sub, {
    title: '내일 출발이에요! 🚢',
    message: '여권과 E-티켓을 다시 한 번 확인하세요',
    url: '/checklist',
  });
}
```

**4. 알림 스케줄링**
```typescript
// 크론 작업 (예: node-cron)
cron.schedule('0 9 * * *', async () => {
  // 매일 오전 9시
  const usersWithUpcomingTrips = await findUsersWithDday();
  for (const user of usersWithUpcomingTrips) {
    await sendDdayNotification(user);
  }
});
```

**실행 계획**:
1. [ ] Service Worker 작성 및 등록
2. [ ] 푸시 구독 UI 추가
3. [ ] 구독 정보 DB 저장 (PushSubscription 테이블)
4. [ ] 서버 푸시 전송 로직
5. [ ] D-Day, 체크리스트, 환율 변동 등 알림 시나리오
6. [ ] 알림 설정 페이지 (ON/OFF, 시간 설정)

---

### Month 2: 소셜 기능 및 커뮤니티

#### Week 1-2: 여행 후기 시스템

**1. 데이터 모델**
```prisma
model TripReview {
  id          Int      @id @default(autoincrement())
  tripId      Int
  trip        Trip     @relation(fields: [tripId], references: [id])
  userId      Int
  user        User     @relation(fields: [userId], references: [id])
  rating      Int      // 1-5
  title       String
  content     String
  photos      Json?    // 사진 URL 배열
  likes       Int      @default(0)
  views       Int      @default(0)
  isPublic    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ReviewComment {
  id        Int      @id @default(autoincrement())
  reviewId  Int
  review    TripReview @relation(...)
  userId    Int
  user      User     @relation(...)
  content   String
  createdAt DateTime @default(now())
}

model ReviewLike {
  userId    Int
  reviewId  Int
  @@unique([userId, reviewId])
}
```

**2. 후기 작성 UI**
```typescript
// components/TripReviewForm.tsx
- 별점 선택 (1-5)
- 제목 입력
- 본문 입력 (마크다운 지원)
- 사진 업로드 (최대 10장)
- 공개/비공개 설정
- 태그 추가 (크루즈선, 항로, 추천도 등)
```

**3. 후기 피드**
```typescript
// app/community/page.tsx
- 최신 후기 목록
- 인기 후기 (좋아요 많은 순)
- 필터링 (크루즈선, 목적지, 시기)
- 검색 기능
```

**실행 계획**:
1. [ ] 스키마 추가 및 마이그레이션
2. [ ] 후기 작성 폼 구현
3. [ ] 이미지 업로드 (Cloudinary 또는 S3)
4. [ ] 후기 목록 페이지
5. [ ] 후기 상세 페이지 (댓글, 좋아요)
6. [ ] 마이 프로필에 내 후기 목록

---

#### Week 3-4: 친구 및 그룹 기능

**1. 친구 시스템**
```prisma
model Friendship {
  id         Int      @id @default(autoincrement())
  userId     Int
  friendId   Int
  status     String   // pending, accepted, blocked
  createdAt  DateTime @default(now())
  @@unique([userId, friendId])
}
```

**2. 그룹 여행**
```prisma
model TravelGroup {
  id          Int      @id @default(autoincrement())
  name        String
  tripId      Int
  trip        Trip     @relation(...)
  createdBy   Int
  members     GroupMember[]
  sharedItems GroupSharedItem[]
}

model GroupMember {
  groupId   Int
  userId    Int
  role      String   // admin, member
  @@unique([groupId, userId])
}

model GroupSharedItem {
  id        Int      @id @default(autoincrement())
  groupId   Int
  type      String   // checklist, expense, photo
  content   Json
}
```

**3. 그룹 기능**
- 공유 체크리스트
- 공유 가계부 (각자 지출 입력)
- 그룹 사진 앨범
- 그룹 채팅

**실행 계획**:
1. [ ] 친구 요청/수락/거절 UI
2. [ ] 친구 목록 페이지
3. [ ] 그룹 생성 및 초대
4. [ ] 그룹 상세 페이지
5. [ ] 공유 기능 구현 (체크리스트, 가계부)
6. [ ] 그룹 알림 (새 멤버, 새 지출 등)

---

## 🌟 장기 개발 계획 (3-6개월)

### Quarter 1: 고급 AI 기능

#### 1. 개인화된 추천 시스템
```typescript
// 사용자의 과거 여행 데이터 분석
// → 선호 목적지, 크루즈선, 활동 파악
// → 다음 여행 추천

// 예시:
"혜선님은 일본 크루즈를 3번 다녀오셨네요!
이번에는 대만이나 홍콩 크루즈는 어떠세요?
MSC 벨리시마 5박6일 대만 일주 상품이 있어요 🚢"
```

#### 2. 똑똑한 일정 제안
```typescript
// 항구별 체류 시간 분석
// → 효율적인 관광 루트 제안
// → 시간대별 추천 활동

// 예시:
"요코하마 정박: 09:00-18:00 (9시간)
추천 일정:
09:30 - 미나토미라이 (배에서 도보 15분)
12:00 - 차이나타운 점심
14:00 - 야마시타 공원
16:00 - 쇼핑 (아카렌가)
17:30 - 승선"
```

#### 3. 다국어 AI 지원
- UI 번역: 한국어, 영어, 일본어, 중국어
- AI 응답 다국어 지원
- 음성 인식/TTS 다국어

---

### Quarter 2: 고급 분석 및 대시보드

#### 1. 사용자 대시보드
- 총 여행 거리 (km)
- 방문한 국가/도시 수
- 총 지출 통계
- 연도별 여행 히트맵
- 크루즈선별 탑승 횟수

#### 2. 관리자 분석 도구
- 실시간 활성 사용자 수
- 인기 목적지 분석
- 사용자 유지율 (Retention)
- 기능별 사용 빈도
- 챗봇 대화 분석 (인텐트 분포)

#### 3. 비즈니스 인텔리전스
- 크루즈 상품 인기도
- 시즌별 예약 트렌드
- 가격 민감도 분석
- 고객 세그멘테이션

---

### Quarter 3-4: 플랫폼 확장

#### 1. 모바일 앱 (React Native)
- iOS/Android 네이티브 앱
- 오프라인 모드 강화
- 위치 기반 자동 알림
- 카메라 통합 (사진 자동 업로드)

#### 2. 파트너십 통합
- 크루즈 선사 API 연동 (실시간 요금)
- 항공권 검색 연동 (Skyscanner 등)
- 호텔 예약 연동 (Booking.com 등)
- 투어/액티비티 예약 (Klook, Viator)

#### 3. 수익화 모델
- 프리미엄 기능 (광고 제거, 무제한 사진 등)
- 크루즈 예약 수수료
- 파트너 제휴 수수료
- 기업용 그룹 여행 관리 솔루션

---

## 🔧 기술 부채 및 리팩토링

### 1. 코드 품질 개선

#### TypeScript 타입 강화
```typescript
// 현재 문제:
// - any 타입 남용
// - JSON 타입의 명확한 정의 부재
// - 타입 가드 부족

// 개선:
// 1. 모든 any를 구체적 타입으로 교체
// 2. JSON 필드에 대한 타입 정의
type TripDestination = {
  country: string;
  city?: string;
  port?: string;
}[];

// 3. 타입 가드 함수
function isChatMessage(obj: any): obj is ChatMessage {
  return 'role' in obj && 'type' in obj;
}
```

#### API 응답 타입 통일
```typescript
// lib/api-types.ts
export type ApiResponse<T> = {
  ok: true;
  data: T;
} | {
  ok: false;
  error: string;
  code?: string;
};

// 모든 API에서 동일한 형식 사용
export async function POST(req: Request) {
  try {
    const data = await someOperation();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

### 2. 컴포넌트 리팩토링

#### 큰 컴포넌트 분리
```typescript
// 현재: ChatClientShell.tsx (500+ 줄)
// → 너무 복잡, 유지보수 어려움

// 리팩토링:
ChatClientShell
  ├─ ChatMessageList
  │   ├─ TextMessage
  │   ├─ MapLinksMessage
  │   └─ PhotoGalleryMessage
  ├─ ChatInputArea
  │   ├─ TextInput
  │   ├─ VoiceInput
  │   └─ PhotoInput
  └─ ChatSuggestions
```

#### Custom Hooks 추출
```typescript
// hooks/useChat.ts
export function useChat(mode: ChatInputMode) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (text: string) => {
    // ... 로직
  };

  return { messages, isLoading, sendMessage };
}

// hooks/useWallet.ts
export function useWallet() {
  // walletStore 로직을 훅으로 래핑
}
```

---

### 3. 데이터베이스 최적화

#### 인덱스 추가
```prisma
model Trip {
  // ...
  @@index([userId, startDate])
  @@index([destination])
}

model ChatHistory {
  // ...
  @@index([userId, createdAt])
}

model TripReview {
  // ...
  @@index([tripId, isPublic])
  @@index([userId, createdAt])
}
```

#### 쿼리 최적화
```typescript
// 현재: N+1 쿼리 문제
const users = await prisma.user.findMany();
for (const user of users) {
  const trips = await prisma.trip.findMany({ where: { userId: user.id } });
  // ...
}

// 개선: include로 한 번에
const users = await prisma.user.findMany({
  include: {
    trips: true,
  },
});
```

#### 페이지네이션
```typescript
// 현재: 모든 데이터 로드
const allTrips = await prisma.trip.findMany();

// 개선: 커서 기반 페이지네이션
const trips = await prisma.trip.findMany({
  take: 20,
  skip: 1,
  cursor: { id: lastSeenId },
  orderBy: { createdAt: 'desc' },
});
```

---

### 4. 프론트엔드 성능 최적화

#### 번들 크기 줄이기
```javascript
// next.config.mjs
export default {
  // 1. 동적 임포트
  experimental: {
    optimizePackageImports: ['react-icons', 'date-fns'],
  },

  // 2. 이미지 최적화
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // 3. 불필요한 폴리필 제거
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};
```

#### React 최적화
```typescript
// 1. useMemo, useCallback 적절히 사용
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

// 2. React.memo로 불필요한 리렌더 방지
export const ChatMessage = React.memo(({ message }) => {
  // ...
}, (prev, next) => prev.message.id === next.message.id);

// 3. 가상 스크롤링 (react-window)
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={messages.length}
  itemSize={100}
>
  {({ index, style }) => (
    <div style={style}>
      <ChatMessage message={messages[index]} />
    </div>
  )}
</FixedSizeList>
```

---

## ⚡ 성능 최적화 계획

### 1. 서버 사이드 최적화

#### API 응답 캐싱
```typescript
// lib/cache.ts (Redis 또는 메모리 캐시)
import { LRUCache } from 'lru-cache';

const cache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 5, // 5분
});

export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = cache.get(key);
  if (cached) return cached as T;

  const fresh = await fetcher();
  cache.set(key, fresh);
  return fresh;
}

// 사용 예시:
export async function GET() {
  const terminals = await getCachedOrFetch('terminals:all', async () => {
    return await prisma.terminal.findMany();
  });
  return NextResponse.json(terminals);
}
```

#### 데이터베이스 연결 풀링
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

### 2. 클라이언트 사이드 최적화

#### Code Splitting
```typescript
// 동적 임포트로 초기 번들 크기 감소
const PhotoAlbumModal = dynamic(() => import('@/components/PhotoAlbumModal'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

const MapPage = dynamic(() => import('@/app/map/page'), {
  loading: () => <MapSkeleton />,
});
```

#### 이미지 최적화
```typescript
// 1. WebP/AVIF 포맷 사용
// 2. 적절한 크기 제공 (srcset)
// 3. Lazy loading
// 4. 블러 placeholder

<Image
  src="/photos/terminal.jpg"
  alt="Terminal"
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, 50vw"
  quality={80}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/webp;base64,..."
/>
```

---

### 3. 네트워크 최적화

#### HTTP/2 Server Push
```javascript
// next.config.mjs
export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Link',
            value: '</fonts/inter.woff2>; rel=preload; as=font; crossorigin',
          },
        ],
      },
    ];
  },
};
```

#### Service Worker 캐싱
```javascript
// public/sw.js
const CACHE_NAME = 'cruise-guide-v1';
const STATIC_ASSETS = [
  '/',
  '/login',
  '/chat',
  '/offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

---

## 📊 성능 목표 (Lighthouse 기준)

### 현재 추정치
- Performance: 60-70
- Accessibility: 80-85
- Best Practices: 75-80
- SEO: 70-75

### 목표치 (3개월 후)
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+

### 개선 액션
1. [ ] 초기 로딩 시간 < 2초
2. [ ] Time to Interactive < 3초
3. [ ] Largest Contentful Paint < 2.5초
4. [ ] Cumulative Layout Shift < 0.1
5. [ ] First Input Delay < 100ms

---

## 📝 문서화 계획

### 1. 코드 문서화
```typescript
/**
 * 크루즈 터미널을 검색하는 함수
 * 
 * @param query - 검색 키워드 (예: "요코하마", "Port Miami")
 * @param hint - 출발지 힌트 (국가 추론에 사용)
 * @returns 매칭된 터미널 배열 (최대 12개)
 * 
 * @example
 * findDestinations("크루즈 터미널", "인천공항")
 * // → 한국 크루즈 터미널들 반환
 */
export function findDestinations(query: string, hint?: string): POI[] {
  // ...
}
```

### 2. API 문서
```markdown
# API Reference

## POST /api/chat

채팅 메시지를 전송하고 AI 응답을 받습니다.

### Request
```json
{
  "text": "요코하마 터미널 사진 보여줘",
  "mode": "photos"
}
```

### Response
```json
{
  "ok": true,
  "messages": [
    {
      "id": "123",
      "role": "assistant",
      "type": "photo-gallery",
      "images": [...]
    }
  ]
}
```
```

### 3. 사용자 가이드
- 온보딩 가이드
- 주요 기능 튜토리얼
- FAQ
- 문제 해결 가이드

---

## 🚀 배포 계획

### 1. 스테이징 환경 구축
```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [ develop ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Build
        run: npm run build
      - name: Deploy to Vercel (Staging)
        run: vercel --prod
```

### 2. 프로덕션 배포
- Vercel 또는 Netlify
- 환경 변수 설정
- 커스텀 도메인
- SSL 인증서

### 3. CI/CD 파이프라인
- 자동 테스트
- 코드 품질 체크 (ESLint, Prettier)
- 타입 체크
- 빌드 검증
- 자동 배포

---

## 📈 우선순위 요약

### 🔴 긴급 (1주 이내)
1. 채팅 히스토리 저장
2. 환율 API 에러 처리
3. CSRF 토큰 구현
4. 환경 변수 검증
5. DB 백업 자동화

### 🟡 중요 (2-4주)
1. 이미지 최적화
2. 로딩 상태 개선
3. Gemini 스트리밍 응답
4. 모바일 UX 개선
5. 에러 바운더리

### 🟢 일반 (1-2개월)
1. AI 컨텍스트 관리
2. 푸시 알림
3. 여행 후기 시스템
4. 친구/그룹 기능
5. 성능 최적화

### 🔵 장기 (3-6개월)
1. 개인화 추천
2. 다국어 지원
3. 모바일 앱
4. 파트너십 통합
5. 수익화 모델

---

## ✅ 체크리스트 템플릿

### 새 기능 개발 시
- [ ] 요구사항 명확화
- [ ] 데이터 모델 설계
- [ ] API 설계
- [ ] UI/UX 목업
- [ ] 구현
- [ ] 단위 테스트
- [ ] 통합 테스트
- [ ] 코드 리뷰
- [ ] 문서화
- [ ] 배포

### 버그 수정 시
- [ ] 재현 가능 여부 확인
- [ ] 원인 파악
- [ ] 수정 방안 논의
- [ ] 수정 구현
- [ ] 회귀 테스트
- [ ] 배포
- [ ] 모니터링

---

## 📞 연락처 및 리소스

### 개발자
- 이름: [개발자명]
- 이메일: [이메일]
- GitHub: [링크]

### 외부 서비스
- Gemini API: https://ai.google.dev/
- Google Maps: https://developers.google.com/maps
- Vercel: https://vercel.com

### 참고 문서
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- Tailwind: https://tailwindcss.com/docs

---

**마지막 업데이트**: 2025년 10월 18일  
**다음 리뷰 예정**: 2025년 11월 1일


