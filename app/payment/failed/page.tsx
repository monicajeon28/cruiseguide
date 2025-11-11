'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiXCircle, FiHome, FiRefreshCw } from 'react-icons/fi';
import Link from 'next/link';

export default function PaymentFailedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const error = searchParams.get('error');
  const sessionId = searchParams.get('sessionId');
  const productCode = searchParams.get('productCode');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const payload: Record<string, any> = {
      sessionId,
      paymentStatus: 'FAILED',
      paymentCompletedAt: new Date().toISOString(),
    };
    if (orderId) payload.paymentOrderId = orderId;
    if (productCode) payload.finalPageUrl = `/products/${productCode}/payment/failed`;

    fetch('/api/chat-bot/session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch((err) => {
      console.error('[PaymentFailedPage] Failed to update chat session:', err);
    });
  }, [sessionId, orderId, productCode]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
              <FiXCircle className="text-red-600" size={48} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">결제에 실패했습니다</h1>
            {orderId && (
              <p className="text-gray-600">주문번호: {orderId}</p>
            )}
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-800 font-semibold mb-2">
              결제를 완료할 수 없었습니다.
            </p>
            {error && (
              <p className="text-sm text-red-700">
                {decodeURIComponent(error)}
              </p>
            )}
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>안내:</strong> 결제가 완료되지 않았습니다. 
              문제가 지속되면 고객센터로 문의해주세요.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <FiRefreshCw size={20} />
              다시 시도
            </button>
            <Link
              href="/"
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <FiHome size={20} />
              홈으로 가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
