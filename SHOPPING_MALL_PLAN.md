# 🛒 크루즈닷 쇼핑몰 구현 계획서

## 📋 개요
기존 크루즈 지니 가이드 기능은 100% 유지하고, 새로운 **공개 쇼핑몰 기능**만 추가합니다.

## 🎯 목표
- 로그인 없이 크루즈 상품 둘러보기 가능
- 두 사이트 (cruisedot + wcruise) 상품 통합 표시
- 상품 상세 정보 확인
- 구매 문의 시 해피콜 유도

## 📁 파일 구조 (새로 추가할 파일들)

```
app/
├── page.tsx                    # 메인페이지 (공개 쇼핑몰) ← 기존 redirect 제거
├── products/
│   ├── [productCode]/
│   │   ├── page.tsx           # 상품 상세 페이지
│   │   └── inquiry/
│   │       └── page.tsx       # 구매 문의 폼
│   ├── layout.tsx             # 상품 페이지 레이아웃
├── api/
│   └── public/
│       ├── products/
│       │   ├── route.ts       # 공개 상품 API (로그인 불필요)
│       │   └── [productCode]/
│       │       └── route.ts   # 상품 상세 API
│       └── inquiry/
│           └── route.ts       # 구매 문의 API
components/
└── mall/                      # 쇼핑몰 전용 컴포넌트
    ├── ProductCard.tsx        # 상품 카드
    ├── ProductList.tsx        # 상품 목록
    ├── ProductDetail.tsx      # 상품 상세
    ├── InquiryForm.tsx        # 구매 문의 폼
    └── HeroSection.tsx        # 히어로 섹션
```

## 🔧 구현 단계

### 1단계: 공개 API 생성
- [x] `/api/public/products` - 상품 목록 조회 (로그인 불필요)
- [ ] `/api/public/products/[productCode]` - 상품 상세 조회
- [ ] `/api/public/inquiry` - 구매 문의 제출

### 2단계: 메인페이지 구현
- [ ] 히어로 섹션 (AI 지니 소개)
- [ ] 상품 목록 (필터/정렬)
- [ ] AI 지니 가이드 안내
- [ ] 로그인/회원가입 버튼

### 3단계: 상품 상세 페이지
- [ ] 상품 정보 표시 (일정, 가격, 선박)
- [ ] 출처 표시 ("크루즈닷 제공" / "W크루즈 제공")
- [ ] "구매 문의하기" 버튼

### 4단계: 구매 문의 폼
- [ ] 이름, 연락처, 여권 정보 입력
- [ ] 제출 시 해피콜 안내

### 5단계: 추가 기능
- [ ] 유튜브 콘텐츠 섹션
- [ ] 고객 후기 섹션
- [ ] 커뮤니티 페이지

## 🛡️ 중요 원칙
1. **기존 크루즈 지니 가이드 기능은 절대 수정하지 않음**
2. **새로운 파일만 추가하여 독립적으로 동작**
3. **middleware.ts에 공개 경로만 추가**

## 📝 API 스펙

### GET /api/public/products
```typescript
// Query Parameters
?page=1
&limit=20
&source=cruisedot|wcruise|all
&cruiseLine=Royal Caribbean
&minPrice=0
&maxPrice=10000000
&sort=popular|price_asc|price_desc|newest

// Response
{
  ok: true,
  products: [
    {
      id: number,
      productCode: string,
      cruiseLine: string,
      shipName: string,
      packageName: string,
      nights: number,
      days: number,
      basePrice: number | null,
      source: 'cruisedot' | 'wcruise' | 'manual',
      itineraryPattern: Json,
      description: string | null,
      createdAt: string
    }
  ],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

### GET /api/public/products/[productCode]
```typescript
// Response
{
  ok: true,
  product: {
    // ... 상품 전체 정보
  }
}
```

### POST /api/public/inquiry
```typescript
// Request Body
{
  productCode: string,
  name: string,
  phone: string,
  passportNumber: string,
  message?: string
}

// Response
{
  ok: true,
  message: "문의가 접수되었습니다. 곧 연락드리겠습니다."
}
```

## 🎨 UI/UX 방향
- 모던하고 깔끔한 디자인
- 모바일 우선 반응형
- 상품 이미지는 추후 추가 가능하도록 구조 확장
- 출처 표시는 배지 형태로 명확하게 표시

























