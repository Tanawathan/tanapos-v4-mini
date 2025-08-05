import { useState } from 'react'
import usePOSStore from '../lib/store'

interface OrderingPageProps {
  onBack: () => void
}

export default function OrderingPage({ onBack }: OrderingPageProps) {
  const {
    categories,
    products,
    comboProducts,
    tables,
    cartItems,
    selectedTable,
    currentRestaurant,
    setSelectedTable,
    addToCart,
    updateCartQuantity,
    updateCartNote,
    removeFromCart,
    getCartTotal,
    getCartItemCount,
    createOrderWithTableUpdate,
    loading
  } = usePOSStore()

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'products' | 'combos'>('products')
  const [noteModalItem, setNoteModalItem] = useState<string | null>(null)
  const [tempNote, setTempNote] = useState('')
  const [showTableModal, setShowTableModal] = useState(false)

  // 過濾產品
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category_id === selectedCategory)

  // 開啟備註模態框
  const openNoteModal = (instanceId: string) => {
    const item = cartItems.find(item => item.instanceId === instanceId)
    setTempNote(item?.special_instructions || '')
    setNoteModalItem(instanceId)
  }

  // 儲存備註
  const saveNote = () => {
    if (noteModalItem) {
      updateCartNote(noteModalItem, tempNote)
      setNoteModalItem(null)
      setTempNote('')
    }
  }

  // 關閉模態框
  const closeNoteModal = () => {
    setNoteModalItem(null)
    setTempNote('')
  }

  // 選擇桌台並關閉模態框
  const selectTable = (tableId: string) => {
    setSelectedTable(tableId)
    setShowTableModal(false)
  }

  // 取得選中桌台的資訊
  const selectedTableInfo = tables.find(table => table.id === selectedTable)

  // 處理確認下單
  const handleCreateOrder = async () => {
    if (!selectedTable || cartItems.length === 0) {
      return
    }

    if (!currentRestaurant) {
      alert('❌ 餐廳資訊載入中，請稍後再試。')
      return
    }

    // 準備訂單資料
    const orderData = {
      restaurant_id: currentRestaurant.id,
      table_id: selectedTable,
      table_number: selectedTableInfo?.table_number || 0,
      customer_name: '', // 可以添加客戶輸入
      customer_phone: '', // 可以添加客戶輸入
      subtotal: getCartTotal(),
      tax_amount: Math.round(getCartTotal() * (currentRestaurant.tax_rate || 0)),
      total_amount: getCartTotal() + Math.round(getCartTotal() * (currentRestaurant.tax_rate || 0)),
      status: 'pending' as const,
      payment_status: 'unpaid' as const,
      party_size: 1, // 可以添加人數選擇
      notes: '',
      created_at: new Date().toISOString(),
      items: cartItems.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        special_instructions: item.special_instructions || '',
        status: 'pending' as const
      }))
    }

    console.log('📋 準備建立訂單:', {
      餐廳ID: orderData.restaurant_id,
      桌台ID: orderData.table_id,
      桌號: orderData.table_number,
      總金額: orderData.total_amount,
      商品數量: orderData.items.length
    })

    try {
      // 使用整合功能創建訂單並更新桌況
      const newOrder = await createOrderWithTableUpdate(orderData)
      
      if (newOrder) {
        // 顯示成功訊息
        alert(`✅ 訂單已成功建立！\n訂單編號：${newOrder.order_number}\n桌台狀態已更新為佔用\n\n請查看控制台以查看完整訂單資訊。`)
        console.log('✅ 訂單建立成功:', newOrder)
      } else {
        alert('❌ 訂單建立失敗，請稍後再試。')
        console.error('❌ createOrderWithTableUpdate 返回 null')
      }
    } catch (error) {
      console.error('❌ 訂單建立錯誤:', error)
      alert('❌ 訂單建立時發生錯誤，請稍後再試。')
    }
  }

  return (
    <div className="min-h-screen bg-ui-secondary">
      {/* 頂部導航 */}
      <header className="bg-ui-primary shadow-sm border-b border-ui sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 左側：返回按鈕和標題 */}
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-ui-muted hover:text-ui-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>返回</span>
              </button>
              <h1 className="text-2xl font-bold text-ui-primary">🍽️ 點餐系統</h1>
            </div>

            {/* 右側：桌台選擇和購物車 */}
            <div className="flex items-center space-x-4">
              {/* 桌台選擇 */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-ui-muted">桌台：</span>
                <button
                  onClick={() => setShowTableModal(true)}
                  className="px-3 py-2 border border-ui rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-ui-secondary transition-colors flex items-center space-x-2"
                >
                  {selectedTableInfo ? (
                    <span>
                      桌號 {selectedTableInfo.table_number} {selectedTableInfo.name && `(${selectedTableInfo.name})`}
                    </span>
                  ) : (
                    <span className="text-gray-500">請選擇桌台</span>
                  )}
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* 購物車按鈕 */}
              <button className="relative bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h15M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                  <span>購物車</span>
                  {getCartItemCount() > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {getCartItemCount()}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側：分類和產品列表 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 產品類型切換 */}
            <div className="bg-ui-primary rounded-lg shadow-sm border border-ui p-4">
              <div className="flex space-x-4">
                <button
                  onClick={() => setViewMode('products')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === 'products'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  單點商品
                </button>
                <button
                  onClick={() => setViewMode('combos')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === 'combos'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  套餐商品
                </button>
              </div>
            </div>

            {viewMode === 'products' && (
              <>
                {/* 分類篩選 */}
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <h3 className="text-lg font-semibold mb-3">商品分類</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      全部商品
                    </button>
                    {categories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 產品列表 */}
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <h3 className="text-lg font-semibold mb-4">選擇商品</h3>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-gray-600">載入商品中...</p>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">此分類暫無商品</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredProducts.map(product => {
                        // 計算此商品在購物車中的總數量
                        const productQuantityInCart = cartItems
                          .filter(item => item.id === product.id)
                          .reduce((total, item) => total + item.quantity, 0)
                        
                        return (
                          <button
                            key={product.id}
                            onClick={() => addToCart(product)}
                            disabled={!product.is_available}
                            className={`relative border rounded-lg p-4 text-left transition-all duration-200 ${
                              product.is_available
                                ? 'hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 cursor-pointer'
                                : 'opacity-50 cursor-not-allowed'
                            }`}
                          >
                            {/* 數量徽章 */}
                            {productQuantityInCart > 0 && (
                              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg z-10">
                                {productQuantityInCart}
                              </div>
                            )}
                            
                            {product.image_url && (
                              <img 
                                src={product.image_url} 
                                alt={product.name}
                                className="w-full h-32 object-cover rounded-lg mb-3"
                              />
                            )}
                            <h4 className="font-semibold text-gray-900 mb-2">{product.name}</h4>
                            {product.description && (
                              <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-bold text-blue-600">
                                NT$ {product.price.toLocaleString()}
                              </span>
                              {!product.is_available && (
                                <span className="text-sm text-gray-500 font-medium">暫時缺貨</span>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {viewMode === 'combos' && (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="text-lg font-semibold mb-4">套餐商品</h3>
                {comboProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">暫無套餐商品</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {comboProducts.map(combo => {
                      // 計算此套餐在購物車中的總數量
                      const comboQuantityInCart = cartItems
                        .filter(item => item.id === combo.id)
                        .reduce((total, item) => total + item.quantity, 0)
                      
                      return (
                        <button
                          key={combo.id}
                          onClick={() => addToCart(combo)}
                          disabled={!combo.is_available}
                          className={`relative border rounded-lg p-4 text-left transition-all duration-200 ${
                            combo.is_available
                              ? 'hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 cursor-pointer'
                              : 'opacity-50 cursor-not-allowed'
                          }`}
                        >
                          {/* 數量徽章 */}
                          {comboQuantityInCart > 0 && (
                            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg z-10">
                              {comboQuantityInCart}
                            </div>
                          )}
                          
                          <h4 className="font-semibold text-gray-900 mb-2">{combo.name}</h4>
                          {combo.description && (
                            <p className="text-sm text-gray-600 mb-3">{combo.description}</p>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-blue-600">
                              NT$ {combo.price.toLocaleString()}
                            </span>
                            {!combo.is_available && (
                              <span className="text-sm text-gray-500 font-medium">暫時缺貨</span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 右側：購物車 */}
          <div className="bg-ui-primary rounded-lg shadow-sm border border-ui p-4 h-fit sticky top-24">
            <h3 className="text-lg font-semibold mb-4 text-ui-primary">購物車</h3>
            
            {/* 桌台資訊 */}
            {selectedTableInfo ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      桌號 {selectedTableInfo.table_number}
                    </p>
                    {selectedTableInfo.name && (
                      <p className="text-xs text-green-600">({selectedTableInfo.name})</p>
                    )}
                    <p className="text-xs text-green-600">{selectedTableInfo.capacity} 人座</p>
                  </div>
                  <button
                    onClick={() => setShowTableModal(true)}
                    className="text-xs text-green-600 hover:text-green-800 underline"
                  >
                    變更桌台
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-yellow-800">請先選擇桌台</p>
                  <button
                    onClick={() => setShowTableModal(true)}
                    className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors"
                  >
                    選擇桌台
                  </button>
                </div>
              </div>
            )}

            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h15M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
                <p className="text-gray-600 text-sm">購物車是空的</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {cartItems.map(item => (
                    <div key={item.instanceId} className="border-b pb-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          <p className="text-xs text-gray-600">NT$ {item.price.toLocaleString()}</p>
                          {item.special_instructions && (
                            <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded mt-1">
                              <span className="font-medium">備註:</span> {item.special_instructions}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateCartQuantity(item.instanceId, item.quantity - 1)}
                            className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-300"
                          >
                            -
                          </button>
                          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.instanceId, item.quantity + 1)}
                            className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-300"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.instanceId)}
                            className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-red-600 hover:bg-red-200 ml-2"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      
                      {/* 備註按鈕 */}
                      <div className="flex justify-start">
                        <button
                          onClick={() => openNoteModal(item.instanceId)}
                          className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors flex items-center space-x-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>{item.special_instructions ? '編輯備註' : '加入備註'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold">總計：</span>
                    <span className="text-xl font-bold text-blue-600">
                      NT$ {getCartTotal().toLocaleString()}
                    </span>
                  </div>
                  
                  <button
                    disabled={!selectedTable || cartItems.length === 0}
                    onClick={handleCreateOrder}
                    className={`w-full py-3 rounded-lg font-medium transition-colors ${
                      selectedTable && cartItems.length > 0
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    確認下單
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 備註模態框 */}
      {noteModalItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-ui-primary rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-ui-primary">商品備註</h3>
              <button
                onClick={closeNoteModal}
                className="text-ui-muted hover:text-ui-primary transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-ui-secondary mb-2">
                備註內容
              </label>
              <textarea
                value={tempNote}
                onChange={(e) => setTempNote(e.target.value)}
                placeholder="請輸入商品備註（例如：不要洋蔥、多加醬汁、少冰等）"
                className="w-full h-24 px-3 py-2 border border-ui rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-ui-primary text-ui-primary"
                maxLength={100}
              />
              <div className="text-right text-xs text-ui-muted mt-1">
                {tempNote.length}/100 字
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={closeNoteModal}
                className="w-full sm:w-auto px-4 py-2 text-ui-muted border border-ui rounded-lg hover:text-ui-primary hover:bg-ui-secondary transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveNote}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                確定儲存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 桌台選擇模態框 */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-ui-primary rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-ui-primary">選擇桌台</h3>
                <p className="text-ui-muted mt-1">請選擇可用的桌台開始點餐</p>
              </div>
              <button
                onClick={() => setShowTableModal(false)}
                className="text-ui-muted hover:text-ui-primary p-2 hover:bg-ui-secondary rounded-full transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {tables.map(table => (
                <div
                  key={table.id}
                  className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
                    table.status === 'available' 
                      ? 'border-green-200 bg-gradient-to-br from-green-50 to-green-100 hover:border-green-300 hover:shadow-green-200/50' 
                      : table.status === 'occupied'
                      ? 'border-red-200 bg-gradient-to-br from-red-50 to-red-100 cursor-not-allowed opacity-75'
                      : 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100 cursor-not-allowed opacity-75'
                  } ${
                    selectedTable === table.id ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg shadow-blue-200/50' : ''
                  }`}
                  onClick={() => table.status === 'available' && selectTable(table.id)}
                >
                  {/* 選中指示器 */}
                  {selectedTable === table.id && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className="text-3xl mb-3">
                      {table.status === 'available' ? '🪑' : table.status === 'occupied' ? '👥' : '🔧'}
                    </div>
                    <div className="font-bold text-lg text-gray-900 mb-1">
                      桌號 {table.table_number}
                    </div>
                    {table.name && (
                      <div className="text-sm text-gray-600 mb-2 font-medium">
                        ({table.name})
                      </div>
                    )}
                    <div className="text-sm text-gray-700 mb-3 font-medium">
                      {table.capacity} 人座
                    </div>
                    <div className={`inline-block text-xs px-3 py-1 rounded-full font-semibold ${
                      table.status === 'available' 
                        ? 'bg-green-200 text-green-800' 
                        : table.status === 'occupied'
                        ? 'bg-red-200 text-red-800'
                        : 'bg-yellow-200 text-yellow-800'
                    }`}>
                      {table.status === 'available' ? '✓ 可使用' : 
                       table.status === 'occupied' ? '✗ 使用中' : '⚠ 維護中'}
                    </div>
                    
                    {table.status === 'available' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          selectTable(table.id)
                        }}
                        className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg"
                      >
                        選擇此桌
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {tables.filter(t => t.status === 'available').length === 0 && (
              <div className="text-center py-8">
                <div className="text-ui-muted text-4xl mb-4">😔</div>
                <p className="text-ui-muted">目前沒有可用的桌台</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
