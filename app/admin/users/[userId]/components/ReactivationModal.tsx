// app/admin/users/[id]/components/ReactivationModal.tsx
'use client';

import { useState } from 'react';

interface ReactivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

export default function ReactivationModal({
  isOpen,
  onClose,
  userId,
  userName,
}: ReactivationModalProps) {
  const [productCode, setProductCode] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}/reactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productCode: productCode.trim().toUpperCase(),
          departureDate,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error || '재활성화에 실패했습니다.');
        return;
      }

      alert(`✅ ${userName}님이 재활성화되었습니다!\n새 여행이 등록되었습니다.`);
      onClose();
      window.location.reload(); // 페이지 새로고침
    } catch (err) {
      console.error('Reactivation error:', err);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold text-gray-900">
            ✈️ {userName}님 재활성화
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 설명 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-800">
            💡 동면 상태인 고객을 다시 활성화하고 새 여행을 등록합니다.<br />
            상품 코드와 출발 날짜만 입력하면 모든 일정이 자동 생성됩니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 상품 코드 */}
          <div>
            <label htmlFor="productCode" className="block text-base font-bold text-gray-900 mb-2">
              상품 코드
            </label>
            <input
              id="productCode"
              type="text"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              placeholder="예: MSC-JP4N5D"
              className="w-full h-12 text-base px-4 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              CruiseProduct 테이블의 productCode를 입력하세요
            </p>
          </div>

          {/* 출발 날짜 */}
          <div>
            <label htmlFor="departureDate" className="block text-base font-bold text-gray-900 mb-2">
              출발 날짜
            </label>
            <input
              id="departureDate"
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full h-12 text-base px-4 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              disabled={loading}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">⚠️ {error}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-base font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 text-base font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '처리 중...' : '✈️ 재활성화 & 여행 등록'}
            </button>
          </div>
        </form>

        {/* 사용 가능한 상품 코드 힌트 */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800 font-semibold mb-1">💡 사용 가능한 상품 코드:</p>
          <div className="text-xs text-yellow-700 space-y-0.5">
            <code className="bg-white px-2 py-0.5 rounded block">MSC-JP4N5D</code>
            <code className="bg-white px-2 py-0.5 rounded block">RC-JP3N4D</code>
            <code className="bg-white px-2 py-0.5 rounded block">COSTA-OKINAWA5N6D</code>
          </div>
        </div>
      </div>
    </div>
  );
}

