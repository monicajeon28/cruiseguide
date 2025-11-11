import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10) || 1, 1);
  const requestedLimit = parseInt(searchParams.get('limit') ?? `${DEFAULT_PAGE_SIZE}`, 10) || DEFAULT_PAGE_SIZE;
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_PAGE_SIZE);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function normalizePhone(phone: string | null | undefined) {
  if (!phone) return phone;
  return phone.replace(/[^0-9]/g, '');
}

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, message: '로그인이 필요합니다.' }, { status: 401 });
    }

    if (sessionUser.role !== 'admin') {
      return NextResponse.json({ ok: false, message: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);

    // 필터 파라미터
    const customerName = searchParams.get('customerName')?.trim() || null;
    const customerPhone = searchParams.get('customerPhone')?.trim() || null;
    const status = searchParams.get('status') || null;
    const managerId = searchParams.get('managerId') ? parseInt(searchParams.get('managerId')!, 10) : null;
    const agentId = searchParams.get('agentId') ? parseInt(searchParams.get('agentId')!, 10) : null;

    // WHERE 조건 구성
    const where: Prisma.AffiliateLeadWhereInput = {};

    // 검색 조건 (이름 또는 전화번호)
    if (customerName || customerPhone) {
      const searchConditions: Prisma.AffiliateLeadWhereInput[] = [];
      
      if (customerName) {
        searchConditions.push({
          customerName: { contains: customerName, mode: 'insensitive' },
        });
      }
      
      if (customerPhone) {
        const normalizedPhone = normalizePhone(customerPhone);
        if (normalizedPhone) {
          searchConditions.push({
            customerPhone: { contains: normalizedPhone },
          });
        }
      }

      if (searchConditions.length > 0) {
        where.OR = searchConditions;
      }
    }

    // 상태 필터
    if (status) {
      where.status = status as any;
    }

    // 담당자 필터
    if (managerId) {
      where.managerId = managerId;
    }

    if (agentId) {
      where.agentId = agentId;
    }

    // 총 개수 조회
    const total = await prisma.affiliateLead.count({ where });

    // Leads 조회
    const leads = await prisma.affiliateLead.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
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
            branchLabel: true,
          },
        },
        _count: {
          select: {
            interactions: true,
            sales: true,
          },
        },
      },
    });

    // 응답 데이터 형식화
    const formattedLeads = leads.map((lead) => ({
      id: lead.id,
      customerName: lead.customerName,
      customerPhone: lead.customerPhone,
      status: lead.status,
      passportRequestedAt: lead.passportRequestedAt?.toISOString() || null,
      passportCompletedAt: lead.passportCompletedAt?.toISOString() || null,
      lastContactedAt: lead.lastContactedAt?.toISOString() || null,
      createdAt: lead.createdAt.toISOString(),
      manager: lead.manager
        ? {
            id: lead.manager.id,
            affiliateCode: lead.manager.affiliateCode,
            displayName: lead.manager.displayName,
          }
        : null,
      agent: lead.agent
        ? {
            id: lead.agent.id,
            affiliateCode: lead.agent.affiliateCode,
            displayName: lead.agent.displayName,
          }
        : null,
      _count: {
        interactions: lead._count.interactions,
        sales: lead._count.sales,
      },
    }));

    return NextResponse.json({
      ok: true,
      leads: formattedLeads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/admin/affiliate/leads error:', error);
    return NextResponse.json(
      { ok: false, message: '고객 목록을 불러오지 못했습니다.' },
      { status: 500 }
    );
  }
}

