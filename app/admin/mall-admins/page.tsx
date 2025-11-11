'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiSearch, FiChevronLeft, FiChevronRight, FiPlus, FiEdit, FiTrash2, FiSettings, FiUser, FiEdit2, FiInfo, FiX } from 'react-icons/fi';

interface MallAdmin {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  lastActiveAt: string | null;
  loginCount: number;
  isLocked: boolean;
  isHibernated: boolean;
  adminMemo: string | null; // 기능 설정 (JSON)
  mallNickname: string | null; // 닉네임
  currentPassword?: string | null;
}

interface FeatureSettings {
  canDeletePosts: boolean;
  canDeleteComments: boolean;
  canEditProductText: boolean;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function MallAdminsPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<MallAdmin[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<MallAdmin | null>(null);
  const [resettingPassword, setResettingPassword] = useState<number | null>(null);
  const [showFeatureGuide, setShowFeatureGuide] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    mallNickname: '',
  });
  const [featureSettings, setFeatureSettings] = useState<FeatureSettings>({
    canDeletePosts: true,
    canDeleteComments: true,
    canEditProductText: true,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadAdmins();
  }, [search, pagination.page]);

  const handleResetPassword = async (adminId: number, currentPassword: string | null) => {
    const newPassword = prompt(
      `비밀번호를 변경하세요:\n\n현재 비밀번호: ${currentPassword || '(없음)'}`,
      currentPassword || '0000'
    );
    
    if (!newPassword) return;
    
    if (newPassword.length < 4) {
      alert('비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }
    
    if (!confirm(`비밀번호를 "${newPassword}"로 변경하시겠습니까?`)) return;
    
    setResettingPassword(adminId);
    
    try {
      const response = await fetch(`/api/admin/users/${adminId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newPassword: newPassword }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.ok) {
        throw new Error(data.error || '비밀번호 변경에 실패했습니다.');
      }
      
      alert(`✅ 비밀번호가 "${newPassword}"로 변경되었습니다.`);
      await loadAdmins();
    } catch (error) {
      console.error('[MallAdmins] Failed to reset password:', error);
      alert(`❌ 비밀번호 변경 실패\n\n${error instanceof Error ? error.message : '비밀번호 변경 중 오류가 발생했습니다.'}`);
    } finally {
      setResettingPassword(null);
    }
  };

  const loadAdmins = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        search,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      const response = await fetch(`/api/admin/mall-admins?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('인증이 필요합니다. 다시 로그인해 주세요.');
        }
        throw new Error('크루즈몰 관리자 목록을 불러올 수 없습니다.');
      }

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || '크루즈몰 관리자 목록을 불러오는 중 오류가 발생했습니다.');
      }

      setAdmins(data.admins || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error('Failed to load mall admins:', error);
      setError(error instanceof Error ? error.message : '크루즈몰 관리자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.phone || !formData.password) {
        alert('전화번호(user1~user10)와 비밀번호는 필수입니다.');
        return;
      }

      if (!/^user(1[0]|[1-9])$/.test(formData.phone)) {
        alert('전화번호는 user1~user10 형식이어야 합니다.');
        return;
      }

      const response = await fetch('/api/admin/mall-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || '크루즈몰 관리자 생성에 실패했습니다.');
      }

      alert('크루즈몰 관리자가 생성되었습니다.');
      setIsCreateModalOpen(false);
      setFormData({ name: '', phone: '', email: '', password: '', mallNickname: '' });
      await loadAdmins();
    } catch (error) {
      console.error('Failed to create mall admin:', error);
      alert(error instanceof Error ? error.message : '크루즈몰 관리자 생성 중 오류가 발생했습니다.');
    }
  };

  const handleEdit = async () => {
    if (!selectedAdmin) return;

    try {
      if (formData.phone && !/^user(1[0]|[1-9])$/.test(formData.phone)) {
        alert('전화번호는 user1~user10 형식이어야 합니다.');
        return;
      }

      const response = await fetch(`/api/admin/mall-admins/${selectedAdmin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || '크루즈몰 관리자 수정에 실패했습니다.');
      }

      alert('크루즈몰 관리자 정보가 수정되었습니다.');
      setIsEditModalOpen(false);
      setSelectedAdmin(null);
      setFormData({ name: '', phone: '', email: '', password: '', mallNickname: '' });
      await loadAdmins();
    } catch (error) {
      console.error('Failed to update mall admin:', error);
      alert(error instanceof Error ? error.message : '크루즈몰 관리자 수정 중 오류가 발생했습니다.');
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedAdmin) return;

    try {
      const response = await fetch(`/api/admin/mall-admins/${selectedAdmin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          featureSettings,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || '기능 설정 저장에 실패했습니다.');
      }

      alert('기능 설정이 저장되었습니다.');
      setIsSettingsModalOpen(false);
      await loadAdmins();
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert(error instanceof Error ? error.message : '기능 설정 저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (adminId: number) => {
    if (!confirm('정말로 이 크루즈몰 관리자를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/mall-admins/${adminId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || '크루즈몰 관리자 삭제에 실패했습니다.');
      }

      alert('크루즈몰 관리자가 삭제되었습니다.');
      await loadAdmins();
    } catch (error) {
      console.error('Failed to delete mall admin:', error);
      alert(error instanceof Error ? error.message : '크루즈몰 관리자 삭제 중 오류가 발생했습니다.');
    }
  };

  const openEditModal = (admin: MallAdmin) => {
    setSelectedAdmin(admin);
    setFormData({
      name: admin.name || '',
      phone: admin.phone || '',
      email: admin.email || '',
      password: '', // 비밀번호는 비워둠
      mallNickname: admin.mallNickname || '',
    });
    setIsEditModalOpen(true);
  };

  const openSettingsModal = (admin: MallAdmin) => {
    setSelectedAdmin(admin);
    // 기능 설정 파싱
    if (admin.adminMemo) {
      try {
        const parsed = JSON.parse(admin.adminMemo);
        setFeatureSettings({
          canDeletePosts: parsed.canDeletePosts !== false,
          canDeleteComments: parsed.canDeleteComments !== false,
          canEditProductText: parsed.canEditProductText !== false,
        });
      } catch {
        // 파싱 실패 시 기본값 사용
        setFeatureSettings({
          canDeletePosts: true,
          canDeleteComments: true,
          canEditProductText: true,
        });
      }
    } else {
      setFeatureSettings({
        canDeletePosts: true,
        canDeleteComments: true,
        canEditProductText: true,
      });
    }
    setIsSettingsModalOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">크루즈몰 관리자 관리</h1>
          <p className="text-gray-600">크루즈몰 관리자 계정(user1~user10)을 조회하고 관리하세요</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', phone: '', email: '', password: '', mallNickname: '' });
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <FiPlus className="w-5 h-5" />
          관리자 추가
        </button>
      </div>

      {/* 크루즈몰 관리자 기능 안내 */}
      {showFeatureGuide && (
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 mb-6 relative">
          <button
            onClick={() => setShowFeatureGuide(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-5 h-5" />
          </button>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <FiInfo className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-blue-900 mb-3">크루즈몰 관리자 기능 안내</h3>
              <div className="space-y-3 text-sm text-blue-800">
                <div>
                  <p className="font-semibold mb-1">크루즈몰 관리자는 다음 기능을 사용할 수 있습니다:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>커뮤니티 글 삭제</strong>: 커뮤니티 게시글을 삭제할 수 있는 권한</li>
                    <li><strong>커뮤니티 댓글 삭제</strong>: 커뮤니티 댓글을 삭제할 수 있는 권한</li>
                    <li><strong>상품 상세페이지 텍스트 수정</strong>: 상품 상세페이지의 블럭 텍스트를 수정할 수 있는 권한</li>
                  </ul>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="font-semibold mb-1">기능 설정 방법:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>관리자 목록에서 설정 아이콘(⚙️)을 클릭하세요</li>
                    <li>각 기능의 토글 스위치를 ON/OFF하여 권한을 설정하세요</li>
                    <li>설정을 저장하면 해당 관리자에게 권한이 적용됩니다</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 검색 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="이름, 전화번호(user1~user10), 이메일로 검색..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* 관리자 테이블 */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-brand-red text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">ID</th>
                  <th className="px-6 py-4 text-left font-semibold">이름</th>
                  <th className="px-6 py-4 text-left font-semibold">닉네임</th>
                  <th className="px-6 py-4 text-left font-semibold">전화번호 (아이디)</th>
                  <th className="px-6 py-4 text-left font-semibold">비밀번호</th>
                  <th className="px-6 py-4 text-left font-semibold">이메일</th>
                  <th className="px-6 py-4 text-left font-semibold">가입일</th>
                  <th className="px-6 py-4 text-left font-semibold">마지막 접속</th>
                  <th className="px-6 py-4 text-left font-semibold">로그인 횟수</th>
                  <th className="px-6 py-4 text-left font-semibold">상태</th>
                  <th className="px-6 py-4 text-left font-semibold">관리</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {admins.map((admin) => (
                  <tr key={admin.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">{admin.id}</td>
                    <td className="px-6 py-4 font-medium">{admin.name || '-'}</td>
                    <td className="px-6 py-4 font-medium text-purple-600">{admin.mallNickname || '-'}</td>
                    <td className="px-6 py-4 font-semibold text-blue-600">{admin.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {admin.currentPassword || '-'}
                        </span>
                        <button
                          onClick={() => handleResetPassword(admin.id, admin.currentPassword || null)}
                          disabled={resettingPassword === admin.id}
                          className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="비밀번호 수정"
                        >
                          <FiEdit2 size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">{admin.email || '-'}</td>
                    <td className="px-6 py-4">
                      {new Date(admin.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4">
                      {admin.lastActiveAt
                        ? new Date(admin.lastActiveAt).toLocaleDateString('ko-KR')
                        : '-'}
                    </td>
                    <td className="px-6 py-4">{admin.loginCount || 0}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-black text-white rounded text-xs font-medium">
                        크루즈몰관리자
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(admin)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="수정"
                        >
                          <FiEdit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openSettingsModal(admin)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="기능 설정"
                        >
                          <FiSettings className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(admin.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {pagination.totalPages > 1 && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  총 {pagination.total}명 중 {((pagination.page - 1) * pagination.limit) + 1}-
                  {Math.min(pagination.page * pagination.limit, pagination.total)}명 표시
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            pagination.page === pageNum
                              ? 'bg-brand-red text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 생성 모달 */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">크루즈몰 관리자 추가</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">전화번호 (아이디) *</label>
                <select
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">선택하세요</option>
                  {['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10'].map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">user1~user10 중 선택하세요</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="이름을 입력하세요 (선택사항)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
                <input
                  type="text"
                  value={formData.mallNickname}
                  onChange={(e) => setFormData({ ...formData, mallNickname: e.target.value })}
                  placeholder="닉네임을 입력하세요 (선택사항)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreate}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                생성
              </button>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setFormData({ name: '', phone: '', email: '', password: '', mallNickname: '' });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {isEditModalOpen && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">크루즈몰 관리자 수정</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">전화번호 (아이디) *</label>
                <select
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10'].map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
                <input
                  type="text"
                  value={formData.mallNickname}
                  onChange={(e) => setFormData({ ...formData, mallNickname: e.target.value })}
                  placeholder="닉네임을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {selectedAdmin.mallNickname && (
                  <p className="mt-1 text-xs text-gray-500">
                    현재 닉네임: <span className="font-semibold">{selectedAdmin.mallNickname}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 (변경 시에만 입력)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="변경하지 않으려면 비워두세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleEdit}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                수정
              </button>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedAdmin(null);
                  setFormData({ name: '', phone: '', email: '', password: '', mallNickname: '' });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 기능 설정 모달 */}
      {isSettingsModalOpen && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">기능 설정</h2>
            <p className="text-sm text-gray-600 mb-4">관리자: {selectedAdmin.name || selectedAdmin.phone}</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">커뮤니티 글 삭제</label>
                  <p className="text-xs text-gray-500">커뮤니티 게시글 삭제 권한</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featureSettings.canDeletePosts}
                    onChange={(e) => setFeatureSettings({ ...featureSettings, canDeletePosts: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">커뮤니티 댓글 삭제</label>
                  <p className="text-xs text-gray-500">커뮤니티 댓글 삭제 권한</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featureSettings.canDeleteComments}
                    onChange={(e) => setFeatureSettings({ ...featureSettings, canDeleteComments: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상품 상세페이지 텍스트 수정</label>
                  <p className="text-xs text-gray-500">상품 상세페이지 블럭 텍스트 수정 권한</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featureSettings.canEditProductText}
                    onChange={(e) => setFeatureSettings({ ...featureSettings, canEditProductText: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveSettings}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                저장
              </button>
              <button
                onClick={() => {
                  setIsSettingsModalOpen(false);
                  setSelectedAdmin(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
