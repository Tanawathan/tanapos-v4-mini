import React from 'react'
import { useMobileOrderStore } from '../../stores/mobileOrderStore'

const TakeawayInfoInput: React.FC = () => {
  const { orderContext, setCustomerInfo } = useMobileOrderStore()

  // 只在外帶模式下顯示
  if (orderContext.diningMode !== 'takeaway') {
    return null
  }

  const takeawayInfo = orderContext.takeawayInfo

  const handleNameChange = (name: string) => {
    setCustomerInfo(name, takeawayInfo?.customerPhone)
  }

  const handlePhoneChange = (phone: string) => {
    setCustomerInfo(takeawayInfo?.customerName, phone)
  }

  return (
    <div className="space-y-3">
      {/* 取餐號顯示 */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-orange-700 font-medium">📞 取餐號</p>
            <p className="text-lg font-bold text-orange-800">
              {takeawayInfo?.pickupNumber || 'TO-000'}
            </p>
          </div>
          <div className="text-orange-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        </div>
      </div>

      {/* 客人資訊輸入 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            👤 客人姓名
          </label>
          <input
            type="text"
            placeholder="請輸入姓名"
            value={takeawayInfo?.customerName || ''}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            📱 聯絡電話
          </label>
          <input
            type="tel"
            placeholder="請輸入電話"
            value={takeawayInfo?.customerPhone || ''}
            onChange={(e) => handlePhoneChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 外帶提醒 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">外帶訂單提醒：</span>
              請確認餐點內容，將自動收取外帶袋費 NT$5
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TakeawayInfoInput
