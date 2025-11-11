import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.id) {
      return NextResponse.json({ ok: false, message: '로그인이 필요합니다.' }, { status: 401 });
    }

    const userId = sessionUser.id;

    // 사용자의 AffiliateProfile 조회 (계약서 정보 포함)
    const profile = await prisma.affiliateProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            mallUserId: true,
            mallNickname: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ ok: true, contract: null });
    }

    // AffiliateProfile을 계약서 형식으로 변환
    const contract = {
      id: profile.id,
      userId: profile.userId,
      name: profile.user?.name || profile.displayName || '',
      phone: profile.contactPhone || profile.user?.phone || '',
      email: profile.contactEmail || profile.user?.email || null,
      address: '', // 주소 정보는 별도 필드가 없을 수 있음
      bankName: profile.bankName || null,
      bankAccount: profile.bankAccount || null,
      bankAccountHolder: profile.bankAccountHolder || null,
      status: profile.contractStatus === 'SIGNED' ? 'approved' : 'pending',
      submittedAt: profile.contractSignedAt?.toISOString() || profile.createdAt.toISOString(),
      reviewedAt: profile.contractSignedAt?.toISOString() || null,
      consentPrivacy: true, // 기본값
      consentNonCompete: true, // 기본값
      consentDbUse: true, // 기본값
      consentPenalty: true, // 기본값
      metadata: null,
    };

    return NextResponse.json({ ok: true, contract });
  } catch (error: any) {
    console.error('[GET /api/affiliate/my-contract] error:', error);
    return NextResponse.json({ ok: false, message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
