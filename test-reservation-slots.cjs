#!/usr/bin/env node

/**
 * 🧪 測試 ReservationService.getAvailableTimeSlots
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;
const RESTAURANT_ID = process.env.VITE_RESTAURANT_ID;

console.log('🧪 測試 ReservationService.getAvailableTimeSlots 方法...');

// 模擬 ReservationService 的關鍵方法
class TestReservationService {
  static supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  static MAX_CAPACITY_PER_30MIN = 8;

  /**
   * 檢查指定日期是否為休假日
   */
  static async isHoliday(restaurantId, date) {
    try {
      const dateString = date.toISOString().split('T')[0]
      
      const { data, error } = await this.supabase
        .from('restaurant_holidays')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('holiday_date', dateString)
        .limit(1)
      
      if (error) {
        console.error('檢查休假日失敗:', error)
        return false
      }
      
      return (data && data.length > 0)
    } catch (error) {
      console.error('檢查休假日異常:', error)
      return false
    }
  }

  /**
   * 解析時間字串 (HH:mm)
   */
  static parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number)
    return { hours, minutes }
  }

  /**
   * 取得指定日期的所有可用時段
   */
  static async getAvailableTimeSlots(restaurantId, date, partySize) {
    try {
      console.log(`📅 查詢日期: ${date.toDateString()}`);
      console.log(`👥 人數: ${partySize}`);
      
      // 1. 先檢查是否為休假日
      const isHolidayDate = await this.isHoliday(restaurantId, date)
      if (isHolidayDate) {
        console.log('❌ 此日期為休假日');
        return { 
          date: date.toDateString(), 
          slots: [],
          isHoliday: true,
          holidayMessage: '此日期為休假日，不開放預約'
        }
      }

      // 2. 取得餐廳預約設定
      console.log('📖 查詢餐廳預約設定...');
      const { data: restaurant, error: restError } = await this.supabase
        .from('restaurants')
        .select('reservation_settings')
        .eq('id', restaurantId)
        .single()
      
      if (restError) {
        console.log('❌ 查詢餐廳失敗:', restError.message);
        throw restError;
      }
      
      const reservationSettings = restaurant.reservation_settings
      if (!reservationSettings || !reservationSettings.businessHours) {
        console.log('❌ 餐廳預約設定未設置');
        throw new Error('餐廳預約設定未設置')
      }
      
      console.log('✅ 找到預約設定');
      
      // 3. 取得當天是星期幾
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const dayName = dayNames[date.getDay()]
      const todayHours = reservationSettings.businessHours[dayName]
      
      console.log(`📆 今天是: ${dayName}`);
      console.log(`🕐 營業時間設定:`, todayHours);
      
      if (!todayHours || !todayHours.isOpen) {
        console.log('❌ 今日不營業');
        return { 
          date: date.toDateString(), 
          slots: [],
          isHoliday: false,
          holidayMessage: '今日不營業'
        }
      }
      
      // 4. 生成時段 (30分鐘間隔)
      const slots = []
      const openTime = this.parseTime(todayHours.openTime)
      const closeTime = this.parseTime(todayHours.closeTime)
      
      console.log(`🕐 營業時間: ${todayHours.openTime} - ${todayHours.closeTime}`);
      
      // 計算最晚預約時間 (考慮90分鐘用餐時長)
      const mealDurationMinutes = reservationSettings.reservationSettings?.mealDurationMinutes || 90
      const lastReservationTime = reservationSettings.reservationSettings?.lastReservationTime || '19:30'
      const maxReservationTime = this.parseTime(lastReservationTime)
      
      console.log(`⏰ 最晚預約: ${lastReservationTime}`);
      console.log(`🍽️  用餐時長: ${mealDurationMinutes} 分鐘`);
      
      let currentTime = new Date(date)
      currentTime.setHours(openTime.hours, openTime.minutes, 0, 0)
      
      // 最晚預約時間不能超過設定的時間
      const endTime = new Date(date)
      endTime.setHours(maxReservationTime.hours, maxReservationTime.minutes, 0, 0)
      
      console.log(`🎯 生成時段範圍: ${currentTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
      
      while (currentTime <= endTime) {
        const timeSlot = currentTime.toLocaleTimeString('zh-TW', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false
        });
        
        console.log(`🕒 檢查時段: ${timeSlot}`);
        
        // 檢查該時段可用性 (簡化版本)
        slots.push({
          datetime: currentTime.toISOString(),
          available_capacity: this.MAX_CAPACITY_PER_30MIN,
          is_available: true,
          existing_reservations: 0
        })
        
        // 下一個30分鐘時段
        currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000)
        
        // 安全機制
        if (slots.length > 20) {
          console.log('⚠️  達到時段上限，停止生成');
          break;
        }
      }
      
      console.log(`✅ 生成了 ${slots.length} 個時段`);
      
      return {
        date: date.toDateString(),
        slots
      }
    } catch (error) {
      console.error('❌ 取得可用時段失敗:', error)
      throw error
    }
  }
}

async function testGetAvailableSlots() {
  try {
    console.log(`🏪 餐廳ID: ${RESTAURANT_ID}`);
    
    // 測試今天的時段
    const today = new Date();
    const result = await TestReservationService.getAvailableTimeSlots(
      RESTAURANT_ID,
      today,
      2 // 2人預約
    );
    
    console.log('\n📋 結果:');
    console.log(`日期: ${result.date}`);
    console.log(`是否休假日: ${result.isHoliday || false}`);
    console.log(`可用時段數: ${result.slots.length}`);
    
    if (result.slots.length > 0) {
      console.log('\n🕒 可用時段列表:');
      result.slots.forEach((slot, index) => {
        const time = new Date(slot.datetime).toLocaleTimeString('zh-TW', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false
        });
        console.log(`  ${index + 1}. ${time} (${slot.is_available ? '可預約' : '已滿'})`);
      });
    } else {
      console.log(`\n⚠️  沒有可用時段: ${result.holidayMessage || '未知原因'}`);
    }
    
  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
  }
}

testGetAvailableSlots();
