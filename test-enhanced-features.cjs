/**
 * 桌台管理系統功能增強測試腳本
 * 測試新增的載入優化、資料驗證等功能
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
    'enhancement': '🚀'
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

// 模擬驗證函數（從 TableSettings 組件移植）
async function validateTableData(tableData, excludeTableId = null) {
  const errors = [];
  
  // 檢查桌台編號唯一性
  if (tableData.table_number !== undefined) {
    const { data: existingTables } = await supabase
      .from('tables')
      .select('id, table_number')
      .eq('restaurant_id', TEST_RESTAURANT_ID)
      .eq('table_number', tableData.table_number);
    
    if (existingTables && existingTables.length > 0) {
      const duplicateTable = existingTables.find(t => t.id !== excludeTableId);
      if (duplicateTable) {
        errors.push(`桌台編號 ${tableData.table_number} 已存在`);
      }
    }
  }
  
  // 檢查容量範圍
  if (tableData.capacity !== undefined) {
    if (tableData.capacity <= 0) {
      errors.push('桌台容量必須大於 0');
    } else if (tableData.capacity > 50) {
      errors.push('桌台容量不能超過 50 人');
    }
  }
  
  // 檢查最小最大容量關係
  if (tableData.min_capacity !== undefined && tableData.max_capacity !== undefined && tableData.max_capacity !== null) {
    if (tableData.min_capacity > tableData.max_capacity) {
      errors.push('最小容量不能大於最大容量');
    }
  }
  
  // 檢查清潔時間範圍
  if (tableData.cleaning_duration_minutes !== undefined) {
    if (tableData.cleaning_duration_minutes < 5) {
      errors.push('清潔時間不能少於 5 分鐘');
    } else if (tableData.cleaning_duration_minutes > 120) {
      errors.push('清潔時間不能超過 120 分鐘');
    }
  }
  
  // 檢查必填欄位
  if (tableData.name !== undefined && (!tableData.name || tableData.name.trim().length === 0)) {
    errors.push('桌台名稱不能為空');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// 資料驗證測試類別
class EnhancedValidationTests {
  async runAllTests() {
    log('開始增強驗證功能測試', 'test');
    
    await this.testTableNumberUniqueness();
    await this.testCapacityValidation();
    await this.testCleaningTimeValidation();
    await this.testNameValidation();
    await this.testCapacityRangeValidation();
  }

  async testTableNumberUniqueness() {
    log('測試桌台編號唯一性驗證', 'enhancement');
    
    try {
      // 創建第一個測試桌台
      const tableNumber = Math.floor(Math.random() * 10000) + 5000;
      const firstTable = {
        restaurant_id: TEST_RESTAURANT_ID,
        table_number: tableNumber,
        name: `唯一性測試桌台-${Date.now()}`,
        capacity: 4,
        status: 'available',
        floor_level: 1,
        zone: '測試區域',
        position_x: 100,
        position_y: 100,
        table_type: 'standard',
        qr_enabled: true,
        ai_assignment_priority: 5,
        cleaning_duration_minutes: 15,
        is_active: true
      };

      const { data: createdTable, error: createError } = await supabase
        .from('tables')
        .insert([firstTable])
        .select();

      assert(createError === null, '第一個桌台應建立成功');

      if (createdTable && createdTable.length > 0) {
        const tableId = createdTable[0].id;
        
        // 測試重複編號驗證
        const duplicateData = { table_number: tableNumber };
        const validation = await validateTableData(duplicateData);
        
        assert(!validation.isValid, '重複桌台編號應驗證失敗');
        assert(validation.errors.some(error => error.includes('已存在')), '應包含重複編號錯誤訊息');
        
        // 測試更新自己時不應報錯
        const selfUpdateValidation = await validateTableData(duplicateData, tableId);
        assert(selfUpdateValidation.isValid, '更新自己的桌台編號應允許');
        
        // 清理測試資料
        await supabase.from('tables').delete().eq('id', tableId);
      }
      
    } catch (error) {
      log(`桌台編號唯一性測試異常: ${error.message}`, 'error');
      assert(false, '桌台編號唯一性測試不應拋出異常');
    }
  }

  async testCapacityValidation() {
    log('測試容量驗證功能', 'enhancement');
    
    try {
      // 測試無效容量值
      const invalidCapacities = [
        { capacity: 0, expected: '桌台容量必須大於 0' },
        { capacity: -1, expected: '桌台容量必須大於 0' },
        { capacity: 51, expected: '桌台容量不能超過 50 人' },
        { capacity: 100, expected: '桌台容量不能超過 50 人' }
      ];
      
      for (const test of invalidCapacities) {
        const validation = await validateTableData({ capacity: test.capacity });
        assert(!validation.isValid, `容量 ${test.capacity} 應驗證失敗`);
        assert(validation.errors.some(error => error.includes('容量')), `應包含容量錯誤訊息`);
      }
      
      // 測試有效容量值
      const validCapacities = [1, 4, 8, 20, 50];
      for (const capacity of validCapacities) {
        const validation = await validateTableData({ capacity });
        assert(validation.isValid, `容量 ${capacity} 應驗證通過`);
      }
      
    } catch (error) {
      log(`容量驗證測試異常: ${error.message}`, 'error');
      assert(false, '容量驗證測試不應拋出異常');
    }
  }

  async testCleaningTimeValidation() {
    log('測試清潔時間驗證功能', 'enhancement');
    
    try {
      // 測試無效清潔時間
      const invalidTimes = [
        { time: 4, expected: '清潔時間不能少於 5 分鐘' },
        { time: 0, expected: '清潔時間不能少於 5 分鐘' },
        { time: 121, expected: '清潔時間不能超過 120 分鐘' },
        { time: 200, expected: '清潔時間不能超過 120 分鐘' }
      ];
      
      for (const test of invalidTimes) {
        const validation = await validateTableData({ cleaning_duration_minutes: test.time });
        assert(!validation.isValid, `清潔時間 ${test.time} 分鐘應驗證失敗`);
        assert(validation.errors.some(error => error.includes('清潔時間')), '應包含清潔時間錯誤訊息');
      }
      
      // 測試有效清潔時間
      const validTimes = [5, 10, 15, 30, 60, 120];
      for (const time of validTimes) {
        const validation = await validateTableData({ cleaning_duration_minutes: time });
        assert(validation.isValid, `清潔時間 ${time} 分鐘應驗證通過`);
      }
      
    } catch (error) {
      log(`清潔時間驗證測試異常: ${error.message}`, 'error');
      assert(false, '清潔時間驗證測試不應拋出異常');
    }
  }

  async testNameValidation() {
    log('測試桌台名稱驗證功能', 'enhancement');
    
    try {
      // 測試無效名稱
      const invalidNames = ['', '   ', null];
      
      for (const name of invalidNames) {
        const validation = await validateTableData({ name });
        assert(!validation.isValid, `名稱 "${name}" 應驗證失敗`);
        assert(validation.errors.some(error => error.includes('名稱')), '應包含名稱錯誤訊息');
      }
      
      // 測試有效名稱
      const validNames = ['桌台1', 'VIP包廂', '戶外座位A1', '測試桌台名稱'];
      for (const name of validNames) {
        const validation = await validateTableData({ name });
        assert(validation.isValid, `名稱 "${name}" 應驗證通過`);
      }
      
    } catch (error) {
      log(`名稱驗證測試異常: ${error.message}`, 'error');
      assert(false, '名稱驗證測試不應拋出異常');
    }
  }

  async testCapacityRangeValidation() {
    log('測試容量範圍驗證功能', 'enhancement');
    
    try {
      // 測試最小容量大於最大容量的情況
      const invalidRanges = [
        { min_capacity: 6, max_capacity: 4 },
        { min_capacity: 10, max_capacity: 8 },
        { min_capacity: 5, max_capacity: 2 }
      ];
      
      for (const range of invalidRanges) {
        const validation = await validateTableData(range);
        assert(!validation.isValid, `容量範圍 ${range.min_capacity}-${range.max_capacity} 應驗證失敗`);
        assert(validation.errors.some(error => error.includes('最小容量')), '應包含容量範圍錯誤訊息');
      }
      
      // 測試有效容量範圍
      const validRanges = [
        { min_capacity: 2, max_capacity: 6 },
        { min_capacity: 4, max_capacity: 8 },
        { min_capacity: 1, max_capacity: 10 },
        { min_capacity: 2, max_capacity: null } // 允許最大容量為 null
      ];
      
      for (const range of validRanges) {
        const validation = await validateTableData(range);
        assert(validation.isValid, `容量範圍 ${range.min_capacity}-${range.max_capacity} 應驗證通過`);
      }
      
    } catch (error) {
      log(`容量範圍驗證測試異常: ${error.message}`, 'error');
      assert(false, '容量範圍驗證測試不應拋出異常');
    }
  }
}

// 載入效能測試類別
class LoadingPerformanceTests {
  async runAllTests() {
    log('開始載入效能測試', 'test');
    
    await this.testDetailedLoadQuery();
    await this.testLargeDatasetLoad();
    await this.testConcurrentLoads();
  }

  async testDetailedLoadQuery() {
    log('測試詳細資料載入查詢', 'enhancement');
    
    try {
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from('tables')
        .select(`
          *,
          restaurant_id,
          table_number,
          name,
          capacity,
          min_capacity,
          max_capacity,
          status,
          floor_level,
          zone,
          position_x,
          position_y,
          table_type,
          features,
          qr_enabled,
          ai_assignment_priority,
          ai_features_score,
          cleaning_duration_minutes,
          is_active,
          created_at,
          updated_at,
          metadata
        `)
        .eq('restaurant_id', TEST_RESTAURANT_ID)
        .order('table_number', { ascending: true });
      
      const loadTime = Date.now() - startTime;
      
      assert(error === null, '詳細資料載入不應有錯誤');
      assert(loadTime < 3000, `詳細載入時間應小於3秒 (實際: ${loadTime}ms)`);
      
      if (data) {
        log(`詳細載入 ${data.length} 筆資料耗時: ${loadTime}ms`, 'info');
        
        // 檢查資料完整性
        if (data.length > 0) {
          const sampleTable = data[0];
          const requiredFields = ['id', 'restaurant_id', 'table_number', 'name', 'capacity'];
          
          for (const field of requiredFields) {
            assert(sampleTable[field] !== undefined, `資料應包含 ${field} 欄位`);
          }
        }
      }
      
    } catch (error) {
      log(`詳細資料載入測試異常: ${error.message}`, 'error');
      assert(false, '詳細資料載入測試不應拋出異常');
    }
  }

  async testLargeDatasetLoad() {
    log('測試大量資料載入效能', 'enhancement');
    
    try {
      // 創建多筆測試資料
      const testTables = [];
      const baseTime = Date.now();
      
      for (let i = 0; i < 50; i++) {
        testTables.push({
          restaurant_id: TEST_RESTAURANT_ID,
          table_number: 9000 + i, // 使用高編號避免衝突
          name: `效能測試桌台-${baseTime}-${i}`,
          capacity: Math.floor(Math.random() * 8) + 2,
          status: 'available',
          floor_level: 1,
          zone: `測試區域${Math.floor(i / 10) + 1}`,
          position_x: Math.floor(Math.random() * 100),
          position_y: Math.floor(Math.random() * 100),
          table_type: 'standard',
          qr_enabled: true,
          ai_assignment_priority: Math.floor(Math.random() * 10) + 1,
          cleaning_duration_minutes: 15,
          is_active: true
        });
      }
      
      // 插入測試資料
      const { data: insertedData, error: insertError } = await supabase
        .from('tables')
        .insert(testTables)
        .select();
      
      assert(insertError === null, '大量資料插入不應有錯誤');
      
      if (insertedData && insertedData.length > 0) {
        const tableIds = insertedData.map(table => table.id);
        
        // 測試載入效能
        const startTime = Date.now();
        
        const { data: loadedData, error: loadError } = await supabase
          .from('tables')
          .select('*')
          .eq('restaurant_id', TEST_RESTAURANT_ID)
          .order('table_number');
        
        const loadTime = Date.now() - startTime;
        
        assert(loadError === null, '大量資料載入不應有錯誤');
        assert(loadTime < 5000, `大量資料載入時間應小於5秒 (實際: ${loadTime}ms)`);
        assert(loadedData && loadedData.length >= 50, '應載入至少50筆資料');
        
        log(`載入 ${loadedData?.length} 筆資料耗時: ${loadTime}ms`, 'info');
        
        // 清理測試資料
        await supabase.from('tables').delete().in('id', tableIds);
      }
      
    } catch (error) {
      log(`大量資料載入測試異常: ${error.message}`, 'error');
      assert(false, '大量資料載入測試不應拋出異常');
    }
  }

  async testConcurrentLoads() {
    log('測試並發載入效能', 'enhancement');
    
    try {
      const concurrentCount = 5;
      const startTime = Date.now();
      
      // 同時發出多個載入請求
      const loadPromises = Array.from({ length: concurrentCount }, () =>
        supabase
          .from('tables')
          .select('*')
          .eq('restaurant_id', TEST_RESTAURANT_ID)
          .limit(10)
      );
      
      const results = await Promise.all(loadPromises);
      const loadTime = Date.now() - startTime;
      
      // 檢查所有請求都成功
      const allSuccessful = results.every(result => result.error === null);
      assert(allSuccessful, '所有並發載入請求都應成功');
      
      assert(loadTime < 8000, `並發載入時間應小於8秒 (實際: ${loadTime}ms)`);
      
      log(`${concurrentCount} 個並發請求耗時: ${loadTime}ms`, 'info');
      
    } catch (error) {
      log(`並發載入測試異常: ${error.message}`, 'error');
      assert(false, '並發載入測試不應拋出異常');
    }
  }
}

// 主測試執行器
async function runEnhancedTests() {
  console.log('🚀 開始桌台管理系統功能增強測試');
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  try {
    // 執行增強功能測試
    const validationTests = new EnhancedValidationTests();
    await validationTests.runAllTests();
    
    const performanceTests = new LoadingPerformanceTests();
    await performanceTests.runAllTests();
    
  } catch (error) {
    log(`測試執行異常: ${error.message}`, 'error');
  }
  
  const totalTime = Date.now() - startTime;
  
  // 輸出測試摘要
  console.log('='.repeat(60));
  log('功能增強測試執行完成', 'success');
  console.log(`📊 測試摘要:`);
  console.log(`   總測試數: ${totalTests}`);
  console.log(`   通過數量: ${passedTests}`);
  console.log(`   失敗數量: ${failedTests}`);
  console.log(`   成功率: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%`);
  console.log(`   執行時間: ${totalTime}ms`);
  
  // 輸出詳細結果
  if (testResults.length > 0) {
    console.log('\\n📋 功能增強測試結果:');
    testResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.status === 'PASS' ? '✅' : '❌'} ${result.test}`);
    });
  }
  
  console.log('='.repeat(60));
  
  // 設定進程結束碼
  process.exit(failedTests > 0 ? 1 : 0);
}

// 執行測試
if (require.main === module) {
  runEnhancedTests().catch(error => {
    console.error('功能增強測試執行失敗:', error);
    process.exit(1);
  });
}

module.exports = {
  validateTableData,
  EnhancedValidationTests,
  LoadingPerformanceTests
};
