import { NextRequest, NextResponse } from 'next/server';
import { requirePartnerContext } from '@/app/api/partner/_utils';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

export async function PUT(req: NextRequest) {
  try {
    const { profile } = await requirePartnerContext();
    const body = await req.json();

    const {
      displayName,
      contactPhone,
      contactEmail,
      profileTitle,
      landingAnnouncement,
      welcomeMessage,
    } = body;

    // AffiliateProfile 업데이트
    const updatedProfile = await prisma.affiliateProfile.update({
      where: { id: profile.id },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(profileTitle !== undefined && { profileTitle }),
        ...(landingAnnouncement !== undefined && { landingAnnouncement }),
        ...(welcomeMessage !== undefined && { welcomeMessage }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            mallUserId: true,
            mallNickname: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      profile: updatedProfile,
      message: '프로필이 성공적으로 업데이트되었습니다.',
    });
  } catch (error: any) {
    console.error('[PUT /api/partner/profile] error:', error);
    return NextResponse.json(
      { ok: false, message: '프로필 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}

