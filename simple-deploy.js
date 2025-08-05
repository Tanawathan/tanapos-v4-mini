// TanaPOS v4 AI - 簡化資料庫部署腳本
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDMzMzcxMCwiZXhwIjoyMDY5OTA5NzEwfQ.PucLCfBVtZR6cxkwqXwUKKthhuNUggFt4hjJ17nRCoE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🚀 TanaPOS v4 AI - 簡化資料庫部署\n')

async function deployDatabase() {
  try {
    console.log('🔗 連線到 Supabase...')
    
    // 讀取SQL檔案
    console.log('📂 讀取 supabase-fresh-setup.sql...')
    const sqlContent = fs.readFileSync('./supabase-fresh-setup.sql', 'utf-8')
    
    console.log(`📊 SQL檔案大小: ${Math.round(sqlContent.length / 1024)} KB`)
    
    // 執行SQL
    console.log('⚡ 執行資料庫架構建立...')
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sqlContent 
    })
    
    if (error) {
      console.log('❌ SQL執行失敗:', error.message)
      
      // 嘗試分段執行
      console.log('🔄 嘗試分段執行...')
      await executeInChunks(sqlContent)
      
    } else {
      console.log('✅ 資料庫架構建立成功！')
      console.log('📊 執行結果:', data)
    }
    
    // 驗證建立結果
    console.log('\n🔍 驗證資料庫建立結果...')
    await verifyDatabase()
    
  } catch (err) {
    console.log('❌ 部署失敗:', err.message)
    console.log('\n💡 建議：請手動在Supabase Dashboard的SQL Editor中執行 supabase-fresh-setup.sql')
  }
}

async function executeInChunks(sqlContent) {
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
  
  console.log(`📝 分解為 ${statements.length} 個SQL語句`)
  
  let successCount = 0
  let errorCount = 0
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';'
    
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: statement 
      })
      
      if (error) {
        console.log(`❌ 語句 ${i + 1} 失敗:`, error.message.substring(0, 100))
        errorCount++
      } else {
        successCount++
      }
      
      // 進度顯示
      if ((i + 1) % 10 === 0) {
        console.log(`📈 進度: ${i + 1}/${statements.length} (成功: ${successCount}, 失敗: ${errorCount})`)
      }
      
    } catch (err) {
      console.log(`❌ 語句 ${i + 1} 異常:`, err.message.substring(0, 100))
      errorCount++
    }
  }
  
  console.log(`\n📊 執行完成: 成功 ${successCount}, 失敗 ${errorCount}`)
}

async function verifyDatabase() {
  const tables = [
    'restaurants', 'categories', 'products', 'tables', 
    'orders', 'order_items'
  ]
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: 已建立 (${count} 筆資料)`)
      }
    } catch (err) {
      console.log(`❌ ${table}: 檢查失敗`)
    }
  }
}

deployDatabase().catch(console.error)
