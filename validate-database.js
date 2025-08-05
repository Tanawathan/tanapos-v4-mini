#!/usr/bin/env node

/**
 * TanaPOS v4 AI 資料庫驗證測試
 * 使用 Supabase API 檢查資料庫設置和數據載入
 */

import { createClient } from '@supabase/supabase-js'

// Supabase 設定
const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'

console.log('🚀 TanaPOS v4 AI 資料庫驗證測試開始...')
console.log('🔗 連線到:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabaseValidation() {
  const results = {
    connection: false,
    tables: {},
    dataIntegrity: {},
    functions: {},
    realtime: {},
    errors: []
  }

  try {
    console.log('\n📊 === 第1階段：基本連線測試 ===')
    
    // 測試基本連線
    try {
      const { data: healthCheck, error } = await supabase
        .from('restaurants')
        .select('id')
        .limit(1)
      
      if (!error) {
        results.connection = true
        console.log('✅ Supabase 連線成功')
      } else {
        console.log('❌ 連線失敗:', error.message)
        results.errors.push('連線失敗: ' + error.message)
      }
    } catch (err) {
      console.log('❌ 連線異常:', err.message)
      results.errors.push('連線異常: ' + err.message)
    }

    console.log('\n🏗️ === 第2階段：資料表結構驗證 ===')
    
    // 檢查核心資料表
    const coreTables = [
      'restaurants',
      'categories', 
      'products',
      'tables',
      'orders',
      'order_items',
      'payments',
      'table_sessions'
    ]

    for (const tableName of coreTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        if (!error) {
          results.tables[tableName] = {
            exists: true,
            accessible: true
          }
          console.log(`✅ ${tableName}: 存在且可存取`)
        } else {
          results.tables[tableName] = {
            exists: false,
            accessible: false,
            error: error.message
          }
          console.log(`❌ ${tableName}: ${error.message}`)
          results.errors.push(`${tableName}: ${error.message}`)
        }
      } catch (err) {
        results.tables[tableName] = {
          exists: false,
          accessible: false,
          error: err.message
        }
        console.log(`❌ ${tableName}: 異常 - ${err.message}`)
        results.errors.push(`${tableName}: ${err.message}`)
      }
    }

    console.log('\n📋 === 第3階段：資料完整性檢查 ===')
    
    // 檢查餐廳資料
    try {
      const { data: restaurants, error: restError } = await supabase
        .from('restaurants')
        .select('*')
      
      if (!restError) {
        results.dataIntegrity.restaurants = {
          count: restaurants?.length || 0,
          hasTestData: restaurants?.some(r => r.name === 'TanaPOS 示範餐廳') || false
        }
        console.log(`✅ 餐廳資料: ${restaurants?.length || 0} 筆`)
        if (restaurants?.length > 0) {
          console.log(`   - 第一個餐廳: ${restaurants[0].name}`)
        }
      }
    } catch (err) {
      results.errors.push('餐廳資料檢查失敗: ' + err.message)
    }

    // 檢查分類資料
    try {
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })
      
      if (!catError) {
        results.dataIntegrity.categories = {
          count: categories?.length || 0,
          names: categories?.map(c => c.name) || []
        }
        console.log(`✅ 分類資料: ${categories?.length || 0} 筆`)
        if (categories?.length > 0) {
          console.log(`   - 分類: ${categories.map(c => c.name).join(', ')}`)
        }
      }
    } catch (err) {
      results.errors.push('分類資料檢查失敗: ' + err.message)
    }

    // 檢查商品資料
    try {
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('*, category:categories(name)')
        .limit(10)
      
      if (!prodError) {
        results.dataIntegrity.products = {
          count: products?.length || 0,
          samples: products?.map(p => ({ name: p.name, price: p.price, category: p.category?.name })) || []
        }
        console.log(`✅ 商品資料: ${products?.length || 0} 筆`)
        if (products?.length > 0) {
          products.forEach(p => {
            console.log(`   - ${p.name}: $${p.price} (${p.category?.name || '無分類'})`)
          })
        }
      }
    } catch (err) {
      results.errors.push('商品資料檢查失敗: ' + err.message)
    }

    // 檢查桌台資料
    try {
      const { data: tables, error: tableError } = await supabase
        .from('tables')
        .select('*')
        .order('table_number', { ascending: true })
      
      if (!tableError) {
        const statusCount = {}
        tables?.forEach(table => {
          statusCount[table.status] = (statusCount[table.status] || 0) + 1
        })
        
        results.dataIntegrity.tables = {
          count: tables?.length || 0,
          statusBreakdown: statusCount
        }
        console.log(`✅ 桌台資料: ${tables?.length || 0} 桌`)
        Object.entries(statusCount).forEach(([status, count]) => {
          console.log(`   - ${status}: ${count} 桌`)
        })
      }
    } catch (err) {
      results.errors.push('桌台資料檢查失敗: ' + err.message)
    }

    console.log('\n🔧 === 第4階段：自定義函數測試 ===')
    
    // 測試自定義函數
    try {
      const { data: tablesFunc, error: funcError } = await supabase
        .rpc('get_tables')
      
      if (!funcError) {
        results.functions.get_tables = {
          working: true,
          tableCount: tablesFunc?.length || 0
        }
        console.log('✅ get_tables() 函數正常')
        console.log(`   - 返回 ${tablesFunc?.length || 0} 個資料表`)
      } else {
        results.functions.get_tables = {
          working: false,
          error: funcError.message
        }
        console.log('❌ get_tables() 函數失敗:', funcError.message)
      }
    } catch (err) {
      results.functions.get_tables = {
        working: false,
        error: err.message
      }
      console.log('❌ get_tables() 函數異常:', err.message)
    }

    // 測試狀態檢查函數
    try {
      const { data: statusFunc, error: statusError } = await supabase
        .rpc('check_database_status')
      
      if (!statusError) {
        results.functions.check_database_status = {
          working: true,
          result: statusFunc
        }
        console.log('✅ check_database_status() 函數正常')
        console.log(`   - 狀態: ${statusFunc?.status}`)
        console.log(`   - 資料表數量: ${statusFunc?.total_tables}`)
        console.log(`   - 資料庫就緒: ${statusFunc?.database_ready}`)
      } else {
        results.functions.check_database_status = {
          working: false,
          error: statusError.message
        }
        console.log('❌ check_database_status() 函數失敗:', statusError.message)
      }
    } catch (err) {
      results.functions.check_database_status = {
        working: false,
        error: err.message
      }
      console.log('❌ check_database_status() 函數異常:', err.message)
    }

    console.log('\n⚡ === 第5階段：即時功能測試 ===')
    
    // 測試即時訂閱功能
    try {
      console.log('🔄 測試即時訂閱...')
      
      const subscription = supabase
        .channel('test-realtime')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'orders' 
        }, (payload) => {
          console.log('📡 收到即時更新:', payload)
          results.realtime.working = true
        })
        .subscribe((status) => {
          console.log('📡 即時訂閱狀態:', status)
          results.realtime.status = status
        })

      // 等待一秒讓訂閱建立
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 測試插入資料觸發即時更新
      const testOrderData = {
        restaurant_id: '11111111-1111-1111-1111-111111111111',
        order_number: 'TEST-' + Date.now(),
        customer_name: '測試客戶',
        status: 'pending',
        total_amount: 100
      }

      console.log('📝 插入測試訂單...')
      const { data: newOrder, error: insertError } = await supabase
        .from('orders')
        .insert(testOrderData)
        .select()

      if (!insertError) {
        console.log('✅ 測試訂單已插入')
        results.realtime.testInsert = true
        
        // 清理測試資料
        if (newOrder && newOrder.length > 0) {
          await supabase
            .from('orders')
            .delete()
            .eq('id', newOrder[0].id)
          console.log('🧹 測試資料已清理')
        }
      } else {
        console.log('❌ 測試訂單插入失敗:', insertError.message)
        results.realtime.testInsert = false
        results.errors.push('即時功能測試失敗: ' + insertError.message)
      }

      // 關閉訂閱
      await supabase.removeChannel(subscription)
      
    } catch (err) {
      console.log('❌ 即時功能測試異常:', err.message)
      results.errors.push('即時功能異常: ' + err.message)
    }

    console.log('\n📊 === 第6階段：頁面數據載入測試 ===')
    
    // 模擬前端頁面數據載入
    const pageTests = {
      ordering: false,
      tables: false,
      orders: false,
      menu: false
    }

    // 測試點餐頁面數據載入
    try {
      console.log('🍽️ 測試點餐頁面數據載入...')
      const { data: orderingData, error: orderingError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('is_available', true)
        .order('sort_order')

      if (!orderingError && orderingData) {
        pageTests.ordering = true
        console.log(`✅ 點餐頁面: 載入 ${orderingData.length} 個商品`)
      } else {
        console.log('❌ 點餐頁面載入失敗:', orderingError?.message)
      }
    } catch (err) {
      console.log('❌ 點餐頁面異常:', err.message)
    }

    // 測試桌台管理頁面
    try {
      console.log('🪑 測試桌台管理頁面數據載入...')
      const { data: tablesData, error: tablesError } = await supabase
        .from('tables')
        .select(`
          *,
          current_orders:orders(*)
        `)
        .order('table_number')

      if (!tablesError && tablesData) {
        pageTests.tables = true
        console.log(`✅ 桌台管理頁面: 載入 ${tablesData.length} 個桌台`)
      } else {
        console.log('❌ 桌台管理頁面載入失敗:', tablesError?.message)
      }
    } catch (err) {
      console.log('❌ 桌台管理頁面異常:', err.message)
    }

    // 測試訂單管理頁面
    try {
      console.log('📋 測試訂單管理頁面數據載入...')
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*),
          table:tables(table_number)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!ordersError && ordersData) {
        pageTests.orders = true
        console.log(`✅ 訂單管理頁面: 載入 ${ordersData.length} 個訂單`)
      } else {
        console.log('❌ 訂單管理頁面載入失敗:', ordersError?.message)
      }
    } catch (err) {
      console.log('❌ 訂單管理頁面異常:', err.message)
    }

    // 測試菜單管理頁面
    try {
      console.log('📂 測試菜單管理頁面數據載入...')
      const { data: menuData, error: menuError } = await supabase
        .from('categories')
        .select(`
          *,
          products(*)
        `)
        .order('sort_order')

      if (!menuError && menuData) {
        pageTests.menu = true
        const totalProducts = menuData.reduce((sum, cat) => sum + (cat.products?.length || 0), 0)
        console.log(`✅ 菜單管理頁面: 載入 ${menuData.length} 個分類，${totalProducts} 個商品`)
      } else {
        console.log('❌ 菜單管理頁面載入失敗:', menuError?.message)
      }
    } catch (err) {
      console.log('❌ 菜單管理頁面異常:', err.message)
    }

    // 總結報告
    console.log('\n📋 === 驗證結果總結 ===')
    
    const totalTables = Object.keys(results.tables).length
    const workingTables = Object.values(results.tables).filter(t => t.exists).length
    const totalFunctions = Object.keys(results.functions).length
    const workingFunctions = Object.values(results.functions).filter(f => f.working).length
    const totalPages = Object.keys(pageTests).length
    const workingPages = Object.values(pageTests).filter(p => p).length

    console.log('\n🔍 基本連線:')
    console.log(`   ${results.connection ? '✅' : '❌'} Supabase 連線`)

    console.log('\n🏗️ 資料表狀態:')
    console.log(`   ✅ ${workingTables}/${totalTables} 個資料表正常`)
    if (workingTables < totalTables) {
      Object.entries(results.tables).forEach(([name, status]) => {
        if (!status.exists) {
          console.log(`   ❌ ${name}: ${status.error}`)
        }
      })
    }

    console.log('\n📊 資料完整性:')
    console.log(`   🏢 餐廳: ${results.dataIntegrity.restaurants?.count || 0} 筆`)
    console.log(`   📂 分類: ${results.dataIntegrity.categories?.count || 0} 筆`)
    console.log(`   🛍️ 商品: ${results.dataIntegrity.products?.count || 0} 筆`)
    console.log(`   🪑 桌台: ${results.dataIntegrity.tables?.count || 0} 桌`)

    console.log('\n🔧 自定義函數:')
    console.log(`   ✅ ${workingFunctions}/${totalFunctions} 個函數正常`)

    console.log('\n📱 頁面載入測試:')
    console.log(`   ✅ ${workingPages}/${totalPages} 個頁面正常`)
    Object.entries(pageTests).forEach(([page, working]) => {
      console.log(`   ${working ? '✅' : '❌'} ${page} 頁面`)
    })

    console.log('\n⚡ 即時功能:')
    console.log(`   ${results.realtime.status === 'SUBSCRIBED' ? '✅' : '❌'} 即時訂閱`)

    if (results.errors.length > 0) {
      console.log('\n❌ 發現的問題:')
      results.errors.forEach(error => {
        console.log(`   - ${error}`)
      })
    }

    // 整體評估
    const overallHealth = (
      (results.connection ? 1 : 0) +
      (workingTables / totalTables) +
      (workingFunctions / totalFunctions) +
      (workingPages / totalPages)
    ) / 4

    console.log('\n🎯 整體健康度:')
    if (overallHealth >= 0.9) {
      console.log('🎉 優秀 (90%+) - 系統完全準備就緒！')
    } else if (overallHealth >= 0.7) {
      console.log('✅ 良好 (70%+) - 系統基本可用，建議檢查問題項目')
    } else if (overallHealth >= 0.5) {
      console.log('⚠️ 普通 (50%+) - 系統部分可用，需要修復一些問題')
    } else {
      console.log('❌ 需要修復 (50%-) - 系統存在重大問題，需要立即處理')
    }

    console.log(`\n📊 詳細分數: ${Math.round(overallHealth * 100)}%`)
    console.log('\n🎊 TanaPOS v4 AI 資料庫驗證測試完成！')

    return {
      success: overallHealth >= 0.7,
      score: overallHealth,
      results: results
    }

  } catch (error) {
    console.error('❌ 驗證測試過程發生嚴重錯誤:', error)
    return {
      success: false,
      score: 0,
      error: error.message
    }
  }
}

// 執行驗證測試
testDatabaseValidation().then(result => {
  if (result.success) {
    console.log('\n✅ 驗證測試通過！系統準備就緒。')
    process.exit(0)
  } else {
    console.log('\n❌ 驗證測試失敗！請檢查並修復問題。')
    process.exit(1)
  }
})
