#!/usr/bin/env node
import { createServiceClient } from './util/createSupabaseClient.cjs'
const supabase = createServiceClient()
console.log('🛠️ 執行預約系統擴展 (成人/兒童)')

async function run() {
  const cmds = [
    ["adult_count", "ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS adult_count INTEGER DEFAULT 0"],
    ["child_count", "ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS child_count INTEGER DEFAULT 0"],
    ["child_chair_needed", "ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS child_chair_needed BOOLEAN DEFAULT false"],
    ["reservation_notes", "ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS reservation_notes TEXT"],
    ["constraint_party_size", "ALTER TABLE table_reservations ADD CONSTRAINT IF NOT EXISTS check_party_size_consistency CHECK (party_size = adult_count + child_count)"]
  ]
  for (const [label, sql] of cmds) {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
    if (error) {
      console.log(`⚠️ ${label}: ${error.message}`)
    } else {
      console.log(`✅ ${label}`)
    }
  }
  const { data } = await supabase.from('table_reservations').select('party_size, adult_count, child_count').limit(3)
  data?.forEach(r => console.log(`  - ${r.party_size}人 (大${r.adult_count} 小${r.child_count})`))
  console.log('🎉 完成')
}
run().catch(e => { console.error(e); process.exit(1) })
