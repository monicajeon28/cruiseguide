'use client';

import { useEffect, useState } from 'react';
import { FiChevronDown, FiChevronUp, FiPlus, FiTrash2, FiX } from 'react-icons/fi';

type ThemeSection = {
  id: string;
  enabled: boolean;
  title: string;
  subtitle?: string;
  displayType: 'carousel' | 'grid';
  themeType: 'classification' | 'cruiseLine' | 'category' | 'tag';
  themeValue: string;
  limit: number;
  linkText?: string;
  linkUrl?: string;
};

interface ThemeProductSectionsEditorProps {
  config: ThemeSection[] | undefined;
  onUpdate: (config: ThemeSection[]) => void;
  onClose: () => void;
}

const classificationOptions = [
  { value: 'popular', label: '인기 크루즈' },
  { value: 'recommended', label: '추천 크루즈' },
  { value: 'premium', label: '프리미엄 크루즈' },
  { value: 'genie', label: '지니패키지 크루즈' },
  { value: 'domestic', label: '국내출발 크루즈' },
  { value: 'japan', label: '일본 크루즈' },
  { value: 'budget', label: '알뜰 크루즈' },
];

const themeTypeOptions = [
  { value: 'classification', label: '상품 분류(배지)' },
  { value: 'cruiseLine', label: '선사별' },
  { value: 'category', label: '카테고리' },
  { value: 'tag', label: '태그/키워드' },
] as const;

export default function ThemeProductSectionsEditor({ config, onUpdate, onClose }: ThemeProductSectionsEditorProps) {
  const [localConfig, setLocalConfig] = useState<ThemeSection[]>(config ?? []);

  useEffect(() => {
    setLocalConfig(config ?? []);
  }, [config]);

  const addSection = () => {
    setLocalConfig((prev) => [
      ...prev,
      {
        id: `theme-${Date.now()}`,
        enabled: true,
        title: '새 테마 섹션',
        subtitle: '',
        displayType: 'carousel',
        themeType: 'classification',
        themeValue: 'popular',
        limit: 8,
        linkText: '전체 보기',
        linkUrl: '',
      },
    ]);
  };

  const updateSection = (index: number, updates: Partial<ThemeSection>) => {
    setLocalConfig((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates } as ThemeSection;
      return next;
    });
  };

  const moveSection = (index: number, delta: number) => {
    setLocalConfig((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  const removeSection = (id: string) => {
    setLocalConfig((prev) => prev.filter((section) => section.id !== id));
  };

  const themeValuePlaceholder = (themeType: ThemeSection['themeType']) => {
    switch (themeType) {
      case 'cruiseLine':
        return '예: MSC, 로얄캐리비안';
      case 'category':
        return '예: 허니문, 가족여행';
      case 'tag':
        return '예: #여름휴가';
      default:
        return '';
    }
  };

  const renderThemeValueField = (section: ThemeSection, index: number) => {
    if (section.themeType === 'classification') {
      return (
        <select
          value={section.themeValue}
          onChange={(e) => updateSection(index, { themeValue: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {classificationOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type="text"
        value={section.themeValue}
        onChange={(e) => updateSection(index, { themeValue: e.target.value })}
        placeholder={themeValuePlaceholder(section.themeType)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">테마형 상품 섹션 관리</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <FiX size={20} />
        </button>
      </div>

      <div className="space-y-2">
        <button
          onClick={addSection}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
        >
          <FiPlus size={18} />
          새 테마 섹션 추가
        </button>
        <p className="text-xs text-gray-500">• 분류/선사/태그 등을 지정하면 해당 상품이 자동으로 채워집니다.</p>
      </div>

      {localConfig.length === 0 ? (
        <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-500">
          아직 등록된 테마형 섹션이 없습니다. 상단의 버튼을 눌러 추가해 주세요.
        </div>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
          {localConfig.map((section, index) => (
            <div key={section.id} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-600">섹션 {index + 1}</span>
                  <div className="flex items-center gap-1 text-gray-400">
                    <button
                      onClick={() => moveSection(index, -1)}
                      disabled={index === 0}
                      className="p-1 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="위로 이동"
                    >
                      <FiChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => moveSection(index, 1)}
                      disabled={index === localConfig.length - 1}
                      className="p-1 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="아래로 이동"
                    >
                      <FiChevronDown size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <input
                      type="checkbox"
                      checked={section.enabled}
                      onChange={(e) => updateSection(index, { enabled: e.target.checked })}
                      className="w-4 h-4"
                    />
                    활성화
                  </label>
                  <button
                    onClick={() => removeSection(section.id)}
                    className="text-red-600 hover:text-red-700"
                    title="섹션 삭제"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">섹션 제목</label>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSection(index, { title: e.target.value })}
                    placeholder="예: 프리미엄 크루즈 베스트"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">설명 문구 (선택)</label>
                  <input
                    type="text"
                    value={section.subtitle ?? ''}
                    onChange={(e) => updateSection(index, { subtitle: e.target.value })}
                    placeholder="예: 혜택 가득한 프리미엄 크루즈 상품"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">노출 방식</label>
                  <select
                    value={section.displayType}
                    onChange={(e) => updateSection(index, { displayType: e.target.value as ThemeSection['displayType'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="carousel">가로 슬라이더</option>
                    <option value="grid">그리드 목록</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">표시 개수</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={section.limit}
                    onChange={(e) => updateSection(index, { limit: Math.max(1, Number(e.target.value) || 1) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">테마 기준</label>
                  <select
                    value={section.themeType}
                    onChange={(e) => {
                      const themeType = e.target.value as ThemeSection['themeType'];
                      updateSection(index, {
                        themeType,
                        themeValue: themeType === 'classification' ? 'popular' : '',
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {themeTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">세부 조건</label>
                  {renderThemeValueField(section, index)}
                  <p className="text-xs text-gray-500 mt-1">• 조건에 맞는 상품이 자동으로 채워집니다.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">링크 텍스트</label>
                  <input
                    type="text"
                    value={section.linkText ?? ''}
                    onChange={(e) => updateSection(index, { linkText: e.target.value })}
                    placeholder="예: 전체 보기"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">링크 URL</label>
                  <input
                    type="text"
                    value={section.linkUrl ?? ''}
                    onChange={(e) => updateSection(index, { linkUrl: e.target.value })}
                    placeholder="예: /mall/products/premium"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => onUpdate(localConfig)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        변경사항 적용하기
      </button>
    </div>
  );
}



