// app/api/admin/affiliate/leads/[leadId]/route.ts
// 어필리에이트 Lead 상세 조회/수정 API

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET: Lead 상세 조회
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const leadId = Number(params.leadId);
    if (isNaN(leadId)) {
      return NextResponse.json({ ok: false, message: 'Invalid lead ID' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        role: true,
        AffiliateProfile: {
          select: {
            id: true,
            type: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 });
    }

    const lead = await prisma.affiliateLead.findUnique({
      where: { id: leadId },
      include: {
        manager: {
          select: {
            id: true,
            affiliateCode: true,
            displayName: true,
            branchLabel: true,
          },
        },
        agent: {
          select: {
            id: true,
            affiliateCode: true,
            displayName: true,
          },
        },
        link: {
          select: {
            id: true,
            code: true,
            title: true,
            productCode: true,
          },
        },
        interactions: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            media: {
              select: {
                id: true,
                fileName: true,
                fileSize: true,
                mimeType: true,
                storagePath: true,
                createdAt: true,
              },
            },
          },
          orderBy: { occurredAt: 'desc' },
        },
        sales: {
          select: {
            id: true,
            productCode: true,
            saleAmount: true,
            status: true,
            saleDate: true,
          },
          orderBy: { saleDate: 'desc' },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ ok: false, message: 'Lead not found' }, { status: 404 });
    }

    // 권한 체크
    if (user.role === 'admin') {
      // 관리자: 모든 Lead 조회 가능
    } else if (user.AffiliateProfile?.type === 'BRANCH_MANAGER') {
      // 대리점장: 본인 및 본인 판매원 Lead만 조회 가능
      const profileId = user.AffiliateProfile.id;
      if (lead.managerId !== profileId && lead.agentId !== profileId) {
        // 판매원이 본인 팀에 속해있는지 확인
        if (lead.agentId) {
          const relation = await prisma.affiliateRelation.findFirst({
            where: {
              managerId: profileId,
              agentId: lead.agentId,
              status: 'ACTIVE',
            },
          });
          if (!relation) {
            return NextResponse.json({ ok: false, message: 'Access denied' }, { status: 403 });
          }
        } else {
          return NextResponse.json({ ok: false, message: 'Access denied' }, { status: 403 });
        }
      }
    } else if (user.AffiliateProfile?.type === 'SALES_AGENT') {
      // 판매원: 본인 Lead만 조회 가능
      if (lead.agentId !== user.AffiliateProfile.id) {
        return NextResponse.json({ ok: false, message: 'Access denied' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ ok: false, message: 'Access denied' }, { status: 403 });
    }

    if (!lead) {
      return NextResponse.json({ ok: false, message: 'Lead not found' }, { status: 404 });
    }

    // 여권 제출 정보 조회 (고객 전화번호로 매칭)
    let passportSubmissions: any[] = [];
    if (lead.customerPhone) {
      try {
        passportSubmissions = await prisma.passportSubmission.findMany({
          where: {
            user: {
              phone: lead.customerPhone,
            },
            isSubmitted: true,
          },
          include: {
            guests: {
              select: {
                id: true,
                name: true,
                passportNumber: true,
                passportExpiryDate: true,
              },
            },
          },
          orderBy: { submittedAt: 'desc' },
          take: 1,
        });
      } catch (error) {
        console.error('[Lead API] Passport submission query error:', error);
        // 여권 조회 실패해도 Lead 조회는 성공으로 처리
      }
    }

    return NextResponse.json({
      ok: true,
      lead: {
        ...lead,
        passportSubmissions,
      },
    });
  } catch (error) {
    console.error('GET /api/admin/affiliate/leads/[leadId] error:', error);
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 });
  }
}

