#!/usr/bin/env node

/**
 * 快速設定資料庫遷移工具
 */

import * as readline from 'readline'
import * as fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

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

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function main() {
  console.log(`${colors.bright}${colors.cyan}
╔═══════════════════════════════════════╗
║    TanaPOS 資料庫遷移設定工具         ║
╚═══════════════════════════════════════╝${colors.reset}
`)

  console.log(`${colors.blue}ℹ 此工具將幫助您設定資料庫遷移所需的環境變數${colors.reset}\n`)

  try {
    // 檢查現有設定
    const envPath = join(__dirname, '../.env')
    const migrationEnvPath = join(__dirname, '../.env.migration')
    
    let currentConfig = ''
    if (fs.existsSync(envPath)) {
      currentConfig = fs.readFileSync(envPath, 'utf8')
      console.log(`${colors.green}✅ 找到現有的 .env 設定文件${colors.reset}`)
    } else {
      console.log(`${colors.yellow}⚠️ 未找到 .env 文件，請先設定基本環境變數${colors.reset}`)
      rl.close()
      return
    }

    // 顯示當前新資料庫設定
    const urlMatch = currentConfig.match(/VITE_SUPABASE_URL=(.+)/)
    const keyMatch = currentConfig.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/)
    
    if (urlMatch && keyMatch) {
      console.log(`${colors.green}✅ 新資料庫設定:${colors.reset}`)
      console.log(`   URL: ${urlMatch[1]}`)
      console.log(`   Key: ${keyMatch[1].substring(0, 20)}...`)
    } else {
      console.log(`${colors.red}❌ 新資料庫設定不完整${colors.reset}`)
      rl.close()
      return
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // 設定舊資料庫
    console.log(`${colors.yellow}請輸入舊資料庫的連接資訊:${colors.reset}\n`)

    const oldUrl = await question('舊 Supabase URL (https://xxx.supabase.co): ')
    if (!oldUrl || !oldUrl.includes('supabase.co')) {
      console.log(`${colors.red}❌ URL 格式不正確${colors.reset}`)
      rl.close()
      return
    }

    const oldKey = await question('舊 Supabase Service Role Key: ')
    if (!oldKey || oldKey.length < 50) {
      console.log(`${colors.red}❌ Service Role Key 格式不正確${colors.reset}`)
      rl.close()
      return
    }

    // 生成遷移設定文件
    const migrationConfig = `# 舊資料庫設定 (用於資料轉移)
# 此文件由設定工具自動生成 - ${new Date().toISOString()}

# 舊 Supabase 專案 URL
OLD_SUPABASE_URL=${oldUrl}

# 舊 Supabase 專案 Service Role Key  
OLD_SUPABASE_SERVICE_KEY=${oldKey}

# 轉移設定
MIGRATION_INCLUDE_ORDERS=true
MIGRATION_DAYS_BACK=30
MIGRATION_BACKUP_ENABLED=true
`

    fs.writeFileSync(migrationEnvPath, migrationConfig)
    console.log(`\n${colors.green}✅ 遷移設定已儲存到 .env.migration${colors.reset}`)

    // 測試連接
    console.log(`\n${colors.blue}ℹ 測試資料庫連接...${colors.reset}`)
    
    try {
      const { createClient } = await import('@supabase/supabase-js')
      
      // 測試舊資料庫
      const oldSupabase = createClient(oldUrl, oldKey, {
        auth: { persistSession: false }
      })
      
      const { data, error } = await oldSupabase
        .from('categories')
        .select('count', { count: 'exact', head: true })
      
      if (error) {
        console.log(`${colors.yellow}⚠️ 舊資料庫連接測試失敗: ${error.message}${colors.reset}`)
        console.log(`${colors.blue}ℹ 這可能是正常的，如果舊專案已關閉或表格結構不同${colors.reset}`)
      } else {
        console.log(`${colors.green}✅ 舊資料庫連接測試成功${colors.reset}`)
      }
      
    } catch (testError) {
      console.log(`${colors.yellow}⚠️ 連接測試失敗: ${testError.message}${colors.reset}`)
    }

    // 顯示下一步
    console.log(`\n${colors.cyan}🚀 設定完成！下一步:${colors.reset}`)
    console.log(`${colors.blue}1. 檢查並確認設定: .env.migration${colors.reset}`)
    console.log(`${colors.blue}2. 執行遷移工具: migrate-database.bat${colors.reset}`)
    console.log(`${colors.blue}3. 或直接執行: node scripts/migrate-database.mjs${colors.reset}`)

    console.log(`\n${colors.yellow}⚠️ 重要提醒:${colors.reset}`)
    console.log(`${colors.yellow}- 建議在非營業時間執行遷移${colors.reset}`)
    console.log(`${colors.yellow}- 執行前會自動備份現有資料${colors.reset}`)
    console.log(`${colors.yellow}- 確保網路連接穩定${colors.reset}`)

  } catch (error) {
    console.log(`${colors.red}❌ 設定失敗: ${error.message}${colors.reset}`)
  } finally {
    rl.close()
  }
}

main()
