'use client';

import { useEffect, useState, useRef } from 'react';
import {
  FiRefreshCw,
  FiSearch,
  FiCheckCircle,
  FiUser,
  FiPackage,
  FiDollarSign,
  FiUsers,
  FiCalendar,
  FiSave,
  FiX,
} from 'react-icons/fi';
import { showError, showSuccess } from '@/components/ui/Toast';

type AffiliateProfile = {
  id: number;
  affiliateCode: string | null;
  displayName: string | null;
  type: 'HQ' | 'BRANCH_MANAGER' | 'SALES_AGENT';
  branchLabel: string | null;
};

type AffiliateLead = {
  id: number;
  customerName: string | null;
  customerPhone: string | null;
};

type SimulationFormState = {
  // 고객 정보
  customerName: string;
  customerPhone: string;
  leadId: string; // 기존 Lead 선택 시

  // 상품 정보
  productCode: string;
  saleAmount: string;
  costAmount: string;
  headcount: string;
  cabinType: string;
  fareCategory: string;

  // 담당자 정보
  managerId: string;
  agentId: string;

  // 기타
  externalOrderCode: string;
  saleDate: string;
};

const EMPTY_FORM: SimulationFormState = {
  customerName: '',
  customerPhone: '',
  leadId: '',
  productCode: '',
  saleAmount: '',
  costAmount: '',
  headcount: '',
  cabinType: '',
  fareCategory: '',
  managerId: '',
  agentId: '',
  externalOrderCode: '',
  saleDate: new Date().toISOString().split('T')[0],
};

