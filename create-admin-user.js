import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

console.log('👤 建立管理者用戶...')

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

async function createAdmin() {
  try {
    // 先刪除可能存在的舊用戶
    const { data: users } = await supabase.auth.admin.listUsers()
    const existingAdmin = users.users.find(u => u.email === 'admin@tanapos.com')
    
    if (existingAdmin) {
      console.log('🗑️ 刪除現有管理者用戶...')
      await supabase.auth.admin.deleteUser(existingAdmin.id)
    }

    // 建立新的管理者用戶
    console.log('🔐 建立新管理者用戶...')
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@tanapos.com',
      password: 'TanaPos2025!',
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        name: 'TanaPOS Administrator',
        restaurant_id: '11111111-1111-1111-1111-111111111111'
      }
    })

    if (error) {
      console.error('❌ 建立管理者失敗:', error.message)
    } else {
      console.log('✅ 管理者建立成功!')
      console.log('用戶 ID:', data.user.id)
      console.log('用戶 Email:', data.user.email)
      
      // 測試登入
      const testClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      )
      
      const { data: loginData, error: loginError } = await testClient.auth.signInWithPassword({
        email: 'admin@tanapos.com',
        password: 'TanaPos2025!'
      })
      
      if (loginError) {
        console.error('❌ 登入測試失敗:', loginError.message)
      } else {
        console.log('✅ 登入測試成功!')
      }
    }
  } catch (err) {
    console.error('❌ 過程錯誤:', err.message)
  }
}

createAdmin()
