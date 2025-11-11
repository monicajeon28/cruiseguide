// app/api/admin/refund-policy-groups/[groupId]/route.ts
// 환불/취소 규정 그룹 상세 조회/삭제 API

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

async function checkAdminAuth() {
  const session = await getSession();
  if (!session?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.userId) },
    select: { role: true }
  });

  return user?.role === 'admin' ? user : null;
}

// GET: 그룹 상세 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = parseInt(params.groupId);
    if (isNaN(groupId)) {
      return NextResponse.json({ ok: false, error: 'Invalid group ID' }, { status: 400 });
    }

    const group = await prisma.refundPolicyGroup.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return NextResponse.json({ ok: false, error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        content: group.content,
        createdAt: group.createdAt.toISOString()
      }
    });
  } catch (error: any) {
    console.error('[Refund Policy Group Detail API] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch group' },
      { status: 500 }
    );
  }
}

// DELETE: 그룹 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = parseInt(params.groupId);
    if (isNaN(groupId)) {
      return NextResponse.json({ ok: false, error: 'Invalid group ID' }, { status: 400 });
    }

    await prisma.refundPolicyGroup.delete({
      where: { id: groupId }
    });

    return NextResponse.json({
      ok: true,
      message: 'Group deleted successfully'
    });
  } catch (error: any) {
    console.error('[Refund Policy Group Delete API] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to delete group' },
      { status: 500 }
    );
  }
}











