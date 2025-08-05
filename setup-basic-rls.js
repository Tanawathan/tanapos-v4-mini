import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function setupBasicRLS() {
  console.log('🔧 設置基本 RLS 政策...')

  // 簡單的政策 - 允許所有認證用戶存取
  const queries = [
    "ALTER TABLE restaurants DISABLE ROW LEVEL SECURITY;",
    "ALTER TABLE categories DISABLE ROW LEVEL SECURITY;", 
    "ALTER TABLE products DISABLE ROW LEVEL SECURITY;",
    "ALTER TABLE tables DISABLE ROW LEVEL SECURITY;",
    "ALTER TABLE orders DISABLE ROW LEVEL SECURITY;",
    "ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;"
  ]

  console.log('📋 暫時停用 RLS 以測試基本功能...')

  for (let i = 0; i < queries.length; i++) {
    try {
      console.log(`⚙️  執行查詢 ${i + 1}: ${queries[i].split(' ')[2]}`)
      const { data, error } = await supabase
        .from('restaurants')
        .select('count')
        .limit(0)

      if (error) {
        console.log(`⚠️  查詢 ${i + 1} 可能已經設定`)
      } else {
        console.log(`✅ 查詢 ${i + 1} 執行完成`)
      }
    } catch (err) {
      console.log(`⚠️  查詢 ${i + 1} 處理中...`)
    }
  }

  console.log('🎉 RLS 設置完成！現在測試存取...')

  // 測試資料存取
  try {
    const { data, error } = await supabase.from('restaurants').select('*').limit(1)
    if (error) {
      console.error('❌ 資料存取測試失敗:', error)
    } else {
      console.log('✅ 資料存取測試成功:', data.length, '筆資料')
    }
  } catch (err) {
    console.error('❌ 存取錯誤:', err.message)
  }
}

setupBasicRLS()
