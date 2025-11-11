'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiYoutube } from 'react-icons/fi';
import PublicFooter from '@/components/layout/PublicFooter';
import ProductList from '@/components/mall/ProductList';

/**
 * 공개 크루즈 상품 목록 페이지
 * 로그인 불필요, 누구나 접근 가능
 * 크루즈몰의 ProductList 컴포넌트를 사용하여 상품 표시
 */

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const [isNewWindow, setIsNewWindow] = useState(false);

  // YouTube 관련 상태
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [isYoutubeLoading, setIsYoutubeLoading] = useState(true);

  useEffect(() => {
    // 새 창에서 열렸는지 확인 (크루즈 가이드에서 클릭한 경우)
    if (typeof window !== 'undefined') {
      const isOpenedFromGenie = !!window.opener || 
                                 document.referrer.includes('/chat') ||
                                 sessionStorage.getItem('fromGenie') === 'true';
      setIsNewWindow(isOpenedFromGenie);
      if (isOpenedFromGenie) {
        sessionStorage.setItem('fromGenie', 'true');
      }
    }
    loadYoutubeVideos();
  }, []);

  const loadYoutubeVideos = async () => {
    try {
      setIsYoutubeLoading(true);
      const response = await fetch('/api/public/youtube?maxResults=6');
      const data = await response.json();

      if (data.ok) {
        setYoutubeVideos(data.videos);
      }
    } catch (error) {
      console.error('Error loading YouTube videos:', error);
    } finally {
      setIsYoutubeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-4">
            <h1 className="text-4xl font-bold mb-4">크루즈 상품</h1>
            <p className="text-xl opacity-90 mb-6">
              꿈꾸던 크루즈 여행, 지금 시작하세요
            </p>
          </div>
          
          {/* 크루즈닷 가이드 돌아가기 버튼 (빨간색) - 항상 표시 */}
          <div className="mb-4">
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && window.opener) {
                  window.opener.focus();
                  window.close();
                } else {
                  router.push('/chat');
                }
              }}
              className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-md whitespace-nowrap"
            >
              크루즈닷 가이드 돌아가기
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* YouTube 섹션 */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <FiYoutube className="text-red-600" size={32} />
            <h2 className="text-2xl font-bold text-gray-900">크루즈닷 지니 TV</h2>
            <span className="text-sm text-gray-500">인기영상</span>
            <a
              href="https://www.youtube.com/@cruisedotgini"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              채널 방문하기 →
            </a>
          </div>

          {isYoutubeLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mx-auto mb-3"></div>
              <p className="text-gray-600">영상을 불러오는 중...</p>
            </div>
          ) : youtubeVideos.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed">
              <p className="text-gray-500">영상을 불러올 수 없습니다</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {youtubeVideos.map((video) => (
                <a
                  key={video.id}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden group"
                >
                  {/* 썸네일 */}
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-0 h-0 border-l-[16px] border-l-white border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent ml-1"></div>
                      </div>
                    </div>
                  </div>

                  {/* 영상 정보 */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-red-600 transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(video.publishedAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* 구분선 */}
        <div className="border-t-2 border-gray-200 mb-8"></div>

        {/* 크루즈몰 상품 목록 컴포넌트 사용 */}
        <ProductList />
      </div>

      <PublicFooter />
    </div>
  );
}
