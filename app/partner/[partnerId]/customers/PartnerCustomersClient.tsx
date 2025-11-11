'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiArrowLeft,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiUsers,
  FiX,
  FiFileText,
  FiMic,
  FiUpload,
  FiCheckCircle,
  FiClock,
} from 'react-icons/fi';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { showError, showSuccess } from '@/components/ui/Toast';

type LeadStatusOption = {
  value: string;
  label: string;
  theme: string;
};

type PartnerInfo = {
  profileId: number;
  type: 'BRANCH_MANAGER' | 'SALES_AGENT' | 'HQ';
  displayName: string | null;
  branchLabel: string | null;
  mallUserId: string;
  shareLinks: {
    mall: string;
    tracked: string;
    landing: string | null;
  };
  manager: {
    label: string | null;
    affiliateCode: string | null;
    branchLabel: string | null;
  } | null;
  teamAgents: Array<{
    id: number;
    displayName: string | null;
    affiliateCode: string | null;
  }>;
};

type SaleSummary = {
  totalSalesCount: number;
  totalSalesAmount: number;
  totalNetRevenue: number;
  confirmedSalesCount: number;
  confirmedSalesAmount: number;
  lastSaleAt: string | null;
  lastSaleStatus: string | null;
};

type Interaction = {
  id: number;
  interactionType: string;
  occurredAt: string;
  note: string | null;
  createdBy: {
    id: number;
    name: string | null;
    phone: string | null;
  } | null;
};

type PartnerCustomer = {
  id: number;
  customerName: string | null;
  customerPhone: string | null;
  status: string;
  notes: string | null;
  lastContactedAt: string | null;
  nextActionAt: string | null;
  createdAt: string;
  updatedAt: string;
  passportRequestedAt: string | null;
  passportCompletedAt: string | null;
  manager: {
    id: number;
    displayName: string | null;
  } | null;
  agent: {
    id: number;
    displayName: string | null;
  } | null;
  ownership: 'AGENT' | 'MANAGER' | 'UNKNOWN';
  counterpart: {
    label: string | null;
    affiliateCode: string | null;
  } | null;
  saleSummary: SaleSummary;
  interactions: Interaction[];
  sales: Array<{
    id: number;
    saleAmount: number | null;
    netRevenue: number | null;
    saleDate: string | null;
    status: string;
  }>;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type PartnerCustomersClientProps = {
  partner: PartnerInfo;
  leadStatusOptions: LeadStatusOption[];
};

type CreateCustomerForm = {
  customerName: string;
  customerPhone: string;
  status: string;
  notes: string;
  nextActionAt: string;
  agentProfileId: string;
};

type InteractionForm = {
  note: string;
  status: string;
  nextActionAt: string;
  occurredAt: string;
  files: File[];
};

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatCurrency(value: number | null | undefined) {
  if (!value) return '0';
  return value.toLocaleString('ko-KR');
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    showSuccess('복사되었습니다.');
  } catch (error) {
    console.error('copyToClipboard error', error);
    showError('복사에 실패했습니다. 다시 시도해주세요.');
  }
}

