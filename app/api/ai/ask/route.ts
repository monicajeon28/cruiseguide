import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { q } = await req.json();

  if (!q) return NextResponse.json({ answer: '질문을 입력해주세요.' }, { status: 400 });

  const API_KEY = process.env.GEMINI_API_KEY;

  // 키 없으면 바로 더미로
  if (!API_KEY) {
    return NextResponse.json({
      answer: `요청하신 "<b>${q}</b>"에 대한 답변을 준비 중입니다. (임시 응답)`,
    });
  }

  try {
    // 모델명 최신 권장값으로 교체 (둘 중 하나 사용)
    // 1) 'models/gemini-1.5-flash-latest'
    // 2) 'models/gemini-1.5-flash-002'
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genai = new GoogleGenerativeAI(API_KEY);
    const model = genai.getGenerativeModel({ model: 'models/gemini-1.5-flash-latest' });

    const resp = await model.generateContent(q);
    const text = resp.response.text?.() ?? '답변을 생성하지 못했어요.';
    return NextResponse.json({ answer: text });
  } catch (e: any) {
    // 호출 실패 시에도 500 대신 사용자 친화적 더미
    return NextResponse.json({
      answer: `요청하신 "<b>${q}</b>"에 대한 답변을 준비 중입니다. (API 연결 준비 중)`,
      error: e?.message,
    });
  }
}
