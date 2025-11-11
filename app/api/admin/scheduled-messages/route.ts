import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'cg.sid.v2';

// 관리자 권한 확인
async function checkAdminAuth() {
  try {
    const sid = cookies().get(SESSION_COOKIE)?.value;
    
    if (!sid) {
      return null;
    }

    const session = await prisma.session.findUnique({
      where: { id: sid },
      include: {
        User: {
          select: { id: true, role: true, name: true },
        },
      },
    });

    if (!session || !session.User || session.User.role !== 'admin') {
      return null;
    }

    return {
      id: session.User.id,
      name: session.User.name,
      role: session.User.role,
    };
  } catch (error) {
    console.error('[Scheduled Messages] Auth check error:', error);
    return null;
  }
}

// GET: 예약 메시지 목록 조회
export async function GET(req: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ ok: false, error: '인증이 필요합니다.' }, { status: 403 });
    }

    const messages = await prisma.scheduledMessage.findMany({
      include: {
        Stages: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ ok: true, messages });
  } catch (error) {
    console.error('[Scheduled Messages GET] Error:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to fetch scheduled messages' },
      { status: 500 }
    );
  }
}

// POST: 예약 메시지 생성
export async function POST(req: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ ok: false, error: '인증이 필요합니다.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      category,
      groupName,
      description,
      sendMethod,
      senderName,
      senderPhone,
      senderEmail,
      optOutNumber,
      isAdMessage,
      autoAddAdTag,
      autoAddOptOut,
      startDate,
      startTime,
      maxDays,
      repeatInterval,
      stages,
    } = body;

    if (!title || !sendMethod) {
      return NextResponse.json(
        { ok: false, error: '제목과 발송 방식은 필수입니다.' },
        { status: 400 }
      );
    }

    if (!stages || stages.length === 0) {
      return NextResponse.json(
        { ok: false, error: '최소 1개의 메시지 단계가 필요합니다.' },
        { status: 400 }
      );
    }

    // 예약 메시지 생성
    const scheduledMessage = await prisma.scheduledMessage.create({
      data: {
        adminId: admin.id,
        title,
        category: category || '예약메시지',
        groupName: groupName || null,
        description: description || null,
        sendMethod,
        senderName: senderName || null,
        senderPhone: senderPhone || null,
        senderEmail: senderEmail || null,
        optOutNumber: optOutNumber || null,
        isAdMessage: isAdMessage || false,
        autoAddAdTag: autoAddAdTag !== false,
        autoAddOptOut: autoAddOptOut !== false,
        startDate: startDate ? new Date(startDate) : null,
        startTime: startTime || null,
        maxDays: maxDays || (sendMethod === 'sms' ? 999999 : 99999),
        repeatInterval: repeatInterval || null,
        isActive: true,
        Stages: {
          create: stages.map((stage: any, index: number) => ({
            stageNumber: stage.stageNumber || index + 1,
            daysAfter: stage.daysAfter || 0,
            sendTime: stage.sendTime || null,
            title: stage.title,
            content: stage.content,
            order: index,
          })),
        },
      },
      include: {
        Stages: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({ ok: true, message: scheduledMessage });
  } catch (error) {
    console.error('[Scheduled Messages POST] Error:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to create scheduled message' },
      { status: 500 }
    );
  }
}

