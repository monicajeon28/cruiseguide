'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiYoutube } from 'react-icons/fi';
import PublicFooter from '@/components/layout/PublicFooter';
import ProductList from '@/components/mall/ProductList';

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
}

type AffiliateProfile = {
  id: number;
  type: 'BRANCH_MANAGER' | 'SALES_AGENT' | 'HQ' | string;
  status: string;
  displayName?: string | null;
  nickname?: string | null;
  branchLabel?: string | null;
  affiliateCode?: string | null;
  user?: {
    mallUserId: string | null;
    mallNickname: string | null;
  } | null;
  manager?: {
    id: number;
    affiliateCode?: string | null;
    type?: string | null;
    displayName?: string | null;
    nickname?: string | null;
    branchLabel?: string | null;
  } | null;
};

type AuthState = 'checking' | 'authorized';

export default function AffiliateProductsPage() {
  const router = useRouter();
  const [isNewWindow, setIsNewWindow] = useState(false);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [isYoutubeLoading, setIsYoutubeLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [profile, setProfile] = useState<AffiliateProfile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkAffiliateAccess = async () => {
      try {
        const res = await fetch('/api/affiliate/me/profile', { credentials: 'include' });

        if (res.status === 401) {
          router.replace('/login?next=/affiliate/products');
          return;
        }

        const json = await res.json();
        if (!res.ok || !json?.ok || !json.profile) {
          throw new Error(json?.message || '프로필을 불러오지 못했습니다.');
        }

        const profileData: AffiliateProfile = json.profile;

        if (profileData.type === 'HQ') {
          router.replace('/admin/login');
          return;
        }

        if (profileData.type !== 'BRANCH_MANAGER' && profileData.type !== 'SALES_AGENT') {
          router.replace('/');
          return;
        }

        if (!cancelled) {
          setProfile(profileData);
          setAuthState('authorized');
        }
      } catch (error) {
        console.error('[AffiliateProducts] access check failed:', error);
        if (!cancelled) {
          router.replace('/');
        }
      }
    };

    checkAffiliateAccess();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (authState !== 'authorized') {
      return;
    }

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
  }, [authState]);

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

  const handleLogout = async () => {
    if (loggingOut) return;
    try {
      setLoggingOut(true);
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('[AffiliateProducts] logout failed:', error);
    } finally {
      setLoggingOut(false);
      router.replace('/login');
    }
  };

  if (authState !== 'authorized' || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="text-sm text-slate-600">협력사 전용 페이지를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-4">
            <h1 className="text-4xl font-bold mb-4">크루즈 상품</h1>
            <p className="text-xl opacity-90 mb-6">
              꿈꾸던 크루즈 여행, 지금 시작하세요
            </p>
            <div className="flex flex-wrap gap-2 text-sm text-white/90">
              {profile.nickname ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 font-semibold">
                  {profile.nickname}
                </span>
              ) : null}
              {profile.displayName ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                  담당자: {profile.displayName}
                </span>
              ) : null}
              {profile.branchLabel ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                  지점: {profile.branchLabel}
                </span>
              ) : null}
              {profile.affiliateCode ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-mono text-xs">
                  코드 {profile.affiliateCode}
                </span>
              ) : null}
              {profile.type === 'BRANCH_MANAGER' && profile.user?.mallUserId ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-mono text-xs">
                  아이디 {profile.user.mallUserId}
                </span>
              ) : null}
              {profile.type === 'SALES_AGENT' && profile.manager ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                  담당 대리점장: {profile.manager.nickname || profile.manager.displayName || '확인 필요'}
                </span>
              ) : null}
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-3">
            {profile.type === 'BRANCH_MANAGER' && (
              <button
                onClick={() => router.push('/affiliate/team')}
                className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-md"
              >
                팀 관리
              </button>
            )}
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
            <button
              onClick={() => router.push('/login?next=/affiliate/products')}
              className="px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-md"
            >
              로그인 페이지 이동
            </button>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-6 py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-md disabled:bg-slate-400"
            >
              {loggingOut ? '로그아웃 중...' : '로그아웃'}
            </button>
            {profile.user?.mallUserId && (
              <a
                href={`/products/${profile.user.mallUserId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-white text-purple-700 font-semibold rounded-lg hover:bg-purple-50 transition-colors shadow-md"
              >
                파트너몰 열기
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
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

        <div className="border-t-2 border-gray-200 mb-8"></div>

        <ProductList />
      </div>

      <PublicFooter />
    </div>
  );
}

