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
   * 檢查指定日期是否為休假日
   */
  static async isHoliday(restaurantId: string, date: Date): Promise<boolean> {
    try {
      const dateString = date.toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('restaurant_holidays')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('holiday_date', dateString)
        .limit(1)
      
      if (error) {
        console.error('檢查休假日失敗:', error)
        return false // 如果查詢失敗，預設為非休假日
      }
      
      return (data && data.length > 0)
    } catch (error) {
      console.error('檢查休假日異常:', error)
      return false
    }
  }

  /**
   * 釋放與預約關聯的桌台：
   * - 若預約存在 table_id，將對應桌台設為 available
   * - 清空該預約的 table_id 關聯
   * 不改變預約的狀態，狀態請由呼叫端先行更新。
   */
  static async releaseTableForReservation(reservationId: string): Promise<void> {
    try {
      const { data: reservation, error: fetchError } = await supabase
        .from('table_reservations')
        .select('id, table_id')
        .eq('id', reservationId)
        .single()

      if (fetchError) throw fetchError
      if (!reservation?.table_id) return

      const tableId = reservation.table_id

      // 1) 將桌台設為可用
      const { error: tableError } = await supabase
        .from('tables')
        .update({ status: 'available', updated_at: new Date().toISOString() })
        .eq('id', tableId)

      if (tableError) throw tableError

      // 2) 清空預約的桌台關聯
      const { error: resError } = await supabase
        .from('table_reservations')
        .update({ table_id: null, updated_at: new Date().toISOString() })
        .eq('id', reservationId)

      if (resError) throw resError
    } catch (error) {
      console.error('釋放桌台失敗:', error)
      throw error
    }
  }

  /**
   * 檢查指定時段的可用性（包含休假日檢查）
   */
  /**
   * 檢查指定時段的可用性（包含休假日檢查）
   */
  static async checkAvailability(
    restaurantId: string, 
    datetime: Date, 
    partySize: number
  ): Promise<{ available: boolean; capacity: CapacityInfo; isHoliday?: boolean }> {
    try {
      // 1. 先檢查是否為休假日
      const isHolidayDate = await this.isHoliday(restaurantId, datetime)
      if (isHolidayDate) {
        return {
          available: false,
          isHoliday: true,
          capacity: {
            total_capacity: 0,
            available_capacity: 0,
            existing_reservations: []
          }
        }
      }

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
        isHoliday: false,
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
   * 取得指定日期的所有可用時段（包含休假日檢查）
   */
  static async getAvailableTimeSlots(
    restaurantId: string, 
    date: Date, 
    partySize: number
  ): Promise<AvailableSlots> {
    try {
      // 1. 先檢查是否為休假日
      const isHolidayDate = await this.isHoliday(restaurantId, date)
      if (isHolidayDate) {
        return { 
          date: date.toDateString(), 
          slots: [],
          isHoliday: true,
          holidayMessage: '此日期為休假日，不開放預約'
        }
      }

      // 2. 取得餐廳預約設定
      const { data: restaurant, error: restError } = await supabase
        .from('restaurants')
        .select('reservation_settings')
        .eq('id', restaurantId)
        .single()
      
      if (restError) throw restError
      
      const reservationSettings = restaurant.reservation_settings
      if (!reservationSettings || !reservationSettings.businessHours) {
        throw new Error('餐廳預約設定未設置')
      }
      
      // 3. 取得當天是星期幾
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const dayName = dayNames[date.getDay()]
      const todayHours = reservationSettings.businessHours[dayName]
      
      if (!todayHours || !todayHours.isOpen) {
        return { 
          date: date.toDateString(), 
          slots: [],
          isHoliday: false,
          holidayMessage: '今日不營業'
        }
      }
      
      // 4. 生成時段 (30分鐘間隔)
      const slots: TimeSlot[] = []
      const openTime = this.parseTime(todayHours.openTime)
      const closeTime = this.parseTime(todayHours.closeTime)
      
      // 計算最晚預約時間 (考慮90分鐘用餐時長)
      const mealDurationMinutes = reservationSettings.reservationSettings?.mealDurationMinutes || 90
      const lastReservationTime = reservationSettings.reservationSettings?.lastReservationTime || '19:30'
      const maxReservationTime = this.parseTime(lastReservationTime)
      
      let currentTime = new Date(date)
      currentTime.setHours(openTime.hours, openTime.minutes, 0, 0)
      
      // 最晚預約時間不能超過設定的時間
      const endTime = new Date(date)
      endTime.setHours(maxReservationTime.hours, maxReservationTime.minutes, 0, 0)
      
      while (currentTime <= endTime) {
        // 對於當天的時段，不過濾已過時間，允許立即預訂
        // 對於未來日期，顯示所有時段
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
   * 創建新預約（包含休假日檢查）
   */
  static async createReservation(formData: ReservationFormData, restaurantId: string): Promise<Reservation> {
    try {
      // 組合日期和時間
      const reservationDateTime = new Date(`${formData.reservation_date}T${formData.reservation_time}`)
      
      // 檢查可用性（包含休假日檢查）
      const { available, isHoliday } = await this.checkAvailability(restaurantId, reservationDateTime, formData.party_size)
      
      if (isHoliday) {
        throw new Error('該日期為休假日，無法預約')
      }
      
      if (!available) {
        throw new Error('該時段已滿，請選擇其他時間')
      }
      
      // 取得餐廳預約設定
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('reservation_settings')
        .eq('id', restaurantId)
        .single()
      
      const mealDurationMinutes = restaurant?.reservation_settings?.reservationSettings?.mealDurationMinutes || 90
      
      // 計算預估結束時間（使用設定的用餐時長）
      const estimatedEndTime = new Date(reservationDateTime.getTime() + mealDurationMinutes * 60 * 1000)
      
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
        adult_count: formData.adult_count,
        child_count: formData.child_count,
        child_chair_needed: formData.child_chair_needed,
        reservation_time: reservationDateTime.toISOString(),
        duration_minutes: mealDurationMinutes,
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
      
      // 🆕 自動分配最佳桌台
      try {
        console.log(`為新預約 ${data.id} 自動分配桌台...`)
        const assignmentResult = await this.autoAssignBestTable(
          data.id,
          restaurantId,
          formData.party_size,
          {
            childFriendly: formData.child_chair_needed || formData.child_count > 0,
            // 根據特殊需求設定偏好
            features: formData.special_requests?.includes('窗邊') ? ['窗邊'] :
                     formData.special_requests?.includes('安靜') ? ['安靜'] : undefined
          }
        )
        
        if (assignmentResult.success) {
          console.log(`✅ 成功分配桌台: ${assignmentResult.message}`)
        } else {
          console.log(`⚠️  桌台分配失敗: ${assignmentResult.message}`)
        }
      } catch (assignError) {
        console.error('自動分配桌台過程出錯:', assignError)
        // 不影響預約創建，只是記錄錯誤
      }
      
      return data
    } catch (error) {
      console.error('創建預約失敗:', error)
      throw error
    }
  }

  /**
   * 更新預約資料（若更動時間或人數，會重新檢查可用性與休假日）
   */
  static async updateReservation(
    reservationId: string,
    updates: Partial<Reservation>
  ): Promise<Reservation> {
    try {
      // 讀取原始預約資料
      const { data: existing, error: fetchError } = await supabase
        .from('table_reservations')
        .select('*')
        .eq('id', reservationId)
        .single()

      if (fetchError || !existing) {
        throw new Error('找不到要更新的預約')
      }

      const restaurantId = existing.restaurant_id

      // 準備檢查可用性的目標值
      const nextPartySize = updates.party_size ?? existing.party_size
      const nextReservationTimeISO = updates.reservation_time ?? existing.reservation_time

      // 若調整了人數或時間，需要檢查可用性與休假日
      if (
        updates.party_size !== undefined ||
        updates.reservation_time !== undefined
      ) {
        const targetDate = new Date(nextReservationTimeISO)
        const { available, isHoliday } = await this.checkAvailability(
          restaurantId,
          targetDate,
          nextPartySize
        )

        if (isHoliday) {
          throw new Error('選擇的日期為休假日，無法更新為該時段')
        }
        if (!available) {
          throw new Error('該時段容量不足，請選擇其他時間')
        }
      }

      // 取得餐廳預約設定以計算 estimated_end_time
      let durationMinutes = updates.duration_minutes ?? existing.duration_minutes
      if (updates.reservation_time !== undefined || updates.duration_minutes !== undefined) {
        if (!durationMinutes || durationMinutes <= 0) {
          const { data: restaurant } = await supabase
            .from('restaurants')
            .select('reservation_settings')
            .eq('id', restaurantId)
            .single()
          durationMinutes = restaurant?.reservation_settings?.reservationSettings?.mealDurationMinutes || 90
        }
      }

      const finalReservationTimeISO = updates.reservation_time ?? existing.reservation_time
      const estimatedEndTime = (updates.reservation_time !== undefined || updates.duration_minutes !== undefined)
        ? new Date(new Date(finalReservationTimeISO).getTime() + (durationMinutes || 90) * 60 * 1000).toISOString()
        : existing.estimated_end_time

      // 狀態時間戳
      const statusUpdates: any = {}
      if (updates.status && updates.status !== existing.status) {
        statusUpdates.updated_at = new Date().toISOString()
        switch (updates.status) {
          case 'confirmed':
            statusUpdates.confirmed_at = new Date().toISOString()
            break
          case 'seated':
            statusUpdates.seated_at = new Date().toISOString()
            break
          case 'completed':
            statusUpdates.completed_at = new Date().toISOString()
            break
          case 'cancelled':
          case 'no_show':
            // 僅更新 updated_at 即可
            break
        }
      }

      const payload: Partial<Reservation> & { updated_at: string } = {
        ...updates,
        duration_minutes: durationMinutes,
        estimated_end_time: estimatedEndTime,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('table_reservations')
        .update({ ...payload, ...statusUpdates })
        .eq('id', reservationId)
        .select()
        .single()

      if (error) throw error

      return data as Reservation
    } catch (error) {
      console.error('更新預約失敗:', error)
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
   * 分配桌台給預約（手動指定桌台）
   */
  static async assignTableToReservation(reservationId: string, tableId: string): Promise<void> {
    try {
      // 1. 更新預約記錄
      const { error: reservationError } = await supabase
        .from('table_reservations')
        .update({ 
          table_id: tableId,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)
      
      if (reservationError) throw reservationError

      // 2. 更新桌台狀態為預約中
      const { error: tableError } = await supabase
        .from('tables')
        .update({ 
          status: 'reserved',
          updated_at: new Date().toISOString()
        })
        .eq('id', tableId)
      
      if (tableError) throw tableError
    } catch (error) {
      console.error('分配桌台失敗:', error)
      throw error
    }
  }

  /**
   * 自動分配最佳桌台給預約（基於人數和偏好智慧選擇）
   */
  static async autoAssignBestTable(
    reservationId: string,
    restaurantId: string,
    partySize: number,
    preferences?: {
      zone?: string
      features?: string[]
      childFriendly?: boolean
      wheelchair?: boolean
    }
  ): Promise<{ success: boolean; table?: any; message: string }> {
    try {
      console.log(`開始為預約 ${reservationId} 自動分配最佳桌台 (${partySize}人)`)
      
      // 1. 獲取所有可用桌台
      const { data: availableTables, error } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .eq('status', 'available')
        .gte('capacity', partySize) // 桌台容量必須 >= 預約人數
        .order('capacity', { ascending: true }) // 優先選擇容量較小的桌台
      
      if (error) {
        throw new Error(`查詢桌台失敗: ${error.message}`)
      }
      
      if (!availableTables || availableTables.length === 0) {
        return { success: false, message: '目前沒有可用的桌台' }
      }
      
      console.log(`找到 ${availableTables.length} 個可用桌台`)
      
      // 2. 根據各種條件評分
      const scoredTables = availableTables.map((table: any) => {
        let score = 0
        const reasons: string[] = []
        
        // 基礎分數：容量匹配度（容量剛好的桌台得分最高）
        const capacityRatio = table.capacity / partySize
        if (capacityRatio === 1) {
          score += 100 // 完美匹配
          reasons.push('容量完美匹配')
        } else if (capacityRatio <= 1.5) {
          score += 80 // 容量適中
          reasons.push('容量適中')
        } else if (capacityRatio <= 2) {
          score += 60 // 稍大
          reasons.push('容量稍大')
        } else {
          score += 40 // 太大
          reasons.push('容量較大')
        }
        
        // 位置偏好加分
        if (preferences?.zone && table.zone === preferences.zone) {
          score += 20
          reasons.push(`位於偏好區域: ${preferences.zone}`)
        }
        
        // 特色功能加分
        if (preferences?.features && table.features) {
          const matchedFeatures = preferences.features.filter(feature => 
            table.features.includes(feature)
          )
          score += matchedFeatures.length * 10
          if (matchedFeatures.length > 0) {
            reasons.push(`符合特色需求: ${matchedFeatures.join(', ')}`)
          }
        }
        
        // 兒童友善加分
        if (preferences?.childFriendly && table.features && table.features.includes('兒童友善')) {
          score += 15
          reasons.push('兒童友善設施')
        }
        
        // 無障礙需求加分
        if (preferences?.wheelchair && table.features && table.features.includes('輪椅友善')) {
          score += 15
          reasons.push('輪椅無障礙通道')
        }
        
        // AI 分配優先度加分
        if (table.ai_assignment_priority) {
          score += table.ai_assignment_priority
          reasons.push(`AI優先度: ${table.ai_assignment_priority}`)
        }
        
        return {
          ...table,
          score,
          reasons
        }
      })
      
      // 3. 按分數排序，取得最佳桌台
      scoredTables.sort((a: any, b: any) => b.score - a.score)
      const bestTable = scoredTables[0]
      
      console.log(`最佳桌台: ${bestTable.name} (編號: ${bestTable.table_number})`)
      console.log(`評分: ${bestTable.score} 分`)
      console.log(`原因: ${bestTable.reasons.join(', ')}`)
      
      // 4. 執行分配
      await this.assignTableToReservation(reservationId, bestTable.id)
      
      return {
        success: true,
        table: bestTable,
        message: `已自動分配桌台: ${bestTable.name} (${bestTable.reasons.join(', ')})`
      }
      
    } catch (error: any) {
      console.error(`自動分配桌台失敗: ${error.message}`)
      return { success: false, message: error.message }
    }
  }

  /**
   * 為現有預約自動分配桌台（根據預約資訊智慧選擇）
   */
  static async autoAssignTableForReservation(reservationId: string): Promise<{ success: boolean; table?: any; message: string }> {
    try {
      // 1. 獲取預約資訊
      const { data: reservation, error } = await supabase
        .from('table_reservations')
        .select('*')
        .eq('id', reservationId)
        .single()
      
      if (error || !reservation) {
        throw new Error('找不到指定的預約')
      }
      
      // 2. 解析客戶偏好
      const customerData = this.parseReservationCustomerData(reservation.customer_notes)
      const preferences: any = {}
      
      // 根據特殊需求設定偏好
      if (reservation.special_requests) {
        const requests = reservation.special_requests.toLowerCase()
        
        if (requests.includes('窗邊') || requests.includes('風景')) {
          preferences.features = ['窗邊']
        }
        
        if (requests.includes('安靜') || requests.includes('私人')) {
          preferences.features = [...(preferences.features || []), '安靜']
        }
        
        if (requests.includes('兒童') || requests.includes('小孩')) {
          preferences.childFriendly = true
        }
        
        if (requests.includes('輪椅') || requests.includes('無障礙')) {
          preferences.wheelchair = true
        }
        
        if (requests.includes('vip') || requests.includes('商務')) {
          preferences.zone = 'VIP區'
        }
      }
      
      // 根據預約類型設定偏好
      if (customerData) {
        switch (customerData.reservationType) {
          case 'romantic':
            preferences.features = [...(preferences.features || []), '安靜', '窗邊']
            break
          case 'business':
            preferences.zone = 'VIP區'
            preferences.features = [...(preferences.features || []), '安靜']
            break
          case 'family':
          case 'family_reunion':
            preferences.childFriendly = true
            break
        }
        
        if (customerData.childChairNeeded) {
          preferences.childFriendly = true
        }
      }
      
      // 3. 執行自動分配
      return await this.autoAssignBestTable(
        reservationId,
        reservation.restaurant_id,
        reservation.party_size,
        preferences
      )
      
    } catch (error: any) {
      console.error(`為預約自動分配桌台失敗: ${error.message}`)
      return { success: false, message: error.message }
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
