import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: {
    token: string;
  };
}

interface GuestPayload {
  name: string;
  phone?: string;
  passportNumber?: string;
  nationality?: string;
  dateOfBirth?: string;
  passportExpiryDate?: string;
}

interface GroupPayload {
  groupNumber: number;
  guests: GuestPayload[];
}

interface SubmitPayload {
  groups: GroupPayload[];
  remarks?: string;
}

const MAX_GROUPS = 30;

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const token = params.token;
    if (!token || token.length < 10) {
      return NextResponse.json({ ok: false, error: '잘못된 토큰입니다.' }, { status: 400 });
    }

    const body = (await req.json()) as SubmitPayload;
    if (!body || !Array.isArray(body.groups)) {
      return NextResponse.json({ ok: false, error: '제출할 그룹 정보가 필요합니다.' }, { status: 400 });
    }

    const submission = await prisma.passportSubmission.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!submission) {
      return NextResponse.json({ ok: false, error: '토큰이 유효하지 않습니다.' }, { status: 404 });
    }

    if (submission.tokenExpiresAt.getTime() < Date.now()) {
      return NextResponse.json({ ok: false, error: '제출 가능 시간이 만료되었습니다.' }, { status: 410 });
    }

    const validGroups = body.groups
      .slice(0, MAX_GROUPS)
      .map((group) => ({
        groupNumber: Number(group.groupNumber),
        guests: Array.isArray(group.guests) ? group.guests : [],
      }))
      .filter((group) => group.groupNumber >= 1 && group.groupNumber <= MAX_GROUPS);

    if (validGroups.length === 0) {
      return NextResponse.json({ ok: false, error: '최소 한 개 이상의 그룹이 필요합니다.' }, { status: 400 });
    }

    const guestRecords = validGroups.flatMap((group) => {
      return group.guests
        .map((guest) => ({
          groupNumber: group.groupNumber,
          name: guest.name?.trim() ?? '',
          phone: guest.phone?.trim() || null,
          passportNumber: guest.passportNumber?.trim() || null,
          nationality: guest.nationality?.trim() || null,
          dateOfBirth: guest.dateOfBirth ? new Date(guest.dateOfBirth) : null,
          passportExpiryDate: guest.passportExpiryDate ? new Date(guest.passportExpiryDate) : null,
        }))
        .filter((guest) => guest.name.length > 0);
    });

    if (guestRecords.length === 0) {
      return NextResponse.json({ ok: false, error: '각 그룹에 최소 한 명 이상의 탑승자를 입력해주세요.' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.passportSubmissionGuest.deleteMany({ where: { submissionId: submission.id } });
      await tx.passportSubmissionGuest.createMany({
        data: guestRecords.map((guest) => ({
          submissionId: submission.id,
          groupNumber: guest.groupNumber,
          name: guest.name,
          phone: guest.phone,
          passportNumber: guest.passportNumber,
          nationality: guest.nationality,
          dateOfBirth: guest.dateOfBirth,
          passportExpiryDate: guest.passportExpiryDate,
        })),
      });

      await tx.passportSubmission.update({
        where: { id: submission.id },
        data: {
          isSubmitted: true,
          submittedAt: new Date(),
          extraData: {
            ...(submission.extraData ?? {}),
            groups: validGroups.map((group) => ({
              groupNumber: group.groupNumber,
              guests: group.guests,
            })),
            remarks: body.remarks ?? '',
          },
        },
      });

      const latestLog = await tx.passportRequestLog.findFirst({
        where: { userId: submission.userId },
        orderBy: { sentAt: 'desc' },
      });
      if (latestLog) {
        await tx.passportRequestLog.update({
          where: { id: latestLog.id },
          data: {
            status: 'SUCCESS',
            errorReason: null,
          },
        });
      }
    });

    return NextResponse.json({ ok: true, message: '여권 정보가 제출되었습니다.' });
  } catch (error) {
    console.error('[Passport] POST /passport/:token/submit error:', error);
    return NextResponse.json({ ok: false, error: '제출 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
