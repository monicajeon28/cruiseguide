import { notFound } from 'next/navigation';
import PaymentPage from '@/components/payment/PaymentPage';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { FiX, FiArrowLeft } from 'react-icons/fi';

interface PageProps {
  params: {
    productCode: string;
  };
  searchParams: {
    amount?: string;
    sessionId?: string;
  };
}

export default async function ProductPaymentPage({ params, searchParams }: PageProps) {
  const { productCode } = params;
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const finalProductCode = resolvedParams.productCode?.toUpperCase();
  const amount = resolvedSearchParams.amount ? parseInt(resolvedSearchParams.amount) : null;
  const sessionId = resolvedSearchParams.sessionId;

  try {
    // 상품 정보 가져오기 (요금표 포함)
    const product = await prisma.cruiseProduct.findUnique({
      where: { productCode: finalProductCode },
      select: {
        id: true,
        productCode: true,
        packageName: true,
        basePrice: true,
        MallProductContent: {
          select: {
            layout: true,
          },
        },
      },
    });

    if (!product) {
      notFound();
    }

    // layout에서 요금표 추출
    let pricingRows: any[] = [];
    if (product.MallProductContent?.layout) {
      try {
        const layout = typeof product.MallProductContent.layout === 'string'
          ? JSON.parse(product.MallProductContent.layout)
          : product.MallProductContent.layout;
        pricingRows = layout?.pricing || [];
      } catch (e) {
        console.error('Failed to parse layout:', e);
      }
    }

    if (pricingRows.length === 0) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center relative">
            {/* 닫기 버튼 */}
            <Link
              href={`/products/${finalProductCode}`}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="닫기"
            >
              <FiX size={24} />
            </Link>
            
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">결제 불가</h1>
              <p className="text-gray-600 mb-2">이 상품의 요금표 정보가 없습니다.</p>
              <p className="text-sm text-gray-500">관리자에게 문의해주세요.</p>
            </div>
            
            {/* 뒤로 가기 버튼 */}
            <Link
              href={`/products/${finalProductCode}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <FiArrowLeft size={20} />
              상품 상세로 돌아가기
            </Link>
          </div>
        </div>
      );
    }

    return (
      <PaymentPage
        productCode={finalProductCode}
        productName={product.packageName}
        pricingRows={pricingRows}
        chatSessionId={sessionId ?? undefined}
      />
    );
  } catch (error) {
    console.error('Failed to load product:', error);
    notFound();
  }
}
