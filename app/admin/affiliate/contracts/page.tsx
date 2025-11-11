'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FiRefreshCw,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiFileText,
  FiExternalLink,
  FiSend,
  FiCopy,
  FiX,
  FiEye,
  FiTrash2,
} from 'react-icons/fi';
import SignaturePad from 'signature_pad';
import { showError, showSuccess } from '@/components/ui/Toast';
import ContractInviteModal from '@/components/admin/ContractInviteModal';

type AffiliateContract = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  status: 'submitted' | 'approved' | 'rejected';
  submittedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
  residentId: string | null;
  address: string | null;
  bankName: string | null;
  bankAccount: string | null;
  bankAccountHolder: string | null;
  idCardPath: string | null;
  bankbookPath: string | null;
  metadata: any;
  user: {
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    mallUserId: string | null;
  } | null;
  reviewer: {
    id: number;
    name: string | null;
    email: string | null;
  } | null;
  invitedBy: {
    id: number;
    displayName: string | null;
    nickname: string | null;
    type: 'BRANCH_MANAGER' | 'SALES_AGENT' | 'HQ';
    affiliateCode: string;
    branchLabel: string | null;
    user: {
      id: number;
      name: string | null;
      email: string | null;
      phone: string | null;
      mallUserId: string | null;
    } | null;
  } | null;
};

type AffiliateProfile = {
  id: number;
  userId: number;
  affiliateCode: string;
  type: 'BRANCH_MANAGER' | 'SALES_AGENT' | 'HQ';
  displayName: string | null;
  nickname: string | null;
  user: {
    mallUserId: string | null;
  } | null;
};

const STATUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'submitted', label: '제출됨' },
  { value: 'approved', label: '승인됨' },
  { value: 'rejected', label: '거부됨' },
] as const;

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

