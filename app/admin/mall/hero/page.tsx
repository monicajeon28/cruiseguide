'use client';

import { useState, useEffect, useRef } from 'react';
import { FiImage, FiX, FiPlus, FiChevronUp, FiChevronDown, FiTrash2, FiSave, FiEye } from 'react-icons/fi';
import { showSuccess, showError } from '@/components/ui/Toast';

interface Banner {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  button1Text: string;
  button1Link: string;
  button2Text: string;
  button2Link: string;
  order: number;
}

export default function HeroBannerManagement() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/mall/hero-banner?section=hero-banner', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Hero Banner] API Response:', data);

      if (data.ok && data.banners) {
        console.log('[Hero Banner] Loaded banners:', data.banners.length);
        setBanners(data.banners);
      } else {
        console.warn('[Hero Banner] No banners found or invalid response');
        setBanners([]);
      }
    } catch (error) {
      console.error('[Hero Banner] Failed to load banners:', error);
      showError(`배너를 불러오는데 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      setBanners([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'image');

    const response = await fetch('/api/admin/mall/upload', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();
    if (!data.ok || !data.url) {
      throw new Error(data.error || '이미지 업로드 실패');
    }

    return data.url;
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, banner: Banner | null) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imageUrl = await handleImageUpload(file);
      if (banner) {
        setEditingBanner({ ...banner, image: imageUrl });
      } else {
        setEditingBanner({
          id: 0,
          image: imageUrl,
          title: '',
          subtitle: '',
          button1Text: '',
          button1Link: '',
          button2Text: '',
          button2Link: '',
          order: banners.length,
        });
      }
    } catch (error: any) {
      showError(error.message || '이미지 업로드에 실패했습니다.');
    }
  };

  const handleSave = async () => {
    if (!editingBanner) return;

    if (!editingBanner.image) {
      showError('이미지를 업로드해주세요.');
      return;
    }

    try {
      setIsSaving(true);
      const url = editingBanner.id > 0
        ? '/api/admin/mall/hero-banner'
        : '/api/admin/mall/hero-banner';
      const method = editingBanner.id > 0 ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...(editingBanner.id > 0 && { id: editingBanner.id }),
          image: editingBanner.image,
          title: editingBanner.title,
          subtitle: editingBanner.subtitle,
          button1Text: editingBanner.button1Text,
          button1Link: editingBanner.button1Link,
          button2Text: editingBanner.button2Text,
          button2Link: editingBanner.button2Link,
          order: editingBanner.order,
        }),
      });

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || '저장에 실패했습니다.');
      }

      showSuccess('배너가 저장되었습니다.');
      setEditingBanner(null);
      setIsAddingNew(false);
      loadBanners();
    } catch (error: any) {
      showError(error.message || '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말로 이 배너를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/mall/hero-banner?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || '삭제에 실패했습니다.');
      }

      showSuccess('배너가 삭제되었습니다.');
      loadBanners();
    } catch (error: any) {
      showError(error.message || '삭제에 실패했습니다.');
    }
  };

  const handleOrderChange = async (id: number, direction: 'up' | 'down') => {
    const banner = banners.find(b => b.id === id);
    if (!banner) return;

    const currentIndex = banners.findIndex(b => b.id === id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= banners.length) return;

    const newBanners = [...banners];
    [newBanners[currentIndex], newBanners[newIndex]] = [newBanners[newIndex], newBanners[currentIndex]];

    // 순서 업데이트
    try {
      await Promise.all(
        newBanners.map((b, index) =>
          fetch('/api/admin/mall/hero-banner', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              id: b.id,
              ...b,
              order: index,
            }),
          })
        )
      );
      loadBanners();
    } catch (error) {
      showError('순서 변경에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              🎨 히어로 섹션 관리
            </h1>
            <p className="text-gray-600">
              크루즈몰 메인 페이지 하단의 큰 배너를 관리합니다. 이미지, 텍스트, 버튼 링크를 설정할 수 있습니다.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <FiEye />
              {previewMode ? '편집 모드' : '미리보기'}
            </button>
            <a
              href="/"
              target="_blank"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              메인몰 보기
            </a>
          </div>
        </div>
      </div>

      {/* 미리보기 모드 */}
      {previewMode && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">미리보기</h2>
          <div className="relative w-full h-80 md:h-96 lg:h-[500px] rounded-xl overflow-hidden shadow-2xl">
            {banners.length > 0 ? (
              <div className="relative w-full h-full">
                {banners.map((banner, index) => (
                  <a
                    key={banner.id}
                    href={banner.button1Link || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`absolute inset-0 transition-opacity duration-500 block ${
                      index === 0 ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <div
                      className="w-full h-full relative flex items-center justify-center text-white"
                      style={{
                        backgroundImage: `url(${banner.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      <div className="absolute inset-0 bg-black/50"></div>
                      <div className="relative z-10 text-center px-6 md:px-8">
                        <h3 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 md:mb-6 drop-shadow-2xl">
                          {banner.title || '제목 없음'}
                        </h3>
                        {banner.subtitle && (
                          <p className="text-xl md:text-2xl lg:text-3xl opacity-95 drop-shadow-lg mb-6 md:mb-8 font-bold">
                            {banner.subtitle}
                          </p>
                        )}
                        <div className="flex flex-wrap justify-center gap-4 mt-8">
                          {banner.button1Text && (
                            <span className="bg-white/30 backdrop-blur-md px-6 py-3 rounded-full text-base md:text-lg font-black shadow-2xl border-2 border-white/50">
                              ✓ {banner.button1Text}
                            </span>
                          )}
                          {banner.button2Text && (
                            <span className="bg-white/30 backdrop-blur-md px-6 py-3 rounded-full text-base md:text-lg font-black shadow-2xl border-2 border-white/50">
                              ✓ {banner.button2Text}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                배너가 없습니다. 배너를 추가해주세요.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 배너 목록 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">배너 목록</h2>
          <button
            onClick={() => {
              setIsAddingNew(true);
              setEditingBanner({
                id: 0,
                image: '',
                title: '',
                subtitle: '',
                button1Text: '',
                button1Link: '',
                button2Text: '',
                button2Link: '',
                order: banners.length,
              });
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FiPlus />
            배너 추가
          </button>
        </div>

        <div className="space-y-4">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors"
            >
              <div className="flex gap-4">
                {/* 이미지 미리보기 */}
                <div className="w-32 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {banner.image ? (
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('[Hero Banner] Image load error:', banner.image);
                        (e.target as HTMLImageElement).src = '/images/promotion-banner-bg.png';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <FiImage size={24} />
                    </div>
                  )}
                </div>

                {/* 배너 정보 */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800 mb-1">
                        {banner.title || '제목 없음'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {banner.subtitle || '서브타이틀 없음'}
                      </p>
                      <div className="flex gap-2 text-xs text-gray-500">
                        {banner.button1Text && (
                          <span>버튼1: {banner.button1Text} ({banner.button1Link || '링크 없음'})</span>
                        )}
                        {banner.button2Text && (
                          <span>버튼2: {banner.button2Text} ({banner.button2Link || '링크 없음'})</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOrderChange(banner.id, 'up')}
                        disabled={index === 0}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title="위로 이동"
                      >
                        <FiChevronUp />
                      </button>
                      <button
                        onClick={() => handleOrderChange(banner.id, 'down')}
                        disabled={index === banners.length - 1}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title="아래로 이동"
                      >
                        <FiChevronDown />
                      </button>
                      <button
                        onClick={() => setEditingBanner(banner)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="편집"
                      >
                        <FiSave />
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="삭제"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {banners.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <FiImage size={48} className="mx-auto mb-4" />
              <p>배너가 없습니다. "배너 추가" 버튼을 클릭하여 배너를 추가하세요.</p>
            </div>
          )}
        </div>
      </div>

      {/* 편집 모달 */}
      {(editingBanner || isAddingNew) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {isAddingNew ? '배너 추가' : '배너 편집'}
              </h2>
              <button
                onClick={() => {
                  setEditingBanner(null);
                  setIsAddingNew(false);
                }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>

            {editingBanner && (
              <div className="space-y-6">
                {/* 이미지 업로드 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    배경 이미지 <span className="text-red-600">*</span>
                  </label>
                  <div className="flex gap-4">
                    {editingBanner.image && (
                      <div className="w-48 h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={editingBanner.image}
                          alt="배너 미리보기"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('[Hero Banner] Preview image load error:', editingBanner.image);
                            (e.target as HTMLImageElement).src = '/images/promotion-banner-bg.png';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, editingBanner)}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <FiImage />
                        {editingBanner.image ? '이미지 변경' : '이미지 업로드'}
                      </button>
                      <p className="text-xs text-gray-500 mt-2">
                        권장 크기: 1920x500px 이상
                      </p>
                    </div>
                  </div>
                </div>

                {/* 메인 헤드라인 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    메인 헤드라인
                  </label>
                  <input
                    type="text"
                    value={editingBanner.title}
                    onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                    placeholder="예: 특별 할인 이벤트"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* 서브 헤드라인 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    서브 헤드라인
                  </label>
                  <input
                    type="text"
                    value={editingBanner.subtitle}
                    onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                    placeholder="예: 프리미엄 크루즈 여행을 지금 만나보세요"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* 버튼 1 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      버튼 1 텍스트
                    </label>
                    <input
                      type="text"
                      value={editingBanner.button1Text}
                      onChange={(e) => setEditingBanner({ ...editingBanner, button1Text: e.target.value })}
                      placeholder="예: 프리미엄 서비스"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      버튼 1 링크
                    </label>
                    <input
                      type="text"
                      value={editingBanner.button1Link}
                      onChange={(e) => setEditingBanner({ ...editingBanner, button1Link: e.target.value })}
                      placeholder="예: /products 또는 http://..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* 버튼 2 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      버튼 2 텍스트
                    </label>
                    <input
                      type="text"
                      value={editingBanner.button2Text}
                      onChange={(e) => setEditingBanner({ ...editingBanner, button2Text: e.target.value })}
                      placeholder="예: 신뢰할 수 있는 여행사"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      버튼 2 링크
                    </label>
                    <input
                      type="text"
                      value={editingBanner.button2Link}
                      onChange={(e) => setEditingBanner({ ...editingBanner, button2Link: e.target.value })}
                      placeholder="예: /products 또는 http://..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* 저장 버튼 */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setEditingBanner(null);
                      setIsAddingNew(false);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !editingBanner.image}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSaving ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

