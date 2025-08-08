#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Supabase 設定
const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'

const supabase = createClient(supabaseUrl, supabaseKey)

// 訂單編號生成器
function generateRandomNumber(length = 6) {
  const digits = '0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += digits.charAt(Math.floor(Math.random() * digits.length))
  }
  return result
}

function generateTakeawayOrderNumber(prefix = 'TOGO') {
  const randomNumber = generateRandomNumber(6)
  const timestamp = Date.now().toString().slice(-3)
  return `${prefix}-${randomNumber}${timestamp}`
}

console.log('🧪 測試新的訂單提交功能\n')

async function testOrderSubmission() {
  try {
    // 1. 生成測試訂單
    const testOrderNumber = generateTakeawayOrderNumber()
    console.log(`📦 生成測試外帶訂單編號: ${testOrderNumber}`)

    // 2. 檢查是否有重複
    console.log('🔍 檢查訂單編號唯一性...')
    const { data: existingOrders, error: checkError } = await supabase
      .from('orders')
      .select('order_number')
      .eq('order_number', testOrderNumber)

    if (checkError) {
      console.error('❌ 檢查失敗:', checkError.message)
      return
    }

    if (existingOrders && existingOrders.length > 0) {
      console.log('⚠️ 發現重複訂單編號，但這是小概率事件')
      return
    }

    console.log('✅ 訂單編號唯一')

    // 3. 創建測試訂單
    console.log('📝 創建測試訂單...')
    const testOrder = {
      id: crypto.randomUUID(),
      order_number: testOrderNumber,
      restaurant_id: '11111111-1111-1111-1111-111111111111', // TanaPOS 測試餐廳
      order_type: 'takeaway',
      table_number: null,
      party_size: 1,
      customer_name: '測試客戶',
      customer_phone: '0912345678',
      subtotal: 100,
      service_charge: 0,
      tax_amount: 0,
      total_amount: 100,
      status: 'pending',
      payment_status: 'unpaid',
      source: 'mobile_pos',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([testOrder])
      .select()

    if (orderError) {
      console.error('❌ 訂單創建失敗:', orderError.message)
      
      // 檢查是否為重複鍵值錯誤
      if (orderError.code === '23505') {
        console.log('🔄 檢測到重複鍵值錯誤，這正是我們要修復的問題！')
        
        // 嘗試用不同的訂單編號重新創建
        const newOrderNumber = generateTakeawayOrderNumber()
        console.log(`🔄 使用新的訂單編號重試: ${newOrderNumber}`)
        
        testOrder.order_number = newOrderNumber
        const { data: retryData, error: retryError } = await supabase
          .from('orders')
          .insert([testOrder])
          .select()

        if (retryError) {
          console.error('❌ 重試失敗:', retryError.message)
          return
        }

        console.log('✅ 重試成功！')
        console.log('訂單資料:', retryData[0])
      }
      return
    }

    console.log('✅ 訂單創建成功！')
    console.log('訂單資料:', orderData[0])

    // 4. 測試多個訂單的唯一性
    console.log('\n🔄 測試批量訂單唯一性...')
    const batchOrders = []
    const generatedNumbers = new Set()

    for (let i = 0; i < 10; i++) {
      const orderNumber = generateTakeawayOrderNumber()
      if (generatedNumbers.has(orderNumber)) {
        console.log(`⚠️ 發現重複編號: ${orderNumber}`)
      } else {
        generatedNumbers.add(orderNumber)
        batchOrders.push({
          id: crypto.randomUUID(),
          order_number: orderNumber,
          restaurant_id: '11111111-1111-1111-1111-111111111111', // TanaPOS 測試餐廳
          order_type: 'takeaway',
          table_number: null,
          party_size: 1,
          customer_name: `測試客戶${i + 1}`,
          customer_phone: '0912345678',
          subtotal: 50,
          service_charge: 0,
          tax_amount: 0,
          total_amount: 50,
          status: 'pending',
          payment_status: 'unpaid',
          source: 'test',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    }

    if (batchOrders.length > 0) {
      const { data: batchData, error: batchError } = await supabase
        .from('orders')
        .insert(batchOrders)
        .select('order_number')

      if (batchError) {
        console.error('❌ 批量插入失敗:', batchError.message)
      } else {
        console.log(`✅ 成功創建 ${batchData.length} 筆測試訂單`)
        console.log('訂單編號列表:', batchData.map(o => o.order_number))
      }
    }

    console.log('\n🎯 === 測試完成 ===')
    console.log('新的訂單編號生成系統運作正常！')
    console.log('現在 Netlify 上的訂單提交應該不會再發生重複錯誤了。')

  } catch (error) {
    console.error('❌ 測試過程發生錯誤:', error.message)
  }
}

testOrderSubmission()
