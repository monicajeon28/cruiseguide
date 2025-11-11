// app/insurance/page.tsx
// 해외여행자보험 페이지

'use client';

import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import Image from 'next/image';

export default function InsurancePage() {
  const insuranceImages = [
    {
      id: 1,
      title: '더블유관광사업등록증',
      src: '/images/insurance/더블유관광사업등록증.jpg',
      alt: '더블유관광사업등록증'
    },
    {
      id: 2,
      title: '크루즈닷관광사업등록증',
      src: '/images/insurance/크루즈닷관광사업등록증20250407.jpg',
      alt: '크루즈닷관광사업등록증'
    },
    {
      id: 3,
      title: '크루즈닷인허가보험증권',
      src: '/images/insurance/크루즈닷인허가보험증권20250430 - 복사본.jpg',
      alt: '크루즈닷인허가보험증권'
    },
    {
      id: 4,
      title: '5억손해보험 완료',
      src: '/images/insurance/wcruise-insurance-5billion.jpg',
      alt: '더블유 5억 손해보험'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* 이전으로 가기 버튼 */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
              <span className="font-medium">이전으로 가기</span>
            </Link>
          </div>

          {/* 헤더 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">해외여행자보험</h1>
          </div>

          {/* 이미지 갤러리 */}
          <div className="grid md:grid-cols-2 gap-8">
            {insuranceImages.map((image) => (
              <div
                key={image.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100"
              >
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 text-center">{image.title}</h3>
                </div>
                <div className="relative aspect-[3/4] bg-gray-100">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    onError={(e) => {
                      // 이미지 로드 실패 시 플레이스홀더 표시
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      if (target.parentElement) {
                        target.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400"><p>이미지를 불러올 수 없습니다</p></div>';
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
