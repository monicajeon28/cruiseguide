// app/page.tsx
// 메인페이지 - 공개 쇼핑몰 (로그인 불필요)

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import CommunitySection from '@/components/mall/CommunitySection';
import ThemeProductSection from '@/components/mall/ThemeProductSection';
import { FiX } from 'react-icons/fi';
import KakaoChannelButton from '@/components/KakaoChannelButton';

export default function HomePage() {
  const [user, setUser] = useState<{ name: string | null; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [pageConfig, setPageConfig] = useState<any>(null);

  useEffect(() => {
    // 로그인 상태 확인
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });

    // 페이지 설정 로드
    loadPageConfig();
  }, []);

  const loadPageConfig = async () => {
    try {
      const response = await fetch('/api/public/page-config');
      const data = await response.json();
      if (data.ok && data.config) {
        setPageConfig(data.config);
      }
    } catch (error) {
      console.error('Failed to load page config:', error);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    try {
      setIsLoggingOut(true);
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 - 항상 표시 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            {/* 왼쪽: 로고 및 환영 메시지 */}
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Link href="/" className="flex items-center flex-shrink-0">
                <img src="/images/ai-cruise-logo.png" alt="크루즈닷 로고" className="h-6 sm:h-8 object-contain" onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/placeholder.png';
                }} />
              </Link>
              {loading ? (
                <span className="text-gray-600 font-semibold text-xs sm:text-sm">로딩 중...</span>
              ) : user ? (
                <Link
                  href="/community/my-info"
                  className="flex items-center gap-1 sm:gap-2 transition-colors cursor-pointer min-w-0"
                >
                  <span className="text-xs sm:text-sm font-semibold truncate text-blue-600">
                    {user.name?.trim() || '고객'}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold whitespace-nowrap text-gray-800">
                    님 환영합니다!
                  </span>
                </Link>
              ) : (
                <span className="text-xs sm:text-sm font-semibold text-gray-800">
                  크루즈닷에 오신 것을 환영합니다!
                </span>
              )}
            </div>

            {/* 오른쪽: 메뉴 버튼들 */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              {!user ? (
                <>
                  <Link
                    href="/mall/login"
                    className="px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-sm sm:text-base font-semibold transition-colors min-h-[44px] flex items-center justify-center text-gray-700 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/mall/signup"
                    className="px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-sm sm:text-base font-semibold transition-colors min-h-[44px] flex items-center justify-center bg-blue-600 text-white hover:opacity-90 active:opacity-80"
                  >
                    회원가입
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/community/my-info"
                    className="px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-sm sm:text-base font-semibold transition-colors min-h-[44px] flex items-center justify-center text-gray-700 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200"
                  >
                    내정보
                  </Link>
                  <Link
                    href="/community"
                    className="px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-sm sm:text-base font-semibold transition-colors min-h-[44px] flex items-center justify-center bg-blue-600 text-white hover:opacity-90 active:opacity-80"
                  >
                    우리끼리크루즈닷
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="px-3 sm:px-4 py-2.5 sm:py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px] text-sm sm:text-base"
                  >
                    로그아웃
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <HeroSection config={pageConfig?.hero} />

      {/* 카카오톡 채널 추가 배너 */}
      <div className="container mx-auto px-4 py-4">
        <KakaoChannelButton variant="banner" />
      </div>

      {/* 크루즈 상품 검색 */}
      {pageConfig?.cruiseSearch?.enabled !== false && (
        <section className="container mx-auto px-4 py-8 md:py-12 bg-white">
          <CruiseSearchBlock />
        </section>
      )}

      {/* 크루즈 후기 */}
      {pageConfig?.reviewSection?.enabled !== false && (
        <section className="container mx-auto px-4 py-12 bg-gray-50">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              {pageConfig?.reviewSection?.title || '⭐ 크루즈 후기'}
            </h2>
            <p className="text-gray-600 mb-4 text-lg">
              {pageConfig?.reviewSection?.description || '실제 고객들이 남긴 생생한 크루즈 여행 후기를 만나보세요'}
            </p>
            <a
              href={pageConfig?.reviewSection?.linkUrl || '/community'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-blue-600 hover:text-blue-700 font-semibold text-lg"
            >
              {pageConfig?.reviewSection?.linkText || '더 많은 후기 보기 →'}
            </a>
          </div>
          <ReviewSlider />
        </section>
      )}

      {/* 크루즈닷의 경험과 신뢰 */}
      {pageConfig?.companyStats?.enabled && (
        <section className="container mx-auto px-4 py-12 bg-gray-50">
          <CompanyStatsSection config={pageConfig.companyStats} />
        </section>
      )}

      {/* 크루즈닷 지니 쇼츠 */}
      {pageConfig?.youtubeShorts?.enabled !== false && (
        <section className="container mx-auto px-4 py-12 bg-white">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              {pageConfig?.youtubeShorts?.title || '🎬 크루즈닷 지니 쇼츠'}
            </h2>
            <p className="text-gray-600 text-lg">
              {pageConfig?.youtubeShorts?.description || '크루즈 여행의 모든 순간을 Shorts로 만나보세요'}
            </p>
          </div>
          <YoutubeShortsSlider />
        </section>
      )}

      {/* 라이브 방송 */}
      {pageConfig?.youtubeLive?.enabled !== false && (
        <section id="live-broadcast" className="container mx-auto px-4 py-12 bg-white">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              {pageConfig?.youtubeLive?.title || '📡 라이브 방송'}
            </h2>
            <p className="text-gray-600 text-lg">
              {pageConfig?.youtubeLive?.description || '지금 이 순간, 크루즈닷 지니와 함께하세요'}
            </p>
          </div>
          <YoutubeLiveSection />
        </section>
      )}

      {/* 크루즈닷 지니 영상 */}
      {pageConfig?.youtubeVideos?.enabled !== false && (
        <section className="container mx-auto px-4 py-12 bg-gray-50">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              {pageConfig?.youtubeVideos?.title || '📺 크루즈닷 지니 영상'}
            </h2>
            <p className="text-gray-600 text-lg">
              {pageConfig?.youtubeVideos?.description || '크루즈 여행의 특별한 영상을 만나보세요'}
            </p>
          </div>
          <YoutubeVideosSlider />
        </section>
      )}

      {/* 인기 크루즈 & 추천 크루즈 */}
      {pageConfig?.productList?.enabled !== false && (
        <section id="products" className="container mx-auto px-4 py-12 bg-white">
          <ProductList />
        </section>
      )}

      {Array.isArray(pageConfig?.themeSections) && pageConfig.themeSections.some((section: any) => section?.enabled) && (
        <div className="bg-gray-50">
          {pageConfig.themeSections
            .filter((section: any) => section?.enabled)
            .map((section: any) => (
              <ThemeProductSection key={section.id} section={section} />
            ))}
        </div>
      )}

      {/* 프로모션 배너 (양싱 베너) */}
      {pageConfig?.promotionBanner?.enabled !== false && (
        <section className="container mx-auto px-4 py-12 bg-gray-50">
          <PromotionBannerCarousel />
        </section>
      )}

      {/* 커뮤니티 하이라이트 */}
      {pageConfig?.communitySection?.enabled !== false && (
        <CommunitySection config={pageConfig?.communitySection} />
      )}

      {/* 크루즈닷 지니 AI 출시 3일 무료체험 배너 */}
      <section className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
                크루즈닷 지니 AI 출시
              </h2>
              <h3 className="text-3xl md:text-4xl font-bold text-yellow-300 mb-6">
                3일 무료체험
              </h3>
              <p className="text-xl md:text-2xl text-blue-100 mb-8 font-medium">
                AI 채팅, 체크리스트, 여행 지도, 가계부까지
              </p>
            </div>
            <div className="mb-6 space-y-4">
              <a
                href="/login-test"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 text-blue-900 font-bold text-xl md:text-2xl px-12 py-6 rounded-2xl shadow-2xl hover:from-yellow-300 hover:via-yellow-200 hover:to-yellow-300 hover:scale-105 transition-all duration-300 transform border-2 border-yellow-500"
              >
                크루즈 지니 AI 3일 무료체험 구경하기 🎉
              </a>
              <div className="mt-6">
                <p className="text-lg md:text-xl text-blue-100 font-semibold mb-4">
                  무료 체험은 본사 문의 해 주세요
                </p>
                <a
                  href="https://leadgeny.kr/i/yjo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-white text-blue-700 font-bold text-xl px-10 py-5 rounded-2xl shadow-2xl hover:bg-yellow-300 hover:scale-105 transition-all duration-300 transform"
                >
                  무료체험 신청하기 🚀
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <PublicFooter />

      {/* 팝업 메시지 */}
      {pageConfig?.popup?.enabled && <PopupMessage config={pageConfig.popup} />}
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
