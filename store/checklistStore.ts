import { create } from 'zustand';
import { showError, showSuccess } from '@/components/ui/Toast';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface ChecklistStore {
  items: ChecklistItem[];
  isLoading: boolean;
  error: string | null;
  
  // 데이터 로드
  loadItems: () => Promise<void>;
  
  // CRUD 작업
  addItem: (text: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  toggleItem: (id: string) => Promise<void>;
  
  // 로컬 상태 관리
  setItems: (items: ChecklistItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // 마이그레이션
  migrateFromLocalStorage: () => Promise<void>;
}

// 기본 체크리스트 항목들
const defaultItems: Omit<ChecklistItem, 'id'>[] = [
  { text: '여권 및 신분증', completed: false },
  { text: '크루즈 승선권/E-Ticket', completed: false },
  { text: '해외 사용 가능 신용카드', completed: false },
  { text: '상비약(멀미약, 소화제 등)', completed: false },
  { text: '선상 정찬용 의류', completed: false },
  { text: '편안한 일상복', completed: false },
  { text: '수영복 및 선글라스', completed: false },
  { text: '충전기 및 어댑터', completed: false },
  { text: '카메라 또는 스마트폰', completed: false },
  { text: '여행용 세면도구', completed: false },
];

// localStorage 키 (마이그레이션용)
const STORAGE_KEY = 'cruise-guide-checklist';
const MIGRATION_KEY = 'checklist-migrated-to-server';

export const useChecklistStore = create<ChecklistStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  
  // 서버에서 데이터 로드 (API 실패 시 localStorage 사용)
  loadItems: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/checklist', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load checklist');
      }

      const data = await response.json();
      
      if (Array.isArray(data.items)) {
        set({ items: data.items });
        // localStorage에도 백업 저장
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.items));
        }
        return;
      }
    } catch (error) {
      console.error('Error loading checklist from API, trying localStorage:', error);
      // API 실패 시 localStorage에서 로드
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const localItems: ChecklistItem[] = JSON.parse(saved);
            if (Array.isArray(localItems)) {
              set({ items: localItems });
              console.log('[Checklist] Loaded from localStorage:', localItems.length, 'items');
              return;
            }
          } catch (e) {
            console.error('Error parsing localStorage:', e);
          }
        }
      }
      // localStorage에도 없으면 에러 표시하지 않고 빈 배열로 시작
      set({ items: [], error: null });
    } finally {
      set({ isLoading: false });
    }
  },
  
  // 항목 추가 (API 실패 시 localStorage 사용)
  addItem: async (text: string) => {
    const newItem: ChecklistItem = {
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      completed: false,
    };

    // 즉시 로컬 상태에 추가 (낙관적 업데이트)
    set((state) => ({ items: [...state.items, newItem] }));
    
    // localStorage에도 즉시 저장
    if (typeof window !== 'undefined') {
      const currentItems = get().items;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentItems));
    }

    // API 호출 시도 (실패해도 로컬에는 이미 저장됨)
    try {
      const response = await fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text }), // API는 'text'를 기대함
      });

      if (response.ok) {
        const data = await response.json();
        if (data.item) {
          // 서버에서 받은 ID로 업데이트
          set((state) => ({
            items: state.items.map((item) =>
              item.id === newItem.id ? data.item : item
            ),
          }));
          // localStorage도 업데이트
          if (typeof window !== 'undefined') {
            const updatedItems = get().items;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
          }
        }
      }
    } catch (error) {
      console.error('Error adding item to API (using local storage):', error);
      // API 실패해도 로컬에는 이미 저장되어 있으므로 에러 표시하지 않음
    }
  },
  
  // 항목 삭제 (API 실패 시 localStorage 사용)
  removeItem: async (id: string) => {
    // 즉시 로컬 상태에서 제거
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
    
    // localStorage에도 즉시 저장
    if (typeof window !== 'undefined') {
      const currentItems = get().items;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentItems));
    }

    // API 호출 시도 (로컬 ID가 아닌 경우만)
    if (!id.startsWith('local_')) {
      try {
        const response = await fetch('/api/checklist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id }),
        });

        if (!response.ok) {
          console.warn('Failed to delete item from API, but removed from local storage');
        }
      } catch (error) {
        console.error('Error deleting item from API (already removed locally):', error);
      }
    }
  },
  
  // 완료 상태 토글 (API 실패 시 localStorage 사용)
  toggleItem: async (id: string) => {
    // 현재 상태 확인
    const currentItem = get().items.find(item => item.id === id);
    if (!currentItem) return;

    const newCompleted = !currentItem.completed;

    // 즉시 로컬 상태 업데이트
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, completed: newCompleted } : item
      ),
    }));

    // localStorage에도 즉시 저장
    if (typeof window !== 'undefined') {
      const currentItems = get().items;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentItems));
    }

    // API 호출 시도 (로컬 ID가 아닌 경우만)
    if (!id.startsWith('local_')) {
      try {
        const response = await fetch('/api/checklist', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id, completed: newCompleted }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.item) {
            set((state) => ({
              items: state.items.map((item) =>
                item.id === id ? data.item : item
              ),
            }));
            // localStorage도 업데이트
            if (typeof window !== 'undefined') {
              const updatedItems = get().items;
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
            }
          }
        }
      } catch (error) {
        console.error('Error toggling item in API (already updated locally):', error);
      }
    }
  },
  
  // 로컬 상태 직접 설정
  setItems: (items) => set({ items }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  // LocalStorage에서 서버로 마이그레이션
  migrateFromLocalStorage: async () => {
    if (typeof window === 'undefined') return;
    
    // 이미 마이그레이션 했으면 스킵
    const migrated = localStorage.getItem(MIGRATION_KEY);
    if (migrated) return;
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        localStorage.setItem(MIGRATION_KEY, 'true');
        return;
      }

      const localItems: ChecklistItem[] = JSON.parse(saved);
      
      if (!Array.isArray(localItems) || localItems.length === 0) {
        localStorage.setItem(MIGRATION_KEY, 'true');
        return;
      }

      // 각 항목을 서버로 전송
      for (const item of localItems) {
        await fetch('/api/checklist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ text: item.text }),
        });
        
        // 완료 상태도 반영 (필요시)
        // if (item.completed) {
        //   await toggleItem(newId);
        // }
      }

      // 마이그레이션 완료 표시
      localStorage.setItem(MIGRATION_KEY, 'true');
      localStorage.removeItem(STORAGE_KEY); // 기존 데이터 삭제
      
      console.log(`✅ ${localItems.length}개 체크리스트 항목 마이그레이션 완료`);
      
      // 서버에서 다시 로드
      await get().loadItems();
    } catch (error) {
      console.error('Migration error:', error);
    }
  },
}));
