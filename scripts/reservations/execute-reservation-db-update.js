#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createAnonClient } from './util/createSupabaseClient.cjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const supabase = createAnonClient()

console.log('🚀 開始執行預約系統資料庫擴展 (Batch3)')

async function main() {
  const sqlPath = path.join(__dirname, 'sql', 'reservation-database-extension.sql')
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ 找不到 SQL 檔案:', sqlPath)
    process.exit(1)
  }
  const sqlContent = fs.readFileSync(sqlPath, 'utf-8')
  console.log('📖 讀取 SQL 成功, 長度:', sqlContent.length)
  console.log(sqlContent.substring(0, 200) + '...')

  const statements = sqlContent.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--'))
  console.log(`📊 拆解 ${statements.length} 個語句 (可能需要高權限手動執行)\n`)

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    console.log(`▶️ (${i + 1}/${statements.length}) ${stmt.substring(0, 80)}...`)
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: stmt })
      if (error) console.log('   ⚠️  無法執行 (可能權限不足)')
      else console.log('   ✅ 成功')
    } catch (e) {
      console.log('   ⚠️  異常:', e.message)
    }
  }

  const { data, error } = await supabase.from('table_reservations').select('*').limit(1)
  if (error) console.log('❌ 預約表驗證失敗:', error.message)
  else if (data?.length) console.log('✅ 預約表欄位:', Object.keys(data[0]).join(', '))
  else console.log('ℹ️ 無資料，但可讀取。')

  console.log('\n✅ execute-reservation-db-update 完成')
}

main().catch(e => { console.error('❌ 執行失敗', e); process.exit(1) })
