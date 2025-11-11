import { NextRequest, NextResponse } from 'next/server';

// 웰컴페이먼츠 결제 완료 알림 API (서버 간 통신용)
export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    
    // 웰컴페이먼츠에서 전달하는 결제 결과 데이터
    const orderId = body.get('orderId') as string;
    const resultCode = body.get('resultCode') as string;
    const resultMsg = body.get('resultMsg') as string;
    const amount = body.get('amount') as string;
    const signature = body.get('signature') as string;
    
    console.log('[Payment Notify] Received:', { orderId, resultCode, resultMsg, amount });

    // 서명 검증 및 결제 처리 (callback과 동일한 로직)
    // TODO: 결제 정보 저장 및 알림 발송

    // 웰컴페이먼츠에 OK 응답
    return NextResponse.json({
      resultCode: '0000',
      resultMsg: 'OK',
    });
  } catch (error) {
    console.error('[Payment Notify] Error:', error);
    return NextResponse.json(
      { resultCode: '9999', resultMsg: 'ERROR' },
      { status: 500 }
    );
  }
}

