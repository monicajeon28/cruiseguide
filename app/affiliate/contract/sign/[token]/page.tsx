// app/affiliate/contract/sign/[token]/page.tsx
// 계약서 서명 페이지

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi';
import { showError, showSuccess } from '@/components/ui/Toast';

// SignaturePad를 동적으로 import (클라이언트 사이드에서만 로드)
const SignaturePad = dynamic(() => import('signature_pad').then((mod) => mod.default), {
  ssr: false,
});

type Contract = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  metadata: any;
  user: {
    id: number;
    name: string | null;
  } | null;
};

export default function ContractSignPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signedByName, setSignedByName] = useState('');
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadContract();
    }
  }, [token]);

  useEffect(() => {
    if (typeof window !== 'undefined' && SignaturePad) {
      const canvas = document.getElementById('signature-canvas') as HTMLCanvasElement;
      if (canvas) {
        const pad = new SignaturePad(canvas, {
          backgroundColor: 'rgb(255, 255, 255)',
          penColor: 'rgb(0, 0, 0)',
        });
        setSignaturePad(pad);

        // 캔버스 크기 조정
        const resizeCanvas = () => {
          const ratio = Math.max(window.devicePixelRatio || 1, 1);
          canvas.width = canvas.offsetWidth * ratio;
          canvas.height = canvas.offsetHeight * ratio;
          canvas.getContext('2d')?.scale(ratio, ratio);
          pad.clear();
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        return () => {
          window.removeEventListener('resize', resizeCanvas);
        };
      }
    }
  }, []);

  const loadContract = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/affiliate/contract/sign/${token}`);
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.message || '계약서를 불러오지 못했습니다.');
      }

      setContract(json.contract);
      setSignedByName(json.contract.user?.name || json.contract.name || '');
    } catch (error: any) {
      console.error('[ContractSign] Load error', error);
      setError(error.message || '계약서를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSignature = () => {
    if (signaturePad) {
      signaturePad.clear();
    }
  };

  const handleSubmit = async () => {
    if (!signedByName.trim()) {
      showError('서명자 이름을 입력해주세요.');
      return;
    }

    if (!signaturePad || signaturePad.isEmpty()) {
      showError('서명을 해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      const signatureImage = signaturePad.toDataURL('image/png');

      const res = await fetch(`/api/affiliate/contract/sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureImage,
          signedByName: signedByName.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || '서명 처리에 실패했습니다.');
      }

      showSuccess('서명이 완료되었습니다.');
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error: any) {
      console.error('[ContractSign] Submit error', error);
      showError(error.message || '서명 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">계약서를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <FiXCircle className="mx-auto text-red-500 text-5xl mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">오류 발생</h1>
          <p className="text-gray-600">{error || '계약서를 찾을 수 없습니다.'}</p>
        </div>
      </div>
    );
  }

  if (contract.status === 'SIGNED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <FiCheckCircle className="mx-auto text-green-500 text-5xl mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">서명 완료</h1>
          <p className="text-gray-600">이 계약서는 이미 서명이 완료되었습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">계약서 서명</h1>
            <p className="text-gray-600">
              아래 내용을 확인하시고 서명해주세요.
            </p>
          </div>

          {/* 계약서 정보 */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">계약서 정보</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <span className="text-sm text-gray-500">이름</span>
                <p className="font-semibold text-gray-900">{contract.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">전화번호</span>
                <p className="font-semibold text-gray-900">{contract.phone}</p>
              </div>
              {contract.email && (
                <div>
                  <span className="text-sm text-gray-500">이메일</span>
                  <p className="font-semibold text-gray-900">{contract.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* 구글 문서 링크 */}
          {contract.metadata?.googleDocUrl && (
            <div className="mb-6">
              <a
                href={contract.metadata.googleDocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                계약서 내용 보기
              </a>
            </div>
          )}

          {/* 서명자 이름 입력 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              서명자 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={signedByName}
              onChange={(e) => setSignedByName(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="서명자 이름을 입력하세요"
            />
          </div>

          {/* 서명 영역 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              서명 <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white">
              <canvas
                id="signature-canvas"
                className="w-full"
                style={{ height: '300px', touchAction: 'none' }}
              />
            </div>
            <button
              type="button"
              onClick={handleClearSignature}
              className="mt-2 text-sm text-gray-600 hover:text-gray-800"
            >
              서명 지우기
            </button>
          </div>

          {/* 안내 메시지 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-2">
              <FiAlertCircle className="text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">서명 전 확인사항</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>계약서 내용을 반드시 확인하신 후 서명해주세요.</li>
                  <li>서명 후에는 수정할 수 없습니다.</li>
                  <li>서명 완료 후 계약서는 자동으로 저장됩니다.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-4">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold shadow hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  처리 중...
                </>
              ) : (
                <>
                  <FiCheckCircle />
                  서명 완료
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
