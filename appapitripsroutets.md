import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUserId } from '@/lib/session';

export async function GET() {
  const userId = getSessionUserId();
  if (!userId) return NextResponse.json({ trip:null }, { status: 200 });

  const trip = await prisma.trip.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ trip });
}

export async function POST(req: Request) {
  try {
    const userId = getSessionUserId();
    if (!userId) return NextResponse.json({ ok:false, message:'unauthorized' }, { status: 401 });

    const body = await req.json();
    console.log('[api/trips] Received body:', body); // 요청 body 로깅

    const {
      cruiseName, companionType, destination, startDate, endDate,
      nights, days, visitCount
    } = body;

    // 간단 검증
    if (!cruiseName || !startDate || !endDate) {
      console.error('[api/trips] 필수 입력 누락');
      return NextResponse.json({ ok:false, message:'필수 입력 누락' }, { status: 400 });
    }
    if (Array.isArray(destination) && typeof visitCount === 'number') {
      if (destination.length !== visitCount) {
        console.error('[api/trips] 방문 국가 개수와 목적지 수가 일치하지 않습니다.', {destination, visitCount});
        return NextResponse.json({ ok:false, message:'방문 국가 개수와 목적지 수가 일치하지 않습니다.' }, { status: 400 });
      }
    }
    console.log('[api/trips] Validation passed.'); // 유효성 검사 통과 로깅

    const prev = await prisma.trip.findFirst({ where: { userId } });
    console.log('[api/trips] Previous trip found:', prev); // 이전 여행 정보 로깅

    const data = {
      userId, cruiseName, companionType,
      destination: JSON.stringify(destination), // JSON.stringify 추가
      startDate, endDate, nights, days, visitCount,
    };
    console.log('[api/trips] Data to save:', data); // 저장할 데이터 로깅

    const saved = prev
      ? await prisma.trip.update({ where: { id: prev.id }, data })
      : await prisma.trip.create({ data });
    console.log('[api/trips] Trip saved:', saved); // 저장된 여행 정보 로깅

    // 여행 정보 저장 성공 시, 사용자 onboarded 상태를 true로 업데이트
    console.log('[api/trips] Updating user onboarded status for userId:', userId);
    await prisma.user.update({
      where: { id: userId },
      data: { onboarded: true },
    });
    console.log('[api/trips] User onboarded status updated to true.'); // 사용자 온보딩 상태 업데이트 로깅

    return NextResponse.json({ ok:true, trip: saved });
  } catch (error) {
    console.error('[api/trips] Unhandled error in POST:', error);
    return NextResponse.json({ ok:false, message:'서버 내부 오류가 발생했습니다.' }, { status: 500 });
  }
}



