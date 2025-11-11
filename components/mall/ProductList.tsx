// components/mall/ProductList.tsx
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import Image from 'next/image';
import ProductCard from './ProductCard';
import cruiseShipsData from '@/data/cruise_ships.json';
import { normalize } from '@/utils/normalize';
import { FiYoutube } from 'react-icons/fi'; // Added FiYoutube import

interface Product {
  id: number;
  productCode: string;
  cruiseLine: string;
  shipName: string;
  packageName: string;
  nights: number;
  days: number;
  basePrice: number | null;
  source: string | null;
  destination?: any;
  itineraryPattern?: any; // 일정 패턴 (JSON)
  rating?: number;
  reviewCount?: number;
  isPopular?: boolean;
  isRecommended?: boolean;
  isPremium?: boolean;
  isGeniePack?: boolean;
  isDomestic?: boolean;
  isJapan?: boolean;
  isBudget?: boolean;
}

interface MallSettings {
  'popular-banner'?: {
    title: string;
    buttons: Array<{ text: string; icon: string }>;
    rightBadge: { topText: string; bottomText: string };
  };
  'recommended-banner'?: {
    title: string;
    buttons: Array<{ text: string; icon: string }>;
    rightBadge: { topText: string; bottomText: string };
  };
  'product-display-settings'?: {
    popularRows: number;
    recommendedRows: number;
  };
  'menu-bar-settings'?: {
    filters: Array<{ value: string; label: string; enabled: boolean }>;
  };
  'recommended-below-settings'?: {
    type: 'none' | 'banner' | 'products';
    banner: { image: string; title: string; link: string };
    products: { count: number; category: string };
  };
}

// 기본 필터 옵션 (설정이 없을 때 사용)
const DEFAULT_REGION_FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'japan', label: '일본' },
  { value: 'southeast-asia', label: '동남아' },
  { value: 'singapore', label: '싱가포르' },
  { value: 'western-mediterranean', label: '서부지중해' },
  { value: 'eastern-mediterranean', label: '동부지중해' },
  { value: 'alaska', label: '알래스카' },
];

type PartnerContext = {
  mallUserId: string;
  profileTitle?: string | null;
  landingAnnouncement?: string | null;
  welcomeMessage?: string | null;
  profileImage?: string | null;
  coverImage?: string | null;
};

type ProductListProps = {
  partnerContext?: PartnerContext | null;
};

