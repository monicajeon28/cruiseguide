// app/profile/page.tsx
import prisma from '@/lib/prisma';
import { getServerSession } from '@/app/(server)/session';
import Link from 'next/link';
import { formatDateK } from '@/lib/utils';
import { getDdayMessage } from '@/lib/date-utils'; // 올바른 경로에서 임포트
import TopBar from "@/app/chat/components/TopBar"; // TopBar 임포트
import ddayMessages from '@/data/dday_messages.json'; // D-Day 메시지 데이터 임포트
import TTSToggle from './components/TTSToggle'; // TTS 토글 컴포넌트
import PushToggle from './components/PushToggle'; // Push 토글 컴포넌트
import TripInfoSection from './components/TripInfoSection'; // 동반자 수정 기능 포함
import GenieLinkSection from './components/GenieLinkSection'; // 크루즈가이드 지니 연동 섹션

const sectionTitle = 'text-2xl md:text-3xl lg:text-4xl font-extrabold text-red-600 leading-tight';
const blockText    = 'text-base md:text-lg leading-relaxed text-gray-900';
const labelBold    = 'font-bold text-blue-700 text-base md:text-lg';
const textBlack    = 'font-semibold text-gray-900 text-base md:text-lg';
const subTitle     = 'text-lg md:text-xl font-semibold text-gray-800';
const textGray     = 'text-gray-600 text-base md:text-lg';

