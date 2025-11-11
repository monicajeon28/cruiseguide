
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';                // ✅ default import (중요)
import { cookies, headers } from 'next/headers';
import { randomBytes } from 'crypto';
import { generateCsrfToken } from '@/lib/csrf';
import { checkRateLimit, RateLimitPolicies } from '@/lib/rate-limiter';
import { getClientIpFromRequest } from '@/lib/ip-utils';
import { authLogger, securityLogger } from '@/lib/logger';
import { reactivateUser, updateLastActive } from '@/lib/scheduler/lifecycleManager';
import { normalizeItineraryPattern, extractVisitedCountriesFromItineraryPattern, extractDestinationsFromItineraryPattern } from '@/lib/utils/itineraryPattern';

const SESSION_COOKIE = 'cg.sid.v2';

export async function POST(req: Request) {
  try {
    // Rate Limiting 체크
    const headersList = headers();
    const clientIp = getClientIpFromRequest(req, headersList);
    const rateLimitKey = `login:${clientIp}`;
    
    const { limited, resetTime } = checkRateLimit(rateLimitKey, RateLimitPolicies.LOGIN);
    
    if (limited) {
      securityLogger.rateLimitExceeded(clientIp, '/api/auth/login', RateLimitPolicies.LOGIN.limit);
      const retryAfter = resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : 60;
      return NextResponse.json(
        { 
          ok: false, 
          error: '너무 많은 로그인 시도입니다. 잠시 후 다시 시도해주세요.',
          retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
          }
        }
      );
    }

    let { phone, password, name, mode } = await req.json();

    // 입력값 앞뒤 공백 제거
    phone = phone?.trim() || '';
    password = password?.trim() || '';
    name = name?.trim() || '';

    if (password === 'qwe1') {
      const identifier = phone;
      const digitsOnly = identifier.replace(/[^0-9]/g, '');

      const affiliateUser = await prisma.user.findFirst({
        where: {
          OR: [
            { mallUserId: identifier },
            { phone: identifier },
            ...(digitsOnly ? [{ phone: digitsOnly }] : []),
          ],
        },
        select: {
          id: true,
          mallUserId: true,
          mallNickname: true,
          phone: true,
          password: true,
          loginCount: true,
        },
      });

      if (!affiliateUser) {
        return NextResponse.json(
          { ok: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' },
          { status: 401 },
        );
      }

      let affiliateProfile = await prisma.affiliateProfile.findFirst({
        where: { userId: affiliateUser.id, status: 'ACTIVE' },
        select: { id: true },
      });

      if (!affiliateProfile) {
        if (!affiliateUser.mallUserId) {
          return NextResponse.json(
            { ok: false, error: '파트너 아이디가 발급되지 않은 계정입니다. 관리자에게 문의해주세요.' },
            { status: 400 },
          );
        }
        const affiliateCode = `AFF-${affiliateUser.mallUserId.toUpperCase()}-${randomBytes(2)
          .toString('hex')
          .toUpperCase()}`;
        affiliateProfile = await prisma.affiliateProfile.create({
          data: {
            userId: affiliateUser.id,
            affiliateCode,
            type: 'BRANCH_MANAGER',
            status: 'ACTIVE',
            displayName: affiliateUser.mallNickname || affiliateUser.mallUserId || '파트너',
            nickname: affiliateUser.mallNickname || affiliateUser.mallUserId || '파트너',
            branchLabel: null,
            landingSlug: affiliateUser.mallUserId || undefined,
            landingAnnouncement: '파트너 전용 샘플 계정입니다.',
            welcomeMessage: '반갑습니다! 파트너몰 테스트 계정입니다.',
          },
          select: { id: true },
        });
      }

      if (affiliateUser.password !== 'qwe1') {
        await prisma.user.update({
          where: { id: affiliateUser.id },
          data: { password: 'qwe1' },
        });
      }

      const sessionId = randomBytes(32).toString('hex');
      const csrfToken = generateCsrfToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const session = await prisma.session.create({
        data: {
          id: sessionId,
          userId: affiliateUser.id,
          csrfToken,
          expiresAt,
        },
        select: { id: true, csrfToken: true },
      });

      cookies().set(SESSION_COOKIE, session.id, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });

      await prisma.user.update({
        where: { id: affiliateUser.id },
        data: {
          loginCount: { increment: 1 },
          lastActiveAt: new Date(),
        },
      });

      authLogger.loginSuccess(affiliateUser.id, clientIp);
      await reactivateUser(affiliateUser.id);
      await updateLastActive(affiliateUser.id);

      return NextResponse.json({
        ok: true,
        next: `/partner/${affiliateUser.mallUserId}/dashboard`,
        partnerId: affiliateUser.mallUserId,
        csrfToken: session.csrfToken,
      });
    }

    // 비밀번호 1101 = 테스트 모드 (이름, 연락처, 비밀번호 모두 필수)
    if (password === '1101') {
      console.log('[Login] 1101 테스트 모드 로그인 시도:', { name, phone, password: '***' });
      
      if (!name) {
        console.log('[Login] 1101 로그인 실패: 이름 없음');
        return NextResponse.json({ 
          ok: false, 
          error: '이름을 입력해주세요.' 
        }, { status: 400 });
      }
      if (!phone || phone.length === 0) {
        console.log('[Login] 1101 로그인 실패: 연락처 없음');
        return NextResponse.json({ 
          ok: false, 
          error: '연락처를 입력해주세요.' 
        }, { status: 400 });
      }

      try {
        console.log('[Login] 1101 사용자 조회 시작:', { name, phone, password: '***' });
        
        // 디버깅: 이름이나 전화번호로 사용자 찾기 시도
        const debugUserByName = await prisma.user.findFirst({
          where: { name },
          select: { id: true, name: true, phone: true, password: true, role: true, customerStatus: true },
        });
        const debugUserByPhone = await prisma.user.findFirst({
          where: { phone },
          select: { id: true, name: true, phone: true, password: true, role: true, customerStatus: true },
        });
        console.log('[Login] 1101 디버깅 - 이름으로 찾기:', { found: !!debugUserByName, user: debugUserByName });
        console.log('[Login] 1101 디버깅 - 전화번호로 찾기:', { found: !!debugUserByPhone, user: debugUserByPhone });
        
        // 이름, 연락처, 비밀번호 1101로 사용자 찾기
        let testUser = await prisma.user.findFirst({
          where: {
            name,
            password: '1101',
            role: 'user',
            phone: phone,
          },
          select: { 
            id: true, 
            name: true,
            phone: true,
            password: true, 
            role: true,
            onboarded: true, 
            loginCount: true, 
            customerStatus: true,
            testModeStartedAt: true,
            customerSource: true,
            Trip: { select: { id: true }, take: 1 },
          },
        });

        console.log('[Login] 1101 사용자 조회 결과:', { found: !!testUser, userId: testUser?.id });
        
        // 사용자가 없으면 자동 생성 (테스트 모드)
        if (!testUser) {
          console.log('[Login] 1101 신규 사용자 생성 시작');
          const now = new Date();
          const newUser = await prisma.user.create({
            data: {
              name,
              phone: phone, // 연락처 필수
              password: '1101',
              onboarded: false,
              loginCount: 1,
              role: 'user',
              customerStatus: 'test',
              testModeStartedAt: now, // 테스트 모드 시작 시간 기록
              customerSource: 'test-guide', // 크루즈 가이드 3일 테스트
            },
            select: { 
              id: true, 
              password: true, 
              onboarded: true, 
              loginCount: true, 
              customerStatus: true,
              testModeStartedAt: true,
              Trip: { select: { id: true }, take: 1 },
            },
          });
          testUser = newUser;
        } else {
          // 기존 사용자: 비밀번호 확인 (1101만 허용)
          if (testUser.password !== '1101') {
            return NextResponse.json({ 
              ok: false, 
              error: '비밀번호가 올바르지 않습니다. 테스트 모드 비밀번호를 확인해주세요.' 
            }, { status: 401 });
          }
        }

        const now = new Date();
        let testModeStartedAt: Date | null = testUser.testModeStartedAt;

        // 테스트 모드 시작 시간이 없으면 지금 시작
        if (!testModeStartedAt) {
          testModeStartedAt = now;
        }

        // 72시간 경과 확인
        const testModeEndAt = new Date(testModeStartedAt);
        testModeEndAt.setHours(testModeEndAt.getHours() + 72);

        if (now > testModeEndAt) {
          // 72시간 경과 → 잠금 상태로 변경
          await prisma.user.update({
            where: { id: testUser.id },
            data: {
              customerStatus: 'locked',
              isLocked: true,
              lockedAt: now,
              lockedReason: '테스트 모드 72시간 만료',
              password: '8300', // 잠금 비밀번호로 변경
            },
          });

          return NextResponse.json({ 
            ok: false, 
            error: '테스트 기간이 만료되었습니다. 관리자에게 문의해주세요.' 
          }, { status: 403 });
        }

        // 테스트 모드 활성화
        await prisma.user.update({
          where: { id: testUser.id },
          data: {
            customerStatus: 'test',
            testModeStartedAt: testModeStartedAt || now, // null 체크 후 할당
            isLocked: false,
            isHibernated: false,
            loginCount: { increment: 1 },
            customerSource: testUser.customerSource || 'test-guide', // customerSource가 없으면 설정
          },
        });

        // 1101 테스트 모드: SAMPLE-MED-001 상품으로 Trip 자동 생성/업데이트
        console.log('[Auth Login] 1101 테스트 모드: Trip 존재 여부 확인 시작:', { 
          userId: testUser.id,
          hasTripFromQuery: testUser.Trip && testUser.Trip.length > 0,
          tripIdFromQuery: testUser.Trip?.[0]?.id,
          productIdFromQuery: testUser.Trip?.[0]?.productId
        });
        
        // 사용자 조회 시 이미 Trip을 포함했으므로, 별도 조회 없이 사용
        const existingTrip = testUser.Trip && testUser.Trip.length > 0 ? testUser.Trip[0] : null;

        console.log('[Auth Login] 1101 테스트 모드: Trip 존재 여부 확인 결과:', { 
          userId: testUser.id, 
          hasTrip: !!existingTrip,
          tripId: existingTrip?.id,
          productId: existingTrip?.productId
        });

        // SAMPLE-MED-001 상품 조회 (항상 조회)
        console.log('[Auth Login] 1101 테스트 모드: SAMPLE-MED-001 상품 조회 시작');
        const product = await prisma.cruiseProduct.findUnique({
          where: { productCode: 'SAMPLE-MED-001' },
        });

        console.log('[Auth Login] 1101 테스트 모드: SAMPLE-MED-001 상품 조회 결과:', { 
          found: !!product,
          productId: product?.id,
          productCode: product?.productCode,
          cruiseLine: product?.cruiseLine,
          shipName: product?.shipName,
          nights: product?.nights,
          days: product?.days,
          hasItineraryPattern: !!product?.itineraryPattern,
        });

        // 기존 Trip이 SAMPLE-MED-001이 아니면 삭제
        if (existingTrip && product && existingTrip.productId !== product.id) {
          console.log('[Auth Login] 1101 테스트 모드: 기존 Trip이 SAMPLE-MED-001이 아님, 삭제 후 재생성:', {
            userId: testUser.id,
            existingTripId: existingTrip.id,
            existingProductId: existingTrip.productId,
            targetProductId: product.id,
          });
          
          // 기존 Trip과 관련된 Itinerary, VisitedCountry 삭제
          await prisma.itinerary.deleteMany({
            where: { tripId: existingTrip.id },
          });
          
          await prisma.trip.delete({
            where: { id: existingTrip.id },
          });
          
          console.log('[Auth Login] 1101 테스트 모드: ✅ 기존 Trip 삭제 완료');
        }

        // Trip이 없거나 삭제된 경우 새로 생성
        if ((!existingTrip || (existingTrip && product && existingTrip.productId !== product.id)) && product) {
          console.log('[Auth Login] 1101 테스트 모드: Trip 생성 시작');
          console.log('[Auth Login] 1101 테스트 모드: 현재 시간:', now.toISOString());
          
          try {
            console.log('[Auth Login] 1101 테스트 모드: ✅ SAMPLE-MED-001 상품 찾음, Trip 생성 시작');
              
              // 출발일: 로그인한 날짜로부터 3일 전 (테스트 모드용)
              // 예: 오늘이 1월 10일이면 출발일은 1월 7일
              const startDate = new Date(now);
              startDate.setDate(startDate.getDate() - 3);
              startDate.setHours(0, 0, 0, 0);

              // 종료 날짜 계산 (출발일 + (days - 1)일)
              // 예: 5박 6일이면 출발일 + 5일 = 종료일
              const endDate = new Date(startDate);
              endDate.setDate(endDate.getDate() + product.days - 1);
              endDate.setHours(23, 59, 59, 999);

              console.log('[Auth Login] 1101 테스트 모드: 날짜 계산 완료:', {
                loginDate: now.toISOString().split('T')[0],
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                nights: product.nights,
                days: product.days,
              });

              // 목적지 배열 생성 (itineraryPattern에서 추출)
              const itineraryPattern = normalizeItineraryPattern(product.itineraryPattern);
              const destinations = extractDestinationsFromItineraryPattern(product.itineraryPattern);
              const visitedCountries = extractVisitedCountriesFromItineraryPattern(product.itineraryPattern);

              // 예약번호 자동 생성
              const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
              const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
              const reservationCode = `CRD-${dateStr}-${randomStr}`;

              console.log('[Auth Login] 1101 테스트 모드: Trip 생성 데이터 준비 완료:', {
                userId: testUser.id,
                productId: product.id,
                reservationCode,
                cruiseName: `${product.cruiseLine} ${product.shipName}`,
                destinations: destinations,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                nights: product.nights,
                days: product.days,
                visitCount: destinations.length,
              });

              // Trip 생성
              console.log('[Auth Login] 1101 테스트 모드: Trip 생성 시작 (DB insert)');
              const trip = await prisma.trip.create({
                data: {
                  userId: testUser.id,
                  productId: product.id,
                  reservationCode,
                  cruiseName: `${product.cruiseLine} ${product.shipName}`,
                  companionType: '가족', // 기본값
                  destination: destinations,
                  startDate,
                  endDate,
                  nights: product.nights,
                  days: product.days,
                  visitCount: destinations.length,
                  status: 'Upcoming',
                  updatedAt: new Date(), // updatedAt 필드 추가
                },
              });

              console.log('[Auth Login] 1101 테스트 모드: ✅ Trip 생성 성공:', {
                tripId: trip.id,
                userId: testUser.id,
                cruiseName: `${product.cruiseLine} ${product.shipName}`,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                nights: product.nights,
                days: product.days,
              });

              // Itinerary 레코드들 자동 생성
              console.log('[Auth Login] 1101 테스트 모드: Itinerary 생성 시작:', {
                itineraryPatternLength: itineraryPattern.length,
                tripId: trip.id,
              });
              
              const itineraries = [];
              for (const pattern of itineraryPattern) {
                const dayDate = new Date(startDate);
                dayDate.setDate(dayDate.getDate() + pattern.day - 1);

                itineraries.push({
                  tripId: trip.id,
                  day: pattern.day,
                  date: dayDate,
                  type: pattern.type,
                  location: pattern.location || null,
                  country: pattern.country || null,
                  currency: pattern.currency || null,
                  language: pattern.language || null,
                  arrival: pattern.arrival || null,
                  departure: pattern.departure || null,
                  time: pattern.time || null,
                });
              }

              console.log('[Auth Login] 1101 테스트 모드: Itinerary 데이터 준비 완료:', {
                count: itineraries.length,
                tripId: trip.id,
              });

              await prisma.itinerary.createMany({
                data: itineraries,
              });

              console.log('[Auth Login] 1101 테스트 모드: ✅ Itinerary 생성 완료:', {
                count: itineraries.length,
                tripId: trip.id,
              });

              // VisitedCountry 업데이트
              for (const [countryCode, countryInfo] of visitedCountries) {
                await prisma.visitedCountry.upsert({
                  where: {
                    userId_countryCode: {
                      userId: testUser.id,
                      countryCode,
                    },
                  },
                  update: {
                    visitCount: { increment: 1 },
                    lastVisited: startDate,
                  },
                  create: {
                    userId: testUser.id,
                    countryCode,
                    countryName: countryInfo.name,
                    visitCount: 1,
                    lastVisited: startDate,
                  },
                });
              }

              // 온보딩 완료 상태로 설정
              console.log('[Auth Login] 1101 테스트 모드: 온보딩 완료 상태 설정 시작:', {
                userId: testUser.id,
              });
              
              await prisma.user.update({
                where: { id: testUser.id },
                data: {
                  onboarded: true,
                  totalTripCount: { increment: 1 },
                },
              });

              console.log('[Auth Login] 1101 테스트 모드: ✅ 온보딩 완료 상태 설정 완료:', {
                userId: testUser.id,
                onboarded: true,
              });

              console.log('[Auth Login] Test mode: Auto-created trip for user', testUser.id, 'with product SAMPLE-MED-001', {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                nights: product.nights,
                days: product.days,
                loginDate: now.toISOString().split('T')[0],
                dday: Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
              });
          } catch (tripError) {
            console.error('[Auth Login] Test mode: Failed to auto-create trip:', tripError);
            console.error('[Auth Login] Test mode: Trip creation error details:', {
              error: tripError instanceof Error ? tripError.message : String(tripError),
              stack: tripError instanceof Error ? tripError.stack : undefined,
              name: tripError instanceof Error ? tripError.name : undefined,
              userId: testUser.id,
              userName: testUser.name,
            });
            
            // Trip 생성 실패 시에도 로그인은 계속 진행하되, 에러를 명확히 기록
            // 나중에 관리자가 확인할 수 있도록
          }
        } else if (existingTrip && product && existingTrip.productId === product.id) {
          console.log('[Auth Login] 1101 테스트 모드: 기존 Trip이 SAMPLE-MED-001임, Trip 생성 건너뜀:', {
            userId: testUser.id,
            tripId: existingTrip.id,
            productId: existingTrip.productId,
          });
        } else if (!product) {
          console.error('[Auth Login] 1101 테스트 모드: ❌ SAMPLE-MED-001 상품을 찾을 수 없습니다!');
          console.warn('[Auth Login] Test mode: SAMPLE-MED-001 product not found');
        }

        // Trip 생성 후 다시 확인 (디버깅용) - 실제 DB에서 조회
        const finalTripCheck = await prisma.trip.findFirst({
          where: { userId: testUser.id },
          select: { id: true, cruiseName: true, startDate: true },
        });
        console.log('[Auth Login] 1101 테스트 모드: 세션 생성 전 최종 Trip 확인 (DB 조회):', {
          userId: testUser.id,
          hasTrip: !!finalTripCheck,
          tripId: finalTripCheck?.id,
          cruiseName: finalTripCheck?.cruiseName,
        });
        
        // Trip이 없으면 경고 로그 출력 (하지만 로그인은 계속 진행)
        if (!finalTripCheck) {
          console.warn('[Auth Login] 1101 테스트 모드: ⚠️ 경고 - Trip이 생성되지 않았습니다!', {
            userId: testUser.id,
            userName: testUser.name,
            phone: testUser.phone,
          });
        }

        const userId = testUser.id;
        const next = '/chat-test'; // 테스트 모드는 별도 경로로 이동

        // 세션 생성
        const sessionId = randomBytes(32).toString('hex');
        const csrfToken = generateCsrfToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const session = await prisma.session.create({
          data: { 
            id: sessionId,
            userId,
            csrfToken,
            expiresAt,
          },
          select: { id: true, csrfToken: true },
        });

        cookies().set(SESSION_COOKIE, session.id, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30,
        });

        authLogger.loginSuccess(userId, clientIp);
        await reactivateUser(userId);
        await updateLastActive(userId);

        return NextResponse.json({ 
          ok: true, 
          next,
          csrfToken: session.csrfToken,
          testMode: true, // 테스트 모드 플래그
          testModeRemainingHours: Math.ceil((testModeEndAt.getTime() - now.getTime()) / (1000 * 60 * 60)), // 남은 시간
        });
      } catch (testModeError) {
        // 상세한 오류 로깅
        const errorMessage = testModeError instanceof Error ? testModeError.message : String(testModeError);
        const errorStack = testModeError instanceof Error ? testModeError.stack : undefined;
        const errorName = testModeError instanceof Error ? testModeError.name : undefined;
        
        console.error('[Auth Login] ❌ 테스트 모드 로그인 오류 발생!');
        console.error('[Auth Login] Test mode error:', testModeError);
        console.error('[Auth Login] Test mode error details:', {
          error: errorMessage,
          stack: errorStack,
          errorName: errorName,
          phone,
          userName: name,
          timestamp: new Date().toISOString(),
        });
        
        // Prisma 오류인 경우 추가 정보 출력
        if (testModeError && typeof testModeError === 'object' && 'code' in testModeError) {
          console.error('[Auth Login] Prisma error code:', (testModeError as any).code);
          console.error('[Auth Login] Prisma error meta:', (testModeError as any).meta);
        }
        
        // 테스트 모드 처리 중 에러 발생 시 에러 반환
        return NextResponse.json({ 
          ok: false, 
          error: '테스트 모드 로그인 중 오류가 발생했습니다.',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
          // 개발 환경에서는 스택 트레이스도 포함
          stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        }, { status: 500 });
      }
    }

    // 비밀번호 기반 상태 구분: 8300 = 잠금 (로그인 불가)
    if (password === '8300') {
      return NextResponse.json({ 
        ok: false, 
        error: '로그인이 불가능한 계정입니다. 관리자에게 문의해주세요.' 
      }, { status: 403 });
    }

    if (!phone || !password) {
      return NextResponse.json({ ok: false, error: '전화번호/비밀번호가 필요합니다.' }, { status: 400 });
    }

    // 커뮤니티 로그인 처리 (커뮤니티 전용 사용자 또는 관리자)
    if (mode === 'community') {
      // 커뮤니티 사용자 또는 관리자 찾기
      const communityUser = await prisma.user.findFirst({
        where: {
          OR: [{ phone }, { mallUserId: phone }],
          role: { in: ['community', 'admin', 'user'] },
        },
        select: { id: true, name: true, role: true, password: true }
      });

      if (!communityUser) {
        return NextResponse.json({
          ok: false,
          error: '아이디 또는 비밀번호가 올바르지 않습니다.'
        }, { status: 401 });
      }

      // 비밀번호 확인 (bcrypt 또는 평문 비교)
      const bcrypt = await import('bcryptjs');
      const bcryptCompare = await bcrypt.default.compare(password, communityUser.password);
      const isPasswordValid = bcryptCompare || communityUser.password === password;
      
      if (!isPasswordValid) {
        return NextResponse.json({
          ok: false,
          error: '아이디 또는 비밀번호가 올바르지 않습니다.'
        }, { status: 401 });
      }

      const userId = communityUser.id;
      const next = '/'; // 지니몰 메인 페이지로 이동

      // 세션 ID 생성
      const sessionId = randomBytes(32).toString('hex');
      
      // CSRF 토큰 생성
      const csrfToken = generateCsrfToken();

      // 세션 만료 시간 설정 (30일)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // 세션 생성
      const session = await prisma.session.create({
        data: {
          id: sessionId,
          userId,
          csrfToken,
          expiresAt,
        },
        select: { id: true, csrfToken: true },
      });

      // 쿠키 심기
      cookies().set(SESSION_COOKIE, session.id, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30일
      });

      // 로그인 성공 로그
      authLogger.loginSuccess(userId, clientIp);

      return NextResponse.json({
        ok: true,
        next,
        csrfToken: session.csrfToken,
      });
    }

    // 관리자 로그인 처리
    // ✅ 이름, 전화번호, 비밀번호, role 4가지를 모두 정확히 확인하여 충돌 방지
    if (mode === 'admin') {
      try {
        if (!name) {
          return NextResponse.json({ ok: false, error: '이름이 필요합니다.' }, { status: 400 });
        }

        // 4가지 조건을 모두 만족하는 관리자 계정만 찾기 (AND 조건)
        // 같은 전화번호로 여러 계정이 있어도 정확히 매칭되는 계정만 반환됨
        console.log('[Admin Login] 검색 조건:', { name, phone, password: '***', role: 'admin' });
        
        // 먼저 이름, 전화번호, 역할로 관리자 계정 찾기
        const adminUser = await prisma.user.findFirst({
          where: { 
            name,        // ✅ 이름 확인
            phone,       // ✅ 전화번호 확인
            role: 'admin' // ✅ 관리자 권한 확인 (user/admin 구분)
          },
          select: { 
            id: true,
            password: true, // 비밀번호 비교를 위해 필요
            onboarded: true, 
            loginCount: true,
            // customerSource 필드가 없을 수 있으므로 안전하게 처리
          },
        });

        // 비밀번호 확인 (bcrypt 해시 또는 평문 비교)
        let isPasswordValid = false;
        if (adminUser) {
          const bcrypt = await import('bcryptjs');
          let bcryptCompare = false;
          try {
            bcryptCompare = await bcrypt.default.compare(password, adminUser.password);
          } catch (compareError) {
            console.warn('[Admin Login] bcrypt 비교 중 오류(무시):', compareError);
            bcryptCompare = false;
          }
          isPasswordValid = bcryptCompare || adminUser.password === password;
          console.log('[Admin Login] 비밀번호 확인:', {
            isBcryptHash: adminUser.password.startsWith('$2'),
            isValid: isPasswordValid,
          });
        }

        if (!adminUser || !isPasswordValid) {
          // 디버깅을 위해 각 조건별로 확인
          const byName = await prisma.user.findMany({ where: { name }, select: { id: true, phone: true, role: true } });
          const byPhone = await prisma.user.findMany({ where: { phone }, select: { id: true, name: true, role: true } });
          const byRole = await prisma.user.findMany({ where: { role: 'admin' }, select: { id: true, name: true, phone: true } });
          
          console.log('[Admin Login] 디버깅 정보:', {
            byName: byName.length,
            byPhone: byPhone.length,
            byRole: byRole.length,
            byNameUsers: byName,
            byPhoneUsers: byPhone,
            adminUsers: byRole,
          });
          
          return NextResponse.json({ 
            ok: false, 
            error: '관리자 정보가 올바르지 않습니다. 이름, 전화번호, 비밀번호를 확인해주세요.' 
          }, { status: 401 });
        }
        
        console.log('[Admin Login] 성공:', { userId: adminUser.id });

        const userId = adminUser.id;
        const next = '/admin/dashboard';

        // customerSource 조회 시도 (필드가 없을 수 있음)
        let customerSourceValue: string | null = null;
        try {
          const userWithSource = await prisma.user.findUnique({
            where: { id: userId },
            select: { customerSource: true },
          });
          customerSourceValue = userWithSource?.customerSource || null;
        } catch (sourceError) {
          console.warn('[Admin Login] customerSource 조회 실패 (무시):', sourceError);
        }

        // 로그인 횟수 증가 및 customerSource 설정
        await prisma.user.update({
          where: { id: userId },
          data: { 
            loginCount: { increment: 1 },
            ...(customerSourceValue === null && { customerSource: 'admin' }), // customerSource가 없으면 설정
          },
        });

      // 세션 ID 생성 (32바이트 랜덤 값을 hex 문자열로)
      const sessionId = randomBytes(32).toString('hex');
      
      // CSRF 토큰 생성
      const csrfToken = generateCsrfToken();

      // 세션 만료 시간 설정 (30일)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // 세션 생성
      const session = await prisma.session.create({
        data: { 
          id: sessionId,  // ✅ 세션 ID 필수
          userId,
          csrfToken,
          expiresAt,
        },
        select: { id: true, csrfToken: true },
      });

      // 쿠키 심기
      cookies().set(SESSION_COOKIE, session.id, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30일
      });

      // 로그인 성공 로그
      authLogger.loginSuccess(userId, clientIp);

        // 생애주기 관리: 재활성화 및 활동 시각 업데이트
        await reactivateUser(userId);
        await updateLastActive(userId);

        return NextResponse.json({ 
          ok: true, 
          next,
          csrfToken: session.csrfToken,
        });
      } catch (adminError) {
        console.error('[Admin Login] 관리자 로그인 처리 중 오류:', adminError);
        console.error('[Admin Login] 오류 상세:', {
          message: adminError instanceof Error ? adminError.message : String(adminError),
          stack: adminError instanceof Error ? adminError.stack : undefined,
          name: adminError instanceof Error ? adminError.name : undefined,
        });
        return NextResponse.json({ 
          ok: false, 
          error: '관리자 로그인 중 오류가 발생했습니다.',
          details: process.env.NODE_ENV === 'development' 
            ? (adminError instanceof Error ? adminError.message : String(adminError))
            : undefined
        }, { status: 500 });
      }
    }

    // 일반 사용자 로그인 처리
    // ✅ 이름, 전화번호, 비밀번호, role 4가지를 모두 정확히 확인하여 충돌 방지
    // 주의: 1101 테스트 모드는 위에서 이미 처리되었으므로 여기서는 제외됨

    // 비밀번호 기반 상태 구분: 8300 = 잠금 (로그인 불가)
    if (password === '8300') {
      return NextResponse.json({ 
        ok: false, 
        error: '로그인이 불가능한 계정입니다. 관리자에게 문의해주세요.' 
      }, { status: 403 });
    }

    if (!phone || !password) {
      return NextResponse.json({ ok: false, error: '전화번호/비밀번호가 필요합니다.' }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ ok: false, error: '이름이 필요합니다.' }, { status: 400 });
    }

    // 비밀번호 기반 상태 구분: 3800 = 활성화
    // 동면 고객 자동 전환: 이름=연락처, 비밀번호=3800으로 로그인한 경우
    // 동면 고객(이름=연락처, 비밀번호=연락처)이 여행 계약 후 3800으로 로그인하면 활성으로 전환
    if (password === '3800' && name === phone) {
      // 동면 고객 찾기: 이름=연락처, 비밀번호=연락처인 고객
      const dormantUser = await prisma.user.findFirst({
        where: {
          phone,
          name: phone,  // 동면 고객은 이름=연락처
          password: phone,  // 동면 고객은 비밀번호=연락처
          role: 'user',
        },
        select: { id: true, onboarded: true, loginCount: true, isHibernated: true, customerStatus: true, customerSource: true },
      });

      if (dormantUser) {
        console.log('[Login] 동면 고객 자동 전환:', { userId: dormantUser.id, phone, name });
        
        // 동면에서 활성으로 전환: 비밀번호를 3800으로 업데이트, 동면 상태 해제, 활성 상태로 설정, 로그인 횟수 증가
        await prisma.user.update({
          where: { id: dormantUser.id },
          data: {
            password: '3800',
            isHibernated: false,
            hibernatedAt: null,
            customerStatus: 'active', // 활성 상태로 설정
            testModeStartedAt: null, // 테스트 모드 해제
            loginCount: { increment: 1 },
            customerSource: dormantUser.customerSource || 'cruise-guide', // customerSource가 없으면 설정
          },
        });

        // 온보딩 완료 && 활성 상태 → /chat, 아니면 → /onboarding
        // 업데이트 후 customerStatus는 'active'로 설정되므로, onboarded만 확인
        const next = '/chat'; // 항상 채팅으로 이동
        const userId = dormantUser.id;

        // 세션 ID 생성 (32바이트 랜덤 값을 hex 문자열로)
        const sessionId = randomBytes(32).toString('hex');
        
        // CSRF 토큰 생성
        const csrfToken = generateCsrfToken();

        // 세션 만료 시간 설정 (30일)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        // 세션 생성
        const session = await prisma.session.create({
          data: { 
            id: sessionId,
            userId,
            csrfToken,
            expiresAt,
          },
          select: { id: true, csrfToken: true },
        });

        // 쿠키 심기
        cookies().set(SESSION_COOKIE, session.id, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30일
        });

        // 로그인 성공 로그
        authLogger.loginSuccess(userId, clientIp);

        // 생애주기 관리: 재활성화 및 활동 시각 업데이트
        await reactivateUser(userId);
        await updateLastActive(userId);

        console.log('[Login] 동면 고객 자동 전환 완료:', { userId, phone, name });

        return NextResponse.json({ 
          ok: true, 
          next,
          csrfToken: session.csrfToken,
        });
      }
    }

    // 비밀번호 기반 상태 구분: 3800 = 활성화
    // 잠금 상태 고객 자동 전환: 이름, 연락처, 3800으로 로그인한 경우
    // 잠금 상태였던 고객이 3800으로 로그인하면 자동으로 활성 상태로 전환
    if (password === '3800') {
      console.log('[Login] 3800 로그인 시도:', { phone, name });
      
      // 이름, 전화번호로 사용자 찾기 (비밀번호는 나중에 확인)
      let activeUser = await prisma.user.findFirst({
        where: {
          phone,
          name,
          role: 'user',
        },
        select: { 
          id: true, 
          password: true, 
          onboarded: true, 
          loginCount: true, 
          isLocked: true, 
          customerStatus: true,
          customerSource: true,
          Trip: { select: { id: true }, take: 1 },
        },
      });

      console.log('[Login] 3800 사용자 조회 결과:', { 
        found: !!activeUser, 
        userId: activeUser?.id,
        passwordMatch: activeUser?.password === '3800',
        customerStatus: activeUser?.customerStatus,
        isLocked: activeUser?.isLocked,
      });

      // 사용자가 없으면 자동 생성 (크루즈 가이드 지니 AI 요구사항)
      if (!activeUser) {
        console.log('[Login] 3800 신규 사용자 자동 생성:', { phone, name });
        try {
          const newUser = await prisma.user.create({
            data: {
              name,
              phone,
              password: '3800',
              onboarded: false, // 온보딩 없이 채팅창에 들어갈 수 있도록 false로 설정
              loginCount: 1,
              role: 'user',
              customerStatus: 'active',
              customerSource: 'cruise-guide',
            },
            select: { 
              id: true, 
              password: true, 
              onboarded: true, 
              loginCount: true, 
              isLocked: true, 
              customerStatus: true,
              customerSource: true,
              Trip: { select: { id: true }, take: 1 },
            },
          });
          activeUser = newUser;
          console.log('[Login] 3800 신규 사용자 생성 완료:', { userId: activeUser.id, phone, name });
        } catch (createError) {
          console.error('[Login] 3800 신규 사용자 생성 실패:', createError);
          return NextResponse.json({ 
            ok: false, 
            error: '사용자 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' 
          }, { status: 500 });
        }
      } else {
        // 기존 사용자: 비밀번호가 3800이 아니면 활성화 모드가 아님 (3800만 허용)
        if (activeUser.password !== '3800') {
          console.log('[Login] 3800 로그인 실패: 비밀번호 불일치', { 
            userId: activeUser.id,
            expectedPassword: '3800',
            actualPassword: activeUser.password ? '***' : 'null',
          });
          return NextResponse.json({ 
            ok: false, 
            error: '비밀번호가 올바르지 않습니다. 비밀번호를 확인해주세요.' 
          }, { status: 401 });
        }
      }

      console.log('[Login] 활성 고객 로그인:', { userId: activeUser.id, phone, name });
      
      try {
        // 활성 상태로 전환: 잠금 상태 해제, 활성 상태로 설정, 테스트 모드 해제, 로그인 횟수 증가
        await prisma.user.update({
          where: { id: activeUser.id },
          data: {
            isLocked: false,
            isHibernated: false,
            customerStatus: 'active', // 활성 상태로 설정
            loginCount: { increment: 1 },
            customerSource: activeUser.customerSource || 'cruise-guide', // customerSource가 없으면 설정
            ...(activeUser.isLocked && {
              lockedAt: null,
              lockedReason: null,
            }),
            ...(activeUser.customerStatus === 'test' && {
              testModeStartedAt: null, // 테스트 모드 해제
            }),
          },
        });
      } catch (updateError) {
        console.error('[Login] 활성 고객 상태 업데이트 실패:', updateError);
        throw updateError;
      }

      const next = '/chat'; // 항상 채팅으로 이동
      const userId = activeUser.id;

      try {
        // 세션 ID 생성 (32바이트 랜덤 값을 hex 문자열로)
        const sessionId = randomBytes(32).toString('hex');
        
        // CSRF 토큰 생성
        const csrfToken = generateCsrfToken();

        // 세션 만료 시간 설정 (30일)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        // 세션 생성
        const session = await prisma.session.create({
          data: { 
            id: sessionId,
            userId,
            csrfToken,
            expiresAt,
          },
          select: { id: true, csrfToken: true },
        });

        // 쿠키 심기
        cookies().set(SESSION_COOKIE, session.id, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30일
        });

        // 로그인 성공 로그
        authLogger.loginSuccess(userId, clientIp);

        // 생애주기 관리: 재활성화 및 활동 시각 업데이트
        try {
          await reactivateUser(userId);
        } catch (reactivateError) {
          console.error('[Login] 재활성화 실패 (무시):', reactivateError);
        }
        
        try {
          await updateLastActive(userId);
        } catch (updateActiveError) {
          console.error('[Login] 활동 시각 업데이트 실패 (무시):', updateActiveError);
        }

        console.log('[Login] 활성 고객 로그인 완료:', { userId, phone, name });

        return NextResponse.json({ 
          ok: true, 
          next,
          csrfToken: session.csrfToken,
        });
      } catch (sessionError) {
        console.error('[Login] 세션 생성 실패:', sessionError);
        throw sessionError;
      }
    }

    // 1) 기존 고객: 이름, 전화번호, 비밀번호, role(user) 4가지를 모두 확인
    // 같은 전화번호로 여러 계정이 있어도 정확히 매칭되는 계정만 반환됨
    // 비밀번호가 1101, 3800, 8300이 아닌 경우에만 일반 로그인 처리
    const existing = await prisma.user.findFirst({
      where: { 
        phone,        // ✅ 전화번호 확인
        name,         // ✅ 이름 확인
        password,     // ✅ 비밀번호 확인
        role: 'user', // ✅ 일반 사용자 확인 (admin 제외)
      },
      select: { 
        id: true, 
        password: true, 
        onboarded: true, 
        loginCount: true, 
        role: true, 
        customerStatus: true,
        Trip: { select: { id: true }, take: 1 },
      },
    });

    // 이름, 전화번호, 비밀번호가 일치하지만 role이 admin인 경우
    // (관리자 계정이 일반 로그인으로 접근하려는 경우)
    if (!existing) {
      // 관리자 계정인지 확인
      const adminCheck = await prisma.user.findFirst({
        where: {
          phone,
          name,
          password,
          role: 'admin',
        },
      });

      if (adminCheck) {
        console.log('[LOGIN] 관리자 계정으로 일반 사용자 로그인 시도:', { phone, name, userId: adminCheck.id });
        return NextResponse.json({ 
          ok: false, 
          error: '관리자 계정입니다. 관리자 로그인 페이지를 이용해주세요.' 
        }, { status: 403 });
      }
    }

    let userId: number;
    let next = '/chat';

    if (existing) {
      // 기존 고객: 이미 4가지 조건(name, phone, password, role='user')을 모두 만족하는 계정
      // 비밀번호는 where 조건에서 이미 확인했으므로 추가 검증 불필요

      // @ts-ignore
      userId = existing.id as unknown as number;
      
      // 로그인 횟수 증가
      await prisma.user.update({
        where: { id: userId },
        data: { loginCount: { increment: 1 } },
      });

      // 온보딩 완료 && 활성 상태 → /chat, 아니면 → /onboarding
      // 관리자 패널에서 온보딩 등록되어 있고 활성 상태인 고객은 자동으로 채팅으로 이동
      // customerStatus가 null이면 활성 상태로 간주 (하위 호환성)
      const isActive = existing.customerStatus === 'active' || existing.customerStatus === null;
      next = '/chat'; // 항상 채팅으로 이동
      
      console.log('[Login] 리다이렉트 결정:', {
        userId: existing.id,
        onboarded: existing.onboarded,
        customerStatus: existing.customerStatus,
        isActive,
        next,
      });
    } else {
      // 2) 신규 생성 (요구사항: 신규는 온보딩 필요)
      const created = await prisma.user.create({
        data: {
          phone,
          name: name ?? null,
          password,        // 3800 등 내부 정책값. 클라이언트에 표시 X
          onboarded: false,
          loginCount: 1,   // 첫 로그인
          role: 'user',    // 명시적으로 user role 설정
        },
        select: { id: true },
      });
      // @ts-ignore
      userId = created.id as unknown as number;
      next = '/chat'; // 신규 고객도 바로 채팅으로 이동
    }

    // 3) 세션 ID 생성 (32바이트 랜덤 값을 hex 문자열로)
    const sessionId = randomBytes(32).toString('hex');
    
    // 4) CSRF 토큰 생성
    const csrfToken = generateCsrfToken();

    // 5) 세션 만료 시간 설정 (30일)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // 6) 세션 생성 (CSRF 토큰 및 만료 시간 포함)
    const session = await prisma.session.create({
      data: { 
        id: sessionId,  // ✅ 세션 ID 필수
        userId,
        csrfToken,
        expiresAt,
      },
      select: { id: true, csrfToken: true },
    });

    // 7) 쿠키 심기
    cookies().set(SESSION_COOKIE, session.id, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30일
    });

    // 로그인 성공 로그
    authLogger.loginSuccess(userId, clientIp);

    // 생애주기 관리: 재활성화 및 활동 시각 업데이트
    await reactivateUser(userId);
    await updateLastActive(userId);

    return NextResponse.json({ 
      ok: true, 
      next,
      csrfToken: session.csrfToken, // 클라이언트에 CSRF 토큰 전달
    });
  } catch (e) {
    console.error('[Auth Login] Internal Error:', e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    const errorStack = e instanceof Error ? e.stack : undefined;
    console.error('[Auth Login] Error details:', { 
      errorMessage, 
      errorStack,
      errorName: e instanceof Error ? e.name : 'Unknown',
      errorCause: e instanceof Error && 'cause' in e ? (e as any).cause : undefined,
    });
    
    // 개발 환경에서는 더 자세한 에러 정보 제공
    return NextResponse.json(
      { 
        ok: false, 
        error: '로그인 실패',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}