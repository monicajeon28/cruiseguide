'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CruiseTripRegistration from '@/components/CruiseTripRegistration';

export default function OnboardingPage() {
  const router = useRouter();
  const [initialTripData, setInitialTripData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasExistingTrip, setHasExistingTrip] = useState(false);

  useEffect(() => {
    // 기존 여행 데이터가 있는지 확인
    const loadExistingTrip = async () => {
      try {
        const response = await fetch('/api/trips/latest', { credentials: 'include' });
        const data = await response.json();
        
        if (data.success && data.trip) {
          // 기존 여행이 있으면 온보딩 페이지 접근 차단
          setHasExistingTrip(true);
          // 프로필 페이지로 리다이렉트
          router.push('/profile');
          return;
        }
        
        // 기존 여행이 없으면 새로 등록하는 모드
        setInitialTripData(null);
      } catch (error) {
        console.log('No existing trip found or error:', error);
        // 기존 여행이 없으면 새로 등록하는 모드
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingTrip();
  }, [router]);

  // 기존 여행이 있으면 아무것도 렌더링하지 않음 (리다이렉트 중)
  if (hasExistingTrip || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-lg text-gray-800">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <CruiseTripRegistration initialTripData={initialTripData} />
    </div>
  );
}

