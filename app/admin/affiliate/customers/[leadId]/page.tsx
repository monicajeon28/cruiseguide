// app/admin/affiliate/customers/[leadId]/page.tsx
// 고객 상세 페이지 - 여권 요청, 상태 변경, 상호작용 기록

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  FiArrowLeft,
  FiEdit2,
  FiSave,
  FiX,
  FiUser,
  FiPhone,
  FiCalendar,
  FiFileText,
  FiUpload,
  FiPaperclip,
  FiCheckCircle,
  FiClock,
  FiMessageCircle,
  FiTrash2,
  FiDownload,
  FiImage,
} from 'react-icons/fi';
import { showError, showSuccess } from '@/components/ui/Toast';

type AffiliateLead = {
  id: number;
  customerName: string | null;
  customerPhone: string | null;
  status: string;
  notes: string | null;
  passportRequestedAt: string | null;
  passportCompletedAt: string | null;
  lastContactedAt: string | null;
  createdAt: string;
  manager: {
    id: number;
    affiliateCode: string | null;
    displayName: string | null;
  } | null;
  agent: {
    id: number;
    affiliateCode: string | null;
    displayName: string | null;
  } | null;
  interactions: Array<{
    id: number;
    interactionType: string;
    occurredAt: string;
    note: string | null;
    createdBy: {
      id: number;
      name: string | null;
    };
    media: Array<{
      id: number;
      fileName: string | null;
      fileSize: number | null;
      mimeType: string | null;
      storagePath: string;
    }>;
  }>;
  sales: Array<{
    id: number;
    productCode: string;
    saleAmount: number | null;
    status: string;
    saleDate: string | null;
  }>;
  passportSubmissions?: Array<{
    id: number;
    driveFolderUrl: string | null;
    submittedAt: string | null;
    guests: Array<{
      id: number;
      name: string;
      passportNumber: string | null;
      passportExpiryDate: string | null;
    }>;
  }>;
};

const STATUS_OPTIONS = [
  { value: 'NEW', label: '신규' },
  { value: 'CONTACTED', label: '연락됨' },
  { value: 'IN_PROGRESS', label: '진행중' },
  { value: 'PURCHASED', label: '구매완료' },
  { value: 'REFUNDED', label: '환불' },
  { value: 'CLOSED', label: '종료' },
  { value: 'TEST_GUIDE', label: '지니가이드 체험중' },
];

