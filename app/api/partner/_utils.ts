import { AffiliateLeadStatus, AffiliateType, Prisma } from '@prisma/client';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export class PartnerApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'PartnerApiError';
    this.status = status;
  }
}

type PartnerContextOptions = {
  includeManagedAgents?: boolean;
};

export async function requirePartnerContext(options: PartnerContextOptions = {}) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    throw new PartnerApiError('로그인이 필요합니다.', 401);
  }

  const include: Prisma.AffiliateProfileInclude = {
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        mallUserId: true,
        mallNickname: true,
      },
    },
    agentRelations: {
      where: { status: 'ACTIVE' },
      select: {
        managerId: true,
        manager: {
          select: {
            id: true,
            affiliateCode: true,
            type: true,
            displayName: true,
            branchLabel: true,
          },
        },
      },
    },
  };

  if (options.includeManagedAgents) {
    include.managedRelations = {
      where: { status: 'ACTIVE' },
      select: {
        agent: {
          select: {
            id: true,
            affiliateCode: true,
            type: true,
            displayName: true,
            branchLabel: true,
          },
        },
      },
    };
  }

  const profile = await prisma.affiliateProfile.findFirst({
    where: {
      userId: sessionUser.id,
      status: 'ACTIVE',
    },
    include,
    orderBy: { updatedAt: 'desc' },
  });

  if (!profile) {
    throw new PartnerApiError('파트너 권한이 필요합니다. 관리자에게 문의해주세요.', 403);
  }

  return { sessionUser, profile };
}

