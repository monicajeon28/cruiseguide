'use client';

import { useEffect, useState, useRef } from 'react';
import { FiUser, FiSearch, FiX, FiCheckCircle } from 'react-icons/fi';
import { showSuccess, showError } from '@/components/ui/Toast';

/**
 * 여행 배정 관리 페이지
 * 관리자가 사용자에게 크루즈 여행을 배정 (온보딩과 동일한 기능)
 * - 첫 번째 칸: 크루즈 가이드 사용자 검색 (필수)
 * - 두 번째 칸: 크루즈몰 닉네임 검색 (선택사항)
 * - 크루즈몰 상품 검색 (필수)
 * - 상품 선택 시 여행 정보 자동 표시 (시작일, 종료일, 박/일, D-day)
 */

interface GenieUser {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
}

interface MallUser {
  id: number;
  name: string | null;
  phone: string | null;
  mallNickname: string | null;
}

interface Product {
  id: number;
  productCode: string;
  cruiseLine: string;
  shipName: string;
  packageName: string;
  nights: number;
  days: number;
  itineraryPattern: any;
  startDate?: string | null;
  endDate?: string | null;
  isPopular?: boolean;
  isRecommended?: boolean;
  displayLabel?: string;
}

export default function AssignTripPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 크루즈 가이드 사용자 검색 (필수)
  const [genieSearchTerm, setGenieSearchTerm] = useState('');
  const [genieSearchResults, setGenieSearchResults] = useState<GenieUser[]>([]);
  const [genieSearchLoading, setGenieSearchLoading] = useState(false);
  const [genieSearchDropdownOpen, setGenieSearchDropdownOpen] = useState(false);
  const [selectedGenieUserId, setSelectedGenieUserId] = useState<number | null>(null);
  const genieSearchRef = useRef<HTMLDivElement>(null);
  const selectedGenieUser = genieSearchResults.find(u => u.id === selectedGenieUserId);

  // 크루즈몰 닉네임 검색 (선택사항)
  const [mallSearchTerm, setMallSearchTerm] = useState('');
  const [mallSearchResults, setMallSearchResults] = useState<MallUser[]>([]);
  const [mallSearchLoading, setMallSearchLoading] = useState(false);
  const [mallSearchDropdownOpen, setMallSearchDropdownOpen] = useState(false);
  const [selectedMallUserId, setSelectedMallUserId] = useState<number | null>(null);
  const mallSearchRef = useRef<HTMLDivElement>(null);
  const selectedMallUser = mallSearchResults.find(u => u.id === selectedMallUserId);

  // 상품 검색
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productSearchResults, setProductSearchResults] = useState<Product[]>([]);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [productSearchDropdownOpen, setProductSearchDropdownOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const productSearchRef = useRef<HTMLDivElement>(null);

  // 온보딩 폼 데이터
  const [onboardingForm, setOnboardingForm] = useState({
    productCode: '',
    productId: null as number | null,
    cruiseName: '',
    startDate: '',
    endDate: '',
    companionType: null as '친구' | '커플' | '가족' | '혼자' | null,
    destination: '',
  });

  // D-day 계산
  const calculateDday = (startDate: string): number | null => {
    if (!startDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // 크루즈 가이드 사용자 검색 디바운싱
  useEffect(() => {
    // 검색어가 변경될 때마다 검색 실행 (빈 검색어도 포함)
    const timeoutId = setTimeout(() => {
      searchGenieUsers(genieSearchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [genieSearchTerm]);

  // 크루즈몰 닉네임 검색 디바운싱
  useEffect(() => {
    // 검색어가 변경될 때마다 검색 실행 (빈 검색어도 포함)
    const timeoutId = setTimeout(() => {
      searchMallUsers(mallSearchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [mallSearchTerm]);

  // 상품 검색 디바운싱
  useEffect(() => {
    if (!productSearchTerm.trim()) {
      setProductSearchResults([]);
      // 검색어가 비어있을 때는 드롭다운을 닫지 않음 (포커스 상태 유지)
      return;
    }

    const timeoutId = setTimeout(() => {
      searchProducts(productSearchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [productSearchTerm]);

  // 클릭 외부 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (genieSearchRef.current && !genieSearchRef.current.contains(event.target as Node)) {
        setGenieSearchDropdownOpen(false);
      }
      if (mallSearchRef.current && !mallSearchRef.current.contains(event.target as Node)) {
        setMallSearchDropdownOpen(false);
      }
      if (productSearchRef.current && !productSearchRef.current.contains(event.target as Node)) {
        setProductSearchDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchGenieUsers = async (query: string) => {
    try {
      setGenieSearchLoading(true);
      setGenieSearchDropdownOpen(true); // 검색 시작 시 드롭다운 열기
      const params = new URLSearchParams({ 
        role: 'user' // 크루즈 가이드 사용자만
      });
      
      // 검색어가 있으면 추가
      if (query.trim()) {
        params.append('search', query.trim());
      }
      
      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.ok && data.users) {
        setGenieSearchResults(data.users);
        setGenieSearchDropdownOpen(true); // 결과가 있든 없든 드롭다운 열기
      } else {
        setGenieSearchResults([]);
        setGenieSearchDropdownOpen(true); // 에러 시에도 드롭다운 열기
      }
    } catch (error) {
      console.error('Error searching genie users:', error);
      setGenieSearchResults([]);
      setGenieSearchDropdownOpen(true); // 에러 시에도 드롭다운 열기
    } finally {
      setGenieSearchLoading(false);
    }
  };

  const searchMallUsers = async (query: string) => {
    try {
      setMallSearchLoading(true);
      setMallSearchDropdownOpen(true); // 검색 시작 시 드롭다운 열기
      
      // 크루즈몰 사용자 목록 API 사용 (전체 목록 조회)
      const params = new URLSearchParams();
      if (query.trim()) {
        params.append('q', query.trim());
      }
      params.append('limit', '200'); // 최대 200명까지
      
      const response = await fetch(`/api/admin/mall-users/list?${params.toString()}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.ok && data.users) {
        // API에서 이미 필터링된 결과를 사용 (mallNickname 검색 포함)
        // mallNickname이 없어도 메인몰 가입 고객이면 표시
        setMallSearchResults(data.users.map((u: any) => ({
          id: u.id,
          name: u.name,
          phone: u.phone,
          mallNickname: u.mallNickname || u.displayName || '닉네임 없음',
        })));
        setMallSearchDropdownOpen(true); // 결과가 있든 없든 드롭다운 열기
      } else {
        console.error('[Mall Users Search] API error:', data);
        setMallSearchResults([]);
        setMallSearchDropdownOpen(true); // 에러 시에도 드롭다운 열기
      }
    } catch (error) {
      console.error('Error searching mall users:', error);
      setMallSearchResults([]);
      setMallSearchDropdownOpen(true); // 에러 시에도 드롭다운 열기
    } finally {
      setMallSearchLoading(false);
    }
  };

  const searchProducts = async (query: string) => {
    // 검색어가 없어도 드롭다운은 열어두고 모든 상품 로드
    try {
      setProductSearchLoading(true);
      setProductSearchDropdownOpen(true); // 검색 시작 시 드롭다운 열기
      
      // 검색어가 없으면 빈 문자열로 요청 (API에서 모든 상품 반환)
      const searchQuery = query.trim() || '';
      const response = await fetch(`/api/admin/products/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.ok && data.products) {
        setProductSearchResults(data.products);
        setProductSearchDropdownOpen(true); // 결과가 있든 없든 드롭다운 열기
      } else {
        setProductSearchResults([]);
        setProductSearchDropdownOpen(true); // 에러 시에도 드롭다운 열기
      }
    } catch (error) {
      console.error('Error searching products:', error);
      setProductSearchResults([]);
      setProductSearchDropdownOpen(true); // 에러 시에도 드롭다운 열기
    } finally {
      setProductSearchLoading(false);
    }
  };

  const handleSelectGenieUser = (user: GenieUser) => {
    setSelectedGenieUserId(user.id);
    setGenieSearchTerm(user.name || user.phone || '');
    setGenieSearchDropdownOpen(false);
  };

  const handleSelectMallUser = (user: MallUser) => {
    setSelectedMallUserId(user.id);
    setMallSearchTerm(user.mallNickname || '');
    setMallSearchDropdownOpen(false);
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductSearchTerm(product.packageName);
    setProductSearchDropdownOpen(false);

    // 크루즈명 자동 채우기
    let cruiseName = '';
    if (product.cruiseLine && product.shipName) {
      const shipName = product.shipName.startsWith(product.cruiseLine)
        ? product.shipName.replace(product.cruiseLine, '').trim()
        : product.shipName;
      cruiseName = `${product.cruiseLine} ${shipName}`.trim();
    } else {
      cruiseName = product.cruiseLine || product.shipName || product.packageName;
    }

    // 목적지 추출
    let destination = '';
    if (product.itineraryPattern && Array.isArray(product.itineraryPattern)) {
      const countries = new Set<string>();
      const countryNameMap: Record<string, string> = {
        'JP': '일본', 'TH': '태국', 'VN': '베트남', 'MY': '말레이시아',
        'SG': '싱가포르', 'ES': '스페인', 'FR': '프랑스', 'IT': '이탈리아',
        'GR': '그리스', 'TR': '터키', 'US': '미국', 'CN': '중국',
        'TW': '대만', 'HK': '홍콩', 'PH': '필리핀', 'ID': '인도네시아'
      };

      product.itineraryPattern.forEach((day: any) => {
        if (day.country && day.country !== 'KR') {
          const countryName = countryNameMap[day.country] || day.location || day.country;
          countries.add(countryName);
        }
      });

      destination = Array.from(countries).join(', ');
    }

    // 날짜 자동 채우기
    const startDate = product.startDate ? new Date(product.startDate).toISOString().split('T')[0] : '';
    let endDate = '';
    if (startDate && product.days) {
      const end = new Date(startDate);
      end.setDate(end.getDate() + product.days - 1);
      endDate = end.toISOString().split('T')[0];
    } else if (product.endDate) {
      endDate = new Date(product.endDate).toISOString().split('T')[0];
    }

    setOnboardingForm({
      productCode: product.productCode,
      productId: product.id,
      cruiseName,
      startDate,
      endDate,
      companionType: onboardingForm.companionType,
      destination,
    });
  };

  const handleStartDateChange = (date: string) => {
    setOnboardingForm({ ...onboardingForm, startDate: date });
    
    // 종료일 자동 계산
    if (selectedProduct && date) {
      const start = new Date(date);
      const end = new Date(start);
      end.setDate(end.getDate() + selectedProduct.days - 1);
      setOnboardingForm(prev => ({
        ...prev,
        startDate: date,
        endDate: end.toISOString().split('T')[0],
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGenieUserId) {
      showError('크루즈 가이드 사용자를 선택해주세요.');
      return;
    }

    if (!selectedProduct || !onboardingForm.startDate || !onboardingForm.endDate) {
      showError('상품, 여행 시작일, 종료일을 모두 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);

      // 사용자의 첫 번째 여행을 찾거나, 없으면 임시 tripId 사용
      let tripId = 0;
      try {
        const userTripsRes = await fetch(`/api/admin/users/${selectedGenieUserId}`, {
          credentials: 'include',
        });
        const userData = await userTripsRes.json();
        
        if (userData.ok && userData.user.trips && userData.user.trips.length > 0) {
          tripId = userData.user.trips[0].id;
        }
      } catch (error) {
        console.error('Error fetching user trips:', error);
      }

      // 온보딩 API 호출
      const response = await fetch(`/api/admin/users/${selectedGenieUserId}/trips/${tripId}/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productId: onboardingForm.productId,
          productCode: onboardingForm.productCode,
          cruiseName: onboardingForm.cruiseName,
          startDate: onboardingForm.startDate,
          endDate: onboardingForm.endDate,
          companionType: onboardingForm.companionType || null,
          destination: onboardingForm.destination,
          itineraryPattern: selectedProduct.itineraryPattern,
        }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        showSuccess('여행이 배정되었습니다! 크루즈 가이드 지니가 활성화되었습니다.');
        // 폼 초기화
        setSelectedGenieUserId(null);
        setSelectedMallUserId(null);
        setSelectedProduct(null);
        setGenieSearchTerm('');
        setMallSearchTerm('');
        setProductSearchTerm('');
        setGenieSearchResults([]);
        setMallSearchResults([]);
        setProductSearchResults([]);
        setOnboardingForm({
          productCode: '',
          productId: null,
          cruiseName: '',
          startDate: '',
          endDate: '',
          companionType: null,
          destination: '',
        });
      } else {
        showError(data.error || '여행 배정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error assigning trip:', error);
      showError('여행 배정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dday = onboardingForm.startDate ? calculateDday(onboardingForm.startDate) : null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">여행 배정</h1>
          <p className="text-gray-600">크루즈 가이드 사용자에게 여행을 배정하고 크루즈몰과 연동합니다</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
          {/* 크루즈 가이드 사용자 검색 (필수) */}
          <div className="genie-user-search-container relative" ref={genieSearchRef}>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <FiUser />
              크루즈 가이드 사용자 검색 <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={genieSearchTerm}
                  onChange={(e) => {
                    setGenieSearchTerm(e.target.value);
                    setGenieSearchDropdownOpen(true); // 입력 시 항상 드롭다운 열기
                    if (!e.target.value) {
                      setSelectedGenieUserId(null);
                      setGenieSearchResults([]);
                    }
                  }}
                  onFocus={() => {
                    // 포커스 시 항상 드롭다운 열기 및 전체 목록 로드
                    setGenieSearchDropdownOpen(true);
                    searchGenieUsers(genieSearchTerm);
                  }}
                  onClick={() => {
                    // 클릭 시에도 드롭다운 열기 및 전체 목록 로드
                    setGenieSearchDropdownOpen(true);
                    searchGenieUsers(genieSearchTerm);
                  }}
                  placeholder="이름 또는 전화번호로 검색 (예: 홍길동, 010-1234-5678)"
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                />
                {genieSearchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setGenieSearchTerm('');
                      setSelectedGenieUserId(null);
                      setGenieSearchResults([]);
                      setGenieSearchDropdownOpen(false);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FiX size={20} />
                  </button>
                )}
              </div>
              
              {/* 검색 결과 드롭다운 */}
              {genieSearchDropdownOpen && (
                <div className="absolute z-[9999] w-full mt-2 bg-white border-2 border-blue-500 rounded-lg shadow-2xl max-h-72 overflow-y-auto" style={{ position: 'absolute', top: '100%', left: 0, right: 0 }}>
                  {genieSearchLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      로딩 중...
                    </div>
                  ) : genieSearchResults.length > 0 ? (
                    <>
                      {!genieSearchTerm && (
                        <div className="p-3 bg-blue-50 border-b border-blue-200">
                          <div className="text-sm font-semibold text-blue-800">크루즈 가이드 사용자 목록</div>
                          <div className="text-xs text-blue-600 mt-1">검색어를 입력하면 필터링됩니다</div>
                        </div>
                      )}
                      {genieSearchResults.map((user) => (
                        <div
                          key={user.id}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelectGenieUser(user)}
                          className={`p-4 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors ${
                            selectedGenieUserId === user.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">
                                {user.name || '이름 없음'}
                                <span className="ml-2 text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                  지니 가이드
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {user.phone ? `📞 ${user.phone}` : '연락처 없음'}
                                {user.email && ` · ✉️ ${user.email}`}
                              </div>
                            </div>
                            {selectedGenieUserId === user.id && (
                              <FiCheckCircle className="text-green-500 flex-shrink-0" size={20} />
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : genieSearchTerm ? (
                    <div className="p-4 text-center text-gray-500">검색 결과가 없습니다</div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">사용자 목록을 불러오는 중...</div>
                  )}
                </div>
              )}
            </div>
            {selectedGenieUser && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm font-semibold text-green-800">선택된 크루즈 가이드 사용자:</div>
                <div className="text-sm text-green-700 mt-1">
                  {selectedGenieUser.name || '이름 없음'} ({selectedGenieUser.phone || '연락처 없음'})
                </div>
              </div>
            )}
          </div>

          {/* 크루즈몰 닉네임 검색 (선택사항) */}
          <div className="mall-user-search-container relative" ref={mallSearchRef}>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <FiUser />
              크루즈몰 닉네임 검색 <span className="text-gray-400 text-xs">(선택사항)</span>
            </label>
            <div className="relative">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={mallSearchTerm}
                  onChange={(e) => {
                    setMallSearchTerm(e.target.value);
                    setMallSearchDropdownOpen(true); // 입력 시 항상 드롭다운 열기
                    if (!e.target.value) {
                      setSelectedMallUserId(null);
                      setMallSearchResults([]);
                    }
                  }}
                  onFocus={() => {
                    // 포커스 시 항상 드롭다운 열기 및 전체 목록 로드
                    setMallSearchDropdownOpen(true);
                    searchMallUsers(mallSearchTerm);
                  }}
                  onClick={() => {
                    // 클릭 시에도 드롭다운 열기 및 전체 목록 로드
                    setMallSearchDropdownOpen(true);
                    searchMallUsers(mallSearchTerm);
                  }}
                  placeholder="크루즈몰 닉네임으로 검색 (예: 관리자)"
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                />
                {mallSearchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setMallSearchTerm('');
                      setSelectedMallUserId(null);
                      setMallSearchResults([]);
                      setMallSearchDropdownOpen(false);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FiX size={20} />
                  </button>
                )}
              </div>
              
              {/* 검색 결과 드롭다운 */}
              {mallSearchDropdownOpen && (
                <div className="absolute z-[9999] w-full mt-2 bg-white border-2 border-blue-500 rounded-lg shadow-2xl max-h-72 overflow-y-auto" style={{ position: 'absolute', top: '100%', left: 0, right: 0 }}>
                  {mallSearchLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      로딩 중...
                    </div>
                  ) : mallSearchResults.length > 0 ? (
                    <>
                      {!mallSearchTerm && (
                        <div className="p-3 bg-purple-50 border-b border-purple-200">
                          <div className="text-sm font-semibold text-purple-800">크루즈몰 고객 목록</div>
                          <div className="text-xs text-purple-600 mt-1">검색어를 입력하면 필터링됩니다</div>
                        </div>
                      )}
                      {mallSearchResults.map((user) => (
                        <div
                          key={user.id}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelectMallUser(user)}
                          className={`p-4 border-b border-gray-100 hover:bg-purple-50 cursor-pointer transition-colors ${
                            selectedMallUserId === user.id ? 'bg-purple-50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">
                                {user.mallNickname || '닉네임 없음'}
                                <span className="ml-2 text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                                  크루즈몰
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {user.name && `이름: ${user.name}`}
                                {user.phone && ` · 📞 ${user.phone}`}
                              </div>
                            </div>
                            {selectedMallUserId === user.id && (
                              <FiCheckCircle className="text-green-500 flex-shrink-0" size={20} />
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : mallSearchTerm ? (
                    <div className="p-4 text-center text-gray-500">검색 결과가 없습니다</div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">고객 목록을 불러오는 중...</div>
                  )}
                </div>
              )}
            </div>
            {selectedMallUser && (
              <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="text-sm font-semibold text-purple-800">선택된 크루즈몰 사용자:</div>
                <div className="text-sm text-purple-700 mt-1">
                  닉네임: {selectedMallUser.mallNickname || '닉네임 없음'}
                  {selectedMallUser.name && ` (이름: ${selectedMallUser.name})`}
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              크루즈몰과 크루즈 가이드가 같은 고객임을 연결하기 위한 선택사항입니다
            </p>
          </div>

          {/* 크루즈몰 상품 검색 (필수) */}
          <div className="product-search-container relative" ref={productSearchRef}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              크루즈몰 상품 검색 <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={productSearchTerm}
                  onChange={(e) => {
                    setProductSearchTerm(e.target.value);
                    setProductSearchDropdownOpen(true); // 입력 시 항상 드롭다운 열기
                    if (!e.target.value) {
                      setSelectedProduct(null);
                      setOnboardingForm({
                        ...onboardingForm,
                        productCode: '',
                        productId: null,
                        cruiseName: '',
                        startDate: '',
                        endDate: '',
                        destination: '',
                      });
                    }
                  }}
                  onFocus={() => {
                    // 포커스 시 항상 드롭다운 열기 및 모든 상품 로드
                    setProductSearchDropdownOpen(true);
                    // 검색어가 없어도 모든 상품 로드
                    searchProducts(productSearchTerm);
                  }}
                  onClick={() => {
                    // 클릭 시에도 드롭다운 열기 및 모든 상품 로드
                    setProductSearchDropdownOpen(true);
                    // 검색어가 없어도 모든 상품 로드
                    searchProducts(productSearchTerm);
                  }}
                  placeholder="상품명 또는 크루즈명으로 검색 (예: MSC 벨리시마)"
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                />
              </div>
              
              {/* 검색 결과 드롭다운 */}
              {productSearchDropdownOpen && (
                <div className="absolute z-[9999] w-full mt-2 bg-white border-2 border-blue-500 rounded-lg shadow-2xl max-h-72 overflow-y-auto" style={{ position: 'absolute', top: '100%', left: 0, right: 0 }}>
                  {productSearchLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      검색 중...
                    </div>
                  ) : productSearchResults.length > 0 ? (
                    <>
                      {!productSearchTerm && (
                        <div className="p-3 bg-blue-50 border-b border-blue-200">
                          <div className="text-sm font-semibold text-blue-800">판매 중인 상품 목록</div>
                          <div className="text-xs text-blue-600 mt-1">검색어를 입력하면 연관검색으로 필터링됩니다</div>
                        </div>
                      )}
                      {productSearchResults.map((product) => (
                        <div
                          key={product.id}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelectProduct(product)}
                          className={`p-4 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors ${
                            selectedProduct?.id === product.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 flex items-center gap-2">
                                {product.packageName}
                                {product.isPopular && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">인기</span>
                                )}
                                {product.isRecommended && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">추천</span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {product.cruiseLine} {product.shipName}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {product.nights}박 {product.days}일 · 코드: {product.productCode}
                              </div>
                            </div>
                            {selectedProduct?.id === product.id && (
                              <FiCheckCircle className="text-green-500 flex-shrink-0 mt-1" size={20} />
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : productSearchTerm ? (
                    <div className="p-4 text-center text-gray-500">검색 결과가 없습니다</div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">상품을 불러오는 중...</div>
                  )}
                </div>
              )}
            </div>
            {selectedProduct && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm font-semibold text-green-800">선택된 상품:</div>
                <div className="text-sm text-green-700 mt-1">
                  {selectedProduct.packageName} ({selectedProduct.productCode})
                </div>
              </div>
            )}
          </div>

          {/* 여행 정보 표시 (상품 선택 시 자동 표시) */}
          {selectedProduct && onboardingForm.startDate && onboardingForm.endDate && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
              <h3 className="text-lg font-bold text-blue-900 mb-3">여행 정보</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-blue-800">여행 기간:</span>
                  <div className="text-blue-700 mt-1">
                    {selectedProduct.nights}박 {selectedProduct.days}일
                  </div>
                </div>
                {dday !== null && (
                  <div>
                    <span className="font-semibold text-blue-800">출발까지:</span>
                    <div className="text-blue-700 mt-1">
                      {dday > 0 ? `D-${dday}` : dday === 0 ? 'D-Day' : `D+${Math.abs(dday)}`}
                    </div>
                  </div>
                )}
                <div>
                  <span className="font-semibold text-blue-800">여행 시작일:</span>
                  <div className="text-blue-700 mt-1">
                    {new Date(onboardingForm.startDate).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short'
                    })}
                  </div>
                </div>
                <div>
                  <span className="font-semibold text-blue-800">여행 종료일:</span>
                  <div className="text-blue-700 mt-1">
                    {new Date(onboardingForm.endDate).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short'
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 크루즈명 (자동 채워짐, 읽기 전용) */}
          {selectedProduct && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                크루즈명
              </label>
              <input
                type="text"
                value={onboardingForm.cruiseName}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
              />
            </div>
          )}

          {/* 여행 날짜 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                여행 시작일 <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                value={onboardingForm.startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              {selectedProduct && (
                <p className="text-xs text-gray-500 mt-1">
                  {selectedProduct.days}일 일정으로 종료일이 자동 계산됩니다
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                여행 종료일 <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                value={onboardingForm.endDate}
                onChange={(e) => setOnboardingForm({ ...onboardingForm, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                readOnly={!!selectedProduct && !!onboardingForm.startDate}
              />
              {selectedProduct && onboardingForm.startDate && (
                <p className="text-xs text-gray-500 mt-1">
                  상품 일정에 따라 자동 계산됨
                </p>
              )}
            </div>
          </div>

          {/* 동행 유형 (선택사항) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              동행 유형 <span className="text-gray-400 text-xs">(선택사항)</span>
            </label>
            <select
              value={onboardingForm.companionType || ''}
              onChange={(e) => {
                const value = e.target.value;
                setOnboardingForm({ 
                  ...onboardingForm, 
                  companionType: value ? (value as '친구' | '커플' | '가족' | '혼자') : null 
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">선택하지 않음</option>
              <option value="가족">가족</option>
              <option value="커플">커플</option>
              <option value="친구">친구</option>
              <option value="혼자">혼자</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              동행 유형을 선택하지 않아도 여행 배정이 가능합니다
            </p>
          </div>

          {/* 목적지 (자동 채워짐, 읽기 전용) */}
          {selectedProduct && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">목적지</label>
              <input
                type="text"
                value={onboardingForm.destination}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">상품 정보에서 자동으로 가져왔습니다</p>
            </div>
          )}

          {/* 안내 메시지 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-semibold mb-2">⚠️ 여행 배정 완료 시:</p>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>비밀번호가 3800으로 변경됩니다</li>
              <li>크루즈 가이드 지니가 활성화됩니다</li>
              <li>여행 횟수가 2회 이상이면 재구매로 자동 체크됩니다</li>
              <li>크루즈몰 사용자의 경우 나의정보에서도 확인할 수 있습니다</li>
            </ul>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={isSubmitting || !selectedGenieUserId || !selectedProduct || !onboardingForm.startDate || !onboardingForm.endDate}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FiCheckCircle />
            {isSubmitting ? '배정 중...' : '여행 배정하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
