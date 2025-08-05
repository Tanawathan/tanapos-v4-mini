// TanaPOS v4 AI - 自動修復腳本
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY
const RESTAURANT_ID = process.env.VITE_RESTAURANT_ID || process.env.RESTAURANT_ID

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔧 TanaPOS v4 AI - 自動修復腳本\n')

// 修復任務清單
const fixTasks = [
  {
    name: '檢查並修復餐廳資料',
    task: fixRestaurantData
  },
  {
    name: '檢查並修復分類資料',
    task: fixCategoriesData
  },
  {
    name: '檢查並修復產品資料',
    task: fixProductsData
  },
  {
    name: '檢查並修復桌台資料',
    task: fixTablesData
  },
  {
    name: '檢查並修復關聯資料',
    task: fixRelationalData
  },
  {
    name: '清理無效資料',
    task: cleanupInvalidData
  },
  {
    name: '重建索引',
    task: rebuildIndexes
  }
]

async function runAutoFix() {
  console.log('🚀 開始執行自動修復...\n')
  
  let fixedIssues = 0
  let totalTasks = fixTasks.length
  const results = []

  for (const fixTask of fixTasks) {
    console.log(`🔧 執行: ${fixTask.name}`)
    try {
      const result = await fixTask.task()
      if (result.fixed) {
        console.log(`✅ ${fixTask.name}: 修復完成 - ${result.message}`)
        fixedIssues++
      } else if (result.noIssues) {
        console.log(`✅ ${fixTask.name}: 無需修復`)
      } else {
        console.log(`❌ ${fixTask.name}: 修復失敗 - ${result.error}`)
      }
      results.push({ name: fixTask.name, ...result })
    } catch (error) {
      console.log(`❌ ${fixTask.name}: 異常 - ${error.message}`)
      results.push({ name: fixTask.name, fixed: false, error: error.message })
    }
    console.log('')
  }

  // 生成修復報告
  generateFixReport(results, fixedIssues, totalTasks)
}

