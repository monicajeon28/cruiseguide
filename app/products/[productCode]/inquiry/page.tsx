// app/products/[productCode]/inquiry/page.tsx
// 구매 문의 페이지 (로그인 불필요)

import { notFound } from 'next/navigation';
import InquiryForm from '@/components/mall/InquiryForm';
import Link from 'next/link';

interface PageProps {
  params: {
    productCode: string;
  };
  searchParams: {
    partner?: string;
  };
}

export default async function InquiryPage({ params, searchParams }: PageProps) {
  const { productCode } = params;
  const partnerId = searchParams?.partner || undefined;

  // 상품 정보 조회
  try {
    // 서버 컴포넌트에서 직접 Prisma 사용
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
        source: true,
      },
    });

    if (!product) {
      notFound();
    }

    const data = { ok: true, product };

    return (
      <div className="min-h-screen bg-gray-50">
        {/* 상단 네비게이션 */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <Link
              href={`/products/${productCode}`}
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
            >
              <span>←</span>
              <span>상품 상세로 돌아가기</span>
            </Link>
          </div>
        </div>

        {/* 구매 문의 폼 */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                크루즈 문의하기
              </h1>
              <p className="text-gray-600 mb-6">
                아래 정보를 입력해주시면 상담원이 연락드려 안내해드립니다.
              </p>

              {/* 상품 정보 요약 */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-600 mb-1">상품명</div>
                <div className="font-semibold text-gray-800">{data.product.packageName}</div>
                <div className="text-sm text-gray-600 mt-2">
                  {data.product.cruiseLine} · {data.product.shipName} · {data.product.nights}박 {data.product.days}일
                </div>
              </div>

              <InquiryForm productCode={productCode} productName={data.product.packageName} partnerId={partnerId} />
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Failed to load product:', error);
    notFound();
  }
}