/**
 * PUT: Lead 수정 (이름, 전화번호 등)
 * - 관리자: 모든 Lead 수정 가능
 * - 대리점장: 본인 및 본인 판매원 Lead 수정 가능
 * - 판매원: 본인 Lead 수정 가능
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const leadId = Number(params.leadId);
    if (isNaN(leadId)) {
      return NextResponse.json({ ok: false, message: 'Invalid lead ID' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        role: true,
        AffiliateProfile: {
          select: {
            id: true,
            type: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 });
    }

    // 기존 Lead 조회
    const existingLead = await prisma.affiliateLead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        managerId: true,
        agentId: true,
      },
    });

    if (!existingLead) {
      return NextResponse.json({ ok: false, message: 'Lead not found' }, { status: 404 });
    }

    // 권한 체크
    if (user.role === 'admin') {
      // 관리자: 모든 Lead 수정 가능
    } else if (user.AffiliateProfile?.type === 'BRANCH_MANAGER') {
      // 대리점장: 본인 및 본인 판매원 Lead만 수정 가능
      const profileId = user.AffiliateProfile.id;
      if (existingLead.managerId !== profileId && existingLead.agentId !== profileId) {
        // 판매원이 본인 팀에 속해있는지 확인
        if (existingLead.agentId) {
          const relation = await prisma.affiliateRelation.findFirst({
            where: {
              managerId: profileId,
              agentId: existingLead.agentId,
              status: 'ACTIVE',
            },
          });
          if (!relation) {
            return NextResponse.json({ ok: false, message: 'Access denied' }, { status: 403 });
          }
        } else {
          return NextResponse.json({ ok: false, message: 'Access denied' }, { status: 403 });
        }
      }
    } else if (user.AffiliateProfile?.type === 'SALES_AGENT') {
      // 판매원: 본인 Lead만 수정 가능
      if (existingLead.agentId !== user.AffiliateProfile.id) {
        return NextResponse.json({ ok: false, message: 'Access denied' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ ok: false, message: 'Access denied' }, { status: 403 });
    }

    const body = await req.json();
    const {
      customerName,
      customerPhone,
      status,
      notes,
      lastContactedAt,
      nextActionAt,
      metadata,
    } = body;

    // 업데이트 데이터 준비
    const updateData: any = {};
    if (customerName !== undefined) updateData.customerName = customerName || null;
    if (customerPhone !== undefined) updateData.customerPhone = customerPhone || null;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes || null;
    if (lastContactedAt !== undefined) {
      updateData.lastContactedAt = lastContactedAt ? new Date(lastContactedAt) : null;
    }
    if (nextActionAt !== undefined) {
      updateData.nextActionAt = nextActionAt ? new Date(nextActionAt) : null;
    }
    if (metadata !== undefined) {
      updateData.metadata = metadata;
    }

    // Lead 수정
    const updatedLead = await prisma.affiliateLead.update({
      where: { id: leadId },
      data: updateData,
      include: {
        manager: {
          select: {
            id: true,
            affiliateCode: true,
            displayName: true,
            branchLabel: true,
          },
        },
        agent: {
          select: {
            id: true,
            affiliateCode: true,
            displayName: true,
          },
        },
        link: {
          select: {
            id: true,
            code: true,
            title: true,
            productCode: true,
          },
        },
      },
    });

    // 상호작용 기록 생성 (변경 사항이 있는 경우)
    if (Object.keys(updateData).length > 0) {
      await prisma.affiliateInteraction.create({
        data: {
          leadId: leadId,
          profileId: user.AffiliateProfile?.id || null,
          createdById: user.id,
          interactionType: 'UPDATED',
          note: `고객 정보가 수정되었습니다: ${Object.keys(updateData).join(', ')}`,
          metadata: {
            changes: updateData,
            updatedAt: new Date().toISOString(),
          },
        },
      });
    }

    return NextResponse.json({
      ok: true,
      lead: updatedLead,
      message: '고객 정보가 수정되었습니다.',
    });
  } catch (error) {
    console.error('PUT /api/admin/affiliate/leads/[leadId] error:', error);
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 });
  }
}

/**
 * DELETE: Lead 삭제
 * - 관리자만 가능
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ ok: false, message: 'Admin access required' }, { status: 403 });
    }

    const leadId = Number(params.leadId);
    if (isNaN(leadId)) {
      return NextResponse.json({ ok: false, message: 'Invalid lead ID' }, { status: 400 });
    }

    // Lead 삭제
    await prisma.affiliateLead.delete({
      where: { id: leadId },
    });

    return NextResponse.json({
      ok: true,
      message: '고객 정보가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('DELETE /api/admin/affiliate/leads/[leadId] error:', error);
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 });
  }
}