export default async function ProfilePage() {
  // 1) 세션 (❗️중요: await 필수)
  const session = await getServerSession();

  // 디버깅: 세션 정보 로그
  console.log('[Profile Page] Session:', session);

  // 2) 유저/여행 조회 (세션 없으면 조회 생략)
  let user: { id: number; name?: string | null; phone?: string | null; role?: string | null } | null = null;
  let trip:
    | {
        id: number;
        cruiseName?: string | null;
        destination?: string | null;
        startDate?: string | null;
        endDate?: string | null;
        userId: number;
      }
    | null = null;

  if (session?.userId) {
    // getServerSession()은 항상 { userId: number }를 반환
    const userId = session.userId;
    console.log('[Profile Page] Looking up user with userId:', userId, 'type:', typeof userId);

    user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, phone: true, role: true },
    });

    console.log('[Profile Page] Found user:', user ? { id: user.id, name: user.name, phone: user.phone } : 'null');

    // 유저 정보가 성공적으로 조회되면 여행 정보 조회 (브리핑 API와 동일한 방식)
    if (user) {
      trip = await prisma.trip.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }, // 최신 온보딩 정보 (브리핑 API와 동일)
        select: {
          id: true,
          cruiseName: true,
          destination: true,
          startDate: true,
          endDate: true,
          nights: true, // 브리핑 API와 동일하게 추가
          days: true, // 브리핑 API와 동일하게 추가
          companionType: true,
          userId: true,
        },
      });

      console.log('[Profile Page] Found trip:', trip ? { 
        id: trip.id, 
        cruiseName: trip.cruiseName, 
        userId: trip.userId,
        nights: trip.nights,
        days: trip.days,
        destination: trip.destination
      } : 'null');
    }
  } else {
    console.log('[Profile Page] No session found');
  }

  // 3) D-day 메시지 (유저/여행 정보 있으면 조회)
  let dday: string | null = null;
  let isTripExpired = false;
  let currentDday: number | null = null; // 현재 D-day 숫자
  let ddayType: 'departure' | 'return' = 'departure'; // 출발일 기준인지 종료일 기준인지

  if (user && trip?.startDate && trip?.endDate) {
    dday = getDdayMessage(trip.startDate, trip.endDate);
    
    // 여행 종료 여부 확인 (endDate + 1일 유예 기간)
    const endDate = new Date(trip.endDate);
    const gracePeriodEnd = new Date(endDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 1); // +1일 유예 기간
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (now > gracePeriodEnd) {
      isTripExpired = true;
    } else {
      // D-day 계산 (출발일 기준 또는 종료일 기준)
      const startDate = new Date(trip.startDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      if (now < startDate) {
        // 여행 시작 전 - 출발일 기준 D-day
        const diffTime = startDate.getTime() - now.getTime();
        currentDday = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        ddayType = 'departure';
      } else if (now >= startDate && now <= endDate) {
        // 여행 중 - 종료일 기준 D-day
        const diffTime = endDate.getTime() - now.getTime();
        currentDday = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        ddayType = 'return';
      } else {
        // 여행 종료 후
        currentDday = null;
      }
    }
  }

  // 4) 여행 기간 계산 (브리핑 API와 동일하게 nights와 days 사용)
  let tripDuration = '정보 없음';
  if (trip && 'nights' in trip && 'days' in trip && trip.nights !== null && trip.days !== null) {
    // 브리핑 API와 동일하게 DB에 저장된 nights와 days 사용
    tripDuration = `${trip.nights}박 ${trip.days}일`;
  } else if (trip?.startDate && trip?.endDate) {
    // fallback: DB에 없으면 날짜로 계산
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // 총 일수 (시작일 포함)
    const nights = diffDays - 1; // 박수는 총 일수 - 1
    tripDuration = `${nights}박 ${diffDays}일`;
  }

  // 5) 동반자 정보 (companionType이 있으면 사용, 없으면 기본값)
  let companionType = '정보 없음';
  if (trip && 'companionType' in trip && trip.companionType) {
    const typeMap: Record<string, string> = {
      'solo': '1명 (혼자)',
      'couple': '2명 (부부/연인)',
      'family': '가족',
      'friends': '친구',
      'group': '단체',
    };
    companionType = typeMap[trip.companionType as string] || '정보 없음';
  }

  // 6) 목적지 문자열 변환 (배열인 경우 처리)
  let destinationString = '정보 없음';
  if (trip?.destination) {
    const dest: any = trip.destination;
    if (typeof dest === 'string') {
      try {
        const parsed = JSON.parse(dest);
        if (Array.isArray(parsed)) {
          destinationString = parsed.join(', ');
        } else {
          destinationString = dest;
        }
      } catch {
        destinationString = dest;
      }
    } else if (Array.isArray(dest)) {
      destinationString = dest.join(', ');
    } else {
      destinationString = String(dest);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 pb-20">
      <TopBar />
      {!session?.userId ? (
        <section className="bg-white rounded-2xl shadow-xl p-8 m-4 text-center border-2 border-purple-200">
          <p className="text-xl md:text-2xl text-gray-700 mb-6 leading-relaxed">로그인 후 이용 가능합니다.</p>
          <Link
            className="inline-block mt-4 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 text-lg md:text-xl"
            href="/login?next=/profile"
          >
            로그인
          </Link>
        </section>
      ) : (
        <>
          {/* 상태 A: 로그인 했고 유저/여행 정보 있음 → 프로필 */}
          {user && trip ? (
            <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
              {/* 헤더 */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-5 shadow-xl">
                  <span className="text-5xl md:text-6xl">👤</span>
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent mb-4 leading-tight">
                  내 정보
                </h1>
                <p className="text-lg md:text-xl text-gray-700 font-medium leading-relaxed">
                  나의 여행 정보와 설정을 확인하세요
                </p>
              </div>

              <section className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border-2 border-purple-200 mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-5 flex items-center gap-3 leading-tight">
                  <span className="text-4xl md:text-5xl">👤</span>
                  내 정보
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 md:p-5 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-semibold text-base md:text-lg min-w-[100px]">이름:</span>
                    <span className="font-bold text-gray-900 text-base md:text-lg">{user.name ?? '정보 없음'}</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 md:p-5 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-semibold text-base md:text-lg min-w-[100px]">연락처:</span>
                    <span className="font-bold text-gray-900 text-base md:text-lg break-all">{user.phone ?? '정보 없음'}</span>
                  </div>
                </div>
              </section>

              {/* 설정 섹션 */}
              <section className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border-2 border-blue-200 mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-5 flex items-center gap-3 leading-tight">
                  <span className="text-4xl md:text-5xl">⚙️</span>
                  설정
                </h2>
                <div className="space-y-5">
                  <TTSToggle />
                  <PushToggle />
                </div>
              </section>

              <TripInfoSection
                trip={trip}
                companionType={companionType}
                tripDuration={tripDuration}
                destinationString={destinationString}
              />

              {/* 크루즈 가이드 지니 연동 섹션 (크루즈몰 사용자용) */}
              <GenieLinkSection
                userRole={user.role || 'user'}
                userName={user.name}
                userPhone={user.phone}
              />

              {/* 여행 종료 상태가 아닐 때만 D-Day 정보 표시 */}
              {!isTripExpired ? (
                <>
                  {/* 지니의 여행 준비 가이드 - 메인 타이틀 */}
                  <section className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border-2 border-purple-200">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 mb-8 flex items-center justify-center gap-3 leading-tight">
                      <span className="text-5xl md:text-6xl">✨</span>
                      지니의 여행 준비 가이드
                      <span className="text-5xl md:text-6xl">✨</span>
                    </h2>
                    
                    {/* 현재 D-day에 맞는 메시지 표시 - 왼쪽: 미래, 가운데: 현재, 오른쪽: 과거 */}
                    {(() => {
                      // D-day 숫자로 변환하는 헬퍼 함수
                      const getDdayNumber = (key: string): number => {
                        if (key === 'end_1') return -1; // 종료일 D-1
                        if (key === 'end_0') return 0; // 종료일 D-0
                        const num = parseInt(key);
                        return isNaN(num) ? 999 : num;
                      };
                      
                      // 표시할 메시지 키 결정
                      let pastKey: string | null = null; // 과거 (오른쪽)
                      let currentKey: string | null = null; // 현재 (가운데)
                      let futureKey: string | null = null; // 미래 (왼쪽)
                      
                      if (currentDday !== null) {
                        if (ddayType === 'departure') {
                          const validDdays = [0, 1, 2, 3, 7, 10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100];
                          
                          // 현재 D-day와 정확히 일치하거나 가장 가까운 다음 D-day 찾기
                          let currentDdayKey: string | null = null;
                          if (validDdays.includes(currentDday)) {
                            currentDdayKey = String(currentDday);
                          } else {
                            const nextDday = validDdays.find(d => d >= currentDday);
                            if (nextDday !== undefined) {
                              currentDdayKey = String(nextDday);
                            }
                          }
                          
                          if (currentDdayKey) {
                            currentKey = currentDdayKey;
                            const currentNum = parseInt(currentDdayKey);
                            
                            // 앞으로 봐야 할 메시지: 현재보다 작은 D-day (숫자가 적어지는 방향)
                            const futureDdays = validDdays.filter(d => d < currentNum).reverse();
                            for (const futureDday of futureDdays) {
                              if (ddayMessages.messages[String(futureDday)]) {
                                futureKey = String(futureDday);
                                break;
                              }
                            }
                            
                            // 이미 봤던 메시지: 현재보다 큰 D-day (숫자가 많아지는 방향)
                            const pastDday = validDdays.find(d => d > currentNum);
                            if (pastDday !== undefined && ddayMessages.messages[String(pastDday)]) {
                              pastKey = String(pastDday);
                            }
                          }
                        } else {
                          // 종료일 기준
                          if (currentDday === 1) {
                            currentKey = 'end_1';
                            if (ddayMessages.messages['end_0']) {
                              futureKey = 'end_0';
                            }
                            // 과거 메시지는 출발일 기준으로 찾기
                            const validDdays = [0, 1, 2, 3, 7, 10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100];
                            const pastDdays = validDdays.filter(d => d <= 10).reverse();
                            for (const pastDday of pastDdays) {
                              if (ddayMessages.messages[String(pastDday)]) {
                                pastKey = String(pastDday);
                                break;
                              }
                            }
                          } else if (currentDday === 0) {
                            currentKey = 'end_0';
                            if (ddayMessages.messages['end_1']) {
                              pastKey = 'end_1';
                            }
                            // 미래 메시지는 없음 (여행 종료)
                          }
                        }
                      }
                      
                      // 메시지가 없으면 기본 메시지 표시
                      if (!currentKey && ddayMessages.messages['7']) {
                        currentKey = '7';
                      }
                      
                      // 배열: [과거(오른쪽), 현재(가운데), 미래(왼쪽)]
                      const orderedKeys = [pastKey, currentKey, futureKey].filter((k): k is string => k !== null);
                      
                      // 실제 렌더링 순서: [미래(왼쪽), 현재(가운데), 과거(오른쪽)]
                      const renderOrder = [futureKey, currentKey, pastKey].filter((k): k is string => k !== null);
                      
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                          {renderOrder.map((key, index) => {
                            const message = ddayMessages.messages[key];
                            if (!message) return null;
                            
                            const isCurrent = key === currentKey;
                            const isFuture = key === futureKey;
                            const isPast = key === pastKey;
                            
                            const getCardStyle = () => {
                              if (key === 'end_1' || key === 'end_0') {
                                return isCurrent 
                                  ? 'bg-white border-2 border-purple-300 shadow-lg relative transform scale-105'
                                  : 'bg-white border border-gray-200 shadow-md';
                              }
                              if (isCurrent) {
                                return 'bg-white border-2 border-blue-400 shadow-lg relative transform scale-105';
                              }
                              if (isFuture) {
                                return 'bg-white border border-gray-200 shadow-md';
                              }
                              return 'bg-gray-50 border border-gray-200 shadow-sm';
                            };
                            
                            const getDdayLabel = () => {
                              if (key === 'end_1') return 'D-1(귀국)';
                              if (key === 'end_0') return 'D-0(귀국일)';
                              return `D-${key}`;
                            };
                            
                            const getLabel = () => {
                              if (isCurrent) return '지금 봐야 할 메시지';
                              if (isFuture) return '앞으로 봐야 할 메시지';
                              if (isPast) return '이미 봤던 메시지';
                              return '';
                            };
                            
                            return (
                              <div key={key} className={`${getCardStyle()} rounded-xl p-6 md:p-8`}>
                                {/* 라벨 */}
                                <div className="mb-4">
                                  <span className={`text-sm md:text-base px-4 py-2 rounded-full font-medium ${
                                    isCurrent 
                                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-200' 
                                      : isFuture
                                      ? 'bg-yellow-50 text-yellow-700 border-2 border-yellow-200'
                                      : 'bg-gray-100 text-gray-600 border-2 border-gray-200'
                                  }`}>
                                    {getLabel()}
                                  </span>
                                </div>
                                
                                {isCurrent && (
                                  <div className="flex items-center justify-center mb-5">
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-300">
                                      <span className="text-3xl md:text-4xl text-blue-600">✓</span>
                                    </div>
                                  </div>
                                )}
                                {!isCurrent && (
                                  <div className="flex items-center justify-center mb-5">
                                    <div className="text-5xl md:text-6xl text-gray-300">{isFuture ? '⏩' : '✓'}</div>
                                  </div>
                                )}
                                <div className={`${
                                  isCurrent 
                                    ? 'bg-blue-50 border-2 border-blue-200' 
                                    : isFuture
                                    ? 'bg-yellow-50 border-2 border-yellow-200'
                                    : 'bg-gray-50 border-2 border-gray-200'
                                } rounded-lg px-5 py-3 text-center mb-5`}>
                                  <span className={`font-bold text-2xl md:text-3xl ${
                                    isCurrent ? 'text-blue-700' : isFuture ? 'text-yellow-700' : 'text-gray-600'
                                  }`}>{getDdayLabel()}</span>
                                </div>
                                <h3 className="font-bold text-xl md:text-2xl mb-5 leading-tight text-gray-900">
                                  {message.title.replace(/^D-\d+:\s*/, '').replace(/^D-\d+\(귀국\):\s*/, '').replace(/^귀국일:\s*/, '')}
                                </h3>
                                <div 
                                  className="text-base md:text-lg text-gray-700 leading-relaxed [&>span]:bg-yellow-200 [&>span]:text-gray-900 [&>span]:px-2 [&>span]:py-0.5 [&>span]:rounded [&>span]:font-semibold"
                                  style={{ lineHeight: '1.8', fontSize: '18px' }}
                                  dangerouslySetInnerHTML={{ 
                                    __html: message.message
                                      .replace(/\[고객명\]/g, `<span class="bg-yellow-200 text-gray-900 px-2 py-0.5 rounded font-semibold">${user.name || '고객'}</span>`)
                                      .replace(/\[크루즈명\]/g, trip.cruiseName || '크루즈')
                                      .replace(/\[목적지\]/g, destinationString)
                                      // 중요한 준비물 항목에 형광펜 효과 (밝은 노란색)
                                      .replace(/(승선권)/g, '<span class="bg-yellow-200 text-gray-900 px-2 py-0.5 rounded font-semibold">$1</span>')
                                      .replace(/(여권\(유효기간 6개월 이상\))/g, '<span class="bg-yellow-200 text-gray-900 px-2 py-0.5 rounded font-semibold">$1</span>')
                                      .replace(/(여권)/g, '<span class="bg-yellow-200 text-gray-900 px-2 py-0.5 rounded font-semibold">$1</span>')
                                      .replace(/(해외 결제 가능 신용카드)/g, '<span class="bg-yellow-200 text-gray-900 px-2 py-0.5 rounded font-semibold">$1</span>')
                                      .replace(/(신용카드)/g, '<span class="bg-yellow-200 text-gray-900 px-2 py-0.5 rounded font-semibold">$1</span>')
                                      .replace(/(국제 운전면허)/g, '<span class="bg-yellow-200 text-gray-900 px-2 py-0.5 rounded font-semibold">$1</span>')
                                      .replace(/(텀블러\(선내에서 유용\))/g, '<span class="bg-yellow-200 text-gray-900 px-2 py-0.5 rounded font-semibold">$1</span>')
                                      .replace(/(상비약)/g, '<span class="bg-yellow-200 text-gray-900 px-2 py-0.5 rounded font-semibold">$1</span>')
                                      .replace(/(개인 처방약)/g, '<span class="bg-yellow-200 text-gray-900 px-2 py-0.5 rounded font-semibold">$1</span>')
                                      .replace(/\n/g, '<br/>')
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* 안내 문구 */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 md:p-8 border-2 border-blue-200 mb-6 shadow-md">
                      <p className="text-center text-gray-800 font-semibold text-lg md:text-xl flex items-center justify-center gap-3 leading-relaxed">
                        <span className="text-4xl md:text-5xl">💡</span>
                        <span className="bg-yellow-200 text-gray-900 px-4 py-2 rounded-md font-semibold text-base md:text-lg">{user.name || '고객'}</span>님의 완벽한 크루즈 여행을 위한 단계별 가이드입니다
                      </p>
                    </div>

                    {/* D-Day 상세 정보 */}
                    {trip?.startDate && trip?.endDate && currentDday !== null && (() => {
                      // 현재 D-day에 맞는 메시지 찾기
                      let detailMessageKey: string | null = null;
                      
                      if (ddayType === 'departure') {
                        const validDdays = [0, 1, 2, 3, 7, 10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100];
                        if (validDdays.includes(currentDday)) {
                          detailMessageKey = String(currentDday);
                        } else {
                          const nextDday = validDdays.find(d => d >= currentDday);
                          if (nextDday !== undefined) {
                            detailMessageKey = String(nextDday);
                          } else {
                            detailMessageKey = '7'; // 기본값
                          }
                        }
                      } else {
                        if (currentDday === 1) {
                          detailMessageKey = 'end_1';
                        } else if (currentDday === 0) {
                          detailMessageKey = 'end_0';
                        }
                      }
                      
                      const detailMessage = detailMessageKey ? ddayMessages.messages[detailMessageKey] : null;
                      
                      if (!detailMessage) return null;
                      
                      return (
                        <section className="mt-6 bg-white rounded-xl border-2 border-blue-200 shadow-md p-6 md:p-8">
                          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">D-Day ({dday ?? '정보 없음'})</h2>
                          <p className="text-base md:text-lg text-gray-600 mb-5 leading-relaxed">📅 출발 {formatDateK(trip.startDate)} · 도착 {formatDateK(trip.endDate)}</p>
                          <div className="mt-4 p-6 md:p-8 bg-white rounded-lg border-2 border-gray-200 shadow-md">
                            <h3 className="font-bold text-gray-900 mb-5 text-xl md:text-2xl leading-tight">{detailMessage.title}</h3>
                            <div 
                              className="text-base md:text-lg text-gray-700 leading-relaxed [&>span]:bg-yellow-200 [&>span]:text-gray-900 [&>span]:px-2 [&>span]:py-0.5 [&>span]:rounded [&>span]:font-semibold"
                              style={{ lineHeight: '1.8', fontSize: '18px' }}
                              dangerouslySetInnerHTML={{ 
                                __html: detailMessage.message
                                  .replace(/\[고객명\]/g, `<span class="bg-yellow-200 text-gray-900 px-2 py-0.5 rounded font-semibold">${user.name || '고객'}</span>`)
                                  .replace(/\[크루즈명\]/g, trip.cruiseName || '크루즈')
                                  .replace(/\[목적지\]/g, destinationString)
                                  // 중요한 준비물 항목에 형광펜 효과 (밝은 노란색)
                                  .replace(/(여권\(유효기간 6개월 이상\))/g, '<span class="bg-yellow-200 text-gray-900 px-2 py-0.5 rounded font-semibold">$1</span>')
                                  .replace(/(해외 결제 가능 신용카드)/g, '<span class="bg-yellow-200 text-gray-900 px-2 py-0.5 rounded font-semibold">$1</span>')
                                  .replace(/(텀블러\(선내에서 유용\))/g, '<span class="bg-yellow-200 text-gray-900 px-2 py-0.5 rounded font-semibold">$1</span>')
                                  .replace(/(상비약)/g, '<span class="bg-yellow-200 text-gray-900 px-2 py-0.5 rounded font-semibold">$1</span>')
                                  .replace(/(개인 처방약)/g, '<span class="bg-yellow-200 text-gray-900 px-2 py-0.5 rounded font-semibold">$1</span>')
                                  .replace(/\n/g, '<br/>')
                              }}
                            />
                          </div>
                        </section>
                      );
                    })()}
                  </section>
                </>
              ) : (
                <section className="bg-white rounded-xl border-2 border-gray-200 shadow-md p-6 md:p-8">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">여행이 종료되었습니다</h2>
                  <p className="text-base md:text-lg text-gray-700 mb-5 leading-relaxed">
                    여행이 종료되어 D-Day 준비 가이드를 더 이상 표시하지 않습니다.
                  </p>
                  <Link
                    href="/products"
                    className="inline-block mt-4 px-6 md:px-8 py-3 md:py-4 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-all text-base md:text-lg"
                  >
                    다음 여행 등록하기
                  </Link>
                </section>
              )}
            </div>
          ) : (
            <section className="bg-white rounded-2xl shadow-xl p-8 m-4 text-center border-2 border-purple-200">
              <p className="text-xl md:text-2xl text-gray-700 mb-6 leading-relaxed">아직 여행 정보가 없습니다.</p>
              <Link
                className="inline-block mt-4 px-8 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:from-red-600 hover:to-pink-600 transition-all transform hover:scale-105 text-lg md:text-xl"
                href="/onboarding"
              >
                새 여행 시작하기
              </Link>
            </section>
          )}
        </>
      )}
    </main>
  );
}
