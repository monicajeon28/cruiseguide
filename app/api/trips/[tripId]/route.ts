import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs'; // Prisma 사용을 위해 Node.js 런타임 명시

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return new NextResponse(JSON.stringify({ error: '인증이 필요합니다.' }), { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as { userId: number };
    const userId = decoded.userId;

    const tripId = parseInt(params.id, 10);
    if (isNaN(tripId)) {
      return new NextResponse(JSON.stringify({ error: '유효하지 않은 여행 ID입니다.' }), { status: 400 });
    }

    const { cruiseName, destination, companionType, startDate, endDate, impressions } = await request.json();

    if (!cruiseName || !destination || !startDate || !endDate) {
      return new NextResponse(JSON.stringify({ error: '필수 입력 항목이 누락되었습니다.' }), { status: 400 });
    }

    const updatedTrip = await prisma.trip.update({
      where: {
        id: tripId,
        userId: userId, // 사용자의 여행만 수정할 수 있도록 확인
      },
      data: {
        cruiseName,
        destination,
        companionType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        impressions,
      },
    });

    return new NextResponse(JSON.stringify({ success: true, trip: updatedTrip }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    });
  } catch (error) {
    console.error('Error updating trip:', error);
    return new NextResponse(JSON.stringify({ error: '서버 오류가 발생했습니다.' }), { status: 500 });
  }
} 