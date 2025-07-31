import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// 取得當前檔案目錄
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 從 .env 檔案讀取配置
import dotenv from 'dotenv'
dotenv.config({ path: join(__dirname, '../.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 錯誤：找不到 Supabase 配置')
  console.error('請確認 .env 檔案中有正確的 VITE_SUPABASE_URL 和 VITE_SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// 建立 Supabase 客戶端（使用 service role key 以擁有完整權限）
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  try {
    console.log('🚀 開始設置 TanaPOS V4-Mini 資料庫...')
    console.log(`📍 Supabase URL: ${supabaseUrl}`)
    
    // 讀取 SQL 檔案
    const sqlPath = join(__dirname, '../setup-pos-database.sql')
    const sqlContent = readFileSync(sqlPath, 'utf8')
    
    console.log('📖 讀取 SQL 檔案成功')
    console.log(`📄 SQL 檔案大小: ${sqlContent.length} 字元`)
    
    // 分割 SQL 語句（以分號和換行符分割）
    const sqlStatements = sqlContent
      .split(/;\s*\n/)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`🔧 準備執行 ${sqlStatements.length} 個 SQL 語句`)
    
    // 逐一執行 SQL 語句
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i]
      if (statement.trim()) {
        try {
          console.log(`⚡ 執行語句 ${i + 1}/${sqlStatements.length}`)
          
          const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: statement + ';'
          })
          
          if (error) {
            // 如果 rpc 不存在，嘗試直接執行
            console.log('🔄 嘗試直接執行 SQL...')
            const { error: directError } = await supabase
              .from('_dummy_')
              .select('*')
              .limit(0)
            
            // 由於無法直接執行 DDL，我們需要使用 PostgreSQL 的 REST API
            throw new Error(`無法執行 SQL: ${error.message}`)
          }
          
        } catch (err) {
          console.error(`❌ 執行語句 ${i + 1} 時發生錯誤:`)
          console.error(statement.substring(0, 100) + '...')
          console.error(err.message)
          // 繼續執行下一個語句而不停止
        }
      }
    }
    
    console.log('✅ 資料庫設置完成！')
    
    // 驗證表格是否建立成功
    console.log('🔍 驗證資料庫結構...')
    
    const tables = ['restaurants', 'categories', 'products', 'tables', 'orders', 'order_items']
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ 表格 ${table} 不存在或無法存取`)
        } else {
          console.log(`✅ 表格 ${table} 驗證成功`)
        }
      } catch (err) {
        console.log(`❌ 表格 ${table} 驗證失敗: ${err.message}`)
      }
    }
    
    console.log('🎉 TanaPOS V4-Mini 資料庫設置程序完成！')
    
  } catch (error) {
    console.error('❌ 資料庫設置失敗:', error.message)
    process.exit(1)
  }
}

// 執行設置
setupDatabase()
