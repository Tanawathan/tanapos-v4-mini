import React, { useEffect } from 'react'
import { useMobileOrderStore } from '../stores/mobileOrderStore'
import DiningModeSelector from './mobile/DiningModeSelector'
import OrderModeSelector from './mobile/OrderModeSelector'
import TableSelector from './mobile/TableSelector'
import TakeawayInfoInput from './mobile/TakeawayInfoInput'
import ProductCategoryTabs from './mobile/ProductCategoryTabs'
import ProductGrid from './mobile/ProductGrid'
import FloatingCart from './mobile/FloatingCart'
import CartModal from './mobile/CartModal'

interface MobileOrderingPageProps {
  onBack?: () => void
}

const MobileOrderingPage: React.FC<MobileOrderingPageProps> = ({ onBack }) => {
  const {
    orderContext,
    loading,
    error,
    loadCategories,
    loadProducts,
    loadTables,
    clearError
  } = useMobileOrderStore()

  // 初始化資料載入
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        loadCategories(),
        loadProducts(),
        loadTables()
      ])
    }

    initializeData()
  }, [loadCategories, loadProducts, loadTables])

  // 錯誤處理
  const handleErrorClose = () => {
    clearError()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24"> {/* 底部留空給浮動購物車 */}
      {/* 頂部導航區 */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}
            <h1 className="text-lg font-semibold text-gray-800">📱 TanaPOS Mobile</h1>
          </div>
          <div className="flex items-center space-x-2">
            <FloatingCart />
            <div className="text-sm text-gray-600">👤 服務員</div>
          </div>
        </div>

        {/* 用餐方式選擇 */}
        <div className="px-4 pb-3">
          <DiningModeSelector />
        </div>

        {/* 桌台資訊或外帶資訊 */}
        <div className="px-4 pb-4">
          {orderContext.diningMode === 'dine_in' ? (
            <div className="space-y-3">
              <div className="flex space-x-3">
                <TableSelector />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    👥 人數
                  </label>
                  <select 
                    value={orderContext.partySize || 2}
                    onChange={(e) => useMobileOrderStore.getState().setPartySize(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map(size => (
                      <option key={size} value={size}>{size}人</option>
                    ))}
                  </select>
                </div>
              </div>
              <OrderModeSelector />
            </div>
          ) : (
            <TakeawayInfoInput />
          )}
        </div>
      </div>

      {/* 錯誤提示 */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-3">
              <button
                onClick={handleErrorClose}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 商品分類標籤 */}
      <div className="bg-white border-b">
        <ProductCategoryTabs />
      </div>

      {/* 商品展示區 */}
      <div className="p-4">
        <ProductGrid />
      </div>

      {/* 購物車彈窗 */}
      <CartModal />
    </div>
  )
}

export default MobileOrderingPage
