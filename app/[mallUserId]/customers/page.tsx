export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from 'next/navigation';
import { PartnerApiError, leadStatusOptions, requirePartnerContext } from '@/app/api/partner/_utils';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import PartnerCustomersClient from '@/app/partner/[partnerId]/customers/PartnerCustomersClient';

export default async function PersonalCustomersPage({ params }: { params: { mallUserId: string } }) {
  try {
    const mallUserId = params.mallUserId;
    const sessionUser = await getSessionUser();

    // 세션이 없으면 파트너 로그인으로 리다이렉트
    if (!sessionUser) {
      redirect('/partner');
    }

    // 관리자 체크
    const isAdmin = sessionUser.role === 'admin';

    let profile;
    if (!isAdmin) {
      // 관리자가 아니면 본인 확인 필요
      const context = await requirePartnerContext({ includeManagedAgents: true });
      profile = context.profile;

      // 본인의 mallUserId와 일치하는지 확인
      if (profile.user?.mallUserId !== mallUserId) {
        redirect(`/${profile.user?.mallUserId ?? ''}/customers`);
      }
    } else {
      // 관리자는 해당 mallUserId의 프로필을 가져옴
      const targetUser = await prisma.user.findFirst({
        where: { mallUserId },
        select: { id: true },
      });

      if (!targetUser) {
        redirect('/admin/affiliate/mall');
      }

      const targetProfile = await prisma.affiliateProfile.findFirst({
        where: { userId: targetUser.id },
        include: {
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
          managedRelations: {
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
          },
        },
      });

      if (!targetProfile) {
        redirect('/admin/affiliate/mall');
      }

      profile = targetProfile;
    }

    const shareLinks = {
      mall: `/products/${mallUserId}`,
      tracked: `/products/${mallUserId}?partner=${encodeURIComponent(mallUserId)}`,
      landing:
        profile.affiliateCode && profile.landingSlug
          ? `/store/${profile.affiliateCode}/${profile.landingSlug}`
          : null,
    };

    const teamAgents =
      profile.managedRelations?.map((relation) => {
        const agent = relation.agent;
        if (!agent) return null;
        return {
          id: agent.id,
          displayName: agent.displayName,
          affiliateCode: agent.affiliateCode,
        };
      }).filter(Boolean) ?? [];

    return (
      <PartnerCustomersClient
        partner={{
          profileId: profile.id,
          type: profile.type,
          displayName: profile.displayName,
          branchLabel: profile.branchLabel,
          mallUserId,
          shareLinks,
          manager:
            profile.agentRelations?.[0]?.manager?.displayName
              ? {
                  label: profile.agentRelations[0].manager.displayName,
                  affiliateCode: profile.agentRelations[0].manager.affiliateCode,
                  branchLabel: profile.agentRelations[0].manager.branchLabel,
                }
              : null,
          teamAgents: teamAgents as Array<{
            id: number;
            displayName: string | null;
            affiliateCode: string | null;
          }>,
        }}
        leadStatusOptions={leadStatusOptions}
      />
    );
  } catch (error) {
    if (error instanceof PartnerApiError && error.status === 401) {
      redirect('/partner');
    }
    redirect('/partner');
  }
}

