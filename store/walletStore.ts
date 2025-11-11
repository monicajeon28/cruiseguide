import { create } from 'zustand';
import { showError, showSuccess } from '@/components/ui/Toast';

export interface WalletItem {
  id: string;
  description: string;
  category: string;
  foreignAmount: number;
  krwAmount: number;
  usdAmount: number; // USD 금액 추가
  currency: string; // 사용된 통화 (USD, JPY, EUR 등)
  createdAt: string;
}

export interface ExchangeRate {
  baseCurrency: string;
  krw: {
    rate: number;
    formatted: string;
  };
  usd: {
    rate: number;
    formatted: string;
  };
  lastUpdated: string;
  isFallback?: boolean;
}

interface WalletStore {
  // 상태
  items: WalletItem[];
  currentCurrency: string;
  exchangeRates: Record<string, ExchangeRate> | null;
  isLoading: boolean;
  error: string | null;
  isUsingFallbackRate: boolean;
  
  // 데이터 로드
  loadItems: () => Promise<void>;
  
  // CRUD 작업
  addItem: (item: Omit<WalletItem, 'id' | 'createdAt'>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateItem: (id: string, updates: Partial<WalletItem>) => Promise<void>;
  clearAllItems: () => Promise<void>;
  
  // 환율 관련
  setCurrentCurrency: (currency: string) => void;
  setExchangeRateForCurrency: (currency: string, rate: ExchangeRate) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUsingFallbackRate: (isUsing: boolean) => void;
  
  // 로컬 상태 관리
  setItems: (items: WalletItem[]) => void;
  
  // 계산 헬퍼
  getTotalKrw: () => number;
  getTotalForeign: () => number;
  getTotalUsd: () => number;
  getItemsByCategory: (category: string) => WalletItem[];
  
  // 마이그레이션
  migrateFromLocalStorage: () => Promise<void>;
}

// 카테고리 상수
export const WALLET_CATEGORIES = {
  FOOD: { key: 'food', label: '🍔 식비', icon: '🍔' },
  TRANSPORT: { key: 'transport', label: '🚕 교통', icon: '🚕' },
  SHOPPING: { key: 'shopping', label: '🛍️ 쇼핑', icon: '🛍️' },
  SOUVENIR: { key: 'souvenir', label: '🎁 기념품', icon: '🎁' },
  ACCOMMODATION: { key: 'accommodation', label: '🏨 숙박', icon: '🏨' },
  ENTERTAINMENT: { key: 'entertainment', label: '🎭 엔터테인먼트', icon: '🎭' },
  MEDICAL: { key: 'medical', label: '💊 의료', icon: '💊' },
  OTHER: { key: 'other', label: '📝 기타', icon: '📝' },
} as const;

// 여행지별 통화 매핑
export const DESTINATION_CURRENCY_MAP: { [key: string]: string } = {
  // 아시아
  '일본': 'JPY',
  '중국': 'CNY',
  '홍콩': 'HKD',
  '싱가포르': 'SGD',
  '태국': 'THB',
  '베트남': 'VND',
  '필리핀': 'PHP',
  '대만': 'TWD',     // 대만 통화 추가
  '말레이시아': 'MYR', // 말레이시아 통화 추가
  
  // 유럽
  '이탈리아': 'EUR',
  '프랑스': 'EUR',
  '스페인': 'EUR',
  '독일': 'EUR',
  '네덜란드': 'EUR',
  '노르웨이': 'NOK',
  '영국': 'GBP',
  '스위스': 'CHF',
  
  // 아메리카
  '미국': 'USD',
  '캐나다': 'CAD',
  '멕시코': 'MXN',
  '브라질': 'BRL',
  
  // 오세아니아
  '호주': 'AUD',
  '뉴질랜드': 'NZD',
  
  // 기타
  '터키': 'TRY',
  '러시아': 'RUB',
  '인도': 'INR',
};

// 통화별 소수점 자릿수
export const CURRENCY_DECIMAL_PLACES: { [key: string]: number } = {
  JPY: 0,   // 일본 엔은 소수점 없음
  KRW: 0,   // 한국 원도 소수점 없음
  VND: 0,   // 베트남 동도 소수점 없음
  USD: 2,   // USD 소수점 2자리로 다시 변경
  EUR: 0,   // EUR 소수점 없음으로 변경
  GBP: 0,   // GBP 소수점 없음으로 변경
  CNY: 0,   // CNY 소수점 없음으로 변경
  HKD: 0,   // HKD 소수점 없음으로 변경
  SGD: 0,   // SGD 소수점 없음으로 변경
  TWD: 0,   // TWD 소수점 없음으로 변경
  MYR: 0,   // MYR 소수점 없음으로 변경
  PHP: 0,   // 필리핀 페소 소수점 없음으로 변경
  THB: 0,   // 태국 바트 소수점 없음으로 변경
};

// 통화별 정보 (국기 + 이름)
export const CURRENCY_INFO: { [key: string]: { flag: string; name: string } } = {
  KRW: { flag: '🇰🇷', name: '원' },
  USD: { flag: '🇺🇸', name: '달러' },
  JPY: { flag: '🇯🇵', name: '엔' },
  EUR: { flag: '🇪🇺', name: '유로' },
  GBP: { flag: '🇬🇧', name: '파운드' },
  CNY: { flag: '🇨🇳', name: '위안' },
  HKD: { flag: '🇭🇰', name: '홍콩달러' },
  SGD: { flag: '🇸🇬', name: '싱가포르달러' },
  TWD: { flag: '🇹🇼', name: '대만달러' },
  MYR: { flag: '🇲🇾', name: '링깃' },
  THB: { flag: '🇹🇭', name: '바트' },
  VND: { flag: '🇻🇳', name: '동' },
  PHP: { flag: '🇵🇭', name: '페소' },
  AUD: { flag: '🇦🇺', name: '호주달러' },
  NZD: { flag: '🇳🇿', name: '뉴질랜드달러' },
  CAD: { flag: '🇨🇦', name: '캐나다달러' },
  CHF: { flag: '🇨🇭', name: '프랑' },
  NOK: { flag: '🇳🇴', name: '크로네' },
  MXN: { flag: '🇲🇽', name: '페소' },
  BRL: { flag: '🇧🇷', name: '헤알' },
  TRY: { flag: '🇹🇷', name: '리라' },
  RUB: { flag: '🇷🇺', name: '루블' },
  INR: { flag: '🇮🇳', name: '루피' },
};

// LocalStorage 키 (마이그레이션용)
const MIGRATION_KEY = 'wallet-migrated-to-server';

export const useWalletStore = create<WalletStore>((set, get) => ({
  // 초기 상태
  items: [],
  currentCurrency: 'USD',
  exchangeRates: null,
  isLoading: false,
  error: null,
  isUsingFallbackRate: false,
  
  // 서버에서 데이터 로드
  loadItems: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/expenses', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load expenses');
      }

      const data = await response.json();
      
      if (data.ok && Array.isArray(data.expenses)) {
        // 서버 형식을 클라이언트 형식으로 변환
        const items: WalletItem[] = data.expenses.map((exp: any) => ({
          id: exp.id.toString(),
          description: exp.description,
          category: exp.category,
          foreignAmount: exp.foreignAmount,
          krwAmount: exp.krwAmount,
          usdAmount: exp.usdAmount,
          currency: exp.currency,
          createdAt: exp.createdAt,
        }));
        set({ items });
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
      const errorMsg = '가계부를 불러오는데 실패했습니다.';
      set({ error: errorMsg });
      showError(errorMsg, '불러오기 실패');
    } finally {
      set({ isLoading: false });
    }
  },
  
