import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/chat/history
 * 현재 사용자의 활성 여행에 해당하는 채팅 기록을 불러옵니다.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    // 사용자 정보 가져오기 (tripCount 포함)
    const userInfo = await prisma.user.findUnique({
      where: { id: user.id },
      select: { tripCount: true, name: true },
    });

    // 사용자의 가장 최근 여행 가져오기
    const latestTrip = await prisma.trip.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (!latestTrip) {
      // 여행이 없으면 빈 메시지 배열 반환
      return NextResponse.json({ ok: true, messages: [] });
    }

    // 해당 여행의 채팅 기록 가져오기
    const chatHistory = await prisma.chatHistory.findFirst({
      where: {
        userId: user.id,
        tripId: latestTrip.id,
      },
      orderBy: { updatedAt: 'desc' },
      select: { messages: true, updatedAt: true },
    });

    let messages: any[] = [];
    
    if (chatHistory) {
      // 기존 채팅 기록이 있으면 파싱
      const parsedMessages = chatHistory.messages as any;
      messages = Array.isArray(parsedMessages) ? parsedMessages : [];
    }
    
    return NextResponse.json({ ok: true, messages });
  } catch (error) {
    console.error('GET /api/chat/history error:', error);
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/chat/history
 * 채팅 기록을 저장합니다. (기존 기록이 있으면 업데이트, 없으면 생성)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { messages } = await req.json();

    if (!Array.isArray(messages)) {
      return NextResponse.json({ ok: false, message: 'Invalid messages format' }, { status: 400 });
    }

    // 사용자의 가장 최근 여행 가져오기
    const latestTrip = await prisma.trip.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    // 여행이 없으면 여행 없이 저장 (tripId = null)
    const tripId = latestTrip ? latestTrip.id : null;

    // sessionId 생성 (사용자 ID 기반)
    const sessionId = `user-${user.id}-trip-${tripId || 'none'}`;

    // 기존 ChatHistory 찾기
    const existingHistory = await prisma.chatHistory.findFirst({
      where: {
        userId: user.id,
        tripId: tripId,
      },
    });

    if (existingHistory) {
      // 기존 기록 업데이트
      await prisma.chatHistory.update({
        where: { id: existingHistory.id },
        data: {
          messages: messages,
          updatedAt: new Date(),
        },
      });
    } else {
      // 새 기록 생성
      await prisma.chatHistory.create({
        data: {
          userId: user.id,
          tripId: tripId,
          sessionId: sessionId,
          messages: messages,
        },
      });
    }

    return NextResponse.json({ ok: true, message: 'Chat history saved successfully' });
  } catch (error) {
    console.error('POST /api/chat/history error:', error);
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/chat/history
 * 현재 사용자의 채팅 기록을 삭제합니다.
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    // 사용자의 가장 최근 여행 가져오기
    const latestTrip = await prisma.trip.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    const tripId = latestTrip ? latestTrip.id : null;

    // 해당 여행의 채팅 기록 삭제
    const deleteResult = await prisma.chatHistory.deleteMany({
      where: {
        userId: user.id,
        tripId: tripId,
      },
    });

    return NextResponse.json({ 
      ok: true, 
      message: 'Chat history deleted successfully',
      deletedCount: deleteResult.count 
    });
  } catch (error) {
    console.error('DELETE /api/chat/history error:', error);
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 });
  }
}
