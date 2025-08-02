import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Supabase 配置
const supabaseUrl = 'https://peubpisofenlyquqnpan.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldWJwaXNvZmVubHlxdXFucGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTgwODgsImV4cCI6MjA2OTQzNDA4OH0.6IzK9jjs-Ld_mFBRQqNk594ayXapjGxwAmhQpoY26cY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function ensureTablesData() {
  try {
    console.log('🔍 檢查桌台資料...')
    
    // 檢查是否有桌台資料
    const { data: existingTables, error: checkError } = await supabase
      .from('tables')
      .select('*')
    
    if (checkError) {
      console.error('❌ 檢查桌台資料時發生錯誤:', checkError)
      
      // 如果表不存在，嘗試執行資料庫設置腳本
      console.log('🔧 嘗試執行資料庫設置...')
      
      // 讀取並執行 SQL 腳本
      const sqlScript = fs.readFileSync(path.join(__dirname, 'ensure-tables-data.sql'), 'utf8')
      
      // 注意：Supabase JavaScript 客戶端不能直接執行 SQL，需要使用 RPC
      console.log('ℹ️ 請手動在 Supabase SQL 編輯器中執行 ensure-tables-data.sql')
      console.log('或者檢查資料庫結構是否正確設置')
      
      return false
    }
    
    if (!existingTables || existingTables.length === 0) {
      console.log('📝 沒有找到桌台資料，正在創建...')
      
      // 先確保有餐廳資料
      const { data: restaurants } = await supabase
        .from('restaurants')
        .select('*')
        .limit(1)
      
      let restaurantId = restaurants?.[0]?.id
      
      if (!restaurantId) {
        console.log('🏪 創建預設餐廳...')
        const { data: newRestaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .insert({
            name: 'TanaPOS 示範餐廳',
            address: '台北市信義區信義路五段7號',
            phone: '02-1234-5678'
          })
          .select()
          .single()
        
        if (restaurantError) {
          console.error('❌ 創建餐廳失敗:', restaurantError)
          return false
        }
        
        restaurantId = newRestaurant.id
        console.log('✅ 已創建預設餐廳:', restaurantId)
      }
      
      // 創建桌台資料
      const tablesData = [
        { restaurant_id: restaurantId, table_number: 1, table_name: '桌號 1', capacity: 4, location: '一樓大廳', status: 'available' },
        { restaurant_id: restaurantId, table_number: 2, table_name: '桌號 2', capacity: 4, location: '一樓大廳', status: 'available' },
        { restaurant_id: restaurantId, table_number: 3, table_name: '桌號 3', capacity: 6, location: '一樓大廳', status: 'available' },
        { restaurant_id: restaurantId, table_number: 4, table_name: '桌號 4', capacity: 4, location: '一樓大廳', status: 'available' },
        { restaurant_id: restaurantId, table_number: 5, table_name: '桌號 5', capacity: 2, location: '一樓大廳', status: 'available' },
        { restaurant_id: restaurantId, table_number: 6, table_name: '桌號 6', capacity: 4, location: '二樓包廂區', status: 'available' },
        { restaurant_id: restaurantId, table_number: 7, table_name: '桌號 7', capacity: 6, location: '二樓包廂區', status: 'available' },
        { restaurant_id: restaurantId, table_number: 8, table_name: '桌號 8', capacity: 4, location: '二樓包廂區', status: 'available' },
        { restaurant_id: restaurantId, table_number: 9, table_name: '桌號 9', capacity: 8, location: '二樓VIP包廂', status: 'available' },
        { restaurant_id: restaurantId, table_number: 10, table_name: '桌號 10', capacity: 4, location: '露台區', status: 'available' }
      ]
      
      const { data: newTables, error: tablesError } = await supabase
        .from('tables')
        .insert(tablesData)
        .select()
      
      if (tablesError) {
        console.error('❌ 創建桌台資料失敗:', tablesError)
        return false
      }
      
      console.log('✅ 已創建', newTables.length, '個桌台')
      return true
    } else {
      console.log('✅ 找到', existingTables.length, '個桌台，無需創建')
      return true
    }
    
  } catch (error) {
    console.error('❌ 確保桌台資料時發生錯誤:', error)
    return false
  }
}

// 執行
ensureTablesData().then(success => {
  if (success) {
    console.log('🎉 桌台資料檢查完成')
  } else {
    console.log('⚠️ 桌台資料檢查未完成，請檢查資料庫連接和權限')
  }
  process.exit(0)
})
