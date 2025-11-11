'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FiSearch, FiFilter, FiArrowUp, FiArrowDown, FiChevronLeft, FiChevronRight, FiUser, FiPlus, FiX, FiInfo } from 'react-icons/fi';
import CustomerTable from '@/components/admin/CustomerTable';

type AffiliateOwnershipSource = 'self-profile' | 'lead-agent' | 'lead-manager' | 'fallback';

type AffiliateOwnership = {
  ownerType: 'HQ' | 'BRANCH_MANAGER' | 'SALES_AGENT';
  ownerProfileId: number | null;
  ownerName: string | null;
  ownerNickname: string | null;
  ownerAffiliateCode: string | null;
  ownerBranchLabel: string | null;
  ownerStatus: string | null;
  source: AffiliateOwnershipSource;
  managerProfile: {
    id: number;
    displayName: string | null;
    nickname: string | null;
    affiliateCode: string | null;
    branchLabel: string | null;
    status: string | null;
  } | null;
  leadId?: number | null;
  leadStatus?: string | null;
  leadCreatedAt?: string | null;
  normalizedPhone?: string | null;
};

interface Customer {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  lastActiveAt: string | null;
  tripCount: number;
  totalTripCount: number;
  isHibernated: boolean;
  isLocked: boolean;
  customerStatus: string | null;
  status?: 'active' | 'package' | 'dormant' | 'locked' | 'test' | 'test-locked' | null; // 지니 상태
  customerType?: 'cruise-guide' | 'mall' | 'test' | 'prospect'; // 고객 분류
  isMallUser?: boolean; // 크루즈몰 고객 여부
  mallUserId?: string | null; // 크루즈몰 사용자 ID
  mallNickname?: string | null; // 크루즈몰 닉네임
  kakaoChannelAdded?: boolean; // 카카오 채널 추가 여부
  kakaoChannelAddedAt?: string | null; // 카카오 채널 추가 일시
  currentTripEndDate: string | null;
  trips: Array<{
    id: number;
    cruiseName: string | null;
    companionType: string | null;
    destination: any;
    startDate: string | null;
    endDate: string | null;
  }>;
  affiliateOwnership?: AffiliateOwnership | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    phone: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [showStatusGuide, setShowStatusGuide] = useState(true);

