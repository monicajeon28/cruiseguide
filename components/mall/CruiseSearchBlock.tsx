// components/mall/CruiseSearchBlock.tsx
// 크루즈 검색 블록 컴포넌트

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { FiChevronDown, FiChevronUp, FiSearch, FiX } from 'react-icons/fi';
import ProductCard from './ProductCard';
import cruiseShipsData from '@/data/cruise_ships.json';
import countriesData from '@/data/countries.json';

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
  destination?: string[];
  itineraryPattern?: any; // 일정 패턴 (JSON)
  rating?: number;
  reviewCount?: number;
  isPopular?: boolean;
  isRecommended?: boolean;
  recommendedKeywords?: string[] | any; // 추천 키워드 배열
  mallProductContent?: {
    thumbnail?: string | null;
    layout?: any;
  } | null;
}

interface CruiseShip {
  cruise_line: string;
  ships: string[];
}

interface CountryData {
  continent: string;
  countries: Array<{
    name: string;
    regions: string[];
  }>;
}

// 국가 목록 생성 (countries.json에서)
const buildRegionOptions = (): Array<{ value: string; label: string }> => {
  const options: Array<{ value: string; label: string }> = [
    { value: 'all', label: '전체 지역' }
  ];

  (countriesData as CountryData[]).forEach((continent) => {
    continent.countries.forEach((country) => {
      // 국가 이름에서 한글 부분만 추출 (예: "일본 (Japan)" → "일본")
      const koreanName = country.name.split('(')[0].trim();
      
      // 국가 옵션 추가
      options.push({
        value: koreanName,
        label: koreanName
      });

      // 지역이 있으면 "국가 - 지역" 형태로 추가
      if (country.regions && country.regions.length > 0) {
        country.regions.forEach((region) => {
          const koreanRegion = region.split('(')[0].trim();
          options.push({
            value: `${koreanName} - ${koreanRegion}`,
            label: `${koreanName} - ${koreanRegion}`
          });
        });
      }
    });
  });

  // 중복 제거
  const seen = new Set<string>();
  return options.filter(opt => {
    if (seen.has(opt.value)) return false;
    seen.add(opt.value);
    return true;
  });
};

const REGION_OPTIONS = buildRegionOptions();

// 도시명과 국가 매핑
const cityToRegionMap: Record<string, string> = {
  '시애틀': 'usa',
  '주노': 'usa',
  '스캐그웨이': 'usa',
  '싯카': 'usa',
  '앵커리지': 'usa',
  '빅토리아': 'usa', // 캐나다지만 미국 지역으로 검색 가능하도록
  '밴쿠버': 'usa',
  'Seattle': 'usa',
  'Juneau': 'usa',
  'Skagway': 'usa',
  'Sitka': 'usa',
  'Anchorage': 'usa',
  'Victoria': 'usa',
  'Vancouver': 'usa',
};

// 한글 국가 이름을 API 형식으로 변환
const convertRegionToApiFormat = (region: string): string => {
  const regionMap: Record<string, string> = {
    '일본': 'japan',
    '알래스카': 'alaska',
    '미국': 'usa', // 미국 추가
    '동남아': 'southeast-asia',
    '서부지중해': 'western-mediterranean',
    '동부지중해': 'eastern-mediterranean',
    '싱가포르': 'singapore',
  };
  
  // "미국 - 시애틀" 같은 형식에서 국가와 도시 추출
  const parts = region.split(' - ');
  const countryPart = parts[0]?.trim() || '';
  const cityPart = parts[1]?.trim() || '';
  
  // 도시명만 입력된 경우 (예: "시애틀")
  if (!countryPart && cityPart) {
    const cityRegion = cityToRegionMap[cityPart] || cityToRegionMap[cityPart.toLowerCase()];
    if (cityRegion) return cityRegion;
  }
  
  // "미국 - 시애틀" 형식인 경우
  const normalizedRegion = countryPart;
  
  // 정확히 일치하는 경우
  if (regionMap[normalizedRegion]) {
    return regionMap[normalizedRegion];
  }
  
  // 부분 일치 확인
  for (const [korean, apiFormat] of Object.entries(regionMap)) {
    if (normalizedRegion.includes(korean) || korean.includes(normalizedRegion)) {
      return apiFormat;
    }
  }
  
  // "미국"이 포함된 경우 (예: "미국 - 시애틀")
  if (normalizedRegion.includes('미국') || region.includes('미국')) {
    return 'usa';
  }
  
  // 도시명으로 검색 시도
  if (cityPart) {
    const cityRegion = cityToRegionMap[cityPart] || cityToRegionMap[cityPart.toLowerCase()];
    if (cityRegion) return cityRegion;
  }
  
  // 전체 문자열에서 도시명 검색
  for (const [city, apiFormat] of Object.entries(cityToRegionMap)) {
    if (region.includes(city)) {
      return apiFormat;
    }
  }
  
  // 매칭되지 않으면 원본 반환 (API에서 처리하도록)
  return region;
};

