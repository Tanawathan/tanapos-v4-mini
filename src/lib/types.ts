// 基於 Supabase SQL 架構的類型定義

export interface Restaurant {
  id: string
  name: string
  address?: string
  phone?: string
  email?: string
  tax_rate?: number
  currency?: string
  timezone?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface Category {
  id: string
  restaurant_id?: string
  name: string
  description?: string
  sort_order?: number
  color?: string
  icon?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface Product {
  id: string
  restaurant_id?: string
  category_id?: string
  name: string
  description?: string
  sku?: string
  price: number
  cost?: number
  image_url?: string
  sort_order?: number
  is_available?: boolean
  is_active?: boolean
  actual_stock?: number
  virtual_stock?: number
  total_available?: number
  min_stock?: number
  preparation_time?: number
  created_at?: string
  updated_at?: string
  ai_popularity_score?: number
  ai_recommended?: boolean
  prep_time_minutes?: number
}

export interface ComboProduct {
  id: string
  name: string
  description?: string
  price: number
  combo_type: 'fixed' | 'selectable'
  is_available?: boolean
  preparation_time?: number
  created_at?: string
  updated_at?: string
  category_id?: string
}

export interface ComboChoice {
  id: string
  combo_id: string
  category_id: string
  min_selections?: number
  max_selections?: number
  sort_order?: number
  created_at?: string
}

export interface ComboSelectionRule {
  id: string
  combo_id: string
  category_id: string
  selection_name: string
  min_selections?: number
  max_selections?: number
  is_required?: boolean
  display_order?: number
  created_at?: string
  updated_at?: string
}

export interface ComboSelectionOption {
  id: string
  rule_id: string
  product_id: string
  additional_price?: number
  is_default?: boolean
  created_at?: string
}

export interface Table {
  id: string
  restaurant_id?: string
  table_number: number
  name?: string
  capacity?: number
  status?: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance'
  qr_code?: string
  position_x?: number
  position_y?: number
  table_type?: string
  floor_plan?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
  ai_assigned?: boolean
  ai_assignment_reason?: string
  customer_count?: number
  seated_at?: string
  estimated_duration?: number
  // 動態屬性用於桌台管理
  orderId?: string
  order_number?: string
  cleaning_started?: string
  maintenance_started?: string
  reserved_at?: string
  [key: string]: any // 允許額外的動態屬性
}

export interface Order {
  id: string
  restaurant_id?: string
  table_id?: string
  order_number: string
  table_number?: number
  customer_name?: string
  customer_phone?: string
  subtotal?: number
  tax_amount?: number
  total_amount?: number
  status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'
  payment_status?: 'unpaid' | 'partial' | 'paid' | 'refunded'
  payment_method?: string
  notes?: string
  created_by?: string
  served_at?: string
  completed_at?: string
  created_at?: string
  updated_at?: string
  ai_optimized?: boolean
  ai_estimated_prep_time?: number
  ai_recommendations?: any
  customer_count?: number
}

export interface OrderItem {
  id: string
  order_id?: string
  product_id?: string
  product_name: string
  product_sku?: string
  quantity: number
  unit_price: number
  total_price: number
  special_instructions?: string
  status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled'
  created_at?: string
  updated_at?: string
}

export interface OrderComboSelection {
  id: string
  order_item_id: string
  rule_id: string
  selected_product_id: string
  quantity?: number
  additional_price?: number
  created_at?: string
}

export interface Payment {
  id: string
  order_id?: string
  method: 'cash' | 'card' | 'mobile' | 'voucher' | 'points'
  amount: number
  received_amount?: number
  change_amount?: number
  transaction_id?: string
  card_last_four?: string
  mobile_provider?: string
  status?: 'pending' | 'completed' | 'failed' | 'refunded'
  processed_at?: string
  created_at?: string
  updated_at?: string
}

export interface Receipt {
  id: string
  order_id?: string
  receipt_number: string
  items: any
  subtotal: number
  tax_amount: number
  total_amount: number
  payment_method: string
  received_amount?: number
  change_amount?: number
  issued_at?: string
  printed_at?: string
  created_at?: string
}

export interface Invoice {
  id: string
  order_id?: string
  type: 'receipt' | 'personal' | 'company'
  invoice_number?: string
  tax_id?: string
  company_name?: string
  buyer_email?: string
  buyer_phone?: string
  subtotal: number
  tax_amount: number
  total_amount: number
  issued_at?: string
  void_at?: string
  created_at?: string
}

export interface TableReservation {
  id: string
  restaurant_id?: string
  table_id?: string
  customer_name: string
  customer_phone?: string
  customer_email?: string
  party_size: number
  reservation_time: string
  duration_minutes?: number
  status?: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show'
  special_requests?: string
  deposit_amount?: number
  deposit_paid?: boolean
  notes?: string
  created_by?: string
  confirmed_at?: string
  seated_at?: string
  completed_at?: string
  created_at?: string
  updated_at?: string
}

export interface TableSession {
  id: string
  restaurant_id?: string
  table_id?: string
  reservation_id?: string
  customer_name?: string
  party_size: number
  seated_at: string
  estimated_duration?: number
  actual_duration?: number
  status?: 'occupied' | 'ordering' | 'dining' | 'paying' | 'completed'
  total_amount?: number
  service_rating?: number
  notes?: string
  completed_at?: string
  created_at?: string
  updated_at?: string
}

// 購物車項目類型（前端使用）
export interface CartItem {
  id: string
  instanceId: string
  name: string
  price: number
  quantity: number
  type: 'product' | 'combo'
  combo_selections?: any
  special_instructions?: string
}
