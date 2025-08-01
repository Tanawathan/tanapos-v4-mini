#!/usr/bin/env node

/**
 * TanaPOS 資料庫一鍵轉移工具
 * 從舊 Supabase 實例轉移資料到新實例
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 載入環境變數
dotenv.config({ path: join(__dirname, '../.env') })

// 設定顏色輸出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
}

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  step: (step, msg) => console.log(`${colors.cyan}${step}. ${msg}${colors.reset}`),
  data: (msg) => console.log(`${colors.magenta}📊 ${msg}${colors.reset}`)
}

// 舊資料庫設定 (請在此輸入舊資料庫的連接資訊)
const OLD_SUPABASE_CONFIG = {
  url: process.env.OLD_SUPABASE_URL || '',
  serviceKey: process.env.OLD_SUPABASE_SERVICE_KEY || ''
}

// 新資料庫設定 (當前使用的資料庫)
const NEW_SUPABASE_CONFIG = {
  url: process.env.VITE_SUPABASE_URL,
  serviceKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
}

// 檢查設定
function validateConfig() {
  log.info('檢查資料庫連接設定...')
  
  if (!NEW_SUPABASE_CONFIG.url || !NEW_SUPABASE_CONFIG.serviceKey) {
    log.error('新資料庫設定不完整，請檢查 .env 文件')
    return false
  }
  
  if (!OLD_SUPABASE_CONFIG.url || !OLD_SUPABASE_CONFIG.serviceKey) {
    log.warning('舊資料庫設定不完整，將使用備份資料或手動輸入')
    return 'manual'
  }
  
  log.success('資料庫設定檢查完成')
  return true
}

// 創建資料庫連接
function createClients() {
  log.info('建立資料庫連接...')
  
  const newSupabase = createClient(
    NEW_SUPABASE_CONFIG.url,
    NEW_SUPABASE_CONFIG.serviceKey,
    {
      auth: { persistSession: false }
    }
  )
  
  let oldSupabase = null
  if (OLD_SUPABASE_CONFIG.url && OLD_SUPABASE_CONFIG.serviceKey) {
    oldSupabase = createClient(
      OLD_SUPABASE_CONFIG.url,
      OLD_SUPABASE_CONFIG.serviceKey,
      {
        auth: { persistSession: false }
      }
    )
  }
  
  return { oldSupabase, newSupabase }
}

// 測試連接
async function testConnections(oldSupabase, newSupabase) {
  log.step(1, '測試資料庫連接...')
  
  try {
    // 測試新資料庫
    const { data: newData, error: newError } = await newSupabase
      .from('categories')
      .select('count', { count: 'exact', head: true })
    
    if (newError) {
      log.error(`新資料庫連接失敗: ${newError.message}`)
      return false
    }
    
    log.success(`新資料庫連接成功`)
    
    // 測試舊資料庫（如果有設定）
    if (oldSupabase) {
      const { data: oldData, error: oldError } = await oldSupabase
        .from('categories')
        .select('count', { count: 'exact', head: true })
      
      if (oldError) {
        log.warning(`舊資料庫連接失敗: ${oldError.message}`)
        return 'new-only'
      }
      
      log.success(`舊資料庫連接成功`)
    }
    
    return true
  } catch (error) {
    log.error(`連接測試失敗: ${error.message}`)
    return false
  }
}

// 備份當前資料
async function backupCurrentData(newSupabase) {
  log.step(2, '備份當前資料...')
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backup = {
    timestamp,
    categories: [],
    products: [],
    tables: [],
    orders: [],
    order_items: []
  }
  
  try {
    // 備份分類
    const { data: categories, error: catError } = await newSupabase
      .from('categories')
      .select('*')
    
    if (catError) throw catError
    backup.categories = categories || []
    
    // 備份產品
    const { data: products, error: prodError } = await newSupabase
      .from('products')
      .select('*')
    
    if (prodError) throw prodError
    backup.products = products || []
    
    // 備份桌台
    const { data: tables, error: tableError } = await newSupabase
      .from('tables')
      .select('*')
    
    if (tableError) throw tableError
    backup.tables = tables || []
    
    // 備份訂單
    const { data: orders, error: orderError } = await newSupabase
      .from('orders')
      .select('*')
    
    if (orderError) throw orderError
    backup.orders = orders || []
    
    // 備份訂單項目
    const { data: orderItems, error: itemError } = await newSupabase
      .from('order_items')
      .select('*')
    
    if (itemError) throw itemError
    backup.order_items = orderItems || []
    
    // 儲存備份文件
    const fs = await import('fs')
    const backupPath = join(__dirname, `../backup_${timestamp}.json`)
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2))
    
    log.success(`資料備份完成: backup_${timestamp}.json`)
    log.data(`備份內容: ${backup.categories.length} 分類, ${backup.products.length} 產品, ${backup.tables.length} 桌台, ${backup.orders.length} 訂單`)
    
    return backup
  } catch (error) {
    log.error(`備份失敗: ${error.message}`)
    throw error
  }
}

// 從舊資料庫獲取資料
async function fetchOldData(oldSupabase) {
  log.step(3, '從舊資料庫獲取資料...')
  
  if (!oldSupabase) {
    log.warning('沒有舊資料庫連接，跳過此步驟')
    return null
  }
  
  try {
    const oldData = {}
    
    // 獲取分類
    const { data: categories, error: catError } = await oldSupabase
      .from('categories')
      .select('*')
      .order('sort_order')
    
    if (catError) throw catError
    oldData.categories = categories || []
    
    // 獲取產品
    const { data: products, error: prodError } = await oldSupabase
      .from('products')
      .select('*')
      .order('name')
    
    if (prodError) throw prodError
    oldData.products = products || []
    
    // 獲取桌台
    const { data: tables, error: tableError } = await oldSupabase
      .from('tables')
      .select('*')
      .order('table_number')
    
    if (tableError) throw tableError
    oldData.tables = tables || []
    
    // 獲取訂單（最近30天）
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: orders, error: orderError } = await oldSupabase
      .from('orders')
      .select('*')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
    
    if (orderError) throw orderError
    oldData.orders = orders || []
    
    // 獲取訂單項目
    if (oldData.orders.length > 0) {
      const orderIds = oldData.orders.map(order => order.id)
      const { data: orderItems, error: itemError } = await oldSupabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds)
      
      if (itemError) throw itemError
      oldData.order_items = orderItems || []
    } else {
      oldData.order_items = []
    }
    
    log.success('舊資料獲取完成')
    log.data(`獲取資料: ${oldData.categories.length} 分類, ${oldData.products.length} 產品, ${oldData.tables.length} 桌台, ${oldData.orders.length} 訂單`)
    
    return oldData
  } catch (error) {
    log.error(`獲取舊資料失敗: ${error.message}`)
    throw error
  }
}

// 合併資料
function mergeData(currentData, oldData) {
  log.step(4, '合併資料...')
  
  if (!oldData) {
    log.warning('沒有舊資料，使用當前資料')
    return currentData
  }
  
  const merged = {
    categories: [...currentData.categories],
    products: [...currentData.products],
    tables: [...currentData.tables],
    orders: [...currentData.orders],
    order_items: [...currentData.order_items]
  }
  
  // 合併分類（避免重複）
  oldData.categories.forEach(oldCat => {
    const exists = merged.categories.find(cat => cat.name === oldCat.name)
    if (!exists) {
      merged.categories.push({
        ...oldCat,
        id: undefined // 讓資料庫自動生成新 ID
      })
    }
  })
  
  // 合併產品（避免重複）
  oldData.products.forEach(oldProd => {
    const exists = merged.products.find(prod => prod.name === oldProd.name)
    if (!exists) {
      merged.products.push({
        ...oldProd,
        id: undefined // 讓資料庫自動生成新 ID
      })
    }
  })
  
  // 合併桌台（按桌號避免重複）
  oldData.tables.forEach(oldTable => {
    const exists = merged.tables.find(table => table.table_number === oldTable.table_number)
    if (!exists) {
      merged.tables.push({
        ...oldTable,
        id: undefined, // 讓資料庫自動生成新 ID
        status: 'available' // 重置狀態
      })
    }
  })
  
  // 添加歷史訂單
  oldData.orders.forEach(oldOrder => {
    merged.orders.push({
      ...oldOrder,
      id: undefined // 讓資料庫自動生成新 ID
    })
  })
  
  // 添加歷史訂單項目
  oldData.order_items.forEach(oldItem => {
    merged.order_items.push({
      ...oldItem,
      id: undefined // 讓資料庫自動生成新 ID
    })
  })
  
  log.success('資料合併完成')
  log.data(`合併結果: ${merged.categories.length} 分類, ${merged.products.length} 產品, ${merged.tables.length} 桌台, ${merged.orders.length} 訂單`)
  
  return merged
}

// 更新新資料庫
async function updateNewDatabase(newSupabase, mergedData) {
  log.step(5, '更新新資料庫...')
  
  try {
    // 清空現有資料（可選）
    log.info('清空現有資料...')
    await newSupabase.from('order_items').delete().neq('id', 'impossible')
    await newSupabase.from('orders').delete().neq('id', 'impossible')
    await newSupabase.from('products').delete().neq('id', 'impossible')
    await newSupabase.from('categories').delete().neq('id', 'impossible')
    await newSupabase.from('tables').delete().neq('id', 'impossible')
    
    // 插入分類
    if (mergedData.categories.length > 0) {
      const { error: catError } = await newSupabase
        .from('categories')
        .insert(mergedData.categories.map(cat => ({
          name: cat.name,
          description: cat.description,
          sort_order: cat.sort_order || 0,
          is_active: cat.is_active !== false
        })))
      
      if (catError) throw catError
      log.success(`插入 ${mergedData.categories.length} 個分類`)
    }
    
    // 插入產品
    if (mergedData.products.length > 0) {
      // 先獲取分類 ID 映射
      const { data: newCategories } = await newSupabase
        .from('categories')
        .select('id, name')
      
      const categoryMap = {}
      newCategories.forEach(cat => {
        categoryMap[cat.name] = cat.id
      })
      
      const { error: prodError } = await newSupabase
        .from('products')
        .insert(mergedData.products.map(prod => ({
          name: prod.name,
          description: prod.description,
          price: prod.price,
          category_id: categoryMap[prod.category_name] || categoryMap[Object.keys(categoryMap)[0]],
          image_url: prod.image_url,
          is_available: prod.is_available !== false,
          preparation_time: prod.preparation_time || 10
        })))
      
      if (prodError) throw prodError
      log.success(`插入 ${mergedData.products.length} 個產品`)
    }
    
    // 插入桌台
    if (mergedData.tables.length > 0) {
      const { error: tableError } = await newSupabase
        .from('tables')
        .insert(mergedData.tables.map(table => ({
          table_number: table.table_number,
          capacity: table.capacity || 4,
          status: 'available',
          is_active: table.is_active !== false
        })))
      
      if (tableError) throw tableError
      log.success(`插入 ${mergedData.tables.length} 個桌台`)
    }
    
    // 插入訂單（如果需要歷史資料）
    if (mergedData.orders.length > 0) {
      const { error: orderError } = await newSupabase
        .from('orders')
        .insert(mergedData.orders.map(order => ({
          order_number: order.order_number,
          table_number: order.table_number,
          total_amount: order.total_amount,
          subtotal: order.subtotal,
          tax_amount: order.tax_amount || 0,
          status: order.status,
          notes: order.notes,
          created_at: order.created_at
        })))
      
      if (orderError) throw orderError
      log.success(`插入 ${mergedData.orders.length} 個歷史訂單`)
    }
    
    log.success('資料庫更新完成！')
    
  } catch (error) {
    log.error(`資料庫更新失敗: ${error.message}`)
    throw error
  }
}

// 主要執行函數
async function main() {
  console.log(`${colors.bright}${colors.cyan}
╔═══════════════════════════════════════╗
║     TanaPOS 資料庫一鍵轉移工具        ║
╚═══════════════════════════════════════╝${colors.reset}
`)

  try {
    // 1. 檢查設定
    const configResult = validateConfig()
    if (configResult === false) {
      process.exit(1)
    }
    
    // 2. 創建連接
    const { oldSupabase, newSupabase } = createClients()
    
    // 3. 測試連接
    const connectionResult = await testConnections(oldSupabase, newSupabase)
    if (connectionResult === false) {
      process.exit(1)
    }
    
    // 4. 備份當前資料
    const currentData = await backupCurrentData(newSupabase)
    
    // 5. 獲取舊資料
    const oldData = await fetchOldData(oldSupabase)
    
    // 6. 合併資料
    const mergedData = mergeData(currentData, oldData)
    
    // 7. 確認執行
    log.warning('即將執行資料庫更新，此操作將覆蓋現有資料')
    log.info('請確認備份已完成，然後按 Enter 繼續，或按 Ctrl+C 取消')
    
    // 等待用戶確認
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.on('data', async (key) => {
      if (key[0] === 13) { // Enter key
        process.stdin.pause()
        
        // 8. 更新資料庫
        await updateNewDatabase(newSupabase, mergedData)
        
        log.success('🎉 資料轉移完成！')
        log.info('請檢查應用程式是否正常運作')
        process.exit(0)
      } else if (key[0] === 3) { // Ctrl+C
        log.warning('操作已取消')
        process.exit(0)
      }
    })
    
  } catch (error) {
    log.error(`執行失敗: ${error.message}`)
    console.error(error)
    process.exit(1)
  }
}

// 執行腳本
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
