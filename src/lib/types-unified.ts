// ============================================================================
// TANAPOS v4 統一類型定義
// ============================================================================

// 基礎產品類型
export interface Product {
  id: string
  name: string
  description?: string
  price: number
  category_id: string
  image_url?: string
  is_available: boolean
  preparation_time?: number
  created_at: string
  updated_at: string
  // 套餐相關屬性（可選）
  combo_type?: 'fixed' | 'selectable'
  combo_choices?: Array<{
    id: string
    category_id: string
    min_selections: number
    max_selections: number
    sort_order: number
    categories: {
      id: string
      name: string
    }
  }>
}

// 分類類型
export interface Category {
  id: string
  name: string
  description?: string
  color?: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// 桌位類型
export interface Table {
  id: string
  table_number: number
  table_name?: string
  capacity: number
  status: 'available' | 'occupied' | 'cleaning' | 'reserved' | 'out_of_order'
  current_order_id?: string
  reserved_by?: string
  reserved_at?: string
  reserved_until?: string
  notes?: string
  last_cleaned?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// 訂單項目類型
export interface OrderItem {
  id?: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  special_instructions?: string
  status: 'pending' | 'preparing' | 'ready' | 'served'
}

// 訂單類型
export interface Order {
  id: string
  order_number: string
  table_id?: string
  table_number?: number
  customer_name?: string
  customer_phone?: string
  subtotal: number
  tax_amount: number
  total_amount: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
  served_at?: string
  order_items: OrderItem[]
}

// 付款方式
export type PaymentMethod = 'cash' | 'card' | 'mobile' | 'voucher' | 'points'

// 付款記錄
export interface Payment {
  id: string
  order_id: string
  method: PaymentMethod
  amount: number
  received_amount?: number
  change_amount?: number
  transaction_id?: string
  card_last_four?: string
  mobile_provider?: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  processed_at: string
}

// 發票類型
export type InvoiceType = 'receipt' | 'personal' | 'company'

// 發票資料
export interface Invoice {
  id: string
  order_id: string
  type: InvoiceType
  invoice_number?: string
  tax_id?: string
  company_name?: string
  buyer_email?: string
  buyer_phone?: string
  subtotal: number
  tax_amount: number
  total_amount: number
  issued_at: string
  void_at?: string
}

// 收據資料
export interface Receipt {
  id: string
  order_id: string
  receipt_number: string
  items: Array<{
    name: string
    quantity: number
    unit_price: number
    total_price: number
  }>
  subtotal: number
  tax_amount: number
  total_amount: number
  payment_method: PaymentMethod
  issued_at: string
}

// 預約類型
export interface Reservation {
  id: string
  table_id: string
  customer_name: string
  customer_phone: string
  party_size: number
  reservation_time: string
  duration_minutes: number
  status: 'pending' | 'confirmed' | 'seated' | 'cancelled' | 'no_show'
  notes?: string
  created_at: string
}

// 桌位使用記錄
export interface TableSession {
  id: string
  table_id: string
  started_at: string
  ended_at?: string
  duration_minutes?: number
  customer_count: number
  total_revenue: number
}

// 購物車項目類型
export interface CartItem {
  id: string          // 商品原始ID
  instanceId: string  // 購物車項目唯一實例ID
  name: string
  price: number
  quantity: number
  note?: string       // 每個實例的獨立備註
  type?: 'product' | 'combo'  // 項目類型
  combo_type?: 'fixed' | 'selectable'  // 套餐類型
  combo_selections?: any  // 套餐選擇內容
}

// UI 相關類型
export type ViewType = 'dashboard' | 'pos' | 'kds' | 'orders' | 'tables' | 'checkout' | 'reports'

// API 響應類型
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  loading: boolean
}

// 統計數據類型
export interface DashboardStats {
  todayRevenue: number
  todayOrders: number
  activeOrders: number
  availableTables: number
  totalTables: number
  averageOrderValue: number
  popularItems: Array<{
    name: string
    count: number
    revenue: number
  }>
}
