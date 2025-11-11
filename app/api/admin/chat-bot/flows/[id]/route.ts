// app/api/admin/chat-bot/flows/[id]/route.ts
// 특정 플로우 관리

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: 플로우 상세 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const flowId = parseInt(params.id);

    const flow = await prisma.chatBotFlow.findUnique({
      where: { id: flowId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!flow) {
      return NextResponse.json(
        { ok: false, error: '플로우를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: flow,
    });
  } catch (error) {
    console.error('[ChatBot Flow GET] Error:', error);
    return NextResponse.json(
      { ok: false, error: '플로우를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PATCH: 플로우 수정
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const flowId = parseInt(params.id);
    const body = await req.json();

    const flow = await prisma.chatBotFlow.update({
      where: { id: flowId },
      data: {
        name: body.name,
        description: body.description,
        startQuestionId: body.startQuestionId,
        finalPageUrl: body.finalPageUrl,
        isActive: body.isActive,
        order: body.order,
      },
    });

    return NextResponse.json({
      ok: true,
      data: flow,
    });
  } catch (error) {
    console.error('[ChatBot Flow PATCH] Error:', error);
    return NextResponse.json(
      { ok: false, error: '플로우를 수정하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 플로우 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const flowId = parseInt(params.id);

    // 플로우와 관련된 모든 질문도 함께 삭제됨 (Cascade)
    await prisma.chatBotFlow.delete({
      where: { id: flowId },
    });

    return NextResponse.json({
      ok: true,
      message: '플로우가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('[ChatBot Flow DELETE] Error:', error);
    return NextResponse.json(
      { ok: false, error: '플로우를 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}











