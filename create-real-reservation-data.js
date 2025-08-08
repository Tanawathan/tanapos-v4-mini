#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// 載入環境變數
config()

// Supabase 設定 - 使用一般 Key 先測試
const supabaseUrl = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, anonKey)

console.log('🔍 使用現有欄位結構來支持成人/兒童資料...\n')

async function createRealReservationData() {
  try {
    // 1. 檢查現有預約表結構
    console.log('📊 檢查現有預約表結構...')
    const { data: existingReservations, error } = await supabase
      .from('table_reservations')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ 無法訪問預約表:', error.message)
      return
    }

    if (existingReservations && existingReservations.length > 0) {
      console.log('✅ 現有欄位:', Object.keys(existingReservations[0]).join(', '))
    }

    // 2. 創建真實的預約資料（使用現有欄位）
    console.log('\n📝 創建真實預約資料...')
    
    const realReservations = [
      {
        restaurant_id: process.env.VITE_RESTAURANT_ID,
        customer_name: '張家明',
        customer_phone: '0912-345-678',
        customer_email: 'chang@example.com',
        reservation_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 後天
        party_size: 4,
        duration_minutes: 120,
        status: 'confirmed',
        special_requests: '家庭聚餐，需要兒童餐椅 x2',
        customer_notes: JSON.stringify({
          adults: 2,
          children: 2,
          childChairNeeded: true,
          reservationType: 'family',
          occasion: 'family_dinner'
        }),
        occasion: 'family_dinner',
        notes: '4人家庭用餐，包含2位兒童需要兒童椅'
      },
      {
        restaurant_id: process.env.VITE_RESTAURANT_ID,
        customer_name: '李商務',
        customer_phone: '0987-654-321',
        customer_email: 'li.business@company.com',
        reservation_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 大後天
        party_size: 6,
        duration_minutes: 150,
        status: 'confirmed',
        special_requests: '商務會談，需要安靜角落位置',
        customer_notes: JSON.stringify({
          adults: 6,
          children: 0,
          childChairNeeded: false,
          reservationType: 'business',
          occasion: 'business_meeting'
        }),
        occasion: 'business_meeting',
        notes: '6人商務會談，需要相對安靜的用餐環境'
      },
      {
        restaurant_id: process.env.VITE_RESTAURANT_ID,
        customer_name: '王慶祝',
        customer_phone: '0955-123-456',
        customer_email: 'wang.celebration@gmail.com',
        reservation_time: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4天後
        party_size: 8,
        duration_minutes: 180,
        status: 'pending',
        special_requests: '生日慶祝，需要生日蛋糕服務',
        customer_notes: JSON.stringify({
          adults: 6,
          children: 2,
          childChairNeeded: true,
          reservationType: 'celebration',
          occasion: 'birthday'
        }),
        occasion: 'birthday',
        notes: '8人生日聚會，包含2位兒童，需要生日蛋糕服務',
        deposit_amount: 1000,
        deposit_paid: false
      },
      {
        restaurant_id: process.env.VITE_RESTAURANT_ID,
        customer_name: '陈情侶',
        customer_phone: '0966-789-123',
        customer_email: 'chen.couple@love.com',
        reservation_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 明天
        party_size: 2,
        duration_minutes: 90,
        status: 'confirmed',
        special_requests: '浪漫晚餐，希望靠窗位置',
        customer_notes: JSON.stringify({
          adults: 2,
          children: 0,
          childChairNeeded: false,
          reservationType: 'romantic',
          occasion: 'date_night'
        }),
        occasion: 'date_night',
        notes: '2人浪漫晚餐，偏好安靜氛圍'
      },
      {
        restaurant_id: process.env.VITE_RESTAURANT_ID,
        customer_name: '趙大家族',
        customer_phone: '0933-456-789',
        customer_email: 'zhao.family@reunion.com',
        reservation_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5天後
        party_size: 12,
        duration_minutes: 240,
        status: 'confirmed',
        special_requests: '家族聚餐，需要圓桌，有3位兒童',
        customer_notes: JSON.stringify({
          adults: 9,
          children: 3,
          childChairNeeded: true,
          reservationType: 'family_reunion',
          occasion: 'family_reunion'
        }),
        occasion: 'family_reunion',
        notes: '12人家族聚會，包含3位兒童需要兒童椅，偏好圓桌',
        deposit_amount: 2000,
        deposit_paid: true,
        deposit_payment_method: 'credit_card'
      }
    ]

    // 3. 批次插入預約資料
    console.log(`📥 插入 ${realReservations.length} 筆真實預約資料...`)
    
    for (let i = 0; i < realReservations.length; i++) {
      const reservation = realReservations[i]
      console.log(`  ${i + 1}/${realReservations.length} 創建: ${reservation.customer_name} - ${reservation.party_size}人...`)
      
      const { data, error } = await supabase
        .from('table_reservations')
        .insert([reservation])
        .select()
        .single()

      if (error) {
        console.log(`    ❌ 失敗: ${error.message}`)
      } else {
        console.log(`    ✅ 成功 - ID: ${data.id}`)
        
        // 解析客戶備註中的結構化資訊
        try {
          const customerData = JSON.parse(data.customer_notes)
          console.log(`       👥 成人: ${customerData.adults}, 兒童: ${customerData.children}`)
          console.log(`       🪑 兒童椅: ${customerData.childChairNeeded ? '需要' : '不需要'}`)
          console.log(`       🎯 類型: ${customerData.reservationType}`)
        } catch (parseError) {
          console.log(`       📝 備註: ${data.customer_notes}`)
        }
      }
    }

    // 4. 驗證插入的資料
    console.log('\n🔍 驗證插入的預約資料...')
    const { data: allReservations, error: queryError } = await supabase
      .from('table_reservations')
      .select('*')
      .eq('restaurant_id', process.env.VITE_RESTAURANT_ID)
      .order('reservation_time', { ascending: true })

    if (queryError) {
      console.error('❌ 查詢失敗:', queryError.message)
    } else {
      console.log(`✅ 找到 ${allReservations.length} 筆預約記錄`)
      
      console.log('\n📋 預約摘要:')
      allReservations.forEach((reservation, index) => {
        console.log(`${index + 1}. ${reservation.customer_name} - ${new Date(reservation.reservation_time).toLocaleString('zh-TW')}`)
        console.log(`   人數: ${reservation.party_size}, 狀態: ${reservation.status}`)
        
        // 嘗試解析結構化資料
        if (reservation.customer_notes) {
          try {
            const customerData = JSON.parse(reservation.customer_notes)
            console.log(`   詳情: 成人 ${customerData.adults}位, 兒童 ${customerData.children}位`)
            if (customerData.childChairNeeded) {
              console.log(`   需求: 需要兒童餐椅`)
            }
          } catch (e) {
            console.log(`   備註: ${reservation.customer_notes}`)
          }
        }
        console.log('')
      })
    }

    // 5. 生成更新後的 TypeScript 類型
    console.log('📝 生成更新的 TypeScript 類型定義...')
    
    const typeDefinitions = `
// 更新的預約系統類型定義
export interface ReservationCustomerData {
  adults: number
  children: number
  childChairNeeded: boolean
  reservationType: 'dining' | 'business' | 'family' | 'celebration' | 'romantic' | 'family_reunion'
  occasion?: string
}

export interface EnhancedReservation {
  id: string
  restaurant_id: string
  table_id?: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  customer_notes: string // JSON 格式的 ReservationCustomerData
  party_size: number
  reservation_time: string
  duration_minutes?: number
  estimated_end_time?: string
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled'
  special_requests?: string
  occasion?: string
  deposit_amount?: number
  deposit_paid?: boolean
  deposit_payment_method?: string
  notes?: string
  created_by?: string
  confirmed_at?: string
  seated_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

// 工具函數來處理客戶資料
export function parseCustomerData(customerNotes: string): ReservationCustomerData | null {
  try {
    return JSON.parse(customerNotes)
  } catch {
    return null
  }
}

export function stringifyCustomerData(data: ReservationCustomerData): string {
  return JSON.stringify(data)
}
    `
    
    // 寫入類型定義文件
    await import('fs').then(fs => {
      fs.writeFileSync('enhanced-reservation-types.ts', typeDefinitions.trim())
      console.log('✅ 類型定義已保存為: enhanced-reservation-types.ts')
    })

    console.log('\n🎉 真實預約資料創建完成！')
    console.log('📊 現在你可以在預約管理頁面看到這些真實資料')
    console.log('🔧 使用 customer_notes 欄位存儲結構化的成人/兒童資訊')
    
  } catch (error) {
    console.error('❌ 執行過程發生錯誤:', error.message)
  }
}

createRealReservationData()
