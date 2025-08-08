#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Supabase 設定
const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 查詢預約系統相關資料庫結構...\n')

async function queryReservationStructure() {
  try {
    // 1. 查詢餐廳營業時間設定
    console.log('🏢 === 餐廳營業時間與設定 ===')
    const { data: restaurants, error: restError } = await supabase
      .from('restaurants')
      .select('id, name, business_hours, settings')
    
    if (!restError && restaurants) {
      restaurants.forEach(restaurant => {
        console.log(`📍 餐廳: ${restaurant.name}`)
        console.log(`   ID: ${restaurant.id}`)
        if (restaurant.business_hours) {
          console.log('   營業時間:', JSON.stringify(restaurant.business_hours, null, 4))
        } else {
          console.log('   營業時間: 未設定')
        }
        if (restaurant.settings) {
          console.log('   系統設定:', JSON.stringify(restaurant.settings, null, 4))
        } else {
          console.log('   系統設定: 未設定')
        }
        console.log('')
      })
    } else {
      console.log('❌ 餐廳資料查詢失敗:', restError?.message)
    }

    // 2. 查詢桌台詳細結構
    console.log('🪑 === 桌台資料結構 ===')
    const { data: tables, error: tableError } = await supabase
      .from('tables')
      .select('*')
      .limit(3)
    
    if (!tableError && tables && tables.length > 0) {
      console.log('桌台表欄位:')
      console.log(Object.keys(tables[0]).map(key => `  - ${key}`).join('\n'))
      console.log('\n範例資料:')
      tables.forEach(table => {
        console.log(`  桌台 ${table.table_number}:`)
        console.log(`    容量: ${table.capacity}`)
        console.log(`    狀態: ${table.status}`)
        console.log(`    當前會話ID: ${table.current_session_id || '無'}`)
        console.log('')
      })
    } else {
      console.log('❌ 桌台資料查詢失敗:', tableError?.message)
    }

    // 3. 檢查預約系統資料表
    console.log('📅 === 預約系統資料表 ===')
    try {
      const { data: reservationSchema, error: resSchemaError } = await supabase
        .from('table_reservations')
        .select('*')
        .limit(1)
      
      if (!resSchemaError) {
        console.log('✅ table_reservations 表存在')
        if (reservationSchema && reservationSchema.length > 0) {
          console.log('預約表欄位:')
          console.log(Object.keys(reservationSchema[0]).map(key => `  - ${key}`).join('\n'))
        } else {
          console.log('預約表無資料，但結構存在')
        }
      } else {
        console.log('❌ table_reservations 表不存在:', resSchemaError.message)
      }
    } catch (err) {
      console.log('❌ 預約表檢查異常:', err.message)
    }

    // 4. 檢查桌台會話資料表
    console.log('\n👥 === 桌台會話資料表 ===')
    try {
      const { data: sessionSchema, error: sessionSchemaError } = await supabase
        .from('table_sessions')
        .select('*')
        .limit(3)
      
      if (!sessionSchemaError) {
        console.log('✅ table_sessions 表存在')
        if (sessionSchema && sessionSchema.length > 0) {
          console.log('會話表欄位:')
          console.log(Object.keys(sessionSchema[0]).map(key => `  - ${key}`).join('\n'))
          console.log('\n會話資料範例:')
          sessionSchema.forEach((session, i) => {
            console.log(`  會話 ${i + 1}:`)
            console.log(`    桌台ID: ${session.table_id}`)
            console.log(`    顧客姓名: ${session.customer_name || '無'}`)
            console.log(`    人數: ${session.party_size || 0}`)
            console.log(`    入座時間: ${session.seated_at || '無'}`)
            console.log('')
          })
        } else {
          console.log('會話表無資料，但結構存在')
        }
      } else {
        console.log('❌ table_sessions 表不存在:', sessionSchemaError.message)
      }
    } catch (err) {
      console.log('❌ 會話表檢查異常:', err.message)
    }

    // 5. 查詢所有資料表清單（用於了解完整架構）
    console.log('\n📊 === 完整資料表清單 ===')
    try {
      const { data: tablesList, error: tablesListError } = await supabase
        .rpc('get_tables')
      
      if (!tablesListError && tablesList) {
        console.log('系統現有資料表:')
        tablesList
          .filter(table => !table.startsWith('pg_') && !table.startsWith('information_schema'))
          .forEach(table => {
            console.log(`  - ${table}`)
          })
      } else {
        console.log('❌ 無法取得資料表清單:', tablesListError?.message)
      }
    } catch (err) {
      console.log('❌ 資料表清單查詢異常:', err.message)
    }

    console.log('\n🎯 === 總結 ===')
    console.log('資料庫結構查詢完成！')
    
  } catch (error) {
    console.log('❌ 查詢過程發生錯誤:', error.message)
  }
}

queryReservationStructure()
