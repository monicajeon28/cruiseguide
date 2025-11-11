// app/api/community/link-genie/route.ts
// 크루즈몰과 크루즈 가이드 지니 연동 API

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';

// POST: 크루즈 가이드 지니와 연동
export async function POST(req: Request) {
  try {
    const session = await getSession();
    
    if (!session || !session.userId) {
      return NextResponse.json(
        { ok: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { name, phone } = await req.json();

    if (!name || !phone) {
      return NextResponse.json(
        { ok: false, error: '이름과 연락처를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.userId);
    
    // 현재 사용자 정보 조회
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, name: true }
    });

    if (!currentUser) {
      return NextResponse.json(
        { ok: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 크루즈 가이드 지니에서 동일한 이름과 연락처로 사용자 찾기
    // 크루즈 가이드 지니 사용자는 role이 'user'
    let genieUser = null;
    try {
      genieUser = await prisma.user.findFirst({
        where: {
          name: name.trim(),
          phone: phone.trim(),
          role: 'user' // 크루즈 가이드 지니 사용자는 일반 user
        },
        include: {
          Trip: {
            orderBy: { endDate: 'desc' },
            take: 1,
            select: {
              id: true,
              status: true,
              startDate: true,
              endDate: true,
            }
          }
        }
      });
    } catch (queryError: any) {
      console.error('[LINK_GENIE] Query error:', queryError);
      // 쿼리 에러가 발생해도 계속 진행 (사용자를 찾지 못한 것으로 처리)
    }

    let genieStatus: string | null = null;
    let linkedGenieUserId: number | null = null;

    if (genieUser) {
      // 크루즈 가이드 지니 사용자와 연동
      linkedGenieUserId = genieUser.id;
      
      // 여행 상태 확인
      const trip = genieUser.Trip && genieUser.Trip.length > 0 ? genieUser.Trip[0] : null;
      const now = new Date();

      if (trip && trip.endDate) {
        const endDate = new Date(trip.endDate);
        const statusLower = (trip.status || '').toLowerCase();

        if (statusLower === 'cancelled' || statusLower === 'canceled') {
          genieStatus = 'expired';
        } else if (endDate >= now) {
          genieStatus = 'active';
        } else {
          genieStatus = 'expired';
        }
      } else {
        genieStatus = null;
      }

      // 크루즈몰 사용자 정보 업데이트
      try {
        await prisma.user.update({
          where: { id: userId },
          data: {
            mallUserId: phone.trim(),
            mallNickname: name.trim(),
            genieStatus: genieStatus,
            genieLinkedAt: new Date()
          }
        });
      } catch (updateError: any) {
        console.error('[LINK_GENIE] Update mall user error:', updateError);
        throw updateError;
      }

      // 크루즈 가이드 지니 사용자 정보에도 크루즈몰 정보 업데이트
      try {
        await prisma.user.update({
          where: { id: genieUser.id },
          data: {
            mallUserId: currentUser.phone || phone.trim(),
            mallNickname: currentUser.name || name.trim()
          }
        });
      } catch (updateGenieError: any) {
        console.error('[LINK_GENIE] Update genie user error:', updateGenieError);
        // 지니 사용자 업데이트 실패는 치명적이지 않으므로 계속 진행
      }
    } else {
      // 크루즈 가이드 지니 사용자를 찾지 못한 경우
      // 크루즈몰 사용자 정보만 업데이트
      try {
        await prisma.user.update({
          where: { id: userId },
          data: {
            mallUserId: phone.trim(),
            mallNickname: name.trim(),
            genieStatus: null,
            genieLinkedAt: new Date()
          }
        });
      } catch (updateError: any) {
        console.error('[LINK_GENIE] Update mall user (no genie) error:', updateError);
        throw updateError;
      }
    }

    return NextResponse.json({
      ok: true,
      genieStatus: genieStatus,
      linkedGenieUserId: linkedGenieUserId,
      message: genieUser 
        ? '연동 완료' 
        : '크루즈 가이드 지니 사용자를 찾을 수 없습니다. 나중에 다시 시도해주세요.',
      linked: !!genieUser,
    });
  } catch (error: any) {
    console.error('[LINK_GENIE] Error:', error);
    console.error('[LINK_GENIE] Error message:', error?.message);
    console.error('[LINK_GENIE] Error stack:', error?.stack);
    return NextResponse.json(
      { 
        ok: false, 
        error: '연동 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

