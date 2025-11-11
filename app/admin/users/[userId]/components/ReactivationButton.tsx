// app/admin/users/[id]/components/ReactivationButton.tsx
'use client';

import { useState } from 'react';
import ReactivationModal from './ReactivationModal';

interface ReactivationButtonProps {
  userId: string;
  userName: string;
}

export default function ReactivationButton({ userId, userName }: ReactivationButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span>✈️ 새 여행 등록 및 재활성화</span>
      </button>

      <ReactivationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={userId}
        userName={userName}
      />
    </>
  );
}

