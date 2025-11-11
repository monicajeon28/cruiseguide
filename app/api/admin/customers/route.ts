import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { getAffiliateOwnershipForUsers } from '@/lib/affiliate/customer-ownership';

const SESSION_COOKIE = 'cg.sid.v2';

// 관리자 권한 확인
async function checkAdminAuth(sid: string | undefined): Promise<boolean> {
  if (!sid) {
    console.log('[Admin Customers] No session ID');
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
      console.log('[Admin Customers] Session not found:', sid);
      return false;
    }

    if (!session.User) {
      console.log('[Admin Customers] User not found in session');
      return false;
    }

    const isAdmin = session.User.role === 'admin';
    console.log('[Admin Customers] Auth check:', { userId: session.userId, role: session.User.role, isAdmin });
    return isAdmin;
  } catch (error) {
    console.error('[Admin Customers] Auth check error:', error);
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    // 관리자 권한 확인
    const sid = cookies().get(SESSION_COOKIE)?.value;
    
    if (!sid) {
      console.log('[Admin Customers] No session cookie found');
      return NextResponse.json({ 
        ok: false, 
        error: '인증이 필요합니다. 다시 로그인해 주세요.',
        details: 'No session cookie'
      }, { status: 403 });
    }

    const isAdmin = await checkAdminAuth(sid);

    if (!isAdmin) {
      console.log('[Admin Customers] Admin check failed for session:', sid);
      return NextResponse.json({ 
        ok: false, 
        error: '인증이 필요합니다. 다시 로그인해 주세요.',
        details: 'Admin check failed'
      }, { status: 403 });
    }

    // URL 파라미터
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all'; // all, active, hibernated, locked
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // createdAt, name, tripCount, lastActiveAt
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // asc, desc
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // 연동된 크루즈몰 고객 ID 목록 조회 (중복 제거용)
    // 크루즈 가이드 고객 중 mallUserId가 설정된 고객들의 mallUserId 목록
    const linkedMallUserIds = await prisma.user.findMany({
      where: {
        role: 'user',
        mallUserId: { not: null },
      },
      select: {
        mallUserId: true,
      },
    }).then(users => 
      users
        .map(u => u.mallUserId)
        .filter((id): id is string => id !== null)
        .map(id => parseInt(id, 10))
        .filter(id => !isNaN(id))
    );

    // 검색 조건
    const where: any = {
      // 모든 크루즈 가이드 고객 표시 (온보딩 여부와 관계없이)
      // role이 'admin'이 아닌 모든 사용자 표시
      role: { not: 'admin' },
      // 연동된 크루즈몰 고객은 제외 (크루즈 가이드 고객으로 통합 표시)
      // 크루즈몰 고객(role: 'community') 중 다른 크루즈 가이드 고객의 mallUserId와 일치하는 ID를 가진 고객은 제외
      NOT: linkedMallUserIds.length > 0 ? {
        AND: [
          { role: 'community' },
          { id: { in: linkedMallUserIds } },
        ],
      } : undefined,
    };
    
    // NOT 조건이 없으면 제거
    if (!where.NOT) {
      delete where.NOT;
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search } },
            { phone: { contains: search } },
            { email: { contains: search } },
          ],
        },
      ];
    }

    // 상태 필터
    if (status === 'active') {
      // 활성 상태: customerStatus가 'active' 또는 'package'이고, 잠금/동면이 아닌 경우
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { customerStatus: { in: ['active', 'package'] } },
            {
              AND: [
                { customerStatus: null },
                { isHibernated: false },
                { isLocked: false },
              ],
            },
          ],
        },
      ];
    } else if (status === 'hibernated') {
      // 동면 상태: customerStatus가 'dormant'이거나 isHibernated가 true인 경우
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { customerStatus: 'dormant' },
            { isHibernated: true },
          ],
        },
      ];
    } else if (status === 'locked') {
      // 잠금 상태: customerStatus가 'locked'이거나 isLocked가 true인 경우
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { customerStatus: 'locked' },
            { isLocked: true },
          ],
        },
      ];
    }

    // 정렬
    const orderBy: any = {};
    if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'tripCount') {
      orderBy.tripCount = sortOrder;
    } else if (sortBy === 'lastActiveAt') {
      orderBy.lastActiveAt = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // 전체 개수 조회
    const total = await prisma.user.count({ where });

    // 데이터 조회
    const customers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true,
        lastActiveAt: true,
        tripCount: true,
        totalTripCount: true,
        isHibernated: true,
        isLocked: true,
        password: true, // 비밀번호 (평문)
        customerStatus: true, // ✅ customerStatus 필드 추가
        customerSource: true, // ✅ customerSource 필드 추가
        testModeStartedAt: true, // 테스트 모드 시작 시간
        currentTripEndDate: true,
        mallUserId: true, // 크루즈몰 사용자 ID
        mallNickname: true, // 크루즈몰 닉네임
        kakaoChannelAdded: true, // 카카오 채널 추가 여부
        kakaoChannelAddedAt: true, // 카카오 채널 추가 일시
        role: true, // role 추가 (크루즈몰 고객 구분용)
        Trip: {  // ✅ 대문자 T로 변경
          select: {
            id: true,
            cruiseName: true,
            companionType: true,
            destination: true,
            startDate: true,
            endDate: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        PasswordEvent: {
          select: {
            id: true,
            to: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    // 연동된 크루즈몰 고객 정보 조회 (mallUserId가 있는 크루즈 가이드 고객용)
    const mallUserIdsToFetch = customers
      .filter(c => c.mallUserId && c.role === 'user')
      .map(c => parseInt(c.mallUserId!, 10))
      .filter(id => !isNaN(id));
    
    const linkedMallUsers = mallUserIdsToFetch.length > 0
      ? await prisma.user.findMany({
          where: {
            id: { in: mallUserIdsToFetch },
            role: 'community',
          },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            mallNickname: true,
          },
        })
      : [];
    
    const mallUsersMap = new Map(
      linkedMallUsers.map(mu => [mu.id, mu])
    );

    // 크루즈몰 고객(role: 'community')이 크루즈가이드와 연동되었는지 확인
    // 크루즈몰 고객 ID를 mallUserId로 가진 크루즈가이드 사용자 찾기
    const mallCustomerIds = customers
      .filter(c => c.role === 'community')
      .map(c => c.id.toString());
    
    const mallCustomerPhones = customers
      .filter(c => c.role === 'community' && c.phone)
      .map(c => c.phone!);
    
    const linkedGenieUsers = (mallCustomerIds.length > 0 || mallCustomerPhones.length > 0)
      ? await prisma.user.findMany({
          where: {
            OR: [
              { mallUserId: { in: mallCustomerIds }, role: 'user' },
              { mallUserId: { in: mallCustomerPhones }, role: 'user' },
            ],
          },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            mallUserId: true,
            Trip: {
              select: { id: true },
              take: 1,
            },
          },
        })
      : [];
    
    // 크루즈몰 고객 ID -> 크루즈가이드 사용자 매핑 생성
    const genieUsersMapByMallId = new Map<string, any>();
    linkedGenieUsers.forEach(genieUser => {
      if (genieUser.mallUserId) {
        // ID로 매핑
        const mallUserIdNum = parseInt(genieUser.mallUserId);
        if (!isNaN(mallUserIdNum)) {
          genieUsersMapByMallId.set(mallUserIdNum.toString(), genieUser);
        }
        // phone으로도 매핑 (mallUserId가 phone인 경우)
        genieUsersMapByMallId.set(genieUser.mallUserId, genieUser);
      }
    });
    
    // 연동된 크루즈가이드 사용자의 여행 정보 조회
    const linkedGenieUserIds = linkedGenieUsers.map(u => u.id);
    const linkedGenieTrips = linkedGenieUserIds.length > 0
      ? await prisma.trip.findMany({
          where: {
            userId: { in: linkedGenieUserIds },
          },
          select: {
            userId: true,
            id: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        })
      : [];
    
    // 크루즈가이드 사용자 ID -> 여행 존재 여부 매핑 생성
    const genieUserHasTripMap = new Map<number, boolean>();
    linkedGenieUsers.forEach(genieUser => {
      // Trip이 이미 조회되어 있으면 확인
      if (genieUser.Trip && genieUser.Trip.length > 0) {
        genieUserHasTripMap.set(genieUser.id, true);
      }
    });
    linkedGenieTrips.forEach(trip => {
      genieUserHasTripMap.set(trip.userId, true);
    });

    const preparedCustomers = customers.map((customer) => {
      let mergedCustomer = { ...customer };
      if (customer.mallUserId && customer.role === 'user') {
        const mallUserIdNum = parseInt(customer.mallUserId, 10);
        if (!isNaN(mallUserIdNum)) {
          const linkedMallUser = mallUsersMap.get(mallUserIdNum);
          if (linkedMallUser) {
            mergedCustomer = {
              ...customer,
              name: customer.name || (linkedMallUser as any).name || customer.mallNickname || null,
              phone: customer.phone || (linkedMallUser as any).phone || null,
              email: customer.email || (linkedMallUser as any).email || null,
              mallNickname: customer.mallNickname || (linkedMallUser as any).mallNickname || null,
            };
          }
        }
      }

      let isLinkedForMallCustomer = false;
      let linkedGenieUser = null;
      if (mergedCustomer.role === 'community') {
        linkedGenieUser = genieUsersMapByMallId.get(mergedCustomer.id.toString());
        if (!linkedGenieUser && mergedCustomer.phone) {
          linkedGenieUser = genieUsersMapByMallId.get(mergedCustomer.phone);
        }
        isLinkedForMallCustomer = !!linkedGenieUser;
      }

      let linkedGenieHasTrip = false;
      if (linkedGenieUser) {
        linkedGenieHasTrip = genieUserHasTripMap.has(linkedGenieUser.id);
      }

      const hasTrip = mergedCustomer.Trip && mergedCustomer.Trip.length > 0;
      const customerStatus = mergedCustomer.customerStatus;
      const customerSource = mergedCustomer.customerSource;

      let customerType: 'cruise-guide' | 'mall' | 'test' | 'admin' | 'mall-admin' | 'prospect' = 'cruise-guide';

      if (customerSource === 'admin') {
        customerType = 'admin';
      } else if (customerSource === 'mall-admin') {
        customerType = 'mall-admin';
      } else if (customerSource === 'mall-signup') {
        customerType = 'mall';
      } else if (customerSource === 'test-guide') {
        customerType = 'test';
      } else if (customerSource === 'cruise-guide') {
        customerType = 'cruise-guide';
      } else if (customerStatus === 'test' || customerStatus === 'test-locked') {
        customerType = 'test';
      } else if (customerStatus === 'excel') {
        customerType = 'prospect';
      } else if (mergedCustomer.mallUserId && mergedCustomer.role === 'user') {
        customerType = 'mall';
      } else if (mergedCustomer.email && mergedCustomer.mallNickname && mergedCustomer.role === 'community') {
        customerType = 'mall';
      } else if (mergedCustomer.name && mergedCustomer.phone && hasTrip) {
        customerType = 'cruise-guide';
      }

      let genieStatus: 'active' | 'package' | 'dormant' | 'locked' | 'test' | 'test-locked' | null = null;

      if (customerType === 'test') {
        if (customerStatus === 'test-locked') {
          genieStatus = 'test-locked';
        } else if (mergedCustomer.testModeStartedAt) {
          const now = new Date();
          const testModeEndAt = new Date(mergedCustomer.testModeStartedAt);
          testModeEndAt.setHours(testModeEndAt.getHours() + 72);
          genieStatus = now > testModeEndAt ? 'test-locked' : 'test';
        } else {
          genieStatus = 'test';
        }
      } else if (customerType === 'prospect') {
        genieStatus = null;
      } else if (linkedGenieHasTrip && mergedCustomer.role === 'community') {
        genieStatus = 'active';
        if (mergedCustomer.isLocked || mergedCustomer.isHibernated || customerStatus === 'locked' || customerStatus === 'dormant') {
          // 비동기 업데이트 (await 없이 실행, 에러는 catch로 처리)
          prisma.user.update({
            where: { id: mergedCustomer.id },
            data: {
              isLocked: false,
              lockedAt: null,
              lockedReason: null,
              isHibernated: false,
              hibernatedAt: null,
              customerStatus: 'active',
              lastActiveAt: new Date(),
            },
          }).catch(error => {
            console.error(`[Admin Customers API] 크루즈몰 사용자 (ID: ${mergedCustomer.id}) 상태 활성화 실패:`, error);
          });
        }
      } else if (customerStatus === 'active' || customerStatus === 'package') {
        genieStatus = customerStatus;
      } else if (customerStatus === 'locked' || mergedCustomer.isLocked) {
        genieStatus = 'locked';
      } else if (customerStatus === 'dormant' || mergedCustomer.isHibernated) {
        genieStatus = 'dormant';
      } else if (hasTrip || linkedGenieHasTrip) {
        genieStatus = 'package';
      } else {
        genieStatus = 'locked';
      }

      const latestPasswordEvent = mergedCustomer.PasswordEvent && mergedCustomer.PasswordEvent.length > 0
        ? mergedCustomer.PasswordEvent[0]
        : null;
      const currentPassword = latestPasswordEvent?.to || null;

      let daysRemaining: number | null = null;
      if (mergedCustomer.currentTripEndDate) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const endDate = new Date(mergedCustomer.currentTripEndDate);
        endDate.setHours(0, 0, 0, 0);
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysRemaining = diffDays;
      }

      return {
        ...mergedCustomer,
        createdAt: mergedCustomer.createdAt.toISOString(),
        lastActiveAt: mergedCustomer.lastActiveAt?.toISOString() || null,
        currentTripEndDate: mergedCustomer.currentTripEndDate?.toISOString() || null,
        status: genieStatus,
        customerType,
        isMallUser: customerType === 'mall' || (!!mergedCustomer.mallUserId && mergedCustomer.role === 'user'),
        isLinked: (!!mergedCustomer.mallUserId && mergedCustomer.role === 'user') || isLinkedForMallCustomer,
        currentPassword,
        daysRemaining,
        kakaoChannelAdded: mergedCustomer.kakaoChannelAdded || false,
        kakaoChannelAddedAt: mergedCustomer.kakaoChannelAddedAt?.toISOString() || null,
        trips: (mergedCustomer.Trip || []).map(trip => ({
          ...trip,
          startDate: trip.startDate?.toISOString() || null,
          endDate: trip.endDate?.toISOString() || null,
        })),
      };
    });

    const ownershipMap = await getAffiliateOwnershipForUsers(
      preparedCustomers.map((customer) => ({
        id: customer.id,
        phone: customer.phone || null,
      })),
    );

    const customersWithOwnership = preparedCustomers.map((customer) => {
      const ownership = ownershipMap.get(customer.id) || null;
      return {
        ...customer,
        affiliateOwnership: ownership ? { ...ownership } : null,
      };
    });

    return NextResponse.json({
      ok: true,
      customers: customersWithOwnership,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Admin Customers API] Error:', error);
    console.error('[Admin Customers API] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error))
          : undefined
      },
      { status: 500 }
    );
  }
}








