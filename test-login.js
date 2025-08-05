import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// 載入環境變數
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Supabase 配置檢查:')
console.log('URL:', supabaseUrl)
console.log('Key 前20字:', supabaseKey?.substring(0, 20))

const supabase = createClient(supabaseUrl, supabaseKey)

async function testLogin() {
  console.log('\n🧪 測試管理者登入...')
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@tanapos.com',
      password: 'TanaPos2025!'
    })

    if (error) {
      console.error('❌ 登入失敗:', error.message)
      console.error('錯誤詳情:', error)
    } else {
      console.log('✅ 登入成功!')
      console.log('用戶 ID:', data.user?.id)
      console.log('用戶 Email:', data.user?.email)
      console.log('用戶 Metadata:', data.user?.user_metadata)
      console.log('Session Token:', data.session?.access_token?.substring(0, 20) + '...')
    }
  } catch (err) {
    console.error('❌ 登入過程發生錯誤:', err)
  }
}

testLogin()
