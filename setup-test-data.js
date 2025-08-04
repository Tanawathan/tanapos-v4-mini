// 測試資料庫連接和創建測試餐廳
import { supabase } from './src/lib/supabase.ts'

const testRestaurantId = '11111111-1111-1111-1111-111111111111'

async function setupTestData() {
  console.log('🔍 檢查現有餐廳資料...')
  
  // 檢查是否已有餐廳資料
  const { data: restaurants, error: fetchError } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', testRestaurantId)
  
  if (fetchError) {
    console.error('❌ 檢查餐廳資料失敗:', fetchError)
    return
  }
  
  if (restaurants && restaurants.length > 0) {
    console.log('✅ 測試餐廳已存在:', restaurants[0].name)
    return restaurants[0]
  }
  
  console.log('📝 創建測試餐廳...')
  
  // 創建測試餐廳
  const { data: newRestaurant, error: createError } = await supabase
    .from('restaurants')
    .insert([
      {
        id: testRestaurantId,
        name: '測試餐廳',
        address: '台北市測試區測試路123號',
        phone: '02-1234-5678',
        email: 'test@restaurant.com',
        tax_rate: 0.1,
        currency: 'TWD',
        timezone: 'Asia/Taipei',
        is_active: true
      }
    ])
    .select()
    .single()
  
  if (createError) {
    console.error('❌ 創建餐廳失敗:', createError)
    return
  }
  
  console.log('✅ 測試餐廳創建成功:', newRestaurant.name)
  
  // 創建測試分類
  console.log('📝 創建測試分類...')
  const { data: categories, error: categoryError } = await supabase
    .from('categories')
    .insert([
      {
        restaurant_id: testRestaurantId,
        name: '主餐',
        description: '主要餐點',
        sort_order: 1,
        color: '#3B82F6',
        icon: '🍽️',
        is_active: true
      },
      {
        restaurant_id: testRestaurantId,
        name: '飲品',
        description: '各式飲品',
        sort_order: 2,
        color: '#10B981',
        icon: '🥤',
        is_active: true
      },
      {
        restaurant_id: testRestaurantId,
        name: '甜點',
        description: '精緻甜點',
        sort_order: 3,
        color: '#F59E0B',
        icon: '🍰',
        is_active: true
      }
    ])
    .select()
  
  if (categoryError) {
    console.error('❌ 創建分類失敗:', categoryError)
  } else {
    console.log('✅ 測試分類創建成功:', categories.length, '個分類')
  }
  
  return newRestaurant
}

setupTestData().catch(console.error)
