'use client';

import ChatWindow from '@/components/ChatWindow';
import type { ChatInputMode } from '@/lib/types';
import SuggestChips from './suggestchips';
import InputBar from './InputBar';
import { ChatInputPayload } from '@/components/chat/types';
import { useState, useEffect, useRef } from 'react';
import { ChatMessage, TextMessage } from '@/lib/chat-types';
import DeleteChatHistoryModal from './DeleteChatHistoryModal';
import { ChatMessageSkeleton } from '@/components/ui/Skeleton';
import { csrfFetch } from '@/lib/csrf-client';
import tts, { extractPlainText } from '@/lib/tts';

export default function ChatClientShell({
  mode,
}: {
  mode: ChatInputMode;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevModeRef = useRef<ChatInputMode | null>(null); // 이전 모드 추적

  // 모드가 변경될 때마다 메시지 초기화 (새로운 대화 시작)
  useEffect(() => {
    // 첫 마운트가 아닐 때만 (즉, 모드가 실제로 변경되었을 때만) 메시지 초기화
    if (prevModeRef.current !== null && prevModeRef.current !== mode) {
      console.log('[ChatClientShell] Mode changed from', prevModeRef.current, 'to', mode, '- Clearing messages');
      // 빈 상태 UI는 ChatWindow에서 처리하므로 메시지는 비워둠
      setMessages([]);
      setIsSending(false);
    }
    prevModeRef.current = mode;
  }, [mode]);

  const onSend = async (payload: ChatInputPayload) => {
    // 사용자 메시지 추가
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      type: 'text',
      text: payload.text,
    };
    
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsSending(true);

    try {
      const currentMode = payload.mode || mode;

      // 일반 대화 모드는 스트리밍 사용
      if (currentMode === 'general') {
        // 스트리밍 응답용 임시 메시지 생성
        const streamingMessageId = `streaming-${Date.now()}`;
        const streamingMessage: ChatMessage = {
          id: streamingMessageId,
          role: 'assistant',
          type: 'text',
          text: '',
        };
        
        setMessages((prevMessages) => [...prevMessages, streamingMessage]);

        // 스트리밍 API 호출
        const requestBody = {
          messages: [
            ...messages.map(m => ({
              role: m.role === 'user' ? 'user' : 'assistant',
              content: (m.type === 'text' ? m.text : '') || '',
            })),
            { role: 'user', content: payload.text },
          ],
        };
        
        console.log('[ChatClientShell] Sending request to /api/chat/stream:', {
          messageCount: requestBody.messages.length,
          lastMessage: requestBody.messages[requestBody.messages.length - 1]?.content?.substring(0, 50)
        });
        
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(requestBody),
        });
        
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
        
        console.log('[ChatClientShell] Response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          hasBody: !!response.body,
          headers: responseHeaders
        });

        if (!response.ok) {
          // 에러 응답 처리
          let errorMessage = 'Failed to get streaming response';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
            console.error('Stream API error:', errorData);
          } catch (e) {
            const errorText = await response.text().catch(() => '');
            errorMessage = errorText || errorMessage;
            console.error('Stream API error (text):', errorText);
          }
          throw new Error(errorMessage);
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        // 스트리밍 응답 읽기
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';

        console.log('[ChatClientShell] Starting stream read');

        let readCount = 0;
        while (true) {
          const { done, value } = await reader.read();
          readCount++;
          console.log('[ChatClientShell] Read #' + readCount + ', done:', done, 'hasValue:', !!value);
          
          if (done) {
            console.log('[ChatClientShell] Stream done, total reads:', readCount, 'accumulated:', accumulatedText.substring(0, 100));
            if (accumulatedText.length === 0) {
              console.warn('[ChatClientShell] No text accumulated! This might indicate a server-side issue.');
            }
            break;
          }

          if (!value) {
            console.warn('[ChatClientShell] No value in chunk, continuing...');
            continue;
          }

          const chunk = decoder.decode(value, { stream: true });
          console.log('[ChatClientShell] Received chunk #' + readCount + ', length:', chunk.length, 'content:', chunk.substring(0, 200));
          const lines = chunk.split('\n');
          console.log('[ChatClientShell] Split into', lines.length, 'lines');

          for (const line of lines) {
            if (line.startsWith('0:')) {
              // 텍스트 데이터 추출
              try {
                const jsonStr = line.substring(2);
                const parsed = JSON.parse(jsonStr);
                console.log('[ChatClientShell] Parsed text:', typeof parsed, parsed?.substring?.(0, 50));
                
                if (parsed && typeof parsed === 'string') {
                  accumulatedText += parsed;
                  
                  // 메시지 업데이트
                  setMessages((prevMessages) =>
                    prevMessages.map((msg) =>
                      msg.id === streamingMessageId
                        ? { ...msg, text: accumulatedText }
                        : msg
                    )
                  );
                } else {
                  console.warn('[ChatClientShell] Parsed value is not a string:', typeof parsed, parsed);
                }
              } catch (e) {
                console.error('[ChatClientShell] JSON parse error:', e, 'line:', line.substring(0, 100));
              }
            } else if (line.trim()) {
              console.log('[ChatClientShell] Non-matching line:', line.substring(0, 100));
            }
          }
        }

        // 스트리밍 완료 후 최종 메시지 ID 업데이트
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === streamingMessageId
              ? { ...msg, id: Date.now().toString() }
              : msg
          )
        );

        // TTS: 스트리밍 완료 후 AI 응답을 음성으로 읽기 (사용자 설정 확인)
        if (accumulatedText && tts.getEnabled()) {
          const plainText = extractPlainText(accumulatedText);
          tts.speak(plainText);
        }
      } else {
        // 다른 모드는 기존 API 사용 (구조화된 응답)
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            text: payload.text,
            mode: currentMode,
            from: payload.from,
            to: payload.to,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response from server');
        }

        const data = await response.json();
        
        console.log('[ChatClientShell] API Response:', { 
          ok: data.ok, 
          messagesCount: data.messages?.length,
          messages: data.messages 
        });
        
        // 디버그: show-me 메시지의 subfolders 확인
        if (data.messages && Array.isArray(data.messages)) {
          data.messages.forEach((msg: any, idx: number) => {
            if (msg.type === 'show-me') {
              console.log(`[ChatClientShell] Message ${idx} (show-me):`, {
                id: msg.id,
                query: msg.query,
                hasSubfolders: !!msg.subfolders,
                subfoldersCount: msg.subfolders?.length || 0,
                subfolders: msg.subfolders?.map((s: any) => s.displayName) || [],
                categoriesCount: msg.categories?.length || 0,
                cruisePhotosCount: msg.cruisePhotos?.length || 0,
              });
            }
          });
        }

        if (data.ok && Array.isArray(data.messages)) {
          setMessages((prevMessages) => [...prevMessages, ...data.messages]);
          
          // TTS: AI 응답 음성 재생 (텍스트 타입 메시지만, 사용자 설정 확인)
          if (tts.getEnabled()) {
            const textMessages = data.messages.filter((msg: ChatMessage): msg is TextMessage =>
              msg.role === 'assistant' && msg.type === 'text'
            );
            if (textMessages.length > 0) {
              const combinedText = textMessages.map((msg: TextMessage) => msg.text).join(' ');
              const plainText = extractPlainText(combinedText);
              tts.speak(plainText);
            }
          }
        } else {
          const errorMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            type: 'text',
            text: '죄송합니다. 응답을 처리하는 중 오류가 발생했어요.',
          };
          setMessages((prevMessages) => [...prevMessages, errorMessage]);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        type: 'text',
        text: '네트워크 오류가 발생했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.',
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  // 채팅 기록 삭제 함수
  const handleDeleteChatHistory = async () => {
    setIsDeleting(true);
    
    try {
      const response = await fetch('/api/chat/history', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        // 성공적으로 삭제되면 메시지 상태 초기화
        setMessages([]);
        setIsDeleteModalOpen(false);
        
        // 성공 메시지 표시 (선택사항)
        console.log('채팅 기록이 삭제되었습니다.');
      } else {
        console.error('Failed to delete chat history:', response.statusText);
        alert('채팅 기록 삭제에 실패했습니다. 다시 시도해 주세요.');
      }
    } catch (error) {
      console.error('Error deleting chat history:', error);
      alert('네트워크 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsDeleting(false);
    }
  };

  // 채팅 기록 자동 복원 비활성화 - 새로운 화면으로 시작
  // useEffect(() => {
  //   const loadChatHistory = async () => {
  //     try {
  //       setIsLoading(true);
  //       const response = await csrfFetch('/api/chat/history', {
  //         method: 'GET',
  //         credentials: 'include',
  //       });

  //       if (response.ok) {
  //         const data = await response.json();
  //         if (data.ok && Array.isArray(data.messages) && data.messages.length > 0) {
  //           console.log('[ChatClientShell] 채팅 히스토리 복원:', data.messages.length, '개 메시지');
  //           setMessages(data.messages);
  //         } else {
  //           console.log('[ChatClientShell] 저장된 채팅 히스토리가 없습니다.');
  //         }
  //       } else {
  //         console.error('Failed to load chat history:', response.statusText);
  //       }
  //     } catch (error) {
  //       console.error('Error loading chat history:', error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   loadChatHistory();
  // }, []); // 빈 의존성 배열: 컴포넌트 마운트 시 한 번만 실행

  // 채팅 기록 저장하기 (messages 변경 시 자동 저장, debounce 적용)
  useEffect(() => {
    // 로딩 중이거나 메시지가 비어있으면 저장하지 않음
    if (isLoading || messages.length === 0) return;

    // 이전 타이머가 있으면 취소
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 1초 후에 저장 (debounce)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await csrfFetch('/api/chat/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messages }),
        });

        if (!response.ok) {
          console.error('Failed to save chat history:', response.statusText);
        }
      } catch (error) {
        console.error('Error saving chat history:', error);
      }
    }, 1000); // 1초 debounce

    // 클린업: 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [messages, isLoading]); // messages가 변경될 때마다 실행

  return (
    <div className="flex flex-col h-full">
      {isLoading ? (
        <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">대화 내역을 불러오는 중...</p>
          </div>
        </div>
      ) : (
        <>
          <ChatWindow messages={messages} mode={mode} onSend={onSend} />
          
          {/* 하위 폴더 버튼들 - 최근 show-me 메시지의 하위 폴더 표시 */}
          {mode === 'show' && (() => {
            // 가장 최근의 show-me 타입 메시지 찾기
            const showMeMessages = messages.filter((msg) => msg.type === 'show-me');
            console.log('[ChatClientShell] Show-me messages:', showMeMessages.length, showMeMessages);
            
            const latestShowMeMessage = [...showMeMessages].reverse().find(
              (msg) => {
                const showMeMsg = msg as ChatMessage & { subfolders?: Array<{ name: string; displayName: string; icon: string; photoCount: number }> };
                const hasSubfolders = showMeMsg.subfolders && showMeMsg.subfolders.length > 0;
                console.log('[ChatClientShell] Checking message:', { 
                  id: showMeMsg.id, 
                  type: showMeMsg.type, 
                  hasSubfolders,
                  subfoldersCount: showMeMsg.subfolders?.length || 0 
                });
                return hasSubfolders;
              }
            ) as ChatMessage & { subfolders?: Array<{ name: string; displayName: string; icon: string; photoCount: number }> };
            
            console.log('[ChatClientShell] Latest show-me message with subfolders:', latestShowMeMessage ? {
              id: latestShowMeMessage.id,
              subfoldersCount: latestShowMeMessage.subfolders?.length,
              subfolders: latestShowMeMessage.subfolders?.map(s => s.displayName)
            } : 'not found');
            
            if (!latestShowMeMessage) return null;
            
            return (
              <div className="px-3 pt-3 pb-2 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center gap-2 text-base font-bold mb-2">
                  <span>📁</span>
                  <span>하위 폴더에서 더 찾아보기</span>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-2">
                  {latestShowMeMessage.subfolders!.slice(0, 10).map((subfolder, idx) => (
                    <button
                      key={idx}
                      onClick={async () => {
                        // 하위 폴더 클릭 시 해당 폴더의 사진을 검색하여 메시지로 전송
                        const searchQuery = subfolder.name.split('/').pop() || subfolder.displayName;
                        const payload: ChatInputPayload = {
                          text: searchQuery,
                          mode: 'show',
                          from: '',
                          to: '',
                        };
                        await onSend(payload);
                      }}
                      className="
                        flex flex-col items-center justify-center gap-1
                        px-3 py-3
                        bg-gradient-to-br from-purple-50 to-pink-50
                        border-2 border-purple-200
                        rounded-lg
                        shadow-sm
                        hover:shadow-md
                        hover:border-purple-300
                        text-sm font-bold
                        min-h-[80px]
                        active:scale-95
                        transition-all
                      "
                    >
                      <span className="text-2xl">{subfolder.icon}</span>
                      <span className="text-center leading-tight text-xs">{subfolder.displayName}</span>
                      <span className="text-[10px] text-gray-600 font-normal">
                        {subfolder.photoCount}장
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
          
          <div className="px-3 pb-3 pt-2 bg-white border-t">
            <InputBar mode={mode} onSend={onSend} disabled={isSending} />
            {isSending && (
              <div className="text-center text-sm text-gray-500 mt-2">
                <span className="inline-flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  응답을 기다리는 중...
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* 삭제 확인 모달 */}
      <DeleteChatHistoryModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteChatHistory}
        isDeleting={isDeleting}
      />
    </div>
  );
}
