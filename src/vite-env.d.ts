/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_DEV_MODE: string
  readonly VITE_DEBUG_LOGS: string
  readonly VITE_DEFAULT_TAX_RATE: string
  readonly VITE_CURRENCY_SYMBOL: string
  readonly VITE_CURRENCY_CODE: string
  readonly VITE_ENABLE_OFFLINE_MODE: string
  readonly VITE_ENABLE_SOUND_NOTIFICATIONS: string
  readonly VITE_ENABLE_VIBRATION: string
  readonly VITE_KDS_AUTO_REFRESH_INTERVAL: string
  readonly VITE_KDS_COMPLETED_ORDER_TIMEOUT: string
  readonly VITE_RESTAURANT_NAME: string
  readonly VITE_RESTAURANT_ADDRESS: string
  readonly VITE_RESTAURANT_PHONE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