  // 항목 추가 (API)
  addItem: async (itemData) => {
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(itemData),
      });

      if (!response.ok) {
        throw new Error('Failed to add expense');
      }

      const data = await response.json();
      
      if (data.ok && data.expense) {
        const newItem: WalletItem = {
          id: data.expense.id.toString(),
          description: data.expense.description,
          category: data.expense.category,
          foreignAmount: data.expense.foreignAmount,
          krwAmount: data.expense.krwAmount,
          usdAmount: data.expense.usdAmount,
          currency: data.expense.currency,
          createdAt: data.expense.createdAt,
        };
        set((state) => ({ items: [newItem, ...state.items] }));
        showSuccess('지출이 기록되었습니다.');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      const errorMsg = '지출 추가에 실패했습니다.';
      set({ error: errorMsg });
      showError(errorMsg);
    }
  },
  
  // 항목 삭제 (API)
  removeItem: async (id) => {
    try {
      const response = await fetch('/api/expenses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: parseInt(id) }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete expense');
      }

      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      }));
      showSuccess('지출이 삭제되었습니다.');
    } catch (error) {
      console.error('Error deleting expense:', error);
      const errorMsg = '지출 삭제에 실패했습니다.';
      set({ error: errorMsg });
      showError(errorMsg);
    }
  },
  
  // 항목 수정 (API)
  updateItem: async (id, updates) => {
    // PUT /api/expenses 엔드포인트 호출
    try {
      const response = await fetch('/api/expenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update expense');
      }

      const data = await response.json();
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? data.data : item
        ),
      }));
      showSuccess('항목이 수정되었습니다.');
    } catch (error) {
      console.error('Error updating item:', error);
      const errorMsg = '항목 수정에 실패했습니다.';
      set({ error: errorMsg });
      showError(errorMsg);
    }
  },
  
  // 전체 삭제
  clearAllItems: async () => {
    // 각 항목을 개별 삭제
    const { items } = get();
    for (const item of items) {
      await get().removeItem(item.id);
    }
  },
      
  // 환율 관리
  setCurrentCurrency: (currency) => {
    set({ currentCurrency: currency });
  },
  
  setExchangeRateForCurrency: (currency, rate) => {
    set((state) => ({
      exchangeRates: { ...state.exchangeRates, [currency]: rate },
    }));
  },
  
  setLoading: (loading) => {
    set({ isLoading: loading });
  },
  
  setError: (error) => {
    set({ error });
  },
  
  setUsingFallbackRate: (isUsing) => {
    set({ isUsingFallbackRate: isUsing });
  },
  
  // 로컬 상태 직접 설정
  setItems: (items) => set({ items }),
  
  // 계산 헬퍼
  getTotalKrw: () => {
    const { items } = get();
    return items.reduce((total, item) => total + (item.krwAmount || 0), 0);
  },
  
  getTotalForeign: () => {
    const { items } = get();
    return items.reduce((total, item) => total + (item.foreignAmount || 0), 0);
  },
  
  getTotalUsd: () => {
    const { items } = get();
    return items.reduce((total, item) => total + (item.usdAmount || 0), 0);
  },
  
  getItemsByCategory: (category) => {
    const { items } = get();
    return items.filter((item) => item.category === category);
  },
  
  // LocalStorage에서 서버로 마이그레이션
  migrateFromLocalStorage: async () => {
    if (typeof window === 'undefined') return;
    
    // 이미 마이그레이션 했으면 스킵
    const migrated = localStorage.getItem(MIGRATION_KEY);
    if (migrated) return;
    
    try {
      const saved = localStorage.getItem('cruise-guide-wallet-storage');
      if (!saved) {
        localStorage.setItem(MIGRATION_KEY, 'true');
        return;
      }

      const parsed = JSON.parse(saved);
      const localItems: WalletItem[] = parsed?.state?.items || [];
      
      if (!Array.isArray(localItems) || localItems.length === 0) {
        localStorage.setItem(MIGRATION_KEY, 'true');
        return;
      }

      // 각 항목을 서버로 전송
      for (const item of localItems) {
        await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            description: item.description,
            category: item.category,
            foreignAmount: item.foreignAmount,
            krwAmount: item.krwAmount,
            usdAmount: item.usdAmount,
            currency: item.currency,
          }),
        });
      }

      // 마이그레이션 완료 표시
      localStorage.setItem(MIGRATION_KEY, 'true');
      localStorage.removeItem('cruise-guide-wallet-storage');
      
      console.log(`✅ ${localItems.length}개 가계부 항목 마이그레이션 완료`);
      
      // 서버에서 다시 로드
      await get().loadItems();
    } catch (error) {
      console.error('Wallet migration error:', error);
    }
  },
})); 