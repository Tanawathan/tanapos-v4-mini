// 簡易列印客戶端：將結帳資訊組成 payload 傳給本機列印服務
import { Order, OrderItem } from './types'

export interface PrintOrderItemCombo {
  rule: string
  product: string
  addPrice?: number
}
export interface PrintOrderItemPayload {
  name: string
  quantity: number
  unitPrice: number
  combos?: PrintOrderItemCombo[]
}
export interface PrintPayload {
  restaurantName?: string
  tableLabel: string
  orderNumbers: string[]
  items: PrintOrderItemPayload[]
  subtotal: number
  tax: number
  service: number
  total: number
  paymentMethod: string
  received?: number
  change?: number
  charset?: string
  openCashDrawer?: boolean
  cutPaper?: boolean
  vendorId?: number
  productId?: number
}

export async function sendPrint(payload: PrintPayload, endpoint = 'http://127.0.0.1:3333/print') {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('Print service error')
  return res.json()
}

// 將 Order / OrderItem 轉為列印 payload
export function buildPrintPayload(params: {
  tableLabel: string
  orders: Order[]
  items: OrderItem[]
  subtotal: number
  tax: number
  service: number
  total: number
  paymentMethod: string
  received?: number
  change?: number
  charset?: string
  openCashDrawer?: boolean
  cutPaper?: boolean
  vendorId?: number
  productId?: number
}): PrintPayload {
  const { tableLabel, orders, items, subtotal, tax, service, total, paymentMethod, received, change, charset, openCashDrawer, cutPaper, vendorId, productId } = params
  const orderNumbers = orders.map(o => o.order_number)
  const mappedItems: PrintOrderItemPayload[] = items.map(it => ({
    name: it.product_name || '品項',
    quantity: it.quantity || 1,
    unitPrice: it.unit_price || 0,
    combos: (it.combo_selections || []).map(sel => ({
      rule: sel.combo_selection_rules?.selection_name || '選項',
      product: sel.products?.name || '',
      addPrice: sel.additional_price || undefined
    }))
  }))
  return {
    restaurantName: 'TanaPOS Demo',
    tableLabel,
    orderNumbers,
    items: mappedItems,
    subtotal: Math.round(subtotal),
    tax: Math.round(tax),
    service: Math.round(service),
    total: Math.round(total),
    paymentMethod,
  received, change,
  charset,
  openCashDrawer,
  cutPaper,
  vendorId,
  productId
  }
}
