// app/exhibition/page.tsx
// 기획전 페이지

export default function ExhibitionPage() {
  const exhibitions = [
    {
      id: 1,
      title: '지중해 크루즈 특별 기획전',
      subtitle: '유럽의 아름다운 항구 도시를 만나다',
      image: '🌊',
      description: '지중해의 푸른 바다와 유럽의 역사 깊은 항구 도시들을 크루즈로 만나보세요. 이탈리아, 그리스, 스페인 등 다양한 국가를 한 번에 여행할 수 있습니다.',
      destinations: ['나폴리', '산토리니', '바르셀로나', '몰타'],
      period: '2025.04 ~ 2025.10',
      price: '2인 기준 450만원부터'
    },
    {
      id: 2,
      title: '알래스카 크루즈 기획전',
      subtitle: '자연의 장관을 크루즈로',
      image: '🏔️',
      description: '알래스카의 거대한 빙하와 야생 동물들을 만날 수 있는 특별한 크루즈 여행. 자연의 아름다움을 만끽하세요.',
      destinations: ['앵커리지', '스카그웨이', '빅토리아', '케치칸'],
      period: '2025.05 ~ 2025.09',
      price: '2인 기준 580만원부터'
    },
    {
      id: 3,
      title: '카리브해 패밀리 크루즈',
      subtitle: '온 가족이 함께하는 특별한 여행',
      image: '🏝️',
      description: '카리브해의 푸른 바다와 화려한 해변을 온 가족이 함께 즐길 수 있는 패밀리 전용 크루즈 패키지입니다.',
      destinations: ['바하마', '자메이카', '케이맨 제도', '코스타마야'],
      period: '2025.06 ~ 2025.08',
      price: '2인 기준 380만원부터'
    },
    {
      id: 4,
      title: '동남아시아 크루즈 기획전',
      subtitle: '아시아의 열대 낙원',
      image: '🌴',
      description: '싱가포르, 태국, 말레이시아 등 동남아시아의 아름다운 섬들을 크루즈로 여행하는 특별한 기획전입니다.',
      destinations: ['싱가포르', '푸켓', '랑카위', '발리'],
      period: '2025.10 ~ 2026.03',
      price: '2인 기준 320만원부터'
    },
    {
      id: 5,
      title: '북유럽 크루즈 기획전',
      subtitle: '북유럽의 매력을 만나다',
      image: '❄️',
      description: '노르웨이, 덴마크, 스웨덴 등 북유럽의 아름다운 풍경과 문화를 체험할 수 있는 프리미엄 크루즈 여행입니다.',
      destinations: ['코펜하겐', '오슬로', '스톡홀름', '헬싱키'],
      period: '2025.06 ~ 2025.08',
      price: '2인 기준 520만원부터'
    },
    {
      id: 6,
      title: '일본 크루즈 기획전',
      subtitle: '가까운 곳에서 즐기는 일본 여행',
      image: '🌸',
      description: '일본의 다양한 항구 도시를 크루즈로 여행하는 특별한 기획전. 가까운 거리에서 일본의 매력을 만나보세요.',
      destinations: ['요코하마', '오사카', '후쿠오카', '나하'],
      period: '2025.03 ~ 2025.11',
      price: '2인 기준 280만원부터'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">기획전</h1>
            <p className="text-xl text-gray-600">테마별로 구성된 특별한 크루즈 여행 기획전을 만나보세요.</p>
          </div>

          {/* 기획전 목록 */}
          <div className="space-y-8 mb-12">
            {exhibitions.map((exhibition) => (
              <div
                key={exhibition.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="md:flex">
                  <div className="md:w-1/3 bg-gradient-to-br from-blue-500 to-purple-600 p-12 flex items-center justify-center">
                    <div className="text-8xl">{exhibition.image}</div>
                  </div>
                  <div className="md:w-2/3 p-8">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                        기획전
                      </span>
                      <span className="text-sm text-gray-500">📅 {exhibition.period}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{exhibition.title}</h2>
                    <p className="text-lg text-gray-600 mb-4">{exhibition.subtitle}</p>
                    <p className="text-gray-700 mb-6 leading-relaxed">{exhibition.description}</p>
                    
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">📍 주요 기항지:</h3>
                      <div className="flex flex-wrap gap-2">
                        {exhibition.destinations.map((dest, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                          >
                            {dest}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">가격</p>
                        <p className="text-xl font-bold text-blue-600">{exhibition.price}</p>
                      </div>
                      <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                        자세히 보기
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 상담 안내 */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">원하시는 기획전이 있으신가요?</h2>
            <p className="text-lg mb-6 opacity-90">
              전문 상담사가 맞춤형 크루즈 여행을 도와드립니다.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="tel:01032893800"
                className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                📞 010-3289-3800
              </a>
              <a
                href="https://leadgeny.kr/i/yjo"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-blue-800 text-white font-semibold rounded-lg hover:bg-blue-900 transition-colors"
              >
                💬 상담하기
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}













