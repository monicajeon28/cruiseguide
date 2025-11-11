'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiDownload, FiRefreshCw, FiEye, FiSearch } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import ItineraryPatternEditor, { ItineraryDay } from '@/components/admin/ItineraryPatternEditor';
import DateRangePicker from '@/components/admin/DateRangePicker';
import { showSuccess, showError } from '@/components/ui/Toast';
import cruiseShipsData from '@/data/cruise_ships.json';
import countries from '@/data/countries.json';
import { getKoreanCruiseLineName, getKoreanShipName, formatTravelPeriod } from '@/lib/utils/cruiseNames';
import { Option } from '@/components/CountrySelect';
import { normalize } from '@/utils/normalize';
import ProductTagsSelector from '@/components/admin/ProductTagsSelector';

const MultiCountrySelect = dynamic(() => import('@/components/CountrySelect'), { ssr: false }) as React.ComponentType<any>;

/**
 * 크루즈 상품 관리 페이지
 * 작업자 C (UX/기능 전문가) - CMS UI
 */

interface Product {
  id: number;
  productCode: string;
  cruiseLine: string;
  shipName: string;
  packageName: string;
  nights: number;
  days: number;
  itineraryPattern: any;
  basePrice: number | null;
  description: string | null;
  source: string | null;
  saleStatus?: string; // 판매 상태: '판매중', '판매완료', '판매중지'
  isUrgent?: boolean; // 긴급 상품 여부
  isMainProduct?: boolean; // 주력 상품 여부
  isPopular?: boolean; // 인기 크루즈
  isRecommended?: boolean; // 추천 크루즈
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  recommendedKeywords?: string[] | any; // 추천 키워드 배열
  tags?: string[] | null; // 후킹 태그
  mallProductContent?: {
    layout?: any;
  } | null;
}

