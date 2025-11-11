'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiSearch, FiFilter, FiArrowUp, FiArrowDown, FiChevronLeft, FiChevronRight, FiUser, FiEdit2 } from 'react-icons/fi';

interface CruiseGuideCustomer {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  lastActiveAt: string | null;
  tripCount: number;
  totalTripCount: number;
  isLocked: boolean;
  customerStatus: string | null;
  status?: 'active' | 'package' | 'locked' | null;
  currentTripEndDate: string | null;
  currentPassword?: string | null;
  daysRemaining?: number | null;
  trips: {
    id: number;
    cruiseName: string | null;
    companionType: string | null;
    destination: any;
    startDate: string | null;
    endDate: string | null;
  }[];
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function CruiseGuideCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CruiseGuideCustomer[]>([]);
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
  const [status, setStatus] = useState<'all' | 'active' | 'locked'>('all');
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

      const response = await fetch(`/api/admin/cruise-guide-users?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
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

      // API에서 이미 daysRemaining을 계산하여 반환하므로 그대로 사용
      setCustomers(data.users || []);
      setPagination({
        total: data.total || (data.users || []).length,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil((data.total || (data.users || []).length) / pagination.limit),
      });
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

  const renderStatusBadge = (customer: CruiseGuideCustomer) => {
    if (customer.status === 'active' || customer.status === 'package') {
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 border border-blue-300 rounded text-xs font-medium">활성</span>;
    } else if (customer.status === 'locked' || customer.isLocked) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 border border-red-300 rounded text-xs font-medium">가이드잠금</span>;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">크루즈가이드 고객</h1>
          <p className="text-gray-600">크루즈가이드 지니를 이용하는 모든 고객을 조회하고 관리하세요</p>
        </div>
      </div>

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
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-brand-red text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">ID</th>
                    <th className="px-6 py-4 text-left font-semibold">이름</th>
                    <th className="px-6 py-4 text-left font-semibold">핸드폰</th>
                    <th className="px-6 py-4 text-left font-semibold">비밀번호</th>
                    <th className="px-6 py-4 text-left font-semibold">가입일</th>
                    <th className="px-6 py-4 text-left font-semibold">상태</th>
                    <th className="px-6 py-4 text-left font-semibold">여행 횟수</th>
                    <th className="px-6 py-4 text-left font-semibold">여행 종료일</th>
                    <th className="px-6 py-4 text-left font-semibold">남은 일수</th>
                    <th className="px-6 py-4 text-left font-semibold">최근 여행</th>
                    <th className="px-6 py-4 text-left font-semibold">관리</th>
                  </tr>
                </thead>
                <tbody className="text-gray-800">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">{customer.id}</td>
                      <td className="px-6 py-4 font-medium">{customer.name || '-'}</td>
                      <td className="px-6 py-4">{customer.phone || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {customer.currentPassword || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {new Date(customer.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4">
                        {renderStatusBadge(customer)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-yellow-100 text-gray-800 px-3 py-1 rounded-full text-sm font-bold">
                          {customer.tripCount || 0}회
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {customer.currentTripEndDate ? (
                          <span className="text-sm">
                            {new Date(customer.currentTripEndDate).toLocaleDateString('ko-KR')}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {customer.daysRemaining !== null && customer.daysRemaining !== undefined ? (
                          <span className={`text-sm font-semibold ${
                            customer.daysRemaining <= 0 
                              ? 'text-red-600' 
                              : customer.daysRemaining <= 7 
                              ? 'text-orange-600' 
                              : 'text-gray-600'
                          }`}>
                            {customer.daysRemaining > 0 
                              ? `D-${customer.daysRemaining}` 
                              : customer.daysRemaining === 0 
                              ? 'D-Day' 
                              : `종료됨 (${Math.abs(customer.daysRemaining)}일 전)`}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {customer.trips && customer.trips.length > 0 ? (
                          <div className="text-sm">
                            <div className="font-medium">{customer.trips[0].cruiseName || '-'}</div>
                            <div className="text-gray-400">
                              {Array.isArray(customer.trips[0].destination)
                                ? customer.trips[0].destination.join(', ')
                                : customer.trips[0].destination || '-'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">여행 없음</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`/admin/users/${customer.id}`}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          상세 보기
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
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
    </div>
  );
}

