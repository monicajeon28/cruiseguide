'use client';

import { ChangeEvent, useCallback, useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// import Image from 'next/image'; // Remove unused import
import { ChatInputPayload, ChatInputMode } from '@/lib/types'; // Import ChatInputMode
import { renderEmphasis } from '@/lib/utils'; // Assuming renderEmphasis is needed for context but not in current snippet
import { Chip } from './Chip'; // assuming Chip component is available

type Props = {
  onSend: (payload: ChatInputPayload) => void;
  showModeChips?: boolean; // ✅ 새 prop 추가
};

export default function ChatInputBar({ onSend, showModeChips = true }: Props) { // ✅ 기본값 true
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]); // Add files state
  const [isComposing, setIsComposing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Add file input ref
  const router = useRouter();

  const handleInputChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isComposing || (!input.trim() && files.length === 0)) return; // Modified guard
    onSend({ mode: 'plain', text: input.trim(), files }); // Pass files
    setInput('');
    setFiles([]); // Clear files after sending
  }, [input, isComposing, onSend, files]); // Add files to dependencies

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }, [isComposing, handleSubmit]);

  const handleQuickChipClick = useCallback((text: string) => {
    onSend({ mode: 'plain', text: text, files: [] });
  }, [onSend]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(e.target.files ?? [])); // Safely get files
  }, []);

  // ✅ showModeChips가 true일 때만 칩 렌더링
  const modeChips = showModeChips ? (
    <div className="flex gap-2 my-3">
      {['지니야 가자','지니야 보여줘','일반','지니가이드소개'].map((t)=>(
        <Chip key={t} label={t} onClick={()=>{
          if (t==='지니가이드소개') { router.push('/guide'); return; }
          let mode:ChatInputMode='plain'; // Use ChatInputMode from lib/types
          if (t==='지니야 가자') mode='go'; else if (t==='지니야 보여줘') mode='show';
          onSend({ mode, text: t, files: [] });
        }} />
      ))}
    </div>
  ) : null;

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-white pt-2">
      <div className="mx-auto max-w-6xl px-4">
        {modeChips} {/* ✅ 칩 렌더링 위치 */}
        <form onSubmit={handleSubmit} ref={formRef} className="relative flex items-end w-full space-x-2 pb-3">
          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              rows={1}
              className="min-h-[44px] w-full resize-none rounded-xl border border-gray-300 bg-white p-2.5 text-base text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 shadow-sm pr-12"
              placeholder="메시지를 입력하세요..."
              style={{ overflowY: 'hidden' }}
            />
            <input
              type="file"
              multiple
              ref={fileInputRef} // New ref
              onChange={onFileChange} // New handler
              className="hidden"
              aria-label="파일 선택"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()} // Trigger click on hidden input
              className="absolute right-3 bottom-2 text-gray-500 hover:text-gray-900"
              aria-label="파일 업로드"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          <button
            type="submit"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-white shadow hover:bg-red-700 transition"
            aria-label="보내기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