export default function ProductList({ partnerContext = null }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<MallSettings>({});
  const [filters, setFilters] = useState({
    region: 'all', // 나라별 필터
    type: 'all', // 'all', 'popular', 'recommended'
    sort: 'newest', // 'newest', 'price_asc', 'price_desc', 'popular'
    cruiseLine: 'all', // 크루즈 라인 필터
    shipName: 'all', // 선박명 필터
  });
  
  // 크루즈 라인/선박명 검색 상태
  const [cruiseLineSearchTerm, setCruiseLineSearchTerm] = useState('');
  const [cruiseLineDropdownOpen, setCruiseLineDropdownOpen] = useState(false);
  const [shipNameSearchTerm, setShipNameSearchTerm] = useState('');
  const [shipNameDropdownOpen, setShipNameDropdownOpen] = useState(false);
  const cruiseLineDropdownRef = useRef<HTMLDivElement>(null);
  const shipNameDropdownRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const popularScrollRef = useRef<HTMLDivElement>(null);
  const recommendedScrollRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [belowProducts, setBelowProducts] = useState<Product[]>([]);
  const [shouldScrollToProducts, setShouldScrollToProducts] = useState(false);
  const [availableRegions, setAvailableRegions] = useState<Set<string>>(new Set(['all'])); // 판매 중인 상품이 있는 지역

  const isPartnerMall = Boolean(partnerContext && partnerContext.mallUserId);
  const partnerProfileTitle = partnerContext?.profileTitle 
    ? String(partnerContext.profileTitle).trim()
    : partnerContext?.mallUserId 
    ? `${partnerContext.mallUserId} 파트너몰` 
    : '크루즈닷 파트너몰';
  const partnerAnnouncement = partnerContext?.landingAnnouncement 
    ? String(partnerContext.landingAnnouncement).trim() 
    : '';
  const partnerWelcome = partnerContext?.welcomeMessage 
    ? String(partnerContext.welcomeMessage).trim() 
    : '';
  const partnerId = partnerContext?.mallUserId || undefined;
  // 크루즈선사 목록 생성 (한국어 이름을 value로 사용)
  const cruiseLineOptions = useMemo(() => {
    const options: Array<{ value: string; label: string }> = [];
    (cruiseShipsData as any[]).forEach((line) => {
      const cruiseLineShort = line.cruise_line.split('(')[0].trim(); // 한국어 이름
      options.push({
        value: cruiseLineShort, // 한국어 이름을 value로 사용
        label: cruiseLineShort
      });
    });
    return options;
  }, []);

  // 선택된 크루즈선사에 해당하는 크루즈선 목록 (한국어 이름을 value로 사용)
  const shipNameOptions = useMemo(() => {
    if (!filters.cruiseLine || filters.cruiseLine === 'all') return [];
    
    const selectedLine = (cruiseShipsData as any[]).find((line) => {
      const cruiseLineShort = line.cruise_line.split('(')[0].trim();
      return cruiseLineShort === filters.cruiseLine;
    });

    if (!selectedLine) return [];

    const options: Array<{ value: string; label: string }> = [];
    selectedLine.ships.forEach((ship: string) => {
      const shipNameShort = ship.split('(')[0].trim(); // 한국어 이름
      
      let displayLabel = shipNameShort;
      const cruiseLineKeywords = selectedLine.cruise_line.split('(')[0].trim().split(' ').filter((word: string) => word.length > 1);
      const hasCruiseLineInShipName = cruiseLineKeywords.some((keyword: string) => 
        shipNameShort.includes(keyword)
      );
      
      if (!hasCruiseLineInShipName) {
        const simpleCruiseLine = cruiseLineKeywords[0] || selectedLine.cruise_line.split('(')[0].trim();
        displayLabel = `${simpleCruiseLine} ${shipNameShort}`;
      }

      options.push({
        value: shipNameShort, // 한국어 이름을 value로 사용
        label: displayLabel
      });
    });
    return options;
  }, [filters.cruiseLine]);

  // 필터링된 크루즈선사 옵션 (한국어 검색)
  const filteredCruiseLineOptions = useMemo(() => {
    if (!cruiseLineSearchTerm.trim()) {
      return cruiseLineOptions.slice(0, 50);
    }
    const term = normalize(cruiseLineSearchTerm);
    return cruiseLineOptions.filter(option => 
      normalize(option.label).includes(term) || normalize(option.value).includes(term)
    ).slice(0, 50);
  }, [cruiseLineSearchTerm, cruiseLineOptions]);

  // 필터링된 크루즈선 이름 옵션 (한국어 검색)
  const filteredShipNameOptions = useMemo(() => {
    if (!shipNameSearchTerm.trim()) {
      return shipNameOptions.slice(0, 50);
    }
    const term = normalize(shipNameSearchTerm);
    return shipNameOptions.filter(option => 
      normalize(option.label).includes(term) || normalize(option.value).includes(term)
    ).slice(0, 50);
  }, [shipNameSearchTerm, shipNameOptions]);

  // 선택된 크루즈선사 라벨
  const selectedCruiseLineLabel = useMemo(() => {
    if (filters.cruiseLine === 'all') return '';
    const option = cruiseLineOptions.find(opt => opt.value === filters.cruiseLine);
    return option?.label || filters.cruiseLine || '';
  }, [filters.cruiseLine, cruiseLineOptions]);

  // 선택된 크루즈선 이름 라벨
  const selectedShipNameLabel = useMemo(() => {
    if (filters.shipName === 'all') return '';
    const option = shipNameOptions.find(opt => opt.value === filters.shipName);
    return option?.label || filters.shipName || '';
  }, [filters.shipName, shipNameOptions]);

  // 크루즈 라인 선택 핸들러
  const handleCruiseLineSelect = (value: string) => {
    setFilters({ ...filters, cruiseLine: value, shipName: 'all' }); // 크루즈선사 변경 시 크루즈선 이름 초기화
    setCruiseLineSearchTerm('');
    setCruiseLineDropdownOpen(false);
    setPage(1);
  };

  // 선박명 선택 핸들러
  const handleShipNameSelect = (value: string) => {
    setFilters({ ...filters, shipName: value });
    setShipNameSearchTerm('');
    setShipNameDropdownOpen(false);
    setPage(1);
  };

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cruiseLineDropdownRef.current && !cruiseLineDropdownRef.current.contains(event.target as Node)) {
        setCruiseLineDropdownOpen(false);
      }
      if (shipNameDropdownRef.current && !shipNameDropdownRef.current.contains(event.target as Node)) {
        setShipNameDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // 비디오 자동 재생 설정
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.log('Video autoplay failed:', error);
      });
    }
  }, []);

  useEffect(() => {
    // 설정 불러오기
    loadSettings();
    // 판매 중인 상품이 있는 지역 확인
    loadAvailableRegions();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [filters, page]);

  useEffect(() => {
    // 필터 변경 시 상품 목록으로 스크롤
    if (shouldScrollToProducts && filters.region !== 'all') {
      setTimeout(() => {
        const productSection = document.getElementById('products');
        if (productSection) {
          productSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setShouldScrollToProducts(false);
      }, 300);
    }
  }, [shouldScrollToProducts, filters.region]);

  useEffect(() => {
    // 설정이 로드되고 추천크루즈 밑 상품 설정이 있으면 추가 상품 로드
    if (settings['recommended-below-settings']?.type === 'products') {
      loadBelowProducts();
    }
  }, [settings]);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/public/mall-settings');
      const data = await response.json();
      if (data.ok && data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // 설정 로드 실패 시 기본값 사용
    }
  };

  // 판매 중인 상품이 있는 지역 확인
  const loadAvailableRegions = async () => {
    try {
      // 모든 상품을 가져와서 지역별로 상품이 있는지 확인
      const response = await fetch('/api/public/products?limit=1000');
      const data = await response.json();
      
      if (data.ok && Array.isArray(data.products)) {
        const regions = new Set<string>(['all']); // '전체'는 항상 포함
        
        // 각 지역별로 상품이 있는지 확인
        const regionMap: Record<string, string[]> = {
          'japan': ['JP', 'Japan', '일본'],
          'southeast-asia': ['TH', 'Thailand', '태국', 'VN', 'Vietnam', '베트남', 'MY', 'Malaysia', '말레이시아'],
          'singapore': ['SG', 'Singapore', '싱가포르'],
          'western-mediterranean': ['ES', 'Spain', '스페인', 'FR', 'France', '프랑스', 'IT', 'Italy', '이탈리아'],
          'eastern-mediterranean': ['GR', 'Greece', '그리스', 'TR', 'Turkey', '터키'],
          'alaska': ['US', 'USA', '미국', 'Alaska', '알래스카'],
        };
        
        data.products.forEach((product: Product) => {
          if (!product.itineraryPattern || !Array.isArray(product.itineraryPattern)) {
            return;
          }
          
          // 각 지역별로 상품이 있는지 확인
          Object.entries(regionMap).forEach(([regionKey, keywords]) => {
            const hasRegion = product.itineraryPattern.some((item: any) => {
              if (typeof item === 'object' && item.country) {
                const country = item.country.toString().toUpperCase();
                return keywords.some(keyword => country.includes(keyword.toUpperCase()));
              }
              return false;
            });
            
            if (hasRegion) {
              regions.add(regionKey);
            }
          });
        });
        
        setAvailableRegions(regions);
      }
    } catch (error) {
      console.error('Failed to load available regions:', error);
      // 실패 시 기본값 사용 (전체만 표시)
      setAvailableRegions(new Set(['all']));
    }
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

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sort: filters.sort,
      });

      if (filters.region !== 'all') {
        params.append('region', filters.region);
      }
      
      if (filters.cruiseLine !== 'all') {
        params.append('cruiseLine', filters.cruiseLine);
      }
      
      if (filters.shipName !== 'all') {
        params.append('shipName', filters.shipName);
      }

      const response = await fetch(`/api/public/products?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || '상품 목록을 불러올 수 없습니다.');
      }

      const productsWithFlags = data.products.map((p: any) => {
        const {
          MallProductContent,
          mallProductContent: existingMallContent,
          ...rest
        } = p;

        const mallContent = existingMallContent ?? MallProductContent ?? null;
        const popular = Boolean(p.isPopular);
        const recommended = Boolean(p.isRecommended);
        const premium = Boolean(p.isPremium);
        const geniePack = Boolean(p.isGeniePack);
        const domestic = Boolean(p.isDomestic);
        const japan = Boolean(p.isJapan);
        const budget = Boolean(p.isBudget);

        const layout = mallContent?.layout
          ? (typeof mallContent.layout === 'string'
              ? JSON.parse(mallContent.layout)
              : mallContent.layout)
          : null;
        const rating = layout?.rating || p.rating || 4.0 + Math.random() * 1.0;
        const reviewCount = layout?.reviewCount || p.reviewCount || Math.floor(Math.random() * 500) + 50;

        return {
          ...rest,
          mallProductContent: mallContent,
          rating,
          reviewCount,
          isPopular: popular,
          isRecommended: recommended,
          isPremium: premium,
          isGeniePack: geniePack,
          isDomestic: domestic,
          isJapan: japan,
          isBudget: budget,
        } as Product;
      });

      let filteredProducts = productsWithFlags;
      if (filters.type === 'popular') {
        filteredProducts = productsWithFlags.filter((p) => p.isPopular);
      } else if (filters.type === 'recommended') {
        filteredProducts = productsWithFlags.filter((p) => p.isRecommended);
      }

      setProducts(filteredProducts);
      setTotalPages(data.pagination?.totalPages || 1);
      
      // 상품이 로드되면 지역 정보 업데이트
      updateAvailableRegions(filteredProducts);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError(err instanceof Error ? err.message : '상품 목록을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 상품 목록에서 판매 중인 지역 확인
  const updateAvailableRegions = (products: Product[]) => {
    const regions = new Set<string>(['all']); // '전체'는 항상 포함
    
    const regionMap: Record<string, string[]> = {
      'japan': ['JP', 'Japan', '일본'],
      'southeast-asia': ['TH', 'Thailand', '태국', 'VN', 'Vietnam', '베트남', 'MY', 'Malaysia', '말레이시아'],
      'singapore': ['SG', 'Singapore', '싱가포르'],
      'western-mediterranean': ['ES', 'Spain', '스페인', 'FR', 'France', '프랑스', 'IT', 'Italy', '이탈리아'],
      'eastern-mediterranean': ['GR', 'Greece', '그리스', 'TR', 'Turkey', '터키'],
      'alaska': ['US', 'USA', '미국', 'Alaska', '알래스카'],
    };
    
    products.forEach((product) => {
      if (!product.itineraryPattern || !Array.isArray(product.itineraryPattern)) {
        return;
      }
      
      // 각 지역별로 상품이 있는지 확인
      Object.entries(regionMap).forEach(([regionKey, keywords]) => {
        const hasRegion = product.itineraryPattern.some((item: any) => {
          if (typeof item === 'object' && item.country) {
            const country = item.country.toString().toUpperCase();
            return keywords.some(keyword => country.includes(keyword.toUpperCase()));
          }
          return false;
        });
        
        if (hasRegion) {
          regions.add(regionKey);
        }
      });
    });
    
    setAvailableRegions(regions);
  };

  const loadBelowProducts = async () => {
    try {
      const belowSettings = settings['recommended-below-settings'];
      if (!belowSettings || belowSettings.type !== 'products') {
        setBelowProducts([]);
        return;
      }

      const params = new URLSearchParams({
        limit: (belowSettings.products.count || 4).toString(),
        sort: 'popular',
      });

      if (belowSettings.products.category) {
        params.append('region', belowSettings.products.category);
      }

      const response = await fetch(`/api/public/products?${params.toString()}`);
      const data = await response.json();

      if (data.ok && data.products) {
        setBelowProducts(data.products);
      }
    } catch (error) {
      console.error('Failed to load below products:', error);
      setBelowProducts([]);
    }
  };

  // 판매 중인 상품이 있는 지역만 필터로 표시 (Hooks는 early return 이전에 호출되어야 함)
  const menuFilters = useMemo(() => {
    const configuredFilters = settings['menu-bar-settings']?.filters?.filter(f => f.enabled) || DEFAULT_REGION_FILTERS;
    
    // 판매 중인 상품이 있는 지역만 필터링
    return configuredFilters.filter(filter => availableRegions.has(filter.value));
  }, [settings, availableRegions]);

  const recommendedBelow = settings['recommended-below-settings'] || { type: 'none' };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-6"></div>
        <p className="text-xl md:text-2xl text-gray-700 font-semibold">상품을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-xl p-8 md:p-10 text-center shadow-lg">
        <p className="text-xl md:text-2xl text-red-800 font-bold mb-6">{error}</p>
        <button
          onClick={loadProducts}
          className="px-8 py-4 bg-red-600 text-white text-lg md:text-xl font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg min-h-[56px]"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 인기/추천 크루즈 분리
  const popularProducts = products.filter(p => p.isPopular);
  const recommendedProducts = products.filter(p => p.isRecommended);
  const premiumProducts = products.filter(p => p.isPremium);
  const geniePackProducts = products.filter(p => p.isGeniePack);
  const domesticProducts = products.filter(p => p.isDomestic);
  const japanProducts = products.filter(p => p.isJapan);
  const budgetProducts = products.filter(p => p.isBudget);
  const allProducts = products;
  
  // 지역 필터가 적용되었을 때는 모든 상품을 표시
  const showFilteredProducts = filters.region !== 'all';

  // 설정값 가져오기 (기본값 포함)
  const popularBanner = settings['popular-banner'] || {
    title: '인기 크루즈',
    buttons: [
      { text: '프리미엄 서비스 보장', icon: '✓' },
      { text: '지니 AI 가이드 서비스 지원', icon: '✓' },
      { text: '확실한 출발 100%', icon: '✓' },
    ],
    rightBadge: { topText: '신뢰할 수 있는', bottomText: '한국 여행사' },
  };

  const recommendedBanner = settings['recommended-banner'] || {
    title: '추천 크루즈',
    buttons: [
      { text: '10년 승무원 출신 인솔자', icon: '✓' },
      { text: '한국 전문 크루즈 여행사', icon: '✓' },
      { text: '빠르고 신속한 한국여행사', icon: '✓' },
    ],
    rightBadge: { topText: '신뢰할 수 있는', bottomText: '한국 여행사' },
  };

  const renderPartnerHero = () => (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl">
      <div className="absolute inset-0">
        {partnerContext?.coverImage && String(partnerContext.coverImage).trim() ? (
          <Image
            src={String(partnerContext.coverImage)}
            alt="파트너 커버"
            fill
            sizes="100vw"
            className="object-cover opacity-60"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-purple-700 to-indigo-700 opacity-80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 via-blue-900/60 to-purple-900/60" />
      </div>
      <div className="relative z-10 flex flex-col gap-6 p-8 md:p-10 lg:p-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/95 shadow-xl">
              <Image src="/images/ai-cruise-logo.png" alt="크루즈닷" width={56} height={56} sizes="56px" className="w-12 h-12 object-contain" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/70">Cruisedot Partner Mall</p>
              <h1 className="mt-2 text-3xl md:text-4xl lg:text-5xl font-black leading-tight">
                {partnerProfileTitle}
              </h1>
              {partnerAnnouncement && (
                <p className="mt-3 text-sm md:text-base text-white/80 whitespace-pre-line">{partnerAnnouncement}</p>
              )}
            </div>
          </div>
          {partnerContext?.profileImage && String(partnerContext.profileImage).trim() && (
            <Image
              src={String(partnerContext.profileImage)}
              alt="파트너 프로필"
              width={112}
              height={112}
              sizes="112px"
              className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white/70 object-cover shadow-xl"
            />
          )}
        </div>
        {partnerWelcome && (
          <div className="rounded-2xl bg-white/10 border border-white/15 p-5 text-sm md:text-base text-white/90 whitespace-pre-line">
            {partnerWelcome}
          </div>
        )}
      </div>
    </section>
  );

  const productDisplay = settings['product-display-settings'] || {
    popularRows: 1,
    recommendedRows: 1,
  };

  return (
    <div className="space-y-8">
      {isPartnerMall ? (
        renderPartnerHero()
      ) : (
        <>
          {/* 크루즈 쇼케이스 비디오 */}
          <div className="relative w-full h-64 md:h-80 lg:h-96 rounded-xl overflow-hidden shadow-2xl mb-8">
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src="/videos/cruise-showcase-video.mp4" type="video/mp4" />
            </video>
            {/* 비디오 위 어두운 오버레이 (선택적) */}
            <div className="absolute inset-0 bg-black/20"></div>
          </div>

          {/* 인기 크루즈 헤더 */}
          {filters.type === 'all' && filters.region === 'all' && popularProducts.length > 0 && (
            <div className="relative rounded-xl p-8 md:p-10 text-white overflow-hidden shadow-2xl mb-8">
              {/* 배경 이미지 */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: 'url(/images/promotion-banner-bg.png)',
                }}
              >
                <div className="absolute inset-0 bg-black/50"></div>
              </div>

              {/* 컨텐츠 */}
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-4xl md:text-5xl font-black mb-6 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                      {popularBanner.title}
                    </h2>
                    <div className="flex flex-wrap gap-4 text-base md:text-lg">
                      {popularBanner.buttons.slice(0, 3).map((button, index) => (
                        <span
                          key={index}
                          className="bg-white/95 text-gray-900 px-6 py-3 rounded-full font-black shadow-2xl border-3 border-white text-lg md:text-xl whitespace-nowrap"
                        >
                          <span className="text-green-600 mr-2">{button.icon}</span> {button.text}
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* 신뢰 마크 */}
                  {popularBanner.rightBadge && (
                    <div className="flex gap-3">
                      <div className="bg-white/95 backdrop-blur-sm px-6 py-4 rounded-xl border-3 border-white shadow-2xl whitespace-nowrap">
                        <div className="text-sm md:text-base text-gray-600 mb-2 font-bold">
                          {popularBanner.rightBadge.topText}
                        </div>
                        <div className="text-lg md:text-xl font-black text-gray-900 leading-tight">
                          {popularBanner.rightBadge.bottomText}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 나라별 필터 */}
      {menuFilters.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 mb-8" id="product-filters">
          <div className="space-y-4">
            {/* 지역 필터 */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {menuFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => {
                    const previousRegion = filters.region;
                    setFilters({ ...filters, region: filter.value });
                    setPage(1);
                    
                    if (previousRegion !== filter.value && filter.value !== 'all') {
                      setShouldScrollToProducts(true);
                    }
                  }}
                  className={`px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base md:text-lg font-bold transition-all min-h-[48px] sm:min-h-[52px] flex items-center justify-center ${
                    filters.region === filter.value
                      ? 'bg-blue-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300 border-2 border-gray-300'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            
            {/* 크루즈 라인 및 선박명 필터 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              {/* 크루즈 라인 필터 */}
              <div className="relative" ref={cruiseLineDropdownRef}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">크루즈 라인</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cruiseLineDropdownOpen ? cruiseLineSearchTerm : selectedCruiseLineLabel || '전체'}
                    onChange={(e) => {
                      setCruiseLineSearchTerm(e.target.value);
                      setCruiseLineDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setCruiseLineDropdownOpen(true);
                      setCruiseLineSearchTerm('');
                    }}
                    onBlur={() => {
                      setTimeout(() => setCruiseLineDropdownOpen(false), 200);
                    }}
                    placeholder="크루즈선사 검색 (예: MSC, 로얄캐리비안)"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base pr-12"
                  />
                  {cruiseLineSearchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setCruiseLineSearchTerm('');
                        setCruiseLineDropdownOpen(false);
                        handleCruiseLineSelect('all');
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    >
                      <FiX size={20} />
                    </button>
                  )}
                  {cruiseLineDropdownOpen && filteredCruiseLineOptions.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-72 overflow-y-auto">
                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleCruiseLineSelect('all');
                        }}
                        className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 ${
                          filters.cruiseLine === 'all' ? 'bg-blue-100 font-bold' : 'font-medium'
                        }`}
                      >
                        <div className="text-base text-gray-900">전체</div>
                      </div>
                      {filteredCruiseLineOptions.map((option) => (
                        <div
                          key={option.value}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleCruiseLineSelect(option.value);
                          }}
                          className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                            filters.cruiseLine === option.value ? 'bg-blue-100 font-bold' : 'font-medium'
                          }`}
                        >
                          <div className="text-base text-gray-900">{option.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* 선박명 필터 */}
              <div className="relative" ref={shipNameDropdownRef}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  선박명 {filters.cruiseLine !== 'all' && <span className="text-gray-500 text-xs">({selectedCruiseLineLabel})</span>}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled={filters.cruiseLine === 'all'}
                    value={shipNameDropdownOpen ? shipNameSearchTerm : selectedShipNameLabel || '전체'}
                    onChange={(e) => {
                      setShipNameSearchTerm(e.target.value);
                      setShipNameDropdownOpen(true);
                    }}
                    onFocus={() => {
                      if (filters.cruiseLine !== 'all') {
                        setShipNameDropdownOpen(true);
                        setShipNameSearchTerm('');
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShipNameDropdownOpen(false), 200);
                    }}
                    placeholder={filters.cruiseLine !== 'all' ? "선박명 검색 (예: 벨리시마)" : "먼저 크루즈선사를 선택하세요"}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base pr-12 ${
                      filters.cruiseLine === 'all' ? 'bg-gray-100 border-gray-200 cursor-not-allowed' : 'border-gray-300'
                    }`}
                  />
                  {shipNameSearchTerm && filters.cruiseLine !== 'all' && (
                    <button
                      type="button"
                      onClick={() => {
                        setShipNameSearchTerm('');
                        setShipNameDropdownOpen(false);
                        handleShipNameSelect('all');
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    >
                      <FiX size={20} />
                    </button>
                  )}
                  {shipNameDropdownOpen && filters.cruiseLine !== 'all' && filteredShipNameOptions.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-72 overflow-y-auto">
                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleShipNameSelect('all');
                        }}
                        className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 ${
                          filters.shipName === 'all' ? 'bg-blue-100 font-bold' : 'font-medium'
                        }`}
                      >
                        <div className="text-base text-gray-900">전체</div>
                      </div>
                      {filteredShipNameOptions.map((option) => (
                        <div
                          key={option.value}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleShipNameSelect(option.value);
                          }}
                          className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                            filters.shipName === option.value ? 'bg-blue-100 font-bold' : 'font-medium'
                          }`}
                        >
                          <div className="text-base text-gray-900">{option.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 인기 크루즈 섹션 */}
      {filters.type === 'all' && filters.region === 'all' && popularProducts.length > 0 && (
        <div id="popular-cruises" className="mb-12">
          <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">인기 크루즈</h3>
          <div
            className={`grid gap-6 md:gap-8 ${
              productDisplay.popularRows === 2 || productDisplay.popularRows === 3
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'relative'
            }`}
          >
            {productDisplay.popularRows === 1 ? (
              <>
                <button
                  onClick={() => scrollLeft(popularScrollRef)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg border-2 border-gray-200 hover:border-blue-500 transition-all transform hover:scale-110"
                  aria-label="이전 상품"
                >
                  <FiChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
                <div
                  ref={popularScrollRef}
                  className="flex gap-6 md:gap-8 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
                >
                  {popularProducts.map((product) => (
                    <div key={product.id} className="flex-shrink-0 w-[320px] md:w-[360px] h-full">
                      <ProductCard product={product} partnerId={partnerId} />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => scrollRight(popularScrollRef)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg border-2 border-gray-200 hover:border-blue-500 transition-all transform hover:scale-110"
                  aria-label="다음 상품"
                >
                  <FiChevronRight className="w-6 h-6 text-gray-700" />
                </button>
              </>
            ) : (
              popularProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </div>
      )}

      {/* 추천 크루즈 배너 */}
      {filters.type === 'all' && filters.region === 'all' && recommendedProducts.length > 0 && (
        <div className="relative rounded-xl p-8 md:p-10 text-white overflow-hidden shadow-2xl mb-8">
          {/* 배경 이미지 */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(/images/recommended-banner-bg.png)',
            }}
          >
            <div className="absolute inset-0 bg-black/50"></div>
          </div>
          
          {/* 컨텐츠 */}
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h2 className="text-4xl md:text-5xl font-black mb-6 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  {recommendedBanner.title}
                </h2>
                <div className="flex flex-wrap gap-4 text-base md:text-lg">
                  {recommendedBanner.buttons.slice(0, 3).map((button, index) => (
                    <span
                      key={index}
                      className="bg-white/95 text-gray-900 px-6 py-3 rounded-full font-black shadow-2xl border-3 border-white text-lg md:text-xl whitespace-nowrap"
                    >
                      <span className="text-green-600 mr-2">{button.icon}</span> {button.text}
                    </span>
                  ))}
                </div>
              </div>
              {/* 신뢰 마크 */}
              {recommendedBanner.rightBadge && (
                <div className="flex gap-3">
                  <div className="bg-white/95 backdrop-blur-sm px-6 py-4 rounded-xl border-3 border-white shadow-2xl whitespace-nowrap">
                    <div className="text-sm md:text-base text-gray-600 mb-2 font-bold">
                      {recommendedBanner.rightBadge.topText}
                    </div>
                    <div className="text-lg md:text-xl font-black text-gray-900 leading-tight">
                      {recommendedBanner.rightBadge.bottomText}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 추천 크루즈 섹션 */}
      {filters.type === 'all' && filters.region === 'all' && recommendedProducts.length > 0 && (
        <div>
          <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">추천 크루즈</h3>
          <div
            className={`grid gap-6 md:gap-8 ${
              productDisplay.recommendedRows === 2 || productDisplay.recommendedRows === 3
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'relative'
            }`}
          >
            {productDisplay.recommendedRows === 1 ? (
              <>
                <button
                  onClick={() => scrollLeft(recommendedScrollRef)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg border-2 border-gray-200 hover:border-red-500 transition-all transform hover:scale-110"
                  aria-label="이전 상품"
                >
                  <FiChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
                <div
                  ref={recommendedScrollRef}
                  className="flex gap-6 md:gap-8 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
                >
                  {recommendedProducts.map((product) => (
                    <div key={product.id} className="flex-shrink-0 w-[320px] md:w-[360px] h-full">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => scrollRight(recommendedScrollRef)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg border-2 border-gray-200 hover:border-red-500 transition-all transform hover:scale-110"
                  aria-label="다음 상품"
                >
                  <FiChevronRight className="w-6 h-6 text-gray-700" />
                </button>
              </>
            ) : (
              recommendedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>

          {/* 추천크루즈 밑 배너/상품 */}
          {recommendedBelow.type === 'banner' && recommendedBelow.banner && (
            <div className="mt-8 mb-8">
              {recommendedBelow.banner.link ? (
                <a href={recommendedBelow.banner.link} target="_blank" rel="noopener noreferrer">
                  <div
                    className="relative rounded-xl overflow-hidden shadow-2xl cursor-pointer hover:shadow-3xl transition-shadow"
                    style={{
                      backgroundImage: recommendedBelow.banner.image
                        ? `url(${recommendedBelow.banner.image})`
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      minHeight: '200px',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div className="absolute inset-0 bg-black/30"></div>
                    <div className="relative z-10 p-8 md:p-12 text-white">
                      <h3 className="text-3xl md:text-4xl font-black mb-4">
                        {recommendedBelow.banner.title}
                      </h3>
                    </div>
                  </div>
                </a>
              ) : (
                <div
                  className="relative rounded-xl overflow-hidden shadow-2xl"
                  style={{
                    backgroundImage: recommendedBelow.banner.image
                      ? `url(${recommendedBelow.banner.image})`
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    minHeight: '200px',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="absolute inset-0 bg-black/30"></div>
                  <div className="relative z-10 p-8 md:p-12 text-white">
                    <h3 className="text-3xl md:text-4xl font-black mb-4">
                      {recommendedBelow.banner.title}
                    </h3>
                  </div>
                </div>
              )}
            </div>
          )}

          {recommendedBelow.type === 'products' && belowProducts.length > 0 && (
            <div className="mt-8 mb-8">
              <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-6">추가 추천 상품</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {belowProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 프리미엄 크루즈 섹션 */}
      {filters.type === 'all' && filters.region === 'all' && premiumProducts.length > 0 && (
        <div id="premium-cruises" className="mb-12">
          <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">프리미엄 크루즈</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {premiumProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* 지니패키지 크루즈 섹션 */}
      {filters.type === 'all' && filters.region === 'all' && geniePackProducts.length > 0 && (
        <div id="geniepack-cruises" className="mb-12">
          <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">지니패키지 크루즈</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {geniePackProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* 국내 출발 크루즈 섹션 */}
      {filters.type === 'all' && filters.region === 'all' && domesticProducts.length > 0 && (
        <div id="domestic-cruises" className="mb-12">
          <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">국내출발 크루즈</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {domesticProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* 일본 크루즈 섹션 */}
      {filters.type === 'all' && filters.region === 'all' && japanProducts.length > 0 && (
        <div id="japan-cruises" className="mb-12">
          <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">일본 크루즈</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {japanProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* 알뜰 크루즈 섹션 */}
      {filters.type === 'all' && filters.region === 'all' && budgetProducts.length > 0 && (
        <div id="budget-cruises" className="mb-12">
          <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">알뜰 크루즈</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {budgetProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* 필터링된 상품 또는 전체 상품 그리드 */}
      {allProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-lg border-2 border-gray-200">
          <p className="text-xl md:text-2xl text-gray-700 font-semibold">
            {showFilteredProducts 
              ? `${menuFilters.find(f => f.value === filters.region)?.label || '선택한 지역'}에 해당하는 상품이 없습니다.`
              : '상품이 없습니다.'}
          </p>
        </div>
      ) : (
        <>
          {/* 필터가 적용되었거나, 필터가 '전체'일 때도 상품 목록 표시 (인기/추천 크루즈 아래) */}
          {(showFilteredProducts || (filters.type === 'all' && filters.region === 'all')) && (
            <div className="mb-8">
              {showFilteredProducts && (
                <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">
                  {menuFilters.find(f => f.value === filters.region)?.label || '필터링된'} 크루즈
                </h3>
              )}
              {!showFilteredProducts && filters.type === 'all' && filters.region === 'all' && (
                <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">크루즈 상품 안내</h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {allProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-12">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-6 py-3 text-base md:text-lg font-bold border-2 border-gray-400 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 min-h-[48px] transition-colors"
              >
                이전
              </button>
              <span className="px-6 py-3 text-lg md:text-xl font-black text-gray-900">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-6 py-3 text-base md:text-lg font-bold border-2 border-gray-400 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 min-h-[48px] transition-colors"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}







