import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 錯誤：找不到 Supabase 配置')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function upgradeComboSystem() {
  try {
    console.log('🔄 升級套餐系統...')
    
    // 讀取 SQL 檔案
    const sqlContent = readFileSync('upgrade-combo-system.sql', 'utf-8')
    console.log('📁 已讀取 upgrade-combo-system.sql')
    
    // 分割並執行 SQL 語句 
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 將執行 ${statements.length} 個升級語句...`)
    
    // 測試連接並嘗試執行關鍵查詢
    console.log('🔍 檢查現有套餐...')
    const { data: existingCombos } = await supabase
      .from('combo_products')
      .select('id, name, combo_type')
    
    console.log(`📋 找到 ${existingCombos?.length || 0} 個現有套餐`)
    
    console.log('\n⚠️  由於 Supabase 限制，請手動在 SQL Editor 中執行 upgrade-combo-system.sql')
    console.log('🔗 Supabase Dashboard: https://supabase.com/dashboard')
    
    // 驗證升級是否完成
    setTimeout(async () => {
      console.log('\n🔍 檢查升級狀態...')
      try {
        // 檢查新表格
        const { data: rules } = await supabase
          .from('combo_selection_rules')
          .select('*')
          .limit(1)
        
        if (rules) {
          console.log('✅ combo_selection_rules 表格已創建')
        }
      } catch (error) {
        console.log('⚠️  升級可能尚未完成，請執行 SQL 檔案')
      }
    }, 2000)
    
  } catch (error) {
    console.error('❌ 升級失敗:', error.message)
  }
}

upgradeComboSystem()
