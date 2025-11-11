'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { FiSearch, FiX, FiCheckCircle } from 'react-icons/fi';

interface MarketingInsight {
  id: number;
  userId: number;
  insightType: string;
  data: any;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    name: string | null;
    phone: string | null;
    mallUserId?: string | null;
    mallNickname?: string | null;
    genieStatus?: string | null;
    genieLinkedAt?: string | null;
    mallUser?: {
      id: number;
      name: string | null;
      phone: string | null;
    } | null;
  };
}

const INSIGHT_TYPE_NAMES: Record<string, string> = {
  destination_preference: '목적지 선호도',
  spending_pattern: '지출 패턴',
  feature_usage: '기능 사용 패턴',
  re_purchase_score: '재구매 점수',
  engagement_score: '고객 참여도',
  satisfaction_score: '고객 만족도',
  lifecycle_stage: '고객 라이프사이클',
  cruise_preference: '선호 크루즈 분석',
  communication_preference: '소통 선호도',
};

const FEATURE_NAMES: Record<string, string> = {
  ai_chat: 'AI 채팅',
  checklist: '체크리스트',
  wallet: '가계부',
  map: '지도',
  translator: '번역기',
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface Customer {
  id: number;
  name: string | null;
  phone: string | null;
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<MarketingInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  
  // 고객 검색 관련 상태
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [customerSearchDropdownOpen, setCustomerSearchDropdownOpen] = useState(false);
  const customerSearchDropdownRef = useRef<HTMLDivElement>(null);

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      // selectedUserId가 null이 아닐 때만 추가
      if (selectedUserId !== null && selectedUserId !== undefined) {
        params.append('userId', selectedUserId.toString());
      }
      if (selectedType) {
        params.append('type', selectedType);
      }

      const url = `/api/admin/insights?${params.toString()}`;
      console.log('[Insights Page] Loading insights from:', url);
      console.log('[Insights Page] Current filters:', { selectedUserId, selectedType });
      
      const response = await fetch(url, {
        credentials: 'include',
      });

      console.log('[Insights Page] Response status:', response.status);

      if (!response.ok) {
        let errorMessage = '인사이트를 불러올 수 없습니다.';
        if (response.status === 401) {
          errorMessage = '인증이 필요합니다. 다시 로그인해 주세요.';
        } else if (response.status === 403) {
          errorMessage = '접근 권한이 없습니다.';
        } else if (response.status >= 500) {
          errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('[Insights Page] API Response:', data);
      
      if (data.ok) {
        console.log('[Insights Page] Insights count:', data.insights?.length || 0);
        setInsights(data.insights || []);
        setError(null);
      } else {
        throw new Error(data.error || '인사이트를 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('[Insights Page] Error loading insights:', error);
      setError(error instanceof Error ? error.message : '인사이트를 불러오는 중 오류가 발생했습니다.');
      setInsights([]);
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, selectedType]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  // 고객 검색 (디바운싱)
  useEffect(() => {
    if (!customerSearchTerm.trim()) {
      setCustomerSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setCustomerSearchLoading(true);
      try {
        const response = await fetch(`/api/admin/customers/search?q=${encodeURIComponent(customerSearchTerm)}`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.ok) {
            setCustomerSearchResults(data.customers || []);
          }
        }
      } catch (error) {
        console.error('Customer search error:', error);
      } finally {
        setCustomerSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [customerSearchTerm]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        customerSearchDropdownRef.current &&
        !customerSearchDropdownRef.current.contains(event.target as Node)
      ) {
        setCustomerSearchDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedUserId(customer.id);
    setCustomerSearchTerm(`${customer.name || ''} (${customer.phone || ''})`);
    setCustomerSearchDropdownOpen(false);
    setCustomerSearchResults([]);
  };

  const handleClearCustomer = () => {
    setSelectedUserId(null);
    setCustomerSearchTerm('');
    setCustomerSearchResults([]);
  };

  const handleGenerate = useCallback(async (userId?: number) => {
    setGenerating(true);
    try {
      console.log('[Insights Page] Generating insights for:', userId || 'all users');
      
      const response = await fetch('/api/admin/insights/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: userId || null,
          all: !userId,
        }),
      });
      
      console.log('[Insights Page] Generate response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Insights Page] API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('[Insights Page] Generate response data:', data);
      console.log('[Insights Page] Generate response details:', JSON.stringify(data, null, 2));
      
      if (data.ok) {
        alert(data.message || '인사이트 생성 완료');
        
        // 특정 사용자 생성인 경우 해당 사용자 필터로 전환하고 로드
        if (userId) {
          setSelectedUserId(userId);
          // 필터 설정 후 인사이트 로드
          setTimeout(async () => {
            console.log('[Insights Page] Reloading insights for user:', userId);
            try {
              const reloadResponse = await fetch(`/api/admin/insights?userId=${userId}`, {
                credentials: 'include',
              });
              const reloadData = await reloadResponse.json();
              console.log('[Insights Page] Reload response:', reloadData);
              if (reloadData.ok) {
                console.log('[Insights Page] Reloaded insights count:', reloadData.insights?.length || 0);
                setInsights(reloadData.insights || []);
              }
            } catch (reloadError) {
              console.error('[Insights Page] Reload error:', reloadError);
              loadInsights();
            }
          }, 500);
        } else {
          // 전체 생성인 경우 필터 없이 직접 로드
          setSelectedUserId(null);
          setCustomerSearchTerm('');
          setCustomerSearchResults([]);
          setSelectedType('');
          
          setTimeout(async () => {
            console.log('[Insights Page] Reloading insights after generation (no filters)...');
            try {
              const reloadResponse = await fetch('/api/admin/insights', {
                credentials: 'include',
              });
              const reloadData = await reloadResponse.json();
              console.log('[Insights Page] Reload response:', reloadData);
              if (reloadData.ok) {
                console.log('[Insights Page] Reloaded insights count:', reloadData.insights?.length || 0);
                setInsights(reloadData.insights || []);
              }
            } catch (reloadError) {
              console.error('[Insights Page] Reload error:', reloadError);
              loadInsights();
            }
          }, 500);
        }
      } else {
        const errorMsg = data.error || 'Unknown error';
        const details = data.details ? `\n\n상세: ${data.details}` : '';
        alert('인사이트 생성 실패: ' + errorMsg + details);
        console.error('[Insights Page] Generation failed:', data);
      }
    } catch (error) {
      console.error('[Insights Page] Error generating insights:', error);
      alert('인사이트 생성 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setGenerating(false);
    }
  }, [loadInsights]);

  const renderInsightData = (insight: MarketingInsight): React.ReactNode => {
    const { insightType, data } = insight;

    switch (insightType) {
      case 'destination_preference':
        const topDestinations = data?.topDestinations || [];
        
        return (
          <div className="space-y-4">
            {topDestinations.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-3">Top 목적지 (방문 횟수)</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topDestinations.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#0088FE" name="방문 횟수" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {topDestinations.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-3">목적지 비율</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={topDestinations.slice(0, 5)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="percentage"
                    >
                      {topDestinations.slice(0, 5).map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <p className="font-semibold">선호 패턴:</p>
                <p className="text-gray-700">{data?.preferredPattern || 'N/A'}</p>
              </div>
              <div>
                <p className="font-semibold">예상 다음 목적지:</p>
                <p className="text-gray-700">{data?.predictedNext || 'N/A'}</p>
              </div>
              <div>
                <p className="font-semibold">신뢰도:</p>
                <p className="text-gray-700">{data?.confidence ? ((data.confidence * 100).toFixed(0)) + '%' : 'N/A'}</p>
              </div>
            </div>
          </div>
        );

      case 'spending_pattern':
        const categoryRatios = data.categoryRatios || [];
        
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">평균 일일 지출</p>
                <p className="text-2xl font-bold text-blue-700">{data.avgDaily?.toLocaleString()}원</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">총 지출</p>
                <p className="text-2xl font-bold text-green-700">{data.total?.toLocaleString()}원</p>
              </div>
            </div>
            
            <div>
              <p className="font-semibold mb-2">지출 패턴:</p>
              <p className="text-gray-700">{data.patternType}</p>
            </div>
            
            {categoryRatios.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-3">카테고리별 지출 비율</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryRatios}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="percentage"
                    >
                      {categoryRatios.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {categoryRatios.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-3">카테고리별 지출 금액</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryRatios}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${value.toLocaleString()}원`} />
                    <Legend />
                    <Bar dataKey="amount" fill="#0088FE" name="지출 금액" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {data.recommendations?.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="font-semibold mb-2">추천:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  {data.recommendations.map((r: string, i: number) => (
                    <li key={i} className="text-gray-700">{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 'feature_usage': {
        const features = data.features || [];
        // 기능 이름을 한국어로 변환
        const featuresWithKoreanNames = features.map((f: any) => ({
          ...f,
          featureKorean: FEATURE_NAMES[f.feature] || f.feature,
        }));
        
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">가장 많이 사용한 기능</p>
                <p className="text-xl font-bold text-purple-700">
                  {data.topFeature ? (FEATURE_NAMES[data.topFeature.feature] || data.topFeature.feature) : 'N/A'}
                </p>
                <p className="text-sm text-gray-600 mt-1">{data.topFeature?.usageCount || 0}회</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">사용 빈도</p>
                <p className="text-xl font-bold text-indigo-700">{data.frequency || 'N/A'}</p>
              </div>
            </div>
            
            {featuresWithKoreanNames.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-3">기능별 사용 횟수</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={featuresWithKoreanNames}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="featureKorean" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="usageCount" fill="#8884d8" name="사용 횟수" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {featuresWithKoreanNames.length > 0 && (
              <div>
                <h4 className="font-semibold text-lg mb-3">기능별 사용 비율</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={featuresWithKoreanNames}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ featureKorean, percentage }) => `${featureKorean}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="percentage"
                    >
                      {featuresWithKoreanNames.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {data.recommendations?.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="font-semibold mb-2">추천:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  {data.recommendations.map((r: string, i: number) => (
                    <li key={i} className="text-gray-700">{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      }

      case 're_purchase_score': {
        const score = data.score || 0;
        const scoreColor = score >= 70 ? 'text-red-600' : score >= 50 ? 'text-yellow-600' : 'text-gray-600';
        const urgencyColor = data.urgency === '높음' ? 'bg-red-100 border-red-300 text-red-800' : 
                           data.urgency === '보통' ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : 
                           'bg-gray-100 border-gray-300 text-gray-800';
        
        // 기능 사용 정보 (한국어 이름 변환)
        const rePurchaseFeatures = (data.features || []).map((f: any) => ({
          ...f,
          featureKorean: FEATURE_NAMES[f.feature] || f.feature,
        }));
        const topFeature = data.topFeature ? {
          ...data.topFeature,
          featureKorean: FEATURE_NAMES[data.topFeature.feature] || data.topFeature.feature,
        } : null;
        
        // 사용 빈도 계산
        const avgUsage = rePurchaseFeatures.length > 0 && data.totalUsage ? data.totalUsage / rePurchaseFeatures.length : 0;
        let frequency = '보통';
        if (avgUsage > 50) {
          frequency = '높음';
        } else if (avgUsage < 10) {
          frequency = '낮음';
        }
        
        // 디버깅: 기능 사용 정보 확인
        console.log('[Insights Page] re_purchase_score data:', {
          features: data.features,
          topFeature: data.topFeature,
          totalUsage: data.totalUsage,
          rePurchaseFeatures,
        });
        
        return (
          <div className="space-y-4">
            {/* 재구매 점수 및 긴급도 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-lg border-2 border-red-200">
                <p className="text-sm text-gray-600 mb-2">재구매 점수</p>
                <p className={`text-5xl font-bold ${scoreColor}`}>{score}점</p>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full ${
                        score >= 70 ? 'bg-red-600' : score >= 50 ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${Math.min(score, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className={`p-6 rounded-lg border-2 ${urgencyColor}`}>
                <p className="text-sm mb-2">긴급도</p>
                <p className="text-2xl font-bold">{data.urgency || 'N/A'}</p>
              </div>
            </div>
            
            {/* 예상 재구매 시기 및 마지막 여행 종료 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">예상 재구매 시기</p>
                <p className="text-lg font-semibold text-blue-700">{data.predictedTiming || 'N/A'}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-1">마지막 여행 종료</p>
                <p className="text-lg font-semibold text-green-700">
                  {data.lastTripEnd ? new Date(data.lastTripEnd).toLocaleDateString('ko-KR') : 'N/A'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {data.daysSinceTrip !== undefined ? `${data.daysSinceTrip}일 전` : ''}
                </p>
              </div>
            </div>
            
            {/* 기능 사용 정보 (모니카의 기능 사용 패턴처럼) */}
            {rePurchaseFeatures.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <p className="text-sm text-gray-600 mb-1">가장 많이 사용한 기능</p>
                    <p className="text-xl font-bold text-purple-700">
                      {topFeature ? topFeature.featureKorean : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{topFeature?.usageCount || 0}회</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <p className="text-sm text-gray-600 mb-1">사용 빈도</p>
                    <p className="text-xl font-bold text-indigo-700">{frequency}</p>
                  </div>
                </div>
                
                {/* 기능별 사용 횟수 바 차트 */}
                <div>
                  <h4 className="font-semibold text-lg mb-3">기능별 사용 횟수</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={rePurchaseFeatures}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="featureKorean" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="usageCount" fill="#8884d8" name="사용 횟수" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* 기능별 사용 비율 파이 차트 */}
                <div>
                  <h4 className="font-semibold text-lg mb-3">기능별 사용 비율</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={rePurchaseFeatures}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ featureKorean, percentage }) => `${featureKorean}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="percentage"
                      >
                        {rePurchaseFeatures.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-center text-gray-600 font-semibold">
                  기능 사용 기록이 없습니다.
                </p>
              </div>
            )}
            
            {/* 유도 전략 */}
            {data.strategies?.length > 0 && (
              <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="font-semibold mb-2">유도 전략:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  {data.strategies.map((s: string, i: number) => (
                    <li key={i} className="text-gray-700">{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      }

      default:
        // 새로운 인사이트 타입들에 대한 기본 렌더링
        if (insightType === 'engagement_score') {
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">참여도 점수</p>
                  <p className="text-3xl font-bold text-blue-700">{data.score || 0}점</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">참여도 등급</p>
                  <p className="text-2xl font-bold text-green-700">{data.level || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">로그인 빈도</p>
                  <p className="text-lg font-bold">{data.loginFrequency || 0}/일</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">마지막 활동</p>
                  <p className="text-lg font-bold">{data.daysSinceLastActive || 0}일 전</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">기능 사용</p>
                  <p className="text-lg font-bold">{data.totalFeatureUsage || 0}회</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">채팅 횟수</p>
                  <p className="text-lg font-bold">{data.totalChats || 0}회</p>
                </div>
              </div>
              {data.strategies?.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-semibold mb-2">소통 전략:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    {data.strategies.map((s: string, i: number) => (
                      <li key={i} className="text-gray-700">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        }
        
        if (insightType === 'satisfaction_score') {
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">평균 만족도</p>
                  <p className="text-3xl font-bold text-yellow-700">{data.score || 0}점</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">만족도 등급</p>
                  <p className="text-2xl font-bold text-green-700">{data.level || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">피드백 수</p>
                  <p className="text-lg font-bold">{data.feedbackCount || 0}개</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">개선 의견</p>
                  <p className="text-lg font-bold">{data.improvementCommentCount || 0}개</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">최근 피드백</p>
                  <p className="text-lg font-bold">{data.latestFeedback || 'N/A'}점</p>
                </div>
              </div>
              {data.strategies?.length > 0 && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="font-semibold mb-2">소통 전략:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    {data.strategies.map((s: string, i: number) => (
                      <li key={i} className="text-gray-700">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        }
        
        if (insightType === 'lifecycle_stage') {
          const stageColors: Record<string, string> = {
            '신규': 'bg-blue-100 text-blue-800 border-blue-300',
            '활성': 'bg-green-100 text-green-800 border-green-300',
            '충성 고객': 'bg-purple-100 text-purple-800 border-purple-300',
            '재활성화 필요': 'bg-orange-100 text-orange-800 border-orange-300',
            '이탈 위험': 'bg-red-100 text-red-800 border-red-300',
            '동면': 'bg-gray-100 text-gray-800 border-gray-300',
            '잠금': 'bg-red-100 text-red-800 border-red-300',
            '일반': 'bg-gray-100 text-gray-800 border-gray-300',
          };
          
          return (
            <div className="space-y-4">
              <div className={`p-6 rounded-lg border-2 ${stageColors[data.stage] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                <p className="text-sm text-gray-600 mb-2">현재 단계</p>
                <p className="text-4xl font-bold mb-2">{data.stage || 'N/A'}</p>
                <p className="text-base">{data.description || ''}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">가입일로부터</p>
                  <p className="text-lg font-bold">{data.daysSinceJoin || 0}일</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">마지막 활동</p>
                  <p className="text-lg font-bold">{data.daysSinceLastActive || 0}일 전</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">마지막 여행</p>
                  <p className="text-lg font-bold">{data.daysSinceTrip !== null ? `${data.daysSinceTrip}일 전` : '없음'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">여행 횟수</p>
                  <p className="text-lg font-bold">{data.tripCount || 0}회</p>
                </div>
              </div>
              {data.strategies?.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-semibold mb-2">단계별 소통 전략:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    {data.strategies.map((s: string, i: number) => (
                      <li key={i} className="text-gray-700">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        }
        
        if (insightType === 'cruise_preference') {
          return (
            <div className="space-y-4">
              {data.preferredCruiseLine && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">선호 크루즈 라인</p>
                  <p className="text-2xl font-bold text-blue-700">{data.preferredCruiseLine.name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {data.preferredCruiseLine.count}회 이용 ({data.preferredCruiseLine.percentage}%)
                  </p>
                </div>
              )}
              {data.preferredCruiseName && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">선호 크루즈명</p>
                  <p className="text-2xl font-bold text-green-700">{data.preferredCruiseName.name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {data.preferredCruiseName.count}회 이용 ({data.preferredCruiseName.percentage}%)
                  </p>
                </div>
              )}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">총 여행 횟수</p>
                <p className="text-xl font-bold">{data.totalTrips || 0}회</p>
              </div>
              {data.strategies?.length > 0 && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="font-semibold mb-2">추천 전략:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    {data.strategies.map((s: string, i: number) => (
                      <li key={i} className="text-gray-700">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        }
        
        if (insightType === 'communication_preference') {
          const levelColors: Record<string, string> = {
            '매우 높음': 'bg-green-100 text-green-800 border-green-300',
            '높음': 'bg-blue-100 text-blue-800 border-blue-300',
            '보통': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            '낮음': 'bg-gray-100 text-gray-800 border-gray-300',
          };
          
          return (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border-2 ${levelColors[data.communicationLevel] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                <p className="text-sm text-gray-600 mb-1">소통 선호도 등급</p>
                <p className="text-3xl font-bold">{data.communicationLevel || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">총 채팅 수</p>
                  <p className="text-lg font-bold">{data.totalChats || 0}회</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">총 메시지 수</p>
                  <p className="text-lg font-bold">{data.totalMessages || 0}개</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">평균 메시지/채팅</p>
                  <p className="text-lg font-bold">{data.avgMessagesPerChat || 0}개</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">메시지 응답률</p>
                  <p className="text-lg font-bold">{data.responseRate || 0}%</p>
                </div>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">선호 소통 시간대</p>
                <p className="text-xl font-bold text-indigo-700">{data.preferredTimeSlot || '알 수 없음'}</p>
              </div>
              {data.strategies?.length > 0 && (
                <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="font-semibold mb-2">소통 전략:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    {data.strategies.map((s: string, i: number) => (
                      <li key={i} className="text-gray-700">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        }
        
        return <pre className="bg-gray-50 p-4 rounded-lg overflow-auto">{JSON.stringify(data, null, 2)}</pre>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">마케팅 인사이트</h1>
            <p className="text-gray-600">사용자 데이터 기반 마케팅 인사이트를 확인하세요</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-24">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-red border-t-transparent mb-4"></div>
          <p className="text-lg font-medium text-gray-700">인사이트를 불러오는 중...</p>
          <p className="text-sm text-gray-500 mt-2">잠시만 기다려 주세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-extrabold text-gray-800 mb-2 flex items-center gap-3">
              <span className="text-5xl">💡</span>
              마케팅 인사이트
            </h1>
            <span className="text-xs font-bold px-3 py-1 rounded bg-blue-100 text-blue-700 border border-blue-300">
              지니AI 가이드
            </span>
          </div>
          <p className="text-lg text-gray-600 font-medium">사용자 데이터 기반 마케팅 인사이트를 확인하세요</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              // 전체 생성 시 필터 초기화
              setSelectedUserId(null);
              setCustomerSearchTerm('');
              setCustomerSearchResults([]);
              setSelectedType('');
              
              // 상태 업데이트 완료를 위해 약간의 지연
              await new Promise(resolve => setTimeout(resolve, 100));
              
              // 필터 초기화 후 인사이트 생성
              await handleGenerate();
            }}
            disabled={generating}
            className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:scale-105 disabled:hover:scale-100"
          >
            {generating ? '생성 중...' : '전체 사용자 인사이트 생성'}
          </button>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-red-500 text-xl">⚠️</span>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
            <button
              onClick={loadInsights}
              className="text-red-600 hover:text-red-800 text-sm font-medium underline"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {/* 필터 */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* 고객 검색 */}
          <div className="flex-1 w-full md:w-auto">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              고객 검색 <span className="text-gray-400 text-xs">(이름 또는 연락처)</span>
            </label>
            <div className="relative" ref={customerSearchDropdownRef}>
              <div className="relative">
                <input
                  type="text"
                  value={customerSearchTerm}
                  onChange={(e) => {
                    setCustomerSearchTerm(e.target.value);
                    setCustomerSearchDropdownOpen(true);
                    if (!e.target.value) {
                      handleClearCustomer();
                    }
                  }}
                  onFocus={() => {
                    if (customerSearchResults.length > 0) {
                      setCustomerSearchDropdownOpen(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setCustomerSearchDropdownOpen(false), 200);
                  }}
                  placeholder="고객 이름 또는 연락처로 검색 (예: 홍길동, 010-1234-5678)"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base pr-12"
                />
                {customerSearchTerm && (
                  <button
                    type="button"
                    onClick={handleClearCustomer}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FiX size={20} />
                  </button>
                )}
              </div>

              {customerSearchDropdownOpen && customerSearchResults.length > 0 && (
                <div className="absolute z-10 w-full bg-white border-2 border-gray-300 rounded-lg shadow-xl mt-2 max-h-60 overflow-y-auto">
                  {customerSearchResults.map((customer) => (
                    <div
                      key={customer.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectCustomer(customer);
                      }}
                      className={`flex items-center justify-between px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                        selectedUserId === customer.id ? 'bg-blue-100' : ''
                      }`}
                    >
                      <div>
                        <p className="font-medium text-gray-900">{customer.name || '이름 없음'}</p>
                        <p className="text-sm text-gray-500">{customer.phone || '연락처 없음'}</p>
                      </div>
                      {selectedUserId === customer.id && (
                        <FiCheckCircle className="text-blue-500" size={20} />
                      )}
                    </div>
                  ))}
                </div>
              )}
              {customerSearchLoading && (
                <div className="absolute z-10 w-full bg-white border-2 border-gray-300 rounded-lg shadow-xl mt-2 p-3 text-center text-gray-600">
                  검색 중...
                </div>
              )}
              {!customerSearchLoading && customerSearchTerm && customerSearchResults.length === 0 && customerSearchDropdownOpen && (
                <div className="absolute z-10 w-full bg-white border-2 border-gray-300 rounded-lg shadow-xl mt-2 p-3 text-center text-gray-600">
                  검색 결과가 없습니다.
                </div>
              )}
              {selectedUserId && (
                <p className="text-xs text-blue-600 mt-1">
                  ✓ 선택된 고객 ID: {selectedUserId}
                </p>
              )}
              {selectedUserId && (
                <button
                  type="button"
                  onClick={() => handleGenerate(selectedUserId)}
                  disabled={generating}
                  className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {generating ? '생성 중...' : '선택한 고객 인사이트 생성'}
                </button>
              )}
              <p className="text-xs text-gray-500 mt-1">
                💡 크루즈 가이드 AI를 사용한 고객만 검색됩니다.
              </p>
            </div>
          </div>

          {/* 인사이트 타입 필터 */}
          <div className="w-full md:w-auto">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              인사이트 타입
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full md:w-auto px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            >
              <option value="">전체</option>
              {Object.entries(INSIGHT_TYPE_NAMES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 인사이트 목록 */}
      <div className="space-y-4">
        {!error && insights.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-16 text-center">
            <div className="text-6xl mb-6">💡</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">인사이트가 없습니다</h3>
            <p className="text-gray-600 mb-6">마케팅 인사이트를 생성하여 사용자 패턴을 분석하세요</p>
            <button
              onClick={() => handleGenerate()}
              disabled={generating}
              className="bg-brand-red hover:bg-red-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              {generating ? '생성 중...' : '전체 사용자 인사이트 생성하기'}
            </button>
          </div>
        ) : !error ? (
          insights.map((insight) => {
            // user 정보가 없는 경우를 대비한 안전 처리
            const user = insight.user || { id: insight.userId, name: null, phone: null };
            const mallUser = user.mallUser;
            const isLinked = !!mallUser || !!user.mallUserId;
            
            return (
              <div key={insight.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6 hover:shadow-xl transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-800">
                        {user.name || '이름 없음'} ({user.phone || '전화번호 없음'})
                      </h3>
                      {isLinked && (
                        <span className="px-2 py-1 text-xs font-bold rounded bg-green-100 text-green-700 border border-green-300">
                          연동됨
                        </span>
                      )}
                    </div>
                    {isLinked && mallUser && (
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-semibold">크루즈몰:</span> {mallUser.name || '이름 없음'} ({mallUser.phone || '전화번호 없음'})
                      </div>
                    )}
                    {isLinked && user.mallNickname && (
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-semibold">크루즈몰 닉네임:</span> {user.mallNickname}
                      </div>
                    )}
                    {user.genieStatus && (
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-semibold">지니AI 상태:</span>{' '}
                        <span className={user.genieStatus === 'active' ? 'text-green-600' : 'text-gray-500'}>
                          {user.genieStatus === 'active' ? '활성' : '만료'}
                        </span>
                      </div>
                    )}
                    <p className="text-sm text-gray-600">
                      {INSIGHT_TYPE_NAMES[insight.insightType] || insight.insightType}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>업데이트: {new Date(insight.updatedAt).toLocaleString('ko-KR')}</p>
                    <button
                      onClick={() => handleGenerate(insight.userId)}
                      disabled={generating}
                      className="mt-2 text-brand-red hover:text-red-700 text-xs"
                    >
                      재생성
                    </button>
                  </div>
                </div>
                <div className="border-t pt-4">{renderInsightData(insight)}</div>
              </div>
            );
          })
        ) : null}
      </div>
    </div>
  );
}









