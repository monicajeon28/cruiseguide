// app/reviews/page.tsx
// 고객 후기 페이지 (공개)

export default function ReviewsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            고객 후기
          </h1>
          
          <div className="space-y-6">
            {/* TODO: 실제 후기 데이터를 DB에서 가져와서 표시 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                  홍**
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-800">홍길동님</span>
                    <span className="text-yellow-500">★★★★★</span>
                    <span className="text-sm text-gray-500">2024.01.15</span>
                  </div>
                  <p className="text-gray-700 mb-2">
                    AI 지니 덕분에 정말 편리하게 여행을 즐길 수 있었습니다. 
                    경로 안내부터 여행 기록까지 모든 것이 한 번에 가능했어요!
                  </p>
                  <div className="text-sm text-gray-500">
                    상품: 지중해 크루즈 7박 8일
                  </div>
                </div>
              </div>
            </div>

            {/* 더미 후기 예시 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                  김**
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-800">김영희님</span>
                    <span className="text-yellow-500">★★★★☆</span>
                    <span className="text-sm text-gray-500">2024.01.10</span>
                  </div>
                  <p className="text-gray-700 mb-2">
                    가계부 기능이 특히 유용했습니다. 여행 중 지출을 실시간으로 관리할 수 있어서 좋았어요.
                  </p>
                  <div className="text-sm text-gray-500">
                    상품: 알래스카 크루즈 5박 6일
                  </div>
                </div>
              </div>
            </div>

            {/* 후기 작성 안내 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <p className="text-gray-700 mb-4">
                크루즈닷 AI 지니와 함께한 여행 후기를 공유해주세요!
              </p>
              <a
                href="/community/reviews/write"
                className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                후기 작성하기
              </a>
              <p className="text-sm text-gray-600 mt-2">
                회원가입 후 후기를 작성할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

