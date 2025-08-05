import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function checkRLSStatus() {
  console.log('🔍 檢查 RLS 狀態...')

  try {
    // 測試直接存取各表格
    const tables = ['restaurants', 'categories', 'products', 'tables', 'orders', 'order_items']
    
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase.from(tableName).select('*').limit(1)
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`)
        } else {
          console.log(`✅ ${tableName}: 可存取 (${data.length} 筆資料)`)
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`)
      }
    }

    // 測試認證用戶存取
    console.log('\n🔐 測試認證用戶存取...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@tanapos.com',
      password: 'TanaPos2025!'
    })

    if (authError) {
      console.error('❌ 認證失敗:', authError.message)
    } else {
      console.log('✅ 認證成功:', authData.user.email)
      
      // 使用認證的 session 測試存取
      const { data, error } = await supabase.from('restaurants').select('*').limit(1)
      if (error) {
        console.log('❌ 認證用戶存取失敗:', error.message)
      } else {
        console.log('✅ 認證用戶存取成功:', data.length, '筆資料')
      }
    }

  } catch (err) {
    console.error('❌ 檢查過程發生錯誤:', err.message)
  }
}

checkRLSStatus()
