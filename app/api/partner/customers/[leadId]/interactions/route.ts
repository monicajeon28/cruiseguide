import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import {
  PartnerApiError,
  ensureValidLeadStatus,
  getPartnerLead,
  requirePartnerContext,
} from '@/app/api/partner/_utils';
import { toNullableString } from '@/app/api/admin/affiliate/profiles/shared';

type RouteContext = {
  params: {
    leadId: string;
  };
};

function parseLeadId(raw: string | undefined) {
  const id = Number(raw);
  if (!raw || Number.isNaN(id) || id <= 0) {
    throw new PartnerApiError('유효한 고객 ID가 필요합니다.', 400);
  }
  return id;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { profile } = await requirePartnerContext();
    const leadId = parseLeadId(context.params.leadId);

    await getPartnerLead(profile.id, leadId, { interactions: 1 });

    const interactions = await prisma.affiliateInteraction.findMany({
      where: { leadId },
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      take: 100,
      select: {
        id: true,
        interactionType: true,
        occurredAt: true,
        note: true,
        profileId: true,
        createdById: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      interactions: interactions.map((interaction) => ({
        id: interaction.id,
        interactionType: interaction.interactionType,
        occurredAt: interaction.occurredAt.toISOString(),
        note: interaction.note ?? null,
        profileId: interaction.profileId,
        createdById: interaction.createdById,
        createdBy: interaction.createdBy
          ? {
              id: interaction.createdBy.id,
              name: interaction.createdBy.name,
              phone: interaction.createdBy.phone,
            }
          : null,
      })),
    });
  } catch (error) {
    if (error instanceof PartnerApiError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    console.error(`GET /api/partner/customers/${context.params.leadId}/interactions error:`, error);
    return NextResponse.json({ ok: false, message: '상담 기록을 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { profile, sessionUser } = await requirePartnerContext();
    const leadId = parseLeadId(context.params.leadId);
    const payload = await req.json().catch(() => ({}));

    const interactionType = toNullableString(payload.interactionType) ?? 'NOTE';
    const note = toNullableString(payload.note);

    if (!note) {
      throw new PartnerApiError('상담 메모를 입력해주세요.', 400);
    }

    await getPartnerLead(profile.id, leadId, { interactions: 1 });

    let occurredAt = new Date();
    if (payload.occurredAt) {
      const parsed = new Date(payload.occurredAt);
      if (!Number.isNaN(parsed.getTime())) {
        occurredAt = parsed;
      }
    }

    let nextActionAt: Date | null = null;
    if (payload.nextActionAt) {
      const parsed = new Date(payload.nextActionAt);
      if (!Number.isNaN(parsed.getTime())) {
        nextActionAt = parsed;
      }
    }

    const status = ensureValidLeadStatus(payload.status);

    const result = await prisma.$transaction(async (tx) => {
      const createdInteraction = await tx.affiliateInteraction.create({
        data: {
          leadId,
          profileId: profile.id,
          createdById: sessionUser.id,
          interactionType,
          occurredAt,
          note,
        },
        select: {
          id: true,
          interactionType: true,
          occurredAt: true,
          note: true,
          profileId: true,
          createdById: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      });

      const updateData: Prisma.AffiliateLeadUpdateInput = {
        lastContactedAt: occurredAt,
      };

      if (nextActionAt !== null) {
        updateData.nextActionAt = nextActionAt;
      }

      if (status) {
        updateData.status = status;
      }

      if (payload.notes !== undefined) {
        updateData.notes = toNullableString(payload.notes);
      }

      await tx.affiliateLead.update({
        where: { id: leadId },
        data: updateData,
      });

      return createdInteraction;
    });

    const interactions = await prisma.affiliateInteraction.findMany({
      where: { leadId },
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      take: 50,
      select: {
        id: true,
        interactionType: true,
        occurredAt: true,
        note: true,
        profileId: true,
        createdById: true,
        createdBy: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      interaction: {
        id: result.id,
        interactionType: result.interactionType,
        occurredAt: result.occurredAt.toISOString(),
        note: result.note ?? null,
        profileId: result.profileId,
        createdById: result.createdById,
        createdBy: result.createdBy
          ? {
              id: result.createdBy.id,
              name: result.createdBy.name,
              phone: result.createdBy.phone,
            }
          : null,
      },
      interactions: interactions.map((interaction) => ({
        id: interaction.id,
        interactionType: interaction.interactionType,
        occurredAt: interaction.occurredAt.toISOString(),
        note: interaction.note ?? null,
        profileId: interaction.profileId,
        createdById: interaction.createdById,
        createdBy: interaction.createdBy
          ? {
              id: interaction.createdBy.id,
              name: interaction.createdBy.name,
              phone: interaction.createdBy.phone,
            }
          : null,
      })),
    });
  } catch (error) {
    if (error instanceof PartnerApiError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    console.error(`POST /api/partner/customers/${context.params.leadId}/interactions error:`, error);
    return NextResponse.json({ ok: false, message: '상담 기록을 저장하지 못했습니다.' }, { status: 500 });
  }
}
