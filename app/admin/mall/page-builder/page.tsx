// app/admin/mall/page-builder/page.tsx
// 메인페이지 시각적 편집기 (노코드)

'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiMove, FiEye, FiSave, FiX } from 'react-icons/fi';
import { showSuccess, showError } from '@/components/ui/Toast';
import Link from 'next/link';

interface Section {
  id: number;
  section: string;
  key: string;
  type: string;
  content: any;
  order: number;
  isActive: boolean;
}

interface SectionTemplate {
  type: string;
  name: string;
  icon: string;
  description: string;
}

const SECTION_TEMPLATES: SectionTemplate[] = [
  {
    type: 'popular-banner',
    name: '인기크루즈 배너',
    icon: '🎯',
    description: '인기크루즈 섹션 배너 (제목, 버튼 3개, 배지)',
  },
  {
    type: 'recommended-banner',
    name: '추천크루즈 배너',
    icon: '⭐',
    description: '추천크루즈 섹션 배너 (제목, 버튼 3개, 배지)',
  },
  {
    type: 'product-list-popular',
    name: '인기크루즈 상품 리스트',
    icon: '📦',
    description: '인기크루즈 상품을 표시하는 리스트 (1줄 또는 2줄)',
  },
  {
    type: 'product-list-recommended',
    name: '추천크루즈 상품 리스트',
    icon: '📋',
    description: '추천크루즈 상품을 표시하는 리스트 (1줄 또는 2줄)',
  },
  {
    type: 'menu-bar',
    name: '메뉴바 (필터)',
    icon: '📑',
    description: '지역별 필터 메뉴바',
  },
  {
    type: 'custom-banner',
    name: '커스텀 배너',
    icon: '🖼️',
    description: '이미지, 제목, 링크가 있는 커스텀 배너',
  },
  {
    type: 'custom-product-list',
    name: '커스텀 상품 리스트',
    icon: '🛍️',
    description: '특정 카테고리의 상품을 표시하는 리스트',
  },
];

