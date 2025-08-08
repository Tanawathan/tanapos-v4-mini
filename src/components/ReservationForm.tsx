import React, { useState, useEffect } from 'react'
import { Calendar, Clock, Users, Phone, Mail, Baby } from 'lucide-react'
import type { ReservationFormData, AvailableSlots } from '../lib/reservation-types'
import { ReservationService } from '../services/reservationService'
import useStore from '../lib/store'

interface ReservationFormProps {
  onSubmit: (formData: ReservationFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export default function ReservationForm({ onSubmit, onCancel, isLoading = false }: ReservationFormProps) {
  const { currentRestaurant } = useStore()
  
  const [formData, setFormData] = useState<ReservationFormData>({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    party_size: 2,
    adult_count: 2,
    child_count: 0,
    child_chair_needed: false,
    reservation_date: '',
    reservation_time: '',
    special_requests: ''
  })
  
  const [availableSlots, setAvailableSlots] = useState<AvailableSlots | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 設定預設日期為今天
  useEffect(() => {
    const today = new Date()
    setFormData(prev => ({
      ...prev,
      reservation_date: today.toISOString().split('T')[0]
    }))
  }, [])

  // 當日期或人數改變時重新載入可用時段
  useEffect(() => {
    if (formData.reservation_date && formData.party_size > 0 && currentRestaurant?.id) {
      loadAvailableSlots()
    }
  }, [formData.reservation_date, formData.party_size, currentRestaurant?.id])

  // 當成人或兒童數量改變時更新總人數
  useEffect(() => {
    const totalPartySize = formData.adult_count + formData.child_count
    if (totalPartySize !== formData.party_size) {
      setFormData(prev => ({
        ...prev,
        party_size: totalPartySize
      }))
    }
  }, [formData.adult_count, formData.child_count])

  const loadAvailableSlots = async () => {
    if (!currentRestaurant?.id) return
    
    try {
      setLoadingSlots(true)
      const selectedDate = new Date(formData.reservation_date)
      const slots = await ReservationService.getAvailableTimeSlots(
        currentRestaurant.id,
        selectedDate,
        formData.party_size
      )
      setAvailableSlots(slots)
    } catch (error) {
      console.error('載入可用時段失敗:', error)
      setAvailableSlots({ date: formData.reservation_date, slots: [] })
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleInputChange = (field: keyof ReservationFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // 清除對應欄位的錯誤訊息
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = '請輸入客戶姓名'
    }

    if (!formData.customer_phone.trim()) {
      newErrors.customer_phone = '請輸入聯絡電話'
    } else if (!/^09\d{8}$/.test(formData.customer_phone.replace(/\s/g, ''))) {
      newErrors.customer_phone = '請輸入正確的手機號碼格式'
    }

    if (formData.party_size < 1) {
      newErrors.party_size = '用餐人數至少1人'
    } else if (formData.party_size > 8) {
      newErrors.party_size = '單次預約最多8人'
    }

    if (formData.adult_count < 1) {
      newErrors.adult_count = '至少需要1位成人'
    }

    if (!formData.reservation_date) {
      newErrors.reservation_date = '請選擇預約日期'
    } else {
      const selectedDate = new Date(formData.reservation_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate < today) {
        newErrors.reservation_date = '不能選擇過去的日期'
      } else {
        const maxDate = new Date(today)
        maxDate.setDate(today.getDate() + 7)
        if (selectedDate > maxDate) {
          newErrors.reservation_date = '只能預約7天內的日期'
        }
      }
    }

    if (!formData.reservation_time) {
      newErrors.reservation_time = '請選擇預約時間'
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
      console.error('提交預約失敗:', error)
    }
  }

  // 生成日期選項（今天開始的7天）
  const getDateOptions = () => {
    const dates = []
    const today = new Date()
    
    for (let i = 0; i <= 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const label = i === 0 ? '今天' : 
                   i === 1 ? '明天' : 
                   `${date.getMonth() + 1}/${date.getDate()} (${['日', '一', '二', '三', '四', '五', '六'][date.getDay()]})`
      dates.push({
        value: date.toISOString().split('T')[0],
        label
      })
    }
    
    return dates
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          預約訂位
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 客戶資訊 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
            客戶資訊
          </h3>
          
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Users className="h-4 w-4 mr-2" />
              客戶姓名 *
            </label>
            <input
              type="text"
              value={formData.customer_name}
              onChange={(e) => handleInputChange('customer_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="請輸入預約人姓名"
            />
            {errors.customer_name && <p className="text-red-500 text-sm mt-1">{errors.customer_name}</p>}
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Phone className="h-4 w-4 mr-2" />
              聯絡電話 *
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

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Mail className="h-4 w-4 mr-2" />
              電子信箱
            </label>
            <input
              type="email"
              value={formData.customer_email}
              onChange={(e) => handleInputChange('customer_email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="example@email.com（選填）"
            />
          </div>
        </div>

        {/* 用餐人數 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
            用餐人數
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                成人 *
              </label>
              <select
                value={formData.adult_count}
                onChange={(e) => handleInputChange('adult_count', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1,2,3,4,5,6,7,8].map(num => (
                  <option key={num} value={num}>{num} 位</option>
                ))}
              </select>
              {errors.adult_count && <p className="text-red-500 text-sm mt-1">{errors.adult_count}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                兒童
              </label>
              <select
                value={formData.child_count}
                onChange={(e) => handleInputChange('child_count', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[0,1,2,3,4].map(num => (
                  <option key={num} value={num}>{num} 位</option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            總人數: <span className="font-semibold">{formData.party_size} 位</span>
            {formData.party_size > 8 && (
              <span className="text-red-500 ml-2">⚠️ 超過單次預約上限</span>
            )}
          </div>

          {formData.child_count > 0 && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="childChair"
                checked={formData.child_chair_needed}
                onChange={(e) => handleInputChange('child_chair_needed', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="childChair" className="ml-2 text-sm text-gray-700 flex items-center">
                <Baby className="h-4 w-4 mr-1" />
                需要兒童椅
              </label>
            </div>
          )}
        </div>

        {/* 預約日期時間 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
            預約日期時間
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 mr-2" />
                預約日期 *
              </label>
              <select
                value={formData.reservation_date}
                onChange={(e) => handleInputChange('reservation_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">請選擇日期</option>
                {getDateOptions().map(date => (
                  <option key={date.value} value={date.value}>
                    {date.label}
                  </option>
                ))}
              </select>
              {errors.reservation_date && <p className="text-red-500 text-sm mt-1">{errors.reservation_date}</p>}
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 mr-2" />
                預約時間 *
              </label>
              <select
                value={formData.reservation_time}
                onChange={(e) => handleInputChange('reservation_time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loadingSlots || !availableSlots}
              >
                <option value="">
                  {loadingSlots ? '載入中...' : '請選擇時間'}
                </option>
                {availableSlots?.slots.map(slot => {
                  const time = new Date(slot.datetime).toLocaleTimeString('zh-TW', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false
                  })
                  return (
                    <option 
                      key={slot.datetime} 
                      value={time}
                      disabled={!slot.is_available}
                    >
                      {time} {slot.is_available ? `(剩餘${slot.available_capacity}位)` : '(已滿)'}
                    </option>
                  )
                })}
              </select>
              {errors.reservation_time && <p className="text-red-500 text-sm mt-1">{errors.reservation_time}</p>}
            </div>
          </div>
        </div>

        {/* 特殊需求 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            特殊需求
          </label>
          <textarea
            value={formData.special_requests}
            onChange={(e) => handleInputChange('special_requests', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="如有過敏食材、慶祝活動或其他特殊需求請告知..."
          />
        </div>

        {/* 提交按鈕 */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            disabled={isLoading}
          >
            取消
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={isLoading || loadingSlots}
          >
            {isLoading ? '處理中...' : '確認預約'}
          </button>
        </div>
      </form>
    </div>
  )
}
