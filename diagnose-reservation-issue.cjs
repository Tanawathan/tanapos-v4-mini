/**
 * 預約系統診斷腳本
 * 檢查預約創建功能的問題
 */

const { createClient } = require('@supabase/supabase-js');

// 環境配置
const SUPABASE_URL = 'https://arksfwmcmwnyxvlcpskm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU';
const TEST_RESTAURANT_ID = 'a8fff0de-a2dd-4749-a80c-08a6102de734';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    'info': '🔵',
    'success': '✅',
    'error': '❌',
    'warning': '⚠️',
    'test': '🧪',
    'reservation': '📅'
  }[type] || '📋';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

class ReservationDiagnostics {
  
  async runDiagnostics() {
    log('開始預約系統診斷', 'test');
    
    await this.checkDatabaseConnection();
    await this.checkRestaurantData();
    await this.checkBusinessHours();
    await this.testCreateReservation();
  }

  async checkDatabaseConnection() {
    log('檢查資料庫連接', 'test');
    
    try {
      const { data, error } = await supabase
        .from('table_reservations')
        .select('count')
        .limit(1);
      
      if (error) {
        log(`資料庫連接錯誤: ${error.message}`, 'error');
        return false;
      }
      
      log('資料庫連接正常', 'success');
      return true;
    } catch (error) {
      log(`資料庫連接異常: ${error.message}`, 'error');
      return false;
    }
  }

  async checkRestaurantData() {
    log('檢查餐廳資料', 'test');
    
    try {
      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', TEST_RESTAURANT_ID)
        .single();
      
      if (error) {
        log(`餐廳資料錯誤: ${error.message}`, 'error');
        return false;
      }
      
      if (!restaurant) {
        log('找不到測試餐廳', 'error');
        return false;
      }
      
      log(`餐廳資料正常: ${restaurant.name}`, 'success');
      log(`營業時間: ${JSON.stringify(restaurant.business_hours)}`, 'info');
      
      return true;
    } catch (error) {
      log(`檢查餐廳資料異常: ${error.message}`, 'error');
      return false;
    }
  }

  async checkBusinessHours() {
    log('檢查營業時間設定', 'test');
    
    try {
      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .select('business_hours')
        .eq('id', TEST_RESTAURANT_ID)
        .single();
      
      if (error) throw error;
      
      const businessHours = restaurant.business_hours;
      
      if (!businessHours) {
        log('餐廳營業時間未設定', 'error');
        return false;
      }
      
      // 檢查今天的營業時間
      const today = new Date();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[today.getDay()];
      const todayHours = businessHours[dayName];
      
      if (!todayHours || !todayHours.open || !todayHours.close) {
        log(`今日(${dayName})不營業`, 'warning');
        
        // 檢查明天
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const tomorrowName = dayNames[tomorrow.getDay()];
        const tomorrowHours = businessHours[tomorrowName];
        
        if (tomorrowHours && tomorrowHours.open && tomorrowHours.close) {
          log(`明日(${tomorrowName})營業時間: ${tomorrowHours.open} - ${tomorrowHours.close}`, 'info');
        }
        
        return false;
      }
      
      log(`今日營業時間: ${todayHours.open} - ${todayHours.close}`, 'success');
      return true;
      
    } catch (error) {
      log(`檢查營業時間異常: ${error.message}`, 'error');
      return false;
    }
  }

  async testCreateReservation() {
    log('測試預約創建功能', 'test');
    
    try {
      // 測試資料
      const testReservation = {
        customer_name: '測試客戶',
        customer_phone: '0912345678',
        customer_email: 'test@example.com',
        party_size: 4,
        adult_count: 3,
        child_count: 1,
        child_chair_needed: true,
        reservation_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 明天
        reservation_time: '18:30',
        special_requests: '慶祝生日，需要安靜位置'
      };
      
      log(`測試預約資料: ${JSON.stringify(testReservation, null, 2)}`, 'info');
      
      // 步驟1: 檢查時段可用性
      log('步驟1: 檢查時段可用性', 'reservation');
      const reservationDateTime = new Date(`${testReservation.reservation_date}T${testReservation.reservation_time}`);
      
      const availability = await this.checkAvailability(TEST_RESTAURANT_ID, reservationDateTime, testReservation.party_size);
      
      if (!availability.available) {
        log(`時段不可用: ${availability.message}`, 'error');
        return false;
      }
      
      log(`時段可用，剩餘容量: ${availability.capacity.available_capacity}`, 'success');
      
      // 步驟2: 創建預約
      log('步驟2: 創建預約', 'reservation');
      const reservation = await this.createTestReservation(testReservation, TEST_RESTAURANT_ID);
      
      if (reservation) {
        log(`預約創建成功: ${reservation.id}`, 'success');
        log(`客戶: ${reservation.customer_name}, 時間: ${reservation.reservation_time}`, 'info');
        
        // 步驟3: 清理測試資料
        log('步驟3: 清理測試資料', 'reservation');
        await supabase.from('table_reservations').delete().eq('id', reservation.id);
        log('測試資料已清理', 'success');
        
        return true;
      }
      
      return false;
      
    } catch (error) {
      log(`測試預約創建異常: ${error.message}`, 'error');
      log(`詳細錯誤: ${error.stack}`, 'error');
      return false;
    }
  }