async function fixRestaurantData() {
  try {
    // 檢查餐廳是否存在
    const { data: restaurant, error: fetchError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', RESTAURANT_ID)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      return { fixed: false, error: `查詢餐廳失敗: ${fetchError.message}` }
    }

    if (!restaurant) {
      // 建立餐廳資料
      const { error: insertError } = await supabase
        .from('restaurants')
        .insert({
          id: RESTAURANT_ID,
          name: 'TanaPOS v4 AI 測試餐廳',
          address: '台北市信義區松高路123號',
          phone: '02-1234-5678',
          email: 'test@tanapos-v4.ai',
          website: 'https://tanapos-v4.ai',
          tax_rate: 0.05,
          service_charge_rate: 0.10,
          currency: 'TWD',
          timezone: 'Asia/Taipei',
          business_hours: {
            monday: { open: '09:00', close: '22:00' },
            tuesday: { open: '09:00', close: '22:00' },
            wednesday: { open: '09:00', close: '22:00' },
            thursday: { open: '09:00', close: '22:00' },
            friday: { open: '09:00', close: '23:00' },
            saturday: { open: '09:00', close: '23:00' },
            sunday: { open: '10:00', close: '21:00' }
          },
          settings: {
            kds_auto_print: true,
            order_timeout: 30,
            language: 'zh-TW',
            theme: 'light',
            ai_enabled: true
          },
          is_active: true,
          metadata: {
            description: '完整功能測試餐廳，支援AI智能分析',
            cuisine_type: 'mixed'
          }
        })

      if (insertError) {
        return { fixed: false, error: `建立餐廳失敗: ${insertError.message}` }
      }

      return { fixed: true, message: '已建立餐廳資料' }
    }

    // 檢查並更新必要欄位
    const updates = {}
    if (!restaurant.business_hours) {
      updates.business_hours = {
        monday: { open: '09:00', close: '22:00' },
        tuesday: { open: '09:00', close: '22:00' },
        wednesday: { open: '09:00', close: '22:00' },
        thursday: { open: '09:00', close: '22:00' },
        friday: { open: '09:00', close: '23:00' },
        saturday: { open: '09:00', close: '23:00' },
        sunday: { open: '10:00', close: '21:00' }
      }
    }
    if (!restaurant.settings) {
      updates.settings = {
        kds_auto_print: true,
        order_timeout: 30,
        language: 'zh-TW',
        theme: 'light',
        ai_enabled: true
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('restaurants')
        .update(updates)
        .eq('id', RESTAURANT_ID)

      if (updateError) {
        return { fixed: false, error: `更新餐廳失敗: ${updateError.message}` }
      }

      return { fixed: true, message: '已更新餐廳設定' }
    }

    return { noIssues: true, message: '餐廳資料正常' }
  } catch (error) {
    return { fixed: false, error: error.message }
  }
}

async function fixCategoriesData() {
  try {
    const { data: categories, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)

    if (fetchError) {
      return { fixed: false, error: `查詢分類失敗: ${fetchError.message}` }
    }

    if (!categories || categories.length === 0) {
      // 建立基本分類
      const defaultCategories = [
        {
          id: '11111111-2222-3333-4444-555555555551',
          restaurant_id: RESTAURANT_ID,
          name: '開胃菜',
          description: '精緻開胃小點',
          icon: '🥗',
          color: '#10B981',
          sort_order: 1,
          is_active: true
        },
        {
          id: '11111111-2222-3333-4444-555555555552',
          restaurant_id: RESTAURANT_ID,
          name: '主餐',
          description: '招牌主要餐點',
          icon: '🍖',
          color: '#F59E0B',
          sort_order: 2,
          is_active: true
        },
        {
          id: '11111111-2222-3333-4444-555555555553',
          restaurant_id: RESTAURANT_ID,
          name: '飲品',
          description: '各式精選飲品',
          icon: '🥤',
          color: '#3B82F6',
          sort_order: 3,
          is_active: true
        },
        {
          id: '11111111-2222-3333-4444-555555555554',
          restaurant_id: RESTAURANT_ID,
          name: '甜點',
          description: '手工精緻甜點',
          icon: '🍰',
          color: '#EC4899',
          sort_order: 4,
          is_active: true
        }
      ]

      const { error: insertError } = await supabase
        .from('categories')
        .insert(defaultCategories)

      if (insertError) {
        return { fixed: false, error: `建立分類失敗: ${insertError.message}` }
      }

      return { fixed: true, message: `已建立 ${defaultCategories.length} 個基本分類` }
    }

    return { noIssues: true, message: `分類資料正常 (${categories.length} 個分類)` }
  } catch (error) {
    return { fixed: false, error: error.message }
  }
}

async function fixProductsData() {
  try {
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)

    if (fetchError) {
      return { fixed: false, error: `查詢產品失敗: ${fetchError.message}` }
    }

    if (!products || products.length === 0) {
      // 確保分類存在
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name')
        .eq('restaurant_id', RESTAURANT_ID)

      if (!categories || categories.length === 0) {
        return { fixed: false, error: '請先修復分類資料' }
      }

      // 建立基本產品
      const appetizersCategory = categories.find(c => c.name === '開胃菜')
      const mainsCategory = categories.find(c => c.name === '主餐')
      const drinksCategory = categories.find(c => c.name === '飲品')
      const dessertsCategory = categories.find(c => c.name === '甜點')

      const defaultProducts = [
        {
          id: '22222222-3333-4444-5555-666666666661',
          restaurant_id: RESTAURANT_ID,
          category_id: appetizersCategory?.id,
          name: '凱薩沙拉',
          description: '新鮮蘿蔓生菜配經典凱薩醬',
          sku: 'APP-CAESAR-001',
          price: 280,
          cost: 120,
          is_available: true,
          is_active: true,
          ai_recommended: true,
          ai_popularity_score: 0.85
        },
        {
          id: '22222222-3333-4444-5555-666666666662',
          restaurant_id: RESTAURANT_ID,
          category_id: mainsCategory?.id,
          name: '炭烤雞胸',
          description: '特製香料醃製炭烤雞胸佐時蔬',
          sku: 'MAIN-CHICKEN-001',
          price: 480,
          cost: 220,
          is_available: true,
          is_active: true,
          ai_recommended: true,
          ai_popularity_score: 0.92
        },
        {
          id: '22222222-3333-4444-5555-666666666664',
          restaurant_id: RESTAURANT_ID,
          category_id: drinksCategory?.id,
          name: '精品拿鐵',
          description: '單品咖啡豆手工拉花拿鐵',
          sku: 'DRINK-LATTE-001',
          price: 150,
          cost: 45,
          is_available: true,
          is_active: true,
          ai_recommended: false,
          ai_popularity_score: 0.68
        },
        {
          id: '22222222-3333-4444-5555-666666666665',
          restaurant_id: RESTAURANT_ID,
          category_id: dessertsCategory?.id,
          name: '經典提拉米蘇',
          description: '義式手工提拉米蘇',
          sku: 'DESSERT-TIRAMISU-001',
          price: 180,
          cost: 70,
          is_available: true,
          is_active: true,
          ai_recommended: true,
          ai_popularity_score: 0.73
        }
      ]

      const { error: insertError } = await supabase
        .from('products')
        .insert(defaultProducts)

      if (insertError) {
        return { fixed: false, error: `建立產品失敗: ${insertError.message}` }
      }

      return { fixed: true, message: `已建立 ${defaultProducts.length} 個基本產品` }
    }

    return { noIssues: true, message: `產品資料正常 (${products.length} 個產品)` }
  } catch (error) {
    return { fixed: false, error: error.message }
  }
}

