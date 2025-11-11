'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSend, FiUsers, FiUser, FiSearch, FiX, FiAlertCircle, FiCheckCircle, FiUpload, FiDownload, FiFileText } from 'react-icons/fi';
import DOMPurify from 'isomorphic-dompurify';

type Recipient = {
  id: number;
  name: string;
  phone: string;
  readCount: number;
  messageId: number;
};

type Message = {
  id: number;
  title: string;
  content: string;
  messageType: string;
  userId?: number | null;
  user?: { id: number; name: string; phone: string } | null;
  recipients?: Recipient[]; // 그룹화된 메시지의 수신자 목록
  isActive: boolean;
  readCount?: number;
  totalRead?: number; // 그룹화된 메시지의 총 읽음 수
  totalSent: number;
  createdAt: string;
  admin: { id: number; name: string };
  messageIds?: number[]; // 그룹에 속한 모든 메시지 ID (삭제 시 사용)
};

type Customer = {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  hasActiveTrip: boolean;
  latestTrip: { cruiseName: string | null; status: string } | null;
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 고객 검색 및 선택
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [recipientType, setRecipientType] = useState<'all' | 'specific' | 'direct'>('all');
  const customerSearchRef = useRef<HTMLDivElement>(null);
  
  // 통합 수신자 선택
  const [recipientCategory, setRecipientCategory] = useState<'cruise-guide' | 'mall' | 'test' | 'prospect' | 'all'>('all');
  const [unifiedSearchTerm, setUnifiedSearchTerm] = useState('');
  const [unifiedSearchResults, setUnifiedSearchResults] = useState<Array<{
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    type: 'cruise-guide' | 'mall' | 'test' | 'prospect';
    category?: string;
    mallUserId?: string | null; // 크루즈몰 아이디
  }>>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Array<{
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    type: 'cruise-guide' | 'mall' | 'test' | 'prospect' | 'direct';
    directEmail?: string;
    directPhone?: string;
    mallUserId?: string | null; // 크루즈몰 아이디
  }>>([]);
  const [isSearchingUnified, setIsSearchingUnified] = useState(false);
  const unifiedSearchRef = useRef<HTMLDivElement>(null);
  
  // 드롭다운 목록
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownRecipients, setDropdownRecipients] = useState<Array<{
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    type: 'cruise-guide' | 'mall' | 'test' | 'prospect';
    category?: string;
    mallUserId?: string | null; // 크루즈몰 아이디
  }>>([]);
  const [isLoadingDropdown, setIsLoadingDropdown] = useState(false);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // 직접 입력
  const [directInputEnabled, setDirectInputEnabled] = useState(false);
  const [directEmailInput, setDirectEmailInput] = useState(''); // 쉼표로 구분된 이메일 입력
  const [directPhones, setDirectPhones] = useState<string[]>(['']);

  // 이메일 가져오기 모달
  const [showEmailImportModal, setShowEmailImportModal] = useState(false);
  const [emailImportTab, setEmailImportTab] = useState<'excel' | 'saved' | 'manual'>('excel');
  const [savedEmailList, setSavedEmailList] = useState<Array<{ id: number; name: string | null; email: string; phone: string | null; memo: string | null }>>([]);
  const [isLoadingSavedEmails, setIsLoadingSavedEmails] = useState(false);
  const [selectedSavedEmails, setSelectedSavedEmails] = useState<Set<number>>(new Set());
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  const [manualEmailEntry, setManualEmailEntry] = useState({ name: '', email: '', phone: '', memo: '' });
  const [isSavingManual, setIsSavingManual] = useState(false);
  
  // 크루즈몰 사용자 및 잠재고객 목록
  const [mallUsers, setMallUsers] = useState<Array<{ id: number; name: string | null; email: string | null }>>([]);
  const [prospects, setProspects] = useState<Array<{ id: number; name: string | null; email: string }>>([]);
  const [isLoadingMallUsers, setIsLoadingMallUsers] = useState(false);
  const [isLoadingProspects, setIsLoadingProspects] = useState(false);

  // 폼 데이터
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    messageType: 'info',
    isUrgent: false,
    sendMethod: 'cruise-guide' as 'cruise-guide' | 'email' | 'sms' | 'kakao', // 발송 방식
    includeMallUsers: false, // 크루즈몰 사용자 포함
    includeProspects: false, // 잠재고객 포함
    imageUrl: '', // 이미지 URL
  });
  
  // 이미지 업로드
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // 개인화 변수 버튼 표시 여부
  const [showVariableButtons, setShowVariableButtons] = useState(false);

  // 메시지 목록 로드
  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/messages', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.ok) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      alert('메시지를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  // 크루즈몰 사용자 목록 로드
  useEffect(() => {
    if (formData.includeMallUsers && formData.sendMethod === 'email') {
      loadMallUsers();
    } else {
      setMallUsers([]);
    }
  }, [formData.includeMallUsers, formData.sendMethod]);

  // 잠재고객 목록 로드
  useEffect(() => {
    if (formData.includeProspects && formData.sendMethod === 'email') {
      loadProspects();
    } else {
      setProspects([]);
    }
  }, [formData.includeProspects, formData.sendMethod]);

  const loadMallUsers = async () => {
    try {
      setIsLoadingMallUsers(true);
      const response = await fetch('/api/admin/mall-users?emailOnly=true', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.ok) {
        setMallUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to load mall users:', error);
    } finally {
      setIsLoadingMallUsers(false);
    }
  };

  const loadProspects = async () => {
    try {
      setIsLoadingProspects(true);
      const response = await fetch('/api/admin/prospects?activeOnly=true', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.ok) {
        setProspects(data.prospects || []);
      }
    } catch (error) {
      console.error('Failed to load prospects:', error);
    } finally {
      setIsLoadingProspects(false);
    }
  };

  // 통합 검색 - 발송 방식에 따라 최적화된 필터링
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsSearchingUnified(true);
      try {
        const results: Array<{
          id: number;
          name: string | null;
          email: string | null;
          phone: string | null;
          type: 'cruise-guide' | 'mall' | 'test' | 'prospect';
          category?: string;
          mallUserId?: string | null;
        }> = [];

        const hasSearchTerm = unifiedSearchTerm.trim().length > 0;
        const searchLower = hasSearchTerm ? unifiedSearchTerm.toLowerCase() : '';

        // 검색어가 없고 전체 탭이 선택되어 있으면 자동으로 전체 목록 로드
        const shouldLoadAll = !hasSearchTerm && recipientCategory === 'all';

        // 발송 방식별 필터링 로직
        if (formData.sendMethod === 'cruise-guide') {
          // 크루즈가이드 메시지: 크루즈가이드 고객만 (이름, 전화번호)
          if (recipientCategory === 'all' || recipientCategory === 'cruise-guide') {
            try {
              const response = await fetch(`/api/admin/cruise-guide-users?limit=1000`, {
                credentials: 'include',
              });
              const data = await response.json();
              if (data.ok && data.users) {
                data.users.forEach((u: any) => {
                  if (!u.phone) return; // 전화번호 필수
                  if (
                    !hasSearchTerm ||
                    (u.name && u.name.toLowerCase().includes(searchLower)) ||
                    (u.phone && u.phone.includes(unifiedSearchTerm))
                  ) {
                    results.push({
                      id: u.id,
                      name: u.name,
                      email: u.email,
                      phone: u.phone,
                      type: 'cruise-guide',
                      category: '크루즈가이드',
                    });
                  }
                });
              }
            } catch (error) {
              console.error('Failed to search cruise guide users:', error);
            }
          }
        } else if (formData.sendMethod === 'email') {
          // 이메일: 크루즈몰 고객만 (이름, 이메일 주소만)
          if (recipientCategory === 'all' || recipientCategory === 'mall') {
            try {
              console.log('[Email Search] Fetching mall users with emailOnly=true...');
              const response = await fetch(`/api/admin/mall-users?emailOnly=true`, {
                credentials: 'include',
              });
              console.log('[Email Search] Response status:', response.status);
              const data = await response.json();
              console.log('[Email Search] Response data:', { ok: data.ok, usersCount: data.users?.length, error: data.error });
              console.log('[Email Search] Full response:', JSON.stringify(data, null, 2));
              if (data.ok && data.users) {
                console.log('[Email Search] Processing users:', data.users.length);
                data.users.forEach((u: any) => {
                  if (!u.email || u.email.trim() === '') {
                    console.log('[Email Search] Skipping user without email:', u.id, u.name);
                    return;
                  }
                  if (
                    !hasSearchTerm ||
                    (u.name && u.name.toLowerCase().includes(searchLower)) ||
                    (u.email && u.email.toLowerCase().includes(searchLower))
                  ) {
                    results.push({
                      id: u.id,
                      name: u.name,
                      email: u.email,
                      phone: null,
                      type: 'mall',
                      category: '크루즈몰',
                      mallUserId: u.mallUserId,
                    });
                  }
                });
                console.log('[Email Search] Final results count:', results.length);
              } else {
                console.error('[Email Search] API error:', data.error || 'Unknown error');
              }
            } catch (error) {
              console.error('[Email Search] Failed to search mall users:', error);
            }
          }
        } else if (formData.sendMethod === 'sms' || formData.sendMethod === 'kakao') {
          // SMS/카카오 알림톡: 크루즈가이드, 크루즈몰, 테스트, 잠재고객 모두 (이름, 전화번호)
          
          // 크루즈가이드
          if (recipientCategory === 'all' || recipientCategory === 'cruise-guide') {
            try {
              const response = await fetch(`/api/admin/cruise-guide-users?limit=1000`, {
                credentials: 'include',
              });
              const data = await response.json();
              if (data.ok && data.users) {
                data.users.forEach((u: any) => {
                  if (!u.phone) return;
                  if (
                    !hasSearchTerm ||
                    (u.name && u.name.toLowerCase().includes(searchLower)) ||
                    (u.phone && u.phone.includes(unifiedSearchTerm))
                  ) {
                    results.push({
                      id: u.id,
                      name: u.name,
                      email: u.email,
                      phone: u.phone,
                      type: 'cruise-guide',
                      category: '크루즈가이드',
                    });
                  }
                });
              }
            } catch (error) {
              console.error('Failed to search cruise guide users:', error);
            }
          }

          // 테스트
          if (recipientCategory === 'all' || recipientCategory === 'test') {
            try {
              const response = await fetch(`/api/admin/test-users?limit=1000`, {
                credentials: 'include',
              });
              const data = await response.json();
              if (data.ok && data.users) {
                data.users.forEach((u: any) => {
                  if (!u.phone) return;
                  if (
                    !hasSearchTerm ||
                    (u.name && u.name.toLowerCase().includes(searchLower)) ||
                    (u.phone && u.phone.includes(unifiedSearchTerm))
                  ) {
                    results.push({
                      id: u.id,
                      name: u.name,
                      email: u.email,
                      phone: u.phone,
                      type: 'test',
                      category: '테스트',
                    });
                  }
                });
              }
            } catch (error) {
              console.error('Failed to search test users:', error);
            }
          }

          // 크루즈몰 (전화번호가 있는 경우만)
          if (recipientCategory === 'all' || recipientCategory === 'mall') {
            try {
              const response = await fetch(`/api/admin/mall-users`, {
                credentials: 'include',
              });
              const data = await response.json();
              if (data.ok && data.users) {
                data.users.forEach((u: any) => {
                  if (!u.phone) return;
                  if (
                    !hasSearchTerm ||
                    (u.name && u.name.toLowerCase().includes(searchLower)) ||
                    (u.phone && u.phone.includes(unifiedSearchTerm))
                  ) {
                    results.push({
                      id: u.id,
                      name: u.name,
                      email: u.email,
                      phone: u.phone,
                      type: 'mall',
                      category: '크루즈몰',
                      mallUserId: u.mallUserId,
                    });
                  }
                });
              }
            } catch (error) {
              console.error('Failed to search mall users:', error);
            }
          }

          // 잠재고객 (전화번호가 있는 경우만)
          if (recipientCategory === 'all' || recipientCategory === 'prospect') {
            try {
              const response = await fetch(`/api/admin/prospects?activeOnly=true`, {
                credentials: 'include',
              });
              const data = await response.json();
              if (data.ok && data.prospects) {
                data.prospects.forEach((p: any) => {
                  if (!p.phone) return;
                  if (
                    !hasSearchTerm ||
                    (p.name && p.name.toLowerCase().includes(searchLower)) ||
                    (p.phone && p.phone.includes(unifiedSearchTerm))
                  ) {
                    results.push({
                      id: p.id,
                      name: p.name,
                      email: p.email || null,
                      phone: p.phone,
                      type: 'prospect',
                      category: '잠재고객',
                    });
                  }
                });
              }
            } catch (error) {
              console.error('Failed to search prospects:', error);
            }
          }
        }

        setUnifiedSearchResults(results);
      } catch (error) {
        console.error('Failed to search:', error);
      } finally {
        setIsSearchingUnified(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [unifiedSearchTerm, recipientCategory, formData.sendMethod]);

  // 통합 수신자 선택/해제
  const handleSelectRecipient = (recipient: {
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    type: 'cruise-guide' | 'mall' | 'test' | 'prospect';
    category?: string;
    mallUserId?: string | null;
  }) => {
    if (selectedRecipients.find(r => r.id === recipient.id && r.type === recipient.type)) {
      setSelectedRecipients(selectedRecipients.filter(r => !(r.id === recipient.id && r.type === recipient.type)));
    } else {
      setSelectedRecipients([...selectedRecipients, { ...recipient }]);
    }
  };

  // 드롭다운 목록 로드 - 발송 방식에 따라 최적화된 필터링
  const loadDropdownRecipients = async () => {
    try {
      setIsLoadingDropdown(true);
      const results: Array<{
        id: number;
        name: string | null;
        email: string | null;
        phone: string | null;
        type: 'cruise-guide' | 'mall' | 'test' | 'prospect';
        category?: string;
        mallUserId?: string | null;
      }> = [];

      // 발송 방식별 필터링 로직
      if (formData.sendMethod === 'cruise-guide') {
        // 크루즈가이드 메시지: 크루즈가이드 고객만 (이름, 전화번호)
        if (recipientCategory === 'all' || recipientCategory === 'cruise-guide') {
          try {
            const response = await fetch(`/api/admin/cruise-guide-users?limit=1000`, {
              credentials: 'include',
            });
            const data = await response.json();
            if (data.ok && data.users) {
              data.users.forEach((u: any) => {
                if (!u.phone) return;
                results.push({
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  phone: u.phone,
                  type: 'cruise-guide',
                  category: '크루즈가이드',
                });
              });
            }
          } catch (error) {
            console.error('Failed to load cruise guide users:', error);
          }
        }
      } else if (formData.sendMethod === 'email') {
        // 이메일: 크루즈몰 고객만 (이름, 이메일 주소만)
        if (recipientCategory === 'all' || recipientCategory === 'mall') {
          try {
            console.log('[Email Dropdown] Fetching mall users with emailOnly=true...');
            const response = await fetch(`/api/admin/mall-users?emailOnly=true`, {
              credentials: 'include',
            });
            console.log('[Email Dropdown] Response status:', response.status);
            const data = await response.json();
            console.log('[Email Dropdown] Response data:', { ok: data.ok, usersCount: data.users?.length, error: data.error });
            console.log('[Email Dropdown] Full response:', JSON.stringify(data, null, 2));
            if (data.ok && data.users) {
              console.log('[Email Dropdown] Processing users:', data.users.length);
              data.users.forEach((u: any) => {
                if (!u.email || u.email.trim() === '') {
                  console.log('[Email Dropdown] Skipping user without email:', u.id, u.name);
                  return;
                }
                results.push({
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  phone: null,
                  type: 'mall',
                  category: '크루즈몰',
                  mallUserId: u.mallUserId,
                });
              });
              console.log('[Email Dropdown] Final results count:', results.length);
            } else {
              console.error('[Email Dropdown] API error:', data.error || 'Unknown error');
            }
          } catch (error) {
            console.error('[Email Dropdown] Failed to load mall users:', error);
          }
        }
      } else if (formData.sendMethod === 'sms' || formData.sendMethod === 'kakao') {
        // SMS/카카오 알림톡: 크루즈가이드, 크루즈몰, 테스트, 잠재고객 모두 (이름, 전화번호)
        
        // 크루즈가이드
        if (recipientCategory === 'all' || recipientCategory === 'cruise-guide') {
          try {
            const response = await fetch(`/api/admin/cruise-guide-users?limit=1000`, {
              credentials: 'include',
            });
            const data = await response.json();
            if (data.ok && data.users) {
              data.users.forEach((u: any) => {
                if (!u.phone) return;
                results.push({
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  phone: u.phone,
                  type: 'cruise-guide',
                  category: '크루즈가이드',
                });
              });
            }
          } catch (error) {
            console.error('Failed to load cruise guide users:', error);
          }
        }

        // 테스트
        if (recipientCategory === 'all' || recipientCategory === 'test') {
          try {
            const response = await fetch(`/api/admin/test-users?limit=1000`, {
              credentials: 'include',
            });
            const data = await response.json();
            if (data.ok && data.users) {
              data.users.forEach((u: any) => {
                if (!u.phone) return;
                results.push({
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  phone: u.phone,
                  type: 'test',
                  category: '테스트',
                });
              });
            }
          } catch (error) {
            console.error('Failed to load test users:', error);
          }
        }

        // 크루즈몰 (전화번호가 있는 경우만)
        if (recipientCategory === 'all' || recipientCategory === 'mall') {
          try {
            const response = await fetch(`/api/admin/mall-users`, {
              credentials: 'include',
            });
            const data = await response.json();
            if (data.ok && data.users) {
              data.users.forEach((u: any) => {
                if (!u.phone) return;
                results.push({
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  phone: u.phone,
                  type: 'mall',
                  category: '크루즈몰',
                  mallUserId: u.mallUserId,
                });
              });
            }
          } catch (error) {
            console.error('Failed to load mall users:', error);
          }
        }

        // 잠재고객 (전화번호가 있는 경우만)
        if (recipientCategory === 'all' || recipientCategory === 'prospect') {
          try {
            const response = await fetch(`/api/admin/prospects?activeOnly=true`, {
              credentials: 'include',
            });
            const data = await response.json();
            if (data.ok && data.prospects) {
              data.prospects.forEach((p: any) => {
                if (!p.phone) return;
                results.push({
                  id: p.id,
                  name: p.name,
                  email: p.email || null,
                  phone: p.phone,
                  type: 'prospect',
                  category: '잠재고객',
                });
              });
            }
          } catch (error) {
            console.error('Failed to load prospects:', error);
          }
        }
      }

      setDropdownRecipients(results);
      updateSelectAllState(results);
    } catch (error) {
      console.error('Failed to load dropdown recipients:', error);
    } finally {
      setIsLoadingDropdown(false);
    }
  };

  // 전체 선택 상태 업데이트
  const updateSelectAllState = (recipients: Array<{
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    type: 'cruise-guide' | 'mall' | 'test' | 'prospect';
    category?: string;
    mallUserId?: string | null;
  }>) => {
    if (recipients.length === 0) {
      setSelectAllChecked(false);
      return;
    }
    const allSelected = recipients.every((r) =>
      selectedRecipients.find((sr) => sr.id === r.id && sr.type === r.type)
    );
    setSelectAllChecked(allSelected);
  };

  // 드롭다운 열기
  const handleOpenDropdown = () => {
    setShowDropdown(true);
    loadDropdownRecipients();
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectAllChecked) {
      // 전체 해제: 현재 카테고리의 수신자만 제거
      const currentCategoryTypes = dropdownRecipients.map(r => r.type) as Array<'cruise-guide' | 'mall' | 'test' | 'prospect'>;
      setSelectedRecipients(selectedRecipients.filter(
        sr => sr.type === 'direct' || !currentCategoryTypes.includes(sr.type as 'cruise-guide' | 'mall' | 'test' | 'prospect')
      ));
      setSelectAllChecked(false);
    } else {
      // 전체 선택: 현재 카테고리의 모든 수신자 추가
      const newRecipients = dropdownRecipients.filter(
        (r) => !selectedRecipients.find((sr) => sr.id === r.id && sr.type === r.type)
      );
      setSelectedRecipients([...selectedRecipients, ...newRecipients]);
      setSelectAllChecked(true);
    }
  };

  // 선택된 수신자 변경 시 전체 선택 상태 업데이트
  useEffect(() => {
    if (dropdownRecipients.length > 0 && showDropdown) {
      updateSelectAllState(dropdownRecipients);
    }
  }, [selectedRecipients, dropdownRecipients, showDropdown]);

  // 드롭다운에서 개별 선택/해제
  const handleDropdownSelect = (recipient: {
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    type: 'cruise-guide' | 'mall' | 'test' | 'prospect';
    category?: string;
    mallUserId?: string | null;
  }) => {
    handleSelectRecipient(recipient);
  };

  // 발송 방식 변경 시 카테고리 자동 설정
  useEffect(() => {
    if (formData.sendMethod === 'cruise-guide') {
      setRecipientCategory('cruise-guide');
    } else if (formData.sendMethod === 'email') {
      setRecipientCategory('mall');
    } else if (formData.sendMethod === 'sms' || formData.sendMethod === 'kakao') {
      setRecipientCategory('all');
    }
    setSelectedRecipients([]);
    setUnifiedSearchTerm('');
    setUnifiedSearchResults([]);
    setShowDropdown(false);
    setDropdownRecipients([]);
  }, [formData.sendMethod]);

  // 카테고리 변경 시 드롭다운 닫기
  useEffect(() => {
    setShowDropdown(false);
    setDropdownRecipients([]);
  }, [recipientCategory]);

  // 외부 클릭 시 검색 결과 및 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // unifiedSearchRef 외부 클릭 시 검색 결과 닫기
      if (unifiedSearchRef.current && !unifiedSearchRef.current.contains(target)) {
        setUnifiedSearchResults([]);
        // 드롭다운도 함께 닫기 (드롭다운은 unifiedSearchRef 안에 있으므로 자동으로 처리됨)
        if (showDropdown) {
          setShowDropdown(false);
        }
      }
      if (customerSearchRef.current && !customerSearchRef.current.contains(target)) {
        setCustomerSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // 직접 입력 이메일 처리 (쉼표로 구분)
  const handleDirectEmailChange = (value: string) => {
    setDirectEmailInput(value);
  };

  // 쉼표로 구분된 이메일을 배열로 변환
  const getDirectEmailsArray = (): string[] => {
    if (!directEmailInput.trim()) return [];
    return directEmailInput
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0 && email.includes('@'));
  };

  // 이메일에서 특정 이메일 제거
  const handleRemoveDirectEmail = (emailToRemove: string) => {
    const emails = getDirectEmailsArray();
    const filtered = emails.filter(e => e !== emailToRemove);
    setDirectEmailInput(filtered.join(', '));
  };

  const handleAddDirectPhone = () => {
    setDirectPhones([...directPhones, '']);
  };

  const handleRemoveDirectPhone = (index: number) => {
    if (directPhones.length > 1) {
      setDirectPhones(directPhones.filter((_, i) => i !== index));
    }
  };

  // 이메일 가져오기 관련 함수들
  const loadSavedEmails = async () => {
    try {
      setIsLoadingSavedEmails(true);
      const response = await fetch('/api/admin/email-address-book?limit=1000', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.ok) {
        setSavedEmailList(data.items || []);
      }
    } catch (error) {
      console.error('Failed to load saved emails:', error);
    } finally {
      setIsLoadingSavedEmails(false);
    }
  };

  useEffect(() => {
    if (showEmailImportModal && emailImportTab === 'saved') {
      loadSavedEmails();
    }
  }, [showEmailImportModal, emailImportTab]);

  const handleDownloadSample = async () => {
    try {
      const response = await fetch('/api/admin/email-address-book/download?sample=true', {
        credentials: 'include',
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '이메일_주소록_샘플.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download sample:', error);
      alert('샘플 파일 다운로드 중 오류가 발생했습니다.');
    }
  };

  const handleUploadExcel = async () => {
    if (!excelFile) {
      alert('파일을 선택해주세요.');
      return;
    }

    try {
      setIsUploadingExcel(true);
      const formData = new FormData();
      formData.append('file', excelFile);

      const response = await fetch('/api/admin/email-address-book/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();
      if (data.ok) {
        alert(`업로드 완료: 성공 ${data.results.success}개, 실패 ${data.results.failed}개`);
        if (data.results.failed > 0 && data.results.errors.length > 0) {
          console.error('Upload errors:', data.results.errors);
        }
        setExcelFile(null);
        loadSavedEmails();
        setEmailImportTab('saved');
      } else {
        alert(data.error || '엑셀 파일 업로드 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Failed to upload excel:', error);
      alert('엑셀 파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploadingExcel(false);
    }
  };

  const handleSaveManualEmail = async () => {
    if (!manualEmailEntry.email) {
      alert('이메일 주소를 입력해주세요.');
      return;
    }

    try {
      setIsSavingManual(true);
      const response = await fetch('/api/admin/email-address-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(manualEmailEntry),
      });

      const data = await response.json();
      if (data.ok) {
        alert('이메일 주소록에 저장되었습니다.');
        setManualEmailEntry({ name: '', email: '', phone: '', memo: '' });
        loadSavedEmails();
        setEmailImportTab('saved');
      } else {
        alert(data.error || '저장 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Failed to save manual email:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingManual(false);
    }
  };

  const handleApplySelectedEmails = () => {
    const emailsToAdd = savedEmailList
      .filter(item => selectedSavedEmails.has(item.id))
      .map(item => item.email);
    
    if (emailsToAdd.length === 0) {
      alert('선택한 이메일이 없습니다.');
      return;
    }

    // 기존 이메일과 중복 제거
    const existingEmails = new Set(getDirectEmailsArray());
    const newEmails = emailsToAdd.filter(e => !existingEmails.has(e));
    
    const currentEmails = getDirectEmailsArray();
    const combinedEmails = [...currentEmails, ...newEmails];
    setDirectEmailInput(combinedEmails.join(', '));
    setSelectedSavedEmails(new Set());
    setShowEmailImportModal(false);
  };

  const handleSelectSavedEmail = (id: number) => {
    const newSet = new Set(selectedSavedEmails);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedSavedEmails(newSet);
  };

  const handleSelectAllSavedEmails = () => {
    if (selectedSavedEmails.size === savedEmailList.length) {
      setSelectedSavedEmails(new Set());
    } else {
      setSelectedSavedEmails(new Set(savedEmailList.map(item => item.id)));
    }
  };

  // 개인화 변수 삽입
  const insertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea[placeholder*="메시지 내용"]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.content;
      const newText = text.substring(0, start) + variable + text.substring(end);
      setFormData({ ...formData, content: newText });
      // 커서 위치 조정
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  // 메시지 발송
  const handleSend = async () => {
    if (!formData.title || !formData.content) {
      alert('제목과 내용을 입력해 주세요.');
      return;
    }

    // 수신자 검증
    const hasSelectedRecipients = selectedRecipients.length > 0;
    const directEmailsArray = getDirectEmailsArray();
    const hasDirectEmails = directInputEnabled && directEmailsArray.length > 0;
    const hasDirectPhones = directInputEnabled && directPhones.some(p => p.trim());
    
    if (!hasSelectedRecipients && !hasDirectEmails && !hasDirectPhones) {
      alert('수신자를 선택하거나 직접 입력해주세요.');
      return;
    }

    try {
      // 이메일 발송인 경우 별도 API 호출
      if (formData.sendMethod === 'email') {
        const requestBody: any = {
          title: formData.title,
          content: formData.content,
          imageUrl: formData.imageUrl || undefined,
        };

        // 선택된 수신자에서 크루즈가이드 사용자만 userIds로 전달
        const cruiseGuideUserIds = selectedRecipients
          .filter(r => r.type === 'cruise-guide')
          .map(r => r.id);
        if (cruiseGuideUserIds.length > 0) {
          requestBody.userIds = cruiseGuideUserIds;
        }

        // 선택된 크루즈몰 고객의 userIds 전달
        const mallUserIds = selectedRecipients
          .filter(r => r.type === 'mall')
          .map(r => r.id);
        if (mallUserIds.length > 0) {
          requestBody.mallUserIds = mallUserIds;
        }

        // 크루즈몰 사용자 포함 여부 (직접 입력 이메일이 있는 경우)
        const includeMallUsers = directInputEnabled && directEmailsArray.length > 0;
        requestBody.includeMallUsers = includeMallUsers;

        // 잠재고객 포함 여부
        const includeProspects = selectedRecipients.some(r => r.type === 'prospect');
        requestBody.includeProspects = includeProspects;

        // 직접 입력된 이메일
        if (directInputEnabled && directEmailsArray.length > 0) {
          requestBody.directEmails = directEmailsArray;
        }

        const response = await fetch('/api/admin/messages/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        if (data.ok) {
          const message = `이메일이 ${data.successCount}명에게 발송되었습니다.`;
          const failMessage = data.failCount > 0 ? ` (실패: ${data.failCount}명)` : '';
          alert(message + failMessage);
          setShowModal(false);
          resetForm();
          loadMessages();
        } else {
          alert('이메일 발송 실패: ' + (data.error || 'Unknown error'));
        }
        return;
      }

      // 카카오 알림톡 발송인 경우 별도 API 호출
      if (formData.sendMethod === 'kakao') {
        const requestBody: any = {
          title: formData.title,
          content: formData.content,
        };

        // 선택된 수신자에서 크루즈가이드 사용자만 userIds로 전달
        const cruiseGuideUserIds = selectedRecipients
          .filter(r => r.type === 'cruise-guide')
          .map(r => r.id);
        if (cruiseGuideUserIds.length > 0) {
          requestBody.userIds = cruiseGuideUserIds;
        }

        // 선택된 크루즈몰 고객의 userIds 전달
        const mallUserIds = selectedRecipients
          .filter(r => r.type === 'mall')
          .map(r => r.id);
        if (mallUserIds.length > 0) {
          requestBody.mallUserIds = mallUserIds;
        }

        // 테스트 사용자
        const testUserIds = selectedRecipients
          .filter(r => r.type === 'test')
          .map(r => r.id);
        if (testUserIds.length > 0) {
          requestBody.userIds = [...(requestBody.userIds || []), ...testUserIds];
        }

        // 잠재고객 (전화번호가 있는 경우)
        const prospectUserIds = selectedRecipients
          .filter(r => r.type === 'prospect' && r.phone)
          .map(r => r.id);
        if (prospectUserIds.length > 0) {
          requestBody.userIds = [...(requestBody.userIds || []), ...prospectUserIds];
        }

        // 직접 입력된 전화번호
        if (directInputEnabled && directPhones.some(p => p.trim())) {
          requestBody.directPhones = directPhones.filter(p => p.trim());
        }

        const response = await fetch('/api/admin/messages/send-kakao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        if (data.ok) {
          const message = `카카오 알림톡 발송이 완료되었습니다. (성공: ${data.successCount || 0}명${data.failCount > 0 ? `, 실패: ${data.failCount}명` : ''})`;
          const failMessage = data.errors && data.errors.length > 0 
            ? `\n\n실패한 발송:\n${data.errors.slice(0, 5).join('\n')}${data.errors.length > 5 ? `\n... 외 ${data.errors.length - 5}건` : ''}`
            : '';
          alert(message + failMessage);
          setShowModal(false);
          resetForm();
          loadMessages();
        } else {
          alert('카카오 알림톡 발송 실패: ' + (data.error || 'Unknown error'));
        }
        return;
      }

      // SMS 발송인 경우 별도 API 호출
      if (formData.sendMethod === 'sms') {
        const requestBody: any = {
          title: formData.title,
          content: formData.content,
        };

        // 선택된 수신자에서 크루즈가이드 사용자만 userIds로 전달
        const cruiseGuideUserIds = selectedRecipients
          .filter(r => r.type === 'cruise-guide')
          .map(r => r.id);
        if (cruiseGuideUserIds.length > 0) {
          requestBody.userIds = cruiseGuideUserIds;
        }

        // 선택된 크루즈몰 고객의 userIds 전달
        const mallUserIds = selectedRecipients
          .filter(r => r.type === 'mall')
          .map(r => r.id);
        if (mallUserIds.length > 0) {
          requestBody.mallUserIds = mallUserIds;
        }

        // 테스트 사용자
        const testUserIds = selectedRecipients
          .filter(r => r.type === 'test')
          .map(r => r.id);
        if (testUserIds.length > 0) {
          requestBody.userIds = [...(requestBody.userIds || []), ...testUserIds];
        }

        // 잠재고객 (전화번호가 있는 경우)
        const prospectUserIds = selectedRecipients
          .filter(r => r.type === 'prospect' && r.phone)
          .map(r => r.id);
        if (prospectUserIds.length > 0) {
          requestBody.userIds = [...(requestBody.userIds || []), ...prospectUserIds];
        }

        // 직접 입력된 전화번호
        if (directInputEnabled && directPhones.some(p => p.trim())) {
          requestBody.directPhones = directPhones.filter(p => p.trim());
        }

        const response = await fetch('/api/admin/messages/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        if (data.ok) {
          const message = `SMS가 ${data.successCount || data.totalSent || 0}명에게 발송되었습니다.`;
          const failMessage = data.failCount > 0 ? ` (실패: ${data.failCount}명)` : '';
          alert(message + failMessage);
          setShowModal(false);
          resetForm();
          loadMessages();
        } else {
          alert('SMS 발송 실패: ' + (data.error || 'Unknown error'));
        }
        return;
      }

      // 크루즈가이드 메시지인 경우 기존 API 사용
      const requestBody: any = {
        title: formData.title,
        content: formData.content,
        messageType: formData.messageType,
        isUrgent: formData.isUrgent,
        sendMethod: formData.sendMethod,
      };

      // 선택된 수신자에서 크루즈가이드 사용자만 userIds로 전달
      const cruiseGuideUserIds = selectedRecipients
        .filter(r => r.type === 'cruise-guide')
        .map(r => r.id);
      if (cruiseGuideUserIds.length > 0) {
        requestBody.userIds = cruiseGuideUserIds;
      }

      const response = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (data.ok) {
        alert(`메시지가 ${data.totalSent || 1}명에게 발송되었습니다.`);
        setShowModal(false);
        resetForm();
        loadMessages();
      } else {
        alert('메시지 발송 실패: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('메시지 발송 중 오류가 발생했습니다.');
    }
  };

  // 이미지 업로드 핸들러
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB 제한
        alert('이미지 크기는 5MB 이하여야 합니다.');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage) return;

    try {
      setIsUploadingImage(true);
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedImage);

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        credentials: 'include',
        body: uploadFormData,
      });

      const data = await response.json();
      if (data.ok && data.url) {
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
        alert('이미지가 업로드되었습니다.');
      } else {
        alert(data.error || '이미지 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  // 폼 초기화
  const resetForm = () => {
    setFormData({ 
      title: '', 
      content: '', 
      messageType: 'info', 
      isUrgent: false, 
      sendMethod: 'cruise-guide', 
      includeMallUsers: false, 
      includeProspects: false,
      imageUrl: '',
    });
    setSelectedRecipients([]);
    setSelectedCustomers([]);
    setRecipientType('all');
    setRecipientCategory('all');
    setUnifiedSearchTerm('');
    setUnifiedSearchResults([]);
    setCustomerSearchTerm('');
    setCustomerSearchResults([]);
    setDirectInputEnabled(false);
    setDirectEmailInput('');
    setDirectPhones(['']);
    setShowVariableButtons(false);
    setSelectedImage(null);
    setImagePreview('');
  };

  // 메시지 삭제
  const handleDelete = async (message: Message) => {
    const messageCount = message.messageIds?.length || 1;
    const confirmMessage = messageCount > 1 
      ? `정말 이 메시지를 삭제하시겠습니까? (${messageCount}명에게 발송된 메시지가 모두 삭제됩니다.)`
      : '정말 이 메시지를 삭제하시겠습니까?';
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      // 그룹화된 메시지인 경우 모든 메시지 ID를 삭제
      const messageIds = message.messageIds || [message.id];
      
      // 순차적으로 삭제 (동시 삭제로 인한 인증 문제 방지)
      const results = [];
      for (const id of messageIds) {
        try {
          const response = await fetch(`/api/admin/messages?id=${id}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          const data = await response.json();
          results.push({ id, ok: data.ok, error: data.error });
          
          // 각 삭제 사이에 짧은 지연 (인증 문제 방지)
          if (messageIds.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error(`Failed to delete message ${id}:`, error);
          results.push({ id, ok: false, error: 'Network error' });
        }
      }
      
      const successCount = results.filter(r => r.ok).length;
      const failCount = results.length - successCount;

      if (successCount === results.length) {
        alert(`메시지가 삭제되었습니다. (${successCount}개)`);
        loadMessages();
      } else if (successCount > 0) {
        alert(`일부 메시지만 삭제되었습니다. (성공: ${successCount}개, 실패: ${failCount}개)`);
        loadMessages();
      } else {
        alert(`메시지 삭제 실패: ${results[0]?.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert('메시지 삭제 중 오류가 발생했습니다.');
    }
  };

  // 메시지 비활성화/활성화
  const handleToggleActive = async (message: Message) => {
    try {
      // 그룹화된 메시지인 경우 모든 메시지 ID를 업데이트
      const messageIds = message.messageIds || [message.id];
      const newIsActive = !message.isActive;
      
      // 모든 메시지 업데이트
      const updatePromises = messageIds.map(id =>
        fetch('/api/admin/messages', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id,
            title: message.title,
            content: message.content,
            messageType: message.messageType,
            isActive: newIsActive,
          }),
        }).then(res => res.json())
      );

      const results = await Promise.all(updatePromises);
      const allOk = results.every(result => result.ok);

      if (allOk) {
        loadMessages();
      } else {
        alert('메시지 상태 변경 실패: 일부 메시지를 업데이트하지 못했습니다.');
      }
    } catch (error) {
      console.error('Failed to toggle message:', error);
      alert('메시지 상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 필터링된 메시지 목록
  const filteredMessages = messages.filter((msg) => {
    if (searchQuery) {
      return (
        msg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2 flex items-center gap-3">
            <span className="text-5xl">💬</span>
            고객 메시지 관리
          </h1>
          <p className="text-lg text-gray-600 font-medium">
            크루즈 가이드 사용 고객에게 다양한 방식으로 메시지를 발송하고 관리하세요
          </p>
        </div>
        <button
          onClick={() => {
            setEditingMessage(null);
            setFormData({ title: '', content: '', messageType: 'info', isUrgent: false, sendMethod: 'cruise-guide', includeMallUsers: false, includeProspects: false, imageUrl: '' });
            setSelectedCustomers([]);
            setRecipientType('all');
            setCustomerSearchTerm('');
            setSelectedImage(null);
            setImagePreview('');
            setShowModal(true);
          }}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
        >
          <FiPlus size={20} />
          새 메시지 작성
        </button>
      </div>

      {/* 검색 */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <input
          type="text"
          placeholder="메시지 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium"
        />
      </div>

      {/* 메시지 목록 */}
      {isLoading ? (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-lg font-medium text-gray-700">로딩 중...</p>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-16 text-center">
          <span className="text-6xl mb-4 block">📭</span>
          <p className="text-xl font-bold text-gray-700">발송된 메시지가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((message) => (
            <div
              key={message.id}
              className={`bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 p-6 hover:shadow-xl transition-all ${
                !message.isActive ? 'opacity-60 border-gray-200' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{message.title}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        message.messageType === 'info'
                          ? 'bg-blue-100 text-blue-700'
                          : message.messageType === 'warning'
                          ? 'bg-yellow-100 text-yellow-700'
                          : message.messageType === 'promotion'
                          ? 'bg-green-100 text-green-700'
                          : message.messageType === 'announcement'
                          ? 'bg-red-100 text-red-700'
                          : message.messageType === 'email'
                          ? 'bg-purple-100 text-purple-700'
                          : message.messageType === 'kakao'
                          ? 'bg-yellow-100 text-yellow-800'
                          : message.messageType === 'sms'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {message.messageType === 'info'
                        ? '정보'
                        : message.messageType === 'warning'
                        ? '경고'
                        : message.messageType === 'promotion'
                        ? '프로모션'
                        : message.messageType === 'announcement'
                        ? '크루즈가이드 메시지'
                        : message.messageType === 'email'
                        ? '이메일'
                        : message.messageType === 'sms'
                        ? 'SMS'
                        : '기타'}
                    </span>
                    {message.recipients && message.recipients.length > 0 ? (
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        <FiUsers size={16} />
                        {message.recipients.length === 1 ? (
                          <>
                            {message.recipients[0].name || '고객'} ({message.recipients[0].phone})
                          </>
                        ) : (
                          <>
                            {message.recipients[0].name || '고객'} 외 {message.recipients.length - 1}명
                          </>
                        )}
                      </span>
                    ) : message.userId ? (
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        <FiUser size={16} />
                        {message.user?.name || '고객'} ({message.user?.phone})
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        <FiUsers size={16} />
                        전체 고객
                      </span>
                    )}
                    {!message.isActive && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                        비활성화됨
                      </span>
                    )}
                  </div>
                  <div
                    className="text-gray-700 mb-4"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.content) }}
                  />
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>발송: {new Date(message.createdAt).toLocaleString('ko-KR')}</span>
                    <span>확인: {message.totalRead ?? message.readCount ?? 0} / {message.totalSent}</span>
                  </div>
                  {message.recipients && message.recipients.length > 1 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>수신자 목록:</strong>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {message.recipients.map((recipient) => (
                          <span
                            key={recipient.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                          >
                            <FiUser size={12} />
                            {recipient.name || '고객'} ({recipient.phone})
                            {recipient.readCount > 0 && (
                              <span className="text-green-600">✓</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <button
                    onClick={() => handleToggleActive(message)}
                    className={`px-5 py-2.5 rounded-xl font-bold shadow-md hover:scale-105 transition-all ${
                      message.isActive
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                    }`}
                  >
                    {message.isActive ? '비활성화' : '활성화'}
                  </button>
                  <button
                    onClick={() => handleDelete(message)}
                    className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-bold shadow-md hover:scale-105 transition-all flex items-center gap-2"
                  >
                    <FiTrash2 size={16} />
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 메시지 작성 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto border-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                <span className="text-4xl">✉️</span>
                메시지 작성
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold hover:scale-110 transition-transform"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* 발송 방식 선택 */}
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-3">
                  발송 방식 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.sendMethod === 'cruise-guide'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <input
                      type="radio"
                      name="sendMethod"
                      value="cruise-guide"
                      checked={formData.sendMethod === 'cruise-guide'}
                      onChange={(e) => {
                        setFormData({ ...formData, sendMethod: e.target.value as any });
                      }}
                      className="w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">📱 크루즈가이드 메시지</div>
                      <div className="text-sm text-gray-600">앱 내 팝업 및 푸시 알림</div>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.sendMethod === 'email'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <input
                      type="radio"
                      name="sendMethod"
                      value="email"
                      checked={formData.sendMethod === 'email'}
                      onChange={(e) => {
                        setFormData({ ...formData, sendMethod: e.target.value as any });
                      }}
                      className="w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">📧 이메일 보내기</div>
                      <div className="text-sm text-gray-600">고객 이메일로 발송</div>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.sendMethod === 'sms'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <input
                      type="radio"
                      name="sendMethod"
                      value="sms"
                      checked={formData.sendMethod === 'sms'}
                      onChange={(e) => {
                        setFormData({ ...formData, sendMethod: e.target.value as any });
                      }}
                      className="w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">📱 SMS 보내기</div>
                      <div className="text-sm text-gray-600">문자 메시지로 발송</div>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.sendMethod === 'kakao'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <input
                      type="radio"
                      name="sendMethod"
                      value="kakao"
                      checked={formData.sendMethod === 'kakao'}
                      onChange={(e) => {
                        setFormData({ ...formData, sendMethod: e.target.value as any });
                      }}
                      className="w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">💬 카카오 알림톡</div>
                      <div className="text-sm text-gray-600">카카오톡 알림톡으로 발송</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* 긴급공지 체크박스 (크루즈가이드 메시지일 때만 표시) */}
              {formData.sendMethod === 'cruise-guide' && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="isUrgent"
                    checked={formData.isUrgent}
                    onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked, messageType: e.target.checked ? 'announcement' : 'info' })}
                    className="w-5 h-5 text-red-600"
                  />
                  <label htmlFor="isUrgent" className="flex items-center gap-2 text-red-800 font-bold cursor-pointer">
                    <FiAlertCircle size={20} />
                    긴급공지로 발송 (스마트폰 알림 및 팝업 표시)
                  </label>
                </div>
              )}

              {/* 수신자 선택 - 통합 검색 방식 */}
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-3">
                  수신자 선택 <span className="text-red-500">*</span>
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    {formData.sendMethod === 'cruise-guide' && '(크루즈가이드 고객만)'}
                    {formData.sendMethod === 'email' && '(크루즈몰 고객만)'}
                    {formData.sendMethod === 'sms' && '(크루즈가이드, 크루즈몰, 테스트, 잠재고객 모두)'}
                    {formData.sendMethod === 'kakao' && '(크루즈가이드, 크루즈몰, 테스트, 잠재고객 모두)'}
                  </span>
                </label>
                
                {/* 카테고리 탭 - 발송 방식에 따라 자동 필터링 */}
                <div className="flex gap-2 mb-4 border-b-2 border-gray-200 flex-wrap">
                  {/* 크루즈가이드 메시지: 크루즈가이드만 */}
                  {formData.sendMethod === 'cruise-guide' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setRecipientCategory('cruise-guide');
                          setUnifiedSearchTerm('');
                          setUnifiedSearchResults([]);
                        }}
                        className={`px-4 py-2 font-semibold transition-colors whitespace-nowrap ${
                          recipientCategory === 'cruise-guide'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        크루즈가이드
                      </button>
                    </>
                  )}
                  
                  {/* 이메일: 크루즈몰만 */}
                  {formData.sendMethod === 'email' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setRecipientCategory('mall');
                          setUnifiedSearchTerm('');
                          setUnifiedSearchResults([]);
                        }}
                        className={`px-4 py-2 font-semibold transition-colors whitespace-nowrap ${
                          recipientCategory === 'mall'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        크루즈몰
                      </button>
                    </>
                  )}
                  
                  {/* 카카오톡/SMS: 크루즈가이드, 크루즈몰, 테스트, 잠재고객 모두 */}
                  {(formData.sendMethod === 'sms' || formData.sendMethod === 'kakao') && (
                    <>
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientCategory('all');
                      setUnifiedSearchTerm('');
                      // 검색 결과는 초기화하지 않고 useEffect가 자동으로 로드하도록 함
                    }}
                    className={`px-4 py-2 font-semibold transition-colors whitespace-nowrap ${
                      recipientCategory === 'all'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    전체
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientCategory('cruise-guide');
                      setUnifiedSearchTerm('');
                    }}
                    className={`px-4 py-2 font-semibold transition-colors whitespace-nowrap ${
                      recipientCategory === 'cruise-guide'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    크루즈가이드
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientCategory('mall');
                      setUnifiedSearchTerm('');
                    }}
                    className={`px-4 py-2 font-semibold transition-colors whitespace-nowrap ${
                      recipientCategory === 'mall'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    크루즈몰
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientCategory('test');
                      setUnifiedSearchTerm('');
                    }}
                    className={`px-4 py-2 font-semibold transition-colors whitespace-nowrap ${
                      recipientCategory === 'test'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    테스트
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientCategory('prospect');
                      setUnifiedSearchTerm('');
                    }}
                    className={`px-4 py-2 font-semibold transition-colors whitespace-nowrap ${
                      recipientCategory === 'prospect'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    잠재고객
                  </button>
                    </>
                  )}
                </div>

                {/* 통합 검색 및 드롭다운 */}
                <div className="relative mb-4" ref={unifiedSearchRef}>
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        value={unifiedSearchTerm}
                        onChange={(e) => setUnifiedSearchTerm(e.target.value)}
                        placeholder={
                          formData.sendMethod === 'email' 
                            ? '이름, 이메일 주소로 검색...' 
                            : formData.sendMethod === 'kakao'
                            ? '이름, 전화번호로 검색... (카카오 알림톡)'
                            : '이름, 전화번호로 검색...'
                        }
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                      />
                      {unifiedSearchTerm && (
                        <button
                          type="button"
                          onClick={() => {
                            setUnifiedSearchTerm('');
                            setUnifiedSearchResults([]);
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700"
                        >
                          <FiX size={20} />
                        </button>
                      )}
                    </div>
                    {/* 드롭다운 버튼 */}
                    <button
                      type="button"
                      onClick={() => {
                        if (showDropdown) {
                          setShowDropdown(false);
                        } else {
                          handleOpenDropdown();
                        }
                      }}
                      className={`px-4 py-3 border-2 rounded-lg transition-colors flex items-center gap-2 font-semibold ${
                        showDropdown
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700'
                      }`}
                    >
                      <span>▼</span>
                      <span className="hidden sm:inline">목록</span>
                    </button>
                  </div>

                  {/* 검색 결과 드롭다운 - 그룹별 섹션 */}
                  {unifiedSearchResults.length > 0 && (() => {
                    // 그룹별로 분류
                    const groupedResults = {
                      'cruise-guide': unifiedSearchResults.filter(r => r.type === 'cruise-guide'),
                      'test': unifiedSearchResults.filter(r => r.type === 'test'),
                      'mall': unifiedSearchResults.filter(r => r.type === 'mall'),
                      'prospect': unifiedSearchResults.filter(r => r.type === 'prospect'),
                    };
                    
                    const groupLabels = {
                      'cruise-guide': '크루즈가이드',
                      'test': '테스트',
                      'mall': '크루즈몰',
                      'prospect': '잠재고객',
                    };
                    
                    const groupColors = {
                      'cruise-guide': 'bg-blue-600',
                      'test': 'bg-green-600',
                      'mall': 'bg-purple-600',
                      'prospect': 'bg-yellow-600',
                    };
                    
                    // 전체 선택 상태 확인
                    const allSelected = unifiedSearchResults.every((r) =>
                      selectedRecipients.find((sr) => sr.id === r.id && sr.type === r.type)
                    );
                    
                    // 전체 선택/해제 핸들러
                    const handleSelectAllResults = () => {
                      if (allSelected) {
                        // 전체 해제: 현재 검색 결과의 수신자만 제거
                        const resultIds = new Set(
                          unifiedSearchResults.map(r => `${r.type}-${r.id}`)
                        );
                        setSelectedRecipients(selectedRecipients.filter(
                          sr => !resultIds.has(`${sr.type}-${sr.id}`) || sr.type === 'direct'
                        ));
                      } else {
                        // 전체 선택: 현재 검색 결과의 모든 수신자 추가
                        const newRecipients = unifiedSearchResults.filter(
                          (r) => !selectedRecipients.find((sr) => sr.id === r.id && sr.type === r.type)
                        );
                        setSelectedRecipients([...selectedRecipients, ...newRecipients]);
                      }
                    };
                    
                    return (
                      <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-96 overflow-y-auto">
                        {/* 전체 선택 */}
                        <div className="sticky top-0 bg-gray-50 border-b-2 border-gray-300 p-3 z-10">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              onChange={handleSelectAllResults}
                              className="w-5 h-5 text-blue-600"
                            />
                            <span className="font-bold text-gray-900">
                              전체 선택 ({unifiedSearchResults.length}명)
                            </span>
                          </label>
                        </div>
                        {/* 그룹별 목록 */}
                        {(['cruise-guide', 'test', 'mall', 'prospect'] as const).map((groupType) => {
                          const groupItems = groupedResults[groupType];
                          if (groupItems.length === 0) return null;
                          
                          // 그룹별 전체 선택 상태 확인
                          const groupAllSelected = groupItems.every((r) =>
                            selectedRecipients.find((sr) => sr.id === r.id && sr.type === r.type)
                          );
                          
                          // 그룹별 전체 선택/해제 핸들러
                          const handleSelectGroupAll = (e: React.MouseEvent) => {
                            e.stopPropagation();
                            if (groupAllSelected) {
                              // 그룹 전체 해제
                              const groupIds = new Set(
                                groupItems.map(r => `${r.type}-${r.id}`)
                              );
                              setSelectedRecipients(selectedRecipients.filter(
                                sr => !groupIds.has(`${sr.type}-${sr.id}`) || sr.type === 'direct'
                              ));
                            } else {
                              // 그룹 전체 선택
                              const newRecipients = groupItems.filter(
                                (r) => !selectedRecipients.find((sr) => sr.id === r.id && sr.type === r.type)
                              );
                              setSelectedRecipients([...selectedRecipients, ...newRecipients]);
                            }
                          };
                          
                          return (
                            <div key={groupType} className="border-b border-gray-200 last:border-b-0">
                              {/* 그룹 헤더 - 체크박스 포함 */}
                              <div className={`sticky top-12 ${groupColors[groupType]} text-white px-4 py-2 font-bold text-sm z-10 flex items-center justify-between`}>
                                <span>{groupLabels[groupType]} ({groupItems.length}명)</span>
                                {groupType === 'test' && (
                                  <label className="flex items-center gap-2 cursor-pointer ml-auto" onClick={handleSelectGroupAll}>
                                    <input
                                      type="checkbox"
                                      checked={groupAllSelected}
                                      onChange={() => {}}
                                      onClick={handleSelectGroupAll}
                                      className="w-4 h-4"
                                    />
                                    <span className="text-xs">전체 선택</span>
                                  </label>
                                )}
                              </div>
                              {/* 그룹 아이템 */}
                              {groupItems.map((result, idx) => {
                                const isSelected = selectedRecipients.find(
                                  r => r.id === result.id && r.type === result.type
                                );
                                return (
                                  <div
                                    key={`${result.type}-${result.id}-${idx}`}
                                    onClick={() => handleSelectRecipient(result)}
                                    className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                                      isSelected ? 'bg-blue-100' : ''
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-gray-900">
                                            {result.name || '이름 없음'}
                                          </span>
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">
                                          {formData.sendMethod === 'email' ? (
                                            // 이메일 발송: 이메일 주소만 표시
                                            result.email && <span className="font-medium">✉️ {result.email}</span>
                                          ) : (
                                            // 카카오톡/SMS/크루즈가이드: 전화번호만 표시
                                            result.phone && <span className="font-medium">📞 {result.phone}</span>
                                          )}
                                        </div>
                                      </div>
                                      {isSelected && (
                                        <FiCheckCircle className="text-blue-600 flex-shrink-0" size={20} />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                  {isSearchingUnified && (
                    <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                        <span className="ml-2 text-gray-600">검색 중...</span>
                      </div>
                    </div>
                  )}

                  {/* 드롭다운 목록 */}
                  {showDropdown && (
                    <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-96 overflow-y-auto" ref={dropdownRef}>
                      {/* 전체 선택 */}
                      <div className="sticky top-0 bg-gray-50 border-b-2 border-gray-300 p-3 z-10">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectAllChecked}
                            onChange={handleSelectAll}
                            className="w-5 h-5 text-blue-600"
                          />
                          <span className="font-bold text-gray-900">
                            전체 선택 ({dropdownRecipients.length}명)
                          </span>
                        </label>
                      </div>
                      {/* 목록 */}
                      {isLoadingDropdown ? (
                        <div className="p-8 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
                          <p className="mt-2 text-gray-600">로딩 중...</p>
                        </div>
                      ) : dropdownRecipients.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          수신자가 없습니다.
                        </div>
                      ) : (() => {
                        // 그룹별로 분류
                        const groupedRecipients = {
                          'cruise-guide': dropdownRecipients.filter(r => r.type === 'cruise-guide'),
                          'test': dropdownRecipients.filter(r => r.type === 'test'),
                          'mall': dropdownRecipients.filter(r => r.type === 'mall'),
                          'prospect': dropdownRecipients.filter(r => r.type === 'prospect'),
                        };
                        
                        const groupLabels = {
                          'cruise-guide': '크루즈가이드',
                          'test': '테스트',
                          'mall': '크루즈몰',
                          'prospect': '잠재고객',
                        };
                        
                        const groupColors = {
                          'cruise-guide': 'bg-blue-600',
                          'test': 'bg-green-600',
                          'mall': 'bg-purple-600',
                          'prospect': 'bg-yellow-600',
                        };
                        
                        return (
                          <div className="divide-y divide-gray-200">
                            {(['cruise-guide', 'test', 'mall', 'prospect'] as const).map((groupType) => {
                              const groupItems = groupedRecipients[groupType];
                              if (groupItems.length === 0) return null;
                              
                              // 그룹별 전체 선택 상태 확인
                              const groupAllSelected = groupItems.every((r) =>
                                selectedRecipients.find((sr) => sr.id === r.id && sr.type === r.type)
                              );
                              
                              // 그룹별 전체 선택/해제 핸들러
                              const handleSelectGroupAll = () => {
                                if (groupAllSelected) {
                                  // 그룹 전체 해제
                                  const groupIds = new Set(
                                    groupItems.map(r => `${r.type}-${r.id}`)
                                  );
                                  setSelectedRecipients(selectedRecipients.filter(
                                    sr => !groupIds.has(`${sr.type}-${sr.id}`) || sr.type === 'direct'
                                  ));
                                } else {
                                  // 그룹 전체 선택
                                  const newRecipients = groupItems.filter(
                                    (r) => !selectedRecipients.find((sr) => sr.id === r.id && sr.type === r.type)
                                  );
                                  setSelectedRecipients([...selectedRecipients, ...newRecipients]);
                                }
                              };
                              
                              return (
                                <div key={groupType} className="border-b border-gray-200 last:border-b-0">
                                  {/* 그룹 헤더 - 테스트 그룹에만 체크박스 */}
                                  <div className={`sticky top-12 ${groupColors[groupType]} text-white px-4 py-2 font-bold text-sm z-10 flex items-center justify-between`}>
                                    <span>{groupLabels[groupType]} ({groupItems.length}명)</span>
                                    {groupType === 'test' && (
                                      <label className="flex items-center gap-2 cursor-pointer ml-auto" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          type="checkbox"
                                          checked={groupAllSelected}
                                          onChange={handleSelectGroupAll}
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-4 h-4"
                                        />
                                        <span className="text-xs">전체 선택</span>
                                      </label>
                                    )}
                                  </div>
                                  {/* 그룹 아이템 */}
                                  {groupItems.map((recipient, idx) => {
                                    const isSelected = selectedRecipients.find(
                                      r => r.id === recipient.id && r.type === recipient.type
                                    );
                                    return (
                                      <label
                                        key={`${recipient.type}-${recipient.id}-${idx}`}
                                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                                          isSelected ? 'bg-blue-100' : ''
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={!!isSelected}
                                          onChange={() => handleDropdownSelect(recipient)}
                                          className="w-5 h-5 text-blue-600"
                                        />
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-900">
                                              {recipient.name || '이름 없음'}
                                            </span>
                                          </div>
                                          <div className="text-sm text-gray-600 mt-1">
                                            {formData.sendMethod === 'email' ? (
                                              // 이메일 발송: 이메일 주소만 표시
                                              recipient.email && <span className="font-medium">✉️ {recipient.email}</span>
                                            ) : (
                                              // 카카오톡/SMS/크루즈가이드: 전화번호만 표시
                                              recipient.phone && <span className="font-medium">📞 {recipient.phone}</span>
                                            )}
                                          </div>
                                        </div>
                                        {isSelected && (
                                          <FiCheckCircle className="text-blue-600 flex-shrink-0" size={20} />
                                        )}
                                      </label>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* 선택된 수신자 목록 - 그룹별 표시 */}
                {selectedRecipients.length > 0 && (() => {
                  // 그룹별로 분류
                  const groupedSelected = {
                    'cruise-guide': selectedRecipients.filter(r => r.type === 'cruise-guide'),
                    'mall': selectedRecipients.filter(r => r.type === 'mall'),
                    'test': selectedRecipients.filter(r => r.type === 'test'),
                    'prospect': selectedRecipients.filter(r => r.type === 'prospect'),
                    'direct': selectedRecipients.filter(r => r.type === 'direct'),
                  };
                  
                  const groupLabels = {
                    'cruise-guide': '크루즈가이드',
                    'mall': '크루즈몰',
                    'test': '테스트',
                    'prospect': '잠재고객',
                    'direct': '직접 입력',
                  };
                  
                  const groupColors = {
                    'cruise-guide': 'bg-blue-600',
                    'mall': 'bg-purple-600',
                    'test': 'bg-green-600',
                    'prospect': 'bg-yellow-600',
                    'direct': 'bg-gray-600',
                  };
                  
                  return (
                    <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-blue-800">
                          선택된 수신자 ({selectedRecipients.length}명)
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedRecipients([])}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          모두 제거
                        </button>
                      </div>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {(['cruise-guide', 'mall', 'test', 'prospect', 'direct'] as const).map((groupType) => {
                          const groupItems = groupedSelected[groupType];
                          if (groupItems.length === 0) return null;
                          
                          return (
                            <div key={groupType} className="border-b border-blue-200 last:border-b-0 pb-2 last:pb-0">
                              {/* 그룹 헤더 */}
                              <div className={`${groupColors[groupType]} text-white px-3 py-1 rounded-t-lg mb-2 text-xs font-bold`}>
                                {groupLabels[groupType]} ({groupItems.length}명)
                              </div>
                              {/* 그룹 아이템 */}
                              <div className="flex flex-wrap gap-2">
                                {groupItems.map((recipient, idx) => (
                                  <div
                                    key={`${recipient.type}-${recipient.id}-${idx}`}
                                    className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-sm flex items-center gap-2"
                                  >
                                    <span className="font-medium">{recipient.name || '이름 없음'}</span>
                                    {formData.sendMethod === 'email' ? (
                                      // 이메일 발송: 이메일 주소만 표시
                                      recipient.email && <span className="text-xs text-gray-600">✉️ {recipient.email}</span>
                                    ) : (
                                      // 카카오톡/SMS/크루즈가이드: 전화번호만 표시
                                      recipient.phone && <span className="text-xs text-gray-600">📞 {recipient.phone}</span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedRecipients(selectedRecipients.filter(
                                          (r, i) => !(r.id === recipient.id && r.type === recipient.type && i === idx)
                                        ));
                                      }}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <FiX size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* 직접 입력 옵션 */}
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 border-2 border-gray-200 rounded-lg">
                    <input
                      type="checkbox"
                      checked={directInputEnabled}
                      onChange={(e) => {
                        setDirectInputEnabled(e.target.checked);
                      if (!e.target.checked) {
                        setDirectEmailInput('');
                        setDirectPhones(['']);
                      }
                      }}
                      className="w-5 h-5"
                    />
                    <span className="text-base font-semibold text-gray-900">📝 직접 입력으로 수신자 추가</span>
                  </label>

                  {directInputEnabled && (
                    <div className="mt-3 space-y-3 p-4 bg-white border-2 border-gray-300 rounded-lg">
                      {/* 이메일 직접 입력 */}
                      {(formData.sendMethod === 'email' || formData.sendMethod === 'cruise-guide') && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-semibold text-gray-700">
                              이메일 주소 (쉼표로 구분)
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowEmailImportModal(true)}
                              className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                            >
                              <FiFileText size={16} />
                              이메일 가져오기
                            </button>
                          </div>
                          <textarea
                            value={directEmailInput}
                            onChange={(e) => handleDirectEmailChange(e.target.value)}
                            placeholder="example1@email.com, example2@email.com, example3@email.com"
                            rows={3}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                          />
                          {/* 입력된 이메일 미리보기 (태그 형태) */}
                          {getDirectEmailsArray().length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {getDirectEmailsArray().map((email, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                >
                                  {email}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDirectEmail(email)}
                                    className="text-blue-600 hover:text-blue-900 font-bold"
                                  >
                                    <FiX size={14} />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            💡 쉼표(,)로 구분하여 여러 이메일을 한 번에 입력할 수 있습니다.
                          </p>
                        </div>
                      )}

                      {/* 전화번호 직접 입력 */}
                      {(formData.sendMethod === 'sms' || formData.sendMethod === 'kakao') && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            전화번호
                          </label>
                          {directPhones.map((phone, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                              <input
                                type="tel"
                                value={phone}
                                onChange={(e) => {
                                  const newPhones = [...directPhones];
                                  newPhones[index] = e.target.value;
                                  setDirectPhones(newPhones);
                                }}
                                placeholder="010-1234-5678"
                                className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                              {directPhones.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDirectPhone(index)}
                                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                                >
                                  <FiX size={16} />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={handleAddDirectPhone}
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            + 전화번호 추가
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 메시지 타입 (크루즈가이드 메시지일 때만 표시) */}
              {formData.sendMethod === 'cruise-guide' && (
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">
                    메시지 타입
                  </label>
                  <select
                    value={formData.messageType}
                    onChange={(e) => setFormData({ ...formData, messageType: e.target.value })}
                    disabled={formData.isUrgent}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base disabled:bg-gray-100"
                  >
                    <option value="info">정보</option>
                    <option value="warning">경고</option>
                    <option value="promotion">프로모션</option>
                    <option value="announcement">크루즈가이드 메시지</option>
                  </select>
                  {formData.isUrgent && (
                    <p className="text-sm text-red-600 mt-1">긴급공지로 설정되어 자동으로 "크루즈가이드 메시지" 타입이 선택됩니다.</p>
                  )}
                </div>
              )}

              {/* 제목 */}
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="메시지 제목을 입력하세요"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                />
              </div>

              {/* 내용 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-base font-semibold text-gray-700">
                    내용 <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowVariableButtons(!showVariableButtons)}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    {showVariableButtons ? '변수 숨기기' : '개인화 변수'}
                  </button>
                </div>
                
                {/* 개인화 변수 버튼 */}
                {showVariableButtons && (
                  <div className="mb-3 p-3 bg-gray-50 border-2 border-gray-200 rounded-lg">
                    <div className="text-xs font-semibold text-gray-700 mb-2">개인화 변수 삽입:</div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => insertVariable('{닉네임}')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm hover:bg-blue-50 hover:border-blue-300"
                      >
                        {`{닉네임}`}
                      </button>
                      <button
                        type="button"
                        onClick={() => insertVariable('{이름}')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm hover:bg-blue-50 hover:border-blue-300"
                      >
                        {`{이름}`}
                      </button>
                      <button
                        type="button"
                        onClick={() => insertVariable('{구매상품}')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm hover:bg-blue-50 hover:border-blue-300"
                      >
                        {`{구매상품}`}
                      </button>
                      <button
                        type="button"
                        onClick={() => insertVariable('{장바구니상품}')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm hover:bg-blue-50 hover:border-blue-300"
                      >
                        {`{장바구니상품}`}
                      </button>
                      <button
                        type="button"
                        onClick={() => insertVariable('{구매상품일정}')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm hover:bg-blue-50 hover:border-blue-300"
                      >
                        {`{구매상품일정}`}
                      </button>
                      <button
                        type="button"
                        onClick={() => insertVariable('{장바구니상품일정}')}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm hover:bg-blue-50 hover:border-blue-300"
                      >
                        {`{장바구니상품일정}`}
                      </button>
                    </div>
                  </div>
                )}
                
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="메시지 내용을 입력하세요 (HTML 사용 가능)"
                  rows={8}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none"
                />
                <p className="text-sm text-gray-500 mt-1">
                  HTML 태그를 사용할 수 있습니다. 예: &lt;br&gt;, &lt;strong&gt;, &lt;em&gt;
                </p>
              </div>

              {/* 이미지 첨부 */}
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">
                  이미지 첨부
                </label>
                {!formData.imageUrl && !imagePreview ? (
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    />
                    {selectedImage && (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleImageUpload}
                          disabled={isUploadingImage}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          {isUploadingImage ? '업로드 중...' : '이미지 업로드'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview('');
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          취소
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={formData.imageUrl || imagePreview}
                      alt="첨부 이미지"
                      className="max-w-full h-auto rounded-lg border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                    >
                      <FiX size={20} />
                    </button>
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  이미지 크기는 최대 5MB까지 업로드 가능합니다.
                </p>
              </div>

              {/* 버튼 */}
              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all shadow-md"
                >
                  취소
                </button>
                <button
                  onClick={handleSend}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition-all"
                >
                  <FiSend size={18} />
                  {formData.sendMethod === 'cruise-guide' && '크루즈가이드 메시지 발송'}
                  {formData.sendMethod === 'email' && '이메일 발송'}
                  {formData.sendMethod === 'sms' && 'SMS 발송'}
                  {formData.sendMethod === 'kakao' && '카카오 알림톡 발송'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 이메일 가져오기 모달 */}
      {showEmailImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b-2 border-gray-200 p-6 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">이메일 가져오기</h2>
              <button
                onClick={() => {
                  setShowEmailImportModal(false);
                  setEmailImportTab('excel');
                  setExcelFile(null);
                  setSelectedSavedEmails(new Set());
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6">
              {/* 탭 */}
              <div className="flex gap-2 mb-6 border-b-2 border-gray-200">
                <button
                  onClick={() => setEmailImportTab('excel')}
                  className={`px-4 py-2 font-semibold transition-colors ${
                    emailImportTab === 'excel'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  엑셀 가져오기
                </button>
                <button
                  onClick={() => setEmailImportTab('saved')}
                  className={`px-4 py-2 font-semibold transition-colors ${
                    emailImportTab === 'saved'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  저장된 목록
                </button>
                <button
                  onClick={() => setEmailImportTab('manual')}
                  className={`px-4 py-2 font-semibold transition-colors ${
                    emailImportTab === 'manual'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  수동 입력
                </button>
              </div>

              {/* 엑셀 가져오기 탭 */}
              {emailImportTab === 'excel' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">엑셀 파일 형식</h3>
                    <p className="text-sm text-gray-700 mb-3">
                      엑셀 파일은 다음 형식으로 작성해주세요:
                    </p>
                    <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                      <li>A열: 이름 (선택사항)</li>
                      <li>B열: 연락처 (전화번호, 선택사항)</li>
                      <li>C열: 이메일 (필수)</li>
                      <li>이메일 또는 전화번호 중 하나는 필수입니다.</li>
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleDownloadSample}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold flex items-center gap-2"
                    >
                      <FiDownload size={18} />
                      샘플 다운로드
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      엑셀 파일 선택
                    </label>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {excelFile && (
                      <p className="text-sm text-gray-600 mt-2">선택된 파일: {excelFile.name}</p>
                    )}
                  </div>

                  <button
                    onClick={handleUploadExcel}
                    disabled={!excelFile || isUploadingExcel}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isUploadingExcel ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        업로드 중...
                      </>
                    ) : (
                      <>
                        <FiUpload size={18} />
                        엑셀 파일 업로드
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* 저장된 목록 탭 */}
              {emailImportTab === 'saved' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">
                      저장된 이메일 목록 ({savedEmailList.length}개)
                    </h3>
                    <button
                      onClick={handleSelectAllSavedEmails}
                      className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      {selectedSavedEmails.size === savedEmailList.length ? '전체 해제' : '전체 선택'}
                    </button>
                  </div>

                  {isLoadingSavedEmails ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
                      <p className="mt-2 text-gray-600">로딩 중...</p>
                    </div>
                  ) : savedEmailList.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      저장된 이메일이 없습니다.
                    </div>
                  ) : (
                    <div className="border-2 border-gray-300 rounded-lg max-h-96 overflow-y-auto">
                      {savedEmailList.map((item) => (
                        <label
                          key={item.id}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                            selectedSavedEmails.has(item.id) ? 'bg-blue-100' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSavedEmails.has(item.id)}
                            onChange={() => handleSelectSavedEmail(item.id)}
                            className="w-5 h-5 text-blue-600"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">
                              {item.name || '이름 없음'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {item.email}
                              {item.phone && <span className="ml-2">• {item.phone}</span>}
                            </div>
                            {item.memo && (
                              <div className="text-xs text-gray-500 mt-1">{item.memo}</div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {selectedSavedEmails.size > 0 && (
                    <button
                      onClick={handleApplySelectedEmails}
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center gap-2"
                    >
                      선택한 이메일 적용 ({selectedSavedEmails.size}개)
                    </button>
                  )}
                </div>
              )}

              {/* 수동 입력 탭 */}
              {emailImportTab === 'manual' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      이름 (선택사항)
                    </label>
                    <input
                      type="text"
                      value={manualEmailEntry.name}
                      onChange={(e) => setManualEmailEntry({ ...manualEmailEntry, name: e.target.value })}
                      placeholder="홍길동"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      이메일 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={manualEmailEntry.email}
                      onChange={(e) => setManualEmailEntry({ ...manualEmailEntry, email: e.target.value })}
                      placeholder="example@email.com"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      전화번호 (선택사항)
                    </label>
                    <input
                      type="tel"
                      value={manualEmailEntry.phone}
                      onChange={(e) => setManualEmailEntry({ ...manualEmailEntry, phone: e.target.value })}
                      placeholder="010-1234-5678"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      메모 (선택사항)
                    </label>
                    <textarea
                      value={manualEmailEntry.memo}
                      onChange={(e) => setManualEmailEntry({ ...manualEmailEntry, memo: e.target.value })}
                      placeholder="메모를 입력하세요"
                      rows={3}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleSaveManualEmail}
                    disabled={!manualEmailEntry.email || isSavingManual}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSavingManual ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        저장 중...
                      </>
                    ) : (
                      '이메일 주소록에 저장'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
