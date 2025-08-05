#!/usr/bin/env node

/**
 * TanaPOS v4 AI 資料庫狀態檢查
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'

console.log('🔍 TanaPOS v4 AI 資料庫狀態檢查...')

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseStatus() {
  try {
    // 檢查主要資料表
    const tables = [
      'restaurants',
      'categories', 
      'products',
      'tables',
      'orders',
      'order_items'
    ]
    
    console.log('📊 檢查核心資料表...')
    
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          console.log(`❌ ${tableName}: 不存在或無權限`)
        } else {
          console.log(`✅ ${tableName}: ${data?.length || 0} 筆記錄`)
        }
      } catch (e) {
        console.log(`❌ ${tableName}: 查詢錯誤`)
      }
    }
    
    // 檢查餐廳資料
    console.log('\n🏢 檢查餐廳資料...')
    const { data: restaurants, error: restError } = await supabase
      .from('restaurants')
      .select('*')
    
    if (!restError && restaurants) {
      restaurants.forEach(restaurant => {
        console.log(`🏪 餐廳: ${restaurant.name || '未命名'} (ID: ${restaurant.id})`)
      })
    }
    
    // 檢查分類資料
    console.log('\n📂 檢查分類資料...')
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .limit(5)
    
    if (!catError && categories) {
      console.log(`📋 分類總數: ${categories.length}`)
      categories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.icon || '📁'})`)
      })
    }
    
    // 檢查商品資料
    console.log('\n🍽️ 檢查商品資料...')
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('*')
      .limit(5)
    
    if (!prodError && products) {
      console.log(`🛍️ 商品總數: ${products.length}`)
      products.forEach(prod => {
        console.log(`  - ${prod.name}: $${prod.price}`)
      })
    }
    
    // 檢查桌台資料
    console.log('\n🪑 檢查桌台資料...')
    const { data: tablesData, error: tableError } = await supabase
      .from('tables')
      .select('*')
      .limit(10)
    
    if (!tableError && tablesData) {
      console.log(`🪑 桌台總數: ${tablesData.length}`)
      const statusCount = {}
      tablesData.forEach(table => {
        statusCount[table.status] = (statusCount[table.status] || 0) + 1
      })
      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`  - ${status}: ${count} 桌`)
      })
    }
    
    console.log('\n🎉 資料庫狀態檢查完成!')
    
  } catch (error) {
    console.error('❌ 檢查過程發生錯誤:', error.message)
  }
}

checkDatabaseStatus()
