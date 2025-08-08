// 更新的預約系統類型定義
export interface ReservationCustomerData {
  adults: number
  children: number
  childChairNeeded: boolean
  reservationType: 'dining' | 'business' | 'family' | 'celebration' | 'romantic' | 'family_reunion'
  occasion?: string
}

export interface EnhancedReservation {
  id: string
  restaurant_id: string
  table_id?: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  customer_notes: string // JSON 格式的 ReservationCustomerData
  party_size: number
  reservation_time: string
  duration_minutes?: number
  estimated_end_time?: string
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled'
  special_requests?: string
  occasion?: string
  deposit_amount?: number
  deposit_paid?: boolean
  deposit_payment_method?: string
  notes?: string
  created_by?: string
  confirmed_at?: string
  seated_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

// 工具函數來處理客戶資料
export function parseCustomerData(customerNotes: string): ReservationCustomerData | null {
  try {
    return JSON.parse(customerNotes)
  } catch {
    return null
  }
}

export function stringifyCustomerData(data: ReservationCustomerData): string {
  return JSON.stringify(data)
}