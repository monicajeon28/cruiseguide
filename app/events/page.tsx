// app/events/page.tsx
// 이벤트 페이지

'use client';

import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';

export default function EventsPage() {
  const events = [
    {
      id: 1,
      title: '2025 신년 맞이 특가 이벤트',
      image: '🎉',
      period: '2025.01.01 ~ 2025.01.31',
      status: '진행중',
      description: '신년을 맞이하여 모든 크루즈 상품에 10% 할인 혜택을 제공합니다. 추가로 업그레이드 쿠폰도 드립니다!',
      benefits: ['10% 할인', '업그레이드 쿠폰', '추가 인원 무료']
    },
    {
      id: 2,
      title: '발렌타인데이 러브 크루즈 패키지',
      image: '💕',
      period: '2025.02.01 ~ 2025.02.14',
      status: '예정',
      description: '연인과 함께하는 특별한 크루즈 여행! 발렌타인데이 특별 패키지로 로맨틱한 추억을 만들어보세요.',
      benefits: ['커플 특가', '디너 쿠폰', '포토 패키지']
    },
    {
      id: 3,
      title: '봄맞이 페스티벌 이벤트',
      image: '🌸',
      period: '2025.03.01 ~ 2025.03.31',
      status: '예정',
      description: '봄의 따뜻한 햇살과 함께 떠나는 크루즈 여행! 봄맞이 페스티벌 특가 이벤트를 놓치지 마세요.',
      benefits: ['15% 할인', '봄 선물 세트', '특별 체험 프로그램']
    },
    {
      id: 4,
      title: '여름 휴가 특가 이벤트',
      image: '☀️',
      period: '2025.06.01 ~ 2025.08.31',
      status: '예정',
      description: '여름 휴가 시즌 특가! 가족과 함께하는 알찬 크루즈 여행을 특별한 가격에 만나보세요.',
      benefits: ['가족 특가', '키즈 프로그램', '바베큐 파티']
    },
    {
      id: 5,
      title: '크루즈닷 지니 TV 구독 이벤트',
      image: '📺',
      period: '상시',
      status: '진행중',
      description: '크루즈닷 지니 TV를 구독하고 리뷰를 남기면 추첨을 통해 크루즈 할인 쿠폰을 드립니다!',
      benefits: ['할인 쿠폰 추첨', '구독자 특별 혜택', '선물 증정']
    },
    {
      id: 6,
      title: '리뷰 작성 이벤트',
      image: '⭐',
      period: '상시',
      status: '진행중',
      description: '여행 후기를 작성하고 사진을 업로드하면 다음 여행 할인 쿠폰을 드립니다.',
      benefits: ['할인 쿠폰', '리뷰 포인트', '추첨 이벤트']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* 이전으로 가기 버튼 */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
              <span className="font-medium">이전으로 가기</span>
            </Link>
          </div>

          {/* 헤더 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">이벤트</h1>
            <p className="text-xl text-gray-600">크루즈닷의 다양한 이벤트와 혜택을 확인하세요.</p>
          </div>

          {/* 이벤트 목록 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-center">
                  <div className="text-6xl mb-4">{event.image}</div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      event.status === '진행중' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-300 text-gray-700'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{event.title}</h3>
                </div>
                <div className="p-6">
                  <div className="text-sm text-gray-500 mb-4">📅 {event.period}</div>
                  <p className="text-gray-700 mb-4 leading-relaxed">{event.description}</p>
                  <div className="space-y-2 mb-4">
                    <h4 className="text-sm font-semibold text-gray-900">🎁 혜택:</h4>
                    <ul className="space-y-1">
                      {event.benefits.map((benefit, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-blue-500">•</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                    자세히 보기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

