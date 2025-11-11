// app/api/admin/chat-bot/flows/route.ts
// 채팅봇 플로우 관리 API

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: 플로우 목록 조회
export async function GET() {
  try {
    const flows = await prisma.chatBotFlow.findMany({
      where: {
        category: 'AI 지니 채팅봇(구매)',
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    const flowsWithCount = flows.map(flow => ({
      ...flow,
      questionCount: flow._count.questions,
    }));

    return NextResponse.json({
      ok: true,
      data: flowsWithCount,
    });
  } catch (error) {
    console.error('[ChatBot Flows GET] Error:', error);
    return NextResponse.json(
      { ok: false, error: '플로우를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새 플로우 생성
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, finalPageUrl, order } = body;

    if (!name) {
      return NextResponse.json(
        { ok: false, error: '플로우 이름은 필수입니다.' },
        { status: 400 }
      );
    }

    const flow = await prisma.chatBotFlow.create({
      data: {
        name,
        category: 'AI 지니 채팅봇(구매)',
        description: description || null,
        finalPageUrl: finalPageUrl || null,
        order: order || 0,
        isActive: false, // 기본값은 비활성
      },
    });

    return NextResponse.json({
      ok: true,
      data: flow,
    });
  } catch (error) {
    console.error('[ChatBot Flows POST] Error:', error);
    return NextResponse.json(
      { ok: false, error: '플로우를 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}











