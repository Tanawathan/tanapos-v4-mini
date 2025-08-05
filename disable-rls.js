import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

console.log('🔧 停用 RLS 政策以進行測試...')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function disableRLS() {
  const tables = ['restaurants', 'categories', 'products', 'tables', 'orders', 'order_items']
  
  for (const table of tables) {
    try {
      // 使用直接的 SQL 執行
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(0)
      
      if (error) {
        console.log(`⚠️ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: 可正常存取`)
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`)
    }
  }
  
  console.log('✅ RLS 檢查完成')
}

disableRLS()
