import React, { useState } from 'react'
import { useMobileOrderStore } from '../../stores/mobileOrderStore'

const CartModal: React.FC = () => {
  const {
    isCartOpen,
    cartItems,
    orderContext,
    toggleCart,
    updateCartQuantity,
    updateCartNote,
    removeFromCart,
    clearCart,
    calculatePrice,
    submitOrder,
    loading,
    error
  } = useMobileOrderStore()

  const [notes, setNotes] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')

  if (!isCartOpen) return null

  const pricing = calculatePrice()
  const isEmpty = cartItems.length === 0

  const handleSubmitOrder = async () => {
    const result = await submitOrder()
    if (result) {
      setOrderNumber(result)
      setShowSuccess(true)
      setNotes('')
    }
  }

  const handleCloseSuccess = () => {
    setShowSuccess(false)
    setOrderNumber('')
  }

  const handleQuantityChange = (instanceId: string, newQuantity: number) => {
    updateCartQuantity(instanceId, newQuantity)
  }

  const handleNoteChange = (instanceId: string, note: string) => {
    updateCartNote(instanceId, note)
  }

  const getButtonText = () => {
    if (orderContext.diningMode === 'takeaway') {
      return '🚀 確認外帶'
    } else if (orderContext.orderMode === 'additional') {
      return '🚀 確認加點'
    } else {
      return '🚀 確認下單'
    }
  }

  const getHeaderText = () => {
    if (orderContext.diningMode === 'takeaway') {
      return `📦 外帶 取餐號: ${orderContext.takeawayInfo?.pickupNumber || 'TO-000'}`
    } else {
      return `🪑 內用 桌號: ${orderContext.tableNumber || 'T??'}  👥 ${orderContext.partySize || 2}人`
    }
  }

  const getOrderModeText = () => {
    if (orderContext.diningMode === 'dine_in' && orderContext.orderMode === 'additional') {
      return '📋 加點訂單 (將獨立處理)'
    }
    return null
  }

  const getSpecialNotice = () => {
    if (orderContext.diningMode === 'takeaway') {
      return '📦 外帶訂單，請確認餐點\n🥡 將提供外帶包裝服務'
    } else if (orderContext.orderMode === 'additional') {
      return '⚠️ 此為加點訂單，將獨立處理'
    }
    return null
  }

  return (
    <>
      {/* 遮罩 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={toggleCart}
      />
      
      {/* 購物車彈窗 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 max-h-[90vh] overflow-hidden">
        {/* 標題列 */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">購物車</h2>
          <button
            onClick={toggleCart}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 內容區域 */}
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* 訂單資訊 */}
          <div className="p-4 bg-gray-50 border-b">
            <p className="text-sm font-medium text-gray-800 mb-1">
              {getHeaderText()}
            </p>
            {orderContext.takeawayInfo?.customerName && (
              <p className="text-sm text-gray-600">
                👤 客人: {orderContext.takeawayInfo.customerName}
              </p>
            )}
            {getOrderModeText() && (
              <p className="text-sm text-orange-600 font-medium mt-1">
                {getOrderModeText()}
              </p>
            )}
          </div>

          {/* 購物車項目 */}
          {isEmpty ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">🛒</div>
              <p className="text-gray-600 text-lg">購物車是空的</p>
              <p className="text-gray-500 text-sm mt-2">請選擇商品加入購物車</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {cartItems.map((item) => (
                <div key={item.instanceId} className="bg-white rounded-lg border p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{item.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">NT${item.price} × {item.quantity}</p>
                      <p className="text-sm font-medium text-gray-800 mt-1">
                        = NT${item.price * item.quantity}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.instanceId)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* 數量調整 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleQuantityChange(item.instanceId, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.instanceId, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>

                    {/* 備註按鈕 */}
                    <button
                      onClick={() => {
                        const note = prompt('請輸入備註：', item.special_instructions || '')
                        if (note !== null) {
                          handleNoteChange(item.instanceId, note)
                        }
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                    >
                      📝 備註
                    </button>
                  </div>

                  {/* 顯示備註 */}
                  {item.special_instructions && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                      📝 {item.special_instructions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 總計區域 */}
          {!isEmpty && (
            <div className="p-4 border-t bg-gray-50">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>小計:</span>
                  <span>NT${pricing.subtotal}</span>
                </div>
                {pricing.serviceCharge && (
                  <div className="flex justify-between text-sm">
                    <span>服務費(10%):</span>
                    <span>NT${pricing.serviceCharge}</span>
                  </div>
                )}
                {pricing.takeawayBagFee && (
                  <div className="flex justify-between text-sm">
                    <span>外帶袋費:</span>
                    <span>NT${pricing.takeawayBagFee}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>總計:</span>
                  <span>NT${pricing.total}</span>
                </div>
              </div>

              {/* 備註欄位 */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 備註欄位
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="請輸入特殊需求..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={2}
                />
              </div>

              {/* 特殊提醒 */}
              {getSpecialNotice() && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 whitespace-pre-line">
                    {getSpecialNotice()}
                  </p>
                </div>
              )}

              {/* 錯誤訊息 */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部按鈕 */}
        {!isEmpty && (
          <div className="p-4 border-t bg-white">
            <div className="flex space-x-3">
              <button
                onClick={clearCart}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                清空
              </button>
              <button
                onClick={toggleCart}
                className="flex-1 px-4 py-3 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
              >
                繼續點餐
              </button>
              <button
                onClick={handleSubmitOrder}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '處理中...' : getButtonText()}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 成功提示彈窗 */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
            <div className="text-green-600 text-6xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              訂單提交成功！
            </h3>
            <p className="text-gray-600 mb-1">
              訂單編號：<span className="font-mono font-bold">{orderNumber}</span>
            </p>
            {orderContext.diningMode === 'takeaway' && (
              <p className="text-orange-600 font-medium mb-4">
                請記住取餐號：{orderContext.takeawayInfo?.pickupNumber}
              </p>
            )}
            <button
              onClick={handleCloseSuccess}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              確定
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default CartModal
