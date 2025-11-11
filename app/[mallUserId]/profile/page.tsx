import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { profileInclude, serializeProfile } from '@/app/api/admin/affiliate/profiles/shared';
import MyProfileClient from '@/app/affiliate/my-profile/MyProfileClient';

export default async function PersonalProfilePage({ params }: { params: { mallUserId: string } }) {
  const sessionUser = await getSessionUser();
  const mallUserId = params.mallUserId;

  // 세션이 없으면 파트너 로그인으로 리다이렉트
  if (!sessionUser) {
    redirect('/partner');
  }

  // 관리자 체크
  const isAdmin = sessionUser.role === 'admin';

  // 대상 사용자 찾기
  const targetUser = await prisma.user.findFirst({
    where: { mallUserId },
    select: { id: true, mallUserId: true },
  });

  if (!targetUser) {
    redirect('/admin/affiliate/mall');
  }

  if (!isAdmin) {
    // 관리자가 아니면 본인 확인 필요
    if (sessionUser.id !== targetUser.id) {
      // 본인의 mallUserId로 리다이렉트
      const user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { mallUserId: true },
      });
      if (user?.mallUserId) {
        redirect(`/${user.mallUserId}/profile`);
      } else {
        redirect('/partner');
      }
    }
  }

  // 프로필 데이터 가져오기
  const profile = await prisma.affiliateProfile.findFirst({
    where: { userId: targetUser.id },
    include: profileInclude,
    orderBy: [{ updatedAt: 'desc' }],
  });

  if (!profile) {
    redirect('/admin/affiliate/mall');
  }

  // 프로필 데이터 직렬화
  const serializedProfile = serializeProfile(profile);

  // MyProfileClient에 전달할 프로필 형식으로 변환
  const profileForClient = {
    id: serializedProfile.id,
    affiliateCode: serializedProfile.affiliateCode,
    type: serializedProfile.type,
    status: serializedProfile.status,
    displayName: serializedProfile.displayName,
    branchLabel: serializedProfile.branchLabel,
    nickname: serializedProfile.nickname,
    profileTitle: serializedProfile.profileTitle,
    landingSlug: serializedProfile.landingSlug,
    landingAnnouncement: serializedProfile.landingAnnouncement,
    welcomeMessage: serializedProfile.welcomeMessage,
    bio: serializedProfile.bio,
    profileImage: serializedProfile.profileImage,
    coverImage: serializedProfile.coverImage,
    contactPhone: serializedProfile.contactPhone,
    contactEmail: serializedProfile.contactEmail,
    homepageUrl: serializedProfile.homepageUrl,
    kakaoLink: serializedProfile.kakaoLink,
    instagramHandle: serializedProfile.instagramHandle,
    youtubeChannel: serializedProfile.youtubeChannel,
    published: serializedProfile.published,
    user: serializedProfile.user,
  };

  return <MyProfileClient initialProfile={profileForClient} readOnly={isAdmin && sessionUser.id !== targetUser.id} />;
}

