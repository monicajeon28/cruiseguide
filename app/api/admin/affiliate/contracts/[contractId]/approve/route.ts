import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { updateContractStatus } from '@/app/api/affiliate/contracts/route';
import { profileInclude } from '@/app/api/admin/affiliate/profiles/shared';
import { randomBytes } from 'crypto';

function requireAdmin(role?: string | null) {
  if (role !== 'admin') {
    return NextResponse.json({ ok: false, message: 'Admin access required' }, { status: 403 });
  }
  return null;
}

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

async function generateMallUserId() {
  const existing = await prisma.user.findMany({
    where: {
      mallUserId: {
        startsWith: 'user',
      },
    },
    select: { mallUserId: true },
  });

  const used = new Set<number>();
  existing.forEach((record) => {
    if (!record.mallUserId) return;
    const match = record.mallUserId.match(/^user(\d{1,5})$/i);
    if (match) {
      const num = Number(match[1]);
      if (!Number.isNaN(num)) {
        used.add(num);
      }
    }
  });

  for (let i = 1; i <= 99999; i += 1) {
    if (!used.has(i)) {
      return `user${i}`;
    }
  }

  throw new Error('사용 가능한 파트너 아이디가 없습니다.');
}

function generateAffiliateCode(name: string, id: number) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 12);
  const suffix = randomBytes(2).toString('hex');
  return `AFF-${slug || 'partner'}-${suffix}-${id}`.toUpperCase();
}

