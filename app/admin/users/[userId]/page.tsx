'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiEdit2,
  FiKey,
  FiLock,
  FiSave,
  FiSearch,
  FiTrash2,
  FiUnlock,
  FiX,
  FiXCircle,
} from 'react-icons/fi';
import { showError, showInfo, showSuccess } from '@/components/ui/Toast';
import UserAnalytics from './components/UserAnalytics';
import { normalizeItineraryPattern, extractDestinationsFromItineraryPattern } from '@/lib/utils/itineraryPattern';
import { getKoreanCountryName } from '@/lib/utils/countryMapping';

type Nullable<T> = T | null;

interface TripSummary {
  id: number;
  cruiseName: Nullable<string>;
  startDate: Nullable<string>;
  endDate: Nullable<string>;
  destination: any;
  companionType: Nullable<string>;
  nights: Nullable<number>;
  days: Nullable<number>;
  visitCount: Nullable<number>;
  status: Nullable<string>;
  createdAt: string;
  ownerType?: 'own' | 'linked_mall' | 'linked_genie'; // 여행 소유자 타입
}

interface PasswordEvent {
  id: number;
  from: Nullable<string>;
  to: Nullable<string>;
  reason: Nullable<string>;
  createdAt: string;
}

interface SessionSummary {
  id: string;
  createdAt: string;
  expiresAt: Nullable<string>;
  isExpired: boolean;
}

interface MallUserSummary {
  id: number;
  name: Nullable<string>;
  phone: Nullable<string>;
  email: Nullable<string>;
  displayName: string;
}

interface UserSummary {
  id: number;
  name: Nullable<string>;
  phone: Nullable<string>;
  email: Nullable<string>;
  createdAt: string;
  lastActiveAt: Nullable<string>;
  isLocked: boolean;
  isHibernated: boolean;
  hibernatedAt: Nullable<string>;
  lockedAt: Nullable<string>;
  lockedReason: Nullable<string>;
  loginCount: number;
  tripCount: number;
  customerStatus?: Nullable<string>;
  resolvedStatus?: Nullable<string>;
  testModeStartedAt?: Nullable<string>;
  adminMemo: Nullable<string>;
  mallUserId?: Nullable<string>;
  mallNickname?: Nullable<string>;
  currentPassword?: Nullable<string>;
  kakaoChannelAdded?: boolean;
  kakaoChannelAddedAt?: Nullable<string>;
  genieStatus?: Nullable<string>;
  genieLinkedAt?: Nullable<string>;
  role?: Nullable<string>;
  linkedMallUser?: Nullable<{
    id: number;
    name: Nullable<string>;
    phone: Nullable<string>;
    email: Nullable<string>;
    role: string;
    createdAt?: Nullable<string>;
    currentPassword?: Nullable<string>; // 비밀번호 추가
  }>;
  linkedGenieUser?: Nullable<{
    id: number;
    name: Nullable<string>;
    phone: Nullable<string>;
    email: Nullable<string>;
    genieStatus: Nullable<string>;
    genieLinkedAt: Nullable<string>;
    createdAt?: Nullable<string>;
    currentPassword?: Nullable<string>; // 비밀번호 추가
  }>;
  trips: TripSummary[];
  passwordEvents: PasswordEvent[];
}

interface GenieUserSummary {
  id: number;
  name: Nullable<string>;
  phone: Nullable<string>;
  email: Nullable<string>;
  customerStatus: Nullable<string>;
  customerType: 'cruise-guide' | 'mall' | 'test';
  customerTypeLabel: string;
  hasActiveTrip: boolean;
  currentPassword?: Nullable<string>; // 비밀번호 추가
}

