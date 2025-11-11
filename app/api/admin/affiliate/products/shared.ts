import { Prisma } from '@prisma/client';

export function toSafeInt(value: any) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  return Math.round(num);
}

export const PRICING_COLUMNS = [
  { key: 'adult', label: '1,2번째 성인', fareCategory: 'PRIMARY_ADULT' },
  { key: 'adult3rd', label: '만 12세 이상 (3번째)', fareCategory: 'ADDITIONAL_ADULT' },
  { key: 'child2to11', label: '만 2-11세', fareCategory: 'CHILD_2_TO_11' },
  { key: 'infantUnder2', label: '만 2세 미만', fareCategory: 'INFANT_UNDER_2' },
] as const;

export type PricingColumnKey = typeof PRICING_COLUMNS[number]['key'];

export interface PricingMatrixOption {
  key: string;
  label: string;
  fareCategory?: string | null;
  saleAmount?: number | null;
}

export interface PricingMatrixRow {
  pricingRowId?: string | null;
  roomType: string;
  options: PricingMatrixOption[];
}

export function parseLayoutPricing(layoutValue: any): PricingMatrixRow[] {
  let parsed: any = layoutValue;
  if (typeof layoutValue === 'string') {
    try {
      parsed = JSON.parse(layoutValue);
    } catch (error) {
      parsed = {};
    }
  }

  const pricingRows = Array.isArray(parsed?.pricing) ? parsed.pricing : [];

  return pricingRows.map((row: any) => {
    const pricingRowId = row?.id ? String(row.id) : undefined;
    const roomType = row?.roomType || row?.cabinType || '객실';

    const options = PRICING_COLUMNS.map((column) => ({
      key: column.key,
      label: column.label,
      fareCategory: column.fareCategory,
      saleAmount: toSafeInt(row?.[column.key]),
    }));

    return {
      pricingRowId,
      roomType,
      options,
    };
  });
}

export const productInclude = {
  cruiseProduct: {
    select: {
      id: true,
      productCode: true,
      packageName: true,
      cruiseLine: true,
      shipName: true,
      startDate: true,
      endDate: true,
      description: true,
    },
  },
  commissionTiers: {
    orderBy: { cabinType: 'asc' as const },
  },
  affiliateLinks: {
    select: {
      id: true,
      status: true,
    },
  },
  affiliateSales: {
    select: {
      id: true,
      saleAmount: true,
      status: true,
    },
  },
} satisfies Prisma.AffiliateProductInclude;

export type AffiliateProductPayload = Prisma.AffiliateProductGetPayload<{ include: typeof productInclude }>;

export function serializeProduct(
  product: AffiliateProductPayload,
  pricingMatrix: PricingMatrixRow[] = [],
) {
  const activeLinks = product.affiliateLinks.filter((link) => link.status === 'ACTIVE').length;
  const totalLinks = product.affiliateLinks.length;
  const confirmedSales = product.affiliateSales.filter((sale) => sale.status === 'CONFIRMED');
  const totalConfirmedAmount = confirmedSales.reduce((sum, sale) => sum + (sale.saleAmount ?? 0), 0);

  return {
    id: product.id,
    productCode: product.productCode,
    title: product.title,
    status: product.status,
    currency: product.currency,
    defaultSaleAmount: product.defaultSaleAmount,
    defaultCostAmount: product.defaultCostAmount,
    defaultNetRevenue: product.defaultNetRevenue,
    isPublished: product.isPublished,
    publishedAt: product.publishedAt,
    effectiveFrom: product.effectiveFrom,
    effectiveTo: product.effectiveTo,
    updatedAt: product.updatedAt,
    cruiseProduct: product.cruiseProduct,
    commissionTiers: product.commissionTiers,
    pricingMatrix,
    stats: {
      totalLinks,
      activeLinks,
      totalConfirmedSales: confirmedSales.length,
      totalConfirmedAmount,
    },
  };
}