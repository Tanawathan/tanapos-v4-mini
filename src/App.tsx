import { useEffect } from 'react'
import usePOSStore from './lib/store'
import AppRouter from './routes/AppRouter'
import { useThemeInitializer } from './hooks/useThemeInitializer'
import './utils/frontend-diagnosis'

function App() {
  // 初始化主題系統
  useThemeInitializer();
  
  const { 
    setCurrentRestaurant,
    loadCategories,
    loadProducts,
    loadTables,
  } = usePOSStore()

  // 從環境變數獲取餐廳 ID
  const restaurantId = import.meta.env.VITE_RESTAURANT_ID

  useEffect(() => {
    if (!restaurantId) return

    console.log('🏪 初始化餐廳資料...', restaurantId)
    
    // 設定餐廳 ID 並載入真實資料
    setCurrentRestaurant({ id: restaurantId } as any)
    
    // 載入基本資料
    loadCategories()
    loadProducts()
    loadTables()
  }, [restaurantId, setCurrentRestaurant, loadCategories, loadProducts, loadTables])

  // 使用 AppRouter 處理所有路由和認證
  return <div data-app-mounted><AppRouter /></div>
}

export default App
