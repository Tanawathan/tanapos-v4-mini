import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

console.log('🧪 測試更新後的配置...')
console.log('URL:', process.env.VITE_SUPABASE_URL)
console.log('Key 前30字:', process.env.VITE_SUPABASE_ANON_KEY?.substring(0, 30))

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testNewConfig() {
  try {
    console.log('🔐 測試登入...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@tanapos.com',
      password: 'TanaPos2025!'
    })

    if (error) {
      console.error('❌ 登入失敗:', error.message)
      console.error('錯誤狀態:', error.status)
      console.error('錯誤詳情:', error)
    } else {
      console.log('✅ 登入成功!')
      console.log('用戶 ID:', data.user.id)
      console.log('用戶 Email:', data.user.email)
      console.log('用戶角色:', data.user.user_metadata?.role)
    }
  } catch (err) {
    console.error('❌ 測試錯誤:', err.message)
  }
}

testNewConfig()
