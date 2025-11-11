'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FiEye, FiHeart, FiMessageCircle, FiClock, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { STATIC_NEWS_POSTS } from '@/app/community/cruisedot-news/news-data';

interface CommunityPost {
  id: number | string;
  title: string;
  content: string;
  category: string;
  authorName: string;
  images?: string[];
  views: number;
  likes: number;
  comments: number;
  createdAt: string;
}

interface CommunityNewsPost extends CommunityPost {
  href: string;
}

const categoryLabels: { [key: string]: string } = {
  'travel-tip': '여행 팁',
  'qna': '질문답변',
  'schedule': '일정 공유',
  'destination': '여행지 추천',
  'review': '후기',
  'all': '전체'
};

interface CommunitySectionProps {
  config?: {
    title?: string;
    description?: string;
    linkText?: string;
    linkUrl?: string;
  };
}

export default function CommunitySection({ config }: CommunitySectionProps) {
  const [recentPosts, setRecentPosts] = useState<CommunityPost[]>([]);
  const [popularPosts, setPopularPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsPosts, setNewsPosts] = useState<CommunityNewsPost[]>([]);
  const recentScrollRef = useRef<HTMLDivElement>(null);
  const popularScrollRef = useRef<HTMLDivElement>(null);
  const newsScrollRef = useRef<HTMLDivElement>(null);

  const title = config?.title ?? '💬 우리끼리 크루즈닷 커뮤니티';
  const description = config?.description ?? '크루즈 여행자들과 정보를 공유하고 소통해보세요';
  const linkText = config?.linkText ?? '커뮤니티 전체 보기';
  const linkUrl = config?.linkUrl ?? '/community';

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      
      // 최근 게시글 6개
      const recentResponse = await fetch('/api/community/posts?limit=6');
      const recentData = await recentResponse.json();
      
      if (recentData.ok && recentData.posts) {
        setRecentPosts(recentData.posts.slice(0, 6));
      }

      // 인기 게시글 (조회수 + 좋아요 기준) 6개
      const popularResponse = await fetch('/api/community/posts?limit=20');
      const popularData = await popularResponse.json();
      
      if (popularData.ok && popularData.posts) {
        // 조회수 + 좋아요 기준으로 정렬
        const sorted = [...popularData.posts].sort((a, b) => {
          const scoreA = a.views + (a.likes * 10);
          const scoreB = b.views + (b.likes * 10);
          return scoreB - scoreA;
        });
        setPopularPosts(sorted.slice(0, 6));
      }

      // 크루즈뉘우스 미리보기 게시글
      const newsResponse = await fetch('/api/community/posts?limit=20&category=cruisedot-news');
      const newsData = await newsResponse.json();

      if (newsData.ok && Array.isArray(newsData.posts)) {
        const mappedNews = newsData.posts
          .filter((post: any) => post?.title)
          .map((post: any) => ({
            id: post.id,
            title: post.title,
            content: post.summary || post.highlight || post.content || '',
            category: post.category || 'cruisedot-news',
            authorName: post.authorName || '크루즈닷 본사',
            images: Array.isArray(post.images) ? post.images : [],
            views: typeof post.views === 'number' ? post.views : 0,
            likes: typeof post.likes === 'number' ? post.likes : 0,
            comments: typeof post.comments === 'number' ? post.comments : 0,
            createdAt: post.createdAt || new Date().toISOString(),
            href: `/community/cruisedot-news?post=db-${post.id}`,
          })) as CommunityNewsPost[];

        if (mappedNews.length > 0) {
          setNewsPosts(mappedNews.slice(0, 12));
          return;
        }
      }

      // fallback to static news posts when no DB news available
      const fallbackNews = STATIC_NEWS_POSTS.slice(0, 12).map((post) => ({
        id: `static-${post.id}`,
        title: post.title,
        content: post.summary,
        category: 'cruisedot-news',
        authorName: '크루즈닷 본사',
        images: [],
        views: post.baseViews,
        likes: post.baseLikes,
        comments: Math.max(12, Math.floor(post.baseLikes / 2)),
        createdAt: post.publishedAt,
        href: `/community/cruisedot-news?post=${post.id}`,
      })) as CommunityNewsPost[];

      setNewsPosts(fallbackNews);
    } catch (error) {
      console.error('Failed to load community posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '오늘';
    if (days === 1) return '어제';
    if (days < 7) return `${days}일 전`;
    if (days < 30) return `${Math.floor(days / 7)}주 전`;
    if (days < 365) return `${Math.floor(days / 30)}개월 전`;
    return `${Math.floor(days / 365)}년 전`;
  };

  const truncateContent = (content: string, maxLength: number = 80) => {
    if (!content) return '';
    const cleaned = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleaned.length <= maxLength) return cleaned;
    return cleaned.substring(0, maxLength) + '...';
  };

  const scrollLeft = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-16 md:py-20 bg-gray-50">
        <div className="flex flex-col justify-center items-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-6"></div>
          <p className="text-xl md:text-2xl text-gray-700 font-semibold">커뮤니티 게시글을 불러오는 중...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-12 md:py-16 bg-gray-50">
      <div className="text-center mb-10 md:mb-12">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-3 md:mb-4">
          {title}
        </h2>
        <p className="text-lg md:text-xl lg:text-2xl text-gray-700 mb-5 md:mb-6 leading-relaxed">
          {description}
        </p>
        <Link
          href={linkUrl}
          className="inline-flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-red-600 to-red-700 text-white text-base md:text-lg font-bold rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 min-h-[48px] md:min-h-[52px]"
        >
          <span>{linkText}</span>
          <span>→</span>
        </Link>
      </div>

      {/* 최근 게시글 섹션 */}
      {recentPosts.length > 0 && (
        <div className="mb-12 md:mb-16">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h3 className="text-2xl md:text-3xl font-black text-gray-900">
              📝 최근 게시글
            </h3>
            <Link
              href={linkUrl}
              className="text-blue-700 hover:text-blue-800 font-bold text-base md:text-lg underline decoration-2 underline-offset-4 transition-colors"
            >
              더보기 →
            </Link>
          </div>
          <div className="relative">
            <button
              onClick={() => scrollLeft(recentScrollRef)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg border-2 border-gray-200 hover:border-blue-500 transition-all transform hover:scale-110"
              aria-label="이전 게시글"
            >
              <FiChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div
              ref={recentScrollRef}
              className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            >
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/community/posts/${post.id}`}
                  className="flex-shrink-0 w-[320px] md:w-[380px] bg-white rounded-lg p-5 md:p-6 shadow-md hover:shadow-xl transition-all border-2 border-gray-200 hover:border-blue-500"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs md:text-sm font-bold rounded-md whitespace-nowrap">
                      {categoryLabels[post.category] || post.category}
                    </span>
                    <span className="text-gray-500 text-xs md:text-sm font-semibold flex items-center gap-1 whitespace-nowrap">
                      <FiClock className="w-3 h-3 md:w-4 md:h-4" />
                      {formatDate(post.createdAt)}
                    </span>
                  </div>
                  <h4 className="text-base md:text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-snug min-h-[3rem]">
                    {post.title}
                  </h4>
                  <p className="text-sm md:text-base text-gray-700 mb-3 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                    {truncateContent(post.content, 80)}
                  </p>
                  {post.images && post.images.length > 0 && (
                    <div className="mb-3">
                      <div className="relative w-full h-32 md:h-40 rounded-md overflow-hidden">
                        <img
                          src={post.images[0]}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="text-sm md:text-base font-bold text-gray-700 truncate max-w-[120px]">
                      {post.authorName}
                    </span>
                    <div className="flex items-center gap-3 md:gap-4">
                      <span className="flex items-center gap-1 text-gray-600 text-xs md:text-sm font-semibold whitespace-nowrap">
                        <FiEye className="w-3 h-3 md:w-4 md:h-4" />
                        {post.views.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-red-600 text-xs md:text-sm font-semibold whitespace-nowrap">
                        <FiHeart className="w-3 h-3 md:w-4 md:h-4" />
                        {post.likes.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-blue-600 text-xs md:text-sm font-semibold whitespace-nowrap">
                        <FiMessageCircle className="w-3 h-3 md:w-4 md:h-4" />
                        {post.comments.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <button
              onClick={() => scrollRight(recentScrollRef)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg border-2 border-gray-200 hover:border-blue-500 transition-all transform hover:scale-110"
              aria-label="다음 게시글"
            >
              <FiChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>
      )}

      {/* 인기 게시글 섹션 */}
      {popularPosts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h3 className="text-2xl md:text-3xl font-black text-gray-900">
              🔥 인기 게시글
            </h3>
            <Link
              href={linkUrl}
              className="text-blue-700 hover:text-blue-800 font-bold text-base md:text-lg underline decoration-2 underline-offset-4 transition-colors"
            >
              더보기 →
            </Link>
          </div>
          <div className="relative">
            <button
              onClick={() => scrollLeft(popularScrollRef)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg border-2 border-gray-200 hover:border-red-500 transition-all transform hover:scale-110"
              aria-label="이전 게시글"
            >
              <FiChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div
              ref={popularScrollRef}
              className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            >
              {popularPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/community/posts/${post.id}`}
                  className="flex-shrink-0 w-[320px] md:w-[380px] bg-white rounded-lg p-5 md:p-6 shadow-md hover:shadow-xl transition-all border-2 border-gray-200 hover:border-red-500"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-xs md:text-sm font-bold rounded-md whitespace-nowrap">
                      {categoryLabels[post.category] || post.category}
                    </span>
                    <span className="text-gray-500 text-xs md:text-sm font-semibold flex items-center gap-1 whitespace-nowrap">
                      <FiClock className="w-3 h-3 md:w-4 md:h-4" />
                      {formatDate(post.createdAt)}
                    </span>
                  </div>
                  <h4 className="text-base md:text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-snug min-h-[3rem]">
                    {post.title}
                  </h4>
                  <p className="text-sm md:text-base text-gray-700 mb-3 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                    {truncateContent(post.content, 80)}
                  </p>
                  {post.images && post.images.length > 0 && (
                    <div className="mb-3">
                      <div className="relative w-full h-32 md:h-40 rounded-md overflow-hidden">
                        <img
                          src={post.images[0]}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="text-sm md:text-base font-bold text-gray-700 truncate max-w-[120px]">
                      {post.authorName}
                    </span>
                    <div className="flex items-center gap-3 md:gap-4">
                      <span className="flex items-center gap-1 text-gray-600 text-xs md:text-sm font-semibold whitespace-nowrap">
                        <FiEye className="w-3 h-3 md:w-4 md:h-4" />
                        {post.views.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-red-600 text-xs md:text-sm font-semibold whitespace-nowrap">
                        <FiHeart className="w-3 h-3 md:w-4 md:h-4" />
                        {post.likes.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-blue-600 text-xs md:text-sm font-semibold whitespace-nowrap">
                        <FiMessageCircle className="w-3 h-3 md:w-4 md:h-4" />
                        {post.comments.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <button
              onClick={() => scrollRight(popularScrollRef)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg border-2 border-gray-200 hover:border-red-500 transition-all transform hover:scale-110"
              aria-label="다음 게시글"
            >
              <FiChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>
      )}

      {/* 크루즈뉘우스 미리보기 */}
      {newsPosts.length > 0 && (
        <div className="mt-12 md:mt-16">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-gray-900">
                📰 크루즈뉘우스 미리보기
              </h3>
              <p className="mt-2 text-base md:text-lg text-gray-600 font-semibold">
                본사에서 직접 전하는 최신 크루즈 소식과 혜택을 확인해보세요
              </p>
            </div>
            <Link
              href="/community/cruisedot-news"
              className="text-blue-700 hover:text-blue-800 font-bold text-base md:text-lg underline decoration-2 underline-offset-4 transition-colors whitespace-nowrap"
            >
              전체 뉴스 보기 →
            </Link>
          </div>
          <div className="relative">
            <button
              onClick={() => scrollLeft(newsScrollRef)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg border-2 border-gray-200 hover:border-indigo-500 transition-all transform hover:scale-110"
              aria-label="이전 뉴스"
            >
              <FiChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div
              ref={newsScrollRef}
              className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            >
              {newsPosts.map((post) => (
                <Link
                  key={String(post.id)}
                  href={post.href}
                  className="flex-shrink-0 w-[320px] md:w-[380px] bg-white rounded-lg p-5 md:p-6 shadow-md hover:shadow-xl transition-all border-2 border-gray-200 hover:border-indigo-500"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs md:text-sm font-bold rounded-md whitespace-nowrap">
                      크루즈뉘우스
                    </span>
                    <span className="text-gray-500 text-xs md:text-sm font-semibold flex items-center gap-1 whitespace-nowrap">
                      <FiClock className="w-3 h-3 md:w-4 md:h-4" />
                      {formatDate(post.createdAt)}
                    </span>
                  </div>
                  <h4 className="text-base md:text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-snug min-h-[3rem]">
                    {post.title}
                  </h4>
                  <p className="text-sm md:text-base text-gray-700 mb-3 line-clamp-3 leading-relaxed min-h-[3.5rem]">
                    {truncateContent(post.content, 100)}
                  </p>
                  {post.images && post.images.length > 0 && (
                    <div className="mb-3">
                      <div className="relative w-full h-32 md:h-40 rounded-md overflow-hidden">
                        <img
                          src={post.images[0]}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="text-sm md:text-base font-bold text-gray-700 truncate max-w-[120px]">
                      {post.authorName || '크루즈닷 본사'}
                    </span>
                    <div className="flex items-center gap-3 md:gap-4">
                      <span className="flex items-center gap-1 text-gray-600 text-xs md:text-sm font-semibold whitespace-nowrap">
                        <FiEye className="w-3 h-3 md:w-4 md:h-4" />
                        {post.views.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-red-600 text-xs md:text-sm font-semibold whitespace-nowrap">
                        <FiHeart className="w-3 h-3 md:w-4 md:h-4" />
                        {post.likes.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-blue-600 text-xs md:text-sm font-semibold whitespace-nowrap">
                        <FiMessageCircle className="w-3 h-3 md:w-4 md:h-4" />
                        {post.comments.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <button
              onClick={() => scrollRight(newsScrollRef)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg border-2 border-gray-200 hover:border-indigo-500 transition-all transform hover:scale-110"
              aria-label="다음 뉴스"
            >
              <FiChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>
      )}

      {/* 게시글이 없을 때 */}
      {!loading && recentPosts.length === 0 && popularPosts.length === 0 && (
        <div className="text-center py-12 md:py-16">
          <p className="text-lg md:text-xl lg:text-2xl text-gray-600 font-semibold mb-5 md:mb-6">
            아직 게시글이 없습니다.
          </p>
          <Link
            href="/community/write"
            className="inline-flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-base md:text-lg font-bold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 min-h-[48px] md:min-h-[52px]"
          >
            <span>첫 게시글 작성하기</span>
            <span>→</span>
          </Link>
        </div>
      )}
    </section>
  );
}

