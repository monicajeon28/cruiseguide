// app/support/notice/page.tsx
// 공지사항 페이지

'use client';

import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';

export default function NoticePage() {
  const notices = [
    {
      id: 1,
      title: '[공지] 2025년 신년 이벤트 안내',
      date: '2025.01.15',
      category: '이벤트',
      content: `2025년 신년을 맞이하여 특별 이벤트를 진행합니다.

🎉 신년 이벤트 혜택
- 1월 예약 고객 10% 할인
- 추가 인원 무료 혜택
- 업그레이드 쿠폰 제공

이벤트 기간: 2025.01.01 ~ 2025.01.31
자세한 내용은 고객센터로 문의해주세요.`
    },
    {
      id: 2,
      title: '[중요] 개인정보처리방침 변경 안내',
      date: '2025.01.10',
      category: '중요',
      content: `개인정보 보호를 위해 개인정보처리방침이 변경되었습니다.

주요 변경사항:
- 개인정보 보관 기간 조정
- 제3자 제공 동의 절차 강화
- 개인정보 처리 위탁 관리 강화

변경된 개인정보처리방침은 2025년 2월 1일부터 적용됩니다.
자세한 내용은 개인정보처리방침 페이지에서 확인하실 수 있습니다.`
    },
    {
      id: 3,
      title: '[안내] 시스템 점검 예정',
      date: '2025.01.05',
      category: '시스템',
      content: `서비스 개선을 위한 시스템 점검을 진행합니다.

점검 일시: 2025년 1월 20일 (월) 오전 2시 ~ 오전 6시
점검 내용: 서버 업그레이드 및 성능 개선

점검 중에는 일시적으로 서비스 이용이 제한될 수 있습니다.
불편을 드려 죄송하며, 양해 부탁드립니다.`
    },
    {
      id: 4,
      title: '[안내] 크루즈닷 지니 TV 오픈',
      date: '2024.12.20',
      category: '신규서비스',
      content: `크루즈 여행 정보를 영상으로 만나보세요!

새로운 서비스 '크루즈닷 지니 TV'가 오픈되었습니다.
- YouTube Shorts로 간단한 여행 팁 확인
- 여행 영상 콘텐츠 시청
- 라이브 방송으로 실시간 정보 공유

많은 관심과 이용 부탁드립니다.`
    },
    {
      id: 5,
      title: '[안내] 해외여행자보험 서비스 오픈',
      date: '2024.12.15',
      category: '신규서비스',
      content: `안전한 크루즈 여행을 위한 해외여행자보험 서비스를 시작했습니다.

주요 기능:
- 다양한 보험 상품 비교
- 간편한 보험료 계산
- 온라인 가입 서비스
- 보험 청구 안내

크루즈 여행 전, 반드시 보험 가입을 권장드립니다.`
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
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
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">공지사항</h1>
            <p className="text-gray-600">크루즈닷의 주요 소식과 안내사항을 확인하세요.</p>
          </div>

          {/* 공지사항 목록 */}
          <div className="space-y-4">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-blue-500"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                      {notice.category}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900">{notice.title}</h3>
                  </div>
                  <span className="text-sm text-gray-500 whitespace-nowrap">{notice.date}</span>
                </div>
                <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {notice.content}
                </div>
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
          <div className="mt-8 flex justify-center gap-2">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-semibold">
              이전
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">1</button>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-semibold">
              2
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-semibold">
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
