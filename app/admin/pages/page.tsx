// app/admin/pages/page.tsx
// 페이지 콘텐츠 관리 - HTML 코드 편집 방식

'use client';

import { useState, useEffect } from 'react';
import { FiCode, FiEye, FiSave, FiUpload, FiImage, FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import DOMPurify from 'isomorphic-dompurify';

const PAGES = [
  { path: '/support/service', name: '서비스 소개', icon: '🧞' },
  { path: '/support/notice', name: '공지사항', icon: '📢' },
  { path: '/support/faq', name: 'FAQ', icon: '❓' },
  { path: '/events', name: '이벤트', icon: '🎉' },
  { path: '/community', name: '커뮤니티', icon: '💬' },
];

export default function PagesManagementPage() {
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [originalHtml, setOriginalHtml] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCruisePhotoModal, setShowCruisePhotoModal] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadFilename, setUploadFilename] = useState('');
  const [cruiseFolders, setCruiseFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [cruiseImages, setCruiseImages] = useState<string[]>([]);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [uploadedImageHtml, setUploadedImageHtml] = useState<string>('');
  const [selectedImageHtml, setSelectedImageHtml] = useState<string>('');
  const [notices, setNotices] = useState<any[]>([]);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any>(null);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
    category: '안내',
    content: '',
  });

  useEffect(() => {
    if (selectedPage) {
      if (selectedPage === '/support/notice') {
        loadNotices();
      } else {
        loadPageContent();
      }
    }
  }, [selectedPage]);

  const loadPageContent = async () => {
    setLoading(true);
    try {
      // 먼저 저장된 HTML이 있는지 확인
      const res = await fetch(`/api/admin/pages/html?pagePath=${encodeURIComponent(selectedPage)}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.ok && data.html) {
        setHtmlContent(data.html);
        setOriginalHtml(data.html);
      } else {
        // 저장된 HTML이 없으면 현재 페이지의 HTML을 가져오기
        try {
          const pageRes = await fetch(selectedPage);
          const pageHtml = await pageRes.text();
          // HTML에서 필요한 부분만 추출 (body 내용)
          const bodyMatch = pageHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
          const content = bodyMatch ? bodyMatch[1] : pageHtml;
          setHtmlContent(content);
          setOriginalHtml(content);
        } catch (e) {
          setHtmlContent('<div class="p-8"><h1 class="text-2xl font-bold mb-4">새 페이지</h1><p>HTML 코드를 입력하세요.</p></div>');
          setOriginalHtml('<div class="p-8"><h1 class="text-2xl font-bold mb-4">새 페이지</h1><p>HTML 코드를 입력하세요.</p></div>');
        }
      }
    } catch (error) {
      console.error('Failed to load page content:', error);
      setHtmlContent('<div class="p-8"><h1 class="text-2xl font-bold mb-4">새 페이지</h1><p>HTML 코드를 입력하세요.</p></div>');
      setOriginalHtml('<div class="p-8"><h1 class="text-2xl font-bold mb-4">새 페이지</h1><p>HTML 코드를 입력하세요.</p></div>');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/pages/html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          pagePath: selectedPage,
          html: htmlContent,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setOriginalHtml(htmlContent);
        alert('저장되었습니다!');
      } else {
        alert('저장 실패: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 카테고리와 파일명 입력 모달 표시
    setShowUploadModal(true);
    setIsNewCategory(false);
    setUploadCategory('');
    setUploadedImageHtml(''); // 이전 HTML 소스 초기화
    // 파일은 나중에 사용하기 위해 저장
    (window as any).pendingUploadFile = file;
    e.target.value = ''; // 파일 입력 초기화
  };

  const confirmImageUpload = async () => {
    const file = (window as any).pendingUploadFile;
    if (!file || !uploadCategory || !uploadFilename) {
      alert('카테고리와 파일명을 모두 입력해주세요.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'image');
      formData.append('category', uploadCategory);
      formData.append('filename', uploadFilename);

      const res = await fetch('/api/admin/mall/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await res.json();
      if (data.ok) {
        const imageTag = `<img src="${data.url}" alt="${uploadFilename}" />`;
        setUploadedImageHtml(imageTag);
        await navigator.clipboard.writeText(imageTag);
      } else {
        alert('업로드 실패: ' + data.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // 크루즈정보사진 폴더 목록 로드
  useEffect(() => {
    if (showCruisePhotoModal) {
      loadCruiseFolders();
    }
  }, [showCruisePhotoModal]);

  // 이미지 업로드 모달이 열릴 때 폴더 목록 로드
  useEffect(() => {
    if (showUploadModal) {
      loadCruiseFolders();
    }
  }, [showUploadModal]);

  const loadCruiseFolders = async () => {
    try {
      const res = await fetch('/api/admin/mall/cruise-photos?listFolders=true', {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.ok) {
        setCruiseFolders(data.folders || []);
      }
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const loadCruiseImages = async (folder: string) => {
    try {
      const res = await fetch(`/api/admin/mall/cruise-photos?folder=${encodeURIComponent(folder)}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.ok) {
        setCruiseImages(data.images || []);
        setSelectedFolder(folder);
        setSelectedImageHtml(''); // 폴더 변경 시 이전 선택 초기화
      }
    } catch (error) {
      console.error('Failed to load images:', error);
    }
  };

  const selectCruiseImage = async (imageUrl: string) => {
    const imageTag = `<img src="${imageUrl}" alt="크루즈정보사진" />`;
    setSelectedImageHtml(imageTag);
    await navigator.clipboard.writeText(imageTag);
    // 모달은 닫지 않고 HTML 소스를 표시
  };

  const loadNotices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pages/content?pagePath=${encodeURIComponent('/support/notice')}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.ok && data.contents) {
        const noticeContents = data.contents
          .filter((c: any) => c.section === 'notices' && c.contentType === 'notice')
          .sort((a: any, b: any) => {
            const dateA = new Date(a.content.date.replace(/\./g, '-')).getTime();
            const dateB = new Date(b.content.date.replace(/\./g, '-')).getTime();
            return dateB - dateA;
          });
        setNotices(noticeContents);
      } else {
        setNotices([]);
      }
    } catch (error) {
      console.error('Failed to load notices:', error);
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNotice = () => {
    setEditingNotice(null);
    setNoticeForm({
      title: '',
      date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      category: '안내',
      content: '',
    });
    setShowNoticeModal(true);
  };

  const handleEditNotice = (notice: any) => {
    setEditingNotice(notice);
    setNoticeForm({
      title: notice.content.title || '',
      date: notice.content.date || new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      category: notice.content.category || '안내',
      content: notice.content.content || '',
    });
    setShowNoticeModal(true);
  };

  const handleSaveNotice = async () => {
    if (!noticeForm.title || !noticeForm.content) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    if (!noticeForm.date) {
      alert('날짜를 입력해주세요.');
      return;
    }

    try {
      if (editingNotice) {
        // 수정
        const res = await fetch('/api/admin/pages/content', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: editingNotice.id,
            content: noticeForm,
          }),
        });
        const data = await res.json();
        if (data.ok) {
          alert('공지사항이 수정되었습니다.');
          await loadNotices();
          setShowNoticeModal(false);
        } else {
          alert('수정 실패: ' + (data.error || '알 수 없는 오류'));
        }
      } else {
        // 추가
        const res = await fetch('/api/admin/pages/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            pagePath: '/support/notice',
            section: 'notices',
            itemId: `notice-${Date.now()}`,
            contentType: 'notice',
            content: noticeForm,
            order: notices.length,
          }),
        });
        const data = await res.json();
        if (data.ok) {
          alert('공지사항이 추가되었습니다.');
          await loadNotices();
          setShowNoticeModal(false);
        } else {
          alert('추가 실패: ' + (data.error || '알 수 없는 오류'));
        }
      }
    } catch (error) {
      console.error('Failed to save notice:', error);
      alert('저장 중 오류가 발생했습니다. 콘솔을 확인해주세요.');
    }
  };

  const handleDeleteNotice = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?\n삭제된 공지사항은 복구할 수 없습니다.')) return;

    try {
      const res = await fetch(`/api/admin/pages/content?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.ok) {
        alert('공지사항이 삭제되었습니다.');
        await loadNotices();
      } else {
        alert('삭제 실패: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('Failed to delete notice:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const hasChanges = selectedPage !== '/support/notice' ? htmlContent !== originalHtml : false;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              📝 페이지 콘텐츠 관리
            </h1>
            <p className="text-gray-600">
              각 페이지의 HTML 코드를 직접 편집할 수 있습니다.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer flex items-center gap-2">
              <FiUpload />
              {uploading ? '업로드 중...' : '이미지 업로드'}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <button
              onClick={() => setShowCruisePhotoModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <FiImage />
              크루즈정보사진에서 선택
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'code' ? 'preview' : 'code')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                viewMode === 'preview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {viewMode === 'preview' ? <FiCode /> : <FiEye />}
              {viewMode === 'preview' ? '코드 보기' : '미리보기'}
            </button>
            {selectedPage !== '/support/notice' && (
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  hasChanges && !saving
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <FiSave />
                {saving ? '저장 중...' : '저장'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 페이지 선택 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">페이지 선택</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {PAGES.map((page) => (
            <button
              key={page.path}
              onClick={() => setSelectedPage(page.path)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedPage === page.path
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-3xl mb-2">{page.icon}</div>
              <div className="font-semibold">{page.name}</div>
            </button>
          ))}
        </div>
      </div>

      {selectedPage && (
        <>
          {/* 미리보기 링크 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-blue-900">페이지 미리보기</p>
                <p className="text-sm text-blue-700">{selectedPage}</p>
              </div>
              <a
                href={selectedPage}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                새 탭에서 열기
              </a>
            </div>
          </div>

          {selectedPage === '/support/notice' ? (
            /* 공지사항 관리 UI */
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">공지사항 관리</h2>
                <button
                  onClick={handleAddNotice}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <FiPlus />
                  공지사항 추가
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">로딩 중...</p>
                </div>
              ) : notices.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  등록된 공지사항이 없습니다. "공지사항 추가" 버튼을 클릭하여 추가하세요.
                </div>
              ) : (
                <div className="space-y-4">
                  {notices.map((notice) => (
                    <div
                      key={notice.id}
                      className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full whitespace-nowrap">
                            {notice.content.category || '안내'}
                          </span>
                          <h3 className="text-lg font-bold text-gray-900 flex-1">{notice.content.title || '제목 없음'}</h3>
                          <span className="text-sm text-gray-500 whitespace-nowrap">{notice.content.date || ''}</span>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditNotice(notice)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            title="공지사항 수정"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteNotice(notice.id)}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1 transition-colors"
                            title="공지사항 삭제"
                          >
                            <FiTrash2 size={14} />
                            삭제
                          </button>
                        </div>
                      </div>
                      <div className="text-gray-700 whitespace-pre-line leading-relaxed line-clamp-3">
                        {notice.content.content || ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* 기존 HTML 편집 UI */
            <>
              {/* 변경 사항 알림 */}
              {hasChanges && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ 변경 사항이 있습니다. 저장 버튼을 클릭하여 저장하세요.
                  </p>
                </div>
              )}

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">로딩 중...</p>
                </div>
              ) : viewMode === 'code' ? (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">HTML 코드 편집</h3>
                    <p className="text-sm text-gray-600">
                      HTML 코드를 직접 수정하세요. 이미지를 업로드하면 이미지 태그가 클립보드에 복사됩니다.
                    </p>
                  </div>
                  <textarea
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    className="w-full h-[600px] font-mono text-sm border rounded-lg p-4 bg-gray-50"
                    placeholder="HTML 코드를 입력하세요..."
                  />
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">미리보기</h3>
                    <p className="text-sm text-gray-600">
                      편집한 HTML 코드가 어떻게 보이는지 확인하세요.
                    </p>
                  </div>
                  <div className="border rounded-lg p-4 bg-white">
                    <div 
                      className="w-full h-[600px] border-0 overflow-auto"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* 이미지 업로드 모달 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">이미지 업로드</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadCategory('');
                  setUploadFilename('');
                  setIsNewCategory(false);
                  (window as any).pendingUploadFile = null;
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리 (폴더명)
                </label>
                <div className="space-y-2">
                  <select
                    value={isNewCategory ? 'new' : uploadCategory}
                    onChange={(e) => {
                      if (e.target.value === 'new') {
                        setIsNewCategory(true);
                        setUploadCategory('');
                      } else {
                        setIsNewCategory(false);
                        setUploadCategory(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">카테고리 선택</option>
                    {cruiseFolders.map((folder) => (
                      <option key={folder} value={folder}>
                        {folder}
                      </option>
                    ))}
                    <option value="new">➕ 새 카테고리 추가</option>
                  </select>
                  {isNewCategory && (
                    <input
                      type="text"
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      placeholder="예: 고객 후기 자료"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {isNewCategory
                    ? '새 카테고리명을 입력하세요.'
                    : '기존 카테고리를 선택하거나 새로 추가하세요.'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  파일명 (확장자 제외)
                </label>
                <input
                  type="text"
                  value={uploadFilename}
                  onChange={(e) => setUploadFilename(e.target.value)}
                  placeholder="예: 크루즈 배경 이미지 또는 2024/크루즈/사진1"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  파일명을 입력하세요. 확장자는 자동으로 추가됩니다.
                  <br />
                  💡 <strong>하위 폴더 생성:</strong> 파일명에 슬래시(/)를 사용하면 하위 폴더가 자동으로 생성됩니다.
                  <br />
                  예: "2024/크루즈/사진1" → 크루즈정보사진/[카테고리]/2024/크루즈/사진1.jpg
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={confirmImageUpload}
                  disabled={!uploadCategory || !uploadFilename || uploading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {uploading ? '업로드 중...' : '업로드'}
                </button>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadCategory('');
                    setUploadFilename('');
                    setUploadedImageHtml('');
                    setIsNewCategory(false);
                    (window as any).pendingUploadFile = null;
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  취소
                </button>
              </div>
              
              {/* 업로드된 이미지 HTML 소스 표시 */}
              {uploadedImageHtml && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-green-800">✅ 이미지 업로드 완료!</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(uploadedImageHtml);
                        alert('HTML 소스가 클립보드에 복사되었습니다!');
                      }}
                      className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      복사
                    </button>
                  </div>
                  <div className="bg-white p-3 rounded border border-green-300">
                    <code className="text-sm text-gray-800 break-all">{uploadedImageHtml}</code>
                  </div>
                  <p className="text-xs text-green-700 mt-2">
                    💡 HTML 소스가 클립보드에 자동 복사되었습니다. HTML 코드 편집기에 붙여넣으세요.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 크루즈정보사진 선택 모달 */}
      {showCruisePhotoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">크루즈정보사진에서 선택</h3>
              <button
                onClick={() => {
                  setShowCruisePhotoModal(false);
                  setSelectedFolder('');
                  setCruiseImages([]);
                  setSelectedImageHtml('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>
            
            {!selectedFolder ? (
              <div>
                <p className="text-sm text-gray-600 mb-4">카테고리를 선택하세요:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {cruiseFolders.map((folder) => (
                    <button
                      key={folder}
                      onClick={() => loadCruiseImages(folder)}
                      className="p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-500 text-left"
                    >
                      <div className="font-medium text-gray-800">{folder}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => {
                      setSelectedFolder('');
                      setCruiseImages([]);
                      setSelectedImageHtml('');
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ← 뒤로
                  </button>
                  <span className="text-gray-600">/ {selectedFolder}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {cruiseImages.map((imageUrl) => (
                    <div
                      key={imageUrl}
                      className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform border-2 ${
                        selectedImageHtml && selectedImageHtml.includes(imageUrl)
                          ? 'border-blue-500'
                          : 'border-transparent hover:border-blue-500'
                      }`}
                      onClick={() => selectCruiseImage(imageUrl)}
                    >
                      <img
                        src={imageUrl}
                        alt="크루즈정보사진"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
                        <span className="text-white text-sm font-semibold opacity-0 hover:opacity-100">
                          선택
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {cruiseImages.length === 0 && (
                  <p className="text-center text-gray-500 py-8">이 폴더에 이미지가 없습니다.</p>
                )}
                
                {/* 선택된 이미지 HTML 소스 표시 */}
                {selectedImageHtml && (
                  <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-purple-800">✅ 이미지 선택 완료!</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedImageHtml);
                          alert('HTML 소스가 클립보드에 복사되었습니다!');
                        }}
                        className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        복사
                      </button>
                    </div>
                    <div className="bg-white p-3 rounded border border-purple-300">
                      <code className="text-sm text-gray-800 break-all">{selectedImageHtml}</code>
                    </div>
                    <p className="text-xs text-purple-700 mt-2">
                      💡 HTML 소스가 클립보드에 자동 복사되었습니다. HTML 코드 편집기에 붙여넣으세요.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 공지사항 추가/수정 모달 */}
      {showNoticeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {editingNotice ? '공지사항 수정' : '공지사항 추가'}
              </h3>
              <button
                onClick={() => {
                  setShowNoticeModal(false);
                  setEditingNotice(null);
                  setNoticeForm({
                    title: '',
                    date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
                    category: '안내',
                    content: '',
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목 *
                </label>
                <input
                  type="text"
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  placeholder="예: [공지] 2025년 신년 이벤트 안내"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    날짜 *
                  </label>
                  <input
                    type="text"
                    value={noticeForm.date}
                    onChange={(e) => setNoticeForm({ ...noticeForm, date: e.target.value })}
                    placeholder="예: 2025.01.15"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">YYYY.MM.DD 형식으로 입력하세요.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리 *
                  </label>
                  <select
                    value={noticeForm.category}
                    onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="안내">안내</option>
                    <option value="중요">중요</option>
                    <option value="이벤트">이벤트</option>
                    <option value="시스템">시스템</option>
                    <option value="신규서비스">신규서비스</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  내용 *
                </label>
                <textarea
                  value={noticeForm.content}
                  onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                  placeholder="공지사항 내용을 입력하세요..."
                  rows={10}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">줄바꿈은 그대로 표시됩니다.</p>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSaveNotice}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingNotice ? '수정하기' : '추가하기'}
                </button>
                <button
                  onClick={() => {
                    setShowNoticeModal(false);
                    setEditingNotice(null);
                    setNoticeForm({
                      title: '',
                      date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
                      category: '안내',
                      content: '',
                    });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
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
