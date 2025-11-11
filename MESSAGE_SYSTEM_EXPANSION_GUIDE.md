# 고객 메시지 시스템 확장 가이드

## 📋 개요

기존 "고객 메시지 & 긴급공지" 시스템을 확장하여 다음 기능을 추가합니다:
1. **크루즈가이드 메시지** (기존 기능, 이름 변경)
2. **이메일 보내기** (신규)
3. **카카오톡 알림톡** (신규)
4. **SMS 보내기** (신규)

---

## ✅ 가능성 분석

### 1. 이메일 보내기 ✅ **가능**
- **필요한 것**: SMTP 서버 설정
- **옵션**:
  - Gmail SMTP (무료, 일일 500통 제한)
  - Naver SMTP (무료, 일일 500통 제한)
  - SendGrid (무료 플랜: 일일 100통)
  - AWS SES (유료, 저렴)
- **구현 난이도**: ⭐⭐ (보통)

### 2. 카카오톡 알림톡 ✅ **가능**
- **필요한 것**:
  - 카카오 비즈니스 계정 (무료)
  - 알림톡 템플릿 등록 (카카오 비즈니스에서 승인 필요)
  - REST API 키
- **비용**: 무료 (월 1,000통까지 무료, 이후 건당 과금)
- **구현 난이도**: ⭐⭐⭐ (보통~어려움)

### 3. SMS 보내기 ✅ **가능**
- **필요한 것**: SMS 발송 API 서비스
- **옵션**:
  - **알리고 (Aligo)** ⭐ 추천
    - 가입: https://www.aligo.in/
    - 비용: 건당 20원~30원
    - 구현 난이도: ⭐⭐ (쉬움)
  - **카카오 알림톡 SMS** (카카오톡 알림톡과 동일 계정 사용 가능)
    - 비용: 건당 20원~30원
  - **NHN Cloud SMS**
    - 비용: 건당 20원~30원
- **구현 난이도**: ⭐⭐ (보통)

---

## 🎯 구현 단계

### Phase 1: 카테고리 분리 및 UI 수정

#### 1-1. 관리자 메시지 페이지 수정
**파일**: `app/admin/messages/page.tsx`

**작업 내용**:
- 메시지 타입에 "크루즈가이드 메시지" 추가
- 새로운 메시지 작성 모달에 "발송 방식" 선택 추가:
  - 크루즈가이드 메시지 (기존)
  - 이메일 보내기
  - 카카오톡 알림톡
  - SMS 보내기

#### 1-2. 메시지 타입 필드 확장
**데이터베이스 스키마 수정 필요 없음** (기존 `messageType` 필드 활용)

**새로운 메시지 타입**:
- `cruise-guide`: 크루즈가이드 메시지 (기존)
- `email`: 이메일
- `kakao`: 카카오톡 알림톡
- `sms`: SMS

---

### Phase 2: 이메일 발송 기능 구현

#### 2-1. 이메일 서비스 선택 및 설정

**추천: Gmail SMTP (가장 간단)**

**설정 단계**:
1. Gmail 계정 준비
2. Google 계정 설정 → 보안 → 2단계 인증 활성화
3. 앱 비밀번호 생성:
   - Google 계정 → 보안 → 2단계 인증 → 앱 비밀번호
   - "메일" 선택 → "기타(맞춤 이름)" → "Cruise Guide" 입력
   - 생성된 16자리 비밀번호 복사

**환경 변수 추가** (`.env.local`):
```env
# 이메일 설정 (Gmail SMTP)
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=your-email@gmail.com
EMAIL_SMTP_PASSWORD=your-app-password-16-digits
EMAIL_FROM_NAME=크루즈 가이드
EMAIL_FROM_ADDRESS=your-email@gmail.com
```

#### 2-2. 이메일 발송 라이브러리 설치

**터미널에서 실행**:
```bash
cd /home/userhyeseon28/projects/cruise-guide
npm install nodemailer
npm install --save-dev @types/nodemailer
```

#### 2-3. 이메일 발송 API 생성

**파일 생성**: `app/api/admin/messages/send-email/route.ts`

**기능**:
- 선택한 고객들에게 이메일 발송
- HTML 형식 지원
- 발송 결과 기록

