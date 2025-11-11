// app/admin/mall-customers/[userId]/page.tsx
// 크루즈몰 고객 상세 페이지

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FiLock, FiUnlock, FiKey, FiArrowLeft, FiEdit2, FiSave, FiXCircle, FiTrash2, FiAlertCircle } from 'react-icons/fi';

interface MallCustomer {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  lastActiveAt: string | null;
  isLocked: boolean;
  isHibernated: boolean;
  lockedAt: string | null;
  lockedReason: string | null;
  reviewCount: number;
  postCount: number;
  commentCount: number;
  inquiryCount: number;
  viewCount: number;
  currentPassword?: string | null;
  linkedGenieUser?: {
    id: number;
    name: string | null;
    phone: string | null;
    email: string | null;
    genieStatus: string | null;
    genieLinkedAt: string | null;
  } | null;
}

export default function MallCustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [customer, setCustomer] = useState<MallCustomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (userId) {
      loadCustomerData();
    }
  }, [userId]);

  const loadCustomerData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/mall-customers/${userId}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('고객을 찾을 수 없습니다.');
        }
        throw new Error('고객 정보를 불러올 수 없습니다.');
      }

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || '고객 정보를 불러오는 중 오류가 발생했습니다.');
      }

      const c = data.customer;
      setCustomer(c);
      setEditForm({
        name: c.name || '',
        phone: c.phone || '',
        email: c.email || '',
      });
    } catch (error) {
      console.error('Failed to load customer:', error);
      setError(error instanceof Error ? error.message : '고객 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/admin/mall-customers/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editForm),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || '저장에 실패했습니다.');
      }

      alert('고객 정보가 저장되었습니다.');
      loadCustomerData();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save customer:', error);
      alert(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (customer) {
      setEditForm({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
      });
    }
    setIsEditing(false);
  };

  const handleResetPassword = async () => {
    if (!confirm('비밀번호를 초기화하시겠습니까? 새 비밀번호가 생성됩니다.')) return;

    try {
      setIsResettingPassword(true);
      const response = await fetch(`/api/admin/mall-customers/${userId}/reset-password`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || '비밀번호 초기화에 실패했습니다.');
      }

      alert(`비밀번호가 초기화되었습니다.\n새 비밀번호: ${data.newPassword}`);
      loadCustomerData();
    } catch (error) {
      console.error('Failed to reset password:', error);
      alert(error instanceof Error ? error.message : '비밀번호 초기화 중 오류가 발생했습니다.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleLockAccount = async () => {
    const reason = prompt('계정 잠금 사유를 입력하세요:', '관리자에 의해 잠금');
    if (reason === null) return;

    try {
      setIsLocking(true);
      const response = await fetch(`/api/admin/mall-customers/${userId}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || '계정 잠금에 실패했습니다.');
      }

      alert('계정이 잠금되었습니다.');
      loadCustomerData();
    } catch (error) {
      console.error('Failed to lock account:', error);
      alert(error instanceof Error ? error.message : '계정 잠금 중 오류가 발생했습니다.');
    } finally {
      setIsLocking(false);
    }
  };

  const handleUnlockAccount = async () => {
    if (!confirm('계정 잠금을 해제하시겠습니까?')) {
      return;
    }

    try {
      setIsUnlocking(true);
      const response = await fetch(`/api/admin/mall-customers/${userId}/lock`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || '계정 잠금 해제에 실패했습니다.');
      }

      alert('계정 잠금이 해제되었습니다.');
      loadCustomerData();
    } catch (error) {
      console.error('Failed to unlock account:', error);
      alert(error instanceof Error ? error.message : '계정 잠금 해제 중 오류가 발생했습니다.');
    } finally {
      setIsUnlocking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  if (error && !customer) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <FiAlertCircle className="text-red-600 text-xl mt-1 mr-3" />
          <div className="flex-1">
            <h3 className="text-red-800 font-semibold mb-2">오류 발생</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => router.push('/admin/mall-customers')}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              고객 목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            크루즈몰 고객 상세: {customer.name || '이름 없음'} ({customer.phone})
          </h1>
          <p className="text-gray-600">고객 ID: {customer.id}</p>
        </div>
        <button
          onClick={() => router.push('/admin/mall-customers')}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
        >
          목록으로
        </button>
      </div>

      {/* 프로필 정보 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
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
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
              <input
                type="text"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">이름</p>
              <p className="font-medium text-gray-800">{customer.name || '이름 없음'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">전화번호</p>
              <p className="font-medium text-gray-800">{customer.phone || '없음'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">이메일</p>
              <p className="font-medium text-gray-800">{customer.email || '없음'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">가입일</p>
              <p className="font-medium text-gray-800">
                {new Date(customer.createdAt).toLocaleString('ko-KR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">마지막 접속</p>
              <p className="font-medium text-gray-800">
                {customer.lastActiveAt 
                  ? new Date(customer.lastActiveAt).toLocaleString('ko-KR')
                  : '없음'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">비밀번호</p>
              <p className="font-medium text-gray-800">
                {customer.currentPassword || '정보 없음'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 연동된 크루즈가이드 지니 정보 */}
      {customer.linkedGenieUser && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">연동된 크루즈가이드 지니 정보</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-blue-600 font-semibold text-lg">✓ 연동 완료</span>
              {customer.linkedGenieUser.genieLinkedAt && (
                <span className="text-sm text-gray-500">
                  ({new Date(customer.linkedGenieUser.genieLinkedAt).toLocaleString('ko-KR')})
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-600">크루즈가이드 사용자 ID</p>
                <p className="font-medium text-gray-800">{customer.linkedGenieUser.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">이름</p>
                <p className="font-medium text-gray-800">{customer.linkedGenieUser.name || '정보 없음'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">연락처</p>
                <p className="font-medium text-gray-800">{customer.linkedGenieUser.phone || '정보 없음'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">이메일</p>
                <p className="font-medium text-gray-800">{customer.linkedGenieUser.email || '정보 없음'}</p>
              </div>
              {customer.linkedGenieUser.genieStatus && (
                <div>
                  <p className="text-sm text-gray-600">지니 상태</p>
                  <p className="font-medium text-gray-800">
                    {customer.linkedGenieUser.genieStatus === 'active' ? '사용 중' : '사용 종료'}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-blue-200">
              <a
                href={`/admin/users/${customer.linkedGenieUser.id}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                크루즈가이드 사용자 상세 보기 →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 연동 정보가 없는 경우 */}
      {!customer.linkedGenieUser && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">크루즈가이드 지니 연동 정보</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-gray-600">
              연동된 크루즈가이드 지니 정보가 없습니다.
            </p>
          </div>
        </div>
      )}

      {/* 크루즈몰 활동 통계 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">크루즈몰 활동</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{customer.reviewCount || 0}</p>
            <p className="text-sm text-gray-600 mt-1">후기</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{customer.postCount || 0}</p>
            <p className="text-sm text-gray-600 mt-1">게시글</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{customer.commentCount || 0}</p>
            <p className="text-sm text-gray-600 mt-1">댓글</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{customer.inquiryCount || 0}</p>
            <p className="text-sm text-gray-600 mt-1">문의</p>
          </div>
          <div className="text-center p-4 bg-pink-50 rounded-lg">
            <p className="text-2xl font-bold text-pink-600">{customer.viewCount || 0}</p>
            <p className="text-sm text-gray-600 mt-1">조회</p>
          </div>
        </div>
      </div>

      {/* 작성한 콘텐츠 및 활동 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">작성한 콘텐츠 및 활동</h2>
        <p className="text-gray-600 mb-4">
          이 고객의 후기, 게시글, 댓글, 상품 문의 내역은 회원 상세 페이지에서 확인할 수 있습니다.
        </p>
        <button
          onClick={() => router.push(`/admin/users/${userId}`)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          전체 활동 보기
        </button>
      </div>

      {/* 보안 관리 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">보안 관리</h2>
        <div className="space-y-3">
          <button
            onClick={handleResetPassword}
            disabled={isResettingPassword}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiKey className="w-5 h-5" />
            {isResettingPassword ? '처리 중...' : '비밀번호 초기화'}
          </button>

          {customer.isLocked ? (
            <button
              onClick={handleUnlockAccount}
              disabled={isUnlocking}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiUnlock className="w-5 h-5" />
              {isUnlocking ? '처리 중...' : '계정 잠금 해제'}
            </button>
          ) : (
            <button
              onClick={handleLockAccount}
              disabled={isLocking}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiLock className="w-5 h-5" />
              {isLocking ? '처리 중...' : '계정 잠금'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}