export default function PageBuilderPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/mall/sections', {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.ok && data.sections) {
        // order 순서로 정렬
        const sorted = data.sections.sort((a: Section, b: Section) => a.order - b.order);
        setSections(sorted);
      }
    } catch (error) {
      console.error('Failed to load sections:', error);
      showError('섹션을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = async (template: SectionTemplate) => {
    try {
      const newSection: Partial<Section> = {
        section: 'main-page',
        key: `${template.type}-${Date.now()}`,
        type: template.type,
        content: getDefaultContent(template.type),
        order: sections.length,
        isActive: true,
      };

      const response = await fetch('/api/admin/mall/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newSection),
      });

      const data = await response.json();

      if (data.ok) {
        showSuccess('섹션이 추가되었습니다!');
        setShowAddModal(false);
        loadSections();
      } else {
        showError(data.error || '섹션 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to add section:', error);
      showError('섹션 추가에 실패했습니다.');
    }
  };

  const handleDeleteSection = async (id: number) => {
    if (!confirm('이 섹션을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/mall/sections/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.ok) {
        showSuccess('섹션이 삭제되었습니다!');
        loadSections();
      } else {
        showError(data.error || '섹션 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to delete section:', error);
      showError('섹션 삭제에 실패했습니다.');
    }
  };

  const handleSaveSection = async (section: Section) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/mall/sections/${section.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(section),
      });

      const data = await response.json();

      if (data.ok) {
        showSuccess('섹션이 저장되었습니다!');
        setEditingSection(null);
        loadSections();
      } else {
        showError(data.error || '섹션 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to save section:', error);
      showError('섹션 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleMoveSection = async (fromIndex: number, toIndex: number) => {
    const newSections = [...sections];
    const [moved] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, moved);

    // order 업데이트
    const updatedSections = newSections.map((section, index) => ({
      ...section,
      order: index,
    }));

    setSections(updatedSections);

    // API로 순서 저장
    try {
      await Promise.all(
        updatedSections.map((section) =>
          fetch(`/api/admin/mall/sections/${section.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ order: section.order }),
          })
        )
      );
    } catch (error) {
      console.error('Failed to update order:', error);
      loadSections(); // 실패 시 원래대로 복구
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    handleMoveSection(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const getDefaultContent = (type: string): any => {
    switch (type) {
      case 'popular-banner':
        return {
          title: '인기 크루즈',
          buttons: [
            { text: '프리미엄 서비스 보장', icon: '✓' },
            { text: '지니 AI 가이드 서비스 지원', icon: '✓' },
            { text: '확실한 출발 100%', icon: '✓' },
          ],
          rightBadge: { topText: '신뢰할 수 있는', bottomText: '한국 여행사' },
        };
      case 'recommended-banner':
        return {
          title: '추천 크루즈',
          buttons: [
            { text: '10년 승무원 출신 인솔자', icon: '✓' },
            { text: '한국 전문 크루즈 여행사', icon: '✓' },
            { text: '빠르고 신속한 한국여행사', icon: '✓' },
          ],
          rightBadge: { topText: '신뢰할 수 있는', bottomText: '한국 여행사' },
        };
      case 'product-list-popular':
      case 'product-list-recommended':
        return {
          rows: 1,
          title: '',
        };
      case 'menu-bar':
        return {
          filters: [
            { value: 'all', label: '전체', enabled: true },
            { value: 'japan', label: '일본', enabled: true },
            { value: 'southeast-asia', label: '동남아', enabled: true },
          ],
        };
      case 'custom-banner':
        return {
          image: '',
          title: '',
          link: '',
          backgroundColor: '#667eea',
        };
      case 'custom-product-list':
        return {
          title: '',
          category: '',
          count: 4,
          rows: 1,
        };
      default:
        return {};
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">섹션을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">메인페이지 시각적 편집기</h1>
            <p className="text-gray-600">마우스로 섹션을 추가하고, 순서를 변경하고, 내용을 편집할 수 있습니다.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              target="_blank"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <FiEye size={18} />
              미리보기
            </Link>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FiPlus size={18} />
              섹션 추가
            </button>
          </div>
        </div>
      </div>

      {/* 섹션 목록 */}
      <div className="space-y-4">
        {sections.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">아직 추가된 섹션이 없습니다.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              첫 번째 섹션 추가하기
            </button>
          </div>
        ) : (
          sections.map((section, index) => {
            const template = SECTION_TEMPLATES.find((t) => t.type === section.type);
            return (
              <div
                key={section.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`bg-white rounded-lg shadow-md p-6 border-2 transition-all ${
                  draggedIndex === index ? 'border-blue-500 opacity-50' : 'border-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="cursor-move text-gray-400 hover:text-gray-600">
                      <FiMove size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{template?.icon || '📦'}</span>
                        <h3 className="text-xl font-bold text-gray-800">
                          {template?.name || section.type}
                        </h3>
                        {!section.isActive && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">비활성화</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{template?.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingSection(section)}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
                    >
                      <FiEdit2 size={18} />
                      편집
                    </button>
                    <button
                      onClick={() => handleDeleteSection(section.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                    >
                      <FiTrash2 size={18} />
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 섹션 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">섹션 추가</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SECTION_TEMPLATES.map((template) => (
                  <button
                    key={template.type}
                    onClick={() => handleAddSection(template)}
                    className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="text-4xl mb-3">{template.icon}</div>
                    <h3 className="font-bold text-gray-800 mb-2">{template.name}</h3>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 섹션 편집 모달 */}
      {editingSection && (
        <SectionEditModal
          section={editingSection}
          onSave={handleSaveSection}
          onClose={() => setEditingSection(null)}
          saving={saving}
        />
      )}
    </div>
  );
}

// 섹션 편집 모달 컴포넌트
function SectionEditModal({
  section,
  onSave,
  onClose,
  saving,
}: {
  section: Section;
  onSave: (section: Section) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [editedSection, setEditedSection] = useState<Section>(section);

  const handleContentChange = (path: string, value: any) => {
    setEditedSection({
      ...editedSection,
      content: {
        ...editedSection.content,
        [path]: value,
      },
    });
  };

  const handleNestedContentChange = (path: string[], value: any) => {
    const newContent = { ...editedSection.content };
    let current: any = newContent;
    for (let i = 0; i < path.length - 1; i++) {
      current[path[i]] = { ...current[path[i]] };
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    setEditedSection({ ...editedSection, content: newContent });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">섹션 편집</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX size={24} />
          </button>
        </div>
        <div className="p-6 space-y-6">
          {/* 활성화 여부 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">활성화 여부</label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editedSection.isActive}
                onChange={(e) =>
                  setEditedSection({ ...editedSection, isActive: e.target.checked })
                }
                className="w-5 h-5"
              />
              <span>이 섹션을 표시합니다</span>
            </label>
          </div>

          {/* 섹션 타입별 편집 폼 */}
          {editedSection.type === 'popular-banner' || editedSection.type === 'recommended-banner' ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">배너 제목</label>
                <input
                  type="text"
                  value={editedSection.content.title || ''}
                  onChange={(e) => handleContentChange('title', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">버튼 (최대 3개)</label>
                <div className="space-y-2">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={editedSection.content.buttons?.[index]?.text || ''}
                        onChange={(e) => {
                          const newButtons = [...(editedSection.content.buttons || [])];
                          if (!newButtons[index]) newButtons[index] = { text: '', icon: '✓' };
                          newButtons[index].text = e.target.value;
                          handleContentChange('buttons', newButtons);
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`버튼 ${index + 1} 텍스트`}
                      />
                      <input
                        type="text"
                        value={editedSection.content.buttons?.[index]?.icon || '✓'}
                        onChange={(e) => {
                          const newButtons = [...(editedSection.content.buttons || [])];
                          if (!newButtons[index]) newButtons[index] = { text: '', icon: '✓' };
                          newButtons[index].icon = e.target.value;
                          handleContentChange('buttons', newButtons);
                        }}
                        className="w-20 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="아이콘"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">배지 상단 텍스트</label>
                  <input
                    type="text"
                    value={editedSection.content.rightBadge?.topText || ''}
                    onChange={(e) =>
                      handleNestedContentChange(['rightBadge', 'topText'], e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">배지 하단 텍스트</label>
                  <input
                    type="text"
                    value={editedSection.content.rightBadge?.bottomText || ''}
                    onChange={(e) =>
                      handleNestedContentChange(['rightBadge', 'bottomText'], e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </>
          ) : editedSection.type === 'product-list-popular' ||
            editedSection.type === 'product-list-recommended' ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">섹션 제목</label>
                <input
                  type="text"
                  value={editedSection.content.title || ''}
                  onChange={(e) => handleContentChange('title', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="비워두면 기본 제목 사용"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">표시 줄 수</label>
                <select
                  value={editedSection.content.rows || 1}
                  onChange={(e) => handleContentChange('rows', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>1줄 (가로 스크롤)</option>
                  <option value={2}>2줄 (그리드)</option>
                </select>
              </div>
            </>
          ) : editedSection.type === 'custom-banner' ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">배너 이미지 URL</label>
                <input
                  type="text"
                  value={editedSection.content.image || ''}
                  onChange={(e) => handleContentChange('image', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="/images/banner.jpg 또는 https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">배너 제목</label>
                <input
                  type="text"
                  value={editedSection.content.title || ''}
                  onChange={(e) => handleContentChange('title', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">링크 URL</label>
                <input
                  type="text"
                  value={editedSection.content.link || ''}
                  onChange={(e) => handleContentChange('link', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="/products 또는 https://..."
                />
              </div>
            </>
          ) : null}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => onSave(editedSection)}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FiSave size={20} />
              {saving ? '저장 중...' : '저장하기'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


