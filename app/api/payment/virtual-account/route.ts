import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

// 웰컴페이먼츠 가상계좌 입금 통보 API
export async function POST(req: NextRequest) {
  try {
    const body = await req.formData(); // 웰컴페이먼츠는 form-data로 전송
    
    // 웰컴페이먼츠에서 전달하는 가상계좌 입금 통보 데이터
    const orderId = body.get('orderId') as string;
    const resultCode = body.get('resultCode') as string;
    const resultMsg = body.get('resultMsg') as string;
    const amount = body.get('amount') as string;
    const signature = body.get('signature') as string;
    const virtualAccount = body.get('virtualAccount') as string; // 가상계좌번호
    const depositName = body.get('depositName') as string; // 입금자명
    
    console.log('[Virtual Account Notification] Received:', { 
      orderId, 
      resultCode, 
      resultMsg, 
      amount, 
      virtualAccount,
      depositName 
    });

    // 서명 검증
    const pgSignkey = process.env.PG_SIGNKEY;
    if (!pgSignkey) {
      return NextResponse.json(
        { ok: false, error: 'PG 설정 오류' },
        { status: 500 }
      );
    }

    // 웰컴페이먼츠 서명 검증 로직 (실제 API 문서에 맞게 수정 필요)
    const verifyData = `${orderId}${resultCode}${amount}${pgSignkey}`;
    const expectedSignature = crypto.createHash('sha256').update(verifyData).digest('hex').toUpperCase();

    if (signature !== expectedSignature) {
      console.error('[Virtual Account Notification] Signature mismatch:', { signature, expectedSignature });
      return NextResponse.json(
        { ok: false, error: '서명 검증 실패' },
        { status: 400 }
      );
    }

    // 입금 완료 여부 확인
    const isSuccess = resultCode === '0000' || resultCode === '00';

    if (isSuccess) {
      // 가상계좌 입금 완료 처리
      console.log('[Virtual Account Notification] Deposit completed:', orderId);
      
      // TODO: 주문 상태 업데이트
      // - 가상계좌 입금 확인
      // - 주문 완료 처리
      // - 사용자에게 알림 발송
      // - 관리자에게 알림 발송
    } else {
      console.error('[Virtual Account Notification] Deposit failed:', { orderId, resultCode, resultMsg });
    }

    // 웰컴페이먼츠에 OK 응답
    return NextResponse.json({
      resultCode: '0000',
      resultMsg: 'OK',
    });
  } catch (error) {
    console.error('[Virtual Account Notification] Error:', error);
    return NextResponse.json(
      { resultCode: '9999', resultMsg: 'ERROR' },
      { status: 500 }
    );
  }
}

