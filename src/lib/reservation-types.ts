// 預約系統相關的 TypeScript 類型定義
export interface ReservationSettings {
  max_guests_per_30min: number
  default_duration_minutes: number
  buffer_minutes: number
  advance_booking_days: number
  deposit_required: boolean
  child_chair_available: boolean
  reminder_hours: number[]
  auto_confirm: boolean
}

export interface Reservation {
  id?: string
  restaurant_id: string
  table_id?: string
  
  // 客戶資訊
  customer_name: string
  customer_phone: string
  customer_email?: string
  customer_notes?: string
  
  // 預約詳情
  party_size: number
  adult_count?: number    // 成人數量
  child_count?: number    // 兒童數量
  child_chair_needed?: boolean  // 是否需要兒童椅
  
  reservation_time: string  // ISO datetime
  duration_minutes: number
  estimated_end_time?: string
  
  // 狀態管理
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show'
  
  // 特殊需求
  special_requests?: string
  reservation_notes?: string
  occasion?: string
  
  // 時間戳
  created_at?: string
  updated_at?: string
  confirmed_at?: string
  seated_at?: string
  completed_at?: string
}

export interface TimeSlot {
  datetime: string
  available_capacity: number
  is_available: boolean
  existing_reservations: number
}

export interface AvailableSlots {
  date: string
  slots: TimeSlot[]
}

export interface ReservationFormData {
  customer_name: string
  customer_phone: string
  customer_email?: string
  party_size: number
  adult_count: number
  child_count: number
  child_chair_needed: boolean
  reservation_date: string
  reservation_time: string
  special_requests?: string
}

export interface CapacityInfo {
  total_capacity: number
  available_capacity: number
  existing_reservations: Reservation[]
}

export interface ReservationFilters {
  status?: string[]
  date_range?: {
    start: string
    end: string
  }
  customer_name?: string
  phone?: string
}

// 預約管理相關的事件類型
export type ReservationEvent = 
  | { type: 'CREATE'; reservation: Reservation }
  | { type: 'UPDATE'; reservation: Reservation }
  | { type: 'CANCEL'; reservationId: string }
  | { type: 'CONFIRM'; reservationId: string }
  | { type: 'SEAT'; reservationId: string; tableId: string }
  | { type: 'COMPLETE'; reservationId: string }