export default function AdminTestSimulationPage() {
  const [formState, setFormState] = useState<SimulationFormState>(EMPTY_FORM);
  const [profiles, setProfiles] = useState<AffiliateProfile[]>([]);
  const [leads, setLeads] = useState<AffiliateLead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);
  const leadDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProfiles();
    loadLeads();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (leadDropdownRef.current && !leadDropdownRef.current.contains(event.target as Node)) {
        setShowLeadDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadProfiles = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/affiliate/profiles?status=ACTIVE&limit=100');
      const json = await res.json();
      if (res.ok && json.ok) {
        setProfiles(json.profiles || []);
      }
    } catch (error: any) {
      console.error('[TestSimulation] load profiles error', error);
      showError('프로필 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLeads = async () => {
    try {
      const res = await fetch('/api/admin/affiliate/leads?limit=50');
      const json = await res.json();
      if (res.ok && json.ok) {
        setLeads(json.leads || []);
      }
    } catch (error: any) {
      console.error('[TestSimulation] load leads error', error);
    }
  };

  const filteredLeads = leads.filter(
    (lead) =>
      (lead.customerName && lead.customerName.includes(searchTerm)) ||
      (lead.customerPhone && lead.customerPhone.includes(searchTerm))
  );

  const managers = profiles.filter((p) => p.type === 'BRANCH_MANAGER');
  const agents = profiles.filter((p) => p.type === 'SALES_AGENT');

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // 필수 필드 검증
      if (!formState.productCode || !formState.saleAmount) {
        showError('상품 코드와 판매 금액은 필수입니다.');
        setIsSubmitting(false);
        return;
      }

      // 기존 Lead 사용 (선택사항)
      let finalLeadId: number | null = null;
      if (formState.leadId) {
        finalLeadId = parseInt(formState.leadId, 10);
      }
      // Lead가 없어도 판매 생성 가능 (managerId 또는 agentId가 있으면 됨)

      // 판매 생성
      const payload: any = {
        productCode: formState.productCode,
        saleAmount: parseInt(formState.saleAmount, 10),
        status: 'CONFIRMED',
      };

      if (formState.externalOrderCode) payload.externalOrderCode = formState.externalOrderCode;
      if (finalLeadId) payload.leadId = finalLeadId;
      if (formState.managerId) payload.managerId = parseInt(formState.managerId, 10);
      if (formState.agentId) payload.agentId = parseInt(formState.agentId, 10);
      if (formState.costAmount) payload.costAmount = parseInt(formState.costAmount, 10);
      if (formState.headcount) payload.headcount = parseInt(formState.headcount, 10);
      if (formState.cabinType) payload.cabinType = formState.cabinType;
      if (formState.fareCategory) payload.fareCategory = formState.fareCategory;
      if (formState.saleDate) payload.saleDate = formState.saleDate;

      const res = await fetch('/api/admin/affiliate/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '판매 생성에 실패했습니다.');
      }

      showSuccess('구매 시뮬레이션이 완료되었습니다.');
      setFormState(EMPTY_FORM);
      loadLeads();
    } catch (error: any) {
      console.error('[TestSimulation] submit error', error);
      showError(error.message || '구매 시뮬레이션 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 pb-24">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pt-10 md:px-6">
        {/* 헤더 */}
        <header className="rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold">구매 시뮬레이션</h1>
              <p className="text-sm text-white/80">
                테스트 목적으로 어필리에이트 판매를 시뮬레이션합니다. 실제 결제 없이 판매 데이터를 생성할 수 있습니다.
              </p>
            </div>
          </div>
        </header>

        {/* 안내 */}
        <section className="rounded-3xl bg-yellow-50 border border-yellow-200 p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800 mb-2">테스트 전용 기능</h3>
              <p className="text-sm text-yellow-700 mb-2">
                이 페이지는 개발 및 테스트 목적으로만 사용됩니다. 생성된 판매 데이터는 실제 결제와 연결되지 않으며, 수당 계산에 영향을 줄 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* 폼 */}
        <section className="rounded-3xl bg-white p-6 shadow-lg space-y-6">
          <h2 className="text-xl font-bold text-gray-900">고객 정보</h2>

          {/* 기존 Lead 선택 또는 새 고객 입력 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                기존 고객 선택 (선택사항)
              </label>
              <div className="relative" ref={leadDropdownRef}>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowLeadDropdown(true);
                    }}
                    onFocus={() => setShowLeadDropdown(true)}
                    placeholder="고객명 또는 전화번호로 검색..."
                    className="w-full rounded-xl border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                {showLeadDropdown && filteredLeads.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {filteredLeads.map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => {
                          setFormState((prev) => ({
                            ...prev,
                            leadId: lead.id.toString(),
                            customerName: lead.customerName || '',
                            customerPhone: lead.customerPhone || '',
                          }));
                          setSearchTerm('');
                          setShowLeadDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm"
                      >
                        <div className="font-medium text-gray-900">{lead.customerName || '이름 없음'}</div>
                        <div className="text-xs text-gray-500">{lead.customerPhone || '-'}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">고객명</label>
                <input
                  type="text"
                  value={formState.customerName}
                  onChange={(e) => setFormState((prev) => ({ ...prev, customerName: e.target.value }))}
                  placeholder="고객 이름"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">전화번호</label>
                <input
                  type="text"
                  value={formState.customerPhone}
                  onChange={(e) => setFormState((prev) => ({ ...prev, customerPhone: e.target.value }))}
                  placeholder="010-0000-0000"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">상품 정보</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  상품 코드 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formState.productCode}
                  onChange={(e) => setFormState((prev) => ({ ...prev, productCode: e.target.value }))}
                  placeholder="예: COSTA-SERENA-HK-TW-JEJU-20251112"
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  판매 금액 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formState.saleAmount}
                  onChange={(e) => setFormState((prev) => ({ ...prev, saleAmount: e.target.value }))}
                  placeholder="예: 1000000"
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">원가</label>
                <input
                  type="number"
                  value={formState.costAmount}
                  onChange={(e) => setFormState((prev) => ({ ...prev, costAmount: e.target.value }))}
                  placeholder="예: 800000"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">인원수</label>
                <input
                  type="number"
                  value={formState.headcount}
                  onChange={(e) => setFormState((prev) => ({ ...prev, headcount: e.target.value }))}
                  placeholder="예: 2"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">객실 타입</label>
                <input
                  type="text"
                  value={formState.cabinType}
                  onChange={(e) => setFormState((prev) => ({ ...prev, cabinType: e.target.value }))}
                  placeholder="예: OceanView"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">요금 카테고리</label>
                <input
                  type="text"
                  value={formState.fareCategory}
                  onChange={(e) => setFormState((prev) => ({ ...prev, fareCategory: e.target.value }))}
                  placeholder="예: Standard"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">담당자 정보</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">대리점장</label>
                <select
                  value={formState.managerId}
                  onChange={(e) => setFormState((prev) => ({ ...prev, managerId: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">선택 안함</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.displayName || manager.affiliateCode} ({manager.branchLabel || '-'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">판매원</label>
                <select
                  value={formState.agentId}
                  onChange={(e) => setFormState((prev) => ({ ...prev, agentId: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">선택 안함</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.displayName || agent.affiliateCode}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">기타 정보</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">주문번호</label>
                <input
                  type="text"
                  value={formState.externalOrderCode}
                  onChange={(e) => setFormState((prev) => ({ ...prev, externalOrderCode: e.target.value }))}
                  placeholder="예: ORDER-2025-001"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">판매일</label>
                <input
                  type="date"
                  value={formState.saleDate}
                  onChange={(e) => setFormState((prev) => ({ ...prev, saleDate: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              onClick={() => setFormState(EMPTY_FORM)}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              disabled={isSubmitting}
            >
              초기화
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formState.productCode || !formState.saleAmount}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2 text-sm font-bold text-white shadow hover:bg-purple-700 disabled:bg-purple-300"
            >
              <FiSave className="text-base" />
              {isSubmitting ? '생성 중...' : '구매 시뮬레이션 실행'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

