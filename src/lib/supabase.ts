import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Database Tables
export const TABLES = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  TABLES: 'tables',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  PAYMENTS: 'payments',
} as const

// Real-time Channels
export const CHANNELS = {
  ORDERS: 'orders-channel',
  KDS: 'kds-channel',
} as const
