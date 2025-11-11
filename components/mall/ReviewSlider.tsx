// components/mall/ReviewSlider.tsx
// 크루즈 후기 슬라이더 (무한 반복 스크롤)

'use client';

import { useState, useEffect, useRef } from 'react';
import { FiStar } from 'react-icons/fi';

interface Review {
  id: number;
  authorName: string;
  rating: number;
  title: string | null;
  content: string;
  images: string[];
  cruiseLine: string | null;
  shipName: string | null;
  travelDate: string | null;
  productCode: string | null;
  createdAt?: string | Date;
}

export default function ReviewSlider() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const response = await fetch('/api/public/reviews?limit=50');
      const data = await response.json();

      console.log('[ReviewSlider] API Response:', data);

      if (data.ok && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
        console.log('[ReviewSlider] Reviews loaded:', data.reviews.length);
      } else {
        console.error('[ReviewSlider] API Error:', data.error, data.details);
      }
    } catch (error) {
      console.error('[ReviewSlider] Failed to load reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 무한 스크롤 애니메이션
  useEffect(() => {
    if (isLoading || isPaused || reviews.length === 0) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollPosition = 0;
    const scrollSpeed = 0.5; // 픽셀/프레임

    const animate = () => {
      if (isPaused) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      scrollPosition += scrollSpeed;
      
      // 첫 번째 카드 요소를 찾아서 실제 너비 계산
      const firstCard = container.querySelector('a');
      if (firstCard) {
        const cardWidth = firstCard.offsetWidth;
        const gap = 24; // gap-6 = 24px
        const cardTotalWidth = cardWidth + gap;
        
        // 전체 스크롤 가능한 너비 (원본만, 복제본 전까지)
        const totalScrollWidth = reviews.length * cardTotalWidth;
        
        // 끝에 도달하면 처음으로 리셋 (부드럽게)
        if (scrollPosition >= totalScrollWidth) {
          scrollPosition = 0;
        }
      }

      container.scrollLeft = scrollPosition;
      animationRef.current = requestAnimationFrame(animate);
    };

    // 초기 스크롤 위치 설정
    container.scrollLeft = 0;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isLoading, isPaused, reviews.length]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <p className="text-gray-600">등록된 후기가 없습니다.</p>
      </div>
    );
  }

  // 별점 렌더링
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <FiStar
        key={index}
        className={index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
        size={24}
      />
    ));
  };

  // 후기 카드 렌더링 함수
  const renderReviewCard = (review: Review, index: number | string) => (
    <a
      key={`${review.id}-${index}`}
      href={`/community/reviews/${review.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-shrink-0 w-96 md:w-[420px] bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200 hover:shadow-2xl transition-all cursor-pointer block"
    >
      {/* 후기 이미지 */}
      {review.images && review.images.length > 0 ? (
        <div className="relative h-56 md:h-64 bg-gradient-to-br from-blue-400 to-indigo-600 overflow-hidden">
          <img
            src={review.images[0]}
            alt={review.title || '후기 사진'}
            className="w-full h-full object-cover"
            onError={(e) => {
              // 이미지 로드 실패 시 기본 배경 표시
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ) : (
        <div className="h-56 md:h-64 bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
          <div className="text-white text-center">
            <p className="text-3xl md:text-4xl font-black">{review.shipName || '크루즈'}</p>
            <p className="text-base md:text-lg mt-2 font-semibold">{review.cruiseLine || ''}</p>
          </div>
        </div>
      )}

      {/* 후기 내용 */}
      <div className="p-5 md:p-6">
        {/* 작성자 및 별점 */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-base md:text-lg font-bold text-gray-900">{review.authorName}</span>
          <div className="flex items-center gap-1">
            {renderStars(review.rating)}
            <span className="text-base md:text-lg text-gray-700 ml-1 font-semibold">({review.rating})</span>
          </div>
        </div>

        {/* 제목 */}
        {review.title && (
          <h3 className="text-lg md:text-xl font-black text-gray-900 mb-3 line-clamp-2 leading-relaxed">
            {review.title}
          </h3>
        )}

        {/* 내용 */}
        <p className="text-base md:text-lg text-gray-700 line-clamp-3 mb-4 leading-relaxed">
          {review.content}
        </p>

        {/* 여행 정보 */}
        <div className="text-sm md:text-base text-gray-600 space-y-2 font-semibold">
          {review.cruiseLine && (
            <div className="flex items-center gap-2">
              <span className="text-xl">🚢</span>
              <span>{review.cruiseLine}</span>
              {review.shipName && review.shipName !== review.cruiseLine && (
                <span>· {review.shipName}</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <span>{review.createdAt ? new Date(review.createdAt).toLocaleDateString('ko-KR') : review.travelDate || '날짜 없음'}</span>
          </div>
        </div>
      </div>
    </a>
  );

  return (
    <div
      className="relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 슬라이더 컨테이너 */}
      <div
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-hidden scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* 원본 후기들 */}
        {reviews.map((review, index) => renderReviewCard(review, index))}
        
        {/* 복제본 (무한 반복을 위해) */}
        {reviews.map((review, index) => renderReviewCard(review, `clone-${index}`))}
      </div>

      {/* 스크롤 인디케이터 (선택적) */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

