/**
 * TanaPOS 系統配置文件
 * 
 * 這個文件包含了系統的基本配置設定
 */

export const APP_CONFIG = {
  // 應用程式基本資訊
  APP_NAME: 'TanaPOS V4-Mini',
  APP_VERSION: '4.0.0',
  
  // Supabase 配置
  SUPABASE_URL: 'https://eyuohprllmpjvnqsuwme.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5dW9ocHJsbG1wanZucXN1d21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0Mjg1NjcsImV4cCI6MjA0ODAwNDU2N30.8SYEDOWJQWCg5wBP-f_c2s6llMuGH0x8Vm2V_6T3SYE',
  
  // 系統模式設定
  OFFLINE_MODE: false, // 設為 true 使用離線模式
  AUTO_REFRESH_INTERVAL: 30000, // 數據自動刷新間隔（毫秒）
  
  // 模擬數據（離線模式使用）
  MOCK_DATA: {
    todayOrders: 15,
    todayRevenue: 1350,
    pendingOrders: 2,
    occupiedTables: 4,
    
    // 模擬產品數據
    products: [
      { id: 1, name: '經典漢堡', price: 30, category: '主餐' },
      { id: 2, name: '起司漢堡', price: 35, category: '主餐' },
      { id: 3, name: '薯條', price: 15, category: '配菜' },
      { id: 4, name: '可樂', price: 5, category: '飲料' },
    ],
    
    // 模擬訂單數據
    orders: [
      {
        id: 1,
        table_number: 1,
        status: 'pending',
        total_amount: 65,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        table_number: 3,
        status: 'preparing',
        total_amount: 45,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      }
    ]
  },
  
  // UI 設定
  THEME: {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981'
  },
  
  // 功能開關
  FEATURES: {
    DASHBOARD: true,
    POS_SYSTEM: false, // 開發中
    KDS_SYSTEM: false, // 開發中
    REPORTS: true,
    INVENTORY: false, // 開發中
    SETTINGS: false, // 開發中
    STAFF_MANAGEMENT: false // 開發中
  },
  
  // 開發設定
  DEV_MODE: true,
  DEBUG_LOGS: true
}

// 餐廳基本資訊
export const RESTAURANT_INFO = {
  name: 'TanaPOS 示範餐廳',
  address: '台北市信義區信義路五段7號',
  phone: '02-1234-5678',
  email: 'demo@tanapos.com',
  website: 'https://tanapos.com'
}

// 系統訊息
export const SYSTEM_MESSAGES = {
  OFFLINE_MODE: '目前使用離線模式，部分功能可能受限',
  ONLINE_MODE: '已連接到雲端服務',
  LOADING: '正在載入數據...',
  ERROR: '發生錯誤，請稍後再試',
  NO_DATA: '暫無數據',
  FEATURE_DISABLED: '此功能尚未開放，敬請期待'
}

export default APP_CONFIG
