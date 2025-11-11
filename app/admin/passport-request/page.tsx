'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiRefreshCw, FiSearch, FiSend, FiUserCheck } from 'react-icons/fi';
import { showError, showSuccess } from '@/components/ui/Toast';

interface PassportRequestTemplate {
  id: number;
  title: string;
  body: string;
  variables: Record<string, any> | null;
  isDefault: boolean;
  updatedAt: string;
}

interface PassportRequestLogSummary {
  id: number;
  status: string;
  messageChannel: string;
  sentAt: string;
  admin: {
    id: number;
    name: string | null;
  } | null;
}

interface PassportSubmissionSummary {
  id: number;
  tripId: number | null;
  token: string;
  tokenExpiresAt: string;
  isSubmitted: boolean;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PassportRequestCustomer {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  role: string;
  customerStatus: string | null;
  createdAt: string;
  tripCount: number;
  latestTrip: {
    id: number;
    cruiseName: string | null;
    reservationCode: string | null;
    productId: number | null;
    startDate: string | null;
    endDate: string | null;
  } | null;
  submission: PassportSubmissionSummary | null;
  lastRequest: PassportRequestLogSummary | null;
  submissionStatus: 'submitted' | 'pending' | 'not_requested';
}

interface SendResultItem {
  userId: number;
  success: boolean;
  link?: string;
  token?: string;
  submissionId?: number;
  message?: string;
  error?: string;
  messageId?: string | null;
  resultCode?: string;
}

interface SendResultResponse {
  ok: boolean;
  channel: string;
  expiresInHours: number;
  results: SendResultItem[];
  missingUserIds: number[];
  aligoRemain?: AligoRemainSummary;
  remainingCash?: number;
  lowBalance?: boolean;
}

interface AligoRemainSummary {
  result_code: string;
  message?: string;
  SMS_CNT?: string;
  LMS_CNT?: string;
  MMS_CNT?: string;
  cash?: string;
}

const STATUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'submitted', label: '제출 완료' },
  { value: 'pending', label: '제출 대기' },
  { value: 'not_requested', label: '요청 없음' },
  { value: 'no_request', label: '발송 이력 없음' },
] as const;

type StatusFilter = (typeof STATUS_OPTIONS)[number]['value'];

type RoleFilter = 'all' | 'guide' | 'mall' | 'test';

type ChannelOption = 'SMS' | 'ALIMTALK';

const CHANNEL_LABELS: Record<ChannelOption, string> = {
  SMS: 'SMS (알리고)',
  ALIMTALK: '알림톡 (카카오)',
};

const formatChannelLabel = (channel: string) => {
  if (channel in CHANNEL_LABELS) {
    return CHANNEL_LABELS[channel as ChannelOption];
  }
  if (channel === 'KAKAO') return '카카오 메시지';
  return channel;
};

type SearchMatch = {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  role: string;
  customerStatus: string | null;
};

