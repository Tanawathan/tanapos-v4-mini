import { createClient } from '@supabase/supabase-js'

// 從環境變數載入配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 驗證配置
console.log('🔍 Supabase 配置載入:')
console.log('- URL:', supabaseUrl ? '✅ 已載入' : '❌ 未載入')
console.log('- Key:', supabaseKey ? '✅ 已載入' : '❌ 未載入')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 配置不完整!')
  console.log('請確保環境變數已設定:')
  console.log('- VITE_SUPABASE_URL')
  console.log('- VITE_SUPABASE_ANON_KEY')
}

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
