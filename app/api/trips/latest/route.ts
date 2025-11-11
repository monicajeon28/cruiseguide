import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // 사용자의 최신 여행 정보 가져오기
    const latestTrip = await prisma.trip.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        cruiseName: true,
        companionType: true,
        destination: true,
        startDate: true,
        endDate: true,
        nights: true,
        days: true,
        visitCount: true,
      },
    });

    if (!latestTrip) {
      return NextResponse.json({ success: false, message: 'No trip found' }, { status: 404 });
    }

    // 날짜를 문자열로 변환 (YYYY-MM-DD 형식)
    const formatDate = (date: Date | null) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    };

    // destination이 JSON 배열인 경우 파싱
    let destinationArray: string[] = [];
    if (latestTrip.destination) {
      if (Array.isArray(latestTrip.destination)) {
        destinationArray = latestTrip.destination;
      } else if (typeof latestTrip.destination === 'string') {
        try {
          destinationArray = JSON.parse(latestTrip.destination);
        } catch {
          destinationArray = [latestTrip.destination];
        }
      }
    }

    const trip = {
      cruiseName: latestTrip.cruiseName || '',
      companionType: latestTrip.companionType || '가족',
      destination: destinationArray,
      startDate: formatDate(latestTrip.startDate),
      endDate: formatDate(latestTrip.endDate),
      nights: latestTrip.nights || 0,
      days: latestTrip.days || 0,
      visitCount: latestTrip.visitCount || 0,
    };

    // 사용자 정보
    const userInfo = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true },
    });

    return NextResponse.json({ 
      success: true, 
      trip, 
      user: { name: userInfo?.name || '' } 
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching latest trip:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
