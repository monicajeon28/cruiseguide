// app/admin/mall/visual-editor/preview/page.tsx
// 미리보기 페이지 (실제 메인페이지와 동일하게 렌더링)

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiX } from 'react-icons/fi';
import HeroSection from '@/components/mall/HeroSection';
import ProductList from '@/components/mall/ProductList';
import ReviewSlider from '@/components/mall/ReviewSlider';
import CruiseSearchBlock from '@/components/mall/CruiseSearchBlock';
import YoutubeShortsSlider from '@/components/mall/YoutubeShortsSlider';
import YoutubeVideosSlider from '@/components/mall/YoutubeVideosSlider';
import YoutubeLiveSection from '@/components/mall/YoutubeLiveSection';
import PromotionBannerCarousel from '@/components/mall/PromotionBannerCarousel';
import PublicFooter from '@/components/layout/PublicFooter';
import CompanyStatsSection from '@/components/mall/CompanyStatsSection';

export default function PreviewPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string | null; role: string } | null>(null);

  useEffect(() => {
    loadConfig();
    // 로그인 상태 확인 (선택적)
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {
        // 미리보기에서는 로그인 실패해도 무시
      });
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/mall/page-config', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.ok && data.config) {
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 데스크톱/모바일 뷰 컨테이너 */}
      <div className="flex gap-4 p-4 h-screen overflow-hidden">
        {/* 왼쪽: 모바일 뷰 (스마트폰 사이즈) - 실제 스마트폰처럼 보이도록 iframe 사용 */}
        <div className="flex-shrink-0 bg-gray-200 rounded-lg shadow-2xl overflow-hidden flex flex-col" style={{ width: '375px' }}>
          {/* 스마트폰 프레임 상단 */}
          <div className="bg-gray-800 px-2 py-1 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-600"></div>
              <div className="w-12 h-1 rounded-full bg-gray-700"></div>
            </div>
          </div>
          {/* iframe으로 실제 메인 페이지 로드 (설정 반영된 버전) */}
          <div className="flex-1 bg-white relative overflow-hidden" style={{ height: '812px' }}>
            <iframe
              src="/"
              className="border-0 w-full h-full"
              style={{
                width: '375px',
                height: '812px',
                transform: 'scale(1)',
                transformOrigin: 'top left',
              }}
              title="모바일 미리보기"
              scrolling="yes"
            />
          </div>
        </div>

        {/* 오른쪽: 데스크톱 뷰 (전체 화면) */}
        <div className="flex-1 bg-gray-50 rounded-lg shadow-lg overflow-hidden flex flex-col">
          <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="ml-2 text-white text-xs font-semibold">🖥️ 데스크톱 미리보기</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto" style={{ height: 'calc(100vh - 40px)' }}>
            <DesktopPreview config={config} user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}

