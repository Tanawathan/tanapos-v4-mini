#!/usr/bin/env node
import { createServiceClient } from './util/createSupabaseClient.cjs'
const supabase = createServiceClient()
console.log('🔧 Walk-in / Same-day 擴展')

async function run() {
  const alters = [
    "ALTER TABLE public.table_reservations ADD COLUMN IF NOT EXISTS customer_gender VARCHAR(10) CHECK (customer_gender IN ('male','female','other'))",
    'ALTER TABLE public.table_reservations ADD COLUMN IF NOT EXISTS customer_last_name VARCHAR(50)',
    'ALTER TABLE public.table_reservations ADD COLUMN IF NOT EXISTS is_walk_in BOOLEAN DEFAULT FALSE',
    'ALTER TABLE public.table_reservations ADD COLUMN IF NOT EXISTS arrival_time TIMESTAMPTZ',
    "ALTER TABLE public.table_reservations ADD COLUMN IF NOT EXISTS reservation_type VARCHAR(20) DEFAULT 'advance' CHECK (reservation_type IN ('advance','same_day','walk_in'))"
  ]
  for (const sql of alters) {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
    if (error) {
      console.log('⚠️ 欄位失敗:', error.message)
    } else {
      console.log('✅ 欄位 OK')
    }
  }
  const { data: restaurants } = await supabase.from('restaurants').select('id, settings')
  for (const r of restaurants || []) {
    const settings = {
      ...r.settings,
      reservation_settings: { ...r.settings?.reservation_settings, allow_same_day_booking: true, walk_in_enabled: true, quick_registration: true, min_advance_hours: 0, same_day_slots_limit: 50 }
    }
    await supabase.from('restaurants').update({ settings }).eq('id', r.id)
  }
  const restaurantId = process.env.VITE_RESTAURANT_ID
  if (restaurantId) {
    await supabase.from('table_reservations').insert({ restaurant_id: restaurantId, customer_name: 'Walk-in 測試', party_size: 2, reservation_time: new Date().toISOString(), arrival_time: new Date().toISOString(), is_walk_in: true, reservation_type: 'walk_in', status: 'confirmed', duration_minutes: 120 })
  }
  console.log('🎉 Walk-in 擴展完成')
}
run().catch(e => { console.error(e); process.exit(1) })
