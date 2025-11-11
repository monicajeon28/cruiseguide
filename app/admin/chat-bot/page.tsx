// app/admin/chat-bot/page.tsx
// AI 지니 채팅봇(구매) 관리

'use client';

import { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiChevronRight, FiBarChart2 } from 'react-icons/fi';
import Link from 'next/link';

interface ChatBotFlow {
  id: number;
  name: string;
  category: string;
  description?: string;
  startQuestionId?: number;
  finalPageUrl?: string;
  isActive: boolean;
  order: number;
  questionCount?: number;
}

export default function ChatBotManagementPage() {
  const [flows, setFlows] = useState<ChatBotFlow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/chat-bot/flows');
      if (!response.ok) throw new Error('Failed to load flows');
      
      const data = await response.json();
      setFlows(data.data || []);
    } catch (error) {
      console.error('Error loading flows:', error);
      alert('플로우를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까? 모든 질문도 함께 삭제됩니다.')) return;

    try {
      const response = await fetch(`/api/admin/chat-bot/flows/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
      
      setFlows(flows.filter(f => f.id !== id));
      alert('삭제되었습니다.');
    } catch (error) {
      console.error('Error deleting flow:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/chat-bot/flows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (!response.ok) throw new Error('Failed to update');
      
      setFlows(flows.map(f => f.id === id ? { ...f, isActive: !currentStatus } : f));
    } catch (error) {
      console.error('Error updating flow:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
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
                🤖 AI 지니 채팅봇(구매) 관리
              </h1>
              <p className="text-gray-600">
                SPIN 기반 상담 플로우와 질문을 관리합니다.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/chat-bot/insights"
                className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <FiBarChart2 />
                인사이트
              </Link>
              <Link
                href="/admin/chat-bot/flows/new"
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FiPlus />
                새 플로우 만들기
              </Link>
            </div>
          </div>
        </div>

        {/* 플로우 목록 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        ) : flows.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 mb-4">등록된 플로우가 없습니다.</p>
            <Link
              href="/admin/chat-bot/flows/new"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              첫 플로우 만들기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flows.map((flow) => (
              <div
                key={flow.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {flow.name}
                    </h3>
                    {flow.description && (
                      <p className="text-gray-600 text-sm mb-2">
                        {flow.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>질문: {flow.questionCount || 0}개</span>
                      <span
                        className={`px-2 py-1 rounded ${
                          flow.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {flow.isActive ? '활성' : '비활성'}
                      </span>
                    </div>
                  </div>
                </div>

                {flow.finalPageUrl && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">최종 페이지</p>
                    <p className="text-sm font-semibold text-blue-700 truncate">
                      {flow.finalPageUrl}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Link
                    href={`/admin/chat-bot/flows/${flow.id}`}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FiEdit2 />
                    편집
                  </Link>
                  <button
                    onClick={() => handleToggleActive(flow.id, flow.isActive)}
                    className={`px-4 py-2 font-semibold rounded-lg transition-colors ${
                      flow.isActive
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {flow.isActive ? '비활성' : '활성'}
                  </button>
                  <button
                    onClick={() => handleDelete(flow.id)}
                    className="px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