const INTERACTION_TYPES = [
  { value: 'PHONE_CALL', label: '전화 통화' },
  { value: 'EMAIL', label: '이메일' },
  { value: 'MESSAGE', label: '메시지' },
  { value: 'MEETING', label: '대면 미팅' },
  { value: 'NOTE', label: '메모' },
  { value: 'OTHER', label: '기타' },
];

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params?.leadId as string;

  const [lead, setLead] = useState<AffiliateLead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingInteraction, setIsAddingInteraction] = useState(false);
  const [saving, setSaving] = useState(false);

  // 편집 폼 상태
  const [editForm, setEditForm] = useState({
    customerName: '',
    customerPhone: '',
  });

  // 상호작용 추가 폼 상태
  const [interactionForm, setInteractionForm] = useState({
    interactionType: 'PHONE_CALL',
    occurredAt: new Date().toISOString().slice(0, 16),
    note: '',
    files: [] as File[],
  });

  useEffect(() => {
    if (leadId) {
      loadLead();
    }
  }, [leadId]);

  const loadLead = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/affiliate/leads/${leadId}`);
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '고객 정보를 불러오지 못했습니다.');
      }
      setLead(json.lead);
      setEditForm({
        customerName: json.lead.customerName || '',
        customerPhone: json.lead.customerPhone || '',
      });
    } catch (error: any) {
      console.error('[CustomerDetail] load error', error);
      showError(error.message || '고객 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCustomerInfo = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/affiliate/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: editForm.customerName || null,
          customerPhone: editForm.customerPhone || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '고객 정보 수정에 실패했습니다.');
      }

      showSuccess('고객 정보가 수정되었습니다.');
      setIsEditing(false);
      loadLead();
    } catch (error: any) {
      console.error('[CustomerDetail] save error', error);
      showError(error.message || '고객 정보 수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestPassport = async () => {
    if (!confirm('고객에게 여권 요청을 전송하시겠습니까?')) {
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/admin/affiliate/leads/${leadId}/request-passport`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '여권 정보가 필요합니다.' }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '여권 요청에 실패했습니다.');
      }

      showSuccess('여권 요청이 전송되었습니다.');
      loadLead();
    } catch (error: any) {
      console.error('[CustomerDetail] passport request error', error);
      showError(error.message || '여권 요청 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/affiliate/leads/${leadId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '상태 변경에 실패했습니다.');
      }

      showSuccess('고객 상태가 변경되었습니다.');
      loadLead();
    } catch (error: any) {
      console.error('[CustomerDetail] status change error', error);
      showError(error.message || '상태 변경 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddInteraction = async () => {
    try {
      setSaving(true);

      // 1. 상호작용 기록 생성
      const interactionRes = await fetch('/api/admin/affiliate/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: Number(leadId),
          interactionType: interactionForm.interactionType,
          occurredAt: new Date(interactionForm.occurredAt).toISOString(),
          note: interactionForm.note || null,
        }),
      });

      const interactionJson = await interactionRes.json();
      if (!interactionRes.ok || !interactionJson.ok) {
        throw new Error(interactionJson.message || '상호작용 기록 생성에 실패했습니다.');
      }

      const interactionId = interactionJson.interaction.id;

      // 2. 파일 업로드 (있는 경우)
      if (interactionForm.files.length > 0) {
        for (const file of interactionForm.files) {
          const formData = new FormData();
          formData.append('file', file);

          const uploadRes = await fetch(`/api/admin/affiliate/interactions/${interactionId}/upload`, {
            method: 'POST',
            body: formData,
          });

          const uploadJson = await uploadRes.json();
          if (!uploadRes.ok || !uploadJson.ok) {
            console.error('File upload failed:', uploadJson.message);
            // 파일 업로드 실패해도 상호작용 기록은 저장됨
          }
        }
      }

      showSuccess('상호작용 기록이 추가되었습니다.');
      setIsAddingInteraction(false);
      setInteractionForm({
        interactionType: 'PHONE_CALL',
        occurredAt: new Date().toISOString().slice(0, 16),
        note: '',
        files: [],
      });
      loadLead();
    } catch (error: any) {
      console.error('[CustomerDetail] add interaction error', error);
      showError(error.message || '상호작용 기록 추가 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-50 text-blue-700';
      case 'CONTACTED':
        return 'bg-yellow-50 text-yellow-700';
      case 'IN_PROGRESS':
        return 'bg-purple-50 text-purple-700';
      case 'PURCHASED':
        return 'bg-emerald-50 text-emerald-700';
      case 'REFUNDED':
        return 'bg-red-50 text-red-700';
      case 'TEST_GUIDE':
        return 'bg-indigo-50 text-indigo-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    return STATUS_OPTIONS.find((opt) => opt.value === status)?.label || status;
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">고객 정보를 불러오는 중입니다...</div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-8">
        <div className="text-center text-red-500">고객 정보를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
        >
          <FiArrowLeft className="text-base" />
          돌아가기
        </button>
        <h1 className="text-2xl font-extrabold text-gray-900">고객 상세 정보</h1>
      </div>

      {/* 고객 기본 정보 */}
      <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">기본 정보</h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              <FiEdit2 className="text-base" />
              수정
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditForm({
                    customerName: lead.customerName || '',
                    customerPhone: lead.customerPhone || '',
                  });
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                <FiX className="text-base" />
                취소
              </button>
              <button
                onClick={handleSaveCustomerInfo}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-blue-700 disabled:bg-blue-300"
              >
                <FiSave className="text-base" />
                저장
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">고객명</label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.customerName}
                onChange={(e) => setEditForm((prev) => ({ ...prev, customerName: e.target.value }))}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            ) : (
              <div className="text-sm text-gray-900">{lead.customerName || '이름 없음'}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">전화번호</label>
            {isEditing ? (
              <input
                type="tel"
                value={editForm.customerPhone}
                onChange={(e) => setEditForm((prev) => ({ ...prev, customerPhone: e.target.value }))}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            ) : (
              <div className="text-sm text-gray-900">{lead.customerPhone || '-'}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">담당자</label>
            <div className="space-y-2">
              {lead.manager && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                    대리점장
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {lead.manager.displayName || lead.manager.affiliateCode || '이름 없음'}
                  </span>
                </div>
              )}
              {lead.agent && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                    판매원
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {lead.agent.displayName || lead.agent.affiliateCode || '이름 없음'}
                  </span>
                </div>
              )}
              {!lead.manager && !lead.agent && (
                <span className="text-sm text-gray-400">담당자 없음</span>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">등록일</label>
            <div className="text-sm text-gray-900">
              {new Date(lead.createdAt).toLocaleString('ko-KR')}
            </div>
          </div>
        </div>
      </section>

      {/* 상태 및 여권 관리 */}
      <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">상태 관리</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">현재 상태</label>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(lead.status)}`}
              >
                {getStatusLabel(lead.status)}
              </span>
            </div>
            <select
              value={lead.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">여권 상태</label>
            {lead.passportCompletedAt ? (
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  <FiCheckCircle />
                  완료됨
                </div>
                {/* 여권 이미지 표시 */}
                {lead.passportSubmissions && lead.passportSubmissions.length > 0 && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FiImage className="text-blue-500" />
                      여권 정보
                    </h4>
                    {lead.passportSubmissions.map((submission) => (
                      <div key={submission.id} className="space-y-2">
                        {submission.driveFolderUrl && (
                          <a
                            href={submission.driveFolderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            <FiDownload />
                            구글 드라이브 폴더 열기
                          </a>
                        )}
                        {submission.guests.length > 0 && (
                          <div className="space-y-1">
                            {submission.guests.map((guest) => (
                              <div key={guest.id} className="text-xs text-gray-600">
                                <span className="font-semibold">{guest.name}</span>
                                {guest.passportNumber && (
                                  <span className="ml-2">여권번호: {guest.passportNumber}</span>
                                )}
                                {guest.passportExpiryDate && (
                                  <span className="ml-2">
                                    만료일: {new Date(guest.passportExpiryDate).toLocaleDateString('ko-KR')}
                                    {(() => {
                                      const expiryDate = new Date(guest.passportExpiryDate);
                                      const sixMonthsLater = new Date();
                                      sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
                                      if (expiryDate <= sixMonthsLater) {
                                        return (
                                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                                            <FiClock className="text-xs" />
                                            만료 임박
                                          </span>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {submission.submittedAt && (
                          <div className="text-xs text-gray-500">
                            제출일: {new Date(submission.submittedAt).toLocaleString('ko-KR')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : lead.passportRequestedAt ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-4 py-2 text-sm font-semibold text-yellow-700">
                <FiClock />
                요청됨 (본사 확인 대기중)
              </div>
            ) : (
              <button
                onClick={handleRequestPassport}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-blue-700 disabled:bg-blue-300"
              >
                <FiFileText />
                여권 요청
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 상호작용 기록 */}
      <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">상호작용 기록</h2>
          {!isAddingInteraction && (
            <button
              onClick={() => setIsAddingInteraction(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-blue-700"
            >
              <FiMessageCircle />
              기록 추가
            </button>
          )}
        </div>

        {/* 상호작용 추가 폼 */}
        {isAddingInteraction && (
          <div className="mb-6 p-4 border border-blue-200 rounded-xl bg-blue-50">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    상호작용 유형
                  </label>
                  <select
                    value={interactionForm.interactionType}
                    onChange={(e) =>
                      setInteractionForm((prev) => ({ ...prev, interactionType: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    {INTERACTION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">발생 일시</label>
                  <input
                    type="datetime-local"
                    value={interactionForm.occurredAt}
                    onChange={(e) =>
                      setInteractionForm((prev) => ({ ...prev, occurredAt: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">메모</label>
                <textarea
                  value={interactionForm.note}
                  onChange={(e) =>
                    setInteractionForm((prev) => ({ ...prev, note: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="상호작용 내용을 입력하세요..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  파일 첨부 (녹음본, 카톡 스크린샷 등)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  accept="image/*,audio/*,video/*,application/pdf"
                />
                {interactionForm.files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {interactionForm.files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg bg-gray-100 px-3 py-2 text-sm"
                      >
                        <span>{file.name}</span>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <FiX />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsAddingInteraction(false);
                    setInteractionForm({
                      interactionType: 'PHONE_CALL',
                      occurredAt: new Date().toISOString().slice(0, 16),
                      note: '',
                      files: [],
                    });
                  }}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  취소
                </button>
                <button
                  onClick={handleAddInteraction}
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {saving ? '저장 중...' : '저장하기'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 상호작용 목록 */}
        <div className="space-y-3">
          {lead.interactions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">상호작용 기록이 없습니다.</div>
          ) : (
            lead.interactions.map((interaction) => (
              <div
                key={interaction.id}
                className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {INTERACTION_TYPES.find((t) => t.value === interaction.interactionType)?.label ||
                          interaction.interactionType}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(interaction.occurredAt).toLocaleString('ko-KR')}
                      </span>
                      <span className="text-xs text-gray-500">
                        by {interaction.createdBy.name || 'Unknown'}
                      </span>
                    </div>
                    {interaction.note && (
                      <div className="text-sm text-gray-700 mb-2">{interaction.note}</div>
                    )}
                    {interaction.media.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {interaction.media.map((media) => (
                          <a
                            key={media.id}
                            href={media.storagePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                          >
                            <FiPaperclip />
                            {media.fileName || '파일'}
                            {media.fileSize && (
                              <span className="text-gray-500">
                                ({(media.fileSize / 1024).toFixed(1)} KB)
                              </span>
                            )}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 판매 이력 */}
      {lead.sales.length > 0 && (
        <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">판매 이력</h2>
          <div className="space-y-2">
            {lead.sales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between border border-gray-200 rounded-xl p-4"
              >
                <div>
                  <div className="text-sm font-semibold text-gray-900">{sale.productCode}</div>
                  {sale.saleDate && (
                    <div className="text-xs text-gray-500">
                      {new Date(sale.saleDate).toLocaleDateString('ko-KR')}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  {sale.saleAmount && (
                    <div className="text-sm font-semibold text-gray-900">
                      {sale.saleAmount.toLocaleString()}원
                    </div>
                  )}
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                      sale.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {sale.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
