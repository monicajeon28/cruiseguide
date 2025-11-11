import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

// 관리자 권한 확인
async function checkAdminAuth() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, role: true },
  });

  if (!user || user.role !== 'admin') {
    return null;
  }

  return sessionUser;
}

// GET: 인사이트 목록 조회
export async function GET(req: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const insightType = searchParams.get('type');

    const where: any = {};
    if (userId) {
      where.userId = parseInt(userId);
    }
    if (insightType) {
      where.insightType = insightType;
    }

    console.log('[Admin Insights GET] Query params:', { userId, insightType, where });

    const insights = await prisma.marketingInsight.findMany({
      where,
      include: {
        User: {  // ✅ 대문자 U로 변경
          select: { 
            id: true, 
            name: true, 
            phone: true,
            mallUserId: true,
            mallNickname: true,
            genieStatus: true,
            genieLinkedAt: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    console.log('[Admin Insights GET] Found insights:', insights.length);
    
    // User 관계를 user로 변환 (프론트엔드 호환성)
    // 연동된 크루즈몰 사용자 정보도 함께 조회
    const formattedInsights = await Promise.all(insights.map(async (insight: any) => {
      const genieUser = insight.User || { id: insight.userId, name: null, phone: null };
      
      // 연동된 크루즈몰 사용자 찾기
      let mallUser = null;
      if (genieUser.mallUserId) {
        try {
          // mallUserId가 숫자 ID인지 전화번호인지 확인
          const mallUserIdNum = parseInt(genieUser.mallUserId);
          const isNumericId = !isNaN(mallUserIdNum);
          
          mallUser = await prisma.user.findFirst({
            where: {
              OR: isNumericId
                ? [
                    { id: mallUserIdNum, role: 'community' },
                    { phone: genieUser.mallUserId, role: 'community' },
                  ]
                : [
                    { phone: genieUser.mallUserId, role: 'community' },
                    { name: genieUser.mallUserId, role: 'community' },
                  ],
            },
            select: {
              id: true,
              name: true,
              phone: true,
            },
          });
        } catch (error) {
          console.error('[Admin Insights] Error finding mall user:', error);
        }
      }
      
      // mallUserId가 없지만 genieUser의 phone으로 크루즈몰 사용자를 찾기
      if (!mallUser && genieUser.phone) {
        try {
          mallUser = await prisma.user.findFirst({
            where: {
              phone: genieUser.phone,
              role: 'community',
            },
            select: {
              id: true,
              name: true,
              phone: true,
            },
          });
        } catch (error) {
          console.error('[Admin Insights] Error finding mall user by phone:', error);
        }
      }
      
      return {
        id: insight.id,
        userId: insight.userId,
        insightType: insight.insightType,
        data: insight.data,
        createdAt: insight.createdAt,
        updatedAt: insight.updatedAt,
        user: {
          ...genieUser,
          mallUser: mallUser, // 연동된 크루즈몰 사용자 정보
        },
      };
    }));

    return NextResponse.json({
      ok: true,
      insights: formattedInsights,
    });
  } catch (error) {
    console.error('[Admin Insights GET] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}



