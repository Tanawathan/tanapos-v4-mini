import { useState, useEffect } from 'react';
import type { Product, ProductFilters, ProductSorting, MenuViewMode, CreateProductDto, UpdateProductDto } from '../../lib/menu-types';
import { useMenuStore } from '../../stores/menuStore';
import ProductFiltersComponent from './ProductFilters';
import ProductGrid from './ProductGrid';
import ProductModal from './ProductModal';

export default function ProductManagement() {
  const { 
    products, 
    loading, 
    error,
    totalCount,
    hasNextPage,
    loadProducts, 
    loadCategories,
    deleteProduct,
    updateProduct,
    createProduct,
    nextPage
  } = useMenuStore();

  const [filters, setFilters] = useState<ProductFilters>({});
  const [sorting, setSorting] = useState<ProductSorting>({
    field: 'sort_order',
    order: 'asc'
  });
  const [viewMode, setViewMode] = useState<MenuViewMode['mode']>('grid');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // 載入初始資料
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  // 篩選和排序商品
  const filteredAndSortedProducts = products
    .filter((product: Product) => {
      // 分類篩選
      if (filters.category_id && product.category_id !== filters.category_id) {
        return false;
      }
      
      // 搜尋篩選
      if (filters.search_term) {
        const searchTerm = filters.search_term.toLowerCase();
        return (
          product.name.toLowerCase().includes(searchTerm) ||
          product.description?.toLowerCase().includes(searchTerm) ||
          product.sku?.toLowerCase().includes(searchTerm)
        );
      }
      
      // 販售狀態篩選
      if (filters.availability) {
        if (filters.availability === 'available' && !product.is_available) return false;
        if (filters.availability === 'unavailable' && product.is_available) return false;
      }
      
      // AI 推薦篩選
      if (filters.ai_recommended !== null && filters.ai_recommended !== undefined) {
        if (product.ai_recommended !== filters.ai_recommended) return false;
      }
      
      return true;
    })
    .sort((a: Product, b: Product) => {
      let aValue, bValue;
      
      switch (sorting.field) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'ai_popularity_score':
          aValue = a.ai_popularity_score;
          bValue = b.ai_popularity_score;
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'sort_order':
          aValue = a.sort_order;
          bValue = b.sort_order;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sorting.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sorting.order === 'asc' ? 1 : -1;
      return 0;
    });

  const handleResetFilters = () => {
    setFilters({});
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product?.id ? product : null);
    setShowEditModal(true);
  };

  const handleSaveProduct = async (data: CreateProductDto | UpdateProductDto, isEdit: boolean, productId?: string) => {
    if (isEdit && productId) {
      await updateProduct(productId, data as UpdateProductDto);
    } else {
      await createProduct(data as CreateProductDto);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(productId);
    } catch (error) {
      console.error('刪除商品失敗:', error);
      alert('刪除商品失敗，請稍後再試');
    }
  };

  const handleToggleAvailable = async (productId: string, available: boolean) => {
    try {
      await updateProduct(productId, { is_available: available });
    } catch (error) {
      console.error('更新商品狀態失敗:', error);
      alert('更新商品狀態失敗，請稍後再試');
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">載入失敗</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => {
            loadProducts();
            loadCategories();
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          重新載入
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題與新增按鈕 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📝 商品管理</h2>
          <p className="text-gray-600 mt-1">管理您的菜單商品</p>
        </div>
        
        <button
          onClick={() => handleEditProduct({} as Product)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          ➕ 新增商品
        </button>
      </div>

      {/* 篩選器 */}
      <ProductFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        onResetFilters={handleResetFilters}
      />

      {/* 商品網格 */}
      <ProductGrid
        products={filteredAndSortedProducts}
        loading={loading}
        viewMode={viewMode}
        sorting={sorting}
        totalCount={totalCount}
        hasNextPage={hasNextPage}
        onSortingChange={setSorting}
        onViewModeChange={setViewMode}
        onEditProduct={handleEditProduct}
        onDeleteProduct={handleDeleteProduct}
        onToggleAvailable={handleToggleAvailable}
        onLoadMore={() => nextPage()}
      />

      <ProductModal
        isOpen={showEditModal}
        product={editingProduct}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveProduct}
      />
    </div>
  );
}
