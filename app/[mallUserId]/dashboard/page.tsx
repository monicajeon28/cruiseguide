export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from 'next/navigation';
import { PartnerApiError, requirePartnerContext } from '@/app/api/partner/_utils';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import PartnerDashboard from '@/app/partner/[partnerId]/dashboard/PartnerDashboard';

export default async function PersonalDashboardPage({ params }: { params: { mallUserId: string } }) {
  try {
    const mallUserId = params.mallUserId;
    const sessionUser = await getSessionUser();

    // 세션이 없으면 파트너 로그인으로 리다이렉트
    if (!sessionUser) {
      redirect('/partner');
    }

    // 관리자 체크
    const isAdmin = sessionUser.role === 'admin';

    // 관리자가 아닌 경우, 본인 확인 필요
    if (!isAdmin) {
      const context = await requirePartnerContext();
      const profile = context.profile;

      // 본인의 mallUserId와 일치하는지 확인
      if (profile.user?.mallUserId !== mallUserId) {
        redirect(`/${profile.user?.mallUserId ?? ''}/dashboard`);
      }
    }

    // Fetch the target user by mallUserId
    const targetUser = await prisma.user.findFirst({
      where: { mallUserId },
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

