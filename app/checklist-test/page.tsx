'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiChevronLeft, FiTrash2, FiPlus, FiCheck, FiChevronDown, FiChevronUp, FiX, FiVolume2, FiPause } from 'react-icons/fi';
import { hapticClick, hapticSuccess, hapticImpact } from '@/lib/haptic';
import { useKeyboardHandler, useViewportHeight } from '@/lib/keyboard-handler';
import { trackFeature } from '@/lib/analytics';
import TutorialCountdown from '@/app/chat/components/TutorialCountdown';
import { checkTestModeClient, TestModeInfo } from '@/lib/test-mode-client';
import { clearAllLocalStorage } from '@/lib/csrf-client';

// 체크리스트 아이템 타입 정의 (API 응답 형식에 맞춤)
type ChecklistItem = {
  id: number;
  text: string;
  completed: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export default function ChecklistPage() {
  const router = useRouter();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newText, setNewText] = useState('');
  const [textScale, setTextScale] = useState<1 | 2 | 3>(3); // 1(보통) 2(큼) 3(아주 큼) - 기본값 3으로 변경
  const [isProhibitedItemsExpanded, setIsProhibitedItemsExpanded] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [speakingCategory, setSpeakingCategory] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [testModeInfo, setTestModeInfo] = useState<TestModeInfo | null>(null);

  useEffect(() => {
    // 테스트 모드 정보 로드
    const loadTestModeInfo = async () => {
      const info = await checkTestModeClient();
      setTestModeInfo(info);
    };
    loadTestModeInfo();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        clearAllLocalStorage();
        window.location.href = '/login-test';
      } else {
        console.error('로그아웃 실패');
        alert('로그아웃에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('로그아웃 요청 중 오류 발생:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };

  // TTS (Text-to-Speech) 함수
  const speakText = (text: string, category: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('이 브라우저는 음성 읽기 기능을 지원하지 않습니다.');
      return;
    }

    // 일시정지 상태였다가 다시 시작하는 경우
    if (speakingCategory === category && isPaused) {
      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.resume();
          setIsPaused(false);
        }
      } catch (error) {
        console.error('Resume error:', error);
        // resume 실패 시 처음부터 다시 시작
        window.speechSynthesis.cancel();
        setSpeakingCategory(null);
        setIsPaused(false);
        // 재귀 호출로 다시 시작
        setTimeout(() => speakText(text, category), 100);
      }
      return;
    }

    // 새로 시작하는 경우
    // 이전 음성 중지
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // 무시
    }
    
    setSpeakingCategory(category);
    setIsPaused(false);
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9; // 읽기 속도 (조금 느리게)
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onend = () => {
      setSpeakingCategory(null);
      setIsPaused(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setSpeakingCategory(null);
      setIsPaused(false);
      // pause/resume 관련 오류는 사용자에게 알리지 않음
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        alert('음성 읽기 중 오류가 발생했습니다.');
      }
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Speak error:', error);
      setSpeakingCategory(null);
      setIsPaused(false);
      alert('음성 읽기를 시작할 수 없습니다.');
    }
  };

  // 음성 일시정지/재개 토글
  const togglePauseResume = (category: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (speakingCategory !== category) {
      return;
    }

    try {
      if (isPaused) {
        // 재개
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          setIsPaused(false);
        } else {
          // 이미 재생 중이면 상태만 업데이트
          setIsPaused(false);
        }
      } else {
        // 일시정지
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.pause();
          setIsPaused(true);
        } else {
          // 재생 중이 아니면 상태만 업데이트
          setIsPaused(true);
        }
      }
    } catch (error) {
      console.error('Pause/Resume error:', error);
      // 오류 발생 시 상태 리셋
      setSpeakingCategory(null);
      setIsPaused(false);
    }
  };

  // 음성 읽기 중지
  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // 무시
      }
      setSpeakingCategory(null);
      setIsPaused(false);
    }
  };

  // iOS 키보드 및 viewport 처리
  useKeyboardHandler();
  useViewportHeight();

  // 기능 사용 추적
  useEffect(() => {
    trackFeature('checklist');
  }, []);

  // 기본 체크리스트 항목들
  const getDefaultItems = (): ChecklistItem[] => [
    { id: Date.now() + 1, text: '여권 (유효기간 6개월 이상)', completed: false },
    { id: Date.now() + 2, text: 'E-티켓 또는 승선권', completed: false },
    { id: Date.now() + 3, text: '신용카드 (해외 사용 가능)', completed: false },
    { id: Date.now() + 4, text: '현금 (달러 또는 현지 화폐)', completed: false },
    { id: Date.now() + 5, text: '여행자 보험 증서', completed: false },
    { id: Date.now() + 6, text: '비자 (필요한 경우)', completed: false },
    { id: Date.now() + 7, text: '선상 정장 (캡틴 디너용)', completed: false },
    { id: Date.now() + 8, text: '편한 신발 (관광용)', completed: false },
    { id: Date.now() + 9, text: '실내화 또는 슬리퍼', completed: false },
    { id: Date.now() + 10, text: '수영복', completed: false },
    { id: Date.now() + 11, text: '가디건 또는 얇은 외투', completed: false },
    { id: Date.now() + 12, text: '속옷 & 양말', completed: false },
    { id: Date.now() + 13, text: '잠옷', completed: false },
    { id: Date.now() + 14, text: '휴대폰 충전기', completed: false },
    { id: Date.now() + 15, text: '보조배터리', completed: false },
    { id: Date.now() + 16, text: '멀티 어댑터', completed: false },
    { id: Date.now() + 17, text: '카메라', completed: false },
    { id: Date.now() + 18, text: '상비약 (소화제, 진통제)', completed: false },
    { id: Date.now() + 19, text: '멀미약', completed: false },
    { id: Date.now() + 20, text: '개인 처방약', completed: false },
    { id: Date.now() + 21, text: '선크림', completed: false },
    { id: Date.now() + 22, text: '모기 퇴치제', completed: false },
    { id: Date.now() + 23, text: '세면도구 (칫솔, 치약)', completed: false },
    { id: Date.now() + 24, text: '화장품', completed: false },
    { id: Date.now() + 25, text: '선글라스', completed: false },
    { id: Date.now() + 26, text: '모자', completed: false },
    { id: Date.now() + 27, text: '우산 또는 우비', completed: false },
    { id: Date.now() + 28, text: '가방 또는 백팩', completed: false },
    { id: Date.now() + 29, text: '지퍼백 (액체류 담기)', completed: false },
  ];

  // 기본 항목을 서버에 저장하는 함수
  const createDefaultItemsOnServer = async (defaultItems: ChecklistItem[]) => {
    for (const item of defaultItems) {
      try {
        const res = await fetch('/api/checklist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ text: item.text }),
        });
        
        if (res.ok) {
          const serverItem = await res.json();
          const finalItem = serverItem.item || serverItem;
          // 서버에서 받은 ID로 업데이트
          setItems(prev => {
            const updated = prev.map(localItem =>
              localItem.id === item.id ? finalItem : localItem
            );
            // localStorage도 업데이트
            if (typeof window !== 'undefined') {
              const STORAGE_KEY = 'cruise-guide-checklist';
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            }
            return updated;
          });
          // 서버 저장 간격 조절
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error('[Checklist] Error creating default item on server:', error);
      }
    }
  };

  // localStorage에서 서버로 동기화하는 함수
  const syncLocalStorageToServer = async (localItems: ChecklistItem[]) => {
    const STORAGE_KEY = 'cruise-guide-checklist';
    
    try {
      // 서버에서 현재 항목들 가져오기
      const res = await fetch('/api/checklist', {
        credentials: 'include',
      });
      
      if (!res.ok) {
        console.warn('[Checklist] Failed to fetch server items for sync');
        return;
      }
      
      const data = await res.json();
      const serverItems = data.items || [];
      const serverItemIds = new Set(serverItems.map((item: ChecklistItem) => item.id));
      
      // localStorage에만 있고 서버에 없는 항목들을 찾아서 서버에 저장
      const itemsToSync = localItems.filter(item => {
        // 숫자 ID이고 서버에 없는 항목 (임시 ID로 생성된 항목들)
        return typeof item.id === 'number' && !serverItemIds.has(item.id);
      });
      
      if (itemsToSync.length > 0) {
        console.log(`[Checklist] Syncing ${itemsToSync.length} items to server...`);
        
        let updatedLocalItems = [...localItems];
        
        // 각 항목을 서버에 저장
        for (const item of itemsToSync) {
          try {
            const addRes = await fetch('/api/checklist', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ text: item.text }),
            });
            
            if (addRes.ok) {
              const serverItem = await addRes.json();
              const finalItem = serverItem.item || serverItem;
              
              // localStorage에서 임시 ID를 서버 ID로 업데이트
              updatedLocalItems = updatedLocalItems.map(localItem =>
                localItem.id === item.id ? finalItem : localItem
              );
              
              // 완료 상태도 동기화
              if (item.completed !== finalItem.completed) {
                await fetch(`/api/checklist/${finalItem.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  credentials: 'include',
                  body: JSON.stringify({ completed: item.completed }),
                });
                // 완료 상태도 업데이트
                updatedLocalItems = updatedLocalItems.map(localItem =>
                  localItem.id === finalItem.id ? { ...localItem, completed: item.completed } : localItem
                );
              }
            }
          } catch (syncError) {
            console.error('[Checklist] Error syncing item to server:', syncError);
          }
        }
        
        // localStorage 업데이트
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLocalItems));
        }
        
        // 동기화 후 서버에서 다시 로드하여 최신 상태로 업데이트
        const reloadRes = await fetch('/api/checklist', {
          credentials: 'include',
        });
        
        if (reloadRes.ok) {
          const reloadData = await reloadRes.json();
          const reloadItems = reloadData.items || reloadData;
          if (Array.isArray(reloadItems)) {
            setItems(reloadItems);
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(reloadItems));
            }
          }
        }
      }
    } catch (error) {
      console.error('[Checklist] Error syncing to server:', error);
    }
  };

  // API: 체크리스트 목록 불러오기 (API 실패 시 localStorage 사용)
  const loadItems = async () => {
    setIsLoading(true);
    setError(null);
    
    const STORAGE_KEY = 'cruise-guide-checklist';
    
    try {
      const res = await fetch('/api/checklist', {
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        const items = data.items || data;
        if (Array.isArray(items)) {
          // 항목이 없으면 기본 항목 생성
          if (items.length === 0) {
            const defaultItems = getDefaultItems();
            setItems(defaultItems);
            // localStorage에 저장
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultItems));
            }
            // 백그라운드에서 서버에 저장
            createDefaultItemsOnServer(defaultItems).catch(console.error);
          } else {
            setItems(items);
            // localStorage에도 백업 저장
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
            }
          }
          return;
        }
      }
      
      // API 실패 시 localStorage에서 로드
      throw new Error('API failed, trying localStorage');
    } catch (err: any) {
      console.error('Error loading checklist from API, trying localStorage:', err);
      
      // localStorage에서 로드 시도
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const localItems = JSON.parse(saved);
            if (Array.isArray(localItems) && localItems.length > 0) {
              setItems(localItems);
              console.log('[Checklist] Loaded from localStorage:', localItems.length, 'items');
              
              // 백그라운드에서 서버로 동기화 시도
              syncLocalStorageToServer(localItems).catch(console.error);
              
              // localStorage에 저장된 데이터가 있으면 에러 표시하지 않음
              setError(null);
              return;
            }
          }
        } catch (e) {
          console.error('Error parsing localStorage:', e);
        }
      }
      
      // localStorage에도 없으면 기본 항목 생성
      const defaultItems = getDefaultItems();
      setItems(defaultItems);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultItems));
      }
      // 백그라운드에서 서버에 저장
      createDefaultItemsOnServer(defaultItems).catch(console.error);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 마운트 시 불러오기
  useEffect(() => {
    loadItems();
    // iOS 키보드 가림 방지용 safest area 여백
    document.body.classList.add('pb-24', 'sm:pb-0');
    return () => {
      document.body.classList.remove('pb-24', 'sm:pb-0');
      // 컴포넌트 언마운트 시 음성 읽기 중지
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // 아이템 추가 (API 실패 시 localStorage 사용)
  const handleAdd = async (value?: string) => {
    const text = (value !== undefined ? value : newText).trim();
    if (!text) return;
    
    const STORAGE_KEY = 'cruise-guide-checklist';
    
    // 즉시 로컬 상태에 추가 (낙관적 업데이트)
    const newItem: ChecklistItem = {
      id: Date.now(), // 임시 ID
      text,
      completed: false,
    };
    
    let updatedItems: ChecklistItem[] = [];
    setItems(prev => {
      updatedItems = [...prev, newItem];
      // localStorage에도 즉시 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
      }
      return updatedItems;
    });
    
    if (value === undefined) setNewText('');
    
    setIsLoading(true);
    setError(null);
    hapticClick();
    
    // API 호출 시도 (실패해도 로컬에는 이미 저장됨)
    try {
      const res = await fetch('/api/checklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ text }),
      });
      
      if (res.ok) {
        const serverItem = await res.json();
        const finalItem = serverItem.item || serverItem;
        // 서버에서 받은 ID로 업데이트
        setItems(prev => {
          const finalItems = prev.map(item => 
            item.id === newItem.id ? finalItem : item
          );
          // localStorage도 업데이트
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(finalItems));
          }
          return finalItems;
        });
      } else {
        // API 실패 시 나중에 동기화할 수 있도록 에러 표시하지 않음
        console.warn('[Checklist] Failed to save item to server, will sync later');
      }
    } catch (err: any) {
      console.error('Error adding item to API (will sync later):', err);
      // API 실패해도 로컬에는 이미 저장되어 있으므로 에러 표시하지 않음
      // 나중에 동기화 함수가 자동으로 처리함
    } finally {
      setIsLoading(false);
    }
  };

  // 완료 토글 (API 실패 시 localStorage 사용)
  const handleToggle = async (id: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const STORAGE_KEY = 'cruise-guide-checklist';
    const newCompleted = !item.completed;

    if (!item.completed) {
      hapticSuccess();
    } else {
      hapticClick();
    }

    // 즉시 로컬 상태 업데이트
    setItems(prev => {
      const updatedItems = prev.map(i => 
        i.id === id ? { ...i, completed: newCompleted } : i
      );
      // localStorage에도 즉시 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
      }
      return updatedItems;
    });

    setIsLoading(true);
    setError(null);

    // API 호출 시도 (실패해도 로컬에는 이미 업데이트됨)
    try {
      const res = await fetch(`/api/checklist/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ completed: newCompleted }),
      });
      
      if (res.ok) {
        const updated = await res.json();
        setItems(prev => {
          const finalItems = prev.map(i => 
            i.id === id ? { ...i, ...updated } : i
          );
          // localStorage도 업데이트
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(finalItems));
          }
          return finalItems;
        });
      }
    } catch (err: any) {
      console.error('Error toggling item in API (already updated locally):', err);
      // API 실패해도 로컬에는 이미 업데이트되어 있으므로 에러 표시하지 않음
    } finally {
      setIsLoading(false);
    }
  };

  // 항목 수정
  const handleUpdate = async (id: number, newText: string) => {
    const trimmedText = newText.trim();
    if (!trimmedText) {
      setEditingItemId(null);
      return;
    }

    const STORAGE_KEY = 'cruise-guide-checklist';
    
    // 즉시 로컬 상태 업데이트
    setItems(prev => {
      const updatedItems = prev.map(i => 
        i.id === id ? { ...i, text: trimmedText } : i
      );
      // localStorage에도 즉시 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
      }
      return updatedItems;
    });

    setEditingItemId(null);
    setIsLoading(true);
    setError(null);

    // API 호출 시도
    try {
      const res = await fetch(`/api/checklist/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ text: trimmedText }),
      });
      
      if (res.ok) {
        const updated = await res.json();
        setItems(prev => {
          const finalItems = prev.map(i => 
            i.id === id ? { ...i, ...updated } : i
          );
          // localStorage도 업데이트
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(finalItems));
          }
          return finalItems;
        });
      }
    } catch (err: any) {
      console.error('Error updating item in API (already updated locally):', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 편집 시작
  const handleStartEdit = (item: ChecklistItem) => {
    setEditingItemId(item.id);
    setEditingText(item.text);
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingText('');
  };

  // 체크리스트 초기화 (리셋)
  const handleReset = async () => {
    if (!window.confirm('체크리스트를 초기 상태로 리셋하시겠습니까?\n모든 항목과 체크 상태가 삭제되고 기본 항목으로 다시 시작됩니다.')) {
      return;
    }

    const STORAGE_KEY = 'cruise-guide-checklist';
    const defaultListKey = 'checklist-default-items-created';
    
    setIsLoading(true);
    setError(null);

    try {
      // localStorage 초기화
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(defaultListKey);
      }

      // API에서 모든 항목 삭제 시도
      try {
        const currentItems = items;
        for (const item of currentItems) {
          try {
            await fetch(`/api/checklist/${item.id}`, {
              method: 'DELETE',
              credentials: 'include',
            });
          } catch (e) {
            // 개별 삭제 실패는 무시
          }
        }
      } catch (e) {
        // API 삭제 실패는 무시 (이미 localStorage는 삭제됨)
      }

      // 기본 항목 생성
      const defaultItems = getDefaultItems();

      // localStorage에 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultItems));
        localStorage.setItem(defaultListKey, 'true');
      }

      // 상태 업데이트
      setItems(defaultItems);

      // 백그라운드에서 API로 전송 시도
      createDefaultItemsOnServer(defaultItems).catch(console.error);

    } catch (err: any) {
      setError('리셋 중 오류가 발생했습니다.');
      console.error('Reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 삭제 (API 실패 시 localStorage 사용)
  const handleDelete = async (id: number) => {
    hapticImpact();
    
    const STORAGE_KEY = 'cruise-guide-checklist';
    
    // 즉시 로컬 상태에서 제거
    setItems(prev => {
      const updatedItems = prev.filter(i => i.id !== id);
      // localStorage에도 즉시 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
      }
      return updatedItems;
    });

    setIsLoading(true);
    setError(null);

    // API 호출 시도 (실패해도 로컬에서는 이미 삭제됨)
    try {
      const res = await fetch(`/api/checklist/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!res.ok) {
        console.warn('Failed to delete item from API, but removed from local storage');
      }
    } catch (err: any) {
      console.error('Error deleting item from API (already removed locally):', err);
      // API 실패해도 로컬에서는 이미 삭제되어 있으므로 에러 표시하지 않음
    } finally {
      setIsLoading(false);
    }
  };

  const completed = useMemo(() => items.filter(i => i.completed).length, [items]);
  const total = items.length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  // 미완료 → 완료 순서로 정렬
  const sorted = useMemo(
    () => [...items].sort((a, b) => Number(a.completed) - Number(b.completed)),
    [items]
  );

  const fontCls =
    textScale === 3 ? 'text-2xl' : textScale === 2 ? 'text-xl' : 'text-lg'; // 글씨 크기 증가 (30대 이상 가독성 향상)

  const quickChips = [
    '여권·신분증', 'E-티켓', '신용카드', '상비약',
    '선상 정장', '편한 신발', '수영복', '충전기·어댑터',
  ];

  // 금지 물품 정보
  const prohibitedItems = {
    flight: {
      title: '비행기 승선 시 금지 물품',
      items: [
        '액체류 (100ml 초과, 총 1L 초과)',
        '날카로운 물건 (가위, 면도기, 칼 등)',
        '전자 담배 (기내 휴대 금지)',
        '무기류 (총, 칼, 폭발물 등)',
        '가연성 물질 (라이터(개인용 1개만 가능), 성냥 등)',
        '압축 가스 (스프레이, 발포제 등)',
        '유독 물질 및 화학 약품',
      ],
      specialItems: [
        {
          title: '🔋 보조배터리 (Power Bank) - 반입 가능하지만 규정 준수 필수!',
          details: [
            '✅ 휴대 가능: 100Wh 이하 (약 27,000mAh 이하)',
            '✅ 기내 휴대: 반드시 기내 휴대만 가능 (수하물 금지)',
            '✅ 개수 제한: 보통 2개까지 (항공사마다 다름)',
            '✅ 용량 표시: 용량(mAh) 또는 전력량(Wh)이 명확히 표시된 것만',
            '⚠️ 주의: 손상된 배터리, 용량 표시 불명확한 배터리는 반입 금지',
            '⚠️ 주의: 100Wh 초과 배터리는 항공사 사전 승인 필요 (최대 160Wh)',
            '💡 팁: 출발 전 항공사 홈페이지에서 최신 규정 확인 필수',
          ],
        },
      ],
    },
    cruise: {
      title: '크루즈 승선 시 금지 물품',
      items: [
        '무기류 (총, 칼, 나이프 등)',
        '전자 담배 (선내 흡연 금지 구역)',
        '알코올 음료 (선내에서 구매 가능)',
        '가연성 물질 (라이터, 성냥 대량 등)',
        '유해 화학 약품',
        '동물 (서비스 동물 제외)',
        '전기 라면 냄비 (선내 전기 규정 위반)',
      ],
      specialItems: [
        {
          title: '🔋 보조배터리 (Power Bank) - 크루즈에서는 비교적 자유롭게 반입 가능',
          details: [
            '✅ 반입 가능: 용량 제한 없이 일반적으로 반입 가능',
            '✅ 수하물 허용: 기내 휴대뿐만 아니라 수하물에도 가능 (비행기와 다름)',
            '✅ 사용 가능: 선내에서 충전 및 사용 가능',
            '⚠️ 주의: 손상된 배터리나 발열이 심한 배터리는 반입 금지',
            '⚠️ 주의: 멀티탭 3구 이하 추천 (여행용)',
            '⚠️ 주의: 일부 크루즈 선사는 특정 용량 이상 제한할 수 있음',
            '💡 팁: 크루즈 여행은 기간이 길어 보조배터리 필수! 충전기와 함께 준비',
            '💡 팁: 해외 여행 시 현지 전압 확인 (110V/220V) 및 어댑터 필요',
          ],
        },
      ],
    },
    countries: {
      title: '나라별 주의 물품',
      items: [
        '🇸🇬 싱가포르: 껌 반입 금지, 무단 흡연 벌금',
        '🇦🇺 호주/뉴질랜드: 식품, 농산물 엄격한 검역',
        '🇯🇵 일본: 일부 과일, 육류 반입 금지',
        '🇨🇳 중국: 불법 서적, 종교 서적 제한',
        '🇸🇦 사우디: 알코올, 돼지고기 전면 금지',
        '🇦🇪 UAE: 알코올 제한, 노출 의상 주의',
        '🇹🇭 태국: 마약 엄격 금지, 최고 사형',
        '🇮🇩 인도네시아: 마약 최고 사형, 알코올 제한 지역 있음',
      ],
    },
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* 72시간 카운트다운 배너 (상단 고정) */}
      {testModeInfo && testModeInfo.isTestMode && (
        <TutorialCountdown testModeInfo={testModeInfo} onLogout={handleLogout} />
      )}

      {/* 상단 고정 헤더 */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b shadow-md">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/tools-test')}
                className="inline-flex items-center gap-1 rounded-xl border-2 border-purple-200 px-3 py-2 hover:bg-purple-50 transition-colors"
                aria-label="뒤로가기"
              >
                <FiChevronLeft className="text-xl text-purple-600" />
                <span className="font-semibold text-purple-600">뒤로가기</span>
              </button>
            </div>
            <button
              onClick={() => router.push('/chat-test')}
              className="hidden sm:inline-flex items-center rounded-xl border-2 border-purple-200 px-4 py-2 hover:bg-purple-50 transition-colors"
            >
              <span className="text-purple-600 font-semibold">지니와 대화하기</span>
            </button>
          </div>
          
          {/* 튜토리얼 스타일 제목 */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-4 shadow-lg">
              <span className="text-5xl md:text-6xl">✅</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 leading-tight">
              꼼꼼한 지니의 여행 준비물 체크리스트
            </h1>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
              72시간 동안 모든 기능을 무료로 체험해보세요!
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4">
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 md:p-5 text-red-700 text-base md:text-lg">
                ⚠️ {error}
              </div>
            </div>
          )}

          {/* 진행률 - 튜토리얼 스타일 */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-5 md:p-6 border-2 border-blue-200 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xl md:text-2xl text-gray-700 font-bold">
                진행률 <span className="text-gray-900 text-2xl md:text-3xl">{completed}</span> / {total}
              </span>
              <span className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {progress}%
              </span>
            </div>
            <div className="h-5 md:h-6 w-full rounded-full bg-gray-200 overflow-hidden shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 shadow-lg"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="mx-auto max-w-3xl px-4 py-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600">체크리스트를 불러오는 중...</p>
        </div>
      )}

      {/* 컨텐츠 */}
      {!isLoading && (
        <div className="mx-auto max-w-3xl px-4 py-4 sm:py-6">
        {/* 글자 크기 조절 및 리셋 */}
        <div className="mb-3 flex items-center gap-2 flex-wrap">
          <span className="text-gray-600">글자 크기</span>
          <div className="flex overflow-hidden rounded-xl border">
            <button
              className={`px-3 py-1 text-base font-semibold ${textScale === 1 ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'}`}
              onClick={() => setTextScale(1)}
            >
              작게
            </button>
            <button
              className={`px-3 py-1 text-base font-semibold ${textScale === 2 ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'}`}
              onClick={() => setTextScale(2)}
            >
              보통
            </button>
            <button
              className={`px-3 py-1 text-base font-semibold ${textScale === 3 ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'}`}
              onClick={() => setTextScale(3)}
            >
              크게
            </button>
          </div>
          <button
            onClick={handleReset}
            disabled={isLoading}
            className="ml-auto px-3 py-1 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="체크리스트 초기화"
          >
            🔄 리셋
          </button>
        </div>

        {/* 안내 메시지 - 튜토리얼 스타일 */}
        <div className="mb-6 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-300 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="text-4xl">💡</div>
            <div className="flex-1">
              <p className="text-xl text-gray-900 font-bold mb-2">
                ✓ 준비한 항목을 체크하세요
              </p>
              <p className="text-base text-gray-700 mb-3">
                체크한 내용은 자동으로 저장됩니다
              </p>
              <div className="bg-white/80 rounded-lg p-3 border border-blue-200">
                <p className="text-sm text-gray-600">
                  <span className="font-bold text-purple-600">💡 사용 팁:</span> 각 항목을 클릭하면 체크/해제됩니다. 
                  <br />
                  <span className="font-bold text-purple-600">🔊 음성 읽기:</span> 카테고리별로 음성으로 들을 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 금지 물품 정보 (접기/펼치기) - 튜토리얼 스타일 */}
        <div className="mb-6 bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 border-2 border-yellow-300 rounded-2xl overflow-hidden shadow-lg">
          <button
            onClick={() => setIsProhibitedItemsExpanded(!isProhibitedItemsExpanded)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-yellow-100/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="text-4xl">⚠️</div>
              <div>
                <span className="text-xl font-bold text-yellow-900 block">
                  가져가면 안 되는 물건 확인하기
                </span>
                <span className="text-sm text-yellow-700 mt-1 block">
                  크루즈 및 항공기 반입 금지 물품 안내
                </span>
              </div>
            </div>
            {isProhibitedItemsExpanded ? (
              <FiChevronUp className="text-2xl text-yellow-700" />
            ) : (
              <FiChevronDown className="text-2xl text-yellow-700" />
            )}
          </button>

          {isProhibitedItemsExpanded && (
            <div className="px-5 pb-5 space-y-5 bg-white/50">
              {/* 비행기 금지 물품 */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-5 border-2 border-red-200 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-3xl">✈️</span>
                    <span>{prohibitedItems.flight.title}</span>
                  </h3>
                  <button
                    onClick={() => {
                      if (speakingCategory === 'flight') {
                        togglePauseResume('flight');
                      } else {
                        const flightText = `${prohibitedItems.flight.title}. ${prohibitedItems.flight.items.join(', ')}. ${prohibitedItems.flight.specialItems?.[0]?.title || ''}. ${prohibitedItems.flight.specialItems?.[0]?.details.join('. ') || ''}`;
                        speakText(flightText, 'flight');
                      }
                    }}
                    className={`flex items-center justify-center w-16 h-16 rounded-full transition-all shadow-lg border-4 ${
                      speakingCategory === 'flight' 
                        ? (isPaused ? 'bg-yellow-500 border-yellow-600 text-white' : 'bg-red-600 border-red-700 text-white animate-pulse')
                        : 'bg-yellow-400 border-yellow-500 hover:bg-yellow-500 text-white shadow-xl'
                    }`}
                    aria-label={speakingCategory === 'flight' && isPaused ? '음성 재개' : speakingCategory === 'flight' ? '음성 일시정지' : '음성으로 듣기'}
                    title={speakingCategory === 'flight' && isPaused ? '재개' : speakingCategory === 'flight' ? '일시정지' : '음성으로 듣기'}
                  >
                    {speakingCategory === 'flight' && isPaused ? (
                      <FiPause className="text-3xl font-bold" />
                    ) : (
                      <FiVolume2 className="text-3xl font-bold" />
                    )}
                  </button>
                </div>
                <ul className="space-y-2 ml-6">
                  {prohibitedItems.flight.items.map((item, idx) => (
                    <li key={idx} className="text-lg text-gray-700 list-disc">
                      {item}
                    </li>
                  ))}
                </ul>
                
                {/* 보조배터리 상세 정보 */}
                {prohibitedItems.flight.specialItems && prohibitedItems.flight.specialItems.map((special, idx) => (
                  <div key={idx} className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-bold text-blue-900">
                        {special.title}
                      </h4>
                      <button
                        onClick={() => {
                          if (speakingCategory === 'flight-battery') {
                            togglePauseResume('flight-battery');
                          } else {
                            const batteryText = `${special.title}. ${special.details.join('. ')}`;
                            speakText(batteryText, 'flight-battery');
                          }
                        }}
                        className={`flex items-center justify-center w-16 h-16 rounded-full transition-all shadow-lg border-4 ${
                          speakingCategory === 'flight-battery' 
                            ? (isPaused ? 'bg-yellow-500 border-yellow-600 text-white' : 'bg-blue-600 border-blue-700 text-white animate-pulse')
                            : 'bg-blue-500 border-blue-600 hover:bg-blue-600 text-white shadow-xl'
                        }`}
                        aria-label={speakingCategory === 'flight-battery' && isPaused ? '음성 재개' : speakingCategory === 'flight-battery' ? '음성 일시정지' : '음성으로 듣기'}
                        title={speakingCategory === 'flight-battery' && isPaused ? '재개' : speakingCategory === 'flight-battery' ? '일시정지' : '음성으로 듣기'}
                      >
                        {speakingCategory === 'flight-battery' && isPaused ? (
                          <FiPause className="text-3xl font-bold" />
                        ) : (
                          <FiVolume2 className="text-3xl font-bold" />
                        )}
                      </button>
                    </div>
                    <ul className="space-y-2 ml-4">
                      {special.details.map((detail, detailIdx) => (
                        <li key={detailIdx} className="text-base text-blue-800">
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* 크루즈 금지 물품 */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-5 border-2 border-blue-200 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-3xl">🚢</span>
                    <span>{prohibitedItems.cruise.title}</span>
                  </h3>
                  <button
                    onClick={() => {
                      if (speakingCategory === 'cruise') {
                        togglePauseResume('cruise');
                      } else {
                        const cruiseText = `${prohibitedItems.cruise.title}. ${prohibitedItems.cruise.items.join(', ')}. ${prohibitedItems.cruise.specialItems?.[0]?.title || ''}. ${prohibitedItems.cruise.specialItems?.[0]?.details.join('. ') || ''}`;
                        speakText(cruiseText, 'cruise');
                      }
                    }}
                    className={`flex items-center justify-center w-16 h-16 rounded-full transition-all shadow-lg border-4 ${
                      speakingCategory === 'cruise' 
                        ? (isPaused ? 'bg-yellow-500 border-yellow-600 text-white' : 'bg-red-600 border-red-700 text-white animate-pulse')
                        : 'bg-yellow-400 border-yellow-500 hover:bg-yellow-500 text-white shadow-xl'
                    }`}
                    aria-label={speakingCategory === 'cruise' && isPaused ? '음성 재개' : speakingCategory === 'cruise' ? '음성 일시정지' : '음성으로 듣기'}
                    title={speakingCategory === 'cruise' && isPaused ? '재개' : speakingCategory === 'cruise' ? '일시정지' : '음성으로 듣기'}
                  >
                    {speakingCategory === 'cruise' && isPaused ? (
                      <FiPause className="text-3xl font-bold" />
                    ) : (
                      <FiVolume2 className="text-3xl font-bold" />
                    )}
                  </button>
                </div>
                <ul className="space-y-2 ml-6">
                  {prohibitedItems.cruise.items.map((item, idx) => (
                    <li key={idx} className="text-lg text-gray-700 list-disc">
                      {item}
                    </li>
                  ))}
                </ul>
                
                {/* 보조배터리 상세 정보 */}
                {prohibitedItems.cruise.specialItems && prohibitedItems.cruise.specialItems.map((special, idx) => (
                  <div key={idx} className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-bold text-blue-900">
                        {special.title}
                      </h4>
                      <button
                        onClick={() => {
                          if (speakingCategory === 'cruise-battery') {
                            togglePauseResume('cruise-battery');
                          } else {
                            const batteryText = `${special.title}. ${special.details.join('. ')}`;
                            speakText(batteryText, 'cruise-battery');
                          }
                        }}
                        className={`flex items-center justify-center w-16 h-16 rounded-full transition-all shadow-lg border-4 ${
                          speakingCategory === 'cruise-battery' 
                            ? (isPaused ? 'bg-yellow-500 border-yellow-600 text-white' : 'bg-blue-600 border-blue-700 text-white animate-pulse')
                            : 'bg-blue-500 border-blue-600 hover:bg-blue-600 text-white shadow-xl'
                        }`}
                        aria-label={speakingCategory === 'cruise-battery' && isPaused ? '음성 재개' : speakingCategory === 'cruise-battery' ? '음성 일시정지' : '음성으로 듣기'}
                        title={speakingCategory === 'cruise-battery' && isPaused ? '재개' : speakingCategory === 'cruise-battery' ? '일시정지' : '음성으로 듣기'}
                      >
                        {speakingCategory === 'cruise-battery' && isPaused ? (
                          <FiPause className="text-3xl font-bold" />
                        ) : (
                          <FiVolume2 className="text-3xl font-bold" />
                        )}
                      </button>
                    </div>
                    <ul className="space-y-2 ml-4">
                      {special.details.map((detail, detailIdx) => (
                        <li key={detailIdx} className="text-base text-blue-800">
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* 나라별 주의 물품 */}
              <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-5 border-2 border-green-200 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-3xl">🌍</span>
                    <span>{prohibitedItems.countries.title}</span>
                  </h3>
                  <button
                    onClick={() => {
                      if (speakingCategory === 'countries') {
                        togglePauseResume('countries');
                      } else {
                        const countriesText = `${prohibitedItems.countries.title}. ${prohibitedItems.countries.items.join('. ')}`;
                        speakText(countriesText, 'countries');
                      }
                    }}
                    className={`flex items-center justify-center w-16 h-16 rounded-full transition-all shadow-lg border-4 ${
                      speakingCategory === 'countries' 
                        ? (isPaused ? 'bg-yellow-500 border-yellow-600 text-white' : 'bg-red-600 border-red-700 text-white animate-pulse')
                        : 'bg-yellow-400 border-yellow-500 hover:bg-yellow-500 text-white shadow-xl'
                    }`}
                    aria-label={speakingCategory === 'countries' && isPaused ? '음성 재개' : speakingCategory === 'countries' ? '음성 일시정지' : '음성으로 듣기'}
                    title={speakingCategory === 'countries' && isPaused ? '재개' : speakingCategory === 'countries' ? '일시정지' : '음성으로 듣기'}
                  >
                    {speakingCategory === 'countries' && isPaused ? (
                      <FiPause className="text-3xl font-bold" />
                    ) : (
                      <FiVolume2 className="text-3xl font-bold" />
                    )}
                  </button>
                </div>
                <ul className="space-y-2 ml-6">
                  {prohibitedItems.countries.items.map((item, idx) => (
                    <li key={idx} className="text-lg text-gray-700 list-disc">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 pt-4 border-t-2 border-yellow-300 bg-yellow-50/50 rounded-lg p-4">
                <p className="text-base text-yellow-900 font-semibold flex items-start gap-2">
                  <span className="text-xl">💡</span>
                  <span>
                    주의: 규정은 항공사 및 크루즈 회사, 국가별로 다를 수 있으니 출발 전 반드시 확인하세요.
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 빠른 추가 칩 - 튜토리얼 스타일 */}
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-lg font-bold text-gray-700">⚡ 빠른 추가:</span>
            <span className="text-sm text-gray-500">자주 사용하는 항목을 한 번에 추가하세요</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickChips.map(chip => (
              <button
                key={chip}
                onClick={() => handleAdd(chip)}
                className="rounded-full border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50 px-5 py-2.5 text-base font-semibold hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 hover:border-purple-400 hover:shadow-md transition-all active:scale-95"
                disabled={isLoading}
              >
                + {chip}
              </button>
            ))}
          </div>
        </div>

        {/* 리스트 - 튜토리얼 스타일 */}
        <ul className="space-y-3">
          {sorted.map(item => (
            <li
              key={item.id}
              className={`flex items-center gap-3 rounded-2xl border-2 bg-white px-4 sm:px-5 py-4 sm:py-4 shadow-md transition-all
                          ${item.completed ? 'opacity-70 border-gray-200' : 'border-purple-200 hover:border-purple-300 hover:shadow-lg'}
                          ${editingItemId === item.id ? 'ring-2 ring-purple-400 border-purple-400' : ''}`}
            >
              <button
                aria-label={item.completed ? '완료 해제' : '완료 처리'}
                onClick={() => {
                  if (editingItemId === item.id) {
                    // 편집 중이면 체크 클릭 시 수정 완료
                    handleUpdate(item.id, editingText);
                  } else {
                    // 편집 중이 아니면 완료 토글
                    handleToggle(item.id);
                  }
                }}
                className={`flex-shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-full border
                            ${item.completed ? 'bg-green-50 border-green-300' : 'bg-white'}
                            ${editingItemId === item.id ? 'bg-blue-50 border-blue-300' : ''}
                            active:scale-[0.98] transition-transform`}
                disabled={isLoading}
              >
                {editingItemId === item.id ? (
                  <FiCheck className="text-blue-600 text-2xl" />
                ) : item.completed ? (
                  <FiCheck className="text-green-600 text-2xl" />
                ) : (
                  <span className="block h-5 w-5 rounded-md border" />
                )}
              </button>

              {editingItemId === item.id ? (
                // 편집 모드
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdate(item.id, editingText);
                      } else if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                    autoFocus
                    className={`flex-1 rounded-lg border-2 border-blue-300 px-3 py-2 ${fontCls} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleCancelEdit}
                    className="flex-shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-95 transition-transform"
                    aria-label="취소"
                  >
                    <FiX className="text-lg text-gray-600" />
                  </button>
                </div>
              ) : (
                // 표시 모드
                <div 
                  className={`flex-1 ${fontCls} cursor-pointer`}
                  onClick={() => handleStartEdit(item)}
                >
                  <span className={`${item.completed ? 'line-through text-gray-400' : 'text-gray-900'} font-bold hover:text-blue-600 transition-colors`}>
                    {item.text}
                  </span>
                </div>
              )}

              <button
                aria-label="삭제"
                onClick={() => handleDelete(item.id)}
                className="ml-1 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 transition-transform"
                disabled={isLoading || editingItemId === item.id}
              >
                <FiTrash2 className="text-lg" />
              </button>
            </li>
          ))}
        </ul>

        {/* CTA 섹션 - 튜토리얼 스타일 */}
        <div className="mt-8 mb-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 text-white text-center shadow-2xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            🎁 지금 체험하고, 실제 여행에서 활용하세요!
          </h2>
          <p className="text-lg md:text-xl mb-6 opacity-95">
            이 체크리스트를 실제 크루즈 여행에서 사용할 수 있습니다.
            <br />
            체험 기간 동안 모든 기능을 자유롭게 사용해보세요!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
              <div className="font-bold text-lg">✅ 체크리스트</div>
              <div className="text-sm">준비물 관리</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
              <div className="font-bold text-lg">🔊 음성 읽기</div>
              <div className="text-sm">카테고리별 안내</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
              <div className="font-bold text-lg">💾 자동 저장</div>
              <div className="text-sm">실시간 동기화</div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* 하단 고정 입력 바 (모바일에 특히 편함) - 튜토리얼 스타일 */}
      <div className="fixed inset-x-0 bottom-[max(0px,env(safe-area-inset-bottom))] z-30 border-t-2 border-purple-200 bg-gradient-to-r from-white to-purple-50/50 backdrop-blur supports-[padding:max(0px)]:pb-[max(env(safe-area-inset-bottom),0px)] shadow-2xl">
        <div className="mx-auto max-w-3xl px-4 py-4 flex gap-3">
          <input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="새로운 준비물을 입력하세요…"
            className="h-14 flex-1 rounded-xl border-2 border-purple-200 px-5 text-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all"
            disabled={isLoading}
          />
          <button
            onClick={() => handleAdd()}
            disabled={isLoading || !newText.trim()}
            className="h-14 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 text-white text-lg font-bold hover:from-purple-700 hover:to-pink-700 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <FiPlus className="text-xl" />
            <span>추가</span>
          </button>
        </div>
      </div>
    </main>
  );
}
