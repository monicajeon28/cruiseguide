'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProductList from '@/components/mall/ProductList';

/**
 * 개인 판매몰 페이지
 * /[mallUserId]/shop 형식으로 접근
 * 예: /user1/shop
 */
export default function PersonalShopPage() {
  const router = useRouter();
  const params = useParams();
  const mallUserId = params.mallUserId as string;

  useEffect(() => {
    // mallUserId가 없으면 리다이렉트
    if (!mallUserId) {
      router.push('/partner');
    }
  }, [mallUserId, router]);

  if (!mallUserId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-4">
            <h1 className="text-4xl font-bold mb-4">나의 판매몰</h1>
            <p className="text-xl opacity-90 mb-6">
              파트너 ID: {mallUserId}
            </p>
          </div>
          
          {/* 대시보드로 돌아가기 버튼 */}
          <div className="mb-4">
            <button
              onClick={() => router.push(`/${mallUserId}/dashboard`)}
              className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-md"
            >
              대시보드로 돌아가기
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 개인 판매몰 상품 목록 */}
        <ProductList partnerId={mallUserId} />
      </div>
    </div>
  );
}

