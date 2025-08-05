import { useEffect, useState } from 'react'
import usePOSStore from './lib/store'
import OrderingPage from './components/OrderingPage'
import OrdersPage from './components/OrdersPage'
import TableManagementPage from './components/TableManagementPage'
import CheckoutPage from './components/CheckoutPage'
import SettingsPage from './components/SettingsPage'
import MenuManagementPage from './components/MenuManagementPage'
import { KDSPage } from './components/KDSPage'
import DiagnosticPanel from './components/DiagnosticPanel'
import LoginPage from './components/LoginPage'
import ConnectionTest from './components/ConnectionTest'
import { useThemeInitializer } from './hooks/useThemeInitializer'
import { supabase } from './lib/supabase'
import './utils/frontend-diagnosis'

function App() {
  // 初始化主題系統
  useThemeInitializer();
  
  const { 
    currentRestaurant, 
    setCurrentRestaurant,
    loadCategories,
    loadProducts,
    loadTables,
    loading,
    error 
  } = usePOSStore()

  const [currentPage, setCurrentPage] = useState<'home' | 'ordering' | 'orders' | 'tables' | 'checkout' | 'kds' | 'settings' | 'menu'>('home')
  const [showDiagnostic, setShowDiagnostic] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null) // null = 檢查中
  const [currentUser, setCurrentUser] = useState<any>(null)

  // 從環境變數獲取餐廳 ID
  const restaurantId = import.meta.env.VITE_RESTAURANT_ID

  // 檢查認證狀態
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setIsAuthenticated(true)
        setCurrentUser(session.user)
        console.log('✅ 用戶已認證:', session.user.email)
      } else {
        setIsAuthenticated(false)
        console.log('❌ 用戶未認證')
      }
    }

    checkAuth()

    // 監聽認證狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (event === 'SIGNED_IN') {
        setIsAuthenticated(true)
        setCurrentUser(session?.user || null)
        console.log('✅ 用戶登入:', session?.user.email)
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false)
        setCurrentUser(null)
        console.log('👋 用戶登出')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    // 只有在認證後才載入資料
    if (!isAuthenticated || !restaurantId) return

    console.log('🏪 載入餐廳資料...', restaurantId)
    
    // 設定餐廳 ID 並載入真實資料
    setCurrentRestaurant({ id: restaurantId } as any)
    
    // 載入基本資料
    loadCategories()
    loadProducts()
    loadTables()
  }, [isAuthenticated, restaurantId])

  // 認證狀態檢查中
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-ui-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-ui-primary mb-2">
            檢查認證狀態...
          </h2>
          <p className="text-ui-muted">
            正在驗證用戶身份
          </p>
        </div>
      </div>
    )
  }

  // 未認證 - 顯示登入頁面
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />
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
      {currentPage === 'ordering' ? (
        <OrderingPage onBack={() => setCurrentPage('home')} />
      ) : currentPage === 'orders' ? (
        <OrdersPage onBack={() => setCurrentPage('home')} />
      ) : currentPage === 'tables' ? (
        <TableManagementPage onBack={() => setCurrentPage('home')} />
      ) : currentPage === 'checkout' ? (
        <CheckoutPage onBack={() => setCurrentPage('home')} />
      ) : currentPage === 'kds' ? (
        <KDSPage />
      ) : currentPage === 'settings' ? (
        <SettingsPage onBack={() => setCurrentPage('home')} />
      ) : currentPage === 'menu' ? (
        <MenuManagementPage onBack={() => setCurrentPage('home')} />
      ) : (
        <>
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
                  {/* 用戶資訊 */}
                  {currentUser && (
                    <div className="text-sm text-ui-muted">
                      👤 {currentUser.email}
                    </div>
                  )}
                  
                  {/* 登出按鈕 */}
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut()
                      setIsAuthenticated(false)
                      setCurrentUser(null)
                    }}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                    title="登出系統"
                  >
                    🚪 登出
                  </button>
                  
                  <button
                    onClick={() => setShowDiagnostic(true)}
                    className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
                    title="系統診斷"
                  >
                    🔧 診斷
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 max-w-7xl mx-auto">
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

                  <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                    <div className="text-4xl mb-4">🍳</div>
                    <h3 className="text-xl font-semibold mb-2">KDS 系統</h3>
                    <p className="text-gray-600 mb-4">廚房顯示與管理系統</p>
                    <button 
                      onClick={() => setCurrentPage('kds')}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 w-full transition-colors"
                    >
                      KDS 廚房
                    </button>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                    <div className="text-4xl mb-4">📋</div>
                    <h3 className="text-xl font-semibold mb-2">菜單管理</h3>
                    <p className="text-gray-600 mb-4">管理商品、套餐與分類</p>
                    <button 
                      onClick={() => setCurrentPage('menu')}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 w-full transition-colors"
                    >
                      菜單管理
                    </button>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                    <div className="text-4xl mb-4">⚙️</div>
                    <h3 className="text-xl font-semibold mb-2">系統設定</h3>
                    <p className="text-gray-600 mb-4">主題、通知、系統設定</p>
                    <button 
                      onClick={() => setCurrentPage('settings')}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 w-full transition-colors"
                    >
                      系統設定
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

      {/* 診斷面板 */}
      <DiagnosticPanel 
        isOpen={showDiagnostic} 
        onClose={() => setShowDiagnostic(false)} 
      />
      
      {/* 連接測試組件 - 開發環境顯示 */}
      {import.meta.env.DEV && <ConnectionTest />}
    </div>
  )
}

export default App
