// app/products/[productCode]/page.tsx
// 상품 상세 페이지 (로그인 불필요)

import { notFound } from 'next/navigation';
import Link from 'next/link';
import ProductDetail from '@/components/mall/ProductDetail';
import ProductList from '@/components/mall/ProductList';
import PublicFooter from '@/components/layout/PublicFooter';
import AffiliateTracker from '@/components/affiliate/AffiliateTracker';

interface PageProps {
  params: {
    productCode: string;
  };
  searchParams: {
    partner?: string;
  };
}

export default async function ProductDetailPage({ params, searchParams }: PageProps) {
  const { productCode } = params;
  const partnerQuery = searchParams?.partner ? decodeURIComponent(searchParams.partner) : null;

  try {
    const prisma = (await import('@/lib/prisma')).default;

    const product = await prisma.cruiseProduct.findUnique({
      where: { productCode },
      select: {
        id: true,
        productCode: true,
        cruiseLine: true,
        shipName: true,
        packageName: true,
        nights: true,
        days: true,
        basePrice: true,
        source: true,
        itineraryPattern: true,
        description: true,
        startDate: true,
        endDate: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        Trip: {
          select: { id: true },
        },
        MallProductContent: {
          select: {
            thumbnail: true,
            images: true,
            videos: true,
            layout: true,
          },
        },
      },
    });

    if (!product) {
      const partner = await prisma.user.findFirst({
        where: { mallUserId: productCode },
        select: {
          id: true,
          mallUserId: true,
          mallNickname: true,
          AffiliateProfile: {
            select: {
              id: true,
              affiliateCode: true,
              profileTitle: true,
              landingAnnouncement: true,
              welcomeMessage: true,
              profileImage: true,
              coverImage: true,
            },
          },
        },
      });

      if (partner?.mallUserId) {
        const partnerProfile = partner.AffiliateProfile;
        const affiliateCode = partnerProfile?.affiliateCode 
          ? String(partnerProfile.affiliateCode) 
          : null;
        
        // 완전히 직렬화 가능한 객체로 변환
        const partnerContext = {
          mallUserId: String(partner.mallUserId || ''),
          profileTitle: partnerProfile?.profileTitle 
            ? String(partnerProfile.profileTitle) 
            : partner.mallNickname 
            ? String(partner.mallNickname) 
            : `파트너 ${partner.mallUserId}`,
          landingAnnouncement: partnerProfile?.landingAnnouncement 
            ? (partnerProfile.landingAnnouncement ? String(partnerProfile.landingAnnouncement) : null)
            : null,
          welcomeMessage: partnerProfile?.welcomeMessage 
            ? (partnerProfile.welcomeMessage ? String(partnerProfile.welcomeMessage) : null)
            : null,
          profileImage: partnerProfile?.profileImage 
            ? (partnerProfile.profileImage ? String(partnerProfile.profileImage) : null)
            : null,
          coverImage: partnerProfile?.coverImage 
            ? (partnerProfile.coverImage ? String(partnerProfile.coverImage) : null)
            : null,
        };

        return (
          <div className="min-h-screen bg-gray-50">
            <AffiliateTracker 
              mallUserId={String(partner.mallUserId)} 
              affiliateCode={affiliateCode} 
            />
            <div className="max-w-7xl mx-auto px-6 py-10">
              <ProductList partnerContext={partnerContext} />
            </div>
            <PublicFooter />
          </div>
        );
      }

      notFound();
    }

    // 안전한 직렬화 함수: 완전히 순수한 JavaScript 객체로 변환
    const safeSerialize = (value: any): any => {
      if (value === null || value === undefined) return null;
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
      if (value instanceof Date) return value.toISOString();
      
      try {
        // 먼저 JSON.stringify로 직렬화하여 모든 특수 객체 제거
        const serialized = JSON.stringify(value, (key, val) => {
          if (val === null) return null;
          if (val === undefined) return null;
          if (val instanceof Date) return val.toISOString();
          if (typeof val === 'function') return null;
          if (typeof val === 'symbol') return null;
          if (typeof val === 'bigint') return String(val);
          // Prisma 객체나 특수 객체를 완전히 제거
          if (val && typeof val === 'object') {
            // 순환 참조 방지를 위해 이미 직렬화된 객체는 그대로 반환
            if (val.constructor && val.constructor.name !== 'Object' && val.constructor.name !== 'Array') {
              try {
                // 재귀적으로 직렬화 시도
                return JSON.parse(JSON.stringify(val));
              } catch {
                return null;
              }
            }
          }
          return val;
        });
        // 파싱하여 순수 객체로 변환
        const parsed = JSON.parse(serialized);
        // 한 번 더 직렬화하여 완전히 순수한 객체로 변환
        return JSON.parse(JSON.stringify(parsed));
      } catch (e) {
        // 직렬화 실패 시 null 반환
        console.warn('[ProductDetailPage] Safe serialize failed:', e);
        return null;
      }
    };

    // 전체 상품 객체를 완전히 직렬화
    const serializeProduct = (p: any) => {
      try {
        // Date 객체를 먼저 문자열로 변환
        const toDateString = (date: any): string | null => {
          if (!date) return null;
          if (date instanceof Date) return date.toISOString();
          if (typeof date === 'string') return date;
          try {
            return new Date(date).toISOString();
          } catch {
            return null;
          }
        };

        // 복잡한 필드들을 먼저 직렬화
        const serializedItineraryPattern = safeSerialize(p.itineraryPattern);
        const serializedTags = safeSerialize(p.tags);
        const serializedImages = p.MallProductContent ? safeSerialize(p.MallProductContent.images) : null;
        const serializedVideos = p.MallProductContent ? safeSerialize(p.MallProductContent.videos) : null;
        const serializedLayout = p.MallProductContent ? safeSerialize(p.MallProductContent.layout) : null;

        // 모든 필드를 명시적으로 처리하여 완전히 직렬화 가능한 객체 생성
        const result = {
          id: Number(p.id) || 0,
          productCode: String(p.productCode || ''),
          cruiseLine: String(p.cruiseLine || ''),
          shipName: String(p.shipName || ''),
          packageName: String(p.packageName || ''),
          nights: Number(p.nights) || 0,
          days: Number(p.days) || 0,
          basePrice: p.basePrice !== null && p.basePrice !== undefined ? Number(p.basePrice) : null,
          source: p.source ? String(p.source) : null,
          itineraryPattern: serializedItineraryPattern,
          description: p.description ? String(p.description) : null,
          startDate: toDateString(p.startDate),
          endDate: toDateString(p.endDate),
          tags: serializedTags,
          createdAt: toDateString(p.createdAt),
          updatedAt: toDateString(p.updatedAt),
          tripCount: Array.isArray(p.Trip) ? p.Trip.length : 0,
          mallProductContent: p.MallProductContent ? {
            thumbnail: p.MallProductContent.thumbnail ? String(p.MallProductContent.thumbnail) : null,
            images: serializedImages,
            videos: serializedVideos,
            layout: serializedLayout,
          } : null,
        };

        // 최종 검증: JSON.stringify로 다시 직렬화하여 직렬화 가능한지 확인
        try {
          const testSerialization = JSON.stringify(result);
          if (!testSerialization) {
            throw new Error('Serialization test failed');
          }
          
          // 한 번 더 파싱하여 완전히 순수한 객체로 변환
          const finalResult = JSON.parse(testSerialization);
          
          // 최종 검증: 한 번 더 직렬화하여 완전히 순수한 객체인지 확인
          const finalTest = JSON.stringify(finalResult);
          if (!finalTest) {
            throw new Error('Final serialization test failed');
          }
          
          return JSON.parse(finalTest);
        } catch (serializationError) {
          console.error('[ProductDetailPage] Final serialization failed:', serializationError);
          throw serializationError;
        }
      } catch (e) {
        console.error('[ProductDetailPage] Product serialization failed:', e);
        // 직렬화 실패 시 최소한의 필드만 포함
        return {
          id: Number(p.id) || 0,
          productCode: String(p.productCode || ''),
          cruiseLine: String(p.cruiseLine || ''),
          shipName: String(p.shipName || ''),
          packageName: String(p.packageName || ''),
          nights: Number(p.nights) || 0,
          days: Number(p.days) || 0,
          basePrice: p.basePrice !== null && p.basePrice !== undefined ? Number(p.basePrice) : null,
          source: p.source ? String(p.source) : null,
          itineraryPattern: null,
          description: p.description ? String(p.description) : null,
          startDate: null,
          endDate: null,
          tags: null,
          createdAt: null,
          updatedAt: null,
          tripCount: Array.isArray(p.Trip) ? p.Trip.length : 0,
          mallProductContent: null,
        };
      }
    };

    const productWithPopularity = serializeProduct(product);

    // 어필리에이트 코드 추적 (쿠키에서 읽기)
    const cookies = (await import('next/headers')).cookies();
    const affiliateCode = cookies.get('affiliate_code')?.value || null;
    const affiliateMallUserId = cookies.get('affiliate_mall_user_id')?.value || null;
    const partnerIdForDetail = partnerQuery || affiliateMallUserId || undefined;

    return (
      <div className="min-h-screen bg-gray-50">
        {affiliateMallUserId && (
          <AffiliateTracker 
            mallUserId={String(affiliateMallUserId)} 
            affiliateCode={affiliateCode ? String(affiliateCode) : null} 
          />
        )}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center">
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
              >
                <span>←</span>
                <span>상품 목록으로</span>
              </Link>
            </div>
          </div>
        </div>

        <ProductDetail product={productWithPopularity} partnerId={partnerIdForDetail ? String(partnerIdForDetail) : undefined} />
      </div>
    );
  } catch (error) {
    console.error('Failed to load product:', error);
    notFound();
  }
}










