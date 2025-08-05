import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
)

async function insertRestaurant() {
  try {
    console.log('🏪 插入餐廳資料...')
    
    const restaurantData = {
      id: 'a8fff0de-a2dd-4749-a80c-08a6102de734',
      name: 'TanawatThai',
      address: 'keelong',
      phone: '0971715711',
      email: 'info@tanawat.tw',
      tax_rate: 0.1,
      currency: 'TWD',
      timezone: 'Asia/Taipei',
      is_active: true,
      created_at: '2025-07-31 12:43:28.845282+00',
      updated_at: '2025-07-31 15:11:15.867159+00'
    }
    
    const { data, error } = await supabase
      .from('restaurants')
      .insert(restaurantData)
      .select()
    
    if (error) {
      console.log('❌ 插入失敗:', error.message)
    } else {
      console.log('✅ 餐廳資料插入成功!')
      console.log('📊 插入的資料:', data)
    }
    
    // 確認插入結果
    const { data: checkData, error: checkError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', 'a8fff0de-a2dd-4749-a80c-08a6102de734')
      .single()
    
    if (checkData) {
      console.log('✅ 確認: 餐廳資料已存在')
      console.log('餐廳名稱:', checkData.name)
    }
    
  } catch (error) {
    console.error('❌ 操作失敗:', error.message)
  }
}

insertRestaurant()