export const partnerLeadInclude = {
  manager: {
    select: {
      id: true,
      affiliateCode: true,
      type: true,
      displayName: true,
      branchLabel: true,
    },
  },
  agent: {
    select: {
      id: true,
      affiliateCode: true,
      type: true,
      displayName: true,
      branchLabel: true,
    },
  },
  interactions: {
    orderBy: { occurredAt: 'desc' },
    select: {
      id: true,
      interactionType: true,
      occurredAt: true,
      note: true,
      profileId: true,
      createdById: true,
      leadId: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  },
  sales: {
    orderBy: [{ saleDate: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      saleAmount: true,
      netRevenue: true,
      saleDate: true,
      status: true,
      createdAt: true,
      leadId: true,
    },
  },
} satisfies Prisma.AffiliateLeadInclude;

export type PartnerLeadPayload = Prisma.AffiliateLeadGetPayload<{
  include: typeof partnerLeadInclude;
}>;

export function normalizePhoneInput(phone: string | null | undefined) {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return null;
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return digits;
}

export function serializeLead(
  lead: PartnerLeadPayload,
  extras: Record<string, unknown> = {},
) {
  return {
    id: lead.id,
    managerId: lead.managerId,
    agentId: lead.agentId,
    customerName: lead.customerName ?? null,
    customerPhone: lead.customerPhone ?? null,
    status: lead.status,
    source: lead.source ?? null,
    passportRequestedAt: lead.passportRequestedAt?.toISOString() ?? null,
    passportCompletedAt: lead.passportCompletedAt?.toISOString() ?? null,
    lastContactedAt: lead.lastContactedAt?.toISOString() ?? null,
    nextActionAt: lead.nextActionAt?.toISOString() ?? null,
    notes: lead.notes ?? null,
    metadata: lead.metadata ?? null,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
    manager: lead.manager
      ? {
          id: lead.manager.id,
          affiliateCode: lead.manager.affiliateCode,
          type: lead.manager.type,
          displayName: lead.manager.displayName,
          branchLabel: lead.manager.branchLabel,
        }
      : null,
    agent: lead.agent
      ? {
          id: lead.agent.id,
          affiliateCode: lead.agent.affiliateCode,
          type: lead.agent.type,
          displayName: lead.agent.displayName,
          branchLabel: lead.agent.branchLabel,
        }
      : null,
    interactions:
      lead.interactions?.map((interaction) => ({
        id: interaction.id,
        interactionType: interaction.interactionType,
        occurredAt: interaction.occurredAt.toISOString(),
        note: interaction.note ?? null,
        profileId: interaction.profileId,
        createdById: interaction.createdById,
        leadId: interaction.leadId,
        createdBy: interaction.createdBy
          ? {
              id: interaction.createdBy.id,
              name: interaction.createdBy.name,
              phone: interaction.createdBy.phone,
            }
          : null,
      })) ?? [],
    sales:
      lead.sales?.map((sale) => ({
        id: sale.id,
        saleAmount: sale.saleAmount,
        netRevenue: sale.netRevenue,
        saleDate: sale.saleDate?.toISOString() ?? null,
        status: sale.status,
        createdAt: sale.createdAt.toISOString(),
        leadId: sale.leadId,
      })) ?? [],
    ...extras,
  };
}

export const leadStatusOptions: Array<{
  value: AffiliateLeadStatus;
  label: string;
  theme: string;
}> = [
  { value: 'NEW', label: '신규', theme: 'bg-blue-100 text-blue-700' },
  { value: 'CONTACTED', label: '소통중', theme: 'bg-amber-100 text-amber-700' },
  { value: 'IN_PROGRESS', label: '진행 중', theme: 'bg-indigo-100 text-indigo-700' },
  { value: 'PURCHASED', label: '구매 완료', theme: 'bg-emerald-100 text-emerald-700' },
  { value: 'REFUNDED', label: '환불', theme: 'bg-rose-100 text-rose-700' },
  { value: 'CLOSED', label: '종료', theme: 'bg-slate-100 text-slate-600' },
  { value: 'TEST_GUIDE', label: '3일부재', theme: 'bg-yellow-100 text-yellow-700' },
];

export function ensureValidLeadStatus(status?: string | null) {
  if (!status) return null;
  const matched = leadStatusOptions.find((option) => option.value === status);
  return matched?.value ?? null;
}

export function phoneSearchVariants(raw: string) {
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return [];
  const variants = new Set<string>([digits]);
  if (digits.length === 11) {
    variants.add(`${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`);
  }
  if (digits.length === 10) {
    variants.add(`${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`);
  }
  return Array.from(variants);
}

export function resolveOwnership(profileId: number, lead: PartnerLeadPayload) {
  if (lead.agentId === profileId) return 'AGENT';
  if (lead.managerId === profileId) return 'MANAGER';
  return 'UNKNOWN';
}

export function resolveCounterpart(
  profileType: AffiliateType,
  lead: PartnerLeadPayload,
) {
  if (profileType === 'SALES_AGENT') {
    return lead.manager
      ? {
          label: lead.manager.displayName ?? '담당 대리점장',
          affiliateCode: lead.manager.affiliateCode,
          branchLabel: lead.manager.branchLabel,
        }
      : null;
  }
  if (profileType === 'BRANCH_MANAGER') {
    return lead.agent
      ? {
          label: lead.agent.displayName ?? '담당 판매원',
          affiliateCode: lead.agent.affiliateCode,
          branchLabel: lead.agent.branchLabel,
        }
      : null;
  }
  return null;
}

type LeadFetchOptions = {
  interactions?: number;
  sales?: number;
};

export async function getPartnerLead(
  profileId: number,
  leadId: number,
  options: LeadFetchOptions = {},
) {
  const include: Prisma.AffiliateLeadInclude = {
    ...partnerLeadInclude,
    interactions: {
      ...partnerLeadInclude.interactions,
      take: options.interactions ?? 20,
    },
    sales: {
      ...partnerLeadInclude.sales,
      take: options.sales ?? 20,
    },
  };

  const lead = await prisma.affiliateLead.findFirst({
    where: {
      id: leadId,
      OR: [{ managerId: profileId }, { agentId: profileId }],
    },
    include,
  });

  if (!lead) {
    throw new PartnerApiError('고객 정보를 찾을 수 없습니다.', 404);
  }

  return lead;
}
