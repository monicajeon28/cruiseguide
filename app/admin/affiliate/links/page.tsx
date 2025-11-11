// app/admin/affiliate/links/page.tsx
// 링크 관리 페이지

'use client';

import { useEffect, useState } from 'react';
import {
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiEdit2,
  FiTrash2,
  FiCopy,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiExternalLink,
} from 'react-icons/fi';
import { showError, showSuccess } from '@/components/ui/Toast';

type AffiliateLink = {
  id: number;
  code: string;
  title: string | null;
  productCode: string | null;
  status: string;
  expiresAt: string | null;
  lastAccessedAt: string | null;
  campaignName: string | null;
  createdAt: string;
  manager: {
    id: number;
    displayName: string | null;
    affiliateCode: string | null;
  } | null;
  agent: {
    id: number;
    displayName: string | null;
    affiliateCode: string | null;
  } | null;
  product: {
    id: number;
    productCode: string;
    title: string;
  } | null;
  issuedBy: {
    id: number;
    name: string | null;
  } | null;
  _count: {
    leads: number;
    sales: number;
  };
  url?: string;
};

export default function LinksPage() {
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLink, setSelectedLink] = useState<AffiliateLink | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReissueModalOpen, setIsReissueModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    productCode: '',
    managerId: '',
    agentId: '',
    expiresAt: '',
    campaignName: '',
    description: '',
  });
  const [reissueExpiresAt, setReissueExpiresAt] = useState('');

  useEffect(() => {
    loadLinks();
  }, [statusFilter]);

  const loadLinks = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const res = await fetch(`/api/admin/affiliate/links?${params.toString()}`);
      
      if (!res.ok) {
        const text = await res.text();
        let json;
        try {
          json = JSON.parse(text);
        } catch {
          throw new Error(`서버 오류 (${res.status}): ${text || '알 수 없는 오류'}`);
        }
        throw new Error(json.message || '링크 목록을 불러오지 못했습니다.');
      }

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.message || '링크 목록을 불러오지 못했습니다.');
      }

      // 링크 URL 생성
      const linksWithUrl = (json.links || []).map((link: AffiliateLink) => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        let linkUrl = link.productCode ? `${baseUrl}/products/${link.productCode}` : `${baseUrl}/products`;
        const params = new URLSearchParams();
        if (link.manager?.affiliateCode) {
          params.append('affiliate', link.manager.affiliateCode);
        }
        if (link.agent?.affiliateCode) {
          params.append('agent', link.agent.affiliateCode);
        }
        if (link.code) {
          params.append('link', link.code);
        }
        if (params.toString()) {
          linkUrl += `?${params.toString()}`;
        }
        return { ...link, url: linkUrl };
      });

      setLinks(linksWithUrl);
    } catch (error: any) {
      console.error('[Links] Load error', error);
      showError(error.message || '링크 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLink = async () => {
    if (!formData.productCode.trim()) {
      showError('상품 코드를 입력해주세요.');
      return;
    }

    try {
      const res = await fetch('/api/admin/affiliate/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title || null,
          productCode: formData.productCode,
          managerId: formData.managerId ? Number(formData.managerId) : null,
          agentId: formData.agentId ? Number(formData.agentId) : null,
          expiresAt: formData.expiresAt || null,
          campaignName: formData.campaignName || null,
          description: formData.description || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '링크 생성에 실패했습니다.');
      }

      showSuccess('링크가 생성되었습니다.');
      setIsCreateModalOpen(false);
      setFormData({
        title: '',
        productCode: '',
        managerId: '',
        agentId: '',
        expiresAt: '',
        campaignName: '',
        description: '',
      });
      loadLinks();
    } catch (error: any) {
      console.error('[Links] Create error', error);
      showError(error.message || '링크 생성 중 오류가 발생했습니다.');
    }
  };

  const handleReissueLink = async () => {
    if (!selectedLink) return;

    try {
      const res = await fetch(`/api/admin/affiliate/links/${selectedLink.id}/reissue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newExpiresAt: reissueExpiresAt || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '링크 재발급에 실패했습니다.');
      }

      showSuccess('링크가 재발급되었습니다.');
      setIsReissueModalOpen(false);
      setSelectedLink(null);
      setReissueExpiresAt('');
      loadLinks();
    } catch (error: any) {
      console.error('[Links] Reissue error', error);
      showError(error.message || '링크 재발급 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteLink = async (linkId: number) => {
    if (!confirm('정말 이 링크를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/affiliate/links/${linkId}`, {
        method: 'DELETE',
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '링크 삭제에 실패했습니다.');
      }

      showSuccess('링크가 삭제되었습니다.');
      loadLinks();
    } catch (error: any) {
      console.error('[Links] Delete error', error);
      showError(error.message || '링크 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleExpireLink = async (linkId: number) => {
    try {
      const res = await fetch(`/api/admin/affiliate/links/${linkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'EXPIRED',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '링크 만료 처리에 실패했습니다.');
      }

      showSuccess('링크가 만료 처리되었습니다.');
      loadLinks();
    } catch (error: any) {
      console.error('[Links] Expire error', error);
      showError(error.message || '링크 만료 처리 중 오류가 발생했습니다.');
    }
  };

  const getStatusBadge = (link: AffiliateLink) => {
    const now = new Date();
    const expiresAt = link.expiresAt ? new Date(link.expiresAt) : null;
    const isExpired = expiresAt && expiresAt < now;
    const isExpiringSoon = expiresAt && expiresAt > now && expiresAt.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000;

    switch (link.status) {
      case 'ACTIVE':
        if (isExpired) {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              <FiXCircle />
              만료됨
            </span>
          );
        }
        if (isExpiringSoon) {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
              <FiClock />
              만료 임박
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            <FiCheckCircle />
            활성
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            <FiXCircle />
            만료됨
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
            비활성
          </span>
        );
      case 'REVOKED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            취소됨
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
            {link.status}
          </span>
        );
    }
  };

  const filteredLinks = links.filter((link) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        link.code.toLowerCase().includes(term) ||
        link.productCode?.toLowerCase().includes(term) ||
        link.title?.toLowerCase().includes(term) ||
        link.campaignName?.toLowerCase().includes(term) ||
        link.manager?.displayName?.toLowerCase().includes(term) ||
        link.agent?.displayName?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="p-8 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">링크 관리</h1>
          <p className="text-sm text-gray-600 mt-1">
            구매 링크를 생성, 만료, 재발급할 수 있습니다.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadLinks}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            <FiRefreshCw />
            새로고침
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-blue-700"
          >
            <FiPlus />
            링크 생성
          </button>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="링크 코드, 상품코드, 캠페인명, 담당자로 검색..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="all">전체</option>
          <option value="ACTIVE">활성</option>
          <option value="EXPIRED">만료됨</option>
          <option value="INACTIVE">비활성</option>
          <option value="REVOKED">취소됨</option>
        </select>
      </div>

      {/* 링크 목록 */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : filteredLinks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">링크가 없습니다.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  링크 코드
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  상품
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  담당자
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  캠페인
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  만료일
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  통계
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLinks.map((link) => (
                <tr key={link.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{link.code}</div>
                    {link.title && (
                      <div className="text-xs text-gray-500">{link.title}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {link.product?.title || link.productCode || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {link.manager?.displayName && (
                      <div>대리점장: {link.manager.displayName}</div>
                    )}
                    {link.agent?.displayName && (
                      <div className="text-xs text-gray-500">판매원: {link.agent.displayName}</div>
                    )}
                    {!link.manager && !link.agent && <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {link.campaignName || '-'}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(link)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {link.expiresAt ? (
                      <div>
                        {new Date(link.expiresAt).toLocaleDateString('ko-KR')}
                        {(() => {
                          const expiresAt = new Date(link.expiresAt!);
                          const now = new Date();
                          const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                          if (daysUntilExpiry > 0 && daysUntilExpiry <= 7) {
                            return (
                              <div className="text-xs text-yellow-600 mt-1">
                                {daysUntilExpiry}일 후 만료
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    ) : (
                      <span className="text-gray-400">만료일 없음</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>리드: {link._count.leads}</div>
                    <div className="text-xs">판매: {link._count.sales}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {link.url && (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          <FiExternalLink />
                          열기
                        </a>
                      )}
                      {link.status === 'ACTIVE' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedLink(link);
                              setIsReissueModalOpen(true);
                              // 기본값: 30일 후
                              const defaultDate = new Date();
                              defaultDate.setDate(defaultDate.getDate() + 30);
                              setReissueExpiresAt(defaultDate.toISOString().split('T')[0]);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-100"
                          >
                            <FiCopy />
                            재발급
                          </button>
                          <button
                            onClick={() => handleExpireLink(link.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-yellow-200 bg-yellow-50 px-2 py-1 text-xs font-semibold text-yellow-700 hover:bg-yellow-100"
                          >
                            <FiClock />
                            만료
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                      >
                        <FiTrash2 />
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 링크 생성 모달 */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">링크 생성</h2>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  상품 코드 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.productCode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, productCode: e.target.value }))}
                  placeholder="예) 2025-PIANO-HK-01"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">링크 제목</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="예) 10월 프로모션 링크"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">대리점장 ID (선택)</label>
                <input
                  type="number"
                  value={formData.managerId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, managerId: e.target.value }))}
                  placeholder="대리점장 프로필 ID"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">판매원 ID (선택)</label>
                <input
                  type="number"
                  value={formData.agentId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, agentId: e.target.value }))}
                  placeholder="판매원 프로필 ID"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">만료일 (선택)</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, expiresAt: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">만료일을 설정하지 않으면 만료되지 않습니다.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">캠페인명</label>
                <input
                  type="text"
                  value={formData.campaignName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, campaignName: e.target.value }))}
                  placeholder="예) 10월 프로모션"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="링크에 대한 설명..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setFormData({
                    title: '',
                    productCode: '',
                    managerId: '',
                    agentId: '',
                    expiresAt: '',
                    campaignName: '',
                    description: '',
                  });
                }}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={handleCreateLink}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-blue-700"
              >
                <FiPlus />
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 링크 재발급 모달 */}
      {isReissueModalOpen && selectedLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">링크 재발급</h2>
              <p className="text-sm text-gray-600 mt-1">
                기존 링크를 복사하여 새 링크를 생성합니다. 기존 링크는 비활성화됩니다.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">기존 링크 코드:</span>
                    <span className="font-semibold">{selectedLink.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">상품:</span>
                    <span className="font-semibold">{selectedLink.product?.title || selectedLink.productCode}</span>
                  </div>
                  {selectedLink.expiresAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">기존 만료일:</span>
                      <span className="font-semibold">
                        {new Date(selectedLink.expiresAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  새 만료일 (선택)
                </label>
                <input
                  type="date"
                  value={reissueExpiresAt}
                  onChange={(e) => setReissueExpiresAt(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  만료일을 설정하지 않으면 기본값(30일 후)이 적용됩니다.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <FiAlertCircle className="text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">재발급 안내</p>
                    <p>
                      재발급 시 기존 링크는 비활성화되고 새로운 링크가 생성됩니다. 기존 링크의 통계는 유지됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsReissueModalOpen(false);
                  setSelectedLink(null);
                  setReissueExpiresAt('');
                }}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={handleReissueLink}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-green-700"
              >
                <FiCopy />
                재발급
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
