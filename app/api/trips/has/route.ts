import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ hasTrip: false }, { status: 200 });
    }

    // 사용자의 여행 정보 확인
    const tripCount = await prisma.trip.count({
      where: { userId: user.id },
    });

    return NextResponse.json({ hasTrip: tripCount > 0 }, { status: 200 });
  } catch (error) {
    console.error('Error checking trip:', error);
    return NextResponse.json({ hasTrip: false }, { status: 200 });
  }
}
