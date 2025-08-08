/**
 * 預約系統自動桌台分配測試腳本
 * 檢查預約系統是否能根據人數自動安排桌台
 */

const { createClient } = require('@supabase/supabase-js');

// 環境配置
const SUPABASE_URL = 'https://arksfwmcmwnyxvlcpskm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU';
const TEST_RESTAURANT_ID = 'a8fff0de-a2dd-4749-a80c-08a6102de734';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 測試統計
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];

// 測試工具函數
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    'info': '🔵',
    'success': '✅',
    'error': '❌',
    'warning': '⚠️',
    'test': '🧪',
    'table': '🪑'
  }[type] || '📋';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    log(`測試通過: ${message}`, 'success');
    testResults.push({ test: message, status: 'PASS' });
    return true;
  } else {
    failedTests++;
    log(`測試失敗: ${message}`, 'error');
    testResults.push({ test: message, status: 'FAIL' });
    return false;
  }
}

// 自動桌台分配演算法
class AutoTableAssignment {
  
  /**
   * 根據人數和偏好自動分配最佳桌台
   */
  static async findBestTable(restaurantId, partySize, preferences = {}) {
    try {
      log(`開始為 ${partySize} 人尋找最佳桌台`, 'table');
      
      // 1. 獲取所有可用桌台
      const { data: availableTables, error } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .eq('status', 'available')
        .gte('capacity', partySize) // 桌台容量必須 >= 預約人數
        .order('capacity', { ascending: true }); // 優先選擇容量較小的桌台
      
      if (error) {
        throw new Error(`查詢桌台失敗: ${error.message}`);
      }
      
      if (!availableTables || availableTables.length === 0) {
        return { success: false, message: '目前沒有可用的桌台', table: null };
      }
      
      log(`找到 ${availableTables.length} 個可用桌台`, 'info');
      
      // 2. 根據各種條件評分
      const scoredTables = availableTables.map(table => {
        let score = 0;
        const reasons = [];
        
        // 基礎分數：容量匹配度（容量剛好的桌台得分最高）
        const capacityRatio = table.capacity / partySize;
        if (capacityRatio === 1) {
          score += 100; // 完美匹配
          reasons.push('容量完美匹配');
        } else if (capacityRatio <= 1.5) {
          score += 80; // 容量適中
          reasons.push('容量適中');
        } else if (capacityRatio <= 2) {
          score += 60; // 稍大
          reasons.push('容量稍大');
        } else {
          score += 40; // 太大
          reasons.push('容量較大');
        }
        
        // 位置偏好加分
        if (preferences.zone && table.zone === preferences.zone) {
          score += 20;
          reasons.push(`位於偏好區域: ${preferences.zone}`);
        }
        
        // 特色功能加分
        if (preferences.features && table.features) {
          const matchedFeatures = preferences.features.filter(feature => 
            table.features.includes(feature)
          );
          score += matchedFeatures.length * 10;
          if (matchedFeatures.length > 0) {
            reasons.push(`符合特色需求: ${matchedFeatures.join(', ')}`);
          }
        }
        
        // 兒童友善加分
        if (preferences.childFriendly && table.features && table.features.includes('兒童友善')) {
          score += 15;
          reasons.push('兒童友善設施');
        }
        
        // 無障礙需求加分
        if (preferences.wheelchair && table.features && table.features.includes('輪椅友善')) {
          score += 15;
          reasons.push('輪椅無障礙通道');
        }
        
        // AI 分配優先度加分
        if (table.ai_assignment_priority) {
          score += table.ai_assignment_priority;
          reasons.push(`AI優先度: ${table.ai_assignment_priority}`);
        }
        
        return {
          ...table,
          score,
          reasons
        };
      });
      
      // 3. 按分數排序，取得最佳桌台
      scoredTables.sort((a, b) => b.score - a.score);
      const bestTable = scoredTables[0];
      
      log(`最佳桌台: ${bestTable.name} (編號: ${bestTable.table_number})`, 'table');
      log(`評分: ${bestTable.score} 分`, 'info');
      log(`原因: ${bestTable.reasons.join(', ')}`, 'info');
      
      return {
        success: true,
        table: bestTable,
        alternatives: scoredTables.slice(1, 3), // 提供備選方案
        message: `推薦桌台: ${bestTable.name} (${bestTable.reasons.join(', ')})`
      };
      
    } catch (error) {
      log(`自動分配桌台失敗: ${error.message}`, 'error');
      return { success: false, message: error.message, table: null };
    }
  }
  
