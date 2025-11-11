'use client';

export default function YoutubeLiveSection() {
  return (
    <section className="container mx-auto px-4 py-8 md:py-10">
      <div className="bg-gradient-to-br from-red-50 via-white to-yellow-50 rounded-3xl p-8 md:p-12 lg:p-16 shadow-2xl max-w-5xl mx-auto border-2 border-red-200 pb-8 md:pb-10 lg:pb-12">
        {/* 헤더 */}
        <div className="text-center mb-6 md:mb-8">
          <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-4 leading-tight tracking-tight">
            <span className="block sm:inline text-red-600 mb-2 sm:mb-0">매주 화요일</span>
            <span className="block sm:inline sm:mx-2 text-red-600">라이브 방송</span>
            <br className="hidden sm:block" />
            <span className="block sm:inline mt-2 sm:mt-0">다양한 크루즈를</span>
            <span className="block sm:inline sm:mx-1">알려드립니다</span>
          </h3>
        </div>

        {/* 크루즈세미나 GIF 이미지 */}
        <div className="mb-6 md:mb-8 flex justify-center">
          <div className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-xl">
            <img 
              src="/크루즈세미나.gif" 
              alt="크루즈세미나" 
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        {/* 버튼 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-0">
          {/* 카카오톡 참여하기 버튼 - 노란색, 크게 */}
          <a
            href="https://open.kakao.com/o/plREDDUh"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 hover:from-yellow-400 hover:via-yellow-500 hover:to-yellow-600 text-gray-900 font-black text-xl md:text-2xl lg:text-3xl rounded-2xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer p-8 md:p-10 lg:p-12 flex flex-col items-center justify-center gap-4 min-h-[180px] md:min-h-[200px]"
          >
            <div className="text-5xl md:text-6xl lg:text-7xl">💬</div>
            <span className="text-center">카카오톡 참여하기</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
            <div className="absolute top-2 right-2 text-2xl animate-pulse">✨</div>
          </a>

          {/* 유튜브 구독하기 버튼 - 빨간색, 크게 */}
          <a
            href="https://www.youtube.com/@cruisedotgini?sub_confirmation=1"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white font-black text-xl md:text-2xl lg:text-3xl rounded-2xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer p-8 md:p-10 lg:p-12 flex flex-col items-center justify-center gap-4 min-h-[180px] md:min-h-[200px]"
          >
            <div className="text-5xl md:text-6xl lg:text-7xl">📺</div>
            <span className="text-center">유튜브 구독하기</span>
            <div className="text-sm md:text-base lg:text-lg font-semibold opacity-90 mt-2">
              크루즈닷가이드지니AI
            </div>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="absolute top-2 right-2 text-2xl animate-pulse">🔴</div>
          </a>
        </div>
      </div>
    </section>
  );
}
