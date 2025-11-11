'use client';

import { useState, useEffect } from 'react';
import { FiDollarSign, FiList, FiPieChart, FiChevronLeft } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import CurrencyCalculator from './components/CurrencyCalculator';
import ExpenseTracker from './components/ExpenseTracker';
import Statistics from './components/Statistics';
import { trackFeature } from '@/lib/analytics';

type Tab = 'calculator' | 'expenses' | 'statistics';

export default function WalletPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('calculator');

  // 기능 사용 추적
  useEffect(() => {
    trackFeature('wallet');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/chat')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="지니 대화로 돌아가기"
            >
              <FiChevronLeft className="w-7 h-7 text-gray-700" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">💰 여행 가계부</h1>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 - 50대+ 친화적 디자인 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-2 py-3">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex-1 flex flex-col items-center justify-center py-4 rounded-lg transition-all ${
                activeTab === 'calculator'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiDollarSign className="w-8 h-8 mb-1" />
              <span className="text-base font-semibold">환율 계산기</span>
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex-1 flex flex-col items-center justify-center py-4 rounded-lg transition-all ${
                activeTab === 'expenses'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiList className="w-8 h-8 mb-1" />
              <span className="text-base font-semibold">지출 기록</span>
            </button>

            <button
              onClick={() => setActiveTab('statistics')}
              className={`flex-1 flex flex-col items-center justify-center py-4 rounded-lg transition-all ${
                activeTab === 'statistics'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiPieChart className="w-8 h-8 mb-1" />
              <span className="text-base font-semibold">통계</span>
            </button>
          </div>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'calculator' && <CurrencyCalculator />}
        {activeTab === 'expenses' && <ExpenseTracker />}
        {activeTab === 'statistics' && <Statistics />}
      </div>
    </div>
  );
}
