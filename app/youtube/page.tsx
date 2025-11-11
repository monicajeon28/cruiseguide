// app/youtube/page.tsx
// 크루즈닷 유튜브 콘텐츠 페이지 (공개)

export default function YouTubePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            크루즈닷 유튜브 콘텐츠
          </h1>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 mb-4">
              크루즈 여행에 대한 유용한 정보와 여행 영상을 만나보세요.
            </p>
            
            {/* 유튜브 임베드 영역 */}
            <div className="space-y-6">
              {/* TODO: 실제 유튜브 채널 ID 또는 플레이리스트 ID를 추가 */}
              <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">유튜브 영상 임베드 영역</p>
              </div>
              
              {/* 채널 링크 */}
              <div className="text-center">
                <a
                  href="https://www.youtube.com/@cruisedot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                >
                  📺 크루즈닷 유튜브 채널 구독하기
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

























