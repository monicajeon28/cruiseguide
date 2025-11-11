import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, message: '로그인이 필요합니다.' }, { status: 401 });
    }

    const managerProfile = await prisma.affiliateProfile.findFirst({
      where: {
        userId: sessionUser.id,
        status: { in: ['ACTIVE', 'AWAITING_APPROVAL', 'DRAFT'] },
      },
      select: { id: true, type: true },
    });

    if (!managerProfile) {
      return NextResponse.json({ ok: false, message: '어필리에이트 프로필을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (!['HQ', 'BRANCH_MANAGER'].includes(managerProfile.type)) {
      return NextResponse.json({ ok: false, message: '판매원 초대 목록은 본사 또는 대리점장만 확인할 수 있습니다.' }, { status: 403 });
    }

    const contracts = await prisma.affiliateContract.findMany({
      where: { invitedByProfileId: managerProfile.id },
      orderBy: { submittedAt: 'desc' },
      take: 200,
      select: {
        id: true,
        name: true,
        phone: true,
        status: true,
        submittedAt: true,
      },
    });

    const serialized = contracts.map((contract) => ({
      ...contract,
      submittedAt: contract.submittedAt ? contract.submittedAt.toISOString() : null,
    }));

    return NextResponse.json({ ok: true, contracts: serialized });
  } catch (error) {
    console.error('GET /api/affiliate/contracts/my-invites error:', error);
    return NextResponse.json({ ok: false, message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}


