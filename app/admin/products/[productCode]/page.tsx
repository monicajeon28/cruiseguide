// app/admin/products/[productCode]/page.tsx
// 상품 상세 편집 페이지

'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FiArrowLeft, FiSave, FiUpload, FiImage, FiVideo, FiFileText, FiX, FiEye, FiStar } from 'react-icons/fi';
import { showSuccess, showError } from '@/components/ui/Toast';
import ProductDetailEditor, { ContentBlock } from '@/components/admin/ProductDetailEditor';
import IncludedExcludedEditor from '@/components/admin/IncludedExcludedEditor';
import EnhancedItineraryEditor, { EnhancedItineraryDay } from '@/components/admin/EnhancedItineraryEditor';
import PricingTableEditor, { PricingRow } from '@/components/admin/PricingTableEditor';
import RefundPolicyEditor from '@/components/admin/RefundPolicyEditor';
import ProductTagsSelector from '@/components/admin/ProductTagsSelector';
import AutocompleteInput from '@/components/admin/AutocompleteInput';
import DateRangePicker from '@/components/admin/DateRangePicker';
import CountrySelector from '@/components/admin/CountrySelector';
import FlightInfoEditor, { FlightInfo } from '@/components/admin/FlightInfoEditor';
import MobilePreview from '@/components/admin/MobilePreview';
import { Option } from '@/components/CountrySelect';
import { getAllCruiseLines, getAllShipNames, searchCruiseLinesAndShips } from '@/lib/cruise-data';
import { getKoreanCountryName, getCountryCode } from '@/lib/utils/countryMapping';

interface Product {
  id: number;
  productCode: string;
  cruiseLine: string;
  shipName: string;
  packageName: string;
  nights: number;
  days: number;
  basePrice: number | null;
  description: string | null;
  isPopular: boolean;
  isRecommended: boolean;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  itineraryPattern?: any;
  mallProductContent?: {
    thumbnail: string | null;
    images: any;
    videos: any;
    layout: any;
  } | null;
}

type ProductFormData = {
  id: number;
  productCode: string;
  cruiseLine: string;
  shipName: string;
  packageName: string;
  nights: number;
  days: number;
  basePrice: string;
  description: string;
  source: string;
  category: string;
  isPopular: boolean;
  isRecommended: boolean;
  isPremium: boolean;
  isGeniePack: boolean;
  isDomestic: boolean;
  isJapan: boolean;
  isBudget: boolean;
  startDate: string;
  endDate: string;
  saleStatus: string;
};

