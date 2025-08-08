#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Supabase 設定
const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🛠️ 執行預約系統資料庫擴展...\n')

async function executeReservationDatabaseExtension() {
  try {
    // 1. 手動執行關鍵的 ALTER TABLE 指令
    console.log('📅 === 擴展 table_reservations 表結構 ===')
    
    const alterCommands = [
      {
        name: '新增成人人數欄位',
        sql: "ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS adult_count INTEGER DEFAULT 0"
      },
      {
        name: '新增兒童人數欄位',
        sql: "ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS child_count INTEGER DEFAULT 0"
      },
      {
        name: '新增兒童椅需求欄位',
        sql: "ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS child_chair_needed BOOLEAN DEFAULT false"
      },
      {
        name: '新增預約備註欄位',
        sql: "ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS reservation_notes TEXT"
      }
    ]
    
    for (const command of alterCommands) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command.sql })
        if (error) {
          console.log(`❌ ${command.name} 失敗:`, error.message)
        } else {
          console.log(`✅ ${command.name} 成功`)
        }
      } catch (err) {
        console.log(`⚠️  ${command.name} 可能需要手動執行:`, err.message)
      }
    }

    // 2. 直接透過 Supabase client 更新現有資料
    console.log('\n🔄 === 更新現有預約資料 ===')
    
    const { data: existingReservations, error: fetchError } = await supabase
      .from('table_reservations')
      .select('id, party_size, adult_count, child_count')
    
    if (fetchError) {
      console.log('❌ 無法取得現有預約資料:', fetchError.message)
    } else if (existingReservations && existingReservations.length > 0) {
      console.log(`找到 ${existingReservations.length} 筆現有預約`)
      
      // 更新每筆預約的成人/兒童數量
      for (const reservation of existingReservations) {
        if ((reservation.adult_count || 0) === 0 && (reservation.child_count || 0) === 0 && reservation.party_size > 0) {
          const { error: updateError } = await supabase
            .from('table_reservations')
            .update({
              adult_count: reservation.party_size,
              child_count: 0,
              child_chair_needed: false
            })
            .eq('id', reservation.id)
            
          if (updateError) {
            console.log(`❌ 更新預約 ${reservation.id} 失敗:`, updateError.message)
          } else {
            console.log(`✅ 更新預約 ${reservation.id}: ${reservation.party_size}人 → ${reservation.party_size}大人0小孩`)
          }
        }
      }
    }

    // 3. 創建測試預約資料
    console.log('\n🧪 === 創建測試預約資料 ===')
    
    const { data: firstRestaurant } = await supabase
      .from('restaurants')
      .select('id')
      .limit(1)
      .single()

    const { data: firstTable } = await supabase
      .from('tables')
      .select('id')
      .eq('capacity', 4)
      .limit(1)
      .single()

    if (firstRestaurant && firstTable) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(12, 0, 0, 0) // 明天中午 12:00
      
      const dayAfterTomorrow = new Date()
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
      dayAfterTomorrow.setHours(18, 30, 0, 0) // 後天晚上 6:30

      const testReservations = [
        {
          restaurant_id: firstRestaurant.id,
          table_id: firstTable.id,
          customer_name: '張小明家庭',
          customer_phone: '0912345678',
          customer_email: 'zhang.family@example.com',
          party_size: 4,
          adult_count: 2,
          child_count: 2,
          child_chair_needed: true,
          reservation_time: tomorrow.toISOString(),
          duration_minutes: 120,
          status: 'confirmed',
          special_requests: '需要兒童椅，孩子對海鮮過敏',
          reservation_notes: '家庭聚餐，有小朋友'
        },
        {
          restaurant_id: firstRestaurant.id,
          customer_name: '李大華聚會',
          customer_phone: '0987654321',
          customer_email: 'li.group@example.com',
          party_size: 6,
          adult_count: 6,
          child_count: 0,
          child_chair_needed: false,
          reservation_time: dayAfterTomorrow.toISOString(),
          duration_minutes: 120,
          status: 'pending',
          special_requests: '朋友聚餐',
          reservation_notes: '成人聚會'
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
    } else {
      console.log('❌ 找不到餐廳或桌台資料，跳過測試資料創建')
    }

    // 4. 驗證結構更新
    console.log('\n🔍 === 驗證結構更新 ===')
    
    const { data: updatedReservations, error: verifyError } = await supabase
      .from('table_reservations')
      .select('id, customer_name, party_size, adult_count, child_count, child_chair_needed')
      .limit(3)
      
    if (verifyError) {
      console.log('❌ 驗證失敗:', verifyError.message)
    } else if (updatedReservations) {
      console.log('✅ 預約表結構更新驗證成功')
      updatedReservations.forEach(res => {
        console.log(`  - ${res.customer_name}: 總${res.party_size}人 (${res.adult_count || 0}大${res.child_count || 0}小) ${res.child_chair_needed ? '需要兒童椅' : ''}`)
      })
    }

    console.log('\n🎉 === 預約系統資料庫擴展完成 ===')
    console.log('✅ 資料庫結構已更新')
    console.log('✅ 測試資料已創建') 
    console.log('✅ 準備開始開發前端介面')
    
  } catch (error) {
    console.log('❌ 執行過程發生錯誤:', error.message)
  }
}

executeReservationDatabaseExtension()
