# 페이지 콘텐츠 관리 시스템 (노코드 편집)

## 개요
각 페이지(`/support/service`, `/support/notice`, `/support/faq`, `/events`, `/community`)의 이미지, 텍스트, 이모티콘을 코딩 없이 관리자 패널에서 수정할 수 있는 시스템입니다.

## 구현 완료 항목

### 1. 데이터베이스 스키마
- ✅ `PageContent` 모델 추가 (`prisma/schema.prisma`)
- 페이지 경로, 섹션, 아이템별로 콘텐츠 저장
- 콘텐츠 타입: text, image, emoji, button, link, list

### 2. API 엔드포인트
- ✅ `/api/admin/pages/content` - 관리자용 콘텐츠 CRUD
- ✅ `/api/pages/content` - 공개 페이지용 콘텐츠 조회
- ✅ `/api/admin/pages/upload` - 이미지 업로드

### 3. 관리자 패널 UI
- ✅ `/admin/pages` - 페이지 콘텐츠 관리 페이지
- 페이지 선택 (서비스, 공지사항, FAQ, 이벤트, 커뮤니티)
- 섹션별 콘텐츠 편집
- 이미지 업로드 기능
- 텍스트/이모티콘 편집 기능
- 실시간 미리보기

### 4. 프론트엔드 연동
- ✅ `/support/service` 페이지를 동적 데이터 로드로 수정 (예시)
- 데이터베이스에서 콘텐츠를 로드하되, 기본값(fallback) 제공

## 사용 방법

### 1. 관리자 패널 접속
1. `/admin/login`에서 관리자로 로그인
2. 사이드바에서 "📝 페이지 콘텐츠 관리" 클릭

### 2. 페이지 선택
- 서비스 소개, 공지사항, FAQ, 이벤트, 커뮤니티 중 선택

### 3. 콘텐츠 편집
- 각 섹션별로 콘텐츠 추가/수정/삭제 가능
- 콘텐츠 타입:
  - **텍스트**: 제목, 설명 등
  - **이모티콘**: 이모티콘 직접 입력
  - **이미지**: 파일 업로드 또는 URL 입력
  - **버튼**: 버튼 텍스트와 링크 설정
  - **링크**: 링크 텍스트와 URL 설정
  - **리스트**: 여러 항목을 줄바꿈으로 구분

### 4. 이미지 업로드
- 이미지 타입 선택 시 파일 업로드 가능
- 업로드된 이미지는 `/public/uploads/pages/` 폴더에 저장
- URL 직접 입력도 가능

## 데이터 구조

### PageContent 모델
```prisma
model PageContent {
  id          Int      @id @default(autoincrement())
  pagePath    String   // '/support/service', '/support/notice' 등
  section     String   // 'header', 'services', 'notices' 등
  itemId      String?  // 같은 섹션 내 아이템 구분
  contentType String   // 'text', 'image', 'emoji', 'button', 'link', 'list'
  content     Json     // 콘텐츠 데이터
  order       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## 주의사항

1. **마이그레이션**: Prisma 마이그레이션을 실행해야 합니다:
   ```bash
   npx prisma migrate dev --name add_page_content_model
   ```
   또는 데이터베이스 스키마가 동기화되지 않은 경우:
   ```bash
   npx prisma db push
   ```

2. **이미지 업로드 폴더**: `/public/uploads/pages/` 폴더가 자동으로 생성됩니다.

3. **권한**: 관리자 권한이 있는 사용자만 콘텐츠를 편집할 수 있습니다.

4. **기본값**: 데이터베이스에 콘텐츠가 없으면 각 페이지의 기본값이 표시됩니다.

