'use client';

import { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiPlus, FiTrash2, FiX } from 'react-icons/fi';

type LandingMenuItem = {
  id: string;
  enabled: boolean;
  text: string;
  urlSlug: string;
  order: number;
};

type LandingPageMenuBarConfig = {
  enabled: boolean;
  position: 'top' | 'left';
  displayType: 'full' | 'button';
  buttonPosition: 'left-top' | 'right-top';
  menuItems: LandingMenuItem[];
};

interface LandingPageMenuBarEditorProps {
  config: LandingPageMenuBarConfig;
  onUpdate: (config: LandingPageMenuBarConfig) => void;
  onClose: () => void;
}

export default function LandingPageMenuBarEditor({ config, onUpdate, onClose }: LandingPageMenuBarEditorProps) {
  const [localConfig, setLocalConfig] = useState(config);

  const addMenuItem = () => {
    setLocalConfig((prev) => ({
      ...prev,
      menuItems: [
        ...prev.menuItems,
        {
          id: `landing-menu-${Date.now()}`,
          enabled: true,
          text: '새 메뉴',
          urlSlug: '/',
          order: prev.menuItems.length + 1,
        },
      ],
    }));
  };

  const updateMenuItem = (index: number, updates: Partial<LandingMenuItem>) => {
    setLocalConfig((prev) => {
      const next = [...prev.menuItems];
      next[index] = { ...next[index], ...updates };
      return { ...prev, menuItems: next };
    });
  };

  const removeMenuItem = (id: string) => {
    setLocalConfig((prev) => ({
      ...prev,
      menuItems: prev.menuItems
        .filter((item) => item.id !== id)
        .map((item, idx) => ({ ...item, order: idx + 1 })),
    }));
  };

  const moveMenuItem = (index: number, direction: 'up' | 'down') => {
    setLocalConfig((prev) => {
      const next = [...prev.menuItems];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return {
        ...prev,
        menuItems: next.map((item, idx) => ({ ...item, order: idx + 1 })),
      };
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">랜딩페이지 메뉴바 설정</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <FiX size={20} />
        </button>
      </div>

      <div>
        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={localConfig.enabled}
            onChange={(e) => setLocalConfig({ ...localConfig, enabled: e.target.checked })}
            className="w-5 h-5"
          />
          <span className="font-semibold">랜딩페이지 메뉴바 활성화</span>
        </label>
        <p className="text-xs text-gray-500 mt-2">• 체크 해제 시 랜딩페이지 메뉴바가 표시되지 않습니다.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">메뉴바 위치</label>
          <select
            value={localConfig.position}
            onChange={(e) => setLocalConfig({ ...localConfig, position: e.target.value as 'top' | 'left' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="top">상단</option>
            <option value="left">왼쪽</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">표시 방식</label>
          <select
            value={localConfig.displayType}
            onChange={(e) => setLocalConfig({ ...localConfig, displayType: e.target.value as 'full' | 'button' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="full">전체 메뉴</option>
            <option value="button">버튼형</option>
          </select>
        </div>
      </div>

      {localConfig.displayType === 'button' && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">버튼 위치</label>
          <select
            value={localConfig.buttonPosition}
            onChange={(e) => setLocalConfig({ ...localConfig, buttonPosition: e.target.value as 'left-top' | 'right-top' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="left-top">왼쪽 상단</option>
            <option value="right-top">오른쪽 상단</option>
          </select>
        </div>
      )}

      <div className="mb-2">
        <button
          onClick={addMenuItem}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
        >
          <FiPlus size={18} />
          새 메뉴 항목 추가
        </button>
        <p className="text-xs text-gray-500 mt-2">• 랜딩페이지 메뉴바에 표시될 메뉴 항목을 추가할 수 있습니다.</p>
      </div>

      {localConfig.menuItems.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          추가된 메뉴 항목이 없습니다.
        </div>
      ) : (
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {localConfig.menuItems
            .sort((a, b) => a.order - b.order)
            .map((item, index) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-800">메뉴 항목 {index + 1}</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => moveMenuItem(index, 'up')}
                      disabled={index === 0}
                      className="text-gray-600 hover:text-gray-800 disabled:opacity-30"
                      title="위로 이동"
                    >
                      <FiChevronUp size={18} />
                    </button>
                    <button
                      onClick={() => moveMenuItem(index, 'down')}
                      disabled={index === localConfig.menuItems.length - 1}
                      className="text-gray-600 hover:text-gray-800 disabled:opacity-30"
                      title="아래로 이동"
                    >
                      <FiChevronDown size={18} />
                    </button>
                    <button
                      onClick={() => removeMenuItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                      title="삭제"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(e) => updateMenuItem(index, { enabled: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-semibold">활성화</span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">메뉴 텍스트</label>
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => updateMenuItem(index, { text: e.target.value })}
                    placeholder="예: 홈"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">영어 주소 (URL)</label>
                  <input
                    type="text"
                    value={item.urlSlug}
                    onChange={(e) => updateMenuItem(index, { urlSlug: e.target.value })}
                    placeholder="예: /landing"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">• 반드시 '/'로 시작해야 합니다. 예: /, /products</p>
                </div>
              </div>
            ))}
        </div>
      )}

      <button
        onClick={() => onUpdate(localConfig)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        적용하기
      </button>
    </div>
  );
}



