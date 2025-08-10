#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY
const SERVICE_ROLE_KEY = process.env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY

export function getEnvReport() {
  return {
    VITE_SUPABASE_URL: !!SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: !!ANON_KEY,
    PRIVATE_SUPABASE_SERVICE_ROLE_KEY: !!SERVICE_ROLE_KEY
  }
}

function assertEnv(requiredService = false) {
  if (!SUPABASE_URL || !ANON_KEY || (requiredService && !SERVICE_ROLE_KEY)) {
    console.error('❌ 環境變數缺失，請確認 .env 設定:')
    const report = getEnvReport()
    Object.entries(report).forEach(([k, v]) => console.error(`  ${k}: ${v ? '✅' : '❌'}`))
    process.exit(1)
  }
}

export function createAnonClient() {
  assertEnv(false)
  return createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
}

export function createServiceClient() {
  assertEnv(true)
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
}

export function info(requiredService = false) {
  console.log('🔐 Supabase 連線模式:', requiredService ? 'Service Role (管理)' : 'Anon / 低權限')
}
