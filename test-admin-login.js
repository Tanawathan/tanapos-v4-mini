// 測試管理員登入
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAdminLogin() {
  console.log('🔑 測試管理員登入')
  console.log('=' .repeat(40))
  
  try {
    // 嘗試登入
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@tanapos.com',
      password: 'TanaPos2025!'
    })
    
    if (error) {
      console.log('❌ 登入失敗:', error.message)
      console.log('錯誤代碼:', error.status)
      console.log('錯誤詳情:', error)
    } else {
      console.log('✅ 登入成功!')
      console.log('用戶 ID:', data.user?.id)
      console.log('用戶 Email:', data.user?.email)
      console.log('Session ID:', data.session?.access_token?.substring(0, 20) + '...')
      
      // 測試登入後的資料存取
      console.log('\n🧪 測試認證後的資料存取...')
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.log('❌ 獲取用戶資料失敗:', userError.message)
      } else {
        console.log('✅ 用戶資料:', userData.user?.email)
      }
    }
    
  } catch (e) {
    console.error('💥 登入測試發生錯誤:', e.message)
  }
}

testAdminLogin()
