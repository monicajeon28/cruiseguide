// app/api/admin/refund-policy-groups/route.ts
// 환불/취소 규정 그룹 관리 API

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

// GET: 그룹 목록 조회
export async function GET() {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const groups = await prisma.refundPolicyGroup.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      ok: true,
      groups: groups.map(g => ({
        id: g.id,
        name: g.name,
        description: g.description,
        createdAt: g.createdAt.toISOString()
      }))
    });
  } catch (error: any) {
    console.error('[Refund Policy Groups API] GET error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

// POST: 새 그룹 저장
export async function POST(req: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, content } = body;

    if (!name || !content) {
      return NextResponse.json(
        { ok: false, error: 'Name and content are required' },
        { status: 400 }
      );
    }

    const group = await prisma.refundPolicyGroup.create({
      data: {
        name,
        description: description || null,
        content: content
      }
    });

    return NextResponse.json({
      ok: true,
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        createdAt: group.createdAt.toISOString()
      }
    });
  } catch (error: any) {
    console.error('[Refund Policy Groups API] POST error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to save group' },
      { status: 500 }
    );
  }
}











