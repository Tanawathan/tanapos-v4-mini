import { createClient } from '@supabase/supabase-js'

// 直接使用正確的配置值
const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'

// 驗證配置
console.log('🔍 Supabase 配置載入:')
console.log('URL:', supabaseUrl)
console.log('Key 前30字:', supabaseKey.substring(0, 30))
console.log('Key 長度:', supabaseKey.length)

// 檢查環境變數（用於除錯）
console.log('環境變數檢查:')
console.log('- VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL || '❌ 未載入')
console.log('- VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ 已載入' : '❌ 未載入')

// JWT 解析檢查
try {
  const tokenParts = supabaseKey.split('.')
  if (tokenParts.length === 3) {
    const payload = JSON.parse(atob(tokenParts[1]))
    console.log('🔐 JWT 資訊:')
    console.log('- 發行者:', payload.iss)
    console.log('- 角色:', payload.role)
    console.log('- 過期時間:', new Date(payload.exp * 1000).toLocaleString())
    console.log('- 是否過期:', payload.exp * 1000 < Date.now())
  }
} catch (e) {
  console.error('❌ JWT 解析失敗:', (e as Error).message)
}

// 確保只建立一個實例 - 使用全域變數防止重複建立
declare global {
  var __supabase: any
}

// 創建或重用現有的 Supabase 實例
export const supabase = globalThis.__supabase ?? createClient(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: 'tanapos-v4-auth',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'tanapos-v4-mini'
    }
  }
})

// 存儲到全域變數
if (typeof window !== 'undefined') {
  globalThis.__supabase = supabase
}