// 데스크톱 미리보기 컴포넌트 (전체 너비)
function DesktopPreview({ config, user }: { config: any; user: any }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      {config.topMenu?.enabled && (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              {/* 왼쪽: 로고 및 환영 메시지 */}
              <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                {config.topMenu.logoUrl && (
                  <Link href={config.topMenu.logoLink || '/'} className="flex items-center flex-shrink-0">
                    <img src={config.topMenu.logoUrl} alt="로고" className="h-6 sm:h-8 object-contain" />
                  </Link>
                )}
                {config.topMenu.welcomeMessage?.enabled && (
                  <div className="flex items-center min-w-0">
                    {user ? (
                      <Link
                        href="/community/my-info"
                        className="flex items-center gap-1 sm:gap-2 transition-colors cursor-pointer min-w-0"
                      >
                        <span className="text-xs sm:text-sm font-semibold truncate" style={{ color: config.topMenu.welcomeMessage.nameColor || '#3b82f6' }}>
                          {user.name?.trim() ? user.name : '고객'}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold whitespace-nowrap" style={{ color: config.topMenu.welcomeMessage.textColor || '#1f2937' }}>
                          {config.topMenu.welcomeMessage.text.replace('{name}', '')}
                        </span>
                      </Link>
                    ) : (
                      <span className="text-xs sm:text-sm font-semibold" style={{ color: config.topMenu.welcomeMessage.textColor || '#1f2937' }}>
                        {config.topMenu.welcomeMessage.text.replace('{name}', '')}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 오른쪽: 메뉴 버튼들 */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                {config.topMenu.menuItems
                  ?.filter((m: any) => m.enabled)
                  .sort((a: any, b: any) => a.order - b.order)
                  .map((item: any) => (
                    <Link
                      key={item.id}
                      href={item.urlSlug}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-sm sm:text-base font-semibold transition-colors min-h-[44px] flex items-center justify-center ${
                        item.isButton
                          ? item.buttonColor === 'red-600' ? 'bg-red-600 text-white hover:opacity-90 active:opacity-80' :
                            item.buttonColor === 'blue-600' ? 'bg-blue-600 text-white hover:opacity-90 active:opacity-80' :
                            item.buttonColor === 'green-600' ? 'bg-green-600 text-white hover:opacity-90 active:opacity-80' :
                            item.buttonColor === 'yellow-600' ? 'bg-yellow-600 text-white hover:opacity-90 active:opacity-80' :
                            item.buttonColor === 'purple-600' ? 'bg-purple-600 text-white hover:opacity-90 active:opacity-80' :
                            'bg-gray-600 text-white hover:opacity-90 active:opacity-80'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200'
                      }`}
                    >
                      {item.text}
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* 히어로 섹션 */}
      <HeroSection config={config.hero} />

      {/* 소셜 버튼 */}
      {config.socialButtons?.enabled && config.socialButtons?.buttons && (
        <section className="container mx-auto px-4 py-6">
          <div className={`flex gap-4 justify-center ${config.socialButtons.layout === 'vertical' ? 'flex-col items-center' : ''}`}>
            {config.socialButtons.buttons
              .filter((btn: any) => btn.enabled)
              .map((btn: any, idx: number) => {
                const sizeClasses = {
                  large: 'px-8 py-4 text-lg',
                  medium: 'px-6 py-3 text-base',
                  small: 'px-4 py-2 text-sm',
                };
                const typeClasses = {
                  kakao: 'bg-yellow-400 text-black hover:bg-yellow-500',
                  youtube: 'bg-red-600 text-white hover:bg-red-700',
                };
                const icon = btn.type === 'kakao' ? '💬' : btn.type === 'youtube' ? '📺' : '';
                
                return (
                  <a
                    key={idx}
                    href={btn.link || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${sizeClasses[btn.size as keyof typeof sizeClasses] || sizeClasses.medium} ${typeClasses[btn.type as keyof typeof typeClasses] || 'bg-gray-600 text-white hover:bg-gray-700'} rounded-lg font-semibold transition-colors`}
                  >
                    {icon} {btn.text}
                  </a>
                );
              })}
          </div>
        </section>
      )}

      {/* 영상 배너 */}
      {config.videoBanner?.enabled && config.videoBanner?.videoUrl && (
        <section className="container mx-auto px-4 py-6">
          <div className="relative rounded-xl overflow-hidden shadow-2xl">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-64 md:h-80 lg:h-96 object-cover"
            >
              <source src={config.videoBanner.videoUrl} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="text-center text-white">
                {config.videoBanner.title && (
                  <h3 className="text-3xl md:text-4xl font-bold mb-4">{config.videoBanner.title}</h3>
                )}
                {config.videoBanner.link && (
                  <a
                    href={config.videoBanner.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    자세히 보기
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 크루즈 상품 검색 */}
      {config.cruiseSearch?.enabled !== false && (
        <section className="container mx-auto px-4 py-8 md:py-12 bg-white">
          <CruiseSearchBlock />
        </section>
      )}

      {/* 크루즈 후기 */}
      {config.reviewSection?.enabled !== false && (
        <section className="container mx-auto px-4 py-12 bg-gray-50">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              {config.reviewSection?.title || '⭐ 크루즈 후기'}
            </h2>
            <p className="text-gray-600 mb-4 text-lg">
              {config.reviewSection?.description || '실제 고객들이 남긴 생생한 크루즈 여행 후기를 만나보세요'}
            </p>
            <a
              href={config.reviewSection?.linkUrl || '/community'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-blue-600 hover:text-blue-700 font-semibold text-lg"
            >
              {config.reviewSection?.linkText || '더 많은 후기 보기 →'}
            </a>
          </div>
          <ReviewSlider />
        </section>
      )}

      {/* 크루즈닷 지니 쇼츠 */}
      {config.youtubeShorts?.enabled !== false && (
        <section className="container mx-auto px-4 py-12 bg-white">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              {config.youtubeShorts?.title || '🎬 크루즈닷 지니 쇼츠'}
            </h2>
            <p className="text-gray-600 text-lg">
              {config.youtubeShorts?.description || '크루즈 여행의 모든 순간을 Shorts로 만나보세요'}
            </p>
          </div>
          <YoutubeShortsSlider />
        </section>
      )}

      {/* 크루즈닷의 경험과 신뢰 */}
      {config.companyStats?.enabled && (
        <section className="container mx-auto px-4 py-12 bg-gray-50">
          <CompanyStatsSection config={config.companyStats} />
        </section>
      )}

      {/* 크루즈닷 지니 영상 */}
      {config.youtubeVideos?.enabled !== false && (
        <section className="container mx-auto px-4 py-12 bg-gray-50">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              {config.youtubeVideos?.title || '📺 크루즈닷 지니 영상'}
            </h2>
            <p className="text-gray-600 text-lg">
              {config.youtubeVideos?.description || '크루즈 여행의 특별한 영상을 만나보세요'}
            </p>
          </div>
          <YoutubeVideosSlider />
        </section>
      )}

      {/* 라이브 방송 */}
      {config.youtubeLive?.enabled !== false && (
        <section className="container mx-auto px-4 py-12 bg-white">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              {config.youtubeLive?.title || '📡 라이브 방송'}
            </h2>
            <p className="text-gray-600 text-lg">
              {config.youtubeLive?.description || '지금 이 순간, 크루즈닷 지니와 함께하세요'}
            </p>
          </div>
          <YoutubeLiveSection />
        </section>
      )}

      {/* 인기 크루즈 & 추천 크루즈 */}
      {config.productList?.enabled !== false && (
        <section id="products" className="container mx-auto px-4 py-12 bg-white">
          <ProductList />
        </section>
      )}

      {/* 프로모션 배너 */}
      {config.promotionBanner?.enabled !== false && (
        <section className="container mx-auto px-4 py-12 bg-gray-50">
          <PromotionBannerCarousel />
        </section>
      )}

      {/* 푸터 */}
      {config.footer?.enabled !== false && (
        <PublicFooter />
      )}

      {/* 팝업 메시지 */}
      {config.popup?.enabled && <PopupMessage config={config.popup} />}
    </div>
  );
}

// 팝업 메시지 컴포넌트
function PopupMessage({ config }: { config: any }) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasSeen, setHasSeen] = useState(false);

  useEffect(() => {
    // localStorage에서 이미 본 팝업인지 확인
    const seen = localStorage.getItem(`popup-seen-${config.title || 'default'}`);
    if (seen === 'true') {
      setIsVisible(false);
      setHasSeen(true);
    } else {
      setIsVisible(true);
    }
  }, [config]);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(`popup-seen-${config.title || 'default'}`, 'true');
  };

  if (!isVisible || hasSeen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative">
        {config.showCloseButton && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
          >
            <FiX size={24} />
          </button>
        )}
        {config.type === 'image' ? (
          <div>
            {config.link ? (
              <a href={config.link} target="_blank" rel="noopener noreferrer" onClick={handleClose}>
                <img
                  src={config.imageUrl}
                  alt={config.title}
                  className="w-full rounded-2xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/placeholder.png';
                  }}
                />
              </a>
            ) : (
              <img
                src={config.imageUrl}
                alt={config.title}
                className="w-full rounded-2xl cursor-pointer"
                onClick={handleClose}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/placeholder.png';
                }}
              />
            )}
          </div>
        ) : (
          <div className="p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">{config.title}</h3>
            <div className="text-gray-700 mb-6 whitespace-pre-line">{config.content}</div>
            {config.link && (
              <a
                href={config.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center font-semibold"
                onClick={handleClose}
              >
                자세히 보기
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
