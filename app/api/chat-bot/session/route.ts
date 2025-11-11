// app/api/chat-bot/session/route.ts
// 채팅봇 세션 생성 및 추적

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { randomUUID } from 'crypto';

// POST: 새 세션 생성
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { flowId, userId, userPhone, userEmail, productCode } = body;

    console.log('[ChatBot Session POST] Request body:', { flowId, userId, userPhone, userEmail, productCode });

    if (!flowId) {
      return NextResponse.json(
        { ok: false, error: 'flowId가 필요합니다.' },
        { status: 400 }
      );
    }

    const sessionId = randomUUID();
    console.log('[ChatBot Session POST] Creating session with ID:', sessionId);
    
    const session = await prisma.chatBotSession.create({
      data: {
        sessionId,
        flowId: parseInt(flowId),
        userId: userId ? parseInt(userId) : null,
        userPhone: userPhone || null,
        userEmail: userEmail || null,
        productCode: productCode ? String(productCode).toUpperCase() : null,
      },
    });

    console.log('[ChatBot Session POST] Session created successfully:', session);

    return NextResponse.json({
      ok: true,
      data: session,
    });
  } catch (error) {
    console.error('[ChatBot Session POST] Error:', error);
    console.error('[ChatBot Session POST] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json(
      { 
        ok: false, 
        error: '세션을 생성하는 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH: 세션 업데이트 (완료, 이탈 등)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionId,
      isCompleted,
      finalPageUrl,
      conversionRate,
      finalStatus,
      endedAt,
      durationMs,
      paymentStatus,
      paymentAttemptedAt,
      paymentCompletedAt,
      paymentOrderId,
    } = body;

    if (!sessionId) {
      return NextResponse.json(
        { ok: false, error: 'sessionId가 필요합니다.' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted;
      if (isCompleted) {
        updateData.completedAt = new Date();
      }
    }
    if (finalStatus !== undefined) updateData.finalStatus = finalStatus;
    if (endedAt !== undefined) {
      try {
        updateData.endedAt = endedAt ? new Date(endedAt) : null;
      } catch {
        updateData.endedAt = new Date();
      }
    }
    if (durationMs !== undefined) {
      const parsedDuration =
        typeof durationMs === 'number' ? durationMs : parseInt(durationMs, 10);
      if (!Number.isNaN(parsedDuration)) {
        updateData.durationMs = parsedDuration;
      }
    }
    if (finalPageUrl !== undefined) updateData.finalPageUrl = finalPageUrl;
    if (conversionRate !== undefined) updateData.conversionRate = conversionRate;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (paymentAttemptedAt !== undefined) {
      try {
        updateData.paymentAttemptedAt = paymentAttemptedAt
          ? new Date(paymentAttemptedAt)
          : null;
      } catch {
        updateData.paymentAttemptedAt = null;
      }
    }
    if (paymentCompletedAt !== undefined) {
      try {
        updateData.paymentCompletedAt = paymentCompletedAt
          ? new Date(paymentCompletedAt)
          : null;
      } catch {
        updateData.paymentCompletedAt = null;
      }
    }
    if (paymentOrderId !== undefined) updateData.paymentOrderId = paymentOrderId;

    const session = await prisma.chatBotSession.update({
      where: { sessionId },
      data: updateData,
    });

    return NextResponse.json({
      ok: true,
      data: session,
    });
  } catch (error) {
    console.error('[ChatBot Session PATCH] Error:', error);
    return NextResponse.json(
      { ok: false, error: '세션을 업데이트하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

