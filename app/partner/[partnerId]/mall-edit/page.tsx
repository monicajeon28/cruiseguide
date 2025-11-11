export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from 'next/navigation';
import { PartnerApiError, requirePartnerContext } from '@/app/api/partner/_utils';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import PartnerMallEditClient from './PartnerMallEditClient';

export default async function PartnerMallEditPage({ params }: { params: { partnerId: string } }) {
  try {
    const partnerId = params.partnerId;
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      redirect('/partner');
    }

    // 관리자 체크
    const isAdmin = sessionUser.role === 'admin';

    let profile;
    let targetUser;
    if (!isAdmin) {
      const context = await requirePartnerContext();
      profile = context.profile;

      // 본인의 mallUserId와 일치하는지 확인
      if (profile.user?.mallUserId !== partnerId) {
        redirect(`/partner/${profile.user?.mallUserId ?? ''}/mall-edit`);
      }

      targetUser = profile.user;
    } else {
      // 관리자는 해당 mallUserId의 사용자가 존재하는지만 확인
      targetUser = await prisma.user.findFirst({
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
        },
      });

      if (!targetProfile) {
        redirect('/admin/affiliate/mall');
      }

      profile = targetProfile;
    }

    return <PartnerMallEditClient partnerId={partnerId} profile={profile} />;
  } catch (error) {
    if (error instanceof PartnerApiError && error.status === 401) {
      redirect('/partner');
    }
    redirect('/partner');
  }
}

