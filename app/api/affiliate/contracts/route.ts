import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createHash, randomBytes } from 'crypto';

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

function maskResidentId(front: string, back: string) {
  const f = front.trim();
  const b = back.trim();
  if (f.length === 6 && b.length === 7) {
    return `${f}-${b[0]}******`;
  }
  return `${f}-${b}`;
}

export async function updateContractStatus(
  contractId: number,
  status: string,
  reviewerId?: number,
  data: Record<string, any> = {},
) {
  return prisma.affiliateContract.update({
    where: { id: contractId },
    data: {
      status,
      reviewerId: reviewerId ?? null,
      reviewedAt: new Date(),
      ...data,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ ok: false, message: 'application/json 요청이 필요합니다.' }, { status: 400 });
    }

    const data = await req.json();

    const name = (data.name ?? '').toString().trim();
    const phoneRaw = (data.phone ?? '').toString().trim();
    const email = (data.email ?? '').toString().trim();
    const address = (data.address ?? '').toString().trim();
    const residentIdFront = (data.residentIdFront ?? '').toString().trim();
    const residentIdBack = (data.residentIdBack ?? '').toString().trim();
    const bankName = (data.bankName ?? '').toString().trim();
    const bankAccount = (data.bankAccount ?? '').toString().trim();
    const bankAccountHolder = (data.bankAccountHolder ?? '').toString().trim();
    const signatureUrl = (data.signatureUrl ?? '').toString().trim();
    const signatureOriginalName = (data.signatureOriginalName ?? '').toString().trim();
    const signatureFileId = (data.signatureFileId ?? '').toString().trim();
    const invitedByProfileIdRaw = data.invitedByProfileId;
    const consentPrivacy = Boolean(data.consentPrivacy);
    const consentNonCompete = Boolean(data.consentNonCompete);
    const consentDbUse = Boolean(data.consentDbUse);
    const consentPenalty = Boolean(data.consentPenalty);

    let invitedByProfileId: number | null = null;

    if (!name || !phoneRaw || !residentIdFront || !residentIdBack || !address) {
      return NextResponse.json({ ok: false, message: '필수 항목이 누락되었습니다.' }, { status: 400 });
    }

    if (![consentPrivacy, consentNonCompete, consentDbUse, consentPenalty].every(Boolean)) {
      return NextResponse.json({ ok: false, message: '모든 동의 항목을 체크해주세요.' }, { status: 400 });
    }

    if (!signatureUrl) {
      return NextResponse.json({ ok: false, message: '계약서 서명 이미지를 업로드해주세요.' }, { status: 400 });
    }

    const phone = normalizePhone(phoneRaw);

    if (invitedByProfileIdRaw !== undefined && invitedByProfileIdRaw !== null && invitedByProfileId === null) {
      const parsed = Number(invitedByProfileIdRaw);
      if (!Number.isNaN(parsed) && parsed > 0) {
        invitedByProfileId = parsed;
      }
    }

    const existing = await prisma.affiliateContract.findFirst({
      where: {
        phone,
        status: { in: ['submitted', 'in_review', 'approved'] },
      },
    });

    if (existing) {
      return NextResponse.json({ ok: false, message: '이미 접수된 계약 신청이 있습니다.', contractId: existing.id }, { status: 409 });
    }

    let user = await prisma.user.findFirst({ where: { phone } });
    let isNewUser = false;

    if (!user) {
      const password = randomBytes(8).toString('hex');
      user = await prisma.user.create({
        data: {
          name,
          phone,
          password,
          role: 'user',
          customerSource: 'affiliate-contract-public',
          customerStatus: 'pending',
          adminMemo: 'Created via public affiliate contract form',
        },
      });
      isNewUser = true;
    } else if (!user.name && name) {
      await prisma.user.update({ where: { id: user.id }, data: { name } });
    }

    const residentMasked = maskResidentId(residentIdFront, residentIdBack);
    const residentHash = createHash('sha256').update(`${residentIdFront}${residentIdBack}`).digest('hex');

    if (invitedByProfileId && invitedByProfileId > 0) {
      const profileExists = await prisma.affiliateProfile.findUnique({ where: { id: invitedByProfileId } });
      if (!profileExists) {
        invitedByProfileId = null;
      }
    }

    const contract = await prisma.affiliateContract.create({
      data: {
        userId: user.id,
        name,
        residentId: residentMasked,
        phone,
        email: email || null,
        address,
        bankName: bankName || null,
        bankAccount: bankAccount || null,
        bankAccountHolder: bankAccountHolder || null,
        idCardPath: null,
        idCardOriginalName: null,
        bankbookPath: null,
        bankbookOriginalName: null,
        invitedByProfileId: invitedByProfileId || null,
        consentPrivacy,
        consentNonCompete,
        consentDbUse,
        consentPenalty,
        metadata: {
          residentIdHash: residentHash,
          source: invitedByProfileId ? 'branch-invite' : 'public-form',
          isNewUser,
          signature: {
            url: signatureUrl,
            originalName: signatureOriginalName || null,
            fileId: signatureFileId || null,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, contractId: contract.id });
  } catch (error) {
    console.error('POST /api/affiliate/contracts error:', error);
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 });
  }
}

