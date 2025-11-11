// lib/affiliate/purchase-confirmation.ts
// 구매확인서 자동 발송 유틸리티

import prisma from '@/lib/prisma';

// 알리고 SMS 발송 함수
async function sendAligoSMS(
  apiKey: string,
  userId: string,
  senderPhone: string,
  receiverPhone: string,
  message: string
) {
  try {
    const response = await fetch('https://apis.aligo.in/send/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        key: apiKey,
        user_id: userId,
        sender: senderPhone,
        receiver: receiverPhone,
        msg: message,
        testmode_yn: 'N',
      }),
    });

    const result = await response.json();
    return { success: result.result_code === '1', data: result };
  } catch (error) {
    console.error('[Aligo SMS] Send error:', error);
    return { success: false, error: String(error) };
  }
}

// 알리고 카카오톡 알림톡 발송 함수
async function sendAligoKakao(
  apiKey: string,
  userId: string,
  senderKey: string,
  channelId: string,
  receiverPhone: string,
  message: string,
  templateCode?: string
) {
  try {
    const response = await fetch('https://apis.aligo.in/akv10/alimtalk/send/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        key: apiKey,
        user_id: userId,
        senderkey: senderKey,
        channel: channelId,
        receiver: receiverPhone,
        message: message,
        template_code: templateCode || '',
        testmode_yn: 'N',
      }),
    });

    const result = await response.json();
    return { success: result.result_code === '1', data: result };
  } catch (error) {
    console.error('[Aligo Kakao] Send error:', error);
    return { success: false, error: String(error) };
  }
}

// 이메일 발송 함수 (nodemailer 사용)
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  fromEmail?: string,
  fromName?: string
) {
  try {
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: fromEmail && fromName ? `"${fromName}" <${fromEmail}>` : fromEmail || process.env.SMTP_USER,
      to,
      subject,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error('[Email] Send error:', error);
    return { success: false, error: String(error) };
  }
}

