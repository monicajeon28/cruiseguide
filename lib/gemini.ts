const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_MODEL   = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

if (!GEMINI_API_KEY) {
  throw new Error('Missing GEMINI_API_KEY');
}

type Msg = { role: 'user'|'assistant'|'system'; content: string };

// Tool Calling 도구 정의
export const TOOLS_DEFINITION = {
  type: "function",
  function: {
    name: "tools",
    description: "AI 에이전트가 사용할 수 있는 도구들",
    parameters: {
      type: "object",
      properties: {
        tool_calls: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "도구 이름 (add_expense, add_to_checklist)",
                enum: ["add_expense", "add_to_checklist"]
              },
              parameters: {
                type: "object",
                description: "도구에 전달할 파라미터"
              }
            },
            required: ["name", "parameters"]
          }
        }
      },
      required: ["tool_calls"]
    }
  }
};

// 도구 정의 (JSON Schema 형식)
export const TOOLS_SCHEMA = [
  {
    name: "add_expense",
    description: "가계부에 지출 내역을 기록합니다. (예: '택시비 30달러 썼어')",
    parameters: {
      type: "object",
      properties: {
        amount: { type: "number", description: "금액 (숫자)" },
        currency: { type: "string", description: "통화 코드 (USD, JPY, EUR, KRW 등)" },
        category: { type: "string", description: "카테고리 (food, transport, shopping, entertainment, accommodation, medical, other)", enum: ["food", "transport", "shopping", "entertainment", "accommodation", "medical", "other"] },
        description: { type: "string", description: "지출 설명" }
      },
      required: ["amount", "currency", "category", "description"]
    }
  },
  {
    name: "add_to_checklist",
    description: "체크리스트에 항목을 추가합니다. (예: '멀미약 챙기')",
    parameters: {
      type: "object",
      properties: {
        itemName: { type: "string", description: "추가할 항목 이름" }
      },
      required: ["itemName"]
    }
  },
  {
    name: "save_trip_feedback",
    description: "여행 피드백을 저장합니다. (예: '만족도 5점, 음식이 정말 맛있었어요')",
    parameters: {
      type: "object",
      properties: {
        satisfactionScore: { type: "number", description: "만족도 점수 (1-5점)" },
        improvementComments: { type: "string", description: "개선이 필요한 점 (자유 응답)" },
        detailedFeedback: { type: "string", description: "상세 피드백 (종합 의견)" }
      },
      required: ["satisfactionScore"]
    }
  }
];

export async function askGemini(messages: Msg[], temperature = 0.7) {
  // Google Generative Language API v1beta
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  // 시스템 프롬프트가 있으면 첫 메시지로 붙여준다
  const parts = (m: Msg) => [{ text: m.content }];
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: parts(m)
  }));

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: { 
        temperature,
        maxOutputTokens: 8192, // 충분한 답변을 위해 8192로 증가
        topP: 0.95,
        topK: 40,
      },
      tools: [
        {
          googleSearch: {} // Google Search 활성화하여 검색 기반 답변 가능하게
        }
      ],
      toolConfig: {
        functionCallingConfig: {
          mode: "AUTO",
          allowedFunctionNames: ["add_expense", "add_to_checklist"]
        }
      },
      safetySettings: [] // 필요 시 추가
    }),
    // 절대 캐시 금지
    cache: 'no-store',
  });

  if (!res.ok) {
    const t = await res.text().catch(()=> '');
    throw new Error(`Gemini error ${res.status}: ${t}`);
  }

  const json = await res.json();
  
  // Tool Call 응답 확인
  const toolCalls = json?.candidates?.[0]?.content?.parts?.filter((p: any) => p.functionCall);
  const textResponse = json?.candidates?.[0]?.content?.parts?.map((p: any)=>p?.text).join('') ?? '';

  return {
    text: (textResponse || '').trim(),
    toolCalls: toolCalls || []
  };
}

