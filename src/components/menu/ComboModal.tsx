import React, { useState, useEffect } from 'react'
import { X, ChefHat, Clock, DollarSign } from 'lucide-react'
import type { ComboProduct, Category, CreateComboDto, UpdateComboDto } from '../../lib/menu-types'

interface ComboModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateComboDto | UpdateComboDto) => Promise<boolean>
  combo?: ComboProduct | null
  categories: Category[]
}

export const ComboModal: React.FC<ComboModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  combo,
  categories
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    combo_type: 'fixed' as 'fixed' | 'selectable',
    is_available: true,
    preparation_time: 15,
    category_id: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 當 modal 打開或 combo 改變時初始化表單
  useEffect(() => {
    if (isOpen) {
      if (combo) {
        setFormData({
          name: combo.name || '',
          description: combo.description || '',
          price: combo.price || 0,
          combo_type: combo.combo_type || 'fixed',
          is_available: combo.is_available ?? true,
          preparation_time: combo.preparation_time || 15,
          category_id: combo.category_id || ''
        })
      } else {
        setFormData({
          name: '',
          description: '',
          price: 0,
          combo_type: 'fixed',
          is_available: true,
          preparation_time: 15,
          category_id: ''
        })
      }
      setErrors({})
    }
  }, [isOpen, combo])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = '套餐名稱為必填項目'
    } else if (formData.name.length > 100) {
      newErrors.name = '套餐名稱不能超過 100 個字元'
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = '套餐描述不能超過 500 個字元'
    }

    if (formData.price <= 0) {
      newErrors.price = '套餐價格必須大於 0'
    } else if (formData.price > 99999) {
      newErrors.price = '套餐價格不能超過 99,999'
    }

    if (formData.preparation_time <= 0) {
      newErrors.preparation_time = '製作時間必須大於 0 分鐘'
    } else if (formData.preparation_time > 480) {
      newErrors.preparation_time = '製作時間不能超過 480 分鐘'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const submitData = {
        ...formData,
        category_id: formData.category_id || undefined
      }
      
      const success = await onSubmit(submitData)
      if (success) {
        onClose()
      }
    } catch (error) {
      console.error('提交套餐數據時發生錯誤:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // 清除相關錯誤
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Modal 頭部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ChefHat className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {combo ? '編輯套餐' : '新增套餐'}
              </h2>
              <p className="text-sm text-gray-500">
                設定套餐基本資訊和配置
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Modal 內容 */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* 基本資訊 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 套餐名稱 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  套餐名稱 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="輸入套餐名稱..."
                  maxLength={100}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* 套餐描述 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  套餐描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="輸入套餐描述..."
                  maxLength={500}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
                <div className="mt-1 text-xs text-gray-400 text-right">
                  {formData.description.length}/500
                </div>
              </div>

              {/* 套餐類型 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  套餐類型 *
                </label>
                <select
                  value={formData.combo_type}
                  onChange={(e) => handleChange('combo_type', e.target.value as 'fixed' | 'selectable')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="fixed">固定套餐</option>
                  <option value="selectable">自選套餐</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.combo_type === 'fixed' ? '固定搭配的套餐組合' : '客戶可自由選擇配菜的套餐'}
                </p>
              </div>

              {/* 分類 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  所屬分類
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => handleChange('category_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">請選擇分類</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 套餐價格 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  套餐價格 *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                    min="0"
                    max="99999"
                    step="0.01"
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.price ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                </div>
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                )}
              </div>

              {/* 製作時間 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  製作時間 *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={formData.preparation_time}
                    onChange={(e) => handleChange('preparation_time', parseInt(e.target.value) || 0)}
                    min="1"
                    max="480"
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.preparation_time ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="15"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    分鐘
                  </span>
                </div>
                {errors.preparation_time && (
                  <p className="mt-1 text-sm text-red-600">{errors.preparation_time}</p>
                )}
              </div>
            </div>

            {/* 可用狀態 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-900">供應狀態</h3>
                <p className="text-sm text-gray-500">設定套餐是否開放訂購</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={(e) => handleChange('is_available', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>
          </div>

          {/* Modal 底部 */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {loading ? '保存中...' : (combo ? '更新套餐' : '創建套餐')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
