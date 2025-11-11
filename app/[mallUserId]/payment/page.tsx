import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';

/**
 * 개인 결제/정산 페이지
 * /[mallUserId]/payment 형식으로 접근
 * 예: /user1/payment
 * 
 * 현재는 정산 내역 확인 페이지로 사용
 */
export default async function PersonalPaymentPage({ params }: { params: { mallUserId: string } }) {
  const sessionUser = await getSessionUser();
  const mallUserId = params.mallUserId;

  // 세션이 없으면 파트너 로그인으로 리다이렉트
  if (!sessionUser) {
    redirect('/partner');
  }

  // 관리자 체크
  const isAdmin = sessionUser.role === 'admin';

  // 대상 사용자 찾기
  const targetUser = await prisma.user.findFirst({
    where: { mallUserId },
    select: { id: true, name: true, email: true, phone: true, mallUserId: true },
  });

  if (!targetUser) {
    redirect('/admin/affiliate/mall');
  }

  // 관리자가 아닌 경우, 본인 확인 필요
  if (!isAdmin) {
    if (sessionUser.id !== targetUser.id) {
      redirect(`/${targetUser.mallUserId}/payment`);
    }
  }

  // 프로필 정보 가져오기
  const profile = await prisma.affiliateProfile.findFirst({
    where: { userId: targetUser.id },
    select: {
      id: true,
      type: true,
      affiliateCode: true,
      displayName: true,
      branchLabel: true,
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 pb-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pt-10 md:px-6">
        {/* 헤더 */}
        <header className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-3xl shadow-xl">
          <div className="relative z-10 flex flex-col gap-8 px-6 py-12 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.35em] text-white/80">Payment & Settlement</p>
              <h1 className="text-3xl font-black leading-snug md:text-4xl">
                결제 및 정산 관리
              </h1>
              <p className="max-w-2xl text-sm text-white/80 md:text-base">
                결제 내역 확인, 정산 명세서 조회, 수당 관리를 한 곳에서 처리하세요.
              </p>
              <div className="flex flex-wrap gap-3 text-xs md:text-sm">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 font-semibold text-white/90">
                  파트너 ID {mallUserId}
                </span>
                {profile?.branchLabel && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 font-semibold text-white/90">
                    {profile.branchLabel}
                  </span>
                )}
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 px-3 py-1 font-semibold text-yellow-200">
                    관리자 모드
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* 빠른 메뉴 */}
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-bold text-slate-900">정산 명세서</h2>
            <p className="mb-4 text-sm text-slate-600">
              지급명세서를 확인하고 다운로드할 수 있습니다.
            </p>
            <Link
              href={`/partner/${mallUserId}/statements`}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
            >
              지급명세서 보기
            </Link>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-bold text-slate-900">수당 조정 신청</h2>
            <p className="mb-4 text-sm text-slate-600">
              수당 조정이 필요한 경우 신청할 수 있습니다.
            </p>
            <Link
              href={`/partner/${mallUserId}/adjustments`}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
            >
              수당 조정 신청
            </Link>
          </div>
        </section>

        {/* 준비 중 안내 */}
        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800 mb-2">결제 기능 준비 중</h3>
                <p className="text-sm text-yellow-700 mb-4">
                  고객 결제 처리 기능은 현재 개발 중입니다. 곧 이용하실 수 있습니다.
                </p>
                <div className="space-y-2 text-sm text-yellow-700">
                  <p className="font-semibold">예정된 기능:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>고객 상품 결제 처리</li>
                    <li>결제 내역 실시간 조회</li>
                    <li>환불 처리 및 관리</li>
                    <li>결제 통계 및 분석</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 파트너 정보 */}
        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-lg font-bold text-slate-900">파트너 정보</h2>
          <dl className="space-y-3 text-sm text-slate-600">
            <div>
              <dt className="font-semibold text-slate-500">파트너 아이디</dt>
              <dd className="font-mono">{mallUserId}</dd>
            </div>
            {profile?.displayName && (
              <div>
                <dt className="font-semibold text-slate-500">담당자</dt>
                <dd>{profile.displayName}</dd>
              </div>
            )}
            {profile?.branchLabel && (
              <div>
                <dt className="font-semibold text-slate-500">지점 / 팀</dt>
                <dd>{profile.branchLabel}</dd>
              </div>
            )}
            {targetUser.phone && (
              <div>
                <dt className="font-semibold text-slate-500">연락처</dt>
                <dd>{targetUser.phone}</dd>
              </div>
            )}
            {targetUser.email && (
              <div>
                <dt className="font-semibold text-slate-500">이메일</dt>
                <dd>{targetUser.email}</dd>
              </div>
            )}
          </dl>
        </section>

        {/* 네비게이션 */}
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/${mallUserId}/dashboard`}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            대시보드로 돌아가기
          </Link>
          <Link
            href={`/${mallUserId}/customers`}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
          >
            고객 관리
          </Link>
          {isAdmin && (
            <Link
              href="/admin/affiliate/mall"
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-purple-700"
            >
              관리자 패널로 돌아가기
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

