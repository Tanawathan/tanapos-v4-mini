#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Supabase 設定
const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🧪 創建預約系統測試資料...\n')

async function createTestReservations() {
  try {
    // 先取得餐廳ID
    const { data: restaurants, error: restError } = await supabase
      .from('restaurants')
      .select('id, name')
    
    if (restError || !restaurants || restaurants.length === 0) {
      console.log('❌ 無法取得餐廳資料:', restError?.message)
      return
    }
    
    const restaurant = restaurants[0]
    console.log(`✅ 使用餐廳: ${restaurant.name} (${restaurant.id})`)
    
    // 取得一個桌台ID (可選)
    const { data: tables } = await supabase
      .from('tables')
      .select('id')
      .eq('restaurant_id', restaurant.id)
      .limit(1)
    
    const tableId = tables?.[0]?.id || null
    
    // 準備測試預約資料
    const testReservations = [
      {
        restaurant_id: restaurant.id,
        table_id: tableId,
        customer_name: '張小明',
        customer_phone: '0912345678',
        customer_email: 'zhang@example.com',
        party_size: 4,
        reservation_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明天
        duration_minutes: 120,
        status: 'confirmed',
        special_requests: '慶祝生日，需要安靜的位置',
        customer_notes: JSON.stringify({
          adult_count: 2,
          child_count: 2,
          child_chair_needed: true
        })
      },
      {
        restaurant_id: restaurant.id,
        customer_name: '李大華',
        customer_phone: '0987654321',
        customer_email: 'li@example.com',
        party_size: 6,
        reservation_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 後天
        duration_minutes: 120,
        status: 'pending',
        special_requests: '商務聚餐',
        customer_notes: JSON.stringify({
          adult_count: 6,
          child_count: 0,
          child_chair_needed: false
        })
      },
      {
        restaurant_id: restaurant.id,
        customer_name: '王美麗家庭',
        customer_phone: '0955666777',
        customer_email: 'wang.family@example.com',
        party_size: 5,
        reservation_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3天後
        duration_minutes: 120,
        status: 'confirmed',
        special_requests: '家庭聚餐，有素食者',
        customer_notes: JSON.stringify({
          adult_count: 3,
          child_count: 2,
          child_chair_needed: true
        })
      },
      {
        restaurant_id: restaurant.id,
        customer_name: '陳先生',
        customer_phone: '0933888999',
        party_size: 2,
        reservation_time: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // 明天+2小時
        duration_minutes: 120,
        status: 'seated',
        special_requests: '情侶約會',
        customer_notes: JSON.stringify({
          adult_count: 2,
          child_count: 0,
          child_chair_needed: false
        })
      }
    ]
    
    console.log(`📝 準備創建 ${testReservations.length} 筆測試預約...`)
    
    // 創建測試預約
    let successCount = 0
    for (const reservation of testReservations) {
      const { data, error } = await supabase
        .from('table_reservations')
        .insert(reservation)
        .select()
        .single()
      
      if (error) {
        console.log(`❌ 創建預約失敗 (${reservation.customer_name}):`, error.message)
      } else {
        successCount++
        const childInfo = JSON.parse(reservation.customer_notes)
        console.log(`✅ 已創建預約: ${reservation.customer_name}`)
        console.log(`   - 時間: ${new Date(reservation.reservation_time).toLocaleString('zh-TW')}`)
        console.log(`   - 人數: ${reservation.party_size}人 (${childInfo.adult_count}大${childInfo.child_count}小)`)
        console.log(`   - 狀態: ${reservation.status}`)
        console.log(`   - ID: ${data.id}`)
        console.log('')
      }
    }
    
    console.log(`🎉 預約創建完成！成功: ${successCount}/${testReservations.length}`)
    
    // 驗證預約資料
    console.log('\n🔍 驗證預約資料...')
    const { data: createdReservations, error: verifyError } = await supabase
      .from('table_reservations')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('reservation_time', { ascending: true })
    
    if (verifyError) {
      console.log('❌ 驗證失敗:', verifyError.message)
    } else {
      console.log(`✅ 總共有 ${createdReservations?.length || 0} 筆預約`)
      if (createdReservations && createdReservations.length > 0) {
        const statusCounts = createdReservations.reduce((acc, res) => {
          acc[res.status] = (acc[res.status] || 0) + 1
          return acc
        }, {})
        console.log('📊 狀態分布:', statusCounts)
      }
    }
    
    console.log('\n🎯 測試資料創建完成！現在可以在前端測試預約系統了。')
    
  } catch (error) {
    console.log('❌ 過程中發生錯誤:', error.message)
  }
}

createTestReservations()
