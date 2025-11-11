// app/api/admin/chat-bot/generate-flow/route.ts
// AI로 플로우 자동 생성 API

import { NextRequest, NextResponse } from 'next/server';
import { askGemini } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { ok: false, error: '플로우 설명을 입력해주세요.' },
        { status: 400 }
      );
    }

    // AI에게 플로우 생성 요청
    const systemPrompt = `당신은 채팅봇 플로우 설계 전문가입니다. 사용자의 요구사항을 바탕으로 타입봇 스타일의 플로우를 JSON 형식으로 생성해주세요.

플로우는 다음 노드 타입을 사용할 수 있습니다:
- start: 시작 노드 (항상 하나만)
- text: 텍스트 메시지 노드
- question: 질문 노드 (단일 선택, 다중 선택, 텍스트 입력)
- condition: 조건 분기 노드
- ai: AI 응답 노드
- action: 액션 노드 (리다이렉트, 변수 설정, API 호출)
- end: 종료 노드 (하나 이상)

응답 형식:
{
  "name": "플로우 이름",
  "nodes": [
    {
      "id": "node-1",
      "type": "start",
      "position": { "x": 100, "y": 100 },
      "data": { "label": "시작" }
    },
    {
      "id": "node-2",
      "type": "text",
      "position": { "x": 300, "y": 100 },
      "data": {
        "label": "텍스트 메시지",
        "content": "안녕하세요! 크루즈 여행을 도와드리겠습니다."
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2"
    }
  ]
}

한국어로 자연스럽고 사용자 친화적인 플로우를 만들어주세요.`;

    const messages = [
      {
        role: 'user' as const,
        content: `${systemPrompt}\n\n사용자 요구사항: ${prompt}`,
      },
    ];

    const response = await askGemini(messages, 0.7);
    const responseText = response.text || '';

    // JSON 추출 시도
    let flowData;
    try {
      // JSON 코드 블록이 있으면 추출
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                       responseText.match(/```\n([\s\S]*?)\n```/) ||
                       responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        flowData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        flowData = JSON.parse(responseText);
      }
    } catch (parseError) {
      // JSON 파싱 실패 시 기본 플로우 생성
      console.error('JSON 파싱 실패, 기본 플로우 생성:', parseError);
      flowData = {
        name: prompt.substring(0, 50),
        nodes: [
          {
            id: 'node-start',
            type: 'start',
            position: { x: 250, y: 100 },
            data: { label: '시작' },
          },
          {
            id: 'node-text-1',
            type: 'text',
            position: { x: 250, y: 250 },
            data: {
              label: '텍스트 메시지',
              content: '안녕하세요! 무엇을 도와드릴까요?',
            },
          },
          {
            id: 'node-end',
            type: 'end',
            position: { x: 250, y: 400 },
            data: { label: '종료' },
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'node-start',
            target: 'node-text-1',
          },
          {
            id: 'edge-2',
            source: 'node-text-1',
            target: 'node-end',
          },
        ],
      };
    }

    // 노드 ID에 타임스탬프 추가하여 고유성 보장
    const timestamp = Date.now();
    const nodes = (flowData.nodes || []).map((node: any, idx: number) => ({
      ...node,
      id: node.id || `node-${timestamp}-${idx}`,
    }));

    const edges = (flowData.edges || []).map((edge: any, idx: number) => ({
      ...edge,
      id: edge.id || `edge-${timestamp}-${idx}`,
    }));

    return NextResponse.json({
      ok: true,
      name: flowData.name || prompt.substring(0, 50),
      nodes,
      edges,
    });
  } catch (error: any) {
    console.error('[Generate Flow API] Error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || '플로우 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}



