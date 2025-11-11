import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

// 웰컴페이먼츠 결제 요청 API
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productCode, amount, buyerName, buyerEmail, buyerTel, roomSelections, chatSessionId } = body;

    // 필수 필드 검증
    if (!productCode || !amount || !buyerName || !buyerTel) {
      return NextResponse.json(
        { ok: false, error: '필수 정보를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 어필리에이트 추적 정보 (쿠키에서 읽기)
    const cookies = req.cookies;
    const affiliateCode = cookies.get('affiliate_code')?.value || null;
    const affiliateMallUserId = cookies.get('affiliate_mall_user_id')?.value || null;

    // 방 선택 정보 검증
    if (!roomSelections || !Array.isArray(roomSelections) || roomSelections.length === 0) {
      return NextResponse.json(
        { ok: false, error: '객실을 선택해주세요.' },
        { status: 400 }
      );
    }

    // 총 인원 수 확인
    const totalGuests = roomSelections.reduce((sum: number, selection: any) => {
      return sum + (selection.adult || 0) + (selection.adult3rd || 0) + 
             (selection.child2to11 || 0) + (selection.infantUnder2 || 0);
    }, 0);

    if (totalGuests === 0) {
      return NextResponse.json(
        { ok: false, error: '최소 1명 이상 선택해주세요.' },
        { status: 400 }
      );
    }

    // 상품 정보 확인
    const product = await prisma.cruiseProduct.findUnique({
      where: { productCode },
      select: { id: true, packageName: true, basePrice: true },
    });

    if (!product) {
      return NextResponse.json(
        { ok: false, error: '상품을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 환경 변수에서 PG 설정 가져오기
    const pgSignkey = process.env.PG_SIGNKEY;
    const pgFieldEncryptIv = process.env.PG_FIELD_ENCRYPT_IV;
    const pgFieldEncryptKey = process.env.PG_FIELD_ENCRYPT_KEY;
    const pgMidAuth = process.env.PG_MID_AUTH; // 인증 MID
    const pgMidNonAuth = process.env.PG_MID_NON_AUTH; // 비인증 MID
    const pgSignkeyNonAuth = process.env.PG_SIGNKEY_NON_AUTH; // 비인증 Signkey
    const pgFieldEncryptIvNonAuth = process.env.PG_FIELD_ENCRYPT_IV_NON_AUTH; // 비인증 필드암호화 IV
    const pgFieldEncryptKeyNonAuth = process.env.PG_FIELD_ENCRYPT_KEY_NON_AUTH; // 비인증 필드암호화 KEY

    // 결제 방식 선택 (기본값: 인증 결제, 필요시 비인증으로 변경 가능)
    const useNonAuth = false; // TODO: 결제 방식 선택 로직 추가 필요
    const selectedMid = useNonAuth ? pgMidNonAuth : pgMidAuth;
    const selectedSignkey = useNonAuth ? pgSignkeyNonAuth : pgSignkey;
    const selectedFieldEncryptIv = useNonAuth ? pgFieldEncryptIvNonAuth : pgFieldEncryptIv;
    const selectedFieldEncryptKey = useNonAuth ? pgFieldEncryptKeyNonAuth : pgFieldEncryptKey;

    if (!selectedSignkey || !selectedFieldEncryptIv || !selectedFieldEncryptKey || !selectedMid) {
      return NextResponse.json(
        { ok: false, error: 'PG 결제 설정이 완료되지 않았습니다.' },
        { status: 500 }
      );
    }

    // 주문번호 생성 (타임스탬프 + 랜덤)
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

    // 어필리에이트 정보를 metadata에 포함
    const metadata: any = {
      productCode,
      roomSelections,
      totalGuests,
      chatSessionId: chatSessionId || null,
    };

    if (affiliateCode) {
      metadata.affiliateCode = affiliateCode;
    }
    if (affiliateMallUserId) {
      metadata.partnerId = affiliateMallUserId;
    }

    // 결제 요청 데이터 생성
    const paymentData = {
      // 기본 정보
      mid: selectedMid,
      orderId,
      amount: parseInt(String(amount)),
      productName: product.packageName,
      
      // 구매자 정보
      buyerName,
      buyerEmail: buyerEmail || '',
      buyerTel,
      
      // 상품 정보
      productCode,
      
      // 방 선택 정보
      roomSelections: roomSelections || [],
      totalGuests,
      
      // 어필리에이트 정보 (metadata에 포함)
      metadata,
      
      // 콜백 URL
      returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payment/callback`,
      notifyUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payment/notify`,
    };

    // Signkey로 서명 생성 (웰컴페이먼츠 방식에 맞게 수정 필요)
    const signData = `${paymentData.mid}${paymentData.orderId}${paymentData.amount}${selectedSignkey}`;
    const signature = crypto.createHash('sha256').update(signData).digest('hex').toUpperCase();

    // 결제 정보를 DB에 저장 (임시)
    // TODO: Payment 테이블 생성 필요
    // await prisma.payment.create({
    //   data: {
    //     orderId,
    //     productCode,
    //     amount: paymentData.amount,
    //     buyerName,
    //     buyerEmail: buyerEmail || null,
    //     buyerTel,
    //     status: 'pending',
    //   }
    // });

    return NextResponse.json({
      ok: true,
      orderId,
      paymentData: {
        ...paymentData,
        signature,
        fieldEncryptIv: selectedFieldEncryptIv,
        fieldEncryptKey: selectedFieldEncryptKey,
      },
      message: '결제 요청이 생성되었습니다.',
    });
  } catch (error) {
    console.error('[Payment Request] Error:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : '결제 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
