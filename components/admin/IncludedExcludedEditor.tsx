// components/admin/IncludedExcludedEditor.tsx
// 포함/불포함 사항 편집기

'use client';

import { useState } from 'react';
import { FiPlus, FiX, FiEdit2 } from 'react-icons/fi';

interface IncludedExcludedEditorProps {
  included: string[];
  excluded: string[];
  onChange: (included: string[], excluded: string[]) => void;
}

export default function IncludedExcludedEditor({
  included,
  excluded,
  onChange
}: IncludedExcludedEditorProps) {
  const [editingIncludedIndex, setEditingIncludedIndex] = useState<number | null>(null);
  const [editingExcludedIndex, setEditingExcludedIndex] = useState<number | null>(null);
  const [newIncludedItem, setNewIncludedItem] = useState('');
  const [newExcludedItem, setNewExcludedItem] = useState('');

  const addIncludedItem = () => {
    if (newIncludedItem.trim()) {
      onChange([...included, newIncludedItem.trim()], excluded);
      setNewIncludedItem('');
    }
  };

  const addExcludedItem = () => {
    if (newExcludedItem.trim()) {
      onChange(included, [...excluded, newExcludedItem.trim()]);
      setNewExcludedItem('');
    }
  };

  const updateIncludedItem = (index: number, value: string) => {
    const newIncluded = [...included];
    newIncluded[index] = value;
    onChange(newIncluded, excluded);
    setEditingIncludedIndex(null);
  };

  const updateExcludedItem = (index: number, value: string) => {
    const newExcluded = [...excluded];
    newExcluded[index] = value;
    onChange(included, newExcluded);
    setEditingExcludedIndex(null);
  };

  const removeIncludedItem = (index: number) => {
    if (confirm('이 항목을 삭제하시겠습니까?')) {
      const newIncluded = included.filter((_, i) => i !== index);
      onChange(newIncluded, excluded);
    }
  };

  const removeExcludedItem = (index: number) => {
    if (confirm('이 항목을 삭제하시겠습니까?')) {
      const newExcluded = excluded.filter((_, i) => i !== index);
      onChange(included, newExcluded);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 포함 사항 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-green-700">✅ 포함 사항</h3>
        </div>
        
        <div className="space-y-2">
          {included.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              {editingIncludedIndex === index ? (
                <input
                  type="text"
                  defaultValue={item}
                  onBlur={(e) => updateIncludedItem(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateIncludedItem(index, e.currentTarget.value);
                    } else if (e.key === 'Escape') {
                      setEditingIncludedIndex(null);
                    }
                  }}
                  autoFocus
                  className="flex-1 px-2 py-1 border border-green-300 rounded focus:ring-2 focus:ring-green-500"
                />
              ) : (
                <>
                  <span className="flex-1 text-sm text-gray-700">{item}</span>
                  <button
                    onClick={() => setEditingIncludedIndex(index)}
                    className="p-1 text-green-600 hover:text-green-700"
                    title="수정"
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    onClick={() => removeIncludedItem(index)}
                    className="p-1 text-red-600 hover:text-red-700"
                    title="삭제"
                  >
                    <FiX size={16} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newIncludedItem}
            onChange={(e) => setNewIncludedItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addIncludedItem();
              }
            }}
            placeholder="포함 사항 추가..."
            className="flex-1 px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={addIncludedItem}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            <FiPlus size={18} />
          </button>
        </div>
      </div>

      {/* 불포함 사항 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-red-700">❌ 불포함 사항</h3>
        </div>
        
        <div className="space-y-2">
          {excluded.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              {editingExcludedIndex === index ? (
                <input
                  type="text"
                  defaultValue={item}
                  onBlur={(e) => updateExcludedItem(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateExcludedItem(index, e.currentTarget.value);
                    } else if (e.key === 'Escape') {
                      setEditingExcludedIndex(null);
                    }
                  }}
                  autoFocus
                  className="flex-1 px-2 py-1 border border-red-300 rounded focus:ring-2 focus:ring-red-500"
                />
              ) : (
                <>
                  <span className="flex-1 text-sm text-gray-700">{item}</span>
                  <button
                    onClick={() => setEditingExcludedIndex(index)}
                    className="p-1 text-red-600 hover:text-red-700"
                    title="수정"
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    onClick={() => removeExcludedItem(index)}
                    className="p-1 text-red-600 hover:text-red-700"
                    title="삭제"
                  >
                    <FiX size={16} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newExcludedItem}
            onChange={(e) => setNewExcludedItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addExcludedItem();
              }
            }}
            placeholder="불포함 사항 추가..."
            className="flex-1 px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
          />
          <button
            onClick={addExcludedItem}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            <FiPlus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}











