# 🛍️ 메인몰 관리 시스템 구현 계획

## 📋 개요
관리자 페이지에 메인몰 관리 기능을 추가합니다. 코딩 없이 UI/UX를 꾸밀 수 있도록 합니다.

**중요**: 기존 크루즈 지니 가이드 기능은 절대 건들지 않습니다!

## 🎯 구현 목표

### 1. 메인몰 관리 (`/admin/mall`)
- 히어로 섹션 편집 (이미지, 텍스트, 버튼)
- 상품 목록 섹션 커스터마이징
- 유튜브 섹션 관리
- 공통 설정 (폰트, 색상, 레이아웃)

### 2. 상품 상세페이지 관리 (`/admin/mall/products`)
- 썸네일 이미지 업로드
- 상세 이미지/영상 업로드
- 상세페이지 커스터마이징 (레이아웃, 폰트, 색상)
- 상품별 개별 설정

### 3. 커뮤니티 관리 (`/admin/mall/community`)
- 게시글 목록 조회
- 게시글 삭제
- 댓글 관리
- 카테고리 관리

## 📁 파일 구조 (새로 추가)

```
prisma/schema.prisma (확장)
  - MallContent (메인몰 콘텐츠)
  - MallProductContent (상품별 상세 콘텐츠)
  - CommunityPost (커뮤니티 게시글)

app/admin/mall/
  ├── page.tsx                    # 메인몰 관리 대시보드
  ├── layout.tsx                  # 메인몰 관리 레이아웃
  ├── hero/
  │   └── page.tsx               # 히어로 섹션 편집
  ├── products/
  │   ├── page.tsx               # 상품 상세페이지 관리 목록
  │   └── [productCode]/
  │       └── page.tsx           # 상품별 상세페이지 편집
  └── community/
      └── page.tsx               # 커뮤니티 관리

app/api/admin/mall/
  ├── content/
  │   └── route.ts               # 콘텐츠 CRUD
  ├── upload/
  │   └── route.ts               # 파일 업로드 (이미지, 영상, 폰트)
  ├── products/
  │   └── [productCode]/
  │       └── route.ts           # 상품 콘텐츠 관리
  └── community/
      ├── route.ts               # 게시글 목록
      └── [postId]/
          └── route.ts           # 게시글 삭제

components/admin/mall/
  ├── HeroEditor.tsx             # 히어로 섹션 편집기
  ├── ProductDetailEditor.tsx    # 상품 상세페이지 편집기
  ├── FileUploader.tsx           # 파일 업로드 컴포넌트
  ├── ImageUploader.tsx          # 이미지 업로드
  ├── VideoUploader.tsx          # 영상 업로드
  ├── FontUploader.tsx           # 폰트 업로드
  └── CommunityManager.tsx       # 커뮤니티 관리 컴포넌트
```

## 🗄️ 데이터베이스 스키마

### MallContent (메인몰 콘텐츠)
```prisma
model MallContent {
  id          Int      @id @default(autoincrement())
  section     String   // 'hero', 'youtube', 'footer' 등
  key         String   // 콘텐츠 키
  type        String   // 'text', 'image', 'video', 'button' 등
  content     Json     // 콘텐츠 데이터
  order       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### MallProductContent (상품별 상세 콘텐츠)
```prisma
model MallProductContent {
  id          Int      @id @default(autoincrement())
  productCode String   @unique
  thumbnail   String?  // 썸네일 이미지 URL
  images      Json?    // 이미지 배열
  videos      Json?    // 영상 배열
  fonts       Json?    // 폰트 설정
  layout      Json?    // 레이아웃 설정
  customCss   String?  // 커스텀 CSS
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  Product     CruiseProduct @relation(fields: [productCode], references: [productCode])
}
```

### CommunityPost (커뮤니티 게시글)
```prisma
model CommunityPost {
  id          Int      @id @default(autoincrement())
  userId      Int?
  title       String
  content     String
  category    String   @default("general")
  authorName  String?
  images      Json?
  views       Int      @default(0)
  likes       Int      @default(0)
  comments    Int      @default(0)
  isDeleted   Boolean  @default(false)
  deletedAt   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  User        User?    @relation(fields: [userId], references: [id])
}
```

## 🔧 구현 단계

### 1단계: DB 스키마 확장
- Prisma 스키마에 모델 추가
- 마이그레이션 실행

### 2단계: 파일 업로드 시스템
- 이미지 업로드 API
- 영상 업로드 API
- 폰트 업로드 API
- 파일 저장 (public/uploads/ 폴더)

### 3단계: CMS API
- 콘텐츠 CRUD API
- 상품 콘텐츠 관리 API
- 커뮤니티 관리 API

### 4단계: 관리자 UI
- 메인몰 관리 대시보드
- 히어로 섹션 편집기
- 상품 상세페이지 편집기
- 커뮤니티 관리 UI

### 5단계: 프론트엔드 연동
- 공개 페이지에서 동적 콘텐츠 로드
- 상품 상세페이지에 커스텀 콘텐츠 표시

## 🎨 UI/UX 편집 기능

### 드래그 앤 드롭 방식
- 섹션별 요소를 드래그하여 순서 변경
- 이미지/영상 드래그 앤 드롭 업로드

### 폼 기반 편집
- 각 요소에 대한 편집 폼 제공
- 실시간 미리보기

### WYSIWYG 에디터
- 텍스트 편집 시 리치 에디터 사용
- 이미지 인라인 삽입

## 📝 API 스펙

### POST /api/admin/mall/upload
```typescript
// FormData
- file: File
- type: 'image' | 'video' | 'font'

// Response
{
  ok: true,
  url: string,
  filename: string
}
```

### GET/POST/PUT/DELETE /api/admin/mall/content
```typescript
// GET: 콘텐츠 목록
// POST: 콘텐츠 생성
{
  section: string,
  key: string,
  type: string,
  content: Json,
  order: number
}

// PUT: 콘텐츠 수정
// DELETE: 콘텐츠 삭제
```

### GET/POST/PUT /api/admin/mall/products/[productCode]
```typescript
// GET: 상품 콘텐츠 조회
// POST/PUT: 상품 콘텐츠 저장
{
  thumbnail?: string,
  images?: string[],
  videos?: string[],
  fonts?: Json,
  layout?: Json,
  customCss?: string
}
```

### GET /api/admin/mall/community
```typescript
// 게시글 목록
{
  ok: true,
  posts: CommunityPost[],
  pagination: {...}
}
```

### DELETE /api/admin/mall/community/[postId]
```typescript
// 게시글 삭제
{
  ok: true,
  message: "삭제되었습니다"
}
```

## 🛡️ 보안 고려사항
- 관리자 권한 확인
- 파일 타입 검증
- 파일 크기 제한
- XSS 방지 (콘텐츠 sanitization)

























