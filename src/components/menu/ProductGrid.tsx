import { useState } from 'react';
import type { Product, ProductSorting, MenuViewMode } from '../../lib/menu-types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  viewMode: MenuViewMode['mode'];
  sorting: ProductSorting;
  totalCount?: number;
  hasNextPage?: boolean;
  onSortingChange: (sorting: ProductSorting) => void;
  onViewModeChange: (mode: MenuViewMode['mode']) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onToggleAvailable: (productId: string, available: boolean) => void;
  onLoadMore?: () => void;
}

export default function ProductGrid({
  products,
  loading,
  viewMode,
  sorting,
  totalCount,
  hasNextPage,
  onSortingChange,
  onViewModeChange,
  onEditProduct,
  onDeleteProduct,
  onToggleAvailable,
  onLoadMore
}: ProductGridProps) {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  };

  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入商品中...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🍽️</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">尚無商品</h3>
        <p className="text-gray-600 mb-6">開始建立您的第一個商品吧！</p>
        <button
          onClick={() => onEditProduct({} as Product)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          ➕ 新增商品
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 工具列 */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* 左側：統計與批量操作 */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              共 {totalCount || products.length} 項商品
              {totalCount && totalCount > products.length && (
                <span className="text-blue-600 ml-1">
                  (顯示 {products.length} 項)
                </span>
              )}
            </span>
            
            {selectedProducts.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-blue-600">
                  已選 {selectedProducts.size} 項
                </span>
                <button
                  onClick={() => setSelectedProducts(new Set())}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  取消選取
                </button>
              </div>
            )}
          </div>

          {/* 右側：排序與檢視模式 */}
          <div className="flex items-center gap-4">
            {/* 排序選項 */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">排序：</label>
              <select
                value={`${sorting.field}-${sorting.order}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  onSortingChange({
                    field: field as ProductSorting['field'],
                    order: order as ProductSorting['order']
                  });
                }}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="name-asc">名稱 A-Z</option>
                <option value="name-desc">名稱 Z-A</option>
                <option value="price-asc">價格低到高</option>
                <option value="price-desc">價格高到低</option>
                <option value="ai_popularity_score-desc">人氣高到低</option>
                <option value="created_at-desc">最新建立</option>
                <option value="sort_order-asc">自訂排序</option>
              </select>
            </div>

            {/* 檢視模式 */}
            <div className="flex items-center border border-gray-300 rounded overflow-hidden">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`px-3 py-1 text-sm ${
                  viewMode === 'grid' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                ⊞ 網格
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`px-3 py-1 text-sm ${
                  viewMode === 'list' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                ☰ 列表
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 商品網格 */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="relative">
              {/* 選取勾選框 */}
              <div className="absolute top-2 left-2 z-10">
                <input
                  type="checkbox"
                  checked={selectedProducts.has(product.id)}
                  onChange={() => handleSelectProduct(product.id)}
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              
              <ProductCard
                product={product}
                onEdit={onEditProduct}
                onDelete={onDeleteProduct}
                onToggleAvailable={onToggleAvailable}
              />
            </div>
          ))}
        </div>
      ) : (
        /* 列表檢視 */
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedProducts.size === products.length && products.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">商品</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">分類</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">價格</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">狀態</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">人氣</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            '🍽️'
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          {product.sku && (
                            <div className="text-sm text-gray-500">#{product.sku}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {product.category?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      NT$ {product.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        product.is_available 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.is_available ? '販售中' : '停售'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {product.ai_popularity_score}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEditProduct(product)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => onToggleAvailable(product.id, !product.is_available)}
                          className="text-orange-600 hover:text-orange-800 text-sm"
                        >
                          {product.is_available ? '停售' : '上架'}
                        </button>
                        <button
                          onClick={() => onDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 載入更多按鈕 */}
      {hasNextPage && onLoadMore && (
        <div className="text-center py-8">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '載入中...' : '載入更多商品'}
          </button>
        </div>
      )}
    </div>
  );
}
