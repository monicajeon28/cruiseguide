import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/users
 * 사용자 목록 조회 (관리자 전용)
 * 쿼리 파라미터:
 * - search: 이름 또는 전화번호로 검색
 * - role: 'user' (지니 가이드) 또는 'community' (크루즈몰) 필터링
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    // 관리자 권한 확인
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (dbUser?.role !== 'admin') {
      return NextResponse.json({ ok: false, message: 'Admin access required' }, { status: 403 });
    }

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const roleFilter = searchParams.get('role'); // 'user' 또는 'community'

    // 검색 조건 구성
    const where: any = {
      role: { not: 'admin' }  // 관리자 제외
    };

    // role 필터링
    if (roleFilter === 'user' || roleFilter === 'community') {
      where.role = roleFilter;
    }

    // 검색 조건 추가
    if (search) {
      // SQLite는 mode: 'insensitive'를 지원하지 않으므로 contains만 사용
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    // 일반 사용자 목록 조회
    // 검색어가 없으면 전체 목록 반환 (최대 200명)
    const limit = search ? 100 : 200;
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        onboarded: true,
        createdAt: true,
        genieStatus: true,
        mallNickname: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ ok: true, users });
  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 });
  }
}
