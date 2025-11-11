// app/admin/chat-bot/flows/new/page.tsx
// 새 플로우 만들기 - 타입봇 스타일 시각적 플로우 빌더

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { showSuccess, showError } from '@/components/ui/Toast';

// React Flow를 동적으로 로드하여 SSR 문제 해결
const FlowCanvas = dynamic(
  () => import('./FlowCanvas'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">플로우 에디터를 불러오는 중...</p>
        </div>
      </div>
    )
  }
);

export default function NewFlowPage() {
  const router = useRouter();
  const [flowName, setFlowName] = useState('');
  const [flowDescription, setFlowDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // AI로 플로우 생성
  const generateFlowWithAI = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/admin/chat-bot/generate-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (data.ok && data.nodes && data.edges) {
        showSuccess('AI가 플로우를 생성했습니다!');
        return { nodes: data.nodes, edges: data.edges, name: data.name };
      } else {
        throw new Error(data.error || '플로우 생성 실패');
      }
    } catch (error: any) {
      console.error('AI 플로우 생성 오류:', error);
      showError(error.message || 'AI 플로우 생성 중 오류가 발생했습니다.');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  // 플로우 저장
  const handleSave = async (nodes: any[], edges: any[]) => {
    if (!flowName.trim()) {
      showError('플로우 이름을 입력해주세요.');
      return;
    }

    if (nodes.length === 0) {
      showError('최소 하나의 노드를 추가해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      // 플로우 생성
      const flowResponse = await fetch('/api/admin/chat-bot/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: flowName,
          description: flowDescription,
        }),
      });

      const flowData = await flowResponse.json();
      if (!flowData.ok) throw new Error(flowData.error || '플로우 생성 실패');

      const flowId = flowData.data.id;

      // 노드와 엣지를 질문으로 변환하여 저장
      const questionsResponse = await fetch(`/api/admin/chat-bot/flows/${flowId}/nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nodes,
          edges,
        }),
      });

      const questionsData = await questionsResponse.json();
      if (!questionsData.ok) throw new Error(questionsData.error || '질문 저장 실패');

      showSuccess('플로우가 저장되었습니다!');
      router.push(`/admin/chat-bot/flows/${flowId}`);
    } catch (error: any) {
      console.error('플로우 저장 오류:', error);
      showError(error.message || '플로우 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FlowCanvas
      onAddNode={() => {}}
      onSave={handleSave}
      onGenerateAI={generateFlowWithAI}
      flowName={flowName}
      setFlowName={setFlowName}
      flowDescription={flowDescription}
      setFlowDescription={setFlowDescription}
      aiPrompt={aiPrompt}
      setAiPrompt={setAiPrompt}
      isGenerating={isGenerating}
      isSaving={isSaving}
    />
  );
}
