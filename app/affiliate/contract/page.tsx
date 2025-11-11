'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import SignaturePad from 'signature_pad';


function dataUrlToFile(dataUrl: string, defaultName: string) {
  const parts = dataUrl.split(',');
  if (parts.length < 2) {
    throw new Error('잘못된 데이터 URL 형식입니다.');
  }
  const match = parts[0].match(/data:(.*?);base64/);
  const mimeType = match?.[1] || 'image/png';
  const binaryString = atob(parts[1]);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new File([bytes], defaultName, { type: mimeType });
}

const INITIAL_FORM = {
  name: '',
  phone: '',
  email: '',
  residentIdFront: '',
  residentIdBack: '',
  address: '',
  bankName: '',
  bankAccount: '',
  bankAccountHolder: '',
  signatureUrl: '',
  signatureOriginalName: '',
  signatureFileId: '',
  consentPrivacy: false,
  consentNonCompete: false,
  consentDbUse: false,
  consentPenalty: false,
};

const CONTRACT_SECTIONS: Array<{ title: string; clauses: string[] }> = [
  {
    title: '제1조 (목적)',
    clauses: [
      '본 계약은 주식회사 크루즈닷(이하 "갑")과 계약 신청자(이하 "을")가 크루즈 상품 판매를 위한 어필리에이트 활동을 수행함에 있어 필요한 권리와 의무를 명확히 함을 목적으로 합니다.',
    ],
  },
  {
    title: '제2조 (정의)',
    clauses: [
      '"어필리에이트 활동"이라 함은 갑이 제공하는 상품, 서비스 및 프로모션을 을이 소개·판매·중개하는 일체의 영업 행위를 의미합니다.',
      '"고객 DB"라 함은 갑이 직접 보유하거나 을을 통해 수집된 고객의 개인정보, 여행 이력, 상담 내역 및 판매 성과 데이터를 말합니다.',
    ],
  },
  {
    title: '제3조 (을의 역할과 의무)',
    clauses: [
      '을은 갑이 제공한 최신 상품 정보와 가격 정책을 정확히 전달하며, 허위·과장 광고를 하지 않습니다.',
      '을은 고객 상담, 예약, 결제 안내 등 판매 과정에서 필요한 절차를 성실히 수행하고, 고객 문의에 신속히 대응합니다.',
      '을은 갑이 지정한 교육 프로그램을 이수하고, 변경된 정책 및 지침을 즉시 반영합니다.',
    ],
  },
  {
    title: '제4조 (수수료 및 정산)',
    clauses: [
      '을의 활동으로 발생한 매출에 대해서는 갑이 사전에 고지한 커미션 정책에 따라 수수료가 산정됩니다.',
      '정산은 매월 말일 기준으로 집계하며, 갑은 익월 30일 이내에 을이 지정한 계좌로 지급합니다.',
      '고객의 취소·환불·미납 등이 발생할 경우, 해당 금액은 차기 정산분에서 공제하거나 환수할 수 있습니다.',
    ],
  },
  {
    title: '제5조 (고객 정보 보호 및 활용 제한)',
    clauses: [
      '을은 고객 DB를 계약 목적 외 용도로 이용하거나 제3자에게 제공·유출해서는 안 됩니다.',
      '계약 종료 시 을은 보유 중인 고객 DB를 즉시 반환하거나 복구 불가능한 방법으로 파기해야 하며, 이를 준수하지 않을 경우 손해배상 책임을 집니다.',
      '고객 동의 없이 타사 상품 홍보, 리크루팅, 스팸성 메시지 발송 등을 금지합니다.',
    ],
  },
  {
    title: '제6조 (교육, 자료 및 브랜드 사용)',
    clauses: [
      '갑은 을에게 필요한 교육 자료, 영업 가이드, 마케팅 콘텐츠를 제공할 수 있으며, 을은 해당 자료를 변형 없이 사용합니다.',
      '을은 갑의 상호, 로고, 브랜드 자산을 허가된 용도 내에서만 사용할 수 있으며, 별도 승인 없이 상업적 2차 제작물을 만들 수 없습니다.',
    ],
  },
  {
    title: '제7조 (계약 기간 및 해지)',
    clauses: [
      '본 계약의 유효기간은 서명일로부터 1년이며, 어느 일방의 서면 해지 통지가 없는 경우 동일 조건으로 자동 연장됩니다.',
      '갑 또는 을은 상대방이 계약을 위반하거나 신뢰를 훼손하는 행위를 한 경우 즉시 해지할 수 있습니다.',
      '계약이 해지되는 경우 을은 진행 중인 고객 상담과 판매 건에 대해 갑의 지침을 따르며, 미정산 수수료는 확정 후 지급·조정합니다.',
    ],
  },
  {
    title: '제8조 (손해배상 및 위약벌)',
    clauses: [
      '을이 고객 DB 무단 활용, 허위·과장 광고, 금품 요구 등의 행위를 하여 갑 또는 고객에게 피해가 발생한 경우, 을은 전액 배상하여야 합니다.',
      '을이 경업 금지 조항을 위반하거나 갑의 영업상 기밀을 유출한 경우, 갑은 발생한 손해와 별도로 위약벌(매출의 3배 이내)을 청구할 수 있습니다.',
    ],
  },
  {
    title: '제9조 (기타 및 준거법)',
    clauses: [
      '본 계약에 명시되지 않은 사항은 갑의 운영 정책과 관련 법령, 그리고 상관례에 따릅니다.',
      '본 계약과 관련하여 분쟁이 발생할 경우, 갑의 본사 소재지를 관할하는 법원을 1심 전속 관할 법원으로 합니다.',
    ],
  },
  {
    title: '부칙',
    clauses: [
      '본 계약은 전자 서명 제출일에 효력이 발생하며, 갑의 승인을 통해 최종 확정됩니다.',
      '갑은 필요 시 정책 변동 사항을 을에게 사전 통지하며, 통지일로부터 7일 이내에 이의 제기가 없을 경우 변경 사항에 동의한 것으로 간주합니다.',
    ],
  },
];

