// components/mall/ProductCard.tsx
'use client';

import { FiStar } from 'react-icons/fi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PRODUCT_TAGS } from '@/components/admin/ProductTagsSelector';

interface ProductCardProps {
  product: {
    id: number;
    productCode: string;
    cruiseLine: string;
    shipName: string;
    packageName: string;
    nights: number;
    days: number;
    basePrice: number | null;
    source: string | null;
    destination?: string[] | string | null;
    thumbnail?: string | null;
    // 리뷰/평점 데이터 (추후 DB에서 가져올 수 있음)
    rating?: number;
    reviewCount?: number;
    isPopular?: boolean;
    isRecommended?: boolean;
    isPremium?: boolean;
    isGeniePack?: boolean;
    isDomestic?: boolean;
    isJapan?: boolean;
    isBudget?: boolean;
    tags?: string[] | null;
    category?: string | null;
    mallProductContent?: {
      layout?: any;
    } | null;
  };
  partnerId?: string;
}

export default function ProductCard({ product, partnerId }: ProductCardProps) {
  const router = useRouter();

  // 가격 포맷팅
  const formatPrice = (price: number | null) => {
    if (!price) return '가격 문의';
    return `${price.toLocaleString('ko-KR')}원`;
  };

  // 목적지 추출 (itineraryPattern에서 country 필드 추출) - "O개국 여행" 형식으로 표시
  const getDestinations = (): string => {
    // 1. product.destination이 있으면 사용
    if (product.destination) {
      if (Array.isArray(product.destination)) {
        const count = product.destination.length;
        return count > 0 ? `${count}개국 여행` : '목적지 미정';
      }
      if (typeof product.destination === 'string') {
        try {
          const parsed = JSON.parse(product.destination);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return `${parsed.length}개국 여행`;
          }
        } catch {
          // 파싱 실패 시 itineraryPattern으로 fallback
        }
      }
    }

    // 2. itineraryPattern에서 country 필드 추출
    const itineraryPattern = (product as any).itineraryPattern;
    if (itineraryPattern) {
      try {
        // 문자열인 경우 파싱
        const pattern = typeof itineraryPattern === 'string' 
          ? JSON.parse(itineraryPattern) 
          : itineraryPattern;
        
        if (Array.isArray(pattern)) {
          // 각 일정에서 country 필드 추출 (중복 제거)
          const countries = new Set<string>();
          const countryNames: Record<string, string> = {
            'JP': '일본', 'KR': '한국', 'TH': '태국', 'VN': '베트남', 'MY': '말레이시아',
            'SG': '싱가포르', 'ES': '스페인', 'FR': '프랑스', 'IT': '이탈리아', 'GR': '그리스',
            'TR': '터키', 'US': '미국', 'CN': '중국', 'TW': '대만', 'HK': '홍콩',
            'PH': '필리핀', 'ID': '인도네시아', 'NO': '노르웨이', 'HR': '크로아티아', 'CA': '캐나다'
          };
          
          pattern.forEach((day: any) => {
            if (day && typeof day === 'object' && day.country && day.country !== 'KR') {
              const countryCode = day.country.toString().toUpperCase();
              countries.add(countryCode);
            }
          });
          
          const countryCount = countries.size;
          return countryCount > 0 ? `${countryCount}개국 여행` : '목적지 미정';
        }
      } catch (e) {
        console.error('[ProductCard] itineraryPattern 파싱 실패:', e);
      }
    }
    
    return '목적지 미정';
  };

  // 별점 (layout에서 가져오기 또는 기본값)
  const layout = product.mallProductContent?.layout
    ? (typeof product.mallProductContent.layout === 'string'
        ? JSON.parse(product.mallProductContent.layout)
        : product.mallProductContent.layout)
    : null;
  const rating = layout?.rating || product.rating || 4.5;
  const reviewCount = layout?.reviewCount || product.reviewCount || 243;

  const classificationBadges = [
    product.isPopular ? { label: '인기', color: 'bg-red-600' } : null,
    product.isRecommended ? { label: '추천', color: 'bg-blue-600' } : null,
    product.isPremium ? { label: '프리미엄', color: 'bg-purple-600' } : null,
    product.isGeniePack ? { label: '지니팩', color: 'bg-indigo-600' } : null,
    product.isDomestic ? { label: '국내출', color: 'bg-green-600' } : null,
    product.isJapan ? { label: '일본', color: 'bg-amber-500' } : null,
    product.isBudget ? { label: '알뜰', color: 'bg-teal-600' } : null,
  ].filter(Boolean) as Array<{ label: string; color: string }>;

  const targetHref = partnerId
    ? `/products/${product.productCode}?partner=${encodeURIComponent(partnerId)}`
    : `/products/${product.productCode}`;

  return (
    <div 
      className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-200 group h-full flex flex-col min-h-[520px] md:min-h-[560px] cursor-pointer"
      onClick={() => {
        router.push(targetHref);
      }}
    >
      <Link 
        href={targetHref}
        className="block flex-1 flex flex-col no-underline"
        onClick={(e) => {
          // Link 클릭 시 이벤트 전파 방지 (중복 방지)
          e.stopPropagation();
        }}
      >
        {/* 썸네일 이미지 (유튜브 스타일 - 16:9 비율) */}
        <div className="relative w-full aspect-video bg-gradient-to-br from-blue-400 to-indigo-600 overflow-hidden">
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.packageName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center px-4 py-2">
              <div className="text-center text-white w-full">
                <p className="text-2xl md:text-3xl lg:text-4xl font-black line-clamp-2 break-words leading-tight px-2">
                  {product.shipName}
                </p>
                <p className="text-sm md:text-base lg:text-lg mt-2 opacity-95 font-semibold line-clamp-1 break-words px-2">
                  {product.cruiseLine}
                </p>
              </div>
            </div>
          )}
          {/* 딱지들 - 썸네일 왼쪽 위에 표시 */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {classificationBadges.map((badge, index) => (
              <div
                key={`${badge.label}-${index}`}
                className={`${badge.color} text-white px-4 py-2 rounded-lg text-base md:text-lg font-black shadow-xl`}
              >
                {badge.label}
              </div>
            ))}
            {/* 추가 딱지들 (layout에서 가져오기) */}
            {layout?.badges && Array.isArray(layout.badges) && layout.badges.map((badge: string, index: number) => {
              const badgeConfig: Record<string, { label: string; color: string }> = {
                'event': { label: '이벤트', color: 'bg-purple-600' },
                'theme': { label: '테마', color: 'bg-pink-600' },
                'departure-soon': { label: '출발임박', color: 'bg-orange-600' },
                'package-confirmed': { label: '패키지확정', color: 'bg-green-600' },
                'closing-soon': { label: '마감임박', color: 'bg-red-700' },
              };
              const config = badgeConfig[badge];
              if (!config) return null;
              return (
                <div key={index} className={`${config.color} text-white px-4 py-2 rounded-lg text-base md:text-lg font-black shadow-xl`}>
                  {config.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* 상품 정보 */}
        <div className="p-5 md:p-6 flex-1 flex flex-col">
          {/* 크루즈명 및 여행 기간 */}
          <div className="flex items-center gap-3 mb-2">
            {/* 출처 로고 */}
            {product.source === 'cruisedot' && (
              <img 
                src="/images/ai-cruise-logo.png" 
                alt="크루즈닷" 
                className="w-6 h-6 md:w-7 md:h-7 object-contain flex-shrink-0"
              />
            )}
            {product.source === 'wcruise' && (
              <img 
                src="/images/wcruise-logo.png" 
                alt="W크루즈" 
                className="w-6 h-6 md:w-7 md:h-7 object-contain flex-shrink-0"
              />
            )}
            <h3 className="text-lg md:text-xl font-black text-gray-900 line-clamp-2 group-hover:text-blue-700 transition-colors flex-1 leading-relaxed">
              {product.packageName}
            </h3>
          </div>
          
          <div className="flex items-start text-base md:text-lg text-gray-700 mb-3 font-semibold flex-wrap gap-2">
            <span className="whitespace-nowrap">{product.nights}박 {product.days}일</span>
            <span className="mx-1">·</span>
            <span className="text-gray-600 line-clamp-2 break-words flex-1 min-w-0">{getDestinations()}</span>
            {(product as any).category && (
              <>
                <span className="mx-1">·</span>
                <span className="text-blue-600 font-bold whitespace-nowrap">{(product as any).category}</span>
              </>
            )}
          </div>

          {/* 별점 및 리뷰 */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              <FiStar className="text-yellow-400 fill-yellow-400" size={20} />
              <span className="text-base md:text-lg font-black text-gray-900">{rating.toFixed(1)}</span>
            </div>
            {reviewCount > 0 ? (
              <Link
                href={`/products/${product.productCode}/reviews`}
                className="text-sm md:text-base text-gray-600 font-semibold hover:text-blue-600 hover:underline transition-colors"
                onClick={(e) => {
                  // 리뷰 링크 클릭 시 상품 상세 페이지로 이동하지 않도록
                  e.stopPropagation();
                }}
              >
                이용자 리뷰 {reviewCount.toLocaleString('ko-KR')}개
              </Link>
            ) : (
              <span className="text-sm md:text-base text-gray-600 font-semibold">
                이용자 리뷰 {reviewCount.toLocaleString('ko-KR')}개
              </span>
            )}
          </div>

          {/* 후킹 태그 표시 - 이용자 리뷰 밑에 */}
          {(product as any).tags && Array.isArray((product as any).tags) && (product as any).tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {(product as any).tags.slice(0, 3).map((tagId: string) => {
                const tag = PRODUCT_TAGS.find(t => t.id === tagId);
                if (!tag) return null;
                return (
                  <span
                    key={tagId}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white ${tag.color} shadow-md`}
                  >
                    <span>{tag.emoji}</span>
                    <span>{tag.label}</span>
                  </span>
                );
              })}
            </div>
          )}

          {/* 이벤트 가격 */}
          <div className="pt-4 border-t-2 border-gray-300 mt-auto">
            <div className="space-y-1">
              <div className="text-xs md:text-sm text-gray-600 font-bold">이벤트 가격</div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-xl md:text-2xl lg:text-3xl font-black text-blue-600 leading-tight break-keep">
                  {formatPrice(product.basePrice)}
                </div>
                {product.basePrice && (
                  <div className="flex items-center gap-1 text-lg md:text-xl">
                    <span className="text-black font-bold">/</span>
                    <span className="text-red-600 font-bold">
                      월 {Math.ceil(product.basePrice / 12).toLocaleString('ko-KR')}원
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}










