import { createClient } from '@supabase/supabase-js'

// 使用您提供的正確 API Key
const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'

// 除錯資訊
console.log('🔍 Supabase 正確配置載入:')
console.log('URL:', supabaseUrl)
console.log('Key 前30字:', supabaseKey.substring(0, 30))

// 創建單一實例
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: 'tanapos-v4-auth',
    storage: window.localStorage,
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
