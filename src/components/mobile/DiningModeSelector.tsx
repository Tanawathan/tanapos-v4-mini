import React from 'react'
import { useMobileOrderStore, DiningMode } from '../../stores/mobileOrderStore'

const DiningModeSelector: React.FC = () => {
  const { orderContext, setDiningMode } = useMobileOrderStore()

  const handleModeChange = (mode: DiningMode) => {
    setDiningMode(mode)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        用餐方式
      </label>
      <div className="flex space-x-2">
        <button
          onClick={() => handleModeChange('dine_in')}
          className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-all ${
            orderContext.diningMode === 'dine_in'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
          }`}
        >
          <span className="text-lg mr-2">🪑</span>
          <span className="font-medium">內用</span>
        </button>
        <button
          onClick={() => handleModeChange('takeaway')}
          className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-all ${
            orderContext.diningMode === 'takeaway'
              ? 'border-orange-500 bg-orange-50 text-orange-700'
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
          }`}
        >
          <span className="text-lg mr-2">📦</span>
          <span className="font-medium">外帶</span>
        </button>
      </div>
    </div>
  )
}

export default DiningModeSelector
