import React from 'react'
import { useMobileOrderStore, OrderMode } from '../../stores/mobileOrderStore'

const OrderModeSelector: React.FC = () => {
  const { orderContext, setOrderMode } = useMobileOrderStore()

  // 只在內用模式下顯示
  if (orderContext.diningMode !== 'dine_in') {
    return null
  }

  const handleModeChange = (mode: OrderMode) => {
    setOrderMode(mode)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        訂單模式
      </label>
      <div className="flex space-x-2">
        <button
          onClick={() => handleModeChange('new')}
          className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg border transition-all ${
            orderContext.orderMode === 'new'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
          }`}
        >
          <span className="text-sm mr-1">⚪</span>
          <span className="text-sm font-medium">新訂單</span>
        </button>
        <button
          onClick={() => handleModeChange('additional')}
          className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg border transition-all ${
            orderContext.orderMode === 'additional'
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
          }`}
        >
          <span className="text-sm mr-1">🔘</span>
          <span className="text-sm font-medium">加點訂單</span>
        </button>
      </div>
    </div>
  )
}

export default OrderModeSelector