export default function AffiliateContractPublicPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [signatureStatus, setSignatureStatus] = useState('');
  const [showContractModal, setShowContractModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState('');
  const searchParams = useSearchParams();
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const invitedBy = useMemo(() => {
    const value = searchParams?.get('invitedBy');
    if (!value) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }, [searchParams]);

  useEffect(() => {
    if (!showSignatureModal) {
      signaturePadRef.current?.off();
      signaturePadRef.current = null;
      return;
    }

    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      const context = canvas.getContext('2d');
      if (context) {
        context.scale(ratio, ratio);
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
      }
    };

    resizeCanvas();

    const pad = new SignaturePad(canvas, {
      backgroundColor: '#ffffff',
      penColor: '#2563eb',
      minWidth: 1.5,
      maxWidth: 3,
    });

    signaturePadRef.current = pad;

    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      pad.off();
      signaturePadRef.current = null;
    };
  }, [showSignatureModal]);

  const updateField = useCallback((key: keyof typeof INITIAL_FORM, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleFormReset = useCallback(() => {
    setForm({ ...INITIAL_FORM });
    setSignaturePreview('');
    setSignatureStatus('');
    setUploadingSignature(false);
    setShowSignatureModal(false);
  }, []);

  const uploadSignature = useCallback(
    async (file: File, options?: { previewDataUrl?: string }) => {
      setUploadingSignature(true);
      setSignatureStatus('');
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);

        const response = await fetch('/api/affiliate/contracts/upload?type=signature', {
          method: 'POST',
          body: formData,
        });

        const json = await response.json();
        if (!response.ok || !json?.ok) {
          throw new Error(json?.message || '파일 업로드에 실패했습니다.');
        }

        // Validate that we received all required data
        if (!json.url || !json.fileId) {
          throw new Error('업로드가 완료되었지만 파일 정보를 받지 못했습니다. 다시 시도해주세요.');
        }

        const originalName = json.originalName || file.name;

        updateField('signatureUrl', json.url);
        updateField('signatureOriginalName', originalName);
        updateField('signatureFileId', json.fileId);
        if (options?.previewDataUrl) {
          setSignaturePreview(options.previewDataUrl);
        }

        setSignatureStatus(`✓ 업로드 완료 (${originalName})`);
        return true;
      } catch (error: any) {
        console.error('[AffiliateContractPublic] signature upload error', error);
        const message = error?.message || '파일 업로드 중 오류가 발생했습니다.';
        alert(`싸인 업로드 실패: ${message}\n\n다시 시도해주세요.`);
        setSignatureStatus(`❌ 업로드 실패: ${message}`);
        // Clear any partial data
        updateField('signatureUrl', '');
        updateField('signatureOriginalName', '');
        updateField('signatureFileId', '');
        return false;
      } finally {
        setUploadingSignature(false);
      }
    },
    [updateField],
  );

  const handleSignatureModalClose = useCallback(() => {
    setShowSignatureModal(false);
    signaturePadRef.current?.clear();
  }, []);

  const handleSignatureSave = useCallback(async () => {
    const pad = signaturePadRef.current;
    if (!pad) return;
    if (pad.isEmpty()) {
      alert('싸인을 먼저 입력해주세요.');
      return;
    }
    try {
      const dataUrl = pad.toDataURL('image/png');
      const fileName = `affiliate-signature-${Date.now()}.png`;
      const file = dataUrlToFile(dataUrl, fileName);
      const success = await uploadSignature(file, { previewDataUrl: dataUrl });
      if (success) {
        handleSignatureModalClose();
      }
    } catch (error) {
      console.error('[AffiliateContractPublic] signature save error', error);
      alert('싸인 이미지를 처리하는 중 문제가 발생했습니다. 다시 시도해주세요.');
    }
  }, [handleSignatureModalClose, uploadSignature]);

  const handleSignatureClear = useCallback(() => {
    signaturePadRef.current?.clear();
  }, []);

  const handleSignatureReset = useCallback(() => {
    updateField('signatureUrl', '');
    updateField('signatureOriginalName', '');
    updateField('signatureFileId', '');
    setSignaturePreview('');
    setSignatureStatus('');
  }, [updateField]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (uploadingSignature) {
      alert('싸인 업로드가 완료될 때까지 기다려주세요.');
      return;
    }

    if (!form.name.trim() || !form.phone.trim() || !form.residentIdFront.trim() || !form.residentIdBack.trim() || !form.address.trim()) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    if (![form.consentPrivacy, form.consentNonCompete, form.consentDbUse, form.consentPenalty].every(Boolean)) {
      alert('모든 필수 동의 항목에 체크해주세요.');
      return;
    }

    if (!form.signatureUrl.trim() || !form.signatureFileId.trim()) {
      alert('계약서에 싸인을 그린 후 반드시 저장해주세요.\n\n"싸인 그리기" 버튼을 눌러 싸인을 입력하고 저장하세요.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/affiliate/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, invitedByProfileId: invitedBy ?? undefined }),
      });

      const json = await response.json();
      if (!response.ok || !json?.ok) {
        throw new Error(json?.message || '서버 오류가 발생했습니다.');
      }

      alert('계약서가 접수되었습니다. 본사에서 확인 후 연락드릴 예정입니다.');
      handleFormReset();
    } catch (error: any) {
      console.error('[AffiliateContractPublic] submit error', error);
      alert(error.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
      <div className="mx-auto w-full max-w-3xl px-4 pt-12">
        <header className="mb-8 rounded-3xl bg-white/90 p-6 shadow-sm">
          <h1 className="text-2xl font-extrabold text-slate-900">크루즈닷 어필리에이트 계약서 접수</h1>
          <p className="mt-2 text-sm text-slate-600">
            계약서 전문을 확인한 뒤 전자 서명을 남겨 제출해주세요. 서명 이미지는 안전하게 저장되어 관리자 검토 시 함께 표시됩니다.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowContractModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              계약서 전문 보기
            </button>
            <button
              type="button"
              onClick={() => setShowSignatureModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              싸인 입력하기
            </button>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-3xl bg-white/90 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">기본 정보</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span className="font-semibold">성명 *</span>
                <input
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="예: 홍길동"
                  className="rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span className="font-semibold">연락처 *</span>
                <input
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="010-0000-0000"
                  className="rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span className="font-semibold">이메일</span>
                <input
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="example@cruisedot.com"
                  className="rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  type="email"
                />
              </label>
              <div className="grid grid-cols-5 gap-2">
                <label className="col-span-2 flex flex-col gap-1 text-sm text-slate-700">
                  <span className="font-semibold">주민등록번호 앞 6자리 *</span>
                  <input
                    value={form.residentIdFront}
                    onChange={(e) => updateField('residentIdFront', e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="예: 900101"
                    className="rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </label>
                <label className="col-span-3 flex flex-col gap-1 text-sm text-slate-700">
                  <span className="font-semibold">주민등록번호 뒤 7자리 *</span>
                  <input
                    value={form.residentIdBack}
                    onChange={(e) => updateField('residentIdBack', e.target.value.replace(/[^0-9]/g, '').slice(0, 7))}
                    placeholder="예: 1234567"
                    className="rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </label>
              </div>
              <label className="md:col-span-2 flex flex-col gap-1 text-sm text-slate-700">
                <span className="font-semibold">주소 *</span>
                <textarea
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  rows={2}
                  placeholder="도로명 주소를 입력해주세요"
                  className="rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl bg-white/90 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">정산 계좌 정보</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span className="font-semibold">은행명</span>
                <input
                  value={form.bankName}
                  onChange={(e) => updateField('bankName', e.target.value)}
                  placeholder="예: 국민은행"
                  className="rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span className="font-semibold">계좌번호</span>
                <input
                  value={form.bankAccount}
                  onChange={(e) => updateField('bankAccount', e.target.value)}
                  placeholder="예: 123456-78-901234"
                  className="rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span className="font-semibold">예금주</span>
                <input
                  value={form.bankAccountHolder}
                  onChange={(e) => updateField('bankAccountHolder', e.target.value)}
                  placeholder="예: 홍길동"
                  className="rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl bg-white/90 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">계약서 싸인</h2>
            <div className="space-y-4 text-sm text-slate-700">
              <div className="rounded-2xl bg-slate-100 p-4 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">전자 서명 안내</p>
                <p className="mt-2">싸인을 저장하면 전자 계약서에 자동 첨부되며, 본사 검토 페이지에서도 동일하게 확인할 수 있습니다.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowSignatureModal(true)}
                  disabled={uploadingSignature}
                  className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                >
                  {uploadingSignature ? '저장 중...' : '싸인 그리기'}
                </button>
                {form.signatureUrl && form.signatureFileId && (
                  <>
                    <button
                      type="button"
                      onClick={handleSignatureReset}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      싸인 초기화
                    </button>
                    <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {form.signatureOriginalName || '싸인 저장됨'}
                    </span>
                  </>
                )}
              </div>

              {signaturePreview && form.signatureUrl && (
                <div className="rounded-2xl border-2 border-green-200 bg-green-50/30 p-4">
                  <p className="mb-2 text-xs font-semibold text-green-800">저장된 싸인 미리보기:</p>
                  <div className="rounded-lg bg-white p-3 shadow-sm">
                    <img src={signaturePreview} alt="서명 미리보기" className="h-32 w-auto" />
                  </div>
                </div>
              )}

              {signatureStatus && (
                <p className={`rounded-lg p-3 text-sm font-medium ${
                  signatureStatus.startsWith('❌')
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  {signatureStatus}
                </p>
              )}
            </div>
          </section>

          <section className="rounded-3xl bg-white/90 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">필수 동의</h2>
            <div className="space-y-3 text-sm text-slate-700">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.consentPrivacy}
                  onChange={(e) => updateField('consentPrivacy', e.target.checked)}
                  className="mt-1 h-4 w-4"
                  required
                />
                <span>
                  <span className="font-semibold">개인정보 및 고객 DB 사용 제한에 동의합니다.</span>
                  <br />제4조, 제3조에 따라 제공받은 고객 정보는 계약 목적 외 사용하지 않으며, 계약 종료 시 즉시 파기합니다.
                </span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.consentNonCompete}
                  onChange={(e) => updateField('consentNonCompete', e.target.checked)}
                  className="mt-1 h-4 w-4"
                  required
                />
                <span>
                  <span className="font-semibold">경업 및 리크루팅 금지 조항에 동의합니다.</span>
                  <br />계약 기간 및 종료 후 7년간 동종 업계의 무단 영업 활동을 하지 않겠습니다.
                </span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.consentDbUse}
                  onChange={(e) => updateField('consentDbUse', e.target.checked)}
                  className="mt-1 h-4 w-4"
                  required
                />
                <span>
                  <span className="font-semibold">고객 DB 보안 및 반환 의무를 준수합니다.</span>
                  <br />계약 종료 시 회사 지시에 따라 모든 자료를 반환하거나 복구 불가능한 방식으로 파기합니다.
                </span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.consentPenalty}
                  onChange={(e) => updateField('consentPenalty', e.target.checked)}
                  className="mt-1 h-4 w-4"
                  required
                />
                <span>
                  <span className="font-semibold">위반 시 손해배상 및 위약벌 조항을 이해하고 동의합니다.</span>
                  <br />고객 DB 유출, 비밀 유지 위반, 경업 금지 위반 시 위약벌 및 손해배상 책임이 발생함을 확인했습니다.
                </span>
              </label>
            </div>
          </section>

          <div className="rounded-3xl bg-white/90 p-6 shadow-sm text-xs text-slate-500">
            제출하신 자료는 계약 심사 및 파트너 관리 목적에만 사용되며, 내부 보안 정책에 따라 안전하게 보관됩니다.
            {invitedBy ? (
              <p className="mt-2 text-[11px] text-slate-500">※ 이 링크는 초대한 대리점장과 연결됩니다.</p>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleFormReset}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              disabled={submitting}
            >
              초기화
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingSignature}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow hover:bg-blue-700 disabled:bg-blue-300"
            >
              {submitting ? '접수 중...' : '계약서 접수하기'}
            </button>
          </div>
        </form>
      </div>

      {showContractModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4"
          onClick={() => setShowContractModal(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">크루즈닷 어필리에이트 계약서 전문</h3>
              <button
                type="button"
                onClick={() => setShowContractModal(false)}
                className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
              >
                닫기
              </button>
            </div>
            <div className="h-[70vh] overflow-y-auto px-6 py-4 text-sm leading-relaxed text-slate-700 space-y-6">
              {CONTRACT_SECTIONS.map((section) => (
                <div key={section.title} className="space-y-2">
                  <h4 className="font-semibold text-slate-900">{section.title}</h4>
                  <ul className="list-disc space-y-1 pl-5">
                    {section.clauses.map((clause, index) => (
                      <li key={index}>{clause}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className="text-xs text-slate-500">
                ※ 본 계약서는 전자 서명으로 체결되며, 갑(크루즈닷)의 최종 승인을 통해 효력이 발생합니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {showSignatureModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4"
          onClick={handleSignatureModalClose}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">싸인 입력</h3>
              <button
                type="button"
                onClick={handleSignatureModalClose}
                className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
              >
                닫기
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="h-48 w-full overflow-hidden rounded-xl bg-white shadow-inner">
                  <canvas ref={signatureCanvasRef} className="h-full w-full cursor-crosshair rounded-xl" />
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  터치 패드, 마우스, 스타일러스를 이용해 싸인을 입력해주세요. 저장 후에도 언제든 다시 작성할 수 있습니다.
                </p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleSignatureClear}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  다시 그리기
                </button>
                <button
                  type="button"
                  onClick={handleSignatureSave}
                  disabled={uploadingSignature}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {uploadingSignature ? '저장 중...' : '싸인 저장하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

