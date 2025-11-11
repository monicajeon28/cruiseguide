import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import {
  PartnerApiError,
  ensureValidLeadStatus,
  normalizePhoneInput,
  partnerLeadInclude,
  phoneSearchVariants,
  requirePartnerContext,
  resolveCounterpart,
  resolveOwnership,
  serializeLead,
} from '@/app/api/partner/_utils';
import { toNullableString } from '@/app/api/admin/affiliate/profiles/shared';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10) || 1, 1);
  const requestedLimit = parseInt(searchParams.get('limit') ?? `${DEFAULT_PAGE_SIZE}`, 10) || DEFAULT_PAGE_SIZE;
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_PAGE_SIZE);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function buildOrderBy(sort: string | null) {
  switch (sort) {
    case 'nextAction':
      return [{ nextActionAt: 'asc' }, { createdAt: 'desc' }] as Prisma.AffiliateLeadOrderByWithRelationInput[];
    case 'lastContacted':
      return [{ lastContactedAt: 'desc' }, { updatedAt: 'desc' }];
    case 'recent':
    default:
      return [{ updatedAt: 'desc' }, { createdAt: 'desc' }];
  }
}

export async function GET(req: NextRequest) {
  try {
    const { profile } = await requirePartnerContext();
    const { searchParams } = new URL(req.url);

    const { page, limit, skip } = parsePagination(searchParams);
    const statusFilter = ensureValidLeadStatus(searchParams.get('status'));
    const query = searchParams.get('q')?.trim() || '';
    const sort = searchParams.get('sort');

    const where: Prisma.AffiliateLeadWhereInput = {
      OR: [{ managerId: profile.id }, { agentId: profile.id }],
    };

    if (statusFilter) {
      where.status = statusFilter;
    }

    if (query) {
      const variants = phoneSearchVariants(query);
      where.AND = [
        {
          OR: [
            { customerName: { contains: query, mode: 'insensitive' } },
            ...(variants.length
              ? variants.map((variant) => ({
                  customerPhone: {
                    contains: variant,
                  },
                }))
              : []),
          ],
        },
      ];
    }

    const total = await prisma.affiliateLead.count({ where });

    const leads = await prisma.affiliateLead.findMany({
      where,
      orderBy: buildOrderBy(sort),
      skip,
      take: limit,
      include: {
        ...partnerLeadInclude,
        interactions: {
          ...partnerLeadInclude.interactions,
          take: 1,
        },
        sales: {
          ...partnerLeadInclude.sales,
          take: 3,
        },
      },
    });

    const leadIds = leads.map((lead) => lead.id);

    const saleSummaryMap = new Map<
      number,
      {
        totalSalesCount: number;
        totalSalesAmount: number;
        totalNetRevenue: number;
        confirmedSalesCount: number;
        confirmedSalesAmount: number;
        lastSaleAt: string | null;
        lastSaleStatus: string | null;
      }
    >();

    if (leadIds.length) {
      const saleGroups = await prisma.affiliateSale.groupBy({
        by: ['leadId', 'status'],
        where: { leadId: { in: leadIds } },
        _count: { _all: true },
        _sum: { saleAmount: true, netRevenue: true },
      });

      saleGroups.forEach((row) => {
        if (row.leadId === null) return;
        const entry =
          saleSummaryMap.get(row.leadId) ?? {
            totalSalesCount: 0,
            totalSalesAmount: 0,
            totalNetRevenue: 0,
            confirmedSalesCount: 0,
            confirmedSalesAmount: 0,
            lastSaleAt: null,
            lastSaleStatus: null,
          };

        entry.totalSalesCount += row._count._all ?? 0;
        entry.totalSalesAmount += row._sum.saleAmount ?? 0;
        entry.totalNetRevenue += row._sum.netRevenue ?? 0;

        if (['CONFIRMED', 'PAID', 'PAYOUT_SCHEDULED'].includes(row.status)) {
          entry.confirmedSalesCount += row._count._all ?? 0;
          entry.confirmedSalesAmount += row._sum.saleAmount ?? 0;
        }

        saleSummaryMap.set(row.leadId, entry);
      });

      const latestSales = await prisma.affiliateSale.findMany({
        where: { leadId: { in: leadIds } },
        orderBy: [{ saleDate: 'desc' }, { createdAt: 'desc' }],
        select: { leadId: true, saleDate: true, status: true },
      });

      for (const sale of latestSales) {
        if (sale.leadId === null) continue;
        const entry = saleSummaryMap.get(sale.leadId);
        if (!entry || entry.lastSaleAt) continue;
        entry.lastSaleAt = sale.saleDate?.toISOString() ?? null;
        entry.lastSaleStatus = sale.status;
        saleSummaryMap.set(sale.leadId, entry);
      }
    }

    const serialized = leads.map((lead) =>
      serializeLead(lead, {
        ownership: resolveOwnership(profile.id, lead),
        counterpart: resolveCounterpart(profile.type, lead),
        saleSummary:
          saleSummaryMap.get(lead.id) ?? {
            totalSalesCount: 0,
            totalSalesAmount: 0,
            totalNetRevenue: 0,
            confirmedSalesCount: 0,
            confirmedSalesAmount: 0,
            lastSaleAt: null,
            lastSaleStatus: null,
          },
      }),
    );

    return NextResponse.json({
      ok: true,
      customers: serialized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof PartnerApiError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    console.error('GET /api/partner/customers error:', error);
    return NextResponse.json({ ok: false, message: '고객 목록을 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { profile, sessionUser } = await requirePartnerContext({ includeManagedAgents: true });
    const payload = await req.json().catch(() => ({}));

    const customerName = toNullableString(payload.customerName) ?? null;
    const rawPhone = toNullableString(payload.customerPhone);
    const customerPhone = normalizePhoneInput(rawPhone);

    if (!customerName && !customerPhone) {
      throw new PartnerApiError('고객 이름 또는 연락처는 필수입니다.', 400);
    }

    const status =
      ensureValidLeadStatus(payload.status) ??
      (profile.type === 'SALES_AGENT' ? 'IN_PROGRESS' : 'NEW');

    const notes = toNullableString(payload.notes);
    const source = toNullableString(payload.source) ?? 'partner-manual';

    let nextActionAt: Date | null = null;
    if (payload.nextActionAt) {
      const parsed = new Date(payload.nextActionAt);
      if (!Number.isNaN(parsed.getTime())) {
        nextActionAt = parsed;
      }
    }

    const data: Prisma.AffiliateLeadCreateInput = {
      customerName,
      customerPhone,
      status,
      source,
      notes,
      nextActionAt,
      metadata: payload.metadata ?? null,
    };

    if (profile.type === 'BRANCH_MANAGER') {
      data.manager = { connect: { id: profile.id } };
      const assignedAgentId = payload.agentProfileId ? Number(payload.agentProfileId) : null;
      if (assignedAgentId) {
        const hasAgent =
          profile.managedRelations?.some((relation) => relation.agent?.id === assignedAgentId) ?? false;
        if (!hasAgent) {
          throw new PartnerApiError('해당 판매원은 대리점장 관리 대상이 아닙니다.', 400);
        }
        data.agent = { connect: { id: assignedAgentId } };
      }
    } else if (profile.type === 'SALES_AGENT') {
      data.agent = { connect: { id: profile.id } };
      const activeManager = profile.agentRelations?.[0]?.managerId;
      if (activeManager) {
        data.manager = { connect: { id: activeManager } };
      }
    } else {
      data.manager = { connect: { id: profile.id } };
    }

    const lead = await prisma.affiliateLead.create({
      data,
      include: {
        ...partnerLeadInclude,
        interactions: {
          ...partnerLeadInclude.interactions,
          take: 0,
        },
        sales: {
          ...partnerLeadInclude.sales,
          take: 0,
        },
      },
    });

    await prisma.adminActionLog.create({
      data: {
        adminId: sessionUser.id,
        targetUserId: null,
        action: 'affiliate.lead.created',
        details: {
          leadId: lead.id,
          profileId: profile.id,
          role: profile.type,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      customer: serializeLead(lead, {
        ownership: resolveOwnership(profile.id, lead),
        counterpart: resolveCounterpart(profile.type, lead),
        saleSummary: {
          totalSalesCount: 0,
          totalSalesAmount: 0,
          totalNetRevenue: 0,
          confirmedSalesCount: 0,
          confirmedSalesAmount: 0,
          lastSaleAt: null,
          lastSaleStatus: null,
        },
      }),
    });
  } catch (error) {
    if (error instanceof PartnerApiError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    console.error('POST /api/partner/customers error:', error);
    return NextResponse.json({ ok: false, message: '고객을 추가하지 못했습니다.' }, { status: 500 });
  }
}
