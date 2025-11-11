export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from 'next/navigation';
import { PartnerApiError, leadStatusOptions, requirePartnerContext } from '@/app/api/partner/_utils';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import PartnerCustomersClient from './PartnerCustomersClient';

export default async function PartnerCustomersPage({ params }: { params: { partnerId: string } }) {
  try {
    const partnerId = params.partnerId;
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      redirect('/partner');
    }

    // Check if admin
    const isAdmin = sessionUser.role === 'admin';

    // For non-admin users, require partner context
    let profile;
    if (!isAdmin) {
      const context = await requirePartnerContext({ includeManagedAgents: true });
      profile = context.profile;

      // If not viewing own customers page, redirect to own customers page
      if (profile.user?.mallUserId !== partnerId) {
        redirect(`/partner/${profile.user?.mallUserId ?? ''}/customers`);
      }
    } else {
      // Admin: fetch the target user's profile
      const targetUser = await prisma.user.findFirst({
        where: { mallUserId: partnerId },
        select: { id: true },
      });

      if (!targetUser) {
        redirect('/partner');
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
          managedRelations: {
            include: {
              agent: {
                select: {
                  id: true,
                  displayName: true,
                  affiliateCode: true,
                },
              },
            },
          },
          agentRelations: {
            include: {
              manager: {
                select: {
                  displayName: true,
                  affiliateCode: true,
                  branchLabel: true,
                },
              },
            },
          },
        },
      });

      if (!targetProfile) {
        redirect('/partner');
      }

      profile = targetProfile;
    }

    const mallUserId = profile.user?.mallUserId;
    if (!mallUserId) {
      redirect('/partner');
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
