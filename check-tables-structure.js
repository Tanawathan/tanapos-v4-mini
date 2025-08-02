import { createClient } from '@supabase/supabase-js'

// Supabase 配置
const supabaseUrl = 'https://peubpisofenlyquqnpan.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldWJwaXNvZmVubHlxdXFucGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTgwODgsImV4cCI6MjA2OTQzNDA4OH0.6IzK9jjs-Ld_mFBRQqNk594ayXapjGxwAmhQpoY26cY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTablesStructure() {
  try {
    console.log('🔍 檢查桌台資料結構...')
    
    const { data: tables, error } = await supabase
      .from('tables')
      .select('*')
      .order('table_number')
    
    if (error) {
      console.error('❌ 獲取桌台資料失敗:', error)
      return
    }
    
    console.log('✅ 找到', tables.length, '個桌台')
    console.log('📋 桌台資料結構:')
    
    tables.forEach((table, index) => {
      console.log(`桌台 ${index + 1}:`, {
        id: table.id,
        table_number: table.table_number,
        table_name: table.table_name,
        capacity: table.capacity,
        status: table.status,
        location: table.location
      })
    })
    
  } catch (error) {
    console.error('❌ 檢查桌台資料時發生錯誤:', error)
  }
}

// 執行
checkTablesStructure().then(() => {
  console.log('🎉 桌台資料檢查完成')
  process.exit(0)
})
