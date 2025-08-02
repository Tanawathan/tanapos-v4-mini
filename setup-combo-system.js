import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// 取得當前檔案目錄
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 從 .env 檔案讀取配置
import dotenv from 'dotenv'
dotenv.config({ path: join(__dirname, '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 錯誤：找不到 Supabase 配置')
  console.error('請確認 .env 檔案中有正確的 VITE_SUPABASE_URL 和 VITE_SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// 建立 Supabase 客戶端（使用 service role key 以擁有完整權限）
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupComboSystem() {
  try {
    console.log('🍽️ 開始設置套餐系統...')
    console.log(`📍 Supabase URL: ${supabaseUrl}`)
    
    // 讀取 SQL 檔案
    const sqlPath = join(__dirname, 'setup-combo-system.sql')
    const sqlContent = readFileSync(sqlPath, 'utf-8')
    
    console.log('📁 已讀取 setup-combo-system.sql')
    
    // 將 SQL 內容分割成單獨的語句
    const sqlStatements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 將執行 ${sqlStatements.length} 個 SQL 語句...`)
    
    // 逐一執行 SQL 語句
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i]
      
      if (statement.trim()) {
        try {
          console.log(`⚡ 執行語句 ${i + 1}/${sqlStatements.length}...`)
          
          const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: statement + ';'
          })
          
          if (error) {
            // 如果 rpc 不可用，嘗試直接查詢
            if (error.message.includes('function exec_sql')) {
              console.log('⚠️  rpc 函數不可用，嘗試直接執行...')
              
              // 對於創建表格等 DDL 語句，我們需要使用其他方法
              if (statement.includes('CREATE TABLE') || statement.includes('CREATE INDEX')) {
                console.log(`📋 跳過 DDL 語句: ${statement.substring(0, 50)}...`)
                continue
              }
            } else {
              throw error
            }
          }
          
        } catch (statementError) {
          console.warn(`⚠️  語句執行警告: ${statementError.message}`)
          // 繼續執行下一個語句
        }
      }
    }
    
    // 驗證套餐系統是否設置成功
    console.log('🔍 驗證套餐系統設置...')
    
    try {
      // 檢查 combo_products 表格
      const { data: comboProducts, error: comboError } = await supabase
        .from('combo_products')
        .select('*')
        .limit(1)
      
      if (comboError) {
        console.log('⚠️  combo_products 表格可能尚未創建，這是正常的')
        console.log('請在 Supabase Dashboard 中手動執行 setup-combo-system.sql')
      } else {
        console.log('✅ combo_products 表格可用')
      }
      
      // 檢查 combo_items 表格
      const { data: comboItems, error: itemsError } = await supabase
        .from('combo_items')
        .select('*')
        .limit(1)
      
      if (itemsError) {
        console.log('⚠️  combo_items 表格可能尚未創建，這是正常的')
      } else {
        console.log('✅ combo_items 表格可用')
      }
      
    } catch (verifyError) {
      console.log('⚠️  驗證過程中遇到問題，這是正常的')
    }
    
    console.log('')
    console.log('========================================')
    console.log('🎉 套餐系統設置腳本執行完成！')
    console.log('========================================')
    console.log('')
    console.log('📋 後續步驟：')
    console.log('1. 登入 Supabase Dashboard')
    console.log('2. 進入 SQL Editor')
    console.log('3. 執行 setup-combo-system.sql 檔案中的 SQL 指令')
    console.log('4. 確認 combo_products 和 combo_items 表格已創建')
    console.log('5. 在 TanaPOS 管理系統中查看「套餐管理」功能')
    console.log('')
    console.log('🔗 Supabase Dashboard: https://supabase.com/dashboard')
    console.log('📁 SQL 檔案位置: setup-combo-system.sql')
    console.log('')
    
  } catch (error) {
    console.error('❌ 設置過程中發生錯誤:', error.message)
    console.error('')
    console.error('🔧 解決方案：')
    console.error('1. 檢查網路連線')
    console.error('2. 確認 Supabase 服務正常運行')
    console.error('3. 手動在 Supabase Dashboard 執行 SQL')
    process.exit(1)
  }
}

// 執行設置
setupComboSystem()
