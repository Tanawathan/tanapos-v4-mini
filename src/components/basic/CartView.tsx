import { useState } from 'react'
import { usePOSStore } from '../../lib/store-complete'
import type { CartItem, Table } from '../../lib/types-unified'

// 工具函數
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD'
  }).format(amount)
}

export default function CartView() {
  const { 
    cartItems, 
    tables, 
    selectedTable, 
    setSelectedTable, 
    removeFromCart, 
    updateCartQuantity, 
    clearCart, 
    getCartTotal,
    createOrder 
  } = usePOSStore()
  
  const [isProcessing, setIsProcessing] = useState(false)

  const handleRemoveItem = (productId: string) => {
    removeFromCart(productId)
  }

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      updateCartQuantity(productId, quantity)
    }
  }

  const handleCheckout = async () => {
    if (cartItems.length === 0) return
    
    setIsProcessing(true)
    try {
      const orderData = {
        table_id: selectedTable || undefined,
        table_number: selectedTable ? tables.find(t => t.id === selectedTable)?.table_number : undefined,
        subtotal: getCartTotal(),
        tax_amount: getCartTotal() * 0.1,
        total_amount: getCartTotal() * 1.1,
        status: 'pending' as const,
        order_items: cartItems.map(item => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          status: 'pending' as const
        }))
      }

      await createOrder(orderData)
      clearCart()
      setSelectedTable(null)
      alert('訂單已成功建立！')
    } catch (error) {
      console.error('Failed to create order:', error)
      alert('建立訂單失敗，請重試')
    } finally {
      setIsProcessing(false)
    }
  }

  const availableTables = tables.filter((table: Table) => table.status === 'available')

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">購物車</h2>
      
      {/* Cart Items */}
      <div className="space-y-3 mb-6">
        {cartItems.length === 0 ? (
          <p className="text-gray-500 text-center py-8">購物車是空的</p>
        ) : (
          cartItems.map((item: CartItem) => (
            <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div className="flex-1">
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-gray-500">{formatCurrency(item.price)}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                >
                  -
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                >
                  +
                </button>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Table Selection */}
      {cartItems.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium mb-2">選擇桌位</h3>
          <div className="grid grid-cols-4 gap-2">
            {availableTables.map((table: Table) => (
              <button
                key={table.id}
                onClick={() => setSelectedTable(table.id)}
                className={`p-2 rounded text-sm ${
                  selectedTable === table.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                桌 {table.table_number}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Total and Actions */}
      {cartItems.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="font-medium">小計：</span>
            <span className="text-lg font-bold">{formatCurrency(getCartTotal())}</span>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={clearCart}
              className="w-full py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              清空購物車
            </button>
            
            <button
              onClick={handleCheckout}
              disabled={isProcessing || !selectedTable}
              className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? '處理中...' : '結帳'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
