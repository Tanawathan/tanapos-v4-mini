import { createClient } from '@supabase/supabase-js'

// 模擬前端環境變數載入
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'

console.log('🔍 前端配置檢查:')
console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key 前30字:', supabaseKey.substring(0, 30))

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFrontendLogin() {
  console.log('\n🧪 模擬前端登入測試...')
  
  try {
    // 測試基本連接
    console.log('⚡ 測試基本連接...')
    const { data: testData, error: testError } = await supabase.from('restaurants').select('id').limit(1)
    if (testError) {
      console.error('❌ 基本連接失敗:', testError.message)
    } else {
      console.log('✅ 基本連接成功')
    }

    // 測試登入
    console.log('🔐 測試登入...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@tanapos.com',
      password: 'TanaPos2025!'
    })

    if (error) {
      console.error('❌ 登入失敗:', error.message)
      console.error('錯誤代碼:', error.status)
      console.error('錯誤詳情:', error)
    } else {
      console.log('✅ 登入成功!')
      console.log('用戶 ID:', data.user?.id)
      console.log('用戶 Email:', data.user?.email)
    }
  } catch (err) {
    console.error('❌ 測試過程發生錯誤:', err)
  }
}

testFrontendLogin()
