export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from 'next/navigation';
import { PartnerApiError, requirePartnerContext } from '@/app/api/partner/_utils';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import PartnerDashboard from './PartnerDashboard';

export default async function PartnerDashboardPage({ params }: { params: { partnerId: string } }) {
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
      const context = await requirePartnerContext();
      profile = context.profile;

      // If not viewing own dashboard, redirect to own dashboard
      if (profile.user?.mallUserId !== partnerId) {
        redirect(`/partner/${profile.user?.mallUserId ?? ''}/dashboard`);
      }
    }

    // Fetch the target user by mallUserId
    const targetUser = await prisma.user.findFirst({
      where: { mallUserId: partnerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        mallUserId: true,
        mallNickname: true,
      },
    });

    if (!targetUser?.mallUserId) {
      redirect('/partner');
    }

    // Fetch the target user's profile
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
      },
    });

    if (!targetProfile) {
      redirect('/partner');
    }

    return <PartnerDashboard user={targetUser} profile={targetProfile} />;
  } catch (error) {
    if (error instanceof PartnerApiError && error.status === 401) {
      redirect('/partner');
    }
    redirect('/partner');
  }
}
