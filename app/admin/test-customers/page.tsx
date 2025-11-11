'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FiSearch, FiFilter, FiArrowUp, FiArrowDown, FiChevronLeft, FiChevronRight, FiUser, FiClock, FiTrash2, FiX, FiPlus, FiEdit2, FiInfo, FiRefreshCw } from 'react-icons/fi';
import { normalizeItineraryPattern } from '@/lib/utils/itineraryPattern';
import { getKoreanCountryName } from '@/lib/utils/countryMapping';
import { showError, showSuccess } from '@/components/ui/Toast';

interface TestCustomer {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  lastActiveAt: string | null;
  tripCount: number;
  totalTripCount: number;
  customerStatus: string | null;
  status?: 'test' | 'locked';
  testModeStartedAt: string | null;
  testModeRemainingHours: number | null;
  currentPassword?: string | null;
  trips: Array<{
    id: number;
    cruiseName: string | null;
    companionType: string | null;
    destination: any;
    startDate: string | null;
    endDate: string | null;
  }>;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function TestCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<TestCustomer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터 및 검색 상태
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'test' | 'locked'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'testModeStartedAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 검색어 debounce
  const [searchInput, setSearchInput] = useState('');

  // 삭제 관련 상태
  const [selectedCustomers, setSelectedCustomers] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [resettingPassword, setResettingPassword] = useState<number | null>(null);
  const [reactivatingCustomer, setReactivatingCustomer] = useState<number | null>(null);

  // 고객 추가 관련 상태
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    phone: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [showStatusGuide, setShowStatusGuide] = useState(true);

