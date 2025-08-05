import React from 'react'
import { useMobileOrderStore } from '../../stores/mobileOrderStore'

const FloatingCart: React.FC = () => {
  const { getCartItemCount, calculatePrice, toggleCart } = useMobileOrderStore()

  const itemCount = getCartItemCount()
  const pricing = calculatePrice()

  if (itemCount === 0) {
    return null
  }

  return (
    <button
      onClick={toggleCart}
      className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 z-40"
    >
      <div className="flex flex-col items-center p-4 min-w-[80px]">
        <div className="relative mb-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l-2.5-5M17 17a2 2 0 11-4 0 2 2 0 014 0zM9 17a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </div>
        <div className="text-xs font-medium text-center">
          <div>🛒 {itemCount}</div>
          <div className="text-[10px] opacity-90">
            總計
          </div>
          <div className="text-sm font-bold">
            ${pricing.total}
          </div>
        </div>
      </div>
    </button>
  )
}

export default FloatingCart