export default function ProductsManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSources, setImportSources] = useState<any[]>([]);

  // 필터 상태
  const [saleStatusFilter, setSaleStatusFilter] = useState<'all' | '판매중' | '판매중지' | '판매완료'>('all');
  const [cruiseLineFilter, setCruiseLineFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 검색 가능한 드롭다운 상태
  const [cruiseLineSearchTerm, setCruiseLineSearchTerm] = useState('');
  const [cruiseLineDropdownOpen, setCruiseLineDropdownOpen] = useState(false);
  const [shipNameSearchTerm, setShipNameSearchTerm] = useState('');
  const [shipNameDropdownOpen, setShipNameDropdownOpen] = useState(false);
  const cruiseLineDropdownRef = useRef<HTMLDivElement>(null);
  const shipNameDropdownRef = useRef<HTMLDivElement>(null);

  // 추천 키워드 드롭다운 상태
  const [keywordSearchTerm, setKeywordSearchTerm] = useState('');
  const [keywordDropdownOpen, setKeywordDropdownOpen] = useState(false);
  const keywordDropdownRef = useRef<HTMLDivElement>(null);

  // 방문 국가 선택 상태
  const [visitCount, setVisitCount] = useState<number>(3);
  const [selectedCountries, setSelectedCountries] = useState<Option[]>([]);
  const [countrySearchTerm, setCountrySearchTerm] = useState('');

  // 추천 키워드 목록 (실제 검색량이 많은 키워드 50개 - 구글/네이버 검색량 기준)
  const RECOMMENDED_KEYWORDS = [
    // 인기 여행 목적지/테마
    '신혼여행', '칠순잔치', '가족여행', '주말크루즈', '부산출발', '일본크루즈', '온리캐빈', '자유크루즈',
    '동남아크루즈', '지중해크루즈', '알래스카크루즈', '홍콩크루즈', '싱가포르크루즈', '베트남크루즈',
    '태국크루즈', '필리핀크루즈', '대만크루즈', '중국크루즈', '커플여행', '친구여행',
    '은퇴여행', '생일여행', '기념일여행', '허니문', '부모님여행', '자녀여행',
    '단체여행', 'MT여행', '워크샵여행', '회사여행', '연수여행', '인센티브여행',
    '골프크루즈', '요트크루즈', '프리미엄크루즈', '럭셔리크루즈', '할인크루즈', '특가크루즈',
    '이벤트크루즈', '시즌크루즈', '여름크루즈', '겨울크루즈', '봄크루즈', '가을크루즈',
    // 추가 인기 키워드
    '인천출발', '서울출발', '제주크루즈', '해외크루즈', '국내크루즈', '신규크루즈', '조기예약', '마지막특가',
    '신규선박', '프리미엄선박', '럭셔리선박', '올인클루시브', '올인클루시브크루즈'
  ];

  // 폼 상태
  const [formData, setFormData] = useState({
    productCode: '',
    cruiseLine: '',
    shipName: '',
    packageName: '',
    nights: 0,
    days: 0,
    itineraryPattern: [] as ItineraryDay[],
    basePrice: '',
    description: '',
    startDate: '',
    endDate: '',
    saleStatus: '판매중' as '판매중' | '판매완료' | '판매중지', // 판매 상태
    isUrgent: false, // 긴급 상품 여부
    isMainProduct: false, // 주력 상품 여부
    isPopular: false, // 인기 크루즈
    isRecommended: false, // 추천 크루즈
    recommendedKeywords: [] as string[], // 추천 키워드 (최대 5개)
    tags: [] as string[], // 후킹 태그 (최대 3개)
    rating: 4.5, // 별점
    reviewCount: 0, // 리뷰 개수
    badges: [] as string[], // 추가 딱지들 (이벤트, 테마, 출발임박, 패키지확정, 마감임박)
  });

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
    if (!formData.cruiseLine) return [];
    
    const selectedLine = (cruiseShipsData as any[]).find((line) => {
      const cruiseLineShort = line.cruise_line.split('(')[0].trim();
      return cruiseLineShort === formData.cruiseLine;
    });

    if (!selectedLine) return [];

    const options: Array<{ value: string; label: string }> = [];
    selectedLine.ships.forEach((ship: string) => {
      const shipNameShort = ship.split('(')[0].trim(); // 한국어 이름
      
      // 중복 제거 로직
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
  }, [formData.cruiseLine]);

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
    const option = cruiseLineOptions.find(opt => opt.value === formData.cruiseLine);
    return option?.label || formData.cruiseLine || '';
  }, [formData.cruiseLine, cruiseLineOptions]);

  // 선택된 크루즈선 이름 라벨
  const selectedShipNameLabel = useMemo(() => {
    const option = shipNameOptions.find(opt => opt.value === formData.shipName);
    return option?.label || formData.shipName || '';
  }, [formData.shipName, shipNameOptions]);

  // 목적지 옵션 (국가 + 지역)
  const destinationOptions = useMemo<Option[]>(() => {
    const out: Option[] = [];
    (countries as any[]).forEach(cont => {
      (cont?.countries || []).forEach((c: any) => {
        if (c?.name) out.push({ value: c.name, label: c.name });
        if (Array.isArray(c?.regions)) {
          c.regions.forEach((r: string) => {
            const v = `${c.name} - ${r}`;
            out.push({ value: v, label: v });
          });
        }
      });
    });
    const map = new Map<string, Option>();
    out.forEach(o => map.set(o.value, o));
    return Array.from(map.values());
  }, []);

  // 고유한 크루즈선사 목록 (필터용) - 이미 한국어로 저장되어 있음
  const uniqueCruiseLines = useMemo(() => {
    const lines = new Set<string>();
    products.forEach(p => {
      // 이미 한국어로 저장되어 있으므로 그대로 사용
      if (p.cruiseLine) {
        const koreanName = p.cruiseLine.split('(')[0].trim(); // 괄호 앞 부분만 (한국어)
        if (koreanName) lines.add(koreanName);
      }
    });
    return Array.from(lines).sort();
  }, [products]);

  // 고유한 방문 국가 목록 (필터용)
  const uniqueCountries = useMemo(() => {
    const countries = new Set<string>();
    const countryNames: Record<string, string> = {
      'JP': '일본', 'KR': '한국', 'TH': '태국', 'VN': '베트남', 'MY': '말레이시아',
      'SG': '싱가포르', 'ES': '스페인', 'FR': '프랑스', 'IT': '이탈리아', 'GR': '그리스',
      'TR': '터키', 'US': '미국', 'CN': '중국', 'TW': '대만', 'HK': '홍콩',
      'PH': '필리핀', 'ID': '인도네시아', 'NO': '노르웨이', 'HR': '크로아티아'
    };
    products.forEach(p => {
      if (p.itineraryPattern && Array.isArray(p.itineraryPattern)) {
        p.itineraryPattern.forEach((day: any) => {
          if (day.country && day.country !== 'KR') {
            const countryName = countryNames[day.country] || day.country;
            if (countryName) countries.add(countryName);
          }
        });
      }
    });
    return Array.from(countries).sort();
  }, [products]);

  // 필터링된 상품 목록
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // 판매 상태 필터
    if (saleStatusFilter !== 'all') {
      filtered = filtered.filter(p => (p.saleStatus || '판매중') === saleStatusFilter);
    }

    // 크루즈별 필터
    if (cruiseLineFilter !== 'all') {
      filtered = filtered.filter(p => {
        // 이미 한국어로 저장되어 있으므로 직접 비교
        const koreanName = p.cruiseLine ? p.cruiseLine.split('(')[0].trim() : '';
        return koreanName === cruiseLineFilter || p.cruiseLine === cruiseLineFilter;
      });
    }

    // 방문 국가별 필터
    if (countryFilter !== 'all') {
      filtered = filtered.filter(p => {
        if (!p.itineraryPattern || !Array.isArray(p.itineraryPattern)) return false;
        const countryNames: Record<string, string> = {
          'JP': '일본', 'KR': '한국', 'TH': '태국', 'VN': '베트남', 'MY': '말레이시아',
          'SG': '싱가포르', 'ES': '스페인', 'FR': '프랑스', 'IT': '이탈리아', 'GR': '그리스',
          'TR': '터키', 'US': '미국', 'CN': '중국', 'TW': '대만', 'HK': '홍콩',
          'PH': '필리핀', 'ID': '인도네시아', 'NO': '노르웨이', 'HR': '크로아티아'
        };
        return p.itineraryPattern.some((day: any) => {
          const countryCode = day.country;
          const countryName = countryNames[countryCode] || countryCode;
          return countryName === countryFilter || countryCode === countryFilter;
        });
      });
    }

    // 빠른 검색
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => {
        // 이미 한국어로 저장되어 있으므로 직접 사용
        const koreanCruiseLine = p.cruiseLine ? p.cruiseLine.split('(')[0].trim() : '';
        const koreanShipName = p.shipName ? p.shipName.split('(')[0].trim() : '';
        return (
          p.productCode.toLowerCase().includes(term) ||
          p.packageName.toLowerCase().includes(term) ||
          koreanCruiseLine.toLowerCase().includes(term) ||
          koreanShipName.toLowerCase().includes(term) ||
          p.cruiseLine.toLowerCase().includes(term) ||
          p.shipName.toLowerCase().includes(term)
        );
      });
    }

    return filtered;
  }, [products, saleStatusFilter, cruiseLineFilter, countryFilter, searchTerm]);

  // 공통 필터 (한/영, 공백, 대소문자 무시)
  const filterOption = (opt: any, raw: string) =>
    normalize(opt?.label ?? '')?.includes(normalize(raw));

  // 연관검색 칩: 입력값 기준 상위 5개 추천
  const countryChips = useMemo(() => {
    if (!countrySearchTerm) return [];
    const n = normalize(countrySearchTerm);
    return destinationOptions
      .filter(o => normalize(o.label).includes(n))
      .slice(0, 5);
  }, [countrySearchTerm, destinationOptions]);

  const [saleStatusDropdownOpen, setSaleStatusDropdownOpen] = useState<number | null>(null); // 판매 상태 드롭다운 열림 상태
  const saleStatusDropdownRefs = useRef<Map<number, HTMLDivElement>>(new Map()); // 각 상품별 판매 상태 드롭다운 ref

  const handleCruiseLineSelect = (value: string, label: string) => {
    // 영어 이름을 우선적으로 사용 (검색 API와 일치하도록)
    setFormData({ ...formData, cruiseLine: value, shipName: '' }); // 크루즈선사 변경 시 크루즈선 이름 초기화
    setCruiseLineSearchTerm('');
    setCruiseLineDropdownOpen(false);
  };

  const handleShipNameSelect = (value: string, label: string) => {
    // 영어 이름을 우선적으로 사용 (검색 API와 일치하도록)
    setFormData({ ...formData, shipName: value });
    setShipNameSearchTerm('');
    setShipNameDropdownOpen(false);
  };

  // 필터링된 추천 키워드 목록
  const filteredKeywords = useMemo(() => {
    if (!keywordSearchTerm) return RECOMMENDED_KEYWORDS;
    const searchTerm = keywordSearchTerm.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
    return RECOMMENDED_KEYWORDS.filter(keyword => {
      const cleaned = keyword.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
      return cleaned.includes(searchTerm);
    });
  }, [keywordSearchTerm]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cruiseLineDropdownRef.current && !cruiseLineDropdownRef.current.contains(event.target as Node)) {
        setCruiseLineDropdownOpen(false);
      }
      if (shipNameDropdownRef.current && !shipNameDropdownRef.current.contains(event.target as Node)) {
        setShipNameDropdownOpen(false);
      }
      if (keywordDropdownRef.current && !keywordDropdownRef.current.contains(event.target as Node)) {
        setKeywordDropdownOpen(false);
      }
      // 판매 상태 드롭다운 외부 클릭 시 닫기 (모든 상품의 드롭다운 확인)
      if (saleStatusDropdownOpen !== null) {
        const clickedInsideAnyDropdown = Array.from(saleStatusDropdownRefs.current.values()).some(
          (ref) => ref && ref.contains(event.target as Node)
        );
        if (!clickedInsideAnyDropdown) {
          setSaleStatusDropdownOpen(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [saleStatusDropdownOpen]);

  // URL 쿼리 파라미터에서 edit 값이 있으면 해당 상품을 수정 모달에 열기
  useEffect(() => {
    const editProductCode = searchParams?.get('edit');
    if (editProductCode && products.length > 0) {
      const productToEdit = products.find(p => p.productCode === editProductCode);
      if (productToEdit) {
        openEditModal(productToEdit);
        // URL에서 쿼리 파라미터 제거 (뒤로가기 시 모달이 다시 열리지 않도록)
        window.history.replaceState({}, '', '/admin/products');
      }
    }
  }, [searchParams, products]);

  // 선택된 국가들의 값 문자열 (의존성 배열용)
  const selectedCountriesKey = useMemo(() => {
    return selectedCountries.map(c => c.value).join(',');
  }, [selectedCountries]);

  // 방문 국가 개수에 따라 일정 패턴 자동 생성
  useEffect(() => {
    if (!isModalOpen) return;
    
    // 방문 국가가 없으면 일정 패턴을 초기화하지 않음 (사용자가 직접 설정할 수 있도록)
    if (selectedCountries.length === 0) return;
    
    console.log('[Admin Products] 방문 국가 변경 감지:', selectedCountries.length, '개국');
    
    // 방문 국가 코드 매핑
    const koreanNameToCode: Record<string, string> = {
      '일본': 'JP', 'Japan': 'JP',
      '태국': 'TH', 'Thailand': 'TH',
      '베트남': 'VN', 'Vietnam': 'VN',
      '싱가포르': 'SG', 'Singapore': 'SG',
      '인도네시아': 'ID', 'Indonesia': 'ID',
      '말레이시아': 'MY', 'Malaysia': 'MY',
      '스페인': 'ES', 'Spain': 'ES',
      '프랑스': 'FR', 'France': 'FR',
      '이탈리아': 'IT', 'Italy': 'IT',
      '그리스': 'GR', 'Greece': 'GR',
      '터키': 'TR', 'Turkey': 'TR',
      '미국': 'US', 'USA': 'US',
      '중국': 'CN', 'China': 'CN',
      '대만': 'TW', 'Taiwan': 'TW',
      '홍콩': 'HK', 'Hong Kong': 'HK',
      '필리핀': 'PH', 'Philippines': 'PH',
      '캐나다': 'CA', 'Canada': 'CA',
    };
    
    const countryCodeMap = new Map<string, string>();
    destinationOptions.forEach(opt => {
      const koreanName = opt.label.split('(')[0].trim();
      const code = koreanNameToCode[koreanName];
      if (code) {
        countryCodeMap.set(opt.value, code);
        countryCodeMap.set(opt.label, code);
        countryCodeMap.set(koreanName, code);
      }
    });
    
    const selectedCountryCodes = selectedCountries.map(country => {
      const koreanName = country.value.split('(')[0].trim().split(' - ')[0].trim();
      return countryCodeMap.get(country.value) || 
             countryCodeMap.get(country.label) || 
             countryCodeMap.get(koreanName) ||
             koreanNameToCode[koreanName] ||
             '';
    }).filter(code => code !== '');
    
    if (selectedCountryCodes.length === 0) {
      console.log('[Admin Products] 국가 코드 변환 실패');
      return;
    }
    
    console.log('[Admin Products] 선택된 국가 코드:', selectedCountryCodes);
    
    // 현재 formData의 일정 패턴을 가져오기 (최신 상태)
    setFormData(prev => {
      const currentPortVisits = prev.itineraryPattern.filter((day: ItineraryDay) => day.type === 'PortVisit');
      console.log('[Admin Products] 현재 기항지 개수:', currentPortVisits.length, '선택된 국가 개수:', selectedCountryCodes.length);
      
      // 방문 국가 개수와 일정 개수가 다르면 자동으로 조정
      if (selectedCountryCodes.length !== currentPortVisits.length) {
        console.log('[Admin Products] 일정 패턴 자동 생성 시작');
        const newPattern: ItineraryDay[] = [];
        
        // 첫 번째 일정: 승선
        if (prev.itineraryPattern.length > 0 && prev.itineraryPattern[0].type === 'Embarkation') {
          const embarkation = prev.itineraryPattern[0];
          newPattern.push({
            ...embarkation,
            country: selectedCountryCodes[0] || embarkation.country,
          });
        } else {
          newPattern.push({
            day: 1,
            type: 'Embarkation',
            location: '',
            country: selectedCountryCodes[0] || '',
            currency: 'USD',
            language: 'en',
          });
        }
        
        // 방문 국가 개수만큼 기항지 일정 생성
        selectedCountryCodes.forEach((countryCode, index) => {
          const existingDay = currentPortVisits[index];
          newPattern.push({
            day: index + 2,
            type: 'PortVisit',
            location: existingDay?.location || '',
            country: countryCode,
            currency: existingDay?.currency || 'USD',
            language: existingDay?.language || 'en',
            arrival: existingDay?.arrival || '',
            departure: existingDay?.departure || '',
          });
        });
        
        // 마지막 일정: 하선
        const lastDay = prev.itineraryPattern[prev.itineraryPattern.length - 1];
        if (lastDay && lastDay.type === 'Disembarkation') {
          newPattern.push({
            ...lastDay,
            day: selectedCountryCodes.length + 2,
            country: selectedCountryCodes[selectedCountryCodes.length - 1] || lastDay.country,
          });
        } else {
          newPattern.push({
            day: selectedCountryCodes.length + 2,
            type: 'Disembarkation',
            location: '',
            country: selectedCountryCodes[selectedCountryCodes.length - 1] || '',
            currency: 'USD',
            language: 'en',
          });
        }
        
        console.log('[Admin Products] 새 일정 패턴 생성 완료:', newPattern.length, '개 일정');
        return { ...prev, itineraryPattern: newPattern };
      } else {
        // 개수는 같지만 국가 코드가 다를 수 있으므로 업데이트
        const updatedPattern = prev.itineraryPattern.map((day: ItineraryDay, index: number) => {
          if (day.type === 'PortVisit') {
            const portIndex = prev.itineraryPattern
              .slice(0, index)
              .filter((d: ItineraryDay) => d.type === 'PortVisit').length;
            if (portIndex < selectedCountryCodes.length) {
              return { ...day, country: selectedCountryCodes[portIndex] };
            }
          } else if (day.type === 'Embarkation' && index === 0 && selectedCountryCodes.length > 0) {
            return { ...day, country: selectedCountryCodes[0] };
          } else if (day.type === 'Disembarkation' && index === prev.itineraryPattern.length - 1 && selectedCountryCodes.length > 0) {
            return { ...day, country: selectedCountryCodes[selectedCountryCodes.length - 1] };
          }
          return day;
        });
        
        // 변경사항이 있으면 업데이트
        const hasChanges = updatedPattern.some((day: ItineraryDay, index: number) => {
          const original = prev.itineraryPattern[index];
          return day.country !== original?.country;
        });
        
        if (hasChanges) {
          console.log('[Admin Products] 일정 패턴 국가 코드 업데이트');
          return { ...prev, itineraryPattern: updatedPattern };
        }
      }
      
      return prev;
    });
  }, [selectedCountries.length, selectedCountriesKey, isModalOpen, destinationOptions]); // selectedCountries의 값 변경 감지

  // 컴포넌트 마운트 시 상품 목록 및 import 소스 로드
  useEffect(() => {
    loadProducts();
    loadImportSources();
  }, []);

  const loadImportSources = async () => {
    try {
      const response = await fetch('/api/admin/products/import', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setImportSources(data.sources);
        }
      }
    } catch (error) {
      console.error('Error loading import sources:', error);
    }
  };

  const handleImport = async (sourceKey: string) => {
    if (!confirm(`${sourceKey} API에서 상품을 가져오시겠습니까?`)) return;

    try {
      setIsImporting(true);
      const response = await fetch('/api/admin/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ source: sourceKey }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        showSuccess(data.message);
        loadProducts();
      } else {
        showError(data.message || '상품 가져오기에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error importing products:', error);
      showError('상품 가져오기에 실패했습니다.');
    } finally {
      setIsImporting(false);
    }
  };

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/products', {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Admin Products] API Response:', data);
      
      if (data.ok && Array.isArray(data.products)) {
        // 필드 안전 처리: 누락된 필드에 기본값 설정
        const safeProducts = data.products.map((product: any) => ({
          ...product,
          saleStatus: product.saleStatus || '판매중',
          isUrgent: product.isUrgent ?? false,
          isMainProduct: product.isMainProduct ?? false,
          mallProductContent: product.MallProductContent || null, // MallProductContent를 mallProductContent로 변환
          MallProductContent: undefined, // 원본 제거
        }));
        setProducts(safeProducts);
        console.log('[Admin Products] Loaded products:', safeProducts.length);
      } else {
        console.error('[Admin Products] Invalid response format:', data);
        showError(data.error || data.message || '상품 목록 형식이 올바르지 않습니다.');
        setProducts([]);
      }
    } catch (error: any) {
      console.error('[Admin Products] Error loading products:', error);
      showError(error.message || '상품 목록을 불러오는데 실패했습니다.');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      productCode: '',
      cruiseLine: '',
      shipName: '',
      packageName: '',
      nights: 0,
      days: 0,
      itineraryPattern: [],
      basePrice: '',
      description: '',
      startDate: '',
      endDate: '',
      saleStatus: '판매중',
      isUrgent: false,
      isMainProduct: false,
      isPopular: false,
      isRecommended: false,
      recommendedKeywords: [],
      tags: [],
      rating: 4.5,
      reviewCount: 0,
      badges: [],
    });
    setVisitCount(3);
    setSelectedCountries([]);
    setCountrySearchTerm('');
    setCruiseLineSearchTerm('');
    setShipNameSearchTerm('');
    setCruiseLineDropdownOpen(false);
    setShipNameDropdownOpen(false);
    setIsModalOpen(true);
  };

  // 국가 코드 -> 한국어 이름 매핑 (countries.json 기반)
  const countryCodeToKoreanName = useMemo(() => {
    const map = new Map<string, string>();
    (countries as any[]).forEach(cont => {
      (cont?.countries || []).forEach((c: any) => {
        if (c?.name) {
          // "대한민국 (South Korea)" 형식에서 한국어 이름만 추출
          const koreanName = c.name.split('(')[0].trim();
          // 국가 코드 추출 (ISO 3166-1 alpha-2 코드 매핑)
          const countryCodeMap: Record<string, string> = {
            '대한민국': 'KR', '한국': 'KR',
            '일본': 'JP',
            '중국': 'CN',
            '대만': 'TW',
            '홍콩': 'HK',
            '필리핀': 'PH',
            '미국': 'US',
            '캐나다': 'CA',
            '멕시코': 'MX',
            '영국': 'GB',
            '프랑스': 'FR',
            '독일': 'DE',
            '이탈리아': 'IT',
            '스페인': 'ES',
            '그리스': 'GR',
            '호주': 'AU', '오스트레일리아': 'AU',
            '뉴질랜드': 'NZ',
            '태국': 'TH',
            '베트남': 'VN',
            '싱가포르': 'SG',
            '인도네시아': 'ID',
            '말레이시아': 'MY',
            '터키': 'TR', '튀르키예': 'TR',
            '노르웨이': 'NO',
            '크로아티아': 'HR',
          };
          const code = countryCodeMap[koreanName];
          if (code) {
            map.set(code, koreanName);
          }
        }
      });
    });
    return map;
  }, []);

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    
    // itineraryPattern에서 방문 국가 추출 (countries.json의 한국어 이름 사용)
    const countriesFromPattern: Option[] = [];
    if (Array.isArray(product.itineraryPattern)) {
      product.itineraryPattern.forEach((day: ItineraryDay) => {
        if (day.country && day.country !== 'KR') {
          // 국가 코드를 한국어 이름으로 변환
          const koreanName = countryCodeToKoreanName.get(day.country) || day.country;
          // destinationOptions에서 정확히 일치하는 옵션 찾기
          const matchingOption = destinationOptions.find(opt => {
            const optKoreanName = opt.label.split('(')[0].trim();
            return optKoreanName === koreanName || opt.value === koreanName;
          });
          
          if (matchingOption && !countriesFromPattern.find(c => c.value === matchingOption.value)) {
            countriesFromPattern.push(matchingOption);
          } else if (!matchingOption && !countriesFromPattern.find(c => c.value === koreanName)) {
            // 매칭되는 옵션이 없으면 한국어 이름으로 직접 추가
            countriesFromPattern.push({ value: koreanName, label: koreanName });
          }
        }
      });
    }
    
    // tags 파싱
    let tags: string[] = [];
    if (product.tags) {
      if (Array.isArray(product.tags)) {
        tags = product.tags;
      } else if (typeof product.tags === 'string') {
        try {
          tags = JSON.parse(product.tags);
        } catch (e) {
          tags = [];
        }
      }
    }
    
    // rating과 reviewCount는 MallProductContent.layout에서 가져오기
    let rating = 4.5;
    let reviewCount = 0;
    let badges: string[] = [];
    let recommendedKeywords: string[] = [];
    if (product.mallProductContent?.layout) {
      const layout = typeof product.mallProductContent.layout === 'string'
        ? JSON.parse(product.mallProductContent.layout)
        : product.mallProductContent.layout;
      rating = layout.rating || 4.5;
      reviewCount = layout.reviewCount || 0;
      badges = layout.badges || [];
      recommendedKeywords = layout.recommendedKeywords || [];
    }
    
    setFormData({
      productCode: product.productCode,
      cruiseLine: product.cruiseLine,
      shipName: product.shipName,
      packageName: product.packageName,
      nights: product.nights,
      days: product.days,
      itineraryPattern: Array.isArray(product.itineraryPattern) 
        ? product.itineraryPattern 
        : [],
      basePrice: product.basePrice?.toString() || '',
      description: product.description || '',
      startDate: product.startDate ? new Date(product.startDate).toISOString().split('T')[0] : '',
      endDate: product.endDate ? new Date(product.endDate).toISOString().split('T')[0] : '',
      saleStatus: (product.saleStatus as '판매중' | '판매완료' | '판매중지') || '판매중',
      isUrgent: product.isUrgent || false,
      isMainProduct: product.isMainProduct || false,
      isPopular: product.isPopular || false,
      isRecommended: product.isRecommended || false,
      recommendedKeywords: recommendedKeywords,
      tags: tags,
      rating: rating,
      reviewCount: reviewCount,
      badges: badges,
    });
    setVisitCount(countriesFromPattern.length || 3);
    setSelectedCountries(countriesFromPattern);
    setCountrySearchTerm('');
    setCruiseLineSearchTerm('');
    setShipNameSearchTerm('');
    setCruiseLineDropdownOpen(false);
    setShipNameDropdownOpen(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 검색 기능과 일치하도록 cruiseLine과 shipName 검증
    if (!formData.cruiseLine || !formData.shipName) {
      showError('크루즈선사와 크루즈선 이름을 모두 선택해주세요.');
      return;
    }

    // 여행 시작일/종료일 필수 검증 (온보딩 연결 필수)
    if (!formData.startDate || !formData.endDate) {
      showError('여행 시작일과 종료일을 모두 입력해주세요. (온보딩 연결에 필수입니다)');
      return;
    }

    // 방문 국가 선택 검증
    if (selectedCountries.length === 0) {
      showError('방문 국가를 최소 1개 이상 선택해주세요.');
      return;
    }

    // 선택한 방문 국가를 itineraryPattern에 자동 반영
    let updatedPattern = [...formData.itineraryPattern];
    
    // 선택한 국가 이름을 국가 코드로 변환 (countries.json 기반)
    const countryCodeMap = new Map<string, string>();
    // countries.json에서 한국어 이름 -> 국가 코드 매핑 생성
    const koreanNameToCode: Record<string, string> = {
      '대한민국': 'KR', '한국': 'KR',
      '일본': 'JP',
      '중국': 'CN',
      '대만': 'TW',
      '홍콩': 'HK',
      '필리핀': 'PH',
      '미국': 'US',
      '캐나다': 'CA',
      '멕시코': 'MX',
      '영국': 'GB',
      '프랑스': 'FR',
      '독일': 'DE',
      '이탈리아': 'IT',
      '스페인': 'ES',
      '그리스': 'GR',
      '호주': 'AU', '오스트레일리아': 'AU',
      '뉴질랜드': 'NZ',
      '태국': 'TH',
      '베트남': 'VN',
      '싱가포르': 'SG',
      '인도네시아': 'ID',
      '말레이시아': 'MY',
      '터키': 'TR', '튀르키예': 'TR',
      '노르웨이': 'NO',
      '크로아티아': 'HR',
    };
    
    // destinationOptions의 모든 옵션에 대해 매핑 생성
    destinationOptions.forEach(opt => {
      const koreanName = opt.label.split('(')[0].trim();
      const code = koreanNameToCode[koreanName];
      if (code) {
        countryCodeMap.set(opt.value, code);
        countryCodeMap.set(opt.label, code);
        countryCodeMap.set(koreanName, code);
      }
    });

    // 선택한 국가 코드 배열 생성
    const selectedCountryCodes = selectedCountries.map(country => {
      // country.value는 "일본" 또는 "일본 - 도쿄" 형식일 수 있음
      const koreanName = country.value.split('(')[0].trim().split(' - ')[0].trim();
      return countryCodeMap.get(country.value) || 
             countryCodeMap.get(country.label) || 
             countryCodeMap.get(koreanName) ||
             koreanNameToCode[koreanName] ||
             '';
    }).filter(code => code !== '');

    // itineraryPattern의 모든 일정에 국가 코드 설정
    // 1. PortVisit 타입 일정에 순서대로 국가 코드 할당
    const portVisitDays = updatedPattern
      .map((day, index) => ({ day, index }))
      .filter(({ day }) => day.type === 'PortVisit');
    
    portVisitDays.forEach(({ day, index }, portIndex) => {
      if (portIndex < selectedCountryCodes.length) {
        const dayIndex = updatedPattern.findIndex(d => d.day === day.day);
        if (dayIndex !== -1) {
          updatedPattern[dayIndex] = { 
            ...updatedPattern[dayIndex], 
            country: selectedCountryCodes[portIndex] 
          };
        }
      }
    });

    // 2. Embarkation/Disembarkation 타입 일정에도 첫 번째 국가 코드 할당 (없는 경우)
    updatedPattern.forEach((day, index) => {
      if ((day.type === 'Embarkation' || day.type === 'Disembarkation') && !day.country) {
        if (selectedCountryCodes.length > 0) {
          updatedPattern[index] = { 
            ...updatedPattern[index], 
            country: selectedCountryCodes[0] 
          };
        }
      }
    });

    // itineraryPattern의 country 필드 검증 (검색 기능에 사용됨)
    if (!updatedPattern || updatedPattern.length === 0) {
      showError('최소 하나 이상의 일정을 추가해주세요.');
      return;
    }

    const hasInvalidCountry = updatedPattern.some((day: ItineraryDay) => {
      if (day.type === 'PortVisit' || day.type === 'Embarkation' || day.type === 'Disembarkation') {
        return !day.country || day.country.trim() === '';
      }
      return false;
    });

    if (hasInvalidCountry) {
      showError('모든 기항지/승선지/하선지의 국가 정보를 입력해주세요. (검색 기능에 필요합니다)');
      return;
    }

    try {
      const payload = {
        ...formData,
        nights: parseInt(formData.nights.toString()),
        days: parseInt(formData.days.toString()),
        basePrice: formData.basePrice ? parseInt(formData.basePrice) : null,
        itineraryPattern: updatedPattern, // 업데이트된 패턴 사용
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        // 수동 등록 상품은 항상 판매중으로 설정 (수정 시에는 기존 값 유지)
        saleStatus: editingProduct ? (formData.saleStatus || '판매중') : '판매중',
        isUrgent: formData.isUrgent || false, // 긴급 상품 여부 추가
        isMainProduct: formData.isMainProduct || false, // 주력 상품 여부 추가
        isPopular: formData.isPopular || false, // 인기 크루즈
        isRecommended: formData.isRecommended || false, // 추천 크루즈
        source: 'manual', // 수동 등록임을 명시
        tags: formData.tags || [], // 후킹 태그 추가
        // 검색 기능과 일치하도록 영어 이름 저장 (이미 value에 영어 이름이 저장되어 있음)
        cruiseLine: formData.cruiseLine.trim(),
        shipName: formData.shipName.trim(),
      };

      const url = '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';
      const body = editingProduct
        ? { id: editingProduct.id, ...payload }
        : payload;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (response.ok) {
        // rating과 reviewCount는 MallProductContent.layout에 저장
        const productData = await response.json();
        const productCode = productData.product?.productCode || editingProduct?.productCode || formData.productCode;
        
        // MallProductContent 업데이트
        try {
          const layoutResponse = await fetch(`/api/admin/mall/products/${productCode}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              layout: {
                rating: formData.rating,
                reviewCount: formData.reviewCount,
                badges: formData.badges || [],
                recommendedKeywords: formData.recommendedKeywords || [],
              },
            }),
          });
          
          if (!layoutResponse.ok) {
            console.error('Failed to save rating, reviewCount, badges, and recommendedKeywords');
          }
        } catch (layoutError) {
          console.error('Error saving rating, reviewCount, badges, and recommendedKeywords:', layoutError);
        }
        
        showSuccess(editingProduct ? '상품이 수정되었습니다.' : '상품이 등록되었습니다.');
        setIsModalOpen(false);
        loadProducts();
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save product');
      }
    } catch (error: any) {
      console.error('Error saving product:', error);
      showError(error.message || '상품 저장에 실패했습니다.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        showSuccess('상품이 삭제되었습니다.');
        loadProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      showError('상품 삭제에 실패했습니다.');
    }
  };

  const handleUpdateSaleStatus = async (productId: number, newStatus: '판매중' | '판매완료' | '판매중지') => {
    try {
      const response = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: productId,
          saleStatus: newStatus,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.message || data.error || '상품 상태 변경에 실패했습니다.');
      }

      showSuccess(`상품 상태가 "${newStatus}"로 변경되었습니다.`);
      loadProducts();
    } catch (error) {
      console.error('Error updating sale status:', error);
      showError(error instanceof Error ? error.message : '상품 상태 변경에 실패했습니다.');
    }
  };

  const handleToggleUrgent = async (productId: number, currentUrgent: boolean) => {
    // 긴급 상품 최대 3개 제한 확인
    if (!currentUrgent) {
      const urgentCount = products.filter(p => p.isUrgent && p.id !== productId).length;
      if (urgentCount >= 3) {
        showError('긴급 상품은 최대 3개까지 설정할 수 있습니다.');
        return;
      }
      
      // 주력 상품이면 해제
      const product = products.find(p => p.id === productId);
      if (product?.isMainProduct) {
        // 주력 상품 해제
        try {
          await fetch('/api/admin/products', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              id: productId,
              isMainProduct: false,
            }),
          });
        } catch (error) {
          console.error('Error updating main product status:', error);
        }
      }
    }

    try {
      const response = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: productId,
          isUrgent: !currentUrgent,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.message || data.error || '긴급 상태 변경에 실패했습니다.');
      }

      showSuccess(`상품이 ${!currentUrgent ? '긴급' : '일반'} 상품으로 변경되었습니다.`);
      loadProducts();
    } catch (error) {
      console.error('Error updating urgent status:', error);
      showError(error instanceof Error ? error.message : '긴급 상태 변경에 실패했습니다.');
    }
  };

  const handleToggleMainProduct = async (productId: number, currentMainProduct: boolean) => {
    // 주력 상품 최대 3개 제한 확인
    if (!currentMainProduct) {
      const mainProductCount = products.filter(p => p.isMainProduct && p.id !== productId).length;
      if (mainProductCount >= 3) {
        showError('주력 상품은 최대 3개까지 설정할 수 있습니다.');
        return;
      }
      
      // 긴급 상품이면 해제
      const product = products.find(p => p.id === productId);
      if (product?.isUrgent) {
        // 긴급 상품 해제
        try {
          await fetch('/api/admin/products', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              id: productId,
              isUrgent: false,
            }),
          });
        } catch (error) {
          console.error('Error updating urgent status:', error);
        }
      }
    }

    try {
      const response = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: productId,
          isMainProduct: !currentMainProduct,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.message || data.error || '주력 상태 변경에 실패했습니다.');
      }

      showSuccess(`상품이 ${!currentMainProduct ? '주력' : '일반'} 상품으로 변경되었습니다.`);
      loadProducts();
    } catch (error) {
      console.error('Error updating main product status:', error);
      showError(error instanceof Error ? error.message : '주력 상태 변경에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">크루즈 상품 관리</h1>
          <div className="flex gap-3">
            {importSources.length > 0 && (
              <div className="flex gap-2">
                {importSources.map((source) => (
                  <button
                    key={source.key}
                    onClick={() => handleImport(source.key)}
                    disabled={!source.enabled || isImporting}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold shadow-md ${
                      source.enabled
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    } ${isImporting ? 'opacity-60 cursor-wait' : ''}`}
                    title={source.enabled ? `${source.name} API에서 상품 가져오기` : `${source.name} API가 설정되지 않음`}
                  >
                    {isImporting ? (
                      <FiRefreshCw className="animate-spin" />
                    ) : (
                      <FiDownload />
                    )}
                    {source.name} 가져오기
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => router.push('/admin/products/new')}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold shadow-md"
            >
              <FiPlus />
              수동 등록
            </button>
          </div>
        </div>

        {/* 필터 및 검색 바 */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* 필터 탭 */}
            <div className="flex flex-wrap gap-2 flex-1">
              {/* 판매 상태 필터 */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">판매 상태:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSaleStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                      saleStatusFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    전체
                  </button>
                  <button
                    onClick={() => setSaleStatusFilter('판매중')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                      saleStatusFilter === '판매중'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    판매중
                  </button>
                  <button
                    onClick={() => setSaleStatusFilter('판매중지')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                      saleStatusFilter === '판매중지'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    판매중지
                  </button>
                  <button
                    onClick={() => setSaleStatusFilter('판매완료')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                      saleStatusFilter === '판매완료'
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    판매완료
                  </button>
                </div>
              </div>

              {/* 크루즈별 필터 */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">크루즈:</span>
                <select
                  value={cruiseLineFilter}
                  onChange={(e) => setCruiseLineFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">전체</option>
                  {uniqueCruiseLines.map(line => (
                    <option key={line} value={line}>{line}</option>
                  ))}
                </select>
              </div>

              {/* 방문 국가별 필터 */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">방문 국가:</span>
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">전체</option>
                  {uniqueCountries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 빠른 검색 */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <div className="relative flex-1 lg:flex-initial">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="상품코드, 패키지명, 크루즈명 검색..."
                  className="w-full lg:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FiX size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 필터 결과 요약 */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              총 <span className="font-semibold text-blue-600">{filteredProducts.length}</span>개 상품 표시
              {products.length !== filteredProducts.length && (
                <span className="text-gray-500"> (전체 {products.length}개 중)</span>
              )}
            </p>
          </div>
        </div>

        {/* 상품 목록 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">상품 목록을 불러오는 중...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed">
            <p className="text-gray-500 text-lg mb-4">등록된 상품이 없습니다</p>
            <button
              onClick={openCreateModal}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              첫 상품 등록하기 →
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed">
                <p className="text-gray-500 text-lg mb-4">필터 조건에 맞는 상품이 없습니다</p>
                <button
                  onClick={() => {
                    setSaleStatusFilter('all');
                    setCruiseLineFilter('all');
                    setCountryFilter('all');
                    setSearchTerm('');
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  필터 초기화 →
                </button>
              </div>
            ) : (
              <>
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {/* 판매 상태 드롭다운 (상품 코드 왼쪽) */}
                      <div 
                        className="relative" 
                        ref={(el) => {
                          if (el) {
                            saleStatusDropdownRefs.current.set(product.id, el);
                          } else {
                            saleStatusDropdownRefs.current.delete(product.id);
                          }
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSaleStatusDropdownOpen(saleStatusDropdownOpen === product.id ? null : product.id);
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all hover:shadow-md whitespace-nowrap ${
                            (product.saleStatus || '판매중') === '판매중'
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : (product.saleStatus || '판매중') === '판매완료'
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {product.saleStatus || '판매중'} ▼
                        </button>
                        {saleStatusDropdownOpen === product.id && (
                          <div className="absolute top-full left-0 mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-xl z-[9999] min-w-[150px]">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                await handleUpdateSaleStatus(product.id, '판매중');
                                setSaleStatusDropdownOpen(null);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm font-semibold hover:bg-green-50 transition-colors ${
                                (product.saleStatus || '판매중') === '판매중' ? 'bg-green-50 text-green-700' : 'text-gray-700'
                              }`}
                            >
                              판매중
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                await handleUpdateSaleStatus(product.id, '판매중지');
                                setSaleStatusDropdownOpen(null);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm font-semibold hover:bg-red-50 transition-colors ${
                                (product.saleStatus || '판매중') === '판매중지' ? 'bg-red-50 text-red-700' : 'text-gray-700'
                              }`}
                            >
                              판매중지
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                await handleUpdateSaleStatus(product.id, '판매완료');
                                setSaleStatusDropdownOpen(null);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors ${
                                (product.saleStatus || '판매중') === '판매완료' ? 'bg-gray-50 text-gray-700' : 'text-gray-700'
                              }`}
                            >
                              판매완료
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* 상품 코드 */}
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                        {product.productCode}
                      </span>
                      
                      {/* 테스트용 배지 (SAMPLE-MED-001) */}
                      {product.productCode === 'SAMPLE-MED-001' && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
                          🧪 테스트용
                        </span>
                      )}
                      
                      {product.source && (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          product.source === 'cruisedot'
                            ? 'bg-green-100 text-green-700'
                            : product.source === 'wcruise'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {product.source === 'cruisedot' ? 'CruiseDot' :
                           product.source === 'wcruise' ? 'WCruise' :
                           '수동'}
                        </span>
                      )}
                      {product.isUrgent && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-500 text-white animate-pulse">
                          🔥 긴급
                        </span>
                      )}
                      {product.isMainProduct && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white">
                          ⭐ 주력
                        </span>
                      )}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={product.isUrgent || false}
                          disabled={product.isMainProduct || (products.filter(p => p.isUrgent && p.id !== product.id).length >= 3 && !product.isUrgent)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleUrgent(product.id, product.isUrgent || false);
                          }}
                          className="w-4 h-4 text-red-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          title={product.isMainProduct ? "주력 상품과 동시에 설정할 수 없습니다" : "긴급 상품으로 설정하면 메인몰 최상단에 고정 표시됩니다 (최대 3개)"}
                        />
                        <span className={`text-xs ${product.isMainProduct ? 'text-gray-400' : 'text-gray-600'}`}>긴급</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={product.isMainProduct || false}
                          disabled={product.isUrgent || (products.filter(p => p.isMainProduct && p.id !== product.id).length >= 3 && !product.isMainProduct)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleMainProduct(product.id, product.isMainProduct || false);
                          }}
                          className="w-4 h-4 text-blue-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          title={product.isUrgent ? "긴급 상품과 동시에 설정할 수 없습니다" : "주력 상품으로 설정하면 메인몰 두 번째에 고정 표시됩니다 (최대 3개)"}
                        />
                        <span className={`text-xs ${product.isUrgent ? 'text-gray-400' : 'text-gray-600'}`}>주력</span>
                      </label>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {getKoreanCruiseLineName(product.cruiseLine)} - {getKoreanShipName(product.cruiseLine, product.shipName)}
                    </h3>
                    <p className="text-gray-600 text-lg mb-3">{product.packageName}</p>
                    <div className="flex gap-4 text-sm text-gray-500 mb-2">
                      <span>📅 {formatTravelPeriod(product.startDate, product.endDate, product.nights, product.days) || `${product.nights}박 ${product.days}일`}</span>
                      {product.basePrice && (
                        <span>💰 {product.basePrice.toLocaleString()}원</span>
                      )}
                    </div>
                    {/* 방문 국가 요약 */}
                    {(() => {
                      const itineraryPattern = Array.isArray(product.itineraryPattern) ? product.itineraryPattern : [];
                      const countries = new Set<string>();
                      const countryNames: Record<string, string> = {
                        'JP': '일본', 'KR': '한국', 'TH': '태국', 'VN': '베트남', 'MY': '말레이시아',
                        'SG': '싱가포르', 'ES': '스페인', 'FR': '프랑스', 'IT': '이탈리아', 'GR': '그리스',
                        'TR': '터키', 'US': '미국', 'CN': '중국', 'TW': '대만', 'HK': '홍콩',
                        'PH': '필리핀', 'ID': '인도네시아'
                      };
                      itineraryPattern.forEach((day: any) => {
                        if (day.country && day.country !== 'KR' && (day.type === 'PortVisit' || day.type === 'Embarkation' || day.type === 'Disembarkation')) {
                          countries.add(day.country);
                        }
                      });
                      const countryList = Array.from(countries).map(code => countryNames[code] || code).join(', ');
                      return countryList ? (
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-semibold">🌍 방문 국가:</span> {countryList}
                        </div>
                      ) : null;
                    })()}
                    {product.itineraryPattern && Array.isArray(product.itineraryPattern) && (
                      <span className="text-sm text-gray-500">🗺️ {product.itineraryPattern.length}개 일정</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/admin/products/${product.productCode}`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="상세 편집"
                    >
                      <FiEdit2 size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="삭제"
                    >
                      <FiTrash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* 상품 등록/수정 모달 */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                {/* 모달 헤더 */}
                <div className="sticky top-0 bg-white border-b-2 p-6 md:p-8 flex items-center justify-between">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {editingProduct ? '상품 수정' : '새 상품 등록'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FiX size={28} />
                  </button>
                </div>

                {/* 모달 본문 */}
                <div className="p-6 md:p-8 space-y-6 md:space-y-8">
                  {/* 기본 정보 */}
                  <div className="grid sm:grid-cols-2 gap-5 md:gap-6">
                    <div>
                      <label className="block text-base md:text-lg font-semibold text-gray-800 mb-3">
                        상품 코드 * <span className="text-gray-500 text-sm">(예: MSC-JP4N5D)</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.productCode}
                        onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                        className="w-full px-4 py-3 md:px-5 md:py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base md:text-lg"
                        style={{ fontSize: '18px', minHeight: '56px' }}
                        placeholder="MSC-JP4N5D"
                      />
                    </div>

                    {/* 크루즈선사 검색 가능한 드롭다운 */}
                    <div className="relative" ref={cruiseLineDropdownRef}>
                      <label className="block text-base md:text-lg font-semibold text-gray-800 mb-3">
                        크루즈선사 *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={cruiseLineDropdownOpen ? cruiseLineSearchTerm : selectedCruiseLineLabel}
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
                          className="w-full px-4 py-3 md:px-5 md:py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base md:text-lg pr-12 font-medium"
                          style={{ fontSize: '18px', minHeight: '56px' }}
                        />
                        {cruiseLineSearchTerm && (
                          <button
                            type="button"
                            onClick={() => {
                              setCruiseLineSearchTerm('');
                              setCruiseLineDropdownOpen(false);
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                          >
                            <FiX size={22} />
                          </button>
                        )}
                        {cruiseLineDropdownOpen && filteredCruiseLineOptions.length > 0 && (
                          <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-72 overflow-y-auto">
                            {filteredCruiseLineOptions.map((option) => (
                              <div
                                key={option.value}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleCruiseLineSelect(option.value, option.label);
                                }}
                                className={`px-5 py-4 md:px-6 md:py-5 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                                  formData.cruiseLine === option.value ? 'bg-blue-100 font-bold' : 'font-medium'
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

                    {/* 크루즈선 이름 검색 가능한 드롭다운 */}
                    <div className="relative" ref={shipNameDropdownRef}>
                      <label className="block text-base md:text-lg font-semibold text-gray-800 mb-3">
                        크루즈선 이름 * {formData.cruiseLine && <span className="text-gray-500 text-sm">({selectedCruiseLineLabel})</span>}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          disabled={!formData.cruiseLine}
                          value={shipNameDropdownOpen ? shipNameSearchTerm : selectedShipNameLabel}
                          onChange={(e) => {
                            setShipNameSearchTerm(e.target.value);
                            setShipNameDropdownOpen(true);
                          }}
                          onFocus={() => {
                            if (formData.cruiseLine) {
                              setShipNameDropdownOpen(true);
                              setShipNameSearchTerm('');
                            }
                          }}
                          onBlur={() => {
                            setTimeout(() => setShipNameDropdownOpen(false), 200);
                          }}
                          placeholder={formData.cruiseLine ? "크루즈선 이름 검색 (예: 벨리시마)" : "먼저 크루즈선사를 선택하세요"}
                          className={`w-full px-4 py-3 md:px-5 md:py-4 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base md:text-lg pr-12 font-medium ${
                            !formData.cruiseLine ? 'bg-gray-100 border-gray-200 cursor-not-allowed' : 'border-gray-300'
                          }`}
                          style={{ fontSize: '18px', minHeight: '56px' }}
                        />
                        {shipNameSearchTerm && formData.cruiseLine && (
                          <button
                            type="button"
                            onClick={() => {
                              setShipNameSearchTerm('');
                              setShipNameDropdownOpen(false);
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                          >
                            <FiX size={22} />
                          </button>
                        )}
                        {shipNameDropdownOpen && formData.cruiseLine && filteredShipNameOptions.length > 0 && (
                          <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-72 overflow-y-auto">
                            {filteredShipNameOptions.map((option) => (
                              <div
                                key={option.value}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleShipNameSelect(option.value, option.label);
                                }}
                                className={`px-5 py-4 md:px-6 md:py-5 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                                  formData.shipName === option.value ? 'bg-blue-100 font-bold' : 'font-medium'
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

                    {/* 후킹 태그 선택 - 패키지명 위에 배치 */}
                    <div className="p-4 bg-pink-50 border-2 border-pink-300 rounded-lg">
                      <ProductTagsSelector
                        selectedTags={formData.tags}
                        onChange={(tags) => setFormData({ ...formData, tags })}
                        maxTags={3}
                      />
                    </div>

                    {/* 별점 및 리뷰 설정 - 후킹 태그 밑에 배치 */}
                    <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                      <label className="block text-base md:text-lg font-semibold text-gray-800 mb-3">
                        별점 및 리뷰 설정
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            별점 (0.0 ~ 5.0)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="5"
                            step="0.1"
                            value={formData.rating}
                            onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 4.5 })}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-base"
                            style={{ fontSize: '18px', minHeight: '56px' }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            리뷰 개수
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.reviewCount}
                            onChange={(e) => setFormData({ ...formData, reviewCount: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-base"
                            style={{ fontSize: '18px', minHeight: '56px' }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-yellow-700 mt-3 font-semibold">
                        💡 별점과 리뷰 개수는 상품 상세 페이지와 상품 카드에 표시됩니다.
                      </p>
                    </div>

                    {/* 상품 분류 - 딱지 설정 (썸네일 왼쪽 위에 표시) */}
                    <div className="p-4 bg-indigo-50 border-2 border-indigo-300 rounded-lg">
                      <label className="block text-base md:text-lg font-semibold text-gray-800 mb-3">
                        상품 분류 - 딱지 설정 (썸네일 왼쪽 위에 표시)
                      </label>
                      
                      {/* 인기/추천 딱지 */}
                      <div className="mb-4 space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.isPopular}
                            onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                            className="w-5 h-5 text-red-600 rounded"
                          />
                          <span className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm md:text-base font-bold shadow-md">
                            인기
                          </span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.isRecommended}
                            onChange={(e) => setFormData({ ...formData, isRecommended: e.target.checked })}
                            className="w-5 h-5 text-blue-600 rounded"
                          />
                          <span className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm md:text-base font-bold shadow-md">
                            추천
                          </span>
                        </label>
                      </div>
                      
                      {/* 추가 딱지들 */}
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-700 mb-2">추가 딱지:</p>
                        {[
                          { value: 'event', label: '이벤트', color: 'bg-purple-600' },
                          { value: 'theme', label: '테마', color: 'bg-pink-600' },
                          { value: 'departure-soon', label: '출발임박', color: 'bg-orange-600' },
                          { value: 'package-confirmed', label: '패키지확정', color: 'bg-green-600' },
                          { value: 'closing-soon', label: '마감임박', color: 'bg-red-700' },
                        ].map((badge) => (
                          <label key={badge.value} className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.badges.includes(badge.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({ ...formData, badges: [...formData.badges, badge.value] });
                                } else {
                                  setFormData({ ...formData, badges: formData.badges.filter(b => b !== badge.value) });
                                }
                              }}
                              className="w-5 h-5 text-indigo-600 rounded"
                            />
                            <span className={`px-4 py-2 ${badge.color} text-white rounded-lg text-sm md:text-base font-bold shadow-md`}>
                              {badge.label}
                            </span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-indigo-700 mt-3 font-semibold">
                        💡 선택한 딱지들은 상품 카드의 썸네일 왼쪽 위에 표시됩니다. 인기/추천 딱지와 추가 딱지들이 함께 표시됩니다.
                      </p>
                    </div>

                    {/* 상품 정보 미리보기 */}
                    <div className="p-4 bg-gray-50 border-2 border-gray-300 rounded-lg">
                      <label className="block text-base md:text-lg font-semibold text-gray-800 mb-3">
                        상품 정보 미리보기
                      </label>
                      <div className="space-y-2 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">📅</span>
                          <span>{formData.nights}박 {formData.days}일</span>
                        </div>
                        {formData.basePrice && (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">💰</span>
                            <span>{parseInt(formData.basePrice || '0').toLocaleString('ko-KR')}원</span>
                            <span className="text-gray-500">/ 월 {Math.ceil(parseInt(formData.basePrice || '0') / 12).toLocaleString('ko-KR')}원</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">🗺️</span>
                          <span>{formData.itineraryPattern.length}개 일정</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-base md:text-lg font-semibold text-gray-800 mb-3">
                        패키지명 *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.packageName}
                        onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                        className="w-full px-4 py-3 md:px-5 md:py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base md:text-lg"
                        style={{ fontSize: '18px', minHeight: '56px' }}
                        placeholder="일본/대만 4박 5일"
                      />
                    </div>

                    {/* 출발 날짜 및 종료 날짜 선택 (지도 캘린더) - 여행기간 박수/일수 위에 배치 */}
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg">
                      <div className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
                        <span className="text-xl">🗓️</span>
                        <span>출발 날짜 및 종료 날짜 선택 (지도 캘린더)</span>
                        <span className="text-red-600">* 필수</span>
                      </div>
                      <DateRangePicker
                        startDate={formData.startDate}
                        endDate={formData.endDate}
                        onStartDateChange={(date) => {
                          setFormData(prev => {
                            let newEndDate = prev.endDate;
                            // 종료일 자동 계산 (시작일 + 일수 - 1)
                            if (date && prev.days > 0) {
                              const start = new Date(date);
                              const end = new Date(start);
                              end.setDate(end.getDate() + prev.days - 1);
                              newEndDate = end.toISOString().split('T')[0];
                            }
                            return { ...prev, startDate: date, endDate: newEndDate };
                          });
                        }}
                        onEndDateChange={(date) => {
                          setFormData(prev => {
                            // 일수 자동 계산
                            let newDays = prev.days;
                            let newNights = prev.nights;
                            if (prev.startDate && date) {
                              const start = new Date(prev.startDate);
                              const end = new Date(date);
                              const diffTime = end.getTime() - start.getTime();
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                              newDays = diffDays;
                              newNights = diffDays - 1;
                            }
                            return { ...prev, endDate: date, days: newDays, nights: newNights };
                          });
                        }}
                        onDaysChange={(days) => {
                          setFormData(prev => ({
                            ...prev,
                            days,
                            nights: days > 0 ? days - 1 : 0,
                          }));
                        }}
                      />
                      <p className="text-xs text-blue-700 mt-3 font-semibold">
                        💡 캘린더에서 출발 날짜와 종료 날짜를 선택하면 여행 기간이 자동으로 계산됩니다. 온보딩 및 상품몰에 정확하게 반영됩니다.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-base md:text-lg font-semibold text-gray-800 mb-3">
                          박수 *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={formData.nights}
                          onChange={(e) => {
                            const nights = parseInt(e.target.value) || 0;
                            setFormData(prev => {
                              const days = nights + 1;
                              let newEndDate = prev.endDate;
                              // 종료일 자동 계산 (시작일 + 일수 - 1)
                              if (prev.startDate && days > 0) {
                                const start = new Date(prev.startDate);
                                const end = new Date(start);
                                end.setDate(end.getDate() + days - 1);
                                newEndDate = end.toISOString().split('T')[0];
                              }
                              return { ...prev, nights, days, endDate: newEndDate };
                            });
                          }}
                          className="w-full px-4 py-3 md:px-5 md:py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base md:text-lg"
                          style={{ fontSize: '18px', minHeight: '56px' }}
                        />
                      </div>
                      <div>
                        <label className="block text-base md:text-lg font-semibold text-gray-800 mb-3">
                          일수 *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={formData.days}
                          onChange={(e) => {
                            const days = parseInt(e.target.value) || 0;
                            setFormData(prev => {
                              const nights = days > 0 ? days - 1 : 0;
                              let newEndDate = prev.endDate;
                              // 종료일 자동 계산 (시작일 + 일수 - 1)
                              if (prev.startDate && days > 0) {
                                const start = new Date(prev.startDate);
                                const end = new Date(start);
                                end.setDate(end.getDate() + days - 1);
                                newEndDate = end.toISOString().split('T')[0];
                              }
                              return { ...prev, days, nights, endDate: newEndDate };
                            });
                          }}
                          className="w-full px-4 py-3 md:px-5 md:py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base md:text-lg"
                          style={{ fontSize: '18px', minHeight: '56px' }}
                        />
                      </div>
                    </div>

                    {/* 추천 키워드 설정 - 마케팅 태그 (방문 국가 설정 위) */}
                    <div className="p-4 bg-purple-50 border-2 border-purple-300 rounded-lg">
                      <label className="block text-base md:text-lg font-semibold text-gray-800 mb-3">
                        추천 키워드 (마케팅 태그) <span className="text-gray-500 text-sm">(최대 5개 선택)</span>
                      </label>
                      <p className="text-xs text-purple-700 mb-3 font-semibold">
                        💡 선택한 키워드는 크루즈몰 검색에서 연관 검색어로 표시됩니다. 실제 검색량이 많은 키워드를 선택하세요.
                      </p>
                      
                      {/* 선택된 키워드 표시 */}
                      {formData.recommendedKeywords.length > 0 && (
                        <div className="mb-3 p-3 bg-white rounded-lg border-2 border-purple-200">
                          <p className="text-sm font-semibold text-gray-700 mb-2">선택된 키워드 ({formData.recommendedKeywords.length}/5):</p>
                          <div className="flex flex-wrap gap-2">
                            {formData.recommendedKeywords.map((keyword, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                              >
                                {keyword}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      recommendedKeywords: formData.recommendedKeywords.filter((_, i) => i !== index),
                                    });
                                  }}
                                  className="ml-2 text-purple-600 hover:text-purple-800"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 드롭다운 선택 */}
                      {formData.recommendedKeywords.length < 5 && (
                        <div className="relative" ref={keywordDropdownRef}>
                          <div className="relative">
                            <input
                              type="text"
                              value={keywordSearchTerm}
                              onChange={(e) => {
                                setKeywordSearchTerm(e.target.value);
                                setKeywordDropdownOpen(true);
                              }}
                              onFocus={() => setKeywordDropdownOpen(true)}
                              placeholder="키워드 검색 (최대 5개 선택 가능)"
                              className="w-full px-4 py-3 md:px-5 md:py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base md:text-lg pr-12"
                              style={{ fontSize: '18px', minHeight: '56px' }}
                            />
                            {keywordSearchTerm && (
                              <button
                                type="button"
                                onClick={() => {
                                  setKeywordSearchTerm('');
                                  setKeywordDropdownOpen(false);
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                              >
                                <FiX size={22} />
                              </button>
                            )}
                          </div>
                          {keywordDropdownOpen && filteredKeywords.length > 0 && (
                            <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-72 overflow-y-auto">
                              {filteredKeywords
                                .filter(keyword => !formData.recommendedKeywords.includes(keyword))
                                .map((keyword) => (
                                  <div
                                    key={keyword}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      if (formData.recommendedKeywords.length < 5) {
                                        setFormData({
                                          ...formData,
                                          recommendedKeywords: [...formData.recommendedKeywords, keyword],
                                        });
                                        setKeywordSearchTerm('');
                                        setKeywordDropdownOpen(false);
                                      }
                                    }}
                                    className="px-5 py-4 md:px-6 md:py-5 cursor-pointer hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0 font-medium"
                                    style={{ minHeight: '56px' }}
                                  >
                                    <div className="text-lg md:text-xl text-gray-900">{keyword}</div>
                                  </div>
                                ))}
                            </div>
                          )}
                          {keywordDropdownOpen && filteredKeywords.filter(keyword => !formData.recommendedKeywords.includes(keyword)).length === 0 && (
                            <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4 text-center text-gray-500">
                              {keywordSearchTerm ? '검색 결과가 없습니다.' : '모든 키워드가 선택되었습니다.'}
                            </div>
                          )}
                        </div>
                      )}
                      {formData.recommendedKeywords.length >= 5 && (
                        <div className="p-3 bg-yellow-100 border-2 border-yellow-300 rounded-lg text-sm text-yellow-800 font-semibold">
                          최대 5개까지 선택 가능합니다. 키워드를 삭제하려면 위의 선택된 키워드에서 × 버튼을 클릭하세요.
                        </div>
                      )}
                    </div>

                    {/* 방문 국가 선택 - 온보딩 연결 필수 */}
                    <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                      <div className="text-sm font-bold text-green-900 mb-4">
                        🌍 방문 국가 선택 (온보딩 자동 연결)
                      </div>
                      
                      {/* 방문 국가 개수 선택 */}
                      <div className="mb-4">
                        <label className="block text-base md:text-lg font-semibold text-gray-800 mb-3">
                          방문 국가 개수 * <span className="text-red-600 text-sm">(1개국~10개국)</span>
                        </label>
                        <select
                          value={visitCount}
                          onChange={(e) => {
                            const newCount = parseInt(e.target.value, 10);
                            setVisitCount(newCount);
                            // 선택 개수가 줄어들면 초과분 제거
                            if (selectedCountries.length > newCount) {
                              setSelectedCountries(selectedCountries.slice(0, newCount));
                            }
                          }}
                          className="w-full px-4 py-3 md:px-5 md:py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base md:text-lg"
                          style={{ fontSize: '18px', minHeight: '56px' }}
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <option key={n} value={n}>{n}개국</option>
                          ))}
                        </select>
                      </div>

                      {/* 방문 국가 선택 */}
                      <div>
                        <label className="block text-base md:text-lg font-semibold text-gray-800 mb-3">
                          방문 국가 선택 * <span className="text-blue-600 font-bold">({selectedCountries.length}/{visitCount}개 선택)</span>
                          {selectedCountries.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedCountries([])}
                              className="ml-2 text-red-500 text-xs font-medium hover:underline"
                            >
                              초기화
                            </button>
                          )}
                        </label>
                        <MultiCountrySelect
                          instanceId="country-select"
                          isMulti={true}
                          options={destinationOptions}
                          value={selectedCountries}
                          onChange={(vals: any) => {
                            const arr = (vals as Option[]) ?? [];
                            const limited = arr.slice(0, visitCount);
                            setSelectedCountries(limited);
                          }}
                          onInputChange={(v: string) => setCountrySearchTerm(v)}
                          filterOption={filterOption}
                          placeholder="방문 국가를 선택하세요 (여러 개 선택 가능)"
                        />
                        <div className="mt-2 text-sm text-gray-600">
                          {visitCount}개 중 <span className="font-semibold text-blue-600">{selectedCountries.length}</span>개 선택됨
                        </div>
                        
                        {/* 연관 검색 칩 */}
                        {countryChips.length > 0 && (
                          <div className="flex gap-2 flex-wrap mt-3">
                            {countryChips.map(c => (
                              <button
                                key={c.value}
                                type="button"
                                onClick={() => {
                                  if (selectedCountries.some(p => p.value === c.value)) return;
                                  if (selectedCountries.length >= visitCount) return;
                                  setSelectedCountries([...selectedCountries, c]);
                                }}
                                className="px-4 py-2 rounded-full border-2 border-gray-300 bg-white hover:bg-gray-50 text-sm font-semibold transition-colors"
                              >
                                {c.label}
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* 선택된 국가 표시 */}
                        {selectedCountries.length > 0 && (
                          <div className="mt-4 p-3 bg-white rounded-lg border-2 border-green-200">
                            <p className="text-sm font-semibold text-gray-700 mb-2">선택된 국가:</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedCountries.map((country, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                                >
                                  {country.label}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCountries(selectedCountries.filter((_, i) => i !== index));
                                    }}
                                    className="ml-2 text-green-600 hover:text-green-800"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs text-green-700 mt-3 font-semibold">
                        💡 선택한 방문 국가는 온보딩 시 크루즈 가이드 지니 AI에 자동으로 반영됩니다.
                      </p>
                    </div>

                    <div>
                      <label className="block text-base md:text-lg font-semibold text-gray-800 mb-3">
                        기본 가격 (원)
                      </label>
                      <input
                        type="number"
                        value={formData.basePrice}
                        onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                        className="w-full px-4 py-3 md:px-5 md:py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base md:text-lg"
                        style={{ fontSize: '18px', minHeight: '56px' }}
                        placeholder="1500000"
                      />
                    </div>
                  </div>

                  {/* 상품 설명 */}
                  <div>
                    <label className="block text-base md:text-lg font-semibold text-gray-800 mb-3">
                      상품 설명
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 md:px-5 md:py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base md:text-lg"
                      style={{ fontSize: '18px' }}
                      placeholder="상품에 대한 상세 설명을 입력하세요..."
                    />
                  </div>

                  {/* 긴급 상품 설정 */}
                  <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isUrgent}
                        onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                        className="w-5 h-5 text-red-600 rounded"
                      />
                      <div>
                        <span className="text-base md:text-lg font-semibold text-red-700">
                          🔥 긴급 상품
                        </span>
                        <p className="text-xs text-red-600 mt-1">
                          체크하면 메인몰 최상단에 고정되어 표시됩니다. 우선순위가 가장 높으며 최대 3개까지 표시됩니다. 최근에 설정한 순서대로 표시됩니다.
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* 주력 상품 설정 */}
                  <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isMainProduct}
                        onChange={(e) => setFormData({ ...formData, isMainProduct: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                      <div>
                        <span className="text-base md:text-lg font-semibold text-blue-700">
                          ⭐ 주력 상품
                        </span>
                        <p className="text-xs text-blue-600 mt-1">
                          체크하면 메인몰 두 번째에 고정되어 표시됩니다. 긴급 상품 다음 우선순위이며 최대 3개까지 표시됩니다. 최근에 설정한 순서대로 표시됩니다.
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* 판매 상태 */}
                  <div className="p-4 bg-orange-50 border-2 border-orange-300 rounded-lg">
                    <label className="block text-base md:text-lg font-semibold text-gray-800 mb-3">
                      판매 상태 <span className="text-red-600">*</span>
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="saleStatus"
                          value="판매중"
                          checked={formData.saleStatus === '판매중'}
                          onChange={(e) => setFormData({ ...formData, saleStatus: e.target.value as '판매중' | '판매완료' | '판매중지' })}
                          className="w-5 h-5 text-green-600"
                        />
                        <span className="text-base md:text-lg font-semibold text-green-700">
                          판매중
                        </span>
                        <span className="text-sm text-gray-600">- 크루즈몰에 표시됨</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="saleStatus"
                          value="판매완료"
                          checked={formData.saleStatus === '판매완료'}
                          onChange={(e) => setFormData({ ...formData, saleStatus: e.target.value as '판매중' | '판매완료' | '판매중지' })}
                          className="w-5 h-5 text-gray-600"
                        />
                        <span className="text-base md:text-lg font-semibold text-gray-700">
                          판매완료
                        </span>
                        <span className="text-sm text-gray-600">- 크루즈몰에서 숨김</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="saleStatus"
                          value="판매중지"
                          checked={formData.saleStatus === '판매중지'}
                          onChange={(e) => setFormData({ ...formData, saleStatus: e.target.value as '판매중' | '판매완료' | '판매중지' })}
                          className="w-5 h-5 text-red-600"
                        />
                        <span className="text-base md:text-lg font-semibold text-red-700">
                          판매중지
                        </span>
                        <span className="text-sm text-gray-600">- 크루즈몰에서 숨김</span>
                      </label>
                    </div>
                    <p className="text-xs text-orange-700 mt-3 font-semibold">
                      💡 판매중인 상품만 크루즈몰에 표시됩니다. 판매완료나 판매중지로 설정하면 메인몰에서 자동으로 내려갑니다.
                    </p>
                    </div>

                  {/* 일정 패턴 편집기 */}
                  <div className="border-t-2 pt-6 md:pt-8">
                    <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                      <p className="text-base md:text-lg font-bold text-yellow-900 mb-2">
                        ⚠️ 중요: 방문 국가 설정 (온보딩 연결 필수)
                      </p>
                      <ul className="text-sm md:text-base text-yellow-800 space-y-1 list-disc list-inside">
                        <li>각 일정의 <strong>국가(country)</strong> 필드를 반드시 선택해주세요.</li>
                        <li>방문 국가 정보는 검색 기능과 크루즈 가이드 지니 AI 날씨 정보에 사용됩니다.</li>
                        <li>온보딩 시 자동으로 방문 국가가 추출되어 사용자에게 반영됩니다.</li>
                        <li>기항지(PortVisit), 승선지(Embarkation), 하선지(Disembarkation) 모두 국가를 선택해야 합니다.</li>
                      </ul>
                    </div>
                    <ItineraryPatternEditor
                      value={formData.itineraryPattern}
                      onChange={(pattern) => setFormData({ ...formData, itineraryPattern: pattern })}
                    />
                  </div>
                </div>

                {/* 모달 푸터 */}
                <div className="sticky bottom-0 bg-gray-50 border-t-2 p-6 md:p-8 flex gap-4 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 md:px-8 md:py-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold text-base md:text-lg transition-colors"
                    style={{ minHeight: '56px' }}
                  >
                    취소
                  </button>
                  {editingProduct && editingProduct.productCode && (
                    <button
                      type="button"
                      onClick={() => {
                        window.open(`/products/${editingProduct.productCode}`, '_blank');
                      }}
                      className="flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold text-base md:text-lg transition-colors"
                      style={{ minHeight: '56px' }}
                    >
                      <FiEye size={20} />
                      미리보기
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md text-base md:text-lg transition-colors"
                    style={{ minHeight: '56px' }}
                  >
                    <FiSave size={20} />
                    {editingProduct ? '수정 완료' : '등록하기'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

