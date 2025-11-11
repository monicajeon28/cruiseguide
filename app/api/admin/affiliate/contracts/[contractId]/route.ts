import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

function requireAdmin(role?: string | null) {
  if (role !== 'admin') {
    return NextResponse.json({ ok: false, message: 'Admin access required' }, { status: 403 });
  }
  return null;
}

// GET: 계약서 상세 정보 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { contractId: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({ where: { id: sessionUser.id }, select: { role: true } });
    const guard = requireAdmin(admin?.role);
    if (guard) return guard;

    const contractId = parseInt(params.contractId);
    if (isNaN(contractId)) {
      return NextResponse.json({ ok: false, message: 'Invalid contract ID' }, { status: 400 });
    }

    const contract = await prisma.affiliateContract.findUnique({
      where: { id: contractId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            mallUserId: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            displayName: true,
            nickname: true,
            type: true,
            affiliateCode: true,
            branchLabel: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                mallUserId: true,
              },
            },
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json({ ok: false, message: 'Contract not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, contract });
  } catch (error) {
    console.error(`GET /api/admin/affiliate/contracts/${params.contractId} error:`, error);
    return NextResponse.json({ ok: false, message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// DELETE: 계약서 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: { contractId: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({ where: { id: sessionUser.id }, select: { role: true } });
    const guard = requireAdmin(admin?.role);
    if (guard) return guard;

    const contractId = parseInt(params.contractId);
    if (isNaN(contractId)) {
      return NextResponse.json({ ok: false, message: 'Invalid contract ID' }, { status: 400 });
    }

    // 계약서 존재 확인
    const contract = await prisma.affiliateContract.findUnique({
      where: { id: contractId },
      select: { id: true },
    });

    if (!contract) {
      return NextResponse.json({ ok: false, message: 'Contract not found' }, { status: 404 });
    }

    // 계약서 삭제
    await prisma.affiliateContract.delete({
      where: { id: contractId },
    });

    return NextResponse.json({ ok: true, message: '계약서가 삭제되었습니다.' });
  } catch (error) {
    console.error(`DELETE /api/admin/affiliate/contracts/${params.contractId} error:`, error);
    return NextResponse.json({ ok: false, message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