// 구매확인서 템플릿 생성
function generatePurchaseConfirmationTemplate(data: {
  customerName: string;
  productCode: string;
  productName?: string;
  saleAmount: number;
  saleDate: string;
  headcount?: number;
  cabinType?: string;
  fareCategory?: string;
  responsibleName: string;
  responsibleRole: '대리점장' | '판매원';
  orderCode: string;
}) {
  const formattedAmount = data.saleAmount.toLocaleString('ko-KR');
  const formattedDate = new Date(data.saleDate).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // SMS/카카오톡용 간단한 템플릿
  const smsTemplate = `[구매확인서]

${data.customerName}님, 구매해주셔서 감사합니다!

📦 상품: ${data.productName || data.productCode}
💰 결제금액: ${formattedAmount}원
📅 구매일자: ${formattedDate}
📋 주문번호: ${data.orderCode}
${data.headcount ? `👥 인원수: ${data.headcount}명` : ''}
${data.cabinType ? `🛏️ 객실타입: ${data.cabinType}` : ''}

담당 ${data.responsibleRole}: ${data.responsibleName}

추가 문의사항이 있으시면 언제든지 연락주세요.
즐거운 여행 되세요! 🛳️`;

  // 이메일용 HTML 템플릿
  const emailTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .info-row:last-child { border-bottom: none; }
    .label { font-weight: bold; color: #666; }
    .value { color: #333; }
    .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>구매확인서</h1>
      <p>구매해주셔서 감사합니다!</p>
    </div>
    <div class="content">
      <p>안녕하세요, <strong>${data.customerName}</strong>님,</p>
      <p>크루즈 여행 상품 구매가 완료되었습니다. 아래 내용을 확인해주세요.</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="label">상품명</span>
          <span class="value">${data.productName || data.productCode}</span>
        </div>
        <div class="info-row">
          <span class="label">결제금액</span>
          <span class="value"><strong>${formattedAmount}원</strong></span>
        </div>
        <div class="info-row">
          <span class="label">구매일자</span>
          <span class="value">${formattedDate}</span>
        </div>
        <div class="info-row">
          <span class="label">주문번호</span>
          <span class="value">${data.orderCode}</span>
        </div>
        ${data.headcount ? `<div class="info-row"><span class="label">인원수</span><span class="value">${data.headcount}명</span></div>` : ''}
        ${data.cabinType ? `<div class="info-row"><span class="label">객실타입</span><span class="value">${data.cabinType}</span></div>` : ''}
        ${data.fareCategory ? `<div class="info-row"><span class="label">요금카테고리</span><span class="value">${data.fareCategory}</span></div>` : ''}
        <div class="info-row">
          <span class="label">담당 ${data.responsibleRole}</span>
          <span class="value">${data.responsibleName}</span>
        </div>
      </div>
      
      <p>추가 문의사항이 있으시면 언제든지 연락주세요.</p>
      <p>즐거운 여행 되세요! 🛳️</p>
      
      <div class="footer">
        <p>본 메일은 자동으로 발송된 메일입니다.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  return {
    sms: smsTemplate,
    email: emailTemplate,
  };
}

// 구매확인서 자동 발송 함수
export async function sendPurchaseConfirmation(saleId: number) {
  try {
    // 판매 정보 조회
    const sale = await prisma.affiliateSale.findUnique({
      where: { id: saleId },
      include: {
        lead: {
          select: {
            customerName: true,
            customerPhone: true,
          },
        },
        manager: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        agent: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        product: {
          select: {
            productName: true,
          },
        },
      },
    });

    if (!sale) {
      console.error('[Purchase Confirmation] Sale not found:', saleId);
      return { success: false, error: 'Sale not found' };
    }

    // 담당자 정보 결정 (판매원 우선, 없으면 대리점장)
    const responsibleProfile = sale.agent || sale.manager;
    if (!responsibleProfile) {
      console.error('[Purchase Confirmation] No responsible affiliate found');
      return { success: false, error: 'No responsible affiliate' };
    }

    const responsibleName = responsibleProfile.displayName || responsibleProfile.user?.name || '담당자';
    const responsibleRole = sale.agent ? '판매원' : '대리점장';

    // 고객 정보
    const customerName = sale.lead?.customerName || '고객님';
    const customerPhone = sale.lead?.customerPhone;
    // 이메일은 Lead에 없으므로 metadata나 다른 소스에서 가져올 수 있음
    const customerEmail = (sale.metadata as any)?.customerEmail || null;

    // 구매확인서 템플릿 생성
    const templates = generatePurchaseConfirmationTemplate({
      customerName,
      productCode: sale.productCode,
      productName: sale.product?.productName,
      saleAmount: sale.saleAmount,
      saleDate: sale.saleDate?.toISOString() || new Date().toISOString(),
      headcount: sale.headcount || undefined,
      cabinType: sale.cabinType || undefined,
      fareCategory: sale.fareCategory || undefined,
      responsibleName,
      responsibleRole: responsibleRole as '대리점장' | '판매원',
      orderCode: sale.externalOrderCode || `ORDER-${sale.id}`,
    });

    const results: any = {
      saleId,
      customerName,
      responsibleName,
      responsibleRole,
      sent: {
        sms: false,
        kakao: false,
        email: false,
      },
      errors: [],
    };

    // 알리고 설정 가져오기 (담당자의 프로필에서)
    const aligoSettings = (responsibleProfile.metadata as any)?.aligoSettings;
    const hasAligoSettings =
      aligoSettings &&
      aligoSettings.apiKey &&
      aligoSettings.userId &&
      aligoSettings.senderPhone;

    // SMS 발송 (고객 전화번호가 있고 알리고 설정이 있는 경우)
    if (customerPhone && hasAligoSettings) {
      const smsResult = await sendAligoSMS(
        aligoSettings.apiKey,
        aligoSettings.userId,
        aligoSettings.senderPhone,
        customerPhone.replace(/[^0-9]/g, ''),
        templates.sms
      );

      if (smsResult.success) {
        results.sent.sms = true;
      } else {
        results.errors.push({ method: 'SMS', error: smsResult.error });
      }
    }

    // 카카오톡 알림톡 발송 (설정된 경우)
    if (
      customerPhone &&
      hasAligoSettings &&
      aligoSettings.kakaoSenderKey &&
      aligoSettings.kakaoChannelId
    ) {
      const kakaoResult = await sendAligoKakao(
        aligoSettings.apiKey,
        aligoSettings.userId,
        aligoSettings.kakaoSenderKey,
        aligoSettings.kakaoChannelId,
        customerPhone.replace(/[^0-9]/g, ''),
        templates.sms
      );

      if (kakaoResult.success) {
        results.sent.kakao = true;
      } else {
        results.errors.push({ method: 'KakaoTalk', error: kakaoResult.error });
      }
    }

    // 이메일 발송 (고객 이메일이 있는 경우)
    if (customerEmail) {
      const fromEmail = responsibleProfile.user?.email || process.env.SMTP_USER;
      const fromName = responsibleName;

      const emailResult = await sendEmail(
        customerEmail,
        `[구매확인서] ${sale.product?.productName || sale.productCode} 구매 완료`,
        templates.email,
        fromEmail,
        fromName
      );

      if (emailResult.success) {
        results.sent.email = true;
      } else {
        results.errors.push({ method: 'Email', error: emailResult.error });
      }
    }

    // 발송 로그 기록
    await prisma.affiliateInteraction.create({
      data: {
        leadId: sale.leadId,
        profileId: responsibleProfile.id,
        createdById: responsibleProfile.user?.id || null,
        interactionType: 'PURCHASE_CONFIRMATION_SENT',
        note: `구매확인서 발송 완료 (SMS: ${results.sent.sms}, 카카오톡: ${results.sent.kakao}, 이메일: ${results.sent.email})`,
        metadata: {
          saleId,
          sent: results.sent,
          errors: results.errors,
          sentAt: new Date().toISOString(),
        },
      },
    });

    console.log('[Purchase Confirmation] Sent:', results);

    return {
      success: results.sent.sms || results.sent.kakao || results.sent.email,
      results,
    };
  } catch (error) {
    console.error('[Purchase Confirmation] Error:', error);
    return {
      success: false,
      error: String(error),
    };
  }
}
