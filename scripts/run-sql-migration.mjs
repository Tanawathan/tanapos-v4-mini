// 使用 Supabase REST RPC 執行 SQL 檔案內容
// 需求：在 .env.local 或環境變數中提供
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// 用法：node scripts/run-sql-migration.mjs sql/migrate_raw_materials_supplier_category.sql

import fs from 'fs'
import path from 'path'
import https from 'https'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 環境變數')
  process.exit(1)
}

const file = process.argv[2]
if (!file) {
  console.error('請提供 SQL 檔案路徑，例如: node scripts/run-sql-migration.mjs sql/migrate_raw_materials_supplier_category.sql')
  process.exit(1)
}

const sqlPath = path.resolve(process.cwd(), file)
if (!fs.existsSync(sqlPath)) {
  console.error('找不到 SQL 檔案:', sqlPath)
  process.exit(1)
}

const sql = fs.readFileSync(sqlPath, 'utf8')

function execSQL(query) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ query })
    const url = new URL(SUPABASE_URL)

    const options = {
      hostname: url.hostname,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'return=minimal'
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, data })
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        }
      })
    })

    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

try {
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(Boolean)

  console.log(`開始執行 ${statements.length} 個 SQL 語句...`)
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    process.stdout.write(`(${i+1}/${statements.length}) 執行中... `)
    await execSQL(stmt)
    console.log('OK')
  }
  console.log('全部完成 ✅')
} catch (err) {
  console.error('\n執行失敗:', err.message)
  process.exit(1)
}
