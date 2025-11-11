import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { requireAdminUser } from '../_utils';

const MAX_LIMIT = 200;

type RoleFilter = 'all' | 'guide' | 'mall' | 'test';

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() ?? '';
    const statusFilter = searchParams.get('status')?.trim() ?? '';
    const roleFilterParam = (searchParams.get('role')?.trim() ?? 'all') as RoleFilter;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const limitParam = parseInt(searchParams.get('limit') ?? '100', 10);
    const take = Math.min(Math.max(limitParam || 100, 1), MAX_LIMIT);
    const skip = (page - 1) * take;

    const where: Prisma.UserWhereInput = {
      role: { not: 'admin' },
    };

    const appendAndCondition = (condition: Prisma.UserWhereInput) => {
      if (!where.AND) {
        where.AND = [condition];
      } else if (Array.isArray(where.AND)) {
        where.AND = [...where.AND, condition];
      } else {
        where.AND = [where.AND, condition];
      }
    };

    switch (roleFilterParam) {
      case 'guide':
        where.role = 'user';
        appendAndCondition({
          OR: [
            { customerStatus: null },
            { customerStatus: { not: 'test' } },
          ],
        });
        break;
      case 'mall':
        where.role = 'community';
        break;
      case 'test':
        where.role = 'user';
        where.customerStatus = 'test';
        break;
      default:
        break;
    }

    if (search) {
      const normalizedPhone = search.replace(/\D/g, '');
      const orConditions: Prisma.UserWhereInput[] = [
        {
          name: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        } as Prisma.UserWhereInput,
        {
          email: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        } as Prisma.UserWhereInput,
        { phone: { contains: search } },
      ];

      if (normalizedPhone.length >= 3 && normalizedPhone !== search) {
        orConditions.push({ phone: { contains: normalizedPhone } });
      }

      where.OR = orConditions;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        createdAt: true,
        tripCount: true,
        customerStatus: true,
        Trip: {
          orderBy: { startDate: 'desc' },
          take: 1,
          select: {
            id: true,
            cruiseName: true,
            startDate: true,
            endDate: true,
            reservationCode: true,
            productId: true,
          },
        },
        PassportSubmissions: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: {
            id: true,
            tripId: true,
            token: true,
            tokenExpiresAt: true,
            isSubmitted: true,
            submittedAt: true,
            updatedAt: true,
            createdAt: true,
          },
        },
        PassportRequestLogsReceived: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            messageChannel: true,
            sentAt: true,
            admin: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const records = users.map((user) => {
      const latestSubmission = user.PassportSubmissions[0] ?? null;
      const latestLog = user.PassportRequestLogsReceived[0] ?? null;
      const latestTrip = user.Trip[0] ?? null;

      const submissionStatus = latestSubmission
        ? latestSubmission.isSubmitted
          ? 'submitted'
          : 'pending'
        : 'not_requested';

      return {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        customerStatus: user.customerStatus,
        createdAt: user.createdAt.toISOString(),
        tripCount: user.tripCount,
        latestTrip: latestTrip
          ? {
              id: latestTrip.id,
              cruiseName: latestTrip.cruiseName,
              reservationCode: latestTrip.reservationCode,
              productId: latestTrip.productId,
              startDate: latestTrip.startDate?.toISOString() ?? null,
              endDate: latestTrip.endDate?.toISOString() ?? null,
            }
          : null,
        submission: latestSubmission
          ? {
              id: latestSubmission.id,
              tripId: latestSubmission.tripId,
              token: latestSubmission.token,
              tokenExpiresAt: latestSubmission.tokenExpiresAt.toISOString(),
              isSubmitted: latestSubmission.isSubmitted,
              submittedAt: latestSubmission.submittedAt?.toISOString() ?? null,
              createdAt: latestSubmission.createdAt.toISOString(),
              updatedAt: latestSubmission.updatedAt.toISOString(),
            }
          : null,
        lastRequest: latestLog
          ? {
              id: latestLog.id,
              status: latestLog.status,
              messageChannel: latestLog.messageChannel,
              sentAt: latestLog.sentAt.toISOString(),
              admin: latestLog.admin,
            }
          : null,
        submissionStatus,
      };
    });

    const filtered = records.filter((record) => {
      if (!statusFilter) return true;
      if (statusFilter === 'submitted') {
        return record.submissionStatus === 'submitted';
      }
      if (statusFilter === 'pending') {
        return record.submissionStatus === 'pending';
      }
      if (statusFilter === 'not_requested') {
        return record.submissionStatus === 'not_requested';
      }
      if (statusFilter === 'no_request') {
        return record.lastRequest === null;
      }
      return true;
    });

    return NextResponse.json({
      ok: true,
      data: filtered,
      meta: {
        page,
        limit: take,
        count: filtered.length,
      },
    });
  } catch (error) {
    console.error('[PassportRequest] GET /customers error:', error);
    return NextResponse.json(
      { ok: false, message: 'Failed to load passport request customers.' },
      { status: 500 }
    );
  }
}
