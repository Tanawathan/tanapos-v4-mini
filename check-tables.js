const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://mmzclhnjhahyauvpsqoj.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1temNsaG5qaGFoeWF1dnBzcW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4ODc0NjksImV4cCI6MjA0ODQ2MzQ2OX0.TCZNFdXh0LJEINODp7xQVo0Ia1F-NHtlOLksf7fPBHA'
const restaurantId = '11111111-1111-1111-1111-111111111111'

const supabase = createClient(supabaseUrl, anonKey)

async function checkTables() {
  console.log('🪑 檢查桌台數據...')
  
  try {
    const { data: tables, error } = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('table_number')
    
    if (error) {
      console.log('❌ 查詢桌台失敗:', error)
      return
    }
    
    console.log(`\n📊 總共 ${tables.length} 個桌台:`)
    
    const statusCounts = {}
    tables.forEach(table => {
      const status = table.status || 'unknown'
      statusCounts[status] = (statusCounts[status] || 0) + 1
      
      console.log(`  桌號 ${table.table_number} (${table.name})`)
      console.log(`    狀態: ${table.status}`)
      console.log(`    容量: ${table.capacity} 人`)
      console.log(`    是否啟用: ${table.is_active}`)
      if (table.last_occupied_at) {
        console.log(`    最後佔用: ${table.last_occupied_at}`)
      }
      if (table.current_order_id) {
        console.log(`    當前訂單: ${table.current_order_id}`)
      }
      console.log('')
    })
    
    console.log('📈 狀態統計:')
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} 桌`)
    })
    
  } catch (error) {
    console.log('❌ 檢查失敗:', error)
  }
}

checkTables()
