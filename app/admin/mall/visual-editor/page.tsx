// app/admin/mall/visual-editor/page.tsx
// 메인페이지 완전한 시각적 편집기 (노코드)

'use client';

import { useState, useEffect, useRef } from 'react';
import { FiEdit2, FiSave, FiEye, FiX, FiPlus, FiTrash2, FiImage, FiLink, FiChevronUp, FiChevronDown, FiMove, FiFolder } from 'react-icons/fi';
import ThemeProductSectionsEditor from './ThemeProductSectionsEditor';
import LandingPageMenuBarEditor from './LandingPageMenuBarEditor';
import { showSuccess, showError } from '@/components/ui/Toast';
import Link from 'next/link';
import FileGallery from '@/components/admin/mall/FileGallery';

interface PageConfig {
  hero: {
    videoUrl: string;
    logoUrl?: string; // 로고 이미지 URL
    title: string;
    subtitle: string;
    buttons: Array<{ 
      text: string; 
      link: string;
      backgroundColor?: string; // 버튼 배경색 (예: #ffffff, blue-600)
      textColor?: string; // 버튼 글씨색 (예: #000000, white)
    }>;
  };
  socialButtons: {
    enabled: boolean;
    layout: 'horizontal' | 'vertical'; // 버튼 배치 방식
    buttons: Array<{
      enabled: boolean;
      type: 'kakao' | 'youtube' | 'custom';
      text: string;
      link: string;
      size: 'large' | 'medium' | 'small'; // 버튼 크기
      icon?: string;
      backgroundColor?: string; // 버튼 배경색 (예: #ffffff, blue-600)
      textColor?: string; // 버튼 글씨색 (예: #000000, white)
    }>;
  };
  videoBanner: {
    enabled: boolean;
    videoUrl: string;
    title: string;
    link: string;
  };
  companyStats: {
    enabled: boolean;
    title: string;
    subtitle: string;
    satisfactionScore: number; // 만족도 점수 (예: 4.8)
    topRowCards: Array<{
      icon: string;
      value: string;
      description: string;
    }>;
    bottomRowCards: Array<{
      icon: string;
      value: string;
      description: string;
      bgColor: 'blue' | 'yellow' | 'green';
      autoIncrement?: boolean; // 자동 증가 여부
      incrementInterval?: number; // 증가 간격 (초)
      incrementAmount?: number; // 증가량
    }>;
  };
  cruiseSearch: {
    enabled: boolean;
    title: string;
  };
  reviewSection: {
    enabled: boolean;
    title: string;
    description: string;
    linkText: string;
    linkUrl: string;
  };
  communitySection: {
    enabled: boolean;
    title: string;
    description: string;
    linkText: string;
    linkUrl: string;
  };
  youtubeShorts: {
    enabled: boolean;
    title: string;
    description: string;
  };
  youtubeVideos: {
    enabled: boolean;
    title: string;
    description: string;
  };
  youtubeLive: {
    enabled: boolean;
    title: string;
    description: string;
  };
  productList: {
    enabled: boolean;
  };
  // 상품 목록 블록들 (여러 개의 상품 섹션을 독립적으로 관리)
  productSections: Array<{
    id: string; // 고유 ID
    enabled: boolean; // 활성화 여부
    title: string; // 섹션 제목
    type: 'swipe' | 'grid-2x3' | 'grid-3' | 'grid-4' | 'fixed-3' | 'fixed-8'; // 표시 타입
    products: Array<{
      productCode: string; // 상품 코드
      productName?: string; // 상품명 (자동으로 가져올 수 있음)
    }>;
    linkUrl?: string; // 더보기 버튼 링크 (영어 주소)
    linkText?: string; // 더보기 버튼 텍스트
  }>;
  themeSections: Array<{
    id: string;
    enabled: boolean;
    title: string;
    subtitle?: string;
    displayType: 'carousel' | 'grid';
    themeType: 'classification' | 'cruiseLine' | 'category' | 'tag';
    themeValue: string;
    limit: number;
    linkText?: string;
    linkUrl?: string;
  }>;
  // 메뉴 카테고리 설정
  categoryMenu: {
    enabled: boolean;
    categories: Array<{
      id: string; // 고유 ID
      enabled: boolean; // 활성화 여부
      icon: string; // 아이콘 (이모지 또는 이미지 URL)
      text: string; // 메뉴 텍스트
      pageName: string; // 페이지 이름 (내부 관리용, 예: ActivityPage)
      urlSlug: string; // 영어 주소 (URL, 예: /category/activity)
      order: number; // 정렬 순서
    }>;
  };
  // 상단 고정 메뉴 (헤더)
  topMenu: {
    enabled: boolean;
    logoUrl?: string; // 로고 이미지 URL
    logoLink?: string; // 로고 클릭 시 이동할 링크
    welcomeMessage?: {
      enabled: boolean; // 환영 메시지 활성화 여부
      text: string; // 환영 메시지 텍스트 (예: "{name}님 환영합니다!")
      nameColor?: string; // 이름 색상 (예: #3b82f6)
      textColor?: string; // 텍스트 색상 (예: #1f2937)
    };
    menuItems: Array<{
      id: string; // 고유 ID
      enabled: boolean; // 활성화 여부
      text: string; // 메뉴 텍스트
      urlSlug: string; // 영어 주소 (URL)
      order: number; // 정렬 순서
      isButton?: boolean; // 버튼 스타일 여부
      buttonColor?: string; // 버튼 색상 (예: red-600, blue-600)
    }>;
  };
  // 하단 푸터
  footer: {
    enabled: boolean;
    companyName: string; // 회사명
    companyInfo: string; // 회사 정보 (주소, 사업자번호 등)
    copyright: string; // 저작권 정보
    menuItems: Array<{
      id: string; // 고유 ID
      enabled: boolean; // 활성화 여부
      text: string; // 메뉴 텍스트
      urlSlug: string; // 영어 주소 (URL)
      order: number; // 정렬 순서
      isHighlight?: boolean; // 강조 표시 여부 (예: 개인정보처리방침)
    }>;
    contactInfo: {
      phone?: string; // 전화번호
      email?: string; // 이메일
      kakaoLink?: string; // 카카오톡 링크
      businessHours?: string; // 운영시간
    };
  };
  // 메인몰 전역 설정
  globalSettings: {
    // 배너 이미지 설정
    banners: {
      heroBanner?: string; // 히어로 배너 이미지 URL
      promotionBanner?: string; // 프로모션 배너 이미지 URL
      categoryBanner?: string; // 카테고리 배너 이미지 URL
    };
    // 이모티콘 설정 (V 표시 대신)
    checkmarkIcon: string; // 체크 표시 이모티콘 (기본: ✓)
    // 버튼 기본 색상 설정
    buttonColors: {
      primary: string; // 기본 버튼 배경색
      primaryText: string; // 기본 버튼 글씨색
      secondary: string; // 보조 버튼 배경색
      secondaryText: string; // 보조 버튼 글씨색
    };
  };
  // 상품 메뉴바 (하단 메뉴바)
  productMenuBar: {
    enabled: boolean;
    position: 'bottom' | 'top'; // 하단 또는 상단
    menuItems: Array<{
      id: string;
      enabled: boolean; // 활성화 여부
      text: string;
      icon?: string; // 이모티콘 또는 아이콘 URL
      urlSlug: string;
      order: number; // 정렬 순서
    }>;
  };
  // 랜딩페이지 메뉴바
  landingPageMenuBar: {
    enabled: boolean;
    position: 'top' | 'left'; // 상단 또는 왼쪽
    displayType: 'full' | 'button'; // 전체 메뉴 또는 버튼형
    buttonPosition?: 'left-top' | 'right-top'; // 버튼형일 경우 위치
    menuItems: Array<{
      id: string;
      enabled: boolean; // 활성화 여부
      text: string;
      urlSlug: string;
      order: number; // 정렬 순서
    }>;
  };
  promotionBanner: {
    enabled: boolean;
  };
  sectionOrder: string[]; // 섹션 순서 배열
  sections: Array<{
    id: string;
    type: string;
    enabled: boolean;
    config: any;
  }>;
  popup: {
    enabled: boolean;
    type: 'image' | 'text';
    imageUrl: string;
    title: string;
    content: string;
    link: string;
    showCloseButton: boolean;
  };
}

const deepClone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

const mergeConfigWithDefaults = <T extends Record<string, any>>(base: T, overrides?: Partial<T>): T => {
  if (!overrides) return base;

  const result = deepClone(base);

  const merge = (target: any, source: any) => {
    Object.entries(source ?? {}).forEach(([key, value]) => {
      if (value === undefined) return;

      if (Array.isArray(value)) {
        target[key] = value;
        return;
      }

      if (value !== null && typeof value === 'object') {
        if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
          target[key] = {};
        }
        merge(target[key], value);
        return;
      }

      target[key] = value;
    });
  };

  merge(result, overrides);
  return result;
};

