import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function quickCheck() {
  console.log('🔍 檢查套餐系統狀態...\n')
  
  // 檢查combo_products表格
  try {
    const { data: combos, error } = await supabase
      .from('combo_products')
      .select('*')
    
    if (error) {
      console.log('❌ combo_products表格問題:', error.message)
      console.log('📋 需要執行 upgrade-combo-system.sql')
      return
    }
    
    console.log(`✅ 找到 ${combos?.length || 0} 個套餐:`)
    combos?.forEach(combo => {
      console.log(`   - ${combo.name} (${combo.combo_type || 'fixed'})`)
    })
    
    // 檢查combo_type欄位
    const hasComboType = combos?.some(c => c.combo_type)
    if (!hasComboType) {
      console.log('\n⚠️  需要執行升級SQL添加combo_type欄位')
    }
    
  } catch (error) {
    console.log('❌ 檢查失敗:', error.message)
  }
}

quickCheck()
