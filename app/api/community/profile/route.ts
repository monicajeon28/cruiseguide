// app/api/community/profile/route.ts
// 커뮤니티 프로필 조회/수정 API

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/crypto';

export async function GET() {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { ok: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.userId, 10);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        genieStatus: true,
        mallUserId: true,
        mallNickname: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const loginId = user.phone ?? '';
    const geniePhone = user.mallUserId ?? '';
    const genieName = user.mallNickname ?? '';
    
    // 크루즈 가이드 지니 연동 정보 확인 (mallUserId가 현재 사용자 ID와 일치하는 지니 사용자 찾기)
    const linkedGenieUser = await prisma.user.findFirst({
      where: {
        mallUserId: user.id.toString(),
        genieStatus: { not: null },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        genieStatus: true,
        genieLinkedAt: true,
        isLocked: true,
      },
    });

    // 크루즈몰 연동 정보 확인 (mallUserId가 설정되어 있으면 해당 크루즈몰 사용자 정보 조회)
    let linkedMallUser = null;
    if (user.mallUserId) {
      const mallUserId = parseInt(user.mallUserId);
      if (!isNaN(mallUserId) && mallUserId > 0) {
        const mallUser = await prisma.user.findUnique({
          where: { id: mallUserId },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            createdAt: true,
            lastActiveAt: true,
          },
        });
        if (mallUser) {
          linkedMallUser = {
            id: mallUser.id,
            name: mallUser.name,
            phone: mallUser.phone,
            email: mallUser.email,
            createdAt: mallUser.createdAt.toISOString(),
            lastActiveAt: mallUser.lastActiveAt?.toISOString() || null,
            nickname: user.mallNickname || mallUser.name || null,
          };
        }
      }
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        genieStatus: user.genieStatus,
        loginId,
        geniePhone,
        genieName,
        mallUserId: user.mallUserId,
        mallNickname: user.mallNickname,
        linkedGenieUser: linkedGenieUser ? {
          id: linkedGenieUser.id,
          name: linkedGenieUser.name,
          phone: linkedGenieUser.phone,
          genieStatus: linkedGenieUser.genieStatus,
          genieLinkedAt: linkedGenieUser.genieLinkedAt?.toISOString() || null,
          isLocked: linkedGenieUser.isLocked,
        } : null,
        linkedMallUser: linkedMallUser,
      },
    });
  } catch (error) {
    console.error('[COMMUNITY_PROFILE][GET] Error:', error);
    return NextResponse.json(
      { ok: false, error: '프로필 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { ok: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.userId, 10);
    
    // 현재 사용자 정보 조회 (권한 확인용)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        role: true,
        name: true,
      }
    });

    if (!currentUser) {
      return NextResponse.json(
        { ok: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const { password, name } = await req.json();
    const isAdminAccount = currentUser.role === 'admin' && currentUser.phone && currentUser.phone.startsWith('user');

    // 업데이트할 데이터 준비
    const updateData: any = {
      updatedAt: new Date(),
    };

    // 닉네임 변경 (user1~user10 관리자만 가능)
    if (name !== undefined) {
      if (!isAdminAccount) {
        return NextResponse.json(
          { ok: false, error: '닉네임은 관리자만 변경할 수 있습니다.' },
          { status: 403 }
        );
      }
      updateData.name = name !== null && name.trim() !== '' ? name.trim() : null;
    }

    // 비밀번호 변경 (관리자 계정이 아닌 경우만)
    if (password && password.trim()) {
      if (isAdminAccount) {
        return NextResponse.json(
          { ok: false, error: '관리자 계정의 비밀번호는 변경할 수 없습니다.' },
          { status: 403 }
        );
      }
      updateData.password = await hashPassword(password.trim());
    }

    // 변경할 데이터가 없으면 에러
    if (Object.keys(updateData).length === 1) { // updatedAt만 있는 경우
      return NextResponse.json(
        { ok: false, error: '변경할 정보가 없습니다.' },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    return NextResponse.json({
      ok: true,
      message: '프로필이 수정되었습니다.'
    });
  } catch (error) {
    console.error('[COMMUNITY_PROFILE][PATCH] Error:', error);
    return NextResponse.json(
      { ok: false, error: '프로필 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
