'use client';
import { ChatInputMode } from '@/lib/types';
import { BsChatTextFill } from 'react-icons/bs';
import { PiMapPinLineFill } from 'react-icons/pi';
import { LuImagePlus } from 'react-icons/lu';

interface SuggestChipsProps {
  currentMode: ChatInputMode;
  onChipClick: (payload: string, mode: ChatInputMode) => void;
}

// TODO: 실제 사용자의 문맥에 따라 동적으로 칩을 생성해야 합니다.
// 현재는 더미 데이터를 사용합니다.
const getSuggestChips = (mode: ChatInputMode) => {
  switch (mode) {
    case 'general':
      return [
        { label: '크루즈 추천', payload: '크루즈 추천해 줘' },
        { label: '날씨 정보', payload: '오늘 날씨 어때?' },
        { label: '환율 정보', payload: '환율 알려줘' },
        { label: '번역', payload: '번역해 줘' },
      ];
    case 'go':
      return [
        { label: '인천공항 터미널', payload: '인천공항 크루즈 터미널 가는 길' },
        { label: '근처 맛집', payload: '근처 맛집 찾아줘' },
        { label: '호텔 추천', payload: '근처 호텔 추천' },
      ];
    case 'show':
      return [
        { label: '선박 사진', payload: '크루즈 선박 사진 보여줘' },
        { label: '여행지 사진', payload: '마이애미 여행지 사진 보여줘' },
        { label: '객실 사진', payload: '객실 사진 보여줘' },
      ];
    default:
      return [];
  }
};

export default function SuggestChips({ currentMode, onChipClick }: SuggestChipsProps) {
  const chips = getSuggestChips(currentMode);

  return (
    <div className="w-full bg-white p-3 border-t border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-hide">
      <div className="inline-flex space-x-2 p-1">
        {chips.map((chip, index) => (
          <button
            key={index}
            onClick={() => onChipClick(chip.payload, currentMode)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors duration-200 flex-shrink-0"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
