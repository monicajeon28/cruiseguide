import { redirect } from 'next/navigation';
import { getSessionUserId } from '@/lib/session';
import prisma from '@/lib/prisma';

export default async function Home() {
  const userId = getSessionUserId(); // ❗ named 사용
  if (!userId) redirect('/login?next=/onboarding');

  // 온보딩(Trip) 존재 여부
  const hasTrip = await prisma.trip.findFirst({
    where: { userId },
    select: { id: true },
  });

  redirect(hasTrip ? '/chat' : '/onboarding');
}
