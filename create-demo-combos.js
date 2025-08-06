import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// 載入環境變數
dotenv.config()

// Supabase 配置
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// 餐廳 ID
const RESTAURANT_ID = process.env.VITE_RESTAURANT_ID || '11111111-1111-1111-1111-111111111111'

// 生成 UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// 示範套餐數據
const demoCombos = [
  {
    id: generateUUID(),
    name: '泰式經典套餐',
    description: '包含主餐、沙拉和甜點的完整套餐，體驗正宗泰式風味',
    price: 350,
    combo_type: 'selectable',
    is_available: true,
    preparation_time: 25,
    image_url: null,
    category_id: null,
    restaurant_id: RESTAURANT_ID,
    sort_order: 1
  },
  {
    id: generateUUID(),
    name: '商務午餐套餐',
    description: '快速便捷的商務午餐選擇，營養均衡',
    price: 280,
    combo_type: 'selectable',
    is_available: true,
    preparation_time: 18,
    image_url: null,
    category_id: null,
    restaurant_id: RESTAURANT_ID,
    sort_order: 2
  },
  {
    id: generateUUID(),
    name: '家庭分享套餐',
    description: '適合2-3人分享的豪華套餐組合',
    price: 650,
    combo_type: 'selectable',
    is_available: true,
    preparation_time: 35,
    image_url: null,
    category_id: null,
    restaurant_id: RESTAURANT_ID,
    sort_order: 3
  }
]

// 示範選擇規則數據
function createDemoRules(comboId, comboName) {
  const rules = []
  
  if (comboName === '泰式經典套餐') {
    // 主餐選擇規則
    rules.push({
      id: generateUUID(),
      combo_id: comboId,
      selection_name: '主餐選擇',
      description: '請選擇一道主餐',
      min_selections: 1,
      max_selections: 1,
      is_required: true,
      display_order: 1,
      category_id: null
    })
    
    // 沙拉選擇規則
    rules.push({
      id: generateUUID(),
      combo_id: comboId,
      selection_name: '沙拉選擇',
      description: '請選擇一道沙拉',
      min_selections: 1,
      max_selections: 1,
      is_required: true,
      display_order: 2,
      category_id: null
    })
    
    // 甜點選擇規則
    rules.push({
      id: generateUUID(),
      combo_id: comboId,
      selection_name: '甜點選擇',
      description: '請選擇一道甜點',
      min_selections: 1,
      max_selections: 1,
      is_required: true,
      display_order: 3,
      category_id: null
    })
  } else if (comboName === '商務午餐套餐') {
    // 主餐選擇規則
    rules.push({
      id: generateUUID(),
      combo_id: comboId,
      selection_name: '主餐選擇',
      description: '請選擇一道主餐',
      min_selections: 1,
      max_selections: 1,
      is_required: true,
      display_order: 1,
      category_id: null
    })
    
    // 額外配菜（可選）
    rules.push({
      id: generateUUID(),
      combo_id: comboId,
      selection_name: '額外配菜',
      description: '可選擇額外配菜（可選）',
      min_selections: 0,
      max_selections: 2,
      is_required: false,
      display_order: 2,
      category_id: null
    })
  } else if (comboName === '家庭分享套餐') {
    // 主餐選擇規則（可選多個）
    rules.push({
      id: generateUUID(),
      combo_id: comboId,
      selection_name: '主餐選擇',
      description: '請選擇2-3道主餐',
      min_selections: 2,
      max_selections: 3,
      is_required: true,
      display_order: 1,
      category_id: null
    })
    
    // 配菜選擇規則
    rules.push({
      id: generateUUID(),
      combo_id: comboId,
      selection_name: '配菜選擇',
      description: '請選擇配菜',
      min_selections: 1,
      max_selections: 3,
      is_required: true,
      display_order: 2,
      category_id: null
    })
    
    // 甜點選擇規則
    rules.push({
      id: generateUUID(),
      combo_id: comboId,
      selection_name: '甜點選擇',
      description: '請選擇甜點',
      min_selections: 1,
      max_selections: 2,
      is_required: false,
      display_order: 3,
      category_id: null
    })
  }
  
  return rules
}