export default function PassportRequestPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [customers, setCustomers] = useState<PassportRequestCustomer[]>([]);
  const [templates, setTemplates] = useState<PassportRequestTemplate[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [messageBody, setMessageBody] = useState('');
  const [channel, setChannel] = useState<ChannelOption>('SMS');
  const [expiresInHours, setExpiresInHours] = useState<number>(72);
  const [lastResult, setLastResult] = useState<SendResultResponse | null>(null);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchDropdownRef = useRef<HTMLLabelElement | null>(null);

  const selectedTemplates = useMemo(() => {
    if (selectedTemplateId === null) return null;
    return templates.find((tpl) => tpl.id === selectedTemplateId) ?? null;
  }, [selectedTemplateId, templates]);

  const selectedCustomers = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    return customers.filter((customer) => selectedSet.has(customer.id));
  }, [customers, selectedIds]);

  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/passport-request/templates', {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('템플릿을 불러올 수 없습니다.');
      }
      const data = await res.json();
      if (data.ok && Array.isArray(data.templates)) {
        setTemplates(data.templates);
        if (data.templates.length > 0) {
          const defaultTemplate = data.templates.find((tpl: PassportRequestTemplate) => tpl.isDefault);
          const firstTemplate = defaultTemplate ?? data.templates[0];
          setSelectedTemplateId(firstTemplate.id);
          setMessageBody((body) => body || firstTemplate.body || '');
        }
      }
    } catch (error) {
      console.error('[PassportRequest] Load templates error:', error);
      showError('템플릿을 불러오는 중 문제가 발생했습니다.');
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (roleFilter !== 'all') params.set('role', roleFilter);

      const res = await fetch(`/api/admin/passport-request/customers?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('고객 목록을 불러올 수 없습니다.');
      }
      const data = await res.json();
      if (data.ok && Array.isArray(data.data)) {
        setCustomers(data.data);
        setSelectedIds((prev) => prev.filter((id) => data.data.some((item: PassportRequestCustomer) => item.id === id)));
      } else {
        throw new Error('응답 형식이 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('[PassportRequest] Load customers error:', error);
      showError('고객 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, search, statusFilter]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadCustomers();
    }, 350);
    return () => clearTimeout(handler);
  }, [loadCustomers, refreshFlag]);

  useEffect(() => {
    const controller = new AbortController();
    const term = search.trim();

    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/passport-request/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error('검색에 실패했습니다.');
        }
        const data = await res.json();
        if (data.ok && Array.isArray(data.data)) {
          const matches = data.data as SearchMatch[];
          setSearchMatches(matches);
          setIsSearchOpen((prev) => (prev ? matches.length > 0 : prev));
        } else {
          setSearchMatches([]);
          setIsSearchOpen((prev) => (prev ? false : prev));
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('[PassportRequest] 검색 오류:', error);
        }
        setSearchMatches([]);
        setIsSearchOpen((prev) => (prev ? false : prev));
      } finally {
        setSearchLoading(false);
      }
    }, 200);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(target)
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSelectAll = () => {
    if (selectedIds.length === customers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(customers.map((customer) => customer.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  };

  const handleMatchClick = (match: SearchMatch) => {
    const keyword = match.phone?.trim() || match.email?.trim() || match.name?.trim() || '';
    if (keyword) {
      setSearch(keyword);
    }
    setSelectedIds((prev) => (prev.includes(match.id) ? prev : [...prev, match.id]));
    setIsSearchOpen(false);
    setSearchMatches([]);
    setSearchLoading(false);
    searchInputRef.current?.focus();
  };

  const handleTemplateChange = (templateId: number) => {
    setSelectedTemplateId(templateId);
    const template = templates.find((tpl) => tpl.id === templateId);
    if (template) {
      setMessageBody(template.body || '');
    }
  };

  const handleAddMatches = () => {
    if (searchMatches.length === 0) return;
    setSelectedIds((prev) => Array.from(new Set([...prev, ...searchMatches.map((item) => item.id)])));
    setIsSearchOpen(false);
  };

  const handleSend = async () => {
    if (selectedIds.length === 0) {
      showError('먼저 발송할 고객을 선택해주세요.');
      return;
    }
    if (!messageBody.trim()) {
      showError('발송할 메시지 내용을 입력해주세요.');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch('/api/admin/passport-request/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userIds: selectedIds,
          templateId: selectedTemplateId ?? undefined,
          messageBody,
          channel,
          expiresInHours,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.message || '여권 요청 발송에 실패했습니다.');
      }

      setLastResult(data);
      showSuccess(`총 ${selectedIds.length}명 중 ${data.results.filter((item: SendResultItem) => item.success).length}명에게 링크를 생성했습니다.`);
      setRefreshFlag((prev) => prev + 1);
    } catch (error) {
      console.error('[PassportRequest] Send error:', error);
      showError(error instanceof Error ? error.message : '여권 요청 발송 중 오류가 발생했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <section className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-blue-800 flex items-center gap-3">
              <span className="text-4xl">🛂</span>
              여권 요청 관리
            </h1>
            <p className="mt-2 text-base md:text-lg text-gray-600 leading-relaxed">
              선택한 고객에게 여권 제출 링크를 일괄로 발송하고 진행 상태를 한눈에 확인하세요.
            </p>
          </div>
          <button
            onClick={() => setRefreshFlag((prev) => prev + 1)}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition-colors"
          >
            <FiRefreshCw className="mr-2" /> 새로고침
          </button>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          <label className="flex flex-col relative" ref={searchDropdownRef}>
            <span className="text-gray-700 font-semibold mb-2 flex items-center gap-2">
              <FiSearch /> 이름/전화/이메일 검색
            </span>
            <input
              type="text"
              value={search}
              ref={searchInputRef}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(event) => {
                setSearch(event.target.value);
                setIsSearchOpen(true);
              }}
              placeholder="예: 홍길동 또는 010"
              className="px-4 py-3 rounded-xl border-2 border-blue-100 focus:border-blue-500 focus:outline-none text-lg"
            />
            {isSearchOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-blue-200 rounded-xl shadow-xl z-20 max-h-80 overflow-auto">
                <div className="flex items-center justify-between px-4 py-2 border-b border-blue-100 bg-blue-50">
                  <p className="text-sm font-semibold text-blue-700">
                    {search.trim() ? `검색 결과 (${searchMatches.length}명)` : '최근 고객 목록'}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={handleAddMatches}
                      disabled={searchMatches.length === 0}
                      className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
                        searchMatches.length === 0
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      결과 전체 선택
                    </button>
                  </div>
                </div>
                {searchLoading ? (
                  <div className="px-4 py-3 text-sm text-blue-600">검색 중...</div>
                ) : searchMatches.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">검색 결과가 없습니다.</div>
                ) : (
                  <ul className="divide-y divide-blue-50">
                    {searchMatches.map((match) => (
                      <li key={`match-${match.id}`} className="px-4 py-3 hover:bg-blue-50 flex items-center justify-between gap-4">
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleMatchClick(match)}
                          className="flex-1 text-left"
                        >
                          <div className="text-sm text-gray-700">
                            <p className="font-semibold text-gray-900">{match.name ?? '이름 없음'}</p>
                            <p className="text-xs text-gray-500">
                              {match.phone ?? '전화번호 없음'} / {match.email ?? '이메일 없음'}
                            </p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleSelect(match.id);
                          }}
                          className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
                            selectedIds.includes(match.id)
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                          }`}
                        >
                          {selectedIds.includes(match.id) ? '선택됨' : '선택'}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </label>

          <label className="flex flex-col">
            <span className="text-gray-700 font-semibold mb-2">제출 상태</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="px-4 py-3 rounded-xl border-2 border-blue-100 focus:border-blue-500 focus:outline-none text-lg"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col">
            <span className="text-gray-700 font-semibold mb-2">고객 유형</span>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
              className="px-4 py-3 rounded-xl border-2 border-blue-100 focus:border-blue-500 focus:outline-none text-lg"
            >
              <option value="all">전체</option>
              <option value="guide">크루즈가이드 고객</option>
              <option value="mall">크루즈몰 고객</option>
              <option value="test">크루즈테스트 고객</option>
            </select>
          </label>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 flex items-center gap-3">
            <FiUserCheck className="text-blue-600 text-3xl" />
            <div>
              <p className="text-blue-900 font-bold text-xl">선택된 고객</p>
              <p className="text-blue-700 text-lg">{selectedIds.length}명</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === customers.length}
                    onChange={toggleSelectAll}
                    className="w-5 h-5"
                    aria-label="전체 선택"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">고객 정보</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">최근 여행/상태</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">여권 제출</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">최근 발송</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-lg text-gray-500">
                    데이터를 불러오는 중입니다...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-lg text-gray-500">
                    조건에 맞는 고객이 없습니다.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const isSelected = selectedIds.includes(customer.id);
                  const submission = customer.submission;
                  const lastRequest = customer.lastRequest;
                  const roleLabel = customer.role === 'community' ? '크루즈몰 고객' : '크루즈가이드 고객';
                  const isTestCustomer = (customer.customerStatus || '').toLowerCase() === 'test';

                  return (
                    <tr
                      key={customer.id}
                      className={`transition-colors ${isSelected ? 'bg-blue-50/70' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(customer.id)}
                          className="w-5 h-5"
                          aria-label={`${customer.name ?? '이름 없음'} 선택`}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="text-lg font-bold text-gray-900">{customer.name ?? '이름 없음'}</p>
                          <p className="text-sm text-gray-600">{customer.phone ?? '전화번호 없음'}</p>
                          <p className="text-sm text-gray-500">{customer.email ?? '이메일 없음'}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                              {roleLabel}
                            </span>
                            {isTestCustomer && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                테스트 고객
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {customer.latestTrip ? (
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-800">{customer.latestTrip.cruiseName || '여행명 없음'}</p>
                            <p className="text-sm text-gray-600">
                              {customer.latestTrip.startDate ? customer.latestTrip.startDate.slice(0, 10) : '?'} ~{' '}
                              {customer.latestTrip.endDate ? customer.latestTrip.endDate.slice(0, 10) : '?'}
                            </p>
                            {customer.latestTrip.reservationCode && (
                              <p className="text-sm text-gray-500">PNR: {customer.latestTrip.reservationCode}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">여행 정보 없음</p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {submission ? (
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                submission.isSubmitted
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {submission.isSubmitted ? '제출 완료' : '제출 대기'}
                            </span>
                            <p className="text-xs text-gray-500">
                              만료: {submission.tokenExpiresAt.slice(0, 10)}
                            </p>
                            {submission.submittedAt && (
                              <p className="text-xs text-gray-500">
                                제출: {submission.submittedAt.slice(0, 10)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            요청 기록 없음
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {lastRequest ? (
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                lastRequest.status === 'SUCCESS'
                                  ? 'bg-green-100 text-green-700'
                                  : lastRequest.status === 'FAILED'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {lastRequest.status}
                            </span>
                            <p className="text-xs text-gray-500">
                              {lastRequest.sentAt.slice(0, 16).replace('T', ' ')}
                            </p>
                            <p className="text-xs text-gray-500">
                              채널: {lastRequest.messageChannel}
                            </p>
                            <p className="text-xs text-gray-400">
                              담당: {lastRequest.admin?.name ?? '관리자'}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">발송 이력 없음</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-6 space-y-6">
        <h2 className="text-2xl font-bold text-indigo-800 flex items-center gap-3">
          <span className="text-3xl">📝</span>
          메시지 설정 및 발송
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="flex flex-col">
              <span className="text-gray-700 font-semibold mb-2">사용할 템플릿</span>
              <select
                value={selectedTemplateId ?? ''}
                onChange={(event) => handleTemplateChange(Number(event.target.value))}
                className="px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:outline-none text-lg"
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.title} {template.isDefault ? '(기본)' : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col">
              <span className="text-gray-700 font-semibold mb-2">발송 채널</span>
              <select
                value={channel}
                onChange={(event) => setChannel(event.target.value as ChannelOption)}
                className="px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:outline-none text-lg"
              >
                <option value="SMS">SMS (알리고)</option>
                <option value="ALIMTALK">알림톡 (카카오)</option>
              </select>
            </label>

            <label className="flex flex-col">
              <span className="text-gray-700 font-semibold mb-2">링크 만료 시간 (시간 단위)</span>
              <input
                type="number"
                min={1}
                max={24 * 14}
                value={expiresInHours}
                onChange={(event) => setExpiresInHours(Math.max(1, Math.min(24 * 14, Number(event.target.value) || 1)))}
                className="px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:outline-none text-lg"
              />
              <span className="text-xs text-gray-500 mt-1">최대 14일(336시간)까지 지정 가능합니다.</span>
            </label>

            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-sm text-indigo-800 leading-relaxed">
              <p className="font-semibold mb-2">사용 가능한 변수</p>
              <ul className="list-disc list-inside space-y-1">
                <li><code>{`{고객명}`}</code> – 고객 이름</li>
                <li><code>{`{링크}`}</code> – 여권 제출 링크</li>
                <li><code>{`{상품명}`}</code> – 최근 여행/상품 이름</li>
                <li><code>{`{출발일}`}</code> – 최근 여행 출발일</li>
              </ul>
            </div>
          </div>

          <label className="flex flex-col h-full">
            <span className="text-gray-700 font-semibold mb-2">메시지 내용</span>
            <textarea
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
              rows={14}
              className="flex-1 px-4 py-3 rounded-2xl border-2 border-indigo-200 focus:border-indigo-500 focus:outline-none text-lg leading-relaxed"
              placeholder="고객에게 발송할 안내 메시지를 입력하세요."
            />
            <span className="text-xs text-gray-500 mt-2">링크와 고객 이름이 자동으로 삽입됩니다.</span>
          </label>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center gap-3 text-gray-700 text-sm leading-relaxed">
            <FiAlertCircle className="text-yellow-500 text-2xl" />
            <p>
              선택된 고객에게는 즉시 여권 제출 링크가 생성되고 SMS 발송 결과가 기록됩니다. 알림톡 연동은 추후 지원 예정입니다.
            </p>
          </div>
          <button
            onClick={handleSend}
            disabled={isSending}
            className="inline-flex items-center justify-center px-6 py-3 rounded-2xl text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-transform hover:scale-[1.02]"
          >
            {isSending ? (
              <span className="flex items-center gap-2">
                <FiRefreshCw className="animate-spin" /> 발송 준비 중...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <FiSend /> {selectedIds.length}명에게 여권 링크 발송하기
              </span>
            )}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-900">
            <h3 className="text-base font-semibold mb-2">알리고 잔여 발송 건수</h3>
            <ul className="space-y-1">
              <li>📩 SMS: 5,952건</li>
              <li>📝 LMS: 1,930건</li>
              <li>🖼 MMS: 833건</li>
            </ul>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-900">
            <h3 className="text-base font-semibold mb-2">카카오 알림톡 잔여 건수</h3>
            <ul className="space-y-1">
              <li>🔔 알림톡: 7,692건</li>
              <li>💬 친구톡 (텍스트): 4,000건</li>
              <li>🖼 친구톡 (이미지): 2,564건</li>
            </ul>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl text-sm text-yellow-900 leading-relaxed">
          <p className="font-semibold mb-2">⚠️ 광고 문자 발송 시 유의사항</p>
          <ul className="list-disc list-inside space-y-1">
            <li>수신 동의(개인정보 마케팅 활용 동의)를 받은 고객에게만 발송하세요.</li>
            <li>문자 앞에는 <code>(광고)</code> 문구가 포함되고 080 수신거부 번호가 함께 발송됩니다.</li>
            <li>야간(20:00~08:00) 발송은 제한되며, 야간 광고 사전 동의를 받은 고객에게만 허용됩니다.</li>
            <li>중복으로 등록된 API 키나 발신번호가 있다면 관리자 정보에서 하나만 남겨주세요.</li>
          </ul>
        </div>
      </section>

      {lastResult && (
        <section className="bg-white rounded-2xl shadow-lg border border-green-100 p-6 space-y-4">
          <h3 className="text-2xl font-bold text-green-700 flex items-center gap-3">
            <FiCheckCircle className="text-3xl" /> 최신 발송 결과
          </h3>

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-green-900">
              <p className="text-sm font-semibold">발송 채널</p>
              <p className="text-xl font-bold mt-1">{formatChannelLabel(lastResult.channel)}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-green-900">
              <p className="text-sm font-semibold">만료 시간</p>
              <p className="text-xl font-bold mt-1">{lastResult.expiresInHours}시간</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-green-900">
              <p className="text-sm font-semibold">성공/실패</p>
              <p className="text-xl font-bold mt-1">
                {lastResult.results.filter((item) => item.success).length}명 성공 /{' '}
                {lastResult.results.filter((item) => !item.success).length}명 실패
              </p>
            </div>
            {typeof lastResult.remainingCash === 'number' && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-green-900">
                <p className="text-sm font-semibold">잔여 포인트</p>
                <p className="text-xl font-bold mt-1">{lastResult.remainingCash.toLocaleString()} P</p>
              </div>
            )}
          </div>

          {lastResult.lowBalance && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
              <p className="font-semibold mb-1">⚠️ 알리고 잔여 포인트가 설정한 임계값 이하입니다.</p>
              <p>포인트를 충전하거나 발송량을 조절해주세요.</p>
            </div>
          )}

          {lastResult.aligoRemain && (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="bg-white border border-green-100 rounded-2xl p-4 text-sm text-green-900 shadow-sm">
                <p className="font-semibold mb-1">SMS 잔여 건수</p>
                <p className="text-lg font-bold">{lastResult.aligoRemain.SMS_CNT ? Number(lastResult.aligoRemain.SMS_CNT).toLocaleString() : '정보 없음'}</p>
              </div>
              <div className="bg-white border border-green-100 rounded-2xl p-4 text-sm text-green-900 shadow-sm">
                <p className="font-semibold mb-1">LMS 잔여 건수</p>
                <p className="text-lg font-bold">{lastResult.aligoRemain.LMS_CNT ? Number(lastResult.aligoRemain.LMS_CNT).toLocaleString() : '정보 없음'}</p>
              </div>
              <div className="bg-white border border-green-100 rounded-2xl p-4 text-sm text-green-900 shadow-sm">
                <p className="font-semibold mb-1">MMS 잔여 건수</p>
                <p className="text-lg font-bold">{lastResult.aligoRemain.MMS_CNT ? Number(lastResult.aligoRemain.MMS_CNT).toLocaleString() : '정보 없음'}</p>
              </div>
            </div>
          )}

          {lastResult.missingUserIds.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-yellow-800 text-sm">
              선택한 고객 중 {lastResult.missingUserIds.length}명은 찾을 수 없어 제외되었습니다. (ID: {lastResult.missingUserIds.join(', ')})
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border border-green-200">
            <table className="min-w-full divide-y divide-green-200">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-green-900">고객 ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-green-900">결과</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-green-900">비고</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-green-100">
                {lastResult.results.map((item) => (
                  <tr key={item.userId}>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.userId}</td>
                    <td className="px-4 py-3">
                      {item.success ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          성공
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          실패
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.success ? (
                        <div className="space-y-1">
                          <p>제출 링크: <span className="text-blue-600 break-all">{item.link}</span></p>
                          {item.submissionId && (
                            <p className="text-xs text-gray-500">제출 ID: {item.submissionId}</p>
                          )}
                          {item.messageId && (
                            <p className="text-xs text-gray-500">알리고 메시지 ID: {item.messageId}</p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1 text-sm">
                          <p>{item.error ?? '오류 이유 없음'}</p>
                          {item.resultCode && (
                            <p className="text-xs text-gray-500">오류 코드: {item.resultCode}</p>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
