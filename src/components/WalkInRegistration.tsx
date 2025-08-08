import React, { useState } from 'react'
import { Users, Phone, Clock, UserCheck } from 'lucide-react'
import useStore from '../lib/store'
import { ReservationService } from '../services/reservationService'

interface WalkInRegistrationProps {
  onSubmit: (data: WalkInCustomer) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

interface WalkInCustomer {
  customer_name: string
  customer_last_name: string
  customer_gender: 'male' | 'female' | 'other' | ''
  customer_phone: string
  party_size: number
}

export default function WalkInRegistration({ onSubmit, onCancel, isLoading = false }: WalkInRegistrationProps) {
  const { currentRestaurant } = useStore()
  
  const [formData, setFormData] = useState<WalkInCustomer>({
    customer_name: '',
    customer_last_name: '',
    customer_gender: '',
    customer_phone: '',
    party_size: 1
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof WalkInCustomer, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // 清除錯誤訊息
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = '請輸入客戶姓名'
    }

    if (!formData.customer_last_name.trim()) {
      newErrors.customer_last_name = '請輸入客戶姓氏'
    }

    if (formData.party_size < 1) {
      newErrors.party_size = '人數至少1人'
    } else if (formData.party_size > 8) {
      newErrors.party_size = '現場登記最多8人'
    }

    // 電話號碼可選，但如果填寫要驗證格式
    if (formData.customer_phone && !/^09\d{8}$/.test(formData.customer_phone.replace(/\s/g, ''))) {
      newErrors.customer_phone = '請輸入正確的手機號碼格式'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('現場顧客登記失敗:', error)
    }
  }

  // 快速名字範本
  const quickNameTemplates = [
    { name: '王先生', lastName: '王', gender: 'male' as const },
    { name: '李小姐', lastName: '李', gender: 'female' as const },
    { name: '陳先生', lastName: '陳', gender: 'male' as const },
    { name: '林小姐', lastName: '林', gender: 'female' as const },
    { name: '張先生', lastName: '張', gender: 'male' as const },
    { name: '黃小姐', lastName: '黃', gender: 'female' as const }
  ]

  const applyQuickTemplate = (template: typeof quickNameTemplates[0]) => {
    setFormData(prev => ({
      ...prev,
      customer_name: template.name,
      customer_last_name: template.lastName,
      customer_gender: template.gender
    }))
  }

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <UserCheck className="h-6 w-6 mr-2 text-green-600" />
          現場顧客登記
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ✕
        </button>
      </div>

      {/* 快速選擇範本 */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">快速選擇：</h3>
        <div className="grid grid-cols-3 gap-2">
          {quickNameTemplates.map((template, index) => (
            <button
              key={index}
              type="button"
              onClick={() => applyQuickTemplate(template)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 客戶姓氏 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            客戶姓氏 *
          </label>
          <input
            type="text"
            value={formData.customer_last_name}
            onChange={(e) => handleInputChange('customer_last_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            placeholder="王"
            maxLength={10}
          />
          {errors.customer_last_name && <p className="text-red-500 text-sm mt-1">{errors.customer_last_name}</p>}
        </div>

        {/* 完整姓名 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            完整姓名 *
          </label>
          <input
            type="text"
            value={formData.customer_name}
            onChange={(e) => handleInputChange('customer_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            placeholder="王先生"
          />
          {errors.customer_name && <p className="text-red-500 text-sm mt-1">{errors.customer_name}</p>}
        </div>

        {/* 性別 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            性別
          </label>
          <div className="flex gap-4">
            {[
              { value: 'male', label: '先生', icon: '👨' },
              { value: 'female', label: '小姐', icon: '👩' },
              { value: 'other', label: '其他', icon: '👤' }
            ].map(option => (
              <label key={option.value} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value={option.value}
                  checked={formData.customer_gender === option.value}
                  onChange={(e) => handleInputChange('customer_gender', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700 flex items-center">
                  {option.icon} {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 用餐人數 */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Users className="h-4 w-4 mr-2" />
            用餐人數 *
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => formData.party_size > 1 && handleInputChange('party_size', formData.party_size - 1)}
              className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              disabled={formData.party_size <= 1}
            >
              -
            </button>
            <span className="text-xl font-semibold min-w-[3rem] text-center">
              {formData.party_size} 人
            </span>
            <button
              type="button"
              onClick={() => formData.party_size < 8 && handleInputChange('party_size', formData.party_size + 1)}
              className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              disabled={formData.party_size >= 8}
            >
              +
            </button>
          </div>
          {errors.party_size && <p className="text-red-500 text-sm mt-1">{errors.party_size}</p>}
        </div>

        {/* 聯絡電話 (選填) */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Phone className="h-4 w-4 mr-2" />
            聯絡電話 (選填)
          </label>
          <input
            type="tel"
            value={formData.customer_phone}
            onChange={(e) => handleInputChange('customer_phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="09XX-XXX-XXX"
          />
          {errors.customer_phone && <p className="text-red-500 text-sm mt-1">{errors.customer_phone}</p>}
        </div>

        {/* 當前時間顯示 */}
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            到店時間: {new Date().toLocaleString('zh-TW', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        {/* 提交按鈕 */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
            disabled={isLoading}
          >
            取消
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
            disabled={isLoading}
          >
            {isLoading ? '登記中...' : '完成登記'}
          </button>
        </div>
      </form>

      {/* 提示信息 */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        現場顧客登記，方便快速識別和服務管理
      </div>
    </div>
  )
}
