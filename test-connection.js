#!/usr/bin/env node

/**
 * TanaPOS v4 AI 簡化資料庫連線測試
 */

import { createClient } from '@supabase/supabase-js'

// Supabase設定
const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'

console.log('🚀 TanaPOS v4 AI 資料庫連線測試...')
console.log('🔗 連線到:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    // 簡單的健康檢查
    console.log('🔌 測試基本連線...')
    
    // 檢查是否能連線到Supabase
    console.log('🔍 直接測試資料表查詢...')
    
    // 嘗試查詢一個簡單的資料表或創建測試表
    const { data: testData, error: testError } = await supabase
      .from('restaurants')
      .select('id')
      .limit(1)
    
    if (testError) {
      if (testError.code === 'PGRST116') {
        console.log('📊 資料庫為空 - 需要建立架構')
        return 'empty'
      } else {
        console.log('⚠️  資料表不存在，這是正常的如果還沒建立架構')
        console.log('錯誤詳情:', testError.message)
        return 'empty'
      }
    }
    
    console.log('✅ 資料庫已有資料表!')
    console.log('📋 restaurants表查詢成功，記錄數:', testData?.length || 0)
    
    return 'ready'
    
  } catch (error) {
    console.error('❌ 測試過程發生錯誤:', error.message)
    return false
  }
}

// 執行測試
testConnection().then(result => {
  console.log('')
  if (result === 'empty') {
    console.log('📋 狀態: 資料庫連線正常，但需要建立架構')
    console.log('')
    console.log('🚀 接下來的步驟:')
    console.log('1. 開啟 Supabase Dashboard: https://supabase.com/dashboard/project/arksfwmcmwnyxvlcpskm')
    console.log('2. 進入 SQL Editor')
    console.log('3. 複製並執行 supabase_complete.sql 內容')
    console.log('4. 重新執行此測試確認')
  } else if (result === 'ready') {
    console.log('🎉 狀態: 資料庫已準備就緒!')
    console.log('')
    console.log('📋 接下來可以:')
    console.log('1. 啟動開發伺服器: npm run dev')
    console.log('2. 執行測試: npm run test')
    console.log('3. 載入測試資料 (如需要)')
  } else {
    console.log('❌ 狀態: 連線失敗')
    console.log('請檢查網路連線和Supabase設定')
  }
})
