import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import {
  DEFAULT_PASSPORT_TEMPLATE_BODY,
  buildPassportLink,
  fillTemplate,
  sanitizeLegacyTemplateBody,
} from '@/app/api/admin/passport-request/_utils';
import { requirePartnerContext } from '@/app/api/partner/_utils';
import { AligoSendResponse } from '@/lib/aligo/client';

export const runtime = 'nodejs';

const DEFAULT_EXPIRES_HOURS = 72;

interface SendPassportRequestBody {
  leadId: number;
  aligoApiKey?: string;
  aligoUserId?: string;
  aligoSenderPhone?: string;
  templateId?: number;
  messageBody?: string;
  expiresInHours?: number;
}


function generateToken() {
  return randomBytes(24).toString('hex');
}

function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 11 && digits.startsWith('010')) return digits;
  if (digits.length === 10) return `0${digits}`;
  return digits.length >= 10 ? digits : null;
}

function formatDate(value: Date | null | undefined) {
  if (!value) return '';
  return value.toISOString().split('T')[0];
}

async function sendSmsWithCustomConfig(
  params: {
    receiver: string;
    msg: string;
    msgType: 'SMS' | 'LMS';
    title?: string;
  },
  config: {
    apiKey: string;
    userId: string;
    sender: string;
  }
): Promise<AligoSendResponse> {
  const ALIGO_BASE_URL = 'https://apis.aligo.in';
  
  const payload: Record<string, string> = {
    key: config.apiKey,
    user_id: config.userId,
    sender: config.sender,
    receiver: params.receiver,
    msg: params.msg,
    msg_type: params.msgType,
  };

  if (params.title) payload.title = params.title;

  const response = await fetch(`${ALIGO_BASE_URL}/send/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body: new URLSearchParams(payload),
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`알리고 API 요청이 실패했습니다. (${response.status}) ${text}`);
  }

  return await response.json();
}

export async function POST(req: NextRequest) {
  try {
    const { profile } = await requirePartnerContext();
    const body: SendPassportRequestBody = await req.json();

    if (!body.leadId) {
      return NextResponse.json(
        { ok: false, message: 'leadId가 필요합니다.' },
        { status: 400 }
      );
    }

    // 알리고 API 설정 확인
    if (!body.aligoApiKey || !body.aligoUserId || !body.aligoSenderPhone) {
      return NextResponse.json(
        { ok: false, message: '알리고 API 키, 사용자 ID, 발신번호를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 고객 정보 조회 (본인의 고객인지 확인)
    const lead = await prisma.affiliateLead.findFirst({
      where: {
        id: body.leadId,
        OR: [
          { managerId: profile.id },
          { agentId: profile.id },
        ],
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        Product: {
          select: {
            packageName: true,
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        { ok: false, message: '고객 정보를 찾을 수 없거나 접근 권한이 없습니다.' },
        { status: 404 }
      );
    }

    if (!lead.User) {
      return NextResponse.json(
        { ok: false, message: '고객의 사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const expiresInHours = Math.max(1, Math.min(body.expiresInHours ?? DEFAULT_EXPIRES_HOURS, 24 * 14));

    // 템플릿 가져오기
    let template: { id: number; title: string; body: string; isDefault: boolean } | null = null;
    if (body.templateId) {
      template = await prisma.passportRequestTemplate.findUnique({
        where: { id: body.templateId },
        select: {
          id: true,
          title: true,
          body: true,
          isDefault: true,
        },
      });
    }

    if (!template) {
      template = await prisma.passportRequestTemplate.findFirst({
        where: { isDefault: true },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          body: true,
          isDefault: true,
        },
      });

      if (!template) {
        template = await prisma.passportRequestTemplate.create({
          data: {
            title: '여권 제출 안내',
            body: DEFAULT_PASSPORT_TEMPLATE_BODY,
            isDefault: true,
          },
          select: {
            id: true,
            title: true,
            body: true,
            isDefault: true,
          },
        });
      }
    }

    if (template) {
      const sanitizedBody = sanitizeLegacyTemplateBody(template.body);
      if (sanitizedBody !== template.body) {
        await prisma.passportRequestTemplate.update({
          where: { id: template.id },
          data: { body: sanitizedBody },
        });
        template = { ...template, body: sanitizedBody };
      }
    }

    const baseMessage =
      body.messageBody?.trim() ||
      sanitizeLegacyTemplateBody(template?.body) ||
      DEFAULT_PASSPORT_TEMPLATE_BODY;

    if (!baseMessage) {
      return NextResponse.json(
        { ok: false, message: '메시지 내용이 비어있습니다.' },
        { status: 400 }
      );
    }

    try {
      const user = lead.User;
      const token = generateToken();
      const tokenExpiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
      const link = buildPassportLink(token);

      const personalizedMessage = fillTemplate(baseMessage, {
        고객명: lead.customerName ? `${lead.customerName}님` : '고객님',
        링크: link,
        상품명: lead.Product?.packageName ?? '',
        출발일: formatDate(lead.createdAt),
      });

      const normalizedPhone = normalizePhone(lead.customerPhone || user.phone);
      if (!normalizedPhone) {
        return NextResponse.json(
          { ok: false, message: '유효한 전화번호가 없습니다.' },
          { status: 400 }
        );
      }

      // PassportSubmission 생성 또는 업데이트
      const existingSubmission = await prisma.passportSubmission.findFirst({
        where: {
          userId: user.id,
          isSubmitted: false,
        },
        orderBy: { createdAt: 'desc' },
      });

      let submissionId: number;
      if (existingSubmission) {
        const updated = await prisma.passportSubmission.update({
          where: { id: existingSubmission.id },
          data: {
            token,
            tokenExpiresAt,
            isSubmitted: false,
            updatedAt: new Date(),
            extraData: Prisma.JsonNull,
          },
        });
        submissionId = updated.id;
      } else {
        const created = await prisma.passportSubmission.create({
          data: {
            user: { connect: { id: user.id } },
            token,
            tokenExpiresAt,
            isSubmitted: false,
            driveFolderUrl: null,
            extraData: Prisma.JsonNull,
          },
        });
        submissionId = created.id;
      }

      // AffiliateLead의 passportRequestedAt 업데이트
      await prisma.affiliateLead.update({
        where: { id: lead.id },
        data: {
          passportRequestedAt: new Date(),
        },
      });

      const messageByteLength = new TextEncoder().encode(personalizedMessage).length;
      const msgType: 'SMS' | 'LMS' = messageByteLength > 90 ? 'LMS' : 'SMS';

      let sendResponse: AligoSendResponse | null = null;
      let sendError: string | null = null;

      try {
        sendResponse = await sendSmsWithCustomConfig(
          {
            receiver: normalizedPhone,
            msg: personalizedMessage,
            msgType,
            title: template?.title || '여권 제출 안내',
          },
          {
            apiKey: body.aligoApiKey,
            userId: body.aligoUserId,
            sender: body.aligoSenderPhone,
          }
        );

        if (String(sendResponse.result_code) !== '1') {
          sendError = sendResponse.message
            ? String(sendResponse.message)
            : `알리고 오류 (코드: ${sendResponse.result_code})`;
        }
      } catch (sendErr) {
        console.error(`[PartnerPassportRequest] Aligo send error for lead ${lead.id}:`, sendErr);
        sendError = sendErr instanceof Error ? sendErr.message : '알 수 없는 오류가 발생했습니다.';
      }

      if (sendError) {
        return NextResponse.json({
          ok: false,
          message: sendError,
          resultCode: sendResponse?.result_code,
        });
      }

      // PassportRequestLog 기록 (관리자 ID는 파트너의 사용자 ID 사용)
      try {
        const adminUserId = profile.user?.id;
        if (adminUserId) {
          await prisma.passportRequestLog.create({
            data: {
              userId: user.id,
              adminId: adminUserId,
              templateId: template?.id ?? null,
              messageBody: personalizedMessage,
              messageChannel: 'SMS',
              status: 'SUCCESS',
              errorReason: null,
              sentAt: new Date(),
            },
          });
        }
      } catch (logError) {
        console.error('[PartnerPassportRequest] Failed to insert request log:', logError);
      }

      return NextResponse.json({
        ok: true,
        result: {
          leadId: lead.id,
          success: true,
          link,
          token,
          submissionId,
          message: personalizedMessage,
          messageId: sendResponse?.message_id || (sendResponse?.msg_id as string | undefined) || null,
          resultCode: sendResponse?.result_code,
        },
      });
    } catch (error) {
      console.error(`[PartnerPassportRequest] send error for lead ${body.leadId}:`, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        { ok: false, message },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ ok: false, message: '로그인이 필요합니다.' }, { status: 401 });
    }
    console.error('[PartnerPassportRequest] POST /send error:', error);
    return NextResponse.json(
      { ok: false, message: '여권 요청 발송 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

