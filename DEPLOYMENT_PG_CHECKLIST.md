# 배포 후 PG(웰컴페이먼츠) 연결 확인 체크리스트

## 📋 배포 전 설정 완료 사항

### 웰컴페이먼츠 관리자 페이지 설정
- [x] 가상계좌 입금 통보 URL: `https://www.cruisedot.co.kr/api/payment/virtual-account`
- [x] 결제수단 거래알림 URL: `https://www.cruisedot.co.kr/api/payment/notify`
- [x] 결제 완료 후 리다이렉트 URL: `https://www.cruisedot.co.kr/api/payment/callback`

### 환경 변수 설정
- [x] `NEXT_PUBLIC_BASE_URL=https://www.cruisedot.co.kr`
- [x] `PG_SIGNKEY` 설정 완료
- [x] `PG_FIELD_ENCRYPT_IV` 설정 완료
- [x] `PG_FIELD_ENCRYPT_KEY` 설정 완료
- [x] `PG_MID_AUTH=wpcrdot200` (인증 결제)
- [x] `PG_MID_NON_AUTH=wpcrdot300` (비인증 결제)

---

## ✅ 배포 후 필수 확인 사항

### 1. DNS 설정 확인
**목적**: 도메인이 서버 IP로 올바르게 연결되었는지 확인

**확인 방법**:
```bash
# 터미널에서 확인
nslookup www.cruisedot.co.kr
# 또는
dig www.cruisedot.co.kr

# 결과에서 서버 IP 주소가 올바르게 나오는지 확인
```

**체크리스트**:
- [ ] DNS 레코드가 서버 IP로 설정되어 있음
- [ ] `www.cruisedot.co.kr` 도메인으로 접근 가능
- [ ] DNS 전파가 완료되었음 (최대 24-48시간 소요 가능)

---

### 2. HTTPS 인증서 확인
**목적**: SSL 인증서가 올바르게 설치되어 있는지 확인 (PG사는 HTTPS 필수)

**확인 방법**:
```bash
# 브라우저에서 확인
https://www.cruisedot.co.kr

# 또는 터미널에서 확인
curl -I https://www.cruisedot.co.kr
# "HTTP/2 200" 또는 "HTTP/1.1 200" 응답 확인
```

