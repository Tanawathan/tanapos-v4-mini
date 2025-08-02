import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://peubpisofenlyquqnpan.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldWJwaXNvZmVubHlxdXFucGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTgwODgsImV4cCI6MjA2OTQzNDA4OH0.6IzK9jjs-Ld_mFBRQqNk594ayXapjGxwAmhQpoY26cY'
)

async function checkOrderStatusConstraints() {
  console.log('🔍 檢查訂單狀態約束條件')
  console.log('=' .repeat(50))
  
  try {
    // 查詢現有訂單的狀態值
    const { data: orders, error } = await supabase
      .from('orders')
      .select('status')
      .limit(20)
    
    if (error) {
      console.error('查詢錯誤:', error)
      return
    }
    
    const statusValues = [...new Set(orders.map(o => o.status))]
    console.log('📋 現有訂單狀態值:')
    statusValues.forEach(status => {
      console.log(`   - ${status}`)
    })
    
    console.log('\n🧪 測試可用的狀態值:')
    
    // 測試各種狀態值
    const testStatuses = ['pending', 'preparing', 'completed', 'paid', 'cancelled', 'finished']
    
    for (const status of testStatuses) {
      try {
        // 創建測試訂單
        const { data, error } = await supabase
          .from('orders')
          .insert({
            order_number: `STATUS-TEST-${status}-${Date.now()}`,
            table_number: 99,
            customer_name: `狀態測試-${status}`,
            status: status,
            total_amount: 100,
            created_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (error) {
          console.log(`❌ ${status}: ${error.message}`)
        } else {
          console.log(`✅ ${status}: 可用`)
          
          // 刪除測試訂單
          await supabase
            .from('orders')
            .delete()
            .eq('id', data.id)
        }
      } catch (e) {
        console.log(`❌ ${status}: ${e.message}`)
      }
    }
    
  } catch (error) {
    console.error('測試失敗:', error)
  }
}

checkOrderStatusConstraints().then(() => {
  console.log('\n✅ 狀態約束檢查完成')
  process.exit(0)
})
