import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import {
  DEFAULT_PASSPORT_TEMPLATE_BODY,
  requireAdminUser,
  buildPassportLink,
  fillTemplate,
  sanitizeLegacyTemplateBody,
} from '../_utils';
import { sendSms, fetchRemain, parseCashValue, AligoSendResponse, AligoRemainResponse } from '@/lib/aligo/client';

export const runtime = 'nodejs';

const VALID_CHANNELS = new Set(['SMS', 'KAKAO', 'ALIMTALK']);
const DEFAULT_EXPIRES_HOURS = 72;
const ALIGO_LOW_BALANCE_THRESHOLD = Number(process.env.ALIGO_REMAIN_ALERT_THRESHOLD ?? '0');

interface SendPassportRequestBody {
  userIds: Array<number | string>;
  templateId?: number;
  messageBody?: string;
  channel?: string;
  expiresInHours?: number;
}

type SendResultItem = {
  userId: number;
  success: boolean;
  link?: string;
  token?: string;
  submissionId?: number;
  message?: string;
  error?: string;
  messageId?: string | null;
  resultCode?: string;
};

type PassportSendUser = {
  id: number;
  name: string | null;
  phone: string | null;
  role: string;
  Trip: Array<{
    id: number;
    cruiseName: string | null;
    startDate: Date | null;
    endDate: Date | null;
    reservationCode: string | null;
    productId: number | null;
  }>;
  PassportSubmissions: Array<{
    id: number;
    isSubmitted: boolean;
    tripId: number | null;
  }>;
};

function generateToken() {
  return randomBytes(24).toString('hex');
}

