// 簡單測試環境變數和 API key
console.log('🔍 環境變數檢查')
console.log('='.repeat(50))

// 檢查 .env 文件
console.log('📋 環境變數值:')
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL || '未設定')
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '已設定' : '未設定')

// 直接測試硬編碼的 API key
const hardcodedUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const hardcodedKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'

console.log('\n🧪 硬編碼測試:')
console.log('URL:', hardcodedUrl)
console.log('Key 前30字:', hardcodedKey.substring(0, 30))

// 解析 JWT
try {
  const tokenParts = hardcodedKey.split('.')
  if (tokenParts.length === 3) {
    const payload = JSON.parse(atob(tokenParts[1]))
    console.log('\n📋 JWT 解析:')
    console.log('- 發行者:', payload.iss)
    console.log('- 參考:', payload.ref)
    console.log('- 角色:', payload.role)
    console.log('- 過期時間:', new Date(payload.exp * 1000).toLocaleString())
    console.log('- 是否過期:', payload.exp * 1000 < Date.now())
  }
} catch (e) {
  console.error('❌ JWT 解析失敗:', e.message)
}

// 測試連接
import { createClient } from '@supabase/supabase-js'

const testClient = createClient(hardcodedUrl, hardcodedKey)

async function quickTest() {
  console.log('\n🚀 快速連接測試...')
  
  try {
    // 測試認證
    const { data: authData, error: authError } = await testClient.auth.getSession()
    console.log('🔐 認證測試:', authError ? `❌ ${authError.message}` : '✅ OK')
    
    // 測試查詢
    const { data: restaurants, error: queryError } = await testClient
      .from('restaurants')
      .select('count')
      .limit(1)
    
    console.log('📊 查詢測試:', queryError ? `❌ ${queryError.message}` : '✅ OK')
    
    // 測試登入
    const { data: loginData, error: loginError } = await testClient.auth.signInWithPassword({
      email: 'admin@tanapos.com',
      password: 'TanaPos2025!'
    })
    
    console.log('🔑 登入測試:', loginError ? `❌ ${loginError.message}` : '✅ OK')
    
    if (loginData.user) {
      console.log('👤 登入用戶:', loginData.user.email)
    }
    
  } catch (e) {
    console.error('💥 測試過程發生錯誤:', e.message)
  }
}

quickTest()