export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const productCode = params.productCode as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 기본 정보
  const [formData, setFormData] = useState<ProductFormData>({
    id: 0,
    productCode: '',
    cruiseLine: '',
    shipName: '',
    packageName: '',
    nights: 0,
    days: 0,
    basePrice: '',
    description: '',
    source: 'manual',
    category: '',
    isPopular: false,
    isRecommended: false,
    isPremium: false,
    isGeniePack: false,
    isDomestic: false,
    isJapan: false,
    isBudget: false,
    startDate: '',
    endDate: '',
    saleStatus: '판매중',
  });

  // 방문 국가 선택
  const [selectedCountries, setSelectedCountries] = useState<Option[]>([]);

  // 썸네일
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  // 상세페이지 블록
  const [detailBlocks, setDetailBlocks] = useState<ContentBlock[]>([]);

  // 포함/불포함 사항
  const [includedItems, setIncludedItems] = useState<string[]>([]);
  const [excludedItems, setExcludedItems] = useState<string[]>([]);

  // 서비스 옵션 체크박스
  const [hasEscort, setHasEscort] = useState<boolean>(false); // 인솔자
  const [hasLocalGuide, setHasLocalGuide] = useState<boolean>(false); // 현지가이드
  const [hasCruisedotStaff, setHasCruisedotStaff] = useState<boolean>(false); // 크루즈닷 전용 스탭
  const [hasTravelInsurance, setHasTravelInsurance] = useState<boolean>(false); // 여행자보험

  // 여행일정
  const [itineraryDays, setItineraryDays] = useState<EnhancedItineraryDay[]>([]);

  // 요금표
  const [pricingRows, setPricingRows] = useState<PricingRow[]>([]);
  const [departureDate, setDepartureDate] = useState<string>('');

  // 환불/취소 규정
  const [refundPolicy, setRefundPolicy] = useState<string>('');

  // 태그 (최대 3개)
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 추천 키워드 (최대 5개)
  const [recommendedKeywords, setRecommendedKeywords] = useState<string[]>([]);
  const [keywordSearchTerm, setKeywordSearchTerm] = useState('');
  const [keywordDropdownOpen, setKeywordDropdownOpen] = useState(false);
  const keywordDropdownRef = useRef<HTMLDivElement>(null);
  const [flightInfo, setFlightInfo] = useState<FlightInfo | null>(null);
  const [rating, setRating] = useState<number>(4.4);
  const [reviewCount, setReviewCount] = useState<number>(0);

  // 자동저장 키 (localStorage)
  const AUTO_SAVE_KEY = `product_edit_draft_${productCode}`;

  // 자동저장 상태
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | null>(null);

  // 자동저장 함수
  const saveToLocalStorage = useCallback(() => {
    try {
      setAutoSaveStatus('saving');
      const draft = {
        formData,
        selectedCountries,
        thumbnail,
        detailBlocks,
        includedItems,
        excludedItems,
        itineraryDays,
        pricingRows,
        departureDate,
        refundPolicy,
        selectedTags,
        recommendedKeywords,
        flightInfo,
        rating,
        reviewCount,
        hasEscort,
        hasLocalGuide,
        hasCruisedotStaff,
        hasTravelInsurance,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(draft));
      setTimeout(() => {
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus(null), 2000);
      }, 300);
    } catch (error) {
      console.error('자동저장 실패:', error);
      setAutoSaveStatus(null);
    }
  }, [formData, selectedCountries, thumbnail, detailBlocks, includedItems, excludedItems, itineraryDays, pricingRows, departureDate, refundPolicy, selectedTags, recommendedKeywords, flightInfo, rating, reviewCount, hasEscort, hasLocalGuide, hasCruisedotStaff, hasTravelInsurance]);

  // localStorage에서 복원
  const loadFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(AUTO_SAVE_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.formData) {
          setFormData(draft.formData);
        }
        if (draft.selectedCountries) {
          setSelectedCountries(draft.selectedCountries);
        }
        if (draft.thumbnail) {
          setThumbnail(draft.thumbnail);
        }
        if (draft.detailBlocks) {
          setDetailBlocks(draft.detailBlocks);
        }
        if (draft.includedItems) {
          setIncludedItems(draft.includedItems);
        }
        if (draft.excludedItems) {
          setExcludedItems(draft.excludedItems);
        }
        if (draft.itineraryDays) {
          setItineraryDays(draft.itineraryDays);
        }
        if (draft.pricingRows) {
          setPricingRows(draft.pricingRows);
        }
        if (draft.departureDate) {
          setDepartureDate(draft.departureDate);
        }
        if (draft.refundPolicy) {
          setRefundPolicy(draft.refundPolicy);
        }
        if (draft.selectedTags) {
          setSelectedTags(draft.selectedTags);
        }
        if (draft.recommendedKeywords) {
          setRecommendedKeywords(draft.recommendedKeywords);
        }
        if (draft.flightInfo) {
          setFlightInfo(draft.flightInfo);
        }
        if (draft.rating !== undefined) {
          setRating(draft.rating);
        }
        if (draft.reviewCount !== undefined) {
          setReviewCount(draft.reviewCount);
        }
        if (draft.hasEscort !== undefined) {
          setHasEscort(draft.hasEscort);
        }
        if (draft.hasLocalGuide !== undefined) {
          setHasLocalGuide(draft.hasLocalGuide);
        }
        if (draft.hasCruisedotStaff !== undefined) {
          setHasCruisedotStaff(draft.hasCruisedotStaff);
        }
        if (draft.hasTravelInsurance !== undefined) {
          setHasTravelInsurance(draft.hasTravelInsurance);
        }
        return true;
      }
    } catch (error) {
      console.error('자동저장 복원 실패:', error);
    }
    return false;
  }, []);

  // 자동저장 타이머
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 자동저장 트리거 (debounce)
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      saveToLocalStorage();
    }, 1000); // 1초 후 자동저장 (더 빠르게)
  }, [saveToLocalStorage]);

  // 페이지 언로드 시 자동저장 및 경고
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      saveToLocalStorage();
      // 저장되지 않은 변경사항이 있으면 경고
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [saveToLocalStorage]);

  // 배열/객체 변경 감지를 위한 useMemo
  const selectedCountriesStr = useMemo(() => JSON.stringify(selectedCountries), [selectedCountries]);
  const detailBlocksStr = useMemo(() => JSON.stringify(detailBlocks), [detailBlocks]);
  const includedItemsStr = useMemo(() => JSON.stringify(includedItems), [includedItems]);
  const excludedItemsStr = useMemo(() => JSON.stringify(excludedItems), [excludedItems]);
  const itineraryDaysStr = useMemo(() => JSON.stringify(itineraryDays), [itineraryDays]);
  const pricingRowsStr = useMemo(() => JSON.stringify(pricingRows), [pricingRows]);
  const selectedTagsStr = useMemo(() => JSON.stringify(selectedTags), [selectedTags]);
  const recommendedKeywordsStr = useMemo(() => JSON.stringify(recommendedKeywords), [recommendedKeywords]);
  const flightInfoStr = useMemo(() => JSON.stringify(flightInfo), [flightInfo]);

  // formData 변경 시 자동저장
  useEffect(() => {
    if (product && formData.productCode) {
      triggerAutoSave();
    }
  }, [
    product, 
    formData.productCode, 
    formData.packageName, 
    formData.cruiseLine, 
    formData.shipName, 
    formData.nights, 
    formData.days, 
    formData.basePrice, 
    formData.description, 
    formData.source, 
    formData.category, 
    formData.isPopular, 
    formData.isRecommended, 
    formData.startDate, 
    formData.endDate, 
    selectedCountries.length, 
    thumbnail, 
    detailBlocks.length, 
    includedItems.length, 
    excludedItems.length, 
    itineraryDays.length, 
    pricingRows.length, 
    departureDate, 
    refundPolicy, 
    selectedTags.length, 
    recommendedKeywords.length,
    rating,
    reviewCount,
    hasEscort,
    hasLocalGuide,
    hasCruisedotStaff,
    hasTravelInsurance,
    triggerAutoSave
  ]);

  // 여행기간 선택에서 출발일이 변경되면 요금표 출발일에 자동 반영
  useEffect(() => {
    if (formData.startDate) {
      // 출발일이 설정되어 있으면 요금표 출발일에 자동 설정
      // 단, 사용자가 이미 departureDate를 수동으로 변경한 경우는 제외
      if (!departureDate || departureDate === formData.startDate) {
        setDepartureDate(formData.startDate);
      }
    }
  }, [formData.startDate, departureDate]);

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

  // 필터링된 추천 키워드 목록
  const filteredKeywords = useMemo(() => {
    if (!keywordSearchTerm) return RECOMMENDED_KEYWORDS;
    const searchTerm = keywordSearchTerm.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
    return RECOMMENDED_KEYWORDS.filter(keyword => {
      const cleaned = keyword.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
      return cleaned.includes(searchTerm);
    });
  }, [keywordSearchTerm]);

  // 크루즈 라인 옵션 (검색 시 해당 선박명도 함께 검색)
  const cruiseLineOptions = useMemo(() => {
    if (formData.cruiseLine.trim()) {
      const result = searchCruiseLinesAndShips(formData.cruiseLine);
      // 크루즈 라인 우선, 그 다음 선박명
      return [...result.cruiseLines, ...result.ships];
    }
    return getAllCruiseLines();
  }, [formData.cruiseLine]);

  // 선박명 옵션 (검색 시 해당 크루즈 라인도 함께 검색)
  const shipNameOptions = useMemo(() => {
    if (formData.shipName.trim()) {
      const result = searchCruiseLinesAndShips(formData.shipName);
      // 선박명 우선, 그 다음 크루즈 라인
      return [...result.ships, ...result.cruiseLines];
    }
    return getAllShipNames();
  }, [formData.shipName]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (keywordDropdownRef.current && !keywordDropdownRef.current.contains(event.target as Node)) {
        setKeywordDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    loadProduct();
  }, [productCode]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/products/${productCode}`, {
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('상품을 불러올 수 없습니다.');
      }

      const data = await res.json();
      if (data.ok && data.product) {
        const p = data.product;
        setProduct(p);
        
        // 자동저장된 데이터가 있는지 확인
        const saved = localStorage.getItem(AUTO_SAVE_KEY);
        if (saved) {
          try {
            const draft = JSON.parse(saved);
            // 자동저장된 데이터가 최근 것인지 확인 (1시간 이내)
            if (draft.savedAt) {
              const savedTime = new Date(draft.savedAt).getTime();
              const now = new Date().getTime();
              const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
              
              if (hoursDiff < 24) { // 24시간 이내 자동저장 데이터만 복원 제안
                const shouldRestore = window.confirm(
                  `이전에 작성하던 내용이 있습니다. (${new Date(draft.savedAt).toLocaleString('ko-KR')})\n\n복원하시겠습니까?`
                );
                
                if (shouldRestore) {
                  loadFromLocalStorage();
                  showSuccess('이전에 작성하던 내용을 불러왔습니다.');
                  setLoading(false);
                  return; // 자동저장 데이터 복원 시 서버 데이터 로드 건너뛰기
                } else {
                  // 복원하지 않으면 자동저장 데이터 삭제
                  localStorage.removeItem(AUTO_SAVE_KEY);
                }
              } else {
                // 24시간 이상 지난 자동저장 데이터는 삭제
                localStorage.removeItem(AUTO_SAVE_KEY);
              }
            }
          } catch (e) {
            console.error('자동저장 데이터 확인 실패:', e);
          }
        }
        
        // 서버에서 데이터 로드
        setFormData({
          id: p.id || 0,
          productCode: p.productCode || '',
          cruiseLine: p.cruiseLine || '',
          shipName: p.shipName || '',
          packageName: p.packageName || '',
          nights: p.nights || 0,
          days: p.days || 0,
          basePrice: p.basePrice?.toString() || '',
          description: p.description || '',
          source: p.source || 'manual',
          category: p.category || '',
          isPopular: p.isPopular || false,
          isRecommended: p.isRecommended || false,
          isPremium: p.isPremium || false,
          isGeniePack: p.isGeniePack || false,
          isDomestic: p.isDomestic || false,
          isJapan: p.isJapan || false,
          isBudget: p.isBudget || false,
          startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : '',
          endDate: p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : '',
          saleStatus: p.saleStatus || 'active',
        });
        
        // 방문 국가 로드 (destination 필드 우선, 없으면 itineraryPattern에서 추출)
        if (p.destination && Array.isArray(p.destination) && p.destination.length > 0) {
          // destination에 한국어 이름이 저장되어 있음
          setSelectedCountries(p.destination.map((d: string) => ({ value: d, label: d })));
        } else if (p.itineraryPattern && Array.isArray(p.itineraryPattern)) {
          // itineraryPattern에서 국가 코드 추출 후 한국어 이름으로 변환
          const countryCodes = new Set<string>();
          p.itineraryPattern.forEach((day: any) => {
            if (day.country && day.country !== 'KR') {
              countryCodes.add(day.country);
            }
          });
          if (countryCodes.size > 0) {
            const koreanNames = Array.from(countryCodes)
              .map(code => {
                const koreanName = getKoreanCountryName(code);
                return koreanName ? { value: koreanName, label: koreanName } : null;
              })
              .filter((item): item is Option => item !== null);
            setSelectedCountries(koreanNames);
          } else {
            setSelectedCountries([]);
          }
        } else if (p.itineraryPattern && typeof p.itineraryPattern === 'object' && !Array.isArray(p.itineraryPattern)) {
          // itineraryPattern이 객체인 경우 destination 필드 확인
          try {
            const pattern = typeof p.itineraryPattern === 'string' 
              ? JSON.parse(p.itineraryPattern) 
              : p.itineraryPattern;
            if (pattern.destination && Array.isArray(pattern.destination) && pattern.destination.length > 0) {
              setSelectedCountries(pattern.destination.map((d: string) => ({ value: d, label: d })));
            } else {
              // itineraryPattern의 각 day에서 국가 코드 추출
              const countryCodes = new Set<string>();
              if (Array.isArray(pattern.days)) {
                pattern.days.forEach((day: any) => {
                  if (day.country && day.country !== 'KR') {
                    countryCodes.add(day.country);
                  }
                });
              }
              if (countryCodes.size > 0) {
                const koreanNames = Array.from(countryCodes)
                  .map(code => {
                    const koreanName = getKoreanCountryName(code);
                    return koreanName ? { value: koreanName, label: koreanName } : null;
                  })
                  .filter((item): item is Option => item !== null);
                setSelectedCountries(koreanNames);
              } else {
                setSelectedCountries([]);
              }
            }
          } catch {
            setSelectedCountries([]);
          }
        } else {
          setSelectedCountries([]);
        }
        setThumbnail(p.mallProductContent?.thumbnail || null);
        
        // 추천 키워드 로드 (layout에서 로드)
        const layout = p.mallProductContent?.layout;
        if (layout) {
          try {
            const parsedLayout = typeof layout === 'string' ? JSON.parse(layout) : layout;
            setRecommendedKeywords(parsedLayout.recommendedKeywords && Array.isArray(parsedLayout.recommendedKeywords) ? parsedLayout.recommendedKeywords : []);
          } catch (e) {
            console.error('[Load Product] Failed to parse layout for recommendedKeywords:', e);
            setRecommendedKeywords([]);
          }
        } else {
          setRecommendedKeywords([]);
        }
        
        // 태그 로드
        if (p.tags) {
          if (Array.isArray(p.tags)) {
            setSelectedTags(p.tags);
          } else if (typeof p.tags === 'string') {
            try {
              const parsedTags = JSON.parse(p.tags);
              setSelectedTags(Array.isArray(parsedTags) ? parsedTags : []);
            } catch {
              setSelectedTags([]);
            }
          } else {
            setSelectedTags([]);
          }
        } else {
          setSelectedTags([]);
        }
        
        // 상세페이지 블록 로드
        if (layout) {
          try {
            const parsedLayout = typeof layout === 'string' ? JSON.parse(layout) : layout;
            // 모든 필드를 명시적으로 로드 (없으면 빈 배열/값으로 설정)
            setDetailBlocks(parsedLayout.blocks && Array.isArray(parsedLayout.blocks) ? parsedLayout.blocks : []);
            setIncludedItems(parsedLayout.included && Array.isArray(parsedLayout.included) ? parsedLayout.included : []);
            setExcludedItems(parsedLayout.excluded && Array.isArray(parsedLayout.excluded) ? parsedLayout.excluded : []);
            setItineraryDays(parsedLayout.itinerary && Array.isArray(parsedLayout.itinerary) ? parsedLayout.itinerary : []);
            setPricingRows(parsedLayout.pricing && Array.isArray(parsedLayout.pricing) ? parsedLayout.pricing : []);
            setDepartureDate(parsedLayout.departureDate || '');
            setRefundPolicy(parsedLayout.refundPolicy || '');
            setFlightInfo(parsedLayout.flightInfo || null);
            setRating(parsedLayout.rating !== undefined ? parsedLayout.rating : 4.4);
            setReviewCount(parsedLayout.reviewCount !== undefined ? parsedLayout.reviewCount : 0);
            setHasEscort(parsedLayout.hasEscort || false);
            setHasLocalGuide(parsedLayout.hasLocalGuide || false);
            setHasCruisedotStaff(parsedLayout.hasCruisedotStaff || false);
            setHasTravelInsurance(parsedLayout.hasTravelInsurance || false);
          } catch (e) {
            console.error('Failed to parse layout:', e);
            // 파싱 실패 시에도 빈 배열로 초기화
            setDetailBlocks([]);
            setIncludedItems([]);
            setExcludedItems([]);
            setItineraryDays([]);
            setPricingRows([]);
            setDepartureDate('');
            setRefundPolicy('');
            setFlightInfo(null);
            setRating(4.4);
            setReviewCount(0);
            setHasEscort(false);
            setHasLocalGuide(false);
            setHasCruisedotStaff(false);
            setHasTravelInsurance(false);
          }
        } else {
          // layout이 없는 경우에도 빈 배열로 초기화
          setDetailBlocks([]);
          setIncludedItems([]);
          setExcludedItems([]);
          setItineraryDays([]);
          setPricingRows([]);
          setDepartureDate('');
          setRefundPolicy('');
            setFlightInfo(null);
            setRating(4.4);
            setReviewCount(0);
            setHasEscort(false);
            setHasLocalGuide(false);
            setHasCruisedotStaff(false);
            setHasTravelInsurance(false);
        }
        
        // 서버에서 불러온 모든 데이터를 자동저장
        // 약간의 지연을 두어 모든 상태가 업데이트된 후 저장
        setTimeout(() => {
          saveToLocalStorage();
        }, 500);
      }
    } catch (error) {
      console.error('Failed to load product:', error);
      showError('상품을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 확인 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showError('이미지 크기는 10MB를 초과할 수 없습니다.');
      return;
    }

    // 미리보기
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnail(reader.result as string);
    };
    reader.readAsDataURL(file);
    setThumbnailFile(file);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // 썸네일 업로드
      let thumbnailUrl = thumbnail;
      if (thumbnailFile) {
        const formData = new FormData();
        formData.append('file', thumbnailFile);
        formData.append('type', 'image');

        const uploadRes = await fetch('/api/admin/mall/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.ok) {
            thumbnailUrl = uploadData.url;
          }
        }
      }

      // 상품 정보 업데이트
      const payload = {
        id: product?.id || 0, // 기존 상품 ID 포함
        productCode: formData.productCode || productCode,
        cruiseLine: formData.cruiseLine || '',
        shipName: formData.shipName || '',
        packageName: formData.packageName || '',
        nights: parseInt(formData.nights.toString()) || 0,
        days: parseInt(formData.days.toString()) || 0,
        basePrice: formData.basePrice ? parseInt(formData.basePrice) : null,
        description: formData.description || null,
        source: formData.source || 'manual',
        category: formData.category || null,
        tags: selectedTags || [],
        isPopular: formData.isPopular || false,
        isRecommended: formData.isRecommended || false,
        isPremium: formData.isPremium || false,
        isGeniePack: formData.isGeniePack || false,
        isDomestic: formData.isDomestic || false,
        isJapan: formData.isJapan || false,
        isBudget: formData.isBudget || false,
        thumbnail: thumbnailUrl || null,
        detailBlocks: detailBlocks || [],
        includedItems: includedItems || [],
        excludedItems: excludedItems || [],
        itineraryDays: itineraryDays || [],
        pricingRows: pricingRows || [],
        departureDate: departureDate || '',
        refundPolicy: refundPolicy || '',
        recommendedKeywords: recommendedKeywords || [],
        flightInfo: flightInfo || null,
        rating: rating || 4.4,
        reviewCount: reviewCount || 0,
        hasEscort: hasEscort || false,
        hasLocalGuide: hasLocalGuide || false,
        hasCruisedotStaff: hasCruisedotStaff || false,
        hasTravelInsurance: hasTravelInsurance || false,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        destination: selectedCountries.length > 0 ? selectedCountries.map(c => c.value) : [],
        saleStatus: formData.saleStatus || 'active',
      };

      console.log('[Product Save] Payload:', JSON.stringify(payload, null, 2));

      const res = await fetch(`/api/admin/products/${productCode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('[Product Save] API Error:', errorData);
        throw new Error(errorData.error || `저장에 실패했습니다. (${res.status})`);
      }

      const data = await res.json();
      if (data.ok) {
        // 저장 성공 시 서버에서 최신 데이터를 다시 불러와서 상태 업데이트
        // 이렇게 하면 저장된 모든 필드가 제대로 로드됨
        const reloadRes = await fetch(`/api/admin/products/${productCode}`, {
          credentials: 'include'
        });
        if (reloadRes.ok) {
          const reloadData = await reloadRes.json();
          if (reloadData.ok && reloadData.product) {
            const p = reloadData.product;
            // 서버에서 불러온 데이터로 상태 업데이트
            const layout = p.mallProductContent?.layout;
            if (layout) {
              try {
                const parsedLayout = typeof layout === 'string' ? JSON.parse(layout) : layout;
                setDetailBlocks(parsedLayout.blocks && Array.isArray(parsedLayout.blocks) ? parsedLayout.blocks : []);
                setIncludedItems(parsedLayout.included && Array.isArray(parsedLayout.included) ? parsedLayout.included : []);
                setExcludedItems(parsedLayout.excluded && Array.isArray(parsedLayout.excluded) ? parsedLayout.excluded : []);
                setItineraryDays(parsedLayout.itinerary && Array.isArray(parsedLayout.itinerary) ? parsedLayout.itinerary : []);
                setPricingRows(parsedLayout.pricing && Array.isArray(parsedLayout.pricing) ? parsedLayout.pricing : []);
                setDepartureDate(parsedLayout.departureDate || '');
                setRefundPolicy(parsedLayout.refundPolicy || '');
                setFlightInfo(parsedLayout.flightInfo || null);
                setRating(parsedLayout.rating !== undefined ? parsedLayout.rating : 4.4);
                setReviewCount(parsedLayout.reviewCount !== undefined ? parsedLayout.reviewCount : 0);
                setRecommendedKeywords(parsedLayout.recommendedKeywords && Array.isArray(parsedLayout.recommendedKeywords) ? parsedLayout.recommendedKeywords : []);
                setHasEscort(parsedLayout.hasEscort || false);
                setHasLocalGuide(parsedLayout.hasLocalGuide || false);
                setHasCruisedotStaff(parsedLayout.hasCruisedotStaff || false);
                setHasTravelInsurance(parsedLayout.hasTravelInsurance || false);
              } catch (e) {
                console.error('Failed to parse reloaded layout:', e);
              }
            }
            setThumbnail(p.mallProductContent?.thumbnail || null);
          }
        }
        // 자동저장 데이터를 서버 데이터로 업데이트
        saveToLocalStorage();
        showSuccess('상품이 저장되었습니다.');
        // 저장 후 현재 페이지에 머물기 (리다이렉트 제거)
      } else {
        throw new Error(data.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      showError(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 미리보기용 product 객체 생성 (early return 전에 hook 호출)
  const previewProduct = useMemo(() => {
    if (!product) return null;
    return {
      ...product,
      packageName: formData.packageName || product.packageName,
      cruiseLine: formData.cruiseLine || product.cruiseLine,
      shipName: formData.shipName || product.shipName,
      nights: formData.nights || product.nights,
      days: formData.days || product.days,
      basePrice: formData.basePrice ? parseInt(formData.basePrice.replace(/[^0-9]/g, '')) : product.basePrice,
      description: formData.description || product.description,
      startDate: formData.startDate || product.startDate,
      endDate: formData.endDate || product.endDate,
      source: formData.source || 'manual',
      isPopular: formData.isPopular,
      isRecommended: formData.isRecommended,
      isPremium: formData.isPremium,
      isGeniePack: formData.isGeniePack,
      isDomestic: formData.isDomestic,
      isJapan: formData.isJapan,
      isBudget: formData.isBudget,
      itineraryPattern: product.itineraryPattern || null,
      tags: selectedTags,
      mallProductContent: {
        thumbnail: thumbnail || product.mallProductContent?.thumbnail || null,
        images: detailBlocks.filter(b => b.type === 'image').map(b => b.url),
        videos: detailBlocks.filter(b => b.type === 'video').map(b => b.url),
        layout: {
          blocks: detailBlocks,
          included: includedItems,
          excluded: excludedItems,
          itinerary: itineraryDays,
          pricing: pricingRows,
          refundPolicy: refundPolicy,
          flightInfo: flightInfo,
          rating: rating,
          reviewCount: reviewCount,
          recommendedKeywords: recommendedKeywords,
          destination: selectedCountries.map(c => c.value),
          hasEscort: hasEscort,
          hasLocalGuide: hasLocalGuide,
          hasCruisedotStaff: hasCruisedotStaff,
          hasTravelInsurance: hasTravelInsurance,
        },
      },
    } as any;
  }, [product, formData, thumbnail, detailBlocks, includedItems, excludedItems, itineraryDays, pricingRows, refundPolicy, flightInfo, rating, reviewCount, recommendedKeywords, selectedCountries, selectedTags, hasEscort, hasLocalGuide, hasCruisedotStaff, hasTravelInsurance]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700">상품을 찾을 수 없습니다.</p>
          <button
            onClick={() => router.push('/admin/products')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          {/* 왼쪽: 스마트폰 미리보기 */}
          <div className="hidden lg:block">
            {previewProduct && <MobilePreview product={previewProduct} />}
          </div>
          
          {/* 오른쪽: 편집 폼 */}
          <div className="max-w-6xl">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/products')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  상품 편집: {formData.productCode || product.productCode}
                </h1>
                <p className="text-gray-600 mt-1">{formData.packageName || product.packageName}</p>
                {autoSaveStatus === 'saving' && (
                  <p className="text-xs text-blue-600 mt-1">💾 자동저장 중...</p>
                )}
                {autoSaveStatus === 'saved' && (
                  <p className="text-xs text-green-600 mt-1">✅ 자동저장 완료</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (productCode) {
                    window.open(`/products/${productCode}`, '_blank');
                  } else {
                    showError('상품 코드가 없어서 미리보기를 할 수 없습니다.');
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
              >
                <FiEye size={20} />
                미리보기
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSave size={20} />
                {saving ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </div>
        </div>

        {/* 기본 정보 섹션 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">1. 기본 정보</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 상품 코드 (읽기 전용) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상품 코드 * (수정 불가)
              </label>
              <input
                type="text"
                required
                readOnly
                value={formData.productCode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                상품 코드는 수정할 수 없습니다. 새 상품을 등록하려면 수동등록을 사용하세요.
              </p>
            </div>

            {/* 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목 (패키지명) *
              </label>
              <input
                type="text"
                required
                value={formData.packageName}
                onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="예: 싱가포르 3박 4일 크루즈 - 말레이시아, 인도네시아"
              />
            </div>

            {/* 로고 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                로고 선택 *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer p-3 border-2 rounded-lg hover:border-blue-500 transition-colors flex-1">
                  <input
                    type="radio"
                    name="source"
                    value="wcruise"
                    checked={formData.source === 'wcruise'}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <img 
                    src="/images/wcruise-logo.png" 
                    alt="Wcruise" 
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span className="text-sm font-medium text-gray-700">Wcruise</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-3 border-2 rounded-lg hover:border-blue-500 transition-colors flex-1">
                  <input
                    type="radio"
                    name="source"
                    value="cruisedot"
                    checked={formData.source === 'cruisedot'}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <img 
                    src="/images/ai-cruise-logo.png" 
                    alt="Cruisedot" 
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span className="text-sm font-medium text-gray-700">Cruisedot</span>
                </label>
              </div>
            </div>

            {/* 카테고리 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">선택 안함</option>
                <option value="주말크루즈">주말크루즈</option>
                <option value="동남아">동남아</option>
                <option value="홍콩">홍콩</option>
                <option value="일본">일본</option>
                <option value="대만">대만</option>
                <option value="중국">중국</option>
                <option value="알래스카">알래스카</option>
                <option value="지중해">지중해</option>
              </select>
            </div>

            {/* 상품 설명 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상품 설명
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-y"
                placeholder="상품에 대한 상세 설명을 입력하세요"
              />
            </div>

            {/* 추천 키워드 설정 - 마케팅 태그 (후킹 태그 선택 위) */}
            <div className="md:col-span-2 p-4 bg-purple-50 border-2 border-purple-300 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                추천 키워드 (마케팅 태그) <span className="text-gray-500 text-xs">(최대 5개 선택)</span>
              </label>
              <p className="text-xs text-purple-700 mb-3 font-semibold">
                💡 선택한 키워드는 크루즈몰 검색에서 연관 검색어로 표시됩니다. 실제 검색량이 많은 키워드를 선택하세요.
              </p>
              
              {/* 선택된 키워드 표시 */}
              {recommendedKeywords.length > 0 && (
                <div className="mb-3 p-3 bg-white rounded-lg border-2 border-purple-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">선택된 키워드 ({recommendedKeywords.length}/5):</p>
                  <div className="flex flex-wrap gap-2">
                    {recommendedKeywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => {
                            setRecommendedKeywords(recommendedKeywords.filter((_, i) => i !== index));
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
              {recommendedKeywords.length < 5 && (
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
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm pr-10"
                    />
                    {keywordSearchTerm && (
                      <button
                        type="button"
                        onClick={() => {
                          setKeywordSearchTerm('');
                          setKeywordDropdownOpen(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                      >
                        <FiX size={18} />
                      </button>
                    )}
                  </div>
                  {keywordDropdownOpen && filteredKeywords.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-72 overflow-y-auto">
                      {filteredKeywords
                        .filter(keyword => !recommendedKeywords.includes(keyword))
                        .map((keyword) => (
                          <div
                            key={keyword}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              if (recommendedKeywords.length < 5) {
                                setRecommendedKeywords([...recommendedKeywords, keyword]);
                                setKeywordSearchTerm('');
                                setKeywordDropdownOpen(false);
                              }
                            }}
                            className="px-4 py-3 cursor-pointer hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0 font-medium text-sm"
                          >
                            {keyword}
                          </div>
                        ))}
                    </div>
                  )}
                  {keywordDropdownOpen && filteredKeywords.filter(keyword => !recommendedKeywords.includes(keyword)).length === 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4 text-center text-gray-500 text-sm">
                      {keywordSearchTerm ? '검색 결과가 없습니다.' : '모든 키워드가 선택되었습니다.'}
                    </div>
                  )}
                </div>
              )}
              {recommendedKeywords.length >= 5 && (
                <div className="p-3 bg-yellow-100 border-2 border-yellow-300 rounded-lg text-xs text-yellow-800 font-semibold">
                  최대 5개까지 선택 가능합니다. 키워드를 삭제하려면 위의 선택된 키워드에서 × 버튼을 클릭하세요.
                </div>
              )}
            </div>

            {/* 후킹 태그 선택 */}
            <div className="md:col-span-2">
              <ProductTagsSelector
                selectedTags={selectedTags}
                onChange={setSelectedTags}
                maxTags={3}
              />
            </div>

            {/* 별점 및 리뷰 개수 설정 */}
            <div className="md:col-span-2 p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                별점 및 리뷰 설정
              </label>
              <p className="text-xs text-yellow-700 mb-3 font-semibold">
                💡 설정한 별점과 리뷰 개수에 맞게 AI가 자동으로 리뷰를 생성합니다.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">평균 별점</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={rating}
                    onChange={(e) => setRating(parseFloat(e.target.value) || 4.4)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">0.0 ~ 5.0 사이의 값</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">리뷰 개수</label>
                  <input
                    type="number"
                    min="0"
                    value={reviewCount}
                    onChange={(e) => setReviewCount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">생성할 리뷰 개수</p>
                </div>
              </div>
              {reviewCount > 0 && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-gray-700">미리보기:</span>
                    <div className="flex items-center gap-1">
                      <FiStar className="text-yellow-400 fill-yellow-400" size={16} />
                      <span className="font-bold text-gray-900">{rating.toFixed(1)}</span>
                    </div>
                    <span className="text-gray-600">이용자 리뷰 {reviewCount.toLocaleString('ko-KR')}개</span>
                  </div>
                </div>
              )}
            </div>

            {/* 썸네일 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                썸네일 사진
              </label>
              <div className="flex items-start gap-4">
                {thumbnail && (
                  <div className="relative">
                    <img
                      src={thumbnail}
                      alt="썸네일"
                      className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      onClick={() => {
                        setThumbnail(null);
                        setThumbnailFile(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                )}
                <div className="flex-1">
                  <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    <FiUpload size={20} />
                    <span className="text-sm font-medium text-gray-700">
                      {thumbnail ? '썸네일 변경' : '썸네일 업로드'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    권장 크기: 800x600px, 최대 10MB
                  </p>
                </div>
              </div>
            </div>

            {/* 방문 국가 설정 */}
            <div className="md:col-span-2 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
              <CountrySelector
                selectedCountries={selectedCountries}
                onChange={setSelectedCountries}
                maxCount={10}
                label="방문 국가 설정"
              />
            </div>

            {/* 출발 날짜 및 종료 날짜 선택 (지도 캘린더) */}
            <div className="md:col-span-2 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg">
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

            {/* 여행기간 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                여행기간 (박수) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.nights || 0}
                onChange={(e) => setFormData({ ...formData, nights: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                여행기간 (일수) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.days || 0}
                onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 크루즈 라인 */}
            <div>
              <AutocompleteInput
                value={formData.cruiseLine}
                onChange={(value) => setFormData({ ...formData, cruiseLine: value })}
                options={cruiseLineOptions}
                placeholder="예: MSC 크루즈, Royal Caribbean, 로얄"
                label="크루즈 라인"
                required
              />
            </div>

            {/* 선박명 */}
            <div>
              <AutocompleteInput
                value={formData.shipName}
                onChange={(value) => setFormData({ ...formData, shipName: value })}
                options={shipNameOptions}
                placeholder="예: MSC 벨리시마, 스펙트럼 오브 더 시즈, 보이저"
                label="선박명"
                required
              />
            </div>

            {/* 시작가 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작가 (원)
              </label>
              <input
                type="number"
                value={formData.basePrice || ''}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="예: 1500000"
              />
            </div>

            {/* 상품 분류 설정 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상품 분류
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">인기 크루즈</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isRecommended}
                    onChange={(e) => setFormData({ ...formData, isRecommended: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">추천 크루즈</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPremium}
                    onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">프리미엄 크루즈</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isGeniePack}
                    onChange={(e) => setFormData({ ...formData, isGeniePack: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">지니패키지 크루즈</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDomestic}
                    onChange={(e) => setFormData({ ...formData, isDomestic: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">국내출발 크루즈</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isJapan}
                    onChange={(e) => setFormData({ ...formData, isJapan: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">일본 크루즈</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isBudget}
                    onChange={(e) => setFormData({ ...formData, isBudget: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">알뜰 크루즈</span>
                </label>
              </div>
            </div>

            {/* 상품 정보 미리보기 */}
            <div className="md:col-span-2 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">상품 정보 미리보기</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span>📅</span>
                  <span className="font-medium">{formData.nights}박 {formData.days}일</span>
                </div>
                {formData.basePrice && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>💰</span>
                    <span className="font-medium">{parseInt(formData.basePrice || '0').toLocaleString()}원</span>
                    <span className="text-red-600 font-bold text-lg">
                      / 월 {Math.ceil(parseInt(formData.basePrice || '0') / 12).toLocaleString()}원
                    </span>
                  </div>
                )}
                {itineraryDays.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span>🗺️</span>
                    <span className="font-medium">{itineraryDays.length}개 일정</span>
                  </div>
                )}
                {formData.category && (
                  <div className="flex items-center gap-2">
                    <span>🏷️</span>
                    <span className="font-medium">{formData.category}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 상세페이지 에디터 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">2. 상세페이지 구성</h2>
          <p className="text-sm text-gray-600 mb-4">
            이미지, 동영상, 텍스트 블록을 자유롭게 추가하여 상세페이지를 구성하세요.
          </p>
          <ProductDetailEditor blocks={detailBlocks} onChange={setDetailBlocks} />
        </div>

        {/* 항공 정보 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">3. 항공 정보</h2>
          <p className="text-sm text-gray-600 mb-4">
            출국 및 귀국 항공편 정보를 입력하세요.
          </p>
          <FlightInfoEditor
            flightInfo={flightInfo}
            onChange={setFlightInfo}
            startDate={formData.startDate}
            endDate={formData.endDate}
            nights={formData.nights}
            days={formData.days}
          />
        </div>

        {/* 포함/불포함 사항 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">4. 포함 사항과 불포함 사항</h2>
          
          {/* 서비스 옵션 체크박스 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-4">서비스 옵션</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 인솔자 */}
              <label className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-300 hover:border-blue-500 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasEscort}
                  onChange={(e) => setHasEscort(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">인솔자 있음</span>
              </label>

              {/* 현지가이드 */}
              <label className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-300 hover:border-blue-500 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasLocalGuide}
                  onChange={(e) => setHasLocalGuide(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">현지가이드 있음</span>
              </label>

              {/* 크루즈닷 전용 스탭 */}
              <label className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-300 hover:border-blue-500 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCruisedotStaff}
                  onChange={(e) => setHasCruisedotStaff(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <img 
                    src="/images/ai-cruise-logo.png" 
                    alt="Cruisedot" 
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span className="text-sm font-medium text-gray-700">크루즈닷 전용 스탭 있음</span>
                </div>
              </label>

              {/* 여행자보험 */}
              <label className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-300 hover:border-blue-500 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasTravelInsurance}
                  onChange={(e) => setHasTravelInsurance(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">여행자보험 있음</span>
              </label>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            상품에 포함된 사항과 불포함 사항을 입력하세요.
          </p>
          <IncludedExcludedEditor
            included={includedItems}
            excluded={excludedItems}
            onChange={(included, excluded) => {
              setIncludedItems(included);
              setExcludedItems(excluded);
            }}
          />
        </div>

        {/* 여행일정 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">5. 여행일정</h2>
          <p className="text-sm text-gray-600 mb-4">
            Day별로 일정을 구성하고, 이미지/동영상/텍스트 블록을 추가하세요. 그룹으로 저장하여 재사용할 수 있습니다.
          </p>
          <EnhancedItineraryEditor
            days={itineraryDays}
            onChange={setItineraryDays}
            nights={formData.nights}
            totalDays={formData.days}
            flightInfo={flightInfo}
          />
        </div>

        {/* 요금표 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">6. 요금표</h2>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                출발일 (연령 범위 자동 계산용)
              </label>
              {formData.startDate && formData.startDate !== departureDate && (
                <button
                  type="button"
                  onClick={() => setDepartureDate(formData.startDate)}
                  className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1"
                >
                  <span>📅</span>
                  <span>여행기간에서 가져오기 ({formData.startDate})</span>
                </button>
              )}
            </div>
            <input
              type="date"
              value={departureDate || ''}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              출발일을 설정하면 만2-11세, 만2세미만의 생년월일 범위가 자동으로 계산됩니다.
              {formData.startDate && (
                <span className="text-blue-600 font-semibold ml-2">
                  💡 여행기간 출발일: {formData.startDate}
                </span>
              )}
            </p>
          </div>
          <PricingTableEditor
            rows={pricingRows}
            onChange={setPricingRows}
            departureDate={departureDate || undefined}
          />
        </div>

        {/* 환불/취소 규정 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">7. 환불/취소 규정</h2>
          <p className="text-sm text-gray-600 mb-4">
            환불 및 취소 규정을 입력하세요. 그룹으로 저장하여 재사용할 수 있습니다.
          </p>
          <RefundPolicyEditor
            content={refundPolicy}
            onChange={setRefundPolicy}
          />
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}

