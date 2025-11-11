import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { profileInclude, serializeProfile, toNullableString, syncSalesAgentMentor } from './shared';

function requireAdmin(user: { id: number } | null, role: string | undefined) {
  if (!user || role !== 'admin') {
    return NextResponse.json({ ok: false, message: 'Admin access required' }, { status: 403 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { role: true },
    });

    const adminCheck = requireAdmin(sessionUser, dbUser?.role);
    if (adminCheck) return adminCheck;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() ?? '';
    const typeFilter = searchParams.get('type');
    const statusFilter = searchParams.get('status');
    const publishedFilter = searchParams.get('published');

    const where: any = {};

    if (typeFilter && ['HQ', 'BRANCH_MANAGER', 'SALES_AGENT'].includes(typeFilter)) {
      where.type = typeFilter;
    }

    if (statusFilter && ['DRAFT', 'AWAITING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'TERMINATED'].includes(statusFilter)) {
      where.status = statusFilter;
    }

    if (publishedFilter === 'true') {
      where.published = true;
    } else if (publishedFilter === 'false') {
      where.published = false;
    }

    if (search) {
      where.OR = [
        { nickname: { contains: search } },
        { displayName: { contains: search } },
        { branchLabel: { contains: search } },
        { affiliateCode: { contains: search } },
        {
          user: {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } },
            ],
          },
        },
      ];
    }

    const profiles = await prisma.affiliateProfile.findMany({
      where,
      include: profileInclude,
      orderBy: [{ updatedAt: 'desc' }],
      take: 250,
    });

    return NextResponse.json({
      ok: true,
      profiles: profiles.map((p) => serializeProfile(p, true)), // 관리자이므로 비밀번호 포함
    });
  } catch (error) {
    console.error('GET /api/admin/affiliate/profiles error:', error);
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 });
  }
}

function generateAffiliateCode() {
  const random = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0');
  return `AFF-${Date.now().toString(36).toUpperCase()}-${random}`;
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { role: true },
    });

    const adminCheck = requireAdmin(sessionUser, dbUser?.role);
    if (adminCheck) return adminCheck;

    const data = await req.json();

    const userId = Number(data.userId);
    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json({ ok: false, message: '유효한 사용자 ID가 필요합니다.' }, { status: 400 });
    }

    const mallUserIdValue =
      data.mallUserId !== undefined ? toNullableString(data.mallUserId) ?? null : undefined;

    const type = data.type as string | undefined;
    if (!type || !['HQ', 'BRANCH_MANAGER', 'SALES_AGENT'].includes(type)) {
      return NextResponse.json({ ok: false, message: '유효한 어필리에이트 유형이 필요합니다.' }, { status: 400 });
    }

    const existingProfile = await prisma.affiliateProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (existingProfile) {
      return NextResponse.json({ ok: false, message: '이미 해당 사용자에 대한 어필리에이트 프로필이 존재합니다.' }, { status: 409 });
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!userRecord) {
      return NextResponse.json({ ok: false, message: '존재하지 않는 사용자입니다. 먼저 사용자 계정을 생성해주세요.' }, { status: 404 });
    }

    const affiliateCode = (data.affiliateCode as string | undefined)?.trim() || generateAffiliateCode();

    let managerProfileId: number | null = null;
    if (type === 'SALES_AGENT') {
      if (data.managerProfileId !== undefined && data.managerProfileId !== null && String(data.managerProfileId).toUpperCase() !== 'HQ' && `${data.managerProfileId}`.trim() !== '') {
        const parsedManagerId = Number(data.managerProfileId);
        if (!parsedManagerId || Number.isNaN(parsedManagerId)) {
          return NextResponse.json({ ok: false, message: '유효한 대리점장 ID가 필요합니다.' }, { status: 400 });
        }

        const managerProfile = await prisma.affiliateProfile.findUnique({
          where: { id: parsedManagerId },
          select: { id: true, type: true, status: true },
        });

        if (!managerProfile || managerProfile.type !== 'BRANCH_MANAGER') {
          return NextResponse.json({ ok: false, message: '대리점장 프로필만 지정할 수 있습니다.' }, { status: 400 });
        }

        managerProfileId = managerProfile.id;
      }
    }

    const payload: Record<string, unknown> = {
      user: { connect: { id: userId } },
      affiliateCode,
      type: type as any,
      status: (data.status as string | undefined) ?? 'DRAFT',
      displayName: toNullableString(data.displayName) ?? undefined,
      branchLabel: toNullableString(data.branchLabel) ?? undefined,
      nickname: toNullableString(data.nickname) ?? undefined,
      profileTitle: toNullableString(data.profileTitle) ?? undefined,
      bio: toNullableString(data.bio) ?? undefined,
      profileImage: toNullableString(data.profileImage) ?? undefined,
      coverImage: toNullableString(data.coverImage) ?? undefined,
      contactPhone: toNullableString(data.contactPhone) ?? undefined,
      contactEmail: toNullableString(data.contactEmail) ?? undefined,
      kakaoLink: toNullableString(data.kakaoLink) ?? undefined,
      instagramHandle: toNullableString(data.instagramHandle) ?? undefined,
      youtubeChannel: toNullableString(data.youtubeChannel) ?? undefined,
      homepageUrl: toNullableString(data.homepageUrl) ?? undefined,
      landingSlug: toNullableString(data.landingSlug) ?? undefined,
      landingAnnouncement: toNullableString(data.landingAnnouncement) ?? undefined,
      welcomeMessage: toNullableString(data.welcomeMessage) ?? undefined,
      published: data.published !== undefined ? Boolean(data.published) : true,
      bankName: toNullableString(data.bankName) ?? undefined,
      bankAccount: toNullableString(data.bankAccount) ?? undefined,
      bankAccountHolder: toNullableString(data.bankAccountHolder) ?? undefined,
      withholdingRate: data.withholdingRate !== undefined ? Number(data.withholdingRate) : 3.3,
      contractStatus: (data.contractStatus as string | undefined) ?? 'DRAFT',
      metadata: data.metadata ?? undefined,
    };

    if (payload.published) {
      payload.publishedAt = new Date();
    }

    const profile = await prisma.$transaction(async (tx) => {
      const created = await tx.affiliateProfile.create({
        data: payload as any,
        include: profileInclude,
      });
      if (mallUserIdValue !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: { mallUserId: mallUserIdValue },
        });
      }
      return created;
    });

    if (type === 'SALES_AGENT') {
      await syncSalesAgentMentor(profile.id, managerProfileId);
    }

    const refreshed = await prisma.affiliateProfile.findUnique({
      where: { id: profile.id },
      include: profileInclude,
    });

    return NextResponse.json({ ok: true, profile: serializeProfile(refreshed!, true) }); // 관리자이므로 비밀번호 포함
  } catch (error: any) {
    console.error('POST /api/admin/affiliate/profiles error:', error);

    if (error?.code === 'P2002') {
      return NextResponse.json({ ok: false, message: '이미 사용 중인 고유 값이 있습니다. 랜딩 슬러그나 코드가 중복되지 않도록 확인해주세요.' }, { status: 409 });
    }

    if (error?.code === 'P2003') {
      return NextResponse.json({ ok: false, message: '연결된 사용자 정보를 확인할 수 없습니다.' }, { status: 400 });
    }

    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 });
  }
}

