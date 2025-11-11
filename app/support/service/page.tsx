// app/support/service/page.tsx
// 서비스 소개 페이지 - HTML 편집 지원

'use client';

import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import { useState, useEffect } from 'react';

export default function ServicePage() {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 저장된 HTML이 있으면 로드
    const loadHtml = async () => {
      try {
        const res = await fetch(`/api/pages/html?pagePath=${encodeURIComponent('/support/service')}`);
        const data = await res.json();
        if (data.ok && data.html) {
          setHtmlContent(data.html);
        }
      } catch (error) {
        console.error('Failed to load HTML:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHtml();
  }, []);

  // 저장된 HTML이 있으면 렌더링
  if (htmlContent) {
    return (
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    );
  }

  // 기본 페이지 (기존 코드)
  const [headerTitle, setHeaderTitle] = useState('크루즈닷 서비스 소개');
  const [headerSubtitle, setHeaderSubtitle] = useState('크루즈 여행의 모든 것을 한 곳에서 제공하는 종합 플랫폼');
  const [highlightTitle, setHighlightTitle] = useState('크루즈 여행, 더 쉽고 편리하게!');
  const [highlightText, setHighlightText] = useState('크루즈닷과 함께하면 크루즈 여행 준비부터 여행 중까지 모든 것이 간편해집니다.');
  const [highlightButtonText, setHighlightButtonText] = useState('상담하기');
  const [highlightButtonLink, setHighlightButtonLink] = useState('https://leadgeny.kr/i/yjo');

  const defaultServices = [
    {
      icon: '🧞',
      title: 'AI 크루즈 가이드 지니',
      description: '24시간 언제든지 크루즈 여행에 대한 질문을 할 수 있는 AI 어시스턴트입니다. 실시간 정보 제공과 맞춤형 여행 가이드를 제공합니다.',
      features: ['길찾기 및 경로 안내', '사진 검색 및 갤러리', '실시간 질문 응답', '다국어 지원']
    },
    {
      icon: '📱',
      title: '모바일 앱 서비스',
      description: '스마트폰에서 언제든지 크루즈 정보를 확인하고, 여행 준비를 도와드립니다.',
      features: ['여행 준비물 체크리스트', '환율 계산기', '번역기', '지갑 관리']
    },
    {
      icon: '🎫',
      title: '크루즈 예약 서비스',
      description: '다양한 크루즈 상품을 비교하고 예약할 수 있는 종합 플랫폼입니다.',
      features: ['다양한 크루즈 상품 비교', '실시간 예약 가능', '안전한 결제 시스템', '예약 관리']
    },
    {
      icon: '📺',
      title: '크루즈닷 지니 TV',
      description: '크루즈 여행 영상, Shorts, 라이브 방송을 통해 크루즈 여행의 생생한 경험을 공유합니다.',
      features: ['YouTube Shorts', '여행 영상 콘텐츠', '라이브 방송', '후기 영상']
    },
    {
      icon: '💬',
      title: '커뮤니티',
      description: '크루즈 여행자들과 정보를 공유하고, 여행 팁과 후기를 나누는 공간입니다.',
      features: ['여행 후기 게시판', '질문답변', '여행 팁 공유', '일정 공유']
    },
    {
      icon: '🛡️',
      title: '한국크루즈전문여행사',
      description: '안전한 크루즈 여행을 위한\n한국크루즈여행사가\n경험만을 말씀 드립니다.',
      features: ['크루즈경험자상담', '크루즈 스탭지원', '11년이상 인솔자 지원', '크루즈정보지원']
    }
  ];

  const [services, setServices] = useState(defaultServices);

  useEffect(() => {
    // 데이터베이스에서 콘텐츠 로드
    const loadContent = async () => {
      try {
        const res = await fetch(`/api/pages/content?pagePath=${encodeURIComponent('/support/service')}`);
        const data = await res.json();
        
        if (data.ok && data.contents) {
          const contents = data.contents;
          
          // 헤더 콘텐츠
          const headerTitleContent = contents.find((c: any) => c.section === 'header' && c.contentType === 'text' && c.itemId === 'title');
          const headerSubtitleContent = contents.find((c: any) => c.section === 'header' && c.contentType === 'text' && c.itemId === 'subtitle');
          
          if (headerTitleContent) setHeaderTitle(headerTitleContent.content.text || headerTitle);
          if (headerSubtitleContent) setHeaderSubtitle(headerSubtitleContent.content.text || headerSubtitle);
          
          // 하이라이트 콘텐츠
          const highlightTitleContent = contents.find((c: any) => c.section === 'highlight' && c.contentType === 'text' && c.itemId === 'title');
          const highlightTextContent = contents.find((c: any) => c.section === 'highlight' && c.contentType === 'text' && c.itemId === 'text');
          const highlightButtonContent = contents.find((c: any) => c.section === 'highlight' && c.contentType === 'button' && c.itemId === 'button');
          
          if (highlightTitleContent) setHighlightTitle(highlightTitleContent.content.text || highlightTitle);
          if (highlightTextContent) setHighlightText(highlightTextContent.content.text || highlightText);
          if (highlightButtonContent) {
            setHighlightButtonText(highlightButtonContent.content.title || highlightButtonText);
            setHighlightButtonLink(highlightButtonContent.content.link || highlightButtonLink);
          }
          
          // 서비스 목록
          const serviceContents = contents.filter((c: any) => c.section === 'services');
          if (serviceContents.length > 0) {
            const loadedServices = serviceContents
              .sort((a: any, b: any) => a.order - b.order)
              .map((c: any) => {
                const emojiContent = contents.find((ec: any) => ec.section === 'services' && ec.itemId === c.itemId && ec.contentType === 'emoji');
                const titleContent = contents.find((tc: any) => tc.section === 'services' && tc.itemId === c.itemId && tc.contentType === 'text' && tc.content.text?.includes('title'));
                const descContent = contents.find((dc: any) => dc.section === 'services' && dc.itemId === c.itemId && dc.contentType === 'text' && dc.content.text?.includes('description'));
                const featuresContent = contents.find((fc: any) => fc.section === 'services' && fc.itemId === c.itemId && fc.contentType === 'list');
                
                return {
                  icon: emojiContent?.content.emoji || '✨',
                  title: titleContent?.content.text || c.content.title || '서비스',
                  description: descContent?.content.text || c.content.description || '',
                  features: featuresContent?.content.items || c.content.features || [],
                };
              });
            
            if (loadedServices.length > 0) {
              setServices(loadedServices);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load page content:', error);
      }
    };
    
    loadContent();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  }

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
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {headerTitle}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {headerSubtitle}
            </p>
          </div>

          {/* 서비스 목록 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="text-5xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-4 leading-relaxed whitespace-pre-line">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-500 mt-1">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* 하이라이트 */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 md:p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">{highlightTitle}</h2>
            <p className="text-lg mb-6 opacity-90">
              {highlightText}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href={highlightButtonLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                {highlightButtonText}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