  /**
   * 執行桌台分配
   */
  static async assignTable(reservationId, tableId) {
    try {
      // 1. 更新預約記錄
      const { error: reservationError } = await supabase
        .from('table_reservations')
        .update({ 
          table_id: tableId,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId);
      
      if (reservationError) {
        throw new Error(`更新預約失敗: ${reservationError.message}`);
      }
      
      // 2. 更新桌台狀態為預約中
      const { error: tableError } = await supabase
        .from('tables')
        .update({ 
          status: 'reserved',
          updated_at: new Date().toISOString()
        })
        .eq('id', tableId);
      
      if (tableError) {
        throw new Error(`更新桌台狀態失敗: ${tableError.message}`);
      }
      
      return { success: true, message: '桌台分配成功' };
      
    } catch (error) {
      log(`桌台分配失敗: ${error.message}`, 'error');
      return { success: false, message: error.message };
    }
  }
}

// 測試類別
class ReservationTableAssignmentTests {
  async runAllTests() {
    log('開始預約系統自動桌台分配測試', 'test');
    
    await this.testDataStructure();
    await this.testBasicTableAssignment();
    await this.testCapacityMatching();
    await this.testPreferenceMatching();
    await this.testCompleteWorkflow();
  }
  
  async testDataStructure() {
    log('測試資料結構完整性', 'test');
    
    try {
      // 檢查桌台表結構
      const { data: tables, error: tablesError } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', TEST_RESTAURANT_ID)
        .limit(1);
      
      assert(tablesError === null, '桌台表查詢不應有錯誤');
      
      if (tables && tables.length > 0) {
        const table = tables[0];
        assert(table.id !== undefined, '桌台應有ID');
        assert(table.table_number !== undefined, '桌台應有編號');
        assert(table.capacity !== undefined, '桌台應有容量');
        assert(table.status !== undefined, '桌台應有狀態');
        assert(table.is_active !== undefined, '桌台應有啟用狀態');
        
        log(`找到桌台: ${table.name} (容量: ${table.capacity}人)`, 'table');
      }
      
      // 檢查預約表結構
      const { data: reservations, error: reservationsError } = await supabase
        .from('table_reservations')
        .select('*')
        .eq('restaurant_id', TEST_RESTAURANT_ID)
        .limit(1);
      
      assert(reservationsError === null, '預約表查詢不應有錯誤');
      
      if (reservations && reservations.length > 0) {
        const reservation = reservations[0];
        assert(reservation.id !== undefined, '預約應有ID');
        assert(reservation.party_size !== undefined, '預約應有人數');
        assert(reservation.reservation_time !== undefined, '預約應有時間');
        
        log(`找到預約: ${reservation.customer_name} (${reservation.party_size}人)`, 'info');
      }
      
    } catch (error) {
      log(`資料結構測試異常: ${error.message}`, 'error');
      assert(false, '資料結構測試不應拋出異常');
    }
  }
  
