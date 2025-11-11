'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiHeart, FiMail, FiPhone, FiCalendar, FiMap } from 'react-icons/fi';
import Image from 'next/image';

/**
 * 동면 안내 페이지
 * 작업자 C (UX/기능 전문가) - 여행 후 UI
 * 따뜻하고 감성적인 디자인으로 재예약 유도
 */

interface TripSummary {
  cruiseName: string;
  endDate: string;
  visitedCountries: number;
  totalExpense: number;
}

export default function DormantPage() {
  const router = useRouter();
  const [lastTrip, setLastTrip] = useState<TripSummary | null>(null);

  useEffect(() => {
    const fetchLastTrip = async () => {
      try {
        const response = await fetch('/api/trips/last-completed');
        if (!response.ok) {
          throw new Error('Failed to fetch last trip');
        }
        const data = await response.json();
        setLastTrip(data);
      } catch (error) {
        console.error('Error fetching last trip:', error);
        // 에러 시 기본 데이터로 표시
        setLastTrip({
          cruiseName: '마지막 크루즈 여행',
          endDate: '최근 여행',
          visitedCountries: 0,
          totalExpense: 0,
        });
      }
    };
    
    fetchLastTrip();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* 헤더 - 감성적인 인사 */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-2xl">
              <span className="text-6xl">💤</span>
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            지니는 꿈나라에서<br />
            당신을 기다리고 있어요
          </h1>
          
          <p className="text-xl text-gray-600 leading-relaxed">
            즐거운 여행을 마치셨군요!<br />
            다음 여행에서 다시 만나요 💙
          </p>
        </div>

        {/* 마지막 여행 요약 */}
        {lastTrip && (
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FiHeart className="text-red-500" />
              마지막 여행 추억
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                <FiCalendar className="text-blue-600 mt-1" size={24} />
                <div>
                  <p className="text-sm text-gray-600 mb-1">크루즈</p>
                  <p className="text-lg font-semibold text-gray-900">{lastTrip.cruiseName}</p>
                  <p className="text-sm text-gray-500">{lastTrip.endDate} 종료</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
                <FiMap className="text-green-600 mt-1" size={24} />
                <div>
                  <p className="text-sm text-gray-600 mb-1">방문 국가</p>
                  <p className="text-3xl font-bold text-gray-900">{lastTrip.visitedCountries}</p>
                  <p className="text-sm text-gray-500">개국</p>
                </div>
              </div>
            </div>

            {/* 리포트 보기 버튼 */}
            <button
              onClick={() => router.push('/memories/last')}
              className="mt-6 w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all hover:scale-[1.02]"
            >
              📸 여행 추억 리포트 보기
            </button>
          </div>
        )}

        {/* 재예약 안내 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            또 다른 여행을 계획하고 계신가요?
          </h2>
          
          <p className="text-lg text-gray-600 mb-6 leading-relaxed">
            지니는 언제든 다시 깨어날 준비가 되어 있어요.<br />
            새로운 크루즈 여행을 예약하시면 자동으로 활성화됩니다.
          </p>

          {/* 여행사 연락처 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-lg text-gray-900 mb-4">
              크루즈 예약 문의
            </h3>
            
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FiPhone className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">전화</p>
                <a href="tel:02-1234-5678" className="text-xl font-bold hover:text-blue-600">
                  02-1234-5678
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <FiMail className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">이메일</p>
                <a href="mailto:cruise@example.com" className="text-xl font-bold hover:text-purple-600">
                  cruise@example.com
                </a>
              </div>
            </div>
          </div>

          {/* CTA 버튼 */}
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            <a
              href="tel:02-1234-5678"
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <FiPhone size={22} />
              전화 상담 예약
            </a>
            
            <button
              onClick={() => router.push('/onboarding')}
              className="flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-purple-700 transition-colors shadow-md"
            >
              <FiCalendar size={22} />
              새 여행 등록하기
            </button>
          </div>
        </div>

        {/* 서비스 유지 안내 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border-2 border-amber-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            💡 안심하세요!
          </h3>
          
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <p className="font-semibold">모든 여행 기록이 안전하게 보관됩니다</p>
                <p className="text-sm text-gray-500">가계부, 체크리스트, 사진이 모두 저장되어 있어요</p>
              </div>
            </li>
            
            <li className="flex items-start gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <p className="font-semibold">새 여행 시 자동으로 다시 활성화됩니다</p>
                <p className="text-sm text-gray-500">예약하시면 지니가 바로 깨어나요</p>
              </div>
            </li>
            
            <li className="flex items-start gap-3">
              <span className="text-2xl">✓</span>
              <div>
                <p className="font-semibold">과거 여행 기록은 언제든 확인 가능합니다</p>
                <p className="text-sm text-gray-500">프로필에서 지난 여행을 볼 수 있어요</p>
              </div>
            </li>
          </ul>
        </div>

        {/* 감성 메시지 */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-lg italic">
            &quot;여행은 끝이 아닌 또 다른 시작입니다&quot;
          </p>
          <p className="text-gray-400 mt-2">
            — 지니 드림 🌟
          </p>
        </div>
      </div>
    </div>
  );
}

