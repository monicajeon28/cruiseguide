'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiDownload, FiBarChart2, FiMessageCircle, FiMap, FiDollarSign, FiCheckSquare, FiGlobe, FiActivity, FiZoomIn, FiZoomOut, FiChevronDown, FiChevronUp } from 'react-icons/fi';

interface AnalyticsData {
  사용자_정보: {
    이름: string;
    전화번호: string;
    가입일: string;
    마지막_접속: string;
    여행_횟수: number;
  };
  AI_채팅_사용: {
    총_대화_횟수: number;
    총_메시지_수: number;
    인기_키워드: Array<{ keyword: string; count: number }>;
    자주_사용한_문구: Array<{ phrase: string; count: number }>;
  };
  여행_기록: {
    총_여행_수: number;
    방문_국가: Array<{
      국가명: string;
      방문_횟수: number;
      마지막_방문일: string;
    }>;
  여행_목록: Array<{
    순번: number;
    크루즈명: string;
    출발일: string | null;
    종료일: string | null;
    방문_지역_수: number;
    다이어리_기록: Array<{
      id: number;
      제목: string;
      내용: string;
      방문일: string;
      국가코드: string;
      국가명: string;
    }>;
  }>;
  };
  가계부_사용: {
    총_지출_항목: number;
    총_지출_금액_원화: number;
    총_지출_금액_달러: number;
    카테고리별_지출: Array<{
      카테고리: string;
      항목_수: number;
      총_금액_원화: number;
    }>;
    사용한_통화: string[];
    여행별_지출?: Array<{
      순번: number;
      여행ID: number | null;
      크루즈명: string | null;
      출발일: string | null;
      종료일: string | null;
      총_지출_금액_원화: number;
      항목_수: number;
      카테고리별_지출: Array<{
        카테고리: string;
        항목_수: number;
        총_금액_원화: number;
      }>;
      지출_목록: Array<{
        id: number;
        category: string;
        amount: number;
        currency: string;
        krwAmount: number;
        description: string | null;
        createdAt: string;
      }>;
    }>;
  };
  체크리스트_사용: {
    총_항목_수: number;
    완료_항목_수: number;
    완료율_퍼센트: number;
  };
  번역기_사용: {
    추정_사용_횟수: number;
    샘플_메시지: Array<{
      text: string;
      createdAt: string | null;
    }>;
  };
  기능_사용_통계: Record<string, { usageCount: number; lastUsedAt: string | null }>;
  활동_통계: Record<string, number>;
}

interface UserAnalyticsProps {
  userId: string;
}

