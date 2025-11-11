import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export default async function AffiliateMyProfilePage() {
  const session = await getSessionUser();
  if (!session) {
    redirect('/partner');
  }

  // 사용자의 mallUserId 가져오기
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { mallUserId: true },
  });

  if (!user?.mallUserId) {
    redirect('/partner');
  }

  // 개인 프로필 페이지로 리다이렉트
  redirect(`/${user.mallUserId}/profile`);
}


