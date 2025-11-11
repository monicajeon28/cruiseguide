// app/components/OnboardingCard.tsx
import prisma from '@/lib/prisma';
import { getServerSession } from '@/app/(server)/session';
import Link from 'next/link';
import { getDdayMessage } from '@/lib/dday';
import { formatDateK } from '@/lib/utils';

// 스타일 토큰(프로필과 톤 맞춤)
const sectionTitle = 'text-xl md:text-[20px] font-extrabold text-red-600';
const blockText    = 'text-[15px] md:text-[16px] leading-7 text-gray-900';
const labelBold    = 'font-bold text-blue-700';
const textBlack    = 'font-semibold text-gray-900';

/** 채팅 상단 온보딩/로그인/D-DAY 카드 */
export default async function OnboardingCard() {
  // 1) 세션
  const session = await getServerSession().catch(() => null);

  // 2) 유저/여행
  let user: { id: string; name?: string | null; phone?: string | null } | null = null;
  let trip:
    | {
        id: string;
        cruiseName?: string | null;
        destination?: string | null;
        startDate?: string | null;
        endDate?: string | null;
      }
    | null = null;

  if (session?.userId) {
    user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, phone: true },
    });
    if (user) {
      trip = (await prisma.trip.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      })) as any;
    }
  }

  // 3) D-DAY
  const ddayMessage =
    trip?.startDate && user?.name
      ? await getDdayMessage({
          startDateISO: trip.startDate!,
          customerName: user.name!,
          cruiseName: trip.cruiseName ?? undefined,
        })
      : null;

  // 4) UI
  return (
    <section className="bg-white rounded-2xl shadow p-4 md:p-5 mb-4">
      {/* 상태 1: 비로그인 → 로그인/온보딩 유도 */}
      {!session?.userId && (
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-extrabold text-[18px] md:text-[20px] text-gray-900">지니와 여행 시작하기</div>
            <div className="text-gray-600 text-sm md:text-[15px] mt-1">
              로그인하면 내 정보/여행/체크리스트가 바로 떠요.
            </div>
          </div>
          <Link
            href="/login?next=/chat"
            className="shrink-0 rounded-xl bg-red-600 text-white px-4 py-2 font-semibold hover:bg-red-700"
          >
            로그인
          </Link>
        </div>
      )}

      {/* 상태 2: 로그인했지만 여행 없음 → 온보딩 체크 */}
      {session?.userId && user && !trip && (
        <div className="space-y-3">
          <h3 className={sectionTitle}>온보딩</h3>
          <div className={blockText}>
            <div>
              <span className="mr-2">👤</span>
              이름: <span className={textBlack}>{user.name ?? '—'}</span> / 연락처: &apos;
              <span className={textBlack}>{user.phone ?? '—'}</span>
            </div>
            <div className="mt-2 text-gray-700">
              아직 등록된 여행이 없어요. 아래에서 여행을 추가하면 배너/알림이 활성화됩니다.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/profile"
              className="rounded-xl border px-4 py-2 bg-white hover:bg-gray-50 font-medium"
            >
              나의 정보 열기
            </Link>
            <Link
              href="/profile#trip"
              className="rounded-xl bg-blue-600 text-white px-4 py-2 font-semibold hover:bg-blue-700"
            >
              여행 등록하기
            </Link>
          </div>
        </div>
      )}

      {/* 상태 3: 로그인+여행 있음 → D-DAY 요약 + 프로필 링크 */}
      {session?.userId && user && trip && (
        <div className="space-y-3">
          <h3 className={sectionTitle}>
            D-Day
          </h3>
          <div className="text-sm md:text-[15px] text-gray-500">
            {trip.startDate && trip.endDate ? (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded">
                📅 출발 {formatDateK(trip.startDate)} · 도착 {formatDateK(trip.endDate)}
              </span>
            ) : (
              <span className="text-gray-400">여행 날짜가 아직 없어요.</span>
            )}
          </div>

          {ddayMessage ? (
            <div>
              <div className="font-extrabold text-[18px] md:text-[20px] mt-2 mb-2 text-gray-900">
                {ddayMessage}
              </div>
            </div>
          ) : (
            <div className="text-gray-700">여행 정보가 업데이트되면 D-Day 메시지가 표시됩니다.</div>
          )}

          <div className="pt-2">
            <Link
              href="/profile"
              className="rounded-xl border px-4 py-2 bg-white hover:bg-gray-50 font-medium"
            >
              나의 정보 더 보기
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