export default function UserAnalytics({ userId }: UserAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [keywordZoom, setKeywordZoom] = useState(1);
  const keywordContainerRef = useRef<HTMLDivElement>(null);
  const [isTripRecordsExpanded, setIsTripRecordsExpanded] = useState(false); // 여행 기록 확장/축소 상태
  const [isAccountBookExpanded, setIsAccountBookExpanded] = useState(false); // 가계부 사용 확장/축소 상태

  useEffect(() => {
    loadAnalytics();
  }, [userId]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[UserAnalytics] Loading analytics for user:', userId);

      const response = await fetch(`/api/admin/users/${userId}/analytics`, {
        credentials: 'include',
      });

      console.log('[UserAnalytics] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[UserAnalytics] API Error:', response.status, errorText);
        
        let errorMessage = '데이터를 불러올 수 없습니다.';
        if (response.status === 401 || response.status === 403) {
          errorMessage = '인증이 필요합니다. 다시 로그인해 주세요.';
        } else if (response.status === 404) {
          errorMessage = '사용자를 찾을 수 없습니다.';
        } else if (response.status >= 500) {
          errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('[UserAnalytics] API Result:', result);

      if (!result.ok) {
        throw new Error(result.error || '데이터를 불러오는 중 오류가 발생했습니다.');
      }

      if (result.data) {
        setAnalytics(result.data);
      } else {
        // 데이터가 없어도 빈 상태로 표시
        setAnalytics(null);
      }
    } catch (err) {
      console.error('[UserAnalytics] Failed to load analytics:', err);
      setError(err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.');
      setAnalytics(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      setIsExporting(true);
      const response = await fetch(`/api/admin/users/${userId}/analytics/export?format=${format}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('파일 다운로드에 실패했습니다.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export:', err);
      alert(err instanceof Error ? err.message : '파일 다운로드 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FiBarChart2 className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">사용 데이터 분석</h2>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FiBarChart2 className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">사용 데이터 분석</h2>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="text-red-600 text-xl">⚠️</div>
            <div className="flex-1">
              <p className="text-red-800 font-semibold mb-2">오류가 발생했습니다</p>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={loadAnalytics}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FiBarChart2 className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">사용 데이터 분석</h2>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">사용 데이터가 없습니다.</p>
          <p className="text-gray-400 text-sm mt-2">이 고객은 아직 크루즈 가이드를 사용하지 않았습니다.</p>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 및 다운로드 버튼 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FiBarChart2 className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">사용 데이터 분석</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('json')}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <FiDownload className="w-4 h-4" />
              {isExporting ? '다운로드 중...' : 'JSON 다운로드'}
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <FiDownload className="w-4 h-4" />
              {isExporting ? '다운로드 중...' : 'CSV 다운로드'}
            </button>
          </div>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiMessageCircle className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">AI 채팅</h3>
            </div>
            <p className="text-2xl font-bold text-blue-600">{analytics.AI_채팅_사용.총_대화_횟수}회</p>
            <p className="text-sm text-gray-600 mt-1">{analytics.AI_채팅_사용.총_메시지_수}개 메시지</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiMap className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-800">여행</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">{analytics.여행_기록.총_여행_수}회</p>
            <p className="text-sm text-gray-600 mt-1">{analytics.여행_기록.방문_국가?.length || 0}개 국가</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiDollarSign className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-800">가계부</h3>
            </div>
            <p className="text-2xl font-bold text-purple-600">{formatNumber(analytics.가계부_사용.총_지출_항목)}개</p>
            <p className="text-sm text-gray-600 mt-1">{formatNumber(analytics.가계부_사용.총_지출_금액_원화)}원</p>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiCheckSquare className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-gray-800">체크리스트</h3>
            </div>
            <p className="text-2xl font-bold text-orange-600">{analytics.체크리스트_사용.완료율_퍼센트}%</p>
            <p className="text-sm text-gray-600 mt-1">{analytics.체크리스트_사용.완료_항목_수}/{analytics.체크리스트_사용.총_항목_수} 완료</p>
          </div>
        </div>
      </div>

      {/* AI 채팅 사용 분석 - 마인드맵 스타일 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FiMessageCircle className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-800">AI 채팅 사용 분석</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setKeywordZoom(Math.max(0.5, keywordZoom - 0.1))}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="축소"
            >
              <FiZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 w-12 text-center">{Math.round(keywordZoom * 100)}%</span>
            <button
              onClick={() => setKeywordZoom(Math.min(2, keywordZoom + 0.1))}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="확대"
            >
              <FiZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="space-y-6">
          {/* 인기 키워드 마인드맵 */}
          <div>
            <p className="text-sm text-gray-600 mb-4">인기 키워드</p>
            {analytics.AI_채팅_사용.인기_키워드 && analytics.AI_채팅_사용.인기_키워드.length > 0 ? (
              <div
                ref={keywordContainerRef}
                className="relative border-2 border-blue-200 rounded-lg p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-[400px] overflow-auto"
                style={{ transform: `scale(${keywordZoom})`, transformOrigin: 'top left', width: `${100 / keywordZoom}%` }}
              >
                <div className="flex flex-wrap gap-4 items-center justify-center">
                  {analytics.AI_채팅_사용.인기_키워드.map((item, idx) => {
                    // 최대값 기준으로 크기 계산 (최소 12px, 최대 48px)
                    const maxCount = analytics.AI_채팅_사용.인기_키워드[0]?.count || 1;
                    const fontSize = Math.max(12, Math.min(48, (item.count / maxCount) * 48 + 12));
                    const opacity = 0.6 + (item.count / maxCount) * 0.4;
                    
                    return (
                      <span
                        key={idx}
                        className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-medium hover:bg-blue-200 transition-colors cursor-pointer"
                        style={{
                          fontSize: `${fontSize}px`,
                          opacity,
                        }}
                        title={`${item.keyword}: ${item.count}회`}
                      >
                        {item.keyword} ({item.count}회)
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">키워드 데이터가 없습니다.</p>
            )}
          </div>
          
          {/* 자주 사용한 문구 */}
          <div>
            <p className="text-sm text-gray-600 mb-4">자주 사용한 문구</p>
            {analytics.AI_채팅_사용.자주_사용한_문구 && analytics.AI_채팅_사용.자주_사용한_문구.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {analytics.AI_채팅_사용.자주_사용한_문구.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    {item.phrase} ({item.count}회)
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">문구 데이터가 없습니다.</p>
            )}
          </div>
        </div>
      </div>

      {/* 여행 기록 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <button
          onClick={() => setIsTripRecordsExpanded(!isTripRecordsExpanded)}
          className="flex items-center gap-2 mb-4 w-full text-left"
        >
          <FiMap className="w-5 h-5 text-green-600" />
          <h3 className="text-xl font-semibold text-gray-800">여행 기록 ({analytics.여행_기록.총_여행_수}회)</h3>
          {isTripRecordsExpanded ? (
            <FiChevronUp className="w-5 h-5 ml-auto" />
          ) : (
            <FiChevronDown className="w-5 h-5 ml-auto" />
          )}
        </button>
        {isTripRecordsExpanded && (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">방문 국가</p>
            {analytics.여행_기록.방문_국가 && analytics.여행_기록.방문_국가.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {analytics.여행_기록.방문_국가.map((country, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                  >
                    {country.국가명} ({country.방문_횟수}회)
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">방문 국가 정보가 없습니다.</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-4">여행 다이어리</p>
            <div className="space-y-6">
              {(analytics.여행_기록.여행_목록 || []).map((trip, idx) => (
                <div key={idx} className="border-l-4 border-green-500 pl-4 py-2">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {trip.순번}번째 여행
                    </span>
                    <h4 className="text-lg font-bold text-gray-800">{trip.크루즈명}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {trip.출발일 && trip.종료일
                      ? `${trip.출발일.split('T')[0]} ~ ${trip.종료일.split('T')[0]}`
                      : '날짜 정보 없음'}
                    {' • '}방문 지역: {trip.방문_지역_수}개
                  </p>
                  
                  {/* 다이어리 기록 */}
                  {trip.다이어리_기록 && trip.다이어리_기록.length > 0 && (
                    <div className="mt-4 space-y-3 ml-4">
                      {trip.다이어리_기록.map((entry) => (
                        <div key={entry.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              {entry.국가명}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(entry.방문일).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                          <h5 className="font-semibold text-gray-800 mb-1">{entry.제목}</h5>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{entry.내용}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {(!trip.다이어리_기록 || trip.다이어리_기록.length === 0) && (
                    <p className="text-sm text-gray-400 italic ml-4">다이어리 기록이 없습니다.</p>
                  )}
                </div>
              ))}
              {(!analytics.여행_기록.여행_목록 || analytics.여행_기록.여행_목록.length === 0) && (
                <p className="text-gray-500 text-center py-8">여행 기록이 없습니다.</p>
              )}
            </div>
          </div>
        </div>
        )}
      </div>

      {/* 가계부 사용 - 여행별 구분 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <button
          onClick={() => setIsAccountBookExpanded(!isAccountBookExpanded)}
          className="flex items-center gap-2 mb-4 w-full text-left"
        >
          <FiDollarSign className="w-5 h-5 text-purple-600" />
          <h3 className="text-xl font-semibold text-gray-800">가계부 사용 ({analytics.가계부_사용.총_지출_항목}개 항목)</h3>
          {isAccountBookExpanded ? (
            <FiChevronUp className="w-5 h-5 ml-auto" />
          ) : (
            <FiChevronDown className="w-5 h-5 ml-auto" />
          )}
        </button>
        {isAccountBookExpanded && (
        <div className="space-y-6">
          {/* 전체 통계 */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">전체 통계</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">총 지출 항목</p>
                <p className="text-2xl font-bold text-purple-600">{formatNumber(analytics.가계부_사용.총_지출_항목)}개</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">총 지출 금액</p>
                <p className="text-2xl font-bold text-purple-600">{formatNumber(analytics.가계부_사용.총_지출_금액_원화)}원</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">사용한 통화</p>
                <p className="text-lg font-bold text-purple-600">{(analytics.가계부_사용.사용한_통화 || []).join(', ') || '없음'}</p>
              </div>
            </div>
          </div>

          {/* 여행별 지출 */}
          {analytics.가계부_사용.여행별_지출 && analytics.가계부_사용.여행별_지출.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">여행별 지출</p>
              <div className="space-y-4">
                {analytics.가계부_사용.여행별_지출.map((tripExpense, idx) => (
                  <div key={idx} className="border-l-4 border-purple-500 pl-4 py-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {tripExpense.순번}번째 여행
                      </span>
                      <h4 className="font-bold text-gray-800">
                        {tripExpense.크루즈명 || '여행 정보 없음'}
                      </h4>
                    </div>
                    {tripExpense.출발일 && tripExpense.종료일 && (
                      <p className="text-sm text-gray-600 mb-3">
                        {tripExpense.출발일.split('T')[0]} ~ {tripExpense.종료일.split('T')[0]}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">총 지출</p>
                        <p className="text-lg font-bold text-purple-600">
                          {formatNumber(tripExpense.총_지출_금액_원화)}원
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">항목 수</p>
                        <p className="text-lg font-bold text-purple-600">{tripExpense.항목_수}개</p>
                      </div>
                    </div>
                    
                    {/* 카테고리별 지출 */}
                    {tripExpense.카테고리별_지출 && tripExpense.카테고리별_지출.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-600 mb-2">카테고리별 지출</p>
                        <div className="space-y-1">
                          {tripExpense.카테고리별_지출.map((cat, catIdx) => (
                            <div key={catIdx} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">{cat.카테고리}</span>
                              <div className="text-right">
                                <span className="text-gray-600">{cat.항목_수}개</span>
                                <span className="ml-2 font-semibold text-purple-600">
                                  {formatNumber(cat.총_금액_원화)}원
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 전체 카테고리별 지출 */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">전체 카테고리별 지출</p>
            <div className="space-y-2">
              {(analytics.가계부_사용.카테고리별_지출 || []).map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-800">{cat.카테고리}</span>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{cat.항목_수}개 항목</p>
                    <p className="text-sm font-bold text-purple-600">{formatNumber(cat.총_금액_원화)}원</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}
      </div>

      {/* 번역기 사용 */}
      {analytics.번역기_사용.추정_사용_횟수 > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiGlobe className="w-5 h-5 text-indigo-600" />
            <h3 className="text-xl font-semibold text-gray-800">번역기 사용</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-indigo-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">추정 사용 횟수</p>
              <p className="text-2xl font-bold text-indigo-600">{analytics.번역기_사용.추정_사용_횟수}회</p>
            </div>
            {analytics.번역기_사용.샘플_메시지 && analytics.번역기_사용.샘플_메시지.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">샘플 메시지</p>
                <div className="space-y-2">
                  {analytics.번역기_사용.샘플_메시지.map((msg, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-800">{msg.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 기능 사용 통계 */}
      {Object.keys(analytics.기능_사용_통계).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiActivity className="w-5 h-5 text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-800">기능 사용 통계</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(analytics.기능_사용_통계).map(([feature, stats]) => (
              <div key={feature} className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-800 mb-2">{feature}</p>
                <p className="text-2xl font-bold text-gray-600">{stats.usageCount}회</p>
                {stats.lastUsedAt && (
                  <p className="text-sm text-gray-600 mt-1">
                    마지막 사용: {stats.lastUsedAt.split('T')[0]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}





