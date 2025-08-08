// 預約系統服務層
import { supabase } from '../lib/supabase'
import type { 
  Reservation, 
  TimeSlot, 
  AvailableSlots, 
  CapacityInfo, 
  ReservationFormData 
} from '../lib/reservation-types'

// 客戶資料結構
interface ReservationCustomerData {
  adults: number
  children: number
  childChairNeeded: boolean
  reservationType: 'dining' | 'business' | 'family' | 'celebration' | 'romantic' | 'family_reunion'
  occasion?: string
}

// 工具函數來處理客戶資料
function parseCustomerData(customerNotes: string): ReservationCustomerData | null {
  try {
    return JSON.parse(customerNotes)
  } catch {
    return null
  }
}

function stringifyCustomerData(data: ReservationCustomerData): string {
  return JSON.stringify(data)
}

export class ReservationService {
  private static readonly MAX_CAPACITY_PER_30MIN = 8
  private static readonly BUFFER_MINUTES = 15
  private static readonly ADVANCE_BOOKING_DAYS = 7

  /**
   * 檢查指定時段的可用性
   */
  static async checkAvailability(
    restaurantId: string, 
    datetime: Date, 
    partySize: number
  ): Promise<{ available: boolean; capacity: CapacityInfo }> {
    try {
      const timeSlotStart = this.getTimeSlotStart(datetime)
      const timeSlotEnd = new Date(timeSlotStart.getTime() + 30 * 60 * 1000)
      
      // 查詢該時段的現有預約
      const { data: existingReservations, error } = await supabase
        .from('table_reservations')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .not('status', 'in', '(cancelled,no_show,completed)')
        .gte('reservation_time', timeSlotStart.toISOString())
        .lt('reservation_time', timeSlotEnd.toISOString())
      
      if (error) throw error
      
      const existingCapacity = existingReservations?.reduce((sum: number, res: any) => sum + res.party_size, 0) || 0
      const availableCapacity = this.MAX_CAPACITY_PER_30MIN - existingCapacity
      
      return {
        available: availableCapacity >= partySize,
        capacity: {
          total_capacity: this.MAX_CAPACITY_PER_30MIN,
          available_capacity: availableCapacity,
          existing_reservations: existingReservations || []
        }
      }
    } catch (error) {
      console.error('檢查可用性失敗:', error)
      throw error
    }
  }

