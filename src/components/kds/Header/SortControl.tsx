import React from 'react';
import { SortOption, SortDirection } from '../../../lib/kds-types';

interface SortControlProps {
  sortBy: SortOption;
  sortDirection: SortDirection;
  onSort: (option: SortOption) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export const SortControl: React.FC<SortControlProps> = ({
  sortBy,
  sortDirection,
  onSort,
  onExpandAll,
  onCollapseAll
}) => {
  const sortOptions: { value: SortOption; label: string; icon: string }[] = [
    { value: 'time', label: '時間', icon: '⏰' },
    { value: 'priority', label: '優先級', icon: '🔥' },
    { value: 'table', label: '桌號', icon: '🏷️' },
    { value: 'status', label: '狀態', icon: '📊' }
  ];

  return (
    <div className="flex items-center space-x-2">
      <span className="text-gray-500 text-sm">🔄 排序:</span>
      
      <div className="flex items-center space-x-1">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onSort(option.value)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              sortBy === option.value
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="mr-1">{option.icon}</span>
            {option.label}
            {sortBy === option.value && (
              <span className="ml-1">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="border-l border-gray-300 pl-2 ml-2">
        <div className="flex items-center space-x-1">
          <button
            onClick={onExpandAll}
            className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="全部展開"
          >
            ▼ 全開
          </button>
          <button
            onClick={onCollapseAll}
            className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="全部收縮"
          >
            ▲ 全合
          </button>
        </div>
      </div>
    </div>
  );
};