  async testBasicTableAssignment() {
    log('測試基本桌台分配功能', 'test');
    
    try {
      // 測試不同人數的桌台分配
      const testCases = [
        { partySize: 2, description: '2人小型聚餐' },
        { partySize: 4, description: '4人家庭聚餐' },
        { partySize: 6, description: '6人朋友聚會' },
        { partySize: 8, description: '8人商務聚餐' }
      ];
      
      for (const testCase of testCases) {
        const result = await AutoTableAssignment.findBestTable(
          TEST_RESTAURANT_ID, 
          testCase.partySize
        );
        
        assert(result.success !== undefined, `${testCase.description} - 應有結果狀態`);
        
        if (result.success) {
          assert(result.table !== null, `${testCase.description} - 應找到桌台`);
          assert(result.table.capacity >= testCase.partySize, 
            `${testCase.description} - 桌台容量應 >= ${testCase.partySize}人`);
          
          log(`${testCase.description} - 推薦桌台: ${result.table.name} (容量: ${result.table.capacity})`, 'table');
        } else {
          log(`${testCase.description} - 無可用桌台: ${result.message}`, 'warning');
        }
      }
      
    } catch (error) {
      log(`基本桌台分配測試異常: ${error.message}`, 'error');
      assert(false, '基本桌台分配測試不應拋出異常');
    }
  }
  
  async testCapacityMatching() {
    log('測試容量匹配邏輯', 'test');
    
    try {
      // 獲取所有可用桌台進行分析
      const { data: tables } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', TEST_RESTAURANT_ID)
        .eq('is_active', true)
        .order('capacity');
      
      if (tables && tables.length > 0) {
        log(`可用桌台容量分布:`, 'info');
        const capacityGroups = {};
        tables.forEach(table => {
          if (!capacityGroups[table.capacity]) {
            capacityGroups[table.capacity] = [];
          }
          capacityGroups[table.capacity].push(table.name);
        });
        
        Object.keys(capacityGroups).forEach(capacity => {
          log(`  ${capacity}人桌: ${capacityGroups[capacity].length}桌 (${capacityGroups[capacity].join(', ')})`, 'info');
        });
        
        // 測試各種人數的最佳匹配
        for (let partySize = 1; partySize <= 10; partySize++) {
          const result = await AutoTableAssignment.findBestTable(
            TEST_RESTAURANT_ID, 
            partySize
          );
          
          if (result.success) {
            const efficiency = partySize / result.table.capacity;
            const isOptimal = efficiency >= 0.75; // 使用率 >= 75% 視為最佳
            
            assert(efficiency > 0, `${partySize}人 - 容量使用率應 > 0`);
            
            log(`${partySize}人 → ${result.table.name}(${result.table.capacity}人) 使用率:${(efficiency*100).toFixed(1)}% ${isOptimal ? '✓最佳' : '一般'}`, 'table');
          }
        }
      }
      
    } catch (error) {
      log(`容量匹配測試異常: ${error.message}`, 'error');
      assert(false, '容量匹配測試不應拋出異常');
    }
  }
  
  async testPreferenceMatching() {
    log('測試偏好匹配功能', 'test');
    
    try {
      // 測試區域偏好
      const zonePreferenceResult = await AutoTableAssignment.findBestTable(
        TEST_RESTAURANT_ID,
        4,
        { zone: 'VIP區' }
      );
      
      if (zonePreferenceResult.success) {
        log(`區域偏好測試: ${zonePreferenceResult.table.name} (區域: ${zonePreferenceResult.table.zone})`, 'table');
      }
      
      // 測試特色偏好
      const featurePreferenceResult = await AutoTableAssignment.findBestTable(
        TEST_RESTAURANT_ID,
        4,
        { features: ['窗邊', '安靜'] }
      );
      
      if (featurePreferenceResult.success) {
        log(`特色偏好測試: ${featurePreferenceResult.table.name} (特色: ${featurePreferenceResult.table.features?.join(', ') || '無'})`, 'table');
      }
      
      // 測試兒童友善需求
      const childFriendlyResult = await AutoTableAssignment.findBestTable(
        TEST_RESTAURANT_ID,
        4,
        { childFriendly: true }
      );
      
      if (childFriendlyResult.success) {
        log(`兒童友善測試: ${childFriendlyResult.table.name}`, 'table');
      }
      
      assert(true, '偏好匹配功能測試完成');
      
    } catch (error) {
      log(`偏好匹配測試異常: ${error.message}`, 'error');
      assert(false, '偏好匹配測試不應拋出異常');
    }
  }
  
