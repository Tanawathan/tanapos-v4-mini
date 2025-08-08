#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Supabase 設定
const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔧 擴展預約系統資料庫結構...\n')

async function extendReservationDatabase() {
  try {
    // 1. 更新餐廳設定以支援預約系統
    console.log('🏢 === 更新餐廳預約設定 ===')
    
    const reservationSettings = {
      reservation_settings: {
        max_guests_per_30min: 8,        // 30分鐘最大接待人數
        default_duration_minutes: 120,   // 預設用餐時長
        buffer_minutes: 15,              // 桌台緩衝時間
        advance_booking_days: 7,         // 提前預約天數（7天內）
        deposit_required: false,         // 不需要訂金
        child_chair_available: true,     // 兒童椅提供
        reminder_hours: [24, 2],         // 提醒時間點
        auto_confirm: true               // 自動確認預約
      }
    }

    // 更新測試餐廳的設定
    const { data: restaurants, error: fetchError } = await supabase
      .from('restaurants')
      .select('id, name, settings')

    if (fetchError) {
      console.log('❌ 無法取得餐廳資料:', fetchError.message)
      return
    }

    for (const restaurant of restaurants) {
      const updatedSettings = {
        ...restaurant.settings,
        ...reservationSettings
      }

      const { error: updateError } = await supabase
        .from('restaurants')
        .update({ settings: updatedSettings })
        .eq('id', restaurant.id)

      if (updateError) {
        console.log(`❌ 更新餐廳 ${restaurant.name} 設定失敗:`, updateError.message)
      } else {
        console.log(`✅ 已更新餐廳 ${restaurant.name} 的預約設定`)
      }
    }

    // 2. 檢查並擴展 table_reservations 表結構
    console.log('\n📅 === 檢查預約表結構 ===')
    
    // 檢查現有結構
    const { data: existingReservations, error: checkError } = await supabase
      .from('table_reservations')
      .select('*')
      .limit(1)

    if (checkError) {
      console.log('❌ 預約表檢查失敗:', checkError.message)
      return
    }

    // 檢查是否需要新增欄位
    const sampleReservation = existingReservations?.[0]
    const hasAdultCount = sampleReservation && 'adult_count' in sampleReservation
    const hasChildCount = sampleReservation && 'child_count' in sampleReservation
    const hasChildChairNeeded = sampleReservation && 'child_chair_needed' in sampleReservation

    console.log('預約表結構檢查:')
    console.log(`  adult_count 欄位: ${hasAdultCount ? '✅ 存在' : '❌ 不存在'}`)
    console.log(`  child_count 欄位: ${hasChildCount ? '✅ 存在' : '❌ 不存在'}`)
    console.log(`  child_chair_needed 欄位: ${hasChildChairNeeded ? '✅ 存在' : '❌ 不存在'}`)

    // 如果欄位不存在，提供 SQL 指令供手動執行
    if (!hasAdultCount || !hasChildCount || !hasChildChairNeeded) {
      console.log('\n📝 === 需要手動執行的 SQL 指令 ===')
      console.log('請在 Supabase SQL Editor 中執行以下指令：\n')
      
      if (!hasAdultCount) {
        console.log('-- 新增成人人數欄位')
        console.log('ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS adult_count INTEGER DEFAULT 0;\n')
      }
      
      if (!hasChildCount) {
        console.log('-- 新增兒童人數欄位')
        console.log('ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS child_count INTEGER DEFAULT 0;\n')
      }
      
      if (!hasChildChairNeeded) {
        console.log('-- 新增兒童椅需求欄位')
        console.log('ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS child_chair_needed BOOLEAN DEFAULT false;\n')
      }

      console.log('-- 更新現有預約的 party_size 欄位邏輯')
      console.log('-- 將現有的 party_size 設為 adult_count + child_count\n')
    }

    // 3. 創建測試預約資料
    console.log('\n🧪 === 創建測試預約資料 ===')
    
    // 取得第一個餐廳和桌台
    const { data: firstRestaurant } = await supabase
      .from('restaurants')
      .select('id')
      .limit(1)
      .single()

    const { data: firstTable } = await supabase
      .from('tables')
      .select('id')
      .limit(1)
      .single()

    if (firstRestaurant && firstTable) {
      // 創建幾個測試預約
      const testReservations = [
        {
          restaurant_id: firstRestaurant.id,
          table_id: firstTable.id,
          customer_name: '張小明',
          customer_phone: '0912345678',
          customer_email: 'zhang@example.com',
          party_size: 4,
          adult_count: 2,
          child_count: 2,
          child_chair_needed: true,
          reservation_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明天
          duration_minutes: 120,
          status: 'confirmed',
          special_requests: '需要兒童椅，孩子對海鮮過敏'
        },
        {
          restaurant_id: firstRestaurant.id,
          customer_name: '李大華',
          customer_phone: '0987654321',
          customer_email: 'li@example.com',
          party_size: 6,
          adult_count: 6,
          child_count: 0,
          child_chair_needed: false,
          reservation_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 後天
          duration_minutes: 120,
          status: 'pending'
        }
      ]

      for (const reservation of testReservations) {
        const { error: insertError } = await supabase
          .from('table_reservations')
          .insert(reservation)

        if (insertError) {
          console.log(`❌ 創建測試預約失敗:`, insertError.message)
        } else {
          console.log(`✅ 已創建測試預約: ${reservation.customer_name} (${reservation.adult_count}大${reservation.child_count}小)`)
        }
      }
    }

    console.log('\n🎉 === 預約系統資料庫擴展完成 ===')
    console.log('下一步: 開始實作前端預約介面')
    
  } catch (error) {
    console.log('❌ 過程中發生錯誤:', error.message)
  }
}

extendReservationDatabase()
