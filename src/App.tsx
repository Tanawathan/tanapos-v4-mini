import { useEffect, useState } from 'react'
import usePOSStore from './lib/store'
import OrderingPage from './components/OrderingPage'
import OrdersPage from './components/OrdersPage'
import TableManagementPage from './components/TableManagementPage'
import CheckoutPage from './components/CheckoutPage'

function App() {
  const { 
    currentRestaurant, 
    setCurrentRestaurant,
    loadCategories,
    loadProducts,
    loadTables,
    loading,
    error 
  } = usePOSStore()

  const [currentPage, setCurrentPage] = useState<'home' | 'ordering' | 'orders' | 'tables' | 'checkout'>('home')

  useEffect(() => {
    // 模擬餐廳資料（實際應用中會從資料庫載入）
    const mockRestaurant = {
      id: '1',
      name: 'TanaPOS 餐廳',
      address: '台北市中正區',
      phone: '02-1234-5678',
      email: 'info@tanapos.com',
      tax_rate: 0.1,
      service_charge_rate: 0.1,
      currency: 'TWD',
      timezone: 'Asia/Taipei',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setCurrentRestaurant(mockRestaurant)
    
    // 載入基本資料
    loadCategories()
    loadProducts()
    loadTables()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            載入中...
          </h2>
          <p className="text-gray-600">
            系統正在初始化，請稍候
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            系統錯誤
          </h2>
          <p className="text-gray-600 mb-4">
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            重新載入
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentPage === 'ordering' ? (
        <OrderingPage onBack={() => setCurrentPage('home')} />
      ) : currentPage === 'orders' ? (
        <OrdersPage onBack={() => setCurrentPage('home')} />
      ) : currentPage === 'tables' ? (
        <TableManagementPage onBack={() => setCurrentPage('home')} />
      ) : currentPage === 'checkout' ? (
        <CheckoutPage onBack={() => setCurrentPage('home')} />
      ) : (
        <>
          {/* 頂部標題列 */}
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900">
                    🍽️ TanaPOS v4 AI
                  </h1>
                  {currentRestaurant && (
                    <span className="ml-4 text-sm text-gray-500">
                      {currentRestaurant.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {new Date().toLocaleDateString('zh-TW')}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* 主要內容區 */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {currentRestaurant ? (
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  歡迎使用 TanaPOS v4 AI 系統
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  餐廳：{currentRestaurant.name}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                  <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                    <div className="text-4xl mb-4">📋</div>
                    <h3 className="text-xl font-semibold mb-2">點餐系統</h3>
                    <p className="text-gray-600 mb-4">管理客戶點餐和訂單</p>
                    <button 
                      onClick={() => setCurrentPage('ordering')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full transition-colors"
                    >
                      開始點餐
                    </button>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                    <div className="text-4xl mb-4">📊</div>
                    <h3 className="text-xl font-semibold mb-2">訂單管理</h3>
                    <p className="text-gray-600 mb-4">查看和管理所有訂單</p>
                    <button 
                      onClick={() => setCurrentPage('orders')}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 w-full transition-colors"
                    >
                      訂單管理
                    </button>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                    <div className="text-4xl mb-4">🪑</div>
                    <h3 className="text-xl font-semibold mb-2">桌台管理</h3>
                    <p className="text-gray-600 mb-4">管理餐廳桌台狀態</p>
                    <button 
                      onClick={() => setCurrentPage('tables')}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 w-full transition-colors"
                    >
                      桌台管理
                    </button>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                    <div className="text-4xl mb-4">💳</div>
                    <h3 className="text-xl font-semibold mb-2">結帳系統</h3>
                    <p className="text-gray-600 mb-4">處理付款和結帳</p>
                    <button 
                      onClick={() => setCurrentPage('checkout')}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 w-full transition-colors"
                    >
                      結帳管理
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  歡迎使用 TanaPOS v4 AI
                </h2>
                <p className="text-gray-600">
                  請稍候，系統正在初始化...
                </p>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  )
}

export default App