---

### Phase 3: 카카오톡 알림톡 기능 구현

#### 3-1. 카카오 비즈니스 계정 설정

**설정 단계**:
1. 카카오 비즈니스 계정 가입: https://business.kakao.com/
2. 앱 생성:
   - 내 애플리케이션 → 애플리케이션 추가하기
   - 앱 이름: "크루즈 가이드"
   - 사업자명 입력
3. 알림톡 서비스 신청:
   - 알림톡 → 서비스 신청
   - 사업자 정보 입력 및 승인 대기
4. 알림톡 템플릿 등록:
   - 알림톡 → 템플릿 만들기
   - 템플릿 제목: "크루즈 가이드 공지사항"
   - 템플릿 내용 예시:
     ```
     [크루즈 가이드]
     {{#title}}
     {{#content}}
     
     자세한 내용은 앱에서 확인하세요.
     ```
   - 승인 대기 (보통 1-2일 소요)
5. REST API 키 발급:
   - 내 애플리케이션 → 앱 키 → REST API 키 복사

**환경 변수 추가** (`.env.local`):
```env
# 카카오톡 알림톡 설정
KAKAO_REST_API_KEY=your-rest-api-key
KAKAO_ADMIN_KEY=your-admin-key (선택사항)
KAKAO_ALIMTALK_TEMPLATE_ID=your-template-id
```

#### 3-2. 카카오톡 알림톡 발송 API 생성

**파일 생성**: `app/api/admin/messages/send-kakao/route.ts`

**기능**:
- 카카오 알림톡 API 호출
- 템플릿 변수 치환
- 발송 결과 기록

---

### Phase 4: SMS 발송 기능 구현

#### 4-1. 알리고 (Aligo) 서비스 가입 및 설정

**설정 단계**:
1. 알리고 가입: https://www.aligo.in/
2. 회원가입 및 본인인증
3. SMS 서비스 신청
4. API 키 발급:
   - 마이페이지 → API 정보
   - API Key, User ID 확인

**환경 변수 추가** (`.env.local`):
```env
# SMS 설정 (알리고)
SMS_API_KEY=your-aligo-api-key
SMS_USER_ID=your-aligo-user-id
SMS_SENDER_PHONE=01012345678 (발신번호, 사전 등록 필요)
```

#### 4-2. SMS 발송 API 생성

**파일 생성**: `app/api/admin/messages/send-sms/route.ts`

**기능**:
- 알리고 API 호출
- SMS 발송
- 발송 결과 기록

---

## 📝 작업 순서

### Step 1: 카테고리 분리 (UI 수정)
1. 관리자 메시지 페이지에서 메시지 타입 표시 수정
2. "긴급공지" → "크루즈가이드 메시지"로 변경
3. 메시지 작성 모달에 "발송 방식" 선택 추가

### Step 2: 이메일 기능 구현
1. 환경 변수 설정 (Gmail SMTP)
2. nodemailer 설치
3. 이메일 발송 API 생성
4. 프론트엔드에서 이메일 발송 버튼 추가

### Step 3: 카카오톡 알림톡 기능 구현
1. 카카오 비즈니스 계정 설정 (사용자가 직접)
2. 환경 변수 설정
3. 카카오톡 알림톡 발송 API 생성
4. 프론트엔드에서 카카오톡 발송 버튼 추가

### Step 4: SMS 기능 구현
1. 알리고 가입 및 설정 (사용자가 직접)
2. 환경 변수 설정
3. SMS 발송 API 생성
4. 프론트엔드에서 SMS 발송 버튼 추가

---

## ⚠️ 주의사항

1. **개인정보 보호**: 고객의 이메일, 전화번호는 암호화하여 저장 권장
2. **발송 제한**: 각 서비스별 일일 발송 제한 확인 필요
3. **비용 관리**: SMS와 카카오톡 알림톡은 건당 과금되므로 주의
4. **템플릿 승인**: 카카오톡 알림톡 템플릿은 사전 승인 필요 (1-2일 소요)

---

## 🚀 시작하기

먼저 **Step 1: 카테고리 분리**부터 시작하겠습니다.
준비되시면 "Step 1 시작"이라고 말씀해주세요!

