import { useState, useEffect } from 'react';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '../../lib/menu-types';
import { useMenuStore } from '../../stores/menuStore';
import CategoryCard from './CategoryCard';
import CategoryModal from './CategoryModal';

export default function CategoryManagement() {
  const {
    categories,
    products,
    loading,
    error,
    loadCategories,
    loadProducts,
    createCategory,
    updateCategory,
    deleteCategory
  } = useMenuStore();

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 載入初始資料
  useEffect(() => {
    loadCategories();
    loadProducts();
  }, [loadCategories, loadProducts]);

  // 篩選分類
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 計算每個分類的商品數量
  const getCategoryProductCount = (categoryId: string) => {
    return products.filter(product => product.category_id === categoryId).length;
  };

  // 處理新增分類
  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowModal(true);
  };

  // 處理編輯分類
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  // 處理儲存分類
  const handleSaveCategory = async (data: CreateCategoryDto | UpdateCategoryDto) => {
    if (editingCategory) {
      // 編輯模式
      await updateCategory(editingCategory.id, data as UpdateCategoryDto);
    } else {
      // 新增模式
      const categoryData = {
        ...data,
        restaurant_id: 'default-restaurant-id', // 這裡應該從認證狀態獲取
        sort_order: categories.length + 1
      } as CreateCategoryDto;
      await createCategory(categoryData);
    }
  };

  // 處理刪除分類
  const handleDeleteCategory = async (categoryId: string) => {
    await deleteCategory(categoryId);
  };

  // 處理啟用/停用分類
  const handleToggleActive = async (categoryId: string, active: boolean) => {
    await updateCategory(categoryId, { is_active: active });
  };

  // 處理分類排序移動
  const handleMoveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    const sortedCategories = [...categories].sort((a, b) => a.sort_order - b.sort_order);
    const currentIndex = sortedCategories.findIndex(cat => cat.id === categoryId);
    
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === sortedCategories.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentCategory = sortedCategories[currentIndex];
    const targetCategory = sortedCategories[targetIndex];

    // 交換排序順序
    await Promise.all([
      updateCategory(currentCategory.id, { sort_order: targetCategory.sort_order }),
      updateCategory(targetCategory.id, { sort_order: currentCategory.sort_order })
    ]);
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">載入失敗</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => {
            loadCategories();
            loadProducts();
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
          <h2 className="text-2xl font-bold text-gray-900">📂 分類管理</h2>
          <p className="text-gray-600 mt-1">管理您的商品分類</p>
        </div>
        
        <button
          onClick={handleAddCategory}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          ➕ 新增分類
        </button>
      </div>

      {/* 搜尋列 */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              搜尋分類
            </label>
            <input
              type="text"
              placeholder="輸入分類名稱或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
            >
              🔄 清除
            </button>
          )}
        </div>
      </div>

      {/* 統計資訊 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              📂
            </div>
            <div>
              <div className="text-sm text-gray-600">總分類數</div>
              <div className="text-xl font-semibold text-gray-900">{categories.length}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              ✅
            </div>
            <div>
              <div className="text-sm text-gray-600">啟用分類</div>
              <div className="text-xl font-semibold text-gray-900">
                {categories.filter(cat => cat.is_active).length}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              📦
            </div>
            <div>
              <div className="text-sm text-gray-600">總商品數</div>
              <div className="text-xl font-semibold text-gray-900">{products.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 分類列表 */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">載入分類中...</p>
          </div>
        </div>
      ) : filteredCategories.length === 0 ? (
        searchTerm ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">找不到符合的分類</h3>
            <p className="text-gray-600 mb-6">試試其他關鍵字或新增一個分類</p>
            <button
              onClick={handleAddCategory}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              ➕ 新增分類
            </button>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📂</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">尚無分類</h3>
            <p className="text-gray-600 mb-6">建立您的第一個商品分類吧！</p>
            <button
              onClick={handleAddCategory}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              ➕ 新增分類
            </button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCategories
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((category, index) => (
              <CategoryCard
                key={category.id}
                category={category}
                productCount={getCategoryProductCount(category.id)}
                onEdit={handleEditCategory}
                onDelete={handleDeleteCategory}
                onToggleActive={handleToggleActive}
                onMoveUp={() => handleMoveCategory(category.id, 'up')}
                onMoveDown={() => handleMoveCategory(category.id, 'down')}
                canMoveUp={index > 0}
                canMoveDown={index < filteredCategories.length - 1}
              />
            ))}
        </div>
      )}

      {/* 分類編輯模態框 */}
      <CategoryModal
        isOpen={showModal}
        category={editingCategory}
        onClose={() => setShowModal(false)}
        onSave={handleSaveCategory}
      />
    </div>
  );
}