function formatDate(value: Date | null | undefined) {
  if (!value) return '';
  return value.toISOString().split('T')[0];
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body: SendPassportRequestBody = await req.json();
    const rawUserIds = body.userIds || [];

    if (!Array.isArray(rawUserIds) || rawUserIds.length === 0) {
      return NextResponse.json(
        { ok: false, message: 'userIds must be a non-empty array.' },
        { status: 400 }
      );
    }

    const userIds = rawUserIds
      .map((id) => (typeof id === 'string' ? parseInt(id, 10) : id))
      .filter((id): id is number => typeof id === 'number' && !Number.isNaN(id));

    if (userIds.length === 0) {
      return NextResponse.json(
        { ok: false, message: 'No valid userIds provided.' },
        { status: 400 }
      );
    }

    const expiresInHours = Math.max(1, Math.min(body.expiresInHours ?? DEFAULT_EXPIRES_HOURS, 24 * 14));
    const channel = (body.channel || 'SMS').toUpperCase();
    const messageChannel = VALID_CHANNELS.has(channel) ? channel : 'SMS';

    if (messageChannel !== 'SMS') {
      return NextResponse.json(
        { ok: false, message: '현재는 SMS 채널만 지원합니다. 알림톡 발송은 추후 지원 예정입니다.' },
        { status: 400 }
      );
    }

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
      if (!template) {
        return NextResponse.json(
          { ok: false, message: 'Template not found.' },
          { status: 404 }
        );
      }
    } else {
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
        { ok: false, message: 'Message body cannot be empty.' },
        { status: 400 }
      );
    }

    const users = (await prisma.user.findMany({
      where: {
        id: { in: userIds },
        role: { not: 'admin' },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        Trip: {
          orderBy: { startDate: 'desc' },
          take: 1,
          select: {
            id: true,
            cruiseName: true,
            startDate: true,
            endDate: true,
            reservationCode: true,
          },
        },
        PassportSubmissions: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: {
            id: true,
            isSubmitted: true,
            tripId: true,
          },
        },
      },
    })) as PassportSendUser[];

    const usersById = new Map<number, PassportSendUser>(users.map((user) => [user.id, user]));
    const missingUserIds = userIds.filter((id) => !usersById.has(id));

    const results: Array<SendResultItem> = [];
    let aligoRemain: AligoRemainResponse | null = null;
    let remainingCash: number | null = null;
    let lowBalance = false;

    for (const userId of userIds) {
      const user = usersById.get(userId);

      if (!user) {
        results.push({ userId, success: false, error: 'User not found.' });
        continue;
      }

      try {
        const latestTrip = user.Trip[0] ?? null;
        const existingSubmission = user.PassportSubmissions[0] ?? null;
        const token = generateToken();
        const tokenExpiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
        const link = buildPassportLink(token);

        const personalizedMessage = fillTemplate(baseMessage, {
          고객명: user.name ? `${user.name}님` : '고객님',
          링크: link,
          상품명: latestTrip?.cruiseName ?? '',
          출발일: formatDate(latestTrip?.startDate ?? null),
        });

        const normalizedPhone = normalizePhone(user.phone);
        if (!normalizedPhone) {
          const errorMessage = '유효한 전화번호가 없습니다.';
          await recordPassportLog({
            userId: user.id,
            adminId: admin.id,
            templateId: template?.id ?? null,
            messageBody: personalizedMessage,
            messageChannel,
            status: 'FAILED',
            errorReason: errorMessage,
          });
          results.push({ userId: user.id, success: false, error: errorMessage });
          continue;
        }

        let submissionId: number;

        if (existingSubmission && !existingSubmission.isSubmitted) {
          const updated = await prisma.passportSubmission.update({
            where: { id: existingSubmission.id },
            data: {
              token,
              tokenExpiresAt,
              tripId: latestTrip?.id ?? existingSubmission.tripId,
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
              trip: latestTrip ? { connect: { id: latestTrip.id } } : undefined,
              token,
              tokenExpiresAt,
              isSubmitted: false,
              driveFolderUrl: null,
              extraData: Prisma.JsonNull,
            },
          });
          submissionId = created.id;
        }

        const messageByteLength = new TextEncoder().encode(personalizedMessage).length;
        const msgType: 'SMS' | 'LMS' = messageByteLength > 90 ? 'LMS' : 'SMS';

        let sendResponse: AligoSendResponse | null = null;
        let sendError: string | null = null;

        try {
          sendResponse = await sendSms({
            receiver: normalizedPhone,
            msg: personalizedMessage,
            msgType,
            title: template?.title || '여권 제출 안내',
          });

          if (String(sendResponse.result_code) !== '1') {
            sendError = sendResponse.message
              ? String(sendResponse.message)
              : `알리고 오류 (코드: ${sendResponse.result_code})`;
          }
        } catch (sendErr) {
          console.error(`[PassportRequest] Aligo send error for user ${user.id}:`, sendErr);
          sendError = sendErr instanceof Error ? sendErr.message : '알 수 없는 오류가 발생했습니다.';
        }

        const status = sendError ? 'FAILED' : 'SUCCESS';
        const messageId = sendResponse?.message_id || (sendResponse?.msg_id as string | undefined) || null;

        await recordPassportLog({
          userId: user.id,
          adminId: admin.id,
          templateId: template?.id ?? null,
          messageBody: personalizedMessage,
          messageChannel,
          status,
          errorReason: sendError,
        });

        if (sendError) {
          results.push({
            userId: user.id,
            success: false,
            error: sendError,
            resultCode: sendResponse?.result_code,
          });
          continue;
        }

        results.push({
          userId: user.id,
          success: true,
          link,
          token,
          submissionId,
          message: personalizedMessage,
          messageId,
          resultCode: sendResponse?.result_code,
        });
      } catch (error) {
        console.error(`[PassportRequest] send error for user ${user.id}:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        await recordPassportLog({
          userId: user.id,
          adminId: admin.id,
          templateId: template?.id ?? null,
          messageBody: baseMessage,
          messageChannel,
          status: 'FAILED',
          errorReason: message,
        });
        results.push({ userId: user.id, success: false, error: message });
      }
    }

    try {
      const remainResponse = await fetchRemain();
      aligoRemain = remainResponse;
      remainingCash = parseCashValue(remainResponse);
      lowBalance = typeof remainingCash === 'number' && ALIGO_LOW_BALANCE_THRESHOLD > 0
        ? remainingCash <= ALIGO_LOW_BALANCE_THRESHOLD
        : false;
    } catch (remainError) {
      console.error('[PassportRequest] Failed to fetch Aligo remaining balance:', remainError);
    }

    return NextResponse.json({
      ok: true,
      channel: messageChannel,
      expiresInHours,
      results,
      missingUserIds,
      aligoRemain: aligoRemain ?? undefined,
      remainingCash: remainingCash ?? undefined,
      lowBalance,
    });
  } catch (error) {
    console.error('[PassportRequest] POST /send error:', error);
    return NextResponse.json(
      { ok: false, message: 'Failed to send passport request.' },
      { status: 500 }
    );
  }
}

function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 11 && digits.startsWith('010')) return digits;
  if (digits.length === 10) return `0${digits}`;
  return digits.length >= 10 ? digits : null;
}

async function recordPassportLog(params: {
  userId: number;
  adminId: number;
  templateId: number | null;
  messageBody: string;
  messageChannel: string;
  status: 'SUCCESS' | 'FAILED';
  errorReason?: string | null;
}) {
  const { userId, adminId, templateId, messageBody, messageChannel, status, errorReason } = params;

  try {
    await prisma.passportRequestLog.create({
      data: {
        userId,
        adminId,
        templateId,
        messageBody,
        messageChannel,
        status,
        errorReason: errorReason ?? null,
        sentAt: new Date(),
      },
    });
  } catch (error) {
    console.error('[PassportRequest] Failed to insert request log:', error);
  }
}
