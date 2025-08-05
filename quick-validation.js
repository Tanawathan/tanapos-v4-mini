// TanaPOS v4 AI - 快速連接驗證腳本
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const RESTAURANT_ID = process.env.RESTAURANT_ID || process.env.VITE_RESTAURANT_ID

console.log('⚡ TanaPOS v4 AI - 快速連接驗證\n')

async function quickValidation() {
  try {
    console.log('🔍 檢查環境變數...')
    const requiredVars = {
      'SUPABASE_URL': supabaseUrl,
      'SUPABASE_ANON_KEY': supabaseAnonKey ? '✓ 已設定' : '❌ 未設定',
      'RESTAURANT_ID': RESTAURANT_ID
    }

    console.log('📋 環境變數狀態:')
    Object.entries(requiredVars).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`)
    })
    console.log('')

    if (!supabaseUrl || !supabaseAnonKey || !RESTAURANT_ID) {
      console.log('❌ 環境變數不完整，請檢查 .env 檔案')
      return
    }

    console.log('🔗 測試 Supabase 連接...')
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // 測試基本連接
    const { data: connectionTest, error: connectionError } = await supabase
      .from('restaurants')
      .select('count')
      .limit(1)

    if (connectionError) {
      console.log('❌ Supabase 連接失敗:', connectionError.message)
      return
    }

    console.log('✅ Supabase 連接成功')

    // 測試餐廳資料
    console.log('🏪 檢查餐廳資料...')
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', RESTAURANT_ID)
      .single()

    if (restaurantError) {
      console.log('❌ 餐廳資料載入失敗:', restaurantError.message)
      console.log('💡 建議執行: node auto-fix.js')
      return
    }

    if (!restaurant) {
      console.log('❌ 找不到餐廳資料 (ID:', RESTAURANT_ID, ')')
      console.log('💡 建議執行: node auto-fix.js')
      return
    }

    console.log('✅ 餐廳資料正常:', restaurant.name)

    // 快速檢查核心資料
    const checks = [
      { name: '分類', table: 'categories' },
      { name: '產品', table: 'products' },
      { name: '桌台', table: 'tables' }
    ]

    console.log('\n📊 核心資料檢查:')
    for (const check of checks) {
      const { count, error } = await supabase
        .from(check.table)
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', RESTAURANT_ID)

      if (error) {
        console.log(`   ❌ ${check.name}: 查詢失敗 - ${error.message}`)
      } else {
        console.log(`   ✅ ${check.name}: ${count} 筆`)
      }
    }

    console.log('\n🎉 快速驗證完成！')
    console.log('💡 現在可以執行 npm run dev 啟動系統')
    console.log('🔧 如有問題可以執行完整診斷: node diagnostic-tools.js')

  } catch (error) {
    console.error('❌ 驗證過程發生錯誤:', error.message)
  }
}

quickValidation()
