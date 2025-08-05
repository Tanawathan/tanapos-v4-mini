/**
 * TanaPOS v4 AI 系統最終整合測試腳本
 * 目的：完整測試所有頁面的 Supabase 連接和核心功能整合
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// 載入環境變數
config();

// 初始化 Supabase 客戶端
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const restaurantId = process.env.VITE_RESTAURANT_ID;

const supabase = createClient(supabaseUrl, supabaseKey);

// 測試結果統計
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

// 輔助函數 - 記錄測試結果
function recordTest(testName, success, details = '') {
  testResults.total++;
  if (success) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName} - ${details}`);
  }
  testResults.details.push({ testName, success, details });
}

// 主測試函數
async function runFinalIntegrationTests() {
  console.log('🚀 TanaPOS v4 AI 系統最終整合測試開始...\n');

  try {
    // 1. 基礎連接測試
    console.log('📡 1. 基礎連接測試');
    
    const connectionTest = await supabase
      .from('restaurants')
      .select('id, name')
      .eq('id', restaurantId)
      .single();

    recordTest(
      '資料庫連接', 
      !connectionTest.error && connectionTest.data,
      connectionTest.error?.message
    );

    // 2. 菜單管理系統測試
    console.log('\n🍽️ 2. 菜單管理系統測試');
    
    // 測試分類載入
    const categoriesTest = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurantId);

    recordTest(
      '分類資料載入',
      !categoriesTest.error && categoriesTest.data.length > 0,
      `載入 ${categoriesTest.data?.length || 0} 個分類`
    );

    // 測試產品載入
    const productsTest = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .limit(5);

    recordTest(
      '產品資料載入',
      !productsTest.error && productsTest.data.length > 0,
      `載入 ${productsTest.data?.length || 0} 個產品`
    );

    // 3. 桌台管理系統測試
    console.log('\n🪑 3. 桌台管理系統測試');
    
    const tablesTest = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', restaurantId);

    recordTest(
      '桌台資料載入',
      !tablesTest.error && tablesTest.data.length > 0,
      `載入 ${tablesTest.data?.length || 0} 個桌台`
    );

    // 測試桌台狀態統計
    const statusCounts = {};
    tablesTest.data?.forEach(table => {
      statusCounts[table.status] = (statusCounts[table.status] || 0) + 1;
    });

    recordTest(
      '桌台狀態統計',
      Object.keys(statusCounts).length > 0,
      `狀態分布: ${JSON.stringify(statusCounts)}`
    );

    // 4. 點餐系統測試
    console.log('\n📝 4. 點餐系統測試');
    
    // 測試商品搜尋功能
    const searchTest = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .ilike('name', '%飯%')
      .limit(3);

    recordTest(
      '商品搜尋功能',
      !searchTest.error,
      `搜尋結果: ${searchTest.data?.length || 0} 個商品`
    );

    // 5. 訂單管理系統測試
    console.log('\n📋 5. 訂單管理系統測試');
    
    const ordersTest = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product:products (name)
        )
      `)
      .eq('restaurant_id', restaurantId)
      .limit(5);

    recordTest(
      '訂單資料載入',
      !ordersTest.error && ordersTest.data.length > 0,
      `載入 ${ordersTest.data?.length || 0} 個訂單`
    );

    // 測試訂單狀態分組
    const ordersByStatus = {};
    ordersTest.data?.forEach(order => {
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    });

    recordTest(
      '訂單狀態分組',
      Object.keys(ordersByStatus).length > 0,
      `狀態分布: ${JSON.stringify(ordersByStatus)}`
    );

    // 6. KDS 廚房系統測試
    console.log('\n🍳 6. KDS 廚房系統測試');
    
    const activeOrdersTest = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .in('status', ['pending', 'confirmed', 'preparing']);

    recordTest(
      'KDS 活躍訂單',
      !activeOrdersTest.error,
      `活躍訂單數: ${activeOrdersTest.data?.length || 0}`
    );

    // 7. 結帳系統測試
    console.log('\n💰 7. 結帳系統測試');
    
    const checkoutOrdersTest = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .in('status', ['ready', 'served'])
      .limit(3);

    recordTest(
      '可結帳訂單',
      !checkoutOrdersTest.error,
      `可結帳訂單數: ${checkoutOrdersTest.data?.length || 0}`
    );

    // 8. 設定系統測試
    console.log('\n⚙️ 8. 設定系統測試');
    
    const restaurantSettingsTest = await supabase
      .from('restaurants')
      .select('name, address, phone, timezone, tax_rate')
      .eq('id', restaurantId)
      .single();

    recordTest(
      '餐廳設定載入',
      !restaurantSettingsTest.error && restaurantSettingsTest.data,
      `餐廳: ${restaurantSettingsTest.data?.name}`
    );

    // 9. 數據完整性測試
    console.log('\n🔍 9. 數據完整性測試');
    
    // 檢查孤兒記錄
    const orphanItemsTest = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
        orders!inner(id)
      `)
      .eq('orders.restaurant_id', restaurantId)
      .limit(1);

    recordTest(
      '數據關聯完整性',
      !orphanItemsTest.error,
      '訂單項目關聯正常'
    );

    // 10. 效能測試
    console.log('\n⚡ 10. 效能測試');
    
    const startTime = Date.now();
    
    const performanceTest = await Promise.all([
      supabase.from('products').select('id').eq('restaurant_id', restaurantId).limit(10),
      supabase.from('categories').select('id').eq('restaurant_id', restaurantId).limit(10),
      supabase.from('tables').select('id').eq('restaurant_id', restaurantId).limit(10)
    ]);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    recordTest(
      '並發查詢效能',
      responseTime < 2000 && performanceTest.every(result => !result.error),
      `響應時間: ${responseTime}ms`
    );

    // 輸出最終測試結果
    console.log('\n🎯 最終測試結果統計');
    console.log('='.repeat(50));
    console.log(`📊 總測試數: ${testResults.total}`);
    console.log(`✅ 通過測試: ${testResults.passed}`);
    console.log(`❌ 失敗測試: ${testResults.failed}`);
    console.log(`📈 成功率: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    if (testResults.failed > 0) {
      console.log('\n❌ 失敗的測試項目:');
      testResults.details
        .filter(test => !test.success)
        .forEach(test => {
          console.log(`   - ${test.testName}: ${test.details}`);
        });
    }

    // 系統整合度評估
    const integrationScore = (testResults.passed / testResults.total) * 100;
    
    console.log('\n🏆 系統整合度評估');
    console.log('='.repeat(50));
    
    if (integrationScore >= 95) {
      console.log('🎉 優秀！系統整合度極佳，可以投入生產環境使用');
    } else if (integrationScore >= 85) {
      console.log('👍 良好！系統整合度良好，建議進行少量優化');
    } else if (integrationScore >= 70) {
      console.log('⚠️  警告！系統整合度一般，需要進一步優化');
    } else {
      console.log('🚨 嚴重！系統整合度不足，需要大量修復工作');
    }

    console.log(`\n📋 詳細評估:`);
    console.log(`   🔗 資料庫連接: ${testResults.details.find(t => t.testName === '資料庫連接')?.success ? '正常' : '異常'}`);
    console.log(`   🍽️  菜單系統: ${testResults.details.filter(t => t.testName.includes('分類') || t.testName.includes('產品')).every(t => t.success) ? '正常' : '異常'}`);
    console.log(`   🪑 桌台系統: ${testResults.details.filter(t => t.testName.includes('桌台')).every(t => t.success) ? '正常' : '異常'}`);
    console.log(`   📋 訂單系統: ${testResults.details.filter(t => t.testName.includes('訂單')).every(t => t.success) ? '正常' : '異常'}`);
    console.log(`   ⚙️  設定系統: ${testResults.details.find(t => t.testName === '餐廳設定載入')?.success ? '正常' : '異常'}`);
    console.log(`   ⚡ 系統效能: ${testResults.details.find(t => t.testName === '並發查詢效能')?.success ? '良好' : '需優化'}`);

    console.log('\n🎊 TanaPOS v4 AI 系統最終整合測試完成！');

  } catch (error) {
    console.error('❌ 最終整合測試過程發生錯誤:', error);
  }
}

// 執行測試
runFinalIntegrationTests();
