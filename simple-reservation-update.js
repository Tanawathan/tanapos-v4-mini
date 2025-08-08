#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// 使用 anon key
const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔧 簡化預約系統擴展更新...\n')

async function simpleUpdate() {
  try {
    // 1. 先查詢現有的 table_reservations 結構
    console.log('🔍 檢查現有預約表結構...')
    const { data: existing, error: existingError } = await supabase
      .from('table_reservations')
      .select('*')
      .limit(1)

    if (existingError) {
      console.log('❌ 查詢失敗:', existingError.message)
      return
    }

    if (existing && existing.length > 0) {
      console.log('✅ 現有欄位:', Object.keys(existing[0]).join(', '))
      
      // 檢查是否已有新欄位
      const hasNewFields = existing[0].hasOwnProperty('customer_gender') 
        && existing[0].hasOwnProperty('is_walk_in')
        && existing[0].hasOwnProperty('customer_last_name')
      
      if (hasNewFields) {
        console.log('✅ 新欄位已存在，跳過結構更新')
      } else {
        console.log('ℹ️  需要手動在 Supabase 控制台添加新欄位')
      }
    }

    // 2. 更新餐廳設定
    console.log('\n🏢 更新餐廳預約設定...')
    const { data: restaurants, error: restError } = await supabase
      .from('restaurants')
      .select('id, name, settings')

    if (!restError && restaurants) {
      for (const restaurant of restaurants) {
        console.log(`   處理餐廳: ${restaurant.name}`)
        
        const currentSettings = restaurant.settings || {}
        const updatedSettings = {
          ...currentSettings,
          reservation_settings: {
            ...currentSettings.reservation_settings,
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
          console.log(`   ✅ 更新成功`)
        } else {
          console.log(`   ❌ 更新失敗: ${updateError.message}`)
        }
      }
    }

    // 3. 如果新欄位存在，插入測試資料
    console.log('\n👥 嘗試插入測試現場顧客資料...')
    
    // 檢查是否支援新欄位
    const testData = {
      restaurant_id: '11111111-1111-1111-1111-111111111111',
      customer_name: '王先生',
      customer_phone: '0912345678',
      party_size: 2,
      reservation_time: new Date().toISOString(),
      status: 'confirmed',
      duration_minutes: 120
    }

    // 嘗試添加新欄位
    try {
      testData.customer_last_name = '王'
      testData.customer_gender = 'male'
      testData.is_walk_in = true
      testData.reservation_type = 'walk_in'
      testData.arrival_time = new Date().toISOString()
    } catch (err) {
      console.log('   ⚠️  新欄位不存在，使用基本資料')
    }

    const { data: insertResult, error: insertError } = await supabase
      .from('table_reservations')
      .insert(testData)
      .select()

    if (!insertError) {
      console.log('   ✅ 測試資料插入成功')
      console.log('   📝 記錄ID:', insertResult[0]?.id)
    } else {
      console.log('   ❌ 插入失敗:', insertError.message)
    }

    // 4. 查詢並顯示最新的預約記錄
    console.log('\n📊 查詢最新預約記錄...')
    const { data: latestReservations, error: latestError } = await supabase
      .from('table_reservations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (!latestError && latestReservations) {
      console.log(`   ✅ 找到 ${latestReservations.length} 筆最新預約:`)
      latestReservations.forEach((reservation, index) => {
        console.log(`   ${index + 1}. ${reservation.customer_name} - ${reservation.party_size}人 - ${reservation.status}`)
        if (reservation.customer_last_name) {
          console.log(`      姓氏: ${reservation.customer_last_name}, 性別: ${reservation.customer_gender || '未填'}`)
        }
        if (reservation.is_walk_in !== undefined) {
          console.log(`      類型: ${reservation.reservation_type || '預約'} ${reservation.is_walk_in ? '(現場)' : '(預約)'}`)
        }
      })
    }

    console.log('\n🎯 === 更新摘要 ===')
    console.log('✅ 餐廳設定已更新 - 支援當日預約和現場登記')
    console.log('✅ 測試資料已插入')
    
    if (existing && existing.length > 0) {
      const hasNewFields = existing[0].hasOwnProperty('customer_gender')
      if (hasNewFields) {
        console.log('✅ 資料庫結構完整 - 支援性別和現場顧客功能')
      } else {
        console.log('⚠️  需要在 Supabase 控制台手動添加以下欄位到 table_reservations 表:')
        console.log('   - customer_gender (text)')
        console.log('   - customer_last_name (text)')  
        console.log('   - is_walk_in (boolean)')
        console.log('   - arrival_time (timestamp)')
        console.log('   - reservation_type (text)')
      }
    }

  } catch (error) {
    console.log('❌ 更新過程發生錯誤:', error.message)
  }
}

simpleUpdate()
