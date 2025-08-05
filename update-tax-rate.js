import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateTaxRate() {
  console.log('🔧 更新餐廳稅率為 0% (無稅金)...')

  // 先獲取所有餐廳
  const { data: restaurants, error: fetchError } = await supabase
    .from('restaurants')
    .select('*')

  if (fetchError) {
    console.error('❌ 獲取餐廳資料失敗:', fetchError)
    return
  }

  console.log(`📊 找到 ${restaurants.length} 間餐廳`)

  // 逐個更新每間餐廳的稅率
  for (const restaurant of restaurants) {
    const { error } = await supabase
      .from('restaurants')
      .update({ tax_rate: 0 })
      .eq('id', restaurant.id)

    if (error) {
      console.error(`❌ 更新餐廳 ${restaurant.name} 失敗:`, error)
    } else {
      console.log(`✅ 更新餐廳 ${restaurant.name}: 稅率 0%`)
    }
  }

  console.log('🎉 所有餐廳稅率更新完成!')
}

updateTaxRate()
