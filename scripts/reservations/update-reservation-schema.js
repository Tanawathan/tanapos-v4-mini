#!/usr/bin/env node
import { createServiceClient } from './util/createSupabaseClient.cjs'
const supabase = createServiceClient()
console.log('🔧 更新預約結構 (migrated)')

async function main() {
  const sqls = [
    'ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS adult_count INTEGER DEFAULT 0',
    'ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS child_count INTEGER DEFAULT 0',
    'ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS child_chair_needed BOOLEAN DEFAULT FALSE',
    "ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS reservation_type VARCHAR(20) DEFAULT 'dining'",
    'ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS special_requests TEXT'
  ]
  for (const sql of sqls) {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
    if (error) {
      console.log('⚠️', error.message)
    } else {
      console.log('✅', sql.split('ADD COLUMN')[1].trim().split(' ')[0])
    }
  }
  console.log('🎉 完成')
}
main().catch(e => { console.error(e); process.exit(1) })