  async checkAvailability(restaurantId, datetime, partySize) {
    try {
      const timeSlotStart = this.getTimeSlotStart(datetime);
      const timeSlotEnd = new Date(timeSlotStart.getTime() + 30 * 60 * 1000);
      
      // 查詢該時段的現有預約
      const { data: existingReservations, error } = await supabase
        .from('table_reservations')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .not('status', 'in', '(cancelled,no_show,completed)')
        .gte('reservation_time', timeSlotStart.toISOString())
        .lt('reservation_time', timeSlotEnd.toISOString());
      
      if (error) throw error;
      
      const MAX_CAPACITY_PER_30MIN = 8;
      const existingCapacity = existingReservations?.reduce((sum, res) => sum + res.party_size, 0) || 0;
      const availableCapacity = MAX_CAPACITY_PER_30MIN - existingCapacity;
      
      return {
        available: availableCapacity >= partySize,
        capacity: {
          total_capacity: MAX_CAPACITY_PER_30MIN,
          available_capacity: availableCapacity,
          existing_reservations: existingReservations || []
        },
        message: availableCapacity >= partySize ? 
          `可容納 ${partySize} 人` : 
          `容量不足，已有 ${existingCapacity} 人預約`
      };
    } catch (error) {
      return {
        available: false,
        capacity: { total_capacity: 0, available_capacity: 0, existing_reservations: [] },
        message: `檢查失敗: ${error.message}`
      };
    }
  }

  async createTestReservation(formData, restaurantId) {
    try {
      // 組合日期和時間
      const reservationDateTime = new Date(`${formData.reservation_date}T${formData.reservation_time}`);
      
      // 計算預估結束時間
      const estimatedEndTime = new Date(reservationDateTime.getTime() + 120 * 60 * 1000); // 預設2小時
      
      // 創建結構化的客戶資料
      const customerData = {
        adults: formData.adult_count,
        children: formData.child_count,
        childChairNeeded: formData.child_chair_needed,
        reservationType: this.determineReservationType(formData.adult_count, formData.child_count),
        occasion: formData.special_requests?.includes('生日') ? 'birthday' : 
                  formData.special_requests?.includes('商務') ? 'business_meeting' :
                  formData.special_requests?.includes('浪漫') || formData.special_requests?.includes('情侶') ? 'date_night' :
                  'dining'
      };
      
      const reservation = {
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
        customer_notes: JSON.stringify(customerData)
      };
      
      const { data, error } = await supabase
        .from('table_reservations')
        .insert(reservation)
        .select()
        .single();
      
      if (error) {
        log(`資料庫插入錯誤: ${error.message}`, 'error');
        log(`錯誤詳情: ${JSON.stringify(error, null, 2)}`, 'error');
        throw error;
      }
      
      return data;
    } catch (error) {
      log(`創建預約失敗: ${error.message}`, 'error');
      throw error;
    }
  }

  getTimeSlotStart(datetime) {
    const slotStart = new Date(datetime);
    const minutes = slotStart.getMinutes();
    const roundedMinutes = Math.floor(minutes / 30) * 30;
    slotStart.setMinutes(roundedMinutes, 0, 0);
    return slotStart;
  }

  determineReservationType(adultCount, childCount) {
    if (childCount > 0) {
      return adultCount + childCount > 6 ? 'family_reunion' : 'family';
    }
    if (adultCount >= 4) {
      return 'business';
    }
    if (adultCount === 2) {
      return 'romantic';
    }
    return 'dining';
  }
}

// 執行診斷
async function runReservationDiagnostics() {
  console.log('📅 開始預約系統診斷');
  console.log('='.repeat(50));
  
  const diagnostics = new ReservationDiagnostics();
  
  try {
    await diagnostics.runDiagnostics();
    log('診斷完成', 'success');
  } catch (error) {
    log(`診斷過程發生異常: ${error.message}`, 'error');
  }
  
  console.log('='.repeat(50));
}

// 執行診斷
if (require.main === module) {
  runReservationDiagnostics().catch(error => {
    console.error('預約系統診斷失敗:', error);
    process.exit(1);
  });
}

module.exports = { ReservationDiagnostics };
