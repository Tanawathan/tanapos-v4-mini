const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://mmzclhnjhahyauvpsqoj.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1temNsaG5qaGFoeWF1dnBzcW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4ODc0NjksImV4cCI6MjA0ODQ2MzQ2OX0.TCZNFdXh0LJEINODp7xQVo0Ia1F-NHtlOLksf7fPBHA'
const restaurantId = '11111111-1111-1111-1111-111111111111'

const supabase = createClient(supabaseUrl, anonKey)

async function getTableSchema() {
  console.log('🔍 獲取 tables 表的真實結構...')
  
  try {
    // 方法1：查詢一筆資料來了解結構
    const { data: sampleData, error: sampleError } = await supabase
      .from('tables')
      .select('*')
      .limit(1)
    
    if (sampleError) {
      console.log('❌ 查詢樣本資料失敗:', sampleError)
    } else if (sampleData && sampleData.length > 0) {
      console.log('\n📊 Tables 表結構（基於樣本資料）:')
      const sample = sampleData[0]
      Object.keys(sample).forEach(key => {
        const value = sample[key]
        const type = typeof value
        console.log(`  ${key}: ${type} (範例: ${value})`)
      })
    }
    
    // 方法2：嘗試查詢所有資料來確認結構
    console.log('\n🔍 查詢所有桌台資料...')
    const { data: allTables, error: allError } = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', restaurantId)
    
    if (allError) {
      console.log('❌ 查詢所有桌台失敗:', allError)
    } else {
      console.log(`\n📋 總共 ${allTables.length} 個桌台`)
      
      if (allTables.length > 0) {
        console.log('\n🏗️ 實際欄位結構:')
        const firstTable = allTables[0]
        Object.entries(firstTable).forEach(([key, value]) => {
          console.log(`  ${key}: ${value !== null ? typeof value : 'null'} = ${value}`)
        })
        
        console.log('\n📝 所有桌台的狀態分佈:')
        const statusCounts = {}
        allTables.forEach(table => {
          const status = table.status || 'null'
          statusCounts[status] = (statusCounts[status] || 0) + 1
        })
        Object.entries(statusCounts).forEach(([status, count]) => {
          console.log(`  ${status}: ${count} 桌`)
        })
      }
    }
    
  } catch (error) {
    console.log('❌ 獲取表結構失敗:', error)
  }
}

// 同時獲取 orders 表結構來了解關聯
async function getOrdersSchema() {
  console.log('\n🔍 獲取 orders 表的結構...')
  
  try {
    const { data: orderData, error } = await supabase
      .from('orders')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('❌ 查詢訂單資料失敗:', error)
    } else if (orderData && orderData.length > 0) {
      console.log('\n📊 Orders 表結構:')
      const sample = orderData[0]
      Object.keys(sample).forEach(key => {
        const value = sample[key]
        const type = typeof value
        console.log(`  ${key}: ${type} (範例: ${value})`)
      })
    }
  } catch (error) {
    console.log('❌ 獲取訂單表結構失敗:', error)
  }
}

async function main() {
  await getTableSchema()
  await getOrdersSchema()
}

main()
