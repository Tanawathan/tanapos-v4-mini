import React, { useState, useEffect } from 'react'
import { Edit2, Trash2, Check } from 'lucide-react'
import { ProductSelector } from './ProductSelector'
import type { ComboSelectionOption, Product } from '../../lib/menu-types'
import { MenuService } from '../../services/menuService'

interface OptionEditorProps {
  option: ComboSelectionOption
  onUpdate: (updates: Partial<ComboSelectionOption>) => void
  onDelete: () => void
  isPreviewMode: boolean
}

export const OptionEditor: React.FC<OptionEditorProps> = ({
  option,
  onUpdate,
  onDelete,
  isPreviewMode
}) => {
  const [isEditing, setIsEditing] = useState(!option.product_id) // 如果沒有選擇產品，自動進入編輯模式
  const [showProductSelector, setShowProductSelector] = useState(false)
  const [productInfo, setProductInfo] = useState<Product | null>(null)
  const [tempPrice, setTempPrice] = useState(option.additional_price.toString())

  const menuService = MenuService.getInstance()

  // 載入產品資訊
  useEffect(() => {
    if (option.product_id) {
      loadProductInfo()
    }
  }, [option.product_id])

  const loadProductInfo = async () => {
    try {
      const response = await menuService.getProductById(option.product_id)
      if (response.data) {
        setProductInfo(response.data)
      }
    } catch (error) {
      console.error('載入產品資訊失敗:', error)
    }
  }

  const handleProductSelect = (product: Product) => {
    onUpdate({ 
      product_id: product.id
    })
    setProductInfo(product)
    setShowProductSelector(false)
  }

  const handlePriceChange = () => {
    const price = parseFloat(tempPrice) || 0
    onUpdate({ additional_price: price })
    setIsEditing(false)
  }

  const handleToggleDefault = () => {
    onUpdate({ is_default: !option.is_default })
  }

  const handleToggleAvailable = () => {
    onUpdate({ is_available: !option.is_available })
  }

  return (
    <>
      <div className={`p-3 border rounded-lg transition-all ${
        isEditing && !isPreviewMode 
          ? 'border-orange-300 bg-orange-50' 
          : 'border-gray-200 bg-white'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* 產品資訊 */}
            <div className="flex items-center gap-2 mb-2">
              {option.product_id && productInfo ? (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {productInfo.name}
                  </span>
                  {option.is_default && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      預設
                    </span>
                  )}
                  {!option.is_available && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                      暫停
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-gray-500 italic">未選擇商品</span>
              )}
            </div>

            {/* 價格資訊 */}
            <div className="flex items-center gap-4 text-sm">
              {productInfo && (
                <span className="text-gray-600">
                  原價: NT$ {productInfo.price.toLocaleString()}
                </span>
              )}
              
              {isEditing && !isPreviewMode ? (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">加價:</span>
                  <input
                    type="number"
                    value={tempPrice}
                    onChange={(e) => setTempPrice(e.target.value)}
                    onBlur={handlePriceChange}
                    onKeyDown={(e) => e.key === 'Enter' && handlePriceChange()}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                    step="0.01"
                    autoFocus
                  />
                  <span className="text-gray-600">元</span>
                </div>
              ) : (
                <span className={`font-medium ${
                  option.additional_price > 0 ? 'text-red-600' : 
                  option.additional_price < 0 ? 'text-green-600' : 
                  'text-gray-600'
                }`}>
                  {option.additional_price > 0 ? '+' : ''}
                  {option.additional_price !== 0 ? `NT$ ${option.additional_price.toLocaleString()}` : '無額外費用'}
                </span>
              )}
            </div>

            {/* 產品描述 */}
            {productInfo?.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {productInfo.description}
              </p>
            )}
          </div>

          {/* 操作按鈕 */}
          {!isPreviewMode && (
            <div className="flex items-center gap-1 ml-2">
              {/* 選擇產品 */}
              <button
                onClick={() => setShowProductSelector(true)}
                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                title="選擇產品"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              {/* 設為預設 */}
              {option.product_id && (
                <button
                  onClick={handleToggleDefault}
                  className={`p-1 rounded ${
                    option.is_default 
                      ? 'text-green-600 bg-green-100' 
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                  title={option.is_default ? '取消預設' : '設為預設'}
                >
                  <Check className="w-4 h-4" />
                </button>
              )}

              {/* 編輯價格 */}
              <button
                onClick={() => {
                  setTempPrice(option.additional_price.toString())
                  setIsEditing(!isEditing)
                }}
                className="p-1 text-orange-600 hover:bg-orange-100 rounded"
                title="編輯價格"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              {/* 刪除選項 */}
              <button
                onClick={onDelete}
                className="p-1 text-red-600 hover:bg-red-100 rounded"
                title="刪除選項"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* 可用性切換 */}
        {option.product_id && !isPreviewMode && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={option.is_available}
                onChange={handleToggleAvailable}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-600">此選項可供選擇</span>
            </label>
          </div>
        )}
      </div>

      {/* 產品選擇器 */}
      <ProductSelector
        isOpen={showProductSelector}
        selectedProductId={option.product_id}
        onSelect={handleProductSelect}
        onClose={() => setShowProductSelector(false)}
      />
    </>
  )
}
