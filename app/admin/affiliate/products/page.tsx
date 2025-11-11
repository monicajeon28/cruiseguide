'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  FiPlus,
  FiEdit2,
  FiRefreshCw,
  FiSave,
  FiX,
  FiTrash2,
} from 'react-icons/fi';
import { showError, showSuccess } from '@/components/ui/Toast';

const DEFAULT_ROOMS = ['발코니', '오션뷰', '인사이드'];
const STATUS_OPTIONS = [
  { value: 'active', label: '판매중' },
  { value: 'inactive', label: '판매중지' },
  { value: 'archived', label: '종료' },
];

const OCCUPANT_CONFIG = [
  { key: 'adult', label: '1,2번째 성인', fareCategory: 'PRIMARY_ADULT' },
  { key: 'adult3rd', label: '만 12세 이상 (3번째)', fareCategory: 'ADDITIONAL_ADULT' },
  { key: 'child2to11', label: '만 2-11세', fareCategory: 'CHILD_2_11' },
  { key: 'infantUnder2', label: '만 2세 미만', fareCategory: 'INFANT_UNDER_2' },
] as const;

type CommissionTier = {
  id?: number;
  cabinType: string;
  pricingRowId?: string | null;
  fareCategory?: string | null;
  fareLabel?: string | null;
  saleAmount?: number | null;
  costAmount?: number | null;
  hqShareAmount?: number | null;
  branchShareAmount?: number | null;
  salesShareAmount?: number | null;
  overrideAmount?: number | null;
  currency?: string | null;
};

type PricingMatrixOption = {
  key: string;
  label: string;
  fareCategory?: string | null;
  saleAmount?: number | null;
};

type PricingMatrixRow = {
  pricingRowId?: string | null;
  roomType: string;
  options: PricingMatrixOption[];
};

type AffiliateProduct = {
  id: number;
  productCode: string;
  title: string;
  status: string;
  currency: string;
  defaultSaleAmount?: number | null;
  defaultCostAmount?: number | null;
  defaultNetRevenue?: number | null;
  isPublished: boolean;
  publishedAt?: string | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  updatedAt: string;
  cruiseProduct?: {
    id: number;
    productCode: string;
    packageName: string | null;
    cruiseLine: string | null;
    shipName: string | null;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
  } | null;
  commissionTiers: CommissionTier[];
  pricingMatrix?: PricingMatrixRow[];
  stats: {
    totalLinks: number;
    activeLinks: number;
    totalConfirmedSales: number;
    totalConfirmedAmount: number;
  };
};

type TierForm = {
  id?: number;
  roomType: string;
  pricingRowId?: string;
  fareCategory?: string;
  fareLabel: string;
  saleAmount: string;
  baseSaleAmount?: number | null;
  costAmount: string;
  hqShareAmount: string;
  branchShareAmount: string;
  salesShareAmount: string;
  overrideAmount: string;
  currency: string;
};

type ProductFormState = {
  id?: number;
  productCode: string;
  title: string;
  status: string;
  currency: string;
  cruiseProductId: string;
  defaultSaleAmount: string;
  defaultCostAmount: string;
  defaultNetRevenue: string;
  effectiveFrom: string;
  effectiveTo: string;
  isPublished: boolean;
  tiers: TierForm[];
};

type ProductSource = {
  productCode: string;
  cruiseProductId: number;
  packageName: string | null;
  cruiseLine: string | null;
  saleStatus: string;
  pricingMatrix: PricingMatrixRow[];
};

function toDateInputValue(value?: string | Date | null) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function numberToString(value?: number | null) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function parseNumber(value: string) {
  if (!value || !value.trim()) return null;
  const num = Number(value.replace(/,/g, ''));
  if (Number.isNaN(num)) return null;
  return Math.round(num);
}

function formatCurrency(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) return '-';
  const amount = Math.max(Math.round(value), 0);
  return `${amount.toLocaleString()}원`;
}

function calculateScenario(tier: TierForm) {
  const sale = Math.max(parseNumber(tier.saleAmount) ?? 0, 0);
  const cost = Math.max(parseNumber(tier.costAmount) ?? 0, 0);
  const net = Math.max(sale - cost, 0);
  const branchDirect = Math.max(parseNumber(tier.branchShareAmount) ?? 0, 0);
  const salesCommission = Math.max(parseNumber(tier.salesShareAmount) ?? 0, 0);
  const override = Math.max(branchDirect - salesCommission, 0);
  const branchTeam = override;
  const hqDirect = Math.max(net - branchDirect, 0);
  const hqTeam = Math.max(net - branchTeam - salesCommission, 0);
  const hqCompany = Math.max(net - salesCommission, 0);

  return {
    sale,
    cost,
    net,
    branchDirect,
    branchTeam,
    salesCommission,
    override,
    hqDirect,
    hqTeam,
    hqCompany,
  };
}

