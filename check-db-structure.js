// 檢查實際的資料庫結構
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  console.log('🔍 檢查實際的資料庫結構')
  console.log('=' .repeat(60))
  
  const tables = ['restaurants', 'categories', 'products', 'tables', 'orders']
  
  for (const tableName of tables) {
    try {
      console.log(`\n📋 檢查表: ${tableName}`)
      
      // 嘗試查詢所有欄位
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ 錯誤: ${error.message}`)
      } else if (data && data.length > 0) {
        console.log(`✅ 表存在，欄位:`)
        Object.keys(data[0]).forEach(column => {
          console.log(`   - ${column}: ${typeof data[0][column]} (${JSON.stringify(data[0][column]).substring(0, 50)}...)`)
        })
      } else {
        console.log(`✅ 表存在但為空`)
      }
      
    } catch (e) {
      console.log(`💥 檢查 ${tableName} 時發生錯誤: ${e.message}`)
    }
  }
  
  console.log('\n' + '=' .repeat(60))
  console.log('🎯 檢查完成！')
}

checkTables()
