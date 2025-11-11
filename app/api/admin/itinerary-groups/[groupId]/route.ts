// app/api/admin/itinerary-groups/[groupId]/route.ts
// 특정 그룹 불러오기 API

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const groupId = parseInt(params.groupId);
    
    if (isNaN(groupId)) {
      return NextResponse.json({
        ok: false,
        error: '잘못된 그룹 ID입니다.'
      }, { status: 400 });
    }

    const group = await prisma.itineraryGroup.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return NextResponse.json({
        ok: false,
        error: '그룹을 찾을 수 없습니다.'
      }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        itinerary: group.itinerary,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt
      }
    });
  } catch (error) {
    console.error('Failed to load group:', error);
    return NextResponse.json({
      ok: false,
      error: '그룹을 불러오는데 실패했습니다.'
    }, { status: 500 });
  }
}