// 示範選擇選項數據
function createDemoOptions(ruleId, ruleName) {
  const options = []
  
  // 現有產品 IDs（從檢查結果獲取）
  const products = {
    // 主餐類
    '打拋豬飯': '95942080-0f97-47ed-807c-9a403d3cfaa2',
    '雞肉帕泰': '3b9ca17d-ca62-4327-8eb6-9c2605deba10',
    '打拋雞飯': '2c5fc386-c13c-4f04-8ef7-010c8173c30e',
    '魚露炸腿飯': '1414e7fc-82a6-4175-80ca-f89891bba68a',
    '炭烤雞胸': '22222222-3333-4444-5555-666666666662',
    
    // 沙拉/配菜類
    '涼拌青木瓜': '75d95537-b6d0-45eb-9e18-e15464b83d7e',
    'Laab 肉末萵苣包': '2ce2edcd-b8ce-4c29-8d22-4acb390ec1f3',
    '凱薩沙拉': '22222222-3333-4444-5555-666666666661',
    
    // 甜點類
    '提拉米蘇': 'c0000006-0006-0006-0006-000000000006',
    '草莓蛋糕': 'c0000005-0005-0005-0005-000000000005'
  }
  
  if (ruleName === '主餐選擇') {
    // 主餐選項
    options.push(
      {
        id: generateUUID(),
        rule_id: ruleId,
        product_id: products['打拋豬飯'],
        additional_price: 0,
        is_default: true,
        sort_order: 1
      },
      {
        id: generateUUID(),
        rule_id: ruleId,
        product_id: products['雞肉帕泰'],
        additional_price: -20,
        is_default: false,
        sort_order: 2
      },
      {
        id: generateUUID(),
        rule_id: ruleId,
        product_id: products['打拋雞飯'],
        additional_price: 0,
        is_default: false,
        sort_order: 3
      },
      {
        id: generateUUID(),
        rule_id: ruleId,
        product_id: products['魚露炸腿飯'],
        additional_price: 30,
        is_default: false,
        sort_order: 4
      },
      {
        id: generateUUID(),
        rule_id: ruleId,
        product_id: products['炭烤雞胸'],
        additional_price: 80,
        is_default: false,
        sort_order: 5
      }
    )
  } else if (ruleName === '沙拉選擇' || ruleName === '配菜選擇') {
    // 沙拉/配菜選項
    options.push(
      {
        id: generateUUID(),
        rule_id: ruleId,
        product_id: products['涼拌青木瓜'],
        additional_price: 0,
        is_default: true,
        sort_order: 1
      },
      {
        id: generateUUID(),
        rule_id: ruleId,
        product_id: products['Laab 肉末萵苣包'],
        additional_price: 0,
        is_default: false,
        sort_order: 2
      },
      {
        id: generateUUID(),
        rule_id: ruleId,
        product_id: products['凱薩沙拉'],
        additional_price: 50,
        is_default: false,
        sort_order: 3
      }
    )
  } else if (ruleName === '甜點選擇') {
    // 甜點選項
    options.push(
      {
        id: generateUUID(),
        rule_id: ruleId,
        product_id: products['提拉米蘇'],
        additional_price: 0,
        is_default: true,
        sort_order: 1
      },
      {
        id: generateUUID(),
        rule_id: ruleId,
        product_id: products['草莓蛋糕'],
        additional_price: -10,
        is_default: false,
        sort_order: 2
      }
    )
  } else if (ruleName === '額外配菜') {
    // 額外配菜選項
    options.push(
      {
        id: generateUUID(),
        rule_id: ruleId,
        product_id: products['涼拌青木瓜'],
        additional_price: 60,
        is_default: false,
        sort_order: 1
      },
      {
        id: generateUUID(),
        rule_id: ruleId,
        product_id: products['Laab 肉末萵苣包'],
        additional_price: 60,
        is_default: false,
        sort_order: 2
      }
    )
  }
  
  return options
}

async function createDemoCombos() {
  console.log('🎯 開始創建示範套餐...')
  
  try {
    // 1. 創建套餐
    console.log('\n📦 創建套餐產品...')
    const { data: combosData, error: combosError } = await supabase
      .from('combo_products')
      .insert(demoCombos)
      .select()
    
    if (combosError) {
      console.error('❌ 創建套餐失敗:', combosError)
      return
    }
    
    console.log(`✅ 成功創建 ${combosData.length} 個套餐`)
    combosData.forEach(combo => {
      console.log(`   - ${combo.name} (ID: ${combo.id})`)
    })
    
    // 2. 為每個套餐創建選擇規則
    console.log('\n📋 創建選擇規則...')
    const allRules = []
    
    for (const combo of combosData) {
      const rules = createDemoRules(combo.id, combo.name)
      allRules.push(...rules)
    }
    
    const { data: rulesData, error: rulesError } = await supabase
      .from('combo_selection_rules')
      .insert(allRules)
      .select()
    
    if (rulesError) {
      console.error('❌ 創建選擇規則失敗:', rulesError)
      return
    }
    
    console.log(`✅ 成功創建 ${rulesData.length} 個選擇規則`)
    
    // 3. 為每個規則創建選擇選項
    console.log('\n🔧 創建選擇選項...')
    const allOptions = []
    
    for (const rule of rulesData) {
      const options = createDemoOptions(rule.id, rule.selection_name)
      allOptions.push(...options)
    }
    
    const { data: optionsData, error: optionsError } = await supabase
      .from('combo_selection_options')
      .insert(allOptions)
      .select()
    
    if (optionsError) {
      console.error('❌ 創建選擇選項失敗:', optionsError)
      return
    }
    
    console.log(`✅ 成功創建 ${optionsData.length} 個選擇選項`)
    
    // 4. 顯示創建結果摘要
    console.log('\n🎉 示範套餐創建完成！')
    console.log('==================================================')
    
    for (const combo of combosData) {
      console.log(`\n📦 ${combo.name}`)
      console.log(`   價格: NT$ ${combo.price}`)
      console.log(`   製作時間: ${combo.preparation_time} 分鐘`)
      console.log(`   描述: ${combo.description}`)
      
      const comboRules = rulesData.filter(rule => rule.combo_id === combo.id)
      console.log(`   規則數量: ${comboRules.length}`)
      
      comboRules.forEach(rule => {
        const ruleOptions = optionsData.filter(option => option.rule_id === rule.id)
        console.log(`     - ${rule.selection_name}: ${rule.min_selections}-${rule.max_selections} 選項 (${ruleOptions.length} 個商品)`)
      })
    }
    
    console.log('\n🚀 現在您可以在套餐管理頁面中測試規則編輯器功能！')
    
  } catch (error) {
    console.error('❌ 創建示範套餐時發生錯誤:', error)
  }
}

// 執行創建
createDemoCombos()