  // 필터 및 검색 상태
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'hibernated' | 'locked'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'tripCount' | 'lastActiveAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 검색어 debounce
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadCustomers();
  }, [search, status, sortBy, sortOrder, pagination.page]);

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

      const response = await fetch(`/api/admin/customers?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store', // 캐시 방지로 최신 데이터 가져오기
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('인증이 필요합니다. 다시 로그인해 주세요.');
        }
        throw new Error('고객 목록을 불러올 수 없습니다.');
      }

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || '고객 목록을 불러오는 중 오류가 발생했습니다.');
      }

      setCustomers(data.customers || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error('Failed to load customers:', error);
      setError(error instanceof Error ? error.message : '고객 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const SortIcon = ({ field }: { field: typeof sortBy }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <FiArrowUp className="w-4 h-4" /> : <FiArrowDown className="w-4 h-4" />;
  };

  const handleCreateGenieCustomer = async () => {
    if (!createFormData.name || !createFormData.phone) {
      alert('이름과 연락처를 모두 입력해주세요.');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/customers/create-genie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(createFormData),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || '고객 추가에 실패했습니다.');
      }

      alert('지니가이드 고객이 추가되었습니다.');
      setIsCreateModalOpen(false);
      setCreateFormData({ name: '', phone: '' });
      await loadCustomers();
    } catch (error) {
      console.error('Failed to create genie customer:', error);
      alert(error instanceof Error ? error.message : '고객 추가 중 오류가 발생했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">전체 고객 관리</h1>
          <p className="text-gray-600">모든 고객을 조회하고 관리하세요</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <FiPlus className="w-5 h-5" />
          고객 추가
        </button>
      </div>

      {/* 고객 상태 확인 가이드 */}
      {showStatusGuide && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-6 mb-6 relative">
          <button
            onClick={() => setShowStatusGuide(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-5 h-5" />
          </button>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <FiInfo className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-blue-900 mb-3">고객 상태 확인 가이드</h3>
              <div className="space-y-3 text-sm text-blue-800">
                <div>
                  <p className="font-semibold mb-2">고객 상태 딱지 의미:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 border border-blue-300 rounded text-xs font-semibold">활성</span>
                        <span className="text-xs text-gray-600">파란색</span>
                      </div>
                      <p className="text-xs text-gray-700">크루즈 가이드 지니를 사용 중인 활성 고객</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 bg-red-100 text-red-800 border border-red-300 rounded text-xs font-semibold">가이드잠금</span>
                        <span className="text-xs text-gray-600">빨간색</span>
                      </div>
                      <p className="text-xs text-gray-700">크루즈가이드 계정이 잠금 처리된 고객</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 bg-green-100 text-green-800 border border-green-300 rounded text-xs font-semibold">크루즈몰</span>
                        <span className="text-xs text-gray-600">초록색</span>
                      </div>
                      <p className="text-xs text-gray-700">크루즈몰에 가입한 고객 (지니 사용 시 크루즈몰+활성 표시)</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded text-xs font-semibold">동면</span>
                        <span className="text-xs text-gray-600">노란색</span>
                      </div>
                      <p className="text-xs text-gray-700">장기간 미사용으로 동면 상태인 고객 (현재 사용 안 함)</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 border border-orange-300 rounded text-xs font-semibold">테스트</span>
                        <span className="text-xs text-gray-600">주황색</span>
                      </div>
                      <p className="text-xs text-gray-700">72시간 무료체험 중인 테스트 고객</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 border border-gray-300 rounded text-xs font-semibold">테스트잠금</span>
                        <span className="text-xs text-gray-600">회색</span>
                      </div>
                      <p className="text-xs text-gray-700">테스트 기간이 만료되어 잠금된 고객</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded text-xs font-semibold">잠재고객</span>
                        <span className="text-xs text-gray-600">노란색</span>
                      </div>
                      <p className="text-xs text-gray-700">엑셀로 등록된 잠재 고객</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="font-semibold mb-2">고객 상세 정보 확인 방법:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>고객 목록에서 고객 이름을 클릭하거나 "상세보기" 버튼을 클릭하세요</li>
                    <li>고객의 여행 정보, 활동 내역, 상태 변경 이력을 확인할 수 있습니다</li>
                    <li>비밀번호 수정, 여행 배정, 온보딩 추가 등의 작업을 수행할 수 있습니다</li>
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
                placeholder="이름, 전화번호, 이메일로 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">전체</option>
              <option value="active">활성</option>
              <option value="locked">가이드잠금</option>
            </select>
          </div>

          {/* 정렬 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">정렬</label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                setSortBy(field);
                setSortOrder(order);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="createdAt-desc">최신 가입순</option>
              <option value="createdAt-asc">오래된 가입순</option>
              <option value="name-asc">이름순 (가나다)</option>
              <option value="name-desc">이름순 (역순)</option>
              <option value="tripCount-desc">여행 횟수 많은순</option>
              <option value="tripCount-asc">여행 횟수 적은순</option>
              <option value="lastActiveAt-desc">최근 접속순</option>
              <option value="lastActiveAt-asc">오래된 접속순</option>
            </select>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* 고객 테이블 */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
        </div>
      ) : (
        <>
          <CustomerTable customers={customers} onRefresh={loadCustomers} />
          
          {/* 페이지네이션 */}
          {pagination.totalPages > 1 && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  총 {pagination.total}명 중 {((pagination.page - 1) * pagination.limit) + 1}-
                  {Math.min(pagination.page * pagination.limit, pagination.total)}명 표시
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            pagination.page === pageNum
                              ? 'bg-brand-red text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 지니가이드 고객 추가 모달 */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">지니가이드 고객 추가</h2>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">비밀번호는 자동으로 3800으로 설정됩니다.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateGenieCustomer}
                  disabled={isCreating || !createFormData.name || !createFormData.phone}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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