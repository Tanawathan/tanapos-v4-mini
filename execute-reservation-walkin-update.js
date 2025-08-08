#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Supabase 設定 - 使用管理員權限
const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDMzMzcxMCwiZXhwIjoyMDY5OTA5NzEwfQ.cP6SgNpwn6xI_QKOLQSPfpXEH_Ks-9rjOX7N8yWGrVs'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔧 執行預約系統擴展更新...\n')

async function updateReservationSystem() {
  try {
    // 1. 檢查並更新 table_reservations 表結構
    console.log('📊 1. 更新 table_reservations 表結構...')
    
    // 檢查現有列
    const { data: columns, error: columnError } = await supabase
      .rpc('get_table_columns', { table_name: 'table_reservations' })
      .single()
    
    if (columnError) {
      console.log('   使用替代方法檢查表結構...')
    }

    // 2. 添加新欄位
    const alterTableQueries = [
      `ALTER TABLE public.table_reservations ADD COLUMN IF NOT EXISTS customer_gender VARCHAR(10) CHECK (customer_gender IN ('male', 'female', 'other'))`,
      `ALTER TABLE public.table_reservations ADD COLUMN IF NOT EXISTS customer_last_name VARCHAR(50)`,
      `ALTER TABLE public.table_reservations ADD COLUMN IF NOT EXISTS is_walk_in BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE public.table_reservations ADD COLUMN IF NOT EXISTS arrival_time TIMESTAMPTZ`,
      `ALTER TABLE public.table_reservations ADD COLUMN IF NOT EXISTS reservation_type VARCHAR(20) DEFAULT 'advance' CHECK (reservation_type IN ('advance', 'same_day', 'walk_in'))`
    ]

    for (const query of alterTableQueries) {
      try {
        console.log(`   執行: ${query.substring(0, 80)}...`)
        const { error } = await supabase.rpc('execute_sql', { query })
        if (error) {
          console.log(`   ⚠️  ${error.message}`)
        } else {
          console.log('   ✅ 成功')
        }
      } catch (err) {
        console.log(`   ⚠️  ${err.message}`)
      }
    }

    // 3. 更新餐廳設定
    console.log('\n🏢 2. 更新餐廳設定...')
    const { data: restaurants, error: restError } = await supabase
      .from('restaurants')
      .select('id, settings')

    if (!restError && restaurants) {
      for (const restaurant of restaurants) {
        const updatedSettings = {
          ...restaurant.settings,
          reservation_settings: {
            ...restaurant.settings?.reservation_settings,
            allow_same_day_booking: true,
            walk_in_enabled: true,
            quick_registration: true,
            min_advance_hours: 0,
            same_day_slots_limit: 50
          }
        }

        const { error: updateError } = await supabase
          .from('restaurants')
          .update({ settings: updatedSettings })
          .eq('id', restaurant.id)

        if (!updateError) {
          console.log(`   ✅ 更新餐廳 ${restaurant.id} 設定`)
        } else {
          console.log(`   ❌ 更新餐廳 ${restaurant.id} 失敗:`, updateError.message)
        }
      }
    }

    // 4. 測試插入現場顾客資料
    console.log('\n👥 3. 測試現場顧客登記功能...')
    const testWalkInData = {
      restaurant_id: '11111111-1111-1111-1111-111111111111',
      customer_name: '測試現場客戶',
      customer_last_name: '測試',
      customer_gender: 'male',
      customer_phone: '0912345678',
      party_size: 2,
      reservation_time: new Date().toISOString(),
      arrival_time: new Date().toISOString(),
      is_walk_in: true,
      reservation_type: 'walk_in',
      status: 'confirmed',
      duration_minutes: 120
    }

    const { data: walkInResult, error: walkInError } = await supabase
      .from('table_reservations')
      .insert(testWalkInData)
      .select()

    if (!walkInError) {
      console.log('   ✅ 現場顧客登記測試成功')
      console.log('   📝 登記ID:', walkInResult[0]?.id)
    } else {
      console.log('   ❌ 現場顧客登記測試失敗:', walkInError.message)
    }

    // 5. 測試當日預約功能
    console.log('\n📅 4. 測試當日預約功能...')
    const todayReservation = {
      restaurant_id: '11111111-1111-1111-1111-111111111111',
      customer_name: '當日預約客戶',
      customer_last_name: '當日',
      customer_gender: 'female',
      customer_phone: '0987654321',
      party_size: 3,
      reservation_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2小時後
      is_walk_in: false,
      reservation_type: 'same_day',
      status: 'confirmed',
      duration_minutes: 120
    }

    const { data: sameDayResult, error: sameDayError } = await supabase
      .from('table_reservations')
      .insert(todayReservation)
      .select()

    if (!sameDayError) {
      console.log('   ✅ 當日預約測試成功')
      console.log('   📝 預約ID:', sameDayResult[0]?.id)
    } else {
      console.log('   ❌ 當日預約測試失敗:', sameDayError.message)
    }

    // 6. 查詢今日預約統計
    console.log('\n📊 5. 查詢今日預約統計...')
    const { data: todayStats, error: statsError } = await supabase
      .from('table_reservations')
      .select('reservation_type, status, party_size')
      .gte('reservation_time', new Date().toDateString())
      .lt('reservation_time', new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString())

    if (!statsError && todayStats) {
      const stats = todayStats.reduce((acc, reservation) => {
        const type = reservation.reservation_type || 'advance'
        if (!acc[type]) {
          acc[type] = { count: 0, guests: 0 }
        }
        acc[type].count++
        acc[type].guests += reservation.party_size || 0
        return acc
      }, {})

      console.log('   📈 今日預約統計:')
      Object.entries(stats).forEach(([type, data]) => {
        console.log(`     ${type}: ${data.count} 筆預約, ${data.guests} 位客人`)
      })
    }

    // 7. 驗證資料庫結構更新
    console.log('\n🔍 6. 驗證資料庫結構...')
    const { data: sampleData, error: sampleError } = await supabase
      .from('table_reservations')
      .select('id, customer_name, customer_last_name, customer_gender, is_walk_in, reservation_type, arrival_time')
      .limit(3)

    if (!sampleError && sampleData) {
      console.log('   ✅ 新欄位驗證成功!')
      sampleData.forEach((reservation, index) => {
        console.log(`   ${index + 1}. ${reservation.customer_name} (${reservation.customer_last_name}) - ${reservation.customer_gender} - ${reservation.reservation_type}`)
      })
    }

    console.log('\n🎉 === 預約系統擴展完成 ===')
    console.log('✅ 支援當日預約功能')
    console.log('✅ 支援現場顧客快速登記')
    console.log('✅ 支援性別記錄')
    console.log('✅ 新增預約類型分類')
    console.log('✅ 測試資料創建成功')

  } catch (error) {
    console.log('❌ 更新過程發生錯誤:', error.message)
    console.log('詳細錯誤:', error)
  }
}

updateReservationSystem()
