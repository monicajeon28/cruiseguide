'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiAlertCircle, FiUsers, FiTrendingUp, FiClock, FiRefreshCw, FiArrowRight } from 'react-icons/fi';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DashboardData {
  users: {
    total: number;
    active: number;
    hibernated: number;
    genieUsers?: number;
    mallUsers?: number;
  };
  trips: {
    total: number;
    upcoming: number;
    inProgress: number;
    completed: number;
  };
  currentTrips: Array<{
    id: number;
    cruiseName: string;
    userName: string;
    userPhone: string;
    startDate: string;
    endDate: string;
    destination: string[];
  }>;
  satisfaction: {
    average: number;
    count: number;
    recentFeedback: Array<{
      id: number;
      tripId: number;
      cruiseName: string;
      score: number;
      comments: string | null;
      createdAt: string;
    }>;
  };
  notifications: {
    total: number;
    byType: Array<{ type: string; count: number }>;
  };
  pushSubscriptions: number;
  products: number;
  trends: Array<{
    date: string;
    users: number;
    trips: number;
  }>;
  productViews?: {
    topCruises: Array<{ name: string; count: number }>;
    topCountries: Array<{ name: string; count: number }>;
  };
}

interface RecentCustomer {
  id: number;
  name: string;
  phone: string;
  createdAt: string;
  status: 'active' | 'package' | 'dormant' | 'locked';  // ✅ 상태 추가
}

interface RecentTrip {
  id: number;
  cruiseName: string;
  destination: string[];
  startDate: string;
  userName: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [recentCustomers, setRecentCustomers] = useState<RecentCustomer[]>([]);
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
    // 5분마다 자동 갱신
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      
      // 대시보드 데이터 로드
      const dashboardResponse = await fetch('/api/admin/dashboard', {
        credentials: 'include',
      });

      if (!dashboardResponse.ok) {
        if (dashboardResponse.status === 401 || dashboardResponse.status === 403) {
          throw new Error('인증이 필요합니다. 다시 로그인해 주세요.');
        }
        throw new Error('대시보드 데이터를 불러올 수 없습니다.');
      }

      const dashboardResult = await dashboardResponse.json();
      if (!dashboardResult.ok) {
        throw new Error(dashboardResult.error || '데이터를 불러오는 중 오류가 발생했습니다.');
      }

      setDashboardData(dashboardResult.dashboard);

      // 최근 고객 로드
      try {
        const customersResponse = await fetch('/api/admin/users/recent', {
          credentials: 'include',
        });
        if (customersResponse.ok) {
          const customersData = await customersResponse.json();
          if (customersData.ok && customersData.customers) {
            setRecentCustomers(customersData.customers);
          }
        }
      } catch (err) {
        console.warn('최근 고객 로드 실패:', err);
      }

