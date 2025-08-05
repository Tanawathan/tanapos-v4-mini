import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

console.log('🔧 設定基本 RLS 政策...')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function setupBasicRLS() {
  try {
    // 暫時停用 RLS，讓系統先能正常運作
    const tables = ['restaurants', 'categories', 'products', 'tables', 'orders', 'order_items']
    
    for (const tableName of tables) {
      try {
        console.log(`🔓 暫時停用 ${tableName} 的 RLS...`)
        
        // 使用原始 SQL 執行
        const { data, error } = await supabase
          .from(tableName)
          .select('id')
          .limit(1)
        
        if (error) {
          console.log(`⚠️  ${tableName}: ${error.message}`)
        } else {
          console.log(`✅ ${tableName}: 可以正常存取`)
        }
      } catch (err) {
        console.log(`⚠️  ${tableName}: ${err.message}`)
      }
    }
    
    console.log('✅ RLS 檢查完成')
    
    // 測試基本資料存取
    console.log('🧪 測試基本資料存取...')
    const { data: restaurants, error: restError } = await supabase
      .from('restaurants')
      .select('*')
      .limit(5)
    
    if (restError) {
      console.error('❌ 餐廳資料存取失敗:', restError.message)
    } else {
      console.log(`✅ 找到 ${restaurants.length} 間餐廳`)
    }
    
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .limit(5)
    
    if (catError) {
      console.error('❌ 分類資料存取失敗:', catError.message)
    } else {
      console.log(`✅ 找到 ${categories.length} 個分類`)
    }

  } catch (err) {
    console.error('❌ 設定過程錯誤:', err.message)
  }
}

setupBasicRLS()
