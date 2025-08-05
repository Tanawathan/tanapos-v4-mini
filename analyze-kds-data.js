import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeKDSData() {
  console.log('🔍 KDS 系統數據分析\n')

  // 檢查 orders 表
  console.log('📊 === Orders 表分析 ===')
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .limit(3)

  if (ordersError) {
    console.error('❌ Orders 查詢錯誤:', ordersError)
  } else {
    console.log(`✅ 找到 ${orders.length} 筆訂單`)
    if (orders.length > 0) {
      console.log('📝 訂單欄位結構:')
      console.log(Object.keys(orders[0]))
      console.log('\n🔍 範例訂單數據:')
      console.log(JSON.stringify(orders[0], null, 2))
    }
  }

  // 檢查 order_items 表
  console.log('\n🍽️ === Order Items 表分析 ===')
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .limit(3)

  if (itemsError) {
    console.error('❌ Order Items 查詢錯誤:', itemsError)
  } else {
    console.log(`✅ 找到 ${orderItems.length} 筆訂單項目`)
    if (orderItems.length > 0) {
      console.log('📝 訂單項目欄位結構:')
      console.log(Object.keys(orderItems[0]))
      console.log('\n🔍 範例訂單項目數據:')
      console.log(JSON.stringify(orderItems[0], null, 2))
    }
  }

  // 檢查訂單狀態分布
  console.log('\n📈 === 訂單狀態分析 ===')
  const { data: statusCount, error: statusError } = await supabase
    .from('orders')
    .select('status')

  if (!statusError && statusCount) {
    const statusStats = statusCount.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {})
    console.log('📊 訂單狀態分布:')
    Object.entries(statusStats).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} 筆`)
    })
  }
}

analyzeKDSData()
