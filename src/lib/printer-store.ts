import { create } from 'zustand'

export interface PrinterConfig {
  enabled: boolean
  endpoint: string // 本機列印服務 URL
  vendorId?: number
  productId?: number
  autoPrintOnCheckout: boolean
  openCashDrawer: boolean
  cutPaper: boolean
  charset: string
  testResult?: string
  lastError?: string
}

interface PrinterState extends PrinterConfig {
  setConfig: (patch: Partial<PrinterConfig>) => void
  loadFromStorage: () => void
  saveToStorage: () => void
  runTestPrint: () => Promise<void>
}

const STORAGE_KEY = 'printer-config'

export const usePrinterStore = create<PrinterState>((set, get) => ({
  enabled: true,
  endpoint: 'http://127.0.0.1:3333/print',
  vendorId: undefined,
  productId: undefined,
  autoPrintOnCheckout: true,
  openCashDrawer: true,
  cutPaper: true,
  charset: 'GB18030',
  testResult: undefined,
  lastError: undefined,
  setConfig: (patch) => set(patch),
  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) set(JSON.parse(raw))
    } catch (e) {
      console.warn('載入 printer 設定失敗', e)
    }
  },
  saveToStorage: () => {
    try {
      const { setConfig, loadFromStorage, saveToStorage, runTestPrint, ...rest } = get() as any
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
    } catch (e) {
      console.warn('儲存 printer 設定失敗', e)
    }
  },
  runTestPrint: async () => {
    const { endpoint } = get()
    try {
      const payload = { restaurantName: 'Test', tableLabel: '測試列印', orderNumbers: ['TEST'], items: [], subtotal:0, tax:0, service:0, total:0, paymentMethod:'test' }
      const res = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('服務未回應')
      set({ testResult: '✅ 測試列印已送出', lastError: undefined })
    } catch (e:any) {
      set({ testResult: undefined, lastError: e.message || '測試失敗' })
    }
  }
}))

// 初始化一次
if (typeof window !== 'undefined') {
  usePrinterStore.getState().loadFromStorage()
}