function StatusBadge({
  status,
  options,
}: {
  status: string;
  options: LeadStatusOption[];
}) {
  const option = options.find((item) => item.value === status);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
        option?.theme ?? 'bg-slate-200 text-slate-700'
      }`}
    >
      {option?.label ?? status}
    </span>
  );
}

export default function PartnerCustomersClient({
  partner,
  leadStatusOptions,
}: PartnerCustomersClientProps) {
  const params = useParams();
  const partnerId = params?.partnerId as string;
  const [customers, setCustomers] = useState<PartnerCustomer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [addForm, setAddForm] = useState<CreateCustomerForm>({
    customerName: '',
    customerPhone: '',
    status: '',
    notes: '',
    nextActionAt: '',
    agentProfileId: '',
  });

  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [selectedLead, setSelectedLead] = useState<PartnerCustomer | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [interactionForm, setInteractionForm] = useState<InteractionForm>({
    note: '',
    status: '',
    nextActionAt: '',
    occurredAt: '',
    files: [],
  });
  const [interactionSaving, setInteractionSaving] = useState(false);
  const [updatingLead, setUpdatingLead] = useState(false);
  const [requestingPassport, setRequestingPassport] = useState(false);

  const statusSelectOptions = useMemo(
    () => [
      { value: '', label: '상태 선택' },
      ...leadStatusOptions.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    ],
    [leadStatusOptions],
  );

  const fetchCustomers = useCallback(
    async (pageValue: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', pageValue.toString());
        if (statusFilter !== 'ALL') params.set('status', statusFilter);
        if (searchTerm) params.set('q', searchTerm);

        const res = await fetch(`/api/partner/customers?${params}`, {
          credentials: 'include',
        });
        const json = await res.json();
        if (!res.ok || !json?.ok) {
          throw new Error(json?.message || '고객 목록을 불러오지 못했습니다.');
        }
        setCustomers(json.customers ?? []);
        if (json.pagination) {
          setPagination(json.pagination);
          setCurrentPage(json.pagination.page);
        }
      } catch (error) {
        console.error('fetchCustomers error', error);
        showError(
          error instanceof Error
            ? error.message
            : '고객 목록을 불러오지 못했습니다.',
        );
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, statusFilter],
  );

  const loadLeadDetail = useCallback(async (leadId: number) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/partner/customers/${leadId}`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.message || '고객 정보를 불러오지 못했습니다.');
      }
      setSelectedLead(json.customer);
    } catch (error) {
      console.error('loadLeadDetail error', error);
      showError(
        error instanceof Error
          ? error.message
          : '고객 정보를 불러오지 못했습니다.',
      );
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers(currentPage);
  }, [fetchCustomers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSearchTerm(searchInput.trim());
  };

  const resetAddForm = () =>
    setAddForm({
      customerName: '',
      customerPhone: '',
      status: '',
      notes: '',
      nextActionAt: '',
      agentProfileId: '',
    });

  const handleCreateCustomer = async () => {
    if (!addForm.customerName && !addForm.customerPhone) {
      showError('고객 이름 또는 연락처를 입력해주세요.');
      return;
    }
    setCreating(true);
    try {
      const payload: Record<string, unknown> = {
        customerName: addForm.customerName,
        customerPhone: addForm.customerPhone,
        status: addForm.status || undefined,
        notes: addForm.notes || undefined,
      };
      if (addForm.nextActionAt) payload.nextActionAt = addForm.nextActionAt;
      if (partner.type === 'BRANCH_MANAGER' && addForm.agentProfileId) {
        payload.agentProfileId = Number(addForm.agentProfileId);
      }

      const res = await fetch('/api/partner/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.message || '고객 추가에 실패했습니다.');
      }
      showSuccess('고객이 추가되었습니다.');
      setIsAddModalOpen(false);
      resetAddForm();
      setCurrentPage(1);
      fetchCustomers(1);
    } catch (error) {
      console.error('handleCreateCustomer error', error);
      showError(
        error instanceof Error ? error.message : '고객 추가에 실패했습니다.',
      );
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateLead = async (updates: Record<string, unknown>) => {
    if (!selectedLeadId) return;
    setUpdatingLead(true);
    try {
      const res = await fetch(`/api/partner/customers/${selectedLeadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.message || '고객 정보를 수정하지 못했습니다.');
      }
      showSuccess('고객 정보가 업데이트되었습니다.');
      setSelectedLead(json.customer);
      fetchCustomers(currentPage);
    } catch (error) {
      console.error('handleUpdateLead error', error);
      showError(
        error instanceof Error
          ? error.message
          : '고객 정보를 수정하지 못했습니다.',
      );
    } finally {
      setUpdatingLead(false);
    }
  };

  const handleAddInteraction = async () => {
    if (!selectedLeadId) return;
    if (!interactionForm.note.trim()) {
      showError('상담 메모를 입력해주세요.');
      return;
    }
    setInteractionSaving(true);
    try {
      const payload: Record<string, unknown> = {
        note: interactionForm.note,
        interactionType: 'NOTE',
      };
      if (interactionForm.status) payload.status = interactionForm.status;
      if (interactionForm.nextActionAt) payload.nextActionAt = interactionForm.nextActionAt;
      if (interactionForm.occurredAt) payload.occurredAt = interactionForm.occurredAt;

      const res = await fetch(`/api/partner/customers/${selectedLeadId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.message || '상담 기록을 저장하지 못했습니다.');
      }
      showSuccess('상담 기록이 추가되었습니다.');
      setInteractionForm({ note: '', status: '', nextActionAt: '', occurredAt: '', files: [] });
      
      // 파일 업로드 (있는 경우)
      if (interactionForm.files.length > 0 && json.interaction?.id) {
        for (const file of interactionForm.files) {
          const formData = new FormData();
          formData.append('file', file);
          
          try {
            const uploadRes = await fetch(`/api/admin/affiliate/interactions/${json.interaction.id}/upload`, {
              method: 'POST',
              credentials: 'include',
              body: formData,
            });
            const uploadJson = await uploadRes.json();
            if (!uploadRes.ok || !uploadJson.ok) {
              console.error('File upload failed:', uploadJson.message);
            }
          } catch (uploadError) {
            console.error('File upload error:', uploadError);
          }
        }
      }
      
      await loadLeadDetail(selectedLeadId);
      fetchCustomers(currentPage);
    } catch (error) {
      console.error('handleAddInteraction error', error);
      showError(
        error instanceof Error
          ? error.message
          : '상담 기록을 저장하지 못했습니다.',
      );
    } finally {
      setInteractionSaving(false);
    }
  };

  const openDetail = (leadId: number) => {
    setSelectedLeadId(leadId);
    setSelectedLead(null);
    loadLeadDetail(leadId);
  };

  const closeDetail = () => {
    setSelectedLeadId(null);
    setSelectedLead(null);
    setInteractionForm({ note: '', status: '', nextActionAt: '', occurredAt: '', files: [] });
  };

  const handleRequestPassport = async () => {
    if (!selectedLeadId) return;
    if (!confirm('고객에게 여권 요청을 전송하시겠습니까?')) {
      return;
    }

    try {
      setRequestingPassport(true);
      const res = await fetch(`/api/admin/affiliate/leads/${selectedLeadId}/request-passport`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: '여권 정보가 필요합니다.' }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '여권 요청에 실패했습니다.');
      }

      showSuccess('여권 요청이 전송되었습니다. 본사 확인 후 여권 완료 처리가 됩니다.');
      await loadLeadDetail(selectedLeadId);
      fetchCustomers(currentPage);
    } catch (error) {
      console.error('handleRequestPassport error', error);
      showError(
        error instanceof Error ? error.message : '여권 요청 중 오류가 발생했습니다.',
      );
    } finally {
      setRequestingPassport(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setInteractionForm((prev) => ({
      ...prev,
      files: [...prev.files, ...files],
    }));
  };

  const removeFile = (index: number) => {
    setInteractionForm((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  // 여권 만료 임박 체크 (6개월 이내)
  const checkPassportExpiry = (expiryDate: string | null | undefined) => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(now.getMonth() + 6);
    
    if (expiry <= sixMonthsLater) {
      return '임박';
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 pb-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-10 md:px-6">
        <header className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-xl">
          <Link
            href={`/partner/${partnerId}/dashboard`}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 text-sm"
          >
            <FiArrowLeft /> 대시보드로 돌아가기
          </Link>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/80">Partner CRM</p>
                <h1 className="mt-2 text-3xl font-black leading-snug md:text-4xl">나의 고객 관리</h1>
              </div>
              <p className="max-w-2xl text-sm text-white/80 md:text-base">
                상담 기록과 다음 조치 일정을 관리하고, 고객이 어떤 파트너 링크를 통해 유입되었는지 추적하세요.
              </p>
              <div className="flex flex-wrap gap-3 text-xs md:text-sm">
                <StatusBadge
                  status={partner.type === 'BRANCH_MANAGER' ? 'MANAGER' : 'AGENT'}
                  options={[
                    {
                      value: 'MANAGER',
                      label: '대리점장',
                      theme: 'bg-amber-200/90 text-amber-900',
                    },
                    {
                      value: 'AGENT',
                      label: '판매원',
                      theme: 'bg-emerald-200/90 text-emerald-900',
                    },
                  ]}
                />
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/90">
                  파트너 ID {partner.mallUserId}
                </span>
                {partner.branchLabel ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/90">
                    {partner.branchLabel}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="rounded-3xl bg-white/15 p-6 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-widest text-white/70">고객 초대 링크</p>
              <div className="mt-4 space-y-3 text-sm">
                <button
                  type="button"
                  onClick={() => copyToClipboard(partner.shareLinks.tracked)}
                  className="flex w-full items-center justify-between rounded-2xl bg-white/95 px-4 py-3 font-semibold text-blue-700 shadow hover:bg-white"
                >
                  <span>파트너몰 추적 링크</span>
                  <FiCopy />
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(partner.shareLinks.mall)}
                  className="flex w-full items-center justify-between rounded-2xl bg-white/90 px-4 py-3 font-semibold text-blue-700 shadow hover:bg-white"
                >
                  <span>파트너몰 기본 링크</span>
                  <FiCopy />
                </button>
                {partner.shareLinks.landing ? (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(partner.shareLinks.landing as string)}
                    className="flex w-full items-center justify-between rounded-2xl bg-white/80 px-4 py-3 font-semibold text-blue-700 shadow hover:bg-white"
                  >
                    <span>랜딩 페이지</span>
                    <FiCopy />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <section className="rounded-3xl bg-white/95 p-6 shadow-lg">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <form
              onSubmit={handleSearchSubmit}
              className="flex w-full max-w-lg items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
            >
```
            <FiSearch className="text-slate-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="고객 이름 또는 연락처 검색"
              className="flex-1 border-none bg-transparent text-sm outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              검색
            </button>
          </form>
          <div className="flex items-center gap-3 text-sm">
            <label className="text-slate-500">상태</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="ALL">전체</option>
              {leadStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsAddModalOpen(true);
              resetAddForm();
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            <FiPlus /> 새 고객 추가
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    고객
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    유입날짜
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    상담 일정
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    판매 현황
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    소유
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                      데이터를 불러오는 중입니다...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                      등록된 고객이 없습니다. &ldquo;새 고객 추가&rdquo; 버튼으로 고객을 등록해 주세요.
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => {
                    // 구매 완료 자동 표시: 나의 구매몰에서 구매한 경우
                    const hasPurchase = customer.sales.some((sale) => sale.status === 'CONFIRMED' || sale.status === 'PENDING');
                    const displayStatus = hasPurchase && customer.status !== 'PURCHASED' ? 'PURCHASED' : customer.status;
                    
                    return (
                      <tr key={customer.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm text-slate-700">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-slate-900">
                              {customer.customerName ?? '이름 미입력'}
                            </span>
                            <span className="text-xs text-slate-500">
                              {customer.customerPhone ?? '연락처 미입력'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {formatDate(customer.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <StatusBadge status={displayStatus} options={leadStatusOptions} />
                          {hasPurchase && customer.status !== 'PURCHASED' && (
                            <span className="ml-2 text-xs text-emerald-600 font-semibold">(구매완료)</span>
                          )}
                        </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="flex flex-col gap-1">
                          <span>최근 상담: {formatDateTime(customer.lastContactedAt)}</span>
                          <span className="text-xs text-slate-500">
                            다음 조치: {formatDate(customer.nextActionAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="flex flex-col gap-1">
                          <span>총 {customer.saleSummary.totalSalesCount}건</span>
                          <span className="text-xs text-slate-500">
                            매출 {formatCurrency(customer.saleSummary.totalSalesAmount)}원
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="flex flex-col gap-1">
                          <span>
                            {customer.ownership === 'AGENT'
                              ? '내 고객'
                              : customer.ownership === 'MANAGER'
                              ? '대리점 고객'
                              : '협업 고객'}
                          </span>
                          {customer.counterpart?.label ? (
                            <span className="text-xs text-slate-500">
                              담당: {customer.counterpart.label}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <button
                          type="button"
                          onClick={() => openDetail(customer.id)}
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 font-semibold text-blue-600 hover:bg-blue-100"
                        >
                          상세 보기
                        </button>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            총 {pagination.total.toLocaleString()}명 · {pagination.page} /{' '}
            {pagination.totalPages} 페이지
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-600 disabled:opacity-30"
            >
              <FiChevronLeft /> 이전
            </button>
            <button
              type="button"
              disabled={currentPage >= pagination.totalPages || loading}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-600 disabled:opacity-30"
            >
              다음 <FiChevronRight />
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white/95 p-6 shadow-lg">
        <h2 className="text-lg font-bold text-slate-900">파트너 관리 요약</h2>
        <p className="mt-2 text-sm text-slate-500">
          고객 관리 도구에서 상담 메모와 판매 현황을 확인하고, 파트너몰 링크를 공유해 고객을 추적하세요.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <FiUsers className="text-xl" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">내 파트너 정보</p>
                <p className="text-xs text-slate-500">파트너몰 링크와 담당자를 확인하세요.</p>
              </div>
            </div>
            <dl className="mt-4 space-y-2 text-sm text-slate-600">
              <div className="grid grid-cols-3 gap-2">
                <dt className="font-semibold text-slate-500">파트너몰</dt>
                <dd className="col-span-2 break-all text-blue-600">
                  {partner.shareLinks.mall}
                </dd>
              </div>
              {partner.manager ? (
                <div className="grid grid-cols-3 gap-2">
                  <dt className="font-semibold text-slate-500">담당 대리점장</dt>
                  <dd className="col-span-2">{partner.manager.label ?? '정보 없음'}</dd>
                </div>
              ) : null}
            </dl>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-900">고객 관리 팁</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="rounded-xl bg-slate-100 px-4 py-3">
                상담 기록에 메모를 남기면 다음 조치 일정을 자동으로 관리할 수 있습니다.
              </li>
              <li className="rounded-xl bg-slate-100 px-4 py-3">
                파트너몰 링크를 공유하면 어떤 파트너가 판매를 이끌었는지 추적됩니다.
              </li>
              <li className="rounded-xl bg-slate-100 px-4 py-3">
                확정된 판매는 정산 대시보드와 연동되어 수당 계산에 반영됩니다.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>

    {isAddModalOpen ? (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 backdrop-blur px-4">
        <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">새 고객 추가</h3>
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                resetAddForm();
              }}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            >
              <FiX />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500">이름</label>
              <input
                value={addForm.customerName}
                onChange={(event) =>
                  setAddForm((prev) => ({ ...prev, customerName: event.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="고객 이름"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">연락처</label>
              <input
                value={addForm.customerPhone}
                onChange={(event) =>
                  setAddForm((prev) => ({ ...prev, customerPhone: event.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="010-0000-0000"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-500">상태</label>
                <select
                  value={addForm.status}
                  onChange={(event) =>
                    setAddForm((prev) => ({ ...prev, status: event.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                >
                  {statusSelectOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">다음 조치 예정일</label>
                <input
                  type="date"
                  value={addForm.nextActionAt}
                  onChange={(event) =>
                    setAddForm((prev) => ({ ...prev, nextActionAt: event.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            {partner.type === 'BRANCH_MANAGER' ? (
              <div>
                <label className="text-xs font-semibold text-slate-500">담당 판매원 배정 (선택)</label>
                <select
                  value={addForm.agentProfileId}
                  onChange={(event) =>
                    setAddForm((prev) => ({ ...prev, agentProfileId: event.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">대리점장이 직접 관리</option>
                  {partner.teamAgents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.displayName ?? '판매원'} ({agent.affiliateCode ?? '코드 없음'})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div>
              <label className="text-xs font-semibold text-slate-500">메모</label>
              <textarea
                value={addForm.notes}
                onChange={(event) =>
                  setAddForm((prev) => ({ ...prev, notes: event.target.value }))
                }
                rows={4}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="상담 메모를 입력하세요."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                resetAddForm();
              }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
            >
              취소
            </button>
            <button
              type="button"
              disabled={creating}
              onClick={handleCreateCustomer}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:bg-blue-300"
            >
              {creating ? '저장 중...' : '고객 추가'}
            </button>
          </div>
        </div>
      </div>
    ) : null}

    {selectedLeadId ? (
      <div className="fixed inset-0 z-[998] flex justify-end bg-slate-900/30 backdrop-blur">
        <div className="flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <button
                type="button"
                onClick={closeDetail}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
              >
                <FiArrowLeft /> 목록으로
              </button>
              <h3 className="mt-2 text-xl font-bold text-slate-900">
                {selectedLead?.customerName ?? '이름 미입력'}
              </h3>
            </div>
            {selectedLead ? (
              <StatusBadge status={selectedLead.status} options={leadStatusOptions} />
            ) : null}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {detailLoading || !selectedLead ? (
              <div className="flex h-full items-center justify-center text-slate-500">
                데이터를 불러오는 중입니다...
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3 text-sm text-slate-600">
                      <div>
                        <p className="text-xs font-semibold text-slate-500">연락처</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span>{selectedLead.customerPhone ?? '연락처 미입력'}</span>
                          {selectedLead.customerPhone ? (
                            <a
                              href={`tel:${selectedLead.customerPhone.replace(/[^0-9]/g, '')}`}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              전화걸기
                            </a>
                          ) : null}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500">다음 조치</p>
                        <div className="mt-1 flex items-center gap-2">
                          <FiCalendar className="text-slate-400" />
                          <span>{formatDate(selectedLead.nextActionAt)}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500">메모</p>
                        <textarea
                          defaultValue={selectedLead.notes ?? ''}
                          onBlur={(event) =>
                            handleUpdateLead({ notes: event.target.value })
                          }
                          rows={3}
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                          placeholder="고객 메모를 입력하세요."
                        />
                      </div>
                    </div>
                    <div className="space-y-3 text-sm text-slate-600">
                      <div>
                        <p className="text-xs font-semibold text-slate-500">상태 변경</p>
                        <select
                          value={selectedLead.status}
                          disabled={updatingLead}
                          onChange={(event) =>
                            handleUpdateLead({ status: event.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        >
                          {leadStatusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {partner.type === 'BRANCH_MANAGER' ? (
                        <div>
                          <p className="text-xs font-semibold text-slate-500">담당 판매원</p>
                          <select
                            value={selectedLead.agent?.id ?? ''}
                            disabled={updatingLead}
                            onChange={(event) =>
                              handleUpdateLead({
                                agentProfileId: event.target.value || null,
                              })
                            }
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                          >
                            <option value="">대리점장이 직접 관리</option>
                            {partner.teamAgents.map((agent) => (
                              <option key={agent.id} value={agent.id}>
                                {agent.displayName ?? '판매원'} (
                                {agent.affiliateCode ?? '코드 없음'})
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-semibold text-slate-500">담당 대리점장</p>
                          <p className="mt-1">
                            {selectedLead.manager?.displayName ?? '정보 없음'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 여권 관리 섹션 */}
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-500">여권 상태</p>
                      {selectedLead.passportCompletedAt ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            <FiCheckCircle /> 여권 완료
                          </span>
                          {selectedLead.passportRequestedAt && (
                            <button
                              type="button"
                              onClick={handleRequestPassport}
                              disabled={requestingPassport}
                              className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                            >
                              <FiFileText /> 여권 재요청
                            </button>
                          )}
                        </div>
                      ) : selectedLead.passportRequestedAt ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                          <FiClock /> 요청됨 (본사 확인 대기중)
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRequestPassport}
                          disabled={requestingPassport}
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:bg-blue-300"
                        >
                          <FiFileText />
                          {requestingPassport ? '전송 중...' : '여권 보내기'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-800">상담 기록</h4>
                    <button
                      type="button"
                      onClick={() => loadLeadDetail(selectedLeadId)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                    >
                      <FiRefreshCw /> 새로고침
                    </button>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <textarea
                        value={interactionForm.note}
                        onChange={(event) =>
                          setInteractionForm((prev) => ({ ...prev, note: event.target.value }))
                        }
                        rows={4}
                        placeholder="상담 내용을 입력하세요."
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      />
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="text-xs font-semibold text-slate-500">상담 일시</label>
                          <input
                            type="datetime-local"
                            value={interactionForm.occurredAt}
                            onChange={(event) =>
                              setInteractionForm((prev) => ({
                                ...prev,
                                occurredAt: event.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500">다음 조치</label>
                          <input
                            type="date"
                            value={interactionForm.nextActionAt}
                            onChange={(event) =>
                              setInteractionForm((prev) => ({
                                ...prev,
                                nextActionAt: event.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500">상담 후 상태</label>
                        <select
                          value={interactionForm.status}
                          onChange={(event) =>
                            setInteractionForm((prev) => ({
                              ...prev,
                              status: event.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        >
                          {statusSelectOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500">기록/녹음 파일 업로드</label>
                        <div className="mt-1">
                          <input
                            type="file"
                            multiple
                            accept="audio/*,video/*,image/*"
                            onChange={handleFileChange}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                          />
                          {interactionForm.files.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {interactionForm.files.map((file, index) => (
                                <div key={index} className="flex items-center justify-between rounded-lg bg-slate-100 px-2 py-1 text-xs">
                                  <span className="flex items-center gap-1">
                                    <FiMic className="text-blue-500" />
                                    {file.name} ({(file.size / 1024).toFixed(1)}KB)
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <FiX />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddInteraction}
                        disabled={interactionSaving}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:bg-blue-300"
                      >
                        {interactionSaving ? '저장 중...' : '상담 기록 추가'}
                      </button>
                    </div>
                    <div className="space-y-3">
                      {selectedLead.interactions.length === 0 ? (
                        <div className="rounded-xl bg-slate-100 px-3 py-4 text-center text-xs text-slate-500">
                          등록된 상담 기록이 없습니다.
                        </div>
                      ) : (
                        selectedLead.interactions.map((interaction) => (
                          <div
                            key={interaction.id}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-700">
                                {interaction.interactionType}
                              </span>
                              <span className="text-slate-400">
                                {formatDateTime(interaction.occurredAt)}
                              </span>
                            </div>
                            <p className="mt-2 whitespace-pre-line">
                              {interaction.note ?? '메모 없음'}
                            </p>
                            {interaction.createdBy?.name ? (
                              <p className="mt-2 text-[11px] text-slate-400">
                                기록자: {interaction.createdBy.name}
                              </p>
                            ) : null}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <h4 className="text-sm font-semibold text-slate-800">판매 현황</h4>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                      <p className="text-xs text-slate-500">총 판매</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {selectedLead.saleSummary.totalSalesCount}건
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                      <p className="text-xs text-slate-500">총 매출</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {formatCurrency(selectedLead.saleSummary.totalSalesAmount)}원
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                      <p className="text-xs text-slate-500">확정 매출</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {formatCurrency(selectedLead.saleSummary.confirmedSalesAmount)}원
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-3 text-sm text-slate-600">
                    {selectedLead.sales.length === 0 ? (
                      <div className="rounded-xl bg-slate-100 px-3 py-4 text-center text-xs text-slate-500">
                        등록된 판매가 없습니다.
                      </div>
                    ) : (
                      selectedLead.sales.slice(0, 5).map((sale) => (
                        <div
                          key={sale.id}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-700">
                              {sale.status}
                            </span>
                            <span className="text-slate-400">
                              {formatDate(sale.saleDate)}
                            </span>
                          </div>
                          <p className="mt-2">
                            매출 {formatCurrency(sale.saleAmount)}원 / 순이익{' '}
                            {formatCurrency(sale.netRevenue)}원
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    ) : null}
  </div>
  );
}