async function fixTablesData() {
  try {
    const { data: tables, error: fetchError } = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)

    if (fetchError) {
      return { fixed: false, error: `查詢桌台失敗: ${fetchError.message}` }
    }

    if (!tables || tables.length === 0) {
      // 建立基本桌台
      const defaultTables = [
        {
          restaurant_id: RESTAURANT_ID,
          name: 'A01',
          table_number: 1,
          capacity: 4,
          status: 'available',
          section: 'A區',
          position_x: 100,
          position_y: 100
        },
        {
          restaurant_id: RESTAURANT_ID,
          name: 'A02',
          table_number: 2,
          capacity: 4,
          status: 'available',
          section: 'A區',
          position_x: 200,
          position_y: 100
        },
        {
          restaurant_id: RESTAURANT_ID,
          name: 'A03',
          table_number: 3,
          capacity: 6,
          status: 'occupied',
          section: 'A區',
          position_x: 300,
          position_y: 100
        },
        {
          restaurant_id: RESTAURANT_ID,
          name: 'B01',
          table_number: 4,
          capacity: 2,
          status: 'available',
          section: 'B區',
          position_x: 100,
          position_y: 200
        }
      ]

      const { error: insertError } = await supabase
        .from('tables')
        .insert(defaultTables)

      if (insertError) {
        return { fixed: false, error: `建立桌台失敗: ${insertError.message}` }
      }

      return { fixed: true, message: `已建立 ${defaultTables.length} 個基本桌台` }
    }

    return { noIssues: true, message: `桌台資料正常 (${tables.length} 個桌台)` }
  } catch (error) {
    return { fixed: false, error: error.message }
  }
}

async function fixRelationalData() {
  try {
    let fixCount = 0

    // 修復沒有分類的產品
    const { data: orphanProducts } = await supabase
      .from('products')
      .select('id, name, category_id')
      .eq('restaurant_id', RESTAURANT_ID)
      .is('category_id', null)

    if (orphanProducts && orphanProducts.length > 0) {
      // 獲取第一個分類作為預設分類
      const { data: firstCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('restaurant_id', RESTAURANT_ID)
        .limit(1)
        .single()

      if (firstCategory) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ category_id: firstCategory.id })
          .in('id', orphanProducts.map(p => p.id))

        if (!updateError) {
          fixCount += orphanProducts.length
        }
      }
    }

    // 修復沒有桌台的訂單（將其設為外帶）
    const { data: orphanOrders } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('restaurant_id', RESTAURANT_ID)
      .is('table_id', null)

    if (orphanOrders && orphanOrders.length > 0) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ order_type: 'takeaway' })
        .in('id', orphanOrders.map(o => o.id))

      if (!updateError) {
        fixCount += orphanOrders.length
      }
    }

    if (fixCount > 0) {
      return { fixed: true, message: `修復了 ${fixCount} 個關聯問題` }
    }

    return { noIssues: true, message: '關聯資料正常' }
  } catch (error) {
    return { fixed: false, error: error.message }
  }
}

