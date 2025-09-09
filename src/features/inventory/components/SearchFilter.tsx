// ================================
// 庫存管理系統 - 搜索和篩選組件
// ================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  SearchIcon,
  FilterIcon,
  XIcon,
  CalendarIcon,
  ChevronDownIcon,
  SortAscIcon,
  SortDescIcon,
} from 'lucide-react';

// ================================
// 基礎搜索組件
// ================================

export interface SearchBoxProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  size?: 'small' | 'medium' | 'large';
  allowClear?: boolean;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  placeholder = '搜索...',
  value = '',
  onChange,
  onSearch,
  size = 'medium',
  allowClear = true,
  loading = false,
  disabled = false,
  className = '',
}) => {
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch?.(internalValue);
    }
  };

  const handleClear = () => {
    setInternalValue('');
    onChange?.('');
    onSearch?.('');
  };

  const sizeClasses = {
    small: 'h-8 text-sm',
    medium: 'h-10 text-base',
    large: 'h-12 text-lg',
  };

  const paddingClasses = {
    small: 'pl-8 pr-8',
    medium: 'pl-10 pr-10',
    large: 'pl-12 pr-12',
  };

  const iconSizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-5 w-5',
    large: 'h-6 w-6',
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {loading ? (
          <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${iconSizeClasses[size]}`} />
        ) : (
          <SearchIcon className={`text-gray-400 ${iconSizeClasses[size]}`} />
        )}
      </div>
      
      <input
        type="text"
        placeholder={placeholder}
        value={internalValue}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        disabled={disabled}
        className={`
          block w-full ${sizeClasses[size]} ${paddingClasses[size]}
          border border-gray-300 rounded-md
          focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:text-gray-500
          ${disabled ? 'cursor-not-allowed' : ''}
        `}
      />
      
      {allowClear && internalValue && !disabled && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <button
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600"
          >
            <XIcon className={iconSizeClasses[size]} />
          </button>
        </div>
      )}
    </div>
  );
};

// ================================
// 篩選選項定義
// ================================

export interface FilterOption {
  label: string;
  value: string | number;
  count?: number;
}

export interface FilterGroup {
  key: string;
  title: string;
  type: 'select' | 'multiSelect' | 'dateRange' | 'numberRange' | 'checkbox';
  options?: FilterOption[];
  placeholder?: string;
  defaultValue?: any;
}

export interface ActiveFilter {
  key: string;
  title: string;
  value: any;
  label: string;
}

// ================================
// 高級篩選組件
// ================================

export interface AdvancedFilterProps {
  filterGroups: FilterGroup[];
  activeFilters: ActiveFilter[];
  onFilterChange: (filters: ActiveFilter[]) => void;
  onReset?: () => void;
  className?: string;
}

export const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
  filterGroups,
  activeFilters,
  onFilterChange,
  onReset,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<Record<string, any>>({});

  // 初始化臨時篩選值
  useEffect(() => {
    const temp: Record<string, any> = {};
    activeFilters.forEach(filter => {
      temp[filter.key] = filter.value;
    });
    setTempFilters(temp);
  }, [activeFilters]);

  // 應用篩選
  const applyFilters = () => {
    const newActiveFilters: ActiveFilter[] = [];
    
    Object.entries(tempFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        const group = filterGroups.find(g => g.key === key);
        if (group) {
          let label = '';
          
          if (group.type === 'select') {
            const option = group.options?.find(opt => opt.value === value);
            label = option?.label || String(value);
          } else if (group.type === 'multiSelect') {
            const selectedOptions = group.options?.filter(opt => value.includes(opt.value));
            label = selectedOptions?.map(opt => opt.label).join(', ') || '';
          } else if (group.type === 'dateRange') {
            label = `${value.start || ''} ~ ${value.end || ''}`;
          } else if (group.type === 'numberRange') {
            label = `${value.min || ''} ~ ${value.max || ''}`;
          } else {
            label = String(value);
          }
          
          newActiveFilters.push({
            key,
            title: group.title,
            value,
            label,
          });
        }
      }
    });
    
    onFilterChange(newActiveFilters);
    setIsOpen(false);
  };

  // 重置篩選
  const resetFilters = () => {
    setTempFilters({});
    onReset?.();
    setIsOpen(false);
  };

  // 移除單個篩選
  const removeFilter = (key: string) => {
    const newActiveFilters = activeFilters.filter(filter => filter.key !== key);
    onFilterChange(newActiveFilters);
  };

  // 渲染篩選組件
  const renderFilterGroup = (group: FilterGroup) => {
    const value = tempFilters[group.key];

    switch (group.type) {
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => setTempFilters(prev => ({
              ...prev,
              [group.key]: e.target.value,
            }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">{group.placeholder || '請選擇'}</option>
            {group.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label} {option.count ? `(${option.count})` : ''}
              </option>
            ))}
          </select>
        );

      case 'multiSelect':
        return (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {group.options?.map(option => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(value || []).includes(option.value)}
                  onChange={(e) => {
                    const currentValues = value || [];
                    const newValues = e.target.checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v: any) => v !== option.value);
                    setTempFilters(prev => ({
                      ...prev,
                      [group.key]: newValues,
                    }));
                  }}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {option.label} {option.count ? `(${option.count})` : ''}
                </span>
              </label>
            ))}
          </div>
        );

      case 'dateRange':
        return (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={value?.start || ''}
              onChange={(e) => setTempFilters(prev => ({
                ...prev,
                [group.key]: { ...value, start: e.target.value },
              }))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="date"
              value={value?.end || ''}
              onChange={(e) => setTempFilters(prev => ({
                ...prev,
                [group.key]: { ...value, end: e.target.value },
              }))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        );

      case 'numberRange':
        return (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="最小值"
              value={value?.min || ''}
              onChange={(e) => setTempFilters(prev => ({
                ...prev,
                [group.key]: { ...value, min: e.target.value },
              }))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="number"
              placeholder="最大值"
              value={value?.max || ''}
              onChange={(e) => setTempFilters(prev => ({
                ...prev,
                [group.key]: { ...value, max: e.target.value },
              }))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* 篩選按鈕 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center px-4 py-2 border border-gray-300 rounded-md
          text-sm font-medium text-gray-700 bg-white hover:bg-gray-50
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          ${activeFilters.length > 0 ? 'border-blue-500 text-blue-700' : ''}
        `}
      >
        <FilterIcon className="h-4 w-4 mr-2" />
        篩選
        {activeFilters.length > 0 && (
          <span className="ml-2 bg-blue-500 text-white rounded-full px-2 py-0.5 text-xs">
            {activeFilters.length}
          </span>
        )}
        <ChevronDownIcon className={`h-4 w-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 活躍篩選標籤 */}
      {activeFilters.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {activeFilters.map(filter => (
            <span
              key={filter.key}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
            >
              <span className="font-medium">{filter.title}:</span>
              <span className="ml-1">{filter.label}</span>
              <button
                onClick={() => removeFilter(filter.key)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={resetFilters}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            清除全部
          </button>
        </div>
      )}

      {/* 篩選面板 */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 space-y-4">
            {filterGroups.map(group => (
              <div key={group.key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {group.title}
                </label>
                {renderFilterGroup(group)}
              </div>
            ))}
          </div>
          
          <div className="flex justify-end space-x-2 p-4 border-t border-gray-200">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              重置
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              應用篩選
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ================================
// 排序組件
// ================================

export interface SortOption {
  key: string;
  title: string;
  direction?: 'asc' | 'desc';
}

export interface SortControlProps {
  options: SortOption[];
  activeSort?: { key: string; direction: 'asc' | 'desc' };
  onSortChange: (sort: { key: string; direction: 'asc' | 'desc' } | null) => void;
  className?: string;
}

export const SortControl: React.FC<SortControlProps> = ({
  options,
  activeSort,
  onSortChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSortSelect = (key: string, direction: 'asc' | 'desc') => {
    if (activeSort?.key === key && activeSort?.direction === direction) {
      onSortChange(null);
    } else {
      onSortChange({ key, direction });
    }
    setIsOpen(false);
  };

  const activeSortOption = options.find(opt => opt.key === activeSort?.key);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center px-4 py-2 border border-gray-300 rounded-md
          text-sm font-medium text-gray-700 bg-white hover:bg-gray-50
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          ${activeSort ? 'border-blue-500 text-blue-700' : ''}
        `}
      >
        {activeSort?.direction === 'asc' ? (
          <SortAscIcon className="h-4 w-4 mr-2" />
        ) : activeSort?.direction === 'desc' ? (
          <SortDescIcon className="h-4 w-4 mr-2" />
        ) : (
          <SortAscIcon className="h-4 w-4 mr-2 text-gray-400" />
        )}
        {activeSortOption ? `${activeSortOption.title} ${activeSort?.direction === 'asc' ? '↑' : '↓'}` : '排序'}
        <ChevronDownIcon className={`h-4 w-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {options.map(option => (
              <div key={option.key} className="px-4 py-2 border-b border-gray-100 last:border-b-0">
                <div className="font-medium text-sm text-gray-700 mb-1">{option.title}</div>
                <div className="space-y-1">
                  <button
                    onClick={() => handleSortSelect(option.key, 'asc')}
                    className={`
                      w-full text-left px-2 py-1 text-sm rounded flex items-center
                      ${activeSort?.key === option.key && activeSort?.direction === 'asc'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    <SortAscIcon className="h-3 w-3 mr-2" />
                    升序
                  </button>
                  <button
                    onClick={() => handleSortSelect(option.key, 'desc')}
                    className={`
                      w-full text-left px-2 py-1 text-sm rounded flex items-center
                      ${activeSort?.key === option.key && activeSort?.direction === 'desc'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    <SortDescIcon className="h-3 w-3 mr-2" />
                    降序
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ================================
// 組合搜索篩選組件
// ================================

export interface SearchFilterBarProps {
  searchProps?: Omit<SearchBoxProps, 'className'>;
  filterProps?: Omit<AdvancedFilterProps, 'className'>;
  sortProps?: Omit<SortControlProps, 'className'>;
  className?: string;
  children?: React.ReactNode;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchProps,
  filterProps,
  sortProps,
  className = '',
  children,
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}>
      <div className="flex-1 max-w-md">
        {searchProps && <SearchBox {...searchProps} />}
      </div>
      
      <div className="flex items-center space-x-3">
        {children}
        {sortProps && <SortControl {...sortProps} />}
        {filterProps && <AdvancedFilter {...filterProps} />}
      </div>
    </div>
  );
};

export default SearchFilterBar;