export default function CruiseSearchBlock() {
  const [isExpanded, setIsExpanded] = useState(true); // 기본값을 true로 변경 (50대 이상도 잘 보이게)
  const [selectedCruiseLine, setSelectedCruiseLine] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [allAvailableProducts, setAllAvailableProducts] = useState<Product[]>([]); // 모든 상품 데이터 (연관 검색어 생성용)
  
  // 검색 가능한 드롭다운 상태
  const [cruiseSearchTerm, setCruiseSearchTerm] = useState('');
  const [cruiseDropdownOpen, setCruiseDropdownOpen] = useState(false);
  const [regionSearchTerm, setRegionSearchTerm] = useState('');
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);

  // 크루즈선사 + 크루즈이름 목록 생성
  const cruiseOptions = useMemo(() => {
    const options: Array<{ value: string; label: string; cruiseLine: string; shipName: string }> = [
      { value: 'all', label: '전체 크루즈', cruiseLine: '', shipName: '' }
    ];

    // cruise_ships.json 데이터에서 크루즈선사와 크루즈이름 조합 생성
    (cruiseShipsData as CruiseShip[]).forEach((line) => {
      // 크루즈선사만 있는 옵션 (예: "MSC 크루즈")
      const cruiseLineShort = line.cruise_line.split('(')[0].trim();
      const cruiseLineEnglish = line.cruise_line.match(/\(([^)]+)\)/)?.[1] || '';
      const cruiseLineValue = cruiseLineEnglish || cruiseLineShort;
      
      // 크루즈선사 옵션 추가
      options.push({
        value: `line:${cruiseLineValue}`,
        label: `${cruiseLineShort} (전체)`,
        cruiseLine: cruiseLineValue,
        shipName: ''
      });

      // 각 크루즈선의 크루즈이름 옵션 추가
      line.ships.forEach((ship) => {
        const shipNameShort = ship.split('(')[0].trim();
        const shipNameEnglish = ship.match(/\(([^)]+)\)/)?.[1] || '';
        const shipNameValue = shipNameEnglish || shipNameShort;
        
        // 크루즈선사 이름이 크루즈이름에 포함되어 있는지 확인하여 중복 제거
        // 예: "MSC 크루즈 - MSC 벨리시마" → "MSC 벨리시마"
        let displayLabel = shipNameShort;
        
        // 크루즈선사 이름의 주요 키워드 추출 (예: "MSC 크루즈" → "MSC", "로얄 캐리비안" → "로얄" 또는 "캐리비안")
        const cruiseLineKeywords = cruiseLineShort.split(' ').filter(word => word.length > 1);
        
        // 크루즈이름에 크루즈선사 키워드가 포함되어 있는지 확인
        const hasCruiseLineInShipName = cruiseLineKeywords.some(keyword => 
          shipNameShort.includes(keyword)
        );
        
        // 크루즈선사 이름이 크루즈이름에 포함되어 있지 않은 경우에만 크루즈선사 이름 추가
        if (!hasCruiseLineInShipName) {
          // 크루즈선사 이름의 간단한 버전 사용 (예: "MSC 크루즈" → "MSC")
          const simpleCruiseLine = cruiseLineKeywords[0] || cruiseLineShort;
          displayLabel = `${simpleCruiseLine} ${shipNameShort}`;
        }
        
        options.push({
          value: `ship:${cruiseLineValue}:${shipNameValue}`,
          label: displayLabel,
          cruiseLine: cruiseLineValue,
          shipName: shipNameValue
        });
      });
    });

    return options;
  }, []);

  // 필터링된 크루즈 옵션 (모든 크루즈 표시)
  const filteredCruiseOptions = useMemo(() => {
    if (!cruiseSearchTerm.trim()) {
      return cruiseOptions; // 검색어 없으면 모든 크루즈 표시
    }
    const term = cruiseSearchTerm.toLowerCase();
    return cruiseOptions.filter(option => 
      option.label.toLowerCase().includes(term)
    );
  }, [cruiseSearchTerm, cruiseOptions]);

  // 필터링된 지역 옵션 (모든 국가 표시)
  const filteredRegionOptions = useMemo(() => {
    if (!regionSearchTerm.trim()) {
      return REGION_OPTIONS; // 검색어 없으면 모든 국가 표시
    }
    const term = regionSearchTerm.toLowerCase();
    return REGION_OPTIONS.filter(option => 
      option.label.toLowerCase().includes(term)
    );
  }, [regionSearchTerm]);

  // 선택된 크루즈 라벨 가져오기
  const selectedCruiseLabel = useMemo(() => {
    const option = cruiseOptions.find(opt => opt.value === selectedCruiseLine);
    return option?.label || '전체 크루즈';
  }, [selectedCruiseLine, cruiseOptions]);

  // 선택된 지역 라벨 가져오기
  const selectedRegionLabel = useMemo(() => {
    const option = REGION_OPTIONS.find(opt => opt.value === selectedRegion);
    return option?.label || '전체 지역';
  }, [selectedRegion]);

  // 모든 상품 로드 (연관 검색어 생성용)
  useEffect(() => {
    const loadAllProducts = async () => {
      try {
        const response = await fetch('/api/public/products?limit=1000');
        const data = await response.json();
        if (data.ok && data.products) {
          setAllAvailableProducts(data.products);
        }
      } catch (error) {
        console.error('Failed to load products for related search terms:', error);
      }
    };
    loadAllProducts();
  }, []);

    // 실제 상품 데이터 기반으로 연관 검색어 생성 (실제 검색 결과가 있는 것만)
    const relatedSearchTerms = useMemo(() => {
      if (allAvailableProducts.length === 0) {
        return []; // 상품이 없으면 연관 검색어 없음
      }

      const terms: Array<{ label: string; cruiseLine: string; region: string; keyword?: string; productCount: number }> = [];
      const seenLabels = new Set<string>(); // 중복 제거용
      
      // 1. 지역별 연관 검색어 생성 (MallProductContent.layout.destination 우선, itineraryPattern fallback)
      const regionCounts: Record<string, number> = {};
      const cruiseLineCounts: Record<string, number> = {};
      
      allAvailableProducts.forEach(product => {
        // destination 추출 (MallProductContent.layout.destination 우선)
        let destinations: string[] = [];
        
        if (product.mallProductContent?.layout) {
          try {
            const layout = typeof product.mallProductContent.layout === 'string' 
              ? JSON.parse(product.mallProductContent.layout) 
              : product.mallProductContent.layout;
            
            if (layout && typeof layout === 'object' && layout.destination && Array.isArray(layout.destination)) {
              destinations = layout.destination;
            }
          } catch (e) {
            // 파싱 실패 시 무시
          }
        }
        
        // fallback: product.destination 필드
        if (destinations.length === 0 && product.destination && Array.isArray(product.destination)) {
          destinations = product.destination;
        }
        
        // fallback: itineraryPattern에서 country 필드 확인
        if (destinations.length === 0 && product.itineraryPattern) {
          try {
            const pattern = typeof product.itineraryPattern === 'string' 
              ? JSON.parse(product.itineraryPattern) 
              : product.itineraryPattern;
            
            if (Array.isArray(pattern)) {
              pattern.forEach((item: any) => {
                if (item && typeof item === 'object' && item.country) {
                  const country = item.country.toString().toLowerCase();
                  let regionKey = '';
                  
                  if (country.includes('jp') || country.includes('japan') || country.includes('일본')) {
                    regionKey = 'japan';
                  } else if (country.includes('alaska') || country.includes('알래스카')) {
                    regionKey = 'alaska';
                  } else if (country.includes('us') || country.includes('usa') || country.includes('미국') || country.includes('united states') || country.includes('america')) {
                    regionKey = 'usa'; // 미국 추가
                  } else if (country.includes('th') || country.includes('thailand') || country.includes('태국') ||
                            country.includes('vn') || country.includes('vietnam') || country.includes('베트남') ||
                            country.includes('my') || country.includes('malaysia') || country.includes('말레이시아')) {
                    regionKey = 'southeast-asia';
                  } else if (country.includes('sg') || country.includes('singapore') || country.includes('싱가포르')) {
                    regionKey = 'singapore';
                  } else if (country.includes('es') || country.includes('spain') || country.includes('스페인') ||
                            country.includes('fr') || country.includes('france') || country.includes('프랑스') ||
                            country.includes('it') || country.includes('italy') || country.includes('이탈리아')) {
                    regionKey = 'western-mediterranean';
                  } else if (country.includes('gr') || country.includes('greece') || country.includes('그리스') ||
                            country.includes('tr') || country.includes('turkey') || country.includes('터키')) {
                    regionKey = 'eastern-mediterranean';
                  }
                  
                  if (regionKey) {
                    regionCounts[regionKey] = (regionCounts[regionKey] || 0) + 1;
                  }
                }
              });
            }
          } catch (e) {
            // 파싱 실패 시 무시
          }
        }
        
        // destination 배열에서 지역 추출
        destinations.forEach(dest => {
          const destLower = dest.toLowerCase();
          let regionKey = '';
          
          if (destLower.includes('일본') || destLower.includes('japan') || destLower.includes('jp')) {
            regionKey = 'japan';
          } else if (destLower.includes('알래스카') || destLower.includes('alaska')) {
            regionKey = 'alaska';
          } else if (destLower.includes('미국') || destLower.includes('usa') || destLower.includes('united states') || destLower.includes('america') || destLower.includes('us ')) {
            regionKey = 'usa'; // 미국 추가
          } else if (destLower.includes('태국') || destLower.includes('thailand') || destLower.includes('베트남') || destLower.includes('vietnam') || destLower.includes('말레이시아') || destLower.includes('malaysia')) {
            regionKey = 'southeast-asia';
          } else if (destLower.includes('싱가포르') || destLower.includes('singapore')) {
            regionKey = 'singapore';
          } else if (destLower.includes('스페인') || destLower.includes('spain') || destLower.includes('프랑스') || destLower.includes('france') || destLower.includes('이탈리아') || destLower.includes('italy')) {
            regionKey = 'western-mediterranean';
          } else if (destLower.includes('그리스') || destLower.includes('greece') || destLower.includes('터키') || destLower.includes('turkey')) {
            regionKey = 'eastern-mediterranean';
          }
          
          if (regionKey) {
            regionCounts[regionKey] = (regionCounts[regionKey] || 0) + 1;
          }
        });
        
        // 크루즈 라인 추출 (한글/영문 모두 고려)
        if (product.cruiseLine) {
          const cruiseLine = product.cruiseLine.trim();
          if (cruiseLine) {
            // 한글명 추출 (괄호 앞 부분)
            const koreanName = cruiseLine.split('(')[0].trim();
            // 영문명 추출 (괄호 안 부분)
            const englishMatch = cruiseLine.match(/\(([^)]+)\)/);
            const englishName = englishMatch ? englishMatch[1].trim() : '';
            
            // 한글명으로 카운트
            if (koreanName) {
              cruiseLineCounts[koreanName] = (cruiseLineCounts[koreanName] || 0) + 1;
            }
            // 영문명으로도 카운트 (다른 형식으로 저장된 경우 대비)
            if (englishName) {
              cruiseLineCounts[englishName] = (cruiseLineCounts[englishName] || 0) + 1;
            }
            // 전체 문자열로도 카운트
            cruiseLineCounts[cruiseLine] = (cruiseLineCounts[cruiseLine] || 0) + 1;
          }
        }
        
        // 선박명도 크루즈 라인으로 사용 (크루즈 라인과 선박명이 반대로 저장된 경우 대비)
        if (product.shipName) {
          const shipName = product.shipName.trim();
          if (shipName) {
            // 한글명 추출 (괄호 앞 부분)
            const koreanName = shipName.split('(')[0].trim();
            // 영문명 추출 (괄호 안 부분)
            const englishMatch = shipName.match(/\(([^)]+)\)/);
            const englishName = englishMatch ? englishMatch[1].trim() : '';
            
            // 한글명으로 카운트
            if (koreanName) {
              cruiseLineCounts[koreanName] = (cruiseLineCounts[koreanName] || 0) + 1;
            }
            // 영문명으로도 카운트
            if (englishName) {
              cruiseLineCounts[englishName] = (cruiseLineCounts[englishName] || 0) + 1;
            }
          }
        }
      });

    // 지역별 연관 검색어 추가 (상품이 있는 지역만, 최소 1개 이상)
    const regionLabels: Record<string, string> = {
      'japan': '일본 크루즈',
      'alaska': '알래스카 크루즈',
      'usa': '미국 크루즈', // 미국 추가
      'southeast-asia': '동남아 크루즈',
      'singapore': '싱가포르 크루즈',
      'western-mediterranean': '지중해 크루즈',
      'eastern-mediterranean': '동부지중해 크루즈',
    };
    
    Object.entries(regionCounts)
      .filter(([_, count]) => count > 0) // 실제 상품이 있는 지역만
      .sort((a, b) => b[1] - a[1]) // 상품 수가 많은 순으로 정렬
      .slice(0, 5) // 최대 5개
      .forEach(([regionKey, count]) => {
        if (regionLabels[regionKey] && !seenLabels.has(regionLabels[regionKey])) {
          seenLabels.add(regionLabels[regionKey]);
          terms.push({
            label: regionLabels[regionKey],
            cruiseLine: 'all',
            region: regionKey,
            productCount: count
          });
        }
      });

    // 크루즈 라인별 연관 검색어 추가 (상품이 있는 크루즈 라인만, 최소 1개 이상)
    Object.entries(cruiseLineCounts)
      .filter(([_, count]) => count > 0) // 실제 상품이 있는 크루즈 라인만
      .sort((a, b) => b[1] - a[1]) // 상품 수가 많은 순으로 정렬
      .slice(0, 5) // 최대 5개
      .forEach(([cruiseLine, count]) => {
        // 크루즈 옵션에서 매칭되는 항목 찾기
        const cruiseOption = cruiseOptions.find(opt => 
          opt.cruiseLine.toLowerCase().includes(cruiseLine.toLowerCase()) ||
          cruiseLine.toLowerCase().includes(opt.cruiseLine.toLowerCase())
        );
        
        let label = '';
        let cruiseLineValue = '';
        
        if (cruiseOption) {
          const baseLabel = cruiseOption.label.split('(')[0].trim();
          // "크루즈"가 이미 포함되어 있으면 추가하지 않음
          if (baseLabel.includes('크루즈')) {
            label = baseLabel;
          } else {
            label = `${baseLabel} 크루즈`;
          }
          cruiseLineValue = cruiseOption.value;
        } else {
          // 매칭되는 옵션이 없으면 크루즈 라인 이름 그대로 사용
          if (cruiseLine.toLowerCase().includes('cruise') || cruiseLine.includes('크루즈')) {
            label = cruiseLine;
          } else {
            label = `${cruiseLine} 크루즈`;
          }
          cruiseLineValue = `line:${cruiseLine}`;
        }
        
        // 중복 제거 및 "전체 크루즈" 제외
        if (label && label !== '전체 크루즈' && !seenLabels.has(label)) {
          seenLabels.add(label);
          terms.push({
            label: label,
            cruiseLine: cruiseLineValue,
            region: 'all',
            productCount: count
          });
        }
      });

    // 추천 키워드 기반 연관 검색어 추가 (상품이 있는 키워드만) - 우선순위 높게, 더 많이 표시
    const keywordCounts: Record<string, number> = {};
    allAvailableProducts.forEach(product => {
      // MallProductContent.layout.recommendedKeywords 우선 확인
      if (product.mallProductContent?.layout) {
        try {
          const layout = typeof product.mallProductContent.layout === 'string' 
            ? JSON.parse(product.mallProductContent.layout) 
            : product.mallProductContent.layout;
          
          if (layout && typeof layout === 'object' && layout.recommendedKeywords) {
            let keywords: string[] = [];
            if (Array.isArray(layout.recommendedKeywords)) {
              keywords = layout.recommendedKeywords;
            } else if (typeof layout.recommendedKeywords === 'string') {
              try {
                keywords = JSON.parse(layout.recommendedKeywords);
              } catch (e) {
                keywords = [layout.recommendedKeywords];
              }
            }
            
            keywords.forEach(keyword => {
              if (keyword && typeof keyword === 'string' && keyword.trim()) {
                const trimmedKeyword = keyword.trim();
                keywordCounts[trimmedKeyword] = (keywordCounts[trimmedKeyword] || 0) + 1;
              }
            });
          }
        } catch (e) {
          // 파싱 실패 시 무시
        }
      }
      
      // fallback: product.recommendedKeywords 필드 확인
      if (product.recommendedKeywords) {
        let keywords: string[] = [];
        if (Array.isArray(product.recommendedKeywords)) {
          keywords = product.recommendedKeywords;
        } else if (typeof product.recommendedKeywords === 'string') {
          try {
            keywords = JSON.parse(product.recommendedKeywords);
          } catch (e) {
            keywords = [product.recommendedKeywords];
          }
        }
        keywords.forEach(keyword => {
          if (keyword && typeof keyword === 'string' && keyword.trim()) {
            const trimmedKeyword = keyword.trim();
            keywordCounts[trimmedKeyword] = (keywordCounts[trimmedKeyword] || 0) + 1;
          }
        });
      }
    });

    // 추천 키워드 연관 검색어 추가 (우선순위 높게, 최대 10개로 증가)
    Object.entries(keywordCounts)
      .filter(([_, count]) => count > 0) // 실제 상품이 있는 키워드만
      .sort((a, b) => b[1] - a[1]) // 상품 수가 많은 순으로 정렬
      .slice(0, 10) // 최대 10개로 증가
      .forEach(([keyword, count]) => {
        if (!seenLabels.has(keyword)) {
          seenLabels.add(keyword);
          terms.push({
            label: keyword,
            cruiseLine: 'all',
            region: 'all',
            keyword: keyword, // 키워드 추가
            productCount: count
          });
        }
      });

    // 각 상품의 destination에서 개별 국가별 연관 검색어 생성 (5개국 방문 시 5개국 모두 검색 가능하도록)
    const individualCountryCounts: Record<string, { count: number; regionKey: string }> = {};
    allAvailableProducts.forEach(product => {
      // destination 추출
      let destinations: string[] = [];
      
      if (product.mallProductContent?.layout) {
        try {
          const layout = typeof product.mallProductContent.layout === 'string' 
            ? JSON.parse(product.mallProductContent.layout) 
            : product.mallProductContent.layout;
          
          if (layout && typeof layout === 'object' && layout.destination && Array.isArray(layout.destination)) {
            destinations = layout.destination;
          }
        } catch (e) {
          // 파싱 실패 시 무시
        }
      }
      
      // fallback: product.destination 필드
      if (destinations.length === 0 && product.destination && Array.isArray(product.destination)) {
        destinations = product.destination;
      }
      
      // 각 destination을 개별적으로 카운트
      destinations.forEach(dest => {
        const destStr = dest.toString().trim();
        if (!destStr) return;
        
        // 국가명 추출 (예: "미국 - 시애틀" → "미국", "일본 - 사세보" → "일본")
        const countryMatch = destStr.match(/^([^-]+)/);
        if (countryMatch) {
          const countryName = countryMatch[1].trim();
          
          // 국가명을 regionKey로 변환
          let regionKey = '';
          const countryLower = countryName.toLowerCase();
          
          if (countryLower.includes('일본') || countryLower.includes('japan') || countryLower.includes('jp')) {
            regionKey = 'japan';
          } else if (countryLower.includes('미국') || countryLower.includes('usa') || countryLower.includes('united states') || countryLower.includes('america')) {
            regionKey = 'usa';
          } else if (countryLower.includes('알래스카') || countryLower.includes('alaska')) {
            regionKey = 'alaska';
          } else if (countryLower.includes('태국') || countryLower.includes('thailand') || countryLower.includes('th')) {
            regionKey = 'southeast-asia';
          } else if (countryLower.includes('베트남') || countryLower.includes('vietnam') || countryLower.includes('vn')) {
            regionKey = 'southeast-asia';
          } else if (countryLower.includes('말레이시아') || countryLower.includes('malaysia') || countryLower.includes('my')) {
            regionKey = 'southeast-asia';
          } else if (countryLower.includes('싱가포르') || countryLower.includes('singapore') || countryLower.includes('sg')) {
            regionKey = 'singapore';
          } else if (countryLower.includes('스페인') || countryLower.includes('spain') || countryLower.includes('es')) {
            regionKey = 'western-mediterranean';
          } else if (countryLower.includes('프랑스') || countryLower.includes('france') || countryLower.includes('fr')) {
            regionKey = 'western-mediterranean';
          } else if (countryLower.includes('이탈리아') || countryLower.includes('italy') || countryLower.includes('it')) {
            regionKey = 'western-mediterranean';
          } else if (countryLower.includes('그리스') || countryLower.includes('greece') || countryLower.includes('gr')) {
            regionKey = 'eastern-mediterranean';
          } else if (countryLower.includes('터키') || countryLower.includes('turkey') || countryLower.includes('tr')) {
            regionKey = 'eastern-mediterranean';
          }
          
          if (regionKey && !individualCountryCounts[countryName]) {
            individualCountryCounts[countryName] = { count: 0, regionKey };
          }
          if (regionKey && individualCountryCounts[countryName]) {
            individualCountryCounts[countryName].count += 1;
          }
        }
      });
    });

    // 개별 국가별 연관 검색어 추가 (예: "일본", "미국", "태국" 등)
    Object.entries(individualCountryCounts)
      .filter(([_, data]) => data.count > 0)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8) // 최대 8개
      .forEach(([countryName, data]) => {
        const label = `${countryName} 크루즈`;
        if (!seenLabels.has(label)) {
          seenLabels.add(label);
          terms.push({
            label: label,
            cruiseLine: 'all',
            region: data.regionKey,
            productCount: data.count
          });
        }
      });

    // 상품 수가 많은 순으로 정렬하고 최대 20개 반환 (키워드, 국가, 크루즈 모두 포함)
    return terms
      .sort((a, b) => {
        // 키워드는 우선순위 높게
        if (a.keyword && !b.keyword) return -1;
        if (!a.keyword && b.keyword) return 1;
        return b.productCount - a.productCount;
      })
      .slice(0, 20) // 최대 20개로 증가
      .map(({ productCount, ...term }) => term); // productCount 제거
  }, [allAvailableProducts, cruiseOptions]);

  useEffect(() => {
    // 선택이 변경되면 자동으로 검색
    if (isExpanded && (selectedCruiseLine !== 'all' || selectedRegion !== 'all')) {
      searchProducts();
    } else if (isExpanded && selectedCruiseLine === 'all' && selectedRegion === 'all') {
      // 모두 '전체'일 경우 검색 결과 초기화
      setProducts([]);
      setHasSearched(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCruiseLine, selectedRegion, isExpanded]);

  const searchProducts = async () => {
    setIsLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      
      // 크루즈선/크루즈이름 필터 처리
      if (selectedCruiseLine !== 'all') {
        if (selectedCruiseLine.startsWith('line:')) {
          // 크루즈선사만 선택한 경우
          const cruiseLine = selectedCruiseLine.replace('line:', '');
          params.append('cruiseLine', cruiseLine);
        } else if (selectedCruiseLine.startsWith('ship:')) {
          // 특정 크루즈선 선택한 경우
          const parts = selectedCruiseLine.replace('ship:', '').split(':');
          if (parts.length === 2) {
            params.append('cruiseLine', parts[0]);
            params.append('shipName', parts[1]);
          }
        } else {
          // 일반 크루즈 라인 값인 경우
          params.append('cruiseLine', selectedCruiseLine);
        }
      } else if (cruiseSearchTerm.trim()) {
        // 드롭다운에서 선택하지 않고 직접 입력한 경우, 키워드로 검색
        params.append('keyword', cruiseSearchTerm.trim());
      }
      
      if (selectedRegion !== 'all') {
        // 국가 이름을 API가 이해할 수 있는 형식으로 변환
        const apiRegion = convertRegionToApiFormat(selectedRegion);
        params.append('region', apiRegion);
        
        // 도시명이 포함된 경우 키워드로도 전달 (예: "미국 - 시애틀" → keyword="시애틀")
        if (selectedRegion.includes(' - ')) {
          const cityPart = selectedRegion.split(' - ')[1]?.trim();
          if (cityPart) {
            params.append('keyword', cityPart);
          }
        } else {
          // 도시명만 입력된 경우 (예: "시애틀")
          const cityRegion = cityToRegionMap[selectedRegion] || cityToRegionMap[selectedRegion.toLowerCase()];
          if (cityRegion) {
            params.append('keyword', selectedRegion);
          }
        }
      } else if (regionSearchTerm.trim()) {
        // 드롭다운에서 선택하지 않고 직접 입력한 경우
        // 먼저 도시명으로 매핑 시도
        const cityRegion = cityToRegionMap[regionSearchTerm.trim()] || cityToRegionMap[regionSearchTerm.trim().toLowerCase()];
        if (cityRegion) {
          params.append('region', cityRegion);
          params.append('keyword', regionSearchTerm.trim());
        } else {
          // 도시명 매핑이 없으면 키워드로 검색
          params.append('keyword', regionSearchTerm.trim());
        }
      }

      const response = await fetch(`/api/public/products?${params.toString()}`);
      const data = await response.json();

      if (data.ok) {
        // 인기/추천 표시 추가 (productCode로 구분)
        const productsWithFlags = data.products.map((p: Product) => ({
          ...p,
          rating: 4.0 + Math.random() * 1.0, // 임시 평점 (4.0~5.0)
          reviewCount: Math.floor(Math.random() * 500) + 50, // 임시 리뷰 수 (50~550)
          isPopular: p.productCode.startsWith('POP-'),
          isRecommended: p.productCode.startsWith('REC-'),
        }));
        setProducts(productsWithFlags);
      } else {
        console.error('Failed to fetch products:', data.error);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRelatedSearch = async (cruiseLine: string, region: string, keyword?: string) => {
    setSelectedCruiseLine(cruiseLine);
    setSelectedRegion(region);
    setIsExpanded(true); // 연관 검색어 클릭 시 확장
    
    // 검색 실행
    setIsLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      
      // 크루즈선/크루즈이름 필터 처리
      if (cruiseLine !== 'all') {
        if (cruiseLine.startsWith('line:')) {
          // 크루즈선사만 선택한 경우
          const cruiseLineValue = cruiseLine.replace('line:', '');
          params.append('cruiseLine', cruiseLineValue);
        } else if (cruiseLine.startsWith('ship:')) {
          // 특정 크루즈선 선택한 경우
          const parts = cruiseLine.replace('ship:', '').split(':');
          if (parts.length === 2) {
            params.append('cruiseLine', parts[0]);
            params.append('shipName', parts[1]);
          }
        } else {
          // 일반 크루즈 라인 값인 경우
          params.append('cruiseLine', cruiseLine);
        }
      }
      
      if (region !== 'all') {
        // 국가 이름을 API가 이해할 수 있는 형식으로 변환
        const apiRegion = convertRegionToApiFormat(region);
        params.append('region', apiRegion);
        
        // 도시명이 포함된 경우 키워드로도 전달 (예: "미국 - 시애틀" → keyword="시애틀")
        if (region.includes(' - ')) {
          const cityPart = region.split(' - ')[1]?.trim();
          if (cityPart) {
            params.append('keyword', cityPart);
          }
        } else {
          // 도시명만 입력된 경우 (예: "시애틀")
          const cityRegion = cityToRegionMap[region] || cityToRegionMap[region.toLowerCase()];
          if (cityRegion) {
            params.append('keyword', region);
          }
        }
      }
      
      // 키워드 파라미터 추가
      if (keyword) {
        params.append('keyword', keyword);
      }

      const response = await fetch(`/api/public/products?${params.toString()}`);
      const data = await response.json();

      if (data.ok) {
        let filteredProducts = data.products;
        
        // 추천 키워드로 필터링 (키워드가 있는 경우)
        if (keyword) {
          filteredProducts = data.products.filter((p: Product) => {
            if (!p.recommendedKeywords) return false;
            let keywords: string[] = [];
            if (Array.isArray(p.recommendedKeywords)) {
              keywords = p.recommendedKeywords;
            } else if (typeof p.recommendedKeywords === 'string') {
              try {
                keywords = JSON.parse(p.recommendedKeywords);
              } catch (e) {
                keywords = [];
              }
            }
            return keywords.includes(keyword);
          });
        }
        
        // 인기/추천 표시 추가 (productCode로 구분)
        const productsWithFlags = filteredProducts.map((p: Product) => ({
          ...p,
          rating: 4.0 + Math.random() * 1.0, // 임시 평점 (4.0~5.0)
          reviewCount: Math.floor(Math.random() * 500) + 50, // 임시 리뷰 수 (50~550)
          isPopular: p.productCode.startsWith('POP-'),
          isRecommended: p.productCode.startsWith('REC-'),
        }));
        setProducts(productsWithFlags);
      } else {
        console.error('Failed to fetch products:', data.error);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 외부 클릭 시 드롭다운 닫기
  const cruiseDropdownRef = useRef<HTMLDivElement>(null);
  const regionDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cruiseDropdownRef.current && !cruiseDropdownRef.current.contains(event.target as Node)) {
        setCruiseDropdownOpen(false);
      }
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(event.target as Node)) {
        setRegionDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCruiseSelect = (value: string, label: string) => {
    setSelectedCruiseLine(value);
    setCruiseSearchTerm('');
    setCruiseDropdownOpen(false);
  };

  const handleRegionSelect = (value: string, label: string) => {
    setSelectedRegion(value);
    setRegionSearchTerm('');
    setRegionDropdownOpen(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
      {/* 헤더 */}
      <div
        className="flex items-center justify-between p-6 md:p-8 cursor-pointer bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3 md:gap-4">
          <FiSearch className="w-7 h-7 md:w-8 md:h-8" />
          <span>크루즈 상품 검색</span>
        </h2>
        {isExpanded ? <FiChevronUp className="w-6 h-6 md:w-7 md:h-7" /> : <FiChevronDown className="w-6 h-6 md:w-7 md:h-7" />}
      </div>

      {/* 검색 필터 및 결과 */}
      {isExpanded && (
        <div className="p-6 md:p-8 lg:p-10 space-y-8 md:space-y-10">
          {/* 검색 필터 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* 크루즈 검색 가능한 드롭다운 */}
            <div className="relative" ref={cruiseDropdownRef}>
              <label htmlFor="cruiseLine" className="block text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">
                여행 가고싶은 크루즈
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cruiseDropdownOpen ? cruiseSearchTerm : selectedCruiseLabel}
                  onChange={(e) => {
                    setCruiseSearchTerm(e.target.value);
                    setCruiseDropdownOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && cruiseSearchTerm.trim()) {
                      e.preventDefault();
                      // Enter 키를 누르면 검색 실행
                      setCruiseDropdownOpen(false);
                      searchProducts();
                    }
                  }}
                  onFocus={() => {
                    setCruiseDropdownOpen(true);
                    setCruiseSearchTerm('');
                  }}
                  onBlur={() => {
                    // 약간의 지연을 두어 클릭 이벤트가 먼저 처리되도록
                    setTimeout(() => {
                      setCruiseDropdownOpen(false);
                      // 입력값이 있고 선택되지 않았으면 검색 실행
                      if (cruiseSearchTerm.trim() && selectedCruiseLine === 'all') {
                        searchProducts();
                      }
                    }, 200);
                  }}
                  placeholder="크루즈 검색 (예: 보이저호, MSC, 벨리시마)"
                  className="w-full p-4 md:p-5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg md:text-xl pr-12 font-medium"
                  style={{ fontSize: '18px', minHeight: '56px' }}
                />
                {cruiseSearchTerm && (
                  <button
                    onClick={() => {
                      setCruiseSearchTerm('');
                      setCruiseDropdownOpen(false);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                    style={{ fontSize: '20px' }}
                  >
                    <FiX size={22} />
                  </button>
                )}
                {cruiseDropdownOpen && filteredCruiseOptions.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-96 overflow-y-auto">
                    {filteredCruiseOptions.map((option) => (
                      <div
                        key={option.value}
                        onMouseDown={(e) => {
                          e.preventDefault(); // onBlur가 먼저 실행되지 않도록
                          handleCruiseSelect(option.value, option.label);
                        }}
                        className={`px-5 py-4 md:px-6 md:py-5 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                          selectedCruiseLine === option.value ? 'bg-blue-100 font-bold' : 'font-medium'
                        }`}
                        style={{ minHeight: '56px' }}
                      >
                        <div className="text-lg md:text-xl text-gray-900">{option.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 지역 검색 가능한 드롭다운 */}
            <div className="relative" ref={regionDropdownRef}>
              <label htmlFor="region" className="block text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">
                여행 가고싶은 지역
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={regionDropdownOpen ? regionSearchTerm : selectedRegionLabel}
                  onChange={(e) => {
                    setRegionSearchTerm(e.target.value);
                    setRegionDropdownOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && regionSearchTerm.trim()) {
                      e.preventDefault();
                      // Enter 키를 누르면 검색 실행
                      setRegionDropdownOpen(false);
                      searchProducts();
                    }
                  }}
                  onFocus={() => {
                    setRegionDropdownOpen(true);
                    setRegionSearchTerm('');
                  }}
                  onBlur={() => {
                    // 약간의 지연을 두어 클릭 이벤트가 먼저 처리되도록
                    setTimeout(() => {
                      setRegionDropdownOpen(false);
                      // 입력값이 있고 선택되지 않았으면 검색 실행
                      if (regionSearchTerm.trim() && selectedRegion === 'all') {
                        searchProducts();
                      }
                    }, 200);
                  }}
                  placeholder="지역 검색 (예: 시애틀, 일본, 지중해)"
                  className="w-full p-4 md:p-5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg md:text-xl pr-12 font-medium"
                  style={{ fontSize: '18px', minHeight: '56px' }}
                />
                {regionSearchTerm && (
                  <button
                    onClick={() => {
                      setRegionSearchTerm('');
                      setRegionDropdownOpen(false);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                    style={{ fontSize: '20px' }}
                  >
                    <FiX size={22} />
                  </button>
                )}
                {regionDropdownOpen && filteredRegionOptions.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-96 overflow-y-auto">
                    {filteredRegionOptions.map((option) => (
                      <div
                        key={option.value}
                        onMouseDown={(e) => {
                          e.preventDefault(); // onBlur가 먼저 실행되지 않도록
                          handleRegionSelect(option.value, option.label);
                        }}
                        className={`px-5 py-4 md:px-6 md:py-5 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                          selectedRegion === option.value ? 'bg-blue-100 font-bold' : 'font-medium'
                        }`}
                        style={{ minHeight: '56px' }}
                      >
                        <div className="text-lg md:text-xl text-gray-900">{option.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 연관 검색어 - 상품이 있을 때만 표시 */}
          {relatedSearchTerms.length > 0 && (
            <div className="mt-6 md:mt-8">
              <p className="text-base md:text-lg font-semibold text-gray-800 mb-4 md:mb-5">연관 검색어:</p>
              <div className="flex flex-wrap gap-3 md:gap-4">
                {relatedSearchTerms.map((term, index) => (
                  <button
                    key={`${term.label}-${index}`}
                    onClick={() => handleRelatedSearch(term.cruiseLine, term.region, term.keyword)}
                    className="px-5 py-3 md:px-6 md:py-4 bg-gray-100 text-gray-800 rounded-full text-base md:text-lg hover:bg-gray-200 transition-colors font-semibold border-2 border-transparent hover:border-gray-300 shadow-sm"
                    style={{ minHeight: '48px' }}
                  >
                    {term.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 검색 결과 */}
          <div className="mt-8 md:mt-10">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8">검색 결과</h3>
            {isLoading ? (
              <div className="flex justify-center items-center py-16 md:py-20">
                <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-b-4 border-blue-600"></div>
                <p className="ml-4 md:ml-6 text-lg md:text-xl text-gray-700 font-medium">상품을 검색 중...</p>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : hasSearched ? (
              <div className="text-center py-16 md:py-20 text-gray-600">
                <p className="text-xl md:text-2xl font-semibold mb-3">검색된 상품이 없습니다.</p>
                <p className="text-base md:text-lg">다른 검색 조건을 시도해보세요.</p>
              </div>
            ) : (
              <div className="text-center py-16 md:py-20 text-gray-600">
                <p className="text-xl md:text-2xl font-semibold">원하는 크루즈와 지역을 선택하여 검색해보세요.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