**체크리스트**:
- [ ] HTTPS로 접근 가능 (`https://www.cruisedot.co.kr`)
- [ ] 브라우저에서 "안전한 연결" 표시 확인
- [ ] SSL 인증서 만료일 확인 (Let's Encrypt는 90일마다 갱신 필요)
- [ ] HTTP → HTTPS 자동 리다이렉트 설정 확인

---

### 3. 서버 접근 확인
**목적**: 실제 배포된 서버에서 API 엔드포인트가 정상 작동하는지 확인

**확인할 URL들**:
1. **메인 페이지**
   ```
   https://www.cruisedot.co.kr
   ```
   - [ ] 페이지가 정상적으로 로드됨

2. **결제 콜백 API (GET)**
   ```
   https://www.cruisedot.co.kr/api/payment/callback
   ```
   - [ ] 접근 가능 (에러 페이지가 아닌 정상 응답)

3. **결제 알림 API (POST)**
   ```
   https://www.cruisedot.co.kr/api/payment/notify
   ```
   - [ ] POST 요청 가능 (웰컴페이먼츠에서 호출 가능)

4. **가상계좌 입금 통보 API (POST)**
   ```
   https://www.cruisedot.co.kr/api/payment/virtual-account
   ```
   - [ ] POST 요청 가능 (웰컴페이먼츠에서 호출 가능)

**테스트 방법**:
```bash
# GET 요청 테스트
curl https://www.cruisedot.co.kr/api/payment/callback

# POST 요청 테스트 (form-data)
curl -X POST https://www.cruisedot.co.kr/api/payment/notify \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "orderId=TEST&resultCode=0000&amount=1000"
```

---

### 4. 웰컴페이먼츠 PG 연결 확인

#### 4-1. 관리자 페이지에서 URL 재확인
**위치**: `https://wbiz.paywelcome.co.kr` → "상점정보" → "계약정보" 또는 "결제창설정"

**확인 사항**:
- [ ] 가상계좌 입금 통보 URL이 `https://www.cruisedot.co.kr/api/payment/virtual-account`로 설정됨
- [ ] 결제수단 거래알림 URL이 `https://www.cruisedot.co.kr/api/payment/notify`로 설정됨
- [ ] URL에 오타가 없음
- [ ] HTTPS 프로토콜 사용 (HTTP 아님)

#### 4-2. 테스트 결제 진행
**목적**: 실제 결제 플로우가 정상 작동하는지 확인

**테스트 절차**:
1. [ ] 상품 상세 페이지에서 "결제하기" 버튼 클릭
2. [ ] 결제 페이지에서 구매자 정보 입력
3. [ ] 결제 진행 (테스트 모드 또는 실제 소액 결제)
4. [ ] 결제 완료 후 성공 페이지로 리다이렉트 확인
5. [ ] 웰컴페이먼츠 관리자 페이지에서 거래 내역 확인

**확인할 사항**:
- [ ] 결제 요청이 정상적으로 생성됨
- [ ] 웰컴페이먼츠 결제 페이지로 리다이렉트됨
- [ ] 결제 완료 후 콜백이 정상적으로 호출됨
- [ ] 결제 성공/실패 페이지가 정상적으로 표시됨
- [ ] 웰컴페이먼츠 관리자 페이지에 거래 내역이 기록됨

#### 4-3. 서버 로그 확인
**목적**: 결제 프로세스 중 발생하는 오류 확인

**확인할 로그**:
```bash
# 결제 요청 로그
[Payment Request] ...

# 결제 콜백 로그
[Payment Callback] Received: ...

# 결제 알림 로그
[Payment Notify] Received: ...

# 가상계좌 입금 통보 로그
[Virtual Account Notification] Received: ...
```

**체크리스트**:
- [ ] 결제 요청 시 로그가 정상적으로 기록됨
- [ ] 콜백/알림 수신 시 로그가 정상적으로 기록됨
- [ ] 서명 검증 오류가 없음
- [ ] 데이터베이스 저장 오류가 없음

---

### 5. 보안 설정 확인

**체크리스트**:
- [ ] `.env.local` 파일이 서버에 올바르게 배포됨
- [ ] 환경 변수 값이 올바르게 설정됨
- [ ] `PG_SIGNKEY`, `PG_FIELD_ENCRYPT_KEY` 등 민감 정보가 노출되지 않음
- [ ] HTTPS 통신만 허용 (HTTP는 HTTPS로 리다이렉트)

---

## 🚨 문제 발생 시 확인 사항

### DNS 문제
- **증상**: 도메인으로 접근 불가
- **해결**: DNS 설정 확인, DNS 전파 대기 (최대 48시간)

### SSL 인증서 문제
- **증상**: "안전하지 않은 연결" 경고
- **해결**: 인증서 재발급, 인증서 경로 확인

### 콜백 URL 접근 불가
- **증상**: 웰컴페이먼츠에서 콜백 호출 실패
- **해결**: 
  1. 방화벽 설정 확인 (웰컴페이먼츠 IP 허용)
  2. 서버 로그 확인
  3. URL 오타 확인

### 서명 검증 실패
- **증상**: "서명 검증 실패" 오류
- **해결**:
  1. `PG_SIGNKEY` 값 확인
  2. 웰컴페이먼츠 API 문서의 서명 생성 방식 확인
  3. 서명 생성 로직 재확인

---

## 📝 웰컴페이먼츠 연동 정보

### MID 정보
- **인증 결제 MID**: `wpcrdot200`
- **비인증 결제 MID**: `wpcrdot300`
- **관리자 페이지**: `https://wbiz.paywelcome.co.kr`

### API 엔드포인트
- **결제 요청**: `/api/payment/request` (POST)
- **결제 콜백**: `/api/payment/callback` (GET/POST)
- **결제 알림**: `/api/payment/notify` (POST)
- **가상계좌 입금 통보**: `/api/payment/virtual-account` (POST)

### 환경 변수
```env
NEXT_PUBLIC_BASE_URL=https://www.cruisedot.co.kr
PG_SIGNKEY=SGI2dkFzRFc1WHp6K1VTOFVUS3dGdz09
PG_FIELD_ENCRYPT_IV=00e0281fbcbae386
PG_FIELD_ENCRYPT_KEY=3468ac340654c2e5a890fc97d99c214b
PG_MID_AUTH=wpcrdot200
PG_MID_NON_AUTH=wpcrdot300
PG_ADMIN_URL=http://wbiz.paywelcome.co.kr
PG_MERCHANT_NAME=크루즈닷
```

---

## ✅ 최종 확인

배포 후 다음 순서로 확인하세요:

1. ✅ DNS 설정 확인
2. ✅ HTTPS 인증서 확인
3. ✅ 서버 접근 확인
4. ✅ 웰컴페이먼츠 관리자 페이지 URL 재확인
5. ✅ 테스트 결제 진행
6. ✅ 서버 로그 확인
7. ✅ 보안 설정 확인

**모든 체크리스트를 완료한 후 실제 서비스에 적용하세요.**

---

**작성일**: 2025-01-09  
**도메인**: www.cruisedot.co.kr  
**PG사**: 웰컴페이먼츠

