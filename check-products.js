// 檢查產品資料
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProducts() {
  console.log('🔍 檢查產品資料')
  console.log('=' .repeat(50))
  
  try {
    // 查詢產品
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price, is_available')
      .limit(10)
      
    if (error) {
      console.log('❌ 查詢產品失敗:', error)
      return
    }
    
    console.log(`✅ 找到 ${products.length} 個產品:`)
    products.forEach(product => {
      console.log(`  - ${product.name} (ID: ${product.id}) - NT$ ${product.price} - ${product.is_available ? '可用' : '不可用'}`)
    })
    
  } catch (error) {
    console.log('❌ 執行失敗:', error)
  }
}

checkProducts()
