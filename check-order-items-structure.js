import { createClient } from '@supabase/supabase-js'

// Supabase 配置
const supabaseUrl = 'https://peubpisofenlyquqnpan.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldWJwaXNvZmVubHlxdXFucGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTgwODgsImV4cCI6MjA2OTQzNDA4OH0.6IzK9jjs-Ld_mFBRQqNk594ayXapjGxwAmhQpoY26cY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkOrderItemsStructure() {
  console.log('🔍 檢查 order_items 表結構...\n')
  
  try {
    // 嘗試查詢表，看有哪些欄位
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ 查詢錯誤:', error.message)
      return
    }
    
    console.log('✅ order_items 表存在')
    
    if (data && data.length > 0) {
      console.log('📋 現有欄位:')
      Object.keys(data[0]).forEach(key => {
        console.log(`   └─ ${key}: ${typeof data[0][key]}`)
      })
    } else {
      console.log('📋 表為空，嘗試插入測試資料以檢查結構...')
      
      // 嘗試插入最基本的資料
      const { error: insertError } = await supabase
        .from('order_items')
        .insert({
          order_id: '123e4567-e89b-12d3-a456-426614174000',
          product_name: '測試產品',
          quantity: 1,
          price: 10.00
        })
      
      if (insertError) {
        console.log('插入測試失敗，錯誤信息:')
        console.log(insertError.message)
        
        // 分析錯誤訊息
        if (insertError.message.includes('notes')) {
          console.log('\n💡 建議: order_items 表可能沒有 notes 欄位')
        }
      } else {
        console.log('✅ 基本插入成功')
        
        // 清理測試資料
        await supabase
          .from('order_items')
          .delete()
          .eq('order_id', '123e4567-e89b-12d3-a456-426614174000')
      }
    }
    
    // 嘗試查詢所有現有的訂單項目
    console.log('\n🔍 查詢現有訂單項目...')
    const { data: existingItems, error: existingError } = await supabase
      .from('order_items')
      .select('*')
      .limit(3)
    
    if (existingError) {
      console.error('❌ 查詢現有資料失敗:', existingError.message)
    } else {
      console.log(`📊 現有訂單項目數量: ${existingItems.length}`)
      if (existingItems.length > 0) {
        console.log('📋 實際資料結構:')
        Object.keys(existingItems[0]).forEach(key => {
          const value = existingItems[0][key]
          console.log(`   └─ ${key}: ${value} (${typeof value})`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ 檢查過程發生錯誤:', error)
  }
}

checkOrderItemsStructure().then(() => {
  process.exit(0)
})
