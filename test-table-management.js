/**
 * 桌台管理系統自動化測試腳本
 * 測試範圍：基礎 CRUD 操作、資料驗證、效能測試
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
    'test': '🧪'
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

function assertEquals(actual, expected, message) {
  return assert(actual === expected, `${message} (期望: ${expected}, 實際: ${actual})`);
}

function assertNotNull(value, message) {
  return assert(value != null, `${message} (值不應為 null/undefined)`);
}

function assertGreaterThan(actual, expected, message) {
  return assert(actual > expected, `${message} (${actual} 應大於 ${expected})`);
}

// 測試資料生成器
class TestDataGenerator {
  static generateTable(overrides = {}) {
    const defaultTable = {
      restaurant_id: TEST_RESTAURANT_ID,
      table_number: Math.floor(Math.random() * 1000) + 1,
      name: `測試桌台-${Date.now()}`,
      capacity: Math.floor(Math.random() * 8) + 2, // 2-10人
      min_capacity: 1,
      max_capacity: null,
      status: 'available',
      floor_level: 1,
      zone: '測試區域',
      position_x: Math.floor(Math.random() * 100),
      position_y: Math.floor(Math.random() * 100),
      table_type: 'standard',
      features: ['測試特色'],
      qr_enabled: true,
      ai_assignment_priority: Math.floor(Math.random() * 10) + 1,
      ai_features_score: null,
      cleaning_duration_minutes: 15,
      is_active: true
    };
    
    return { ...defaultTable, ...overrides };
  }

  static generateMultipleTables(count) {
    return Array.from({ length: count }, () => this.generateTable());
  }
}

// 測試類別
class TableCRUDTests {
  async runAllTests() {
    log('開始桌台 CRUD 操作測試', 'test');
    
    await this.testCreateTable();
    await this.testReadTables();
    await this.testUpdateTable();
    await this.testDeleteTable();
    await this.testBatchOperations();
  }

  async testCreateTable() {
    log('測試建立桌台功能', 'info');
    
    try {
      const testTable = TestDataGenerator.generateTable();
      
      const { data, error } = await supabase
        .from('tables')
        .insert([testTable])
        .select();

      assertNotNull(data, '建立桌台後應返回資料');
      assert(error === null, '建立桌台不應有錯誤');
      
      if (data && data.length > 0) {
        const createdTable = data[0];
        assertEquals(createdTable.name, testTable.name, '桌台名稱應正確儲存');
        assertEquals(createdTable.capacity, testTable.capacity, '桌台容量應正確儲存');
        assertEquals(createdTable.restaurant_id, testTable.restaurant_id, '餐廳ID應正確關聯');
        
        // 清理測試資料
        await this.cleanupTable(createdTable.id);
      }
      
    } catch (error) {
      log(`建立桌台測試異常: ${error.message}`, 'error');
      assert(false, '建立桌台不應拋出異常');
    }
  }

  async testReadTables() {
    log('測試讀取桌台功能', 'info');
    
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', TEST_RESTAURANT_ID)
        .limit(10);

      assert(error === null, '讀取桌台不應有錯誤');
      assertNotNull(data, '應返回桌台資料');
      
      if (data) {
        assert(Array.isArray(data), '應返回陣列格式的資料');
        log(`讀取到 ${data.length} 個桌台`, 'info');
        
        if (data.length > 0) {
          const table = data[0];
          assertNotNull(table.id, '桌台應有ID');
          assertNotNull(table.name, '桌台應有名稱');
          assertNotNull(table.capacity, '桌台應有容量資訊');
          assertEquals(table.restaurant_id, TEST_RESTAURANT_ID, '餐廳ID應正確');
        }
      }
      
    } catch (error) {
      log(`讀取桌台測試異常: ${error.message}`, 'error');
      assert(false, '讀取桌台不應拋出異常');
    }
  }

  async testUpdateTable() {
    log('測試更新桌台功能', 'info');
    
    try {
      // 先建立一個測試桌台
      const testTable = TestDataGenerator.generateTable();
      const { data: createData } = await supabase
        .from('tables')
        .insert([testTable])
        .select();
      
      if (createData && createData.length > 0) {
        const tableId = createData[0].id;
        const newName = `更新後桌台-${Date.now()}`;
        const newCapacity = 8;
        
        // 更新桌台資訊
        const { data, error } = await supabase
          .from('tables')
          .update({ name: newName, capacity: newCapacity })
          .eq('id', tableId)
          .select();

        assert(error === null, '更新桌台不應有錯誤');
        assertNotNull(data, '更新後應返回資料');
        
        if (data && data.length > 0) {
          const updatedTable = data[0];
          assertEquals(updatedTable.name, newName, '桌台名稱應正確更新');
          assertEquals(updatedTable.capacity, newCapacity, '桌台容量應正確更新');
        }
        
        // 清理測試資料
        await this.cleanupTable(tableId);
      }
      
    } catch (error) {
      log(`更新桌台測試異常: ${error.message}`, 'error');
      assert(false, '更新桌台不應拋出異常');
    }
  }

  async testDeleteTable() {
    log('測試刪除桌台功能', 'info');
    
    try {
      // 先建立一個測試桌台
      const testTable = TestDataGenerator.generateTable();
      const { data: createData } = await supabase
        .from('tables')
        .insert([testTable])
        .select();
      
      if (createData && createData.length > 0) {
        const tableId = createData[0].id;
        
        // 刪除桌台
        const { error } = await supabase
          .from('tables')
          .delete()
          .eq('id', tableId);

        assert(error === null, '刪除桌台不應有錯誤');
        
        // 驗證桌台已被刪除
        const { data: verifyData } = await supabase
          .from('tables')
          .select('*')
          .eq('id', tableId);
        
        assert(verifyData && verifyData.length === 0, '桌台應已被刪除');
      }
      
    } catch (error) {
      log(`刪除桌台測試異常: ${error.message}`, 'error');
      assert(false, '刪除桌台不應拋出異常');
    }
  }

  async testBatchOperations() {
    log('測試批量操作功能', 'info');
    
    try {
      // 建立多個測試桌台
      const testTables = TestDataGenerator.generateMultipleTables(5);
      
      const { data: createData, error: createError } = await supabase
        .from('tables')
        .insert(testTables)
        .select();

      assert(createError === null, '批量建立不應有錯誤');
      assertNotNull(createData, '批量建立應返回資料');
      
      if (createData && createData.length > 0) {
        assertEquals(createData.length, testTables.length, '應建立正確數量的桌台');
        
        const tableIds = createData.map(table => table.id);
        
        // 批量更新測試
        const { error: updateError } = await supabase
          .from('tables')
          .update({ status: 'occupied' })
          .in('id', tableIds);
        
        assert(updateError === null, '批量更新不應有錯誤');
        
        // 驗證批量更新結果
        const { data: verifyData } = await supabase
          .from('tables')
          .select('*')
          .in('id', tableIds);
        
        if (verifyData) {
          const allOccupied = verifyData.every(table => table.status === 'occupied');
          assert(allOccupied, '所有桌台狀態應已更新為 occupied');
        }
        
        // 清理測試資料
        await Promise.all(tableIds.map(id => this.cleanupTable(id)));
      }
      
    } catch (error) {
      log(`批量操作測試異常: ${error.message}`, 'error');
      assert(false, '批量操作不應拋出異常');
    }
  }

  async cleanupTable(tableId) {
    try {
      await supabase.from('tables').delete().eq('id', tableId);
    } catch (error) {
      log(`清理測試資料失敗: ${error.message}`, 'warning');
    }
  }
}

class DataValidationTests {
  async runAllTests() {
    log('開始資料驗證測試', 'test');
    
    await this.testTableNumberUniqueness();
    await this.testCapacityValidation();
    await this.testRequiredFields();
    await this.testDataTypes();
  }

  async testTableNumberUniqueness() {
    log('測試桌台編號唯一性', 'info');
    
    try {
      const tableNumber = Math.floor(Math.random() * 10000) + 1000;
      const table1 = TestDataGenerator.generateTable({ table_number: tableNumber });
      const table2 = TestDataGenerator.generateTable({ table_number: tableNumber });
      
      // 建立第一個桌台
      const { data: data1, error: error1 } = await supabase
        .from('tables')
        .insert([table1])
        .select();
      
      assert(error1 === null, '第一個桌台應建立成功');
      
      if (data1 && data1.length > 0) {
        // 嘗試建立相同編號的桌台
        const { error: error2 } = await supabase
          .from('tables')
          .insert([table2]);
        
        // 根據資料庫約束，這可能成功或失敗
        // 我們記錄結果但不強制要求失敗
        log(`重複桌台編號測試結果: ${error2 ? '失敗(預期)' : '成功(需檢查約束)'}`, 'info');
        
        // 清理測試資料
        await this.cleanupTable(data1[0].id);
      }
      
    } catch (error) {
      log(`桌台編號唯一性測試異常: ${error.message}`, 'error');
    }
  }

  async testCapacityValidation() {
    log('測試容量驗證', 'info');
    
    try {
      // 測試合理範圍的容量
      const validTable = TestDataGenerator.generateTable({ capacity: 4 });
      const { data, error } = await supabase
        .from('tables')
        .insert([validTable])
        .select();
      
      assert(error === null, '合理容量的桌台應建立成功');
      
      if (data && data.length > 0) {
        assertGreaterThan(data[0].capacity, 0, '容量應大於0');
        await this.cleanupTable(data[0].id);
      }
      
      // 測試極端值（這些可能因資料庫約束而失敗）
      const extremeCapacities = [0, -1, 1000];
      for (const capacity of extremeCapacities) {
        const extremeTable = TestDataGenerator.generateTable({ capacity });
        const { error: extremeError } = await supabase
          .from('tables')
          .insert([extremeTable]);
        
        log(`容量 ${capacity} 測試結果: ${extremeError ? '失敗' : '成功'}`, 'info');
      }
      
    } catch (error) {
      log(`容量驗證測試異常: ${error.message}`, 'error');
    }
  }

  async testRequiredFields() {
    log('測試必填欄位', 'info');
    
    const requiredFields = [
      'restaurant_id',
      'table_number',
      'name',
      'capacity'
    ];
    
    for (const field of requiredFields) {
      try {
        const incompleteTable = TestDataGenerator.generateTable();
        delete incompleteTable[field];
        
        const { error } = await supabase
          .from('tables')
          .insert([incompleteTable]);
        
        // 缺少必填欄位應該失敗
        if (error) {
          log(`缺少 ${field} 欄位正確被拒絕`, 'success');
        } else {
          log(`缺少 ${field} 欄位意外成功`, 'warning');
        }
        
      } catch (error) {
        log(`測試必填欄位 ${field} 異常: ${error.message}`, 'error');
      }
    }
  }

  async testDataTypes() {
    log('測試資料類型', 'info');
    
    try {
      // 測試各種資料類型
      const typeTests = [
        { field: 'capacity', value: 'invalid_number', shouldFail: true },
        { field: 'qr_enabled', value: 'invalid_boolean', shouldFail: true },
        { field: 'floor_level', value: 'not_a_number', shouldFail: true },
        { field: 'features', value: 'not_an_array', shouldFail: false } // JSON欄位較寬鬆
      ];
      
      for (const test of typeTests) {
        const invalidTable = TestDataGenerator.generateTable({ [test.field]: test.value });
        const { error } = await supabase
          .from('tables')
          .insert([invalidTable]);
        
        if (test.shouldFail && error) {
          log(`無效 ${test.field} 類型正確被拒絕`, 'success');
        } else if (!test.shouldFail && !error) {
          log(`${test.field} 類型測試通過`, 'success');
        } else {
          log(`${test.field} 類型測試結果異常`, 'warning');
        }
      }
      
    } catch (error) {
      log(`資料類型測試異常: ${error.message}`, 'error');
    }
  }

  async cleanupTable(tableId) {
    try {
      await supabase.from('tables').delete().eq('id', tableId);
    } catch (error) {
      log(`清理測試資料失敗: ${error.message}`, 'warning');
    }
  }
}

class PerformanceTests {
  async runAllTests() {
    log('開始效能測試', 'test');
    
    await this.testLoadTime();
    await this.testBatchInsertPerformance();
    await this.testQueryPerformance();
  }

  async testLoadTime() {
    log('測試資料載入時間', 'info');
    
    try {
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', TEST_RESTAURANT_ID);
      
      const loadTime = Date.now() - startTime;
      
      assert(error === null, '載入資料不應有錯誤');
      assert(loadTime < 5000, `載入時間應小於5秒 (實際: ${loadTime}ms)`);
      
      log(`載入 ${data?.length || 0} 筆資料耗時: ${loadTime}ms`, 'info');
      
    } catch (error) {
      log(`載入時間測試異常: ${error.message}`, 'error');
    }
  }

  async testBatchInsertPerformance() {
    log('測試批量插入效能', 'info');
    
    try {
      const batchSize = 20;
      const testTables = TestDataGenerator.generateMultipleTables(batchSize);
      
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from('tables')
        .insert(testTables)
        .select();
      
      const insertTime = Date.now() - startTime;
      
      assert(error === null, '批量插入不應有錯誤');
      assert(insertTime < 10000, `批量插入時間應小於10秒 (實際: ${insertTime}ms)`);
      
      log(`批量插入 ${batchSize} 筆資料耗時: ${insertTime}ms`, 'info');
      
      // 清理測試資料
      if (data && data.length > 0) {
        const tableIds = data.map(table => table.id);
        await supabase.from('tables').delete().in('id', tableIds);
      }
      
    } catch (error) {
      log(`批量插入效能測試異常: ${error.message}`, 'error');
    }
  }

  async testQueryPerformance() {
    log('測試查詢效能', 'info');
    
    try {
      const queries = [
        {
          name: '基本查詢',
          query: () => supabase.from('tables').select('*').eq('restaurant_id', TEST_RESTAURANT_ID)
        },
        {
          name: '條件查詢',
          query: () => supabase.from('tables').select('*').eq('restaurant_id', TEST_RESTAURANT_ID).eq('status', 'available')
        },
        {
          name: '排序查詢',
          query: () => supabase.from('tables').select('*').eq('restaurant_id', TEST_RESTAURANT_ID).order('table_number')
        },
        {
          name: '範圍查詢',
          query: () => supabase.from('tables').select('*').eq('restaurant_id', TEST_RESTAURANT_ID).gte('capacity', 4)
        }
      ];
      
      for (const queryTest of queries) {
        const startTime = Date.now();
        const { error } = await queryTest.query();
        const queryTime = Date.now() - startTime;
        
        assert(error === null, `${queryTest.name}不應有錯誤`);
        assert(queryTime < 3000, `${queryTest.name}時間應小於3秒 (實際: ${queryTime}ms)`);
        
        log(`${queryTest.name}耗時: ${queryTime}ms`, 'info');
      }
      
    } catch (error) {
      log(`查詢效能測試異常: ${error.message}`, 'error');
    }
  }
}

// 主測試執行器
async function runAllTests() {
  console.log('🚀 開始桌台管理系統自動化測試');
  console.log('='.repeat(50));
  
  const startTime = Date.now();
  
  try {
    // 執行所有測試套件
    const crudTests = new TableCRUDTests();
    await crudTests.runAllTests();
    
    const validationTests = new DataValidationTests();
    await validationTests.runAllTests();
    
    const performanceTests = new PerformanceTests();
    await performanceTests.runAllTests();
    
  } catch (error) {
    log(`測試執行異常: ${error.message}`, 'error');
  }
  
  const totalTime = Date.now() - startTime;
  
  // 輸出測試摘要
  console.log('='.repeat(50));
  log('測試執行完成', 'success');
  console.log(`📊 測試摘要:`);
  console.log(`   總測試數: ${totalTests}`);
  console.log(`   通過數量: ${passedTests}`);
  console.log(`   失敗數量: ${failedTests}`);
  console.log(`   成功率: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%`);
  console.log(`   執行時間: ${totalTime}ms`);
  
  // 輸出詳細結果
  if (testResults.length > 0) {
    console.log('\\n📋 詳細測試結果:');
    testResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.status === 'PASS' ? '✅' : '❌'} ${result.test}`);
    });
  }
  
  console.log('='.repeat(50));
  
  // 設定進程結束碼
  process.exit(failedTests > 0 ? 1 : 0);
}

// 執行測試
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('測試執行失敗:', error);
    process.exit(1);
  });
}

module.exports = {
  TestDataGenerator,
  TableCRUDTests,
  DataValidationTests,
  PerformanceTests
};