interface EditFormState {
  name: string;
  phone: string;
  email: string;
  adminMemo: string;
  linkedStatus: 'linked' | 'not-linked' | 'test' | 'mall'; // 통합 상태 (크루즈몰 추가)
  genieStatus: 'active' | 'package' | 'locked' | 'test' | 'test-locked' | 'excel' | null; // 지니 상태
  tripCount: number;
  mallUserId: Nullable<number>;
  mallNickname: string;
  linkedGenieUserId: Nullable<number>; // 연동된 크루즈가이드지니 사용자 ID
}

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [user, setUser] = useState<Nullable<UserSummary>>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [passwordEvents, setPasswordEvents] = useState<PasswordEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Nullable<string>>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    name: '',
    phone: '',
    email: '',
    adminMemo: '',
    linkedStatus: 'not-linked',
    genieStatus: 'active',
    tripCount: 0,
    mallUserId: null,
    mallNickname: '',
    linkedGenieUserId: null,
  });
  const [lastSavedLinkedStatus, setLastSavedLinkedStatus] = useState<Nullable<EditFormState['linkedStatus']>>(null);
  const [lastSavedGenieStatus, setLastSavedGenieStatus] = useState<Nullable<EditFormState['genieStatus']>>(null);

  // Password reset & lock state
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Sessions
  const [isSessionsExpanded, setIsSessionsExpanded] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isTerminatingSession, setIsTerminatingSession] = useState<Nullable<string>>(null);

  // Trips
  const [isTripsExpanded, setIsTripsExpanded] = useState(false);
  const [isDeletingTrip, setIsDeletingTrip] = useState<Nullable<number>>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [selectedProductCode, setSelectedProductCode] = useState<Nullable<string>>(null);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productOptions, setProductOptions] = useState<Array<{ value: string; label: string; product: any }>>([]);
  const [selectedProduct, setSelectedProduct] = useState<Nullable<any>>(null);
  const [onboardingFormData, setOnboardingFormData] = useState({
    companionType: '가족' as '친구' | '커플' | '가족' | '혼자',
    startDate: '',
    endDate: '',
  });

  // Mall user linking state
  const [mallSearchTerm, setMallSearchTerm] = useState('');
  const [mallSearchLoading, setMallSearchLoading] = useState(false);
  const [mallSearchDropdownOpen, setMallSearchDropdownOpen] = useState(false);
  const [mallSearchResults, setMallSearchResults] = useState<MallUserSummary[]>([]);
  const [mallUserListOpen, setMallUserListOpen] = useState(false);
  const [mallUserListLoading, setMallUserListLoading] = useState(false);
  const [mallUserList, setMallUserList] = useState<MallUserSummary[]>([]);
  const [selectedMallUser, setSelectedMallUser] = useState<Nullable<MallUserSummary>>(null);

  // Genie user linking state (크루즈가이드지니 연동)
  const [genieSearchTerm, setGenieSearchTerm] = useState('');
  const [genieSearchLoading, setGenieSearchLoading] = useState(false);
  const [genieSearchDropdownOpen, setGenieSearchDropdownOpen] = useState(false);
  const [genieSearchResults, setGenieSearchResults] = useState<GenieUserSummary[]>([]);
  const [genieUserListOpen, setGenieUserListOpen] = useState(false);
  const [genieUserListLoading, setGenieUserListLoading] = useState(false);
  const [genieUserList, setGenieUserList] = useState<GenieUserSummary[]>([]);
  const [selectedGenieUser, setSelectedGenieUser] = useState<Nullable<GenieUserSummary>>(null);
  const [linkedGenieUser, setLinkedGenieUser] = useState<Nullable<GenieUserSummary>>(null); // 연동된 크루즈 가이드 지니 사용자

  useEffect(() => {
    if (!userId) return;
    Promise.all([loadUserData(), loadSessions(), loadPasswordEvents()]).catch((error) => {
      console.error('Failed to load user data:', error);
      setError('사용자 정보를 불러오는 중 오류가 발생했습니다.');
    });
  }, [userId]);

  // close dropdown on outside click
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.mall-search-container')) {
        setMallSearchDropdownOpen(false);
      }
    };

    if (mallSearchDropdownOpen) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [mallSearchDropdownOpen]);

  // Debounced product search
  useEffect(() => {
    if (!isOnboardingModalOpen) return;
    
    const timer = window.setTimeout(() => {
      loadProductOptions(productSearchTerm);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [productSearchTerm, isOnboardingModalOpen]);

  // 모달이 열릴 때 상품 목록 로드
  useEffect(() => {
    if (isOnboardingModalOpen) {
      loadProductOptions('');
    }
  }, [isOnboardingModalOpen]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/users/${userId}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      if (response.status === 404) {
        setError('사용자를 찾을 수 없습니다.');
        return;
      }

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError('인증이 필요합니다. 다시 로그인해주세요.');
          return;
        }
        throw new Error('사용자 정보를 불러올 수 없습니다.');
      }

      const data = await response.json();
      if (!data.ok || !data.user) {
        throw new Error(data.error || '사용자 정보를 불러오는 중 오류가 발생했습니다.');
      }

      const userData: UserSummary = {
        ...data.user,
        isLocked: data.user.isLocked === true || data.user.isLocked === 'true',
        isHibernated: data.user.isHibernated === true || data.user.isHibernated === 'true',
      };

      setUser(userData);
      setPasswordEvents(data.user.passwordEvents || []);

      // 고객 타입 판단
      const customerStatus = userData.customerStatus;
      const hasTrip = userData.trips && userData.trips.length > 0;
      const isMallUser = userData.mallUserId !== null && userData.mallUserId !== undefined;
      
      // 통합 상태 결정 (연동 여부)
      let initialLinkedStatus: EditFormState['linkedStatus'] = 'not-linked';
      if (customerStatus === 'test' || customerStatus === 'test-locked') {
        initialLinkedStatus = 'test';
      } else if (isMallUser) {
        // 크루즈몰 고객인 경우: mallUserId가 있으면 'mall', 아니면 'linked'로 판단
        // 하지만 일반적으로 크루즈몰 고객은 'mall'로 설정
        initialLinkedStatus = 'mall';
      }
      
      // 지니 상태 결정 (고객 타입에 따라)
      let initialGenieStatus: EditFormState['genieStatus'] = 'active';
      
      // 1. 테스트 고객
      if (customerStatus === 'test' || customerStatus === 'test-locked') {
        initialGenieStatus = customerStatus as EditFormState['genieStatus'];
      }
      // 2. 잠재고객
      else if (customerStatus === 'excel') {
        initialGenieStatus = 'excel';
      }
      // 3. 크루즈몰 또는 크루즈가이드 고객
      else {
        // customerStatus 우선 사용
        if (customerStatus === 'active' || customerStatus === 'package') {
          initialGenieStatus = customerStatus;
        } else if (customerStatus === 'locked' || userData.isLocked) {
          initialGenieStatus = 'locked';
        } else if (hasTrip) {
          initialGenieStatus = 'package';
        } else {
          initialGenieStatus = 'locked'; // Trip 없으면 잠금
        }
      }

      const savedMallUserId = userData.mallUserId ? parseInt(userData.mallUserId, 10) : null;
      const savedMallNickname = userData.mallNickname || '';

      setEditForm({
        name: userData.name || '',
        phone: userData.phone || '',
        email: userData.email || '',
        adminMemo: userData.adminMemo || '',
        linkedStatus: initialLinkedStatus,
        genieStatus: initialGenieStatus,
        tripCount: userData.tripCount || 0,
        mallUserId: savedMallUserId,
        mallNickname: savedMallNickname,
        linkedGenieUserId: userData.linkedGenieUser?.id || null,
      });
      // 저장된 상태가 없을 때만 설정 (저장 후에는 저장한 값 유지)
      if (lastSavedLinkedStatus === null || lastSavedGenieStatus === null) {
        setLastSavedLinkedStatus(initialLinkedStatus);
        setLastSavedGenieStatus(initialGenieStatus);
      }

      if (savedMallUserId) {
        void preloadLinkedMallUser(savedMallUserId, savedMallNickname);
      } else {
        setSelectedMallUser(null);
        setMallSearchTerm('');
      }

      // 크루즈몰 고객인 경우, 연동된 크루즈 가이드 지니 사용자 찾기
      // role이 'community'이고, 크루즈 가이드 지니 사용자 중 mallUserId가 현재 사용자 ID와 일치하는 경우
      if (userData.role === 'community') {
        void preloadLinkedGenieUser(parseInt(userId, 10));
      } else {
        setLinkedGenieUser(null);
      }
    } catch (err: any) {
      console.error('Failed to load user data:', err);
      setError(err.message || '사용자 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const preloadLinkedGenieUser = async (mallUserId: number) => {
    try {
      // 크루즈 가이드 지니 사용자 중 mallUserId가 현재 크루즈몰 고객 ID와 일치하는 사용자 찾기
      const response = await fetch(`/api/admin/cruise-guide-users?mallUserId=${mallUserId}`, {
        credentials: 'include',
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data.ok && data.users && data.users.length > 0) {
        const genieUser = data.users[0];
        const summary: GenieUserSummary = {
          id: genieUser.id,
          name: genieUser.name,
          phone: genieUser.phone,
          email: genieUser.email,
          customerStatus: genieUser.customerStatus,
          customerType: genieUser.customerType || 'cruise-guide',
          customerTypeLabel: genieUser.customerTypeLabel || '크루즈 가이드',
          hasActiveTrip: genieUser.hasActiveTrip || false,
          currentPassword: genieUser.currentPassword || null,
        };
        setLinkedGenieUser(summary);
      } else {
        setLinkedGenieUser(null);
      }
    } catch (error) {
      console.error('Failed to preload linked genie user:', error);
      setLinkedGenieUser(null);
    }
  };

  const preloadLinkedMallUser = async (mallUserId: number, fallbackTerm: string) => {
    try {
      const response = await fetch(`/api/admin/users/${mallUserId}`, {
        credentials: 'include',
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data.ok && data.user) {
        const summary: MallUserSummary = {
          id: data.user.id,
          name: data.user.name,
          phone: data.user.phone,
          email: data.user.email,
          displayName:
            data.user.name || data.user.phone || data.user.email || `사용자 ${data.user.id}`,
        };
        setSelectedMallUser(summary);
        setMallSearchTerm(fallbackTerm || summary.displayName);
      }
    } catch (error) {
      console.error('Failed to preload linked mall user:', error);
    }
  };

  const loadSessions = async () => {
    try {
      setIsLoadingSessions(true);
      const response = await fetch(`/api/admin/users/${userId}/sessions`, {
        credentials: 'include',
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data.ok && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadPasswordEvents = async () => {
    try {
      const response = await fetch(`/api/admin/password-events?userId=${userId}`, {
        credentials: 'include',
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data.ok && Array.isArray(data.events)) {
        setPasswordEvents(data.events);
      }
    } catch (error) {
      console.error('Failed to load password events:', error);
    }
  };

  const loadMallUserList = async (query = '') => {
    try {
      if (query) {
        setMallSearchLoading(true);
      } else {
        setMallUserListLoading(true);
      }

      const response = await fetch(`/api/admin/mall-users/list?q=${encodeURIComponent(query)}&limit=100`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('크루즈몰 고객 목록을 불러오지 못했습니다.');
      }

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || '크루즈몰 고객 정보를 불러오지 못했습니다.');
      }

      setMallUserList(data.users || []);
      if (query) {
        setMallSearchResults(data.users || []);
        setMallSearchDropdownOpen(true);
      }
    } catch (error) {
      console.error('Failed to load mall users:', error);
      showError(
        error instanceof Error ? error.message : '크루즈몰 고객 목록을 불러오는 중 오류가 발생했습니다.',
        '연결 대상 조회 실패',
      );
    } finally {
      setMallSearchLoading(false);
      setMallUserListLoading(false);
    }
  };

  const handleToggleMallUserList = () => {
    if (!mallUserListOpen) {
      if (mallUserList.length === 0) {
        void loadMallUserList();
      }
      setMallUserListOpen(true);
    } else {
      setMallUserListOpen(false);
    }
  };

  const handleSelectMallUser = (mallUser: MallUserSummary) => {
    setSelectedMallUser(mallUser);
    setMallSearchTerm(mallUser.displayName);
    setMallSearchDropdownOpen(false);
    setMallUserListOpen(false);
    setEditForm((prev) => ({
      ...prev,
      mallUserId: mallUser.id,
      mallNickname: mallUser.name || mallUser.displayName,
    }));
    showInfo('연결할 크루즈몰 고객이 선택되었습니다. 저장 버튼으로 연동을 완료하세요.');
  };

  const handleUnlinkMallUser = () => {
    if (!confirm('크루즈몰 연동을 해제하시겠습니까?')) return;
    setSelectedMallUser(null);
    setMallSearchTerm('');
    setEditForm((prev) => ({
      ...prev,
      mallUserId: null,
      mallNickname: '',
    }));
    showInfo('연동이 해제되었습니다. 저장 버튼으로 반영해주세요.');
  };

  // 크루즈가이드지니 연동 함수들
  const loadGenieUserList = async (query = '') => {
    try {
      if (query) {
        setGenieSearchLoading(true);
      } else {
        setGenieUserListLoading(true);
      }

      const response = await fetch(`/api/admin/cruise-guide-users?search=${encodeURIComponent(query)}&status=all`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('크루즈가이드지니 사용자 목록을 불러오지 못했습니다.');
      }

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || '크루즈가이드지니 사용자 정보를 불러오지 못했습니다.');
      }

      setGenieUserList(data.users || []);
      if (query) {
        setGenieSearchResults(data.users || []);
        setGenieSearchDropdownOpen(true);
      }
    } catch (error) {
      console.error('Failed to load genie users:', error);
      showError(
        error instanceof Error ? error.message : '크루즈가이드지니 사용자 목록을 불러오는 중 오류가 발생했습니다.',
        '연결 대상 조회 실패',
      );
    } finally {
      setGenieSearchLoading(false);
      setGenieUserListLoading(false);
    }
  };

  const handleToggleGenieUserList = () => {
    if (!genieUserListOpen) {
      if (genieUserList.length === 0) {
        void loadGenieUserList();
      }
      setGenieUserListOpen(true);
    } else {
      setGenieUserListOpen(false);
    }
  };

  const handleSelectGenieUser = (genieUser: GenieUserSummary) => {
    setSelectedGenieUser(genieUser);
    setGenieSearchTerm(genieUser.name || genieUser.phone || `사용자 ${genieUser.id}`);
    setGenieSearchDropdownOpen(false);
    setGenieUserListOpen(false);
    setEditForm((prev) => ({
      ...prev,
      linkedGenieUserId: genieUser.id,
    }));
    showInfo('연결할 크루즈가이드지니 사용자가 선택되었습니다. 저장 버튼으로 연동을 완료하세요.');
  };

  const handleUnlinkGenieUser = () => {
    if (!confirm('크루즈가이드지니 연동을 해제하시겠습니까?')) return;
    setSelectedGenieUser(null);
    setGenieSearchTerm('');
    setEditForm((prev) => ({
      ...prev,
      linkedGenieUserId: null,
    }));
    showInfo('연동이 해제되었습니다. 저장 버튼으로 반영해주세요.');
  };

  // 크루즈가이드지니 검색 debounce
  useEffect(() => {
    if (!genieSearchTerm.trim()) {
      setGenieSearchResults([]);
      setGenieSearchDropdownOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      void loadGenieUserList(genieSearchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [genieSearchTerm]);

  // 크루즈가이드지니 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.genie-search-container')) {
        setGenieSearchDropdownOpen(false);
      }
    };

    if (genieSearchDropdownOpen) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [genieSearchDropdownOpen]);

  const handleResetPassword = async () => {
    const newPassword = prompt('새 비밀번호를 입력하세요 (기본값: 3800):', '3800');
    if (!newPassword) return;
    if (newPassword.length < 4) {
      showError('비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }
    if (!confirm(`비밀번호를 "${newPassword}"로 변경하시겠습니까?`)) return;

    try {
      setIsResettingPassword(true);
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newPassword }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || '비밀번호 변경에 실패했습니다.');
      }
      showSuccess(`비밀번호가 ${newPassword}로 변경되었습니다.`);
      await Promise.all([loadUserData(), loadPasswordEvents()]);
    } catch (error) {
      console.error('Failed to reset password:', error);
      showError(
        error instanceof Error ? error.message : '비밀번호 변경 중 오류가 발생했습니다.',
        '비밀번호 변경 실패'
      );
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleLockAccount = async () => {
    const reason = prompt('계정 잠금 사유를 입력하세요:', '관리자에 의해 잠금');
    if (reason === null) return;
    try {
      setIsLocking(true);
      const response = await fetch(`/api/admin/users/${userId}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || '계정 잠금에 실패했습니다.');
      }
      showSuccess('계정이 잠금되었습니다.');
      await loadUserData();
      await loadSessions();
    } catch (error) {
      console.error('Failed to lock account:', error);
      showError(
        error instanceof Error ? error.message : '계정 잠금 중 오류가 발생했습니다.',
        '잠금 실패'
      );
    } finally {
      setIsLocking(false);
    }
  };

  const handleUnlockAccount = async () => {
    if (!confirm('계정 잠금을 해제하시겠습니까?')) return;
    try {
      setIsUnlocking(true);
      const response = await fetch(`/api/admin/users/${userId}/lock`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || '계정 잠금 해제에 실패했습니다.');
      }
      showSuccess('계정 잠금이 해제되었습니다.');
      await loadUserData();
    } catch (error) {
      console.error('Failed to unlock account:', error);
      showError(
        error instanceof Error ? error.message : '계정 잠금 해제 중 오류가 발생했습니다.',
        '잠금 해제 실패'
      );
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    if (!confirm('이 세션을 강제 종료하시겠습니까?')) return;
    try {
      setIsTerminatingSession(sessionId);
      const response = await fetch(`/api/admin/users/${userId}/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || '세션 종료에 실패했습니다.');
      }
      showSuccess('세션이 종료되었습니다.');
      await loadSessions();
    } catch (error) {
      console.error('Failed to terminate session:', error);
      showError(
        error instanceof Error ? error.message : '세션 종료 중 오류가 발생했습니다.',
        '세션 종료 실패'
      );
    } finally {
      setIsTerminatingSession(null);
    }
  };

  const handleAddOnboarding = async () => {
    setIsOnboardingModalOpen(true);
    // 상품 목록 로드
    loadProductOptions('');
  };

  // 상품 검색
  const loadProductOptions = async (searchTerm: string) => {
    try {
      const url = searchTerm
        ? `/api/admin/products/search?q=${encodeURIComponent(searchTerm)}`
        : '/api/admin/products/search';
      
      const response = await fetch(url, {
        credentials: 'include',
      });
      
      const data = await response.json();
      if (data.ok && Array.isArray(data.products)) {
        const options = data.products.map((product: any) => ({
          value: product.productCode,
          label: `${product.packageName} (${product.cruiseLine} ${product.shipName}) - ${product.productCode}`,
          product: product,
        }));
        setProductOptions(options);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  // 상품 선택 시 자동으로 정보 채우기
  const handleProductSelect = async (productCode: string) => {
    try {
      console.log('[Onboarding] 상품 선택 시작:', productCode);
      setSelectedProductCode(productCode);
      setProductSearchTerm(''); // 검색어 초기화하여 드롭다운 닫기
      
      const response = await fetch(`/api/public/products/${productCode}`, {
        credentials: 'include',
      });
      
      console.log('[Onboarding] API 응답 상태:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Onboarding] API 에러 응답:', errorText);
        showError(`상품 정보를 불러올 수 없습니다. (${response.status})`, '오류');
        return;
      }
      
      const data = await response.json();
      console.log('[Onboarding] API 응답 데이터:', data);
      
      if (data.ok && data.product) {
        const product = data.product;
        console.log('[Onboarding] 상품 정보:', {
          productCode: product.productCode,
          cruiseLine: product.cruiseLine,
          shipName: product.shipName,
          nights: product.nights,
          days: product.days,
          startDate: product.startDate,
          endDate: product.endDate,
          hasItineraryPattern: !!product.itineraryPattern,
        });
        
        setSelectedProduct(product);
        
        // 크루즈명 자동 설정
        const cruiseName = `${product.cruiseLine} ${product.shipName}`;
        
        // itineraryPattern에서 목적지 추출 (국가-지역 형식)
        const destinations: string[] = [];
        const itineraryPattern = normalizeItineraryPattern(product.itineraryPattern);
        
        console.log('[Onboarding] itineraryPattern 정규화 결과:', {
          original: product.itineraryPattern,
          normalized: itineraryPattern,
          length: itineraryPattern.length,
        });
        
        itineraryPattern.forEach((day: any) => {
          if ((day.type === 'PortVisit' || day.type === 'Embarkation' || day.type === 'Disembarkation') 
              && day.location && day.country) {
            const countryName = getKoreanCountryName(day.country) || day.country;
            const location = day.location;
            
            // 미국과 캐나다는 국가만 추가
            if (day.country === 'US' || day.country === 'CA') {
              const dest = countryName;
              if (!destinations.includes(dest)) {
                destinations.push(dest);
              }
            } else {
              // 다른 국가는 "국가 - 지역" 형식
              const dest = `${countryName} - ${location}`;
              if (!destinations.includes(dest)) {
                destinations.push(dest);
              }
            }
          }
        });
        
        console.log('[Onboarding] 추출된 목적지:', destinations);
        
        // 시작일/종료일 설정 (상품에 있으면 사용, 없으면 오늘 기준)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let startDate: string;
        let endDate: string;
        
        if (product.startDate) {
          // 상품에 시작일이 있으면 사용
          startDate = new Date(product.startDate).toISOString().split('T')[0];
          // 종료일은 시작일 + (days - 1)일
          const end = new Date(product.startDate);
          end.setDate(end.getDate() + (product.days || 5) - 1);
          endDate = end.toISOString().split('T')[0];
        } else {
          // 상품에 시작일이 없으면 오늘 기준으로 설정
          startDate = today.toISOString().split('T')[0];
          const end = new Date(today);
          end.setDate(end.getDate() + (product.days || 5) - 1);
          endDate = end.toISOString().split('T')[0];
        }
        
        console.log('[Onboarding] 상품 선택 완료:', {
          productCode,
          cruiseName: `${product.cruiseLine} ${product.shipName}`,
          nights: product.nights,
          days: product.days,
          destinations,
          startDate,
          endDate,
        });
        
        setOnboardingFormData({
          companionType: '가족',
          startDate,
          endDate,
        });
        
        showSuccess('상품 정보가 자동으로 채워졌습니다.');
      } else {
        console.error('[Onboarding] 상품 정보 없음:', data);
        showError('상품 정보를 찾을 수 없습니다.', '오류');
      }
    } catch (error) {
      console.error('[Onboarding] Failed to load product details:', error);
      showError('상품 정보를 불러오는 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : 'Unknown error'), '오류');
    }
  };

  // 온보딩 생성
  const handleCreateOnboarding = async () => {
    if (!selectedProduct || !selectedProductCode) {
      showError('상품을 선택해주세요.', '온보딩 추가 실패');
      return;
    }

    if (!onboardingFormData.startDate || !onboardingFormData.endDate) {
      showError('여행 시작일과 종료일을 입력해주세요.', '온보딩 추가 실패');
      return;
    }

    setIsProcessing(true);
    try {
      const cruiseName = `${selectedProduct.cruiseLine} ${selectedProduct.shipName}`;
      
      // itineraryPattern에서 목적지 추출 (국가-지역 형식)
      const destinations: string[] = [];
      const itineraryPattern = normalizeItineraryPattern(selectedProduct.itineraryPattern);
      
      itineraryPattern.forEach((day: any) => {
        if ((day.type === 'PortVisit' || day.type === 'Embarkation' || day.type === 'Disembarkation') 
            && day.location && day.country) {
          const countryName = getKoreanCountryName(day.country) || day.country;
          const location = day.location;
          
          // 미국과 캐나다는 국가만 추가
          if (day.country === 'US' || day.country === 'CA') {
            const dest = countryName;
            if (!destinations.includes(dest)) {
              destinations.push(dest);
            }
          } else {
            // 다른 국가는 "국가 - 지역" 형식
            const dest = `${countryName} - ${location}`;
            if (!destinations.includes(dest)) {
              destinations.push(dest);
            }
          }
        }
      });

      const requestBody = {
        productId: selectedProduct.id,
        productCode: selectedProductCode,
        cruiseName,
        startDate: onboardingFormData.startDate,
        endDate: onboardingFormData.endDate,
        companionType: onboardingFormData.companionType,
        destination: destinations,
        itineraryPattern: selectedProduct.itineraryPattern || [],
      };

      const response = await fetch(`/api/admin/users/${userId}/trips/0/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (data.ok) {
        showSuccess('온보딩이 추가되었습니다.');
        setIsOnboardingModalOpen(false);
        setSelectedProduct(null);
        setSelectedProductCode(null);
        setProductSearchTerm('');
        setOnboardingFormData({
          companionType: '가족',
          startDate: '',
          endDate: '',
        });
        await loadUserData();
      } else {
        showError('온보딩 추가 실패: ' + (data.error || 'Unknown error'), '온보딩 추가 실패');
      }
    } catch (error) {
      console.error('Failed to create onboarding:', error);
      showError('온보딩 추가 중 오류가 발생했습니다.', '온보딩 추가 실패');
    } finally {
      setIsProcessing(false);
    }
  };

  // 특정 여행에 온보딩 추가하기
  const handleAddOnboardingToTrip = async (tripId: number) => {
    if (!confirm('이 여행에 온보딩을 추가하시겠습니까? (크루즈 가이드 지니 활성화)')) {
      return;
    }

    if (!user) return;

    setIsProcessing(true);
    try {
      // 기존 여행 정보 가져오기 (Itinerary 포함)
      const tripResponse = await fetch(`/api/admin/users/${userId}/trips/${tripId}`, {
        credentials: 'include',
      });
      
      if (!tripResponse.ok) {
        const errorData = await tripResponse.json();
        throw new Error(errorData.error || '여행 정보를 불러올 수 없습니다.');
      }

      const tripData = await tripResponse.json();
      const trip = tripData.trip || tripData;

      if (!trip) {
        showError('여행 정보를 찾을 수 없습니다.', '온보딩 추가 실패');
        setIsProcessing(false);
        return;
      }

      // productId가 없으면 에러
      if (!trip.productId) {
        showError('이 여행에는 상품 ID가 없습니다. 온보딩을 추가하려면 상품 정보가 필요합니다.', '온보딩 추가 실패');
        setIsProcessing(false);
        return;
      }

      // Itinerary를 itineraryPattern 형식으로 변환
      let itineraryPattern: any[] = [];
      if (trip.itineraries && Array.isArray(trip.itineraries) && trip.itineraries.length > 0) {
        itineraryPattern = trip.itineraries.map((it: any) => ({
          day: it.day || 1,
          type: it.type || 'Cruising',
          location: it.location || null,
          country: it.country || null,
          currency: it.currency || null,
          language: it.language || null,
          arrival: it.arrival || null,
          departure: it.departure || null,
        }));
      } else {
        // Itinerary가 없으면 기본 패턴 생성 (여행 기간만큼)
        const startDate = trip.startDate ? new Date(trip.startDate) : new Date();
        const endDate = trip.endDate ? new Date(trip.endDate) : new Date();
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        for (let i = 0; i < days; i++) {
          itineraryPattern.push({
            day: i + 1,
            type: i === 0 ? 'Embarkation' : i === days - 1 ? 'Disembarkation' : 'Cruising',
            location: null,
            country: null,
            currency: null,
            language: null,
            arrival: null,
            departure: null,
          });
        }
      }

      // API 요청 본문 구성 (기존 여행 정보 사용)
      const requestBody: any = {
        productId: trip.productId,
        cruiseName: trip.cruiseName || '',
        startDate: trip.startDate || new Date().toISOString(),
        endDate: trip.endDate || new Date().toISOString(),
        companionType: trip.companionType || null,
        destination: Array.isArray(trip.destination) ? trip.destination : trip.destination ? [trip.destination] : [],
        itineraryPattern: itineraryPattern,
      };

      // productCode가 있으면 추가
      if (trip.productCode) {
        requestBody.productCode = trip.productCode;
      }

      const response = await fetch(`/api/admin/users/${userId}/trips/${tripId}/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (data.ok) {
        showSuccess('온보딩이 추가되었습니다.');
        await loadUserData(); // 사용자 정보 새로고침
      } else {
        showError('온보딩 추가 실패: ' + (data.error || 'Unknown error'), '온보딩 추가 실패');
      }
    } catch (error) {
      console.error('Failed to add onboarding:', error);
      showError('온보딩 추가 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : 'Unknown error'), '온보딩 추가 실패');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteTrip = async (tripId: number) => {
    if (!confirm('정말로 이 여행을 삭제하시겠습니까?\n삭제된 여행은 복구할 수 없습니다.')) return;
    try {
      setIsDeletingTrip(tripId);
      const response = await fetch(`/api/admin/users/${userId}/trips/${tripId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || '여행 삭제에 실패했습니다.');
      }
      showSuccess('여행이 삭제되었습니다.');
      await loadUserData();
    } catch (error) {
      console.error('Failed to delete trip:', error);
      showError(
        error instanceof Error ? error.message : '여행 삭제 중 오류가 발생했습니다.',
        '삭제 실패'
      );
    } finally {
      setIsDeletingTrip(null);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setIsSaving(true);
      
      // 통합 상태에 따라 mallUserId 설정/해제
      let mallUserIdToSave: string | null = null;
      let mallNicknameToSave: string | null = null;
      
      if (editForm.linkedStatus === 'linked') {
        // 통합 상태로 설정: mallUserId가 있으면 유지, 없으면 selectedMallUser의 ID 사용
        mallUserIdToSave = editForm.mallUserId ? editForm.mallUserId.toString() : (selectedMallUser?.id ? selectedMallUser.id.toString() : null);
        mallNicknameToSave = editForm.mallNickname || selectedMallUser?.displayName || null;
      } else if (editForm.linkedStatus === 'mall') {
        // 크루즈몰 상태: mallUserId가 있으면 유지, 없으면 selectedMallUser의 ID 사용
        mallUserIdToSave = editForm.mallUserId ? editForm.mallUserId.toString() : (selectedMallUser?.id ? selectedMallUser.id.toString() : null);
        mallNicknameToSave = editForm.mallNickname || selectedMallUser?.displayName || null;
      } else if (editForm.linkedStatus === 'test') {
        // 테스트 상태: mallUserId는 유지하되, customerStatus를 'test'로 설정
        mallUserIdToSave = editForm.mallUserId ? editForm.mallUserId.toString() : null;
        mallNicknameToSave = editForm.mallNickname || null;
      } else {
        // 통합 해제: mallUserId를 null로 설정
        mallUserIdToSave = null;
        mallNicknameToSave = null;
      }
      
      // 지니 상태 결정 (genieStatus를 customerStatus로 변환)
      let customerStatusToSave: string | null = null;
      if (editForm.genieStatus) {
        customerStatusToSave = editForm.genieStatus;
      }
      
      // 통합 상태가 'test'인 경우 customerStatus도 'test'로 설정
      if (editForm.linkedStatus === 'test' && !customerStatusToSave) {
        customerStatusToSave = 'test';
      }
      
      // 통합 상태와 지니 상태를 모두 전송하여 API에서 처리
      const payload: Record<string, any> = {
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email,
        adminMemo: editForm.adminMemo,
        status: customerStatusToSave,
        linkedStatus: editForm.linkedStatus, // 통합 상태 전송
        genieStatus: editForm.genieStatus, // 지니 상태 전송
        mallUserId: mallUserIdToSave,
        mallNickname: mallNicknameToSave,
      };
      if (user && editForm.tripCount !== user.tripCount) {
        payload.tripCount = editForm.tripCount;
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
        cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || '정보 저장에 실패했습니다.');
      }

      showSuccess('고객 정보가 저장되었습니다.');
      setIsEditing(false);
      // 저장된 상태를 먼저 설정 (loadUserData 전에 설정하여 상태가 덮어씌워지지 않도록)
      setLastSavedLinkedStatus(editForm.linkedStatus);
      setLastSavedGenieStatus(editForm.genieStatus);
      await loadUserData();
      // loadUserData 후에도 저장된 상태 유지 (데이터베이스에서 읽은 값이 아닌 저장한 값 사용)
      setLastSavedLinkedStatus(editForm.linkedStatus);
      setLastSavedGenieStatus(editForm.genieStatus);
    } catch (error) {
      console.error('Failed to save user data:', error);
      showError(
        error instanceof Error ? error.message : '정보 저장 중 오류가 발생했습니다.',
        '저장 실패'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (!user) return;
    
    // 고객 타입에 따라 상태 복원
    const customerStatus = user.customerStatus;
    const hasTrip = user.trips && user.trips.length > 0;
    const isMallUser = user.mallUserId !== null && user.mallUserId !== undefined;
    
    // 통합 상태 복원
    let revertedLinkedStatus: EditFormState['linkedStatus'] = 'not-linked';
    if (customerStatus === 'test' || customerStatus === 'test-locked') {
      revertedLinkedStatus = 'test';
    } else if (isMallUser) {
      // 크루즈몰 고객인 경우 'mall'로 설정
      revertedLinkedStatus = 'mall';
    }
    
    // 지니 상태 복원
    let revertedGenieStatus: EditFormState['genieStatus'] = 'active';
    
    // 1. 테스트 고객
    if (customerStatus === 'test' || customerStatus === 'test-locked') {
      revertedGenieStatus = customerStatus as EditFormState['genieStatus'];
    }
    // 2. 잠재고객
    else if (customerStatus === 'excel') {
      revertedGenieStatus = 'excel';
    }
    // 3. 크루즈몰 또는 크루즈가이드 고객
    else {
      if (customerStatus === 'active' || customerStatus === 'package') {
        revertedGenieStatus = customerStatus;
      } else if (customerStatus === 'locked' || user.isLocked) {
        revertedGenieStatus = 'locked';
      } else if (hasTrip) {
        revertedGenieStatus = 'package';
      } else {
        revertedGenieStatus = 'locked';
      }
    }
    
    const mallUserId = user.mallUserId ? parseInt(user.mallUserId, 10) : null;
    const mallNickname = user.mallNickname || '';

    setEditForm({
      name: user.name || '',
      phone: user.phone || '',
      email: user.email || '',
      adminMemo: user.adminMemo || '',
      linkedStatus: revertedLinkedStatus,
      genieStatus: revertedGenieStatus,
      tripCount: user.tripCount || 0,
      mallUserId,
      mallNickname,
      linkedGenieUserId: user.linkedGenieUser?.id || null,
    });

    if (mallUserId) {
      setMallSearchTerm(mallNickname);
      void preloadLinkedMallUser(mallUserId, mallNickname);
    } else {
      setMallSearchTerm('');
      setSelectedMallUser(null);
    }

    setIsEditing(false);
  };

  // 상태 딱지 렌더링 함수
  const renderStatusBadges = (userData: UserSummary, linkedStatus: EditFormState['linkedStatus'], genieStatus: EditFormState['genieStatus']) => {
    const badges: Array<{ label: string; color: string }> = [];
    const customerStatus = userData.customerStatus;
    
    // 1. 테스트 고객 딱지 (최우선)
    if (genieStatus === 'test' || genieStatus === 'test-locked' || customerStatus === 'test' || customerStatus === 'test-locked') {
      if (genieStatus === 'test-locked' || customerStatus === 'test-locked') {
        badges.push({ label: '테스트잠금', color: 'bg-gray-100 text-gray-800 border border-gray-300' });
      } else {
        badges.push({ label: '테스트', color: 'bg-orange-100 text-orange-800 border border-orange-300' });
      }
      return (
        <div className="flex flex-wrap gap-1">
          {badges.map((badge, index) => (
            <span key={index} className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
              {badge.label}
            </span>
          ))}
        </div>
      );
    }
    
    // 2. 잠재고객 딱지 (노란색)
    if (genieStatus === 'excel' || customerStatus === 'excel') {
      badges.push({ label: '잠재고객', color: 'bg-yellow-100 text-yellow-800 border border-yellow-300' });
      return (
        <div className="flex flex-wrap gap-1">
          {badges.map((badge, index) => (
            <span key={index} className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
              {badge.label}
            </span>
          ))}
        </div>
      );
    }
    
    // 3. 통합 딱지 (보라색) - 연동된 고객
    if (linkedStatus === 'linked') {
      badges.push({ label: '통합', color: 'bg-purple-100 text-purple-800 border border-purple-300' });
      // 통합 상태일 때 크루즈몰 딱지도 표시
      badges.push({ label: '크루즈몰', color: 'bg-green-100 text-green-800 border border-green-300' });
    }
    
    // 4. 크루즈몰 상태 (통합 상태가 'mall'인 경우)
    if (linkedStatus === 'mall') {
      badges.push({ label: '크루즈몰', color: 'bg-green-100 text-green-800 border border-green-300' });
    }
    
    // 5. 테스트 상태 (통합 상태가 'test'인 경우)
    if (linkedStatus === 'test') {
      badges.push({ label: '테스트', color: 'bg-orange-100 text-orange-800 border border-orange-300' });
    }
    
    // 6. 크루즈몰 고객 딱지 (초록색) - 연동되지 않은 크루즈몰 고객만
    if ((userData.email && userData.mallNickname) && linkedStatus !== 'linked' && linkedStatus !== 'mall' && linkedStatus !== 'test') {
      badges.push({ label: '크루즈몰', color: 'bg-green-100 text-green-800 border border-green-300' });
    }
    
    // 7. 지니 상태 딱지 (크루즈가이드 또는 크루즈몰 고객의 지니 상태)
    // 크루즈몰 상태일 때도 지니 상태를 표시해야 함
    if (genieStatus === 'active' || genieStatus === 'package') {
      badges.push({ label: '활성', color: 'bg-blue-100 text-blue-800 border border-blue-300' });
    } else if (genieStatus === 'locked') {
      badges.push({ label: '잠금', color: 'bg-red-100 text-red-800 border border-red-300' });
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {badges.map((badge, index) => (
          <span key={index} className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
            {badge.label}
          </span>
        ))}
      </div>
    );
  };

  const resolvedStatusLabel = useMemo(() => {
    if (!user) return <span className="text-gray-400">-</span>;
    if (isEditing) {
      // 편집 중일 때는 상태 딱지 표시
      return renderStatusBadges(user, editForm.linkedStatus, editForm.genieStatus);
    }
    // 저장된 상태가 있으면 우선 사용 (저장 후 반영을 위해)
    if (lastSavedLinkedStatus !== null && lastSavedGenieStatus !== null) {
      return renderStatusBadges(user, lastSavedLinkedStatus, lastSavedGenieStatus);
    }
    // 기본 상태 판단 (데이터베이스에서 읽은 값 기반)
    const isMallUser = user.mallUserId !== null && user.mallUserId !== undefined;
    const customerStatus = user.customerStatus;
    let defaultLinkedStatus: EditFormState['linkedStatus'] = 'not-linked';
    if (customerStatus === 'test' || customerStatus === 'test-locked') {
      defaultLinkedStatus = 'test';
    } else if (isMallUser) {
      // mallUserId가 있으면 크루즈몰 고객
      defaultLinkedStatus = 'mall';
    }
    
    // 지니 상태 결정 (customerStatus와 isLocked 기반)
    let defaultGenieStatus: EditFormState['genieStatus'] = 'active';
    if (customerStatus === 'test' || customerStatus === 'test-locked') {
      defaultGenieStatus = customerStatus as EditFormState['genieStatus'];
    } else if (customerStatus === 'excel') {
      defaultGenieStatus = 'excel';
    } else if (customerStatus === 'locked' || user.isLocked) {
      defaultGenieStatus = 'locked';
    } else if (customerStatus === 'active' || customerStatus === 'package') {
      defaultGenieStatus = customerStatus;
    } else if (user.trips.length > 0) {
      defaultGenieStatus = 'package';
    }
    
    return renderStatusBadges(user, defaultLinkedStatus, defaultGenieStatus);
  }, [user, isEditing, editForm.linkedStatus, editForm.genieStatus, lastSavedLinkedStatus, lastSavedGenieStatus]);

  // 고객 타입에 따른 지니 상태 옵션 반환
  const getStatusOptions = () => {
    if (!user) return [];
    
    const customerStatus = user.customerStatus;
    
    // 테스트 고객
    if (customerStatus === 'test' || customerStatus === 'test-locked') {
      return [
        { value: 'test', label: '테스트' },
        { value: 'test-locked', label: '테스트잠금' },
      ];
    }
    
    // 잠재고객
    if (customerStatus === 'excel') {
      return [
        { value: 'excel', label: '잠재고객' },
      ];
    }
    
    // 크루즈가이드 또는 크루즈몰 고객
    return [
      { value: 'active', label: '활성' },
      { value: 'package', label: '패키지' },
      { value: 'locked', label: '잠금' },
      { value: 'test-locked', label: '테스트잠금' }, // 테스트잠금 옵션 추가
    ];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <FiAlertCircle className="text-red-600 text-xl mt-1 mr-3" />
          <div className="flex-1">
            <h3 className="text-red-800 font-semibold mb-2">오류 발생</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => router.push('/admin/customers')}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              고객 목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            사용자 상세: {user.name || '이름 없음'} ({user.phone || '-'})
          </h1>
          <p className="text-gray-600">사용자 ID: {user.id}</p>
        </div>
        <button
          onClick={() => router.push('/admin/customers')}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
        >
          목록으로
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">프로필 정보</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <FiEdit2 className="w-4 h-4" />
                편집
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <FiSave className="w-4 h-4" />
                  {isSaving ? '저장 중...' : '저장'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <FiXCircle className="w-4 h-4" />
                  취소
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="mall-search-container relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">크루즈몰 닉네임 연동</label>
                <div className="relative">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={mallSearchTerm}
                      onChange={(e) => {
                        const value = e.target.value;
                        setMallSearchTerm(value);
                        if (!value.trim()) {
                          setSelectedMallUser(null);
                          setEditForm((prev) => ({ ...prev, mallUserId: null, mallNickname: '' }));
                        }
                      }}
                      placeholder="크루즈몰 고객 이름, 전화번호, 이메일로 검색..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleToggleMallUserList}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                    >
                      {mallUserListOpen ? '목록 닫기' : '목록 보기'}
                    </button>
                  </div>
                  {mallSearchLoading && (
                    <div className="absolute right-24 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                    </div>
                  )}
                  {selectedMallUser && !mallUserListOpen && (
                    <button
                      type="button"
                      onClick={handleUnlinkMallUser}
                      className="absolute right-24 top-1/2 transform -translate-y-1/2 text-red-600 hover:text-red-800 text-sm"
                      title="연동 해제"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {mallSearchDropdownOpen && mallSearchResults.length > 0 && !mallUserListOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {mallSearchResults.map((mallUser) => (
                      <button
                        key={mallUser.id}
                        type="button"
                        onClick={() => handleSelectMallUser(mallUser)}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-semibold text-gray-900">{mallUser.displayName}</div>
                        {mallUser.phone && <div className="text-sm text-gray-600">전화: {mallUser.phone}</div>}
                        {mallUser.email && <div className="text-sm text-gray-600">이메일: {mallUser.email}</div>}
                        <div className="text-xs text-gray-400 mt-1">ID: {mallUser.id}</div>
                      </button>
                    ))}
                  </div>
                )}

                {mallUserListOpen && (
                  <div className="mt-3 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-700">크루즈몰 고객 목록 ({mallUserList.length}명)</h3>
                      <button
                        type="button"
                        onClick={handleToggleMallUserList}
                        className="text-gray-500 hover:text-gray-700 text-sm"
                      >
                        ✕ 닫기
                      </button>
                    </div>

                    {mallUserListLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : mallUserList.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">고객이 없습니다.</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {mallUserList.map((mallUser) => (
                          <button
                            key={mallUser.id}
                            type="button"
                            onClick={() => handleSelectMallUser(mallUser)}
                            className={`p-3 rounded-lg border text-left transition-colors ${
                              selectedMallUser?.id === mallUser.id
                                ? 'bg-blue-100 border-blue-500'
                                : 'bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                            }`}
                          >
                            <div className="font-semibold text-gray-900 text-sm">{mallUser.displayName}</div>
                            {mallUser.phone && <div className="text-xs text-gray-600 mt-1">전화: {mallUser.phone}</div>}
                            {mallUser.email && <div className="text-xs text-gray-600">이메일: {mallUser.email}</div>}
                            <div className="text-xs text-gray-400 mt-1">ID: {mallUser.id}</div>
                            {selectedMallUser?.id === mallUser.id && (
                              <div className="text-xs text-blue-600 font-medium mt-1">✓ 연동됨</div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selectedMallUser && !mallSearchDropdownOpen && !mallUserListOpen && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-blue-900">
                          연동됨: {selectedMallUser.displayName}
                        </div>
                        {selectedMallUser.phone && (
                          <div className="text-xs text-blue-700">전화: {selectedMallUser.phone}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleUnlinkMallUser}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        해제
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 크루즈가이드지니 연동 섹션 */}
              <div className="genie-search-container relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">크루즈가이드지니 연동</label>
                <div className="relative">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={genieSearchTerm}
                      onChange={(e) => {
                        const value = e.target.value;
                        setGenieSearchTerm(value);
                        if (!value.trim()) {
                          setSelectedGenieUser(null);
                          setEditForm((prev) => ({ ...prev, linkedGenieUserId: null }));
                        }
                      }}
                      placeholder="크루즈가이드지니 활성 사용자 이름, 전화번호, 이메일로 검색..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleToggleGenieUserList}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                    >
                      {genieUserListOpen ? '목록 닫기' : '목록 보기'}
                    </button>
                  </div>
                  {genieSearchLoading && (
                    <div className="absolute right-24 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                    </div>
                  )}
                  {selectedGenieUser && !genieUserListOpen && (
                    <button
                      type="button"
                      onClick={handleUnlinkGenieUser}
                      className="absolute right-24 top-1/2 transform -translate-y-1/2 text-red-600 hover:text-red-800 text-sm"
                      title="연동 해제"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {genieSearchDropdownOpen && genieSearchResults.length > 0 && !genieUserListOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {genieSearchResults.map((genieUser) => (
                      <button
                        key={genieUser.id}
                        type="button"
                        onClick={() => handleSelectGenieUser(genieUser)}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-semibold text-gray-900">{genieUser.name || '이름 없음'}</div>
                        {genieUser.phone && <div className="text-sm text-gray-600">전화: {genieUser.phone}</div>}
                        {genieUser.email && <div className="text-sm text-gray-600">이메일: {genieUser.email}</div>}
                        <div className="text-xs text-gray-400 mt-1">ID: {genieUser.id} ({genieUser.customerTypeLabel})</div>
                      </button>
                    ))}
                  </div>
                )}

                {genieUserListOpen && (
                  <div className="mt-3 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-700">크루즈가이드지니 활성 사용자 목록 ({genieUserList.length}명)</h3>
                      <button
                        type="button"
                        onClick={handleToggleGenieUserList}
                        className="text-gray-500 hover:text-gray-700 text-sm"
                      >
                        ✕ 닫기
                      </button>
                    </div>

                    {genieUserListLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : genieUserList.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">사용자가 없습니다.</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {genieUserList.map((genieUser) => (
                          <button
                            key={genieUser.id}
                            type="button"
                            onClick={() => handleSelectGenieUser(genieUser)}
                            className={`p-3 rounded-lg border text-left transition-colors ${
                              selectedGenieUser?.id === genieUser.id
                                ? 'bg-blue-100 border-blue-500'
                                : 'bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                            }`}
                          >
                            <div className="font-semibold text-gray-900 text-sm">{genieUser.name || '이름 없음'}</div>
                            {genieUser.phone && <div className="text-xs text-gray-600 mt-1">전화: {genieUser.phone}</div>}
                            {genieUser.email && <div className="text-xs text-gray-600">이메일: {genieUser.email}</div>}
                            <div className="text-xs text-gray-400 mt-1">ID: {genieUser.id} ({genieUser.customerTypeLabel})</div>
                            {selectedGenieUser?.id === genieUser.id && (
                              <div className="text-xs text-blue-600 font-medium mt-1">✓ 연동됨</div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selectedGenieUser && !genieSearchDropdownOpen && !genieUserListOpen && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-blue-900">
                          연동됨: {selectedGenieUser.name || '이름 없음'}
                        </div>
                        {selectedGenieUser.phone && (
                          <div className="text-xs text-blue-700">전화: {selectedGenieUser.phone}</div>
                        )}
                        <div className="text-xs text-blue-700">타입: {selectedGenieUser.customerTypeLabel}</div>
                      </div>
                      <button
                        type="button"
                        onClick={handleUnlinkGenieUser}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        해제
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 온보딩 추가 버튼 */}
              <div>
                <button
                  type="button"
                  onClick={() => setIsOnboardingModalOpen(true)}
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <FiSave className="w-5 h-5" />
                  온보딩 추가
                </button>
                <p className="mt-1 text-xs text-gray-500">
                  크루즈 가이드 지니에 온보딩 정보를 추가하여 활성화할 수 있습니다.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">통합 상태</label>
                  <select
                    value={editForm.linkedStatus}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, linkedStatus: e.target.value as EditFormState['linkedStatus'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="not-linked">연동 안 됨</option>
                    <option value="linked">통합 (연동됨)</option>
                    <option value="mall">크루즈몰</option>
                    <option value="test">테스트</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    크루즈몰과 크루즈 가이드가 연동되었는지 설정합니다.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">지니 상태</label>
                  <select
                    value={editForm.genieStatus || ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, genieStatus: e.target.value as EditFormState['genieStatus'] || null }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {getStatusOptions().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {user.customerStatus === 'test' || user.customerStatus === 'test-locked' 
                      ? '테스트 고객 상태입니다.'
                      : user.customerStatus === 'excel'
                      ? '잠재고객 상태입니다.'
                      : '크루즈 가이드 지니 상태를 선택하세요.'}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">여행 횟수</label>
                <input
                  type="number"
                  min={0}
                  value={editForm.tripCount}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, tripCount: Number(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">관리자 메모</label>
                <textarea
                  value={editForm.adminMemo}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, adminMemo: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="고객에 대한 메모를 입력하세요..."
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <ProfileRow label="이름" value={user.name || '이름 없음'} />
              <ProfileRow label="전화번호" value={user.phone || '없음'} />
              <ProfileRow label="이메일" value={user.email || '없음'} />
              <div className="flex items-start">
                <label className="block text-sm font-medium text-gray-700 w-32 flex-shrink-0">카카오 채널</label>
                <div className="flex-1">
                  {user.kakaoChannelAdded ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ 추가됨
                      </span>
                      {user.kakaoChannelAddedAt && (
                        <span className="text-xs text-gray-500">
                          ({new Date(user.kakaoChannelAddedAt).toLocaleDateString('ko-KR')})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      미추가
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-start">
                <label className="block text-sm font-medium text-gray-700 w-32 flex-shrink-0">고객 상태</label>
                <div className="flex-1">
                  {resolvedStatusLabel}
                </div>
              </div>
              <ProfileRow label="가입일" value={new Date(user.createdAt).toLocaleString('ko-KR')} />
              <ProfileRow
                label="마지막 접속"
                value={user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString('ko-KR') : '없음'}
              />
              <ProfileRow label="로그인 횟수" value={`${user.loginCount || 0}회`} />
              <ProfileRow label="여행 횟수" value={`${user.tripCount || 0}회`} />
              <ProfileRow label="비밀번호" value={user.currentPassword || '정보 없음'} />
              {user.customerStatus === 'test' && user.testModeStartedAt && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                  <p className="text-sm font-semibold text-purple-700">🧪 테스트 모드 정보</p>
                  <ProfileRow 
                    label="테스트 시작일" 
                    value={new Date(user.testModeStartedAt).toLocaleString('ko-KR')} 
                  />
                  {(() => {
                    const startDate = new Date(user.testModeStartedAt!);
                    const endDate = new Date(startDate);
                    endDate.setHours(endDate.getHours() + 72);
                    const now = new Date();
                    const remainingMs = endDate.getTime() - now.getTime();
                    const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
                    
                    if (remainingHours <= 0) {
                      return <ProfileRow label="남은 시간" value="만료됨" />
                    }
                    const days = Math.floor(remainingHours / 24);
                    const hours = remainingHours % 24;
                    const remainingText = days > 0 ? `${days}일 ${hours}시간` : `${hours}시간`;
                    return <ProfileRow label="남은 시간" value={remainingText} />
                  })()}
                </div>
              )}
              {user.adminMemo && <ProfileRow label="관리자 메모" value={user.adminMemo} multiline />}
              
              {/* 크루즈가이드 사용자인 경우 연동된 크루즈몰 정보 표시 */}
              {user.role === 'user' && user.linkedMallUser && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                  <p className="text-sm font-semibold text-green-700">🔗 연동된 크루즈몰 정보</p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-600 font-semibold">✓ 연동 완료</span>
                      {user.linkedMallUser.createdAt && (
                        <span className="text-xs text-gray-500">
                          (가입일: {new Date(user.linkedMallUser.createdAt).toLocaleString('ko-KR')})
                        </span>
                      )}
                    </div>
                    <ProfileRow label="크루즈몰 사용자 ID" value={user.linkedMallUser.id.toString()} />
                    <ProfileRow label="이름" value={user.linkedMallUser.name || '정보 없음'} />
                    <ProfileRow label="연락처" value={user.linkedMallUser.phone || '정보 없음'} />
                    <ProfileRow label="이메일" value={user.linkedMallUser.email || '정보 없음'} />
                    <ProfileRow label="비밀번호" value={user.linkedMallUser.currentPassword || '정보 없음'} />
                    {user.mallNickname && (
                      <ProfileRow label="크루즈몰 닉네임" value={user.mallNickname} />
                    )}
                    <div className="mt-2">
                      <a
                        href={`/admin/mall-customers/${user.linkedMallUser.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        크루즈몰 고객 상세 보기 →
                      </a>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 크루즈가이드 사용자인데 mallUserId가 있지만 linkedMallUser가 없는 경우 (데이터 불일치) */}
              {user.role === 'user' && user.mallUserId && !user.linkedMallUser && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 font-semibold mb-1">⚠️ 크루즈몰 연동 정보 확인 필요</p>
                    <p className="text-xs text-yellow-700 mt-2">
                      크루즈몰 연동이 설정되어 있지만 (mallUserId: {user.mallUserId}), 해당 사용자 정보를 찾을 수 없습니다. 관리자에게 문의하세요.
                    </p>
                  </div>
                </div>
              )}
              
              {/* 크루즈몰 사용자인 경우 연동된 크루즈가이드 정보 표시 */}
              {user.role === 'community' && user.linkedGenieUser && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                  <p className="text-sm font-semibold text-blue-700">🔗 연동된 크루즈가이드 지니 정보</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-600 font-semibold">✓ 연동 완료</span>
                      {user.linkedGenieUser.genieLinkedAt && (
                        <span className="text-xs text-gray-500">
                          ({new Date(user.linkedGenieUser.genieLinkedAt).toLocaleString('ko-KR')})
                        </span>
                      )}
                      {user.linkedGenieUser.createdAt && (
                        <span className="text-xs text-gray-500">
                          (가입일: {new Date(user.linkedGenieUser.createdAt).toLocaleString('ko-KR')})
                        </span>
                      )}
                    </div>
                    <ProfileRow label="크루즈가이드 사용자 ID" value={user.linkedGenieUser.id.toString()} />
                    <ProfileRow label="이름" value={user.linkedGenieUser.name || '정보 없음'} />
                    <ProfileRow label="연락처" value={user.linkedGenieUser.phone || '정보 없음'} />
                    <ProfileRow label="이메일" value={user.linkedGenieUser.email || '정보 없음'} />
                    <ProfileRow label="비밀번호" value={user.linkedGenieUser.currentPassword || '정보 없음'} />
                    {user.linkedGenieUser.genieStatus && (
                      <ProfileRow 
                        label="지니 상태" 
                        value={user.linkedGenieUser.genieStatus === 'active' ? '사용 중' : '사용 종료'} 
                      />
                    )}
                    <div className="mt-2">
                      <a
                        href={`/admin/users/${user.linkedGenieUser.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        크루즈가이드 사용자 상세 보기 →
                      </a>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 크루즈몰 사용자인데 연동된 크루즈가이드 사용자가 없는 경우 */}
              {user.role === 'community' && !user.linkedGenieUser && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-600">
                      연동된 크루즈가이드 지니 정보가 없습니다.
                    </p>
                  </div>
                </div>
              )}
              
              {/* 연동 정보가 없는 경우 */}
              {user.role === 'user' && !user.mallUserId && !user.linkedMallUser && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-600">
                      연동된 크루즈몰 정보가 없습니다.
                    </p>
                  </div>
                </div>
              )}
              {user.role === 'community' && !user.linkedGenieUser && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-600">
                      연동된 크루즈가이드 지니 정보가 없습니다.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {!isEditing && (user.isLocked || user.isHibernated) && (
            <div
              className={`mt-6 p-4 rounded-lg ${user.isLocked ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                {user.isLocked ? <FiLock className="text-red-600" /> : <FiClock className="text-yellow-600" />}
                <p className={`font-semibold ${user.isLocked ? 'text-red-800' : 'text-yellow-800'}`}>
                  {user.isLocked ? '계정 잠금' : '동면 상태'}
                </p>
              </div>
              {user.isLocked && user.lockedAt && (
                <p className="text-sm text-red-700">잠금 일시: {new Date(user.lockedAt).toLocaleString('ko-KR')}</p>
              )}
              {user.isLocked && user.lockedReason && (
                <p className="text-sm text-red-700 mt-1">사유: {user.lockedReason}</p>
              )}
              {user.isHibernated && user.hibernatedAt && (
                <p className="text-sm text-yellow-700">동면 시작: {new Date(user.hibernatedAt).toLocaleString('ko-KR')}</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-3">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">크루즈가이드 보안관리</h2>
          <button
            onClick={handleResetPassword}
            disabled={isResettingPassword}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <FiKey className="w-5 h-5" />
            {isResettingPassword ? '처리 중...' : '비밀번호 초기화'}
          </button>

          {user.isLocked ? (
            <button
              onClick={handleUnlockAccount}
              disabled={isUnlocking}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <FiUnlock className="w-5 h-5" />
              {isUnlocking ? '처리 중...' : '계정 잠금 해제'}
            </button>
          ) : (
            <button
              onClick={handleLockAccount}
              disabled={isLocking}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <FiLock className="w-5 h-5" />
              {isLocking ? '처리 중...' : '계정 잠금'}
            </button>
          )}
        </div>
      </div>

      {sessions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setIsSessionsExpanded(!isSessionsExpanded)}
              className="flex items-center gap-2 text-xl font-semibold text-gray-800 hover:text-gray-600 transition-colors"
            >
              활성 세션 ({sessions.length})
              {isSessionsExpanded ? <FiChevronUp className="w-5 h-5" /> : <FiChevronDown className="w-5 h-5" />}
            </button>
            <button
              onClick={loadSessions}
              disabled={isLoadingSessions}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
            >
              {isLoadingSessions ? '새로고침 중...' : '새로고침'}
            </button>
          </div>

          {isSessionsExpanded && (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">세션 ID: {session.id.substring(0, 20)}...</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <FiClock className="w-4 h-4" />
                        생성: {new Date(session.createdAt).toLocaleString('ko-KR')}
                      </span>
                      {session.expiresAt && <span>만료: {new Date(session.expiresAt).toLocaleString('ko-KR')}</span>}
                      {session.isExpired && <span className="text-red-600 font-medium">만료됨</span>}
                    </div>
                  </div>
                  {!session.isExpired && (
                    <button
                      onClick={() => handleTerminateSession(session.id)}
                      disabled={isTerminatingSession === session.id}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <FiX className="w-4 h-4" />
                      {isTerminatingSession === session.id ? '종료 중...' : '세션 종료'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <TripSection
        trips={user.trips}
        isExpanded={isTripsExpanded}
        onToggle={() => setIsTripsExpanded((prev) => !prev)}
        onDeleteTrip={handleDeleteTrip}
        deletingTripId={isDeletingTrip}
        onAddOnboarding={handleAddOnboarding}
        onAddOnboardingToTrip={handleAddOnboardingToTrip}
        isProcessing={isProcessing}
      />

      <PasswordHistorySection
        events={passwordEvents}
        isExpandedDefault={false}
      />

      <UserContentSection userId={userId} />
      <UserProductActivitySection userId={userId} />
      <TravelRecordsSection userId={userId} />
      <UserAnalytics userId={userId} />

      {/* 온보딩 추가 모달 */}
      {isOnboardingModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">온보딩 추가하기</h2>
              <button
                onClick={() => {
                  setIsOnboardingModalOpen(false);
                  setSelectedProduct(null);
                  setSelectedProductCode(null);
                  setProductSearchTerm('');
                  setOnboardingFormData({
                    companionType: '가족',
                    startDate: '',
                    endDate: '',
                  });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* 상품 코드 선택 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  상품 코드 선택 (연관검색)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    placeholder="상품명, 크루즈명, 상품코드로 검색..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>
                
                {/* 상품 목록 드롭다운 */}
                {productOptions.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                    {productOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleProductSelect(option.value)}
                        className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${
                          selectedProductCode === option.value ? 'bg-blue-100 border-l-4 border-blue-600' : ''
                        }`}
                      >
                        <div className="font-semibold text-gray-900">{option.label}</div>
                        {option.product.nights && option.product.days && (
                          <div className="text-sm text-gray-600">
                            {option.product.nights}박 {option.product.days}일
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 선택된 상품 정보 표시 */}
              {selectedProduct && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">✅ 선택된 상품 정보</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start justify-between">
                      <span className="font-medium text-gray-700">크루즈:</span>
                      <span className="text-gray-900 text-right">{selectedProduct.cruiseLine} {selectedProduct.shipName}</span>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="font-medium text-gray-700">패키지:</span>
                      <span className="text-gray-900 text-right">{selectedProduct.packageName}</span>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="font-medium text-gray-700">기간:</span>
                      <span className="text-gray-900 font-semibold">{selectedProduct.nights}박 {selectedProduct.days}일</span>
                    </div>
                    {selectedProduct.itineraryPattern && (
                      <div className="flex items-start justify-between">
                        <span className="font-medium text-gray-700">여행지:</span>
                        <span className="text-gray-900 text-right max-w-[60%]">
                          {(() => {
                            const itineraryPattern = normalizeItineraryPattern(selectedProduct.itineraryPattern);
                            const dests: string[] = [];
                            itineraryPattern.forEach((day: any) => {
                              if ((day.type === 'PortVisit' || day.type === 'Embarkation' || day.type === 'Disembarkation') 
                                  && day.location && day.country) {
                                const countryName = getKoreanCountryName(day.country) || day.country;
                                const location = day.location;
                                
                                // 미국과 캐나다는 국가만 추가
                                if (day.country === 'US' || day.country === 'CA') {
                                  const dest = countryName;
                                  if (!dests.includes(dest)) {
                                    dests.push(dest);
                                  }
                                } else {
                                  // 다른 국가는 "국가 - 지역" 형식
                                  const dest = `${countryName} - ${location}`;
                                  if (!dests.includes(dest)) {
                                    dests.push(dest);
                                  }
                                }
                              }
                            });
                            return dests.join(', ') || '없음';
                          })()}
                        </span>
                      </div>
                    )}
                    {onboardingFormData.startDate && (
                      <div className="flex items-start justify-between">
                        <span className="font-medium text-gray-700">여행 기간:</span>
                        <span className="text-gray-900">
                          {new Date(onboardingFormData.startDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} ~ {onboardingFormData.endDate ? new Date(onboardingFormData.endDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) : '-'}
                        </span>
                      </div>
                    )}
                    {onboardingFormData.startDate && (() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const startDate = new Date(onboardingFormData.startDate);
                      startDate.setHours(0, 0, 0, 0);
                      const diffTime = startDate.getTime() - today.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      let ddayText = '';
                      let ddayColor = 'text-gray-600';
                      if (diffDays < 0) {
                        ddayText = `여행 시작일이 지났습니다 (${Math.abs(diffDays)}일 전)`;
                        ddayColor = 'text-red-600';
                      } else if (diffDays === 0) {
                        ddayText = 'D-Day (오늘 출발!)';
                        ddayColor = 'text-red-600 font-bold';
                      } else {
                        ddayText = `D-${diffDays} (${diffDays}일 남음)`;
                        ddayColor = diffDays <= 3 ? 'text-orange-600 font-semibold' : 'text-blue-600 font-semibold';
                      }
                      
                      return (
                        <div className="flex items-start justify-between pt-2 border-t border-blue-300">
                          <span className="font-medium text-gray-700">출발까지:</span>
                          <span className={ddayColor}>{ddayText}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* 동반자 선택 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">동반자</label>
                <div className="flex gap-2">
                  {(['친구', '커플', '가족', '혼자'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setOnboardingFormData(prev => ({ ...prev, companionType: type }))}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        onboardingFormData.companionType === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* 여행 기간 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">출발일</label>
                  <input
                    type="date"
                    value={onboardingFormData.startDate}
                    onChange={(e) => setOnboardingFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">도착일</label>
                  <input
                    type="date"
                    value={onboardingFormData.endDate}
                    onChange={(e) => setOnboardingFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateOnboarding}
                  disabled={isProcessing || !selectedProduct}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? '처리 중...' : '온보딩 추가하기'}
                </button>
                <button
                  onClick={() => {
                    setIsOnboardingModalOpen(false);
                    setSelectedProduct(null);
                    setSelectedProductCode(null);
                    setProductSearchTerm('');
                    setOnboardingFormData({
                      companionType: '가족',
                      startDate: '',
                      endDate: '',
                    });
                  }}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileRow({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`font-medium text-gray-800 ${multiline ? 'whitespace-pre-wrap' : ''}`}>{value}</p>
    </div>
  );
}

function TripSection({
  trips,
  isExpanded,
  onToggle,
  onDeleteTrip,
  deletingTripId,
  onAddOnboarding,
  onAddOnboardingToTrip,
  isProcessing,
}: {
  trips: TripSummary[];
  isExpanded: boolean;
  onToggle: () => void;
  onDeleteTrip: (tripId: number) => void;
  deletingTripId: Nullable<number>;
  onAddOnboarding: () => void;
  onAddOnboardingToTrip: (tripId: number) => void;
  isProcessing: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 text-xl font-semibold text-gray-800 hover:text-gray-600 transition-colors"
        >
          여행 목록 ({trips.length || 0}회)
          {isExpanded ? <FiChevronUp className="w-5 h-5" /> : <FiChevronDown className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-3">
          {trips.length > 0 && (
            <button
              onClick={onAddOnboarding}
              disabled={isProcessing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              <span>+</span>
              온보딩 추가하기
            </button>
          )}
          <p className="text-sm text-gray-600">총 {trips.length || 0}회 여행</p>
        </div>
      </div>

      {isExpanded ? (
        trips.length > 0 ? (
          <div className="space-y-4">
            {trips.map((trip, index) => {
              const destinationList = Array.isArray(trip.destination)
                ? trip.destination.join(', ')
                : trip.destination || '목적지 정보 없음';
              return (
                <div key={trip.id} className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                          {trips.length - index}번째 여행
                        </span>
                        {trip.ownerType === 'linked_mall' && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            연동된 크루즈몰 여행
                          </span>
                        )}
                        {trip.ownerType === 'linked_genie' && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                            연동된 크루즈가이드 여행
                          </span>
                        )}
                        {trip.status && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {trip.status}
                          </span>
                        )}
                        {index === 0 && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                            최근 여행
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">{trip.cruiseName || '크루즈 이름 없음'}</h3>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {index === 0 && (
                        <button
                          onClick={() => onAddOnboardingToTrip(trip.id)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 flex items-center gap-1 disabled:opacity-50"
                        >
                          <span>+</span>
                          온보딩 추가
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteTrip(trip.id)}
                        disabled={deletingTripId === trip.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="여행 삭제"
                      >
                        {deletingTripId === trip.id ? <span className="animate-spin">⏳</span> : <FiTrash2 size={20} />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    <ProfileRow label="여행 기간" value={formatTripPeriod(trip.startDate, trip.endDate, trip.nights, trip.days)} />
                    <ProfileRow label="동행" value={translateCompanion(trip.companionType)} />
                    <ProfileRow label="방문 국가/지역" value={destinationList} />
                    <ProfileRow label="등록일" value={new Date(trip.createdAt).toLocaleDateString('ko-KR')} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">이 사용자의 여행 기록이 없습니다.</p>
        )
      ) : null}
    </div>
  );
}

function formatTripPeriod(startDate: Nullable<string>, endDate: Nullable<string>, nights: Nullable<number>, days: Nullable<number>) {
  if (!startDate && !endDate) return '날짜 정보 없음';
  const start = startDate ? new Date(startDate).toLocaleDateString('ko-KR') : '';
  const end = endDate ? new Date(endDate).toLocaleDateString('ko-KR') : '';
  const period = start && end ? `${start} ~ ${end}` : start || end;
  if (nights || days) {
    return `${period}\n(${nights || 0}박 ${days || 0}일)`;
  }
  return period;
}

function translateCompanion(companion: Nullable<string>) {
  if (!companion) return '동행 정보 없음';
  const map: Record<string, string> = {
    solo: '혼자',
    couple: '커플',
    family: '가족',
    friends: '친구',
    group: '단체',
  };
  return map[companion.toLowerCase()] || companion;
}

function PasswordHistorySection({ events, isExpandedDefault }: { events: PasswordEvent[]; isExpandedDefault: boolean }) {
  const [isExpanded, setIsExpanded] = useState(isExpandedDefault);
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex items-center gap-2 text-xl font-semibold text-gray-800 hover:text-gray-600 transition-colors mb-4"
      >
        비밀번호 변경 이력 ({events.length}건)
        {isExpanded ? <FiChevronUp className="w-5 h-5" /> : <FiChevronDown className="w-5 h-5" />}
      </button>
      {isExpanded ? (
        events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">변경 일시</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">사유</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{new Date(event.createdAt).toLocaleString('ko-KR')}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{event.reason || '사유 없음'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">비밀번호 변경 이력이 없습니다.</p>
        )
      ) : null}
    </div>
  );
}

function UserContentSection({ userId }: { userId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reviews' | 'posts' | 'comments'>('reviews');

  useEffect(() => {
    void loadContent();
  }, [userId]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const [reviewsRes, postsRes, commentsRes] = await Promise.all([
        fetch(`/api/admin/users/${userId}/reviews`, { credentials: 'include' }),
        fetch(`/api/admin/users/${userId}/posts`, { credentials: 'include' }),
        fetch(`/api/admin/users/${userId}/comments`, { credentials: 'include' }),
      ]);

      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        if (data.ok) setReviews(data.reviews || []);
      }
      if (postsRes.ok) {
        const data = await postsRes.json();
        if (data.ok) setPosts(data.posts || []);
      }
      if (commentsRes.ok) {
        const data = await commentsRes.json();
        if (data.ok) setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Failed to load user content:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">작성한 콘텐츠</h2>
      <div className="flex gap-2 mb-4 border-b">
        <ContentTab label={`후기 (${reviews.length})`} active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} />
        <ContentTab label={`게시글 (${posts.length})`} active={activeTab === 'posts'} onClick={() => setActiveTab('posts')} />
        <ContentTab label={`댓글 (${comments.length})`} active={activeTab === 'comments'} onClick={() => setActiveTab('comments')} />
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {activeTab === 'reviews' && (reviews.length ? reviews.map((review) => (
            <ContentCard
              key={review.id}
              title={review.title || '제목 없음'}
              description={(review.content || '').substring(0, 100)}
              meta={`별점: ${'⭐'.repeat(review.rating)} | ${new Date(review.createdAt).toLocaleDateString('ko-KR')}`}
              viewLink={`/community/reviews/${review.id}`}
              onDelete={async () => {
                if (!confirm('정말 이 후기를 삭제하시겠습니까?')) return;
                try {
                  const res = await fetch(`/api/admin/reviews/${review.id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                  });
                  const data = await res.json();
                  if (!data.ok) throw new Error(data.error || '삭제 실패');
                  showSuccess('후기가 삭제되었습니다.');
                  await loadContent();
                } catch (error) {
                  showError('후기 삭제 중 오류가 발생했습니다.');
                }
              }}
            />
          )) : <EmptyMessage text="작성한 후기가 없습니다." />)}

          {activeTab === 'posts' && (posts.length ? posts.map((post) => (
            <ContentCard
              key={post.id}
              title={post.title}
              description={(post.content || '').substring(0, 100)}
              meta={`카테고리: ${post.category} | 조회 ${post.views} | 댓글 ${post.comments} | ${new Date(post.createdAt).toLocaleDateString('ko-KR')}`}
              viewLink={`/community/posts/${post.id}`}
              onDelete={async () => {
                if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) return;
                try {
                  const res = await fetch(`/api/admin/posts/${post.id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                  });
                  const data = await res.json();
                  if (!data.ok) throw new Error(data.error || '삭제 실패');
                  showSuccess('게시글이 삭제되었습니다.');
                  await loadContent();
                } catch (error) {
                  showError('게시글 삭제 중 오류가 발생했습니다.');
                }
              }}
            />
          )) : <EmptyMessage text="작성한 게시글이 없습니다." />)}

          {activeTab === 'comments' && (comments.length ? comments.map((comment) => (
            <ContentCard
              key={comment.id}
              description={comment.content}
              meta={`게시글 ID: ${comment.postId} | ${new Date(comment.createdAt).toLocaleDateString('ko-KR')}`}
              viewLink={`/community/posts/${comment.postId}`}
              onDelete={async () => {
                if (!confirm('정말 이 댓글을 삭제하시겠습니까?')) return;
                try {
                  const res = await fetch(`/api/community/posts/${comment.postId}/comments/${comment.id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                  });
                  const data = await res.json();
                  if (!data.ok) throw new Error(data.error || '삭제 실패');
                  showSuccess('댓글이 삭제되었습니다.');
                  await loadContent();
                } catch (error) {
                  showError('댓글 삭제 중 오류가 발생했습니다.');
                }
              }}
            />
          )) : <EmptyMessage text="작성한 댓글이 없습니다." />)}
        </div>
      )}
    </div>
  );
}

function ContentTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium transition-colors ${active ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
    >
      {label}
    </button>
  );
}

function ContentCard({ title, description, meta, viewLink, onDelete }: { title?: string; description: string; meta: string; viewLink: string; onDelete: () => void }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      {title && <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>}
      <p className="text-sm text-gray-600 mb-2">{description}</p>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{meta}</span>
        <div className="flex items-center gap-2">
          <a
            href={viewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            보기
          </a>
          <button onClick={onDelete} className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyMessage({ text }: { text: string }) {
  return <p className="text-gray-500 text-center py-8">{text}</p>;
}

function UserProductActivitySection({ userId }: { userId: string }) {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [views, setViews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inquiries' | 'views'>('inquiries');

  useEffect(() => {
    void loadActivity();
  }, [userId]);

  const loadActivity = async () => {
    try {
      setLoading(true);
      const [inquiriesRes, viewsRes] = await Promise.all([
        fetch(`/api/admin/users/${userId}/inquiries`, { credentials: 'include' }),
        fetch(`/api/admin/users/${userId}/product-views`, { credentials: 'include' }),
      ]);

      if (inquiriesRes.ok) {
        const data = await inquiriesRes.json();
        if (data.ok) setInquiries(data.inquiries || []);
      }
      if (viewsRes.ok) {
        const data = await viewsRes.json();
        if (data.ok) setViews(data.views || []);
      }
    } catch (error) {
      console.error('Failed to load product activity:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">상품 활동</h2>
      <div className="flex gap-2 mb-4 border-b">
        <ContentTab label={`문의 내역 (${inquiries.length})`} active={activeTab === 'inquiries'} onClick={() => setActiveTab('inquiries')} />
        <ContentTab label={`조회 내역 (${views.length})`} active={activeTab === 'views'} onClick={() => setActiveTab('views')} />
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {activeTab === 'inquiries' && (inquiries.length ? inquiries.map((inquiry) => (
            <ContentCard
              key={inquiry.id}
              title={`상품: ${inquiry.productCode}`}
              description={inquiry.message || '메시지 없음'}
              meta={`이름: ${inquiry.name} | 전화: ${inquiry.phone} | 상태: ${inquiry.status} | ${new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}`}
              viewLink={`/products/${inquiry.productCode}`}
              onDelete={() => {}}
            />
          )) : <EmptyMessage text="문의 내역이 없습니다." />)}

          {activeTab === 'views' && (views.length ? views.map((view) => (
            <ContentCard
              key={view.id}
              title={`상품: ${view.productCode}`}
              description={`${view.productName || '상품명 없음'} / ${view.cruiseName || '크루즈 정보 없음'}`}
              meta={`조회 시각: ${new Date(view.viewedAt).toLocaleString('ko-KR')}`}
              viewLink={`/products/${view.productCode}`}
              onDelete={() => {}}
            />
          )) : <EmptyMessage text="조회 내역이 없습니다." />)}
        </div>
      )}
    </div>
  );
}

function TravelRecordsSection({ userId }: { userId: string }) {
  const [travelRecords, setTravelRecords] = useState<any[]>([]);
  const [unlinkedDiaries, setUnlinkedDiaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    void loadTravelRecords();
  }, [userId]);

  const loadTravelRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}/travel-records`, {
        credentials: 'include',
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data.ok) {
        setTravelRecords(data.travelRecords || []);
        setUnlinkedDiaries(data.unlinkedDiaries || []);
      }
    } catch (error) {
      console.error('Failed to load travel records:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex items-center justify-between w-full text-xl font-semibold text-gray-800 hover:text-gray-600 transition-colors mb-4"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">🗺️</span>
          <span>여행 기록</span>
          <span className="text-sm font-normal text-gray-500">({travelRecords.length}개 여행, {travelRecords.reduce((sum, record) => sum + (record.diaries?.length || 0), 0) + unlinkedDiaries.length}개 다이어리)</span>
        </div>
        {isExpanded ? <FiChevronUp className="w-5 h-5" /> : <FiChevronDown className="w-5 h-5" />}
      </button>

      {isExpanded ? (
        loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : travelRecords.length === 0 && unlinkedDiaries.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <p className="text-gray-500">등록된 여행 기록이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {travelRecords.map((record, index) => (
              <div key={record.id} className="border-l-4 border-blue-500 pl-4 py-4 bg-gradient-to-r from-blue-50 to-white rounded-r-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">{index + 1}번째 여행</span>
                      <span className="text-xs text-gray-500">{new Date(record.createdAt).toLocaleDateString('ko-KR')} 등록</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">🚢 {record.cruiseName || '크루즈명 없음'}</h3>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p><span className="font-semibold">📍 방문 국가:</span> {record.destination || '정보 없음'}</p>
                      <p><span className="font-semibold">👥 동반자:</span> {record.companion || '정보 없음'}</p>
                      <p>
                        <span className="font-semibold">📅 기간:</span>{' '}
                        {record.startDate && record.endDate ? `${new Date(record.startDate).toLocaleDateString('ko-KR')} ~ ${new Date(record.endDate).toLocaleDateString('ko-KR')}` : '정보 없음'}
                      </p>
                      {record.impressions && <p className="mt-2 text-gray-600 italic">💭 {record.impressions}</p>}
                    </div>
                  </div>
                </div>
                {record.diaries?.length ? (
                  <div className="mt-4 ml-4 space-y-3 border-t pt-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">📝 다이어리 ({record.diaries.length}개)</p>
                    {record.diaries.map((diary: any) => (
                      <div key={diary.id} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">{diary.countryName}</span>
                          <span className="text-xs text-gray-500">{new Date(diary.visitDate).toLocaleDateString('ko-KR')}</span>
                        </div>
                        <h5 className="font-semibold text-gray-800 mb-1">{diary.title}</h5>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">{diary.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic ml-4 mt-2">다이어리 기록이 없습니다.</p>
                )}
              </div>
            ))}

            {unlinkedDiaries.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">📝 연결되지 않은 다이어리 ({unlinkedDiaries.length}개)</h3>
                <div className="space-y-3">
                  {unlinkedDiaries.map((diary) => (
                    <div key={diary.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">{diary.countryName}</span>
                        <span className="text-xs text-gray-500">{new Date(diary.visitDate).toLocaleDateString('ko-KR')}</span>
                      </div>
                      <h5 className="font-semibold text-gray-800 mb-1">{diary.title}</h5>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">{diary.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      ) : null}
    </div>
  );
}


