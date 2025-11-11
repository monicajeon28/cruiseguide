// app/support/faq/page.tsx
// 자주 묻는 질문 페이지

'use client';

import Link from 'next/link';
import { FiArrowLeft, FiChevronDown, FiChevronUp, FiPlay, FiExternalLink } from 'react-icons/fi';
import { useState } from 'react';
import VideoModal from '@/components/mall/VideoModal';

interface FAQ {
  id: number;
  category: string;
  question: string;
  answer: string;
  videoId?: string;
  hasVideo?: boolean;
  articleLink?: string;
}

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const toggleItem = (id: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const handleVideoClick = (videoId: string) => {
    setSelectedVideo(videoId);
    setIsVideoModalOpen(true);
  };

  const faqs: FAQ[] = [
    {
      id: 1,
      category: '크루즈 기본 정보',
      question: '크루즈 국내 출발 많나요?',
      answer: '크루즈 국내 출발에 대한 자세한 내용을 영상으로 확인하실 수 있습니다.',
      videoId: 'E0iLWnqjGfA',
      hasVideo: true,
    },
    {
      id: 2,
      category: '크루즈 기본 정보',
      question: '코스타 세레나호 발코니 객실은 어떻게 생겼을까요?',
      answer: '코스타 세레나호 발코니 객실을 영상으로 확인하실 수 있습니다.',
      videoId: 'adwUUww4thw',
      hasVideo: true,
    },
    {
      id: 3,
      category: '크루즈 기본 정보',
      question: '크루즈 여행 완전 가성비로 가는 방법은 뭘까요?',
      answer: '크루즈 여행을 가성비 있게 즐기는 방법을 영상으로 확인하실 수 있습니다.',
      videoId: '5WvjUNk71a8',
      hasVideo: true,
    },
    {
      id: 4,
      category: '예약 및 결제',
      question: '크루즈 여행 티켓팅이 힘든 2가지 이유!',
      answer: '크루즈 여행 티켓팅이 어려운 이유를 영상으로 확인하실 수 있습니다.',
      videoId: 'jOyZ2GM_YGo',
      hasVideo: true,
    },
    {
      id: 5,
      category: '예약 및 결제',
      question: '비행기 티켓팅에서 이거 모르면 손해!',
      answer: '비행기 티켓 예매 시 알아야 할 중요한 정보를 영상으로 확인하실 수 있습니다.',
      videoId: 'EnKJo9Ax6ys',
      hasVideo: true,
    },
    {
      id: 6,
      category: '크루즈 안전',
      question: '크루즈는 안전한가요? 실제 크루즈 사고율',
      answer: '크루즈 여행의 안전성에 대한 실제 통계와 정보를 영상으로 확인하실 수 있습니다.',
      videoId: 'VpUgh6oIK6g',
      hasVideo: true,
    },
    {
      id: 7,
      category: '예약 및 결제',
      question: '해외 플랫폼에서 크루즈 예약하지 않는 이유',
      answer: '해외 플랫폼 대신 크루즈닷에서 예약해야 하는 이유를 영상으로 확인하실 수 있습니다.',
      videoId: 'M1lY9_EglM',
      hasVideo: true,
    },
    {
      id: 8,
      category: '크루즈 여행',
      question: '크루즈 여행 가서 이것 때문에 돈 더나옵니다',
      answer: '크루즈 여행 시 추가 비용이 발생하는 항목들을 영상으로 확인하실 수 있습니다.',
      videoId: 'IKPCY9G0Uc4',
      hasVideo: true,
    },
    {
      id: 9,
      category: '크루즈 기본 정보',
      question: '크루즈는 얼마나 클까요?',
      answer: '크루즈 선박의 규모와 크기를 영상으로 확인하실 수 있습니다.',
      videoId: 'ZAsw4sv5HZk',
      hasVideo: true,
    },
    {
      id: 10,
      category: '크루즈 여행',
      question: '첫 크루즈 여행에 안내가 필요한 이유',
      answer: '첫 크루즈 여행 시 전문 안내가 필요한 이유를 영상으로 확인하실 수 있습니다.',
      videoId: 'DaKs6uK6IQM',
      hasVideo: true,
    },
    {
      id: 11,
      category: '크루즈 여행',
      question: '크루즈 선상신문엔 뭐가있을까?',
      answer: '크루즈 선상에서 제공되는 신문과 정보를 영상으로 확인하실 수 있습니다.',
      videoId: 'LcznGjMokqs',
      hasVideo: true,
    },
    {
      id: 12,
      category: '크루즈 기본 정보',
      question: '상위 0.5%만 가는 크루즈여행이 특별한 이유',
      answer: '프리미엄 크루즈 여행의 특별함을 칼럼에서 확인하실 수 있습니다.',
      articleLink: 'http://leadz.kr/ydy',
    },
    {
      id: 13,
      category: '크루즈 기본 정보',
      question: '아무도 안알려주는 크루즈 여행에 대한 5가지 오해와 진실',
      answer: '크루즈 여행에 대한 오해와 진실을 칼럼에서 확인하실 수 있습니다.',
      articleLink: 'http://leadz.kr/ydz',
    },
    {
      id: 14,
      category: '크루즈 기본 정보',
      question: '국내 출발이 정말 더 편할까? 5가지 진실',
      answer: '국내 출발 크루즈의 장단점을 칼럼에서 확인하실 수 있습니다.',
      articleLink: 'http://leadz.kr/ydA',
    },
    {
      id: 15,
      category: '크루즈 여행',
      question: '크루즈에서만 누릴 수 있는 5가지 특별한 경험',
      answer: '크루즈 여행만의 특별한 경험을 칼럼에서 확인하실 수 있습니다.',
      articleLink: 'http://leadz.kr/ydB',
    },
    {
      id: 16,
      category: '서비스 이용',
      question: '크루즈닷에서 크루즈 전문 상담을 받아야 하는 이유',
      answer: '크루즈닷의 전문 상담 서비스가 필요한 이유를 칼럼에서 확인하실 수 있습니다.',
      articleLink: 'http://leadz.kr/ydD',
    },
    {
      id: 17,
      category: '예약 및 결제',
      question: '결제 방법은 무엇이 있나요?',
      answer: `크루즈닷에서는 전문 상담을 통해 맞춤형 상품을 추천해드립니다.

상담 후 결정하신 상품에 대해 안전하고 편리한 결제를 진행하실 수 있습니다.
결제는 예약 시점에 진행되며, 각 상품별로 결제 방법이 안내됩니다.

궁금한 사항이 있으시면 고객센터(010-3289-3800)로 문의해주세요.`,
    },
    {
      id: 18,
      category: '예약 및 결제',
      question: '예약 취소 및 환불 정책은 어떻게 되나요?',
      answer: `환불 정책은 각 상품마다 다르게 적용됩니다.

상품 상세페이지에 명시된 환불 정책을 확인하시거나,
고객센터(010-3289-3800)로 문의하시면 정확한 정보를 안내해드립니다.

자세한 내용은 여행약관을 참고하시거나 고객센터로 문의해주세요.`,
    },
    {
      id: 19,
      category: '크루즈 여행',
      question: '크루즈 선상에서 어떤 활동을 할 수 있나요?',
      answer: `크루즈 선상에서는 다양한 활동을 즐기실 수 있습니다:

- 수영장 및 스파 이용
- 레스토랑 및 바 이용
- 쇼핑
- 엔터테인먼트 쇼 관람
- 피트니스 센터 이용
- 카지노 (해당 선박)
- 어린이 프로그램 참여

각 크루즈 라인마다 제공하는 시설과 프로그램이 다르므로, 상품 상세페이지에서 확인하실 수 있습니다.`,
    },
    {
      id: 20,
      category: '크루즈 여행',
      question: '선상에서 인터넷을 사용할 수 있나요?',
      answer: `네, 대부분의 크루즈 선박에서 인터넷 서비스를 제공합니다:

- Wi-Fi 패키지 구매 가능
- 속도와 용량에 따라 다양한 요금제 제공
- 일부 선박은 무료 Wi-Fi 제공

인터넷 속도는 위성 통신을 사용하므로 육지보다 느릴 수 있습니다.`,
    },
    {
      id: 21,
      category: '서비스 이용',
      question: 'AI 크루즈 가이드 지니는 어떻게 사용하나요?',
      answer: `AI 크루즈 가이드 지니는 다음과 같이 사용하실 수 있습니다:

1. 로그인 후 채팅 페이지로 이동하세요.
2. 자연어로 질문을 입력하세요.
3. 지니가 실시간으로 답변을 제공합니다.

지니는 다음 기능을 제공합니다:
- 크루즈 여행 정보 안내
- 길찾기 및 경로 안내
- 사진 검색 및 갤러리
- 실시간 질문 응답
- 다국어 지원

24시간 언제든지 이용하실 수 있습니다.`,
    },
    {
      id: 22,
      category: '서비스 이용',
      question: '커뮤니티에 글을 작성하려면 회원가입이 필요한가요?',
      answer: `네, 커뮤니티 이용을 위해서는 회원가입이 필요합니다.

회원가입 후 다음 기능을 이용하실 수 있습니다:
- 여행 후기 작성 및 조회
- 질문답변 게시판 이용
- 여행 팁 공유
- 일정 공유

회원가입은 무료이며, 간단한 정보 입력으로 완료할 수 있습니다.`,
    },
    {
      id: 23,
      category: '크루즈 라인별 정보',
      question: 'MSC 크루즈 알아보기',
      answer: 'MSC 크루즈에 대한 자세한 정보를 확인하실 수 있습니다.',
      articleLink: 'http://leadz.kr/ygo',
    },
    {
      id: 24,
      category: '크루즈 라인별 정보',
      question: '로얄 크루즈 알아보기',
      answer: '로얄 크루즈에 대한 자세한 정보를 확인하실 수 있습니다.',
      articleLink: 'http://leadz.kr/ygq',
    },
    {
      id: 25,
      category: '크루즈 라인별 정보',
      question: '코스타 크루즈 알아보기',
      answer: '코스타 크루즈에 대한 자세한 정보를 확인하실 수 있습니다.',
      articleLink: 'http://leadz.kr/ygr',
    },
    {
      id: 26,
      category: '크루즈 라인별 정보',
      question: '노르웨이지안 크루즈 알아보기',
      answer: '노르웨이지안 크루즈에 대한 자세한 정보를 확인하실 수 있습니다.',
      articleLink: 'http://leadz.kr/ygs',
    },
    {
      id: 27,
      category: '크루즈 라인별 정보',
      question: '카니발 크루즈 알아보기',
      answer: '카니발 크루즈에 대한 자세한 정보를 확인하실 수 있습니다.',
      articleLink: 'http://leadz.kr/ygt',
    },
    {
      id: 28,
      category: '기타',
      question: '매주 방송 공유',
      answer: '크루즈닷의 매주 방송 정보와 공지사항을 카카오톡 오픈채팅방에서 확인하실 수 있습니다.',
      articleLink: 'https://open.kakao.com/o/plREDDUh',
    },
  ];

  const categories = ['전체', '크루즈 기본 정보', '예약 및 결제', '크루즈 여행', '크루즈 안전', '크루즈 라인별 정보', '서비스 이용', '기타'];
  const [selectedCategory, setSelectedCategory] = useState('전체');

  const filteredFAQs = selectedCategory === '전체' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  return (
    <>
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
              <h1 className="text-4xl font-bold text-gray-900 mb-2">자주 묻는 질문</h1>
              <p className="text-gray-600">크루즈 여행에 대한 궁금한 점을 빠르게 찾아보세요.</p>
            </div>

            {/* 카테고리 필터 */}
            <div className="mb-8 flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* FAQ 목록 */}
            <div className="space-y-4">
              {filteredFAQs.map((faq) => {
                const isOpen = openItems.has(faq.id);
                return (
                  <div
                    key={faq.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
                  >
                    <button
                      onClick={() => toggleItem(faq.id)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-blue-600 mb-1 block">
                          {faq.category}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                      </div>
                      {isOpen ? (
                        <FiChevronUp className="text-gray-400 flex-shrink-0 ml-4" size={20} />
                      ) : (
                        <FiChevronDown className="text-gray-400 flex-shrink-0 ml-4" size={20} />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-6 py-4 border-t border-gray-200">
                        <div className="text-gray-700 whitespace-pre-line leading-relaxed mb-4">
                          {faq.answer}
                        </div>
                        {faq.hasVideo && faq.videoId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVideoClick(faq.videoId!);
                            }}
                            className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                          >
                            <FiPlay size={20} />
                            영상 보기
                          </button>
                        )}
                        {faq.articleLink && (
                          <a
                            href={faq.articleLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                          >
                            <FiExternalLink size={18} />
                            자세히 보기
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 비디오 모달 */}
      {selectedVideo && (
        <VideoModal
          videoId={selectedVideo}
          isOpen={isVideoModalOpen}
          onClose={() => {
            setIsVideoModalOpen(false);
            setSelectedVideo(null);
          }}
        />
      )}
    </>
  );
}
