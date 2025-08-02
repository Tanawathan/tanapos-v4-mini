import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useUIStyle } from '../contexts/UIStyleContext'

interface Product {
  id: string
  name: string
  price: number
  category_id: string
}

interface Category {
  id: string
  name: string
}

interface ComboProduct {
  id: string
  name: string
  description: string
  price: number
  combo_type: 'fixed' | 'selectable'
  is_available: boolean
}

interface ComboChoice {
  id: string
  combo_id: string
  category_id: string
  min_selections: number
  max_selections: number
  category_name?: string
}

interface ComboSelections {
  [categoryId: string]: Product[]
}

interface ComboSelectorProps {
  combo: ComboProduct
  onConfirm: (combo: ComboProduct, selections: ComboSelections, totalPrice: number) => void
  onCancel: () => void
  quantity: number
}

const ComboSelector: React.FC<ComboSelectorProps> = ({ 
  combo, 
  onConfirm, 
  onCancel, 
  quantity 
}) => {
  const { currentStyle, styleConfig } = useUIStyle()
  const [choices, setChoices] = useState<ComboChoice[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selections, setSelections] = useState<ComboSelections>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadComboData()
  }, [combo.id])

  const loadComboData = async () => {
    setLoading(true)
    try {
      // 載入套餐選擇規則
      const { data: choicesData, error: choicesError } = await supabase
        .from('combo_choices')
        .select(`
          *,
          categories(name)
        `)
        .eq('combo_id', combo.id)

      if (choicesError) throw choicesError

      const choicesWithCategoryName = choicesData.map(choice => ({
        ...choice,
        category_name: choice.categories?.name
      }))
      setChoices(choicesWithCategoryName)

      // 載入所有產品
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, price, category_id')
        .eq('is_available', true)

      if (productsError) throw productsError
      setProducts(productsData || [])

      // 載入分類
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')

      if (categoriesError) throw categoriesError
      setCategories(categoriesData || [])

      // 初始化選擇
      const initialSelections: ComboSelections = {}
      choicesWithCategoryName.forEach(choice => {
        initialSelections[choice.category_id] = []
      })
      setSelections(initialSelections)

    } catch (error) {
      console.error('載入套餐資料失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProductSelect = (categoryId: string, product: Product) => {
    const choice = choices.find(c => c.category_id === categoryId)
    if (!choice) return

    const currentSelections = selections[categoryId] || []
    const isSelected = currentSelections.some(p => p.id === product.id)

    if (isSelected) {
      // 移除選擇
      setSelections(prev => ({
        ...prev,
        [categoryId]: currentSelections.filter(p => p.id !== product.id)
      }))
    } else {
      // 添加選擇
      const newSelections = [...currentSelections]
      
      // 檢查是否達到最大選擇數
      if (newSelections.length >= choice.max_selections) {
        // 如果只能選一個，替換選擇
        if (choice.max_selections === 1) {
          newSelections[0] = product
        } else {
          return // 已達到最大選擇數
        }
      } else {
        newSelections.push(product)
      }

      setSelections(prev => ({
        ...prev,
        [categoryId]: newSelections
      }))
    }
  }

  const canConfirm = () => {
    return choices.every(choice => {
      const categorySelections = selections[choice.category_id] || []
      return categorySelections.length >= choice.min_selections && 
             categorySelections.length <= choice.max_selections
    })
  }

  const calculateTotalPrice = () => {
    // 套餐統一價格，不需要額外加價
    return combo.price * quantity
  }

  const handleConfirm = () => {
    if (canConfirm()) {
      onConfirm(combo, selections, calculateTotalPrice())
    }
  }

  const getProductsForCategory = (categoryId: string) => {
    return products.filter(p => p.category_id === categoryId)
  }

  const isProductSelected = (categoryId: string, productId: string) => {
    return (selections[categoryId] || []).some(p => p.id === productId)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">載入套餐選項...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 標題 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{combo.name}</h2>
              <p className="text-gray-600 mt-1">{combo.description}</p>
              <div className="mt-2 flex items-center gap-4">
                <span className="text-xl font-semibold text-green-600">
                  基本價格: NT$ {combo.price}
                </span>
                <span className="text-lg text-gray-600">
                  數量: {quantity}
                </span>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 選擇區域 */}
        <div className="p-6">
          {choices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              此套餐沒有可選擇的項目
            </div>
          ) : (
            <div className="space-y-6">
              {choices.map(choice => {
                const categoryProducts = getProductsForCategory(choice.category_id)
                const currentSelections = selections[choice.category_id] || []
                
                return (
                  <div key={choice.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {choice.category_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        請選擇 {choice.min_selections} - {choice.max_selections} 項
                        {currentSelections.length > 0 && (
                          <span className="ml-2 text-blue-600">
                            (已選 {currentSelections.length} 項)
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categoryProducts.map(product => {
                        const isSelected = isProductSelected(choice.category_id, product.id)
                        const canSelect = currentSelections.length < choice.max_selections || isSelected
                        
                        return (
                          <button
                            key={product.id}
                            onClick={() => handleProductSelect(choice.category_id, product)}
                            disabled={!canSelect}
                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 text-blue-900'
                                : canSelect
                                ? 'border-gray-200 hover:border-gray-300 bg-white'
                                : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-gray-600">
                                  +NT$ {product.price}
                                </div>
                              </div>
                              {isSelected && (
                                <div className="text-blue-500 text-xl">✓</div>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    {categoryProducts.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        此分類暫無可選項目
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 底部確認區域 */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">
                總價格: NT$ {calculateTotalPrice()}
              </div>
              <div className="text-sm text-gray-600">
                基本價格 NT$ {combo.price} × {quantity} + 選擇項目價格
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={!canConfirm()}
                className={`px-6 py-2 rounded-md text-white font-medium ${
                  canConfirm()
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                確認選擇
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComboSelector
