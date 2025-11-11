// app/api/admin/itinerary-groups/route.ts
// 일정 그룹 저장/불러오기 API

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'cg.sid.v2';

// 관리자 권한 확인
async function checkAdminAuth(sid: string | undefined): Promise<boolean> {
  if (!sid) return false;

  try {
    const session = await prisma.session.findUnique({
      where: { id: sid },
      include: {
        User: {
          select: { role: true },
        },
      },
    });

    return session?.User.role === 'admin';
  } catch (error) {
    console.error('[Admin Itinerary Groups] Auth check error:', error);
    return false;
  }
}

// 그룹 목록 조회
export async function GET(request: NextRequest) {
  try {
    const sid = cookies().get(SESSION_COOKIE)?.value;
    const isAdmin = await checkAdminAuth(sid);

    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const groups = await prisma.itineraryGroup.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      ok: true,
      groups
    });
  } catch (error) {
    console.error('[Admin Itinerary Groups] Failed to load groups:', error);
    console.error('[Admin Itinerary Groups] Error details:', error instanceof Error ? error.message : String(error));
    console.error('[Admin Itinerary Groups] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({
      ok: false,
      error: '그룹 목록을 불러오는데 실패했습니다.',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 });
  }
}

// 새 그룹 저장
export async function POST(request: NextRequest) {
  try {
    const sid = cookies().get(SESSION_COOKIE)?.value;
    const isAdmin = await checkAdminAuth(sid);

    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, itinerary } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({
        ok: false,
        error: '그룹 이름을 입력해주세요.'
      }, { status: 400 });
    }

    if (!itinerary || !Array.isArray(itinerary)) {
      return NextResponse.json({
        ok: false,
        error: '일정 데이터가 올바르지 않습니다.'
      }, { status: 400 });
    }

    const group = await prisma.itineraryGroup.create({
      data: {
        name: name.trim(),
        description: description || `${itinerary.length}일 일정`,
        itinerary: itinerary // JSON 필드이므로 직접 저장
      }
    });

    return NextResponse.json({
      ok: true,
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt
      }
    });
  } catch (error) {
    console.error('[Admin Itinerary Groups] Failed to save group:', error);
    console.error('[Admin Itinerary Groups] Error details:', error instanceof Error ? error.message : String(error));
    console.error('[Admin Itinerary Groups] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({
      ok: false,
      error: '그룹 저장에 실패했습니다.',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 });
  }
}