  // 온보딩 추가 관련 상태
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
  const [selectedCustomerForOnboarding, setSelectedCustomerForOnboarding] = useState<TestCustomer | null>(null);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productOptions, setProductOptions] = useState<Array<{ value: string; label: string; product: any }>>([]);
  const [selectedProductCode, setSelectedProductCode] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [onboardingFormData, setOnboardingFormData] = useState({
    companionType: '가족' as '친구' | '커플' | '가족' | '혼자',
    startDate: '',
    endDate: '',
  });
  const [isProcessingOnboarding, setIsProcessingOnboarding] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadCustomers();
  }, [search, status, sortBy, sortOrder, pagination.page]);

  // 상품 검색 debounce
  useEffect(() => {
    if (!onboardingModalOpen) return;
    
    const timer = window.setTimeout(() => {
      loadProductOptions(productSearchTerm);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [productSearchTerm, onboardingModalOpen]);

  // 모달이 열릴 때 상품 목록 로드
  useEffect(() => {
    if (onboardingModalOpen) {
      loadProductOptions('');
    }
  }, [onboardingModalOpen]);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        search,
        status,
        sortBy,
        sortOrder,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      const response = await fetch(`/api/admin/test-customers?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('인증이 필요합니다. 다시 로그인해 주세요.');
        }
        throw new Error('테스트 고객 목록을 불러올 수 없습니다.');
      }

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || '테스트 고객 목록을 불러오는 중 오류가 발생했습니다.');
      }

      setCustomers(data.customers || []);
      setPagination({
        total: data.pagination?.total || 0,
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || 20,
        totalPages: data.pagination?.totalPages || 1,
      });
    } catch (err) {
      console.error('Failed to load test customers:', err);
      setError(err instanceof Error ? err.message : '테스트 고객 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivate = async (customerId: number, customerName: string | null) => {
    if (!confirm(`${customerName || '고객'}의 테스트 기간을 72시간 연장하시겠습니까?\n\n재활성 버튼을 클릭한 시간으로부터 72시간 더 사용 가능합니다.`)) {
      return;
    }

    setReactivatingCustomer(customerId);

    try {
      const response = await fetch(`/api/admin/test-customers/${customerId}/reactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || '재활성 처리에 실패했습니다.');
      }

      alert(`✅ ${data.message || '테스트 기간이 72시간 연장되었습니다.'}`);
      await loadCustomers();
    } catch (error) {
      console.error('[TestCustomers] Failed to reactivate:', error);
      alert(`❌ 재활성 실패\n\n${error instanceof Error ? error.message : '재활성 처리 중 오류가 발생했습니다.'}`);
    } finally {
      setReactivatingCustomer(null);
    }
  };

  const handleResetPassword = async (customerId: number, currentPassword: string | null) => {
    const newPassword = prompt(
      `비밀번호를 변경하세요:\n\n현재 비밀번호: ${currentPassword || '(없음)'}`,
      currentPassword || '3800'
    );
    
    if (!newPassword) return;
    
    if (newPassword.length < 4) {
      alert('비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }
    
    if (!confirm(`비밀번호를 "${newPassword}"로 변경하시겠습니까?`)) return;
    
    setResettingPassword(customerId);
    
    try {
      const response = await fetch(`/api/admin/users/${customerId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newPassword: newPassword }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.ok) {
        throw new Error(data.error || '비밀번호 변경에 실패했습니다.');
      }
      
      alert(`✅ 비밀번호가 "${newPassword}"로 변경되었습니다.`);
      await loadCustomers();
    } catch (error) {
      console.error('[TestCustomers] Failed to reset password:', error);
      alert(`❌ 비밀번호 변경 실패\n\n${error instanceof Error ? error.message : '비밀번호 변경 중 오류가 발생했습니다.'}`);
    } finally {
      setResettingPassword(null);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCustomers(new Set(customers.map(c => c.id)));
    } else {
      setSelectedCustomers(new Set());
    }
  };

  const handleSelectCustomer = (customerId: number, checked: boolean) => {
    const newSelected = new Set(selectedCustomers);
    if (checked) {
      newSelected.add(customerId);
    } else {
      newSelected.delete(customerId);
    }
    setSelectedCustomers(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedCustomers.size === 0) {
      alert('삭제할 고객을 선택해주세요.');
      return;
    }

    const customerNames = customers
      .filter(c => selectedCustomers.has(c.id))
      .map(c => c.name || `ID: ${c.id}`)
      .join(', ');

    const confirmed = confirm(
      `선택한 ${selectedCustomers.size}명의 테스트 고객을 삭제하시겠습니까?\n\n` +
      `고객: ${customerNames}\n\n` +
      `⚠️ 이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedCustomers).map(async (customerId) => {
        console.log(`[TestCustomers] Deleting user ${customerId}...`);
        
        const response = await fetch(`/api/admin/users/${customerId}/delete`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log(`[TestCustomers] Response for user ${customerId}:`, {
          status: response.status,
          ok: response.ok,
        });

        const responseText = await response.text();
        console.log(`[TestCustomers] Response text for user ${customerId}:`, responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error(`[TestCustomers] JSON parse error for user ${customerId}:`, parseError);
          throw new Error(`서버 응답 파싱 실패: ${responseText.substring(0, 100)}`);
        }

        if (!response.ok || !data.ok) {
          const errorMsg = data.error || data.errorMessage || `고객 ID ${customerId} 삭제 실패`;
          console.error(`[TestCustomers] Delete failed for user ${customerId}:`, data);
          throw new Error(`${errorMsg} (ID: ${customerId})`);
        }
        
        console.log(`[TestCustomers] Successfully deleted user ${customerId}`);
        return customerId;
      });

      await Promise.all(deletePromises);
      alert(`✅ 성공!\n\n${selectedCustomers.size}명의 테스트 고객이 삭제되었습니다.`);
      setSelectedCustomers(new Set());
      await loadCustomers();
    } catch (error) {
      console.error('[TestCustomers] Failed to delete customers:', error);
      const errorMessage = error instanceof Error ? error.message : '고객 삭제 중 오류가 발생했습니다.';
      alert(`❌ 삭제 실패\n\n${errorMessage}\n\n콘솔을 확인해주세요.`);
      setSelectedCustomers(new Set());
    } finally {
      setIsDeleting(false);
    }
  };

  const SortIcon = ({ field }: { field: typeof sortBy }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <FiArrowUp className="w-4 h-4" /> : <FiArrowDown className="w-4 h-4" />;
  };

  const allSelected = customers.length > 0 && selectedCustomers.size === customers.length;
  const someSelected = selectedCustomers.size > 0 && selectedCustomers.size < customers.length;

  // 온보딩 추가 관련 함수들
  const handleOpenOnboardingModal = (customer: TestCustomer) => {
    setSelectedCustomerForOnboarding(customer);
    setOnboardingModalOpen(true);
    setProductSearchTerm('');
    setSelectedProductCode(null);
    setSelectedProduct(null);
    setOnboardingFormData({
      companionType: '가족',
      startDate: '',
      endDate: '',
    });
  };

  const handleCloseOnboardingModal = () => {
    setOnboardingModalOpen(false);
    setSelectedCustomerForOnboarding(null);
    setProductSearchTerm('');
    setSelectedProductCode(null);
    setSelectedProduct(null);
    setOnboardingFormData({
      companionType: '가족',
      startDate: '',
      endDate: '',
    });
  };

  const loadProductOptions = async (searchTerm: string) => {
    try {
      const url = searchTerm
        ? `/api/admin/products/search?q=${encodeURIComponent(searchTerm)}`
        : '/api/admin/products/search';
      
      const response = await fetch(url, {
        credentials: 'include',
      });
      
      const data = await response.json();
      if (data.ok && Array.isArray(data.products)) {
        const options = data.products.map((product: any) => ({
          value: product.productCode,
          label: `${product.packageName} (${product.cruiseLine} ${product.shipName}) - ${product.productCode}`,
          product: product,
        }));
        setProductOptions(options);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleProductSelect = async (productCode: string) => {
    try {
      setSelectedProductCode(productCode);
      setProductSearchTerm('');
      
      const response = await fetch(`/api/public/products/${productCode}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        showError(`상품 정보를 불러올 수 없습니다. (${response.status})`, '오류');
        return;
      }
      
      const data = await response.json();
      
      if (data.ok && data.product) {
        const product = data.product;
        setSelectedProduct(product);
        
        // 시작일/종료일 설정 (상품에 있으면 사용, 없으면 오늘 기준)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let startDate: string;
        let endDate: string;
        
        if (product.startDate) {
          startDate = new Date(product.startDate).toISOString().split('T')[0];
          const end = new Date(product.startDate);
          end.setDate(end.getDate() + (product.days || 5) - 1);
          endDate = end.toISOString().split('T')[0];
        } else {
          startDate = today.toISOString().split('T')[0];
          const end = new Date(today);
          end.setDate(end.getDate() + (product.days || 5) - 1);
          endDate = end.toISOString().split('T')[0];
        }
        
        setOnboardingFormData(prev => ({
          ...prev,
          startDate,
          endDate,
        }));
      }
    } catch (error) {
      console.error('Failed to load product:', error);
      showError('상품 정보를 불러오는 중 오류가 발생했습니다.', '오류');
    }
  };

  const handleCreateTestCustomer = async () => {
    if (!createFormData.name || !createFormData.phone) {
      alert('이름과 연락처를 모두 입력해주세요.');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/customers/create-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(createFormData),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || '테스트 고객 추가에 실패했습니다.');
      }

      alert('테스트 고객이 추가되었습니다. (비밀번호: 1101, 테스트 기간: 72시간)');
      setIsCreateModalOpen(false);
      setCreateFormData({ name: '', phone: '' });
      await loadCustomers();
    } catch (error) {
      console.error('Failed to create test customer:', error);
      alert(error instanceof Error ? error.message : '테스트 고객 추가 중 오류가 발생했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateOnboarding = async () => {
    if (!selectedCustomerForOnboarding || !selectedProduct || !selectedProductCode) {
      showError('상품을 선택해주세요.', '오류');
      return;
    }

    if (!onboardingFormData.startDate || !onboardingFormData.endDate) {
      showError('출발일과 도착일을 입력해주세요.', '오류');
      return;
    }

    setIsProcessingOnboarding(true);
    try {
      const cruiseName = `${selectedProduct.cruiseLine} ${selectedProduct.shipName}`;
      
      // itineraryPattern에서 목적지 추출
      const destinations: string[] = [];
      const itineraryPattern = normalizeItineraryPattern(selectedProduct.itineraryPattern);
      
      itineraryPattern.forEach((day: any) => {
        if ((day.type === 'PortVisit' || day.type === 'Embarkation' || day.type === 'Disembarkation') 
            && day.location && day.country) {
          const countryName = getKoreanCountryName(day.country) || day.country;
          const location = day.location;
          
          if (day.country === 'US' || day.country === 'CA') {
            const dest = countryName;
            if (!destinations.includes(dest)) {
              destinations.push(dest);
            }
          } else {
            const dest = `${countryName} - ${location}`;
            if (!destinations.includes(dest)) {
              destinations.push(dest);
            }
          }
        }
      });

      const requestBody = {
        productId: selectedProduct.id,
        productCode: selectedProductCode,
        cruiseName,
        startDate: onboardingFormData.startDate,
        endDate: onboardingFormData.endDate,
        companionType: onboardingFormData.companionType,
        destination: destinations,
        itineraryPattern: selectedProduct.itineraryPattern || [],
      };

      const response = await fetch(`/api/admin/users/${selectedCustomerForOnboarding.id}/trips/0/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (data.ok) {
        showSuccess('온보딩이 추가되었습니다. 고객 상태가 활성으로 변경되었습니다.');
        handleCloseOnboardingModal();
        await loadCustomers();
      } else {
        showError('온보딩 추가 실패: ' + (data.error || 'Unknown error'), '온보딩 추가 실패');
      }
    } catch (error) {
      console.error('Failed to create onboarding:', error);
      showError('온보딩 추가 중 오류가 발생했습니다.', '온보딩 추가 실패');
    } finally {
      setIsProcessingOnboarding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">테스트 고객 관리</h1>
          <p className="text-gray-600">72시간 무료체험을 사용 중인 테스트 고객을 조회하고 관리하세요</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          <FiPlus className="w-5 h-5" />
          고객 추가
        </button>
      </div>

      {/* 테스트 고객 상태 확인 가이드 */}
      {showStatusGuide && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 rounded-lg p-6 mb-6 relative">
          <button
            onClick={() => setShowStatusGuide(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-5 h-5" />
          </button>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <FiInfo className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-purple-900 mb-3">테스트 고객 상태 확인 가이드</h3>
              <div className="space-y-3 text-sm text-purple-800">
                <div>
                  <p className="font-semibold mb-2">테스트 고객 상태:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 border border-orange-300 rounded text-xs font-semibold">테스트</span>
                        <span className="text-xs text-gray-600">주황색</span>
                      </div>
                      <p className="text-xs text-gray-700">72시간 무료체험 중인 고객 (비밀번호: 1101)</p>
                      <p className="text-xs text-gray-500 mt-1">• 테스트 시작일부터 72시간 동안 사용 가능</p>
                      <p className="text-xs text-gray-500">• 남은 시간이 표시됩니다</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 border border-gray-300 rounded text-xs font-semibold">테스트잠금</span>
                        <span className="text-xs text-gray-600">회색</span>
                      </div>
                      <p className="text-xs text-gray-700">72시간 테스트 기간이 만료되어 잠금된 고객</p>
                      <p className="text-xs text-gray-500 mt-1">• "만료됨"으로 표시됩니다</p>
                      <p className="text-xs text-gray-500">• 온보딩 추가 시 활성 고객으로 전환 가능</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-purple-200">
                  <p className="font-semibold mb-2">테스트 고객 관리 방법:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li><strong>고객 추가</strong>: "고객 추가" 버튼으로 이름, 연락처 입력 (비밀번호 자동 1101 설정)</li>
                    <li><strong>온보딩 추가</strong>: 상품 구매 후 "온보딩 추가" 버튼으로 여행 정보 입력 시 활성 고객으로 전환</li>
                    <li><strong>비밀번호 수정</strong>: 비밀번호 옆 편집 아이콘(✏️)을 클릭하여 변경</li>
                    <li><strong>고객 삭제</strong>: 체크박스로 선택 후 "선택한 고객 삭제" 버튼 클릭</li>
                    <li><strong>상세 정보</strong>: 고객 이름 클릭 또는 "상세보기" 버튼으로 상세 정보 확인</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 검색 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="이름, 전화번호로 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          {/* 상태 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as typeof status);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">전체</option>
              <option value="test">테스트 중</option>
              <option value="locked">만료/잠금</option>
            </select>
          </div>

          {/* 정렬 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">정렬</label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as typeof sortBy);
                setSortOrder(order as typeof sortOrder);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="createdAt-desc">최신 가입순</option>
              <option value="createdAt-asc">오래된 가입순</option>
              <option value="name-asc">이름순 (가나다)</option>
              <option value="name-desc">이름순 (역순)</option>
              <option value="testModeStartedAt-desc">테스트 시작일 최신순</option>
              <option value="testModeStartedAt-asc">테스트 시작일 오래된순</option>
            </select>
          </div>
        </div>
      </div>

      {/* 고객 테이블 */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">테스트 고객 목록을 불러오는 중...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800 font-semibold">오류: {error}</p>
          <button
            onClick={loadCustomers}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {selectedCustomers.size > 0 && (
            <div className="bg-purple-600 text-white px-6 py-3 flex items-center justify-between">
              <span className="font-medium">
                {selectedCustomers.size}명 선택됨
              </span>
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FiTrash2 size={16} />
                {isDeleting ? '삭제 중...' : '선택한 고객 삭제'}
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-purple-600 to-pink-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = someSelected;
                      }}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                    <button
                      onClick={() => {
                        setSortBy('name');
                        setSortOrder(sortBy === 'name' && sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                      className="flex items-center gap-2"
                    >
                      이름 <SortIcon field="name" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                    전화번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                    비밀번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                    테스트 시작일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                    남은 시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                    여행 수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                    가입일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                      <FiUser className="mx-auto mb-4 text-4xl text-gray-300" />
                      <p className="text-lg font-medium">테스트 고객이 없습니다</p>
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => {
                    const getStatusBadge = () => {
                      // 테스트 고객 상태 딱지 (전체 고객 관리와 동일한 스타일)
                      if (customer.status === 'test-locked' || customer.status === 'locked') {
                        return (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300">
                            테스트잠금
                          </span>
                        );
                      }
                      if (customer.status === 'test') {
                        return (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300">
                            테스트
                          </span>
                        );
                      }
                      return (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300">
                          알 수 없음
                        </span>
                      );
                    };

                    const getRemainingTime = () => {
                      if (customer.status === 'locked') {
                        return <span className="text-red-600 font-semibold">만료됨</span>;
                      }
                      if (customer.testModeRemainingHours !== null) {
                        const hours = customer.testModeRemainingHours;
                        if (hours <= 0) {
                          return <span className="text-red-600 font-semibold">만료됨</span>;
                        }
                        const days = Math.floor(hours / 24);
                        const remainingHours = hours % 24;
                        if (days > 0) {
                          return <span className="text-purple-600 font-semibold">{days}일 {remainingHours}시간</span>;
                        }
                        return <span className={`font-semibold ${hours <= 12 ? 'text-orange-600' : 'text-purple-600'}`}>{hours}시간</span>;
                      }
                      return <span className="text-gray-500">-</span>;
                    };

                    return (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedCustomers.has(customer.id)}
                            onChange={(e) => handleSelectCustomer(customer.id, e.target.checked)}
                            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FiUser className="text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">{customer.name || '이름 없음'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {customer.phone || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                              {customer.currentPassword || '-'}
                            </span>
                            <button
                              onClick={() => handleResetPassword(customer.id, customer.currentPassword || null)}
                              disabled={resettingPassword === customer.id}
                              className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="비밀번호 수정"
                            >
                              <FiEdit2 size={16} />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {customer.testModeStartedAt
                            ? new Date(customer.testModeStartedAt).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {getRemainingTime()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {customer.tripCount || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(customer.createdAt).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => router.push(`/admin/users/${customer.id}`)}
                              className="text-purple-600 hover:text-purple-800 font-semibold hover:underline"
                            >
                              상세보기
                            </button>
                            <button
                              onClick={() => handleReactivate(customer.id, customer.name)}
                              disabled={reactivatingCustomer === customer.id}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              title="72시간 테스트 기간 연장"
                            >
                              <FiRefreshCw size={14} className={reactivatingCustomer === customer.id ? 'animate-spin' : ''} />
                              재활성
                            </button>
                            <button
                              onClick={() => handleOpenOnboardingModal(customer)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                              title="온보딩 추가"
                            >
                              <FiPlus size={14} />
                              온보딩 추가
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {pagination.totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                총 <span className="font-semibold">{pagination.total}</span>명 중{' '}
                <span className="font-semibold">
                  {(pagination.page - 1) * pagination.limit + 1}-
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>
                명 표시
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiChevronLeft />
                </button>
                <span className="px-4 py-2 text-sm font-semibold text-gray-700">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 온보딩 추가 모달 */}
      {onboardingModalOpen && selectedCustomerForOnboarding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                온보딩 추가하기 - {selectedCustomerForOnboarding.name || '고객'}
              </h2>
              <button
                onClick={handleCloseOnboardingModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* 상품 코드 선택 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  상품 코드 선택 (연관검색)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    placeholder="상품명, 크루즈명, 상품코드로 검색..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>
                
                {/* 상품 목록 드롭다운 */}
                {productOptions.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                    {productOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleProductSelect(option.value)}
                        className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${
                          selectedProductCode === option.value ? 'bg-blue-100 border-l-4 border-blue-600' : ''
                        }`}
                      >
                        <div className="font-semibold text-gray-900">{option.label}</div>
                        {option.product.nights && option.product.days && (
                          <div className="text-sm text-gray-600">
                            {option.product.nights}박 {option.product.days}일
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 선택된 상품 정보 표시 */}
              {selectedProduct && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">✅ 선택된 상품 정보</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start justify-between">
                      <span className="font-medium text-gray-700">크루즈:</span>
                      <span className="text-gray-900 text-right">{selectedProduct.cruiseLine} {selectedProduct.shipName}</span>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="font-medium text-gray-700">패키지:</span>
                      <span className="text-gray-900 text-right">{selectedProduct.packageName}</span>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="font-medium text-gray-700">기간:</span>
                      <span className="text-gray-900 font-semibold">{selectedProduct.nights}박 {selectedProduct.days}일</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 동반자 선택 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">동반자</label>
                <div className="flex gap-2">
                  {(['친구', '커플', '가족', '혼자'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setOnboardingFormData(prev => ({ ...prev, companionType: type }))}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        onboardingFormData.companionType === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* 여행 기간 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">출발일</label>
                  <input
                    type="date"
                    value={onboardingFormData.startDate}
                    onChange={(e) => setOnboardingFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">도착일</label>
                  <input
                    type="date"
                    value={onboardingFormData.endDate}
                    onChange={(e) => setOnboardingFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateOnboarding}
                  disabled={isProcessingOnboarding || !selectedProduct}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingOnboarding ? '처리 중...' : '온보딩 추가하기'}
                </button>
                <button
                  onClick={handleCloseOnboardingModal}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 테스트 고객 추가 모달 */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">테스트 고객 추가</h2>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setCreateFormData({ name: '', phone: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  placeholder="이름을 입력하세요"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연락처 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createFormData.phone}
                  onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                  placeholder="연락처를 입력하세요"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="mt-1 text-xs text-gray-500">비밀번호는 자동으로 1101로 설정되며, 72시간 테스트 기간이 시작됩니다.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateTestCustomer}
                  disabled={isCreating || !createFormData.name || !createFormData.phone}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? '추가 중...' : '추가'}
                </button>
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setCreateFormData({ name: '', phone: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

