// app/api/checklist/route.ts
// 체크리스트 API (CRUD)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

/**
 * GET: 체크리스트 항목 조회
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const tripIdParam = req.nextUrl.searchParams.get('tripId');
    const tripId = tripIdParam ? parseInt(tripIdParam) : undefined;

    const items = await prisma.checklistItem.findMany({
      where: {
        userId: session.user.id,
        ...(tripId ? { tripId } : {}),
      },
      orderBy: [
        { completed: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(
      { items },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] 체크리스트 조회 오류:', error);
    return NextResponse.json(
      { error: '체크리스트 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * POST: 체크리스트 항목 추가
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const { text, tripId } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: '항목 내용이 필요합니다' },
        { status: 400 }
      );
    }

    // tripId가 있으면 여행 소유권 확인
    if (tripId) {
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId: session.user.id },
      });

      if (!trip) {
        return NextResponse.json(
          { error: '여행을 찾을 수 없습니다' },
          { status: 404 }
        );
      }
    }

    const item = await prisma.checklistItem.create({
      data: {
        userId: session.user.id,
        tripId: tripId || null,
        text,
        completed: false,
        order: 0,
      },
    });

    return NextResponse.json(
      { item },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] 체크리스트 항목 추가 오류:', error);
    return NextResponse.json(
      { error: '항목 추가 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * PATCH: 체크리스트 항목 업데이트 (토글)
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const { id, completed } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 항목 소유권 확인
    const item = await prisma.checklistItem.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!item) {
      return NextResponse.json(
        { error: '항목을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const updated = await prisma.checklistItem.update({
      where: { id },
      data: {
        ...(completed !== undefined && { completed }),
      },
    });

    return NextResponse.json(
      { item: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] 체크리스트 항목 업데이트 오류:', error);
    return NextResponse.json(
      { error: '항목 업데이트 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: 체크리스트 항목 삭제
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const id = body.id;

    if (!id) {
      return NextResponse.json(
        { error: 'ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 항목 소유권 확인
    const item = await prisma.checklistItem.findFirst({
      where: { id: parseInt(id), userId: session.user.id },
    });

    if (!item) {
      return NextResponse.json(
        { error: '항목을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    await prisma.checklistItem.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json(
      { ok: true, message: '항목이 삭제되었습니다' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] 체크리스트 항목 삭제 오류:', error);
    return NextResponse.json(
      { error: '항목 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
