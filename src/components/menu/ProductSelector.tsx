import React, { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { MenuService } from '../../services/menuService'
import type { Product } from '../../lib/menu-types'

interface ProductSelectorProps {
  selectedProductId?: string
  onSelect: (product: Product) => void
  onClose: () => void
  isOpen: boolean
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  selectedProductId,
  onSelect,
  onClose,
  isOpen
}) => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [categories, setCategories] = useState<{id: string, name: string}[]>([])

  const menuService = MenuService.getInstance()

  // 載入產品和分類
  useEffect(() => {
    if (isOpen) {
      loadProducts()
      loadCategories()
    }
  }, [isOpen])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const response = await menuService.getProducts(
        { is_active: true }, // 只顯示啟用的產品
        { field: 'name', order: 'asc' }
      )
      if (response.data) {
        setProducts(response.data)
      }
    } catch (error) {
      console.error('載入產品失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await menuService.getCategories()
      if (response.data) {
        setCategories(response.data.map(cat => ({ id: cat.id, name: cat.name })))
      }
    } catch (error) {
      console.error('載入分類失敗:', error)
    }
  }

  // 篩選產品
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* 標題列 */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">選擇商品</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 搜尋和篩選 */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          {/* 搜尋框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜尋商品名稱或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* 分類篩選 */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">所有分類</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 產品列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || selectedCategory ? '沒有找到符合條件的商品' : '沒有可用的商品'}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => onSelect(product)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedProductId === product.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      {product.description && (
                        <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="font-semibold text-orange-600">
                          NT$ {product.price.toLocaleString()}
                        </span>
                        {product.category && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            {product.category.name}
                          </span>
                        )}
                        {!product.is_available && (
                          <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs">
                            暫停供應
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部按鈕 */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}
