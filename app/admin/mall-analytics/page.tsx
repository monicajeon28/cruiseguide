// app/admin/mall-analytics/page.tsx
// 메인몰 데이터 분석 - 후기/커뮤니티/댓글 키워드 분석

'use client';

import { useState, useEffect } from 'react';
import { FiTrendingUp, FiMessageSquare, FiStar, FiHash } from 'react-icons/fi';

interface KeywordAnalysis {
  keyword: string;
  count: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  sources: {
    reviews: number;
    community: number;
    comments: number;
  };
}

interface ContentAnalysis {
  totalReviews: number;
  totalPosts: number;
  totalComments: number;
  avgRating: number;
  topKeywords: KeywordAnalysis[];
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export default function MallAnalyticsPage() {
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadAnalysis();
  }, [selectedPeriod]);

  const loadAnalysis = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/mall-analytics?period=${selectedPeriod}`);
      if (!response.ok) throw new Error('Failed to load analysis');
      
      const data = await response.json();
      setAnalysis(data.data);
    } catch (error) {
      console.error('Error loading analysis:', error);
      alert('데이터 분석을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                📊 메인몰 데이터 분석
              </h1>
              <p className="text-gray-600">
                후기, 커뮤니티, 댓글의 키워드와 내용을 분석합니다.
              </p>
            </div>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">최근 7일</option>
              <option value="30d">최근 30일</option>
              <option value="90d">최근 90일</option>
              <option value="all">전체</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">분석 중...</p>
          </div>
        ) : analysis ? (
          <>
            {/* 전체 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-2">
                  <FiStar className="text-yellow-600" size={24} />
                  <h3 className="text-sm font-medium text-gray-600">총 후기</h3>
                </div>
                <p className="text-3xl font-bold text-gray-800">
                  {analysis.totalReviews.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  평균 평점: {analysis.avgRating.toFixed(1)}점
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-2">
                  <FiMessageSquare className="text-blue-600" size={24} />
                  <h3 className="text-sm font-medium text-gray-600">커뮤니티 게시글</h3>
                </div>
                <p className="text-3xl font-bold text-gray-800">
                  {analysis.totalPosts.toLocaleString()}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-2">
                  <FiMessageSquare className="text-green-600" size={24} />
                  <h3 className="text-sm font-medium text-gray-600">댓글</h3>
                </div>
                <p className="text-3xl font-bold text-gray-800">
                  {analysis.totalComments.toLocaleString()}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-2">
                  <FiTrendingUp className="text-purple-600" size={24} />
                  <h3 className="text-sm font-medium text-gray-600">긍정 비율</h3>
                </div>
                <p className="text-3xl font-bold text-gray-800">
                  {analysis.sentimentDistribution.positive > 0
                    ? ((analysis.sentimentDistribution.positive /
                        (analysis.sentimentDistribution.positive +
                         analysis.sentimentDistribution.neutral +
                         analysis.sentimentDistribution.negative)) *
                        100).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>

            {/* 키워드 분석 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FiHash />
                인기 키워드 분석
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysis.topKeywords.map((keyword, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-800">#{keyword.keyword}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          keyword.sentiment === 'positive'
                            ? 'bg-green-100 text-green-700'
                            : keyword.sentiment === 'negative'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {keyword.sentiment === 'positive'
                          ? '긍정'
                          : keyword.sentiment === 'negative'
                          ? '부정'
                          : '중립'}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 mb-2">
                      {keyword.count.toLocaleString()}회
                    </p>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>후기: {keyword.sources.reviews}</span>
                      <span>게시글: {keyword.sources.community}</span>
                      <span>댓글: {keyword.sources.comments}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 감정 분포 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">감정 분포</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">긍정</p>
                  <p className="text-2xl font-bold text-green-700">
                    {analysis.sentimentDistribution.positive.toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">중립</p>
                  <p className="text-2xl font-bold text-gray-700">
                    {analysis.sentimentDistribution.neutral.toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">부정</p>
                  <p className="text-2xl font-bold text-red-700">
                    {analysis.sentimentDistribution.negative.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600">분석할 데이터가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}











