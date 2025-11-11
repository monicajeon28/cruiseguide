import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

function normalizePhone(phone: string) {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return digits;
}

function buildInviteMessage(managerName: string, branchLabel: string | null, contractUrl: string) {
  const namePart = branchLabel ? `${managerName} (${branchLabel})` : managerName;
  return [
    '[크루즈닷 어필리에이트 초대]',
    `${namePart} 님이 판매원 계약 작성을 초대합니다.`,
    '아래 링크에서 계약서를 작성하고, 안내된 구글 드라이브 폴더에 신분증/통장 사본을 업로드해주세요.',
    contractUrl,
    '',
    '※ 준비물: 신분증 사본, 통장 사본 (공유 링크 업로드)',
    '작성 완료 후 본사에서 검토 후 승인 절차를 안내드립니다.',
  ].join('\n');
}

export async function POST(req: NextRequest) {
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
      select: {
        id: true,
        type: true,
        displayName: true,
        nickname: true,
        branchLabel: true,
      },
    });

    if (!managerProfile) {
      return NextResponse.json({ ok: false, message: '어필리에이트 프로필을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (!['HQ', 'BRANCH_MANAGER'].includes(managerProfile.type)) {
      return NextResponse.json({ ok: false, message: '판매원 초대는 본사 또는 대리점장만 가능합니다.' }, { status: 403 });
    }

    const body = await req.json();
    const name = (body?.name ?? '').toString().trim();
    const phoneRaw = (body?.phone ?? '').toString().trim();

    if (!name || !phoneRaw) {
      return NextResponse.json({ ok: false, message: '이름과 연락처를 모두 입력해주세요.' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phoneRaw);
    if (normalizedPhone.replace(/[^0-9]/g, '').length < 9) {
      return NextResponse.json({ ok: false, message: '연락처 형식을 확인해주세요.' }, { status: 400 });
    }

    const existing = await prisma.affiliateContract.findFirst({
      where: {
        phone: normalizedPhone,
        status: { in: ['submitted', 'in_review', 'approved'] },
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          ok: false,
          message: '이미 진행 중인 계약 신청이 있습니다. 기존 계약 진행 상태를 확인해주세요.',
          contractId: existing.id,
        },
        { status: 409 },
      );
    }

    const { origin } = new URL(req.url);
    const contractUrl = `${origin.replace(/\/$/, '')}/affiliate/contract?invitedBy=${managerProfile.id}`;
    const managerName = managerProfile.displayName || managerProfile.nickname || '크루즈닷 파트너';
    const message = buildInviteMessage(managerName, managerProfile.branchLabel, contractUrl);

    return NextResponse.json({ ok: true, message, contractUrl, phone: normalizedPhone });
  } catch (error) {
    console.error('POST /api/affiliate/contracts/invite error:', error);
    return NextResponse.json({ ok: false, message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