export default function VisualEditorPage() {
  const [config, setConfig] = useState<PageConfig>({
    hero: {
      videoUrl: '/videos/hero-video.mp4',
      logoUrl: '/images/ai-cruise-logo.png', // 기본 로고
      title: '크루즈닷 AI 지니',
      subtitle: '여행 준비부터 여행 중까지\nAI가 함께하는 특별한 크루즈 여행',
      buttons: [
        { text: '지금 시작하기', link: '/login', backgroundColor: '#ffffff', textColor: '#1e40af' },
        { text: '라이브방송참여', link: '#live-broadcast', backgroundColor: '#ffffff', textColor: '#1e40af' },
        { text: '상품 둘러보기', link: '#products', backgroundColor: '#ffffff', textColor: '#1e40af' },
      ],
    },
    socialButtons: {
      enabled: true,
      layout: 'horizontal',
      buttons: [
        { enabled: true, type: 'kakao', text: '카카오톡 상담', link: '', size: 'medium', backgroundColor: '#FEE500', textColor: '#000000' },
        { enabled: true, type: 'youtube', text: '유튜브 구독하기', link: 'https://www.youtube.com/@cruisedot', size: 'medium', backgroundColor: '#FF0000', textColor: '#FFFFFF' },
      ],
    },
    videoBanner: {
      enabled: true,
      videoUrl: '/videos/cruise-showcase-video.mp4',
      title: '크루즈 여행의 모든 순간',
      link: '/products',
    },
    companyStats: {
      enabled: true,
      title: '크루즈닷의 경험과 신뢰',
      subtitle: '오랜 경험과 전문성으로 고객님께 최고의 서비스를 제공합니다',
      satisfactionScore: 4.8,
      topRowCards: [
        { icon: '👨‍💼', value: '총 67회', description: '상담 매니저 크루즈 여행 경험수' },
        { icon: '✈️', value: '11년~', description: '패키지 크루즈 인솔자 경력 기간' },
        { icon: '🇰🇷', value: '11년~', description: '한국 크루즈 전문된 지' },
        { icon: '🏢', value: '8년~', description: '한국 여행사 운영한 지' },
      ],
      bottomRowCards: [
        { icon: '📊', value: '102', description: '이 페이지를 보고 크루즈닷 여행 준비하는 회원', bgColor: 'blue', autoIncrement: true, incrementInterval: 3, incrementAmount: 3 },
        { icon: '💬', value: '13212', description: '우리는 크루즈여행을 문의', bgColor: 'yellow', autoIncrement: true, incrementInterval: 5, incrementAmount: 9 },
        { icon: '🎉', value: '3217명', description: '을 행복하게 보내드렸습니다', bgColor: 'green' },
      ],
    },
    cruiseSearch: {
      enabled: true,
      title: '크루즈 상품 검색',
    },
    reviewSection: {
      enabled: true,
      title: '⭐ 크루즈 후기',
      description: '실제 고객들이 남긴 생생한 크루즈 여행 후기를 만나보세요',
      linkText: '더 많은 후기 보기 →',
      linkUrl: '/community',
    },
    communitySection: {
      enabled: true,
      title: '💬 우리끼리 크루즈닷 커뮤니티',
      description: '크루즈 여행자들과 정보를 공유하고 소통해보세요',
      linkText: '커뮤니티 전체 보기',
      linkUrl: '/community',
    },
    youtubeShorts: {
      enabled: true,
      title: '🎬 크루즈닷 지니 TV - Shorts',
      description: '크루즈 여행의 모든 순간을 Shorts로 만나보세요',
    },
    youtubeVideos: {
      enabled: true,
      title: '📺 크루즈닷 지니 TV - 영상',
      description: '크루즈 여행의 특별한 영상을 만나보세요',
    },
    youtubeLive: {
      enabled: true,
      title: '📡 라이브 방송',
      description: '지금 이 순간, 크루즈닷 지니와 함께하세요',
    },
    productList: {
      enabled: true,
    },
    productSections: [], // 상품 목록 블록들
    themeSections: [], // 테마 섹션들
    categoryMenu: {
      enabled: true,
      categories: [
        { id: '1', enabled: true, icon: '🎯', text: '액티비티', pageName: 'ActivityPage', urlSlug: '/category/activity', order: 1 },
        { id: '2', enabled: true, icon: '📚', text: '클래스', pageName: 'ClassPage', urlSlug: '/category/class', order: 2 },
        { id: '3', enabled: true, icon: '🎫', text: '입장권', pageName: 'TicketPage', urlSlug: '/category/ticket', order: 3 },
      ],
    },
    topMenu: {
      enabled: true,
      logoUrl: '/images/ai-cruise-logo.png',
      logoLink: '/',
      welcomeMessage: {
        enabled: true,
        text: '{name}님 환영합니다!',
        nameColor: '#3b82f6',
        textColor: '#1f2937',
      },
      menuItems: [
        { id: '1', enabled: true, text: '우리끼리크루즈닷', urlSlug: '/community', order: 1, isButton: true, buttonColor: 'red-600' },
        { id: '2', enabled: true, text: '나의정보', urlSlug: '/community/my-info', order: 2, isButton: true, buttonColor: 'blue-600' },
        { id: '3', enabled: true, text: '로그인', urlSlug: '/community/login', order: 3, isButton: true, buttonColor: 'blue-600' },
        { id: '4', enabled: true, text: '회원가입', urlSlug: '/signup', order: 4, isButton: false },
      ],
    },
    footer: {
      enabled: true,
      companyName: '크루즈닷',
      companyInfo: '상호: 크루즈닷 | 대표: 배연성 | 주소: 경기 화성시 효행로 1068 (리더스프라자) 603-A60호 | 사업자등록번호: 714-57-00419 | 통신판매업신고번호: 제 2025-화성동부-0320 호 | 관광사업자 등록번호: 2025-000004호 | 개인정보보호 책임자: 전혜선',
      copyright: 'Copyright © 크루즈닷 All Rights Reserved.',
      menuItems: [
        { id: '1', enabled: true, text: '공지사항', urlSlug: '/support/notice', order: 1 },
        { id: '2', enabled: true, text: '이용약관', urlSlug: '/terms/0', order: 2 },
        { id: '3', enabled: true, text: '개인정보처리방침', urlSlug: '/terms/1', order: 3, isHighlight: true },
        { id: '4', enabled: true, text: '해외여행자보험', urlSlug: '/insurance', order: 4 },
      ],
      contactInfo: {
        phone: '010-3289-3800',
        email: 'hyeseon28@naver.com',
        kakaoLink: 'https://leadgeny.kr/i/yjo',
        businessHours: '오전 9시 ~ 오후 5시 (공휴일 휴무)',
      },
    },
    globalSettings: {
      banners: {
        heroBanner: '',
        promotionBanner: '',
        categoryBanner: '',
      },
      checkmarkIcon: '✓',
      buttonColors: {
        primary: '#1e40af',
        primaryText: '#ffffff',
        secondary: '#6b7280',
        secondaryText: '#ffffff',
      },
    },
    productMenuBar: {
      enabled: true,
      position: 'bottom',
      menuItems: [
        { id: '1', enabled: true, text: '홈', icon: '🏠', urlSlug: '/', order: 1 },
        { id: '2', enabled: true, text: '상품', icon: '🛳️', urlSlug: '/products', order: 2 },
        { id: '3', enabled: true, text: '커뮤니티', icon: '💬', urlSlug: '/community', order: 3 },
        { id: '4', enabled: true, text: '내 정보', icon: '👤', urlSlug: '/community/my-info', order: 4 },
      ],
    },
    landingPageMenuBar: {
      enabled: false,
      position: 'top',
      displayType: 'full',
      buttonPosition: 'right-top',
      menuItems: [
        { id: '1', enabled: true, text: '홈', urlSlug: '/', order: 1 },
        { id: '2', enabled: true, text: '상품', urlSlug: '/products', order: 2 },
        { id: '3', enabled: true, text: '커뮤니티', urlSlug: '/community', order: 3 },
      ],
    },
    promotionBanner: {
      enabled: true,
    },
    sectionOrder: [
      'top-menu',
      'hero',
      'social-buttons',
      'video-banner',
      'company-stats',
      'category-menu',
      'cruise-search',
      'review-section',
      'product-sections',
      'theme-sections',
      'youtube-shorts',
      'youtube-videos',
      'youtube-live',
      'product-list',
      'promotion-banner',
      'community-section',
      'product-menu-bar',
      'landing-page-menu-bar',
      'footer',
    ],
    sections: [],
    popup: {
      enabled: false,
      type: 'image',
      imageUrl: '',
      title: '',
      content: '',
      link: '',
      showCloseButton: true,
    },
  });
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showAddBlockMenu, setShowAddBlockMenu] = useState<number | null>(null); // 추가 버튼 메뉴 표시할 인덱스
  const previewWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.add-block-menu')) {
        setShowAddBlockMenu(null);
      }
    };

    if (showAddBlockMenu !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showAddBlockMenu]);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/mall/page-config', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.ok && data.config) {
        setConfig((prev) => mergeConfigWithDefaults(prev, data.config));
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/mall/page-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config),
      });

      const data = await response.json();
      if (data.ok) {
        showSuccess('설정이 저장되었습니다!');
      } else {
        showError(data.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      showError('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const openPreview = () => {
    const previewUrl = '/admin/mall/visual-editor/preview';
    previewWindowRef.current = window.open(previewUrl, 'preview', 'width=1200,height=800');
  };

  const updateConfig = (path: string[], value: any) => {
    setConfig((prev) => {
      const newConfig = { ...prev };
      let current: any = newConfig;
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = { ...current[path[i]] };
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newConfig;
    });
  };

  // 섹션 순서 변경 (드래그 앤 드롭)
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...(config.sectionOrder || [])];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    updateConfig(['sectionOrder'], newOrder);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };
  // 섹션 위로 이동
  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...(config.sectionOrder || [])];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    updateConfig(['sectionOrder'], newOrder);
  };

  // 섹션 아래로 이동
  const moveSectionDown = (index: number) => {
    const newOrder = [...(config.sectionOrder || [])];
    if (index >= newOrder.length - 1) return;
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    updateConfig(['sectionOrder'], newOrder);
  };
  // 섹션 삭제
  const deleteSection = (sectionKey: string, index: number) => {
    if (!confirm(`정말로 "${sectionKey}" 블록을 삭제하시겠습니까?`)) {
      return;
    }

    // sectionOrder에서 제거
    const newOrder = [...(config.sectionOrder || [])];
    newOrder.splice(index, 1);
    updateConfig(['sectionOrder'], newOrder);

    // 해당 섹션의 enabled를 false로 설정
    const sectionConfigMap: Record<string, string[]> = {
      'hero': ['hero'],
      'social-buttons': ['socialButtons', 'enabled'],
      'video-banner': ['videoBanner', 'enabled'],
      'company-stats': ['companyStats', 'enabled'],
      'social-video': ['socialButtons', 'enabled'], // social-video는 socialButtons와 videoBanner를 사용
      'cruise-search': ['cruiseSearch', 'enabled'],
      'review-section': ['reviewSection', 'enabled'],
      'community-section': ['communitySection', 'enabled'],
      'youtube-shorts': ['youtubeShorts', 'enabled'],
      'youtube-videos': ['youtubeVideos', 'enabled'],
      'youtube-live': ['youtubeLive', 'enabled'],
      'product-list': ['productList', 'enabled'],
      'category-menu': ['categoryMenu', 'enabled'],
      'top-menu': ['topMenu', 'enabled'],
      'footer': ['footer', 'enabled'],
      'product-menu-bar': ['productMenuBar', 'enabled'],
      'landing-page-menu-bar': ['landingPageMenuBar', 'enabled'],
      'promotion-banner': ['promotionBanner', 'enabled'],
      'product-sections': [], // product-sections는 enabled가 없으므로 sectionOrder에서만 제거
      'theme-sections': [],
    };

    const configPath = sectionConfigMap[sectionKey];
    if (configPath) {
      if (configPath.length === 0) {
        // product-sections는 enabled가 없으므로 sectionOrder에서만 제거
        // 이미 위에서 처리됨
      } else if (configPath.length === 1) {
        // hero는 enabled가 없으므로 sectionOrder에서만 제거
        // hero는 삭제하지 않고 유지
      } else {
        // enabled를 false로 설정
        setConfig((prev) => {
          const newConfig = { ...prev };
          let current: any = newConfig;
          for (let i = 0; i < configPath.length - 1; i++) {
            current[configPath[i]] = { ...current[configPath[i]] };
            current = current[configPath[i]];
          }
          current[configPath[configPath.length - 1]] = false;
          return newConfig;
        });
      }
    }

    showSuccess('블록이 삭제되었습니다.');
  };
  // 추가할 수 있는 블록 목록
  const availableBlocks = [
    { key: 'hero', name: '히어로 섹션', icon: '🎬' },
    { key: 'social-buttons', name: '소셜 버튼', icon: '🔗' },
    { key: 'video-banner', name: '영상 배너', icon: '📹' },
    { key: 'company-stats', name: '회사 통계', icon: '📊' },
    { key: 'social-video', name: '소셜 영상', icon: '🎥' },
    { key: 'cruise-search', name: '크루즈 검색', icon: '🔍' },
    { key: 'review-section', name: '후기 섹션', icon: '⭐' },
    { key: 'community-section', name: '커뮤니티 섹션', icon: '💬' },
    { key: 'youtube-shorts', name: 'YouTube Shorts', icon: '📱' },
    { key: 'youtube-videos', name: 'YouTube 영상', icon: '📺' },
    { key: 'youtube-live', name: 'YouTube 라이브', icon: '📡' },
    { key: 'product-list', name: '상품 목록', icon: '📦' },
    { key: 'product-sections', name: '상품 섹션들', icon: '🛍️' },
    { key: 'theme-sections', name: '테마형 상품 섹션', icon: '🧭' },
    { key: 'category-menu', name: '카테고리 메뉴', icon: '📋' },
    { key: 'top-menu', name: '상단 메뉴', icon: '☰' },
    { key: 'footer', name: '푸터', icon: '⬇️' },
    { key: 'product-menu-bar', name: '상품 메뉴 바', icon: '📑' },
    { key: 'landing-page-menu-bar', name: '랜딩 페이지 메뉴 바', icon: '🌐' },
    { key: 'promotion-banner', name: '프로모션 배너', icon: '🎁' },
  ];
  // 블록 추가 함수
  const addBlock = (blockKey: string, insertIndex: number) => {
    const newOrder = [...(config.sectionOrder || [])];

    // 해당 위치에 블록 추가 (중복 허용)
    newOrder.splice(insertIndex, 0, blockKey);
    updateConfig(['sectionOrder'], newOrder);

    // 블록이 처음 추가되는 경우 기본 설정 활성화
    const blockConfigMap: Record<string, () => void> = {
      'social-buttons': () => {
        if (!config.socialButtons?.enabled) {
          updateConfig(['socialButtons', 'enabled'], true);
        }
      },
      'video-banner': () => {
        if (!config.videoBanner?.enabled) {
          updateConfig(['videoBanner', 'enabled'], true);
        }
      },
      'company-stats': () => {
        if (!config.companyStats?.enabled) {
          updateConfig(['companyStats', 'enabled'], true);
        }
      },
      'cruise-search': () => {
        if (!config.cruiseSearch?.enabled) {
          updateConfig(['cruiseSearch', 'enabled'], true);
        }
      },
      'review-section': () => {
        if (!config.reviewSection?.enabled) {
          updateConfig(['reviewSection', 'enabled'], true);
        }
      },
      'community-section': () => {
        if (!config.communitySection?.enabled) {
          updateConfig(['communitySection', 'enabled'], true);
        }
      },
      'youtube-shorts': () => {
        if (!config.youtubeShorts?.enabled) {
          updateConfig(['youtubeShorts', 'enabled'], true);
        }
      },
      'youtube-videos': () => {
        if (!config.youtubeVideos?.enabled) {
          updateConfig(['youtubeVideos', 'enabled'], true);
        }
      },
      'youtube-live': () => {
        if (!config.youtubeLive?.enabled) {
          updateConfig(['youtubeLive', 'enabled'], true);
        }
      },
      'product-list': () => {
        if (!config.productList?.enabled) {
          updateConfig(['productList', 'enabled'], true);
        }
      },
      'category-menu': () => {
        if (!config.categoryMenu?.enabled) {
          updateConfig(['categoryMenu', 'enabled'], true);
        }
      },
      'top-menu': () => {
        if (!config.topMenu?.enabled) {
          updateConfig(['topMenu', 'enabled'], true);
        }
      },
      'footer': () => {
        if (!config.footer?.enabled) {
          updateConfig(['footer', 'enabled'], true);
        }
      },
      'product-menu-bar': () => {
        if (!config.productMenuBar?.enabled) {
          updateConfig(['productMenuBar', 'enabled'], true);
        }
      },
      'landing-page-menu-bar': () => {
        if (!config.landingPageMenuBar?.enabled) {
          updateConfig(['landingPageMenuBar', 'enabled'], true);
        }
      },
      'promotion-banner': () => {
        if (!config.promotionBanner?.enabled) {
          updateConfig(['promotionBanner', 'enabled'], true);
        }
      },
      'theme-sections': () => {
        if (!Array.isArray(config.themeSections)) {
          updateConfig(['themeSections'], []);
        }
      },
    };

    const initConfig = blockConfigMap[blockKey];
    if (initConfig) {
      initConfig();
    }
    showSuccess('블록이 추가되었습니다.');
    setShowAddBlockMenu(null);
  };
  // 섹션 렌더링 함수
  const renderSection = (sectionKey: string, index: number) => {
    const isDragging = draggedIndex === index;
    
    switch (sectionKey) {
      case 'hero':
        return (
          <div
            key={sectionKey}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative border-2 border-dashed rounded-lg p-2 transition-all ${
              isDragging ? 'border-blue-500 opacity-50' : 'border-gray-300 hover:border-blue-500'
            } cursor-move`}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('.no-click')) return;
              setEditingSection('hero');
            }}
          >
            <div className="absolute top-2 left-2 flex gap-1 z-20 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionUp(index);
                }}
                disabled={index === 0}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="위로 이동"
              >
                <FiChevronUp size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionDown(index);
                }}
                disabled={index >= (config.sectionOrder?.length || 0) - 1}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="아래로 이동"
              >
                <FiChevronDown size={16} />
              </button>
            </div>
            <div className="absolute top-2 left-16 flex items-center gap-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow no-click">
              <FiMove size={14} />
              드래그하여 이동
            </div>
            <div className="relative text-white py-16 md:py-24 overflow-hidden rounded-lg bg-gray-900">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover z-0 opacity-50"
              >
                <source src={config.hero.videoUrl} type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-black/50 z-10"></div>
              <div className="relative z-20 container mx-auto px-4">
                <div className="max-w-3xl mx-auto text-center">
                  {config.hero.logoUrl && (
                    <div className="mb-6">
                      <img 
                        src={config.hero.logoUrl} 
                        alt="로고" 
                        className="mx-auto h-16 md:h-20"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/ai-cruise-logo.png';
                        }}
                      />
                    </div>
                  )}
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6">
                    {config.hero.title}
                  </h1>
                  <p className="text-2xl md:text-3xl lg:text-4xl mb-10 whitespace-pre-line">
                    {config.hero.subtitle}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {config.hero.buttons.map((btn, idx) => {
                      const buttonStyle: React.CSSProperties = {};
                      let buttonClass = "px-10 py-4 text-lg font-black rounded-xl";
                      
                      // 배경색 처리
                      if (btn.backgroundColor) {
                        if (btn.backgroundColor.startsWith('#')) {
                          buttonStyle.backgroundColor = btn.backgroundColor;
                        } else {
                          // Tailwind 클래스는 동적 생성이 어려우므로 기본 스타일 사용
                          buttonStyle.backgroundColor = '#ffffff';
                        }
                      } else {
                        buttonStyle.backgroundColor = '#ffffff';
                      }
                      
                      // 글씨색 처리
                      if (btn.textColor) {
                        if (btn.textColor.startsWith('#')) {
                          buttonStyle.color = btn.textColor;
                        } else {
                          // Tailwind 클래스는 동적 생성이 어려우므로 기본 스타일 사용
                          buttonStyle.color = '#1e40af';
                        }
                      } else {
                        buttonStyle.color = '#1e40af';
                      }
                      
                      return (
                        <a
                          key={idx}
                          href={btn.link}
                          className={buttonClass}
                          style={buttonStyle}
                        >
                          {btn.text}
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute top-4 right-4 flex gap-2 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const sectionMap: Record<string, string> = {
                    'hero': 'hero',
                    'social-buttons': 'social-buttons',
                    'video-banner': 'video-banner',
                    'company-stats': 'company-stats',
                    'social-video': 'social-video',
                    'cruise-search': 'cruise-search',
                    'review-section': 'review-section',
                    'community-section': 'community-section',
                    'youtube-shorts': 'youtube-shorts',
                    'youtube-videos': 'youtube-videos',
                    'youtube-live': 'youtube-live',
                    'product-list': 'product-list',
                    'category-menu': 'category-menu',
                    'top-menu': 'top-menu',
                    'footer': 'footer',
                    'product-menu-bar': 'product-menu-bar',
                    'landing-page-menu-bar': 'landing-page-menu-bar',
                    'promotion-banner': 'promotion-banner',
                  };
                  setEditingSection(sectionMap[sectionKey] || sectionKey);
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <FiEdit2 size={14} />
                편집
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSection(sectionKey, index);
                }}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-red-700 transition-colors"
              >
                <FiTrash2 size={14} />
                삭제
              </button>
            </div>
          </div>
        );
      case 'social-buttons':
        if (!config.socialButtons?.enabled) return null;
        const buttonSizeClasses = {
          large: 'px-8 py-4 text-lg',
          medium: 'px-6 py-3 text-base',
          small: 'px-4 py-2 text-sm',
        };
        return (
          <div
            key={sectionKey}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative border-2 border-dashed rounded-lg p-2 transition-all ${
              isDragging ? 'border-blue-500 opacity-50' : 'border-gray-300 hover:border-blue-500'
            } cursor-move`}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('.no-click')) return;
              setEditingSection('social-buttons');
            }}
          >
            <div className="absolute top-2 left-2 flex gap-1 z-20 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionUp(index);
                }}
                disabled={index === 0}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="위로 이동"
              >
                <FiChevronUp size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionDown(index);
                }}
                disabled={index >= (config.sectionOrder?.length || 0) - 1}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="아래로 이동"
              >
                <FiChevronDown size={16} />
              </button>
            </div>
            <div className="absolute top-2 left-16 flex items-center gap-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow no-click">
              <FiMove size={14} />
              드래그하여 이동
            </div>
            <div className="bg-white rounded-lg p-6">
              <div className={`flex gap-4 justify-center flex-wrap ${config.socialButtons.layout === 'vertical' ? 'flex-col items-center' : 'flex-row'}`}>
                {config.socialButtons.buttons.filter(btn => btn.enabled).slice(0, 3).map((btn, idx) => {
                  // 색상 처리
                  let buttonStyle: React.CSSProperties = {};
                  let buttonClass = buttonSizeClasses[btn.size] + ' rounded-lg font-semibold transition-colors';
                  
                  // 배경색 처리
                  if (btn.backgroundColor) {
                    if (btn.backgroundColor.startsWith('#')) {
                      buttonStyle.backgroundColor = btn.backgroundColor;
                    } else if (btn.type === 'kakao') {
                      buttonStyle.backgroundColor = '#FEE500';
                    } else if (btn.type === 'youtube') {
                      buttonStyle.backgroundColor = '#FF0000';
                    } else {
                      buttonStyle.backgroundColor = '#3b82f6';
                    }
                  } else {
                    // 기본 색상
                    if (btn.type === 'kakao') {
                      buttonStyle.backgroundColor = '#FEE500';
                    } else if (btn.type === 'youtube') {
                      buttonStyle.backgroundColor = '#FF0000';
                    } else {
                      buttonStyle.backgroundColor = '#3b82f6';
                    }
                  }
                  
                  // 글씨색 처리
                  if (btn.textColor) {
                    if (btn.textColor.startsWith('#')) {
                      buttonStyle.color = btn.textColor;
                    } else if (btn.type === 'kakao') {
                      buttonStyle.color = '#000000';
                    } else if (btn.type === 'youtube') {
                      buttonStyle.color = '#FFFFFF';
                    } else {
                      buttonStyle.color = '#FFFFFF';
                    }
                  } else {
                    // 기본 글씨색
                    if (btn.type === 'kakao') {
                      buttonStyle.color = '#000000';
                    } else {
                      buttonStyle.color = '#FFFFFF';
                    }
                  }
                  
                  const icon = btn.type === 'kakao' ? '💬' : btn.type === 'youtube' ? '📺' : (btn.icon || '🔗');
                  
                  return (
                    <a
                      key={idx}
                      href={btn.link || '#'}
                      target={btn.type === 'youtube' ? '_blank' : undefined}
                      rel={btn.type === 'youtube' ? 'noopener noreferrer' : undefined}
                      className={buttonClass}
                      style={buttonStyle}
                    >
                      {icon} {btn.text || '버튼'}
                    </a>
                  );
                })}
              </div>
              {config.socialButtons.buttons.filter(btn => btn.enabled).length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p>활성화된 버튼이 없습니다.</p>
                </div>
              )}
            </div>
            <div className="absolute top-4 right-4 flex gap-2 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const sectionMap: Record<string, string> = {
                    'hero': 'hero',
                    'social-buttons': 'social-buttons',
                    'video-banner': 'video-banner',
                    'company-stats': 'company-stats',
                    'social-video': 'social-video',
                    'cruise-search': 'cruise-search',
                    'review-section': 'review-section',
                    'community-section': 'community-section',
                    'youtube-shorts': 'youtube-shorts',
                    'youtube-videos': 'youtube-videos',
                    'youtube-live': 'youtube-live',
                    'product-list': 'product-list',
                    'category-menu': 'category-menu',
                    'top-menu': 'top-menu',
                    'footer': 'footer',
                    'product-menu-bar': 'product-menu-bar',
                    'landing-page-menu-bar': 'landing-page-menu-bar',
                    'promotion-banner': 'promotion-banner',
                  };
                  setEditingSection(sectionMap[sectionKey] || sectionKey);
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <FiEdit2 size={14} />
                편집
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSection(sectionKey, index);
                }}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-red-700 transition-colors"
              >
                <FiTrash2 size={14} />
                삭제
              </button>
            </div>
          </div>
        );
      case 'video-banner':
        if (!config.videoBanner?.enabled) return null;
        return (
          <div
            key={sectionKey}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative border-2 border-dashed rounded-lg p-2 transition-all ${
              isDragging ? 'border-blue-500 opacity-50' : 'border-gray-300 hover:border-blue-500'
            } cursor-move`}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('.no-click')) return;
              setEditingSection('video-banner');
            }}
          >
            <div className="absolute top-2 left-2 flex gap-1 z-20 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionUp(index);
                }}
                disabled={index === 0}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="위로 이동"
              >
                <FiChevronUp size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionDown(index);
                }}
                disabled={index >= (config.sectionOrder?.length || 0) - 1}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="아래로 이동"
              >
                <FiChevronDown size={16} />
              </button>
            </div>
            <div className="absolute top-2 left-16 flex items-center gap-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow no-click">
              <FiMove size={14} />
              드래그하여 이동
            </div>
            <div className="relative rounded-xl overflow-hidden">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-64 object-cover"
              >
                <source src={config.videoBanner.videoUrl} type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="text-center text-white">
                  <h3 className="text-2xl font-bold mb-2">{config.videoBanner.title}</h3>
                  {config.videoBanner.link && (
                    <a
                      href={config.videoBanner.link}
                      className="px-6 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100"
                    >
                      자세히 보기
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="absolute top-4 right-4 flex gap-2 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const sectionMap: Record<string, string> = {
                    'hero': 'hero',
                    'social-buttons': 'social-buttons',
                    'video-banner': 'video-banner',
                    'company-stats': 'company-stats',
                    'social-video': 'social-video',
                    'cruise-search': 'cruise-search',
                    'review-section': 'review-section',
                    'community-section': 'community-section',
                    'youtube-shorts': 'youtube-shorts',
                    'youtube-videos': 'youtube-videos',
                    'youtube-live': 'youtube-live',
                    'product-list': 'product-list',
                    'category-menu': 'category-menu',
                    'top-menu': 'top-menu',
                    'footer': 'footer',
                    'product-menu-bar': 'product-menu-bar',
                    'landing-page-menu-bar': 'landing-page-menu-bar',
                    'promotion-banner': 'promotion-banner',
                  };
                  setEditingSection(sectionMap[sectionKey] || sectionKey);
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <FiEdit2 size={14} />
                편집
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSection(sectionKey, index);
                }}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-red-700 transition-colors"
              >
                <FiTrash2 size={14} />
                삭제
              </button>
            </div>
          </div>
        );
      case 'company-stats':
        if (!config.companyStats?.enabled) return null;
        return (
          <div
            key={sectionKey}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative border-2 border-dashed rounded-lg p-2 transition-all ${
              isDragging ? 'border-blue-500 opacity-50' : 'border-gray-300 hover:border-blue-500'
            } cursor-move`}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('.no-click')) return;
              setEditingSection('company-stats');
            }}
          >
            <div className="absolute top-2 left-2 flex gap-1 z-20 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionUp(index);
                }}
                disabled={index === 0}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="위로 이동"
              >
                <FiChevronUp size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionDown(index);
                }}
                disabled={index >= (config.sectionOrder?.length || 0) - 1}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="아래로 이동"
              >
                <FiChevronDown size={16} />
              </button>
            </div>
            <div className="absolute top-2 left-16 flex items-center gap-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow no-click">
              <FiMove size={14} />
              드래그하여 이동
            </div>
            <div className="bg-white rounded-lg p-6">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-black text-gray-900 mb-4">{config.companyStats.title}</h2>
                <p className="text-xl text-gray-700 font-bold mb-6">{config.companyStats.subtitle}</p>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-2xl">크루즈닷에서 크루즈 만족도</span>
                  <span className="text-5xl font-black text-red-600">{config.companyStats.satisfactionScore}점</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {config.companyStats.topRowCards.map((card, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-100 text-center">
                    <div className="text-5xl mb-4">{card.icon}</div>
                    <div className="text-3xl font-black text-blue-700 mb-2">{card.value}</div>
                    <div className="text-base font-bold text-gray-800">{card.description}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {config.companyStats.bottomRowCards.map((card, idx) => {
                  const bgColors = {
                    blue: 'from-blue-50 to-blue-100 border-blue-200',
                    yellow: 'from-yellow-50 to-yellow-100 border-yellow-200',
                    green: 'from-green-50 to-green-100 border-green-200',
                  };
                  return (
                    <div key={idx} className={`bg-gradient-to-br ${bgColors[card.bgColor]} rounded-xl p-6 text-center shadow-lg border-2`}>
                      <div className="text-4xl mb-4">{card.icon}</div>
                      <div className="text-3xl font-black text-gray-900 mb-2">{card.value}</div>
                      <div className="text-base font-bold text-gray-700">{card.description}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="absolute top-4 right-4 flex gap-2 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const sectionMap: Record<string, string> = {
                    'hero': 'hero',
                    'social-buttons': 'social-buttons',
                    'video-banner': 'video-banner',
                    'company-stats': 'company-stats',
                    'social-video': 'social-video',
                    'cruise-search': 'cruise-search',
                    'review-section': 'review-section',
                    'community-section': 'community-section',
                    'youtube-shorts': 'youtube-shorts',
                    'youtube-videos': 'youtube-videos',
                    'youtube-live': 'youtube-live',
                    'product-list': 'product-list',
                    'category-menu': 'category-menu',
                    'top-menu': 'top-menu',
                    'footer': 'footer',
                    'product-menu-bar': 'product-menu-bar',
                    'landing-page-menu-bar': 'landing-page-menu-bar',
                    'promotion-banner': 'promotion-banner',
                  };
                  setEditingSection(sectionMap[sectionKey] || sectionKey);
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <FiEdit2 size={14} />
                편집
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSection(sectionKey, index);
                }}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-red-700 transition-colors"
              >
                <FiTrash2 size={14} />
                삭제
              </button>
            </div>
          </div>
        );
      case 'social-video':
        return (
          <div
            key={sectionKey}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative border-2 border-dashed rounded-lg p-2 transition-all ${
              isDragging ? 'border-blue-500 opacity-50' : 'border-gray-300 hover:border-blue-500'
            } cursor-move`}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('.no-click')) return;
              setEditingSection('social-video');
            }}
          >
            <div className="absolute top-2 left-2 flex gap-1 z-20 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionUp(index);
                }}
                disabled={index === 0}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="위로 이동"
              >
                <FiChevronUp size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionDown(index);
                }}
                disabled={index >= (config.sectionOrder?.length || 0) - 1}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="아래로 이동"
              >
                <FiChevronDown size={16} />
              </button>
            </div>
            <div className="absolute top-2 left-16 flex items-center gap-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow no-click">
              <FiMove size={14} />
              드래그하여 이동
            </div>
            <div className="bg-white rounded-lg p-6">
              <div className="flex gap-4 mb-6 justify-center">
                {config.socialButtons.buttons.find(btn => btn.type === 'kakao' && btn.enabled) && (
                  <a
                    href={config.socialButtons.buttons.find(btn => btn.type === 'kakao')?.link || '#'}
                    className="px-6 py-3 bg-yellow-400 text-black rounded-lg font-semibold hover:bg-yellow-500"
                  >
                    💬 {config.socialButtons.buttons.find(btn => btn.type === 'kakao')?.text || '카카오톡 상담'}
                  </a>
                )}
                {config.socialButtons.buttons.find(btn => btn.type === 'youtube' && btn.enabled) && (
                  <a
                    href={config.socialButtons.buttons.find(btn => btn.type === 'youtube')?.link || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                  >
                    📺 {config.socialButtons.buttons.find(btn => btn.type === 'youtube')?.text || '유튜브 구독하기'}
                  </a>
                )}
              </div>
              {config.videoBanner.enabled && (
                <div className="relative rounded-xl overflow-hidden">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-64 object-cover"
                  >
                    <source src={config.videoBanner.videoUrl} type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="text-center text-white">
                      <h3 className="text-2xl font-bold mb-2">{config.videoBanner.title}</h3>
                      {config.videoBanner.link && (
                        <a
                          href={config.videoBanner.link}
                          className="px-6 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100"
                        >
                          자세히 보기
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="absolute top-4 right-4 flex gap-2 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const sectionMap: Record<string, string> = {
                    'hero': 'hero',
                    'social-buttons': 'social-buttons',
                    'video-banner': 'video-banner',
                    'company-stats': 'company-stats',
                    'social-video': 'social-video',
                    'cruise-search': 'cruise-search',
                    'review-section': 'review-section',
                    'community-section': 'community-section',
                    'youtube-shorts': 'youtube-shorts',
                    'youtube-videos': 'youtube-videos',
                    'youtube-live': 'youtube-live',
                    'product-list': 'product-list',
                    'category-menu': 'category-menu',
                    'top-menu': 'top-menu',
                    'footer': 'footer',
                    'product-menu-bar': 'product-menu-bar',
                    'landing-page-menu-bar': 'landing-page-menu-bar',
                    'promotion-banner': 'promotion-banner',
                  };
                  setEditingSection(sectionMap[sectionKey] || sectionKey);
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <FiEdit2 size={14} />
                편집
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSection(sectionKey, index);
                }}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-red-700 transition-colors"
              >
                <FiTrash2 size={14} />
                삭제
              </button>
            </div>
          </div>
        );
      case 'cruise-search':
        if (!config.cruiseSearch?.enabled) return null;
        return (
          <div
            key={sectionKey}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative border-2 border-dashed rounded-lg p-2 transition-all ${
              isDragging ? 'border-blue-500 opacity-50' : 'border-gray-300 hover:border-blue-500'
            } cursor-move`}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('.no-click')) return;
              setEditingSection('cruise-search');
            }}
          >
            <div className="absolute top-2 left-2 flex gap-1 z-20 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionUp(index);
                }}
                disabled={index === 0}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="위로 이동"
              >
                <FiChevronUp size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionDown(index);
                }}
                disabled={index >= (config.sectionOrder?.length || 0) - 1}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="아래로 이동"
              >
                <FiChevronDown size={16} />
              </button>
            </div>
            <div className="absolute top-2 left-16 flex items-center gap-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow no-click">
              <FiMove size={14} />
              드래그하여 이동
            </div>
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">{config.cruiseSearch.title}</h3>
              <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-600">
                크루즈 검색 블록 영역
              </div>
            </div>
            <div className="absolute top-4 right-4 flex gap-2 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const sectionMap: Record<string, string> = {
                    'hero': 'hero',
                    'social-buttons': 'social-buttons',
                    'video-banner': 'video-banner',
                    'company-stats': 'company-stats',
                    'social-video': 'social-video',
                    'cruise-search': 'cruise-search',
                    'review-section': 'review-section',
                    'community-section': 'community-section',
                    'youtube-shorts': 'youtube-shorts',
                    'youtube-videos': 'youtube-videos',
                    'youtube-live': 'youtube-live',
                    'product-list': 'product-list',
                    'category-menu': 'category-menu',
                    'top-menu': 'top-menu',
                    'footer': 'footer',
                    'product-menu-bar': 'product-menu-bar',
                    'landing-page-menu-bar': 'landing-page-menu-bar',
                    'promotion-banner': 'promotion-banner',
                  };
                  setEditingSection(sectionMap[sectionKey] || sectionKey);
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <FiEdit2 size={14} />
                편집
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSection(sectionKey, index);
                }}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-red-700 transition-colors"
              >
                <FiTrash2 size={14} />
                삭제
              </button>
            </div>
          </div>
        );
      case 'review-section':
        if (!config.reviewSection?.enabled) return null;
        return (
          <div
            key={sectionKey}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative border-2 border-dashed rounded-lg p-2 transition-all ${
              isDragging ? 'border-blue-500 opacity-50' : 'border-gray-300 hover:border-blue-500'
            } cursor-move`}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('.no-click')) return;
              setEditingSection('review-section');
            }}
          >
            <div className="absolute top-2 left-2 flex gap-1 z-20 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionUp(index);
                }}
                disabled={index === 0}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="위로 이동"
              >
                <FiChevronUp size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionDown(index);
                }}
                disabled={index >= (config.sectionOrder?.length || 0) - 1}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="아래로 이동"
              >
                <FiChevronDown size={16} />
              </button>
            </div>
            <div className="absolute top-2 left-16 flex items-center gap-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow no-click">
              <FiMove size={14} />
              드래그하여 이동
            </div>
            <div className="bg-white rounded-lg p-6">
              <div className="text-center mb-4">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">{config.reviewSection.title}</h2>
                <p className="text-gray-600 mb-4">{config.reviewSection.description}</p>
                <a href={config.reviewSection.linkUrl} className="text-blue-600 hover:text-blue-700 font-semibold">
                  {config.reviewSection.linkText}
                </a>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-600">
                후기 슬라이더 영역
              </div>
            </div>
            <div className="absolute top-4 right-4 flex gap-2 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const sectionMap: Record<string, string> = {
                    'hero': 'hero',
                    'social-buttons': 'social-buttons',
                    'video-banner': 'video-banner',
                    'company-stats': 'company-stats',
                    'social-video': 'social-video',
                    'cruise-search': 'cruise-search',
                    'review-section': 'review-section',
                    'community-section': 'community-section',
                    'youtube-shorts': 'youtube-shorts',
                    'youtube-videos': 'youtube-videos',
                    'youtube-live': 'youtube-live',
                    'product-list': 'product-list',
                    'category-menu': 'category-menu',
                    'top-menu': 'top-menu',
                    'footer': 'footer',
                    'product-menu-bar': 'product-menu-bar',
                    'landing-page-menu-bar': 'landing-page-menu-bar',
                    'promotion-banner': 'promotion-banner',
                  };
                  setEditingSection(sectionMap[sectionKey] || sectionKey);
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <FiEdit2 size={14} />
                편집
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSection(sectionKey, index);
                }}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-red-700 transition-colors"
              >
                <FiTrash2 size={14} />
                삭제
              </button>
            </div>
          </div>
        );
      case 'community-section': {
        const communityConfig = config.communitySection ?? {
          enabled: true,
          title: '💬 우리끼리 크루즈닷 커뮤니티',
          description: '크루즈 여행자들과 정보를 공유하고 소통해보세요',
          linkText: '커뮤니티 전체 보기',
          linkUrl: '/community',
        };

        if (!communityConfig.enabled) return null;
        return (
          <div
            key={sectionKey}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative border-2 border-dashed rounded-lg p-2 transition-all ${
              isDragging ? 'border-blue-500 opacity-50' : 'border-gray-300 hover:border-blue-500'
            } cursor-move`}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('.no-click')) return;
              setEditingSection('community-section');
            }}
          >
            <div className="absolute top-2 left-2 flex gap-1 z-20 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionUp(index);
                }}
                disabled={index === 0}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="위로 이동"
              >
                <FiChevronUp size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionDown(index);
                }}
                disabled={index >= (config.sectionOrder?.length || 0) - 1}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="아래로 이동"
              >
                <FiChevronDown size={16} />
              </button>
            </div>
            <div className="absolute top-2 left-16 flex items-center gap-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow no-click">
              <FiMove size={14} />
              드래그하여 이동
            </div>
            <div className="bg-white rounded-lg p-6">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">{communityConfig.title}</h2>
                <p className="text-gray-600 text-lg">{communityConfig.description}</p>
                <a
                  href={communityConfig.linkUrl}
                  className="inline-flex items-center gap-2 mt-4 px-5 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg shadow hover:from-red-700 hover:to-red-800"
                >
                  <span>{communityConfig.linkText}</span>
                  <span>→</span>
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-100 rounded-lg p-4 text-gray-600 text-center">최근 게시글 프리뷰</div>
                <div className="bg-gray-100 rounded-lg p-4 text-gray-600 text-center">인기 게시글 프리뷰</div>
              </div>
            </div>
            <div className="absolute top-4 right-4 flex gap-2 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const sectionMap: Record<string, string> = {
                    'hero': 'hero',
                    'social-buttons': 'social-buttons',
                    'video-banner': 'video-banner',
                    'company-stats': 'company-stats',
                    'social-video': 'social-video',
                    'cruise-search': 'cruise-search',
                    'review-section': 'review-section',
                    'community-section': 'community-section',
                    'youtube-shorts': 'youtube-shorts',
                    'youtube-videos': 'youtube-videos',
                    'youtube-live': 'youtube-live',
                    'product-list': 'product-list',
                    'category-menu': 'category-menu',
                    'top-menu': 'top-menu',
                    'footer': 'footer',
                    'product-menu-bar': 'product-menu-bar',
                    'landing-page-menu-bar': 'landing-page-menu-bar',
                    'promotion-banner': 'promotion-banner',
                  };
                  setEditingSection(sectionMap[sectionKey] || sectionKey);
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <FiEdit2 size={14} />
                편집
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSection(sectionKey, index);
                }}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-red-700 transition-colors"
              >
                <FiTrash2 size={14} />
                삭제
              </button>
            </div>
          </div>
        );
      }
      case 'youtube-live':
        if (!config.youtubeLive?.enabled) return null;
        return (
          <div
            key={sectionKey}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative border-2 border-dashed rounded-lg p-2 transition-all ${
              isDragging ? 'border-blue-500 opacity-50' : 'border-gray-300 hover:border-blue-500'
            } cursor-move`}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('.no-click')) return;
              setEditingSection('youtube-live');
            }}
          >
            <div className="absolute top-2 left-2 flex gap-1 z-20 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionUp(index);
                }}
                disabled={index === 0}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="위로 이동"
              >
                <FiChevronUp size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionDown(index);
                }}
                disabled={index >= (config.sectionOrder?.length || 0) - 1}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="아래로 이동"
              >
                <FiChevronDown size={16} />
              </button>
            </div>
            <div className="absolute top-2 left-16 flex items-center gap-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow no-click">
              <FiMove size={14} />
              드래그하여 이동
            </div>
            <div className="bg-white rounded-lg p-6">
              <div className="text-center mb-4">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">{config.youtubeLive.title}</h2>
                <p className="text-gray-600">{config.youtubeLive.description}</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-600">
                YouTube Live 영역
              </div>
            </div>
            <div className="absolute top-4 right-4 flex gap-2 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const sectionMap: Record<string, string> = {
                    'hero': 'hero',
                    'social-buttons': 'social-buttons',
                    'video-banner': 'video-banner',
                    'company-stats': 'company-stats',
                    'social-video': 'social-video',
                    'cruise-search': 'cruise-search',
                    'review-section': 'review-section',
                    'community-section': 'community-section',
                    'youtube-shorts': 'youtube-shorts',
                    'youtube-videos': 'youtube-videos',
                    'youtube-live': 'youtube-live',
                    'product-list': 'product-list',
                    'category-menu': 'category-menu',
                    'top-menu': 'top-menu',
                    'footer': 'footer',
                    'product-menu-bar': 'product-menu-bar',
                    'landing-page-menu-bar': 'landing-page-menu-bar',
                    'promotion-banner': 'promotion-banner',
                  };
                  setEditingSection(sectionMap[sectionKey] || sectionKey);
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <FiEdit2 size={14} />
                편집
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSection(sectionKey, index);
                }}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-red-700 transition-colors"
              >
                <FiTrash2 size={14} />
                삭제
              </button>
            </div>
          </div>
        );
      
      case 'product-list':
        if (!config.productList?.enabled) return null;
        return (
          <div
            key={sectionKey}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative border-2 border-dashed rounded-lg p-2 transition-all ${
              isDragging ? 'border-blue-500 opacity-50' : 'border-gray-300 hover:border-blue-500'
            } cursor-move`}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('.no-click')) return;
              setEditingSection('product-list');
            }}
          >
            <div className="absolute top-2 left-2 flex gap-1 z-20 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionUp(index);
                }}
                disabled={index === 0}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="위로 이동"
              >
                <FiChevronUp size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionDown(index);
                }}
                disabled={index >= (config.sectionOrder?.length || 0) - 1}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="아래로 이동"
              >
                <FiChevronDown size={16} />
              </button>
            </div>
            <div className="absolute top-2 left-16 flex items-center gap-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow no-click">
              <FiMove size={14} />
              드래그하여 이동
            </div>
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">상품 목록</h2>
              <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-600">
                상품 목록 영역 (ProductList 컴포넌트)
              </div>
            </div>
            <div className="absolute top-4 right-4 flex gap-2 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const sectionMap: Record<string, string> = {
                    'hero': 'hero',
                    'social-buttons': 'social-buttons',
                    'video-banner': 'video-banner',
                    'company-stats': 'company-stats',
                    'social-video': 'social-video',
                    'cruise-search': 'cruise-search',
                    'review-section': 'review-section',
                    'community-section': 'community-section',
                    'youtube-shorts': 'youtube-shorts',
                    'youtube-videos': 'youtube-videos',
                    'youtube-live': 'youtube-live',
                    'product-list': 'product-list',
                    'category-menu': 'category-menu',
                    'top-menu': 'top-menu',
                    'footer': 'footer',
                    'product-menu-bar': 'product-menu-bar',
                    'landing-page-menu-bar': 'landing-page-menu-bar',
                    'promotion-banner': 'promotion-banner',
                  };
                  setEditingSection(sectionMap[sectionKey] || sectionKey);
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <FiEdit2 size={14} />
                편집
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSection(sectionKey, index);
                }}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-red-700 transition-colors"
              >
                <FiTrash2 size={14} />
                삭제
              </button>
            </div>
          </div>
        );
      case 'category-menu':
        if (!config.categoryMenu?.enabled) return null;
        return (
          <div
            key={sectionKey}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative border-2 border-dashed rounded-lg p-2 transition-all ${
              isDragging ? 'border-blue-500 opacity-50' : 'border-gray-300 hover:border-blue-500'
            } cursor-move`}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('.no-click')) return;
              setEditingSection('category-menu');
            }}
          >
            <div className="absolute top-2 left-2 flex gap-1 z-20 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionUp(index);
                }}
                disabled={index === 0}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="위로 이동"
              >
                <FiChevronUp size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionDown(index);
                }}
                disabled={index >= (config.sectionOrder?.length || 0) - 1}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="아래로 이동"
              >
                <FiChevronDown size={16} />
              </button>
            </div>
            <div className="absolute top-2 left-16 flex items-center gap-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow no-click">
              <FiMove size={14} />
              드래그하여 이동
            </div>
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">카테고리 메뉴</h2>
              <div className="grid grid-cols-6 gap-4">
                {config.categoryMenu?.categories
                  ?.filter(c => c.enabled)
                  .sort((a, b) => a.order - b.order)
                  .slice(0, 12) // 최대 12개만 표시
                  .map((category) => (
                    <a
                      key={category.id}
                      href={category.urlSlug || '#'}
                      className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
                    >
                      <div className="text-3xl mb-2">
                        {category.icon && (category.icon.startsWith('http') || category.icon.startsWith('/')) ? (
                          <img src={category.icon} alt={category.text || '카테고리'} className="w-8 h-8 mx-auto object-contain" />
                        ) : (
                          <span>{category.icon || '🔗'}</span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-gray-800">{category.text || '카테고리'}</div>
                    </a>
                  ))}
              </div>
              {(!config.categoryMenu?.categories || config.categoryMenu.categories.filter(c => c.enabled).length === 0) && (
                <div className="text-center py-8 text-gray-400">
                  <p>활성화된 카테고리가 없습니다.</p>
                </div>
              )}
            </div>
            <div className="absolute top-4 right-4 flex gap-2 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const sectionMap: Record<string, string> = {
                    'hero': 'hero',
                    'social-buttons': 'social-buttons',
                    'video-banner': 'video-banner',
                    'company-stats': 'company-stats',
                    'social-video': 'social-video',
                    'cruise-search': 'cruise-search',
                    'review-section': 'review-section',
                    'community-section': 'community-section',
                    'youtube-shorts': 'youtube-shorts',
                    'youtube-videos': 'youtube-videos',
                    'youtube-live': 'youtube-live',
                    'product-list': 'product-list',
                    'category-menu': 'category-menu',
                    'top-menu': 'top-menu',
                    'footer': 'footer',
                    'product-menu-bar': 'product-menu-bar',
                    'landing-page-menu-bar': 'landing-page-menu-bar',
                    'promotion-banner': 'promotion-banner',
                  };
                  setEditingSection(sectionMap[sectionKey] || sectionKey);
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <FiEdit2 size={14} />
                편집
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSection(sectionKey, index);
                }}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-red-700 transition-colors"
              >
                <FiTrash2 size={14} />
                삭제
              </button>
            </div>
          </div>
        );
      
      case 'product-sections':
        if (!config.productSections || config.productSections.length === 0) return null;
        return (
          <div key={sectionKey} className="space-y-8">
            {config.productSections
              .filter(s => s.enabled)
              .map((section) => (
                <div
                  key={section.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`relative border-2 border-dashed rounded-lg p-2 transition-all ${
                    isDragging ? 'border-blue-500 opacity-50' : 'border-gray-300 hover:border-blue-500'
                  } cursor-move`}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('.no-click')) return;
                    setEditingSection('product-sections');
                  }}
                >
                  <div className="bg-white rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">{section.title}</h2>
                    <div className="grid grid-cols-3 gap-4">
                      {section.products.slice(0, 6).map((product) => (
                        <div key={product.productCode} className="bg-gray-100 rounded-lg p-4">
                          <div className="aspect-square bg-gray-200 rounded mb-2"></div>
                          <div className="text-sm font-semibold">{product.productCode}</div>
                          {product.productName && (
                            <div className="text-xs text-gray-600 truncate">{product.productName}</div>
                          )}
                        </div>
                      ))}
                    </div>
                    {section.products.length > 6 && (
                      <div className="mt-4 text-center text-gray-500 text-sm">
                        외 {section.products.length - 6}개 상품 더...
                      </div>
                    )}
                    {section.linkUrl && (
                      <div className="mt-4 text-center">
                        <a href={section.linkUrl} className="text-blue-600 hover:text-blue-700 font-semibold">
                          {section.linkText || '더보기'} →
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="absolute top-4 right-4 flex gap-2 no-click">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSection('product-sections');
                      }}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
                    >
                      <FiEdit2 size={14} />
                      편집
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSection('product-sections', index);
                      }}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-red-700 transition-colors"
                    >
                      <FiTrash2 size={14} />
                      삭제
                    </button>
                  </div>
                </div>
              ))}
          </div>
        );
      case 'global-settings':
        // 전역 설정은 미리보기에서 직접 표시되지 않고, 다른 섹션에 적용됩니다
        return null;
      case 'product-menu-bar':
        if (!config.productMenuBar?.enabled) return null;
        return (
          <div
            key={sectionKey}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative border-2 border-dashed rounded-lg p-2 transition-all ${
              isDragging ? 'border-blue-500 opacity-50' : 'border-gray-300 hover:border-blue-500'
            } cursor-move`}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('.no-click')) return;
              setEditingSection('product-menu-bar');
            }}
          >
            <div className="absolute top-2 left-2 flex gap-1 z-20 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionUp(index);
                }}
                disabled={index === 0}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="위로 이동"
              >
                <FiChevronUp size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionDown(index);
                }}
                disabled={index >= (config.sectionOrder?.length || 0) - 1}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="아래로 이동"
              >
                <FiChevronDown size={16} />
              </button>
            </div>
            <div className="absolute top-2 left-16 flex items-center gap-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow no-click">
              <FiMove size={14} />
              드래그하여 이동
            </div>
            <div className={`bg-white rounded-lg p-4 border-t-2 ${config.productMenuBar.position === 'bottom' ? 'border-t-gray-300' : 'border-b-gray-300'}`}>
              <div className={`flex ${config.productMenuBar.position === 'bottom' ? 'justify-around' : 'justify-center gap-4'} items-center`}>
                {config.productMenuBar.menuItems
                  ?.filter(m => m.enabled)
                  .sort((a, b) => a.order - b.order)
                  .map((item) => (
                    <a
                      key={item.id}
                      href={item.urlSlug}
                      className="flex flex-col items-center gap-1 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      {item.icon && <span className="text-2xl">{item.icon}</span>}
                      <span className="text-xs font-semibold text-gray-800">{item.text}</span>
                    </a>
                  ))}
              </div>
              <div className="mt-2 text-xs text-gray-500 text-center">
                {config.productMenuBar.position === 'bottom' ? '📱 하단 메뉴바' : '⬆️ 상단 메뉴바'}
              </div>
            </div>
            <div className="absolute top-4 right-4 flex gap-2 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const sectionMap: Record<string, string> = {
                    'hero': 'hero',
                    'social-buttons': 'social-buttons',
                    'video-banner': 'video-banner',
                    'company-stats': 'company-stats',
                    'social-video': 'social-video',
                    'cruise-search': 'cruise-search',
                    'review-section': 'review-section',
                    'community-section': 'community-section',
                    'youtube-shorts': 'youtube-shorts',
                    'youtube-videos': 'youtube-videos',
                    'youtube-live': 'youtube-live',
                    'product-list': 'product-list',
                    'category-menu': 'category-menu',
                    'top-menu': 'top-menu',
                    'footer': 'footer',
                    'product-menu-bar': 'product-menu-bar',
                    'landing-page-menu-bar': 'landing-page-menu-bar',
                    'promotion-banner': 'promotion-banner',
                  };
                  setEditingSection(sectionMap[sectionKey] || sectionKey);
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <FiEdit2 size={14} />
                편집
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSection(sectionKey, index);
                }}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-red-700 transition-colors"
              >
                <FiTrash2 size={14} />
                삭제
              </button>
            </div>
          </div>
        );
      case 'landing-page-menu-bar':
        if (!config.landingPageMenuBar?.enabled) return null;
        return (
          <div
            key={sectionKey}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative border-2 border-dashed rounded-lg p-2 transition-all ${
              isDragging ? 'border-blue-500 opacity-50' : 'border-gray-300 hover:border-blue-500'
            } cursor-move`}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('.no-click')) return;
              setEditingSection('landing-page-menu-bar');
            }}
          >
            <div className="absolute top-2 left-2 flex gap-1 z-20 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionUp(index);
                }}
                disabled={index === 0}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="위로 이동"
              >
                <FiChevronUp size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionDown(index);
                }}
                disabled={index >= (config.sectionOrder?.length || 0) - 1}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="아래로 이동"
              >
                <FiChevronDown size={16} />
              </button>
            </div>
            <div className="absolute top-2 left-16 flex items-center gap-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow no-click">
              <FiMove size={14} />
              드래그하여 이동
            </div>
            <div className={`bg-white rounded-lg p-4 ${
              config.landingPageMenuBar.position === 'top' ? 'border-b-2 border-b-gray-300' : 'border-r-2 border-r-gray-300'
            }`}>
              {config.landingPageMenuBar.displayType === 'full' ? (
                <div className={`flex ${config.landingPageMenuBar.position === 'top' ? 'flex-row justify-center gap-4' : 'flex-col gap-2'}`}>
                  {config.landingPageMenuBar.menuItems
                    ?.filter(m => m.enabled)
                    .sort((a, b) => a.order - b.order)
                    .map((item) => (
                      <a
                        key={item.id}
                        href={item.urlSlug}
                        className="px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-sm font-semibold"
                      >
                        {item.text}
                      </a>
                    ))}
                </div>
              ) : (
                <div className={`${config.landingPageMenuBar.buttonPosition === 'left-top' ? 'text-left' : 'text-right'}`}>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                    메뉴 버튼
                  </button>
                  <div className="mt-2 text-xs text-gray-500">
                    {config.landingPageMenuBar.buttonPosition === 'left-top' ? '↖️ 왼쪽 상단' : '↗️ 오른쪽 상단'}
                  </div>
                </div>
              )}
              <div className="mt-2 text-xs text-gray-500 text-center">
                {config.landingPageMenuBar.position === 'top' ? '⬆️ 상단' : '⬅️ 왼쪽'} | {config.landingPageMenuBar.displayType === 'full' ? '전체 메뉴' : '버튼형'}
              </div>
            </div>
            <div className="absolute top-4 right-4 flex gap-2 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const sectionMap: Record<string, string> = {
                    'hero': 'hero',
                    'social-buttons': 'social-buttons',
                    'video-banner': 'video-banner',
                    'company-stats': 'company-stats',
                    'social-video': 'social-video',
                    'cruise-search': 'cruise-search',
                    'review-section': 'review-section',
                    'community-section': 'community-section',
                    'youtube-shorts': 'youtube-shorts',
                    'youtube-videos': 'youtube-videos',
                    'youtube-live': 'youtube-live',
                    'product-list': 'product-list',
                    'category-menu': 'category-menu',
                    'top-menu': 'top-menu',
                    'footer': 'footer',
                    'product-menu-bar': 'product-menu-bar',
                    'landing-page-menu-bar': 'landing-page-menu-bar',
                    'promotion-banner': 'promotion-banner',
                  };
                  setEditingSection(sectionMap[sectionKey] || sectionKey);
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <FiEdit2 size={14} />
                편집
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSection(sectionKey, index);
                }}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-red-700 transition-colors"
              >
                <FiTrash2 size={14} />
                삭제
              </button>
            </div>
          </div>
        );
      
      case 'promotion-banner':
        if (!config.promotionBanner?.enabled) return null;
        return (
          <div
            key={sectionKey}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative border-2 border-dashed rounded-lg p-2 transition-all ${
              isDragging ? 'border-blue-500 opacity-50' : 'border-gray-300 hover:border-blue-500'
            } cursor-move`}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('.no-click')) return;
              setEditingSection('promotion-banner');
            }}
          >
            <div className="absolute top-2 left-2 flex gap-1 z-20 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionUp(index);
                }}
                disabled={index === 0}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="위로 이동"
              >
                <FiChevronUp size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSectionDown(index);
                }}
                disabled={index >= (config.sectionOrder?.length || 0) - 1}
                className="p-1 bg-white rounded shadow-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="아래로 이동"
              >
                <FiChevronDown size={16} />
              </button>
            </div>
            <div className="absolute top-2 left-16 flex items-center gap-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow no-click">
              <FiMove size={14} />
              드래그하여 이동
            </div>
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">프로모션 배너</h2>
              <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-600">
                프로모션 배너 캐러셀 영역
              </div>
            </div>
            <div className="absolute top-4 right-4 flex gap-2 no-click">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const sectionMap: Record<string, string> = {
                    'hero': 'hero',
                    'social-buttons': 'social-buttons',
                    'video-banner': 'video-banner',
                    'company-stats': 'company-stats',
                    'social-video': 'social-video',
                    'cruise-search': 'cruise-search',
                    'review-section': 'review-section',
                    'community-section': 'community-section',
                    'youtube-shorts': 'youtube-shorts',
                    'youtube-videos': 'youtube-videos',
                    'youtube-live': 'youtube-live',
                    'product-list': 'product-list',
                    'category-menu': 'category-menu',
                    'top-menu': 'top-menu',
                    'footer': 'footer',
                    'product-menu-bar': 'product-menu-bar',
                    'landing-page-menu-bar': 'landing-page-menu-bar',
                    'promotion-banner': 'promotion-banner',
                  };
                  setEditingSection(sectionMap[sectionKey] || sectionKey);
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <FiEdit2 size={14} />
                편집
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSection(sectionKey, index);
                }}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 hover:bg-red-700 transition-colors"
              >
                <FiTrash2 size={14} />
                삭제
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  return (
    <div className="flex h-screen bg-gray-100">
      {/* 왼쪽: 미리보기 영역 */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">메인페이지 시각적 편집기</h1>
          <div className="flex gap-3">
            <button
              onClick={openPreview}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
            >
              <FiEye size={18} />
              새 창에서 미리보기
            </button>
            <button
              onClick={saveConfig}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <FiSave size={18} />
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </div>
        {/* 실제 메인페이지 미리보기 */}
        <div className="p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* 섹션 순서에 따라 렌더링 */}
            {(config.sectionOrder || [
              'hero',
              'social-video',
              'cruise-search',
              'review-section',
              'youtube-shorts',
              'youtube-videos',
              'youtube-live',
              'product-list',
              'promotion-banner',
              'community-section',
              'product-menu-bar',
            ]).map((sectionKey, index) => (
              <div key={`${sectionKey}-${index}`} className="relative">
                {/* 블록 위에 추가 버튼 */}
                <div className="relative mb-4 add-block-menu">
                  <button
                    onClick={() => setShowAddBlockMenu(showAddBlockMenu === index ? null : index)}
                    className="w-full py-2 px-4 bg-green-50 border-2 border-dashed border-green-300 rounded-lg text-green-700 hover:bg-green-100 transition-colors flex items-center justify-center gap-2 font-semibold"
                  >
                    <FiPlus size={18} />
                    블록 추가
                  </button>
                  
                  {/* 블록 선택 메뉴 */}
                  {showAddBlockMenu === index && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                      <div className="p-2">
                        <div className="text-xs font-semibold text-gray-500 px-3 py-2 mb-1">블록 선택</div>
                        {availableBlocks.map((block) => (
                          <button
                            key={block.key}
                            onClick={() => addBlock(block.key, index)}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-3"
                          >
                            <span className="text-2xl">{block.icon}</span>
                            <span className="font-medium text-gray-800">{block.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 블록 렌더링 */}
                {renderSection(sectionKey, index)}
              </div>
            ))}
            
            {/* 마지막 블록 아래에도 추가 버튼 */}
            <div className="relative add-block-menu">
              <button
                onClick={() => {
                  const lastIndex = (config.sectionOrder || []).length;
                  setShowAddBlockMenu(showAddBlockMenu === lastIndex ? null : lastIndex);
                }}
                className="w-full py-2 px-4 bg-green-50 border-2 border-dashed border-green-300 rounded-lg text-green-700 hover:bg-green-100 transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                <FiPlus size={18} />
                블록 추가
              </button>
              
              {/* 블록 선택 메뉴 */}
              {showAddBlockMenu === (config.sectionOrder || []).length && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                  <div className="p-2">
                    <div className="text-xs font-semibold text-gray-500 px-3 py-2 mb-1">블록 선택</div>
                    {availableBlocks.map((block) => (
                      <button
                        key={block.key}
                        onClick={() => addBlock(block.key, (config.sectionOrder || []).length)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-3"
                      >
                        <span className="text-2xl">{block.icon}</span>
                        <span className="font-medium text-gray-800">{block.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* 오른쪽: 편집 패널 */}
      <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">편집 패널</h2>

          {/* 편집 중인 섹션 */}
          {editingSection === 'hero' && (
            <HeroEditor config={config.hero} onUpdate={(hero) => updateConfig(['hero'], hero)} onClose={() => setEditingSection(null)} />
          )}

          {editingSection === 'social-buttons' && (
            <SocialButtonsEditor config={config.socialButtons} onUpdate={(socialButtons) => updateConfig(['socialButtons'], socialButtons)} onClose={() => setEditingSection(null)} />
          )}

          {editingSection === 'video-banner' && (
            <VideoBannerEditor config={config.videoBanner} onUpdate={(videoBanner) => updateConfig(['videoBanner'], videoBanner)} onClose={() => setEditingSection(null)} />
          )}

          {editingSection === 'company-stats' && (
            <CompanyStatsEditor config={config.companyStats} onUpdate={(companyStats) => updateConfig(['companyStats'], companyStats)} onClose={() => setEditingSection(null)} />
          )}

          {editingSection === 'social-video' && (
            <SocialVideoEditor
              socialButtons={config.socialButtons}
              videoBanner={config.videoBanner}
              onUpdate={(socialButtons, videoBanner) => {
                updateConfig(['socialButtons'], socialButtons);
                updateConfig(['videoBanner'], videoBanner);
              }}
              onClose={() => setEditingSection(null)}
            />
          )}

          {editingSection === 'cruise-search' && (
            <CruiseSearchEditor config={config.cruiseSearch} onUpdate={(cruiseSearch) => updateConfig(['cruiseSearch'], cruiseSearch)} onClose={() => setEditingSection(null)} />
          )}

          {editingSection === 'review-section' && (
            <ReviewSectionEditor config={config.reviewSection} onUpdate={(reviewSection) => updateConfig(['reviewSection'], reviewSection)} onClose={() => setEditingSection(null)} />
          )}

          {editingSection === 'community-section' && (
            <CommunitySectionEditor config={config.communitySection} onUpdate={(communitySection) => updateConfig(['communitySection'], communitySection)} onClose={() => setEditingSection(null)} />
          )}

          {editingSection === 'youtube-shorts' && (
            <YoutubeShortsEditor config={config.youtubeShorts} onUpdate={(youtubeShorts) => updateConfig(['youtubeShorts'], youtubeShorts)} onClose={() => setEditingSection(null)} />
          )}

          {editingSection === 'youtube-videos' && (
            <YoutubeVideosEditor config={config.youtubeVideos} onUpdate={(youtubeVideos) => updateConfig(['youtubeVideos'], youtubeVideos)} onClose={() => setEditingSection(null)} />
          )}

          {editingSection === 'youtube-live' && (
            <YoutubeLiveEditor config={config.youtubeLive} onUpdate={(youtubeLive) => updateConfig(['youtubeLive'], youtubeLive)} onClose={() => setEditingSection(null)} />
          )}

          {editingSection === 'product-list' && (
            <ProductListEditor config={config.productList} onUpdate={(productList) => updateConfig(['productList'], productList)} onClose={() => setEditingSection(null)} />
          )}

          {editingSection === 'promotion-banner' && (
            <PromotionBannerEditor config={config.promotionBanner} onUpdate={(promotionBanner) => updateConfig(['promotionBanner'], promotionBanner)} onClose={() => setEditingSection(null)} />
          )}

          {editingSection === 'product-sections' && (
            <ProductSectionsEditor config={config.productSections || []} onUpdate={(productSections) => updateConfig(['productSections'], productSections)} onClose={() => setEditingSection(null)} />
          )}

          {editingSection === 'theme-sections' && (
            <ThemeProductSectionsEditor config={config.themeSections || []} onUpdate={(themeSections) => updateConfig(['themeSections'], themeSections)} onClose={() => setEditingSection(null)} />
          )}

          {editingSection === 'category-menu' && (
            <CategoryMenuEditor config={config.categoryMenu} onUpdate={(categoryMenu) => updateConfig(['categoryMenu'], categoryMenu)} onClose={() => setEditingSection(null)} />
          )}

          {editingSection === 'top-menu' && (
            <TopMenuEditor config={config.topMenu} onUpdate={(topMenu) => updateConfig(['topMenu'], topMenu)} onClose={() => setEditingSection(null)} />
          )}

          {editingSection === 'footer' && (
            <FooterEditor config={config.footer} onUpdate={(footer) => updateConfig(['footer'], footer)} onClose={() => setEditingSection(null)} />
          )}

          {editingSection === 'global-settings' && (
            <GlobalSettingsEditor config={config.globalSettings} onUpdate={(globalSettings) => updateConfig(['globalSettings'], globalSettings)} onClose={() => setEditingSection(null)} />
          )}

          {editingSection === 'product-menu-bar' && (
            <ProductMenuBarEditor config={config.productMenuBar} onUpdate={(productMenuBar) => updateConfig(['productMenuBar'], productMenuBar)} onClose={() => setEditingSection(null)} />
          )}

          {editingSection === 'landing-page-menu-bar' && (
            <LandingPageMenuBarEditor config={config.landingPageMenuBar} onUpdate={(landingPageMenuBar) => updateConfig(['landingPageMenuBar'], landingPageMenuBar)} onClose={() => setEditingSection(null)} />
          )}

          {editingSection === 'popup' && (
            <PopupEditor config={config.popup} onUpdate={(popup) => updateConfig(['popup'], popup)} onClose={() => setEditingSection(null)} />
          )}
          {/* 기본 메뉴 */}
          {!editingSection && (
            <div className="space-y-3">
              <button
                onClick={() => setEditingSection('hero')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
              >
                <div className="font-semibold text-gray-800 mb-1">히어로 섹션</div>
                <div className="text-sm text-gray-600">비디오, 제목, 버튼 편집</div>
              </button>

              <button
                onClick={() => setEditingSection('social-buttons')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
              >
                <div className="font-semibold text-gray-800 mb-1">소셜 버튼</div>
                <div className="text-sm text-gray-600">카카오톡, 유튜브 등 버튼 추가/편집</div>
              </button>

              <button
                onClick={() => setEditingSection('video-banner')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
              >
                <div className="font-semibold text-gray-800 mb-1">영상 배너</div>
                <div className="text-sm text-gray-600">영상 배너 설정</div>
              </button>

              <button
                onClick={() => setEditingSection('company-stats')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
              >
                <div className="font-semibold text-gray-800 mb-1">경험과 신뢰 섹션</div>
                <div className="text-sm text-gray-600">통계 카드, 만족도 점수</div>
              </button>

              <button
                onClick={() => setEditingSection('cruise-search')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
              >
                <div className="font-semibold text-gray-800 mb-1">크루즈 검색 블록</div>
                <div className="text-sm text-gray-600">제목, 표시 여부</div>
              </button>

              <button
                onClick={() => setEditingSection('review-section')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
              >
                <div className="font-semibold text-gray-800 mb-1">크루즈 후기 섹션</div>
                <div className="text-sm text-gray-600">제목, 설명, 링크</div>
              </button>

              <button
                onClick={() => setEditingSection('community-section')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
              >
                <div className="font-semibold text-gray-800 mb-1">커뮤니티 섹션</div>
                <div className="text-sm text-gray-600">제목, 설명, 링크 설정</div>
              </button>

              <button
                onClick={() => setEditingSection('youtube-shorts')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
              >
                <div className="font-semibold text-gray-800 mb-1">YouTube Shorts</div>
                <div className="text-sm text-gray-600">제목, 설명, 표시 여부</div>
              </button>

              <button
                onClick={() => setEditingSection('youtube-videos')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
              >
                <div className="font-semibold text-gray-800 mb-1">YouTube 영상</div>
                <div className="text-sm text-gray-600">제목, 설명, 표시 여부</div>
              </button>

              <button
                onClick={() => setEditingSection('youtube-live')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
              >
                <div className="font-semibold text-gray-800 mb-1">YouTube Live</div>
                <div className="text-sm text-gray-600">제목, 설명, 표시 여부</div>
              </button>

              <button
                onClick={() => setEditingSection('product-list')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
              >
                <div className="font-semibold text-gray-800 mb-1">상품 목록</div>
                <div className="text-sm text-gray-600">표시 여부</div>
              </button>

              <button
                onClick={() => setEditingSection('product-sections')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
              >
                <div className="font-semibold text-gray-800 mb-1">상품 섹션 관리</div>
                <div className="text-sm text-gray-600">블록별 상품 목록 추가/편집</div>
              </button>

              <button
                onClick={() => setEditingSection('theme-sections')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
              >
                <div className="font-semibold text-gray-800 mb-1">테마형 상품 섹션</div>
                <div className="text-sm text-gray-600">분류/선사/태그 기반 자동 섹션 관리</div>
              </button>

              <button
                onClick={() => setEditingSection('category-menu')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
              >
                <div className="font-semibold text-gray-800 mb-1">카테고리 메뉴</div>
                <div className="text-sm text-gray-600">메뉴 카테고리 및 페이지 연결 설정</div>
              </button>

              <button
                onClick={() => setEditingSection('top-menu')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
              >
                <div className="font-semibold text-gray-800 mb-1">상단 고정 메뉴</div>
                <div className="text-sm text-gray-600">헤더 메뉴 및 로고 설정</div>
              </button>

              <button
                onClick={() => setEditingSection('footer')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
              >
                <div className="font-semibold text-gray-800 mb-1">하단 푸터</div>
                <div className="text-sm text-gray-600">푸터 메뉴 및 회사 정보 설정</div>
              </button>

              <button
                onClick={() => setEditingSection('global-settings')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
              >
                <div className="font-semibold text-gray-800 mb-1">메인몰 전역 설정</div>
                <div className="text-sm text-gray-600">배너 이미지, 이모티콘, 버튼 색상 설정</div>
              </button>

              <button
                onClick={() => setEditingSection('product-menu-bar')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
              >
                <div className="font-semibold text-gray-800 mb-1">상품 메뉴바</div>
                <div className="text-sm text-gray-600">하단/상단 메뉴바 위치 및 메뉴 설정</div>
              </button>

              <button
                onClick={() => setEditingSection('landing-page-menu-bar')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
              >
                <div className="font-semibold text-gray-800 mb-1">랜딩페이지 메뉴바</div>
                <div className="text-sm text-gray-600">랜딩페이지 메뉴바 위치 및 표시 방식 설정</div>
              </button>

              <button
                onClick={() => setEditingSection('promotion-banner')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
              >
                <div className="font-semibold text-gray-800 mb-1">프로모션 배너</div>
                <div className="text-sm text-gray-600">표시 여부</div>
              </button>

              <button
                onClick={() => setEditingSection('popup')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
              >
                <div className="font-semibold text-gray-800 mb-1">팝업 메시지</div>
                <div className="text-sm text-gray-600">이미지 또는 텍스트 팝업 설정</div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// 히어로 섹션 편집기
function HeroEditor({
  config,
  onUpdate,
  onClose,
}: {
  config: PageConfig['hero'];
  onUpdate: (config: PageConfig['hero']) => void;
  onClose: () => void;
}) {
  const [localConfig, setLocalConfig] = useState(config);
  const [showGallery, setShowGallery] = useState<{ type: 'image' | 'video'; field: 'logoUrl' | 'videoUrl' } | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">히어로 섹션 편집</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <FiX size={20} />
        </button>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">로고 이미지 URL</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={localConfig.logoUrl || ''}
            onChange={(e) => setLocalConfig({ ...localConfig, logoUrl: e.target.value })}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="/images/ai-cruise-logo.png"
          />
          <button
            onClick={() => setShowGallery({ type: 'image', field: 'logoUrl' })}
            className="px-4 py-2 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center gap-2"
          >
            <FiFolder size={16} />
            불러오기
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">로고 이미지 URL을 입력하거나 저장된 이미지를 불러오세요</p>
        {localConfig.logoUrl && (
          <div className="mt-2">
            <img src={localConfig.logoUrl} alt="로고 미리보기" className="max-h-20 object-contain" onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }} />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">비디오 URL</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={localConfig.videoUrl}
            onChange={(e) => setLocalConfig({ ...localConfig, videoUrl: e.target.value })}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="/videos/hero-video.mp4"
          />
          <button
            onClick={() => setShowGallery({ type: 'video', field: 'videoUrl' })}
            className="px-4 py-2 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center gap-2"
          >
            <FiFolder size={16} />
            불러오기
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">비디오 파일을 업로드하거나 저장된 영상을 불러오세요</p>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">제목</label>
        <input
          type="text"
          value={localConfig.title}
          onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">부제목 (줄바꿈: \n)</label>
        <textarea
          value={localConfig.subtitle}
          onChange={(e) => setLocalConfig({ ...localConfig, subtitle: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">버튼</label>
        <div className="space-y-3">
          {localConfig.buttons.map((btn, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={btn.text}
                  onChange={(e) => {
                    const newButtons = [...localConfig.buttons];
                    newButtons[idx].text = e.target.value;
                    setLocalConfig({ ...localConfig, buttons: newButtons });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="버튼 텍스트"
                />
                <input
                  type="text"
                  value={btn.link}
                  onChange={(e) => {
                    const newButtons = [...localConfig.buttons];
                    newButtons[idx].link = e.target.value;
                    setLocalConfig({ ...localConfig, buttons: newButtons });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="링크"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">배경색</label>
                  <input
                    type="text"
                    value={btn.backgroundColor || ''}
                    onChange={(e) => {
                      const newButtons = [...localConfig.buttons];
                      newButtons[idx].backgroundColor = e.target.value;
                      setLocalConfig({ ...localConfig, buttons: newButtons });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="#ffffff 또는 blue-600"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">글씨색</label>
                  <input
                    type="text"
                    value={btn.textColor || ''}
                    onChange={(e) => {
                      const newButtons = [...localConfig.buttons];
                      newButtons[idx].textColor = e.target.value;
                      setLocalConfig({ ...localConfig, buttons: newButtons });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="#000000 또는 white"
                  />
                </div>
              </div>
              {btn.backgroundColor && btn.textColor && (
                <div className="mt-2">
                  <div 
                    className="px-4 py-2 rounded-lg text-center text-sm"
                    style={{
                      backgroundColor: btn.backgroundColor.startsWith('#') ? btn.backgroundColor : '#ffffff',
                      color: btn.textColor.startsWith('#') ? btn.textColor : '#1e40af',
                    }}
                  >
                    미리보기: {btn.text || '버튼 텍스트'}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => onUpdate(localConfig)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        적용하기
      </button>

      {/* 파일 갤러리 모달 */}
      {showGallery && (
        <FileGallery
          type={showGallery.type}
          currentUrl={showGallery.field === 'logoUrl' ? localConfig.logoUrl : localConfig.videoUrl}
          onSelect={(url) => {
            if (showGallery.field === 'logoUrl') {
              setLocalConfig({ ...localConfig, logoUrl: url });
            } else {
              setLocalConfig({ ...localConfig, videoUrl: url });
            }
            setShowGallery(null);
          }}
          onClose={() => setShowGallery(null)}
        />
      )}
    </div>
  );
}

function YoutubeShortsEditor({
  config,
  onUpdate,
  onClose,
}: {
  config: PageConfig['youtubeShorts'];
  onUpdate: (config: PageConfig['youtubeShorts']) => void;
  onClose: () => void;
}) {
  const [localConfig, setLocalConfig] = useState(config);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">YouTube Shorts 편집</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <FiX size={20} />
        </button>
      </div>

      <div>
        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={localConfig.enabled}
            onChange={(e) => setLocalConfig({ ...localConfig, enabled: e.target.checked })}
            className="w-5 h-5"
          />
          <span className="font-semibold">섹션 활성화</span>
        </label>
      </div>

      {localConfig.enabled && (
        <>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">제목</label>
            <input
              type="text"
              value={localConfig.title}
              onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">설명</label>
            <textarea
              value={localConfig.description}
              onChange={(e) => setLocalConfig({ ...localConfig, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        </>
      )}

      <button
        onClick={() => onUpdate(localConfig)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        적용하기
      </button>
    </div>
  );
}

function YoutubeVideosEditor({
  config,
  onUpdate,
  onClose,
}: {
  config: PageConfig['youtubeVideos'];
  onUpdate: (config: PageConfig['youtubeVideos']) => void;
  onClose: () => void;
}) {
  const [localConfig, setLocalConfig] = useState(config);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">YouTube 영상 편집</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <FiX size={20} />
        </button>
      </div>

      <div>
        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={localConfig.enabled}
            onChange={(e) => setLocalConfig({ ...localConfig, enabled: e.target.checked })}
            className="w-5 h-5"
          />
          <span className="font-semibold">섹션 활성화</span>
        </label>
      </div>

      {localConfig.enabled && (
        <>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">제목</label>
            <input
              type="text"
              value={localConfig.title}
              onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">설명</label>
            <textarea
              value={localConfig.description}
              onChange={(e) => setLocalConfig({ ...localConfig, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">링크 텍스트</label>
            <input
              type="text"
              value={localConfig.linkText}
              onChange={(e) => setLocalConfig({ ...localConfig, linkText: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">링크 URL</label>
            <input
              type="text"
              value={localConfig.linkUrl}
              onChange={(e) => setLocalConfig({ ...localConfig, linkUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      <button
        onClick={() => onUpdate(localConfig)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        적용하기
      </button>
    </div>
  );
}

// 소셜 버튼 & 영상 배너 편집기
function SocialVideoEditor({
  socialButtons,
  videoBanner,
  onUpdate,
  onClose,
}: {
  socialButtons: PageConfig['socialButtons'];
  videoBanner: PageConfig['videoBanner'];
  onUpdate: (socialButtons: PageConfig['socialButtons'], videoBanner: PageConfig['videoBanner']) => void;
  onClose: () => void;
}) {
  const [localSocial, setLocalSocial] = useState(socialButtons);
  const [localVideo, setLocalVideo] = useState(videoBanner);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">소셜 버튼 & 영상 배너</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <FiX size={20} />
        </button>
      </div>

      {/* 카카오톡 버튼 */}
      {(() => {
        const kakaoBtn = localSocial.buttons.find(btn => btn.type === 'kakao') || {
          enabled: false,
          type: 'kakao' as const,
          text: '카카오톡 상담',
          link: '',
          size: 'medium' as const,
        };
        const kakaoIndex = localSocial.buttons.findIndex(btn => btn.type === 'kakao');
        return (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="font-semibold text-gray-800">카카오톡 버튼</label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={kakaoBtn.enabled}
                  onChange={(e) => {
                    const newButtons = [...localSocial.buttons];
                    if (kakaoIndex >= 0) {
                      newButtons[kakaoIndex] = { ...newButtons[kakaoIndex], enabled: e.target.checked };
                    } else {
                      newButtons.push({ ...kakaoBtn, enabled: e.target.checked });
                    }
                    setLocalSocial({ ...localSocial, buttons: newButtons });
                  }}
                  className="w-5 h-5"
                />
                <span className="text-sm">활성화</span>
              </label>
            </div>
            {kakaoBtn.enabled && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={kakaoBtn.text}
                  onChange={(e) => {
                    const newButtons = [...localSocial.buttons];
                    if (kakaoIndex >= 0) {
                      newButtons[kakaoIndex] = { ...newButtons[kakaoIndex], text: e.target.value };
                    } else {
                      newButtons.push({ ...kakaoBtn, text: e.target.value });
                    }
                    setLocalSocial({ ...localSocial, buttons: newButtons });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="버튼 텍스트"
                />
                <input
                  type="text"
                  value={kakaoBtn.link}
                  onChange={(e) => {
                    const newButtons = [...localSocial.buttons];
                    if (kakaoIndex >= 0) {
                      newButtons[kakaoIndex] = { ...newButtons[kakaoIndex], link: e.target.value };
                    } else {
                      newButtons.push({ ...kakaoBtn, link: e.target.value });
                    }
                    setLocalSocial({ ...localSocial, buttons: newButtons });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="카카오톡 링크 URL"
                />
              </div>
            )}
          </div>
        );
      })()}

      {/* 유튜브 버튼 */}
      {(() => {
        const youtubeBtn = localSocial.buttons.find(btn => btn.type === 'youtube') || {
          enabled: false,
          type: 'youtube' as const,
          text: '유튜브 구독하기',
          link: '',
          size: 'medium' as const,
        };
        const youtubeIndex = localSocial.buttons.findIndex(btn => btn.type === 'youtube');
        return (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="font-semibold text-gray-800">유튜브 버튼</label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={youtubeBtn.enabled}
                  onChange={(e) => {
                    const newButtons = [...localSocial.buttons];
                    if (youtubeIndex >= 0) {
                      newButtons[youtubeIndex] = { ...newButtons[youtubeIndex], enabled: e.target.checked };
                    } else {
                      newButtons.push({ ...youtubeBtn, enabled: e.target.checked });
                    }
                    setLocalSocial({ ...localSocial, buttons: newButtons });
                  }}
                  className="w-5 h-5"
                />
                <span className="text-sm">활성화</span>
              </label>
            </div>
            {youtubeBtn.enabled && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={youtubeBtn.text}
                  onChange={(e) => {
                    const newButtons = [...localSocial.buttons];
                    if (youtubeIndex >= 0) {
                      newButtons[youtubeIndex] = { ...newButtons[youtubeIndex], text: e.target.value };
                    } else {
                      newButtons.push({ ...youtubeBtn, text: e.target.value });
                    }
                    setLocalSocial({ ...localSocial, buttons: newButtons });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="버튼 텍스트"
                />
                <input
                  type="text"
                  value={youtubeBtn.link}
                  onChange={(e) => {
                    const newButtons = [...localSocial.buttons];
                    if (youtubeIndex >= 0) {
                      newButtons[youtubeIndex] = { ...newButtons[youtubeIndex], link: e.target.value };
                    } else {
                      newButtons.push({ ...youtubeBtn, link: e.target.value });
                    }
                    setLocalSocial({ ...localSocial, buttons: newButtons });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="유튜브 채널 URL"
                />
              </div>
            )}
          </div>
        );
      })()}
      {/* 영상 배너 */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="font-semibold text-gray-800">영상 배너</label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={localVideo.enabled}
              onChange={(e) => setLocalVideo({ ...localVideo, enabled: e.target.checked })}
              className="w-5 h-5"
            />
            <span className="text-sm">활성화</span>
          </label>
        </div>
        {localVideo.enabled && (
          <div className="space-y-2">
            <div>
              <label className="block text-sm text-gray-600 mb-1">영상 URL</label>
              <input
                type="text"
                value={localVideo.videoUrl}
                onChange={(e) => setLocalVideo({ ...localVideo, videoUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="/videos/cruise-showcase-video.mp4"
              />
              <p className="text-xs text-gray-500 mt-1">영상 파일을 업로드하거나 URL을 입력하세요</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">제목</label>
              <input
                type="text"
                value={localVideo.title}
                onChange={(e) => setLocalVideo({ ...localVideo, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">링크 URL (선택)</label>
              <input
                type="text"
                value={localVideo.link}
                onChange={(e) => setLocalVideo({ ...localVideo, link: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="/products 또는 https://..."
              />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => onUpdate(localSocial, localVideo)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        적용하기
      </button>
    </div>
  );
}
// 팝업 편집기
function PopupEditor({
  config,
  onUpdate,
  onClose,
}: {
  config: PageConfig['popup'];
  onUpdate: (config: PageConfig['popup']) => void;
  onClose: () => void;
}) {
  const [localConfig, setLocalConfig] = useState(config);
  const [showGallery, setShowGallery] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">팝업 메시지 편집</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <FiX size={20} />
        </button>
      </div>

      <div>
        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={localConfig.enabled}
            onChange={(e) => setLocalConfig({ ...localConfig, enabled: e.target.checked })}
            className="w-5 h-5"
          />
          <span className="font-semibold">팝업 활성화</span>
        </label>
      </div>

      {localConfig.enabled && (
        <>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">팝업 타입</label>
            <select
              value={localConfig.type}
              onChange={(e) => setLocalConfig({ ...localConfig, type: e.target.value as 'image' | 'text' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="image">이미지 팝업</option>
              <option value="text">텍스트 팝업</option>
            </select>
          </div>

          {localConfig.type === 'image' ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">이미지 URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={localConfig.imageUrl}
                    onChange={(e) => setLocalConfig({ ...localConfig, imageUrl: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="/images/popup.jpg 또는 https://..."
                  />
                  <label className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 cursor-pointer flex items-center gap-2">
                    <FiImage size={18} />
                    업로드
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('type', 'image');
                          const response = await fetch('/api/admin/mall/upload', {
                            method: 'POST',
                            credentials: 'include',
                            body: formData,
                          });
                          const data = await response.json();
                          if (data.ok && data.url) {
                            setLocalConfig({ ...localConfig, imageUrl: data.url });
                            showSuccess('이미지가 업로드되었습니다!');
                          } else {
                            showError(data.error || '이미지 업로드에 실패했습니다.');
                          }
                        } catch (error) {
                          showError('이미지 업로드에 실패했습니다.');
                        }
                      }}
                    />
                  </label>
                  <button
                    onClick={() => setShowGallery(true)}
                    className="px-4 py-2 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center gap-2"
                  >
                    <FiFolder size={16} />
                    불러오기
                  </button>
                </div>
                {localConfig.imageUrl && (
                  <div className="mt-2">
                    <img
                      src={localConfig.imageUrl}
                      alt="미리보기"
                      className="w-full h-32 object-cover rounded-lg border border-gray-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">이미지 파일을 업로드하거나 URL을 입력하세요</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">링크 URL (선택)</label>
                <input
                  type="text"
                  value={localConfig.link}
                  onChange={(e) => setLocalConfig({ ...localConfig, link: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="클릭 시 이동할 링크"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">제목</label>
                <input
                  type="text"
                  value={localConfig.title}
                  onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">내용</label>
                <textarea
                  value={localConfig.content}
                  onChange={(e) => setLocalConfig({ ...localConfig, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">링크 URL (선택)</label>
                <input
                  type="text"
                  value={localConfig.link}
                  onChange={(e) => setLocalConfig({ ...localConfig, link: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={localConfig.showCloseButton}
                onChange={(e) => setLocalConfig({ ...localConfig, showCloseButton: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="text-sm">닫기 버튼 표시</span>
            </label>
          </div>
        </>
      )}

      <button
        onClick={() => onUpdate(localConfig)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        적용하기
      </button>
    </div>
  );
}

// 크루즈 검색 블록 편집기
function CruiseSearchEditor({
  config,
  onUpdate,
  onClose,
}: {
  config: PageConfig['cruiseSearch'];
  onUpdate: (config: PageConfig['cruiseSearch']) => void;
  onClose: () => void;
}) {
  const [localConfig, setLocalConfig] = useState(config);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">크루즈 검색 블록 편집</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <FiX size={20} />
        </button>
      </div>

      <div>
        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={localConfig.enabled}
            onChange={(e) => setLocalConfig({ ...localConfig, enabled: e.target.checked })}
            className="w-5 h-5"
          />
          <span className="font-semibold">섹션 활성화</span>
        </label>
      </div>

      {localConfig.enabled && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">제목</label>
          <input
            type="text"
            value={localConfig.title}
            onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      <button
        onClick={() => onUpdate(localConfig)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        적용하기
      </button>
    </div>
  );
}

// 크루즈 후기 섹션 편집기
function ReviewSectionEditor({
  config,
  onUpdate,
  onClose,
}: {
  config: PageConfig['reviewSection'];
  onUpdate: (config: PageConfig['reviewSection']) => void;
  onClose: () => void;
}) {
  const [localConfig, setLocalConfig] = useState(config);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">크루즈 후기 섹션 편집</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <FiX size={20} />
        </button>
      </div>

      <div>
        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={localConfig.enabled}
            onChange={(e) => setLocalConfig({ ...localConfig, enabled: e.target.checked })}
            className="w-5 h-5"
          />
          <span className="font-semibold">섹션 활성화</span>
        </label>
      </div>

      {localConfig.enabled && (
        <>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">제목</label>
            <input
              type="text"
              value={localConfig.title}
              onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">설명</label>
            <textarea
              value={localConfig.description}
              onChange={(e) => setLocalConfig({ ...localConfig, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">링크 텍스트</label>
            <input
              type="text"
              value={localConfig.linkText}
              onChange={(e) => setLocalConfig({ ...localConfig, linkText: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">링크 URL</label>
            <input
              type="text"
              value={localConfig.linkUrl}
              onChange={(e) => setLocalConfig({ ...localConfig, linkUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      <button
        onClick={() => onUpdate(localConfig)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        적용하기
      </button>
    </div>
  );
}
// 커뮤니티 섹션 편집기
function CommunitySectionEditor({
  config,
  onUpdate,
  onClose,
}: {
  config: PageConfig['communitySection'];
  onUpdate: (config: PageConfig['communitySection']) => void;
  onClose: () => void;
}) {
  const [localConfig, setLocalConfig] = useState(config);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">커뮤니티 섹션 편집</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <FiX size={20} />
        </button>
      </div>

      <div>
        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={localConfig.enabled}
            onChange={(e) => setLocalConfig({ ...localConfig, enabled: e.target.checked })}
            className="w-5 h-5"
          />
          <span className="font-semibold">섹션 활성화</span>
        </label>
      </div>

      {localConfig.enabled && (
        <>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">제목</label>
            <input
              type="text"
              value={localConfig.title}
              onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">설명</label>
            <textarea
              value={localConfig.description}
              onChange={(e) => setLocalConfig({ ...localConfig, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">링크 텍스트</label>
            <input
              type="text"
              value={localConfig.linkText}
              onChange={(e) => setLocalConfig({ ...localConfig, linkText: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">링크 URL</label>
            <input
              type="text"
              value={localConfig.linkUrl}
              onChange={(e) => setLocalConfig({ ...localConfig, linkUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      <button
        onClick={() => onUpdate(localConfig)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        적용하기
      </button>
    </div>
  );
}

// YouTube Live 편집기
function YoutubeLiveEditor({
  config,
  onUpdate,
  onClose,
}: {
  config: PageConfig['youtubeLive'];
  onUpdate: (config: PageConfig['youtubeLive']) => void;
  onClose: () => void;
}) {
  const [localConfig, setLocalConfig] = useState(config);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">YouTube Live 편집</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <FiX size={20} />
        </button>
      </div>

      <div>
        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={localConfig.enabled}
            onChange={(e) => setLocalConfig({ ...localConfig, enabled: e.target.checked })}
            className="w-5 h-5"
          />
          <span className="font-semibold">섹션 활성화</span>
        </label>
      </div>

      {localConfig.enabled && (
        <>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">제목</label>
            <input
              type="text"
              value={localConfig.title}
              onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">설명</label>
            <textarea
              value={localConfig.description}
              onChange={(e) => setLocalConfig({ ...localConfig, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        </>
      )}

      <button
        onClick={() => onUpdate(localConfig)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        적용하기
      </button>
    </div>
  );
}
// 상품 목록 편집기
function ProductListEditor({
  config,
  onUpdate,
  onClose,
}: {
  config: PageConfig['productList'];
  onUpdate: (config: PageConfig['productList']) => void;
  onClose: () => void;
}) {
  const [localConfig, setLocalConfig] = useState(config);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">상품 목록 편집</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <FiX size={20} />
        </button>
      </div>

      <div>
        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={localConfig.enabled}
            onChange={(e) => setLocalConfig({ ...localConfig, enabled: e.target.checked })}
            className="w-5 h-5"
          />
          <span className="font-semibold">섹션 활성화</span>
        </label>
        <p className="text-xs text-gray-500 mt-2">
          상품 목록의 세부 설정은 "상품 섹션 관리"와 "카테고리 메뉴"에서 관리할 수 있습니다.
        </p>
      </div>

      <button
        onClick={() => onUpdate(localConfig)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        적용하기
      </button>
    </div>
  );
}
// 상품 섹션 편집기 (블록별 상품 목록 관리)
function ProductSectionsEditor({
  config,
  onUpdate,
  onClose,
}: {
  config: PageConfig['productSections'];
  onUpdate: (config: PageConfig['productSections']) => void;
  onClose: () => void;
}) {
  const [localConfig, setLocalConfig] = useState(config);
  const [searchProduct, setSearchProduct] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // 상품 검색
  const handleSearchProduct = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await fetch(`/api/public/products?search=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json();
      if (data.ok && data.products) {
        setSearchResults(data.products);
      }
    } catch (error) {
      console.error('상품 검색 실패:', error);
    }
  };

  // 새 상품 섹션 추가
  const addSection = () => {
    const newSection = {
      id: `section-${Date.now()}`,
      enabled: true,
      title: '새 상품 섹션',
      type: 'swipe' as const,
      products: [],
      linkUrl: '',
      linkText: '더보기',
    };
    setLocalConfig([...localConfig, newSection]);
  };

  // 섹션 삭제
  const removeSection = (id: string) => {
    setLocalConfig(localConfig.filter(s => s.id !== id));
  };

  // 상품 추가
  const addProduct = (sectionId: string, productCode: string, productName?: string) => {
    setLocalConfig(localConfig.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          products: [...section.products, { productCode, productName }],
        };
      }
      return section;
    }));
    setSearchProduct('');
    setSearchResults([]);
  };

  // 상품 제거
  const removeProduct = (sectionId: string, productCode: string) => {
    setLocalConfig(localConfig.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          products: section.products.filter(p => p.productCode !== productCode),
        };
      }
      return section;
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">상품 섹션 관리</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <FiX size={20} />
        </button>
      </div>

      <div className="mb-4">
        <button
          onClick={addSection}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
        >
          <FiPlus size={18} />
          새 상품 섹션 추가
        </button>
        <p className="text-xs text-gray-500 mt-2">
          • 여러 개의 상품 목록 블록을 추가하여 독립적으로 관리할 수 있습니다.
        </p>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {localConfig.map((section, sectionIdx) => (
          <div key={section.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-800">섹션 {sectionIdx + 1}</h4>
              <button
                onClick={() => removeSection(section.id)}
                className="text-red-600 hover:text-red-700"
              >
                <FiTrash2 size={18} />
              </button>
            </div>

            {/* 활성화 여부 */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={section.enabled}
                  onChange={(e) => {
                    const updated = [...localConfig];
                    updated[sectionIdx].enabled = e.target.checked;
                    setLocalConfig(updated);
                  }}
                  className="w-5 h-5"
                />
                <span className="text-sm font-semibold">활성화</span>
              </label>
              <p className="text-xs text-gray-500 ml-7 mt-1">
                • 체크 해제 시 이 섹션이 메인 페이지에 표시되지 않습니다.
              </p>
            </div>

            {/* 섹션 제목 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                섹션 제목
              </label>
              <input
                type="text"
                value={section.title}
                onChange={(e) => {
                  const updated = [...localConfig];
                  updated[sectionIdx].title = e.target.value;
                  setLocalConfig(updated);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="예: 인기 크루즈"
              />
              <p className="text-xs text-gray-500 mt-1">
                • 상품 목록 위에 표시될 제목을 입력하세요.
              </p>
            </div>

            {/* 표시 타입 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                표시 방식
              </label>
              <select
                value={section.type}
                onChange={(e) => {
                  const updated = [...localConfig];
                  updated[sectionIdx].type = e.target.value as any;
                  setLocalConfig(updated);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="swipe">스와이프 (가로 스크롤)</option>
                <option value="grid-2x3">2x3 그리드 (2행 3열)</option>
                <option value="grid-3">3개 그리드 (한 줄에 3개)</option>
                <option value="grid-4">4개 그리드 (한 줄에 4개)</option>
                <option value="fixed-3">3개 고정상품</option>
                <option value="fixed-8">8개 고정상품</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                • 상품을 어떤 형태로 표시할지 선택하세요. 스와이프는 가로 스크롤, 그리드는 격자 형태입니다.
              </p>
            </div>
            {/* 상품 검색 및 추가 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                상품 추가
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchProduct}
                  onChange={(e) => {
                    setSearchProduct(e.target.value);
                    handleSearchProduct(e.target.value);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="상품 코드 또는 이름 검색"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                  {searchResults.map((product) => (
                    <div
                      key={product.productCode}
                      className="p-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                      onClick={() => addProduct(section.id, product.productCode, product.packageName)}
                    >
                      <div>
                        <div className="font-semibold text-sm">{product.productCode}</div>
                        <div className="text-xs text-gray-600">{product.packageName}</div>
                      </div>
                      <FiPlus size={16} className="text-blue-600" />
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                • 상품 코드나 이름을 입력하여 검색한 후, 원하는 상품을 클릭하여 추가하세요.
              </p>
            </div>

            {/* 추가된 상품 목록 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                추가된 상품 ({section.products.length}개)
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {section.products.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-2">추가된 상품이 없습니다.</p>
                ) : (
                  section.products.map((product, productIdx) => (
                    <div
                      key={product.productCode}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{product.productCode}</div>
                        {product.productName && (
                          <div className="text-xs text-gray-600">{product.productName}</div>
                        )}
                      </div>
                      <button
                        onClick={() => removeProduct(section.id, product.productCode)}
                        className="text-red-600 hover:text-red-700 ml-2"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                • 추가된 상품을 클릭하여 제거할 수 있습니다. 드래그하여 순서를 변경할 수 있습니다.
              </p>
            </div>

            {/* 더보기 버튼 설정 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                더보기 버튼 링크 (영어 주소)
              </label>
              <input
                type="text"
                value={section.linkUrl || ''}
                onChange={(e) => {
                  const updated = [...localConfig];
                  updated[sectionIdx].linkUrl = e.target.value;
                  setLocalConfig(updated);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="/products 또는 /category/cruise"
              />
              <p className="text-xs text-gray-500 mt-1">
                • 더보기 버튼을 클릭했을 때 이동할 페이지의 영어 주소(URL)를 입력하세요. 예: /products, /category/cruise
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                더보기 버튼 텍스트
              </label>
              <input
                type="text"
                value={section.linkText || '더보기'}
                onChange={(e) => {
                  const updated = [...localConfig];
                  updated[sectionIdx].linkText = e.target.value;
                  setLocalConfig(updated);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="더보기"
              />
              <p className="text-xs text-gray-500 mt-1">
                • 더보기 버튼에 표시될 텍스트를 입력하세요. 비워두면 "더보기"로 표시됩니다.
              </p>
            </div>
          </div>
        ))}
      </div>

      {localConfig.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>추가된 상품 섹션이 없습니다.</p>
          <p className="text-xs mt-2">위의 "새 상품 섹션 추가" 버튼을 클릭하여 추가하세요.</p>
        </div>
      )}
      <button
        onClick={() => onUpdate(localConfig)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        적용하기
      </button>
    </div>
  );
}
// 카테고리 메뉴 편집기
function CategoryMenuEditor({
  config,
  onUpdate,
  onClose,
}: {
  config: PageConfig['categoryMenu'];
  onUpdate: (config: PageConfig['categoryMenu']) => void;
  onClose: () => void;
}) {
  const [localConfig, setLocalConfig] = useState(config);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null); // 현재 이모티콘 선택 중인 카테고리 ID

  // 외부 클릭 시 이모티콘 선택 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(null);
      }
    };

    if (showEmojiPicker !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showEmojiPicker]);

  // 100종류의 이모티콘 목록
  const emojiList = [
    '🎯', '📚', '🎫', '🎨', '🎵', '🎬', '🎮', '🏀', '⚽', '🎾',
    '🏊', '🚴', '🏃', '🧘', '🧗', '🏔️', '⛰️', '🌊', '🏖️', '🏝️',
    '🌴', '🌸', '🌺', '🌻', '🌷', '🌹', '🌵', '🌲', '🌳', '🌴',
    '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑',
    '🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🥞', '🧇', '🥨',
    '🍱', '🍣', '🍤', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢',
    '☕', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂',
    '✈️', '🚀', '🚁', '🚢', '⛵', '🚤', '🛥️', '🛳️', '🚂', '🚃',
    '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚟',
    '🚠', '🚡', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔', '🚍',
    '🚘', '🚖', '🚗', '🚙', '🚚', '🚛', '🚜', '🏎️', '🚓', '🚑',
  ];

  // 새 카테고리 추가
  const addCategory = () => {
    // 최대 12개까지만 추가 가능
    if (localConfig.categories.length >= 12) {
      showError('카테고리는 최대 12개까지 추가할 수 있습니다.');
      return;
    }
    
    const newCategory = {
      id: `category-${Date.now()}`,
      enabled: true,
      icon: '🔗',
      text: '새 카테고리',
      pageName: 'NewCategoryPage',
      urlSlug: '/category/new',
      order: localConfig.categories.length + 1,
    };
    setLocalConfig({
      ...localConfig,
      categories: [...localConfig.categories, newCategory],
    });
  };
  // 카테고리 삭제
  const removeCategory = (id: string) => {
    setLocalConfig({
      ...localConfig,
      categories: localConfig.categories.filter(c => c.id !== id).map((c, idx) => ({
        ...c,
        order: idx + 1,
      })),
    });
  };

  // 순서 변경
  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const categories = [...localConfig.categories];
    if (direction === 'up' && index > 0) {
      [categories[index - 1], categories[index]] = [categories[index], categories[index - 1]];
      categories[index - 1].order = index;
      categories[index].order = index + 1;
    } else if (direction === 'down' && index < categories.length - 1) {
      [categories[index], categories[index + 1]] = [categories[index + 1], categories[index]];
      categories[index].order = index + 1;
      categories[index + 1].order = index + 2;
    }
    setLocalConfig({ ...localConfig, categories });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">카테고리 메뉴 설정</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <FiX size={20} />
        </button>
      </div>

      <div>
        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={localConfig.enabled}
            onChange={(e) => setLocalConfig({ ...localConfig, enabled: e.target.checked })}
            className="w-5 h-5"
          />
          <span className="font-semibold">메뉴 활성화</span>
        </label>
        <p className="text-xs text-gray-500 mt-2">
          • 체크 해제 시 카테고리 메뉴가 메인 페이지에 표시되지 않습니다.
        </p>
      </div>

      <div className="mb-4">
        <button
          onClick={addCategory}
          disabled={localConfig.categories.length >= 12}
          className={`w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
            localConfig.categories.length >= 12
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          <FiPlus size={18} />
          새 카테고리 추가 ({localConfig.categories.length}/12)
        </button>
        <p className="text-xs text-gray-500 mt-2">
          • 메인 페이지 상단에 표시될 카테고리 메뉴를 추가할 수 있습니다. (최대 12개)
        </p>
        {localConfig.categories.length >= 12 && (
          <p className="text-xs text-red-600 mt-1">
            ⚠️ 최대 12개까지 추가할 수 있습니다. 카테고리를 삭제한 후 다시 추가하세요.
          </p>
        )}
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {localConfig.categories
          .sort((a, b) => a.order - b.order)
          .map((category, idx) => (
            <div key={category.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800">카테고리 {idx + 1}</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => moveCategory(idx, 'up')}
                    disabled={idx === 0}
                    className="text-gray-600 hover:text-gray-800 disabled:opacity-30"
                    title="위로 이동"
                  >
                    <FiChevronUp size={18} />
                  </button>
                  <button
                    onClick={() => moveCategory(idx, 'down')}
                    disabled={idx === localConfig.categories.length - 1}
                    className="text-gray-600 hover:text-gray-800 disabled:opacity-30"
                    title="아래로 이동"
                  >
                    <FiChevronDown size={18} />
                  </button>
                  <button
                    onClick={() => removeCategory(category.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>

              {/* 활성화 여부 */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={category.enabled}
                    onChange={(e) => {
                      const updated = { ...localConfig };
                      updated.categories[idx].enabled = e.target.checked;
                      setLocalConfig(updated);
                    }}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-semibold">활성화</span>
                </label>
                <p className="text-xs text-gray-500 ml-7 mt-1">
                  • 체크 해제 시 이 카테고리가 메뉴에 표시되지 않습니다.
                </p>
              </div>

              {/* 아이콘 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  아이콘 (이모지 또는 이미지 URL)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={category.icon}
                    onChange={(e) => {
                      const updated = { ...localConfig };
                      updated.categories[idx].icon = e.target.value;
                      setLocalConfig(updated);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="🎯 또는 /images/icon.png"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(showEmojiPicker === category.id ? null : category.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    이모티콘 선택
                  </button>
                </div>
                
                {/* 이모티콘 선택 팝업 */}
                {showEmojiPicker === category.id && (
                  <div className="mt-2 p-4 border-2 border-gray-300 rounded-lg bg-white shadow-lg emoji-picker-container">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-700">이모티콘 선택 (100개)</span>
                      <button
                        onClick={() => setShowEmojiPicker(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FiX size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-10 gap-2 max-h-60 overflow-y-auto">
                      {emojiList.map((emoji, emojiIdx) => (
                        <button
                          key={emojiIdx}
                          type="button"
                          onClick={() => {
                            const updated = { ...localConfig };
                            updated.categories[idx].icon = emoji;
                            setLocalConfig(updated);
                            setShowEmojiPicker(null);
                          }}
                          className="p-2 text-2xl hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-300"
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-1">
                  • 이모지(예: 🎯) 또는 이미지 URL을 입력하세요. 이모지는 바로 표시되고, URL은 이미지로 표시됩니다.
                </p>
                {category.icon && (
                  <div className="mt-2 text-2xl">
                    {category.icon.startsWith('http') || category.icon.startsWith('/') ? (
                      <img src={category.icon} alt="아이콘" className="w-8 h-8 object-contain" />
                    ) : (
                      <span>{category.icon}</span>
                    )}
                  </div>
                )}
              </div>
              {/* 메뉴 텍스트 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  메뉴 텍스트 (사용자에게 보여질 이름)
                </label>
                <input
                  type="text"
                  value={category.text}
                  onChange={(e) => {
                    const updated = { ...localConfig };
                    updated.categories[idx].text = e.target.value;
                    setLocalConfig(updated);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 액티비티"
                />
                <p className="text-xs text-gray-500 mt-1">
                  • 메인 페이지 메뉴에 표시될 한글 이름을 입력하세요. 예: 액티비티, 클래스, 입장권
                </p>
              </div>

              {/* 페이지 이름 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  페이지 이름 (내부 관리용)
                </label>
                <input
                  type="text"
                  value={category.pageName}
                  onChange={(e) => {
                    const updated = { ...localConfig };
                    updated.categories[idx].pageName = e.target.value;
                    setLocalConfig(updated);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="예: ActivityPage"
                />
                <p className="text-xs text-gray-500 mt-1">
                  • 이 카테고리가 연결될 페이지의 내부 관리용 이름을 입력하세요. 영어로 작성하는 것을 권장합니다. 예: ActivityPage, ClassPage
                </p>
              </div>

              {/* 영어 주소 (URL Slug) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  영어 주소 (URL - 클릭 시 이동할 주소)
                </label>
                <input
                  type="text"
                  value={category.urlSlug}
                  onChange={(e) => {
                    const updated = { ...localConfig };
                    updated.categories[idx].urlSlug = e.target.value;
                    setLocalConfig(updated);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="/category/activity"
                />
                <p className="text-xs text-gray-500 mt-1">
                  • 메뉴를 클릭했을 때 이동할 페이지의 영어 주소(URL)를 입력하세요. 반드시 "/"로 시작해야 합니다. 예: /category/activity, /products/class
                </p>
                <p className="text-xs text-red-600 mt-1">
                  ⚠️ 주의: 올바른 형식이 아니면 링크가 작동하지 않습니다. 예: /category/activity (O), category/activity (X)
                </p>
              </div>
            </div>
          ))}
      </div>

      {localConfig.categories.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>추가된 카테고리가 없습니다.</p>
          <p className="text-xs mt-2">위의 "새 카테고리 추가" 버튼을 클릭하여 추가하세요.</p>
        </div>
      )}

      <button
        onClick={() => onUpdate(localConfig)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        적용하기
      </button>
    </div>
  );
}
// 프로모션 배너 편집기
function PromotionBannerEditor({
  config,
  onUpdate,
  onClose,
}: {
  config: PageConfig['promotionBanner'];
  onUpdate: (config: PageConfig['promotionBanner']) => void;
  onClose: () => void;
}) {
  const [localConfig, setLocalConfig] = useState(config);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">프로모션 배너 편집</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <FiX size={20} />
        </button>
      </div>

      <div>
        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={localConfig.enabled}
            onChange={(e) => setLocalConfig({ ...localConfig, enabled: e.target.checked })}
            className="w-5 h-5"
          />
          <span className="font-semibold">섹션 활성화</span>
        </label>
      </div>
      <button
        onClick={() => onUpdate(localConfig)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        적용하기
      </button>
    </div>
  );
}
// 상단 메뉴 편집기
function TopMenuEditor({
  config,
  onUpdate,
  onClose,
}: {
  config: PageConfig['topMenu'];
  onUpdate: (config: PageConfig['topMenu']) => void;
  onClose: () => void;
}) {
  const [localConfig, setLocalConfig] = useState(config);

  // 새 메뉴 항목 추가
  const addMenuItem = () => {
    const newItem = {
      id: `top-menu-${Date.now()}`,
      enabled: true,
      text: '새 메뉴',
      urlSlug: '/',
      order: localConfig.menuItems.length + 1,
      isButton: false,
      buttonColor: 'blue-600',
    };
    setLocalConfig({
      ...localConfig,
      menuItems: [...localConfig.menuItems, newItem],
    });
  };

  // 메뉴 항목 삭제
  const removeMenuItem = (id: string) => {
    setLocalConfig({
      ...localConfig,
      menuItems: localConfig.menuItems.filter(m => m.id !== id).map((m, idx) => ({
        ...m,
        order: idx + 1,
      })),
    });
  };

  // 순서 변경
  const moveMenuItem = (index: number, direction: 'up' | 'down') => {
    const items = [...localConfig.menuItems];
    if (direction === 'up' && index > 0) {
      [items[index - 1], items[index]] = [items[index], items[index - 1]];
      items[index - 1].order = index;
      items[index].order = index + 1;
    } else if (direction === 'down' && index < items.length - 1) {
      [items[index], items[index + 1]] = [items[index + 1], items[index]];
      items[index].order = index + 1;
      items[index + 1].order = index + 2;
    }
    setLocalConfig({ ...localConfig, menuItems: items });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">상단 메뉴 편집</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <FiX size={20} />
        </button>
      </div>

      <div>
        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={localConfig.enabled}
            onChange={(e) => setLocalConfig({ ...localConfig, enabled: e.target.checked })}
            className="w-5 h-5"
          />
          <span className="font-semibold">메뉴 활성화</span>
        </label>
        <p className="text-xs text-gray-500 mt-2">
          • 체크 해제 시 상단 메뉴가 메인 페이지에 표시되지 않습니다.
        </p>
      </div>

      {/* 로고 설정 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          로고 이미지 URL
        </label>
        <input
          type="text"
          value={localConfig.logoUrl || ''}
          onChange={(e) => setLocalConfig({ ...localConfig, logoUrl: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="/images/logo.png"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          로고 클릭 시 이동할 링크
        </label>
        <input
          type="text"
          value={localConfig.logoLink || ''}
          onChange={(e) => setLocalConfig({ ...localConfig, logoLink: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="/"
        />
      </div>

      {/* 환영 메시지 설정 */}
      <div>
        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={localConfig.welcomeMessage?.enabled || false}
            onChange={(e) => setLocalConfig({
              ...localConfig,
              welcomeMessage: {
                ...localConfig.welcomeMessage,
                enabled: e.target.checked,
                text: localConfig.welcomeMessage?.text || '{name}님 환영합니다!',
              } as any,
            })}
            className="w-5 h-5"
          />
          <span className="font-semibold">환영 메시지 활성화</span>
        </label>
        {localConfig.welcomeMessage?.enabled && (
          <div className="ml-7 space-y-2">
            <input
              type="text"
              value={localConfig.welcomeMessage.text || ''}
              onChange={(e) => setLocalConfig({
                ...localConfig,
                welcomeMessage: {
                  ...localConfig.welcomeMessage,
                  text: e.target.value,
                } as any,
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="{name}님 환영합니다!"
            />
          </div>
        )}
      </div>

      {/* 새 메뉴 항목 추가 버튼 */}
      <div>
        <button
          onClick={addMenuItem}
          className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600"
        >
          + 새 메뉴 항목 추가
        </button>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {localConfig.menuItems
          .sort((a, b) => a.order - b.order)
          .map((item, idx) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800">메뉴 항목 {idx + 1}</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => moveMenuItem(idx, 'up')}
                    disabled={idx === 0}
                    className="text-gray-600 hover:text-gray-800 disabled:opacity-30"
                    title="위로 이동"
                  >
                    <FiChevronUp size={18} />
                  </button>
                  <button
                    onClick={() => moveMenuItem(idx, 'down')}
                    disabled={idx === localConfig.menuItems.length - 1}
                    className="text-gray-600 hover:text-gray-800 disabled:opacity-30"
                    title="아래로 이동"
                  >
                    <FiChevronDown size={18} />
                  </button>
                  <button
                    onClick={() => removeMenuItem(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>

              {/* 활성화 여부 */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(e) => {
                      const updated = { ...localConfig };
                      updated.menuItems[idx].enabled = e.target.checked;
                      setLocalConfig(updated);
                    }}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-semibold">활성화</span>
                </label>
                <p className="text-xs text-gray-500 ml-7 mt-1">
                  • 체크 해제 시 이 메뉴 항목이 표시되지 않습니다.
                </p>
              </div>

              {/* 메뉴 텍스트 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  메뉴 텍스트
                </label>
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => {
                    const updated = { ...localConfig };
                    updated.menuItems[idx].text = e.target.value;
                    setLocalConfig(updated);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 우리끼리크루즈닷"
                />
                <p className="text-xs text-gray-500 mt-1">
                  • 메뉴에 표시될 텍스트를 입력하세요.
                </p>
              </div>

              {/* 영어 주소 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  영어 주소 (URL - 클릭 시 이동할 주소)
                </label>
                <input
                  type="text"
                  value={item.urlSlug}
                  onChange={(e) => {
                    const updated = { ...localConfig };
                    updated.menuItems[idx].urlSlug = e.target.value;
                    setLocalConfig(updated);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="/community"
                />
                <p className="text-xs text-gray-500 mt-1">
                  • 메뉴를 클릭했을 때 이동할 페이지의 영어 주소(URL)를 입력하세요. 반드시 "/"로 시작해야 합니다. 예: /community, /products
                </p>
                <p className="text-xs text-red-600 mt-1">
                  ⚠️ 주의: 올바른 형식이 아니면 링크가 작동하지 않습니다. 예: /community (O), community (X)
                </p>
              </div>

              {/* 버튼 스타일 여부 */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.isButton || false}
                    onChange={(e) => {
                      const updated = { ...localConfig };
                      updated.menuItems[idx].isButton = e.target.checked;
                      setLocalConfig(updated);
                    }}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-semibold">버튼 스타일 사용</span>
                </label>
                <p className="text-xs text-gray-500 ml-7 mt-1">
                  • 체크하면 메뉴 항목이 버튼 형태로 표시됩니다. 체크 해제하면 일반 텍스트 링크로 표시됩니다.
                </p>
              </div>

              {/* 버튼 색상 */}
              {item.isButton && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    버튼 색상
                  </label>
                  <select
                    value={item.buttonColor || 'blue-600'}
                    onChange={(e) => {
                      const updated = { ...localConfig };
                      updated.menuItems[idx].buttonColor = e.target.value;
                      setLocalConfig(updated);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="red-600">빨간색 (red-600)</option>
                    <option value="blue-600">파란색 (blue-600)</option>
                    <option value="green-600">초록색 (green-600)</option>
                    <option value="yellow-600">노란색 (yellow-600)</option>
                    <option value="purple-600">보라색 (purple-600)</option>
                    <option value="gray-600">회색 (gray-600)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    • 버튼의 배경색을 선택하세요. Tailwind CSS 색상 클래스를 사용합니다.
                  </p>
                </div>
              )}
            </div>
          ))}
      </div>

      {localConfig.menuItems.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>추가된 메뉴 항목이 없습니다.</p>
          <p className="text-xs mt-2">위의 "새 메뉴 항목 추가" 버튼을 클릭하여 추가하세요.</p>
        </div>
      )}

      <button
        onClick={() => onUpdate(localConfig)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        적용하기
      </button>
    </div>
  );
}
// 하단 푸터 편집기
function FooterEditor({
  config,
  onUpdate,
  onClose,
}: {
  config: PageConfig['footer'];
  onUpdate: (config: PageConfig['footer']) => void;
  onClose: () => void;
}) {
  const [localConfig, setLocalConfig] = useState(config);

  // 새 메뉴 항목 추가
  const addMenuItem = () => {
    const newItem = {
      id: `footer-menu-${Date.now()}`,
      enabled: true,
      text: '새 메뉴',
      urlSlug: '/',
      order: localConfig.menuItems.length + 1,
      isHighlight: false,
    };
    setLocalConfig({
      ...localConfig,
      menuItems: [...localConfig.menuItems, newItem],
    });
  };

  // 메뉴 항목 삭제
  const removeMenuItem = (id: string) => {
    setLocalConfig({
      ...localConfig,
      menuItems: localConfig.menuItems.filter(m => m.id !== id).map((m, idx) => ({
        ...m,
        order: idx + 1,
      })),
    });
  };

  // 순서 변경
  const moveMenuItem = (index: number, direction: 'up' | 'down') => {
    const items = [...localConfig.menuItems];
    if (direction === 'up' && index > 0) {
      [items[index - 1], items[index]] = [items[index], items[index - 1]];
      items[index - 1].order = index;
      items[index].order = index + 1;
    } else if (direction === 'down' && index < items.length - 1) {
      [items[index], items[index + 1]] = [items[index + 1], items[index]];
      items[index].order = index + 1;
      items[index + 1].order = index + 2;
    }
    setLocalConfig({ ...localConfig, menuItems: items });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">하단 푸터 설정</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <FiX size={20} />
        </button>
      </div>

      <div>
        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={localConfig.enabled}
            onChange={(e) => setLocalConfig({ ...localConfig, enabled: e.target.checked })}
            className="w-5 h-5"
          />
          <span className="font-semibold">푸터 활성화</span>
        </label>
        <p className="text-xs text-gray-500 mt-2">
          • 체크 해제 시 하단 푸터가 메인 페이지에 표시되지 않습니다.
        </p>
      </div>

      {/* 회사명 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          회사명
        </label>
        <input
          type="text"
          value={localConfig.companyName}
          onChange={(e) => setLocalConfig({ ...localConfig, companyName: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="예: 크루즈닷"
        />
        <p className="text-xs text-gray-500 mt-1">
          • 푸터에 표시될 회사명을 입력하세요.
        </p>
      </div>

      {/* 회사 정보 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          회사 정보 (주소, 사업자번호 등)
        </label>
        <textarea
          value={localConfig.companyInfo}
          onChange={(e) => setLocalConfig({ ...localConfig, companyInfo: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="상호: 크루즈닷 | 대표: 배연성 | 주소: 경기 화성시..."
        />
        <p className="text-xs text-gray-500 mt-1">
          • 회사 정보를 입력하세요. 여러 줄로 입력할 수 있으며, "|"로 구분하여 한 줄에 여러 정보를 표시할 수 있습니다.
        </p>
      </div>

      {/* 저작권 정보 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          저작권 정보
        </label>
        <input
          type="text"
          value={localConfig.copyright}
          onChange={(e) => setLocalConfig({ ...localConfig, copyright: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Copyright © 크루즈닷 All Rights Reserved."
        />
        <p className="text-xs text-gray-500 mt-1">
          • 푸터 하단에 표시될 저작권 정보를 입력하세요.
        </p>
      </div>

      {/* 연락처 정보 */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">연락처 정보</h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              전화번호
            </label>
            <input
              type="text"
              value={localConfig.contactInfo.phone || ''}
              onChange={(e) => setLocalConfig({
                ...localConfig,
                contactInfo: { ...localConfig.contactInfo, phone: e.target.value },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="010-3289-3800"
            />
            <p className="text-xs text-gray-500 mt-1">
              • 고객센터 전화번호를 입력하세요. 클릭 시 전화 앱이 열립니다.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              이메일
            </label>
            <input
              type="email"
              value={localConfig.contactInfo.email || ''}
              onChange={(e) => setLocalConfig({
                ...localConfig,
                contactInfo: { ...localConfig.contactInfo, email: e.target.value },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="hyeseon28@naver.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              • 고객센터 이메일 주소를 입력하세요. 클릭 시 이메일 앱이 열립니다.
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              카카오톡 상담 링크
            </label>
            <input
              type="text"
              value={localConfig.contactInfo.kakaoLink || ''}
              onChange={(e) => setLocalConfig({
                ...localConfig,
                contactInfo: { ...localConfig.contactInfo, kakaoLink: e.target.value },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="https://leadgeny.kr/i/yjo"
            />
            <p className="text-xs text-gray-500 mt-1">
              • 카카오톡 상담 버튼을 클릭했을 때 이동할 링크를 입력하세요. 전체 URL을 입력해야 합니다.
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              운영시간
            </label>
            <input
              type="text"
              value={localConfig.contactInfo.businessHours || ''}
              onChange={(e) => setLocalConfig({
                ...localConfig,
                contactInfo: { ...localConfig.contactInfo, businessHours: e.target.value },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="오전 9시 ~ 오후 5시 (공휴일 휴무)"
            />
            <p className="text-xs text-gray-500 mt-1">
              • 고객센터 운영시간을 입력하세요.
            </p>
          </div>
        </div>
      </div>

      {/* 푸터 메뉴 항목 */}
      <div className="border-t pt-4">
        <div className="mb-4">
          <button
            onClick={addMenuItem}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <FiPlus size={18} />
            새 메뉴 항목 추가
          </button>
          <p className="text-xs text-gray-500 mt-2">
            • 푸터 하단에 표시될 메뉴 항목을 추가할 수 있습니다. (예: 공지사항, 이용약관 등)
          </p>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {localConfig.menuItems
            .sort((a, b) => a.order - b.order)
            .map((item, idx) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-800">메뉴 항목 {idx + 1}</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => moveMenuItem(idx, 'up')}
                      disabled={idx === 0}
                      className="text-gray-600 hover:text-gray-800 disabled:opacity-30"
                      title="위로 이동"
                    >
                      <FiChevronUp size={18} />
                    </button>
                    <button
                      onClick={() => moveMenuItem(idx, 'down')}
                      disabled={idx === localConfig.menuItems.length - 1}
                      className="text-gray-600 hover:text-gray-800 disabled:opacity-30"
                      title="아래로 이동"
                    >
                      <FiChevronDown size={18} />
                    </button>
                    <button
                      onClick={() => removeMenuItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* 활성화 여부 */}
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(e) => {
                        const updated = { ...localConfig };
                        updated.menuItems[idx].enabled = e.target.checked;
                        setLocalConfig(updated);
                      }}
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-semibold">활성화</span>
                  </label>
                  <p className="text-xs text-gray-500 ml-7 mt-1">
                    • 체크 해제 시 이 메뉴 항목이 표시되지 않습니다.
                  </p>
                </div>

                {/* 메뉴 텍스트 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    메뉴 텍스트
                  </label>
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => {
                      const updated = { ...localConfig };
                      updated.menuItems[idx].text = e.target.value;
                      setLocalConfig(updated);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 공지사항"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    • 메뉴에 표시될 텍스트를 입력하세요.
                  </p>
                </div>

                {/* 영어 주소 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    영어 주소 (URL - 클릭 시 이동할 주소)
                  </label>
                  <input
                    type="text"
                    value={item.urlSlug}
                    onChange={(e) => {
                      const updated = { ...localConfig };
                      updated.menuItems[idx].urlSlug = e.target.value;
                      setLocalConfig(updated);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="/support/notice"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    • 메뉴를 클릭했을 때 이동할 페이지의 영어 주소(URL)를 입력하세요. 반드시 "/"로 시작해야 합니다. 예: /support/notice, /terms/0
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ 주의: 올바른 형식이 아니면 링크가 작동하지 않습니다. 예: /support/notice (O), support/notice (X)
                  </p>
                </div>

                {/* 강조 표시 여부 */}
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.isHighlight || false}
                      onChange={(e) => {
                        const updated = { ...localConfig };
                        updated.menuItems[idx].isHighlight = e.target.checked;
                        setLocalConfig(updated);
                      }}
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-semibold">강조 표시</span>
                  </label>
                  <p className="text-xs text-gray-500 ml-7 mt-1">
                    • 체크하면 이 메뉴 항목이 흰색 굵은 글씨로 강조 표시됩니다. (예: 개인정보처리방침)
                  </p>
                </div>
              </div>
            ))}
        </div>

        {localConfig.menuItems.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p>추가된 메뉴 항목이 없습니다.</p>
            <p className="text-xs mt-2">위의 "새 메뉴 항목 추가" 버튼을 클릭하여 추가하세요.</p>
          </div>
        )}
      </div>

      <button
        onClick={() => onUpdate(localConfig)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        적용하기
      </button>
    </div>
  );
}
// 메인몰 전역 설정 편집기
function GlobalSettingsEditor({
  config,
  onUpdate,
  onClose,
}: {
  config: PageConfig['globalSettings'];
  onUpdate: (config: PageConfig['globalSettings']) => void;
  onClose: () => void;
}) {
  const [localConfig, setLocalConfig] = useState(config);
  const [uploading, setUploading] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState<{ type: 'image' | 'emoji'; bannerType?: string } | null>(null);

  // 체크 표시 이모티콘 옵션
  const checkmarkIcons = [
    { value: '✓', label: '체크 표시' },
    { value: '✅', label: '체크 마크' },
    { value: '✔', label: '체크' },
    { value: '⭐', label: '별' },
    { value: '❤️', label: '하트' },
    { value: '💚', label: '초록 하트' },
    { value: '💙', label: '파란 하트' },
    { value: '💛', label: '노란 하트' },
    { value: '💜', label: '보라 하트' },
    { value: '🔵', label: '파란 원' },
    { value: '🟢', label: '초록 원' },
    { value: '🟡', label: '노란 원' },
    { value: '🟣', label: '보라 원' },
    { value: '🔴', label: '빨간 원' },
    { value: '⚫', label: '검은 원' },
  ];

  // 이미지 업로드 핸들러
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, bannerType: 'heroBanner' | 'promotionBanner' | 'categoryBanner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(bannerType);
    try {
      // 여기에 이미지 업로드 로직 추가
      // 임시로 파일 URL 사용
      const imageUrl = URL.createObjectURL(file);
      setLocalConfig({
        ...localConfig,
        banners: {
          ...localConfig.banners,
          [bannerType]: imageUrl,
        },
      });
    } catch (error) {
      console.error('Image upload failed:', error);
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">메인몰 전역 설정</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <FiX size={20} />
        </button>
      </div>

      {/* 배너 이미지 설정 */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">배너 이미지 설정</h4>
        
        {/* 히어로 배너 */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            히어로 배너 이미지
          </label>
          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'heroBanner')}
              className="hidden"
              id="hero-banner-upload"
              disabled={uploading === 'heroBanner'}
            />
            <label
              htmlFor="hero-banner-upload"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-center text-sm"
            >
              {uploading === 'heroBanner' ? '업로드 중...' : '이미지 업로드'}
            </label>
            <button
              onClick={() => setShowGallery({ type: 'image', bannerType: 'heroBanner' })}
              className="flex-1 px-4 py-2 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-center text-sm flex items-center justify-center gap-2"
            >
              <FiFolder size={16} />
              이미지 불러오기
            </button>
            {localConfig.banners.heroBanner && (
              <div className="flex-1">
                <img src={localConfig.banners.heroBanner} alt="히어로 배너" className="max-h-20 object-contain" />
                <button
                  onClick={() => setLocalConfig({
                    ...localConfig,
                    banners: { ...localConfig.banners, heroBanner: '' },
                  })}
                  className="text-xs text-red-600 mt-1"
                >
                  제거
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            • 메인 페이지 상단에 표시될 히어로 배너 이미지를 업로드하거나 저장된 이미지를 불러올 수 있습니다.
          </p>
        </div>

        {/* 프로모션 배너 */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            프로모션 배너 이미지
          </label>
          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'promotionBanner')}
              className="hidden"
              id="promotion-banner-upload"
              disabled={uploading === 'promotionBanner'}
            />
            <label
              htmlFor="promotion-banner-upload"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-center text-sm"
            >
              {uploading === 'promotionBanner' ? '업로드 중...' : '이미지 업로드'}
            </label>
            <button
              onClick={() => setShowGallery({ type: 'image', bannerType: 'promotionBanner' })}
              className="flex-1 px-4 py-2 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-center text-sm flex items-center justify-center gap-2"
            >
              <FiFolder size={16} />
              이미지 불러오기
            </button>
            {localConfig.banners.promotionBanner && (
              <div className="flex-1">
                <img src={localConfig.banners.promotionBanner} alt="프로모션 배너" className="max-h-20 object-contain" />
                <button
                  onClick={() => setLocalConfig({
                    ...localConfig,
                    banners: { ...localConfig.banners, promotionBanner: '' },
                  })}
                  className="text-xs text-red-600 mt-1"
                >
                  제거
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            • 프로모션 섹션에 표시될 배너 이미지를 업로드하거나 저장된 이미지를 불러올 수 있습니다.
          </p>
        </div>

        {/* 카테고리 배너 */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            카테고리 배너 이미지
          </label>
          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'categoryBanner')}
              className="hidden"
              id="category-banner-upload"
              disabled={uploading === 'categoryBanner'}
            />
            <label
              htmlFor="category-banner-upload"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-center text-sm"
            >
              {uploading === 'categoryBanner' ? '업로드 중...' : '이미지 업로드'}
            </label>
            <button
              onClick={() => setShowGallery({ type: 'image', bannerType: 'categoryBanner' })}
              className="flex-1 px-4 py-2 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-center text-sm flex items-center justify-center gap-2"
            >
              <FiFolder size={16} />
              이미지 불러오기
            </button>
            {localConfig.banners.categoryBanner && (
              <div className="flex-1">
                <img src={localConfig.banners.categoryBanner} alt="카테고리 배너" className="max-h-20 object-contain" />
                <button
                  onClick={() => setLocalConfig({
                    ...localConfig,
                    banners: { ...localConfig.banners, categoryBanner: '' },
                  })}
                  className="text-xs text-red-600 mt-1"
                >
                  제거
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            • 카테고리 섹션에 표시될 배너 이미지를 업로드하거나 저장된 이미지를 불러올 수 있습니다.
          </p>
        </div>
      </div>

      {/* 이모티콘 설정 */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">체크 표시 이모티콘 설정</h4>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            V 표시 대신 사용할 이모티콘 선택
          </label>
          <div className="grid grid-cols-5 gap-2">
            {checkmarkIcons.map((icon) => (
              <button
                key={icon.value}
                onClick={() => setLocalConfig({ ...localConfig, checkmarkIcon: icon.value })}
                className={`p-3 border-2 rounded-lg text-2xl hover:bg-gray-50 transition-colors ${
                  localConfig.checkmarkIcon === icon.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                title={icon.label}
              >
                {icon.value}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            • 체크 표시(V) 대신 사용할 이모티콘을 선택하세요. 위의 이모티콘 중 하나를 클릭하면 선택됩니다.
          </p>
          <div className="mt-2 p-2 bg-gray-50 rounded text-center">
            <span className="text-2xl">현재 선택: {localConfig.checkmarkIcon}</span>
          </div>
        </div>
      </div>

      {/* 버튼 색상 설정 */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">버튼 기본 색상 설정</h4>
        
        {/* 기본 버튼 색상 */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              기본 버튼 배경색
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={localConfig.buttonColors.primary}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  buttonColors: { ...localConfig.buttonColors, primary: e.target.value },
                })}
                className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={localConfig.buttonColors.primary}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  buttonColors: { ...localConfig.buttonColors, primary: e.target.value },
                })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="#1e40af"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              • 기본 버튼의 배경색을 선택하세요. 색상 선택기에서 선택하거나 직접 색상 코드(#000000 형식)를 입력할 수 있습니다.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              기본 버튼 글씨색
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={localConfig.buttonColors.primaryText}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  buttonColors: { ...localConfig.buttonColors, primaryText: e.target.value },
                })}
                className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={localConfig.buttonColors.primaryText}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  buttonColors: { ...localConfig.buttonColors, primaryText: e.target.value },
                })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="#ffffff"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              • 기본 버튼의 글씨색을 선택하세요.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              보조 버튼 배경색
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={localConfig.buttonColors.secondary}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  buttonColors: { ...localConfig.buttonColors, secondary: e.target.value },
                })}
                className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={localConfig.buttonColors.secondary}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  buttonColors: { ...localConfig.buttonColors, secondary: e.target.value },
                })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="#6b7280"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              • 보조 버튼의 배경색을 선택하세요.
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              보조 버튼 글씨색
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={localConfig.buttonColors.secondaryText}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  buttonColors: { ...localConfig.buttonColors, secondaryText: e.target.value },
                })}
                className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={localConfig.buttonColors.secondaryText}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  buttonColors: { ...localConfig.buttonColors, secondaryText: e.target.value },
                })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="#ffffff"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              • 보조 버튼의 글씨색을 선택하세요.
            </p>
          </div>

          {/* 색상 미리보기 */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-semibold text-gray-700 mb-2">색상 미리보기</p>
            <div className="flex gap-2">
              <button
                style={{
                  backgroundColor: localConfig.buttonColors.primary,
                  color: localConfig.buttonColors.primaryText,
                }}
                className="px-4 py-2 rounded-lg font-semibold"
              >
                기본 버튼
              </button>
              <button
                style={{
                  backgroundColor: localConfig.buttonColors.secondary,
                  color: localConfig.buttonColors.secondaryText,
                }}
                className="px-4 py-2 rounded-lg font-semibold"
              >
                보조 버튼
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => onUpdate(localConfig)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        적용하기
      </button>

      {/* 파일 갤러리 모달 */}
      {showGallery && (
        <FileGallery
          type={showGallery.type}
          currentUrl={localConfig.banners[showGallery.bannerType]}
          onSelect={(url) => {
            setLocalConfig({
              ...localConfig,
              banners: {
                ...localConfig.banners,
                [showGallery.bannerType]: url,
              },
            });
            setShowGallery(null);
          }}
          onClose={() => setShowGallery(null)}
        />
      )}
    </div>
  );
}
function ProductMenuBarEditor({
  config,
  onUpdate,
  onClose,
}: {
  config: PageConfig['productMenuBar'];
  onUpdate: (config: PageConfig['productMenuBar']) => void;
  onClose: () => void;
}) {
  const [localConfig, setLocalConfig] = useState(config);

  // 새 메뉴 항목 추가
  const addMenuItem = () => {
    const newItem = {
      id: `product-menu-${Date.now()}`,
      enabled: true,
      text: '새 메뉴',
      icon: '🔗',
      urlSlug: '/',
      order: localConfig.menuItems.length + 1,
    };
    setLocalConfig({
      ...localConfig,
      menuItems: [...localConfig.menuItems, newItem],
    });
  };

  // 메뉴 항목 삭제
  const removeMenuItem = (id: string) => {
    setLocalConfig({
      ...localConfig,
      menuItems: localConfig.menuItems.filter(m => m.id !== id).map((m, idx) => ({
        ...m,
        order: idx + 1,
      })),
    });
  };

  // 순서 변경
  const moveMenuItem = (index: number, direction: 'up' | 'down') => {
    const items = [...localConfig.menuItems];
    if (direction === 'up' && index > 0) {
      [items[index - 1], items[index]] = [items[index], items[index - 1]];
      items[index - 1].order = index;
      items[index].order = index + 1;
    } else if (direction === 'down' && index < items.length - 1) {
      [items[index], items[index + 1]] = [items[index + 1], items[index]];
      items[index].order = index + 1;
      items[index + 1].order = index + 2;
    }
    setLocalConfig({ ...localConfig, menuItems: items });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">상품 메뉴바 설정</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <FiX size={20} />
        </button>
      </div>

      <div>
        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={localConfig.enabled}
            onChange={(e) => setLocalConfig({ ...localConfig, enabled: e.target.checked })}
            className="w-5 h-5"
          />
          <span className="font-semibold">메뉴바 활성화</span>
        </label>
        <p className="text-xs text-gray-500 mt-2">
          • 체크 해제 시 상품 메뉴바가 표시되지 않습니다.
        </p>
      </div>

      {/* 위치 설정 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          메뉴바 위치
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="position"
              value="bottom"
              checked={localConfig.position === 'bottom'}
              onChange={(e) => setLocalConfig({ ...localConfig, position: e.target.value as 'bottom' | 'top' })}
              className="w-5 h-5"
            />
            <span>하단</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="position"
              value="top"
              checked={localConfig.position === 'top'}
              onChange={(e) => setLocalConfig({ ...localConfig, position: e.target.value as 'bottom' | 'top' })}
              className="w-5 h-5"
            />
            <span>상단</span>
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          • 메뉴바를 화면 하단에 표시할지 상단에 표시할지 선택하세요. 하단이 일반적입니다.
        </p>
        <div className="mt-2 p-3 bg-gray-50 rounded text-center text-sm">
          {localConfig.position === 'bottom' ? '📱 하단에 표시됩니다' : '⬆️ 상단에 표시됩니다'}
        </div>
      </div>
      <div className="mb-4">
        <button
          onClick={addMenuItem}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
        >
          <FiPlus size={18} />
          새 메뉴 항목 추가
        </button>
        <p className="text-xs text-gray-500 mt-2">
          • 상품 메뉴바에 표시될 메뉴 항목을 추가할 수 있습니다.
        </p>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto">
        {localConfig.menuItems
          .sort((a, b) => a.order - b.order)
          .map((item, idx) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800">메뉴 항목 {idx + 1}</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => moveMenuItem(idx, 'up')}
                    disabled={idx === 0}
                    className="text-gray-600 hover:text-gray-800 disabled:opacity-30"
                    title="위로 이동"
                  >
                    <FiChevronUp size={18} />
                  </button>
                  <button
                    onClick={() => moveMenuItem(idx, 'down')}
                    disabled={idx === localConfig.menuItems.length - 1}
                    className="text-gray-600 hover:text-gray-800 disabled:opacity-30"
                    title="아래로 이동"
                  >
                    <FiChevronDown size={18} />
                  </button>
                  <button
                    onClick={() => removeMenuItem(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>

              {/* 활성화 여부 */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(e) => {
                      const updated = { ...localConfig };
                      updated.menuItems[idx].enabled = e.target.checked;
                      setLocalConfig(updated);
                    }}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-semibold">활성화</span>
                </label>
                <p className="text-xs text-gray-500 ml-7 mt-1">
                  • 체크 해제 시 이 메뉴 항목이 표시되지 않습니다.
                </p>
              </div>

              {/* 아이콘 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  아이콘 (이모지)
                </label>
                <input
                  type="text"
                  value={item.icon || ''}
                  onChange={(e) => {
                    const updated = { ...localConfig };
                    updated.menuItems[idx].icon = e.target.value;
                    setLocalConfig(updated);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-2xl"
                  placeholder="🏠"
                />
                <p className="text-xs text-gray-500 mt-1">
                  • 메뉴 항목에 표시될 이모지를 입력하세요. 예: 🏠, 🛳️, 💬, 👤
                </p>
                {item.icon && (
                  <div className="mt-2 text-3xl text-center">
                    {item.icon}
                  </div>
                )}
              </div>

              {/* 메뉴 텍스트 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  메뉴 텍스트
                </label>
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => {
                    const updated = { ...localConfig };
                    updated.menuItems[idx].text = e.target.value;
                    setLocalConfig(updated);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 홈"
                />
                <p className="text-xs text-gray-500 mt-1">
                  • 메뉴에 표시될 텍스트를 입력하세요.
                </p>
              </div>

              {/* 영어 주소 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  영어 주소 (URL - 클릭 시 이동할 주소)
                </label>
                <input
                  type="text"
                  value={item.urlSlug}
                  onChange={(e) => {
                    const updated = { ...localConfig };
                    updated.menuItems[idx].urlSlug = e.target.value;
                    setLocalConfig(updated);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="/"
                />
                <p className="text-xs text-gray-500 mt-1">
                  • 메뉴를 클릭했을 때 이동할 페이지의 영어 주소(URL)를 입력하세요. 반드시 "/"로 시작해야 합니다. 예: /, /products
                </p>
                <p className="text-xs text-red-600 mt-1">
                  ⚠️ 주의: 올바른 형식이 아니면 링크가 작동하지 않습니다. 예: /products (O), products (X)
                </p>
              </div>
            </div>
          ))}
      </div>

      {localConfig.menuItems.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>추가된 메뉴 항목이 없습니다.</p>
          <p className="text-xs mt-2">위의 "새 메뉴 항목 추가" 버튼을 클릭하여 추가하세요.</p>
        </div>
      )}

      <button
        onClick={() => onUpdate(localConfig)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        적용하기
      </button>
    </div>
  );
}