function createDefaultTiers(currency = 'KRW'): TierForm[] {
  return DEFAULT_ROOMS.flatMap((roomType) =>
    OCCUPANT_CONFIG.map((config) => ({
      roomType,
      pricingRowId: undefined,
      fareCategory: config.fareCategory,
      fareLabel: config.label,
      saleAmount: '',
      baseSaleAmount: null,
      costAmount: '',
      hqShareAmount: '',
      branchShareAmount: '',
      salesShareAmount: '',
      overrideAmount: '',
      currency,
    })),
  );
}

const EMPTY_FORM: ProductFormState = {
  productCode: '',
  title: '',
  status: 'active',
  currency: 'KRW',
  cruiseProductId: '',
  defaultSaleAmount: '',
  defaultCostAmount: '',
  defaultNetRevenue: '',
  effectiveFrom: toDateInputValue(new Date()),
  effectiveTo: '',
  isPublished: true,
  tiers: createDefaultTiers(),
};

function createFormState(product?: AffiliateProduct): ProductFormState {
  if (!product) return { ...EMPTY_FORM, tiers: createDefaultTiers() };

  const pricingRows = product.pricingMatrix ?? [];
  const tiers: TierForm[] = [];
  const matchedTierIds = new Set<number>();

  pricingRows.forEach((row) => {
    const roomType = row.roomType || '객실';
    const options = row.options?.length ? row.options : OCCUPANT_CONFIG.map((config) => ({
      key: config.key,
      label: config.label,
      fareCategory: config.fareCategory,
      saleAmount: null,
    }));

    options.forEach((option) => {
      const existing = product.commissionTiers.find((tier) => {
        if ((tier.cabinType || '').trim() !== roomType.trim()) return false;
        if (tier.pricingRowId && row.pricingRowId && tier.pricingRowId !== row.pricingRowId) return false;
        if (tier.fareCategory && option.fareCategory) {
          return tier.fareCategory === option.fareCategory;
        }
        if (tier.fareLabel && option.label) {
          return tier.fareLabel === option.label;
        }
        return false;
      });

      if (existing?.id) {
        matchedTierIds.add(existing.id);
      }

      const branchValue = existing?.branchShareAmount ?? null;
      const salesValue = existing?.salesShareAmount ?? null;
      const overrideValue = branchValue != null && salesValue != null ? Math.max(branchValue - salesValue, 0) : null;

      tiers.push({
        id: existing?.id,
        roomType,
        pricingRowId: row.pricingRowId ?? existing?.pricingRowId ?? undefined,
        fareCategory: existing?.fareCategory ?? option.fareCategory ?? option.key,
        fareLabel: existing?.fareLabel ?? option.label ?? option.key,
        saleAmount: numberToString(existing?.saleAmount ?? option.saleAmount ?? null),
        baseSaleAmount: option.saleAmount ?? null,
        costAmount: numberToString(existing?.costAmount ?? null),
        hqShareAmount: numberToString(existing?.hqShareAmount ?? null),
        branchShareAmount: numberToString(branchValue),
        salesShareAmount: numberToString(salesValue),
        overrideAmount: numberToString(overrideValue),
        currency: existing?.currency ?? product.currency ?? 'KRW',
      });
    });
  });

  product.commissionTiers.forEach((tier) => {
    if (tier.id && matchedTierIds.has(tier.id)) return;
    const branchValue = tier.branchShareAmount ?? null;
    const salesValue = tier.salesShareAmount ?? null;
    const overrideValue = branchValue != null && salesValue != null ? Math.max(branchValue - salesValue, 0) : null;
    tiers.push({
      id: tier.id,
      roomType: tier.cabinType,
      pricingRowId: tier.pricingRowId ?? undefined,
      fareCategory: tier.fareCategory ?? undefined,
      fareLabel: tier.fareLabel ?? '커스텀 항목',
      saleAmount: numberToString(tier.saleAmount ?? null),
      baseSaleAmount: null,
      costAmount: numberToString(tier.costAmount ?? null),
      hqShareAmount: numberToString(tier.hqShareAmount ?? null),
      branchShareAmount: numberToString(branchValue),
      salesShareAmount: numberToString(salesValue),
      overrideAmount: numberToString(overrideValue),
      currency: tier.currency ?? product.currency ?? 'KRW',
    });
  });

  if (tiers.length === 0) {
    tiers.push(...createDefaultTiers(product.currency ?? 'KRW'));
  }

  return {
    id: product.id,
    productCode: product.productCode,
    title: product.title,
    status: product.status,
    currency: product.currency,
    cruiseProductId: product.cruiseProduct?.id ? String(product.cruiseProduct.id) : '',
    defaultSaleAmount: numberToString(product.defaultSaleAmount ?? null),
    defaultCostAmount: numberToString(product.defaultCostAmount ?? null),
    defaultNetRevenue: (() => {
      if (product.defaultNetRevenue != null) return numberToString(product.defaultNetRevenue);
      const sale = product.defaultSaleAmount ?? null;
      const cost = product.defaultCostAmount ?? null;
      if (sale == null || cost == null) return '';
      return numberToString(Math.max(sale - cost, 0));
    })(),
    effectiveFrom: toDateInputValue(product.effectiveFrom),
    effectiveTo: toDateInputValue(product.effectiveTo ?? null),
    isPublished: product.isPublished,
    tiers,
  };
}

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-blue-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="닫기"
        >
          <FiX size={22} />
        </button>
        <div className="p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}