export default function AdminAffiliateContractsPage() {
  const [contracts, setContracts] = useState<AffiliateContract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
  });
  const [searchInput, setSearchInput] = useState('');
  const [showSendContractModal, setShowSendContractModal] = useState(false);
  const [profiles, setProfiles] = useState<AffiliateProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<AffiliateProfile | null>(null);
  const [contractLink, setContractLink] = useState<string | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [showContractFormModal, setShowContractFormModal] = useState(false);
  const [contractForm, setContractForm] = useState({
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
  });
  const [submittingContract, setSubmittingContract] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState('');
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const [showInviteMessageModal, setShowInviteMessageModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', phone: '' });
  const [inviteMessage, setInviteMessage] = useState('');
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [showContractTextModal, setShowContractTextModal] = useState(false);
  const [contractReadConfirmed, setContractReadConfirmed] = useState(false);
  const [selectedContract, setSelectedContract] = useState<AffiliateContract | null>(null);
  const [showContractDetailModal, setShowContractDetailModal] = useState(false);
  const [loadingContractDetail, setLoadingContractDetail] = useState(false);
  const [deletingContractId, setDeletingContractId] = useState<number | null>(null);

  useEffect(() => {
    loadContracts();
  }, [filters]);

  const loadProfiles = async () => {
    try {
      setLoadingProfiles(true);
      const res = await fetch('/api/admin/affiliate/profiles?status=ACTIVE');
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '프로필을 불러오지 못했습니다.');
      }
      setProfiles(json.profiles ?? []);
    } catch (error: any) {
      console.error('[AdminContracts] load profiles error', error);
      showError(error.message || '프로필 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleOpenSendContractModal = () => {
    setShowSendContractModal(true);
  };

  const dataUrlToFile = (dataUrl: string, defaultName: string) => {
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
  };

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

  const uploadSignature = useCallback(async (file: File, options?: { previewDataUrl?: string }) => {
    setUploadingSignature(true);
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

      if (!json.url || !json.fileId) {
        throw new Error('업로드가 완료되었지만 파일 정보를 받지 못했습니다.');
      }

      const originalName = json.originalName || file.name;

      setContractForm((prev) => ({
        ...prev,
        signatureUrl: json.url,
        signatureOriginalName: originalName,
        signatureFileId: json.fileId,
      }));

      if (options?.previewDataUrl) {
        setSignaturePreview(options.previewDataUrl);
      }

      return true;
    } catch (error: any) {
      console.error('[AdminContracts] signature upload error', error);
      showError(error?.message || '파일 업로드 중 오류가 발생했습니다.');
      return false;
    } finally {
      setUploadingSignature(false);
    }
  }, []);

  const handleSignatureSave = useCallback(async () => {
    const pad = signaturePadRef.current;
    if (!pad) return;
    if (pad.isEmpty()) {
      showError('싸인을 먼저 입력해주세요.');
      return;
    }
    try {
      const dataUrl = pad.toDataURL('image/png');
      const fileName = `affiliate-signature-${Date.now()}.png`;
      const file = dataUrlToFile(dataUrl, fileName);
      const success = await uploadSignature(file, { previewDataUrl: dataUrl });
      if (success) {
        setShowSignatureModal(false);
        signaturePadRef.current?.clear();
      }
    } catch (error) {
      console.error('[AdminContracts] signature save error', error);
      showError('싸인 이미지를 처리하는 중 문제가 발생했습니다.');
    }
  }, [uploadSignature]);

  const handleSubmitContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingContract) return;

    if (uploadingSignature) {
      showError('싸인 업로드가 완료될 때까지 기다려주세요.');
      return;
    }

    if (!contractForm.name.trim() || !contractForm.phone.trim() || !contractForm.residentIdFront.trim() || !contractForm.residentIdBack.trim() || !contractForm.address.trim()) {
      showError('필수 항목을 모두 입력해주세요.');
      return;
    }

    if (![contractForm.consentPrivacy, contractForm.consentNonCompete, contractForm.consentDbUse, contractForm.consentPenalty].every(Boolean)) {
      showError('모든 필수 동의 항목에 체크해주세요.');
      return;
    }

    if (!contractForm.signatureUrl.trim() || !contractForm.signatureFileId.trim()) {
      showError('계약서에 싸인을 그린 후 반드시 저장해주세요.');
      return;
    }

    if (!contractReadConfirmed) {
      showError('계약서 전문을 확인하고 "확인했습니다"에 체크해주세요.');
      return;
    }

    try {
      setSubmittingContract(true);
      const response = await fetch('/api/affiliate/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contractForm,
          invitedByProfileId: selectedProfile?.id ?? undefined,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json?.ok) {
        throw new Error(json?.message || '서버 오류가 발생했습니다.');
      }

      showSuccess('계약서가 접수되었습니다.');
      setShowContractFormModal(false);
      setShowSendContractModal(false);
      loadContracts();
    } catch (error: any) {
      console.error('[AdminContracts] submit error', error);
      showError(error.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setSubmittingContract(false);
    }
  };

  const loadContracts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.set('status', filters.status);
      if (filters.search.trim()) params.set('search', filters.search.trim());

      const res = await fetch(`/api/admin/affiliate/contracts?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '계약 목록을 불러오지 못했습니다.');
      }
      setContracts(json.contracts ?? []);
    } catch (error: any) {
      console.error('[AdminContracts] load error', error);
      showError(error.message || '계약 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (contractId: number) => {
    if (!confirm('이 계약을 승인하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/admin/affiliate/contracts/${contractId}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '계약 승인에 실패했습니다.');
      }
      showSuccess('계약이 승인되었습니다.');
      loadContracts();
    } catch (error: any) {
      console.error('[AdminContracts] approve error', error);
      showError(error.message || '계약 승인 중 오류가 발생했습니다.');
    }
  };

  const handleReject = async (contractId: number) => {
    const reason = prompt('거부 사유를 입력하세요:');
    if (!reason) return;

    try {
      const res = await fetch(`/api/admin/affiliate/contracts/${contractId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '계약 거부에 실패했습니다.');
      }
      showSuccess('계약이 거부되었습니다.');
      loadContracts();
    } catch (error: any) {
      console.error('[AdminContracts] reject error', error);
      showError(error.message || '계약 거부 중 오류가 발생했습니다.');
    }
  };

  const handleViewDetail = async (contractId: number) => {
    try {
      setLoadingContractDetail(true);
      const res = await fetch(`/api/admin/affiliate/contracts/${contractId}`);
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '계약서 정보를 불러오지 못했습니다.');
      }
      setSelectedContract(json.contract);
      setShowContractDetailModal(true);
    } catch (error: any) {
      console.error('[AdminContracts] view detail error', error);
      showError(error.message || '계약서 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoadingContractDetail(false);
    }
  };

  const handleDelete = async (contractId: number) => {
    if (!confirm('정말로 이 계약서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    try {
      setDeletingContractId(contractId);
      const res = await fetch(`/api/admin/affiliate/contracts/${contractId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '삭제에 실패했습니다.');
      }
      showSuccess('계약서가 삭제되었습니다.');
      loadContracts();
    } catch (error: any) {
      console.error('[AdminContracts] delete error', error);
      showError(error.message || '삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingContractId(null);
    }
  };

  const buildInviteMessage = (name: string, phone: string, contractUrl: string) => {
    return [
      '[크루즈닷 어필리에이트 계약서 작성 안내]',
      '',
      `${name}님, 안녕하세요.`,
      '',
      '크루즈닷 어필리에이트 계약서 작성을 안내드립니다.',
      '아래 링크에서 계약서를 작성해주세요.',
      '',
      contractUrl,
      '',
      '※ 계약서 작성 시 필요 자료:',
      '- 신분증 사본 (앞면/뒷면)',
      '- 통장 사본',
      '- 계약서 전자 서명',
      '',
      '계약서 작성 완료 후 본사에서 검토하여 승인 절차를 진행합니다.',
      '',
      '문의사항이 있으시면 언제든지 연락주세요.',
      '',
      '감사합니다.',
      '크루즈닷 본사',
    ].join('\n');
  };

  const handleGenerateInviteMessage = async () => {
    if (!selectedProfile) {
      showError('판매원을 먼저 선택해주세요.');
      return;
    }

    if (!inviteForm.name.trim() || !inviteForm.phone.trim()) {
      showError('이름과 연락처를 모두 입력해주세요.');
      return;
    }

    try {
      setGeneratingInvite(true);
      
      // 계약서 작성 링크 생성
      let contractUrl = '';
      if (selectedProfile.user?.mallUserId) {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        contractUrl = `${baseUrl}/partner/${selectedProfile.user.mallUserId}/contract`;
      } else {
        // 판매몰 ID가 없으면 공개 계약서 페이지로
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        contractUrl = `${baseUrl}/affiliate/contract`;
      }

      const message = buildInviteMessage(inviteForm.name, inviteForm.phone, contractUrl);
      setInviteMessage(message);

      // 클립보드에 복사
      try {
        await navigator.clipboard.writeText(message);
        showSuccess('초대 메시지가 생성되고 클립보드에 복사되었습니다.');
      } catch (clipboardError) {
        showSuccess('초대 메시지가 생성되었습니다. 아래 내용을 복사해 전송해주세요.');
      }
    } catch (error: any) {
      console.error('[AdminContracts] generate invite error', error);
      showError(error.message || '초대 메시지 생성 중 오류가 발생했습니다.');
    } finally {
      setGeneratingInvite(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-50 text-emerald-700';
      case 'rejected':
        return 'bg-red-50 text-red-700';
      case 'submitted':
        return 'bg-blue-50 text-blue-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return '승인됨';
      case 'rejected':
        return '거부됨';
      case 'submitted':
        return '제출됨';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <FiCheckCircle className="text-base" />;
      case 'rejected':
        return <FiXCircle className="text-base" />;
      case 'submitted':
        return <FiClock className="text-base" />;
      default:
        return <FiFileText className="text-base" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 pb-24">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-10 md:px-6">
        {/* 헤더 */}
        <header className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold">어필리에이트 계약 관리</h1>
              <p className="text-sm text-white/80">
                파트너 계약 신청서를 검토하고 승인/거부할 수 있습니다.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenSendContractModal}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 shadow-md"
              >
                <FiSend className="text-base" />
                계약서 보내기
              </button>
              <button
                onClick={loadContracts}
                className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30"
              >
                <FiRefreshCw className="text-base" />
                새로고침
              </button>
            </div>
          </div>
        </header>

        {/* 필터 */}
        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setFilters((prev) => ({ ...prev, search: searchInput }));
                    }
                  }}
                  placeholder="이름, 전화번호, 이메일 검색..."
                  className="w-full rounded-xl border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* 계약 목록 */}
        <section className="rounded-3xl bg-white shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">신청자 정보</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">초대한 사람</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">상태</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">제출일</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">검토일</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">검토자</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                      계약 목록을 불러오는 중입니다...
                    </td>
                  </tr>
                )}
                {!isLoading && contracts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                      계약 신청 내역이 없습니다.
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  contracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-blue-50/40">
                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold text-gray-900">{contract.name}</div>
                        <div className="text-xs text-gray-500">{contract.phone}</div>
                        {contract.email && <div className="text-xs text-gray-500">{contract.email}</div>}
                        {contract.user?.mallUserId && (
                          <div className="mt-1 text-xs font-mono text-blue-600">
                            파트너 ID: {contract.user.mallUserId}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {contract.invitedBy ? (
                          <div className="text-sm">
                            <div className="font-semibold text-gray-900">
                              {contract.invitedBy.type === 'BRANCH_MANAGER' ? '대리점장' : contract.invitedBy.type === 'HQ' ? '본사' : '판매원'}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {contract.invitedBy.nickname || contract.invitedBy.displayName || '이름 없음'}
                            </div>
                            {contract.invitedBy.branchLabel && (
                              <div className="text-xs text-gray-500 mt-1">
                                {contract.invitedBy.branchLabel}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">본사</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(contract.status)}`}
                        >
                          {getStatusIcon(contract.status)}
                          {getStatusLabel(contract.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {contract.submittedAt
                          ? new Date(contract.submittedAt).toLocaleDateString('ko-KR')
                          : contract.createdAt
                            ? new Date(contract.createdAt).toLocaleDateString('ko-KR')
                            : '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {contract.reviewedAt ? new Date(contract.reviewedAt).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {contract.reviewer?.name || '-'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetail(contract.id)}
                            disabled={loadingContractDetail}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            <FiEye className="text-xs" />
                            상세
                          </button>
                          {contract.user?.mallUserId && (
                            <a
                              href={`/partner/${contract.user.mallUserId}/dashboard`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                            >
                              대시보드
                              <FiExternalLink className="text-xs" />
                            </a>
                          )}
                          {contract.status === 'submitted' && (
                            <>
                              <button
                                onClick={() => handleApprove(contract.id)}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                              >
                                <FiCheckCircle className="text-xs" />
                                승인
                              </button>
                              <button
                                onClick={() => handleReject(contract.id)}
                                className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                              >
                                <FiXCircle className="text-xs" />
                                거부
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(contract.id)}
                            disabled={deletingContractId === contract.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                          >
                            <FiTrash2 className="text-xs" />
                            {deletingContractId === contract.id ? '삭제 중...' : '삭제'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* 계약서 보내기 모달 */}
      <ContractInviteModal
        isOpen={showSendContractModal}
        onClose={() => setShowSendContractModal(false)}
        onSuccess={() => {
          setShowSendContractModal(false);
          loadContracts();
        }}
      />

      {/* 계약서 작성 폼 모달 */}
      {showContractFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-900">계약서 작성</h2>
              <button
                onClick={() => setShowContractFormModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="text-xl text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmitContract} className="p-6 space-y-6">
              {/* 계약서 전문 확인 */}
              <section className="rounded-xl bg-gray-50 p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">계약서 전문 확인</h3>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowContractTextModal(true)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <FiFileText /> 계약서 전문 보기
                  </button>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contractReadConfirmed}
                      onChange={(e) => setContractReadConfirmed(e.target.checked)}
                      className="mt-1 h-4 w-4"
                      required
                    />
                    <span className="text-sm text-gray-700">
                      <span className="font-semibold">계약서 전문을 확인했습니다.</span>
                      <br />
                      <span className="text-xs text-gray-500">계약서 전문을 읽고 모든 내용을 이해했으며 동의합니다.</span>
                    </span>
                  </label>
                </div>
              </section>

              {/* 기본 정보 */}
              <section className="rounded-xl bg-gray-50 p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">기본 정보</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm text-gray-700">
                    <span className="font-semibold">성명 *</span>
                    <input
                      value={contractForm.name}
                      onChange={(e) => setContractForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="예: 홍길동"
                      className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-gray-700">
                    <span className="font-semibold">연락처 *</span>
                    <input
                      value={contractForm.phone}
                      onChange={(e) => setContractForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="010-0000-0000"
                      className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-gray-700">
                    <span className="font-semibold">이메일</span>
                    <input
                      value={contractForm.email}
                      onChange={(e) => setContractForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="example@cruisedot.com"
                      type="email"
                      className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    <label className="col-span-2 flex flex-col gap-1 text-sm text-gray-700">
                      <span className="font-semibold">주민등록번호 앞 6자리 *</span>
                      <input
                        value={contractForm.residentIdFront}
                        onChange={(e) => setContractForm((prev) => ({ ...prev, residentIdFront: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) }))}
                        placeholder="예: 900101"
                        className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        required
                      />
                    </label>
                    <label className="col-span-3 flex flex-col gap-1 text-sm text-gray-700">
                      <span className="font-semibold">주민등록번호 뒤 7자리 *</span>
                      <input
                        value={contractForm.residentIdBack}
                        onChange={(e) => setContractForm((prev) => ({ ...prev, residentIdBack: e.target.value.replace(/[^0-9]/g, '').slice(0, 7) }))}
                        placeholder="예: 1234567"
                        className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        required
                      />
                    </label>
                  </div>
                  <label className="md:col-span-2 flex flex-col gap-1 text-sm text-gray-700">
                    <span className="font-semibold">주소 *</span>
                    <textarea
                      value={contractForm.address}
                      onChange={(e) => setContractForm((prev) => ({ ...prev, address: e.target.value }))}
                      rows={2}
                      placeholder="도로명 주소를 입력해주세요"
                      className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      required
                    />
                  </label>
                </div>
              </section>

              {/* 정산 계좌 정보 */}
              <section className="rounded-xl bg-gray-50 p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">정산 계좌 정보</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="flex flex-col gap-1 text-sm text-gray-700">
                    <span className="font-semibold">은행명</span>
                    <input
                      value={contractForm.bankName}
                      onChange={(e) => setContractForm((prev) => ({ ...prev, bankName: e.target.value }))}
                      placeholder="예: 국민은행"
                      className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-gray-700">
                    <span className="font-semibold">계좌번호</span>
                    <input
                      value={contractForm.bankAccount}
                      onChange={(e) => setContractForm((prev) => ({ ...prev, bankAccount: e.target.value }))}
                      placeholder="예: 123456-78-901234"
                      className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-gray-700">
                    <span className="font-semibold">예금주</span>
                    <input
                      value={contractForm.bankAccountHolder}
                      onChange={(e) => setContractForm((prev) => ({ ...prev, bankAccountHolder: e.target.value }))}
                      placeholder="예: 홍길동"
                      className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                </div>
              </section>

              {/* 계약서 싸인 */}
              <section className="rounded-xl bg-gray-50 p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">계약서 싸인</h3>
                <div className="space-y-4 text-sm text-gray-700">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowSignatureModal(true)}
                      disabled={uploadingSignature}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                    >
                      {uploadingSignature ? '저장 중...' : '싸인 그리기'}
                    </button>
                    {contractForm.signatureUrl && contractForm.signatureFileId && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setContractForm((prev) => ({ ...prev, signatureUrl: '', signatureOriginalName: '', signatureFileId: '' }));
                            setSignaturePreview('');
                          }}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                        >
                          싸인 초기화
                        </button>
                        <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                          <FiCheckCircle /> {contractForm.signatureOriginalName || '싸인 저장됨'}
                        </span>
                      </>
                    )}
                  </div>

                  {signaturePreview && contractForm.signatureUrl && (
                    <div className="rounded-lg border-2 border-green-200 bg-green-50/30 p-4">
                      <p className="mb-2 text-xs font-semibold text-green-800">저장된 싸인 미리보기:</p>
                      <div className="rounded-lg bg-white p-3 shadow-sm">
                        <img src={signaturePreview} alt="서명 미리보기" className="h-32 w-auto" />
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* 필수 동의 */}
              <section className="rounded-xl bg-gray-50 p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">필수 동의</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={contractForm.consentPrivacy}
                      onChange={(e) => setContractForm((prev) => ({ ...prev, consentPrivacy: e.target.checked }))}
                      className="mt-1 h-4 w-4"
                      required
                    />
                    <span>
                      <span className="font-semibold">개인정보 및 고객 DB 사용 제한에 동의합니다.</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={contractForm.consentNonCompete}
                      onChange={(e) => setContractForm((prev) => ({ ...prev, consentNonCompete: e.target.checked }))}
                      className="mt-1 h-4 w-4"
                      required
                    />
                    <span>
                      <span className="font-semibold">경업 및 리크루팅 금지 조항에 동의합니다.</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={contractForm.consentDbUse}
                      onChange={(e) => setContractForm((prev) => ({ ...prev, consentDbUse: e.target.checked }))}
                      className="mt-1 h-4 w-4"
                      required
                    />
                    <span>
                      <span className="font-semibold">고객 DB 보안 및 반환 의무를 준수합니다.</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={contractForm.consentPenalty}
                      onChange={(e) => setContractForm((prev) => ({ ...prev, consentPenalty: e.target.checked }))}
                      className="mt-1 h-4 w-4"
                      required
                    />
                    <span>
                      <span className="font-semibold">위반 시 손해배상 및 위약벌 조항을 이해하고 동의합니다.</span>
                    </span>
                  </label>
                </div>
              </section>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowContractFormModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                  disabled={submittingContract}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submittingContract || uploadingSignature}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {submittingContract ? '접수 중...' : '계약서 접수하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 싸인 입력 모달 */}
      {showSignatureModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 px-4"
          onClick={() => {
            setShowSignatureModal(false);
            signaturePadRef.current?.clear();
          }}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">싸인 입력</h3>
              <button
                type="button"
                onClick={() => {
                  setShowSignatureModal(false);
                  signaturePadRef.current?.clear();
                }}
                className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
              >
                <FiX />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="h-48 w-full overflow-hidden rounded-xl bg-white shadow-inner">
                  <canvas ref={signatureCanvasRef} className="h-full w-full cursor-crosshair rounded-xl" />
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  터치 패드, 마우스, 스타일러스를 이용해 싸인을 입력해주세요.
                </p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => signaturePadRef.current?.clear()}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  다시 그리기
                </button>
                <button
                  type="button"
                  onClick={handleSignatureSave}
                  disabled={uploadingSignature}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {uploadingSignature ? '저장 중...' : '싸인 저장하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 초대 메시지 생성 모달 */}
      {showInviteMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-900">계약서 작성 초대 메시지 생성</h2>
              <button
                onClick={() => {
                  setShowInviteMessageModal(false);
                  setInviteMessage('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="text-xl text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 판매원 정보 */}
              {selectedProfile && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">선택된 판매원</h3>
                  <p className="text-sm font-bold text-gray-900">
                    {selectedProfile.nickname || selectedProfile.displayName || '이름 없음'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    어필리에이트 코드: {selectedProfile.affiliateCode} | 유형: {selectedProfile.type}
                  </p>
                </div>
              )}

              {/* 이름, 전화번호 입력 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    받는 사람 이름 *
                  </label>
                  <input
                    type="text"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="예: 홍길동"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    받는 사람 연락처 *
                  </label>
                  <input
                    type="text"
                    value={inviteForm.phone}
                    onChange={(e) => setInviteForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="010-0000-0000"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <button
                  onClick={handleGenerateInviteMessage}
                  disabled={generatingInvite || !inviteForm.name.trim() || !inviteForm.phone.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <FiSend /> 초대 메시지 생성 및 복사
                </button>
              </div>

              {/* 생성된 메시지 표시 */}
              {inviteMessage && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">생성된 초대 메시지</h3>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(inviteMessage);
                          showSuccess('메시지가 클립보드에 복사되었습니다.');
                        } catch (error) {
                          showError('클립보드 복사에 실패했습니다.');
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      <FiCopy /> 다시 복사
                    </button>
                  </div>
                  <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                    <textarea
                      value={inviteMessage}
                      readOnly
                      rows={15}
                      className="w-full resize-none rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-mono text-gray-900 focus:outline-none"
                    />
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-xs text-green-800">
                      💡 위 메시지를 카카오톡이나 문자로 전송하세요. 메시지에 포함된 링크를 클릭하면 계약서 작성 페이지로 이동합니다.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 계약서 전문 모달 */}
      {showContractTextModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 px-4"
          onClick={() => setShowContractTextModal(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">크루즈닷 어필리에이트 계약서 전문</h3>
              <button
                type="button"
                onClick={() => setShowContractTextModal(false)}
                className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
              >
                <FiX />
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
            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowContractTextModal(false);
                  setContractReadConfirmed(true);
                }}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow hover:bg-blue-700"
              >
                확인했습니다
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 계약서 상세 정보 모달 */}
      {showContractDetailModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-900">계약서 상세 정보</h2>
              <button
                onClick={() => {
                  setShowContractDetailModal(false);
                  setSelectedContract(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="text-xl text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 기본 정보 */}
              <section className="rounded-xl bg-gray-50 p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">기본 정보</h3>
                <div className="grid gap-4 md:grid-cols-2 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">성명:</span>
                    <span className="ml-2 text-gray-900">{selectedContract.name}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">연락처:</span>
                    <span className="ml-2 text-gray-900">{selectedContract.phone}</span>
                  </div>
                  {selectedContract.email && (
                    <div>
                      <span className="font-semibold text-gray-700">이메일:</span>
                      <span className="ml-2 text-gray-900">{selectedContract.email}</span>
                    </div>
                  )}
                  {selectedContract.residentId && (
                    <div>
                      <span className="font-semibold text-gray-700">주민등록번호:</span>
                      <span className="ml-2 text-gray-900">{selectedContract.residentId}</span>
                    </div>
                  )}
                  {selectedContract.address && (
                    <div className="md:col-span-2">
                      <span className="font-semibold text-gray-700">주소:</span>
                      <span className="ml-2 text-gray-900">{selectedContract.address}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* 정산 계좌 정보 */}
              {(selectedContract.bankName || selectedContract.bankAccount) && (
                <section className="rounded-xl bg-gray-50 p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">정산 계좌 정보</h3>
                  <div className="grid gap-4 md:grid-cols-2 text-sm">
                    {selectedContract.bankName && (
                      <div>
                        <span className="font-semibold text-gray-700">은행명:</span>
                        <span className="ml-2 text-gray-900">{selectedContract.bankName}</span>
                      </div>
                    )}
                    {selectedContract.bankAccount && (
                      <div>
                        <span className="font-semibold text-gray-700">계좌번호:</span>
                        <span className="ml-2 text-gray-900">{selectedContract.bankAccount}</span>
                      </div>
                    )}
                    {selectedContract.bankAccountHolder && (
                      <div>
                        <span className="font-semibold text-gray-700">예금주:</span>
                        <span className="ml-2 text-gray-900">{selectedContract.bankAccountHolder}</span>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* 초대 정보 */}
              <section className="rounded-xl bg-gray-50 p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">초대 정보</h3>
                <div className="text-sm">
                  {selectedContract.invitedBy ? (
                    <div className="space-y-2">
                      <div>
                        <span className="font-semibold text-gray-700">초대한 사람:</span>
                        <span className="ml-2 text-gray-900">
                          {selectedContract.invitedBy.type === 'BRANCH_MANAGER' ? '대리점장' : selectedContract.invitedBy.type === 'HQ' ? '본사' : '판매원'}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">이름:</span>
                        <span className="ml-2 text-gray-900">
                          {selectedContract.invitedBy.nickname || selectedContract.invitedBy.displayName || '이름 없음'}
                        </span>
                      </div>
                      {selectedContract.invitedBy.branchLabel && (
                        <div>
                          <span className="font-semibold text-gray-700">지점/팀:</span>
                          <span className="ml-2 text-gray-900">{selectedContract.invitedBy.branchLabel}</span>
                        </div>
                      )}
                      {selectedContract.invitedBy.affiliateCode && (
                        <div>
                          <span className="font-semibold text-gray-700">어필리에이트 코드:</span>
                          <span className="ml-2 text-gray-900 font-mono">{selectedContract.invitedBy.affiliateCode}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <span className="font-semibold text-gray-700">초대한 사람:</span>
                      <span className="ml-2 text-gray-900">본사</span>
                    </div>
                  )}
                </div>
              </section>

              {/* 계약서 상태 */}
              <section className="rounded-xl bg-gray-50 p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">계약서 상태</h3>
                <div className="grid gap-4 md:grid-cols-2 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">상태:</span>
                    <span className={`ml-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(selectedContract.status)}`}>
                      {getStatusIcon(selectedContract.status)}
                      {getStatusLabel(selectedContract.status)}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">제출일:</span>
                    <span className="ml-2 text-gray-900">
                      {selectedContract.submittedAt
                        ? new Date(selectedContract.submittedAt).toLocaleString('ko-KR')
                        : selectedContract.createdAt
                          ? new Date(selectedContract.createdAt).toLocaleString('ko-KR')
                          : '-'}
                    </span>
                  </div>
                  {selectedContract.reviewedAt && (
                    <div>
                      <span className="font-semibold text-gray-700">검토일:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(selectedContract.reviewedAt).toLocaleString('ko-KR')}
                      </span>
                    </div>
                  )}
                  {selectedContract.reviewer && (
                    <div>
                      <span className="font-semibold text-gray-700">검토자:</span>
                      <span className="ml-2 text-gray-900">{selectedContract.reviewer.name || '-'}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* 사용자 정보 */}
              {selectedContract.user && (
                <section className="rounded-xl bg-gray-50 p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">사용자 정보</h3>
                  <div className="grid gap-4 md:grid-cols-2 text-sm">
                    {selectedContract.user.mallUserId && (
                      <div>
                        <span className="font-semibold text-gray-700">파트너 ID:</span>
                        <span className="ml-2 text-gray-900 font-mono">{selectedContract.user.mallUserId}</span>
                      </div>
                    )}
                    {selectedContract.user.name && (
                      <div>
                        <span className="font-semibold text-gray-700">이름:</span>
                        <span className="ml-2 text-gray-900">{selectedContract.user.name}</span>
                      </div>
                    )}
                    {selectedContract.user.email && (
                      <div>
                        <span className="font-semibold text-gray-700">이메일:</span>
                        <span className="ml-2 text-gray-900">{selectedContract.user.email}</span>
                      </div>
                    )}
                    {selectedContract.user.phone && (
                      <div>
                        <span className="font-semibold text-gray-700">연락처:</span>
                        <span className="ml-2 text-gray-900">{selectedContract.user.phone}</span>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* 싸인 이미지 */}
              {selectedContract.metadata?.signature?.url && (
                <section className="rounded-xl bg-gray-50 p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">계약서 싸인</h3>
                  <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
                    <img
                      src={selectedContract.metadata.signature.url}
                      alt="서명"
                      className="max-w-full h-auto"
                    />
                  </div>
                </section>
              )}
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowContractDetailModal(false);
                  setSelectedContract(null);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  if (selectedContract) {
                    handleDelete(selectedContract.id);
                    setShowContractDetailModal(false);
                    setSelectedContract(null);
                  }
                }}
                disabled={deletingContractId === selectedContract?.id}
                className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                {deletingContractId === selectedContract?.id ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

