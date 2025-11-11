import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { profileInclude, serializeProfile, toNullableString } from '@/app/api/admin/affiliate/profiles/shared';

function normalizePhone(phone: string | null | undefined) {
  if (!phone) return phone;
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return null;
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return digits;
}

async function requireAffiliateProfile(userId: number) {
  const profile = await prisma.affiliateProfile.findFirst({
    where: { userId },
    include: profileInclude,
    orderBy: [{ updatedAt: 'desc' }],
  });
  return profile;
}

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, message: '로그인이 필요합니다.' }, { status: 401 });
    }

    const profile = await requireAffiliateProfile(sessionUser.id);
    if (!profile) {
      return NextResponse.json({ ok: false, message: '어필리에이트 프로필을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, profile: serializeProfile(profile) });
  } catch (error) {
    console.error('GET /api/affiliate/me/profile error:', error);
    return NextResponse.json({ ok: false, message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

const EDITABLE_FIELDS = [
  'profileTitle',
  'landingAnnouncement',
  'welcomeMessage',
  'bio',
  'profileImage',
  'coverImage',
  'kakaoLink',
  'contactPhone',
  'contactEmail',
  'homepageUrl',
  'instagramHandle',
  'youtubeChannel',
] as const;

type EditableField = (typeof EDITABLE_FIELDS)[number];

export async function PUT(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, message: '로그인이 필요합니다.' }, { status: 401 });
    }

    const existing = await requireAffiliateProfile(sessionUser.id);
    if (!existing) {
      return NextResponse.json({ ok: false, message: '어필리에이트 프로필을 찾을 수 없습니다.' }, { status: 404 });
    }

    let payload;
    try {
      payload = await req.json();
    } catch (parseError) {
      console.error('PUT /api/affiliate/me/profile JSON parse error:', parseError);
      return NextResponse.json({ ok: false, message: '요청 데이터 형식이 올바르지 않습니다.' }, { status: 400 });
    }

    const data: Record<string, unknown> = {};

    EDITABLE_FIELDS.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(payload, field)) {
        if (field === 'contactPhone') {
          const normalized = normalizePhone(toNullableString(payload[field]));
          data[field] = normalized ?? null;
        } else if (field === 'contactEmail') {
          const value = toNullableString(payload[field]);
          data[field] = value ?? null;
        } else {
          const value = toNullableString(payload[field]);
          data[field] = value ?? null;
        }
      }
    });

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ ok: true, profile: serializeProfile(existing) });
    }

    const updated = await prisma.affiliateProfile.update({
      where: { id: existing.id },
      data,
      include: profileInclude,
    });

    return NextResponse.json({ ok: true, profile: serializeProfile(updated) });
  } catch (error: any) {
    console.error('PUT /api/affiliate/me/profile error:', error);
    
    // Prisma 에러 처리
    if (error.code === 'P2025') {
      return NextResponse.json({ ok: false, message: '프로필을 찾을 수 없습니다.' }, { status: 404 });
    }
    
    // 일반적인 에러 메시지
    const errorMessage = error?.message || '서버 오류가 발생했습니다.';
    return NextResponse.json({ ok: false, message: errorMessage }, { status: 500 });
  }
}

