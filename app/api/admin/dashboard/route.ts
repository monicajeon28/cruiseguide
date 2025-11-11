// app/api/admin/dashboard/route.ts
// 관리자 대시보드 통계 API

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'cg.sid.v2';

// 관리자 권한 확인
async function checkAdminAuth(sid: string | undefined): Promise<boolean> {
  if (!sid) {
    console.log('[Admin Dashboard] No session ID');
    return false;
  }

  try {
    const session = await prisma.session.findUnique({
      where: { id: sid },
      include: {
        User: {
          select: { role: true },
        },
      },
    });

    if (!session) {
      console.log('[Admin Dashboard] Session not found:', sid);
      return false;
    }

    if (!session.User) {
      console.log('[Admin Dashboard] User not found in session');
      return false;
    }

    const isAdmin = session.User.role === 'admin';
    console.log('[Admin Dashboard] Auth check:', { userId: session.userId, role: session.User.role, isAdmin });
    return isAdmin;
  } catch (error) {
    console.error('[Admin Dashboard] Auth check error:', error);
    return false;
  }
}

export async function GET() {
  try {
    // 관리자 권한 확인
    const sid = cookies().get(SESSION_COOKIE)?.value;
    
    if (!sid) {
      console.log('[Admin Dashboard] No session cookie found');
      return NextResponse.json({ 
        ok: false, 
        error: '인증이 필요합니다. 다시 로그인해 주세요.',
        details: 'No session cookie'
      }, { status: 403 });
    }

    const isAdmin = await checkAdminAuth(sid);

    if (!isAdmin) {
      console.log('[Admin Dashboard] Admin check failed for session:', sid);
      return NextResponse.json({ 
        ok: false, 
        error: '인증이 필요합니다. 다시 로그인해 주세요.',
        details: 'Admin check failed'
      }, { status: 403 });
    }

    // 1. 사용자 통계 (전체 - 크루즈몰 + 지니AI 가이드)
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: { isHibernated: false },
    });
    const hibernatedUsers = await prisma.user.count({
      where: { isHibernated: true },
    });
    
    // 지니AI 가이드 사용자 통계 (role이 'user'인 사용자)
    const genieUsers = await prisma.user.count({
      where: { role: 'user' },
    });
    
    // 크루즈몰 사용자 통계 (role이 'community'인 사용자)
    const mallUsers = await prisma.user.count({
      where: { role: 'community' },
    });

    // 2. 여행 통계
    const totalTrips = await prisma.trip.count();
    const tripsByStatus = await prisma.trip.groupBy({
      by: ['status'],
      _count: true,
    });

    const upcomingTrips = tripsByStatus.find(s => s.status === 'Upcoming')?._count || 0;
    const inProgressTrips = tripsByStatus.find(s => s.status === 'InProgress')?._count || 0;
    const completedTrips = tripsByStatus.find(s => s.status === 'Completed')?._count || 0;

    // 3. 진행 중인 여행 상세
    const currentTrips = await prisma.trip.findMany({
      where: { status: 'InProgress' },
      include: {
        User: {  // ✅ 대문자 U로 변경
          select: { name: true, phone: true },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    // 4. 만족도 평균 (크루즈몰 후기 - CruiseReview)
    const reviewStats = await prisma.cruiseReview.aggregate({
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
      where: {
        isApproved: true,
        isDeleted: false,
      },
    });

    const avgSatisfaction = reviewStats._avg.rating || 0;
    const reviewCount = reviewStats._count.id || 0;

    // 5. 최근 후기 (상위 5개) - 크루즈몰 후기
    const recentFeedback = await prisma.cruiseReview.findMany({
      take: 5,
      where: {
        isApproved: true,
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        rating: true,
        title: true,
        content: true,
        cruiseLine: true,
        shipName: true,
        createdAt: true,
      },
    });

    // 6. 알림 통계
    const notificationStats = await prisma.notificationLog.groupBy({
      by: ['notificationType'],
      _count: true,
    });

    const totalNotifications = await prisma.notificationLog.count();

    // 7. 크루즈몰 가입 인원 통계는 위에서 이미 계산됨

    // 8. 크루즈 상품 통계
    const totalProducts = await prisma.cruiseProduct.count();

    // 9. 최근 7일 트렌드 데이터 (일별)
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 일별 사용자 가입 수 (SQLite 호환)
    const dailyUsersRaw = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        date(createdAt) as date,
        COUNT(*) as count
      FROM User
      WHERE createdAt >= ${sevenDaysAgo}
      GROUP BY date(createdAt)
      ORDER BY date ASC
    `;

    // 일별 여행 등록 수 (SQLite 호환)
    const dailyTripsRaw = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        date(createdAt) as date,
        COUNT(*) as count
      FROM Trip
      WHERE createdAt >= ${sevenDaysAgo}
      GROUP BY date(createdAt)
      ORDER BY date ASC
    `;

    // bigint를 number로 변환
    const dailyUsers = dailyUsersRaw.map(d => ({
      date: d.date,
      count: Number(d.count),
    }));

    const dailyTrips = dailyTripsRaw.map(d => ({
      date: d.date,
      count: Number(d.count),
    }));

    // 일별 통합 데이터 생성
    const trendData: Array<{ date: string; users: number; trips: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      
      const userCount = dailyUsers.find(d => d.date === dateStr)?.count || 0;
      const tripCount = dailyTrips.find(d => d.date === dateStr)?.count || 0;
      
      trendData.push({
        date: dateStr,
        users: userCount,
        trips: tripCount,
      });
    }

    // 10. 상품 조회 통계 (크루즈별, 국가별)
    const productViews = await prisma.productView.findMany({
      include: {
        Product: {
          select: {
            cruiseLine: true,
            shipName: true,
            itineraryPattern: true,
          },
        },
      },
    });

    // 국가 코드 -> 국가명 매핑
    const COUNTRY_CODE_TO_NAME: Record<string, string> = {
      'JP': '일본',
      'KR': '한국',
      'TH': '태국',
      'VN': '베트남',
      'MY': '말레이시아',
      'SG': '싱가포르',
      'ES': '스페인',
      'FR': '프랑스',
      'IT': '이탈리아',
      'GR': '그리스',
      'TR': '터키',
      'US': '미국',
      'CN': '중국',
      'TW': '대만',
      'HK': '홍콩',
      'PH': '필리핀',
      'ID': '인도네시아',
    };

    // 크루즈별 조회 수 집계
    const cruiseViewCounts = new Map<string, number>();
    productViews.forEach(view => {
      if (view.Product) {
        const cruiseName = `${view.Product.cruiseLine} ${view.Product.shipName}`.trim();
        cruiseViewCounts.set(cruiseName, (cruiseViewCounts.get(cruiseName) || 0) + 1);
      }
    });

    // 국가별 조회 수 집계
    const countryViewCounts = new Map<string, number>();
    productViews.forEach(view => {
      if (view.Product?.itineraryPattern) {
        const pattern = view.Product.itineraryPattern;
        const countries = new Set<string>();
        
        // destination 필드가 있는 경우
        if (pattern.destination && Array.isArray(pattern.destination)) {
          pattern.destination.forEach((dest: string) => {
            if (dest && typeof dest === 'string') {
              const countryName = dest.split(' - ')[0].split(',')[0].trim();
              if (countryName) countries.add(countryName);
            }
          });
        }
        
        // itineraryPattern이 배열인 경우
        if (Array.isArray(pattern)) {
          pattern.forEach((day: any) => {
            if (day && day.country) {
              const countryCode = day.country;
              const countryName = COUNTRY_CODE_TO_NAME[countryCode] || countryCode;
              if (countryCode !== 'KR') {
                countries.add(countryName);
              }
            }
          });
        }
        
        countries.forEach(country => {
          countryViewCounts.set(country, (countryViewCounts.get(country) || 0) + 1);
        });
      }
    });

    // 상위 10개 크루즈
    const topCruises = Array.from(cruiseViewCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // 상위 10개 국가
    const topCountries = Array.from(countryViewCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return NextResponse.json({
      ok: true,
      dashboard: {
        users: {
          total: totalUsers, // 전체 (크루즈몰 + 지니AI 가이드)
          active: activeUsers,
          hibernated: hibernatedUsers,
          genieUsers: genieUsers, // 지니AI 가이드 사용자 수
          mallUsers: mallUsers, // 크루즈몰 사용자 수
          source: 'all', // 전체 출처 명시
        },
        trips: {
          total: totalTrips,
          upcoming: upcomingTrips,
          inProgress: inProgressTrips,
          completed: completedTrips,
          source: 'genie', // 지니AI 가이드 출처 명시
        },
        currentTrips: currentTrips.map(trip => ({
          id: trip.id,
          cruiseName: trip.cruiseName,
          userName: trip.User?.name || 'Unknown',  // ✅ null 체크 추가
          userPhone: trip.User?.phone || '',  // ✅ null 체크 추가
          startDate: trip.startDate,
          endDate: trip.endDate,
          destination: trip.destination,
        })),
        satisfaction: {
          average: avgSatisfaction ? Math.round(avgSatisfaction * 10) / 10 : 0,
          count: reviewCount,
          source: 'mall', // 크루즈몰 출처 명시
          recentFeedback: recentFeedback.map(review => ({
            id: review.id,
            tripId: null,
            cruiseName: review.cruiseLine && review.shipName 
              ? `${review.cruiseLine} ${review.shipName}` 
              : review.cruiseLine || review.shipName || 'Unknown',
            score: review.rating,
            comments: review.content,
            createdAt: review.createdAt,
          })),
        },
        notifications: {
          total: totalNotifications,
          byType: notificationStats.map(stat => ({
            type: stat.notificationType,
            count: stat._count,
          })),
        },
        pushSubscriptions: mallUsers, // 크루즈몰 가입 인원
        pushSubscriptionsSource: 'mall', // 크루즈몰 출처 명시
        products: totalProducts,
        trends: trendData,
        productViews: {
          topCruises,
          topCountries,
          source: 'mall', // 크루즈몰 출처 명시
        },
      },
    });
  } catch (error) {
    console.error('[Admin Dashboard API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[Admin Dashboard API] Error details:', {
      message: errorMessage,
      stack: errorStack,
    });
    return NextResponse.json(
      { ok: false, error: errorMessage, details: process.env.NODE_ENV === 'development' ? errorStack : undefined },
      { status: 500 }
    );
  }
}

