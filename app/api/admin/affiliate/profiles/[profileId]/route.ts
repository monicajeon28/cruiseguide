import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

import { profileInclude, serializeProfile, toNullableString, syncSalesAgentMentor } from '../shared';

function normalizePhone(phone: string | null | undefined) {
  if (!phone) return null;
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

export async function GET(req: NextRequest, { params }: { params: { profileId: string } }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { role: true },
    });

    if (dbUser?.role !== 'admin') {
      return NextResponse.json({ ok: false, message: 'Admin access required' }, { status: 403 });
    }

    const profileId = Number(params.profileId);
    if (!profileId || Number.isNaN(profileId)) {
      return NextResponse.json({ ok: false, message: '유효한 프로필 ID가 필요합니다.' }, { status: 400 });
    }

    const profile = await prisma.affiliateProfile.findUnique({
      where: { id: profileId },
      include: profileInclude,
    });

    if (!profile) {
      return NextResponse.json({ ok: false, message: '프로필을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, profile: serializeProfile(profile, true) }); // 관리자이므로 비밀번호 포함
  } catch (error) {
    console.error(`GET /api/admin/affiliate/profiles/${params.profileId} error:`, error);
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { profileId: string } }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { role: true },
    });

    if (dbUser?.role !== 'admin') {
      return NextResponse.json({ ok: false, message: 'Admin access required' }, { status: 403 });
    }

    const profileId = Number(params.profileId);
    if (!profileId || Number.isNaN(profileId)) {
      return NextResponse.json({ ok: false, message: '유효한 프로필 ID가 필요합니다.' }, { status: 400 });
    }

    const existing = await prisma.affiliateProfile.findUnique({
      where: { id: profileId },
      include: profileInclude,
    });

    if (!existing) {
      return NextResponse.json({ ok: false, message: '프로필을 찾을 수 없습니다.' }, { status: 404 });
    }

    const data = await req.json();

    const updateData: Record<string, unknown> = {};
    let shouldUpdateMallUser = false;
    let mallUserIdValue: string | null = null;

    if (data.type && ['HQ', 'BRANCH_MANAGER', 'SALES_AGENT'].includes(data.type)) {
      updateData.type = data.type;
    }

    if (data.status && ['DRAFT', 'AWAITING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'TERMINATED'].includes(data.status)) {
      updateData.status = data.status;
    }

    if (data.displayName !== undefined) updateData.displayName = toNullableString(data.displayName) ?? null;
    if (data.branchLabel !== undefined) updateData.branchLabel = toNullableString(data.branchLabel) ?? null;
    if (data.nickname !== undefined) updateData.nickname = toNullableString(data.nickname) ?? null;
    if (data.profileTitle !== undefined) updateData.profileTitle = toNullableString(data.profileTitle) ?? null;
    if (data.bio !== undefined) updateData.bio = toNullableString(data.bio) ?? null;
    if (data.profileImage !== undefined) updateData.profileImage = toNullableString(data.profileImage) ?? null;
    if (data.coverImage !== undefined) updateData.coverImage = toNullableString(data.coverImage) ?? null;
    if (data.contactPhone !== undefined) updateData.contactPhone = toNullableString(data.contactPhone) ?? null;
    if (data.contactEmail !== undefined) updateData.contactEmail = toNullableString(data.contactEmail) ?? null;
    if (data.kakaoLink !== undefined) updateData.kakaoLink = toNullableString(data.kakaoLink) ?? null;
    if (data.instagramHandle !== undefined) updateData.instagramHandle = toNullableString(data.instagramHandle) ?? null;
    if (data.youtubeChannel !== undefined) updateData.youtubeChannel = toNullableString(data.youtubeChannel) ?? null;
    if (data.homepageUrl !== undefined) updateData.homepageUrl = toNullableString(data.homepageUrl) ?? null;
    if (data.landingSlug !== undefined) updateData.landingSlug = toNullableString(data.landingSlug) ?? null;
    if (data.landingAnnouncement !== undefined) updateData.landingAnnouncement = toNullableString(data.landingAnnouncement) ?? null;
    if (data.welcomeMessage !== undefined) updateData.welcomeMessage = toNullableString(data.welcomeMessage) ?? null;
    if (data.bankName !== undefined) updateData.bankName = toNullableString(data.bankName) ?? null;
    if (data.bankAccount !== undefined) updateData.bankAccount = toNullableString(data.bankAccount) ?? null;
    if (data.bankAccountHolder !== undefined) updateData.bankAccountHolder = toNullableString(data.bankAccountHolder) ?? null;

    if (data.withholdingRate !== undefined) {
      const rate = Number(data.withholdingRate);
      if (!Number.isNaN(rate)) {
        updateData.withholdingRate = rate;
      }
    }

    if (data.contractStatus && ['DRAFT', 'REQUESTED', 'SENT', 'SIGNED', 'ARCHIVED'].includes(data.contractStatus)) {
      updateData.contractStatus = data.contractStatus;
    }

    if (data.metadata !== undefined) {
      updateData.metadata = data.metadata;
    }

    if (data.mallUserId !== undefined) {
      shouldUpdateMallUser = true;
      const converted = toNullableString(data.mallUserId);
      mallUserIdValue = converted === undefined ? null : converted;
    }

    if (data.published !== undefined) {
      updateData.published = Boolean(data.published);
      updateData.publishedAt = data.published ? new Date() : null;
    }

    const newType = (updateData.type as 'HQ' | 'BRANCH_MANAGER' | 'SALES_AGENT' | undefined) ?? existing.type;

    let shouldSyncMentor = false;
    let targetManagerProfileId: number | null = null;

    if (newType !== 'SALES_AGENT') {
      shouldSyncMentor = true;
      targetManagerProfileId = null;
    } else if (data.managerProfileId !== undefined) {
      shouldSyncMentor = true;
      const rawManager = data.managerProfileId;
      if (rawManager === null || String(rawManager).trim() === '' || String(rawManager).toUpperCase() === 'HQ') {
        targetManagerProfileId = null;
      } else {
        const parsedManagerId = Number(rawManager);
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

        targetManagerProfileId = managerProfile.id;
      }
    }

    if (Object.keys(updateData).length === 0) {
      if (!shouldSyncMentor) {
        return NextResponse.json({ ok: false, message: '업데이트할 필드가 없습니다.' }, { status: 400 });
      }
    } else {
      await prisma.affiliateProfile.update({
        where: { id: profileId },
        data: updateData as any,
      });
    }

    if (shouldUpdateMallUser) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: { mallUserId: mallUserIdValue },
      });
    }

    if (shouldSyncMentor) {
      await syncSalesAgentMentor(profileId, targetManagerProfileId);
    }

    const refreshed = await prisma.affiliateProfile.findUnique({
      where: { id: profileId },
      include: profileInclude,
    });

    return NextResponse.json({ ok: true, profile: serializeProfile(refreshed!, true) }); // 관리자이므로 비밀번호 포함
  } catch (error) {
    console.error(`PUT /api/admin/affiliate/profiles/${params.profileId} error:`, error);
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { profileId: string } }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { role: true },
    });

    if (dbUser?.role !== 'admin') {
      return NextResponse.json({ ok: false, message: 'Admin access required' }, { status: 403 });
    }

    const profileId = Number(params.profileId);
    if (!profileId || Number.isNaN(profileId)) {
      return NextResponse.json({ ok: false, message: '유효한 프로필 ID가 필요합니다.' }, { status: 400 });
    }

    const profile = await prisma.affiliateProfile.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        type: true,
        userId: true,
        contactPhone: true,
        user: {
          select: { phone: true },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ ok: false, message: '프로필을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (profile.type !== 'SALES_AGENT') {
      return NextResponse.json({ ok: false, message: '판매원 프로필만 삭제할 수 있습니다.' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const phoneCandidates = new Set<string>();
      const rawPhones = [profile.contactPhone, profile.user?.phone];
      rawPhones.forEach((value) => {
        if (!value) return;
        const normalized = normalizePhone(value);
        const digits = value.replace(/[^0-9]/g, '');
        if (normalized) phoneCandidates.add(normalized);
        if (digits) phoneCandidates.add(digits);
      });

      const contractConditions: any[] = [];

      if (profile.userId) {
        contractConditions.push({ userId: profile.userId });
      }

      contractConditions.push({ metadata: { path: ['affiliateProfileId'], equals: profileId } });

      if (phoneCandidates.size > 0) {
        contractConditions.push({ phone: { in: Array.from(phoneCandidates) } });
      }

      let contractIds: number[] = [];

      if (contractConditions.length > 0) {
        const relatedContracts = await tx.affiliateContract.findMany({
          where: { OR: contractConditions },
          select: { id: true },
        });
        contractIds = relatedContracts.map((contract) => contract.id);
      }

      if (contractIds.length > 0) {
        await tx.affiliateDocument.deleteMany({
          where: { affiliateContractId: { in: contractIds } },
        });

        await tx.affiliateContract.deleteMany({
          where: { id: { in: contractIds } },
        });
      }

      await tx.affiliateProfile.delete({ where: { id: profileId } });
      await tx.user.update({
        where: { id: profile.userId },
        data: { mallUserId: null, mallNickname: null },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`DELETE /api/admin/affiliate/profiles/${params.profileId} error:`, error);
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 });
  }
}


