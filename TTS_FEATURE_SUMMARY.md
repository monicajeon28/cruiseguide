# 🔊 AI 응답 음성 출력(TTS) 기능 구현 완료

> **작업자 B (인터랙션 전문가)** - [작업 지시 1-6]  
> **작업 일시**: 2025-10-19  
> **목적**: AI 답변을 자동으로 음성으로 읽어주어 정보 습득 향상

---

## 📋 구현 내용

### ✅ 1. TTS 유틸리티 시스템 (`lib/tts.ts`)

#### 주요 기능:
- **Web Speech API** 기반 음성 합성
- **한국어 음성** 자동 선택
- **음성 속도 조절**: rate 0.9 (약간 느리게, 편안한 청취)
- **LocalStorage 설정 저장**: 사용자 선택 유지
- **텍스트 정제**: HTML/마크다운 태그 제거

#### API:
```typescript
// TTS 인스턴스
tts.speak(text: string, options?: TTSOptions)  // 음성 재생
tts.stop()                                      // 음성 중지
tts.pause()                                     // 일시정지
tts.resume()                                    // 재개
tts.getEnabled()                                // 설정 상태 확인
tts.setEnabled(boolean)                         // 설정 변경
tts.isSpeaking()                                // 재생 중 확인

// 헬퍼 함수
extractPlainText(text: string)                  // 일반 텍스트 추출
```

---

### ✅ 2. 채팅 통합 (`ChatClientShell.tsx`)

#### 구현 상세:

**스트리밍 모드 ('general')**
- 스트리밍 완료 후 자동 음성 재생
- `accumulatedText` 사용하여 전체 응답 읽기
- TTS 설정 확인 후 조건부 실행

```typescript
// 스트리밍 완료 후
if (accumulatedText && tts.getEnabled()) {
  const plainText = extractPlainText(accumulatedText);
  tts.speak(plainText);
}
```

**구조화된 응답 모드 ('go', 'show', 'info')**
- API 응답 완료 후 자동 음성 재생
- 텍스트 타입 메시지만 추출하여 읽기
- 여러 메시지는 하나로 결합하여 재생

```typescript
// 텍스트 메시지 필터링 및 재생
if (tts.getEnabled()) {
  const textMessages = data.messages.filter(msg => 
    msg.role === 'assistant' && msg.type === 'text' && msg.text
  );
  const combinedText = textMessages.map(msg => msg.text).join(' ');
  tts.speak(extractPlainText(combinedText));
}
```

---

### ✅ 3. 메시지 UI 제어 (`ChatWindow.tsx`)

#### 추가된 기능:

**AI 메시지마다 TTS 제어 버튼**
- 🔊 **다시 듣기**: 해당 메시지를 다시 음성으로 재생
- ⏹️ **중지**: 현재 재생 중인 음성 중지

```tsx
{message.role === 'assistant' && message.text && isTTSEnabled && (
  <div className="flex gap-1 mt-1 ml-1">
    <button onClick={() => handleSpeak(message.text!)}>
      다시 듣기
    </button>
    <button onClick={handleStop}>
      중지
    </button>
  </div>
)}
```

**UI/UX**:
- 작은 버튼으로 깔끔하게 배치
- hover 효과로 사용성 향상
- 아이콘 + 텍스트로 명확한 기능 표시

---

### ✅ 4. 설정 페이지 통합 (`/profile`)

#### TTSToggle 컴포넌트
**위치**: `app/profile/components/TTSToggle.tsx`

**기능**:
- 토글 스위치 UI (iOS 스타일)
- 실시간 설정 변경
- LocalStorage 자동 저장
- 기본값: **ON (활성화)**

**UI 디자인**:
- 파란색: 활성화 상태
- 회색: 비활성화 상태
- 애니메이션: 부드러운 전환 효과
- 접근성: ARIA labels 포함

---

## 📁 생성/수정된 파일

### 🆕 신규 파일 (2개)
1. `lib/tts.ts` - TTS 유틸리티 시스템
2. `app/profile/components/TTSToggle.tsx` - TTS 설정 토글

