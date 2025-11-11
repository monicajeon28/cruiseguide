// components/admin/AutocompleteInput.tsx
// 자동완성 입력 필드 컴포넌트

'use client';

import { useState, useRef, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

export default function AutocompleteInput({
  value,
  onChange,
  options,
  placeholder = '',
  label,
  required = false,
  className = '',
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 입력값 변경 시 필터링
  useEffect(() => {
    if (inputValue.trim() === '') {
      setFilteredOptions(options.slice(0, 10)); // 처음 10개만 표시
    } else {
      // 검색어 정규화 (공백 제거, 소문자 변환)
      const normalizedQuery = inputValue.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9가-힣]/g, '');
      const filtered = options.filter(option => {
        // 옵션도 정규화하여 비교
        const normalizedOption = option.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9가-힣]/g, '');
        return normalizedOption.includes(normalizedQuery);
      });
      setFilteredOptions(filtered.slice(0, 10)); // 최대 10개만 표시
    }
  }, [inputValue, options]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleSelect = (option: string) => {
    setInputValue(option);
    onChange(option);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      inputRef.current?.focus();
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          required={required}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="button"
          onClick={handleToggleDropdown}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FiChevronDown size={20} className={isOpen ? 'rotate-180 transition-transform' : ''} />
        </button>
      </div>

      {/* 드롭다운 목록 */}
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredOptions.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(option)}
              className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors"
            >
              {option}
            </button>
          ))}
          {filteredOptions.length === 10 && options.length > 10 && (
            <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
              더 많은 결과가 있습니다. 검색어를 입력하세요.
            </div>
          )}
        </div>
      )}

      {/* 검색 결과 없음 */}
      {isOpen && inputValue.trim() !== '' && filteredOptions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="px-4 py-2 text-sm text-gray-500">
            검색 결과가 없습니다. 직접 입력하세요.
          </div>
        </div>
      )}
    </div>
  );
}




