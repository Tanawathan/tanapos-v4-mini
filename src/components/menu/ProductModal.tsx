import { useState, useEffect } from 'react'
import type { Product, CreateProductDto, UpdateProductDto, Category } from '../../lib/menu-types'
import { useMenuStore } from '../../stores/menuStore'

interface ProductModalProps {
  isOpen: boolean
  product: Product | null
  onClose: () => void
  onSave: (data: CreateProductDto | UpdateProductDto, isEdit: boolean, productId?: string) => Promise<void>
}

export default function ProductModal({ isOpen, product, onClose, onSave }: ProductModalProps) {
  const { categories } = useMenuStore()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    cost: '',
    sku: '',
    image_url: '',
    preparation_time: '',
    sort_order: '',
    is_available: true,
    ai_recommended: false,
    is_active: true
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when open
  useEffect(() => {
    if (isOpen) {
      if (product && product.id) {
        setFormData({
          name: product.name || '',
          description: product.description || '',
          category_id: product.category_id || categories[0]?.id || '',
          price: product.price?.toString() || '',
          cost: product.cost?.toString() || '',
          sku: product.sku || '',
          image_url: product.image_url || '',
          preparation_time: product.preparation_time?.toString() || '',
          sort_order: product.sort_order?.toString() || '',
          is_available: product.is_available ?? true,
          ai_recommended: product.ai_recommended ?? false,
          is_active: product.is_active ?? true
        })
      } else {
        setFormData(prev => ({
          ...prev,
            name: '',
            description: '',
            category_id: categories[0]?.id || '',
            price: '',
            cost: '',
            sku: '',
            image_url: '',
            preparation_time: '',
            sort_order: '0',
            is_available: true,
            ai_recommended: false,
            is_active: true
        }))
      }
      setErrors({})
    }
  }, [isOpen, product, categories])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = '商品名稱不能為空'
    if (!formData.category_id) newErrors.category_id = '必須選擇分類'
    if (formData.price === '' || isNaN(Number(formData.price))) newErrors.price = '價格必須是數字'
    if (formData.cost && isNaN(Number(formData.cost))) newErrors.cost = '成本必須是數字'
    if (formData.preparation_time && isNaN(Number(formData.preparation_time))) newErrors.preparation_time = '備餐時間必須是數字'
    if (formData.sort_order && isNaN(Number(formData.sort_order))) newErrors.sort_order = '排序必須是數字'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const baseData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category_id: formData.category_id,
        price: Number(formData.price),
        cost: formData.cost ? Number(formData.cost) : undefined,
        sku: formData.sku.trim() || undefined,
        image_url: formData.image_url.trim() || undefined,
        preparation_time: formData.preparation_time ? Number(formData.preparation_time) : undefined,
        sort_order: formData.sort_order ? Number(formData.sort_order) : undefined,
        is_available: formData.is_available,
        ai_recommended: formData.ai_recommended,
        is_active: formData.is_active
      }

      if (product && product.id) {
        await onSave(baseData as UpdateProductDto, true, product.id)
      } else {
        await onSave({ restaurant_id: 'default-restaurant-id', ...baseData } as CreateProductDto, false)
      }
      onClose()
    } catch (err) {
      console.error('儲存商品失敗', err)
      setErrors(prev => ({ ...prev, submit: '儲存失敗，請稍後再試' }))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{product?.id ? '編輯商品' : '新增商品'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={loading}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">商品名稱 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="輸入商品名稱"
                disabled={loading}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分類 *</label>
              <select
                value={formData.category_id}
                onChange={e => handleInputChange('category_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.category_id ? 'border-red-500' : 'border-gray-300'}`}
                disabled={loading || categories.length === 0}
              >
                <option value="">選擇分類</option>
                {categories.map((c: Category) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">價格 (NT$) *</label>
              <input
                type="number"
                value={formData.price}
                onChange={e => handleInputChange('price', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="0"
                min={0}
                step="1"
                disabled={loading}
              />
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">成本 (選填)</label>
              <input
                type="number"
                value={formData.cost}
                onChange={e => handleInputChange('cost', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.cost ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="0"
                min={0}
                step="1"
                disabled={loading}
              />
              {errors.cost && <p className="mt-1 text-sm text-red-600">{errors.cost}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU (選填)</label>
              <input
                type="text"
                value={formData.sku}
                onChange={e => handleInputChange('sku', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如: P001"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">排序 (選填)</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={e => handleInputChange('sort_order', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.sort_order ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="0"
                min={0}
                step="1"
                disabled={loading}
              />
              {errors.sort_order && <p className="mt-1 text-sm text-red-600">{errors.sort_order}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">備餐時間 (分鐘)</label>
              <input
                type="number"
                value={formData.preparation_time}
                onChange={e => handleInputChange('preparation_time', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.preparation_time ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="例如: 5"
                min={0}
                step="1"
                disabled={loading}
              />
              {errors.preparation_time && <p className="mt-1 text-sm text-red-600">{errors.preparation_time}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">商品描述 (選填)</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="輸入商品描述"
                disabled={loading}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">圖片網址 (選填)</label>
              <input
                type="text"
                value={formData.image_url}
                onChange={e => handleInputChange('image_url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://..."
                disabled={loading}
              />
              {formData.image_url && (
                <div className="mt-2 w-full h-40 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formData.image_url}
                    alt="預覽"
                    className="object-cover w-full h-full"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ToggleSwitch
              label="販售中"
              value={formData.is_available}
              onChange={() => handleInputChange('is_available', !formData.is_available)}
              disabled={loading}
            />
            <ToggleSwitch
              label="AI 推薦"
              value={formData.ai_recommended}
              onChange={() => handleInputChange('ai_recommended', !formData.ai_recommended)}
              disabled={loading}
            />
            <ToggleSwitch
              label="啟用商品"
              value={formData.is_active}
              onChange={() => handleInputChange('is_active', !formData.is_active)}
              disabled={loading}
            />
          </div>

          {/* Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errors.submit}</div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >取消</button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >{loading ? '儲存中...' : '儲存'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface ToggleProps {
  label: string
  value: boolean
  onChange: () => void
  disabled?: boolean
}

function ToggleSwitch({ label, value, onChange, disabled }: ToggleProps) {
  return (
    <div className="flex items-center justify-between border rounded-lg p-3 bg-gray-50">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <button
        type="button"
        onClick={onChange}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}
