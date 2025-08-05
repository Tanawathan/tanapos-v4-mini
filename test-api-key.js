// 測試 Supabase API Key 有效性
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'

console.log('🔍 測試 Supabase API Key...')
console.log('URL:', supabaseUrl)
console.log('Key 前30字:', supabaseKey.substring(0, 30))

// 解析 JWT token 檢查過期時間
try {
  const tokenParts = supabaseKey.split('.')
  if (tokenParts.length === 3) {
    const payload = JSON.parse(atob(tokenParts[1]))
    console.log('📋 Token 資訊:')
    console.log('- 發行者:', payload.iss)
    console.log('- 角色:', payload.role)
    console.log('- 發行時間:', new Date(payload.iat * 1000).toLocaleString())
    console.log('- 過期時間:', new Date(payload.exp * 1000).toLocaleString())
    console.log('- 目前時間:', new Date().toLocaleString())
    console.log('- 是否過期:', payload.exp * 1000 < Date.now())
  }
} catch (e) {
  console.error('❌ 無法解析 JWT token:', e.message)
}

// 測試連接
const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('\n🧪 測試基本連接...')
    
    // 測試 1: 檢查 auth 狀態
    const { data: authData, error: authError } = await supabase.auth.getSession()
    console.log('🔐 Auth 狀態:', authError ? '❌ ' + authError.message : '✅ OK')
    
    // 測試 2: 嘗試查詢一個表
    const { data, error } = await supabase
      .from('restaurants')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('❌ 查詢錯誤:', error.message)
      console.log('錯誤代碼:', error.code)
      console.log('錯誤詳情:', error.details)
    } else {
      console.log('✅ 查詢成功:', data)
    }
    
    // 測試 3: 檢查 RPC 功能
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_restaurants_basic')
    
    if (rpcError) {
      console.log('📝 RPC 測試:', '❌ ' + rpcError.message)
    } else {
      console.log('📝 RPC 測試:', '✅ OK', rpcData?.length + ' 筆資料')
    }
    
  } catch (e) {
    console.error('💥 連接測試失敗:', e.message)
  }
}

testConnection()
