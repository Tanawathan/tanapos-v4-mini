import { createClient } from '@supabase/supabase-js'

console.log('🧪 測試您提供的正確 API Key...')

const supabase = createClient(
  'https://arksfwmcmwnyxvlcpskm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'
)

async function testCorrectAPI() {
  try {
    console.log('🔗 測試基本連接...')
    const { data, error } = await supabase.from('restaurants').select('count').limit(1)
    if (error) {
      console.error('❌ 資料庫連接失敗:', error.message)
    } else {
      console.log('✅ 資料庫連接成功!')
    }
    
    console.log('🔐 測試認證功能...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@tanapos.com',
      password: 'TanaPos2025!'
    })
    
    if (authError) {
      console.error('❌ 登入測試失敗:', authError.message)
      
      // 嘗試創建管理者
      console.log('👤 嘗試創建管理者...')
      const serviceSupabase = createClient(
        'https://arksfwmcmwnyxvlcpskm.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDMzMzcxMCwiZXhwIjoyMDY5OTA5NzEwfQ.PucLCfBVtZR6cxkwqXwUKKthhuNUggFt4hjJ17nRCoE'
      )
      
      const { data: createData, error: createError } = await serviceSupabase.auth.admin.createUser({
        email: 'admin@tanapos.com',
        password: 'TanaPos2025!',
        email_confirm: true,
        user_metadata: {
          role: 'admin',
          name: 'TanaPOS Administrator',
          restaurant_id: '11111111-1111-1111-1111-111111111111'
        }
      })
      
      if (createError) {
        console.error('❌ 創建管理者失敗:', createError.message)
      } else {
        console.log('✅ 管理者創建成功!')
      }
    } else {
      console.log('✅ 登入測試成功!')
    }
  } catch (err) {
    console.error('❌ 測試錯誤:', err.message)
  }
}

testCorrectAPI()
