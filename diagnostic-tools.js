// TanaPOS v4 AI - 診斷與除錯工具
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
const RESTAURANT_ID = process.env.VITE_RESTAURANT_ID

console.log('🔧 TanaPOS v4 AI - 診斷與除錯工具\n')

// 診斷任務列表
const diagnosticTasks = [
  {
    name: '環境變數檢查',
    task: checkEnvironmentVariables
  },
  {
    name: 'Supabase 連接測試',
    task: testSupabaseConnection
  },
  {
    name: '資料表結構驗證',
    task: validateTableStructure
  },
  {
    name: '測試資料完整性',
    task: validateTestData
  },
  {
    name: 'API 權限檢查',
    task: checkAPIPermissions
  },
  {
    name: '關聯資料驗證',
    task: validateRelationalData
  },
  {
    name: '效能基準測試',
    task: performanceBenchmark
  }
]

async function runDiagnostics() {
  console.log('🚀 開始執行完整診斷...\n')
  
  let passedTests = 0
  let totalTests = diagnosticTasks.length
  const results = []

  for (const diagnostic of diagnosticTasks) {
    console.log(`🔍 執行: ${diagnostic.name}`)
    try {
      const result = await diagnostic.task()
      if (result.success) {
        console.log(`✅ ${diagnostic.name}: 通過`)
        passedTests++
      } else {
        console.log(`❌ ${diagnostic.name}: 失敗 - ${result.error}`)
      }
      results.push({ name: diagnostic.name, ...result })
    } catch (error) {
      console.log(`❌ ${diagnostic.name}: 異常 - ${error.message}`)
      results.push({ name: diagnostic.name, success: false, error: error.message })
    }
    console.log('')
  }

  // 生成診斷報告
  generateDiagnosticReport(results, passedTests, totalTests)
}

async function checkEnvironmentVariables() {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY', 
    'VITE_SUPABASE_SERVICE_ROLE_KEY',
    'VITE_RESTAURANT_ID'
  ]

  const missing = []
  const present = []

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      present.push(varName)
    } else {
      missing.push(varName)
    }
  }

  if (missing.length > 0) {
    return {
      success: false,
      error: `缺少環境變數: ${missing.join(', ')}`,
      details: { missing, present }
    }
  }

  // 驗證 UUID 格式
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(RESTAURANT_ID)) {
    return {
      success: false,
      error: 'RESTAURANT_ID 格式不正確，應為 UUID 格式',
      details: { restaurantId: RESTAURANT_ID }
    }
  }

  return {
    success: true,
    details: { present, restaurantId: RESTAURANT_ID }
  }
}

async function testSupabaseConnection() {
  try {
    // 測試匿名連接
    const anonClient = createClient(supabaseUrl, supabaseAnonKey)
    const { data: anonTest, error: anonError } = await anonClient
      .from('restaurants')
      .select('count')
      .limit(1)

    // 測試服務角色連接  
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)
    const { data: serviceTest, error: serviceError } = await serviceClient
      .from('restaurants')
      .select('count')
      .limit(1)

    const results = {
      anonConnection: !anonError,
      serviceConnection: !serviceError,
      anonError: anonError?.message,
      serviceError: serviceError?.message
    }

    if (anonError && serviceError) {
      return {
        success: false,
        error: '匿名和服務角色連接都失敗',
        details: results
      }
    }

    return {
      success: true,
      details: results
    }
  } catch (error) {
    return {
      success: false,
      error: `連接異常: ${error.message}`,
      details: { exception: error.message }
    }
  }
}

async function validateTableStructure() {
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey)
  
  const requiredTables = [
    'restaurants', 'categories', 'products', 'tables', 'orders', 
    'order_items', 'product_variants', 'product_modifiers',
    'combo_products', 'table_reservations', 'payments',
    'suppliers', 'raw_materials', 'ai_analysis_logs'
  ]

  const tableStatus = {}
  let missingTables = []

  for (const tableName of requiredTables) {
    try {
      const { data, error } = await serviceClient
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) {
        missingTables.push(tableName)
        tableStatus[tableName] = { exists: false, error: error.message }
      } else {
        tableStatus[tableName] = { exists: true }
      }
    } catch (error) {
      missingTables.push(tableName)
      tableStatus[tableName] = { exists: false, error: error.message }
    }
  }

  return {
    success: missingTables.length === 0,
    error: missingTables.length > 0 ? `缺少資料表: ${missingTables.join(', ')}` : null,
    details: { 
      total: requiredTables.length,
      existing: requiredTables.length - missingTables.length,
      missing: missingTables,
      tableStatus
    }
  }
}

