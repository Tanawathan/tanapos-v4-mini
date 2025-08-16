#!/usr/bin/env node
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const url = process.env.VITE_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL
const service = process.env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY
const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY

if (!url || !(service || anon)) {
  console.error('Missing Supabase env. Need VITE_SUPABASE_URL and either PRIVATE_SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(url, service || anon)

;(async ()=>{
  try {
    console.log('🔎 Inspecting public.marquees schema')

    // 1) columns via information_schema (may require service key)
    const { data: cols, error: colErr } = await supabase
      .from('information_schema.columns')
      .select('column_name,data_type,is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'marquees')
      .order('ordinal_position', { ascending: true })

    if (colErr) {
      console.log('⚠️ information_schema not accessible with current key:', colErr.message)
    } else {
      console.log('\n📑 Columns (information_schema):')
      cols.forEach(c=>console.log(`- ${c.column_name} :: ${c.data_type} ${c.is_nullable==='YES'?'NULL':''}`))
    }

    // 2) sample row to infer keys
    const { data: sample, error: sErr } = await supabase
      .from('marquees')
      .select('*')
      .limit(1)

    if (sErr) {
      console.log('\n❌ Sample select failed:', sErr.message)
    } else if (sample && sample[0]) {
      console.log('\n🧪 Sample row keys:')
      Object.keys(sample[0]).forEach(k=>console.log(`- ${k} = ${JSON.stringify(sample[0][k])}`))
    } else {
      console.log('\nℹ️ No rows in marquees yet.')
    }

    // 3) count rows
    const { count, error: cntErr } = await supabase
      .from('marquees')
      .select('*', { count: 'exact', head: true })

    if (cntErr) {
      console.log('\n❌ Count failed:', cntErr.message)
    } else {
      console.log(`\n📊 Total rows: ${count}`)
    }
  } catch (e) {
    console.error('Unexpected error:', e)
  }
})()
