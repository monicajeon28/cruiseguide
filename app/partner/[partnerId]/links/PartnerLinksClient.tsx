'use client';

// app/partner/[partnerId]/links/PartnerLinksClient.tsx
// 파트너 링크 관리 클라이언트 컴포넌트

import { useEffect, useState } from 'react';
import {
  FiSearch,
  FiRefreshCw,
  FiCopy,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiExternalLink,
} from 'react-icons/fi';
import { showError, showSuccess } from '@/components/ui/Toast';
import Link from 'next/link';

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

type PartnerLinksClientProps = {
  partnerId: string;
};

type ShareLinks = {
  mall: string;
  tracked: string;
  landing: string | null;
};

export default function PartnerLinksClient({ partnerId }: PartnerLinksClientProps) {
  const [shareLinks, setShareLinks] = useState<ShareLinks | null>(null);
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

      const res = await fetch(`/api/partner/links?${params.toString()}`);
      
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

      // 파트너의 기본 판매 링크 설정
      if (json.shareLinks) {
        const fullShareLinks = {
          mall: `${window.location.origin}${json.shareLinks.mall}`,
          tracked: `${window.location.origin}${json.shareLinks.tracked}`,
          landing: json.shareLinks.landing ? `${window.location.origin}${json.shareLinks.landing}` : null,
        };
        setShareLinks(fullShareLinks);
      }

      // 링크 URL에 base URL 추가
      const linksWithFullUrl = (json.links || []).map((link: AffiliateLink) => {
        if (link.url && link.url.startsWith('/')) {
          return { ...link, url: `${window.location.origin}${link.url}` };
        }
        return link;
      });
      setLinks(linksWithFullUrl);
    } catch (error: any) {
      console.error('[Partner Links] Load error', error);
      showError(error.message || '링크 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess('링크가 클립보드에 복사되었습니다.');
    } catch (error) {
      console.error('[Partner Links] Copy error', error);
      showError('링크 복사에 실패했습니다.');
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 pb-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pt-10 md:px-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">링크 관리</h1>
            <p className="text-sm text-gray-600 mt-2">
              나의 판매 링크를 확인하고 공유할 수 있습니다.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/partner/${partnerId}/dashboard`}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              대시보드로 돌아가기
            </Link>
            <button
              onClick={loadLinks}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              <FiRefreshCw />
              새로고침
            </button>
          </div>
        </div>

        {/* 파트너의 기본 판매 링크 */}
        {shareLinks && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">나의 판매 링크</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-blue-900 mb-1">파트너몰 기본 링크</div>
                  <div className="text-xs text-blue-700 font-mono break-all">{shareLinks.mall}</div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => copyToClipboard(shareLinks.mall)}
                    className="inline-flex items-center gap-1 rounded-lg border border-blue-300 bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-200"
                    title="링크 복사"
                  >
                    <FiCopy />
                    복사
                  </button>
                  <a
                    href={shareLinks.mall}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-green-300 bg-green-100 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-200"
                  >
                    <FiExternalLink />
                    열기
                  </a>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-purple-900 mb-1">파트너몰 추적 링크</div>
                  <div className="text-xs text-purple-700 font-mono break-all">{shareLinks.tracked}</div>
                  <div className="text-xs text-purple-600 mt-1">구매 고객을 자동으로 추적합니다</div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => copyToClipboard(shareLinks.tracked)}
                    className="inline-flex items-center gap-1 rounded-lg border border-purple-300 bg-purple-100 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-200"
                    title="링크 복사"
                  >
                    <FiCopy />
                    복사
                  </button>
                  <a
                    href={shareLinks.tracked}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-green-300 bg-green-100 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-200"
                  >
                    <FiExternalLink />
                    열기
                  </a>
                </div>
              </div>
              {shareLinks.landing && (
                <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-indigo-900 mb-1">랜딩 페이지</div>
                    <div className="text-xs text-indigo-700 font-mono break-all">{shareLinks.landing}</div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => copyToClipboard(shareLinks.landing!)}
                      className="inline-flex items-center gap-1 rounded-lg border border-indigo-300 bg-indigo-100 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-200"
                      title="링크 복사"
                    >
                      <FiCopy />
                      복사
                    </button>
                    <a
                      href={shareLinks.landing}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-green-300 bg-green-100 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-200"
                    >
                      <FiExternalLink />
                      열기
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 필터 및 검색 */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="링크 코드, 상품코드, 캠페인명으로 검색..."
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

        {/* 특정 상품 링크 목록 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900">특정 상품 링크</h2>
            <p className="text-sm text-gray-600 mt-1">관리자가 생성한 특정 상품 판매 링크입니다.</p>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">로딩 중...</div>
          ) : filteredLinks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="mb-2">링크가 없습니다.</p>
              <p className="text-sm text-gray-400">관리자에게 링크 생성을 요청해주세요.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                            <>
                              <button
                                onClick={() => copyToClipboard(link.url!)}
                                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                title="링크 복사"
                              >
                                <FiCopy />
                                복사
                              </button>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-100"
                              >
                                <FiExternalLink />
                                열기
                              </a>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