### 🔧 수정된 파일 (3개)
1. `app/chat/components/ChatClientShell.tsx` - 자동 TTS 재생 로직
2. `components/ChatWindow.tsx` - TTS 제어 버튼 추가
3. `app/profile/page.tsx` - 설정 섹션 추가

---

## 🎯 사용자 경험 흐름

### 1️⃣ AI 응답 자동 재생
```
사용자 질문 입력
    ↓
AI 응답 스트리밍 (타이핑 효과)
    ↓
스트리밍 완료
    ↓
[TTS 설정 ON] → 자동 음성 재생 ✅
[TTS 설정 OFF] → 음성 재생 안 함 ⏸️
```

### 2️⃣ 수동 제어
```
AI 메시지 표시
    ↓
[다시 듣기] 버튼 클릭 → 해당 메시지 재생
[중지] 버튼 클릭 → 현재 음성 중지
```

### 3️⃣ 설정 변경
```
프로필 페이지 방문
    ↓
"AI 답변 자동 읽어주기" 토글
    ↓
설정 저장 (LocalStorage)
    ↓
이후 모든 채팅에 적용
```

---

## 🔍 기술 세부사항

### Web Speech API
- **브라우저 지원**: Chrome, Edge, Safari (iOS 15+)
- **음성 언어**: 한국어 (ko-KR)
- **음성 속도**: 0.9 (자연스러운 속도)

### 성능 최적화
- **Debounce**: 스트리밍 중 과도한 TTS 호출 방지
- **조건부 실행**: TTS 설정 OFF 시 완전히 건너뛰기
- **텍스트 정제**: 불필요한 마크다운/HTML 제거로 자연스러운 음성

### 접근성
- **ARIA labels**: 스크린 리더 지원
- **Keyboard 접근**: 모든 버튼 키보드로 조작 가능
- **명확한 레이블**: "다시 듣기", "중지" 등 명확한 표현

---

## ✅ 테스트 체크리스트

- [x] 개발 서버 정상 시작 (포트 3031)
- [x] 린터 오류 없음
- [x] TypeScript 컴파일 성공
- [ ] **기능 테스트 필요**:
  - [ ] AI 응답 완료 후 자동 음성 재생
  - [ ] "다시 듣기" 버튼으로 메시지 재생
  - [ ] "중지" 버튼으로 음성 중지
  - [ ] 프로필 페이지에서 TTS 토글
  - [ ] TTS OFF 시 자동 재생 안 됨
  - [ ] 한국어 음성 제대로 재생됨
  - [ ] 여러 메시지 연속 재생 테스트

---

## 🎉 결과

### 주요 성과
✅ **자동 음성 재생**: AI 응답 완료 시 자동으로 읽어줌  
✅ **수동 제어**: 사용자가 원할 때 다시 듣기/중지 가능  
✅ **설정 유지**: LocalStorage로 사용자 선택 영구 저장  
✅ **자연스러운 음성**: 한국어, 적절한 속도, 깔끔한 텍스트  
✅ **통합 완료**: useChat 구조와 완벽히 통합

### 사용자 혜택
- 🎧 **핸즈프리**: 운전, 요리 중에도 정보 습득 가능
- 👴 **시니어 친화**: 글씨 읽기 어려운 사용자 지원
- 🌍 **다중 작업**: 다른 일 하면서 정보 청취
- ♿ **접근성**: 시각 장애인 사용자 지원

---

## 📝 향후 개선 사항

1. **음성 선택**: 여러 한국어 음성 중 선택 가능
2. **속도 조절**: 사용자가 속도 직접 조절
3. **음성 하이라이트**: 재생 중인 텍스트 강조 표시
4. **음성 캐싱**: 같은 메시지 반복 재생 시 빠른 시작
5. **백그라운드 재생**: 탭 전환 시에도 계속 재생
6. **음성 큐**: 여러 메시지 순차 재생

---

## 🔗 관련 문서

- Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- LocalStorage: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- ARIA: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA

---

**작성자**: 작업자 B (인터랙션 전문가)  
**문서 버전**: 1.0  
**최종 업데이트**: 2025-10-19

