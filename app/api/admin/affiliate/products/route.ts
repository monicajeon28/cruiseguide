import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import type { PricingMatrixRow } from './shared';
import { productInclude, serializeProduct, toSafeInt, parseLayoutPricing } from './shared';

function normalizeNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  return Math.round(num);
}

interface TierInput {
  cabinType: string;
  saleAmount?: number | null;
  costAmount?: number | null;
  hqShareAmount?: number | null;
  branchShareAmount?: number | null;
  salesShareAmount?: number | null;
  overrideAmount?: number | null;
  currency?: string | null;
  metadata?: Prisma.JsonValue;
  pricingRowId?: string | null;
  fareCategory?: string | null;
  fareLabel?: string | null;
}

interface CreateAffiliateProductBody {
  productCode: string;
  title: string;
  cruiseProductId?: number | null;
  status?: string;
  currency?: string;
  defaultSaleAmount?: number | null;
  defaultCostAmount?: number | null;
  defaultNetRevenue?: number | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isPublished?: boolean;
  tiers?: TierInput[];
  metadata?: Prisma.JsonValue;
}

function validateBody(body: CreateAffiliateProductBody) {
  if (!body.productCode?.trim()) {
    throw new Error('상품 코드를 입력해 주세요.');
  }
  if (!body.title?.trim()) {
    throw new Error('상품명을 입력해 주세요.');
  }
  if (!body.effectiveFrom) {
    throw new Error('적용 시작일을 입력해 주세요.');
  }
}

export async function GET() {
  try {
    const products = await prisma.affiliateProduct.findMany({
      include: productInclude,
      orderBy: { updatedAt: 'desc' },
    });

    const productCodes = products.map((product) => product.productCode);
    const contentLayouts = productCodes.length
      ? await prisma.mallProductContent.findMany({
          where: { productCode: { in: productCodes } },
          select: { productCode: true, layout: true },
        })
      : [];

    const pricingMatrixMap = new Map<string, PricingMatrixRow[]>();
    contentLayouts.forEach((entry) => {
      const layoutValue = entry.layout;
      pricingMatrixMap.set(entry.productCode, parseLayoutPricing(layoutValue));
    });

    return NextResponse.json({
      ok: true,
      products: products.map((product) => serializeProduct(product, pricingMatrixMap.get(product.productCode) ?? [])),
    });
  } catch (error) {
    console.error('[admin/affiliate/products][GET] error', error);
    return NextResponse.json({ ok: false, error: '상품 데이터를 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as CreateAffiliateProductBody;
    validateBody(data);

    const tiers = (data.tiers ?? []).map((tier) => ({
      cabinType: tier.cabinType,
      saleAmount: toSafeInt(tier.saleAmount),
      costAmount: toSafeInt(tier.costAmount),
      hqShareAmount: toSafeInt(tier.hqShareAmount),
      branchShareAmount: toSafeInt(tier.branchShareAmount),
      salesShareAmount: toSafeInt(tier.salesShareAmount),
      overrideAmount: toSafeInt(tier.overrideAmount),
      currency: tier.currency ?? data.currency ?? 'KRW',
      metadata: tier.metadata ?? undefined,
      pricingRowId: tier.pricingRowId ?? undefined,
      fareCategory: tier.fareCategory ?? undefined,
      fareLabel: tier.fareLabel ?? undefined,
    }));

    const isPublished = data.isPublished ?? true;

    const product = await prisma.affiliateProduct.create({
      data: {
        productCode: data.productCode.trim(),
        title: data.title.trim(),
        cruiseProductId: data.cruiseProductId ?? undefined,
        status: data.status ?? 'active',
        currency: data.currency ?? 'KRW',
        defaultSaleAmount: toSafeInt(data.defaultSaleAmount),
        defaultCostAmount: toSafeInt(data.defaultCostAmount),
        defaultNetRevenue: toSafeInt(data.defaultNetRevenue),
        effectiveFrom: new Date(data.effectiveFrom),
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : undefined,
        metadata: data.metadata ?? undefined,
        isPublished,
        publishedAt: isPublished ? new Date() : null,
        commissionTiers: tiers.length
          ? {
              create: tiers,
            }
          : undefined,
      },
      include: productInclude,
    });

    const pricingMatrix = await prisma.mallProductContent.findUnique({
      where: { productCode: product.productCode },
      select: { layout: true },
    });

    return NextResponse.json(
      { ok: true, product: serializeProduct(product, parseLayoutPricing(pricingMatrix?.layout)) },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('[admin/affiliate/products][POST] error', error);
    const message = error instanceof Error ? error.message : '상품을 저장하는 중 오류가 발생했습니다.';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