export async function POST(req: NextRequest, { params }: { params: { contractId: string } }) {
  try {
    const contractId = Number(params.contractId);
    if (!contractId || Number.isNaN(contractId)) {
      return NextResponse.json({ ok: false, message: 'Invalid contract ID' }, { status: 400 });
    }

    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({ where: { id: sessionUser.id }, select: { role: true } });
    const guard = requireAdmin(admin?.role);
    if (guard) return guard;

    const contract = await prisma.affiliateContract.findUnique({
      where: { id: contractId },
      include: { user: true },
    });

    if (!contract) {
      return NextResponse.json({ ok: false, message: 'Contract not found' }, { status: 404 });
    }

    if (contract.status === 'approved') {
      return NextResponse.json({ ok: false, message: '이미 승인된 계약입니다.' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(contract.phone);
    const digitsPhone = contract.phone.replace(/[^0-9]/g, '');

    let userId = contract.userId;
    let userRecord = contract.user
      ? await prisma.user.findUnique({
          where: { id: contract.userId! },
          select: { id: true, mallUserId: true, mallNickname: true, role: true, password: true },
        })
      : null;
    let mallUserIdAssigned: string | null = userRecord?.mallUserId ?? null;

    if (!userId) {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ phone: normalizedPhone }, { phone: digitsPhone }],
        },
        select: { id: true, mallUserId: true, mallNickname: true, role: true, password: true },
      });

      if (existingUser) {
        userId = existingUser.id;
        userRecord = existingUser;
        await prisma.affiliateContract.update({
          where: { id: contractId },
          data: { userId: existingUser.id },
        });
      } else {
        const newMallUserId = await generateMallUserId();
        const newUser = await prisma.user.create({
          data: {
            name: contract.name,
            phone: normalizedPhone || digitsPhone,
            email: contract.email || undefined,
            password: 'qwe1',
            role: 'community',
            customerSource: 'affiliate-contract-approval',
            customerStatus: 'pending',
            adminMemo: `Auto-created from affiliate contract approval by admin ${sessionUser.id}`,
            mallUserId: newMallUserId,
            mallNickname: contract.name,
          },
          select: { id: true, mallUserId: true, mallNickname: true, role: true, password: true },
        });
        userId = newUser.id;
        userRecord = newUser;
        mallUserIdAssigned = newUser.mallUserId;
        await prisma.affiliateContract.update({ where: { id: contractId }, data: { userId: newUser.id } });
      }
    }

    if (!userId) {
      return NextResponse.json({ ok: false, message: '연결된 사용자 정보가 없습니다.' }, { status: 400 });
    }

    if (!userRecord) {
      userRecord = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, mallUserId: true, mallNickname: true, role: true, password: true },
      });
    }

    if (!userRecord) {
      return NextResponse.json({ ok: false, message: '사용자 정보를 불러올 수 없습니다.' }, { status: 404 });
    }

    if (!userRecord.mallUserId) {
      const newMallUserId = await generateMallUserId();
      const updatedUser = await prisma.user.update({
        where: { id: userRecord.id },
        data: {
          mallUserId: newMallUserId,
          mallNickname: contract.name,
          role: userRecord.role === 'community' ? undefined : 'community',
        },
        select: { mallUserId: true, mallNickname: true, role: true, password: true },
      });
      userRecord = { ...userRecord, ...updatedUser };
      mallUserIdAssigned = updatedUser.mallUserId;
    } else {
      mallUserIdAssigned = userRecord.mallUserId;
      const updateData: Record<string, unknown> = {};
      if (!userRecord.mallNickname) {
        updateData.mallNickname = contract.name;
      }
      if (userRecord.role !== 'community') {
        updateData.role = 'community';
      }
      if (Object.keys(updateData).length > 0) {
        const updated = await prisma.user.update({
          where: { id: userRecord.id },
          data: updateData,
          select: { mallNickname: true, role: true, password: true },
        });
        userRecord = { ...userRecord, ...updated };
      }
    }

    if (userRecord.password !== 'qwe1') {
      await prisma.user.update({ where: { id: userRecord.id }, data: { password: 'qwe1' } });
      userRecord = { ...userRecord, password: 'qwe1' };
    }

    const existingProfile = await prisma.affiliateProfile.findUnique({ where: { userId } });
    if (existingProfile) {
      return NextResponse.json({ ok: false, message: '이미 어필리에이트 프로필이 존재합니다.' }, { status: 400 });
    }

    const affiliateCode = generateAffiliateCode(contract.name, contract.id);
    const sourceMeta = (contract.metadata ?? {}) as Record<string, any>;
    const invitedByProfileId = contract.invitedByProfileId || (sourceMeta?.invitedByProfileId as number | undefined);

    const payload: Record<string, unknown> = {
      user: { connect: { id: userId } },
      affiliateCode,
      type: invitedByProfileId ? 'SALES_AGENT' : 'BRANCH_MANAGER',
      status: 'ACTIVE',
      displayName: contract.name,
      branchLabel: invitedByProfileId ? null : undefined,
      nickname: contract.name,
      contactPhone: normalizedPhone,
      contactEmail: contract.email,
      bankName: contract.bankName,
      bankAccount: contract.bankAccount,
      bankAccountHolder: contract.bankAccountHolder,
      withholdingRate: 3.3,
      contractStatus: 'SIGNED',
      contractSignedAt: new Date(),
      metadata: invitedByProfileId
        ? {
            invitedByProfileId,
          }
        : undefined,
    };

    if (!payload.landingSlug && mallUserIdAssigned) {
      payload.landingSlug = mallUserIdAssigned;
    }

    const profile = await prisma.affiliateProfile.create({
      data: payload as any,
      include: profileInclude,
    });

    if (invitedByProfileId) {
      await prisma.affiliateRelation.upsert({
        where: {
          managerId_agentId: {
            managerId: invitedByProfileId,
            agentId: profile.id,
          },
        },
        create: {
          managerId: invitedByProfileId,
          agentId: profile.id,
          status: 'ACTIVE',
          connectedAt: new Date(),
        },
        update: {
          status: 'ACTIVE',
          connectedAt: new Date(),
          disconnectedAt: null,
        },
      });
    }

    await updateContractStatus(contractId, 'approved', sessionUser.id, {
      contractSignedAt: new Date(),
      invitedByProfileId: invitedByProfileId ?? null,
      metadata: {
        ...(contract.metadata || {}),
        affiliateProfileId: profile.id,
        mallUserId: mallUserIdAssigned,
      },
    });

    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    console.error(`POST /api/admin/affiliate/contracts/${params.contractId}/approve error:`, error);
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 });
  }
}
