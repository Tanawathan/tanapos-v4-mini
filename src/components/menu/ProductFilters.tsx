import { useState } from 'react';
import type { ProductFilters } from '../../lib/menu-types';
import { useMenuStore } from '../../stores/menuStore';

interface ProductFiltersProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  onResetFilters: () => void;
}

export default function ProductFiltersComponent({ 
  filters, 
  onFiltersChange, 
  onResetFilters 
}: ProductFiltersProps) {
  const { categories } = useMenuStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== null && value !== '' && value !== 'all'
  ).length;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      {/* 篩選器標題與摺疊按鈕 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">🔍 商品篩選</h3>
          {activeFiltersCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {activeFiltersCount} 個篩選條件
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={onResetFilters}
              className="text-sm text-gray-600 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100"
            >
              🔄 重置
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-gray-600 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100"
          >
            {isExpanded ? '▲ 收起' : '▼ 展開'}
          </button>
        </div>
      </div>

      {/* 快速篩選 - 始終顯示 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* 搜尋框 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            搜尋商品
          </label>
          <input
            type="text"
            placeholder="輸入商品名稱或關鍵字..."
            value={filters.search_term || ''}
            onChange={(e) => handleFilterChange('search_term', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 分類篩選 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            商品分類
          </label>
          <select
            value={filters.category_id || ''}
            onChange={(e) => handleFilterChange('category_id', e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">全部分類</option>
            {categories.map((category: any) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* 販售狀態 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            販售狀態
          </label>
          <select
            value={filters.availability || 'all'}
            onChange={(e) => handleFilterChange('availability', e.target.value === 'all' ? undefined : e.target.value as 'available' | 'unavailable')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">全部商品</option>
            <option value="available">正在販售</option>
            <option value="unavailable">暫停販售</option>
          </select>
        </div>

        {/* AI 推薦 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            AI 推薦
          </label>
          <select
            value={filters.ai_recommended === null ? 'all' : filters.ai_recommended ? 'true' : 'false'}
            onChange={(e) => {
              const value = e.target.value === 'all' ? null : e.target.value === 'true';
              handleFilterChange('ai_recommended', value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">全部商品</option>
            <option value="true">AI 推薦</option>
            <option value="false">非推薦</option>
          </select>
        </div>
      </div>
    </div>
  );
}