      // 최근 여행 로드
      try {
        const tripsResponse = await fetch('/api/admin/trips/recent', {
          credentials: 'include',
        });
        if (tripsResponse.ok) {
          const tripsData = await tripsResponse.json();
          if (tripsData.ok && tripsData.trips) {
            setRecentTrips(tripsData.trips);
          }
        }
      } catch (err) {
        console.warn('최근 여행 로드 실패:', err);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError(error instanceof Error ? error.message : '대시보드 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // 통계 카드 데이터
  const statCards = dashboardData ? [
    {
      title: '총 고객 수',
      value: dashboardData.users.total,
      icon: '👥',
      color: 'bg-blue-500',
      subtitle: `지니AI: ${dashboardData.users.genieUsers || 0} | 크루즈몰: ${dashboardData.users.mallUsers || 0} | 활성: ${dashboardData.users.active} | 동면: ${dashboardData.users.hibernated}`,
      source: 'all', // 전체 출처
      sourceLabel: '전체',
    },
    {
      title: '전체 여행 수',
      value: dashboardData.trips.total,
      icon: '🚢',
      color: 'bg-green-500',
      subtitle: `진행중: ${dashboardData.trips.inProgress} | 예정: ${dashboardData.trips.upcoming}`,
      source: 'genie', // 지니AI 가이드 출처
      sourceLabel: '지니AI 가이드',
    },
    {
      title: '만족도 평균',
      value: dashboardData.satisfaction.average > 0 
        ? `${dashboardData.satisfaction.average.toFixed(1)}점` 
        : 'N/A',
      icon: '⭐',
      color: 'bg-yellow-500',
      subtitle: `크루즈몰 후기 ${dashboardData.satisfaction.count}개`,
      source: 'mall', // 크루즈몰 출처
      sourceLabel: '크루즈몰',
    },
    {
      title: '크루즈몰 가입 인원',
      value: dashboardData.pushSubscriptions,
      icon: '🔔',
      color: 'bg-purple-500',
      subtitle: `크루즈몰 회원 수`,
      source: 'mall', // 크루즈몰 출처
      sourceLabel: '크루즈몰',
    },
  ] : [];

  // 알림/경고 항목 계산
  const alerts = dashboardData ? [
    ...(dashboardData.trips.inProgress > 0 
      ? [{
          type: 'info' as const,
          message: `현재 ${dashboardData.trips.inProgress}개의 여행이 진행 중입니다.`,
          icon: '🚢',
          action: () => router.push('/admin/customers'),
        }]
      : []),
    ...(dashboardData.satisfaction.count > 0 && dashboardData.satisfaction.average < 3.5
      ? [{
          type: 'warning' as const,
          message: `크루즈몰 평균 만족도가 낮습니다 (${dashboardData.satisfaction.average.toFixed(1)}점)`,
          icon: '⚠️',
          action: () => router.push('/admin/feedback'),
        }]
      : []),
    ...(dashboardData.users.hibernated > 0
      ? [{
          type: 'info' as const,
          message: `${dashboardData.users.hibernated}명의 동면 사용자가 있습니다.`,
          icon: '😴',
          action: () => router.push('/admin/customers'),
        }]
      : []),
  ] : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red mx-auto"></div>
          <p className="mt-4 text-gray-600">대시보드 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <FiAlertCircle className="text-red-600 text-xl mt-1 mr-3" />
          <div className="flex-1">
            <h3 className="text-red-800 font-semibold mb-2">오류 발생</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => loadDashboardData()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const visibleRecentCustomers = recentCustomers.filter((customer) => {
    const name = (customer.name || '').trim();
    const phone = (customer.phone || '').trim();

    const nameLooksDeleted =
      name.length === 0 ||
      name === '-' ||
      name.toLowerCase() === 'deleted user' ||
      name.toLowerCase() === 'removed user' ||
      name.toLowerCase().includes('삭제');
    const phoneLooksDeleted =
      phone.length === 0 || phone === '-' || phone === '000-0000-0000';

    return !(nameLooksDeleted && phoneLooksDeleted);
  });

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2 flex items-center gap-3">
            <span className="text-5xl">📊</span>
            대시보드
          </h1>
          <p className="text-lg text-gray-600 font-medium">크루즈 가이드 관리 현황을 확인하세요</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-semibold text-gray-600 bg-gray-100 px-4 py-2 rounded-lg flex items-center gap-2">
            <FiClock className="w-4 h-4" />
            마지막 갱신: {lastUpdated.toLocaleTimeString('ko-KR')}
          </div>
          <button
            onClick={() => loadDashboardData()}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-sm font-bold transition-all shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? '갱신 중...' : '갱신'}
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-semibold text-gray-600">{card.title}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    card.source === 'mall' 
                      ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                      : card.source === 'all'
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                      : 'bg-blue-100 text-blue-700 border border-blue-300'
                  }`}>
                    {card.sourceLabel}
                  </span>
                </div>
                <p className="text-4xl font-extrabold text-gray-900 mb-2">{card.value}</p>
                {card.subtitle && (
                  <p className="text-xs font-medium text-gray-500 leading-relaxed">{card.subtitle}</p>
                )}
              </div>
              <div className={`${card.color} rounded-xl p-4 shadow-md`}>
                <span className="text-3xl text-white">{card.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 알림/경고 (진행 중인 여행 알림 제외) */}
      {alerts.filter(alert => !alert.message.includes('여행이 진행 중')).length > 0 && (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <FiAlertCircle className="text-orange-500 text-2xl" />
            알림 및 경고
          </h2>
          <div className="space-y-4">
            {alerts.filter(alert => !alert.message.includes('여행이 진행 중')).map((alert, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-5 rounded-xl border-2 shadow-sm hover:shadow-md transition-all ${
                  alert.type === 'warning' 
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300' 
                    : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{alert.icon}</span>
                  <p className={`font-bold text-lg ${
                    alert.type === 'warning' ? 'text-yellow-900' : 'text-blue-900'
                  }`}>
                    {alert.message}
                  </p>
                </div>
                <button
                  onClick={alert.action}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 shadow-md ${
                    alert.type === 'warning'
                      ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white'
                  }`}
                >
                  확인
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 진행 중인 여행 (알림 메시지 포함) */}
      {dashboardData.currentTrips.length > 0 && (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-3xl">🚢</span>
                진행 중인 여행
              </h2>
              <span className="text-xs font-bold px-3 py-1 rounded bg-blue-100 text-blue-700 border border-blue-300">
                지니AI 가이드
              </span>
            </div>
            <button
              onClick={() => router.push('/admin/customers')}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm font-bold rounded-lg shadow-md hover:scale-105 transition-all flex items-center gap-2"
            >
              전체 보기 <FiArrowRight className="w-4 h-4" />
            </button>
          </div>
          {/* 진행 중인 여행 알림 메시지 */}
          {dashboardData.trips.inProgress > 0 && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚢</span>
                <p className="font-bold text-lg text-blue-900">
                  현재 {dashboardData.trips.inProgress}개의 여행이 진행 중입니다.
                </p>
              </div>
            </div>
          )}
          <div className="space-y-4">
            {dashboardData.currentTrips.slice(0, 5).map((trip) => (
              <div
                key={trip.id}
                className="flex items-center justify-between p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => router.push(`/admin/customers/${trip.userName}`)}
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{trip.cruiseName}</p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span>{trip.userName} ({trip.userPhone})</span>
                    <span>•</span>
                    <span>{Array.isArray(trip.destination) ? trip.destination.join(', ') : trip.destination}</span>
                    <span>•</span>
                    <span>
                      {new Date(trip.startDate).toLocaleDateString('ko-KR')} - {new Date(trip.endDate).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 트렌드 차트 */}
      {dashboardData.trends && dashboardData.trends.length > 0 && (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FiTrendingUp className="text-blue-500 text-2xl" />
              최근 7일 트렌드
            </h2>
            <span className="text-xs font-bold px-3 py-1 rounded bg-blue-100 text-blue-700 border border-blue-300">
              지니AI 가이드
            </span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData.trends.map(t => ({
              ...t,
              date: new Date(t.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="users" 
                stroke="#0088FE" 
                strokeWidth={3}
                name="신규 사용자"
                dot={{ fill: '#0088FE', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="trips" 
                stroke="#00C49F" 
                strokeWidth={3}
                name="신규 여행"
                dot={{ fill: '#00C49F', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 상품 조회 통계 차트 */}
      {dashboardData.productViews && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 인기 크루즈 조회 차트 */}
          {dashboardData.productViews.topCruises.length > 0 && (
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-3xl">🚢</span>
                  인기 크루즈 조회
                </h2>
                <span className="text-xs font-bold px-3 py-1 rounded bg-purple-100 text-purple-700 border border-purple-300">
                  크루즈몰
                </span>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart 
                  data={dashboardData.productViews.topCruises}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={90}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    fill="#0088FE" 
                    name="조회 수"
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 인기 국가 조회 차트 */}
          {dashboardData.productViews.topCountries.length > 0 && (
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-3xl">🌍</span>
                  인기 국가 조회
                </h2>
                <span className="text-xs font-bold px-3 py-1 rounded bg-purple-100 text-purple-700 border border-purple-300">
                  크루즈몰
                </span>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart 
                  data={dashboardData.productViews.topCountries}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={70}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    fill="#00C49F" 
                    name="조회 수"
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* 최근 활동 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 가입 고객 */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-3xl">👥</span>
                최근 가입 고객
              </h2>
              <span className="text-xs font-bold px-3 py-1 rounded bg-blue-100 text-blue-700 border border-blue-300">
                지니AI 가이드
              </span>
            </div>
            <button
              onClick={() => router.push('/admin/customers')}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm font-bold rounded-lg shadow-md hover:scale-105 transition-all flex items-center gap-2"
            >
              전체 보기 <FiArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {visibleRecentCustomers.length > 0 ? (
              visibleRecentCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => router.push(`/admin/customers/${customer.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">👤</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900">{customer.name || '이름 없음'}</p>
                        {/* 상태 표시 */}
                        {customer.status === 'locked' && (
                          <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-medium">잠금</span>
                        )}
                        {customer.status === 'dormant' && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-medium">동면</span>
                        )}
                        {customer.status === 'active' && (
                          <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium">활성</span>
                        )}
                        {customer.status === 'package' && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">패키지</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{customer.phone}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                    {new Date(customer.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <p className="text-gray-500">최근 가입 고객이 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* 최근 여행 등록 */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-3xl">✈️</span>
                최근 여행 등록
              </h2>
              <span className="text-xs font-bold px-3 py-1 rounded bg-blue-100 text-blue-700 border border-blue-300">
                지니AI 가이드
              </span>
            </div>
            <button
              onClick={() => router.push('/admin/customers')}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold rounded-lg shadow-md hover:scale-105 transition-all flex items-center gap-2"
            >
              전체 보기 <FiArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recentTrips.length > 0 ? (
              recentTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => router.push(`/admin/customers`)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">🚢</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{trip.cruiseName}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <span>{trip.userName}</span>
                        <span>•</span>
                        <span>{Array.isArray(trip.destination) ? trip.destination.join(', ') : trip.destination}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                    {new Date(trip.startDate).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <p className="text-gray-500">최근 여행 등록이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 최근 피드백 */}
      {dashboardData.satisfaction.recentFeedback.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">최근 피드백</h2>
            <button
              onClick={() => router.push('/admin/feedback')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              전체 보기 <FiArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {dashboardData.satisfaction.recentFeedback.map((feedback) => (
              <div
                key={feedback.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-yellow-600">{'⭐'.repeat(Math.round(feedback.score))}</span>
                    <span className="text-sm text-gray-600">{feedback.cruiseName}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(feedback.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                {feedback.comments && (
                  <p className="text-sm text-gray-700 mt-2 line-clamp-2">{feedback.comments}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 빠른 액션 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">빠른 액션</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/admin/customers')}
            className="bg-brand-red hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <FiUsers className="w-5 h-5" />
            고객 관리
          </button>
          <button
            onClick={() => router.push('/admin/feedback')}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <FiTrendingUp className="w-5 h-5" />
            후기 관리
          </button>
          <button
            onClick={() => router.push('/admin/messages')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <FiAlertCircle className="w-5 h-5" />
            메시지 발송
          </button>
        </div>
      </div>
    </div>
  );
}