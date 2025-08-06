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

async function verifyCombos() {
  console.log('🔍 驗證示範套餐數據...')
  
  try {
    // 1. 檢查套餐
    const { data: combos, error: combosError } = await supabase
      .from('combo_products')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
      .order('sort_order')
    
    if (combosError) {
      console.error('❌ 查詢套餐失敗:', combosError)
      return
    }
    
    console.log(`\n✅ 找到 ${combos.length} 個套餐:`)
    combos.forEach(combo => {
      console.log(`   - ${combo.name} (${combo.combo_type}) - NT$ ${combo.price}`)
    })
    
    // 2. 檢查每個套餐的規則
    for (const combo of combos) {
      console.log(`\n📋 檢查套餐「${combo.name}」的規則:`)
      
      const { data: rules, error: rulesError } = await supabase
        .from('combo_selection_rules')
        .select('*')
        .eq('combo_id', combo.id)
        .order('display_order')
      
      if (rulesError) {
        console.error(`❌ 查詢規則失敗:`, rulesError)
        continue
      }
      
      console.log(`   找到 ${rules.length} 個選擇規則:`)
      
      // 3. 檢查每個規則的選項
      for (const rule of rules) {
        const { data: options, error: optionsError } = await supabase
          .from('combo_selection_options')
          .select(`
            *,
            products!inner(id, name, price)
          `)
          .eq('rule_id', rule.id)
          .order('sort_order')
        
        if (optionsError) {
          console.error(`❌ 查詢選項失敗:`, optionsError)
          continue
        }
        
        console.log(`     ✓ ${rule.selection_name} (${rule.min_selections}-${rule.max_selections} 選項)`)
        console.log(`       必選: ${rule.is_required ? '是' : '否'}`)
        console.log(`       商品選項 (${options.length} 個):`)
        
        options.forEach(option => {
          const sign = option.additional_price > 0 ? '+' : option.additional_price < 0 ? '' : ''
          const priceStr = option.additional_price !== 0 ? ` (${sign}$${option.additional_price})` : ''
          const defaultStr = option.is_default ? ' [預設]' : ''
          console.log(`         - ${option.products.name}${priceStr}${defaultStr}`)
        })
      }
    }
    
    // 4. 統計總覽
    console.log('\n📊 統計總覽:')
    
    const totalRules = await supabase
      .from('combo_selection_rules')
      .select('id', { count: 'exact' })
      .in('combo_id', combos.map(c => c.id))
    
    const totalOptions = await supabase
      .from('combo_selection_options')
      .select('id', { count: 'exact' })
      .in('rule_id', (await supabase
        .from('combo_selection_rules')
        .select('id')
        .in('combo_id', combos.map(c => c.id))
      ).data.map(r => r.id))
    
    console.log(`   套餐數量: ${combos.length}`)
    console.log(`   規則數量: ${totalRules.count}`)
    console.log(`   選項數量: ${totalOptions.count}`)
    
    // 5. 價格範圍計算示例
    console.log('\n💰 價格範圍計算:')
    for (const combo of combos) {
      const { data: rules } = await supabase
        .from('combo_selection_rules')
        .select(`
          *,
          combo_selection_options(
            additional_price,
            products(name)
          )
        `)
        .eq('combo_id', combo.id)
      
      let minPrice = combo.price
      let maxPrice = combo.price
      
      rules.forEach(rule => {
        if (rule.is_required) {
          const prices = rule.combo_selection_options.map(opt => opt.additional_price)
          minPrice += Math.min(...prices) * rule.min_selections
          maxPrice += Math.max(...prices) * rule.max_selections
        }
      })
      
      console.log(`   ${combo.name}: NT$ ${minPrice} ~ NT$ ${maxPrice}`)
    }
    
    console.log('\n🎉 所有示範套餐數據驗證完成！')
    console.log('現在您可以在套餐管理頁面中使用規則編輯器進行測試。')
    
  } catch (error) {
    console.error('❌ 驗證過程中發生錯誤:', error)
  }
}

// 執行驗證
verifyCombos()
