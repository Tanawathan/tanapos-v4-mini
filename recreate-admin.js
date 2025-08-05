import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

console.log('🔧 重新設定管理者用戶...')

// 使用 Service Key 來建立管理者
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

async function recreateAdmin() {
  try {
    console.log('🗑️  刪除現有的管理者用戶...')
    
    // 先查找現有用戶
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) {
      console.error('查找用戶錯誤:', listError.message)
    } else {
      console.log('找到用戶數量:', users.users.length)
      
      // 找到 admin@tanapos.com 用戶並刪除
      const adminUser = users.users.find(u => u.email === 'admin@tanapos.com')
      if (adminUser) {
        console.log('找到現有管理者用戶，正在刪除...')
        const { error: deleteError } = await supabase.auth.admin.deleteUser(adminUser.id)
        if (deleteError) {
          console.error('刪除用戶錯誤:', deleteError.message)
        } else {
          console.log('✅ 舊用戶已刪除')
        }
      }
    }

    console.log('👤 建立新的管理者用戶...')
    
    // 建立新的管理者用戶
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
      console.error('錯誤詳情:', error)
    } else {
      console.log('✅ 管理者建立成功!')
      console.log('- 用戶 ID:', data.user.id)
      console.log('- 用戶 Email:', data.user.email)
      console.log('- 用戶 Metadata:', data.user.user_metadata)
      
      // 測試登入
      console.log('🧪 測試新管理者登入...')
      const testSupabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      )
      
      const { data: loginData, error: loginError } = await testSupabase.auth.signInWithPassword({
        email: 'admin@tanapos.com',
        password: 'TanaPos2025!'
      })
      
      if (loginError) {
        console.error('❌ 測試登入失敗:', loginError.message)
      } else {
        console.log('✅ 測試登入成功!')
      }
    }

  } catch (err) {
    console.error('❌ 重設過程錯誤:', err.message)
  }
}

recreateAdmin()
