import React from 'react'
import { Link } from 'react-router-dom'
import usePOSStore from '../lib/store'
import { supabase } from '../lib/supabase'
import { useThemeInitializer } from '../hooks/useThemeInitializer'

const HomePage: React.FC = () => {
  // 初始化主題系統
  useThemeInitializer()
  
  const { 
    currentRestaurant, 
    setCurrentRestaurant,
    loadCategories,
    loadProducts,
    loadTables,
    loading,
    error 
  } = usePOSStore()

  // 從環境變數獲取餐廳 ID
  const restaurantId = import.meta.env.VITE_RESTAURANT_ID

  React.useEffect(() => {
    if (!restaurantId) return

    console.log('🏪 載入餐廳資料...', restaurantId)
    
    // 設定餐廳 ID 並載入真實資料
    setCurrentRestaurant({ id: restaurantId } as any)
    
    // 載入基本資料
    loadCategories()
    loadProducts()
    loadTables()
  }, [restaurantId, setCurrentRestaurant, loadCategories, loadProducts, loadTables])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    // 路由會自動重定向到登入頁面
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ui-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-ui-primary mb-2">
            載入中...
          </h2>
          <p className="text-ui-muted">
            系統正在初始化，請稍候
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ui-secondary flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-ui-primary mb-2">
            系統錯誤
          </h2>
          <p className="text-ui-muted mb-4">
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
    <div className="min-h-screen bg-ui-secondary">
      {/* 頂部標題列 */}
      <header className="bg-ui-primary shadow-sm border-b border-ui">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-ui-primary">
                🍽️ TanaPOS v4 AI
              </h1>
              {currentRestaurant && (
                <span className="ml-4 text-sm text-ui-muted">
                  {currentRestaurant.name}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {/* 登出按鈕 */}
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                title="登出系統"
              >
                🚪 登出
              </button>
              
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">📱</div>
                <h3 className="text-xl font-semibold mb-2">手機點餐</h3>
                <p className="text-gray-600 mb-4">顧客自助點餐系統</p>
                <Link 
                  to="/mobile"
                  className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 w-full transition-colors inline-block"
                >
                  手機點餐
                </Link>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-xl font-semibold mb-2">點餐系統</h3>
                <p className="text-gray-600 mb-4">管理客戶點餐和訂單</p>
                <Link 
                  to="/ordering"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full transition-colors inline-block"
                >
                  開始點餐
                </Link>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="text-xl font-semibold mb-2">預約管理</h3>
                <p className="text-gray-600 mb-4">管理客戶預約訂位</p>
                <Link 
                  to="/reservations"
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 w-full transition-colors inline-block"
                >
                  預約管理
                </Link>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-semibold mb-2">訂單管理</h3>
                <p className="text-gray-600 mb-4">查看和管理所有訂單</p>
                <Link 
                  to="/orders"
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 w-full transition-colors inline-block"
                >
                  訂單管理
                </Link>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">🪑</div>
                <h3 className="text-xl font-semibold mb-2">桌台管理</h3>
                <p className="text-gray-600 mb-4">管理餐廳桌台狀態</p>
                <Link 
                  to="/tables"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 w-full transition-colors inline-block"
                >
                  桌台管理
                </Link>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">💳</div>
                <h3 className="text-xl font-semibold mb-2">結帳系統</h3>
                <p className="text-gray-600 mb-4">處理付款和結帳</p>
                <Link 
                  to="/checkout"
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 w-full transition-colors inline-block"
                >
                  結帳管理
                </Link>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">🍳</div>
                <h3 className="text-xl font-semibold mb-2">KDS 系統</h3>
                <p className="text-gray-600 mb-4">廚房顯示與管理系統</p>
                <Link 
                  to="/kds"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 w-full transition-colors inline-block"
                >
                  KDS 廚房
                </Link>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-xl font-semibold mb-2">菜單管理</h3>
                <p className="text-gray-600 mb-4">管理商品、套餐與分類</p>
                <Link 
                  to="/menu"
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 w-full transition-colors inline-block"
                >
                  菜單管理
                </Link>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">⚙️</div>
                <h3 className="text-xl font-semibold mb-2">系統設定</h3>
                <p className="text-gray-600 mb-4">主題、通知、系統設定</p>
                <Link 
                  to="/settings"
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 w-full transition-colors inline-block"
                >
                  系統設定
                </Link>
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
    </div>
  )
}

export default HomePage