async function validateTestData() {
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey)
  
  const dataChecks = [
    { table: 'restaurants', filter: { id: RESTAURANT_ID }, expected: 1 },
    { table: 'categories', filter: { restaurant_id: RESTAURANT_ID }, expected: '>= 1' },
    { table: 'products', filter: { restaurant_id: RESTAURANT_ID }, expected: '>= 1' },
    { table: 'tables', filter: { restaurant_id: RESTAURANT_ID }, expected: '>= 1' }
  ]

  const results = {}
  let issues = []

  for (const check of dataChecks) {
    try {
      const { count, error } = await serviceClient
        .from(check.table)
        .select('*', { count: 'exact', head: true })
        .match(check.filter)

      if (error) {
        issues.push(`${check.table}: 查詢錯誤 - ${error.message}`)
        results[check.table] = { count: 0, error: error.message }
      } else {
        const expectationMet = typeof check.expected === 'string' 
          ? (check.expected.startsWith('>=') ? count >= parseInt(check.expected.split('>=')[1]) : count > 0)
          : count === check.expected

        if (!expectationMet) {
          issues.push(`${check.table}: 預期 ${check.expected}，實際 ${count}`)
        }
        
        results[check.table] = { count, expectationMet }
      }
    } catch (error) {
      issues.push(`${check.table}: 異常 - ${error.message}`)
      results[check.table] = { count: 0, error: error.message }
    }
  }

  return {
    success: issues.length === 0,
    error: issues.length > 0 ? issues.join('; ') : null,
    details: results
  }
}

async function checkAPIPermissions() {
  const anonClient = createClient(supabaseUrl, supabaseAnonKey)
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

  const permissions = {
    anon: { read: false, write: false },
    service: { read: false, write: false }
  }

  // 測試匿名權限
  try {
    const { data } = await anonClient
      .from('restaurants')
      .select('id')
      .limit(1)
    permissions.anon.read = true
  } catch (error) {
    // 預期匿名可能無法讀取
  }

  try {
    await anonClient
      .from('restaurants')
      .insert({ name: 'test', id: '00000000-0000-0000-0000-000000000000' })
    permissions.anon.write = true
  } catch (error) {
    // 預期匿名無法寫入
  }

  // 測試服務角色權限
  try {
    const { data } = await serviceClient
      .from('restaurants')
      .select('id')
      .limit(1)
    permissions.service.read = true
  } catch (error) {
    // 服務角色應該能讀取
  }

  try {
    // 嘗試更新而不是插入，避免衝突
    const { data } = await serviceClient
      .from('restaurants')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', RESTAURANT_ID)
    permissions.service.write = true
  } catch (error) {
    // 服務角色應該能寫入
  }

  const hasRequiredPermissions = permissions.service.read && permissions.service.write

  return {
    success: hasRequiredPermissions,
    error: !hasRequiredPermissions ? '服務角色缺少必要權限' : null,
    details: permissions
  }
}

async function validateRelationalData() {
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey)
  
  const relationChecks = []
  
  try {
    // 檢查產品-分類關聯
    const { data: orphanProducts } = await serviceClient
      .from('products')
      .select('id, name, category_id')
      .eq('restaurant_id', RESTAURANT_ID)
      .is('category_id', null)

    if (orphanProducts && orphanProducts.length > 0) {
      relationChecks.push(`${orphanProducts.length} 個產品沒有分類`)
    }

    // 檢查訂單-桌台關聯
    const { data: orphanOrders } = await serviceClient
      .from('orders')
      .select('id, order_number, table_id')
      .eq('restaurant_id', RESTAURANT_ID)
      .is('table_id', null)

    if (orphanOrders && orphanOrders.length > 0) {
      relationChecks.push(`${orphanOrders.length} 個訂單沒有桌台`)
    }

    return {
      success: relationChecks.length === 0,
      error: relationChecks.length > 0 ? relationChecks.join('; ') : null,
      details: { issues: relationChecks }
    }
  } catch (error) {
    return {
      success: false,
      error: `關聯檢查失敗: ${error.message}`,
      details: { exception: error.message }
    }
  }
}