export default function AffiliateProductsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<ProductFormState>({ ...EMPTY_FORM, tiers: createDefaultTiers() });
  const [activeProduct, setActiveProduct] = useState<AffiliateProduct | null>(null);
  const [productSources, setProductSources] = useState<ProductSource[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [sourcesLoaded, setSourcesLoaded] = useState(false);
  const [selectedSourceCode, setSelectedSourceCode] = useState('');
  const [sourceError, setSourceError] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return products;
    return products.filter((product) =>
      [
        product.productCode,
        product.title,
        product.cruiseProduct?.packageName ?? '',
        product.cruiseProduct?.cruiseLine ?? '',
      ]
        .filter(Boolean)
        .some((text) => text.toLowerCase().includes(keyword)),
    );
  }, [products, searchKeyword]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/affiliate/products');
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || '상품 정보를 불러오지 못했습니다.');
      setProducts(json.products ?? []);
    } catch (error: any) {
      console.error(error);
      showError(error.message || '상품 정보를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreateModal = () => {
    loadProductSources();
    setSelectedSourceCode('');
    setSourceError(null);
    setActiveProduct(null);
    setFormState({ ...EMPTY_FORM, tiers: createDefaultTiers() });
    setIsModalOpen(true);
  };

  const openEditModal = (product: AffiliateProduct) => {
    setSelectedSourceCode('');
    setSourceError(null);
    setActiveProduct(product);
    setFormState(createFormState(product));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveProduct(null);
    setSelectedSourceCode('');
    setSourceError(null);
  };

  const updateTierField = (index: number, field: keyof TierForm, value: string) => {
    setFormState((prev) => {
      const tiers = [...prev.tiers];
      const updatedTier = { ...tiers[index], [field]: value };
      if (field === 'branchShareAmount' || field === 'salesShareAmount') {
        const branchValue = parseNumber(updatedTier.branchShareAmount);
        const salesValue = parseNumber(updatedTier.salesShareAmount);
        if (branchValue !== null && salesValue !== null) {
          updatedTier.overrideAmount = String(Math.max(branchValue - salesValue, 0));
        } else {
          updatedTier.overrideAmount = '';
        }
      }
      tiers[index] = updatedTier;
      return { ...prev, tiers };
    });
  };

  const addCustomOption = (roomType: string) => {
    const roomGroup = groupedRooms.find((group) => group.roomType === roomType);
    if (roomGroup && !roomGroup.canAddMore) {
      showError('이 객실은 최대 6개의 요금 항목만 설정할 수 있습니다. 필요 없는 항목을 삭제한 후 다시 추가해 주세요.');
      return;
    }

    setFormState((prev) => ({
      ...prev,
      tiers: [
        ...prev.tiers,
        {
          roomType,
          pricingRowId: undefined,
          fareCategory: `CUSTOM_${Date.now()}`,
          fareLabel: '커스텀 항목',
          saleAmount: '',
          baseSaleAmount: null,
          costAmount: '',
          hqShareAmount: '',
          branchShareAmount: '',
          salesShareAmount: '',
          overrideAmount: '',
          currency: prev.currency || 'KRW',
        },
      ],
    }));
  };

  const addRoom = () => {
    const roomType = window.prompt('추가할 객실 타입 이름을 입력하세요.');
    if (!roomType) return;
    setFormState((prev) => ({
      ...prev,
      tiers: [
        ...prev.tiers,
        ...OCCUPANT_CONFIG.map((config) => ({
          roomType,
          pricingRowId: undefined,
          fareCategory: config.fareCategory,
          fareLabel: config.label,
          saleAmount: '',
          baseSaleAmount: null,
          costAmount: '',
          hqShareAmount: '',
          branchShareAmount: '',
          salesShareAmount: '',
          overrideAmount: '',
          currency: prev.currency || 'KRW',
        })),
      ],
    }));
  };

  const removeTier = (index: number) => {
    const target = formState.tiers[index];
    if (target.pricingRowId) {
      showError('요금표에서 자동 연동된 항목은 삭제할 수 없습니다.');
      return;
    }
    setFormState((prev) => ({
      ...prev,
      tiers: prev.tiers.filter((_, i) => i !== index),
    }));
  };

  const matchesTier = (
    tier: TierForm,
    option: PricingMatrixOption,
    roomType: string,
    pricingRowId?: string | null,
  ) => {
    if ((tier.roomType || '').trim() !== roomType.trim()) return false;
    if (pricingRowId && tier.pricingRowId && pricingRowId !== tier.pricingRowId) return false;
    if (tier.fareCategory && option.fareCategory) {
      return tier.fareCategory === option.fareCategory;
    }
    if (tier.fareLabel && option.label) {
      return tier.fareLabel === option.label;
    }
    return false;
  };

  type RoomColumn = {
    option?: PricingMatrixOption;
    entry: { tier: TierForm; index: number };
    isCustom: boolean;
  };

  type RoomGroup = {
    roomType: string;
    columns: RoomColumn[];
    canAddMore: boolean;
    overflowCount: number;
  };

  const MAX_COLUMNS = 6;

  const groupedRooms = useMemo<RoomGroup[]>(() => {
    const tiersWithIndex = formState.tiers.map((tier, index) => ({ tier, index }));
    const pricingRows = activeProduct?.pricingMatrix ?? [];
    const groupMap = new Map<string, { entries: Array<{ tier: TierForm; index: number }> }>();

    tiersWithIndex.forEach((entry) => {
      const key = entry.tier.roomType || '기타 객실';
      if (!groupMap.has(key)) groupMap.set(key, { entries: [] });
      groupMap.get(key)!.entries.push(entry);
    });

    const orderedRoomTypes = [
      ...pricingRows.map((row) => row.roomType || '객실'),
      ...Array.from(groupMap.keys()).filter((key) => !pricingRows.some((row) => row.roomType === key)),
    ];

    const groups: RoomGroup[] = [];

    orderedRoomTypes.forEach((roomType) => {
      const pricingRow = pricingRows.find((row) => row.roomType === roomType);
      const entries = groupMap.get(roomType)?.entries ?? [];

      const baseOptionsRaw = pricingRow?.options?.length
        ? pricingRow.options
        : OCCUPANT_CONFIG.map((config) => ({
            key: config.key,
            label: config.label,
            fareCategory: config.fareCategory,
            saleAmount: null,
          }));

      const matchedIndices = new Set<number>();
      const columns: RoomColumn[] = [];
      let overflowCount = 0;

      baseOptionsRaw.forEach((option) => {
        const entry = entries.find((candidate) => matchesTier(candidate.tier, option, roomType, pricingRow?.pricingRowId));
        if (!entry) return;

        if (columns.length < MAX_COLUMNS) {
          columns.push({ option, entry, isCustom: false });
        } else {
          overflowCount += 1;
        }
        matchedIndices.add(entry.index);
      });

      const customEntries = entries.filter((entry) => !matchedIndices.has(entry.index));
      customEntries.forEach((entry) => {
        if (columns.length < MAX_COLUMNS) {
          columns.push({ option: undefined, entry, isCustom: true });
        } else {
          overflowCount += 1;
        }
      });

      if (columns.length === 0 && entries.length === 0) {
        return;
      }

      groups.push({
        roomType,
        columns,
        canAddMore: columns.length < MAX_COLUMNS,
        overflowCount,
      });
    });

    return groups;
  }, [formState.tiers, activeProduct]);

  const handleSave = async () => {
    if (!formState.productCode.trim()) {
      showError('상품 코드를 입력해 주세요.');
      return;
    }
    if (!formState.title.trim()) {
      showError('상품명을 입력해 주세요.');
      return;
    }
    if (!formState.effectiveFrom) {
      showError('적용 시작일을 선택해 주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        productCode: formState.productCode,
        title: formState.title,
        status: formState.status,
        currency: formState.currency,
        cruiseProductId: formState.cruiseProductId ? Number(formState.cruiseProductId) : null,
        defaultSaleAmount: parseNumber(formState.defaultSaleAmount),
        defaultCostAmount: parseNumber(formState.defaultCostAmount),
        defaultNetRevenue: parseNumber(formState.defaultNetRevenue),
        effectiveFrom: formState.effectiveFrom,
        effectiveTo: formState.effectiveTo || null,
        isPublished: formState.isPublished,
        tiers: formState.tiers.map((tier) => {
          const branchValue = parseNumber(tier.branchShareAmount);
          const salesValue = parseNumber(tier.salesShareAmount);
          const overrideValue =
            branchValue !== null && salesValue !== null
              ? Math.max(branchValue - salesValue, 0)
              : parseNumber(tier.overrideAmount);

          return {
            id: tier.id,
            cabinType: tier.roomType,
            pricingRowId: tier.pricingRowId ?? null,
            fareCategory: tier.fareCategory ?? null,
            fareLabel: tier.fareLabel,
            saleAmount: parseNumber(tier.saleAmount),
            costAmount: parseNumber(tier.costAmount),
            hqShareAmount: parseNumber(tier.hqShareAmount),
            branchShareAmount: branchValue,
            salesShareAmount: salesValue,
            overrideAmount: overrideValue,
            currency: tier.currency || formState.currency || 'KRW',
          };
        }),
      };

      let res: Response;
      if (formState.id) {
        res = await fetch(`/api/admin/affiliate/products/${formState.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/affiliate/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (!json.ok) throw new Error(json.error || '저장에 실패했습니다.');
      showSuccess('상품 수당 정보가 저장되었습니다.');
      setIsModalOpen(false);
      setActiveProduct(null);
      await fetchProducts();
    } catch (error: any) {
      console.error(error);
      showError(error.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const loadProductSources = async (force = false) => {
    if (isLoadingSources) return;
    if (sourcesLoaded && !force) return;
    setIsLoadingSources(true);
    setSourceError(null);
    try {
      const res = await fetch('/api/admin/affiliate/products/sources');
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || '상품 정보를 불러오지 못했습니다.');
      setProductSources(Array.isArray(json.products) ? json.products : []);
      setSourcesLoaded(true);
    } catch (error: any) {
      console.error(error);
      setSourceError(error.message || '상품 정보를 불러오지 못했습니다.');
    } finally {
      setIsLoadingSources(false);
    }
  };

  const applyProductSource = (source: ProductSource) => {
    const pseudoProduct: AffiliateProduct = {
      id: source.cruiseProductId,
      productCode: source.productCode,
      title: source.packageName ?? source.productCode,
      status: source.saleStatus ?? 'active',
      currency: 'KRW',
      defaultSaleAmount: source.pricingMatrix?.[0]?.options?.[0]?.saleAmount ?? null,
      defaultCostAmount: null,
      defaultNetRevenue: null,
      isPublished: true,
      publishedAt: new Date().toISOString(),
      effectiveFrom: new Date().toISOString(),
      effectiveTo: null,
      updatedAt: new Date().toISOString(),
      cruiseProduct: {
        id: source.cruiseProductId,
        productCode: source.productCode,
        packageName: source.packageName ?? null,
        cruiseLine: source.cruiseLine ?? null,
        shipName: null,
        startDate: null,
        endDate: null,
        description: null,
      },
      commissionTiers: [],
      pricingMatrix: source.pricingMatrix,
      stats: {
        totalLinks: 0,
        activeLinks: 0,
        totalConfirmedSales: 0,
        totalConfirmedAmount: 0,
      },
    };

    setActiveProduct(pseudoProduct);
    const initial = createFormState(pseudoProduct);
    setFormState({
      ...initial,
      id: undefined,
      productCode: source.productCode,
      title: source.packageName ?? source.productCode,
      cruiseProductId: String(source.cruiseProductId),
      status: 'active',
      currency: initial.currency || 'KRW',
      defaultNetRevenue: (() => {
        const sale = parseNumber(initial.defaultSaleAmount);
        const cost = parseNumber(initial.defaultCostAmount);
        if (sale != null && cost != null) return String(Math.max(sale - cost, 0));
        return '';
      })(),
      isPublished: true,
    });
  };

  const handleSelectSource = (code: string) => {
    setSelectedSourceCode(code);
    if (!code) {
      setActiveProduct(null);
      setFormState({ ...EMPTY_FORM, tiers: createDefaultTiers(), effectiveFrom: toDateInputValue(new Date()) });
      return;
    }
    const source = productSources.find((item) => item.productCode === code);
    if (source) {
      applyProductSource(source);
    }
  };

  const handleDefaultFieldChange = (
    field: 'defaultSaleAmount' | 'defaultCostAmount' | 'defaultNetRevenue',
    value: string,
  ) => {
    setFormState((prev) => {
      const next: ProductFormState = { ...prev, [field]: value };
      if (field === 'defaultSaleAmount' || field === 'defaultCostAmount') {
        const sale = parseNumber(field === 'defaultSaleAmount' ? value : next.defaultSaleAmount);
        const cost = parseNumber(field === 'defaultCostAmount' ? value : next.defaultCostAmount);
        if (sale != null && cost != null) {
          next.defaultNetRevenue = String(Math.max(sale - cost, 0));
        } else {
          next.defaultNetRevenue = '';
        }
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">어필리에이트 상품 수당 관리</h1>
          <p className="mt-1 text-gray-600">
            더블유 요금표 구조를 기반으로 객실·연령별 판매가와 본사·대리점장·판매원 수당을 설정합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchProducts}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
          >
            <FiRefreshCw /> 새로고침
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-blue-700 hover:shadow-xl"
          >
            <FiPlus /> 새 상품 등록
          </button>
        </div>
      </header>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <input
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="상품명, 코드, 선사명으로 검색"
              className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 md:w-72"
            />
          </div>
          <div className="text-sm text-gray-500">
            총 {products.length.toLocaleString()}개 / 필터 {filteredProducts.length.toLocaleString()}개
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">상품명</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">상품 코드</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">기본 판매가</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">기본 입금가</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">본사 순이익</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">노출 상태</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">활성 링크</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">최근 수정</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">수정</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    데이터를 불러오는 중입니다...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    등록된 어필리에이트 상품이 없습니다. "새 상품 등록"을 눌러 추가해 주세요.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-blue-50/30">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{product.title}</div>
                      <div className="text-xs text-gray-500">
                        {product.cruiseProduct?.cruiseLine || '직접 등록'} ·{' '}
                        {product.cruiseProduct?.packageName || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.productCode}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-blue-700">
                      {formatCurrency(product.defaultSaleAmount)}
                    </td>
                    <td className="px-4 py-3 text-sm">{formatCurrency(product.defaultCostAmount)}</td>
                    <td className="px-4 py-3 text-sm">{formatCurrency(product.defaultNetRevenue)}</td>
                    <td className="px-4 py-3 text-sm">
                      {product.isPublished ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                          노출 중
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                          게시 중지
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {product.stats.activeLinks}/{product.stats.totalLinks}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(product.updatedAt).toLocaleString('ko-KR', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEditModal(product)}
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                      >
                        <FiEdit2 /> 수정
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={isModalOpen} onClose={closeModal}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">
                {formState.id ? '상품 수당 수정' : '새 어필리에이트 상품 등록'}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                객실 타입과 연령대별 요금표를 불러와 수당을 입력하면 즉시 본사·대리점장·판매원 배분을 확인할 수 있습니다.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              <FiSave /> {isSaving ? '저장 중...' : '저장하기'}
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-3">
              <h3 className="text-lg font-bold text-gray-800">기본 정보</h3>
              {!formState.id && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-blue-900">상품 불러오기</span>
                      <button
                        onClick={() => loadProductSources(true)}
                        disabled={isLoadingSources}
                        className="rounded-lg border border-blue-300 bg-white px-3 py-1 text-xs font-semibold text-blue-600 shadow-sm transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        다시 불러오기
                      </button>
                    </div>
                    <select
                      value={selectedSourceCode}
                      onChange={(e) => handleSelectSource(e.target.value)}
                      onFocus={() => loadProductSources()}
                      className="rounded-lg border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="">직접 입력</option>
                      {productSources.map((source) => (
                        <option key={source.productCode} value={source.productCode}>
                          {source.productCode} · {source.packageName ?? '제목 없음'}
                        </option>
                      ))}
                    </select>
                    {isLoadingSources && <span className="text-xs text-blue-600">상품 목록을 불러오는 중입니다...</span>}
                    {sourceError && <span className="text-xs text-red-500">{sourceError}</span>}
                  </div>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-semibold text-gray-700">상품 코드</span>
                  <input
                    value={formState.productCode}
                    onChange={(e) => setFormState((prev) => ({ ...prev, productCode: e.target.value }))}
                    placeholder="예) 2025-PIANO-HK-01"
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    disabled={Boolean(formState.id)}
                  />
                  {formState.id && (
                    <span className="text-xs text-gray-400">이미 등록된 상품 코드는 수정할 수 없습니다.</span>
                  )}
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-semibold text-gray-700">상품명</span>
                  <input
                    value={formState.title}
                    onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="예) [20만원 할인] 10월 24일 홍콩-제주 주말 크루즈"
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
                <div className="flex flex-col gap-1 text-sm">
                  <span className="font-semibold text-gray-700">판매몰 노출</span>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={formState.isPublished}
                      onChange={(e) => setFormState((prev) => ({ ...prev, isPublished: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{formState.isPublished ? '노출 중 (판매몰에 표시)' : '게시 중지 (판매몰에서 숨김)'}</span>
                  </label>
                  <span className="text-xs text-gray-500">
                    게시 중지를 선택하면 모든 판매몰에서 즉시 숨겨집니다. 다시 노출하면 자동으로 판매몰에 반영됩니다.
                  </span>
                </div>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-semibold text-gray-700">통화</span>
                  <select
                    value={formState.currency}
                    onChange={(e) => setFormState((prev) => ({ ...prev, currency: e.target.value }))}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="KRW">KRW (원화)</option>
                    <option value="USD">USD (달러)</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-semibold text-gray-700">적용 시작일</span>
                  <input
                    type="date"
                    value={formState.effectiveFrom}
                    onChange={(e) => setFormState((prev) => ({ ...prev, effectiveFrom: e.target.value }))}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-semibold text-gray-700">적용 종료일 (옵션)</span>
                  <input
                    type="date"
                    value={formState.effectiveTo}
                    onChange={(e) => setFormState((prev) => ({ ...prev, effectiveTo: e.target.value }))}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-semibold text-gray-700">기본 판매가</span>
                  <input
                    value={formState.defaultSaleAmount}
                    onChange={(e) => handleDefaultFieldChange('defaultSaleAmount', e.target.value)}
                    placeholder="예) 1,200,000"
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-semibold text-gray-700">기본 입금가</span>
                  <input
                    value={formState.defaultCostAmount}
                    onChange={(e) => handleDefaultFieldChange('defaultCostAmount', e.target.value)}
                    placeholder="예) 900,000"
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-semibold text-gray-700">본사 순이익 (자동 계산)</span>
                  <div className="flex items-center gap-2">
                    <input
                      value={formState.defaultNetRevenue}
                      onChange={(e) => handleDefaultFieldChange('defaultNetRevenue', e.target.value)}
                      placeholder="자동 계산 참고용"
                      className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    {(() => {
                      const sale = parseNumber(formState.defaultSaleAmount);
                      const cost = parseNumber(formState.defaultCostAmount);
                      if (sale != null && cost != null) {
                        return (
                          <span className="text-xs font-semibold text-blue-600">
                            자동 {formatCurrency(Math.max(sale - cost, 0))}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <span className="text-xs text-gray-500">
                    판매가와 입금가를 입력하면 본사 순이익이 자동 계산되어 참고용으로 표시됩니다. 필요 시 수동으로 조정할 수 있어요.
                  </span>
                </label>
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-inner lg:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-blue-900">객실 타입 관리</h3>
                <button
                  onClick={addRoom}
                  className="rounded-full border border-blue-300 bg-white px-3 py-1 text-xs font-semibold text-blue-600 shadow-sm hover:bg-blue-100"
                >
                  객실 추가
                </button>
              </div>
              <p className="text-xs text-blue-700">
                요금표에 등록된 객실이 자동으로 불러와집니다. 필요 시 객실이나 커스텀 항목을 추가하여 수당을 입력하세요.
              </p>
            </section>
          </div>

          <div className="space-y-8">
            {groupedRooms.map((room) => (
              <section key={room.roomType} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{room.roomType}</h3>
                    <p className="text-xs text-gray-500">
                      요금표 금액을 자동으로 불러와 수당 계산에 반영합니다. 금액을 수정하면 즉시 정산 예상 결과가 갱신됩니다.
                    </p>
                  </div>
                  <button
                    onClick={() => addCustomOption(room.roomType)}
                    disabled={!room.canAddMore}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      room.canAddMore
                        ? 'border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100'
                        : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                    }`}
                  >
                    커스텀 항목 추가
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="w-40 px-4 py-3 text-left text-xs font-semibold text-gray-600">구분</th>
                        {room.columns.map((column, idx) => (
                          <th key={`${room.roomType}-col-${idx}`} className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                            {column.isCustom ? (
                              <div className="flex items-center justify-center gap-2">
                                <input
                                  value={column.entry.tier.fareLabel}
                                  onChange={(e) => updateTierField(column.entry.index, 'fareLabel', e.target.value)}
                                  className="w-28 rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                                <button
                                  onClick={() => removeTier(column.entry.index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <FiTrash2 size={14} />
                                </button>
                              </div>
                            ) : (
                              column.option?.label ?? column.entry.tier.fareLabel
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="px-4 py-3 text-xs font-semibold text-gray-700">기준 판매가</td>
                        {room.columns.map((column, idx) => (
                          <td key={`base-${room.roomType}-${idx}`} className="px-4 py-3 text-center text-sm text-gray-700">
                            {formatCurrency(column.option?.saleAmount ?? column.entry.tier.baseSaleAmount ?? parseNumber(column.entry.tier.saleAmount))}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t">
                        <td className="px-4 py-3 text-xs font-semibold text-gray-700">판매가 (사용)</td>
                        {room.columns.map((column, idx) => (
                          <td key={`sale-${room.roomType}-${idx}`} className="px-4 py-3 text-center">
                            <input
                              value={column.entry.tier.saleAmount}
                              onChange={(e) => updateTierField(column.entry.index, 'saleAmount', e.target.value)}
                              placeholder="0"
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t">
                        <td className="px-4 py-3 text-xs font-semibold text-gray-700">입금가</td>
                        {room.columns.map((column, idx) => (
                          <td key={`cost-${room.roomType}-${idx}`} className="px-4 py-3 text-center">
                            <input
                              value={column.entry.tier.costAmount}
                              onChange={(e) => updateTierField(column.entry.index, 'costAmount', e.target.value)}
                              placeholder="0"
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t">
                        <td className="px-4 py-3 text-xs font-semibold text-gray-700">본사 수당 (고정 입력 시 우선)</td>
                        {room.columns.map((column, idx) => (
                          <td key={`hq-${room.roomType}-${idx}`} className="px-4 py-3 text-center">
                            <input
                              value={column.entry.tier.hqShareAmount}
                              onChange={(e) => updateTierField(column.entry.index, 'hqShareAmount', e.target.value)}
                              placeholder="자동 계산"
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t">
                        <td className="px-4 py-3 text-xs font-semibold text-gray-700">대리점장 수당</td>
                        {room.columns.map((column, idx) => (
                          <td key={`branch-${room.roomType}-${idx}`} className="px-4 py-3 text-center">
                            <input
                              value={column.entry.tier.branchShareAmount}
                              onChange={(e) => updateTierField(column.entry.index, 'branchShareAmount', e.target.value)}
                              placeholder="0"
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t">
                        <td className="px-4 py-3 text-xs font-semibold text-gray-700">판매원 수당</td>
                        {room.columns.map((column, idx) => (
                          <td key={`sales-${room.roomType}-${idx}`} className="px-4 py-3 text-center">
                            <input
                              value={column.entry.tier.salesShareAmount}
                              onChange={(e) => updateTierField(column.entry.index, 'salesShareAmount', e.target.value)}
                              placeholder="0"
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t">
                        <td className="px-4 py-3 text-xs font-semibold text-gray-700">오버라이딩 (대리점 팀 판매)</td>
                        {room.columns.map((column, idx) => {
                          const scenario = calculateScenario(column.entry.tier);
                          return (
                            <td key={`override-${room.roomType}-${idx}`} className="px-4 py-3 text-center text-sm font-semibold text-blue-700">
                              {formatCurrency(scenario.override)}
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="border-t bg-blue-50/40">
                        <td className="px-4 py-3 text-xs font-semibold text-blue-800">시나리오 미리보기</td>
                        {room.columns.map((column, idx) => {
                          const scenario = calculateScenario(column.entry.tier);
                          return (
                            <td key={`summary-${room.roomType}-${idx}`} className="px-4 py-3 text-left text-xs text-blue-900">
                              <div className="mb-2 font-semibold text-blue-900">
                                총 순이익 {formatCurrency(scenario.net)}
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <div className="font-semibold text-blue-800">대리점 팀 판매</div>
                                  <div>
                                    본사 {formatCurrency(scenario.hqTeam)} · 대리점장 {formatCurrency(scenario.branchTeam)} · 판매원 {formatCurrency(scenario.salesCommission)}
                                  </div>
                                </div>
                                <div>
                                  <div className="font-semibold text-blue-800">대리점장 직접 판매</div>
                                  <div>
                                    본사 {formatCurrency(scenario.hqDirect)} · 대리점장 {formatCurrency(scenario.branchDirect)}
                                  </div>
                                </div>
                                <div>
                                  <div className="font-semibold text-blue-800">본사 판매</div>
                                  <div>
                                    본사 {formatCurrency(scenario.hqCompany)} · 판매원 {formatCurrency(scenario.salesCommission)}
                                  </div>
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
                {!room.canAddMore && (
                  <p className="mt-2 text-xs text-red-500">
                    최대 6개의 요금 항목만 입력할 수 있습니다. 필요 없는 항목을 삭제한 뒤 새 항목을 추가해 주세요.
                  </p>
                )}
                {room.overflowCount > 0 && (
                  <p className="mt-1 text-xs text-blue-600">
                    요금표에 추가로 {room.overflowCount}개의 항목이 있지만, 분석 편의를 위해 상위 6개만 표시 중입니다.
                  </p>
                )}
              </section>
            ))}

            {groupedRooms.length === 0 && (
              <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-6 text-center text-sm text-blue-700">
                요금표에 등록된 객실이 없습니다. "객실 추가" 버튼을 눌러 객실 타입을 만든 후 수당을 입력하세요.
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}