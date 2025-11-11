'use client'
import { useEffect } from 'react';

export default function HelpModal({
  open, onClose,
}: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
      aria-modal="true" role="dialog"
    >
      <div
        className="w-[min(680px,92vw)] rounded-2xl bg-white shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 text-lg font-semibold">지니 사용 방법</div>

        <div className="space-y-4 text-sm leading-6 text-gray-700">
          <div>
            <div className="font-semibold text-red-600 mb-1">지니야 가자 (길찾기/지도)</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>출발지와 도착지를 입력해 주세요. (예: <b>홍콩 공항 → 홍콩 크루즈 터미널</b>)</li>
              <li>출발지가 애매하면 <b>현 위치</b> 또는 나라/도시/공항을 선택하면 돼요.</li>
              <li>입력 후 지니가 추천 후보 버튼을 띄우고, <b>대중교통/자동차/지도로 보기</b>를 제공합니다.</li>
            </ul>
          </div>

          <div>
            <div className="font-semibold text-blue-600 mb-1">지니야 보여줘 (사진/자료)</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>크루즈 정보 사진만 보여줘요. (예: <b>벨리시마 보여줘</b>)</li>
            </ul>
          </div>

          <div>
            <div className="font-semibold text-gray-800 mb-1">일반 (질문/답변)</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>일반 궁금증을 물어보면 외부 검색 기반으로 답해요.</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300"
          >
            닫기
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-red-600 text-white"
          >
            이해했어요
          </button>
        </div>
      </div>
    </div>
  );
}
