import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

export const profileInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      onboarded: true,
      mallNickname: true,
      mallUserId: true,
      password: true, // 비밀번호 추가
    },
  },
  agentRelations: {
    where: { status: 'ACTIVE' },
    select: {
      manager: {
        select: {
          id: true,
          affiliateCode: true,
          type: true,
          displayName: true,
          nickname: true,
          branchLabel: true,
        },
      },
    },
  },
  _count: {
    select: {
      managedRelations: true,
      agentRelations: true,
      linksAsManager: true,
      linksAsAgent: true,
      leadsAsManager: true,
      leadsAsAgent: true,
      salesAsManager: true,
      salesAsAgent: true,
    },
  },
} satisfies Prisma.AffiliateProfileInclude;

type ProfileWithRelations = Prisma.AffiliateProfileGetPayload<{
  include: typeof profileInclude;
}>;

export function serializeProfile(profile: ProfileWithRelations, includePassword: boolean = false) {
  const counts = profile._count;
  const totalLinks = counts.linksAsManager + counts.linksAsAgent;
  const totalLeads = counts.leadsAsManager + counts.leadsAsAgent;
  const totalSales = counts.salesAsManager + counts.salesAsAgent;
  const managerRelation = profile.agentRelations?.[0]?.manager ?? null;

  return {
    id: profile.id,
    userId: profile.userId,
    affiliateCode: profile.affiliateCode,
    type: profile.type,
    status: profile.status,
    displayName: profile.displayName,
    branchLabel: profile.branchLabel,
    nickname: profile.nickname,
    profileTitle: profile.profileTitle,
    bio: profile.bio,
    profileImage: profile.profileImage,
    coverImage: profile.coverImage,
    contactPhone: profile.contactPhone,
    contactEmail: profile.contactEmail,
    kakaoLink: profile.kakaoLink,
    instagramHandle: profile.instagramHandle,
    youtubeChannel: profile.youtubeChannel,
    homepageUrl: profile.homepageUrl,
    landingSlug: profile.landingSlug,
    landingAnnouncement: profile.landingAnnouncement,
    welcomeMessage: profile.welcomeMessage,
    landingTheme: profile.landingTheme,
    externalLinks: profile.externalLinks,
    published: profile.published,
    publishedAt: profile.publishedAt,
    bankName: profile.bankName,
    bankAccount: profile.bankAccount,
    bankAccountHolder: profile.bankAccountHolder,
    withholdingRate: profile.withholdingRate,
    contractStatus: profile.contractStatus,
    contractSignedAt: profile.contractSignedAt,
    kycCompletedAt: profile.kycCompletedAt,
    onboardedAt: profile.onboardedAt,
    metadata: profile.metadata,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    manager: managerRelation
      ? {
          id: managerRelation.id,
          affiliateCode: managerRelation.affiliateCode,
          type: managerRelation.type,
          displayName: managerRelation.displayName,
          nickname: managerRelation.nickname,
          branchLabel: managerRelation.branchLabel,
        }
      : null,
    counts: {
      managedAgents: counts.managedRelations,
      assignedManagers: counts.agentRelations,
      totalLinks,
      totalLeads,
      totalSales,
    },
    user: profile.user
      ? {
          id: profile.user.id,
          name: profile.user.name,
          email: profile.user.email,
          phone: profile.user.phone,
          role: profile.user.role,
          onboarded: profile.user.onboarded,
          mallNickname: profile.user.mallNickname,
          mallUserId: profile.user.mallUserId,
          ...(includePassword ? { password: profile.user.password } : {}), // 관리자일 때만 비밀번호 포함
        }
      : null,
  };
}

export function toNullableString(value: unknown) {
  if (value === undefined || value === null) return undefined;
  const str = String(value).trim();
  return str.length ? str : null;
}

export async function syncSalesAgentMentor(agentProfileId: number, managerProfileId: number | null) {
  await prisma.$transaction(async (tx) => {
    await tx.affiliateRelation.updateMany({
      where: { agentId: agentProfileId, status: 'ACTIVE' },
      data: { status: 'TERMINATED', disconnectedAt: new Date() },
    });

    if (managerProfileId) {
      await tx.affiliateRelation.upsert({
        where: {
          managerId_agentId: {
            managerId: managerProfileId,
            agentId: agentProfileId,
          },
        },
        update: {
          status: 'ACTIVE',
          disconnectedAt: null,
          connectedAt: new Date(),
        },
        create: {
          managerId: managerProfileId,
          agentId: agentProfileId,
          status: 'ACTIVE',
          connectedAt: new Date(),
        },
      });
    }
  });
}

