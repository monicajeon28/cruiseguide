import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: {
    token: string;
  };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const token = params.token;
    if (!token || token.length < 10) {
      return NextResponse.json({ ok: false, error: '잘못된 토큰입니다.' }, { status: 400 });
    }

    const submission = await prisma.passportSubmission.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            role: true,
            customerStatus: true,
          },
        },
        trip: {
          select: {
            id: true,
            cruiseName: true,
            startDate: true,
            endDate: true,
            reservationCode: true,
          },
        },
        guests: {
          orderBy: { groupNumber: 'asc' },
          select: {
            id: true,
            groupNumber: true,
            name: true,
            phone: true,
            passportNumber: true,
            nationality: true,
            dateOfBirth: true,
            passportExpiryDate: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ ok: false, error: '토큰이 유효하지 않습니다.' }, { status: 404 });
    }

    const now = new Date();
    const isExpired = submission.tokenExpiresAt.getTime() < now.getTime();
    const extraData = submission.extraData && typeof submission.extraData === 'object' ? submission.extraData : {};
    const passportFiles = Array.isArray(extraData?.passportFiles) ? extraData.passportFiles : [];
    const storedGroups = Array.isArray(extraData?.groups) ? extraData.groups : [];

    return NextResponse.json({
      ok: true,
      submission: {
        id: submission.id,
        token: submission.token,
        expiresAt: submission.tokenExpiresAt.toISOString(),
        isExpired,
        isSubmitted: submission.isSubmitted,
        submittedAt: submission.submittedAt?.toISOString() ?? null,
        driveFolderUrl: submission.driveFolderUrl,
        extraData: {
          passportFiles,
          groups: storedGroups,
          remarks: extraData?.remarks ?? '',
        },
      },
      user: submission.user,
      trip: submission.trip
        ? {
            id: submission.trip.id,
            cruiseName: submission.trip.cruiseName,
            startDate: submission.trip.startDate?.toISOString() ?? null,
            endDate: submission.trip.endDate?.toISOString() ?? null,
            reservationCode: submission.trip.reservationCode,
          }
        : null,
      guests: submission.guests.map((guest) => ({
        id: guest.id,
        groupNumber: guest.groupNumber,
        name: guest.name,
        phone: guest.phone,
        passportNumber: guest.passportNumber,
        nationality: guest.nationality,
        dateOfBirth: guest.dateOfBirth?.toISOString() ?? null,
        passportExpiryDate: guest.passportExpiryDate?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    console.error('[Passport] GET /passport/:token error:', error);
    return NextResponse.json({ ok: false, error: '토큰 정보를 불러오지 못했습니다.' }, { status: 500 });
  }
}