async function cleanupInvalidData() {
  try {
    let cleanupCount = 0

    // 清理重複的分類
    const { data: duplicateCategories } = await supabase
      .from('categories')
      .select('name, restaurant_id')
      .eq('restaurant_id', RESTAURANT_ID)

    if (duplicateCategories) {
      const nameCount = {}
      duplicateCategories.forEach(cat => {
        nameCount[cat.name] = (nameCount[cat.name] || 0) + 1
      })

      for (const [name, count] of Object.entries(nameCount)) {
        if (count > 1) {
          // 保留第一個，刪除其餘的
          const { data: duplicates } = await supabase
            .from('categories')
            .select('id')
            .eq('restaurant_id', RESTAURANT_ID)
            .eq('name', name)
            .order('created_at')

          if (duplicates && duplicates.length > 1) {
            const toDelete = duplicates.slice(1).map(d => d.id)
            const { error } = await supabase
              .from('categories')
              .delete()
              .in('id', toDelete)

            if (!error) {
              cleanupCount += toDelete.length
            }
          }
        }
      }
    }

    if (cleanupCount > 0) {
      return { fixed: true, message: `清理了 ${cleanupCount} 個無效資料` }
    }

    return { noIssues: true, message: '無需清理' }
  } catch (error) {
    return { fixed: false, error: error.message }
  }
}

async function rebuildIndexes() {
  try {
    // 這裡可以執行索引重建的 SQL 命令
    // 由於 Supabase 自動管理索引，我們主要檢查查詢效能
    
    const start = Date.now()
    await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('restaurant_id', RESTAURANT_ID)
      .limit(10)
    
    const queryTime = Date.now() - start
    
    if (queryTime > 2000) {
      return { fixed: false, error: `查詢效能過慢: ${queryTime}ms` }
    }

    return { noIssues: true, message: `查詢效能正常: ${queryTime}ms` }
  } catch (error) {
    return { fixed: false, error: error.message }
  }
}

function generateFixReport(results, fixed, total) {
  console.log('📊 === 修復報告 ===')
  console.log(`🎯 修復結果: ${fixed}/${total} 項目處理完成`)
  console.log('')

  const fixedTasks = results.filter(r => r.fixed)
  const noIssueTasks = results.filter(r => r.noIssues)
  const failedTasks = results.filter(r => !r.fixed && !r.noIssues)

  if (fixedTasks.length > 0) {
    console.log('✅ 已修復的問題:')
    fixedTasks.forEach(task => {
      console.log(`   ✓ ${task.name}: ${task.message}`)
    })
    console.log('')
  }

  if (noIssueTasks.length > 0) {
    console.log('✅ 正常的項目:')
    noIssueTasks.forEach(task => {
      console.log(`   ✓ ${task.name}: ${task.message}`)
    })
    console.log('')
  }

  if (failedTasks.length > 0) {
    console.log('❌ 修復失敗的項目:')
    failedTasks.forEach(task => {
      console.log(`   ✗ ${task.name}: ${task.error}`)
    })
    console.log('')
  }

  console.log('🎉 修復作業完成！')
  console.log('💡 建議執行診斷工具驗證修復結果')
}

// 如果直接執行此腳本
if (import.meta.url === `file://${process.argv[1]}`) {
  runAutoFix().catch(console.error)
}

export { runAutoFix, fixTasks }
