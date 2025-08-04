import { useState } from 'react';
import type { Category } from '../../lib/menu-types';

interface CategoryCardProps {
  category: Category;
  productCount: number;
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
  onToggleActive: (categoryId: string, active: boolean) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export default function CategoryCard({
  category,
  productCount,
  onEdit,
  onDelete,
  onToggleActive,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}: CategoryCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (productCount > 0) {
      alert('無法刪除含有商品的分類，請先移動或刪除該分類下的所有商品。');
      return;
    }

    if (window.confirm(`確定要刪除分類「${category.name}」嗎？`)) {
      setIsDeleting(true);
      try {
        await onDelete(category.id);
      } catch (error) {
        console.error('刪除分類失敗:', error);
        setIsDeleting(false);
      }
    }
  };

  const handleToggleActive = () => {
    onToggleActive(category.id, !category.is_active);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md ${
      !category.is_active ? 'opacity-60' : ''
    } ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
      
      <div className="p-6">
        {/* 分類標題區域 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* 分類圖示與顏色 */}
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: category.color }}
            >
              {category.icon}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {category.description}
                </p>
              )}
            </div>
          </div>

          {/* 狀態標籤 */}
          <div className="flex items-center gap-2">
            {!category.is_active && (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                停用
              </span>
            )}
            <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
              排序: {category.sort_order}
            </span>
          </div>
        </div>

        {/* 統計資訊 */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>📦</span>
              <span>{productCount} 項商品</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>建立時間:</span>
              <span>{new Date(category.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="flex items-center justify-between">
          {/* 左側：排序控制 */}
          <div className="flex items-center gap-1">
            <button
              onClick={onMoveUp}
              disabled={!canMoveUp || isDeleting}
              className={`p-2 rounded-lg text-sm transition-colors ${
                canMoveUp && !isDeleting
                  ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="向上移動"
            >
              ↑
            </button>
            <button
              onClick={onMoveDown}
              disabled={!canMoveDown || isDeleting}
              className={`p-2 rounded-lg text-sm transition-colors ${
                canMoveDown && !isDeleting
                  ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="向下移動"
            >
              ↓
            </button>
          </div>

          {/* 右側：主要操作 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(category)}
              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
              disabled={isDeleting}
            >
              ✏️ 編輯
            </button>
            
            <button
              onClick={handleToggleActive}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                category.is_active
                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
              disabled={isDeleting}
            >
              {category.is_active ? '🚫 停用' : '✅ 啟用'}
            </button>
            
            <button
              onClick={handleDelete}
              className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
              disabled={isDeleting || productCount > 0}
              title={productCount > 0 ? '此分類下有商品，無法刪除' : '刪除分類'}
            >
              {isDeleting ? '⏳' : '🗑️'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
