#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// 載入環境變數
config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, anonKey)

console.log('🧪 測試前端預約表單的資料創建功能...\n')

async function testReservationFormSubmission() {
  try {
    // 模擬前端表單提交的資料
    const formData = {
      customer_name: '測試前端用戶',
      customer_phone: '0911-222-333',
      customer_email: 'frontend-test@example.com',
      reservation_date: '2025-08-15',
      reservation_time: '18:30',
      party_size: 5,
      adult_count: 3,
      child_count: 2,
      child_chair_needed: true,
      special_requests: '需要高椅 x2，靠窗座位'
    }

    console.log('📝 模擬表單資料:')
    console.log('  顧客:', formData.customer_name)
    console.log('  電話:', formData.customer_phone)
    console.log('  日期時間:', `${formData.reservation_date} ${formData.reservation_time}`)
    console.log('  總人數:', formData.party_size)
    console.log('  成人/兒童:', `${formData.adult_count}/${formData.child_count}`)
    console.log('  兒童椅:', formData.child_chair_needed ? '需要' : '不需要')
    console.log('')

    // 創建結構化的客戶資料
    const customerData = {
      adults: formData.adult_count,
      children: formData.child_count,
      childChairNeeded: formData.child_chair_needed,
      reservationType: formData.child_count > 0 ? 'family' : 'dining',
      occasion: 'dining'
    }

    // 組合預約資料
    const reservationTime = new Date(`${formData.reservation_date}T${formData.reservation_time}`)
    const estimatedEndTime = new Date(reservationTime.getTime() + 120 * 60 * 1000)

    const reservationData = {
      restaurant_id: process.env.VITE_RESTAURANT_ID,
      customer_name: formData.customer_name,
      customer_phone: formData.customer_phone,
      customer_email: formData.customer_email,
      party_size: formData.party_size,
      reservation_time: reservationTime.toISOString(),
      duration_minutes: 120,
      estimated_end_time: estimatedEndTime.toISOString(),
      status: 'confirmed',
      special_requests: formData.special_requests,
      occasion: customerData.occasion,
      customer_notes: JSON.stringify(customerData)
    }

    console.log('💾 插入預約資料...')
    const { data, error } = await supabase
      .from('table_reservations')
      .insert([reservationData])
      .select()
      .single()

    if (error) {
      console.error('❌ 創建失敗:', error.message)
      return
    }

    console.log('✅ 預約創建成功！')
    console.log('📋 預約詳情:')
    console.log('  ID:', data.id)
    console.log('  顧客:', data.customer_name)
    console.log('  電話:', data.customer_phone)
    console.log('  時間:', new Date(data.reservation_time).toLocaleString('zh-TW'))
    console.log('  人數:', data.party_size)
    console.log('  狀態:', data.status)
    
    // 解析客戶備註
    try {
      const parsedData = JSON.parse(data.customer_notes)
      console.log('  成人:', parsedData.adults)
      console.log('  兒童:', parsedData.children)
      console.log('  兒童椅:', parsedData.childChairNeeded ? '需要' : '不需要')
      console.log('  預約類型:', parsedData.reservationType)
    } catch (e) {
      console.log('  備註:', data.customer_notes)
    }

    console.log('\n📊 驗證預約管理頁面資料...')
    
    // 查詢所有預約來驗證顯示
    const { data: allReservations, error: queryError } = await supabase
      .from('table_reservations')
      .select('*')
      .eq('restaurant_id', process.env.VITE_RESTAURANT_ID)
      .order('reservation_time', { ascending: true })

    if (queryError) {
      console.error('❌ 查詢失敗:', queryError.message)
    } else {
      console.log(`✅ 總共 ${allReservations.length} 筆預約`)
      
      // 統計各類型預約
      const stats = {
        family: 0,
        business: 0,
        romantic: 0,
        dining: 0,
        celebration: 0,
        family_reunion: 0,
        totalChildren: 0,
        needChildChair: 0
      }

      allReservations.forEach(reservation => {
        try {
          const customerData = JSON.parse(reservation.customer_notes)
          stats[customerData.reservationType] = (stats[customerData.reservationType] || 0) + 1
          stats.totalChildren += customerData.children
          if (customerData.childChairNeeded) stats.needChildChair++
        } catch (e) {
          // 忽略解析錯誤的舊格式資料
        }
      })

      console.log('\n📈 預約統計:')
      console.log('  家庭預約:', stats.family)
      console.log('  商務預約:', stats.business)
      console.log('  浪漫晚餐:', stats.romantic)
      console.log('  一般用餐:', stats.dining)
      console.log('  慶祝活動:', stats.celebration)
      console.log('  家族聚會:', stats.family_reunion)
      console.log('  總兒童人數:', stats.totalChildren)
      console.log('  需要兒童椅:', stats.needChildChair)
    }

    console.log('\n🎉 測試完成！前端預約表單功能正常')

  } catch (error) {
    console.error('❌ 測試過程發生錯誤:', error.message)
  }
}

testReservationFormSubmission()
