import { useState } from 'react';
import { Product } from '../../lib/menu-types';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onToggleAvailable: (productId: string, available: boolean) => void;
}

export default function ProductCard({ 
  product, 
  onEdit, 
  onDelete, 
  onToggleAvailable 
}: ProductCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm(`確定要刪除商品「${product.name}」嗎？`)) {
      setIsDeleting(true);
      try {
        await onDelete(product.id);
      } catch (error) {
        console.error('刪除商品失敗:', error);
        setIsDeleting(false);
      }
    }
  };

  const handleToggleAvailable = () => {
    onToggleAvailable(product.id, !product.is_available);
  };

  const popularityColor = product.ai_popularity_score >= 80 ? 'text-green-600' :
                         product.ai_popularity_score >= 60 ? 'text-yellow-600' : 'text-gray-500';

  return (
    <div className={`bg-white rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md ${
      !product.is_available ? 'opacity-60' : ''
    } ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* 商品圖片 */}
      <div className="relative h-48 bg-gray-100 rounded-t-lg overflow-hidden">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        
        {/* 預設圖示 - 當圖片載入失敗時顯示 */}
        <div className={`w-full h-full flex items-center justify-center bg-gray-100 ${product.image_url ? 'hidden' : ''}`}>
          <div className="text-6xl">🍽️</div>
        </div>

        {/* 狀態標籤 */}
        <div className="absolute top-2 left-2 flex gap-1">
          {!product.is_available && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              停售
            </span>
          )}
          {product.ai_recommended && (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              推薦
            </span>
          )}
        </div>

        {/* AI 人氣分數 */}
        {product.ai_popularity_score !== null && (
          <div className="absolute top-2 right-2">
            <div className={`bg-white rounded-full px-2 py-1 text-xs font-medium ${popularityColor}`}>
              ⭐ {product.ai_popularity_score}%
            </div>
          </div>
        )}
      </div>

      {/* 商品資訊 */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
            {product.name}
          </h3>
          {product.sku && (
            <span className="text-xs text-gray-500 ml-2">
              #{product.sku}
            </span>
          )}
        </div>

        {product.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* 價格與成本 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600">
              NT$ {product.price.toLocaleString()}
            </span>
            {product.cost && (
              <span className="text-sm text-gray-500">
                (成本: ${product.cost})
              </span>
            )}
          </div>
        </div>

        {/* 其他資訊 */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          {product.preparation_time && (
            <span className="flex items-center gap-1">
              ⏱️ {product.preparation_time}分鐘
            </span>
          )}
          <span className="flex items-center gap-1">
            📋 排序: {product.sort_order || 0}
          </span>
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(product)}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            disabled={isDeleting}
          >
            ✏️ 編輯
          </button>
          
          <button
            onClick={handleToggleAvailable}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              product.is_available 
                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
            disabled={isDeleting}
          >
            {product.is_available ? '🚫 停售' : '✅ 上架'}
          </button>
          
          <button
            onClick={handleDelete}
            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
            disabled={isDeleting}
          >
            {isDeleting ? '⏳' : '🗑️'}
          </button>
        </div>
      </div>
    </div>
  );
}