  /**
   * 取得指定日期的所有可用時段
   */
  static async getAvailableTimeSlots(
    restaurantId: string, 
    date: Date, 
    partySize: number
  ): Promise<AvailableSlots> {
    try {
      // 先取得餐廳營業時間
      const { data: restaurant, error: restError } = await supabase
        .from('restaurants')
        .select('business_hours')
        .eq('id', restaurantId)
        .single()
      
      if (restError) throw restError
      
      const businessHours = restaurant.business_hours
      if (!businessHours) {
        throw new Error('餐廳營業時間未設定')
      }
      
      // 取得當天是星期幾
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const dayName = dayNames[date.getDay()]
      const todayHours = businessHours[dayName]
      
      if (!todayHours || !todayHours.open || !todayHours.close) {
        return { date: date.toDateString(), slots: [] }
      }
      
      // 生成時段
      const slots: TimeSlot[] = []
      const openTime = this.parseTime(todayHours.open)
      const closeTime = this.parseTime(todayHours.close)
      
      let currentTime = new Date(date)
      currentTime.setHours(openTime.hours, openTime.minutes, 0, 0)
      
      const endTime = new Date(date)
      endTime.setHours(closeTime.hours, closeTime.minutes - 120, 0, 0) // 預留2小時用餐時間
      
      while (currentTime <= endTime) {
        // 檢查該時段可用性
        const { available, capacity } = await this.checkAvailability(restaurantId, currentTime, partySize)
        
        slots.push({
          datetime: currentTime.toISOString(),
          available_capacity: capacity.available_capacity,
          is_available: available,
          existing_reservations: capacity.existing_reservations.length
        })
        
        // 下一個30分鐘時段
        currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000)
      }
      
      return {
        date: date.toDateString(),
        slots
      }
    } catch (error) {
      console.error('取得可用時段失敗:', error)
      throw error
    }
  }

  /**
   * 創建新預約
   */
  static async createReservation(formData: ReservationFormData, restaurantId: string): Promise<Reservation> {
    try {
      // 組合日期和時間
      const reservationDateTime = new Date(`${formData.reservation_date}T${formData.reservation_time}`)
      
      // 檢查可用性
      const { available } = await this.checkAvailability(restaurantId, reservationDateTime, formData.party_size)
      if (!available) {
        throw new Error('該時段已滿，請選擇其他時間')
      }
      
      // 計算預估結束時間
      const estimatedEndTime = new Date(reservationDateTime.getTime() + 120 * 60 * 1000) // 預設2小時
      
      // 創建結構化的客戶資料
      const customerData: ReservationCustomerData = {
        adults: formData.adult_count,
        children: formData.child_count,
        childChairNeeded: formData.child_chair_needed,
        reservationType: this.determineReservationType(formData.adult_count, formData.child_count),
        occasion: formData.special_requests?.includes('生日') ? 'birthday' : 
                  formData.special_requests?.includes('商務') ? 'business_meeting' :
                  formData.special_requests?.includes('浪漫') || formData.special_requests?.includes('情侶') ? 'date_night' :
                  'dining'
      }
      
      const reservation: Omit<Reservation, 'id'> = {
        restaurant_id: restaurantId,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email,
        party_size: formData.party_size,
        reservation_time: reservationDateTime.toISOString(),
        duration_minutes: 120,
        estimated_end_time: estimatedEndTime.toISOString(),
        status: 'confirmed', // 自動確認
        special_requests: formData.special_requests,
        occasion: customerData.occasion,
        // 使用結構化的 JSON 格式存儲客戶資訊
        customer_notes: stringifyCustomerData(customerData)
      }
      
      const { data, error } = await supabase
        .from('table_reservations')
        .insert(reservation)
        .select()
        .single()
      
      if (error) throw error
      
      return data
    } catch (error) {
      console.error('創建預約失敗:', error)
      throw error
    }
  }

  /**
   * 取得餐廳的預約列表
   */
  static async getReservations(restaurantId: string, filters?: {
    status?: string[]
    dateRange?: { start: string; end: string }
  }): Promise<Reservation[]> {
    try {
      let query = supabase
        .from('table_reservations')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('reservation_time', { ascending: true })
      
      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }
      
      if (filters?.dateRange) {
        query = query
          .gte('reservation_time', filters.dateRange.start)
          .lte('reservation_time', filters.dateRange.end)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      return data || []
    } catch (error) {
      console.error('取得預約列表失敗:', error)
      throw error
    }
  }

  /**
   * 更新預約狀態
   */
  static async updateReservationStatus(reservationId: string, status: Reservation['status']): Promise<void> {
    try {
      const updates: any = { status, updated_at: new Date().toISOString() }
      
      // 根據狀態添加時間戳
      switch (status) {
        case 'confirmed':
          updates.confirmed_at = new Date().toISOString()
          break
        case 'seated':
          updates.seated_at = new Date().toISOString()
          break
        case 'completed':
          updates.completed_at = new Date().toISOString()
          break
      }
      
      const { error } = await supabase
        .from('table_reservations')
        .update(updates)
        .eq('id', reservationId)
      
      if (error) throw error
    } catch (error) {
      console.error('更新預約狀態失敗:', error)
      throw error
    }
  }

  /**
   * 分配桌台給預約
   */
  static async assignTableToReservation(reservationId: string, tableId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('table_reservations')
        .update({ 
          table_id: tableId,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)
      
      if (error) throw error
    } catch (error) {
      console.error('分配桌台失敗:', error)
      throw error
    }
  }

  // 工具方法

  /**
   * 取得30分鐘時段的開始時間
   */
  private static getTimeSlotStart(datetime: Date): Date {
    const slotStart = new Date(datetime)
    const minutes = slotStart.getMinutes()
    const roundedMinutes = Math.floor(minutes / 30) * 30
    slotStart.setMinutes(roundedMinutes, 0, 0)
    return slotStart
  }

  /**
   * 解析時間字串 (HH:mm)
   */
  private static parseTime(timeString: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeString.split(':').map(Number)
    return { hours, minutes }
  }

  /**
   * 根據成人/兒童人數判斷預約類型
   */
  private static determineReservationType(adultCount: number, childCount: number): ReservationCustomerData['reservationType'] {
    if (childCount > 0) {
      return adultCount + childCount > 6 ? 'family_reunion' : 'family'
    }
    if (adultCount >= 4) {
      return 'business'
    }
    if (adultCount === 2) {
      return 'romantic'
    }
    return 'dining'
  }

  /**
   * 解析客戶備註中的結構化資料
   */
  static parseReservationCustomerData(customerNotes?: string): ReservationCustomerData | null {
    return customerNotes ? parseCustomerData(customerNotes) : null
  }

  /**
   * 格式化兒童資訊為字串（暫存在 customer_notes）
   */
  private static formatChildInfo(adultCount: number, childCount: number, childChairNeeded: boolean): string {
    return JSON.stringify({
      adult_count: adultCount,
      child_count: childCount,
      child_chair_needed: childChairNeeded
    })
  }

  /**
   * 解析兒童資訊字串
   */
  static parseChildInfo(customerNotes?: string): { adult_count: number; child_count: number; child_chair_needed: boolean } {
    try {
      if (!customerNotes) return { adult_count: 0, child_count: 0, child_chair_needed: false }
      const info = JSON.parse(customerNotes)
      return {
        adult_count: info.adult_count || 0,
        child_count: info.child_count || 0,
        child_chair_needed: info.child_chair_needed || false
      }
    } catch {
      return { adult_count: 0, child_count: 0, child_chair_needed: false }
    }
  }

  /**
   * 檢查預約日期是否在允許範圍內
   */
  static isValidReservationDate(date: Date): boolean {
    const today = new Date()
    const maxDate = new Date(today.getTime() + this.ADVANCE_BOOKING_DAYS * 24 * 60 * 60 * 1000)
    
    return date >= today && date <= maxDate
  }
}