async function performanceBenchmark() {
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey)
  
  const benchmarks = {}
  
  try {
    // 測試基本查詢效能
    const start1 = Date.now()
    await serviceClient
      .from('restaurants')
      .select('*')
      .eq('id', RESTAURANT_ID)
    benchmarks.restaurantQuery = Date.now() - start1

    // 測試分類查詢效能
    const start2 = Date.now()
    await serviceClient
      .from('categories')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
    benchmarks.categoriesQuery = Date.now() - start2

    // 測試產品查詢效能
    const start3 = Date.now()
    await serviceClient
      .from('products')
      .select('*, categories(name)')
      .eq('restaurant_id', RESTAURANT_ID)
    benchmarks.productsWithCategoriesQuery = Date.now() - start3

    const avgResponse = Object.values(benchmarks).reduce((a, b) => a + b, 0) / Object.keys(benchmarks).length
    const hasGoodPerformance = avgResponse < 1000 // 小於 1 秒

    return {
      success: hasGoodPerformance,
      error: !hasGoodPerformance ? `平均響應時間過長: ${avgResponse}ms` : null,
      details: { ...benchmarks, average: avgResponse }
    }
  } catch (error) {
    return {
      success: false,
      error: `效能測試失敗: ${error.message}`,
      details: { exception: error.message }
    }
  }
}

function generateDiagnosticReport(results, passed, total) {
  console.log('📊 === 診斷報告 ===')
  console.log(`🎯 總體結果: ${passed}/${total} 通過 (${Math.round(passed/total*100)}%)`)
  console.log('')

  // 分類顯示結果
  const passedTests = results.filter(r => r.success)
  const failedTests = results.filter(r => !r.success)

  if (passedTests.length > 0) {
    console.log('✅ 通過的測試:')
    passedTests.forEach(test => {
      console.log(`   ✓ ${test.name}`)
    })
    console.log('')
  }

  if (failedTests.length > 0) {
    console.log('❌ 失敗的測試:')
    failedTests.forEach(test => {
      console.log(`   ✗ ${test.name}: ${test.error}`)
    })
    console.log('')
  }

  // 提供修復建議
  if (failedTests.length > 0) {
    console.log('🔧 修復建議:')
    failedTests.forEach(test => {
      console.log(`   • ${test.name}: ${getFixSuggestion(test.name)}`)
    })
    console.log('')
  }

  // 系統狀態評估
  if (passed === total) {
    console.log('🎉 系統狀態: 完美！所有檢查都通過')
    console.log('✨ 建議: 可以開始進行頁面連接工作')
  } else if (passed >= total * 0.8) {
    console.log('🟡 系統狀態: 良好，有少數問題需要修復')
    console.log('💡 建議: 修復失敗項目後繼續')
  } else if (passed >= total * 0.5) {
    console.log('🟠 系統狀態: 一般，需要處理多個問題')
    console.log('⚠️  建議: 請先修復主要問題再繼續')
  } else {
    console.log('🔴 系統狀態: 嚴重問題，需要全面檢查')
    console.log('🛑 建議: 請檢查基礎配置和環境設定')
  }
}

function getFixSuggestion(testName) {
  const suggestions = {
    '環境變數檢查': '檢查 .env 檔案，確保所有必要變數都已設定',
    'Supabase 連接測試': '驗證 Supabase URL 和 API 金鑰是否正確',
    '資料表結構驗證': '執行 supabase_complete.sql 重新建立資料表',
    '測試資料完整性': '執行 load-final-complete-data.js 載入測試資料',
    'API 權限檢查': '檢查 Supabase 專案的 RLS 政策設定',
    '關聯資料驗證': '清理無效資料，重新建立正確的關聯',
    '效能基準測試': '檢查網路連接，考慮優化查詢或增加索引'
  }
  return suggestions[testName] || '請檢查相關設定和資料'
}

// 如果直接執行此腳本
if (import.meta.url === `file://${process.argv[1]}`) {
  runDiagnostics().catch(console.error)
}

export { runDiagnostics, diagnosticTasks }