// 도구 실행 함수들
export async function executeAddExpense(
  userId: number,
  amount: number,
  currency: string,
  category: string,
  description: string
) {
  try {
    // 현재 사용자의 활성 여행 조회
    const activeTrip = await prisma.trip.findFirst({
      where: {
        userId,
        status: { in: ['Upcoming', 'InProgress'] },
      },
      orderBy: { startDate: 'desc' },
    });

    if (!activeTrip) {
      return {
        success: false,
        message: '활성 여행이 없습니다. 먼저 여행을 등록해주세요.',
      };
    }

    // 지출 항목 생성
    const expense = await prisma.expense.create({
      data: {
        tripId: activeTrip.id,
        amount: parseFloat(amount.toString()),
        currency,
        category,
        description,
        date: new Date(),
      },
    });

    return {
      success: true,
      message: `✅ ${amount} ${currency}를 ${category} 카테고리로 기록했습니다.`,
      data: expense,
    };
  } catch (error) {
    console.error('[Gemini] 지출 저장 오류:', error);
    return {
      success: false,
      message: '지출 기록 중 오류가 발생했습니다.',
    };
  }
}

export async function executeAddToChecklist(
  userId: number,
  itemName: string
) {
  try {
    // 현재 사용자의 활성 여행 조회
    const activeTrip = await prisma.trip.findFirst({
      where: {
        userId,
        status: { in: ['Upcoming', 'InProgress'] },
      },
      orderBy: { startDate: 'desc' },
    });

    // 여행이 없으면 전역 체크리스트에 추가
    const tripId = activeTrip?.id || null;

    const item = await prisma.checklistItem.create({
      data: {
        tripId,
        userId,
        name: itemName,
        completed: false,
      },
    });

    return {
      success: true,
      message: `✅ "${itemName}"을 체크리스트에 추가했습니다.`,
      data: item,
    };
  } catch (error) {
    console.error('[Gemini] 체크리스트 추가 오류:', error);
    return {
      success: false,
      message: '체크리스트 추가 중 오류가 발생했습니다.',
    };
  }
}

export async function executeAddToTripFeedback(
  userId: number,
  satisfactionScore: number,
  improvementComments?: string,
  detailedFeedback?: string
) {
  try {
    // 현재 사용자의 최근 완료된 여행 조회
    const completedTrip = await prisma.trip.findFirst({
      where: {
        userId,
        status: 'Completed',
      },
      orderBy: { endDate: 'desc' },
    });

    if (!completedTrip) {
      return {
        success: false,
        message: '완료된 여행이 없습니다.',
      };
    }

    // TripFeedback 생성 또는 업데이트
    const feedback = await prisma.tripFeedback.upsert({
      where: { tripId: completedTrip.id },
      create: {
        tripId: completedTrip.id,
        satisfactionScore: Math.min(Math.max(1, Math.round(satisfactionScore)), 5),
        improvementComments: improvementComments || null,
        detailedFeedback: detailedFeedback || null,
      },
      update: {
        satisfactionScore: Math.min(Math.max(1, Math.round(satisfactionScore)), 5),
        improvementComments: improvementComments || null,
        detailedFeedback: detailedFeedback || null,
      },
    });

    return {
      success: true,
      message: `✅ 여행 피드백이 저장되었습니다. (만족도: ${feedback.satisfactionScore}점)`,
      data: feedback,
    };
  } catch (error) {
    console.error('[Gemini] 피드백 저장 오류:', error);
    return {
      success: false,
      message: '피드백 저장 중 오류가 발생했습니다.',
    };
  }
}

// Tool Call 처리 함수
export async function executeTool(
  toolName: string,
  parameters: Record<string, any>,
  userId: number
) {
  switch (toolName) {
    case 'add_expense':
      return await executeAddExpense(
        userId,
        parameters.amount,
        parameters.currency,
        parameters.category,
        parameters.description
      );
    
    case 'add_to_checklist':
      return await executeAddToChecklist(
        userId,
        parameters.itemName
      );
    
    case 'save_trip_feedback':
      return await executeAddToTripFeedback(
        userId,
        parameters.satisfactionScore,
        parameters.improvementComments,
        parameters.detailedFeedback
      );
    
    default:
      return {
        success: false,
        message: `알 수 없는 도구: ${toolName}`
      };
  }
}
