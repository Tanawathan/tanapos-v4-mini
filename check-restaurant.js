import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
)

async function checkRestaurant() {
  try {
    console.log('🔍 檢查餐廳資料...')
    console.log('餐廳ID:', process.env.RESTAURANT_ID)
    
    // 檢查所有餐廳
    const { data: allRestaurants, error: allError } = await supabase
      .from('restaurants')
      .select('*')
    
    console.log('\n📊 所有餐廳資料:')
    console.log('總數:', allRestaurants?.length || 0)
    if (allRestaurants) {
      allRestaurants.forEach((r, i) => {
        console.log(`${i + 1}. ID: ${r.id}`)
        console.log(`   名稱: ${r.name}`)
        console.log(`   狀態: ${r.is_active}`)
      })
    }
    
    // 檢查特定餐廳
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', process.env.RESTAURANT_ID)
      .single()
    
    if (restaurantError) {
      console.log('\n❌ 查詢特定餐廳時發生錯誤:', restaurantError.message)
    } else {
      console.log('\n✅ 找到餐廳:', restaurant.name)
    }
    
  } catch (error) {
    console.error('❌ 檢查失敗:', error.message)
  }
}

checkRestaurant()