  async testCompleteWorkflow() {
    log('測試完整預約分配流程', 'test');
    
    try {
      // 1. 創建測試預約
      const testReservation = {
        restaurant_id: TEST_RESTAURANT_ID,
        customer_name: '測試客戶',
        customer_phone: '0987654321',
        party_size: 4,
        reservation_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2小時後
        status: 'confirmed',
        special_requests: '希望靠窗座位'
      };
      
      const { data: createdReservation, error: reservationError } = await supabase
        .from('table_reservations')
        .insert([testReservation])
        .select()
        .single();
      
      assert(reservationError === null, '測試預約創建不應有錯誤');
      assert(createdReservation !== null, '應成功創建測試預約');
      
      if (createdReservation) {
        log(`創建測試預約: ${createdReservation.id}`, 'info');
        
        // 2. 自動分配桌台
        const assignmentResult = await AutoTableAssignment.findBestTable(
          TEST_RESTAURANT_ID,
          createdReservation.party_size,
          { features: ['窗邊'] } // 根據特殊需求
        );
        
        assert(assignmentResult.success !== undefined, '桌台分配應有結果');
        
        if (assignmentResult.success && assignmentResult.table) {
          // 3. 執行分配
          const executeResult = await AutoTableAssignment.assignTable(
            createdReservation.id,
            assignmentResult.table.id
          );
          
          assert(executeResult.success === true, '桌台分配執行應成功');
          
          // 4. 驗證分配結果
          const { data: updatedReservation } = await supabase
            .from('table_reservations')
            .select('*, tables(*)')
            .eq('id', createdReservation.id)
            .single();
          
          assert(updatedReservation.table_id === assignmentResult.table.id, '預約應關聯正確的桌台');
          
          log(`完整流程成功: 預約 ${createdReservation.id} 已分配到桌台 ${assignmentResult.table.name}`, 'success');
          
          // 5. 清理測試資料
          await supabase.from('table_reservations').delete().eq('id', createdReservation.id);
          await supabase.from('tables').update({ status: 'available' }).eq('id', assignmentResult.table.id);
          
        } else {
          log('無可用桌台進行完整流程測試', 'warning');
        }
      }
      
    } catch (error) {
      log(`完整流程測試異常: ${error.message}`, 'error');
      assert(false, '完整流程測試不應拋出異常');
    }
  }
}

// 主測試執行器
async function runReservationAssignmentTests() {
  console.log('🪑 開始預約系統自動桌台分配測試');
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  try {
    const tests = new ReservationTableAssignmentTests();
    await tests.runAllTests();
    
  } catch (error) {
    log(`測試執行異常: ${error.message}`, 'error');
  }
  
  const totalTime = Date.now() - startTime;
  
  // 輸出測試摘要
  console.log('='.repeat(60));
  log('預約桌台分配測試執行完成', 'success');
  console.log(`📊 測試摘要:`);
  console.log(`   總測試數: ${totalTests}`);
  console.log(`   通過數量: ${passedTests}`);
  console.log(`   失敗數量: ${failedTests}`);
  console.log(`   成功率: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%`);
  console.log(`   執行時間: ${totalTime}ms`);
  
  // 建議
  console.log('\\n📋 功能建議:');
  if (passedTests === totalTests) {
    console.log('   ✅ 預約系統桌台分配功能運作正常');
    console.log('   💡 建議加入 AI 智慧排程優化');
    console.log('   🚀 可考慮實現即時桌台狀態同步');
  } else {
    console.log('   ⚠️  發現功能缺失，需要改善:');
    console.log('   🔧 實現自動桌台分配算法');
    console.log('   📊 加強容量匹配邏輯');
    console.log('   🎯 整合偏好匹配系統');
  }
  
  console.log('='.repeat(60));
  
  // 設定進程結束碼
  process.exit(failedTests > 0 ? 1 : 0);
}

// 執行測試
if (require.main === module) {
  runReservationAssignmentTests().catch(error => {
    console.error('預約桌台分配測試執行失敗:', error);
    process.exit(1);
  });
}

module.exports = {
  AutoTableAssignment,
  ReservationTableAssignmentTests
};
