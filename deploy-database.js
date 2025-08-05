#!/usr/bin/env node

/**
 * TanaPOS v4 AI 資料庫部署腳本
 * 此腳本將執行完整的資料庫架構部署
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 從環境變數讀取設定
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 錯誤: 請設定 Supabase URL 和 Key')
  process.exit(1)
}

console.log('🚀 TanaPOS v4 AI 資料庫部署開始...')
console.log('🔗 連線到:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

async function deployDatabase() {
  try {
    console.log('📂 讀取SQL架構檔案...')
    
    // 讀取完整的SQL架構檔案
    const sqlContent = readFileSync(join(__dirname, 'supabase_complete.sql'), 'utf8')
    
    console.log('📊 SQL檔案大小:', Math.round(sqlContent.length / 1024), 'KB')
    
    // 測試連線
    console.log('🔌 測試資料庫連線...')
    const { data, error: testError } = await supabase
      .rpc('version')
    
    if (testError) {
      console.error('❌ 連線失敗:', testError.message)
      return false
    }
    
    console.log('✅ 資料庫連線成功!')
    
    // 分割SQL指令（因為Supabase RPC有大小限制）
    console.log('⚙️ 準備執行SQL架構...')
    
    // 執行SQL - 注意：這裡需要使用Supabase的RPC或直接SQL執行
    console.log('📝 執行SQL架構建立...')
    
    // 由於SQL檔案很大，我們需要分段執行或使用Supabase Dashboard
    console.log('⚠️  注意: 由於SQL檔案較大，建議使用以下方式之一:')
    console.log('1. 複製 supabase_complete.sql 內容到 Supabase Dashboard SQL Editor 執行')
    console.log('2. 使用 psql 命令列工具直接連線執行')
    console.log('3. 使用 Supabase CLI 進行遷移')
    
    // 檢查是否有現有資料表
    console.log('🔍 檢查現有資料表...')
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables')
    
    if (tablesError) {
      // 如果沒有自定義函數，嘗試查詢pg_tables
      console.log('⚠️  使用備用方式檢查資料表...')
      const { data: pgTables, error: pgError } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')
      
      if (pgError) {
        console.log('📝 無法檢查現有資料表，可能是新資料庫')
        return true
      }
      
      console.log('📋 現有資料表數量:', pgTables?.length || 0)
      if (pgTables && pgTables.length > 0) {
        console.log('📄 現有資料表:', pgTables.map(t => t.tablename).join(', '))
      }
    } else {
      console.log('📋 現有資料表數量:', tables?.length || 0)
      if (tables && tables.length > 0) {
        console.log('📄 現有資料表:', tables.join(', '))
      }
    }
    
    return true
    
  } catch (error) {
    console.error('❌ 部署過程發生錯誤:', error)
    return false
  }
}

// 執行部署
deployDatabase().then(success => {
  if (success) {
    console.log('🎉 資料庫檢查完成!')
    console.log('')
    console.log('📋 接下來的步驟:')
    console.log('1. 開啟 Supabase Dashboard: https://supabase.com/dashboard')
    console.log('2. 進入專案: arksfwmcmwnyxvlcpskm')
    console.log('3. 進入 SQL Editor')
    console.log('4. 複製並執行 supabase_complete.sql 內容')
    console.log('5. 執行測試資料載入腳本')
  } else {
    console.log('❌ 資料庫檢查失敗')
    process.exit(1)
  }
})
