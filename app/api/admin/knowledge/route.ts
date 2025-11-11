import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

interface KnowledgeItem {
  id?: number;
  category: string;
  title: string;
  keywords: string[];
  content: string;
  url?: string;
}

/**
 * GET: 모든 지식 기사 조회
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

    // 관리자 권한 확인 (선택사항 - 공개 지식 베이스라면 제거 가능)
    const categoryParam = req.nextUrl.searchParams.get('category');

    let whereClause: any = {};
    if (categoryParam) {
      whereClause.category = categoryParam;
    }

    const knowledge = await prisma.knowledgeBase.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      { data: knowledge },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] 지식 베이스 조회 오류:', error);
    return NextResponse.json(
      { error: '지식 베이스 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * POST: 새로운 지식 기사 생성 (관리자 전용)
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

    // 관리자 권한 확인
    const user = await prisma.user.findFirst({
      where: { id: session.user.id, role: 'admin' },
    });

    if (!user) {
      return NextResponse.json(
        { error: '관리자 권한이 없습니다' },
        { status: 403 }
      );
    }

    const { category, title, keywords, content, url } = await req.json();

    if (!category || !title || !content) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다' },
        { status: 400 }
      );
    }

    const knowledge = await prisma.knowledgeBase.create({
      data: {
        category,
        title,
        keywords: keywords || [],
        content,
        url: url || '',
      },
    });

    return NextResponse.json(
      { data: knowledge },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] 지식 베이스 생성 오류:', error);
    return NextResponse.json(
      { error: '지식 베이스 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * PUT: 지식 기사 수정 (관리자 전용)
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    const user = await prisma.user.findFirst({
      where: { id: session.user.id, role: 'admin' },
    });

    if (!user) {
      return NextResponse.json(
        { error: '관리자 권한이 없습니다' },
        { status: 403 }
      );
    }

    const { id, category, title, keywords, content, url } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID가 필요합니다' },
        { status: 400 }
      );
    }

    const updated = await prisma.knowledgeBase.update({
      where: { id },
      data: {
        ...(category && { category }),
        ...(title && { title }),
        ...(keywords && { keywords }),
        ...(content && { content }),
        ...(url && { url }),
      },
    });

    return NextResponse.json(
      { data: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] 지식 베이스 수정 오류:', error);
    return NextResponse.json(
      { error: '지식 베이스 수정 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: 지식 기사 삭제 (관리자 전용)
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

    // 관리자 권한 확인
    const user = await prisma.user.findFirst({
      where: { id: session.user.id, role: 'admin' },
    });

    if (!user) {
      return NextResponse.json(
        { error: '관리자 권한이 없습니다' },
        { status: 403 }
      );
    }

    const id = req.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID가 필요합니다' },
        { status: 400 }
      );
    }

    await prisma.knowledgeBase.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json(
      { message: '지식 기사가 삭제되었습니다' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] 지식 베이스 삭제 오류:', error);
    return NextResponse.json(
      { error: '지식 베이스 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
