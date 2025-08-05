import { createClient } from '@supabase/supabase-js'

console.log('🚀 快速登入測試...')

const supabase = createClient(
  'https://arksfwmcmwnyxvlcpskm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM0NDI0NDIsImV4cCI6MjA0OTAxODQ0Mn0.k-Nch5xGhN7U3CJr4rKsC0vPJQ8gDlP8nJC0Ry4E7Zs'
)

async function quickTest() {
  try {
    console.log('🔐 測試登入 admin@tanapos.com...')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@tanapos.com',
      password: 'TanaPos2025!'
    })

    if (error) {
      console.error('❌ 登入失敗:')
      console.error('- 錯誤訊息:', error.message)
      console.error('- 錯誤狀態:', error.status)
      console.error('- 錯誤代碼:', error.code)
      
      // 嘗試其他可能的密碼
      console.log('🔄 嘗試其他密碼...')
      const { data: data2, error: error2 } = await supabase.auth.signInWithPassword({
        email: 'admin@tanapos.com',
        password: 'admin123'
      })
      
      if (error2) {
        console.error('❌ 第二次嘗試也失敗:', error2.message)
      } else {
        console.log('✅ 使用 admin123 密碼登入成功!')
      }
      
    } else {
      console.log('✅ 登入成功!')
      console.log('- 用戶 ID:', data.user.id)
      console.log('- 用戶 Email:', data.user.email)
      console.log('- 用戶 Metadata:', data.user.user_metadata)
      console.log('- Session 存在:', !!data.session)
    }
  } catch (err) {
    console.error('❌ 測試過程錯誤:', err.message)
  }
}

quickTest()
